/* HAVANA NICE — CHAT KEYBOARD / COMPOSER FIX V5 */
(() => {
  'use strict';

  const STYLE_ID = 'hn-chat-keyboard-fix-style';
  let raf = 0;
  let bound = false;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function getChat() {
    return document.getElementById('hn-chat-screen');
  }

  function getCompose() {
    return getChat()?.querySelector('.hn-chat-compose') || null;
  }

  function getList() {
    return getChat()?.querySelector('.hn-chat-list') || null;
  }

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

  function scrollChatToBottom() {
    if (!isIOS) return;
    const chat = getChat();
    const list = getList();
    if (!chat || !list || !chat.classList.contains('is-active')) return;
    const move = () => {
      try { list.scrollTop = list.scrollHeight; } catch (_) {}
    };
    requestAnimationFrame(() => {
      move();
      requestAnimationFrame(move);
    });
  }

  function syncIOSComposer(vv) {
    const chat = getChat();
    const compose = getCompose();
    if (!chat || !compose || !isIOS) return;

    const open = syncKeyboardState(vv);
    if (!open) {
      chat.style.removeProperty('--hn-keyboard-height');
      chat.style.removeProperty('--hn-compose-height');
      chat.style.removeProperty('--hn-chat-bottom-space');
      return;
    }

    const viewportBottom = (vv?.offsetTop || 0) + (vv?.height || window.innerHeight || 0);
    const layoutBottom = window.innerHeight || document.documentElement.clientHeight || 0;
    const keyboardHeight = Math.max(0, layoutBottom - viewportBottom);

    chat.style.setProperty('--hn-keyboard-height', `${Math.round(keyboardHeight)}px`);

    requestAnimationFrame(() => {
      const height = Math.ceil(compose.getBoundingClientRect().height || 0);
      chat.style.setProperty('--hn-compose-height', `${height}px`);
      chat.style.setProperty('--hn-chat-bottom-space', `${Math.round(keyboardHeight + height + 24)}px`);
    });
  }

  function scheduleKeepVisible() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const chat = getChat();
      const compose = getCompose();
      const vv = window.visualViewport;
      if (!chat || !compose || !chat.classList.contains('is-active')) return;

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
          const list = chat.querySelector('.hn-chat-list');
          if (list) list.scrollTop += overlap + 12;
        }
      }
    });
  }

  function syncViewport() {
    const chat = getChat();
    if (!chat || !chat.classList.contains('is-active')) return;
    const vv = window.visualViewport;
    if (!vv) return;

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
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #hn-chat-screen.is-active{box-sizing:border-box!important}
      #hn-chat-screen.is-active .hn-chat-wrap{min-height:0!important}
      #hn-chat-screen.is-active .hn-chat-list{min-height:0!important;overflow-y:auto!important}
      #hn-chat-screen.is-active .hn-chat-compose{z-index:20!important;flex:0 0 auto!important;padding-bottom:max(8px,env(safe-area-inset-bottom))!important;background:rgba(0,0,0,.18)!important}
      #hn-chat-screen.is-active .hn-chat-input-wrap{z-index:21!important}
      #hn-chat-screen.is-active.hn-keyboard-open .hn-chat-head{display:none!important}

      /* iOS: keep the composer attached to the visual viewport instead of
         resizing the entire chat. This prevents Safari from stretching the
         composer/input when the native keyboard appears. */
      #hn-chat-screen.is-active.hn-ios-keyboard .hn-chat-compose{
        position:fixed!important;
        left:max(24px,env(safe-area-inset-left))!important;
        right:max(24px,env(safe-area-inset-right))!important;
        bottom:var(--hn-keyboard-height,0px)!important;
        width:auto!important;
        max-width:720px!important;
        margin-left:auto!important;
        margin-right:auto!important;
      }
      #hn-chat-screen.is-active.hn-ios-keyboard .hn-chat-list{
        padding-bottom:var(--hn-chat-bottom-space,180px)!important;
        scroll-padding-bottom:var(--hn-chat-bottom-space,180px)!important;
      }
    `;
    document.head.appendChild(style);
  }

  function bind() {
    if (bound) return;
    bound = true;
    installStyles();

    const vv = window.visualViewport;
    if (vv && !vv.dataset?.hnKeyboardBoundV4) {
      try { vv.dataset.hnKeyboardBoundV4 = '1'; } catch (_) {}
      vv.addEventListener('resize', syncViewport, { passive: true });
      vv.addEventListener('scroll', syncViewport, { passive: true });
    }

    document.addEventListener('focusin', e => {
      if (e.target?.matches?.('.hn-chat-input')) {
        setTimeout(syncViewport, 80);
        setTimeout(syncViewport, 260);
        if (isIOS) {
          setTimeout(scrollChatToBottom, 120);
          setTimeout(scrollChatToBottom, 300);
        }
      }
    }, { passive: true });

    document.addEventListener('submit', e => {
      if (e.target?.matches?.('.hn-chat-compose')) {
        setTimeout(syncViewport, 80);
        setTimeout(syncViewport, 260);
        if (isIOS) {
          setTimeout(scrollChatToBottom, 100);
          setTimeout(scrollChatToBottom, 300);
          setTimeout(scrollChatToBottom, 600);
        }
      }
    }, { passive: true });

    const observer = new MutationObserver(() => {
      const chat = getChat();
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
