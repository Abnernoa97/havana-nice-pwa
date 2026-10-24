// @ts-nocheck
// HAVANA NICE V2 isolated development Worker — Chat 1 laboratory.
// Runtime JS syntax is intentional: Cloudflare's connected API can deploy this
// module directly. The permanent typed auth module will replace lab access.
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const CODE_LENGTH_LIMIT = 256;
const ROOM = 'main-chat-v2';
const MAX_TEXT = 2000;
const MAX_HISTORY = 100;

function respond(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), { status, headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': origin || 'https://havana-nice-v2-dev.pages.dev',
    'vary': 'Origin',
  } });
}
function trustedOrigin(origin) {
  if (!origin) return '';
  try {
    const url = new URL(origin);
    if (url.protocol === 'https:' && (url.hostname === 'havana-nice-v2-dev.pages.dev' || url.hostname.endsWith('.havana-nice-v2-dev.pages.dev'))) return origin;
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return origin;
  } catch {}
  return '';
}
const LAB_CODE_SHA256 = '42edb4d61f92d416df49b91794149fa65e957e1fb5815e11eee9ab9011847a3e';
function b64(bytes) {
  return btoa(String.fromCharCode(...bytes)).split('+').join('-').split('/').join('_').replace(/=+$/, '');
}
function constantEqual(a, b) {
  let result = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return result === 0;
}
async function sha256(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function createSession(env, displayName) {
  const actorId = crypto.randomUUID();
  const token = b64(crypto.getRandomValues(new Uint8Array(32)));
  const exp = Date.now() + 12 * 60 * 60 * 1000;
  await env.DB.prepare('INSERT INTO chat_sessions (token_hash, actor_id, display_name, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), actorId, displayName, exp).run();
  return { token, actorId, displayName, expiresAt: new Date(exp).toISOString() };
}
async function verifySession(env, token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,100}$/.test(token)) return null;
  try {
    const row = await env.DB.prepare(
      'SELECT actor_id, display_name, expires_at FROM chat_sessions WHERE token_hash = ?'
    ).bind(await sha256(token)).first();
    if (!row || !Number.isFinite(row.expires_at) || row.expires_at <= Date.now()) return null;
    return { actorId: row.actor_id, displayName: row.display_name, exp: row.expires_at };
  } catch { return null; }
}
function mapMessage(row) {
  return { seq: row.seq, clientMessageId: row.client_message_id, senderId: row.sender_id, senderName: row.sender_name, text: row.body, sentAt: row.created_at };
}

