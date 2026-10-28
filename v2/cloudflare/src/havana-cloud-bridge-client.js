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
