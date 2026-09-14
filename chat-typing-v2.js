/* HAVANA NICE — CHAT TYPING V2
   Isolated typing indicator. Does not touch chat_messages.
*/
(()=>{
  'use strict';

  const CHANNEL = 'hn-chat-typing-v2';
  let sb = null;
  let ch = null;
  let input = null;
  let indicator = null;
  let compose = null;
  let stopTimer = null;
  let active = false;
  let lastRemote = Object.create(null);
  let observerStarted = false;

  function profile(){
    try { return JSON.parse(sessionStorage.getItem('hn_profile') || 'null'); }
    catch (_) { return null; }
  }

  function myId(){ return String(profile()?.id || ''); }

  function myName(){
    const p = profile() || {};
    return String(p.sender_name || p.name || p.full_name || p.username || 'MIEMBRO').trim() || 'MIEMBRO';
  }

  function findInput(){
    return document.querySelector('#hn-chat-screen .hn-chat-input')
      || document.querySelector('.hn-chat-input')
      || document.querySelector('#hn-chat-screen textarea')
      || document.querySelector('.hn-chat-compose textarea');
  }

  function findCompose(el){
    return el?.closest('.hn-chat-compose')
      || document.querySelector('#hn-chat-screen .hn-chat-compose')
      || document.querySelector('.hn-chat-compose');
  }

  function ensure(){
    const el = findInput();
    if (!el) return false;

    const box = findCompose(el);
    if (!box) return false;

    input = el;
    compose = box;

    if (!indicator || !document.body.contains(indicator)) {
      indicator = document.createElement('div');
      indicator.id = 'hn-chat-typing-indicator';
      indicator.style.cssText = [
        'display:none',
        'min-height:16px',
        'padding:0 2px',
        'margin:0 0 1px',
        'color:rgba(244,241,232,.58)',
        'font-size:9px',
        'font-weight:500',
        'letter-spacing:.13em',
        'text-transform:uppercase',
        'line-height:16px',
        'pointer-events:none'
      ].join(';');
      box.insertBefore(indicator, box.firstChild);
    }

    if (input.dataset.hnTypingV2 !== '1') {
      input.dataset.hnTypingV2 = '1';
      input.addEventListener('input', onInput, { passive:true });
      input.addEventListener('blur', stopTyping, { passive:true });
      input.addEventListener('focus', ()=>{ setTimeout(ensure, 0); });
    }

    return true;
  }

  function render(){
    if (!indicator) return;

    const now = Date.now();
    const me = myId();

    Object.keys(lastRemote).forEach(id=>{
      if (now - lastRemote[id].at > 2400) delete lastRemote[id];
    });

    const names = Object.values(lastRemote)
      .filter(item => String(item.id) !== me)
      .map(item => item.name)
      .filter(Boolean);

    const unique = [...new Set(names)];

    if (unique.length === 1) {
      indicator.textContent = unique[0] + ' está escribiendo…';
    } else if (unique.length === 2) {
      indicator.textContent = unique[0] + ' y ' + unique[1] + ' están escribiendo…';
    } else if (unique.length > 2) {
      indicator.textContent = unique[0] + ', ' + unique[1] + ' y ' + (unique.length - 2) + ' más están escribiendo…';
    } else {
      indicator.textContent = '';
    }

    indicator.style.display = unique.length ? 'block' : 'none';
  }

  function receive(message){
    const data = message?.payload || {};
    if (!data.id || String(data.id) === myId()) return;

    if (data.typing) {
      lastRemote[String(data.id)] = {
        id: data.id,
        name: data.name || 'MIEMBRO',
        at: Date.now()
      };
    } else {
      delete lastRemote[String(data.id)];
    }

    ensure();
    render();
    setTimeout(render, 2500);
  }

  async function sendTyping(value){
    if (!ch) return;
    try {
      await ch.send({
        type:'broadcast',
        event:'typing',
        payload:{
          id: myId() || null,
          name: myName(),
          typing: !!value
        }
      });
    } catch (_) {}
  }

  function stopTyping(){
    clearTimeout(stopTimer);
    active = false;
    sendTyping(false);
  }

  function onInput(){
    ensure();

    if (!input || !String(input.value || '').trim()) {
      stopTyping();
      return;
    }

    if (!active) {
      active = true;
      sendTyping(true);
    }

    clearTimeout(stopTimer);
    stopTimer = setTimeout(()=>{
      active = false;
      sendTyping(false);
    }, 1500);
  }

  function connect(){
    sb = window.hnSupabase || window.hnMusicianSupabase || window.supabaseClient || window.supabase || null;
    if (!sb) {
      setTimeout(connect, 500);
      return;
    }

    if (!ch) {
      ch = sb.channel(CHANNEL);
      ch.on('broadcast', { event:'typing' }, receive);
      ch.subscribe(()=>{ ensure(); });
    }

    ensure();

    if (!observerStarted) {
      observerStarted = true;
      const observer = new MutationObserver(()=>ensure());
      observer.observe(document.body, { childList:true, subtree:true });
    }
  }

  window.addEventListener('pagehide', stopTyping, { passive:true });
  window.addEventListener('beforeunload', stopTyping, { passive:true });

  connect();
})();
