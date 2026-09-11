const CACHE = "hn-v4";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./havana-nice-icon-192.png",
  "./havana-nice-icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.endsWith("/index.html") || url.pathname.endsWith("/")) {
    event.respondWith((async()=>{
      try {
        const response = await fetch(event.request);
        if(!response.ok)return response;
        const type=response.headers.get('content-type')||'';
        if(!type.includes('text/html'))return response;
        const html=await response.text();
        const injected=html.replace('</body>','<script src="./chat-theme-v1.js?v=f4be77a0df2e40152b0cc1019aa1281a33a91d29"></script><script src="./calendar-recipients-v1.js?v=ba144f8418ae9fe52132535e15ab897b3f729075"></script></body>');
        return new Response(injected,{status:response.status,statusText:response.statusText,headers:response.headers});
      }catch(_){return caches.match(event.request)}
    })());
    return;
  }
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
