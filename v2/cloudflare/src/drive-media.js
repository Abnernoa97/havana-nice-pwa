// HAVANA NICE V2 / CHAT 6: isolated Google Drive provider.
// No HAVANA CLOUD Worker, OAuth tokens, cookies, account registry or files used.
// Everything stays OFF until separate V2 OAuth consent and explicit no-billing audit.
const MAX_IMAGE_BYTES = 640 * 1024;
const LIBRARY_BYTES = 64 * 1024 * 1024;
const MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const encoder = new TextEncoder();
const canonical = (name) => /^[A-Za-z0-9_-]{8,100}$/.test(name);

export function sniffImageMime(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if ([137,80,78,71,13,10,26,10].every((x,i) => bytes[i] === x)) return 'image/png';
  if (String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP') return 'image/webp';
  return null;
}

export function mediaReadiness(env) {
  const noBilling = env.V2_DRIVE_BILLING_MODE === 'no-billing';
  const consented = typeof env.V2_DRIVE_REFRESH_TOKEN === 'string' && env.V2_DRIVE_REFRESH_TOKEN.length > 30;
  const configured = Boolean(env.V2_DRIVE_CLIENT_ID && env.V2_DRIVE_CLIENT_SECRET && env.V2_DRIVE_FOLDER_ID && consented);
  const enabled = noBilling && configured && env.V2_MEDIA_UPLOADS === 'enabled';
  return {enabled, provider: 'google-drive-v2-isolated', maxImageBytes: MAX_IMAGE_BYTES,
    libraryLimitBytes: LIBRARY_BYTES, reason: enabled ? null :
      !noBilling ? 'billing_audit_required' : !configured ? 'independent_oauth_required' : 'not_enabled'};
}

async function refreshAccessToken(env) {
  const form = new URLSearchParams({client_id:env.V2_DRIVE_CLIENT_ID,client_secret:env.V2_DRIVE_CLIENT_SECRET,
    refresh_token:env.V2_DRIVE_REFRESH_TOKEN,grant_type:'refresh_token'});
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},
    body:form.toString()});
  if (!res.ok) throw Error('Google authorization unavailable');
  const data = await res.json();
  if (!data.access_token || typeof data.access_token !== 'string') throw Error('Google authorization unavailable');
  return data.access_token;
}

async function readImage(request) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_IMAGE_BYTES || declared < 0 || !Number.isFinite(declared)) return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const {value,done} = await reader.read();
      if (done) break;
      if (!value) continue;
      size += value.byteLength;
      if (size > MAX_IMAGE_BYTES) { await reader.cancel(); return null; }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (!size) return null;
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of chunks) { bytes.set(part, offset); offset += part.byteLength; }
  const mime = sniffImageMime(bytes);
  if (!mime || !MIME.has(mime) || request.headers.get('content-type')?.split(';')[0].trim() !== mime) return null;
  return {bytes,mime};
}

async function sendToDrive(env, token, payload, id) {
  const bound = 'hnv2-' + crypto.randomUUID();
  const metadata = {name: 'chat-v2-' + id + (payload.mime === 'image/png'?'.png':payload.mime==='image/webp'?'.webp':'.jpg'),
    mimeType:payload.mime,parents:[env.V2_DRIVE_FOLDER_ID]};
  const lead = encoder.encode('--'+bound+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+
    JSON.stringify(metadata)+'\r\n--'+bound+'\r\nContent-Type: '+payload.mime+'\r\n\r\n');
  const tail = encoder.encode('\r\n--'+bound+'--');
  const body = new Uint8Array(lead.length+payload.bytes.length+tail.length);
  body.set(lead); body.set(payload.bytes,lead.length); body.set(tail,lead.length+payload.bytes.length);
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,size,mimeType,parents', {
    method:'POST',headers:{authorization:'Bearer '+token,'content-type':'multipart/related; boundary='+bound},body});
  if (!res.ok) throw Error('Drive upload unavailable');
  const object = await res.json();
  if (!object.id || !object.parents?.includes(env.V2_DRIVE_FOLDER_ID)) throw Error('Drive object not created in private V2 folder');
  return object;
}

async function cleanupDriveFile(token, id) {
  if (!id) return;
  await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id),{
    method:'DELETE',headers:{authorization:'Bearer '+token}}).catch(()=>{});
}

