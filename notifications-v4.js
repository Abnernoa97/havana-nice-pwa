(function () {
  'use strict';

  // Notification runtime is intentionally isolated from the musician login flow.
  // It uses the existing Supabase client exposed by index.html as window.hnSupabase.
  var CACHE_KEY = 'hn_notifications_cache_v1';
  var MAX_ITEMS = 50;
  var items = [];
  var unread = 0;
  var pollTimer = null;
  var realtimeChannel = null;

  function client() {
    return window.hnSupabase || null;
  }

  function safeParse(value, fallback) {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }

  function loadCache() {
    var raw = localStorage.getItem(CACHE_KEY);
    var cached = raw ? safeParse(raw, []) : [];
    if (!Array.isArray(cached)) cached = [];
    items = cached.filter(function (x) { return x && x.id; }).slice(0, MAX_ITEMS);
    items.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
  }

  function saveCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS))); } catch (_) {}
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[c];
    });
  }

  function mergeItems(incoming, markUnread) {
    var changed = false;
    (incoming || []).forEach(function (n) {
      if (!n || !n.id) return;
      var exists = items.some(function (x) { return x.id === n.id; });
      if (!exists) {
        items.push(n);
        changed = true;
        if (markUnread) unread += 1;
      }
    });
    items.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    items = items.slice(0, MAX_ITEMS);
    if (changed) saveCache();
    renderList();
    updateBadge();
    if (changed && markUnread) flashModule();
  }

  function updateBadge() {
    try {
      if (unread > 0 && 'setAppBadge' in navigator) navigator.setAppBadge(unread);
      else if (unread === 0 && 'clearAppBadge' in navigator) navigator.clearAppBadge();
    } catch (_) {}
  }

  function findModule() {
    var modules = document.querySelectorAll('.module');
    for (var i = 0; i < modules.length; i++) {
      var text = (modules[i].textContent || '').toUpperCase();
      if (text.indexOf('NOTIFICACIONES') !== -1) return modules[i];
    }
    return null;
  }

  function flashModule() {
    var module = findModule();
    if (!module) return;
    module.classList.remove('hn-notify-flash');
    void module.offsetWidth;
    module.classList.add('hn-notify-flash');
    var sub = module.querySelector('.module-sub');
    if (sub) {
      var original = sub.getAttribute('data-hn-original') || sub.textContent;
      sub.setAttribute('data-hn-original', original);
      sub.textContent = 'NUEVA NOTIFICACIÓN';
      setTimeout(function () {
        if (sub) sub.textContent = original;
      }, 3500);
    }
  }

  function renderList() {
    var screen = document.querySelector('.hn-notify-screen');
    if (!screen) return;
    var list = screen.querySelector('.hn-notify-list');
    if (!list) return;
    list.innerHTML = items.length ? items.map(function (n) {
      return '<article class="hn-notify-item">' +
        '<div class="hn-notify-title">' + esc(n.title) + '</div>' +
        '<div class="hn-notify-message">' + esc(n.message) + '</div>' +
        '<div class="hn-notify-date">' + esc(new Date(n.created_at).toLocaleString()) + '</div>' +
      '</article>';
    }).join('') : '<div class="hn-notify-empty">NO HAY NOTIFICACIONES</div>';
  }

  function ensureStyles() {
    if (document.getElementById('hn-notify-runtime-style')) return;
    var style = document.createElement('style');
    style.id = 'hn-notify-runtime-style';
    style.textContent =
      '.hn-notify-screen{position:fixed;inset:0;z-index:9999;background:#020403;overflow:auto;padding:90px 20px 40px}' +
      '.hn-notify-list{max-width:720px;margin:0 auto}' +
      '.hn-notify-item{border-top:1px solid rgba(229,189,98,.35);padding:18px 0}' +
      '.hn-notify-title{font:20px Georgia,serif;color:#fff1a8;margin-bottom:8px}' +
      '.hn-notify-message{color:#f4f1e8;line-height:1.5;white-space:pre-wrap}' +
      '.hn-notify-date{font-size:10px;color:#9b9b96;margin-top:8px}' +
      '.hn-notify-empty{color:#777;text-align:center;padding:40px 0;font-size:10px;letter-spacing:.15em}' +
      '.hn-n-back{position:fixed;top:25px;left:20px;z-index:10000;border:1px solid rgba(229,189,98,.45);background:#050605;color:#fff1a8;padding:11px 15px;font-size:10px;letter-spacing:.12em;text-transform:uppercase}' +
      '.hn-notify-flash{animation:hnNotifyFlash .9s ease-in-out 2}' +
      '@keyframes hnNotifyFlash{0%,100%{transform:scale(1);filter:none}50%{transform:scale(1.018);filter:brightness(1.45);box-shadow:0 0 28px rgba(229,189,98,.42)}}';
    document.head.appendChild(style);
  }

  function openScreen() {
    ensureStyles();
    var screen = document.querySelector('.hn-notify-screen');
    if (!screen) {
      screen = document.createElement('section');
      screen.className = 'hn-notify-screen';
      screen.innerHTML = '<button type="button" class="hn-n-back">Volver</button><div class="hn-notify-list"></div>';
      document.body.appendChild(screen);
      screen.querySelector('.hn-n-back').addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        clearAppBadge();
        var activeScreen = document.getElementById('moduleScreen');
        var home = document.getElementById('homeScreen');
        var login = document.getElementById('loginScreen');
        var repertoire = document.getElementById('repertoireScreen');
        if (activeScreen) activeScreen.classList.remove('is-active');
        if (repertoire) repertoire.classList.remove('is-active');
        if (login) login.classList.remove('is-active');
        if (home) home.classList.add('is-active');
        screen.remove();
      }, true);
    }
    renderList();
    unread = 0;
    updateBadge();
  }

  function clearAppBadge() {
    try { if ('clearAppBadge' in navigator) navigator.clearAppBadge(); } catch (_) {}
  }

  function bindModule() {
    var module = findModule();
    if (!module || module.getAttribute('data-hn-notify-bound') === '1') return;
    module.setAttribute('data-hn-notify-bound', '1');
    module.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openScreen();
    }, true);
  }

  async function syncRecent(markUnread, flash) {
    var c = client();
    if (!c) return;
    try {
      var result = await c.from('notifications').select('id,title,message,created_at').order('created_at', { ascending: false }).limit(MAX_ITEMS);
      if (result && !result.error) mergeItems(result.data || [], !!markUnread);
    } catch (_) {}
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(function () { syncRecent(true, true); }, 5000);
  }

  function startRealtime() {
    var c = client();
    if (!c || !c.channel) return;
    try {
      realtimeChannel = c.channel('hn-notifications-live')
        .on('postgres_changes', { event:'INSERT', schema:'public', table:'notifications' }, function (payload) {
          mergeItems([payload.new], true);
        })
        .subscribe();
    } catch (_) {}
  }

  function boot() {
    loadCache();
    ensureStyles();
    bindModule();
    renderList();
    syncRecent(false, false);
    startRealtime();
    startPolling();
    window.addEventListener('online', function () { syncRecent(false, false); });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) syncRecent(false, false);
    });
    setInterval(bindModule, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
