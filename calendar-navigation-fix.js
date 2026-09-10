/* HAVANA NICE — CALENDAR NAVIGATION ISOLATION V2 */
(() => {
  'use strict';

  function activeScreen() {
    return document.querySelector('.screen.is-active');
  }

  function hideLegacy() {
    document.getElementById('moduleScreen')?.classList.remove('is-active');
  }

  function openCalendarFromModule(event) {
    const button = event.target.closest('.module[data-module="CALENDARIO DE EVENTOS"]');
    if (!button) return;

    // Calendar owns its navigation. Do not let the global navigation-fix
    // capture this click or arm its own history state.
    event.preventDefault();
    event.stopImmediatePropagation();

    const calendar = document.getElementById('calendarScreen');
    if (!calendar) return;

    const current = activeScreen();
    const previous = current && current.id !== 'calendarScreen'
      ? current.id
      : 'homeScreen';

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('is-active'));
    calendar.classList.add('is-active');
    hideLegacy();

    try {
      history.pushState({
        hnCalendar: true,
        hnPreviousScreen: previous
      }, '', location.href);
    } catch (_) {}
  }

  function bindBack() {
    const back = document.getElementById('calendarBack');
    if (!back || back.dataset.hnCalendarNavFixed === '2') return;

    back.dataset.hnCalendarNavFixed = '2';
    back.onclick = event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (history.state?.hnCalendar) {
        history.back();
        return;
      }

      document.getElementById('calendarScreen')?.classList.remove('is-active');
      document.getElementById('homeScreen')?.classList.add('is-active');
      hideLegacy();
    };
  }

  document.addEventListener('click', openCalendarFromModule, true);
  window.addEventListener('popstate', event => {
    if (!event.state?.hnCalendar) return;
    const previous = event.state.hnPreviousScreen || 'homeScreen';
    document.getElementById('calendarScreen')?.classList.remove('is-active');
    document.getElementById(previous)?.classList.add('is-active');
    hideLegacy();
  });

  bindBack();
  new MutationObserver(bindBack).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
