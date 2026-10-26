import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adminConfigured, deviceGateEnabled, handleDeviceApprovalApi,
  tokenDigest, verifyAdminRequest,
} from '../src/device-approval.js';

const adminKey='V2admin_'+ 'k'.repeat(60);
const api='https://havana-nice-v2-dev.soloaplicaciones97.workers.dev';
function reply(data,status=200) {
  return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
}
function call(method,path,data,auth='',origin='') {
  const headers={'content-type':'application/json'};
  if(auth)headers.authorization='Bearer '+auth;
  if(origin)headers.origin=origin;
  return new Request(api+path,{method,headers,body:data===undefined?undefined:JSON.stringify(data)});
}
class FakeDb {
  constructor() {this.requests=new Map();this.sessions=[];this.actors=new Map([['noa',{actor_id:'member:noa',display_name:'Noa',active:1}]]);}
  prepare(sql) {
    return {bind:(...params)=>({
      first:async()=>this.first(sql,params),
      all:async()=>this.all(sql,params),
      run:async()=>this.run(sql,params),
      sql,params,
    })};
  }
  async first(sql,p) {
    if(sql.startsWith('SELECT actor_id,display_name FROM chat_members'))return this.actors.get(p[0])||null;
    if(sql.startsWith('SELECT active FROM chat_members'))return [...this.actors.values()].find(x=>x.actor_id===p[0])||null;
    if(sql.startsWith('SELECT COUNT(*) AS total')) {
      const rows=[...this.requests.values()].filter(x=>x.actor_id===p[1]&&x.created_at>p[2]);
      return {total:rows.length,pending:rows.filter(x=>x.status==='pending'&&x.expires_at>p[0]).length};
    }
    if(sql.startsWith('SELECT request_id,status,actor_id,expires_at'))return this.requests.get(p[0])||null;
    if(sql.startsWith('SELECT status,expires_at,redeemed_at')) {
      const r=this.requests.get(p[0]);return r&&r.request_secret_hash===p[1]?r:null;
    }
    throw Error('Unexpected query: '+sql);
  }
  async all(sql) {
    if(sql.startsWith('SELECT request_id,actor_id'))return {results:[...this.requests.values()]};
    throw Error('Unexpected all query: '+sql);
  }
  async run(sql,p) {
    if(sql.startsWith('INSERT INTO chat_device_requests')) {
      this.requests.set(p[0],{request_id:p[0],request_secret_hash:p[1],actor_id:p[2],display_name:p[3],
        device_label:p[4],status:'pending',created_at:p[5],expires_at:p[6],redeemed_at:null});
      return {meta:{changes:1}};
    }
    if(sql.startsWith('UPDATE chat_device_requests SET status=')) {
      const row=this.requests.get(p[1]);if(!row)return {meta:{changes:0}};
      if(sql.includes('approved')){if(row.status!=='pending'||row.expires_at<=p[0])return {meta:{changes:0}};row.status='approved';}
      else if(sql.includes('denied')){if(row.status!=='pending')return {meta:{changes:0}};row.status='denied';}
      else if(sql.includes('revoked')){if(row.status!=='approved')return {meta:{changes:0}};row.status='revoked';}
      row.decided_at=p[0];return {meta:{changes:1}};
    }
    if(sql.startsWith('UPDATE chat_device_requests SET redeemed_at=')) {
      const row=this.requests.get(p[2]);
      if(!row||row.request_secret_hash!==p[3]||row.status!=='approved'||row.redeemed_at!==null||row.expires_at<=p[4])
        return {meta:{changes:0}};
      row.redeemed_at=p[0];row.redemption_nonce=p[1];return {meta:{changes:1}};
    }
    if(sql.startsWith('INSERT INTO chat_sessions(')) {
      const row=this.requests.get(p[2]);
      if(!row||row.redemption_nonce!==p[3]||row.status!=='approved')return {meta:{changes:0}};
      this.sessions.push({tokenHash:p[0],actorId:row.actor_id,enrollmentId:row.request_id,expiresAt:p[1]});
      return {meta:{changes:1}};
    }
    throw Error('Unexpected write: '+sql);
  }
  async batch(queries) {
    return Promise.all(queries.map(async q=>this.run(q.sql,q.params)));
  }
}
const createEnv=()=> {
  const db=new FakeDb(),revoked=[];
  return {V2_DEVICE_APPROVAL_MODE:'enforce',V2_DEVICE_ADMIN_SECRET:adminKey,DB:db,
    CHAT_ROOMS:{idFromName:()=>({}),get:()=>({fetch:async (_url,options)=>{
      revoked.push(JSON.parse(options.body));return new Response('{}');
    }})},revoked};
};
const normalizeName=name=>typeof name==='string'?name.trim().toLowerCase():'';
async function handle(req,env) {
  const result=await handleDeviceApprovalApi(req,env,new URL(req.url),'',reply,normalizeName,'main-chat-v2');
  return {status:result.status,body:await result.json()};
}