export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sockets = new Set();
  }
  async fetch(request) {
    if (new URL(request.url).pathname === '/health') return Response.json({ ok: true, durableObject: 'ChatRoom', environment: this.env.HAVANA_ENV || 'development' });
    if ((request.headers.get('upgrade') || '').toLowerCase() !== 'websocket') return respond({ error: 'WebSocket required' }, 426);
    const actorId = request.headers.get('x-havana-actor-id');
    const name = request.headers.get('x-havana-actor-name');
    if (!actorId || !name) return respond({ error: 'Unauthorized' }, 401);
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    server.accept();
    this.sockets.add(server);
    server.send(JSON.stringify({ type: 'chat.ready', at: new Date().toISOString() }));
    server.addEventListener('message', event => {
      this.state.waitUntil(this.onMessage(server, actorId, name, event.data).catch(() => {
        this.send(server, { type: 'chat.error', error: 'Delivery failed' });
      }));
    });
    const cleanup = () => this.sockets.delete(server);
    server.addEventListener('close', cleanup);
    server.addEventListener('error', cleanup);
    return new Response(null, { status: 101, webSocket: client });
  }
  send(socket, data) {
    try { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data)); } catch {}
  }
  broadcast(data) {
    for (const socket of this.sockets) this.send(socket, data);
  }
  async onMessage(socket, senderId, senderName, raw) {
    if (typeof raw !== 'string' || raw.length > 10000) return this.send(socket, { type: 'chat.error', error: 'Invalid message' });
    let input;
    try { input = JSON.parse(raw); } catch { return this.send(socket, { type: 'chat.error', error: 'Invalid JSON' }); }
    if (input.type !== 'chat.send' || typeof input.clientMessageId !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(input.clientMessageId) || typeof input.text !== 'string') {
      return this.send(socket, { type: 'chat.error', error: 'Invalid message format' });
    }
    const text = input.text.trim();
    if (!text || text.length > MAX_TEXT) return this.send(socket, { type: 'chat.error', error: 'Text length must be 1–2000' });
    const result = await this.env.DB.prepare(
      'INSERT OR IGNORE INTO chat_messages (client_message_id, sender_id, sender_name, body, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(input.clientMessageId, senderId, senderName, text, new Date().toISOString()).run();
    const row = await this.env.DB.prepare(
      'SELECT seq, client_message_id, sender_id, sender_name, body, created_at FROM chat_messages WHERE sender_id = ? AND client_message_id = ?'
    ).bind(senderId, input.clientMessageId).first();
    if (!row) throw new Error('Persistence failure');
    const event = { type: 'chat.message', message: mapMessage(row) };
    if (result.meta?.changes > 0) this.broadcast(event);
    else this.send(socket, event);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = trustedOrigin(request.headers.get('origin'));
    if (request.method === 'OPTIONS') return new Response(null, {
      status: 204, headers: { 'access-control-allow-origin': origin || 'https://havana-nice-v2-dev.pages.dev',
        'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'Authorization, Content-Type',
        'access-control-max-age': '3600', 'vary': 'Origin' },
    });
    if (request.headers.has('origin') && !origin) return respond({ error: 'Origin not allowed' }, 403);
    if (url.pathname === '/health') {
      let row = null, database = 'error';
      try { row = await env.DB.prepare('SELECT value FROM system_meta WHERE key = ?').bind('schema_version').first(); database = 'ok'; } catch {}
      return respond({ ok: database === 'ok', app: 'havana-nice-v2', environment: env.HAVANA_ENV || 'development', database, schemaVersion: row?.value ?? null, realtime: 'configured', media: 'pending-r2-enable', chat: 'chat-1-text' }, database === 'ok' ? 200 : 503, origin);
    }
    if (url.pathname === '/realtime/health') return env.CHAT_ROOMS.get(env.CHAT_ROOMS.idFromName('foundation-health')).fetch('https://internal/health');
    if (url.pathname === '/api/chat/session' && request.method === 'POST') {
      
      let payload;
      try { payload = await request.json(); } catch { return respond({ error: 'Invalid input' }, 400, origin); }
      if (typeof payload?.accessCode !== 'string' || payload.accessCode.length > CODE_LENGTH_LIMIT || !constantEqual(await sha256(payload.accessCode), LAB_CODE_SHA256)) return respond({ error: 'Invalid access code' }, 401, origin);
      const name = typeof payload.displayName === 'string' ? payload.displayName.trim() : '';
      if (!name || name.length > 28) return respond({ error: 'Name must be 1–28 characters' }, 400, origin);
      return respond(await createSession(env, name), 200, origin);
    }
    if (url.pathname === '/api/chat/messages' && request.method === 'GET') {
      const session = await verifySession(env, (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''));
      if (!session) return respond({ error: 'Session expired; enter lab code again' }, 401, origin);
      const after = url.searchParams.get('afterSeq');
      const seq = after === null ? null : Number(after);
      if (seq !== null && (!Number.isSafeInteger(seq) || seq < 0)) return respond({ error: 'Invalid cursor' }, 400, origin);
      const query = seq === null
        ? env.DB.prepare('SELECT seq, client_message_id, sender_id, sender_name, body, created_at FROM chat_messages ORDER BY seq DESC LIMIT ?').bind(MAX_HISTORY)
        : env.DB.prepare('SELECT seq, client_message_id, sender_id, sender_name, body, created_at FROM chat_messages WHERE seq > ? ORDER BY seq ASC LIMIT ?').bind(seq, MAX_HISTORY);
      const rows = (await query.all()).results || [];
      if (seq === null) rows.reverse();
      return respond({ messages: rows.map(mapMessage), hasMore: rows.length === MAX_HISTORY }, 200, origin);
    }
    if (url.pathname === '/ws') {
      const header = request.headers.get('sec-websocket-protocol') || '';
      const protocol = header.split(',').map(s => s.trim()).find(s => s.startsWith('session.')) || '';
      const session = await verifySession(env, protocol.slice(8));
      if (!session) return respond({ error: 'Unauthorized' }, 401, origin);
      if ((request.headers.get('upgrade') || '').toLowerCase() !== 'websocket') return respond({ error: 'Upgrade required' }, 426, origin);
      const headers = new Headers(request.headers);
      headers.set('x-havana-actor-id', session.actorId);
      headers.set('x-havana-actor-name', session.displayName);
      headers.set('sec-websocket-protocol', 'havana-v2');
      const upgraded = new Request(request, { headers });
      return env.CHAT_ROOMS.get(env.CHAT_ROOMS.idFromName(ROOM)).fetch(upgraded);
    }
    return respond({ error: 'Not found' }, 404, origin);
  },
};
