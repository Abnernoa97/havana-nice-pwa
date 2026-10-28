import test from 'node:test';
import assert from 'node:assert/strict';
import {mediaConfigured,handleUnifiedChatMedia} from '../src/unified-media.js';

const actorId='member:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const session={actorId,displayName:'Prueba'};
const respond=(data,status=200)=>Response.json(data,{status});
const uuid='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const valid={kind:'video',name:'video-original.mp4',mimeType:'video/mp4',
 sizeBytes:10*1024*1024*1024,clientId:uuid,
 batchId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',batchIndex:0};
const endpoint='https://api.test/api/chat/media/start';
const post=body=>new Request(endpoint,{method:'POST',
 headers:{'content-type':'application/json'},body:JSON.stringify(body)});
test('One storage path denies every photo/video upload until BOTH private Workers are bound',async()=>{
 assert.equal(mediaConfigured({}),false);
 const r=await handleUnifiedChatMedia(post(valid),{},session,new URL(endpoint),'',respond,async()=>{});
 assert.equal(r.status,503);
});
test('Metadata does not allow 10GiB+ files or arbitrary file types',async()=>{
 const env={V2_CLOUD_BRIDGE_ENABLED:'enabled',V2_CLOUD_BRIDGE_MEDIA_ENABLED:'enabled',
  V2_CLOUD_BRIDGE_SECRET:'x'.repeat(40),HAVANA_CLOUD_BRIDGE:{fetch:()=>{throw Error('should not reach');}},
  DB:{prepare:()=>{throw Error('should not reach');}}};
 for(const meta of [
   {...valid,sizeBytes:10*1024*1024*1024+1},
   {...valid,kind:'document'}, {...valid,name:'../not-allowed.mp4'},
   {...valid,mimeType:'text/html'}, {...valid,batchIndex:5},
   {...valid,batchIndex:-1}, {...valid,batchId:'not-a-uuid'}
 ]){
  const r=await handleUnifiedChatMedia(post(meta),env,session,new URL(endpoint),'',respond,async()=>{});
  assert.equal(r.status,400);
 }
});
test('Public media status never exposes cloud credentials or account ids',async()=>{
 const r=await handleUnifiedChatMedia(new Request('https://api.test/api/chat/media/status'),{},session,
  new URL('https://api.test/api/chat/media/status'),'',respond,async()=>{});
 assert.deepEqual(await r.json(),{enabled:false,maxPhotoBytes:100*1024*1024,
   maxVideoBytes:10*1024*1024*1024,chunkBytes:4*1024*1024,maxFilesPerSend:5});
});

// The old chat controls remain authoritative, but media deletion must remove
// its original from CLOUD before committing the D1 message deletion.
import {deleteChatMessageRecord} from '../src/message-removal.js';
import {finalizeConfirmedMedia} from '../src/unified-media.js';
test('Deleting a photo/video requires confirmed CLOUD deletion before D1 writes',async()=>{
 const asset='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 let writes=0,called=0,allow=false;
 const env={
  DB:{
   prepare(sql){return {bind(...args){return {
    async first(){
     if(sql==='SELECT seq FROM chat_messages WHERE seq=?')return {seq:7};
     if(sql.includes('SELECT asset_id FROM chat_media_assets'))return {asset_id:asset};
     if(sql.includes('SELECT seq FROM chat_messages WHERE seq=?'))return null;
     return null;
    },async run(){writes++;return {meta:{changes:1}};}
   };}}},async batch(batch){writes+=batch.length;}
  },
  V2_CLOUD_BRIDGE_ENABLED:'enabled',V2_CLOUD_BRIDGE_MEDIA_ENABLED:'enabled',
  V2_CLOUD_BRIDGE_SECRET:'s'.repeat(45),
  HAVANA_CLOUD_BRIDGE:{
   async fetch(url,options){
    called++;
    assert.equal(url,'https://havana-cloud.internal/api/internal/havana-v2/media/'+asset+'/file');
    assert.equal(options.method,'DELETE');
    assert.equal(options.headers['x-havana-v2-internal-token'],'s'.repeat(45));
    return Response.json({ok:allow},{status:allow?200:502});
   }
  }
 };
 await assert.rejects(()=>deleteChatMessageRecord(env,7),/media_delete_unconfirmed/);
 assert.equal(writes,0);
 allow=true;
 // Simulated deletion batch must include old message, reply and reaction cleanup.
 await assert.rejects(()=>deleteChatMessageRecord(env,7),/Deletion not confirmed/);
 assert.ok(called>=2);
 assert.equal(writes,4);
});
test('A Drive-confirmed asset generates a single atomic D1 Chat transaction',async()=>{
 let statements=0,notifications=0;
 const record={asset_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  sender_id:actorId,client_id:uuid,kind:'photo'};
 const env={DB:{
  prepare(sql){return {bind(){return {
   async first(){
    if(sql.includes('SELECT message_seq FROM chat_media_assets'))return {message_seq:42};
    return null;
   }
  };}}},
  async batch(queries){statements+=queries.length;}
 }};
 const seq=await finalizeConfirmedMedia(env,record,session,async()=>{notifications++});
 assert.equal(seq,42);assert.equal(statements,2);assert.equal(notifications,1);
});
