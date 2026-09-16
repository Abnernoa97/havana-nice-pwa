const CACHE='hn-admin-v7';
const FAMILY_ADMIN='./admin-family-v1.js?v=9abc141b29b92071ddacd08ddc2ccb9011b75c7b';
async function normalizeAdmin(response){if(!response||!response.ok)return response;const text=await response.text();const fixed=text.includes('admin-family-v1.js')?text:text.replace('</body>',`<script src="${FAMILY_ADMIN}"></script></body>`);const h=new Headers(response.headers);h.delete('content-encoding');h.delete('content-length');h.set('content-type','text/html; charset=utf-8');return new Response(fixed,{status:response.status,statusText:response.statusText,headers:h})}
async function refreshAdminShell(){try{const r=await fetch('./admin.html',{cache:'no-store'});if(!r.ok)return;const fixed=await normalizeAdmin(r);const c=await caches.open(CACHE);await c.put('./admin.html',fixed.clone())}catch(_) {}}
self.addEventListener('install',e=>{e.waitUntil(refreshAdminShell());self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.hostname==='cdn.jsdelivr.net'&&url.pathname==='/npm/@supabase/supabase-js@2/+esm'){e.respondWith(fetch('https://esm.sh/@supabase/supabase-js@2').catch(()=>fetch(e.request)));return}
  if(url.origin!==location.origin)return;
  if(url.pathname.endsWith('/admin.html')){e.respondWith((async()=>{const cached=await caches.match('./admin.html');e.waitUntil(refreshAdminShell());if(cached)return cached;return normalizeAdmin(await fetch(e.request))})());return}
  if(url.pathname.endsWith('/admin-ui-v1.js')||url.pathname.endsWith('/admin-family-v1.js')){e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)));return}
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
});
