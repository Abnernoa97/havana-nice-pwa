/* HAVANA NICE — UNIFIED SERVICE WORKER
   One worker for musicians + admin + push.
   Preserves iOS Family handling while preventing cache/worker conflicts.
*/
const CACHE='hn-unified-v2';
const MUSICIAN_SHELL='./index.html';
const ADMIN_SHELL='./admin.html';
const MUSICIAN_SHELL_REQUEST=new Request(MUSICIAN_SHELL);
const ADMIN_SHELL_REQUEST=new Request(ADMIN_SHELL);
const SUPABASE_CDN='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const SUPABASE_ESM='https://esm.sh/@supabase/supabase-js@2';
const IS_IOS=/iPad|iPhone|iPod/.test(self.navigator?.userAgent||'')||((self.navigator?.platform||'')==='MacIntel'&&(self.navigator?.maxTouchPoints||0)>1);
const FAMILY_IOS_VERSION='ios-family-20260918-clean';

const FRESH_PATHS=new Set([
  '/notifications-v5.js','/operations-fix.js','/ios-install-v1.js',
  '/chat-media-fix-v1.js','/chat-v2.js','/chat-typing-v2.js',
  '/chat-realtime-guard-v1.js','/chat-keyboard-v1.js',
  '/chat-media-lightbox-v2.js','/chat-video-controls-v1.js',
  '/chat-video-fast-path-v1.js','/chat-video-poster-cache-v1.js','/chat-video-persisted-poster-v1.js',
  '/family-v1.js',
  '/musician-device-access-v1.js','/musician-push.js','/musician-background-v1.js',
  '/calendar-v1.js','/calendar-expand.js','/calendar-navigation.js',
  '/calendar-recipients-v1.js','/repertoire-v1.js','/notifications-navigation.js',
  '/session-memory-v2.js',
  '/admin-ui-v1.js','/admin-family-v1.js','/admin-storage-summary.js',
  '/admin-access-v1.js','/admin-chat-v1.js','/admin-background-v1.js',
  '/admin-summary-realtime.js','/admin-pwa.js'
]);

function normalizedHtmlResponse(response,text){
  const headers=new Headers(response.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.set('content-type','text/html; charset=utf-8');
  headers.set('cache-control','no-store');
  return new Response(text,{status:response.status,statusText:response.statusText,headers});
}

async function normalizeMusicianShell(response){
  if(!response||!response.ok)return response;
  let text=await response.text();
  text=text.split(SUPABASE_CDN).join(SUPABASE_ESM);
  if(IS_IOS)text=text.replace(/\.\/family-v1\.js\?v=[^"']+/g,'./family-v1.js?v='+FAMILY_IOS_VERSION);
  return normalizedHtmlResponse(response,text);
}

async function normalizeAdminShell(response){
  if(!response||!response.ok)return response;
  let text=await response.text();
  text=text.split(SUPABASE_CDN).join(SUPABASE_ESM);
  return normalizedHtmlResponse(response,text);
}

function isAdminUrl(url){return url.pathname.endsWith('/admin.html')}
async function normalizeShell(response,admin){return admin?normalizeAdminShell(response):normalizeMusicianShell(response)}

async function refreshShell(path,requestKey,admin){
  try{
    const response=await fetch(path,{cache:'no-store'});
    if(!response.ok)return;
    const fixed=await normalizeShell(response,admin);
    const cache=await caches.open(CACHE);
    await cache.put(requestKey,fixed.clone());
  }catch(_){}
}

async function networkFirstNavigation(request,admin){
  const cache=await caches.open(CACHE);
  const key=admin?ADMIN_SHELL_REQUEST:MUSICIAN_SHELL_REQUEST;
  try{
    const response=await fetch(request,{cache:'no-store'});
    const fixed=await normalizeShell(response,admin);
    if(fixed?.ok)await cache.put(key,fixed.clone());
    return fixed;
  }catch(_){return (await cache.match(key))||Response.error()}
}

async function networkFirstAsset(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response&&response.ok)await cache.put(request,response.clone());
    return response;
  }catch(_){return (await cache.match(request))||Response.error()}
}

async function networkWithCacheFallback(request){
  try{
    const response=await fetch(request);
    if(response&&response.ok&&response.status!==206&&new URL(request.url).origin===self.location.origin){
      try{const cache=await caches.open(CACHE);await cache.put(request,response.clone())}catch(_){}
    }
    return response;
  }catch(_){return (await caches.match(request))||Response.error()}
}

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(Promise.all([
    refreshShell(MUSICIAN_SHELL,MUSICIAN_SHELL_REQUEST,false),
    refreshShell(ADMIN_SHELL,ADMIN_SHELL_REQUEST,true)
  ]));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE&&key.startsWith('hn-')).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);

  // Critical iOS rule: Supabase/Storage cross-origin requests never pass through the SW.
  if(IS_IOS&&url.origin!==self.location.origin)return;

  if(url.hostname==='cdn.jsdelivr.net'&&url.pathname==='/npm/@supabase/supabase-js@2/+esm'){
    event.respondWith(fetch(SUPABASE_ESM).catch(()=>fetch(event.request)));
    return;
  }

  if(event.request.mode==='navigate'&&url.origin===self.location.origin){
    event.respondWith(networkFirstNavigation(event.request,isAdminUrl(url)));
    return;
  }

  if(IS_IOS&&url.pathname.endsWith('/family-v1.js')){
    const fresh=new URL(event.request.url);
    fresh.searchParams.set('hn_ios_family',FAMILY_IOS_VERSION);
    event.respondWith(fetch(new Request(fresh.toString(),{method:'GET',credentials:'same-origin',cache:'no-store'})).catch(()=>networkFirstAsset(event.request)));
    return;
  }

  if(url.origin===self.location.origin&&FRESH_PATHS.has(url.pathname)){
    event.respondWith(networkFirstAsset(event.request));
    return;
  }

  event.respondWith(networkWithCacheFallback(event.request));
});

self.addEventListener('push',event=>{
  event.waitUntil((async()=>{
    let data={};try{data=event.data?event.data.json():{}}catch(_){data={}}
    const title=data.title||'HAVANA NICE',body=data.message||'Nueva actualización',url=data.url||'/';
    let count=1;
    try{count=(await new Promise(resolve=>{const request=indexedDB.open('hn_push',1);request.onupgradeneeded=()=>request.result.createObjectStore('state');request.onsuccess=()=>{const q=request.result.transaction('state','readwrite').objectStore('state').get('count');q.onsuccess=()=>resolve(Number(q.result||0));q.onerror=()=>resolve(0)};request.onerror=()=>resolve(0)}))+1}catch(_){}
    try{const request=indexedDB.open('hn_push',1);request.onsuccess=()=>{const db=request.result;db.transaction('state','readwrite').objectStore('state').put(count,'count')}}catch(_){}
    try{if(self.navigator&&self.navigator.setAppBadge)await self.navigator.setAppBadge(Math.min(99,count))}catch(_){}
    await self.registration.showNotification(title,{body,tag:'hn-push-'+Date.now(),renotify:true,silent:false,vibrate:[200,100,200,100,300],data:{url}});
  })());
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=(event.notification.data&&event.notification.data.url)||'/';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const client of list){if('focus'in client)return client.focus()}return clients.openWindow(url)}));
});