test('explicit opt-in and a separate admin secret are mandatory',async()=>{
  assert.equal(deviceGateEnabled({}),false);
  assert.equal(adminConfigured({V2_DEVICE_ADMIN_SECRET:'small'}),false);
  assert.equal(adminConfigured({V2_DEVICE_ADMIN_SECRET:adminKey}),true);
  const env=createEnv(); delete env.V2_DEVICE_APPROVAL_MODE;
  const response=await handle(call('POST','/api/chat/device/request',{displayName:'Noa'}),env);
  assert.equal(response.status,503);
  assert.equal(env.DB.requests.size,0);
});
test('administrator cannot be impersonated through a member name, Origin or bad bearer token',async()=>{
  const env=createEnv();
  assert.equal(await verifyAdminRequest(call('GET','/api/chat/admin/device-requests',undefined,'badkey'),env),false);
  assert.equal(await verifyAdminRequest(call('GET','/api/chat/admin/device-requests',undefined,adminKey,'https://evil.example'),env),false);
  assert.equal(await verifyAdminRequest(call('GET','/api/chat/admin/device-requests',undefined,adminKey),env),true);
  assert.equal((await handle(call('GET','/api/chat/admin/device-requests',undefined,'noa'),env)).status,401);
});
test('pending device needs independent admin approval; redemption is one-time, revocable',async()=>{
  const env=createEnv();
  const request=await handle(call('POST','/api/chat/device/request',{displayName:'NOA',deviceLabel:'Android'}),env);
  assert.equal(request.status,202);
  assert.equal(request.body.status,'pending');
  assert.equal(request.body.requestSecret.length>=40,true);
  const row=env.DB.requests.get(request.body.requestId);
  assert.ok(row);assert.notEqual(row.request_secret_hash,request.body.requestSecret);
  assert.equal(row.request_secret_hash,await tokenDigest(request.body.requestSecret));
  const auth={requestId:request.body.requestId,requestSecret:request.body.requestSecret};
  assert.equal((await handle(call('POST','/api/chat/device/status',auth),env)).status,202);
  const action='/api/chat/admin/device-requests/'+auth.requestId+'/approve';
  assert.equal((await handle(call('POST',action,{},'noa'),env)).status,401);
  assert.equal((await handle(call('POST',action,{},adminKey),env)).status,200);
  const issued=await handle(call('POST','/api/chat/device/status',auth),env);
  assert.equal(issued.status,200);
  assert.equal(issued.body.actorId,'member:noa');
  assert.ok(issued.body.token.length>=40);
  assert.equal(env.DB.sessions.length,1);
  assert.equal((await handle(call('POST','/api/chat/device/status',auth),env)).status,403);
  assert.equal(env.DB.sessions.length,1);
  const revoke=await handle(call('POST','/api/chat/admin/device-requests/'+auth.requestId+'/revoke',{},adminKey),env);
  assert.equal(revoke.status,200);
  assert.equal(env.DB.requests.get(auth.requestId).status,'revoked');
  assert.deepEqual(env.revoked,[{enrollmentId:auth.requestId}]);
});
test('new device requests are limited; no access granted by requests alone',async()=>{
  const env=createEnv();
  for(let i=0;i<2;i++){
    const r=await handle(call('POST','/api/chat/device/request',{displayName:'Noa'}),env);
    assert.equal(r.status,202);
  }
  const third=await handle(call('POST','/api/chat/device/request',{displayName:'Noa'}),env);
  assert.equal(third.status,429);
  assert.equal(env.DB.sessions.length,0);
  assert.equal((await handle(call('POST','/api/chat/device/request',{displayName:'unknown'}),env)).status,403);
});