async function saveAsset(env, actorId, clientId, data) {
  const existing = await env.DB.prepare('SELECT asset_id,status FROM v2_media_assets WHERE sender_id=? AND client_id=?')
    .bind(actorId,clientId).first();
  if (existing) return {existing: true, assetId: existing.asset_id, status: existing.status};
  const assetId = crypto.randomUUID();
  const initial = await env.DB.prepare(
    "INSERT OR IGNORE INTO v2_media_assets (asset_id,sender_id,client_id,mime,bytes,status,created_at) VALUES (?,?,?,?,?,'pending',?)")
    .bind(assetId,actorId,clientId,data.mime,data.bytes.byteLength,new Date().toISOString()).run();
  if (!initial.meta?.changes) return {existing:true,status:'pending'};

  const quota = await env.DB.prepare(
    'UPDATE v2_media_quota SET bytes_used=bytes_used+? WHERE id=1 AND bytes_used + ? <= ?')
    .bind(data.bytes.byteLength,data.bytes.byteLength,LIBRARY_BYTES).run();
  if (!quota.meta?.changes) {
    await env.DB.prepare('DELETE FROM v2_media_assets WHERE asset_id=?').bind(assetId).run();
    return {error:'media_quota_reached'};
  }
  let uploaded = null, token = null;
  try {
    token = await refreshAccessToken(env);
    uploaded = await sendToDrive(env,token,data,assetId);
    await env.DB.prepare("UPDATE v2_media_assets SET status='ready',drive_file_id=? WHERE asset_id=?")
      .bind(uploaded.id,assetId).run();
    return {assetId,status:'ready',mime:data.mime,bytes:data.bytes.byteLength};
  } catch {
    if (token && uploaded) await cleanupDriveFile(token,uploaded.id);
    await env.DB.prepare('DELETE FROM v2_media_assets WHERE asset_id=?').bind(assetId).run().catch(()=>{});
    await env.DB.prepare('UPDATE v2_media_quota SET bytes_used=max(0,bytes_used-?) WHERE id=1')
      .bind(data.bytes.byteLength).run().catch(()=>{});
    return {error:'media_storage_unavailable'};
  }
}

export async function handleChatMedia(request,env,session,url,origin,respond) {
  const state = mediaReadiness(env);
  if (url.pathname === '/api/chat/media/status' && request.method === 'GET') {
    return respond({...state,storageAvailable:state.enabled},200,origin);
  }
  if (!state.enabled) return respond({error:'media_not_connected',reason:state.reason},503,origin);
  if (url.pathname === '/api/chat/media/upload' && request.method === 'POST') {
    const clientId = request.headers.get('x-havana-client-asset-id');
    if (!clientId || !canonical(clientId)) return respond({error:'invalid_asset_id'},400,origin);
    const payload = await readImage(request);
    if (!payload) return respond({error:'image_must_be_jpeg_png_webp_under_640kb'},413,origin);
    const result = await saveAsset(env,session.actorId,clientId,payload);
    return respond(result,result.error? (result.error==='media_quota_reached'?507:503):200,origin);
  }
  const matched = /^\/api\/chat\/media\/([a-f0-9-]{36})$/.exec(url.pathname);
  if (matched && request.method === 'GET') {
    const row = await env.DB.prepare("SELECT drive_file_id,mime,status FROM v2_media_assets WHERE asset_id=?")
      .bind(matched[1]).first();
    if (!row || row.status !== 'ready') return respond({error:'not_found'},404,origin);
    try {
      const token = await refreshAccessToken(env);
      const remote = await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(row.drive_file_id)+'?alt=media',{
        headers:{authorization:'Bearer '+token}});
      if (!remote.ok) return respond({error:'media_unavailable'},502,origin);
      return new Response(remote.body,{status:200,headers:{
        'content-type':row.mime,'cache-control':'private, no-store',
        'x-content-type-options':'nosniff','content-security-policy':"default-src 'none'",
        'access-control-allow-origin':origin||'https://havana-nice-v2-dev.pages.dev','vary':'Origin'}});
    } catch { return respond({error:'media_unavailable'},502,origin); }
  }
  return respond({error:'not_found'},404,origin);
}
