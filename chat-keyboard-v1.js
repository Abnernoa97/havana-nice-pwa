/* HAVANA NICE — CHAT KEYBOARD / COMPOSER V9 */
(() => {
  'use strict';

  const STYLE_ID = 'hn-chat-keyboard-fix-style';
  let raf = 0;
  let bound = false;
  let composerResizeObserver = null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const getChat = () => document.getElementById('hn-chat-screen');
  const getCompose = () => getChat()?.querySelector('.hn-chat-compose') || null;
  const getList = () => getChat()?.querySelector('.hn-chat-list') || null;

  function isKeyboardOpen(vv) {
    if (!vv) return false;
    const screenHeight = Math.max(window.innerHeight || 0, document.documentElement?.clientHeight || 0);
    const visibleHeight = Math.max(0, vv.height || 0);
    return screenHeight > 0 && (screenHeight - visibleHeight) > 120;
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
    });
  }

  function bindComposerResize() {
    const compose = getCompose();
    if (!compose) return;
    if (typeof ResizeObserver === 'undefined') {
      syncComposerMetrics();
      return;
    }
    composerResizeObserver?.disconnect();
    composerResizeObserver = new ResizeObserver(syncComposerMetrics);
    composerResizeObserver.observe(compose);
    syncComposerMetrics();
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
    });
  }

  function scheduleKeepVisible() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const chat = getChat();
      const compose = getCompose();
      const vv = window.visualViewport;
      if (!chat || !compose || !chat.classList.contains('is-active')) return;

      syncComposerMetrics();
      const open = syncKeyboardState(vv);
      if (isIOS) {
        syncIOSComposer(vv);
        return;
      }

      if (vv && open) {
        const rect = compose.getBoundingClientRect();
        const bottom = vv.offsetTop + vv.height;
        const overlap = rect.bottom - bottom;
        if (overlap > 0) {
          const list = getList();
          if (list) list.scrollTop += overlap + 8;
        }
      }
    });
  }

  function syncViewport() {
    const chat = getChat();
    if (!chat || !chat.classList.contains('is-active')) return;
    const vv = window.visualViewport;
    if (!vv) return;

    syncComposerMetrics();
    const open = syncKeyboardState(vv);
    if (isIOS) {
      syncIOSComposer(vv);
      return;
    }

    const h = Math.round(vv.height);
    if (h > 0) {
      chat.style.setProperty('--hn-visual-height', `${h}px`);
      chat.style.height = `${h}px`;
      chat.style.maxHeight = `${h}px`;
    }
    if (open) scheduleKeepVisible();
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

      /* Empty composer = microphone. Text/media/voice ready = send. */
      #hn-chat-screen.is-active .hn-chat-compose:has(.hn-chat-input:placeholder-shown):not(:has(.hn-chat-media-pending.is-visible)):not(:has(.hn-chat-recording.is-pending)) .hn-chat-send{display:none!important}
      #hn-chat-screen.is-active .hn-chat-compose:has(.hn-chat-input:placeholder-shown):not(:has(.hn-chat-media-pending.is-visible)):not(:has(.hn-chat-recording.is-pending)) .hn-chat-mic{display:flex!important}

      /* Sender metadata: gold, always distinct from message content. */
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

    /* The core owns active states. We only correct the initial empty state. */
    if (send && input && !String(input.value || '').trim() && !hasPendingMedia && !hasPendingVoice) {
      send.disabled = true;
    }

    const attach = chat.querySelector('.hn-chat-attach');
    if (attach) attach.setAttribute('aria-label', 'Adjuntar');
    syncComposerMetrics();
  }

  function bind() {
    if (bound) return;
    bound = true;
    installStyles();
    normalizeComposer();
    bindComposerResize();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', syncViewport, { passive: true });
      vv.addEventListener('scroll', syncViewport, { passive: true });
    }
    window.addEventListener('resize', syncComposerMetrics, { passive: true });

    document.addEventListener('focusin', e => {
      if (e.target?.matches?.('.hn-chat-input')) {
        normalizeComposer();
        setTimeout(syncViewport, 80);
        setTimeout(syncViewport, 260);
      }
    }, { passive: true });

    document.addEventListener('submit', e => {
      if (e.target?.matches?.('.hn-chat-compose')) {
        setTimeout(syncViewport, 80);
        setTimeout(syncViewport, 260);
      }
    }, { passive: true });

    const observer = new MutationObserver(() => {
      const chat = getChat();
      if (chat) {
        normalizeComposer();
        bindComposerResize();
      }
      if (chat?.classList.contains('is-active')) scheduleKeepVisible();
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class']
    });

    syncViewport();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
