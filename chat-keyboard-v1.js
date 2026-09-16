/* HAVANA NICE — CHAT KEYBOARD / COMPOSER FIX V2 */
(() => {
  'use strict';

  const STYLE_ID = 'hn-chat-keyboard-fix-style';
  let raf = 0;

  function getChat() {
    return document.getElementById('hn-chat-screen');
  }

  function getCompose() {
    return getChat()?.querySelector('.hn-chat-compose') || null;
  }

  function scheduleKeepVisible() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const chat = getChat();
      const compose = getCompose();
      const vv = window.visualViewport;
      if (!chat || !compose || !chat.classList.contains('is-active')) return;

      if (vv) {
        const rect = compose.getBoundingClientRect();
        const bottom = vv.offsetTop + vv.height;
        const overlap = rect.bottom - bottom;
        if (overlap > 0) {
          const list = chat.querySelector('.hn-chat-list');
          if (list) list.scrollTop += overlap + 12;
        }
      }

      compose.scrollIntoView({ block: 'end', inline: 'nearest', behavior: 'instant' });
      const list = chat.querySelector('.hn-chat-list');
      if (list) list.scrollTop = list.scrollHeight;
    });
  }

  function syncViewport() {
    const chat = getChat();
    if (!chat || !chat.classList.contains('is-active')) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const h = Math.round(vv.height);
    if (h > 0) {
      chat.style.setProperty('--hn-visual-height', `${h}px`);
      chat.style.height = `${h}px`;
      chat.style.maxHeight = `${h}px`;
    }
    scheduleKeepVisible();
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #hn-chat-screen.is-active{height:var(--hn-visual-height,100dvh)!important;max-height:var(--hn-visual-height,100dvh)!important;overflow:hidden!important;box-sizing:border-box!important}
      #hn-chat-screen.is-active .hn-chat-wrap{height:100%!important;min-height:0!important}
      #hn-chat-screen.is-active .hn-chat-list{min-height:0!important;overflow-y:auto!important}
      #hn-chat-screen.is-active .hn-chat-compose{position:relative!important;z-index:20!important;flex:0 0 auto!important;padding-bottom:max(8px,env(safe-area-inset-bottom))!important;background:rgba(0,0,0,.18)!important}
      #hn-chat-screen.is-active .hn-chat-input-wrap{z-index:21!important}
    `;
    document.head.appendChild(style);
  }

  function bind() {
    installStyles();
    const vv = window.visualViewport;
    if (vv && !vv.dataset?.hnKeyboardBound) {
      try { vv.dataset.hnKeyboardBound = '1'; } catch (_) {}
      vv.addEventListener('resize', syncViewport, { passive: true });
      vv.addEventListener('scroll', syncViewport, { passive: true });
    }

    document.addEventListener('focusin', e => {
      if (e.target?.matches?.('.hn-chat-input')) {
        setTimeout(syncViewport, 50);
        setTimeout(syncViewport, 220);
        setTimeout(syncViewport, 500);
      }
    }, { passive: true });

    document.addEventListener('submit', e => {
      if (e.target?.matches?.('.hn-chat-compose')) {
        setTimeout(syncViewport, 40);
        setTimeout(syncViewport, 180);
        setTimeout(syncViewport, 450);
      }
    }, { passive: true });

    const observer = new MutationObserver(() => {
      const chat = getChat();
      if (chat?.classList.contains('is-active')) scheduleKeepVisible();
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });

    syncViewport();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
