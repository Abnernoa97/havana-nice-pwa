/* HAVANA NICE — GLOBAL NATIVE BACK / NAVIGATION V1 */
(() => {
  'use strict';
  let armed = false;
  let lastScreen = null;
  const customIds = new Set(['calendarScreen','repertoireScreen','notificationsScreen','familyScreen','hn-chat-screen','moduleScreen']);

  function activeScreen() {
    return document.querySelector('.screen.is-active');
  }

  function showScreenById(id) {
    if (!id) return false;
    const target = document.getElementById(id);
    if (!target) return false;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('is-active'));
    target.classList.add('is-active');
    return true;
  }

  function hideLegacyCalendarLayer() {
    const calendar = document.getElementById('calendarScreen');
    const legacy = document.getElementById('moduleScreen');
    if (calendar?.classList.contains('is-active') && legacy) legacy.classList.remove('is-active');
  }

  function armBackForOpening(previousId) {
    try {
      history.pushState({ hnApp: true, hnPreviousScreen: previousId || 'homeScreen' }, '', location.href);
      armed = true;
    } catch (_) {}
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button, a');
    if (!button) return;
    if (button.id === 'logoutButton' || button.id === 'loginButton') return;
    const text = (button.textContent || '').trim().toUpperCase();
    const current = activeScreen();
    if (!current || current.id === 'loginScreen') return;

    const isChat = button.closest('#hn-chat-screen');
    if (isChat) return;

    const opensSection = button.classList.contains('module') || button.id === 'repertoireButton' || /^(VOLVER|BACK)$/i.test(text) === false && false;
    if (!opensSection) return;

    const previous = current.id || 'homeScreen';
    setTimeout(() => {
      hideLegacyCalendarLayer();
      const now = activeScreen();
      if (now && now.id !== previous && !armed) armBackForOpening(previous);
      lastScreen = now?.id || previous;
    }, 80);
  }, true);

  window.addEventListener('popstate', event => {
    if (!armed) return;
    const previous = event.state?.hnPreviousScreen || 'homeScreen';
    armed = false;
    if (!showScreenById(previous)) showScreenById('homeScreen');
    hideLegacyCalendarLayer();
  });

  const observer = new MutationObserver(() => hideLegacyCalendarLayer());
  observer.observe(document.documentElement, { subtree:true, attributes:true, attributeFilter:['class'] });

  setInterval(() => {
    hideLegacyCalendarLayer();
  }, 500);
})();
