/* HAVANA NICE — LAZY MODULE LOADER V1
   The login/home shell stays light. Feature modules are loaded only when
   the musician opens that section for the first time.
*/
(function () {
  'use strict';

  var loaded = Object.create(null);
  var loading = Object.create(null);

  var groups = {
    calendar: [
      './calendar-v1.js',
      './calendar-expand.js',
      './calendar-navigation.js',
      './calendar-recipients-v1.js'
    ],
    notifications: [
      './notifications-v5.js',
      './notifications-navigation.js'
    ],
    family: [
      './family-v1.js'
    ],
    operations: [
      './operations-v1.js',
      './operations-fix.js'
    ],
    chat: [
      './chat-v1.js',
      './chat-theme-v1.js'
    ],
    repertoire: [
      './repertoire-v1.js'
    ]
  };

  function normalize(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function groupForModule(module) {
    var key = normalize(module && (module.dataset.module || module.textContent));
    if (key.indexOf('calend') !== -1) return 'calendar';
    if (key.indexOf('notific') !== -1) return 'notifications';
    if (key.indexOf('famil') !== -1) return 'family';
    if (key.indexOf('operac') !== -1 || key.indexOf('operat') !== -1) return 'operations';
    if (key.indexOf('chat') !== -1 || key.indexOf('mensaje') !== -1) return 'chat';
    if (key.indexOf('repert') !== -1) return 'repertoire';
    return null;
  }

  function loadScript(src) {
    if (loaded[src]) return Promise.resolve();
    if (loading[src]) return loading[src];

    loading[src] = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      var revision = window.HN_APP_REVISION || '';
      script.src = src + (revision ? '?v=' + encodeURIComponent(revision) : '');
      script.async = true;
      script.onload = function () {
        loaded[src] = true;
        delete loading[src];
        resolve();
      };
      script.onerror = function () {
        delete loading[src];
        reject(new Error('HAVANA NICE module failed to load: ' + src));
      };
      document.body.appendChild(script);
    });

    return loading[src];
  }

  function loadGroup(name) {
    var files = groups[name];
    if (!files) return Promise.resolve();
    return files.reduce(function (promise, src) {
      return promise.then(function () { return loadScript(src); });
    }, Promise.resolve());
  }

  function findModuleTarget(target) {
    var element = target && target.closest ? target.closest('.module[data-module]') : null;
    return element || null;
  }

  document.addEventListener('click', function (event) {
    var module = findModuleTarget(event.target);
    if (!module) return;

    var group = groupForModule(module);
    if (!group) return;

    if (module.dataset.hnModuleLoaded === '1') return;

    event.preventDefault();
    event.stopImmediatePropagation();
    module.dataset.hnModuleLoading = '1';

    loadGroup(group)
      .then(function () {
        module.dataset.hnModuleLoaded = '1';
        module.dataset.hnModuleLoading = '0';
        // Replay the original navigation after the module has created its screen.
        module.click();
      })
      .catch(function (error) {
        module.dataset.hnModuleLoading = '0';
        console.error(error);
      });
  }, true);

  window.hnLazyModules = {
    load: loadGroup,
    isLoaded: function (name) { return !!groups[name] && groups[name].every(function (src) { return !!loaded[src]; }); }
  };
})();
