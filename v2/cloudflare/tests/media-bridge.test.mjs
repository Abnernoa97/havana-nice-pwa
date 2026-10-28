import test from 'node:test';
import assert from 'node:assert/strict';
import {mediaConfigured,handleUnifiedChatMedia,finalizeConfirmedMedia} from '../src/unified-media.js';
import {deleteChatMessageRecord} from '../src/message-removal.js';
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
function env(flags='enabled'){
 return {V2_CLOUD_LINK_ENABLED:'enabled',V2_CLOUD_MEDIA_ENABLED:flags,
  V2_ADMIN_LOGIN_MODE:'enabled',V2_ADMIN_LOGIN_SECRET:'s'.repeat(50),
  HAVANA_CLOUD_BRIDGE:{fetch:()=>{throw Error('Invalid metadata must never contact Cloud');}},
  DB:{prepare:()=>{throw Error('Invalid metadata must never write D1');}}};
}
test('Existing CLOUD APIs remain off until the owner authorizes the V2-only connection',async()=>{
 assert.equal(mediaConfigured({}),false);
 assert.equal(mediaConfigured(env('disabled')),false);
 assert.equal(mediaConfigured(env()),true);
 const r=await handleUnifiedChatMedia(post(valid),{},session,new URL(endpoint),'',respond,async()=>{});
 assert.equal(r.status,503);
});
test('Reject type confusion, excessive sizes, six files and invalid names before any storage access',async()=>{
 for(const meta of [
  {...valid,sizeBytes:10*1024*1024*1024+1},
  {...valid,kind:'document'},{...valid,name:'../not-allowed.mp4'},
  {...valid,mimeType:'text/html'},{...valid,batchIndex:5},
  {...valid,batchIndex:-1},{...valid,batchId:'not-a-uuid'}
 ]){
  const r=await handleUnifiedChatMedia(post(meta),env(),session,new URL(endpoint),'',respond,async()=>{});
  assert.equal(r.status,400);
 }
});
test('Public media status reveals no Google token, Cloud credential or account id',async()=>{
 const r=await handleUnifiedChatMedia(new Request('https://api.test/api/chat/media/status'),{},session,
  new URL('https://api.test/api/chat/media/status'),'',respond,async()=>{});
 assert.deepEqual(await r.json(),{enabled:false,maxPhotoBytes:100*1024*1024,
  maxVideoBytes:10*1024*1024*1024,chunkBytes:4*1024*1024,maxFilesPerSend:5});
});
test('Deletion of original is fail-closed if Cloud owner has not authorized the V2 adapter',async()=>{
 const asset='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';let writes=0;
 const e={DB:{
  prepare(sql){return {bind(){return{async first(){
   if(sql==='SELECT seq FROM chat_messages WHERE seq=?')return{seq:7};
   if(sql.includes('SELECT asset_id FROM chat_media_assets'))return{asset_id:asset};
   return null;
  }}}}},
  async batch(){writes++;}
 }};
 await assert.rejects(()=>deleteChatMessageRecord(e,7),/media_delete_unconfirmed/);
 assert.equal(writes,0);
});
test('An already confirmed file creates the Chat message and references it atomically',async()=>{
 let statements=0,notifications=0;
 const record={asset_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  sender_id:actorId,client_id:uuid,kind:'photo'};
 const e={DB:{
  prepare(sql){return {bind(){return{async first(){
   if(sql.includes('SELECT message_seq FROM chat_media_assets'))return{message_seq:42};
   return null;
  }}}}},
  async batch(queries){statements+=queries.length;}
 }};
 assert.equal(await finalizeConfirmedMedia(e,record,session,async()=>{notifications++}),42);
 assert.equal(statements,2);assert.equal(notifications,1);
});
test('The only media transfer route points to existing Cloud API, never unpublished internal endpoints',async()=>{
 const fs=await import('node:fs');
 const src=fs.readFileSync(new URL('../src/unified-media.js',import.meta.url),'utf8');
 const adapter=fs.readFileSync(new URL('../src/cloud-media-adapter.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/\/api\/internal\/havana-v2/);
 assert.match(src,/cloudStart\(/);assert.match(src,/cloudChunk\(/);assert.match(src,/cloudRead\(/);
 for(const p of ['/api/google/upload/session','/api/google/upload/chunk','/api/media/','/api/trash/delete'])
  assert.ok(adapter.includes(p),'Missing real Cloud endpoint '+p);
});
