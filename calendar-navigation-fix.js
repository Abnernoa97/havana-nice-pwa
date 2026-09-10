/* HAVANA NICE — CALENDAR NAVIGATION FIX ONLY */
(() => {
  'use strict';

  function bind() {
    const back = document.getElementById('calendarBack');
    if (!back || back.dataset.hnCalendarNavFixed === '1') return;

    back.dataset.hnCalendarNavFixed = '1';
    back.onclick = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      // Calendar navigation must use the same history entry created by
      // navigation-fix.js. This also clears its internal armed state.
      if (history.state && history.state.hnApp) {
        history.back();
        return;
      }

      // Safe fallback if the history entry is unavailable.
      document.getElementById('calendarScreen')?.classList.remove('is-active');
      document.getElementById('homeScreen')?.classList.add('is-active');
    };
  }

  bind();
  new MutationObserver(bind).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
