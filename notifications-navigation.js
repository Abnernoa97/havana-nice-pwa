/* HAVANA NICE — NOTIFICATIONS NAVIGATION / CHAT-STYLE HISTORY */
(() => {
  'use strict';

  let bound = false;
  let historyArmed = false;
  let previousScreen = null;
  let videoWasMuted = true;

  const home = () => document.getElementById('homeScreen');
  const notifications = () => document.getElementById('moduleScreen');

  function isNotificationScreenActive() {
    const screen = notifications();
    return !!(screen?.classList.contains('is-active') && screen.querySelector('.hn-notify-screen'));
  }

  function closeNotifications(fromButton = false) {
    const screen = notifications();
    if (!screen) return;
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
    const module = [...document.querySelectorAll('.module[data-module]')]
      .find(x => x.dataset.module === 'NOTIFICACIONES');
    if (!module) return false;
    bound = true;
    module.addEventListener('click', () => {
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
    const screen = notifications();
    if (screen && isNotificationScreenActive()) ensureTopButton(screen);
  }

  window.addEventListener('popstate', () => {
    if (isNotificationScreenActive()) closeNotifications(false);
  });

  const observer = new MutationObserver(watchNotifications);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  watchNotifications();
})();
