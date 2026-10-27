import test from 'node:test';
import assert from 'node:assert/strict';
import { sniffImageMime, mediaReadiness, handleChatMedia } from '../src/drive-media.js';

const response = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

test('Media backend defaults to disabled and never assumes a paid/free billing setting', () => {
  const empty = mediaReadiness({});
  assert.equal(empty.enabled, false);
  assert.equal(empty.reason, 'billing_audit_required');
  const partial = mediaReadiness({ V2_DRIVE_BILLING_MODE: 'no-billing', V2_MEDIA_UPLOADS: 'enabled' });
  assert.equal(partial.enabled, false);
  assert.equal(partial.reason, 'independent_oauth_required');
});

test('No upload even if a caller asks when OAuth and zero-billing are unverified', async () => {
  const request = new Request('https://havana-nice-v2-dev.test/api/chat/media/upload', {
    method:'POST', headers:{'content-type':'image/jpeg','x-havana-client-asset-id':'client_123456789'},
    body:new Uint8Array([0xff,0xd8,0xff,1,1,1,1,1,1,1,1,1]),
  });
  const result = await handleChatMedia(request,{}, {actorId:'qa'}, new URL(request.url), '',response);
  assert.equal(result.status,503);
  assert.equal((await result.json()).error,'media_not_connected');
});

test('Status exposes no secrets and accurately reports not ready', async () => {
  const env = {V2_DRIVE_CLIENT_ID:'client_secret_a', V2_DRIVE_CLIENT_SECRET:'super_secret',
    V2_DRIVE_REFRESH_TOKEN:'v'.repeat(50),V2_DRIVE_FOLDER_ID:'folder_private'};
  const request=new Request('https://havana-nice-v2-dev.test/api/chat/media/status');
  const result=await handleChatMedia(request,env,{actorId:'qa'},new URL(request.url),'',response);
  const raw=await result.text();
  assert.equal(JSON.parse(raw).enabled,false);
  assert.ok(!raw.includes(env.V2_DRIVE_CLIENT_SECRET));
  assert.ok(!raw.includes(env.V2_DRIVE_REFRESH_TOKEN));
});

test('Only strict JPEG, PNG or WebP bytes are accepted; never SVG or GIF',()=>{
  assert.equal(sniffImageMime(Uint8Array.from([0xff,0xd8,0xff,...Array(12).fill(0)])),'image/jpeg');
  assert.equal(sniffImageMime(Uint8Array.from([137,80,78,71,13,10,26,10,...Array(8).fill(0)])),'image/png');
  const webp=new Uint8Array(16);webp.set(new TextEncoder().encode('RIFF'),0);webp.set(new TextEncoder().encode('WEBP'),8);
  assert.equal(sniffImageMime(webp),'image/webp');
  assert.equal(sniffImageMime(new TextEncoder().encode('<svg onload=alert(1)>')),null);
  assert.equal(sniffImageMime(new TextEncoder().encode('GIF89a01234567890')),null);
});

import { inspectHavanaCloudBridge } from '../src/havana-cloud-bridge-client.js';

test('Havana Cloud bridge is off by default without binding and secret',async()=>{
  assert.deepEqual(await inspectHavanaCloudBridge({}), {
    ready:false,provider:'havana-cloud-google-drive',reason:'private_bridge_not_authorized',
  });
});

test('Havana Cloud bridge remains closed when provider has not enabled uploads',async()=>{
  let invoked=0;
  const result=await inspectHavanaCloudBridge({
    V2_CLOUD_BRIDGE_ENABLED:'enabled',
    V2_CLOUD_BRIDGE_SECRET:'x'.repeat(55),
    HAVANA_CLOUD_BRIDGE: {fetch:async(req,init)=>{
      invoked++;
      assert.equal(init.headers['x-havana-v2-internal-token'].length,55);
      return Response.json({ready:true,eligibleAccounts:2,uploadRouteEnabled:false});
    }},
  });
  assert.equal(invoked,1);
  assert.equal(result.ready,false);
  assert.equal(result.eligibleAccounts,2);
  assert.equal(result.reason,'upload_bridge_not_ready');
});

import {preflightHavanaCloudPhotoVideo} from '../src/havana-cloud-bridge-client.js';

test('Photo/video preflight is inert without a private binding and explicit gate',async()=>{
  assert.deepEqual(await preflightHavanaCloudPhotoVideo({},{
    kind:'photo',mimeType:'image/jpeg',fileName:'wedding.jpg',sizeBytes:12_345
  }),{accepted:false,uploadRouteEnabled:false,reason:'private_bridge_not_authorized'});
});
test('Photo/video metadata reaches HAVANA CLOUD only through its private binding, not Google',async()=>{
  const input={kind:'video',mimeType:'video/mp4',fileName:'dance.mp4',sizeBytes:1234567};
  let calls=0;
  const env={V2_CLOUD_BRIDGE_ENABLED:'enabled',V2_CLOUD_BRIDGE_SECRET:'S'.repeat(50),
    HAVANA_CLOUD_BRIDGE:{fetch:async(url,init)=>{
      calls++;
      assert.equal(url,'https://havana-cloud.internal/api/internal/havana-v2/media/preflight');
      assert.equal(init.method,'POST');
      assert.equal(init.headers['x-havana-v2-internal-token'],'S'.repeat(50));
      assert.deepEqual(JSON.parse(init.body),input);
      return Response.json({accepted:true,kind:'video',chunkBytes:4194304,
        uploadRouteEnabled:false,sessionUrl:'DO_NOT_EXPOSE',accountId:'DO_NOT_EXPOSE'});
    }}};
  const result=await preflightHavanaCloudPhotoVideo(env,input);
  assert.equal(calls,1);
  assert.deepEqual(result,{accepted:true,uploadRouteEnabled:false,
    reason:'validation_only',kind:'video',chunkBytes:4194304});
  assert.ok(!JSON.stringify(result).includes('DO_NOT_EXPOSE'));
});
test('Photo/video preflight never enables real uploads, even for malicious provider replies',async()=>{
  const env={V2_CLOUD_BRIDGE_ENABLED:'enabled',V2_CLOUD_BRIDGE_SECRET:'k'.repeat(45),
    HAVANA_CLOUD_BRIDGE:{fetch:async()=>Response.json({accepted:true,
       uploadRouteEnabled:true,kind:'photo',chunkBytes:1048576})}};
  const status=await preflightHavanaCloudPhotoVideo(env,{
    kind:'photo',mimeType:'image/png',fileName:'party.png',sizeBytes:10000});
  assert.equal(status.accepted,true);
  assert.equal(status.uploadRouteEnabled,false);
});
test('Private preflight rejects audio and malformed metadata before calling HAVANA CLOUD',async()=>{
  let calls=0;
  const env={V2_CLOUD_BRIDGE_ENABLED:'enabled',V2_CLOUD_BRIDGE_SECRET:'e'.repeat(45),
    HAVANA_CLOUD_BRIDGE:{fetch:async()=>{calls++;throw Error('Should not call')}}};
  const data=await preflightHavanaCloudPhotoVideo(env,{
    kind:'audio',mimeType:'audio/mpeg',fileName:'voice.mp3',sizeBytes:12000});
  assert.deepEqual(data,{accepted:false,uploadRouteEnabled:false,reason:'invalid_metadata'});
  assert.equal(calls,0);
});
