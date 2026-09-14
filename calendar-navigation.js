/* HAVANA NICE — CALENDAR NAVIGATION / CHAT-STYLE HISTORY */
(() => {
  'use strict';

  let bound = false;
  let historyArmed = false;
  let previousScreen = null;
  let videoWasMuted = true;

  const home = () => document.getElementById('homeScreen');
  const calendar = () => document.getElementById('calendarScreen');
  const legacyModule = () => document.getElementById('moduleScreen');

  function closeCalendar() {
    const screen = calendar();
    if (!screen) return;
    screen.classList.remove('is-active');
    if (previousScreen) previousScreen.classList.add('is-active');
    else home()?.classList.add('is-active');
    const video = document.getElementById('backgroundVideo');
    if (video) video.muted = videoWasMuted;
    historyArmed = false;
  }

  function openCalendar() {
    const screen = calendar();
    if (!screen) return;
    previousScreen = document.querySelector('.screen.is-active:not(#calendarScreen)') || home();
    document.querySelectorAll('.screen').forEach(s => {
      if (s !== screen) s.classList.remove('is-active');
    });
    legacyModule()?.classList.remove('is-active');
    screen.classList.add('is-active');
    const video = document.getElementById('backgroundVideo');
    if (video) {
      videoWasMuted = !!video.muted;
      video.muted = true;
      video.play().catch(() => {});
    }
    if (!historyArmed) {
      try {
        history.pushState({ ...(history.state || {}), hnCalendar: true }, '', location.href);
        historyArmed = true;
      } catch (_) {}
    }
  }

  function bindModule() {
    if (bound) return true;
    const module = [...document.querySelectorAll('.module[data-module]')]
      .find(x => x.dataset.module === 'CALENDARIO DE EVENTOS');
    if (!module) return false;
    bound = true;
    module.addEventListener('click', () => openCalendar());
    return true;
  }

  function watchCalendar() {
    bindModule();
    const screen = calendar();
    if (screen && screen.classList.contains('is-active')) {
      legacyModule()?.classList.remove('is-active');
    }
  }

  window.addEventListener('popstate', () => {
    if (calendar()?.classList.contains('is-active')) closeCalendar();
  });

  const observer = new MutationObserver(watchCalendar);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  watchCalendar();
})();
