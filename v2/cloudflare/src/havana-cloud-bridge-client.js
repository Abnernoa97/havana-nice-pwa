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
