var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/admin-realtime.js
var ADMIN_PROTOCOL = "havana-v2-admin";
var ADMIN_TOKEN = /^[A-Za-z0-9_-]{40,128}$/;
function adminSocketToken(request) {
  const protocols = (request.headers.get("sec-websocket-protocol") || "").split(",").map((p) => p.trim());
  if (!protocols.includes(ADMIN_PROTOCOL)) return "";
  const value = protocols.find((p) => p.startsWith("admin."))?.slice(6) || "";
  return ADMIN_TOKEN.test(value) ? value : "";
}
__name(adminSocketToken, "adminSocketToken");
function adminTokenRequest(token) {
  return new Request("https://internal/admin-session-check", { headers: { authorization: "Bearer " + token } });
}
__name(adminTokenRequest, "adminTokenRequest");
async function notifyAdminClients(env, topic) {
  if (!["members"].includes(topic)) return;
  try {
    await env.CHAT_ROOMS.get(env.CHAT_ROOMS.idFromName("main-chat-v2")).fetch(
      "https://internal/admin-invalidate",
      { method: "POST", body: JSON.stringify({ topic }) }
    );
  } catch {
  }
}
__name(notifyAdminClients, "notifyAdminClients");

// src/admin-auth.js
var encoder = new TextEncoder();
var HOUR = 60 * 60 * 1e3;
var ATTEMPT_WINDOW = 15 * 60 * 1e3;
var SESSION_DURATION = 8 * HOUR;
var MIN_SECRET_LENGTH = 40;
var TOKEN = /^[A-Za-z0-9_-]{40,128}$/;
function opaque(bytes = 32) {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(bytes)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(opaque, "opaque");
async function hash(value) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))].map((v) => v.toString(16).padStart(2, "0")).join("");
}
__name(hash, "hash");
async function equalSecret(left, right) {
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right))
  ]);
  let difference = 0;
  const x = new Uint8Array(a), y = new Uint8Array(b);
  for (let i = 0; i < x.length; i++) difference |= x[i] ^ y[i];
  return difference === 0;
}
__name(equalSecret, "equalSecret");
function adminLoginConfigured(env) {
  return env.V2_ADMIN_LOGIN_MODE === "enabled" && typeof env.V2_ADMIN_LOGIN_SECRET === "string" && env.V2_ADMIN_LOGIN_SECRET.length >= MIN_SECRET_LENGTH;
}
__name(adminLoginConfigured, "adminLoginConfigured");
function tokenFromRequest(request) {
  return (request.headers.get("authorization") || "").match(/^Bearer ([A-Za-z0-9_-]{40,128})$/i)?.[1] || "";
}
__name(tokenFromRequest, "tokenFromRequest");
async function verifyAdminSession(request, env) {
  if (!adminLoginConfigured(env)) return false;
  const token = tokenFromRequest(request);
  if (!TOKEN.test(token)) return false;
  const row = await env.DB.prepare(
    "SELECT expires_at,revoked_at FROM chat_admin_sessions WHERE token_hash=?"
  ).bind(await hash(token)).first();
  return !!row && row.revoked_at == null && Number(row.expires_at) > Date.now();
}
__name(verifyAdminSession, "verifyAdminSession");
async function clientHash(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  return hash(env.V2_ADMIN_LOGIN_SECRET + ":" + ip);
}
__name(clientHash, "clientHash");
async function handleAdminSessionApi(request, env, url, origin, respond2) {
  const reply3 = /* @__PURE__ */ __name((body2, status = 200) => respond2(body2, status, origin), "reply");
  if (url.pathname === "/api/chat/admin/auth/status" && request.method === "GET") {
    return reply3({ enabled: adminLoginConfigured(env) });
  }
  if (!adminLoginConfigured(env)) return reply3({ error: "Inicio de administrador a\xFAn no configurado" }, 503);
  if (url.pathname === "/api/chat/admin/auth/sessions" && request.method === "GET") {
    if (!await verifyAdminSession(request, env)) return reply3({ error: "No autorizado" }, 401);
    const currentHash = await hash(tokenFromRequest(request));
    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS others FROM chat_admin_sessions WHERE revoked_at IS NULL AND expires_at>? AND token_hash<>?"
    ).bind(Date.now(), currentHash).first();
    return reply3({ others: Number(row?.others || 0) });
  }
  if (url.pathname === "/api/chat/admin/auth/revoke-others" && request.method === "POST") {
    if (!await verifyAdminSession(request, env)) return reply3({ error: "No autorizado" }, 401);
    const currentHash = await hash(tokenFromRequest(request));
    const result = await env.DB.prepare(
      "UPDATE chat_admin_sessions SET revoked_at=? WHERE revoked_at IS NULL AND expires_at>? AND token_hash<>?"
    ).bind(Date.now(), Date.now(), currentHash).run();
    await notifyAdminClients(env, "members");
    return reply3({ ok: true, revoked: Number(result.meta?.changes || 0) });
  }
  if (url.pathname === "/api/chat/admin/auth/session" && request.method === "GET") {
    if (!await verifyAdminSession(request, env)) return reply3({ error: "No autorizado" }, 401);
    return reply3({ ok: true });
  }
  if (url.pathname === "/api/chat/admin/auth/session" && request.method === "DELETE") {
    if (!await verifyAdminSession(request, env)) return reply3({ error: "No autorizado" }, 401);
    await env.DB.prepare("UPDATE chat_admin_sessions SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL").bind(Date.now(), await hash(tokenFromRequest(request))).run();
    await notifyAdminClients(env, "members");
    return reply3({ ok: true });
  }
  if (url.pathname !== "/api/chat/admin/auth/session" || request.method !== "POST")
    return reply3({ error: "M\xE9todo no permitido" }, 405);
  if ((request.headers.get("content-type") || "").split(";")[0].trim() !== "application/json")
    return reply3({ error: "Solicitud inv\xE1lida" }, 415);
  let body = null;
  try {
    body = await request.json();
  } catch {
    return reply3({ error: "Solicitud inv\xE1lida" }, 400);
  }
  const now = Date.now(), client = await clientHash(request, env);
  const existing = await env.DB.prepare(
    "SELECT failures,window_start FROM chat_admin_login_limits WHERE client_hash=?"
  ).bind(client).first();
  if (existing?.window_start > now - ATTEMPT_WINDOW && Number(existing.failures) >= 5)
    return reply3({ error: "Demasiados intentos. Intenta m\xE1s tarde." }, 429);
  const password = typeof body?.password === "string" ? body.password : "";
  const valid = password.length >= MIN_SECRET_LENGTH && password.length <= 256 && await equalSecret(password, env.V2_ADMIN_LOGIN_SECRET);
  if (!valid) {
    await env.DB.prepare(
      "INSERT INTO chat_admin_login_limits(client_hash,window_start,failures) VALUES(?,?,1) ON CONFLICT(client_hash) DO UPDATE SET failures=CASE WHEN window_start<? THEN 1 ELSE failures+1 END,window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END"
    ).bind(client, now, now - ATTEMPT_WINDOW, now - ATTEMPT_WINDOW).run();
    return reply3({ error: "Credencial no v\xE1lida" }, 401);
  }
  await env.DB.prepare("DELETE FROM chat_admin_login_limits WHERE client_hash=?").bind(client).run();
  const token = opaque(), expiresAt = now + SESSION_DURATION;
  await env.DB.prepare("INSERT INTO chat_admin_sessions(token_hash,created_at,expires_at) VALUES(?,?,?)").bind(await hash(token), now, expiresAt).run();
  try {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM chat_admin_sessions WHERE expires_at<=? OR revoked_at IS NOT NULL").bind(now),
      env.DB.prepare("DELETE FROM chat_admin_login_limits WHERE window_start<?").bind(now - 24 * HOUR)
    ]);
  } catch {
  }
  return reply3({ token, expiresAt: new Date(expiresAt).toISOString(), role: "chat-admin" });
}
__name(handleAdminSessionApi, "handleAdminSessionApi");

