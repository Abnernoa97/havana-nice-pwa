import test from 'node:test';
import assert from 'node:assert/strict';
import {handleCloudLinkAdmin} from '../src/cloud-link.js';
import {cloudStart,cloudChunk,cloudRead,cloudDelete} from '../src/cloud-media-adapter.js';
const itemId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const cloudId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const expiry=Math.floor(Date.now()/1000)+365*86400;
const device='d1.'+expiry+'.'+cloudId+'.'+'X'.repeat(43);
const size=4*1048576+100;
const record={asset_id:itemId,original_name:'foto original.jpg',mime:'image/jpeg',bytes:size};
function createEnvironment(){
 let link=null,up=null,sessionCreates=0,chunkStarts=[],deletions=[],newWrites=0;
 const env={
  V2_ADMIN_LOGIN_MODE:'enabled',V2_CLOUD_LINK_ENABLED:'enabled',V2_CLOUD_MEDIA_ENABLED:'enabled',
  V2_ADMIN_LOGIN_SECRET:'x'.repeat(50),
  DB:{prepare(sql){const exec=(args)=>({
   async first(){
    if(sql.includes('FROM chat_admin_sessions'))return{revoked_at:null,expires_at:Date.now()+100000};
    if(sql.includes('FROM chat_cloud_link'))return link;
    if(sql.includes('FROM chat_cloud_uploads'))return up?{...up}:null;
    throw Error('unexpected first '+sql);
   },
   async run(){
    if(sql.startsWith('INSERT INTO chat_cloud_link')){
     link={encrypted_token:args[0],iv:args[1],expires_at:args[2]};return{meta:{changes:1}};
    }
    if(sql.startsWith('INSERT OR IGNORE INTO chat_cloud_uploads')){
     if(up)return{meta:{changes:0}};
     up={asset_id:args[0],upload_key:null,next_offset:0,cloud_media_key:null,
      owner_nonce:args[1],stage:'starting'};
     newWrites++;return{meta:{changes:1}};
    }
    if(sql.startsWith('UPDATE chat_cloud_uploads')){
     if(!up)return{meta:{changes:0}};
     if(sql.includes("stage='starting',owner_nonce=?")){
      if(up.stage!=='failed')return{meta:{changes:0}};
      Object.assign(up,{owner_nonce:args[0],stage:'starting'});return{meta:{changes:1}};
     }
     if(sql.includes("upload_key=?,stage='uploading'")){
      if(up.owner_nonce!==args[3]||up.stage!=='starting')return{meta:{changes:0}};
      Object.assign(up,{upload_key:args[0],stage:'uploading',next_offset:0});return{meta:{changes:1}};
     }
     if(sql.includes("stage='starting',owner_nonce=?")){
      if(up.stage!=='uploading'||up.next_offset!==args[3])return{meta:{changes:0}};
      Object.assign(up,{stage:'starting',owner_nonce:args[0]});return{meta:{changes:1}};
     }
     if(sql.includes("stage='ready',cloud_media_key=?")){
      if(up.owner_nonce!==args[4])return{meta:{changes:0}};
      Object.assign(up,{stage:'ready',cloud_media_key:args[0],next_offset:args[1]});return{meta:{changes:1}};
     }
     if(sql.includes("stage='uploading',next_offset=?")){
      if(up.owner_nonce!==args[3])return{meta:{changes:0}};
      Object.assign(up,{stage:'uploading',next_offset:args[0]});return{meta:{changes:1}};
     }
     if(sql.includes("stage='uploading',updated_at=?")){
      if(up.owner_nonce===args[2])up.stage='uploading';return{meta:{changes:1}};
     }
     if(sql.includes("stage='failed'")){up.stage='failed';return{meta:{changes:1}};}
    }
    throw Error('unexpected run '+sql);
   }
  });return{
   first:()=>exec([]).first(),
   bind:(...args)=>exec(args)
  };}}
 };
 env.HAVANA_CLOUD_BRIDGE={async fetch(raw,options={}){
  const p=new URL(raw).pathname,headers=new Headers(options.headers||{});
  if(p==='/api/auth/login')return Response.json({deviceToken:device});
  if(p==='/api/auth/device')return new Response(JSON.stringify({deviceToken:device}),{
   status:200,headers:{'set-cookie':'hn_cloud_session=VALID; Path=/; Secure; HttpOnly'}
  });
  assert.match(headers.get('cookie')||'',/^hn_cloud_session=/);
  if(p==='/api/google/upload/session'){
   sessionCreates++;return Response.json({uploadKey:'upload-safe-12345678',chunkSize:4*1048576});
  }
  if(p==='/api/google/upload/chunk'){
   const off=Number(headers.get('x-upload-start'));chunkStarts.push(off);
   assert.equal(headers.get('x-upload-key'),'upload-safe-12345678');
   if(off===0)return Response.json({complete:false,nextOffset:4*1048576});
   return Response.json({complete:true,file:{name:record.original_name},
     item:{key:cloudId}});
  }
  if(p==='/api/media/'+cloudId+'/content')
   return new Response(new Uint8Array([1,2,3]),{status:206,headers:{'content-range':'bytes 0-2/'+size}});
  if(p==='/api/media/delete'){
   deletions.push('trash');return Response.json({trashedKeys:[cloudId]});
  }
  if(p==='/api/trash/delete'){
   deletions.push('delete');return Response.json({deletedKeys:[cloudId]});
  }
  throw Error('unexpected Cloud path '+p);
 }};
 return {env,get:()=>({up,link,sessionCreates,chunkStarts,deletions,newWrites})};
}
test('Real published Cloud contract: link, resumable chunks, retry, Chat-read and permanent delete',async()=>{
 const state=createEnvironment(),{env}=state;
 const req=new Request('https://v2.test/api/chat/admin/cloud/connect',{
  method:'POST',headers:{authorization:'Bearer '+'a'.repeat(43),'content-type':'application/json'},
  body:JSON.stringify({password:'only-transient-password'})
 });
 const connected=await handleCloudLinkAdmin(req,env,new URL(req.url),'',
   (body,status)=>Response.json(body,{status:status||200}));
 assert.equal(connected.status,200);
 assert.equal((await connected.json()).linked,true);
 const started=await cloudStart(env,record);
 assert.equal(started.nextOffset,0);
 assert.equal(state.get().sessionCreates,1);
 assert.equal((await cloudStart(env,record)).nextOffset,0);
 assert.equal(state.get().sessionCreates,1);
 const part=await cloudChunk(env,record,0,new Uint8Array(4*1048576).buffer);
 assert.deepEqual(part,{complete:false,nextOffset:4*1048576});
 assert.equal(state.get().up.stage,'uploading');
 assert.equal((await cloudStart(env,record)).nextOffset,4*1048576);
 const final=await cloudChunk(env,record,4*1048576,new Uint8Array(100).buffer);
 assert.equal(final.complete,true);
 assert.equal(final.cloudKey,cloudId);
 assert.equal(final.nextOffset,size);
 assert.equal((await cloudStart(env,record)).complete,true);
 assert.equal(state.get().sessionCreates,1);
 assert.equal(state.get().newWrites,1);
 assert.deepEqual(state.get().chunkStarts,[0,4*1048576]);
 const image=await cloudRead(env,itemId,'bytes=0-2');
 assert.equal(image.status,206);
 assert.deepEqual([...new Uint8Array(await image.arrayBuffer())],[1,2,3]);
 assert.equal(await cloudDelete(env,itemId),true);
 assert.deepEqual(state.get().deletions,['trash','delete']);
 assert.equal(JSON.stringify(state.get().link).includes('only-transient-password'),false);
});
test('No Cloud media is fabricated without a validated owner pairing',async()=>{
 const {env,get}=createEnvironment();
 await assert.rejects(cloudStart(env,record),/cloud_not_linked/);
 assert.equal(get().sessionCreates,0);
});
