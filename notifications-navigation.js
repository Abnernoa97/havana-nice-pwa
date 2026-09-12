/* HAVANA NICE — NOTIFICATIONS NAVIGATION / CHAT-STYLE HISTORY */
(() => {
  'use strict';

  let bound = false;
  let historyArmed = false;
  let previousScreen = null;
  let videoWasMuted = true;
  let lightbox = null;

  const home = () => document.getElementById('homeScreen');
  const notifications = () => document.getElementById('moduleScreen');

  function isNotificationScreenActive() {
    const screen = notifications();
    return !!(screen?.classList.contains('is-active') && screen.querySelector('.hn-notify-screen'));
  }

  function closeNotifications(fromButton = false) {
    const screen = notifications();
    if (!screen) return;
    closeLightbox();
    screen.classList.remove('is-active');
    if (previousScreen) previousScreen.classList.add('is-active');
    else home()?.classList.add('is-active');
    const video = document.getElementById('backgroundVideo');
    if (video) video.muted = videoWasMuted;
    if (historyArmed && fromButton) {
      historyArmed = false;
      try { history.back(); } catch (_) {}
    } else if (!fromButton) {
      historyArmed = false;
    }
  }

  function openNotificationsHistory() {
    if (!isNotificationScreenActive()) return;
    previousScreen = document.querySelector('.screen.is-active:not(#moduleScreen)') || home();
    const video = document.getElementById('backgroundVideo');
    if (video) {
      videoWasMuted = !!video.muted;
      video.muted = true;
      video.play().catch(() => {});
    }
    if (!historyArmed) {
      try {
        history.pushState({ ...(history.state || {}), hnNotifications: true }, '', location.href);
        historyArmed = true;
      } catch (_) {}
    }
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.remove();
    lightbox = null;
  }

  function openLightbox(src, alt = '') {
    if (!src) return;
    closeLightbox();
    const overlay = document.createElement('div');
    overlay.className = 'hn-notify-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    const image = document.createElement('img');
    image.className = 'hn-notify-lightbox-image';
    image.src = src;
    image.alt = alt || 'Imagen de notificación';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'hn-notify-lightbox-close';
    close.setAttribute('aria-label', 'Cerrar');
    close.textContent = '×';
    overlay.appendChild(image);
    overlay.appendChild(close);
    document.body.appendChild(overlay);
    lightbox = overlay;
    const dismiss = (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeLightbox();
    };
    close.addEventListener('click', dismiss);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) dismiss(event);
    });
    image.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  }

  function ensureNotificationPhotoLightbox() {
    if (!document.getElementById('hn-notify-lightbox-style')) {
      const style = document.createElement('style');
      style.id = 'hn-notify-lightbox-style';
      style.textContent = `
        .hn-notify-screen .hn-n-image{cursor:zoom-in!important;touch-action:manipulation!important;}
        .hn-notify-lightbox{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;background:rgba(0,0,0,.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}
        .hn-notify-lightbox-image{display:block;max-width:96vw;max-height:92vh;width:auto;height:auto;object-fit:contain;box-shadow:0 12px 50px rgba(0,0,0,.6);}
        .hn-notify-lightbox-close{position:absolute;top:max(16px,env(safe-area-inset-top));right:16px;width:46px;height:46px;border:1px solid rgba(229,189,98,.7);border-radius:50%;background:rgba(0,0,0,.55);color:#fff1a8;font-size:30px;line-height:1;display:flex;align-items:center;justify-content:center;padding:0;}
      `;
      document.head.appendChild(style);
    }
    if (!document.documentElement.dataset.hnNotifyLightboxBound) {
      document.documentElement.dataset.hnNotifyLightboxBound = '1';
      document.addEventListener('click', (event) => {
        const image = event.target?.closest?.('.hn-notify-screen .hn-n-image');
        if (!image || !isNotificationScreenActive()) return;
        event.preventDefault();
        event.stopPropagation();
        openLightbox(image.currentSrc || image.src, image.alt || 'Imagen de notificación');
      }, true);
    }
  }

  function ensureTopButton(screen) {
    const inner = screen.querySelector('.hn-notify-screen');
    if (!inner || inner.querySelector('.hn-notify-top-back')) return;
    const heading = inner.querySelector('.hn-n-head');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'back-button hn-notify-top-back';
    button.textContent = 'VOLVER';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeNotifications(true);
    });
    if (heading) heading.insertAdjacentElement('afterend', button);
    else inner.insertBefore(button, inner.firstChild);
    if (!document.getElementById('hn-notify-nav-style')) {
      const style = document.createElement('style');
      style.id = 'hn-notify-nav-style';
      style.textContent = `.hn-notify-top-back{display:block!important;margin:18px 0 6px;position:relative;z-index:5;pointer-events:auto;width:100%;}`;
      document.head.appendChild(style);
    }
  }

  function bindModule() {
    if (bound) return true;
    bound = true;
    // notifications-v5.js handles the module click at document-capture level
    // and stops propagation. Listen at window-capture so the history entry is
    // armed before that handler runs, without changing notification behavior.
    window.addEventListener('click', (event) => {
      const target = event.target;
      const module = target && target.closest ? target.closest('.module[data-module]') : null;
      if (!module || module.dataset.module !== 'NOTIFICACIONES') return;
      const before = document.querySelector('.screen.is-active:not(#moduleScreen)') || home();
      previousScreen = before;
      setTimeout(() => {
        if (isNotificationScreenActive()) openNotificationsHistory();
      }, 0);
    }, true);
    return true;
  }

  function watchNotifications() {
    bindModule();
    ensureNotificationPhotoLightbox();
    const screen = notifications();
    if (screen && isNotificationScreenActive()) ensureTopButton(screen);
  }

  window.addEventListener('popstate', () => {
    closeLightbox();
    if (isNotificationScreenActive()) closeNotifications(false);
  });

  const observer = new MutationObserver(watchNotifications);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  watchNotifications();
})();