// src/member-admin.js
var ID = /^member:(?:[a-z0-9_-]{1,28}|[0-9a-f-]{36})$/i;
function deviceDetails(request) {
  const agent = (request.headers.get("user-agent") || "").slice(0, 800);
  const android = /Android\s*([\d.]+)?/i.exec(agent);
  const reducedAndroid = /Android\s+10\s*;\s*K\s*(?:;|\))/i.test(agent);
  const ios = /(?:CPU(?: iPhone)? OS)\s*([\d_]+)/i.exec(agent);
  const isIpad = /iPad/i.test(agent), isIphone = /iPhone|iPod/i.test(agent);
  const system = android ? reducedAndroid ? "Android (versi\xF3n no disponible)" : "Android" + (android[1] ? " " + android[1] : "") : isIpad || isIphone ? "iOS" + (ios ? " " + ios[1].replace(/_/g, ".") : "") : /Windows NT/i.test(agent) ? "Windows" : /Macintosh|Mac OS X/i.test(agent) ? "macOS" : /Linux/i.test(agent) ? "Linux" : "No identificado";
  let model = null;
  if (android && !reducedAndroid) {
    const hit = /(?:Android\s*[\d.]*;\s*)([^;)]+?)(?:\s+Build\/|\s*\)|;)/i.exec(agent);
    const candidate = hit?.[1]?.trim() || "";
    if (candidate && !/^(?:K|[a-z]{2}-[a-z]{2}|wv|mobile|u|linux)$/i.test(candidate))
      model = candidate.slice(0, 100);
  }
  const deviceName = isIpad ? "iPad" : isIphone ? "iPhone" : android ? "Tel\xE9fono Android" : /Windows NT|Macintosh|Linux/i.test(agent) ? "Computadora" : "Dispositivo no identificado";
  const origin = request.headers.get("origin") || "";
  const platform = origin === "https://havana-nice-v2-dev.pages.dev" ? "PWA" : /ReactNative|okhttp|Expo/i.test(agent) ? "Android nativo" : origin ? "Navegador web" : "Cliente no identificado";
  return { platform, operatingSystem: system.slice(0, 80), deviceName, model };
}
__name(deviceDetails, "deviceDetails");
async function recordMemberEvent(env, actorId, eventType, request, details = null) {
  if (!ID.test(actorId) || !["login", "connect", "disconnect"].includes(eventType)) return;
  const meta = details || deviceDetails(request);
  await env.DB.prepare(
    "INSERT INTO chat_access_events(id,actor_id,event_type,occurred_at,platform,operating_system,device_name,device_model) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM chat_members WHERE actor_id=?)"
  ).bind(
    crypto.randomUUID(),
    actorId,
    eventType,
    Date.now(),
    meta.platform,
    meta.operatingSystem,
    meta.deviceName,
    meta.model,
    actorId
  ).run();
}
__name(recordMemberEvent, "recordMemberEvent");
function readMemberDevice(request) {
  return deviceDetails(request);
}
__name(readMemberDevice, "readMemberDevice");
async function memberDeletionImpact(env, actorId) {
  const row = await env.DB.prepare(
    "SELECT (SELECT COUNT(*) FROM chat_sessions WHERE actor_id=?) AS sessions,(SELECT COUNT(*) FROM chat_messages WHERE sender_id=?) AS messages,(SELECT COUNT(*) FROM chat_reactions WHERE actor_id=? OR message_seq IN (SELECT seq FROM chat_messages WHERE sender_id=?)) AS reactions,(SELECT COUNT(*) FROM chat_read_receipts WHERE actor_id=?) AS receipts,(SELECT COUNT(*) FROM chat_access_events WHERE actor_id=?) AS historyEvents"
  ).bind(actorId, actorId, actorId, actorId, actorId, actorId).first();
  const counts = {};
  for (const key of ["sessions", "messages", "reactions", "receipts", "historyEvents"])
    counts[key] = Math.max(0, Number(row?.[key] || 0));
  return counts;
}
__name(memberDeletionImpact, "memberDeletionImpact");
function reply(respond2, origin, body, status = 200) {
  return respond2(body, status, origin);
}
__name(reply, "reply");
async function handleAdminMemberManagement(request, env, url, origin, respond2, ROOM4) {
  if (!await verifyAdminSession(request, env))
    return reply(respond2, origin, { error: "No autorizado" }, 401);
  if (url.pathname === "/api/chat/admin/member-history" && request.method === "GET") {
    const actorId2 = url.searchParams.get("actorId") || "";
    if (!ID.test(actorId2)) return reply(respond2, origin, { error: "Miembro inv\xE1lido" }, 400);
    const member2 = await env.DB.prepare("SELECT actor_id FROM chat_members WHERE actor_id=?").bind(actorId2).first();
    if (!member2) return reply(respond2, origin, { error: "Miembro no encontrado" }, 404);
    const [counts, events] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS entries FROM chat_access_events WHERE actor_id=? AND event_type='login'").bind(actorId2).first(),
      env.DB.prepare(
        "SELECT event_type,occurred_at,platform,CASE WHEN device_model='K' AND operating_system='Android 10' THEN 'Android (versi\xF3n no disponible)' ELSE operating_system END AS operating_system,device_name,CASE WHEN device_model='K' THEN NULL ELSE device_model END AS device_model FROM chat_access_events WHERE actor_id=? ORDER BY occurred_at DESC LIMIT 100"
      ).bind(actorId2).all()
    ]);
    return reply(respond2, origin, {
      entries: Number(counts?.entries || 0),
      events: events.results || [],
      since: "Solo desde la activaci\xF3n del historial; no se inventan registros anteriores."
    });
  }
  if (url.pathname === "/api/chat/admin/member-delete-preview" && request.method === "GET") {
    const actorId2 = url.searchParams.get("actorId") || "";
    if (!ID.test(actorId2)) return reply(respond2, origin, { error: "Miembro inv\xE1lido" }, 400);
    const member2 = await env.DB.prepare("SELECT actor_id,display_name FROM chat_members WHERE actor_id=?").bind(actorId2).first();
    if (!member2) return reply(respond2, origin, { error: "Miembro no encontrado" }, 404);
    const counts = await memberDeletionImpact(env, actorId2);
    return reply(respond2, origin, { displayName: member2.display_name, counts, canDelete: true });
  }
  if (url.pathname !== "/api/chat/admin/remove-member" || request.method !== "POST")
    return reply(respond2, origin, { error: "Ruta no v\xE1lida" }, 404);
  let payload;
  try {
    payload = await request.json();
  } catch {
    return reply(respond2, origin, { error: "Solicitud inv\xE1lida" }, 400);
  }
  const actorId = payload?.actorId, confirmName = payload?.confirmName;
  if (typeof actorId !== "string" || !ID.test(actorId) || typeof confirmName !== "string")
    return reply(respond2, origin, { error: "Confirmaci\xF3n inv\xE1lida" }, 400);
  const member = await env.DB.prepare(
    "SELECT actor_id,display_name FROM chat_members WHERE actor_id=?"
  ).bind(actorId).first();
  if (!member) return reply(respond2, origin, { error: "Miembro no encontrado" }, 404);
  if (member.display_name !== confirmName) return reply(respond2, origin, {
    error: "El nombre de confirmaci\xF3n no coincide."
  }, 409);
  const queries = [
    env.DB.prepare("UPDATE chat_messages SET reply_to_seq=NULL WHERE reply_to_seq IN (SELECT seq FROM chat_messages WHERE sender_id=?)").bind(actorId),
    env.DB.prepare("DELETE FROM chat_reactions WHERE message_seq IN (SELECT seq FROM chat_messages WHERE sender_id=?)").bind(actorId),
    env.DB.prepare("DELETE FROM chat_reactions WHERE actor_id=?").bind(actorId),
    env.DB.prepare("DELETE FROM chat_messages WHERE sender_id=?").bind(actorId),
    env.DB.prepare("DELETE FROM chat_read_receipts WHERE actor_id=?").bind(actorId),
    env.DB.prepare("DELETE FROM chat_sessions WHERE actor_id=?").bind(actorId),
    env.DB.prepare("DELETE FROM chat_access_events WHERE actor_id=?").bind(actorId),
    env.DB.prepare("DELETE FROM chat_duplicate_login_alerts WHERE actor_id=?").bind(actorId),
    env.DB.prepare("DELETE FROM chat_single_device_owners WHERE actor_id=?").bind(actorId),
    env.DB.prepare("DELETE FROM chat_members WHERE actor_id=? AND display_name=?").bind(actorId, confirmName)
  ];
  const result = await env.DB.batch(queries);
  if (Number(result.at(-1)?.meta?.changes) !== 1)
    return reply(respond2, origin, { error: "No se pudo confirmar la eliminaci\xF3n" }, 409);
  try {
    await env.CHAT_ROOMS.get(env.CHAT_ROOMS.idFromName(ROOM4)).fetch(
      "https://internal/member-removed",
      { method: "POST", body: JSON.stringify({ actorId }) }
    );
  } catch {
  }
  await notifyAdminClients(env, "members");
  return reply(respond2, origin, { ok: true, deleted: true });
}
__name(handleAdminMemberManagement, "handleAdminMemberManagement");

