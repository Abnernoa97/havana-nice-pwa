/* HAVANA NICE — CALENDAR NAVIGATION / CHAT-STYLE HISTORY */
(() => {
  'use strict';

  let bound = false;
  let historyArmed = false;
  let previousScreen = null;
  let videoWasMuted = true;

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const home = () => document.getElementById('homeScreen');
  const calendar = () => document.getElementById('calendarScreen');
  const legacyModule = () => document.getElementById('moduleScreen');

  function setIOSCalendarMode(active) {
    if (!isIOS || !document.documentElement) return;
    document.documentElement.classList.toggle('hn-ios-calendar-open', !!active);
  }

  function closeCalendar(fromButton = false) {
    const screen = calendar();
    if (!screen) return;
    screen.classList.remove('is-active');
    setIOSCalendarMode(false);
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

  function openCalendar() {
    const screen = calendar();
    if (!screen) return;
    previousScreen = document.querySelector('.screen.is-active:not(#calendarScreen)') || home();
    document.querySelectorAll('.screen').forEach(s => {
      if (s !== screen) s.classList.remove('is-active');
    });
    legacyModule()?.classList.remove('is-active');
    screen.classList.add('is-active');
    setIOSCalendarMode(true);
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
      style.textContent = `
        .hn-calendar-back{flex:0 0 auto;width:100%;height:44px;margin-top:8px;border:1px solid rgba(229,189,98,.35);border-radius:0;background:rgba(0,0,0,.25);color:rgba(244,241,232,.72);font-size:9px;letter-spacing:.2em;text-transform:uppercase;cursor:pointer}
        html.hn-ios-calendar-open .screen:not(#calendarScreen){opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:none!important;transition:none!important}
        html.hn-ios-calendar-open #calendarScreen{opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:none!important;transition:none!important;z-index:20!important}
      `;
      document.head.appendChild(style);
    }
  }

  function bindModule() {
    if (bound) return true;
    const module = [...document.querySelectorAll('.module[data-module]')]
      .find(x => x.dataset.module === 'CALENDARIO DE EVENTOS');
    if (!module) return false;
    bound = true;
    if (isIOS) {
      // iOS-only interception: the legacy generic module handler otherwise opens
      // moduleScreen first, leaving its Repertoire content visible during the transition.
      module.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        openCalendar();
      }, true);
    } else {
      module.addEventListener('click', () => openCalendar());
    }
    return true;
  }

  function watchCalendar() {
    bindModule();
    const screen = calendar();
    if (screen) {
      ensureButton(screen);
      if (screen.classList.contains('is-active')) {
        legacyModule()?.classList.remove('is-active');
        setIOSCalendarMode(true);
      }
    }
  }

  window.addEventListener('popstate', () => {
    if (calendar()?.classList.contains('is-active')) closeCalendar(false);
  });

  const observer = new MutationObserver(watchCalendar);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  watchCalendar();
})();
