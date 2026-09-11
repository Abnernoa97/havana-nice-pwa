/* HAVANA NICE — CHAT DE INFORMACIÓN / REAL TIME V2 */
(() => {
  'use strict';

  const SUPABASE_URL = 'https://xzfradccsxonmauinecl.supabase.co';
  const CHAT_TABLE = 'chat_messages';
  const MAX_LENGTH = 1000;
  const READ_KEY = 'hn_chat_last_read_at';
  const REPLY_SEPARATOR = '\n---\n';
  let chatChannel = null;
  let messages = [];
  let chatScreen = null;
  let listEl = null;
  let inputEl = null;
  let sendEl = null;
  let initialized = false;
  let replyTarget = null;
  let historyArmed = false;
  let previousScreen = null;
  let videoWasMuted = true;

  const esc = (value) => String(value ?? '').replace(/[&<>'\"]/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;' }[ch]));
  const session = () => {
    try { return JSON.parse(sessionStorage.getItem('hn_profile') || 'null'); } catch (_) { return null; }
  };
  const client = () => window.hnSupabase || window.supabaseClient || window.supabase || null;
  const currentProfile = () => { const p = session(); return p && p.id ? p : null; };
  const readKey = () => { const p = currentProfile(); return `${READ_KEY}:${p?.id || 'anonymous'}`; };

  function formatTime(ts) {
    try { return new Intl.DateTimeFormat('es-MX', { hour:'2-digit', minute:'2-digit' }).format(new Date(ts)); }
    catch (_) { return ''; }
  }

  function dayLabel(ts) {
    const d = new Date(ts), now = new Date();
    const same = (a,b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
    if (same(d, now)) return 'HOY';
    const y = new Date(now); y.setDate(now.getDate()-1);
    if (same(d, y)) return 'AYER';
    return new Intl.DateTimeFormat('es-MX', { day:'2-digit', month:'short', year:'numeric' }).format(d).toUpperCase();
  }

  function parseReplyMessage(value) {
    const raw = String(value ?? '');
    if (!raw.startsWith('↳ ')) return { quote: null, text: raw };
    const separatorIndex = raw.indexOf(REPLY_SEPARATOR);
    if (separatorIndex >= 0) {
      const quote = raw.slice(2, separatorIndex);
      const text = raw.slice(separatorIndex + REPLY_SEPARATOR.length);
      const colon = quote.indexOf(': ');
      return { quote: colon >= 0 ? { sender: quote.slice(0, colon), text: quote.slice(colon + 2) } : { sender:'MIEMBRO', text:quote }, text };
    }
    const lineBreak = raw.indexOf('\n');
    if (lineBreak >= 0) {
      const quote = raw.slice(2, lineBreak);
      const text = raw.slice(lineBreak + 1);
      const colon = quote.indexOf(': ');
      return { quote: colon >= 0 ? { sender: quote.slice(0, colon), text: quote.slice(colon + 2) } : { sender:'MIEMBRO', text:quote }, text };
    }
    return { quote:null, text:raw };
  }

  function ensureHomeModule() {
    const modules = document.querySelector('.modules');
    if (!modules) return null;
    let existing = [...modules.querySelectorAll('.module')].find(el => /CHAT DE INFORMACIÓN|CHAT DE INFORMACION/i.test(el.textContent || ''));
    if (!existing) {
      existing = document.createElement('button');
      existing.type = 'button';
      existing.className = 'module hn-chat-module';
      existing.innerHTML = `<span class="module-number">05</span><span class="module-copy"><span class="module-title">CHAT DE INFORMACIÓN</span><span class="module-subtitle">MENSAJES DEL EQUIPO</span></span><span class="module-arrow">›</span>`;
      const family = [...modules.querySelectorAll('.module')].find(el => /FAMILIA/i.test(el.textContent || ''));
      if (family && family.nextSibling) modules.insertBefore(existing, family.nextSibling); else modules.appendChild(existing);
    }
    return existing;
  }

  function ensureStyles() {
    let style = document.getElementById('hn-chat-styles');
    if (!style) { style = document.createElement('style'); style.id = 'hn-chat-styles'; document.head.appendChild(style); }
    style.textContent = `
      .hn-chat-module { position:relative; }
      .hn-chat-screen { padding-bottom:max(24px, env(safe-area-inset-bottom)); }
      .hn-chat-screen.is-active ~ .controls { display:none !important; }
      .experience:has(#hn-chat-screen.is-active) .controls { display:none !important; }
      .hn-chat-wrap { width:min(100%,720px); height:100%; margin:0 auto; display:flex; flex-direction:column; min-height:0; }
      .hn-chat-head { flex:0 0 auto; text-align:center; padding:4px 0 18px; }
      .hn-chat-head-title { margin:0; font-family:Georgia,"Times New Roman",serif; font-size:clamp(25px,7vw,38px); font-weight:400; letter-spacing:.04em; text-transform:uppercase; }
      .hn-chat-head-sub { margin:9px 0 0; color:rgba(244,241,232,.48); font-size:8px; letter-spacing:.22em; text-transform:uppercase; }
      .hn-chat-list { flex:1 1 auto; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:4px 2px 18px; scrollbar-width:none; }
      .hn-chat-list::-webkit-scrollbar { display:none; }
      .hn-chat-day { text-align:center; margin:13px 0 10px; color:rgba(244,241,232,.35); font-size:8px; letter-spacing:.22em; }
      .hn-chat-row { display:flex; margin:7px 0; transition:transform .18s ease; }
      .hn-chat-row.mine { justify-content:flex-end; }
      .hn-chat-bubble { max-width:min(82%,560px); padding:10px 12px 8px; border:1px solid rgba(229,189,98,.32); background:rgba(0,0,0,.58) !important; backdrop-filter:blur(7px); cursor:pointer; touch-action:pan-y; user-select:none; transition:border-color .2s ease, box-shadow .2s ease, transform .15s ease, background .2s ease; }
      .hn-chat-row.mine .hn-chat-bubble { border-color:#e5bd62 !important; background:#0d5a3d !important; box-shadow:inset 0 0 0 1px rgba(255,241,168,.10), 0 4px 18px rgba(0,0,0,.20); }
      .hn-chat-row:not(.mine) .hn-chat-bubble { background:#171717 !important; border-color:rgba(229,189,98,.30) !important; }
      .hn-chat-bubble.hn-chat-selected { border-color:#fff1a8 !important; box-shadow:0 0 0 1px rgba(229,189,98,.35), 0 0 18px rgba(229,189,98,.10); transform:translateY(-1px); }
      .hn-chat-sender { margin-bottom:5px; color:#e5bd62; font-size:8px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; }
      .hn-chat-text { color:#f4f1e8; font-size:14px; line-height:1.42; white-space:pre-wrap; overflow-wrap:anywhere; user-select:text; }
      .hn-chat-time { margin-top:5px; color:rgba(244,241,232,.42); font-size:8px; text-align:right; letter-spacing:.08em; }
      .hn-chat-quoted { margin-bottom:8px; padding:7px 9px; border-left:2px solid #e5bd62; background:rgba(229,189,98,.08); border-radius:0; }
      .hn-chat-quoted-sender { color:#e5bd62; font-size:8px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; margin-bottom:3px; }
      .hn-chat-quoted-text { color:rgba(244,241,232,.58); font-size:11px; line-height:1.3; white-space:pre-wrap; overflow:hidden; max-height:42px; }
      .hn-chat-row.mine .hn-chat-quoted { background:rgba(229,189,98,.10); }
      .hn-chat-reply { flex:0 0 auto; display:none; align-items:stretch; border-top:1px solid rgba(229,189,98,.18); background:rgba(0,0,0,.22); }
      .hn-chat-reply.is-visible { display:flex; }
      .hn-chat-reply-line { width:2px; flex:0 0 2px; background:#e5bd62; }
      .hn-chat-reply-copy { flex:1; min-width:0; padding:8px 10px; }
      .hn-chat-reply-label { color:#e5bd62; font-size:8px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; }
      .hn-chat-reply-text { margin-top:4px; color:rgba(244,241,232,.60); font-size:11px; line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .hn-chat-reply-close { width:42px; border:0; background:transparent; color:rgba(244,241,232,.60); font-size:18px; }
      .hn-chat-compose { flex:0 0 auto; display:flex; flex-direction:column; gap:8px; padding-top:8px; border-top:1px solid rgba(229,189,98,.18); }
      .hn-chat-input { width:100%; min-width:0; min-height:78px; max-height:150px; resize:none; box-sizing:border-box; padding:14px 12px; border:1px solid rgba(229,189,98,.45); border-radius:0; outline:none; background:rgba(0,0,0,.42); color:#f4f1e8; font-size:14px; line-height:1.4; }
      .hn-chat-input::placeholder { color:rgba(244,241,232,.35); }
      .hn-chat-send { width:100%; min-height:52px; border:1px solid #e5bd62; border-radius:0; background:rgba(0,0,0,.35); color:#fff1a8; font-size:10px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; }
      .hn-chat-send:disabled { opacity:.4; }
      .hn-chat-empty { padding:45px 20px; text-align:center; color:rgba(244,241,232,.38); font-size:9px; letter-spacing:.18em; text-transform:uppercase; }
      @media (max-height:700px) { .hn-chat-head { padding-bottom:10px; } .hn-chat-bubble { padding:8px 10px 7px; } .hn-chat-input { min-height:70px; } .hn-chat-send { min-height:48px; } }
    `;
  }

  function closeReply() {
    replyTarget = null;
    chatScreen?.querySelector('.hn-chat-reply')?.classList.remove('is-visible');
    chatScreen?.querySelectorAll('.hn-chat-bubble.hn-chat-selected').forEach(el => el.classList.remove('hn-chat-selected'));
  }

  function selectMessage(id) {
    const message = messages.find(m => m.id === id);
    if (!message) return;
    replyTarget = message;
    chatScreen?.querySelectorAll('.hn-chat-bubble').forEach(el => el.classList.toggle('hn-chat-selected', el.dataset.messageId === id));
    const parsed = parseReplyMessage(message.message);
    const reply = chatScreen?.querySelector('.hn-chat-reply');
    if (reply) {
      reply.classList.add('is-visible');
      const who = reply.querySelector('.hn-chat-reply-label');
      const text = reply.querySelector('.hn-chat-reply-text');
      if (who) who.textContent = `RESPONDER A ${message.sender_name || 'MIEMBRO'}`;
      if (text) text.textContent = parsed.text || message.message || '';
    }
    inputEl?.focus();
  }

  function wireMessageInteractions() {
    if (!listEl) return;
    listEl.querySelectorAll('.hn-chat-bubble').forEach(bubble => {
      bubble.addEventListener('click', () => {
        if (bubble.dataset.hnSwiped === '1') { bubble.dataset.hnSwiped='0'; return; }
        selectMessage(bubble.dataset.messageId);
      });
      let startX = 0, startY = 0, tracking = false;
      bubble.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        startX = e.clientX; startY = e.clientY; tracking = true;
        try { bubble.setPointerCapture(e.pointerId); } catch (_) {}
      });
      bubble.addEventListener('pointermove', e => {
        if (!tracking) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (dx > 12 && Math.abs(dx) > Math.abs(dy)) bubble.style.transform = `translateX(${Math.min(dx,72)}px)`;
      });
      const finishSwipe = e => {
        if (!tracking) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        tracking = false;
        bubble.style.transform = '';
        if (dx >= 55 && Math.abs(dx) > Math.abs(dy) * 1.15) {
          bubble.dataset.hnSwiped = '1';
          selectMessage(bubble.dataset.messageId);
        }
      };
      bubble.addEventListener('pointerup', finishSwipe);
      bubble.addEventListener('pointercancel', () => { tracking=false; bubble.style.transform=''; });
    });
  }

  function buildScreen() {
    if (chatScreen) return chatScreen;
    ensureStyles();
    chatScreen = document.createElement('section');
    chatScreen.className = 'screen hn-chat-screen';
    chatScreen.id = 'hn-chat-screen';
    chatScreen.innerHTML = `
      <div class="hn-chat-wrap">
        <div class="hn-chat-head">
          <h1 class="hn-chat-head-title metallic-gold">CHAT DE INFORMACIÓN</h1>
          <div class="hn-chat-head-sub">COMUNICACIÓN INTERNA · TIEMPO REAL</div>
        </div>
        <div class="hn-chat-list" aria-live="polite"></div>
        <div class="hn-chat-reply">
          <div class="hn-chat-reply-line"></div>
          <div class="hn-chat-reply-copy"><div class="hn-chat-reply-label">RESPONDER</div><div class="hn-chat-reply-text"></div></div>
          <button class="hn-chat-reply-close" type="button" aria-label="Cerrar respuesta">×</button>
        </div>
        <form class="hn-chat-compose">
          <textarea class="hn-chat-input" rows="3" maxlength="1000" placeholder="Escribe un mensaje..."></textarea>
          <button class="hn-chat-send" type="submit">ENVIAR</button>
        </form>
      </div>
    `;
    document.querySelector('.experience')?.appendChild(chatScreen);
    listEl = chatScreen.querySelector('.hn-chat-list');
    inputEl = chatScreen.querySelector('.hn-chat-input');
    sendEl = chatScreen.querySelector('.hn-chat-send');
    chatScreen.querySelector('.hn-chat-compose').addEventListener('submit', sendMessage);
    chatScreen.querySelector('.hn-chat-reply-close').addEventListener('click', closeReply);
    inputEl.addEventListener('input', () => { inputEl.style.height='auto'; inputEl.style.height=Math.min(inputEl.scrollHeight,150)+'px'; });
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatScreen.querySelector('.hn-chat-compose').requestSubmit(); }
    });
    return chatScreen;
  }

  function render() {
    if (!listEl) return;
    if (!messages.length) { listEl.innerHTML='<div class="hn-chat-empty">Aún no hay mensajes</div>'; return; }
    const me = currentProfile();
    let lastDay = '';
    listEl.innerHTML = messages.map(m => {
      const day = dayLabel(m.created_at);
      const mine = !!me && String(m.profile_id) === String(me.id);
      const parsed = parseReplyMessage(m.message);
      let html = '';
      if (day !== lastDay) { html += `<div class="hn-chat-day">${esc(day)}</div>`; lastDay = day; }
      html += `<div class="hn-chat-row ${mine ? 'mine' : 'other'}"><div class="hn-chat-bubble" data-message-id="${esc(m.id)}">`;
      html += `<div class="hn-chat-sender">${esc(m.sender_name || 'MIEMBRO')}</div>`;
      if (parsed.quote) html += `<div class="hn-chat-quoted"><div class="hn-chat-quoted-sender">${esc(parsed.quote.sender)}</div><div class="hn-chat-quoted-text">${esc(parsed.quote.text)}</div></div>`;
      html += `<div class="hn-chat-text">${esc(parsed.text)}</div><div class="hn-chat-time">${esc(formatTime(m.created_at))}</div></div></div>`;
      return html;
    }).join('');
    wireMessageInteractions();
    if (replyTarget) {
      const current = messages.find(m => m.id === replyTarget.id);
      if (current) selectMessage(current.id); else closeReply();
    }
    requestAnimationFrame(() => { listEl.scrollTop = listEl.scrollHeight; });
  }

  function updateUnread() {
    const module = ensureHomeModule();
    if (!module) return;
    const last = localStorage.getItem(readKey());
    const lastTime = last ? Date.parse(last) : NaN;
    const count = Number.isNaN(lastTime) ? messages.length : messages.filter(m => Date.parse(m.created_at) > lastTime).length;
    let badge = module.querySelector('.hn-chat-unread');
    if (count <= 0) { if (badge) badge.remove(); return; }
    if (!badge) {
      badge = document.createElement('span');
      badge.className='hn-chat-unread';
      badge.style.cssText='position:absolute;top:10px;right:48px;min-width:19px;height:19px;padding:0 5px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#e5bd62;color:#020302;font-size:9px;font-weight:700;';
      module.appendChild(badge);
    }
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.hidden = false;
  }

  function markRead() {
    localStorage.setItem(readKey(), new Date().toISOString());
    updateUnread();
  }

  async function loadMessages() {
    const sb = client(); if (!sb) return;
    const { data, error } = await sb.from(CHAT_TABLE).select('id,profile_id,sender_name,message,created_at').order('created_at', { ascending:true }).limit(200);
    if (error) { console.warn('HAVANA NICE chat load failed:', error); return; }
    messages = data || []; render(); updateUnread();
  }

  async function sendMessage(e) {
    e.preventDefault();
    const sb = client(), p = currentProfile();
    const text = (inputEl?.value || '').trim();
    if (!sb || !p?.id || !text || text.length > MAX_LENGTH) return;
    sendEl.disabled = true;
    try {
      let finalText = text;
      if (replyTarget) {
        const sender = replyTarget.sender_name || 'MIEMBRO';
        const quoted = replyTarget.message || '';
        finalText = `↳ ${sender}: ${quoted}${REPLY_SEPARATOR}${text}`.slice(0, MAX_LENGTH);
      }
      const { data, error } = await sb.rpc('send_chat_message', { p_profile_id:p.id, p_message:finalText });
      if (error) throw error;
      inputEl.value=''; inputEl.style.height='auto'; closeReply();
      const row = Array.isArray(data) ? data[0] : data;
      if (row && !messages.some(m => m.id === row.id)) { messages.push(row); messages.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)); render(); }
      markRead();
    } catch (error) {
      console.error('HAVANA NICE chat send failed:', error); alert('No se pudo enviar el mensaje.');
    } finally { sendEl.disabled=false; inputEl?.focus(); }
  }

  function subscribe() {
    const sb = client(); if (!sb || chatChannel) return;
    chatChannel = sb.channel('hn-chat-realtime').on('postgres_changes', { event:'INSERT', schema:'public', table:CHAT_TABLE }, payload => {
      const row = payload.new;
      if (!messages.some(m => m.id === row.id)) messages.push(row);
      messages.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
      render();
      if (chatScreen?.classList.contains('is-active')) markRead(); else updateUnread();
    }).subscribe();
  }

  function closeChat(fromButton = false) {
    if (!chatScreen) return;
    closeReply();
    chatScreen.classList.remove('is-active');
    if (previousScreen) previousScreen.classList.add('is-active');
    else document.getElementById('homeScreen')?.classList.add('is-active');
    const video = document.getElementById('backgroundVideo');
    if (video) video.muted = videoWasMuted;
    if (historyArmed && fromButton) { historyArmed = false; try { history.back(); } catch (_) {} }
    else if (!fromButton) historyArmed = false;
  }

  function openChat(fromPopState = false) {
    buildScreen();
    previousScreen = document.querySelector('.screen.is-active:not(#hn-chat-screen)') || document.getElementById('homeScreen');
    document.querySelectorAll('.screen').forEach(s => { if (s !== chatScreen) s.classList.remove('is-active'); });
    chatScreen.classList.add('is-active');
    markRead(); render();
    const video = document.getElementById('backgroundVideo');
    if (video) { videoWasMuted = !!video.muted; video.muted = true; video.play().catch(()=>{}); }
    if (!fromPopState && !historyArmed) { try { history.pushState({ ...(history.state || {}), hnChat:true }, '', location.href); historyArmed=true; } catch (_) {} }
    setTimeout(() => inputEl?.focus(), 250);
  }

  function wireModule() {
    const module = ensureHomeModule();
    if (!module || module.dataset.hnChatBound === '1') return;
    module.dataset.hnChatBound='1'; module.addEventListener('click', () => openChat());
  }

  function wireNativeBack() {
    window.addEventListener('popstate', () => { if (chatScreen?.classList.contains('is-active')) closeChat(false); });
  }

  async function init() {
    if (initialized) return;
    initialized=true; wireModule(); buildScreen(); wireNativeBack(); await loadMessages(); subscribe();
    setInterval(async () => { if (!chatScreen?.classList.contains('is-active')) await loadMessages(); }, 5000);
  }

  const boot = () => setTimeout(init, 250);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
