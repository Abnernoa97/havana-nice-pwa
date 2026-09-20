/* HAVANA NICE — CHAT KEYBOARD / COMPOSER V10
   Stable mobile viewport + latest-message follow.
   Scoped to Chat only. No global DOM observer.
*/
(() => {
  'use strict';
  if (window.__hnChatKeyboardV10) return;
  window.__hnChatKeyboardV10 = true;

  const STYLE_ID = 'hn-chat-keyboard-fix-style';
  const FOLLOW_THRESHOLD = 120;
  let raf = 0;
  let boundGlobal = false;
  let boundChat = null;
  let composeResizeObserver = null;
  let listObserver = null;
  let userIntentUntil = 0;
  let followingLatest = true;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const getChat = () => document.getElementById('hn-chat-screen');
  const getCompose = () => getChat()?.querySelector('.hn-chat-compose') || null;
  const getList = () => getChat()?.querySelector('.hn-chat-list') || null;

  function isKeyboardOpen(vv) {
    if (!vv) return false;
    const layoutHeight = Math.max(window.innerHeight || 0, document.documentElement?.clientHeight || 0);
    const visibleHeight = Math.max(0, vv.height || 0);
    return layoutHeight > 0 && (layoutHeight - visibleHeight) > 120;
  }

  function distanceFromBottom() {
    const list = getList();
    if (!list) return Infinity;
    return Math.max(0, list.scrollHeight - list.scrollTop - list.clientHeight);
  }

  function nearBottom(threshold = FOLLOW_THRESHOLD) {
    return distanceFromBottom() <= threshold;
  }

  function scrollLatest(force = false) {
    const chat = getChat();
    const list = getList();
    if (!chat || !list || !chat.classList.contains('is-active')) return;
    if (!force && !followingLatest) return;
    followingLatest = true;
    const move = () => {
      if (!followingLatest || !list.isConnected) return;
      try { list.scrollTop = list.scrollHeight; } catch (_) {}
    };
    requestAnimationFrame(() => {
      move();
      requestAnimationFrame(move);
    });
    setTimeout(move, 70);
    setTimeout(move, 180);
  }

  function markUserIntent() {
    userIntentUntil = Date.now() + 900;
  }

  function onListScroll() {
    if (Date.now() <= userIntentUntil) followingLatest = nearBottom();
  }

  function syncKeyboardState(vv) {
    const chat = getChat();
    if (!chat) return false;
    const open = isKeyboardOpen(vv);
    chat.classList.toggle('hn-keyboard-open', open);
    chat.classList.toggle('hn-ios-keyboard', isIOS && open);
    return open;
  }

  function syncComposerMetrics() {
    const chat = getChat();
    const compose = getCompose();
    if (!chat || !compose) return;
    requestAnimationFrame(() => {
      const height = Math.max(56, Math.ceil(compose.getBoundingClientRect().height || 0));
      chat.style.setProperty('--hn-compose-height', `${height}px`);
      if (followingLatest) scrollLatest();
    });
  }

  function syncIOSComposer(vv) {
    const chat = getChat();
    const compose = getCompose();
    if (!chat || !compose || !isIOS) return;
    const open = syncKeyboardState(vv);
    syncComposerMetrics();
    if (!open) {
      chat.style.removeProperty('--hn-keyboard-height');
      chat.style.removeProperty('--hn-chat-bottom-space');
      return;
    }
    const viewportBottom = (vv?.offsetTop || 0) + (vv?.height || window.innerHeight || 0);
    const layoutBottom = window.innerHeight || document.documentElement.clientHeight || 0;
    const keyboardHeight = Math.max(0, layoutBottom - viewportBottom);
    chat.style.setProperty('--hn-keyboard-height', `${Math.round(keyboardHeight)}px`);
    requestAnimationFrame(() => {
      const height = Math.max(56, Math.ceil(compose.getBoundingClientRect().height || 0));
      chat.style.setProperty('--hn-compose-height', `${height}px`);
      chat.style.setProperty('--hn-chat-bottom-space', `${Math.round(keyboardHeight + height + 10)}px`);
      if (followingLatest) scrollLatest();
    });
  }

  function syncViewport() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const chat = getChat();
      if (!chat || !chat.classList.contains('is-active')) return;
      bindChat();
      const vv = window.visualViewport;
      syncComposerMetrics();
      const open = syncKeyboardState(vv);

      if (isIOS) {
        syncIOSComposer(vv);
      } else if (vv && open) {
        const h = Math.max(1, Math.round(vv.height));
        chat.style.setProperty('--hn-visual-height', `${h}px`);
        chat.style.height = `${h}px`;
        chat.style.maxHeight = `${h}px`;
      } else {
        chat.style.removeProperty('--hn-visual-height');
        chat.style.removeProperty('height');
        chat.style.removeProperty('max-height');
      }

      if (followingLatest) {
        scrollLatest();
        setTimeout(() => scrollLatest(), 120);
        setTimeout(() => scrollLatest(), 280);
      }
    });
  }

  function installStyles() {
    document.getElementById(STYLE_ID)?.remove();
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #hn-chat-screen.is-active{box-sizing:border-box!important;padding-bottom:0!important}
      #hn-chat-screen.is-active .hn-chat-wrap{min-height:0!important;height:100%!important;padding-bottom:0!important}
      #hn-chat-screen.is-active .hn-chat-list{min-height:0!important;overflow-y:auto!important;padding-bottom:calc(var(--hn-compose-height,86px) + 10px)!important;scroll-padding-bottom:calc(var(--hn-compose-height,86px) + 10px)!important}

      #hn-chat-screen.is-active .hn-chat-compose{position:fixed!important;z-index:400!important;left:max(4px,env(safe-area-inset-left))!important;right:max(4px,env(safe-area-inset-right))!important;bottom:0!important;width:auto!important;max-width:none!important;min-height:0!important;margin:0!important;padding:4px 2px max(4px,env(safe-area-inset-bottom))!important;display:grid!important;grid-template-columns:minmax(0,1fr) 54px!important;grid-auto-flow:row!important;column-gap:8px!important;row-gap:6px!important;align-items:end!important;border:0!important;background:#f4f0e8!important;box-shadow:none!important;box-sizing:border-box!important}
      #hn-chat-screen.is-active .hn-chat-input-wrap{z-index:401!important;grid-column:1!important;position:relative!important;display:block!important;width:100%!important;min-width:0!important;height:52px!important;margin:0!important}
      #hn-chat-screen.is-active .hn-chat-input{display:block!important;width:100%!important;height:52px!important;min-height:52px!important;max-height:112px!important;margin:0!important;padding:14px 54px 12px 18px!important;border:1px solid #ddd7cf!important;border-radius:26px!important;outline:0!important;background:#fff!important;color:#2d2924!important;font:400 16px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;letter-spacing:0!important;text-transform:none!important;resize:none!important;overflow-y:auto!important;box-shadow:none!important;box-sizing:border-box!important;-webkit-appearance:none!important;appearance:none!important}
      #hn-chat-screen.is-active .hn-chat-input::placeholder{color:#8e8982!important;opacity:1!important;text-transform:none!important}

      #hn-chat-screen.is-active .hn-chat-attach{position:absolute!important;right:8px!important;bottom:5px!important;width:42px!important;height:42px!important;margin:0!important;padding:0!important;border:0!important;border-radius:50%!important;background:transparent!important;color:#625f5a!important;font-size:0!important;box-shadow:none!important;display:flex!important;align-items:center!important;justify-content:center!important}
      #hn-chat-screen.is-active .hn-chat-attach::before{content:'📎';font-size:21px!important;line-height:1!important;filter:grayscale(1)!important}

      #hn-chat-screen.is-active .hn-chat-mic{position:absolute!important;right:-62px!important;bottom:-1px!important;width:54px!important;height:54px!important;margin:0!important;padding:0!important;border:0!important;border-radius:50%!important;background:#174d3b!important;color:#fff!important;font-size:0!important;box-shadow:none!important;display:flex!important;align-items:center!important;justify-content:center!important}
      #hn-chat-screen.is-active .hn-chat-mic::before{content:'●';width:14px!important;height:20px!important;border:2px solid #fff!important;border-radius:8px!important;color:transparent!important;box-sizing:border-box!important}
      #hn-chat-screen.is-active .hn-chat-mic::after{content:'';position:absolute!important;width:22px!important;height:22px!important;border:2px solid transparent!important;border-bottom-color:#fff!important;border-left-color:#fff!important;border-radius:0 0 12px 12px!important;transform:translateY(3px)!important}
      #hn-chat-screen.is-active .hn-chat-mic.is-recording{background:#8d2929!important;color:#fff!important}

      #hn-chat-screen.is-active .hn-chat-send{grid-column:2!important;width:54px!important;height:54px!important;min-width:54px!important;min-height:54px!important;margin:0!important;padding:0!important;border:0!important;border-radius:50%!important;background:#174d3b!important;color:#fff!important;font-size:0!important;line-height:1!important;box-shadow:none!important;align-self:end!important}
      #hn-chat-screen.is-active .hn-chat-send::before{content:'➤';display:block!important;color:#fff!important;font-size:23px!important;line-height:54px!important;transform:translateX(1px)!important}
      #hn-chat-screen.is-active .hn-chat-send:disabled{display:none!important}
      #hn-chat-screen.is-active .hn-chat-compose:has(.hn-chat-send:not(:disabled)) .hn-chat-mic{display:none!important}

      #hn-chat-screen.is-active .hn-chat-compose:has(.hn-chat-input:placeholder-shown):not(:has(.hn-chat-media-pending.is-visible)):not(:has(.hn-chat-recording.is-pending)) .hn-chat-send{display:none!important}
      #hn-chat-screen.is-active .hn-chat-compose:has(.hn-chat-input:placeholder-shown):not(:has(.hn-chat-media-pending.is-visible)):not(:has(.hn-chat-recording.is-pending)) .hn-chat-mic{display:flex!important}

      #hn-chat-screen.is-active .hn-chat-time{color:#d9b45f!important;font-weight:700!important}
      #hn-chat-screen.is-active .hn-chat-row.mine .hn-chat-time{color:#d9b45f!important;font-weight:700!important}

      #hn-chat-screen.is-active .hn-chat-media-pending,#hn-chat-screen.is-active .hn-chat-recording{grid-column:1 / -1!important}
      #hn-chat-screen.is-active.hn-keyboard-open .hn-chat-head{display:none!important}
      #hn-chat-screen.is-active.hn-ios-keyboard .hn-chat-compose{left:max(4px,env(safe-area-inset-left))!important;right:max(4px,env(safe-area-inset-right))!important;bottom:var(--hn-keyboard-height,0px)!important;padding-bottom:4px!important}
      #hn-chat-screen.is-active.hn-ios-keyboard .hn-chat-list{padding-bottom:var(--hn-chat-bottom-space,140px)!important;scroll-padding-bottom:var(--hn-chat-bottom-space,140px)!important}

      @media(max-width:430px){
        #hn-chat-screen.is-active .hn-chat-compose{grid-template-columns:minmax(0,1fr) 50px!important;column-gap:7px!important;left:max(2px,env(safe-area-inset-left))!important;right:max(2px,env(safe-area-inset-right))!important;padding-left:1px!important;padding-right:1px!important}
        #hn-chat-screen.is-active .hn-chat-input-wrap,#hn-chat-screen.is-active .hn-chat-input{height:50px!important;min-height:50px!important}
        #hn-chat-screen.is-active .hn-chat-input{border-radius:25px!important;padding-left:16px!important;padding-right:50px!important;font-size:16px!important}
        #hn-chat-screen.is-active .hn-chat-attach{width:40px!important;height:40px!important;bottom:5px!important;right:6px!important}
        #hn-chat-screen.is-active .hn-chat-mic{right:-57px!important;width:50px!important;height:50px!important}
        #hn-chat-screen.is-active .hn-chat-send{width:50px!important;height:50px!important;min-width:50px!important;min-height:50px!important}
        #hn-chat-screen.is-active .hn-chat-send::before{line-height:50px!important;font-size:21px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeComposer() {
    const chat = getChat();
    if (!chat) return;
    const input = chat.querySelector('.hn-chat-input');
    const send = chat.querySelector('.hn-chat-send');
    const hasPendingMedia = !!chat.querySelector('.hn-chat-media-pending.is-visible');
    const hasPendingVoice = !!chat.querySelector('.hn-chat-recording.is-pending');

    if (input && input.dataset.hnWhatsappComposer !== '1') {
      input.dataset.hnWhatsappComposer = '1';
      input.placeholder = 'Mensaje';
      input.setAttribute('aria-label', 'Mensaje');
    }
    if (send && input && !String(input.value || '').trim() && !hasPendingMedia && !hasPendingVoice) send.disabled = true;
    chat.querySelector('.hn-chat-attach')?.setAttribute('aria-label', 'Adjuntar');
    syncComposerMetrics();
  }

  function bindChat() {
    const chat = getChat();
    const list = getList();
    const compose = getCompose();
    if (!chat || !list || !compose) return false;
    if (boundChat === chat) return true;

    boundChat = chat;
    followingLatest = true;
    normalizeComposer();

    ['touchstart','pointerdown','wheel'].forEach(type => list.addEventListener(type, markUserIntent, { passive:true }));
    list.addEventListener('scroll', onListScroll, { passive:true });
    list.addEventListener('load', e => { if (e.target?.tagName === 'IMG' && followingLatest) scrollLatest(); }, true);

    listObserver?.disconnect();
    listObserver = new MutationObserver(() => {
      if (followingLatest) scrollLatest();
    });
    listObserver.observe(list, { childList:true });

    composeResizeObserver?.disconnect();
    if (typeof ResizeObserver !== 'undefined') {
      composeResizeObserver = new ResizeObserver(() => {
        syncComposerMetrics();
        if (followingLatest) scrollLatest();
      });
      composeResizeObserver.observe(compose);
    }

    scrollLatest(true);
    return true;
  }

  function bindGlobal() {
    if (boundGlobal) return;
    boundGlobal = true;
    installStyles();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', syncViewport, { passive:true });
      vv.addEventListener('scroll', syncViewport, { passive:true });
    }
    window.addEventListener('resize', syncViewport, { passive:true });

    document.addEventListener('click', e => {
      if (e.target?.closest?.('.hn-chat-module')) {
        followingLatest = true;
        setTimeout(() => { bindChat(); syncViewport(); scrollLatest(true); }, 0);
        setTimeout(() => { syncViewport(); scrollLatest(true); }, 120);
      }
    }, { passive:true });

    document.addEventListener('focusin', e => {
      if (e.target?.matches?.('.hn-chat-input')) {
        bindChat();
        followingLatest = true;
        setTimeout(syncViewport, 50);
        setTimeout(syncViewport, 180);
        setTimeout(() => scrollLatest(true), 300);
      }
    }, { passive:true });

    document.addEventListener('submit', e => {
      if (e.target?.matches?.('.hn-chat-compose')) {
        followingLatest = true;
        setTimeout(() => scrollLatest(true), 30);
        setTimeout(syncViewport, 100);
        setTimeout(() => scrollLatest(true), 220);
      }
    }, { passive:true });

    window.addEventListener('pageshow', () => { if (getChat()?.classList.contains('is-active')) { bindChat(); syncViewport(); scrollLatest(true); } }, { passive:true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && getChat()?.classList.contains('is-active')) { bindChat(); syncViewport(); if (followingLatest) scrollLatest(); } }, { passive:true });

    bindChat();
    syncViewport();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindGlobal, { once:true });
  else bindGlobal();
})();