// src/message-removal.js
async function deleteChatMessageRecord(env, seq) {
  if (!Number.isSafeInteger(seq) || seq <= 0) throw new Error("Invalid message sequence");
  const row = await env.DB.prepare("SELECT seq FROM chat_messages WHERE seq=?").bind(seq).first();
  if (!row) return false;
  await env.DB.batch([
    env.DB.prepare("UPDATE chat_messages SET reply_to_seq=NULL WHERE reply_to_seq=?").bind(seq),
    env.DB.prepare("DELETE FROM chat_reactions WHERE message_seq=?").bind(seq),
    env.DB.prepare("DELETE FROM chat_messages WHERE seq=?").bind(seq)
  ]);
  const check = await env.DB.prepare("SELECT seq FROM chat_messages WHERE seq=?").bind(seq).first();
  if (check) throw new Error("Deletion not confirmed");
  return true;
}
__name(deleteChatMessageRecord, "deleteChatMessageRecord");

// src/admin-chat.js
var MAX_HISTORY = 100;
var ROOM = "main-chat-v2";
var COLUMNS = "seq,client_message_id,sender_id,sender_name,body,created_at,reply_to_seq,edited_at,deleted_at";
function mapped(row) {
  return {
    seq: row.seq,
    clientMessageId: row.client_message_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    text: row.body,
    sentAt: row.created_at,
    replyToSeq: row.reply_to_seq ?? null,
    editedAt: row.edited_at ?? null,
    deletedAt: null
  };
}
__name(mapped, "mapped");
async function handleAdminChat(request, env, url, origin, respond2) {
  const reply3 = /* @__PURE__ */ __name((data, status = 200) => respond2(data, status, origin), "reply");
  if (!await verifyAdminSession(request, env)) return reply3({ error: "No autorizado" }, 401);
  if (url.pathname === "/api/chat/admin/messages" && request.method === "GET") {
    const raw = url.searchParams.get("beforeSeq"), before = raw === null ? null : Number(raw);
    if (before !== null && (!Number.isSafeInteger(before) || before < 1)) return reply3({ error: "Cursor inv\xE1lido" }, 400);
    const query = before === null ? env.DB.prepare("SELECT " + COLUMNS + " FROM chat_messages WHERE deleted_at IS NULL ORDER BY seq DESC LIMIT ?").bind(MAX_HISTORY) : env.DB.prepare("SELECT " + COLUMNS + " FROM chat_messages WHERE seq<? AND deleted_at IS NULL ORDER BY seq DESC LIMIT ?").bind(before, MAX_HISTORY);
    const rows = (await query.all()).results || [], ids = rows.map((x) => x.seq);
    let reactions = [];
    if (ids.length) {
      const query2 = await env.DB.prepare("SELECT message_seq,actor_id,emoji FROM chat_reactions WHERE message_seq IN (" + ids.map(() => "?").join(",") + ")").bind(...ids).all();
      reactions = (query2.results || []).map((x) => ({ messageSeq: x.message_seq, actorId: x.actor_id, emoji: x.emoji }));
    }
    return reply3({ messages: rows.reverse().map(mapped), reactions, hasMore: rows.length === MAX_HISTORY });
  }
  const match = /^\/api\/chat\/admin\/messages\/(\d+)$/.exec(url.pathname);
  if (!match || request.method !== "DELETE") return reply3({ error: "Ruta no v\xE1lida" }, 404);
  const seq = Number(match[1]);
  if (!Number.isSafeInteger(seq) || seq < 1) return reply3({ error: "Mensaje inv\xE1lido" }, 400);
  const deleted = await deleteChatMessageRecord(env, seq);
  if (!deleted) return reply3({ error: "Mensaje no encontrado" }, 404);
  try {
    await env.CHAT_ROOMS.get(env.CHAT_ROOMS.idFromName(ROOM)).fetch(
      "https://internal/admin-chat-message-deleted",
      { method: "POST", body: JSON.stringify({ seq }) }
    );
  } catch {
  }
  return reply3({ ok: true, seq });
}
__name(handleAdminChat, "handleAdminChat");

// src/single-installation.js
var ID2 = /^member:[a-z0-9_-]{1,40}$/i;
var ROOM2 = "main-chat-v2";
function reply2(respond2, origin, body, status = 200) {
  return respond2(body, status, origin);
}
__name(reply2, "reply");
async function claimFirstInstallation(env, member, tokenHash, expiry) {
  const rows = await env.DB.batch([
    env.DB.prepare(
      "INSERT OR IGNORE INTO chat_single_device_owners(actor_id,token_hash,linked_at) VALUES(?,?,?)"
    ).bind(member.actor_id, tokenHash, Date.now()),
    env.DB.prepare(
      "INSERT INTO chat_sessions(token_hash,actor_id,display_name,expires_at) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM chat_single_device_owners WHERE actor_id=? AND token_hash=?)"
    ).bind(tokenHash, member.actor_id, member.display_name, expiry, member.actor_id, tokenHash)
  ]);
  return Number(rows[1]?.meta?.changes) === 1;
}
__name(claimFirstInstallation, "claimFirstInstallation");
async function auditDuplicateInstallation(env, actorId, request) {
  try {
    const meta = readMemberDevice(request), now = Date.now();
    const r = await env.DB.prepare(
      "INSERT INTO chat_duplicate_login_alerts(id,actor_id,attempted_at,platform,operating_system,device_name) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM chat_duplicate_login_alerts WHERE actor_id=? AND attempted_at>?)<20"
    ).bind(
      crypto.randomUUID(),
      actorId,
      now,
      meta.platform,
      meta.operatingSystem,
      meta.deviceName,
      actorId,
      now - 864e5
    ).run();
    if (Number(r.meta?.changes) > 0) await notifyAdminClients(env, "members");
  } catch {
  }
}
__name(auditDuplicateInstallation, "auditDuplicateInstallation");
async function handleSingleInstallationAdmin(request, env, url, origin, respond2) {
  if (!await verifyAdminSession(request, env))
    return reply2(respond2, origin, { error: "No autorizado" }, 401);
  if (url.pathname === "/api/chat/admin/duplicate-logins" && request.method === "GET") {
    const result = await env.DB.prepare(
      "SELECT a.id,a.actor_id,m.display_name,a.attempted_at,a.platform,a.operating_system,a.device_name,a.reviewed_at FROM chat_duplicate_login_alerts a JOIN chat_members m ON m.actor_id=a.actor_id ORDER BY a.attempted_at DESC LIMIT 60"
    ).all();
    return reply2(respond2, origin, { alerts: result.results || [] });
  }
  if (url.pathname === "/api/chat/admin/duplicate-logins/review" && request.method === "POST") {
    let body = null;
    try {
      body = await request.json();
    } catch {
    }
    if (typeof body?.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id))
      return reply2(respond2, origin, { error: "Alerta inv\xE1lida" }, 400);
    await env.DB.prepare(
      "UPDATE chat_duplicate_login_alerts SET reviewed_at=? WHERE id=? AND reviewed_at IS NULL"
    ).bind(Date.now(), body.id).run();
    await notifyAdminClients(env, "members");
    return reply2(respond2, origin, { ok: true });
  }
  if (url.pathname === "/api/chat/admin/release-installation" && request.method === "POST") {
    let body = null;
    try {
      body = await request.json();
    } catch {
    }
    if (typeof body?.actorId !== "string" || !ID2.test(body.actorId) || typeof body?.confirmName !== "string")
      return reply2(respond2, origin, { error: "Confirmaci\xF3n inv\xE1lida" }, 400);
    const m = await env.DB.prepare(
      "SELECT actor_id,display_name FROM chat_members WHERE actor_id=? AND active=1"
    ).bind(body.actorId).first();
    if (!m) return reply2(respond2, origin, { error: "Miembro no encontrado" }, 404);
    if (m.display_name !== body.confirmName)
      return reply2(respond2, origin, { error: "El nombre de confirmaci\xF3n no coincide" }, 409);
    const rows = await env.DB.batch([
      env.DB.prepare("DELETE FROM chat_sessions WHERE actor_id=?").bind(body.actorId),
      env.DB.prepare("DELETE FROM chat_single_device_owners WHERE actor_id=?").bind(body.actorId)
    ]);
    try {
      await env.CHAT_ROOMS.get(env.CHAT_ROOMS.idFromName(ROOM2)).fetch(
        "https://internal/installation-released",
        { method: "POST", body: JSON.stringify({ actorId: body.actorId }) }
      );
    } catch {
    }
    await notifyAdminClients(env, "members");
    return reply2(respond2, origin, { ok: true, revokedSessions: Number(rows[0]?.meta?.changes || 0) });
  }
  return reply2(respond2, origin, { error: "Ruta no v\xE1lida" }, 404);
}
__name(handleSingleInstallationAdmin, "handleSingleInstallationAdmin");

