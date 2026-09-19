/* HAVANA NICE — CHAT KEYBOARD / COMPOSER V6 */
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
      chat.style.setProperty('--hn-chat-bottom-space', `${Math.round(keyboardHeight + height + 16)}px`);
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
    const old = document.getElementById(STYLE_ID);
    if (old) old.remove();
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #hn-chat-screen.is-active{box-sizing:border-box!important}
      #hn-chat-screen.is-active .hn-chat-wrap{min-height:0!important}
      #hn-chat-screen.is-active .hn-chat-list{min-height:0!important;overflow-y:auto!important}

      /* WhatsApp-like bottom composer: one slim row, long input, one round action button. */
      #hn-chat-screen.is-active .hn-chat-compose{
        z-index:40!important;
        flex:0 0 auto!important;
        display:grid!important;
        grid-template-columns:minmax(0,1fr) 54px!important;
        grid-auto-flow:row!important;
        column-gap:8px!important;
        row-gap:7px!important;
        align-items:end!important;
        width:100%!important;
        min-height:0!important;
        margin:0!important;
        padding:7px 4px max(7px,env(safe-area-inset-bottom))!important;
        border:0!important;
        background:#f4f0e8!important;
        box-shadow:none!important;
        box-sizing:border-box!important;
      }

      #hn-chat-screen.is-active .hn-chat-input-wrap{
        z-index:41!important;
        grid-column:1!important;
        position:relative!important;
        width:100%!important;
        min-width:0!important;
        height:52px!important;
        margin:0!important;
      }

      #hn-chat-screen.is-active .hn-chat-input{
        display:block!important;
        width:100%!important;
        height:52px!important;
        min-height:52px!important;
        max-height:112px!important;
        margin:0!important;
        padding:14px 54px 12px 18px!important;
        border:1px solid #ddd7cf!important;
        border-radius:26px!important;
        outline:0!important;
        background:#fff!important;
        color:#2d2924!important;
        font:400 16px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;
        letter-spacing:0!important;
        text-transform:none!important;
        resize:none!important;
        overflow-y:auto!important;
        box-shadow:none!important;
        box-sizing:border-box!important;
        -webkit-appearance:none!important;
        appearance:none!important;
      }
      #hn-chat-screen.is-active .hn-chat-input::placeholder{
        color:#8e8982!important;
        opacity:1!important;
        text-transform:none!important;
      }

      /* Attachment lives inside the input, like WhatsApp. */
      #hn-chat-screen.is-active .hn-chat-attach{
        position:absolute!important;
        right:8px!important;
        bottom:5px!important;
        left:auto!important;
        top:auto!important;
        width:42px!important;
        height:42px!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        border-radius:50%!important;
        background:transparent!important;
        color:#625f5a!important;
        font-size:0!important;
        box-shadow:none!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
      }
      #hn-chat-screen.is-active .hn-chat-attach::before{
        content:'📎';
        font-size:21px!important;
        line-height:1!important;
        filter:grayscale(1)!important;
      }

      /* Mic occupies the right-side WhatsApp action circle while the composer is empty. */
      #hn-chat-screen.is-active .hn-chat-mic{
        position:absolute!important;
        right:-62px!important;
        bottom:-1px!important;
        left:auto!important;
        top:auto!important;
        width:54px!important;
        height:54px!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        border-radius:50%!important;
        background:#174d3b!important;
        color:#fff!important;
        font-size:0!important;
        box-shadow:none!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
      }
      #hn-chat-screen.is-active .hn-chat-mic::before{
        content:'●';
        width:14px!important;
        height:20px!important;
        border:2px solid #fff!important;
        border-radius:8px!important;
        color:transparent!important;
        box-sizing:border-box!important;
      }
      #hn-chat-screen.is-active .hn-chat-mic::after{
        content:'';
        position:absolute!important;
        width:22px!important;
        height:22px!important;
        border:2px solid transparent!important;
        border-bottom-color:#fff!important;
        border-left-color:#fff!important;
        border-radius:0 0 12px 12px!important;
        transform:translateY(3px)!important;
      }
      #hn-chat-screen.is-active .hn-chat-mic.is-recording{background:#8d2929!important;color:#fff!important}

      /* Send takes exactly the same circle as the mic once there is content. */
      #hn-chat-screen.is-active .hn-chat-send{
        grid-column:2!important;
        width:54px!important;
        height:54px!important;
        min-width:54px!important;
        min-height:54px!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        border-radius:50%!important;
        background:#174d3b!important;
        color:#fff!important;
        font-size:0!important;
        line-height:1!important;
        box-shadow:none!important;
        align-self:end!important;
      }
      #hn-chat-screen.is-active .hn-chat-send::before{
        content:'➤';
        display:block!important;
        color:#fff!important;
        font-size:23px!important;
        line-height:54px!important;
        transform:translateX(1px)!important;
      }
      #hn-chat-screen.is-active .hn-chat-send:disabled{
        display:none!important;
      }
      #hn-chat-screen.is-active .hn-chat-compose:has(.hn-chat-send:not(:disabled)) .hn-chat-mic{
        display:none!important;
      }

      #hn-chat-screen.is-active .hn-chat-media-pending,
      #hn-chat-screen.is-active .hn-chat-recording{
        grid-column:1 / -1!important;
      }

      #hn-chat-screen.is-active.hn-keyboard-open .hn-chat-head{display:none!important}

      /* iOS: pin the composer to the visible viewport with WhatsApp-like edge spacing. */
      #hn-chat-screen.is-active.hn-ios-keyboard .hn-chat-compose{
        position:fixed!important;
        left:max(6px,env(safe-area-inset-left))!important;
        right:max(6px,env(safe-area-inset-right))!important;
        bottom:var(--hn-keyboard-height,0px)!important;
        width:auto!important;
        max-width:none!important;
        margin:0!important;
        padding-left:2px!important;
        padding-right:2px!important;
      }
      #hn-chat-screen.is-active.hn-ios-keyboard .hn-chat-list{
        padding-bottom:var(--hn-chat-bottom-space,150px)!important;
        scroll-padding-bottom:var(--hn-chat-bottom-space,150px)!important;
      }

      @media(max-width:430px){
        #hn-chat-screen.is-active .hn-chat-compose{
          grid-template-columns:minmax(0,1fr) 50px!important;
          column-gap:7px!important;
          padding-left:1px!important;
          padding-right:1px!important;
        }
        #hn-chat-screen.is-active .hn-chat-input-wrap,
        #hn-chat-screen.is-active .hn-chat-input{height:50px!important;min-height:50px!important}
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
    if (input && input.dataset.hnWhatsappComposer !== '1') {
      input.dataset.hnWhatsappComposer = '1';
      input.placeholder = 'Mensaje';
      input.setAttribute('aria-label', 'Mensaje');
    }
    const attach = chat.querySelector('.hn-chat-attach');
    if (attach) attach.setAttribute('aria-label', 'Adjuntar');
  }

  function bind() {
    if (bound) return;
    bound = true;
    installStyles();
    normalizeComposer();

    const vv = window.visualViewport;
    if (vv && !vv.dataset?.hnKeyboardBoundV6) {
      try { vv.dataset.hnKeyboardBoundV6 = '1'; } catch (_) {}
      vv.addEventListener('resize', syncViewport, { passive: true });
      vv.addEventListener('scroll', syncViewport, { passive: true });
    }

    document.addEventListener('focusin', e => {
      if (e.target?.matches?.('.hn-chat-input')) {
        normalizeComposer();
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
      if (chat) normalizeComposer();
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
