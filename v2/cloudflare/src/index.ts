// @ts-nocheck
import { handleChatMedia, mediaReadiness } from './drive-media.js';
// HAVANA NICE V2 isolated development Worker — Chat 1 laboratory.
// Runtime JS syntax is intentional: Cloudflare's connected API can deploy this
// module directly. The permanent typed auth module will replace lab access.
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const CODE_LENGTH_LIMIT = 256;
const ROOM = 'main-chat-v2';
const MAX_TEXT = 2000;
const MAX_HISTORY = 100;
const CHAT_EDIT_WINDOW_MS = 15 * 60 * 1000;

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
    // React Native/OkHttp uses the WSS endpoint's own HTTPS origin by default.
    if (url.protocol === 'https:' && url.hostname === 'havana-nice-v2-dev.soloaplicaciones97.workers.dev') return origin;
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
// Never accept the session from an URL query string (would leak into access logs).
function websocketSessionToken(request) {
  const protocols = request.headers.get('sec-websocket-protocol') || '';
  const offered = protocols.split(',').map(s => s.trim());
  const browserToken = offered.find(s => s.startsWith('session.'));
  if (browserToken) return browserToken.slice(8);
  // Native React Native WebSocket can supply Authorization at handshake time.
  // Browsers cannot set this header with the WebSocket API.
  const auth = request.headers.get('authorization') || '';
  const match = /^Bearer ([A-Za-z0-9_-]{40,100})$/i.exec(auth);
  return match ? match[1] : '';
}

function mapMessage(row) {
  return {seq:row.seq,clientMessageId:row.client_message_id,senderId:row.sender_id,senderName:row.sender_name,text:row.deleted_at?'':row.body,sentAt:row.created_at,replyToSeq:row.reply_to_seq??null,editedAt:row.edited_at??null,deletedAt:row.deleted_at??null};
}

