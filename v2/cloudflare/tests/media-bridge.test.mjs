import test from 'node:test';
import assert from 'node:assert/strict';
import {forwardHavanaPhotoToCloud} from '../src/havana-cloud-bridge-client.js';
const actor='member:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const cid='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const photo=Uint8Array.from([255,216,255,224,0,16,74,70,73,70,0,1,255,217]);
function request(headers={}){
 return new Request('https://havana-nice-v2-dev.pages.dev/api/chat/media/photo/upload',{
  method:'POST',headers:{
   'content-type':'image/jpeg',
   'x-havana-v2-client-id':cid,
   'x-havana-v2-file-name':'test.jpg',
   'x-havana-v2-size-bytes':String(photo.length),...headers
  },body:photo
 });
}
function ready(fetcher){
 return {
  V2_CLOUD_BRIDGE_ENABLED:'enabled',
  V2_CLOUD_BRIDGE_PHOTO_ENABLED:'enabled',
  V2_CLOUD_BRIDGE_SECRET:'x'.repeat(54),
  HAVANA_CLOUD_BRIDGE:{fetch:fetcher}
 };
}
test('M01 server proxy always denies a missing binding or disabled transfer, without invoking cloud',async()=>{
 let called=0;const env=ready(()=>{called++;throw Error('must not call');});
 env.V2_CLOUD_BRIDGE_PHOTO_ENABLED='disabled';
 assert.equal((await forwardHavanaPhotoToCloud(env,request(),actor)).status,503);
 assert.equal((await forwardHavanaPhotoToCloud({},request(),actor)).status,503);
 assert.equal(called,0);
});
test('Verified actor overrides browser identity and no token/account information escapes',async()=>{
 let observed;
 const env=ready(async(url,init)=>{
  observed={url,headers:new Headers(init.headers),data:new Uint8Array(await new Response(init.body).arrayBuffer())};
  return Response.json({kind:'photo',status:'ready',
   assetId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',alreadyUploaded:false},{status:201});
 });
 const requestWithSpoofedActor=request({'x-havana-v2-actor-id':'member:dddddddd-dddd-4ddd-8ddd-dddddddddddd','authorization':'Bearer fake'});
 const result=await forwardHavanaPhotoToCloud(env,requestWithSpoofedActor,actor);
 assert.deepEqual(result,{ok:true,status:201,assetId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',kind:'photo',alreadyUploaded:false});
 assert.equal(observed.headers.get('x-havana-v2-actor-id'),actor);
 assert.equal(observed.headers.get('authorization'),null);
 assert.equal(observed.headers.get('x-havana-v2-internal-token'),env.V2_CLOUD_BRIDGE_SECRET);
 assert.equal(observed.url,'https://havana-cloud.internal/api/internal/havana-v2/photo');
 assert.equal(observed.data.length,photo.length);
 assert.equal(JSON.stringify(result).includes('token'),false);
});
test('Never proxy illegal formats, identities or large files',async()=>{
 let called=0;const env=ready(()=>{called++;throw Error('must not call')});
 for(const [headers,verified] of [
  [{'content-type':'video/mp4'},actor],
  [{'x-havana-v2-client-id':'broken'},actor],
  [{'x-havana-v2-file-name':'../evil.jpg'},actor],
  [{'x-havana-v2-size-bytes':'30000000'},actor],
  [{},'fake']
 ]){
  const out=await forwardHavanaPhotoToCloud(env,request(headers),verified);
  assert.equal(out.status,400);
 }
 assert.equal(called,0);
});
test('Cloud errors never return upstream secret-bearing JSON to browser',async()=>{
 const env=ready(async()=>Response.json({token:'private-google-token',accountId:'secret'},{status:502}));
 const out=await forwardHavanaPhotoToCloud(env,request(),actor);
 assert.equal(out.status,502);
 assert.equal(JSON.stringify(out).includes('private-google-token'),false);
});
