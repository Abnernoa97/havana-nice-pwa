/* HAVANA NICE — INDEPENDENT NOTIFICATIONS ENTRY */
(() => {
  'use strict';

  function bind() {
    const module = [...document.querySelectorAll('.module[data-module]')]
      .find((item) => item.dataset.module === 'NOTIFICACIONES');
    if (!module || module.dataset.hnNotificationsBound === '1') return;

    module.dataset.hnNotificationsBound = '1';
    module.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = './notifications.html';
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }

  new MutationObserver(bind).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
