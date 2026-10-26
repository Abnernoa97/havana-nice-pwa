// HAVANA NICE V2 — static shell only. Never intercept/cache private chat,
// credentials, cross-origin Worker requests, media, or dynamic endpoints.
const CACHE = 'havana-nice-v2-static-v3';
const PREFIX = 'havana-nice-v2-';
const APP_SHELL = ['/', '/visual.html', '/manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(PREFIX) && key !== CACHE)
      .map(key => caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('authorization')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  const navigation = req.mode === 'navigate';
  // Admin HTML is strictly network-only; never serve cached Chat HTML instead.
  if (navigation && path === '/admin.html') return;
  const staticAsset = path.startsWith('/assets/') || path.startsWith('/icons/') ||
    path === '/manifest.webmanifest';
  if (!navigation && !staticAsset) return;

  // Keep the visual WebView route isolated: never fall back to the Chat page.
  const shellKey = navigation && path === '/visual.html' ? '/visual.html' : '/';
  event.respondWith(
    fetch(req).then(response => {
      if (response.ok && response.type === 'basic') {
        // Only app shell/static assets, never private responses.
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(
          navigation ? shellKey : req, response.clone()
        )).catch(() => {}));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(navigation ? '/' : req);
      return cached || Response.error();
    })
  );
});
