const CACHE = "hn-shell-v1";

// The app must always get the current HTML and dynamic data from the network.
// We intentionally do NOT cache index.html or Supabase/API responses.
const STATIC_ASSETS = [
  "./manifest.json",
  "./havana-nice-icon-192.png",
  "./havana-nice-icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  // HTML/navigation is never allowed to fall back to an old cached version.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(fetch(request));
    return;
  }

  // Keep only the tiny static shell assets cacheable.
  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isStaticShell = isSameOrigin && STATIC_ASSETS.some(asset =>
    new URL(asset, self.location.origin + self.registration.scope).pathname === url.pathname
  );

  if (!isStaticShell) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
