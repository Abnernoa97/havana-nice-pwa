(function () {
  'use strict';

  var client = null;
  var channel = null;
  var started = false;
  var reconnectTimer = null;
  var sessionPollTimer = null;
  var notifications = [];
  var seenIds = new Set();

  function isLoggedIn() {
    return !!sessionStorage.getItem('hn_profile');
  }

  function getClient() {
    if (window.hnSupabase && typeof window.hnSupabase.channel === 'function') {
      return window.hnSupabase;
    }
    return null;
  }

  function addStyle() {
    if (document.getElementById('hnNotifyStyle')) return;
    var style = document.createElement('style');
    style.id = 'hnNotifyStyle';
    style.textContent = '#hnNotificationsRoot{position:fixed;right:18px;top:74px;z-index:99999;font-family:Arial,sans-serif}#hnNotifyButton{width:46px;height:46px;border:1px solid rgba(229,189,98,.72);background:rgba(0,0,0,.82);color:#fff1a8;border-radius:50%;font-size:20px;position:relative;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.35)}#hnNotifyCount{position:absolute;right:-3px;top:-4px;min-width:17px;height:17px;padding:0 4px;border-radius:10px;background:#e5bd62;color:#020302;font:700 9px/17px Arial;text-align:center;display:none}#hnNotifyPanel{position:fixed;right:18px;top:132px;width:min(350px,calc(100vw - 36px));max-height:65vh;overflow:auto;border:1px solid rgba(229,189,98,.65);background:rgba(2,3,2,.97);display:none;box-shadow:0 18px 60px rgba(0,0,0,.55)}#hnNotifyPanel.open{display:block}.hn-n-head{padding:18px;border-bottom:1px solid rgba(229,189,98,.22);font:14px Georgia,serif;letter-spacing:.18em;color:#fff1a8;text-transform:uppercase}.hn-n-item{padding:17px 18px;border-bottom:1px solid rgba(255,255,255,.08)}.hn-n-title{color:#f4f1e8;font-size:12px;letter-spacing:.12em;text-transform:uppercase}.hn-n-message{margin-top:8px;color:rgba(244,241,232,.72);font-size:12px;line-height:1.5}.hn-n-date{margin-top:9px;color:rgba(244,241,232,.36);font-size:8px;letter-spacing:.12em;text-transform:uppercase}.hn-n-empty{padding:24px 18px;color:rgba(244,241,232,.42);font-size:10px;letter-spacing:.12em;text-transform:uppercase;text-align:center}#hnNotifyToasts{position:fixed;right:18px;top:132px;z-index:100000;display:flex;flex-direction:column;gap:10px;pointer-events:none;width:min(350px,calc(100vw - 36px))}.hn-n-toast{pointer-events:auto;border:1px solid rgba(229,189,98,.72);background:rgba(2,3,2,.97);box-shadow:0 12px 40px rgba(0,0,0,.55);padding:14px 16px;color:#f4f1e8;transform:translateY(-8px);opacity:0;transition:opacity .25s ease,transform .25s ease}.hn-n-toast.show{opacity:1;transform:translateY(0)}.hn-n-toast-title{color:#fff1a8;font:12px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase}.hn-n-toast-message{margin-top:7px;color:rgba(244,241,232,.78);font:12px/1.45 Arial,sans-serif}';
    document.head.appendChild(style);
  }

  function makeElement(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildUI() {
    if (document.getElementById('hnNotificationsRoot')) return;
    addStyle();

    var root = makeElement('div');
    root.id = 'hnNotificationsRoot';
    root.style.display = 'none';

    var button = makeElement('button');
    button.id = 'hnNotifyButton';
    button.type = 'button';
    button.setAttribute('aria-label', 'Notifications');
    button.textContent = '♢';

    var count = makeElement('span');
    count.id = 'hnNotifyCount';
    button.appendChild(count);

    var panel = makeElement('div');
    panel.id = 'hnNotifyPanel';

    var header = makeElement('div', 'hn-n-head', 'Notifications');
    var list = makeElement('div');
    list.id = 'hnNotifyList';
    list.appendChild(makeElement('div', 'hn-n-empty', 'No notifications'));

    panel.appendChild(header);
    panel.appendChild(list);

    var toasts = makeElement('div');
    toasts.id = 'hnNotifyToasts';

    root.appendChild(button);
    root.appendChild(panel);
    document.body.appendChild(root);
    document.body.appendChild(toasts);

    button.addEventListener('click', function () {
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) {
        count.style.display = 'none';
      }
    });
  }

  function showRoot(visible) {
    var root = document.getElementById('hnNotificationsRoot');
    if (root) root.style.display = visible ? 'block' : 'none';
    if (!visible) {
      var panel = document.getElementById('hnNotifyPanel');
      if (panel) panel.classList.remove('open');
      var count = document.getElementById('hnNotifyCount');
      if (count) count.style.display = 'none';
    }
  }

  function render() {
    var list = document.getElementById('hnNotifyList');
    var count = document.getElementById('hnNotifyCount');
    if (!list || !count) return;

    list.innerHTML = '';
    count.textContent = notifications.length > 99 ? '99+' : String(notifications.length);
    count.style.display = notifications.length ? 'block' : 'none';

    if (!notifications.length) {
      list.appendChild(makeElement('div', 'hn-n-empty', 'No notifications'));
      return;
    }

    notifications.forEach(function (item) {
      var article = makeElement('article', 'hn-n-item');
      article.appendChild(makeElement('div', 'hn-n-title', String(item.title || 'Notification')));
      article.appendChild(makeElement('div', 'hn-n-message', String(item.message || '')));
      article.appendChild(makeElement('div', 'hn-n-date', item.created_at ? new Date(item.created_at).toLocaleString() : ''));
      list.appendChild(article);
    });
  }

  function mergeItems(items, showNewToast) {
    if (!Array.isArray(items)) return;
    var added = [];

    items.forEach(function (item) {
      if (!item || !item.id || seenIds.has(item.id)) return;
      seenIds.add(item.id);
      added.push(item);
    });

    if (!added.length) return;

    notifications = notifications.concat(added);
    notifications.sort(function (a, b) {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
    render();

    if (showNewToast) {
      added.sort(function (a, b) {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }).forEach(showToast);
    }
  }

  function showToast(item) {
    var container = document.getElementById('hnNotifyToasts');
    if (!container) return;

    var toast = makeElement('div', 'hn-n-toast');
    toast.appendChild(makeElement('div', 'hn-n-toast-title', '🔔 ' + String(item.title || 'Notification')));
    toast.appendChild(makeElement('div', 'hn-n-toast-message', String(item.message || '')));
    container.appendChild(toast);

    requestAnimationFrame(function () { toast.classList.add('show'); });

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 8000);
  }

  async function syncRecent() {
    if (!client || !isLoggedIn()) return;

    try {
      var result = await client
        .from('notifications')
        .select('id,title,message,created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (result.error) {
        console.error('[HN-Notifications] REST sync error:', result.error);
        return;
      }

      mergeItems(result.data || [], false);
    } catch (error) {
      console.error('[HN-Notifications] REST sync exception:', error);
    }
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

    channel = client
      .channel('hn_realtime_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, function (payload) {
        if (!isLoggedIn() || !payload || !payload.new) return;
        mergeItems([payload.new], true);
      })
      .subscribe(function (status, error) {
        console.log('[HN-Notifications] Realtime:', status);
        if (error) console.error('[HN-Notifications] Realtime error:', error);
        if (status === 'SUBSCRIBED') {
          syncRecent();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          scheduleReconnect();
        }
      });
  }

  function ensureRealtime() {
    if (!client || !isLoggedIn()) return;
    subscribe();
  }

  function stop() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (channel && client) {
      try { client.removeChannel(channel); } catch (_) {}
    }
    channel = null;
    started = false;
    notifications = [];
    seenIds.clear();
    render();
    showRoot(false);
  }

  async function start() {
    if (!isLoggedIn()) {
      if (started) stop();
      return;
    }

    var nextClient = getClient();
    if (!nextClient) return;

    client = nextClient;
    buildUI();
    showRoot(true);

    if (!started) {
      started = true;
      await syncRecent();
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
        syncRecent();
        ensureRealtime();
      }
    });

    window.addEventListener('online', function () {
      if (isLoggedIn()) {
        syncRecent();
        ensureRealtime();
      }
    });
  }

  function init() {
    buildUI();
    start();
    watchSession();
    setupLifecycle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
