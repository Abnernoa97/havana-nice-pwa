import test from 'node:test';
import assert from 'node:assert/strict';
import {mediaConfigured,handleUnifiedChatMedia} from '../src/unified-media.js';

const actorId='member:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const session={actorId,displayName:'Prueba'};
const respond=(data,status=200)=>Response.json(data,{status});
const uuid='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const valid={kind:'video',name:'video-original.mp4',mimeType:'video/mp4',
 sizeBytes:10*1024*1024*1024,clientId:uuid};
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
   {...valid,mimeType:'text/html'}
 ]){
  const r=await handleUnifiedChatMedia(post(meta),env,session,new URL(endpoint),'',respond,async()=>{});
  assert.equal(r.status,400);
 }
});
test('Public media status never exposes cloud credentials or account ids',async()=>{
 const r=await handleUnifiedChatMedia(new Request('https://api.test/api/chat/media/status'),{},session,
  new URL('https://api.test/api/chat/media/status'),'',respond,async()=>{});
 assert.deepEqual(await r.json(),{enabled:false,maxPhotoBytes:100*1024*1024,
   maxVideoBytes:10*1024*1024*1024,chunkBytes:4*1024*1024});
});
