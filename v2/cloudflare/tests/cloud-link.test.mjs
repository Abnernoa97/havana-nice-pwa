import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudLinkStatus,handleCloudLinkAdmin,requestExistingCloud} from '../src/cloud-link.js';

const uuid='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const expires=Math.floor(Date.now()/1000)+86400*200;
const deviceToken='d1.'+expires+'.'+uuid+'.'+'a'.repeat(43);
const adminToken='X'.repeat(43);
const respond=(body,status)=>Response.json(body,{status:status||200});
const api='https://v2.internal/api/chat/admin/cloud/';
const req=(route,method='GET',body=null,token=adminToken)=>new Request(api+route,{
 method,headers:{Authorization:'Bearer '+token,...(body?{'content-type':'application/json'}:{})},
 body:body&&method!=='GET'&&method!=='HEAD'?JSON.stringify(body):undefined
});
function setup({bound=true,flag='enabled',passwordOk=true}={}){
 let rows=null,upstreamCalls=[],adminSessions=0;
 const env={
  V2_CLOUD_LINK_ENABLED:flag,V2_ADMIN_LOGIN_MODE:'enabled',
  V2_ADMIN_LOGIN_SECRET:'admin-secret-'.repeat(5),
  DB:{prepare(sql){return {
   async first(){
    if(sql.includes('FROM chat_cloud_link'))return rows?{...rows}:null;
    throw Error('Unexpected direct SELECT '+sql);
   },
   bind(...args){return {
   async first(){
    if(sql.includes('FROM chat_admin_sessions')){adminSessions++;return{expires_at:Date.now()+200000,revoked_at:null};}
    if(sql.includes('FROM chat_cloud_link'))return rows?{...rows}:null;
    throw Error('Unexpected SELECT '+sql);
   },
   async run(){
    if(sql.startsWith('INSERT INTO chat_cloud_link')){
     rows={encrypted_token:args[0],iv:args[1],expires_at:args[2],updated_at:args[3]};
    }else if(sql.startsWith('DELETE FROM chat_cloud_link'))rows=null;
    else throw Error('Unexpected write '+sql);
    return{meta:{changes:1}};
   }
  };}}}},
 };
 if(bound)env.HAVANA_CLOUD_BRIDGE={async fetch(u,o){
  const url=new URL(u);
  upstreamCalls.push({path:url.pathname,method:o?.method,header:new Headers(o?.headers||{}),body:o?.body});
  if(url.pathname==='/api/auth/login')return Response.json(
    passwordOk?{deviceToken}:{error:'invalid_password'},{status:passwordOk?200:401}
  );
  if(url.pathname==='/api/auth/device')return new Response(JSON.stringify({deviceToken}),{
    status:200,headers:{'content-type':'application/json',
      'set-cookie':'hn_cloud_session=v1.session.signature; Path=/; HttpOnly; Secure; SameSite=Lax'}
  });
  if(url.pathname==='/api/google/upload/session')return Response.json({uploadKey:'abc'});
  throw Error('Unexpected Cloud API path '+url.pathname);
 }};
 return {env,getRow:()=>rows,upstreamCalls,getAdminSessions:()=>adminSessions};
}
test('A musician cannot pair, inspect or disconnect the owner storage',async()=>{
 const {env,upstreamCalls}=setup();
 for(const route of ['connect','disconnect','status']){
  const r=await handleCloudLinkAdmin(req(route,route==='status'?'GET':'POST',{password:'secret'},'invalid-musician'),
   env,new URL(api+route),'',respond);
  assert.equal(r.status,401);
 }
 assert.equal(upstreamCalls.length,0);
});
test('Default-off and absent binding never contact CLOUD or persist credentials',async()=>{
 for(const opts of [{flag:'disabled'},{bound:false}]){
  const {env,upstreamCalls,getRow}=setup(opts);
  assert.deepEqual(await cloudLinkStatus(env),{available:false,linked:false});
  const r=await handleCloudLinkAdmin(req('connect','POST',{password:'secret'}),
   env,new URL(api+'connect'),'',respond);
  assert.equal(r.status,503);assert.equal(upstreamCalls.length,0);assert.equal(getRow(),null);
 }
});
test('Administrator connects with a one-time password; only ciphertext persists',async()=>{
 const {env,getRow,upstreamCalls}=setup();
 const connect=await handleCloudLinkAdmin(req('connect','POST',{password:'owner-password'}),
   env,new URL(api+'connect'),'',respond);
 assert.equal(connect.status,200);
 const body=await connect.text();
 assert.deepEqual(JSON.parse(body),{ok:true,linked:true});
 assert.equal(body.includes(deviceToken),false);
 assert.equal(getRow().encrypted_token.includes(deviceToken),false);
 assert.ok(getRow().encrypted_token.length>50);
 assert.ok(upstreamCalls.some(x=>x.path==='/api/auth/login'));
 assert.deepEqual(await cloudLinkStatus(env),{available:true,linked:true});
 const status=await handleCloudLinkAdmin(req('status'),env,new URL(api+'status'),'',respond);
 const data=await status.text();
 assert.deepEqual(JSON.parse(data),{available:true,linked:true});
 assert.equal(data.includes('owner-password'),false);
 assert.equal(data.includes(deviceToken),false);
 const res=await requestExistingCloud(env,'/api/google/upload/session',{
  method:'POST',headers:{'content-type':'application/json'},body:'{"name":"test.jpg"}'
 });
 assert.equal(res.status,200);
 const call=upstreamCalls.find(x=>x.path==='/api/google/upload/session');
 assert.match(call.header.get('cookie'),/^hn_cloud_session=/);
 assert.equal(call.header.has('authorization'),false);
 await assert.rejects(requestExistingCloud(env,'/api/media/all'),/cloud_path_not_allowed/);
 await assert.rejects(requestExistingCloud(env,'/api/auth/logout'),/cloud_path_not_allowed/);
 const disconnect=await handleCloudLinkAdmin(req('disconnect','POST'),env,new URL(api+'disconnect'),'',respond);
 assert.equal(disconnect.status,200);
 assert.equal(getRow(),null);
 await assert.rejects(requestExistingCloud(env,'/api/google/upload/session'),/cloud_not_linked/);
});
test('Failed owner login does not write a credential or return a cookie',async()=>{
 const {env,getRow}=setup({passwordOk:false});
 const r=await handleCloudLinkAdmin(req('connect','POST',{password:'invalid'}),
  env,new URL(api+'connect'),'',respond);
 assert.equal(r.status,401);assert.equal(getRow(),null);
 assert.equal(JSON.stringify(await r.json()).includes('deviceToken'),false);
});