export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sockets = new Set();
    this.members = new Map();
    this.typingSent = new Map();
  }
  async fetch(request) {
    if (new URL(request.url).pathname === '/health') return Response.json({ ok: true, durableObject: 'ChatRoom', environment: this.env.HAVANA_ENV || 'development' });
    if ((request.headers.get('upgrade') || '').toLowerCase() !== 'websocket') return respond({ error: 'WebSocket required' }, 426);
    // Authenticated in both Worker and DO, without rebuilding the upgrade Request:
    // cloning the original WebSocket handshake can break protocol upgrade.
    // PWA: session token in offered subprotocol; Android native: Authorization header.
    // Both modes are checked again inside this Durable Object.
    const session = await verifySession(this.env, websocketSessionToken(request));
    if (!session) return respond({ error: 'Unauthorized' }, 401);
    const actorId = session.actorId;
    const name = session.displayName;
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    server.accept();
    this.sockets.add(server);
    this.members.set(server, {actorId, name});
    server.send(JSON.stringify({ type: 'chat.ready', at: new Date().toISOString(), users: this.onlineUsers() }));
    this.broadcast({ type: 'chat.presence', users: this.onlineUsers() });
    server.addEventListener('message', event => {
      this.state.waitUntil(this.onMessage(server, actorId, name, event.data).catch(() => {
        this.send(server, { type: 'chat.error', error: 'Delivery failed' });
      }));
    });
    const cleanup = () => {
      this.sockets.delete(server);
      this.members.delete(server);
      this.typingSent.delete(server);
      this.broadcast({ type: 'chat.presence', users: this.onlineUsers() });
    };
    server.addEventListener('close', cleanup);
    server.addEventListener('error', cleanup);
    // Client offered havana-v2; explicitly select it in 101 response.
    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: { 'Sec-WebSocket-Protocol': 'havana-v2' },
    });
  }
  send(socket, data) {
    try { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data)); } catch {}
  }
  broadcast(data) {
    for (const socket of this.sockets) this.send(socket, data);
  }
  onlineUsers() {
    const users = new Map();
    for (const member of this.members.values()) users.set(member.actorId, member.name);
    return [...users.entries()].map(([actorId, displayName]) => ({actorId, displayName}));
  }
  async onMessage(socket, senderId, senderName, raw) {
    if (typeof raw !== 'string' || raw.length > 10000) return this.send(socket, { type: 'chat.error', error: 'Invalid message' });
    let input;
    try { input = JSON.parse(raw); } catch { return this.send(socket, { type: 'chat.error', error: 'Invalid JSON' }); }
    if (input.type === 'chat.typing') {
      const now = Date.now();
      if (typeof input.active !== 'boolean' || now - (this.typingSent.get(socket) || 0) < 750) return;
      this.typingSent.set(socket, now);
      const signal = {type: 'chat.typing', actorId: senderId, senderName, active: input.active, expiresAt: now + 4000};
      for (const other of this.sockets) if (other !== socket) this.send(other, signal);
      return;
    }

    if (input.type === 'chat.read') {
      if (!Number.isSafeInteger(input.seq) || input.seq < 1) return;
      // Never claim a receipt ahead of the persisted server history.
      const cap = await this.env.DB.prepare('SELECT MAX(seq) AS newest FROM chat_messages').first();
      const upto = Math.min(input.seq, Number(cap?.newest || 0));
      if (!upto) return;
      await this.env.DB.prepare(
        'INSERT INTO chat_read_receipts(actor_id,display_name,last_read_seq,updated_at) VALUES(?,?,?,?) ' +
        'ON CONFLICT(actor_id) DO UPDATE SET last_read_seq=MAX(chat_read_receipts.last_read_seq,excluded.last_read_seq), updated_at=excluded.updated_at'
      ).bind(senderId,senderName,upto,new Date().toISOString()).run();
      this.broadcast({type:'chat.read',actorId:senderId,displayName:senderName,seq:upto});
      return;
    }
    if (input.type === 'chat.edit' || input.type === 'chat.delete') {
      if (!Number.isSafeInteger(input.seq) || input.seq <= 0) {
        this.send(socket,{type:'chat.error',error:'Identificador inválido'});return;
      }
      const own = await this.env.DB.prepare(
        'SELECT seq,sender_id,created_at,deleted_at FROM chat_messages WHERE seq=?'
      ).bind(input.seq).first();
      if (!own || own.sender_id !== senderId || own.deleted_at ||
          Date.now() - Date.parse(own.created_at) > CHAT_EDIT_WINDOW_MS ||
          !Number.isFinite(Date.parse(own.created_at))) {
        this.send(socket,{type:'chat.error',error:'No puedes modificar este mensaje'});return;
      }
      const now = new Date().toISOString();
      if (input.type === 'chat.edit') {
        if (typeof input.text !== 'string' || !input.text.trim() || input.text.trim().length > MAX_TEXT) {
          this.send(socket,{type:'chat.error',error:'Texto inválido'});return;
        }
        await this.env.DB.prepare(
          'UPDATE chat_messages SET body=?,edited_at=? WHERE seq=? AND sender_id=? AND deleted_at IS NULL'
        ).bind(input.text.trim(),now,input.seq,senderId).run();
      } else {
        await this.env.DB.prepare(
          "UPDATE chat_messages SET body='',deleted_at=? WHERE seq=? AND sender_id=? AND deleted_at IS NULL"
        ).bind(now,input.seq,senderId).run();
        await this.env.DB.prepare('DELETE FROM chat_reactions WHERE message_seq=?').bind(input.seq).run();
      }
      const current = await this.env.DB.prepare(
        'SELECT seq,client_message_id,sender_id,sender_name,body,created_at,reply_to_seq,edited_at,deleted_at FROM chat_messages WHERE seq=?'
      ).bind(input.seq).first();
      if (current) this.broadcast({type:'chat.updated',message:mapMessage(current)});
      return;
    }
    if (input.type === 'chat.react') {
      if (!Number.isSafeInteger(input.messageSeq) || input.messageSeq < 1 || !['❤️','😂','👍'].includes(input.emoji)) {
        this.send(socket, {type:'chat.error',error:'Invalid reaction'}); return;
      }
      const exists = await this.env.DB.prepare('SELECT seq FROM chat_messages WHERE seq = ? AND deleted_at IS NULL').bind(input.messageSeq).first();
      if (!exists) { this.send(socket,{type:'chat.error',error:'Message not found'}); return; }
      const current = await this.env.DB.prepare('SELECT actor_id FROM chat_reactions WHERE message_seq=? AND actor_id=? AND emoji=?')
        .bind(input.messageSeq,senderId,input.emoji).first();
      if (current) {
        await this.env.DB.prepare('DELETE FROM chat_reactions WHERE message_seq=? AND actor_id=? AND emoji=?')
          .bind(input.messageSeq,senderId,input.emoji).run();
      } else {
        await this.env.DB.prepare('INSERT OR IGNORE INTO chat_reactions(message_seq,actor_id,emoji,created_at) VALUES (?,?,?,?)')
          .bind(input.messageSeq,senderId,input.emoji,new Date().toISOString()).run();
      }
      this.broadcast({type:'chat.reaction',messageSeq:input.messageSeq,actorId:senderId,emoji:input.emoji,active:!current});
      return;
    }
    if (input.type !== 'chat.send' || typeof input.clientMessageId !== 'string' || !/^[A-Za-z0-9_-]{8,100}$/.test(input.clientMessageId) || typeof input.text !== 'string') {
      return this.send(socket, { type: 'chat.error', error: 'Invalid message format' });
    }
    const text = input.text.trim();
    if (!text || text.length > MAX_TEXT) return this.send(socket, { type: 'chat.error', error: 'Text length must be 1–2000' });
    const reply = input.replyToSeq === null || input.replyToSeq === undefined ? null : input.replyToSeq;
    if (reply !== null) {
      if (!Number.isSafeInteger(reply) || reply < 1) { this.send(socket,{type:'chat.error',error:'Invalid reply'}); return; }
      const original = await this.env.DB.prepare('SELECT seq FROM chat_messages WHERE seq=?').bind(reply).first();
      if (!original) { this.send(socket,{type:'chat.error',error:'Original message not found'}); return; }
    }
    const result = await this.env.DB.prepare(
      'INSERT OR IGNORE INTO chat_messages (client_message_id, sender_id, sender_name, body, created_at, reply_to_seq) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(input.clientMessageId, senderId, senderName, text, new Date().toISOString(), reply).run();
    const row = await this.env.DB.prepare(
      'SELECT seq, client_message_id, sender_id, sender_name, body, created_at, reply_to_seq, edited_at, deleted_at FROM chat_messages WHERE sender_id = ? AND client_message_id = ?'
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
        'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'Authorization, Content-Type, X-Havana-Client-Asset-Id',
        'access-control-max-age': '3600', 'vary': 'Origin' },
    });
    if (request.headers.has('origin') && !origin) return respond({ error: 'Origin not allowed' }, 403);
    if (url.pathname === '/health') {
      let row = null, database = 'error';
      try { row = await env.DB.prepare('SELECT value FROM system_meta WHERE key = ?').bind('schema_version').first(); database = 'ok'; } catch {}
      return respond({ ok: database === 'ok', app: 'havana-nice-v2', environment: env.HAVANA_ENV || 'development', database, schemaVersion: row?.value ?? null, realtime: 'configured', media: mediaReadiness(env).enabled ? 'google-drive-v2' : 'havana-cloud-private-bridge-pending', chat: 'text-realtime-replies-reactions-search-edit-read-lab' }, database === 'ok' ? 200 : 503, origin);
    }
    if (url.pathname.startsWith('/api/chat/media/')) {
      const session = await verifySession(env, (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''));
      if (!session) return respond({ error: 'Unauthorized' }, 401, origin);
      return handleChatMedia(request, env, session, url, origin, respond);
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
      const before = url.searchParams.get('beforeSeq');
      const earlier = before === null ? null : Number(before);
      if (earlier !== null && (!Number.isSafeInteger(earlier) || earlier < 1)) return respond({error:'Invalid beforeSeq'},400,origin);
      const search = url.searchParams.get('search');
      if (search !== null && (search.trim().length < 2 || search.length > 80)) return respond({error:'Search must contain 2–80 characters'},400,origin);
      if (search !== null) {
        const needle = '%'+search.trim().replace(/[\\%_]/g,x=>'\\'+x)+'%';
        const result = await env.DB.prepare(
          "SELECT seq,client_message_id,sender_id,sender_name,body,created_at,reply_to_seq,edited_at,deleted_at FROM chat_messages WHERE deleted_at IS NULL AND body LIKE ? ESCAPE '\\' ORDER BY seq DESC LIMIT 60"
        ).bind(needle).all();
        return respond({messages:(result.results||[]).map(mapMessage).reverse(),hasMore:false,reactions:[]},200,origin);
      }
      const after = url.searchParams.get('afterSeq');
      const seq = after === null ? null : Number(after);
      if (seq !== null && (!Number.isSafeInteger(seq) || seq < 0)) return respond({ error: 'Invalid cursor' }, 400, origin);
      if (seq !== null && earlier !== null) return respond({error:'Incompatible cursors'},400,origin);
      const query = earlier !== null
        ? env.DB.prepare('SELECT seq,client_message_id,sender_id,sender_name,body,created_at,reply_to_seq,edited_at,deleted_at FROM chat_messages WHERE seq < ? ORDER BY seq DESC LIMIT ?').bind(earlier,MAX_HISTORY)
        : seq === null
        ? env.DB.prepare('SELECT seq,client_message_id,sender_id,sender_name,body,created_at,reply_to_seq,edited_at,deleted_at FROM chat_messages ORDER BY seq DESC LIMIT ?').bind(MAX_HISTORY)
        : env.DB.prepare('SELECT seq,client_message_id,sender_id,sender_name,body,created_at,reply_to_seq,edited_at,deleted_at FROM chat_messages WHERE seq > ? ORDER BY seq ASC LIMIT ?').bind(seq,MAX_HISTORY);
      const rows = (await query.all()).results || [];
      if (seq === null || earlier !== null) rows.reverse();
      const messageSeqs = rows.map(row => row.seq);
      let reactions = [];
      if (messageSeqs.length) {
        const placeholders = messageSeqs.map(() => '?').join(',');
        const query = await env.DB.prepare('SELECT message_seq, actor_id, emoji FROM chat_reactions WHERE message_seq IN ('+placeholders+')')
          .bind(...messageSeqs).all();
        reactions = query.results || [];
      }
      const receipts = await env.DB.prepare('SELECT actor_id,display_name,last_read_seq FROM chat_read_receipts WHERE updated_at > ? LIMIT 100')
        .bind(new Date(Date.now()-7*86400000).toISOString()).all();
      return respond({ messages: rows.map(mapMessage), reactions: reactions.map(r => ({messageSeq:r.message_seq,actorId:r.actor_id,emoji:r.emoji})),
        receipts: (receipts.results||[]).map(r => ({actorId:r.actor_id,displayName:r.display_name,seq:r.last_read_seq})),
        hasMore: rows.length === MAX_HISTORY }, 200, origin);
    }
    if (url.pathname === '/ws') {
      const session = await verifySession(env, websocketSessionToken(request));
      if (!session) return respond({ error: 'Unauthorized' }, 401, origin);
      if ((request.headers.get('upgrade') || '').toLowerCase() !== 'websocket') return respond({ error: 'Upgrade required' }, 426, origin);
      // Forward original Upgrade and offered subprotocols unchanged.
      // The Durable Object verifies the session independently.
      return env.CHAT_ROOMS.get(env.CHAT_ROOMS.idFromName(ROOM)).fetch(request);
    }
    return respond({ error: 'Not found' }, 404, origin);
  },
};