// src/calendar.js
var ID3 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var ACTOR_ID = /^member:[a-z0-9_-]{1,64}$/i;
var STATUSES = /* @__PURE__ */ new Set(["tentative", "confirmed", "cancelled"]);
var COLUMNS2 = "e.id,e.event_date,e.time_zone,e.title,e.venue,e.city,e.call_time,e.soundcheck_time,e.arrival_time,e.show_time,e.end_time,e.wardrobe,e.details,e.contact_name,e.contact_phone,e.notes,e.map_url,e.status,e.status_text,e.version,e.updated_at";
var PAGE_SIZE = 100;
var ERR = { 401: "No autorizado", 400: "Solicitud inv\xE1lida", 409: "La fecha cambi\xF3. Actualiza antes de editar." };
function string(value, max, label, required = false) {
  if (typeof value !== "string") throw Error(label + " debe ser texto");
  const text = value.normalize("NFC").trim();
  if (text.length > max || required && !text) throw Error(label + " inv\xE1lido o demasiado largo");
  return text;
}
__name(string, "string");
function optionalSortDate(input) {
  const value = input.trim();
  let y, m, d;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  const local = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(value);
  if (iso) {
    y = Number(iso[1]);
    m = Number(iso[2]);
    d = Number(iso[3]);
  } else if (local) {
    y = Number(local[3]);
    m = Number(local[2]);
    d = Number(local[1]);
  } else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return String(y).padStart(4, "0") + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
}
__name(optionalSortDate, "optionalSortDate");
function time(value) {
  return string(value ?? "", 60, "Hora");
}
__name(time, "time");
function fields(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("Evento inv\xE1lido");
  const date = string(input.date ?? "", 160, "Fecha");
  const timeZone = string(input.timeZone ?? "America/Mexico_City", 64, "Zona horaria", true);
  try {
    new Intl.DateTimeFormat("en", { timeZone });
  } catch {
    throw Error("Zona horaria inv\xE1lida");
  }
  const status = input.status ?? "confirmed";
  if (!STATUSES.has(status)) throw Error("Estado inv\xE1lido");
  const mapUrl = string(input.mapUrl ?? "", 1500, "Google Maps");
  const recipients = input.recipientIds;
  if (!Array.isArray(recipients) || recipients.length === 0 || recipients.length > 100)
    throw Error("Selecciona al menos un m\xFAsico destinatario");
  if (!recipients.every((id) => typeof id === "string" && ACTOR_ID.test(id)) || new Set(recipients).size !== recipients.length) throw Error("Destinatarios inv\xE1lidos");
  return {
    date,
    dateSort: optionalSortDate(date),
    timeZone,
    title: string(input.title, 160, "Evento", true),
    venue: string(input.venue ?? "", 160, "Lugar"),
    city: string(input.city ?? "", 120, "Ciudad"),
    callTime: time(input.callTime),
    soundcheckTime: time(input.soundcheckTime),
    arrivalTime: time(input.arrivalTime),
    showTime: time(input.showTime),
    endTime: time(input.endTime),
    wardrobe: string(input.wardrobe ?? "", 500, "Vestuario"),
    details: string(input.details ?? "", 4e3, "Detalles"),
    contactName: string(input.contactName ?? "", 160, "Contacto"),
    contactPhone: string(input.contactPhone ?? "", 80, "Tel\xE9fono"),
    notes: string(input.notes ?? "", 4e3, "Notas"),
    mapUrl,
    status,
    statusText: string(input.statusText ?? "", 160, "Estado"),
    recipientIds: recipients
  };
}
__name(fields, "fields");
var valueList = /* @__PURE__ */ __name((x) => [
  x.date,
  x.timeZone,
  x.title,
  x.venue,
  x.city,
  x.callTime,
  x.soundcheckTime,
  x.arrivalTime,
  x.showTime,
  x.endTime,
  x.wardrobe,
  x.details,
  x.contactName,
  x.contactPhone,
  x.notes,
  x.mapUrl,
  x.status,
  x.dateSort,
  x.statusText
], "valueList");
function event(row, admin = false) {
  const result = {
    id: row.id,
    date: row.event_date,
    timeZone: row.time_zone,
    title: row.title,
    venue: row.venue,
    city: row.city,
    callTime: row.call_time,
    soundcheckTime: row.soundcheck_time,
    arrivalTime: row.arrival_time,
    showTime: row.show_time,
    endTime: row.end_time,
    wardrobe: row.wardrobe,
    details: row.details,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    notes: row.notes,
    mapUrl: row.map_url,
    status: row.status,
    statusText: row.status_text || "",
    version: row.version,
    updatedAt: row.updated_at
  };
  if (admin) result.recipientIds = JSON.parse(row.recipients_json || "[]");
  return result;
}
__name(event, "event");
async function bodyOf(request) {
  if ((request.headers.get("content-type") || "").split(";")[0].trim() !== "application/json")
    throw Error("Se requiere JSON");
  if (Number(request.headers.get("content-length") || 0) > 2e4) throw Error("Solicitud demasiado grande");
  const text = await request.text();
  if (text.length > 2e4) throw Error("Solicitud demasiado grande");
  try {
    return JSON.parse(text);
  } catch {
    throw Error("JSON inv\xE1lido");
  }
}
__name(bodyOf, "bodyOf");
async function authorizedRecipients(db, ids) {
  const placeholders = ids.map(() => "?").join(",");
  const data = await db.prepare("SELECT actor_id FROM chat_members WHERE active=1 AND actor_id IN (" + placeholders + ")").bind(...ids).all();
  if ((data.results || []).length !== ids.length) throw Error("Seleccionaste un m\xFAsico que ya no est\xE1 activo. Actualiza la lista.");
}
__name(authorizedRecipients, "authorizedRecipients");
function invalid(error, reply3) {
  return reply3({ error: error instanceof Error ? error.message : "Solicitud inv\xE1lida" }, 400);
}
__name(invalid, "invalid");
async function handleCalendarApi(request, env, url, origin, respond2, verifyMusicianSession) {
  const reply3 = /* @__PURE__ */ __name((body, status = 200) => respond2(body, status, origin), "reply");
  const path = url.pathname;
  const admin = path.startsWith("/api/calendar/admin/");
  let member = null;
  if (admin) {
    if (!await verifyAdminSession(request, env)) return reply3({ error: ERR[401] }, 401);
  } else {
    const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    member = await verifyMusicianSession(env, token);
    if (!member) return reply3({ error: ERR[401] }, 401);
  }
  if ((path === "/api/calendar/events" || path === "/api/calendar/admin/events") && request.method === "GET") {
    const offset = Number(url.searchParams.get("offset") || "0");
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1e4) return reply3({ error: "Paginaci\xF3n inv\xE1lida" }, 400);
    const assigned = admin ? "" : " WHERE EXISTS (SELECT 1 FROM calendar_event_recipients r WHERE r.event_id=e.id AND r.actor_id=?)";
    const sql = "SELECT " + COLUMNS2 + (admin ? ",(SELECT json_group_array(actor_id) FROM calendar_event_recipients r WHERE r.event_id=e.id) AS recipients_json" : "") + " FROM calendar_events e" + assigned + " ORDER BY CASE WHEN e.date_sort IS NULL THEN 1 ELSE 0 END,e.date_sort ASC,e.event_date ASC,e.id ASC LIMIT ? OFFSET ?";
    try {
      const args = admin ? [PAGE_SIZE + 1, offset] : [member.actorId, PAGE_SIZE + 1, offset];
      const result = await env.DB.prepare(sql).bind(...args).all();
      const rows = result.results || [];
      return reply3({ events: rows.slice(0, PAGE_SIZE).map((x) => event(x, admin)), hasMore: rows.length > PAGE_SIZE });
    } catch {
      return reply3({ error: "Calendario no disponible" }, 503);
    }
  }
  if (!admin) return reply3({ error: "Ruta no encontrada" }, 404);
  if (path === "/api/calendar/admin/events" && request.method === "POST") {
    let payload;
    try {
      payload = fields(await bodyOf(request));
      await authorizedRecipients(env.DB, payload.recipientIds);
    } catch (e) {
      return invalid(e, reply3);
    }
    const id2 = crypto.randomUUID(), revision = crypto.randomUUID(), now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      const statements = [
        env.DB.prepare("INSERT INTO calendar_events(id,event_date,time_zone,title,venue,city,call_time,soundcheck_time,arrival_time,show_time,end_time,wardrobe,details,contact_name,contact_phone,notes,map_url,status,date_sort,status_text,version,revision_token,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?)").bind(id2, ...valueList(payload), revision, now, now),
        ...payload.recipientIds.map((actorId) => env.DB.prepare(
          "INSERT INTO calendar_event_recipients(event_id,actor_id) VALUES (?,?)"
        ).bind(id2, actorId))
      ];
      await env.DB.batch(statements);
      return reply3({ event: { id: id2, ...payload, version: 1, updatedAt: now } }, 201);
    } catch {
      return reply3({ error: "No se pudo crear la fecha" }, 503);
    }
  }
  const match = /^\/api\/calendar\/admin\/events\/([0-9a-f-]+)$/.exec(path);
  if (!match || !ID3.test(match[1])) return reply3({ error: "Ruta no encontrada" }, 404);
  const id = match[1];
  if (request.method === "POST") {
    let raw, payload;
    try {
      raw = await bodyOf(request);
      if (!Number.isSafeInteger(raw?.version) || raw.version < 1) throw Error("Versi\xF3n inv\xE1lida");
      payload = fields(raw);
      await authorizedRecipients(env.DB, payload.recipientIds);
    } catch (e) {
      return invalid(e, reply3);
    }
    const revision = crypto.randomUUID(), now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      const update = env.DB.prepare("UPDATE calendar_events SET event_date=?,time_zone=?,title=?,venue=?,city=?,call_time=?,soundcheck_time=?,arrival_time=?,show_time=?,end_time=?,wardrobe=?,details=?,contact_name=?,contact_phone=?,notes=?,map_url=?,status=?,date_sort=?,status_text=?,version=version+1,revision_token=?,updated_at=? WHERE id=? AND version=?").bind(...valueList(payload), revision, now, id, raw.version);
      const exists = "EXISTS (SELECT 1 FROM calendar_events WHERE id=? AND revision_token=?)";
      const replaceRecipients = [
        env.DB.prepare("DELETE FROM calendar_event_recipients WHERE event_id=? AND " + exists).bind(id, id, revision),
        ...payload.recipientIds.map((actorId) => env.DB.prepare(
          "INSERT INTO calendar_event_recipients(event_id,actor_id) SELECT ?,? WHERE " + exists
        ).bind(id, actorId, id, revision))
      ];
      const results = await env.DB.batch([update, ...replaceRecipients]);
      if (Number(results[0]?.meta?.changes) !== 1) return reply3({ error: ERR[409] }, 409);
      return reply3({ event: { id, ...payload, version: raw.version + 1, updatedAt: now } });
    } catch {
      return reply3({ error: "No se pudo guardar la fecha" }, 503);
    }
  }
  if (request.method === "DELETE") {
    let raw;
    try {
      raw = await bodyOf(request);
      if (!Number.isSafeInteger(raw?.version) || raw.version < 1) throw Error("Versi\xF3n inv\xE1lida");
    } catch (e) {
      return invalid(e, reply3);
    }
    try {
      const result = await env.DB.prepare("DELETE FROM calendar_events WHERE id=? AND version=?").bind(id, raw.version).run();
      if (Number(result.meta?.changes) !== 1) return reply3({ error: ERR[409] }, 409);
      return reply3({ ok: true });
    } catch {
      return reply3({ error: "No se pudo eliminar la fecha" }, 503);
    }
  }
  return reply3({ error: "M\xE9todo no permitido" }, 405);
}
__name(handleCalendarApi, "handleCalendarApi");

