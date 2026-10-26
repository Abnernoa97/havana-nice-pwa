// HAVANA NICE V2 device approval foundation. Never enable enforcement without
// 0009 migration, an independent administrator secret and upgraded clients.
// All sensitive tokens are random; D1 stores SHA-256 digests only.
const WINDOW = 24 * 60 * 60 * 1000;
const SESSION_LIFETIME = 90 * WINDOW;
const APP_ORIGIN = 'https://havana-nice-v2-dev.pages.dev';
const encode = new TextEncoder();

export function deviceGateEnabled(env) {
  return env.V2_DEVICE_APPROVAL_MODE === 'enforce';
}
export function adminConfigured(env) {
  return typeof env.V2_DEVICE_ADMIN_SECRET === 'string' && env.V2_DEVICE_ADMIN_SECRET.length >= 40;
}
export function randomCredential(bytes=32) {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(bytes))))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export async function tokenDigest(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',encode.encode(value)))]
    .map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function verifyAdminRequest(request,env) {
  if (!adminConfigured(env) || request.headers.has('origin')) return false;
  const token=(request.headers.get('authorization')||'').match(/^Bearer ([A-Za-z0-9_-]{40,256})$/i)?.[1];
  if(!token)return false;
  // Constant-time compare of fixed-length hashes, not variable-length secrets.
  const a=await crypto.subtle.digest('SHA-256',encode.encode(token));
  const b=await crypto.subtle.digest('SHA-256',encode.encode(env.V2_DEVICE_ADMIN_SECRET));
  return crypto.subtle.timingSafeEqual
    ? crypto.subtle.timingSafeEqual(a,b)
    : [...new Uint8Array(a)].reduce((diff,byte,i)=>diff|(byte ^ new Uint8Array(b)[i]),0)===0;
}
function errorReply(respond,origin,message,status=400) {return respond({error:message},status,origin);}
async function jsonBody(request) {
  try {return await request.json();}catch {return null;}
}
export async function handleDeviceApprovalApi(request,env,url,origin,respond,normalizeName,ROOM) {
  const path=url.pathname;
  if (!deviceGateEnabled(env)) return errorReply(respond,origin,'Administración de dispositivos todavía no habilitada',503);
  if (!adminConfigured(env)) return errorReply(respond,origin,'Servicio de aprobación no configurado',503);
  const now=Date.now();
  if(path.startsWith('/api/chat/admin/device-requests')) {
    if (!await verifyAdminRequest(request,env)) return errorReply(respond,origin,'No autorizado',401);
    if(path==='/api/chat/admin/device-requests' && request.method==='GET') {
      const entries=await env.DB.prepare(
        "SELECT request_id,actor_id,display_name,device_label,status,created_at,expires_at,decided_at,redeemed_at FROM chat_device_requests ORDER BY created_at DESC LIMIT 100"
      ).all();
      return respond({requests:entries.results||[]},200,origin);
    }
    const match=/^\/api\/chat\/admin\/device-requests\/([A-Za-z0-9_-]{20,40})\/(approve|deny|revoke)$/.exec(path);
    if(!match || request.method!=='POST')return errorReply(respond,origin,'Ruta no válida',404);
    const [,requestId,action]=match;
    const current=await env.DB.prepare('SELECT request_id,status,actor_id,expires_at FROM chat_device_requests WHERE request_id=?')
      .bind(requestId).first();
    if(!current) return errorReply(respond,origin,'Solicitud no encontrada',404);
    if(action==='approve') {
      if(current.status!=='pending'||current.expires_at<=now)return errorReply(respond,origin,'Solicitud vencida o procesada',409);
      await env.DB.prepare("UPDATE chat_device_requests SET status='approved',decided_at=? WHERE request_id=? AND status='pending' AND expires_at>?")
        .bind(now,requestId,now).run();
    } else if (action==='deny') {
      if(current.status!=='pending')return errorReply(respond,origin,'Solicitud procesada',409);
      await env.DB.prepare("UPDATE chat_device_requests SET status='denied',decided_at=? WHERE request_id=? AND status='pending'")
        .bind(now,requestId).run();
    } else {
      if(current.status!=='approved')return errorReply(respond,origin,'Dispositivo sin aprobación activa',409);
      await env.DB.prepare("UPDATE chat_device_requests SET status='revoked',decided_at=? WHERE request_id=? AND status='approved'")
        .bind(now,requestId).run();
      // The Durable Object is private; no publicly routed URL points here.
      // Disconnect active WebSockets for this enrollment immediately.
      try {
        await env.CHAT_ROOMS.get(env.CHAT_ROOMS.idFromName(ROOM)).fetch(
          'https://internal/device-revoked',
          {method:'POST',body:JSON.stringify({enrollmentId:requestId})}
        );
      } catch {} // D1 denial remains authoritative even if the socket is already gone.
    }
    return respond({ok:true,status:action==='approve'?'approved':action==='deny'?'denied':'revoked'},200,origin);
  }
  if(path==='/api/chat/device/request' && request.method==='POST') {
    const data=await jsonBody(request), username=normalizeName(data?.displayName);
    if(!username)return errorReply(respond,origin,'Nombre inválido',400);
    const member=await env.DB.prepare(
      'SELECT actor_id,display_name FROM chat_members WHERE username=? AND active=1'
    ).bind(username).first();
    if(!member)return errorReply(respond,origin,'Nombre no autorizado',403);
    const rate=await env.DB.prepare(
      'SELECT COUNT(*) AS total, SUM(CASE WHEN status=\'pending\' AND expires_at>? THEN 1 ELSE 0 END) AS pending FROM chat_device_requests WHERE actor_id=? AND created_at>?'
    ).bind(now,member.actor_id,now-WINDOW).first();
    if(Number(rate?.total||0)>=6||Number(rate?.pending||0)>=2)
      return errorReply(respond,origin,'Hay solicitudes recientes. Consulta al administrador.',429);
    const label=typeof data.deviceLabel==='string' ? data.deviceLabel.trim().slice(0,64) : '';
    const requestId=randomCredential(18), requestSecret=randomCredential(32);
    await env.DB.prepare(
      "INSERT INTO chat_device_requests(request_id,request_secret_hash,actor_id,display_name,device_label,status,created_at,expires_at) VALUES(?,?,?,?,?,'pending',?,?)"
    ).bind(requestId,await tokenDigest(requestSecret),member.actor_id,member.display_name,label||'Dispositivo nuevo',now,now+WINDOW).run();
    return respond({status:'pending',requestId,requestSecret,expiresAt:new Date(now+WINDOW).toISOString()},202,origin);
  }
  if(path==='/api/chat/device/status'&&request.method==='POST') {
    const data=await jsonBody(request);
    if(!/^[A-Za-z0-9_-]{20,40}$/.test(data?.requestId||'')||
       !/^[A-Za-z0-9_-]{40,100}$/.test(data?.requestSecret||''))
      return errorReply(respond,origin,'Solicitud inválida',400);
    const requestHash=await tokenDigest(data.requestSecret);
    const row=await env.DB.prepare(
      'SELECT status,expires_at,redeemed_at,actor_id,display_name FROM chat_device_requests WHERE request_id=? AND request_secret_hash=?'
    ).bind(data.requestId,requestHash).first();
    if(!row)return errorReply(respond,origin,'Solicitud no encontrada',404);
    if(row.expires_at<=now)return errorReply(respond,origin,'Solicitud vencida',410);
    if(row.status==='pending')return respond({status:'pending'},202,origin);
    if(row.status!=='approved'||row.redeemed_at)return errorReply(respond,origin,'Solicitud no disponible',403);
    const member=await env.DB.prepare('SELECT active FROM chat_members WHERE actor_id=?').bind(row.actor_id).first();
    if(!member||member.active!==1)return errorReply(respond,origin,'Miembro no autorizado',403);
    const token=randomCredential(32), tokenHash=await tokenDigest(token);
    const redemptionNonce=randomCredential(16);
    // D1 batch executes in a transaction; claim once and issue only for that claim.
    const results=await env.DB.batch([
      env.DB.prepare("UPDATE chat_device_requests SET redeemed_at=?,redemption_nonce=? WHERE request_id=? AND request_secret_hash=? AND status='approved' AND redeemed_at IS NULL AND expires_at>?")
        .bind(now,redemptionNonce,data.requestId,requestHash,now),
      env.DB.prepare(
        'INSERT INTO chat_sessions(token_hash,actor_id,display_name,expires_at,enrollment_id) SELECT ?,actor_id,display_name,?,request_id FROM chat_device_requests WHERE request_id=? AND redemption_nonce=? AND status=\'approved\''
      ).bind(tokenHash,now+SESSION_LIFETIME,data.requestId,redemptionNonce),
    ]);
    if(Number(results[0]?.meta?.changes)!==1 || Number(results[1]?.meta?.changes)!==1)
      return errorReply(respond,origin,'La solicitud ya fue utilizada',409);
    return respond({token,actorId:row.actor_id,displayName:row.display_name,
      expiresAt:new Date(now+SESSION_LIFETIME).toISOString()},200,origin);
  }
  return errorReply(respond,origin,'Ruta no válida',404);
}
