/* HAVANA NICE — CHAT DE INFORMACIÓN / REAL TIME V1 */
(() => {
  'use strict';

  const SUPABASE_URL = 'https://xzfradccsxonmauinecl.supabase.co';
  const CHAT_TABLE = 'chat_messages';
  const MAX_LENGTH = 1000;
  const READ_KEY = 'hn_chat_last_read_at';
  let chatChannel = null;
  let messages = [];
  let chatScreen = null;
  let listEl = null;
  let inputEl = null;
  let sendEl = null;
  let badgeEl = null;
  let initialized = false;

  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[ch]));
  const session = () => {
    try { return JSON.parse(sessionStorage.getItem('hn_profile') || 'null'); } catch (_) { return null; }
  };
  const client = () => window.hnSupabase || window.supabaseClient || window.supabase || null;

  function currentProfile() {
    const p = session();
    return p && p.id ? p : null;
  }

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

  function findHomeModules() {
    return [...document.querySelectorAll('.module')];
  }

  function ensureHomeModule() {
    const modules = document.querySelector('.modules');
    if (!modules) return null;
    let existing = [...modules.querySelectorAll('.module')].find(el => /CHAT DE INFORMACIÓN|CHAT DE INFORMACION/i.test(el.textContent || ''));
    if (!existing) {
      existing = document.createElement('button');
      existing.type = 'button';
      existing.className = 'module hn-chat-module';
      existing.innerHTML = `
        <span class="module-number">05</span>
        <span class="module-copy"><span class="module-title">CHAT DE INFORMACIÓN</span><span class="module-subtitle">MENSAJES DEL EQUIPO</span></span>
        <span class="module-arrow">›</span>
      `;
      const family = [...modules.querySelectorAll('.module')].find(el => /FAMILIA/i.test(el.textContent || ''));
      if (family && family.nextSibling) modules.insertBefore(existing, family.nextSibling);
      else modules.appendChild(existing);
    }
    return existing;
  }

  function ensureStyles() {
    if (document.getElementById('hn-chat-styles')) return;
    const style = document.createElement('style');
    style.id = 'hn-chat-styles';
    style.textContent = `
      .hn-chat-module { position:relative; }
      .hn-chat-unread { position:absolute; top:10px; right:48px; min-width:19px; height:19px; padding:0 5px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:#e5bd62; color:#020302; font-size:9px; font-weight:700; }
      .hn-chat-screen { padding-bottom:max(24px, env(safe-area-inset-bottom)); }
      .hn-chat-wrap { width:min(100%,720px); height:100%; margin:0 auto; display:flex; flex-direction:column; min-height:0; }
      .hn-chat-head { flex:0 0 auto; text-align:center; padding:4px 0 18px; }
      .hn-chat-head-title { margin:0; font-family:Georgia,"Times New Roman",serif; font-size:clamp(25px,7vw,38px); font-weight:400; letter-spacing:.04em; text-transform:uppercase; }
      .hn-chat-head-sub { margin:9px 0 0; color:rgba(244,241,232,.48); font-size:8px; letter-spacing:.22em; text-transform:uppercase; }
      .hn-chat-list { flex:1 1 auto; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:4px 2px 18px; scrollbar-width:none; }
      .hn-chat-list::-webkit-scrollbar { display:none; }
      .hn-chat-day { text-align:center; margin:13px 0 10px; color:rgba(244,241,232,.35); font-size:8px; letter-spacing:.22em; }
      .hn-chat-row { display:flex; margin:7px 0; }
      .hn-chat-row.mine { justify-content:flex-end; }
      .hn-chat-bubble { max-width:min(82%,560px); padding:10px 12px 8px; border:1px solid rgba(229,189,98,.28); background:rgba(0,0,0,.46); backdrop-filter:blur(7px); }
      .hn-chat-row.mine .hn-chat-bubble { border-color:rgba(229,189,98,.55); background:rgba(75,52,15,.25); }
      .hn-chat-sender { margin-bottom:5px; color:#e5bd62; font-size:8px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; }
      .hn-chat-text { color:#f4f1e8; font-size:14px; line-height:1.42; white-space:pre-wrap; overflow-wrap:anywhere; }
      .hn-chat-time { margin-top:5px; color:rgba(244,241,232,.34); font-size:8px; text-align:right; letter-spacing:.08em; }
      .hn-chat-compose { flex:0 0 auto; display:flex; gap:8px; padding-top:8px; border-top:1px solid rgba(229,189,98,.18); }
      .hn-chat-input { flex:1; min-width:0; min-height:48px; max-height:110px; resize:none; padding:13px 12px; border:1px solid rgba(229,189,98,.45); border-radius:0; outline:none; background:rgba(0,0,0,.42); color:#f4f1e8; font-size:14px; line-height:1.35; }
      .hn-chat-input::placeholder { color:rgba(244,241,232,.35); }
      .hn-chat-send { flex:0 0 54px; min-height:48px; border:1px solid #e5bd62; border-radius:0; background:rgba(0,0,0,.35); color:#fff1a8; font-size:10px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; }
      .hn-chat-send:disabled { opacity:.4; }
      .hn-chat-empty { padding:45px 20px; text-align:center; color:rgba(244,241,232,.38); font-size:9px; letter-spacing:.18em; text-transform:uppercase; }
      .hn-chat-back { flex:0 0 auto; width:100%; height:44px; margin-top:8px; border:1px solid rgba(229,189,98,.35); border-radius:0; background:rgba(0,0,0,.25); color:rgba(244,241,232,.72); font-size:9px; letter-spacing:.2em; text-transform:uppercase; }
      @media (max-height:700px) { .hn-chat-head { padding-bottom:10px; } .hn-chat-bubble { padding:8px 10px 7px; } }
    `;
    document.head.appendChild(style);
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
        <form class="hn-chat-compose">
          <textarea class="hn-chat-input" rows="1" maxlength="1000" placeholder="Escribe un mensaje..."></textarea>
          <button class="hn-chat-send" type="submit">ENVIAR</button>
        </form>
        <button class="hn-chat-back" type="button">VOLVER</button>
      </div>
    `;
    document.querySelector('.experience')?.appendChild(chatScreen);
    listEl = chatScreen.querySelector('.hn-chat-list');
    inputEl = chatScreen.querySelector('.hn-chat-input');
    sendEl = chatScreen.querySelector('.hn-chat-send');
    chatScreen.querySelector('.hn-chat-compose').addEventListener('submit', sendMessage);
    chatScreen.querySelector('.hn-chat-back').addEventListener('click', () => {
      chatScreen.classList.remove('is-active');
      const active = document.querySelector('.screen:not(#hn-chat-screen).is-active');
      if (!active) document.querySelector('.screen')?.classList.add('is-active');
    });
    inputEl.addEventListener('input', () => { inputEl.style.height='auto'; inputEl.style.height=Math.min(inputEl.scrollHeight,110)+'px'; });
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
      const day = dayLabel(m.created_at), mine = me && m.profile_id === me.id;
      let html = '';
      if (day !== lastDay) { html += `<div class="hn-chat-day">${esc(day)}</div>`; lastDay = day; }
      html += `<div class="hn-chat-row ${mine?'mine':''}"><div class="hn-chat-bubble"><div class="hn-chat-sender">${esc(m.sender_name || 'MIEMBRO')}</div><div class="hn-chat-text">${esc(m.message)}</div><div class="hn-chat-time">${esc(formatTime(m.created_at))}</div></div></div>`;
      return html;
    }).join('');
    requestAnimationFrame(() => { listEl.scrollTop = listEl.scrollHeight; });
  }

  function setUnread(count) {
    const module = ensureHomeModule();
    if (!module) return;
    badgeEl = module.querySelector('.hn-chat-unread');
    if (!badgeEl) { badgeEl = document.createElement('span'); badgeEl.className='hn-chat-unread'; module.appendChild(badgeEl); }
    if (count > 0) { badgeEl.textContent = count > 99 ? '99+' : String(count); badgeEl.hidden=false; }
    else { badgeEl.hidden=true; }
  }

  function markRead() {
    localStorage.setItem(READ_KEY, new Date().toISOString());
    setUnread(0);
  }

  function updateUnread() {
    const last = localStorage.getItem(READ_KEY);
    if (!last) { setUnread(messages.length); return; }
    const t = Date.parse(last);
    setUnread(messages.filter(m => Date.parse(m.created_at) > t).length);
  }

  async function loadMessages() {
    const sb = client();
    if (!sb) return;
    const { data, error } = await sb.from(CHAT_TABLE).select('id,profile_id,sender_name,message,created_at').order('created_at', { ascending:true }).limit(200);
    if (error) { console.warn('HAVANA NICE chat load failed:', error); return; }
    messages = data || [];
    render(); updateUnread();
  }

  async function sendMessage(e) {
    e.preventDefault();
    const sb = client(), p = currentProfile();
    const text = (inputEl?.value || '').trim();
    if (!sb || !p?.id || !text || text.length > MAX_LENGTH) return;
    sendEl.disabled = true;
    try {
      const { data, error } = await sb.rpc('send_chat_message', { p_profile_id:p.id, p_message:text });
      if (error) throw error;
      inputEl.value=''; inputEl.style.height='auto';
      const row = Array.isArray(data) ? data[0] : data;
      if (row && !messages.some(m => m.id === row.id)) { messages.push(row); messages.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)); render(); }
      markRead();
    } catch (error) {
      console.error('HAVANA NICE chat send failed:', error);
      alert('No se pudo enviar el mensaje.');
    } finally { sendEl.disabled=false; inputEl?.focus(); }
  }

  function subscribe() {
    const sb = client();
    if (!sb || chatChannel) return;
    chatChannel = sb.channel('hn-chat-realtime')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:CHAT_TABLE }, payload => {
        const row = payload.new;
        if (!messages.some(m => m.id === row.id)) messages.push(row);
        messages.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
        render();
        const active = chatScreen?.classList.contains('is-active');
        if (active) markRead(); else updateUnread();
      })
      .subscribe();
  }

  function openChat() {
    buildScreen();
    document.querySelectorAll('.screen').forEach(s => { if (s !== chatScreen) s.classList.remove('is-active'); });
    chatScreen.classList.add('is-active');
    markRead();
    render();
    setTimeout(() => inputEl?.focus(), 250);
  }

  function wireModule() {
    const module = ensureHomeModule();
    if (!module || module.dataset.hnChatBound === '1') return;
    module.dataset.hnChatBound='1';
    module.addEventListener('click', openChat);
  }

  async function init() {
    if (initialized) return;
    initialized=true;
    wireModule();
    buildScreen();
    await loadMessages();
    subscribe();
    setInterval(async () => { if (!chatScreen?.classList.contains('is-active')) { await loadMessages(); } }, 5000);
  }

  const boot = () => setTimeout(init, 250);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
