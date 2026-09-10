/* HAVANA NICE — CALENDAR NAVIGATION / CHAT-STYLE HISTORY */
(() => {
  'use strict';

  let bound = false;
  let historyArmed = false;
  let previousScreen = null;
  let videoWasMuted = true;

  const home = () => document.getElementById('homeScreen');
  const calendar = () => document.getElementById('calendarScreen');

  function closeCalendar(fromButton = false) {
    const screen = calendar();
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

  function openCalendarHistory() {
    const screen = calendar();
    if (!screen) return;

    previousScreen = document.querySelector('.screen.is-active:not(#calendarScreen)') || home();

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

  function ensureButton(screen) {
    if (screen.querySelector('.hn-calendar-back')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hn-calendar-back';
    button.textContent = 'VOLVER';
    button.addEventListener('click', () => closeCalendar(true));

    const inner = screen.querySelector('.calendar-inner') || screen;
    inner.appendChild(button);

    if (!document.getElementById('hn-calendar-nav-style')) {
      const style = document.createElement('style');
      style.id = 'hn-calendar-nav-style';
      style.textContent = `.hn-calendar-back{flex:0 0 auto;width:100%;height:44px;margin-top:8px;border:1px solid rgba(229,189,98,.35);border-radius:0;background:rgba(0,0,0,.25);color:rgba(244,241,232,.72);font-size:9px;letter-spacing:.2em;text-transform:uppercase;cursor:pointer}`;
      document.head.appendChild(style);
    }
  }

  function bindModule() {
    if (bound) return true;
    const module = [...document.querySelectorAll('.module[data-module]')]
      .find(x => x.dataset.module === 'CALENDARIO DE EVENTOS');
    if (!module) return false;

    bound = true;
    module.addEventListener('click', () => {
      const before = document.querySelector('.screen.is-active:not(#calendarScreen)') || home();
      previousScreen = before;
      setTimeout(() => {
        if (calendar()?.classList.contains('is-active')) openCalendarHistory();
      }, 0);
    }, true);

    return true;
  }

  function watchCalendar() {
    bindModule();
    const screen = calendar();
    if (screen) ensureButton(screen);
  }

  window.addEventListener('popstate', () => {
    if (calendar()?.classList.contains('is-active')) closeCalendar(false);
  });

  const observer = new MutationObserver(watchCalendar);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  setInterval(watchCalendar, 500);
  watchCalendar();
})();
