import test from 'node:test';
import assert from 'node:assert/strict';
import {adminLoginConfigured,handleAdminSessionApi,verifyAdminSession} from '../src/admin-auth.js';

const adminPassword='secure-admin-test-'+ 'Z'.repeat(48);
const endpoint='https://havana-nice-v2-dev.soloaplicaciones97.workers.dev';
class FakeD1 {
 constructor(){this.sessions=new Map();this.attempts=new Map();}
 prepare(sql){
  return {bind:(...args)=>({first:async()=>this.first(sql,args),run:async()=>this.run(sql,args)})};
 }
 async first(sql,p){
  if(sql.startsWith('SELECT failures,window_start')) return this.attempts.get(p[0])||null;
  if(sql.startsWith('SELECT expires_at,revoked_at'))return this.sessions.get(p[0])||null;
  throw Error('Unexpected read '+sql);
 }
 async run(sql,p){
  if(sql.startsWith('INSERT INTO chat_admin_login_limits')){
    const old=this.attempts.get(p[0]);
    const fresh=!old||old.window_start<p[2];
    this.attempts.set(p[0],{window_start:fresh?p[1]:old.window_start,failures:fresh?1:old.failures+1});
    return {meta:{changes:1}};
  }
  if(sql.startsWith('DELETE FROM chat_admin_login_limits')){
    this.attempts.delete(p[0]);return {meta:{changes:1}};
  }
  if(sql.startsWith('INSERT INTO chat_admin_sessions')){
    this.sessions.set(p[0],{expires_at:p[2],revoked_at:null});
    return {meta:{changes:1}};
  }
  if(sql.startsWith('UPDATE chat_admin_sessions')){
    const row=this.sessions.get(p[1]);if(row)row.revoked_at=p[0];
    return {meta:{changes:row?1:0}};
  }
  throw Error('Unexpected write '+sql);
 }
}
const env=()=>({V2_ADMIN_LOGIN_MODE:'enabled',V2_ADMIN_LOGIN_SECRET:adminPassword,DB:new FakeD1()});
const request=(method,path,body,token,ip='198.51.100.3')=>{
 const headers={'content-type':'application/json','cf-connecting-ip':ip};
 if(token)headers.authorization='Bearer '+token;
 return new Request(endpoint+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
};
async function fetchAdmin(env,method='GET',path='/api/chat/admin/auth/status',body,token,ip){
 const req=request(method,path,body,token,ip);
 const res=await handleAdminSessionApi(req,env,new URL(req.url),'',(value,status=200)=>new Response(JSON.stringify(value),{status}));
 return {status:res.status,data:await res.json()};
}

test('no administrator auth without explicit flag and a high entropy secret',async()=>{
 const e=env();delete e.V2_ADMIN_LOGIN_MODE;
 assert.equal(adminLoginConfigured(e),false);
 assert.deepEqual(await fetchAdmin(e),{status:200,data:{enabled:false}});
 const attempt=await fetchAdmin(e,'POST','/api/chat/admin/auth/session',{password:adminPassword});
 assert.equal(attempt.status,503);
 assert.equal(e.DB.sessions.size,0);
});
test('a musician name or token is not an administrator credential',async()=>{
 const e=env();
 assert.equal(await verifyAdminSession(request('GET','/x',undefined,'member:noa'),e),false);
 const bad=await fetchAdmin(e,'POST','/api/chat/admin/auth/session',{password:'Noa'});
 assert.equal(bad.status,401);
 assert.equal(e.DB.sessions.size,0);
});
test('authentication creates an expiring D1-backed admin token, revocable by logout',async()=>{
 const e=env();
 assert.equal((await fetchAdmin(e)).data.enabled,true);
 const signed=await fetchAdmin(e,'POST','/api/chat/admin/auth/session',{password:adminPassword});
 assert.equal(signed.status,200);
 assert.equal(signed.data.role,'chat-admin');
 assert.ok(signed.data.token.length>=40);
 assert.notEqual(signed.data.token,adminPassword);
 assert.equal(e.DB.sessions.size,1);
 assert.ok(![...e.DB.sessions.keys()].includes(signed.data.token),'Only hashed tokens live in DB');
 const token=signed.data.token;
 assert.equal(await verifyAdminSession(request('GET','/x',undefined,token),e),true);
 assert.equal((await fetchAdmin(e,'GET','/api/chat/admin/auth/session',undefined,token)).status,200);
 assert.equal((await fetchAdmin(e,'DELETE','/api/chat/admin/auth/session',undefined,token)).status,200);
 assert.equal(await verifyAdminSession(request('GET','/x',undefined,token),e),false);
 assert.equal((await fetchAdmin(e,'GET','/api/chat/admin/auth/session',undefined,token)).status,401);
});
test('five incorrect logins limit a single device but do not block another IP',async()=>{
 const e=env();
 for(let i=0;i<5;i++){
  const r=await fetchAdmin(e,'POST','/api/chat/admin/auth/session',{password:'incorrect'},
   undefined,'203.0.113.5');
  assert.equal(r.status,401);
 }
 const locked=await fetchAdmin(e,'POST','/api/chat/admin/auth/session',{password:adminPassword},
   undefined,'203.0.113.5');
 assert.equal(locked.status,429);
 const different=await fetchAdmin(e,'POST','/api/chat/admin/auth/session',{password:adminPassword},
   undefined,'203.0.113.8');
 assert.equal(different.status,200);
});
