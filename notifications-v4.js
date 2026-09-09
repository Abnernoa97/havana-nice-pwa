(function () {
  'use strict';

  var client = null;
  var channel = null;
  var started = false;
  var reconnectTimer = null;
  var sessionPollTimer = null;
  var notificationPollTimer = null;
  var notifications = [];
  var seenIds = new Set();
  var readIds = new Set();
  var notificationModule = null;
  var notificationSubtitle = null;
  var STORAGE_KEY = 'hn_notifications_cache_v1';
  var READ_STORAGE_KEY = 'hn_notifications_read_v1';

  function isLoggedIn() {
    return !!sessionStorage.getItem('hn_profile');
  }

  function getClient() {
    if (window.hnSupabase && typeof window.hnSupabase.channel === 'function') return window.hnSupabase;
    return null;
  }

  function addStyle() {
    if (document.getElementById('hnNotifyStyle')) return;
    var style = document.createElement('style');
    style.id = 'hnNotifyStyle';
    style.textContent = [
      '.hn-notify-flash{animation:hnNotifyFlash 1.2s ease-in-out 0s 2}',
      '@keyframes hnNotifyFlash{0%,100%{box-shadow:0 0 0 rgba(229,189,98,0)}50%{box-shadow:0 0 28px rgba(229,189,98,.5),inset 0 0 20px rgba(229,189,98,.08)}}',
      '.hn-notify-new{color:#fff1a8!important;opacity:1!important}',
      '.hn-notify-screen{height:100%!important;max-height:100%;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;box-sizing:border-box;padding-bottom:110px!important}',
      '.hn-notify-screen .hn-n-head{margin-top:24px;padding:0 0 18px;border-bottom:1px solid rgba(229,189,98,.25);font:14px Georgia,serif;letter-spacing:.18em;color:#fff1a8;text-transform:uppercase}',
      '.hn-notify-screen .hn-n-item{padding:19px 0;border-bottom:1px solid rgba(255,255,255,.09);border-left:2px solid transparent;padding-left:12px;margin-left:-14px;transition:background .25s ease,border-color .25s ease}',
      '.hn-notify-screen .hn-n-item.hn-n-unread{border-left-color:#e5bd62;background:linear-gradient(90deg,rgba(229,189,98,.10),transparent 75%)}',
      '.hn-notify-screen .hn-n-item.hn-n-unread .hn-n-title{text-decoration:underline;text-decoration-color:#e5bd62;text-decoration-thickness:1px;text-underline-offset:5px}',
      '.hn-notify-screen .hn-n-item.hn-n-unread .hn-n-date{color:rgba(229,189,98,.72)}',
      '.hn-notify-screen .hn-n-title{color:#f4f1e8;font-size:12px;letter-spacing:.12em;text-transform:uppercase}',
      '.hn-notify-screen .hn-n-message{margin-top:9px;color:rgba(244,241,232,.78);font-size:13px;line-height:1.55}',
      '.hn-notify-screen .hn-n-date{margin-top:9px;color:rgba(244,241,232,.38);font-size:8px;letter-spacing:.12em;text-transform:uppercase}',
      '.hn-notify-screen .hn-n-empty{padding:34px 0;color:rgba(244,241,232,.42);font-size:10px;letter-spacing:.12em;text-transform:uppercase;text-align:center}',
      '.hn-notify-screen .hn-n-back{display:block;margin:28px 0 20px;position:relative;z-index:5;pointer-events:auto}'
    ].join('');
    document.head.appendChild(style);
  }

  function makeElement(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function findNotificationModule() {
    if (notificationModule && document.body.contains(notificationModule)) return notificationModule;
    notificationModule = null;
    for (var i = 0; i < document.querySelectorAll('.module').length; i++) {
      var modules = document.querySelectorAll('.module');
      var title = modules[i].querySelector('.module-title');
      if (title && title.textContent.trim().toUpperCase() === 'NOTIFICACIONES') {
        notificationModule = modules[i];
        notificationSubtitle = modules[i].querySelector('.module-subtitle');
        break;
      }
    }
    return notificationModule;
  }

  function updateModule() {
    findNotificationModule();
    if (!notificationSubtitle) return;
    if (!notifications.length) {
      notificationSubtitle.textContent = 'Sin notificaciones';
      notificationSubtitle.classList.remove('hn-notify-new');
      return;
    }
    notificationSubtitle.textContent = notifications.length === 1 ? '1 notificación' : notifications.length + ' notificaciones';
  }

  function setAppBadge(value) {
    try {
      if (document.visibilityState === 'visible' && typeof navigator.clearAppBadge === 'function' && value === 0) {
        navigator.clearAppBadge();
        return;
      }
      if (typeof navigator.setAppBadge === 'function') navigator.setAppBadge(value > 0 ? value : 0);
    } catch (_) {}
  }

  function clearAppBadge() {
    try {
      if (typeof navigator.clearAppBadge === 'function') navigator.clearAppBadge();
      else if (typeof navigator.setAppBadge === 'function') navigator.setAppBadge(0);
    } catch (_) {}
  }

  function flashModule() {
    findNotificationModule();
    if (!notificationModule) return;
    notificationModule.classList.remove('hn-notify-flash');
    void notificationModule.offsetWidth;
    notificationModule.classList.add('hn-notify-flash');
    if (notificationSubtitle) {
      notificationSubtitle.textContent = 'NUEVA NOTIFICACIÓN';
      notificationSubtitle.classList.add('hn-notify-new');
    }
    setTimeout(function () {
      if (notificationSubtitle) notificationSubtitle.classList.remove('hn-notify-new');
      updateModule();
    }, 3200);
  }

  function saveCache() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50))); } catch (_) {}
  }

  function saveReadIds() {
    try { localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(readIds))); } catch (_) {}
  }

  function loadCache() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var cached = JSON.parse(raw);
      if (!Array.isArray(cached)) return;
      notifications = [];
      seenIds.clear();
      cached.forEach(function (item) {
        if (!item || !item.id || seenIds.has(item.id)) return;
        seenIds.add(item.id);
        notifications.push(item);
      });
      notifications.sort(function (a, b) { return new Date(b.created_at || 0) - new Date(a.created_at || 0); });
      updateModule();
    } catch (_) {}
  }

  function loadReadIds() {
    try {
      var raw = localStorage.getItem(READ_STORAGE_KEY);
      if (!raw) return;
      var stored = JSON.parse(raw);
      if (!Array.isArray(stored)) return;
      readIds = new Set(stored);
    } catch (_) {}
  }

  function markAllRead() {
    notifications.forEach(function (item) {
      if (item && item.id) readIds.add(item.id);
    });
    saveReadIds();
  }

  function renderNotificationScreen() {
    var screen = document.getElementById('moduleScreen');
    if (!screen) return;
    var inner = screen.querySelector('.screen-inner');
    if (!inner) return;

    inner.className = 'screen-inner coming-screen hn-notify-screen';
    inner.innerHTML = '';
    inner.appendChild(makeElement('p', 'brand metallic-gold', 'HAVANA NICE'));
    inner.appendChild(makeElement('div', 'brand-line'));
    inner.appendChild(makeElement('div', 'hn-n-head', 'Notifications'));

    var list = makeElement('div');
    if (!notifications.length) {
      list.appendChild(makeElement('div', 'hn-n-empty', 'No notifications'));
    } else {
      notifications.forEach(function (item) {
        var isUnread = !readIds.has(item.id);
        var article = makeElement('article', 'hn-n-item' + (isUnread ? ' hn-n-unread' : ''));
        article.appendChild(makeElement('div', 'hn-n-title', String(item.title || 'Notification')));
        article.appendChild(makeElement('div', 'hn-n-message', String(item.message || '')));
        article.appendChild(makeElement('div', 'hn-n-date', item.created_at ? new Date(item.created_at).toLocaleString() : ''));
        list.appendChild(article);
      });
    }
    inner.appendChild(list);

    var back = makeElement('button', 'back-button hn-n-back', 'Volver');
    back.type = 'button';
    back.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      clearAppBadge();

      var screen = document.getElementById('moduleScreen');
      var home = document.getElementById('homeScreen');
      var login = document.getElementById('loginScreen');
      var repertoire = document.getElementById('repertoireScreen');
      if (screen) screen.classList.remove('is-active');
      if (repertoire) repertoire.classList.remove('is-active');
      if (login) login.classList.remove('is-active');
      if (home) home.classList.add('is-active');
    });
    inner.appendChild(back);
  }

  function openNotifications() {
    if (!isLoggedIn()) return;
    clearAppBadge();
    renderNotificationScreen();
    markAllRead();
    renderNotificationScreen();
    var screen = document.getElementById('moduleScreen');
    var home = document.getElementById('homeScreen');
    var login = document.getElementById('loginScreen');
    var repertoire = document.getElementById('repertoireScreen');
    if (login) login.classList.remove('is-active');
    if (home) home.classList.remove('is-active');
    if (repertoire) repertoire.classList.remove('is-active');
    if (screen) screen.classList.add('is-active');
  }

  function bindModule() {
    findNotificationModule();
    if (!notificationModule || notificationModule.dataset.hnNotifyBound === 'true') return;
    notificationModule.dataset.hnNotifyBound = 'true';
    notificationModule.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      playClickSoundIfAvailable();
      openNotifications();
    }, true);
  }

  function playClickSoundIfAvailable() {
    try { if (typeof window.playClickSound === 'function') window.playClickSound(); } catch (_) {}
  }

  function mergeItems(items, showFlash, showBadge) {
    if (!Array.isArray(items)) return false;
    var added = [];
    items.forEach(function (item) {
      if (!item || !item.id || seenIds.has(item.id)) return;
      seenIds.add(item.id);
      added.push(item);
    });
    if (!added.length) return false;
    notifications = notifications.concat(added);
    notifications.sort(function (a, b) { return new Date(b.created_at || 0) - new Date(a.created_at || 0); });
    notifications = notifications.slice(0, 50);
    saveCache();
    updateModule();
    if (showFlash) flashModule();
    if (showBadge) setAppBadge(Math.min(99, added.length));
    return true;
  }

  function reconcileWithServer(serverItems) {
    if (!Array.isArray(serverItems)) return false;
    var serverIds = new Set(serverItems.map(function (item) { return item && item.id; }).filter(Boolean));
    var before = notifications.length;
    notifications = notifications.filter(function (item) { return item && serverIds.has(item.id); });
    if (notifications.length === before) return false;
    seenIds.clear();
    notifications.forEach(function (item) { seenIds.add(item.id); });
    saveCache();
    renderNotificationScreenIfOpen();
    updateModule();
    return true;
  }

  function removeNotification(id) {
    if (!id) return;
    var changed = false;
    var next = notifications.filter(function (item) {
      if (item && item.id === id) { changed = true; return false; }
      return true;
    });
    if (!changed) return;
    notifications = next;
    seenIds.delete(id);
    readIds.delete(id);
    saveCache();
    saveReadIds();
    renderNotificationScreenIfOpen();
    updateModule();
  }

  function renderNotificationScreenIfOpen() {
    var screen = document.getElementById('moduleScreen');
    if (screen && screen.classList.contains('is-active') && screen.querySelector('.hn-notify-screen')) {
      renderNotificationScreen();
    }
  }

  async function syncRecent(showFlash, showBadge) {
    if (!client || !isLoggedIn()) return;
    try {
      var result = await client.from('notifications').select('id,title,message,created_at').order('created_at', { ascending: false }).limit(50);
      if (result.error) {
        console.error('[HN-Notifications] sync error:', result.error);
        return;
      }
      reconcileWithServer(result.data || []);
      mergeItems(result.data || [], !!showFlash, !!showBadge);
      bindModule();
    } catch (error) { console.error('[HN-Notifications] sync exception:', error); }
  }

  function startPolling() {
    if (notificationPollTimer) return;
    notificationPollTimer = setInterval(function () {
      if (isLoggedIn()) syncRecent(true, true);
    }, 5000);
  }

  function scheduleReconnect() {
    if (reconnectTimer || !isLoggedIn()) return;
    reconnectTimer = setTimeout(function () {
      reconnectTimer = null;
      ensureRealtime();
    }, 1000);
  }

  function subscribe() {
    if (!client || !isLoggedIn()) return;
    if (channel && (channel.state === 'joined' || channel.state === 'joining')) return;
    if (channel) {
      try { client.removeChannel(channel); } catch (_) {}
      channel = null;
    }
    channel = client.channel('hn_realtime_notifications').on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'notifications'
    }, function (payload) {
      if (!isLoggedIn() || !payload || !payload.new) return;
      mergeItems([payload.new], true, true);
    }).on('postgres_changes', {
      event: 'DELETE', schema: 'public', table: 'notifications'
    }, function (payload) {
      if (!isLoggedIn() || !payload || !payload.old) return;
      removeNotification(payload.old.id);
    }).subscribe(function (status, error) {
      console.log('[HN-Notifications] Realtime:', status);
      if (error) console.error('[HN-Notifications] Realtime error:', error);
      if (status === 'SUBSCRIBED') syncRecent(false, false);
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') scheduleReconnect();
    });
  }

  function ensureRealtime() {
    if (!client || !isLoggedIn()) return;
    subscribe();
  }

  function stop() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (channel && client) { try { client.removeChannel(channel); } catch (_) {} }
    channel = null;
    started = false;
    notifications = [];
    seenIds.clear();
    readIds.clear();
    clearAppBadge();
    updateModule();
  }

  async function start() {
    if (!isLoggedIn()) {
      if (started) stop();
      return;
    }
    var nextClient = getClient();
    if (!nextClient) return;
    client = nextClient;
    addStyle();
    loadCache();
    loadReadIds();
    bindModule();
    startPolling();
    if (!started) {
      started = true;
      await syncRecent(false, false);
    }
    ensureRealtime();
  }

  function watchSession() {
    if (sessionPollTimer) return;
    sessionPollTimer = setInterval(function () {
      if (isLoggedIn()) start();
      else if (started) stop();
    }, 1000);
  }

  function setupLifecycle() {
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && isLoggedIn()) {
        syncRecent(false, false);
        ensureRealtime();
      }
    });
    window.addEventListener('online', function () {
      if (isLoggedIn()) {
        syncRecent(false, false);
        ensureRealtime();
      }
    });
  }

  function init() {
    addStyle();
    bindModule();
    start();
    watchSession();
    setupLifecycle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
