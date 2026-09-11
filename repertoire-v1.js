(function () {
  'use strict';

  var client = null;
  var channel = null;
  var started = false;
  var sessionPollTimer = null;
  var repertoirePollTimer = null;
  var songs = [];
  var module = null;
  var subtitle = null;
  var badge = null;
  var seenKey = 'hn_repertoire_seen_v1';
  var historyArmed = false;
  var previousScreen = null;
  var videoWasMuted = true;

  function isLoggedIn() {
    return !!sessionStorage.getItem('hn_profile');
  }

  function getClient() {
    if (window.hnSupabase && typeof window.hnSupabase.channel === 'function') return window.hnSupabase;
    return null;
  }

  function esc(value) {
    var node = document.createElement('div');
    node.textContent = String(value == null ? '' : value);
    return node.innerHTML;
  }

  function getSeenIds() {
    try {
      var raw = localStorage.getItem(seenKey);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (_) { return []; }
  }

  function setSeenIds(ids) {
    try { localStorage.setItem(seenKey, JSON.stringify(ids)); } catch (_) {}
  }

  function markAllSeen() {
    setSeenIds(songs.map(function (song) { return String(song.id); }));
    updateModule();
  }

  function getUnseenSongs() {
    var seen = getSeenIds();
    return songs.filter(function (song) { return seen.indexOf(String(song.id)) === -1; });
  }

  function addStyle() {
    if (document.getElementById('hnRepertoireStyle')) return;
    var style = document.createElement('style');
    style.id = 'hnRepertoireStyle';
    style.textContent = [
      '.hn-rep-flash{animation:hnRepFlash 1.2s ease-in-out 0s 2}',
      '@keyframes hnRepFlash{0%,100%{box-shadow:0 0 0 rgba(229,189,98,0)}50%{box-shadow:0 0 28px rgba(229,189,98,.5),inset 0 0 20px rgba(229,189,98,.08)}}',
      '.hn-rep-screen{height:100%!important;max-height:100%;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;box-sizing:border-box;padding-bottom:110px!important}',
      '.hn-rep-screen .hn-r-head{margin-top:24px;padding:0 0 18px;border-bottom:1px solid rgba(229,189,98,.25);font:14px Georgia,serif;letter-spacing:.18em;color:#fff1a8;text-transform:uppercase}',
      '.hn-rep-screen .hn-r-category{margin-top:24px;padding:0 0 8px;color:#e5bd62;font-size:9px;letter-spacing:.22em;text-transform:uppercase;border-bottom:1px solid rgba(229,189,98,.16)}',
      '.hn-rep-screen .hn-r-song{padding:13px 0;border-bottom:1px solid rgba(255,255,255,.08)}',
      '.hn-rep-screen .hn-r-title{color:#f4f1e8;font-size:12px;letter-spacing:.08em;text-transform:uppercase}',
      '.hn-rep-screen .hn-r-artist{margin-top:5px;color:rgba(244,241,232,.52);font-size:10px;letter-spacing:.06em}',
      '.hn-rep-screen .hn-r-empty{padding:34px 0;color:rgba(244,241,232,.42);font-size:10px;letter-spacing:.12em;text-transform:uppercase;text-align:center}',
      '.hn-rep-screen .hn-r-back{display:block;margin:28px 0 20px;position:relative;z-index:5;pointer-events:auto}',
      '.hn-rep-screen .hn-r-back-top{display:block;margin:16px 0 0;position:relative;z-index:5;pointer-events:auto}',
      '.hn-rep-badge{position:absolute;top:10px;right:12px;min-width:24px;height:24px;padding:0 7px;border:1px solid #fff1a8;border-radius:999px;background:#e5bd62;color:#020302;display:none;align-items:center;justify-content:center;font:600 11px Arial,sans-serif;letter-spacing:0;box-shadow:0 0 16px rgba(229,189,98,.35);z-index:3}',
      '.hn-rep-badge.hn-rep-badge-visible{display:flex}'
    ].join('');
    document.head.appendChild(style);
  }

  function makeElement(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function findModule() {
    if (module && document.body.contains(module)) return module;
    module = null;
    subtitle = null;
    badge = null;
    var modules = document.querySelectorAll('.module');
    for (var i = 0; i < modules.length; i++) {
      var title = modules[i].querySelector('.module-title');
      if (title && title.textContent.trim().toUpperCase() === 'REPERTORIO') {
        module = modules[i];
        subtitle = modules[i].querySelector('.module-subtitle');
        module.style.position = 'relative';
        badge = module.querySelector('.hn-rep-badge');
        if (!badge) {
          badge = makeElement('span', 'hn-rep-badge');
          badge.setAttribute('aria-label', 'Nuevas canciones en repertorio');
          module.appendChild(badge);
        }
        break;
      }
    }
    return module;
  }

  function updateModule() {
    findModule();
    if (subtitle) subtitle.textContent = 'Ver repertorio';
    var unseen = getUnseenSongs();
    if (badge) {
      badge.textContent = unseen.length > 99 ? '99+' : String(unseen.length);
      badge.classList.toggle('hn-rep-badge-visible', unseen.length > 0);
    }
  }

  function flashModule() {
    findModule();
    if (!module) return;
    module.classList.remove('hn-rep-flash');
    void module.offsetWidth;
    module.classList.add('hn-rep-flash');
    if (subtitle) {
      subtitle.textContent = 'NUEVA CANCIÓN';
      subtitle.style.color = '#fff1a8';
      setTimeout(function () {
        if (subtitle) subtitle.style.color = '';
        updateModule();
      }, 3200);
    }
  }

  function restoreGenericModuleScreen() {
    var screen = document.getElementById('moduleScreen');
    if (!screen) return;
    var inner = screen.querySelector('.screen-inner');
    if (!inner || !inner.classList.contains('hn-rep-screen')) return;
    inner.className = 'screen-inner coming-screen';
    inner.innerHTML = '';
    inner.appendChild(makeElement('p', 'brand metallic-gold', 'HAVANA NICE'));
    inner.appendChild(makeElement('div', 'brand-line'));
    inner.appendChild(makeElement('h2', 'coming-title metallic-gold', 'PRÓXIMAMENTE'));
    inner.appendChild(makeElement('p', 'coming-copy', 'Esta sección estará disponible próximamente'));
    var back = makeElement('button', 'back-button', 'Volver');
    back.type = 'button';
    back.addEventListener('click', function (event) {
      event.preventDefault(); event.stopPropagation();
      var screen = document.getElementById('moduleScreen');
      var home = document.getElementById('homeScreen');
      if (screen) screen.classList.remove('is-active');
      if (home) home.classList.add('is-active');
    });
    inner.appendChild(back);
  }

  function closeRepertoire(fromButton) {
    var screen = document.getElementById('moduleScreen');
    if (!screen) return;
    screen.classList.remove('is-active');
    if (previousScreen) previousScreen.classList.add('is-active');
    else document.getElementById('homeScreen')?.classList.add('is-active');
    var video = document.getElementById('backgroundVideo');
    if (video) video.muted = videoWasMuted;
    if (historyArmed && fromButton) {
      historyArmed = false;
      try { history.back(); } catch (_) {}
    } else if (!fromButton) {
      historyArmed = false;
    }
  }

  function render() {
    var screen = document.getElementById('moduleScreen');
    if (!screen) return;
    var inner = screen.querySelector('.screen-inner');
    if (!inner) return;
    inner.className = 'screen-inner coming-screen hn-rep-screen';
    inner.innerHTML = '';
    inner.appendChild(makeElement('p', 'brand metallic-gold', 'HAVANA NICE'));
    inner.appendChild(makeElement('div', 'brand-line'));
    inner.appendChild(makeElement('div', 'hn-r-head', 'Repertorio'));

    var topBack = makeElement('button', 'back-button hn-r-back-top', 'Volver');
    topBack.type = 'button';
    topBack.addEventListener('click', function (event) {
      event.preventDefault(); event.stopPropagation();
      closeRepertoire(true);
    });
    inner.appendChild(topBack);

    var groups = {};
    songs.forEach(function (song) {
      var category = String(song.category || 'OTHER').toUpperCase();
      if (!groups[category]) groups[category] = [];
      groups[category].push(song);
    });
    var order = ['COCKTAIL','DINNER','DANCE','BOLERO','SALSA','JAZZ','OTHER'];
    var rendered = 0;
    order.concat(Object.keys(groups)).forEach(function (category) {
      if (!groups[category] || order.indexOf(category) !== -1 && rendered === -1) return;
      var list = groups[category];
      if (!list.length) return;
      var heading = makeElement('div', 'hn-r-category', category);
      inner.appendChild(heading);
      list.forEach(function (song) {
        var item = makeElement('article', 'hn-r-song');
        item.innerHTML = '<div class="hn-r-title">' + esc(song.title || '') + '</div>' + (song.artist ? '<div class="hn-r-artist">' + esc(song.artist) + '</div>' : '');
        inner.appendChild(item);
        rendered++;
      });
      groups[category] = null;
    });
    if (!rendered) inner.appendChild(makeElement('div', 'hn-r-empty', 'No hay canciones disponibles'));

    var back = makeElement('button', 'back-button hn-r-back', 'Volver');
    back.type = 'button';
    back.addEventListener('click', function (event) {
      event.preventDefault(); event.stopPropagation();
      closeRepertoire(true);
    });
    inner.appendChild(back);
  }

  function openRepertoire(fromPopState) {
    if (!isLoggedIn()) return;
    previousScreen = document.querySelector('.screen.is-active:not(#moduleScreen)') || document.getElementById('homeScreen');
    render();
    markAllSeen();
    var screen = document.getElementById('moduleScreen');
    var home = document.getElementById('homeScreen');
    var login = document.getElementById('loginScreen');
    var repertoireScreen = document.getElementById('repertoireScreen');
    if (login) login.classList.remove('is-active');
    document.querySelectorAll('.screen').forEach(function (s) {
      if (s !== screen) s.classList.remove('is-active');
    });
    if (home) home.classList.remove('is-active');
    if (repertoireScreen) repertoireScreen.classList.remove('is-active');
    if (screen) screen.classList.add('is-active');

    var video = document.getElementById('backgroundVideo');
    if (video) {
      videoWasMuted = !!video.muted;
      video.muted = true;
      video.play().catch(function () {});
    }
    if (!fromPopState && !historyArmed) {
      try {
        history.pushState(Object.assign({}, history.state || {}, { hnRepertoire: true }), '', location.href);
        historyArmed = true;
      } catch (_) {}
    }
  }

  function bindModule() {
    findModule();
    if (!module || module.dataset.hnRepBound === 'true') return;
    module.dataset.hnRepBound = 'true';
    module.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (typeof window.playClickSound === 'function') { try { window.playClickSound(); } catch (_) {} }
      openRepertoire(false);
    }, true);
  }

  async function sync(showFlash) {
    if (!client || !isLoggedIn()) return;
    try {
      var result = await client.from('repertoire_songs').select('id,title,artist,category,position,active,updated_at').eq('active', true).order('position', { ascending: true }).order('title', { ascending: true });
      if (result.error) { console.error('[HN-Repertoire] sync error:', result.error); return; }
      var next = result.data || [];
      var previousIds = songs.map(function (song) { return String(song.id); });
      var changed = JSON.stringify(next) !== JSON.stringify(songs);
      var newSongs = next.filter(function (song) { return previousIds.indexOf(String(song.id)) === -1; });
      songs = next;

      if (!getSeenIds().length && next.length && previousIds.length === 0) {
        markAllSeen();
      } else {
        updateModule();
      }

      if (changed) {
        var screen = document.getElementById('moduleScreen');
        if (screen && screen.classList.contains('is-active') && screen.querySelector('.hn-rep-screen')) render();
        if (showFlash && newSongs.length) flashModule();
      }
    } catch (error) { console.error('[HN-Repertoire] sync exception:', error); }
  }

  function subscribe() {
    if (!client) return;
    if (channel) { try { client.removeChannel(channel); } catch (_) {} }
    channel = client.channel('hn-repertoire-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repertoire_songs' }, function () { sync(true); })
      .subscribe(function (status) {
        if (status === 'SUBSCRIBED') sync(false);
      });
  }

  function stop() {
    started = false;
    if (channel) { try { client.removeChannel(channel); } catch (_) {} }
    channel = null;
    if (repertoirePollTimer) clearInterval(repertoirePollTimer);
    repertoirePollTimer = null;
    songs = [];
    updateModule();
  }

  function start() {
    if (started) return;
    client = getClient();
    if (!client || !isLoggedIn()) return;
    started = true;
    sync(false);
    subscribe();
    repertoirePollTimer = setInterval(function () { sync(false); }, 5000);
  }

  function watchSession() {
    if (sessionPollTimer) clearInterval(sessionPollTimer);
    sessionPollTimer = setInterval(function () {
      if (isLoggedIn()) start();
      else if (started) stop();
    }, 1000);
  }

  function bindGenericRestore() {
    document.addEventListener('click', function (event) {
      var target = event.target.closest('.module[data-module]');
      if (!target) return;
      var title = target.querySelector('.module-title');
      if (title && title.textContent.trim().toUpperCase() !== 'REPERTORIO') restoreGenericModuleScreen();
    }, true);
  }

  function wireNativeBack() {
    window.addEventListener('popstate', function () {
      var screen = document.getElementById('moduleScreen');
      if (screen && screen.classList.contains('is-active') && screen.querySelector('.hn-rep-screen')) {
        closeRepertoire(false);
      }
    });
  }

  function init() {
    addStyle();
    bindModule();
    bindGenericRestore();
    wireNativeBack();
    start();
    watchSession();
    window.addEventListener('online', function () { if (started) sync(false); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && started) sync(false); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