// src/index.ts
var encoder2 = new TextEncoder();
var decoder = new TextDecoder();
var ROOM3 = "main-chat-v2";
var MAX_TEXT = 2e3;
var MAX_HISTORY2 = 100;
var CHAT_EDIT_WINDOW_MS = 15 * 60 * 1e3;
function respond(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), { status, headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": origin || "https://havana-nice-v2-dev.pages.dev",
    "vary": "Origin"
  } });
}
__name(respond, "respond");
function trustedOrigin(origin) {
  if (!origin) return "";
  try {
    const url = new URL(origin);
    if (url.protocol === "https:" && (url.hostname === "havana-nice-v2-dev.pages.dev" || url.hostname.endsWith(".havana-nice-v2-dev.pages.dev"))) return origin;
    if (url.protocol === "https:" && url.hostname === "havana-nice-v2-dev.soloaplicaciones97.workers.dev") return origin;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return origin;
  } catch {
  }
  return "";
}
__name(trustedOrigin, "trustedOrigin");
function b64(bytes) {
  return btoa(String.fromCharCode(...bytes)).split("+").join("-").split("/").join("_").replace(/=+$/, "");
}
__name(b64, "b64");
async function sha256(value) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", encoder2.encode(value)))].map((x) => x.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
var MEMBER_SESSION_EXPIRY = Date.UTC(2100, 0, 1);
function normalizeMusicianName(value) {
  if (typeof value !== "string") return "";
  const name = value.trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ");
  return /^[a-z][a-z0-9 _-]{0,27}$/.test(name) ? name : "";
}
__name(normalizeMusicianName, "normalizeMusicianName");
async function createSession(env, member, request) {
  const token = b64(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256(token);
  const claimed = await claimFirstInstallation(env, member, tokenHash, MEMBER_SESSION_EXPIRY);
  if (!claimed) {
    await auditDuplicateInstallation(env, member.actor_id, request);
    return null;
  }
  await recordMemberEvent(env, member.actor_id, "login", request).catch(() => {
  });
  return { token, actorId: member.actor_id, displayName: member.display_name, expiresAt: new Date(MEMBER_SESSION_EXPIRY).toISOString() };
}
__name(createSession, "createSession");
async function verifySession(env, token) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{40,100}$/.test(token)) return null;
  try {
    const row = await env.DB.prepare(
      "SELECT s.actor_id, m.display_name, s.expires_at FROM chat_sessions s JOIN chat_members m ON m.actor_id=s.actor_id AND m.active=1 WHERE s.token_hash=? AND EXISTS (SELECT 1 FROM chat_single_device_owners owner WHERE owner.actor_id=m.actor_id AND owner.token_hash=s.token_hash)"
    ).bind(await sha256(token)).first();
    if (!row || !Number.isFinite(row.expires_at) || row.expires_at <= Date.now()) return null;
    return { actorId: row.actor_id, displayName: row.display_name, exp: row.expires_at };
  } catch {
    return null;
  }
}
__name(verifySession, "verifySession");
function websocketSessionToken(request) {
  const protocols = request.headers.get("sec-websocket-protocol") || "";
  const offered = protocols.split(",").map((s) => s.trim());
  const browserToken = offered.find((s) => s.startsWith("session."));
  if (browserToken) return browserToken.slice(8);
  const auth = request.headers.get("authorization") || "";
  const match = /^Bearer ([A-Za-z0-9_-]{40,100})$/i.exec(auth);
  return match?.[1] || "";
}
__name(websocketSessionToken, "websocketSessionToken");
function mapMessage(row) {
  return { seq: row.seq, clientMessageId: row.client_message_id, senderId: row.sender_id, senderName: row.sender_name, text: row.deleted_at ? "" : row.body, sentAt: row.created_at, replyToSeq: row.reply_to_seq ?? null, editedAt: row.edited_at ?? null, deletedAt: row.deleted_at ?? null };
}
__name(mapMessage, "mapMessage");
var ChatRoom = class {
  static {
    __name(this, "ChatRoom");
  }
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sockets = /* @__PURE__ */ new Set();
    this.members = /* @__PURE__ */ new Map();
    this.typingSent = /* @__PURE__ */ new Map();
    this.adminSockets = /* @__PURE__ */ new Map();
  }
  async fetch(request) {
    if (new URL(request.url).pathname === "/health") return Response.json({ ok: true, durableObject: "ChatRoom", environment: this.env.HAVANA_ENV || "development" });
    if (new URL(request.url).pathname === "/member-removed" && request.method === "POST") {
      let data = null;
      try {
        data = await request.json();
      } catch {
      }
      if (typeof data?.actorId !== "string" || !/^member:[a-z0-9_-]{1,40}$/i.test(data.actorId))
        return respond({ error: "Invalid member" }, 400);
      for (const [socket, member] of this.members.entries()) {
        if (member.actorId !== data.actorId) continue;
        this.send(socket, { type: "chat.revoked", error: "Tu acceso fue eliminado por el Administrador" });
        try {
          socket.close(4003, "Member removed");
        } catch {
        }
        this.sockets.delete(socket);
        this.members.delete(socket);
        this.typingSent.delete(socket);
      }
      this.broadcast({ type: "chat.presence", users: this.onlineUsers() });
      await this.invalidateAdmins("members");
      return respond({ ok: true }, 200);
    }
    if (new URL(request.url).pathname === "/installation-released" && request.method === "POST") {
      let data = null;
      try {
        data = await request.json();
      } catch {
      }
      if (typeof data?.actorId !== "string" || !/^member:[a-z0-9_-]{1,40}$/i.test(data.actorId))
        return respond({ error: "Invalid member" }, 400);
      for (const [socket, member] of this.members.entries()) {
        if (member.actorId !== data.actorId) continue;
        this.send(socket, { type: "chat.revoked", error: "El Administrador liber\xF3 este dispositivo" });
        try {
          socket.close(4003, "Installation released");
        } catch {
        }
        this.sockets.delete(socket);
        this.members.delete(socket);
        this.typingSent.delete(socket);
      }
      this.broadcast({ type: "chat.presence", users: this.onlineUsers() });
      return respond({ ok: true });
    }
    if (new URL(request.url).pathname === "/admin-chat-message-deleted" && request.method === "POST") {
      let data = null;
      try {
        data = await request.json();
      } catch {
      }
      if (typeof data?.seq !== "number" || !Number.isSafeInteger(data.seq) || data.seq <= 0) return respond({ error: "Invalid message" }, 400);
      const row = await this.env.DB.prepare("SELECT seq FROM chat_messages WHERE seq=?").bind(data.seq).first();
      if (row) return respond({ error: "Message still exists" }, 409);
      this.broadcast({ type: "chat.deleted", seq: data.seq });
      return respond({ ok: true });
    }
    if (new URL(request.url).pathname === "/admin-invalidate" && request.method === "POST") {
      let event2 = null;
      try {
        event2 = await request.json();
      } catch {
      }
      if (typeof event2?.topic !== "string" || !["requests", "members"].includes(event2.topic)) return respond({ error: "Invalid topic" }, 400);
      await this.invalidateAdmins(event2.topic);
      return respond({ ok: true }, 200);
    }
    if (new URL(request.url).pathname === "/ws/admin") {
      if ((request.headers.get("upgrade") || "").toLowerCase() !== "websocket")
        return respond({ error: "WebSocket required" }, 426);
      const token = adminSocketToken(request);
      if (!token || !await verifyAdminSession(adminTokenRequest(token), this.env))
        return respond({ error: "Unauthorized" }, 401);
      const pair2 = new WebSocketPair();
      const client2 = pair2[0], server2 = pair2[1];
      server2.accept();
      this.adminSockets.set(server2, token);
      this.send(server2, { type: "admin.ready" });
      this.send(server2, { type: "admin.chat.presence", users: this.onlineUsers() });
      const cleanup2 = /* @__PURE__ */ __name(() => this.adminSockets.delete(server2), "cleanup");
      server2.addEventListener("close", cleanup2);
      server2.addEventListener("error", cleanup2);
      return new Response(null, {
        status: 101,
        webSocket: client2,
        headers: { "Sec-WebSocket-Protocol": "havana-v2-admin" }
      });
    }
    if ((request.headers.get("upgrade") || "").toLowerCase() !== "websocket") return respond({ error: "WebSocket required" }, 426);
    const session = await verifySession(this.env, websocketSessionToken(request));
    if (!session) return respond({ error: "Unauthorized" }, 401);
    const actorId = session.actorId;
    const name = session.displayName;
    const enrollmentToken = websocketSessionToken(request);
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    server.accept();
    this.sockets.add(server);
    this.members.set(server, { actorId, name, enrollmentToken });
    const deviceDetails2 = readMemberDevice(request);
    await recordMemberEvent(this.env, actorId, "connect", request, deviceDetails2).catch(() => {
    });
    server.send(JSON.stringify({ type: "chat.ready", at: (/* @__PURE__ */ new Date()).toISOString(), users: this.onlineUsers() }));
    this.broadcast({ type: "chat.presence", users: this.onlineUsers() });
    void this.invalidateAdmins("members").catch(() => {
    });
    server.addEventListener("message", (event2) => {
      this.state.waitUntil((async () => {
        const stillAuthorized = await verifySession(this.env, enrollmentToken);
        if (!stillAuthorized) {
          this.send(server, { type: "chat.revoked", error: "Acceso revocado por administrador" });
          server.close(4003, "Access revoked");
          return;
        }
        await this.onMessage(server, actorId, name, event2.data);
      })().catch(() => {
        this.send(server, { type: "chat.error", error: "Delivery failed" });
      }));
    });
    let socketClosed = false;
    const cleanup = /* @__PURE__ */ __name(() => {
      if (socketClosed) return;
      socketClosed = true;
      this.state.waitUntil(recordMemberEvent(this.env, actorId, "disconnect", request, deviceDetails2).catch(() => {
      }));
      this.sockets.delete(server);
      this.members.delete(server);
      this.typingSent.delete(server);
      this.broadcast({ type: "chat.presence", users: this.onlineUsers() });
    }, "cleanup");
    server.addEventListener("close", cleanup);
    server.addEventListener("error", cleanup);
    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: { "Sec-WebSocket-Protocol": "havana-v2" }
    });
  }
  send(socket, data) {
    try {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
    } catch {
    }
  }
  broadcast(data) {
    for (const socket of this.sockets) this.send(socket, data);
    this.broadcastToAdmins(data);
  }
  broadcastToAdmins(data) {
    const types = {
      "chat.message": "admin.chat.message",
      "chat.updated": "admin.chat.updated",
      "chat.deleted": "admin.chat.deleted",
      "chat.reaction": "admin.chat.reaction",
      "chat.presence": "admin.chat.presence",
      "chat.typing": "admin.chat.typing",
      "chat.read": "admin.chat.read"
    };
    const type = types[data.type];
    if (!type) return;
    this.state.waitUntil((async () => {
      for (const [socket, token] of this.adminSockets) {
        if (!await verifyAdminSession(adminTokenRequest(token), this.env)) {
          try {
            socket.close(4003, "Admin session ended");
          } catch {
          }
          this.adminSockets.delete(socket);
          continue;
        }
        this.send(socket, { ...data, type });
      }
    })().catch(() => {
    }));
  }
  async invalidateAdmins(topic) {
    for (const [socket, token] of this.adminSockets) {
      if (!await verifyAdminSession(adminTokenRequest(token), this.env)) {
        try {
          socket.close(4003, "Admin session ended");
        } catch {
        }
        this.adminSockets.delete(socket);
        continue;
      }
      this.send(socket, { type: "admin.invalidate", topic });
    }
  }
  onlineUsers() {
    const users = /* @__PURE__ */ new Map();
    for (const member of this.members.values()) users.set(member.actorId, member.name);
    return [...users.entries()].map(([actorId, displayName]) => ({ actorId, displayName }));
  }
  async onMessage(socket, senderId, senderName, raw) {
    if (typeof raw !== "string" || raw.length > 1e4) return this.send(socket, { type: "chat.error", error: "Invalid message" });
    let input;
    try {
      input = JSON.parse(raw);
    } catch {
      return this.send(socket, { type: "chat.error", error: "Invalid JSON" });
    }
    if (input.type === "chat.typing") {
      const now = Date.now();
      if (typeof input.active !== "boolean" || now - (this.typingSent.get(socket) || 0) < 750) return;
      this.typingSent.set(socket, now);
      const signal = { type: "chat.typing", actorId: senderId, senderName, active: input.active, expiresAt: now + 4e3 };
      for (const other of this.sockets) if (other !== socket) this.send(other, signal);
      this.broadcastToAdmins(signal);
      return;
    }
    if (input.type === "chat.read") {
      if (!Number.isSafeInteger(input.seq) || input.seq < 1) return;
      const cap = await this.env.DB.prepare("SELECT MAX(seq) AS newest FROM chat_messages").first();
      const upto = Math.min(input.seq, Number(cap?.newest || 0));
      if (!upto) return;
      await this.env.DB.prepare(
        "INSERT INTO chat_read_receipts(actor_id,display_name,last_read_seq,updated_at) VALUES(?,?,?,?) ON CONFLICT(actor_id) DO UPDATE SET last_read_seq=MAX(chat_read_receipts.last_read_seq,excluded.last_read_seq), updated_at=excluded.updated_at"
      ).bind(senderId, senderName, upto, (/* @__PURE__ */ new Date()).toISOString()).run();
      this.broadcast({ type: "chat.read", actorId: senderId, displayName: senderName, seq: upto });
      return;
    }
    if (input.type === "chat.edit" || input.type === "chat.delete") {
      if (!Number.isSafeInteger(input.seq) || input.seq <= 0) {
        this.send(socket, { type: "chat.error", error: "Identificador inv\xE1lido" });
        return;
      }
      const own = await this.env.DB.prepare(
        "SELECT seq,sender_id,created_at,deleted_at FROM chat_messages WHERE seq=?"
      ).bind(input.seq).first();
      if (!own || own.sender_id !== senderId || own.deleted_at || Date.now() - Date.parse(own.created_at) > (input.type === "chat.delete" ? 48 * 60 * 60 * 1e3 : CHAT_EDIT_WINDOW_MS) || !Number.isFinite(Date.parse(own.created_at))) {
        this.send(socket, { type: "chat.error", error: "No puedes modificar este mensaje" });
        return;
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (input.type === "chat.edit") {
        if (typeof input.text !== "string" || !input.text.trim() || input.text.trim().length > MAX_TEXT) {
          this.send(socket, { type: "chat.error", error: "Texto inv\xE1lido" });
          return;
        }
        await this.env.DB.prepare(
          "UPDATE chat_messages SET body=?,edited_at=? WHERE seq=? AND sender_id=? AND deleted_at IS NULL"
        ).bind(input.text.trim(), now, input.seq, senderId).run();
      } else {
        if (await deleteChatMessageRecord(this.env, input.seq))
          this.broadcast({ type: "chat.deleted", seq: input.seq });
        return;
      }
      const current = await this.env.DB.prepare(
        "SELECT seq,client_message_id,sender_id,sender_name,body,created_at,reply_to_seq,edited_at,deleted_at FROM chat_messages WHERE seq=?"
      ).bind(input.seq).first();
      if (current) this.broadcast({ type: "chat.updated", message: mapMessage(current) });
      return;
    }
    if (input.type === "chat.react") {
      if (!Number.isSafeInteger(input.messageSeq) || input.messageSeq < 1 || !["\u2764\uFE0F", "\u{1F602}", "\u{1F44D}"].includes(input.emoji)) {
        this.send(socket, { type: "chat.error", error: "Invalid reaction" });
        return;
      }
      const exists = await this.env.DB.prepare("SELECT seq FROM chat_messages WHERE seq = ? AND deleted_at IS NULL").bind(input.messageSeq).first();
      if (!exists) {
        this.send(socket, { type: "chat.error", error: "Message not found" });
        return;
      }
      const current = await this.env.DB.prepare("SELECT actor_id FROM chat_reactions WHERE message_seq=? AND actor_id=? AND emoji=?").bind(input.messageSeq, senderId, input.emoji).first();
      if (current) {
        await this.env.DB.prepare("DELETE FROM chat_reactions WHERE message_seq=? AND actor_id=? AND emoji=?").bind(input.messageSeq, senderId, input.emoji).run();
      } else {
        await this.env.DB.prepare("INSERT OR IGNORE INTO chat_reactions(message_seq,actor_id,emoji,created_at) VALUES (?,?,?,?)").bind(input.messageSeq, senderId, input.emoji, (/* @__PURE__ */ new Date()).toISOString()).run();
      }
      this.broadcast({ type: "chat.reaction", messageSeq: input.messageSeq, actorId: senderId, emoji: input.emoji, active: !current });
      return;
    }
    if (input.type !== "chat.send" || typeof input.clientMessageId !== "string" || !/^[A-Za-z0-9_-]{8,100}$/.test(input.clientMessageId) || typeof input.text !== "string") {
      return this.send(socket, { type: "chat.error", error: "Invalid message format" });
    }
    const text = input.text.trim();
    if (!text || text.length > MAX_TEXT) return this.send(socket, { type: "chat.error", error: "Text length must be 1\u20132000" });
    const reply3 = input.replyToSeq === null || input.replyToSeq === void 0 ? null : input.replyToSeq;
    if (reply3 !== null) {
      if (!Number.isSafeInteger(reply3) || reply3 < 1) {
        this.send(socket, { type: "chat.error", error: "Invalid reply" });
        return;
      }
      const original = await this.env.DB.prepare("SELECT seq FROM chat_messages WHERE seq=? AND deleted_at IS NULL").bind(reply3).first();
      if (!original) {
        this.send(socket, { type: "chat.error", error: "Original message not found" });
        return;
      }
    }
    const result = await this.env.DB.prepare(
      "INSERT OR IGNORE INTO chat_messages (client_message_id, sender_id, sender_name, body, created_at, reply_to_seq) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(input.clientMessageId, senderId, senderName, text, (/* @__PURE__ */ new Date()).toISOString(), reply3).run();
    const row = await this.env.DB.prepare(
      "SELECT seq, client_message_id, sender_id, sender_name, body, created_at, reply_to_seq, edited_at, deleted_at FROM chat_messages WHERE sender_id = ? AND client_message_id = ?"
    ).bind(senderId, input.clientMessageId).first();
    if (!row) throw new Error("Persistence failure");
    const event2 = { type: "chat.message", message: mapMessage(row) };
    if (result.meta?.changes > 0) this.broadcast(event2);
    else this.send(socket, event2);
  }
};
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = trustedOrigin(request.headers.get("origin"));
    if (request.headers.has("origin") && !origin) return respond({ error: "Origin not allowed" }, 403);
    if (request.method === "OPTIONS") return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": origin || "https://havana-nice-v2-dev.pages.dev",
        "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
        "access-control-allow-headers": "Authorization, Content-Type, Range, X-Havana-V2-Offset",
        "access-control-max-age": "3600",
        "vary": "Origin"
      }
    });
    if (url.pathname === "/health") {
      let row = null, database = "error";
      try {
        row = await env.DB.prepare("SELECT value FROM system_meta WHERE key = ?").bind("schema_version").first();
        database = "ok";
      } catch {
      }
      return respond({ ok: database === "ok", app: "havana-nice-v2", environment: env.HAVANA_ENV || "development", database, schemaVersion: row?.value ?? null, realtime: "configured", media: "not-configured", chat: "authorized-members-persistent-device-sessions-realtime" }, database === "ok" ? 200 : 503, origin);
    }
    if (url.pathname.startsWith("/api/calendar/"))
      return handleCalendarApi(request, env, url, origin, respond, verifySession);
    if (url.pathname.startsWith("/api/chat/media/")) {
      const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      const member = await verifySession(env, token);
      if (!member && !await verifyAdminSession(request, env))
        return respond({ error: "No autorizado" }, 401, origin);
      if (url.pathname === "/api/chat/media/status" && request.method === "GET")
        return respond({ enabled: false, maxFilesPerSend: 5 }, 200, origin);
      return respond({ error: "Almacenamiento multimedia no configurado" }, 503, origin);
    }
    if (url.pathname === "/realtime/health") return env.CHAT_ROOMS.get(env.CHAT_ROOMS.idFromName("foundation-health")).fetch("https://internal/health");
    if (url.pathname === "/api/chat/admin/member-history" || url.pathname === "/api/chat/admin/member-delete-preview" || url.pathname === "/api/chat/admin/remove-member") {
      return handleAdminMemberManagement(request, env, url, origin, respond, ROOM3);
    }
    if (url.pathname.startsWith("/api/chat/admin/duplicate-logins") || url.pathname === "/api/chat/admin/release-installation") {
      return handleSingleInstallationAdmin(request, env, url, origin, respond);
    }
    if (url.pathname === "/api/chat/admin/messages" || url.pathname.startsWith("/api/chat/admin/messages/")) {
      return handleAdminChat(request, env, url, origin, respond);
    }
    if (url.pathname === "/api/chat/admin/members") {
      if (request.method !== "GET" && request.method !== "POST") return respond({ error: "M\xE9todo no permitido" }, 405, origin);
      if (!await verifyAdminSession(request, env)) return respond({ error: "No autorizado" }, 401, origin);
      if (request.method === "POST") {
        let payload;
        try {
          payload = await request.json();
        } catch {
          return respond({ error: "Solicitud inv\xE1lida" }, 400, origin);
        }
        const displayName = typeof payload?.displayName === "string" ? payload.displayName.normalize("NFC").trim().replace(/\s+/g, " ") : "";
        const username = normalizeMusicianName(displayName);
        if (!username || displayName.length > 28) return respond({
          error: "Escribe un nombre v\xE1lido de hasta 28 caracteres. Se permiten espacios y acentos."
        }, 400, origin);
        const actorId = "member:" + crypto.randomUUID();
        const created = await env.DB.prepare(
          "INSERT OR IGNORE INTO chat_members(username,actor_id,display_name,active) VALUES(?,?,?,1)"
        ).bind(username, actorId, displayName).run();
        if (Number(created.meta?.changes) !== 1) return respond({ error: "Este nombre ya existe en el Administrador." }, 409, origin);
        await notifyAdminClients(env, "members");
        return respond({ member: { actor_id: actorId, username, display_name: displayName, active: 1, session_count: 0, installation_bound: 0 } }, 201, origin);
      }
      const members = await env.DB.prepare(
        "SELECT m.actor_id,m.display_name,m.username,m.active,MAX(CASE WHEN owner.actor_id IS NOT NULL THEN 1 ELSE 0 END) AS installation_bound,COUNT(s.token_hash) AS session_count FROM chat_members m LEFT JOIN chat_sessions s ON s.actor_id=m.actor_id AND s.expires_at>? LEFT JOIN chat_single_device_owners owner ON owner.actor_id=m.actor_id GROUP BY m.actor_id,m.display_name,m.username,m.active ORDER BY m.display_name"
      ).bind(Date.now()).all();
      return respond({ members: members.results || [] }, 200, origin);
    }
    if (url.pathname.startsWith("/api/chat/admin/auth/")) {
      return handleAdminSessionApi(request, env, url, origin, respond);
    }
    if (url.pathname === "/api/chat/session" && request.method === "POST") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return respond({ error: "Solicitud inv\xE1lida" }, 400, origin);
      }
      const username = normalizeMusicianName(payload?.displayName);
      if (!username) return respond({ error: "Escribe tu nombre para entrar" }, 400, origin);
      const member = await env.DB.prepare(
        "SELECT username,actor_id,display_name FROM chat_members WHERE username=? AND active=1"
      ).bind(username).first();
      if (!member) return respond({ error: "Tu nombre todav\xEDa no est\xE1 autorizado. Solicita acceso al administrador." }, 403, origin);
      const session = await createSession(env, member, request);
      if (!session) return respond({
        code: "name_already_bound",
        error: "Este nombre ya est\xE1 vinculado a otro dispositivo. Se notific\xF3 al Administrador."
      }, 409, origin);
      return respond(session, 200, origin);
    }
    if (url.pathname === "/api/chat/session" && request.method === "GET") {
      const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      const valid = await verifySession(env, token);
      if (!valid) return respond({ error: "Acceso revocado o no autorizado" }, 401, origin);
      return respond({ token, actorId: valid.actorId, displayName: valid.displayName, expiresAt: new Date(valid.exp).toISOString() }, 200, origin);
    }
    if (url.pathname === "/api/chat/messages" && request.method === "GET") {
      const session = await verifySession(env, (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""));
      if (!session) return respond({ error: "Acceso revocado o sesi\xF3n no autorizada" }, 401, origin);
      const before = url.searchParams.get("beforeSeq");
      const earlier = before === null ? null : Number(before);
      if (earlier !== null && (!Number.isSafeInteger(earlier) || earlier < 1)) return respond({ error: "Invalid beforeSeq" }, 400, origin);
      const search = url.searchParams.get("search");
      if (search !== null && (search.trim().length < 2 || search.length > 80)) return respond({ error: "Search must contain 2\u201380 characters" }, 400, origin);
      if (search !== null) {
        const needle = "%" + search.trim().replace(/[\\%_]/g, (x) => "\\" + x) + "%";
        const result = await env.DB.prepare(
          "SELECT seq,client_message_id,sender_id,sender_name,body,created_at,reply_to_seq,edited_at,deleted_at FROM chat_messages WHERE deleted_at IS NULL AND body LIKE ? ESCAPE '\\' ORDER BY seq DESC LIMIT 60"
        ).bind(needle).all();
        return respond({ messages: (result.results || []).map(mapMessage).reverse(), hasMore: false, reactions: [] }, 200, origin);
      }
      const after = url.searchParams.get("afterSeq");
      const seq = after === null ? null : Number(after);
      if (seq !== null && (!Number.isSafeInteger(seq) || seq < 0)) return respond({ error: "Invalid cursor" }, 400, origin);
      if (seq !== null && earlier !== null) return respond({ error: "Incompatible cursors" }, 400, origin);
      const query = earlier !== null ? env.DB.prepare("SELECT seq,client_message_id,sender_id,sender_name,body,created_at,reply_to_seq,edited_at,deleted_at FROM chat_messages WHERE seq < ? AND deleted_at IS NULL ORDER BY seq DESC LIMIT ?").bind(earlier, MAX_HISTORY2) : seq === null ? env.DB.prepare("SELECT seq,client_message_id,sender_id,sender_name,body,created_at,reply_to_seq,edited_at,deleted_at FROM chat_messages WHERE deleted_at IS NULL ORDER BY seq DESC LIMIT ?").bind(MAX_HISTORY2) : env.DB.prepare("SELECT seq,client_message_id,sender_id,sender_name,body,created_at,reply_to_seq,edited_at,deleted_at FROM chat_messages WHERE seq > ? AND deleted_at IS NULL ORDER BY seq ASC LIMIT ?").bind(seq, MAX_HISTORY2);
      const rows = (await query.all()).results || [];
      if (seq === null || earlier !== null) rows.reverse();
      const messageSeqs = rows.map((row) => row.seq);
      let reactions = [];
      if (messageSeqs.length) {
        const placeholders = messageSeqs.map(() => "?").join(",");
        const query2 = await env.DB.prepare("SELECT message_seq, actor_id, emoji FROM chat_reactions WHERE message_seq IN (" + placeholders + ")").bind(...messageSeqs).all();
        reactions = query2.results || [];
      }
      const receipts = await env.DB.prepare("SELECT actor_id,display_name,last_read_seq FROM chat_read_receipts WHERE updated_at > ? LIMIT 100").bind(new Date(Date.now() - 7 * 864e5).toISOString()).all();
      return respond({
        messages: rows.map(mapMessage),
        reactions: reactions.map((r) => ({ messageSeq: r.message_seq, actorId: r.actor_id, emoji: r.emoji })),
        receipts: (receipts.results || []).map((r) => ({ actorId: r.actor_id, displayName: r.display_name, seq: r.last_read_seq })),
        hasMore: rows.length === MAX_HISTORY2
      }, 200, origin);
    }
    if (url.pathname === "/ws/admin") {
      const rawOrigin = request.headers.get("origin");
      if (!rawOrigin || !origin) return respond({ error: "Origin not allowed" }, 403, origin);
      if ((request.headers.get("upgrade") || "").toLowerCase() !== "websocket")
        return respond({ error: "Upgrade required" }, 426, origin);
      const token = adminSocketToken(request);
      if (!token || !await verifyAdminSession(adminTokenRequest(token), env))
        return respond({ error: "No autorizado" }, 401, origin);
      return env.CHAT_ROOMS.get(env.CHAT_ROOMS.idFromName(ROOM3)).fetch(request);
    }
    if (url.pathname === "/ws") {
      const session = await verifySession(env, websocketSessionToken(request));
      if (!session) return respond({ error: "Unauthorized" }, 401, origin);
      if ((request.headers.get("upgrade") || "").toLowerCase() !== "websocket") return respond({ error: "Upgrade required" }, 426, origin);
      return env.CHAT_ROOMS.get(env.CHAT_ROOMS.idFromName(ROOM3)).fetch(request);
    }
    return respond({ error: "Not found" }, 404, origin);
  }
};
export {
  ChatRoom,
  index_default as default
};
//# sourceMappingURL=index.js.map
