// Only invokes HAVANA CLOUD via a private Worker Service Binding.
// No login cookie, Google refresh token, OAuth client secret, or browser access.
export async function inspectHavanaCloudBridge(env) {
  if (env.V2_CLOUD_BRIDGE_ENABLED !== 'enabled' || !env.HAVANA_CLOUD_BRIDGE ||
      typeof env.V2_CLOUD_BRIDGE_SECRET !== 'string' || env.V2_CLOUD_BRIDGE_SECRET.length < 40) {
    return { ready: false, provider: 'havana-cloud-google-drive',
      reason: 'private_bridge_not_authorized' };
  }
  try {
    const res = await env.HAVANA_CLOUD_BRIDGE.fetch(
      'https://havana-cloud.internal/api/internal/havana-v2/capabilities', {
        method: 'GET',
        headers: { 'x-havana-v2-internal-token': env.V2_CLOUD_BRIDGE_SECRET }
      });
    if (!res.ok) return {ready:false,provider:'havana-cloud-google-drive',reason:'bridge_rejected'};
    const data = await res.json();
    return {
      ready: data.ready === true && data.uploadRouteEnabled === true,
      provider: 'havana-cloud-google-drive',
      reason: data.uploadRouteEnabled === true ? null : 'upload_bridge_not_ready',
      eligibleAccounts: Math.max(0,Math.min(100,Number(data.eligibleAccounts)||0)),
    };
  } catch {
    return {ready:false,provider:'havana-cloud-google-drive',reason:'bridge_unavailable'};
  }
}

// Metadata only. This path MUST NEVER send media bytes, Drive tokens, or
// Google's upload session URL to a browser. The Cloud provider owns the policy.
// Intentionally not wired to the Chat UI while uploads remain disabled.
export async function preflightHavanaCloudPhotoVideo(env, metadata) {
  const unavailable={accepted:false,uploadRouteEnabled:false,reason:'private_bridge_not_authorized'};
  if(env?.V2_CLOUD_BRIDGE_ENABLED!=='enabled' ||
     typeof env?.HAVANA_CLOUD_BRIDGE?.fetch!=='function' ||
     typeof env?.V2_CLOUD_BRIDGE_SECRET!=='string' ||
     env.V2_CLOUD_BRIDGE_SECRET.length<40)return unavailable;
  // Early shape validation is not a second policy; HAVANA CLOUD decides MIME,
  // file size and eligible quota. Only transport metadata is sent.
  if(!metadata || !['photo','video'].includes(metadata.kind) ||
     typeof metadata.mimeType!=='string' ||
     typeof metadata.fileName!=='string' ||
     !Number.isSafeInteger(metadata.sizeBytes))
    return {accepted:false,uploadRouteEnabled:false,reason:'invalid_metadata'};
  try {
    const response=await env.HAVANA_CLOUD_BRIDGE.fetch(
      'https://havana-cloud.internal/api/internal/havana-v2/media/preflight',{
      method:'POST',headers:{
        'content-type':'application/json',
        'x-havana-v2-internal-token':env.V2_CLOUD_BRIDGE_SECRET
      },
      body:JSON.stringify({
        kind:metadata.kind,mimeType:metadata.mimeType,
        sizeBytes:metadata.sizeBytes,fileName:metadata.fileName
      })
    });
    // Never reflect provider error bodies, which could include provider details.
    if(!response.ok)return {accepted:false,uploadRouteEnabled:false,
      reason:response.status===507?'no_single_account_has_space':response.status===400?'invalid_media':'bridge_rejected'};
    const data=await response.json();
    return {
      accepted:data.accepted===true,
      uploadRouteEnabled:false, // Preflight is NEVER a transfer permit.
      reason:data.accepted===true?'validation_only':'bridge_rejected',
      kind:data.kind==='photo'||data.kind==='video'?data.kind:undefined,
      chunkBytes:Number.isSafeInteger(data.chunkBytes)?data.chunkBytes:undefined
    };
  }catch{
    return {accepted:false,uploadRouteEnabled:false,reason:'bridge_unavailable'};
  }
}

// M01 pilot transport. Only the V2 Worker may add the verified actor identity.
// The endpoint remains OFF until the message/attachment D1 transaction is wired,
// and until HAVANA CLOUD's private Service Binding has passed real QA.
export async function forwardHavanaPhotoToCloud(env,request,verifiedActorId){
  if(env?.V2_CLOUD_BRIDGE_ENABLED!=='enabled' ||
     env?.V2_CLOUD_BRIDGE_PHOTO_ENABLED!=='enabled' ||
     typeof env?.HAVANA_CLOUD_BRIDGE?.fetch!=='function' ||
     typeof env?.V2_CLOUD_BRIDGE_SECRET!=='string' ||
     env.V2_CLOUD_BRIDGE_SECRET.length<40)
    return {ok:false,status:503,error:'photo_bridge_not_ready'};
  const actorId=typeof verifiedActorId==='string'?verifiedActorId:'';
  const clientId=request.headers.get('x-havana-v2-client-id')||'';
  const name=request.headers.get('x-havana-v2-file-name')||'';
  const mime=(request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
  const size=Number(request.headers.get('x-havana-v2-size-bytes'));
  if(!/^member:[a-f0-9-]{36}$/i.test(actorId)||
     !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(clientId)||
     !name||name.length>180||/[\\/\x00-\x1f\x7f]/.test(name)||
     !['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(mime)||
     !Number.isSafeInteger(size)||size<1||size>25*1024*1024)
    return {ok:false,status:400,error:'invalid_photo_upload'};
  if(!request.body)return {ok:false,status:400,error:'missing_photo_body'};
  const headers=new Headers({
    'x-havana-v2-internal-token':env.V2_CLOUD_BRIDGE_SECRET,
    'x-havana-v2-actor-id':actorId,
    'x-havana-v2-client-id':clientId,
    'x-havana-v2-file-name':name,
    'x-havana-v2-size-bytes':String(size),
    'content-type':mime
  });
  try{
    const response=await env.HAVANA_CLOUD_BRIDGE.fetch(
      'https://havana-cloud.internal/api/internal/havana-v2/photo',
      {method:'POST',headers,body:request.body}
    );
    if(!response.ok)return {ok:false,status:502,error:'cloud_photo_unconfirmed'};
    const data=await response.json();
    if(data?.kind!=='photo'||data?.status!=='ready'||
       typeof data?.assetId!=='string'||
       !/^[a-f0-9-]{36}$/i.test(data.assetId))
      return {ok:false,status:502,error:'cloud_photo_confirmation_invalid'};
    return {ok:true,status:response.status===201?201:200,
      assetId:data.assetId,kind:'photo',alreadyUploaded:data.alreadyUploaded===true};
  }catch{
    return {ok:false,status:502,error:'cloud_photo_unavailable'};
  }
}
