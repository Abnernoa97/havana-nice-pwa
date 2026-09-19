/* HAVANA NICE — CHAT VIDEO POSTER CACHE V1
   WhatsApp-style local video previews without caching full videos.
   Supabase remains authoritative; only lightweight JPEG posters live locally.
*/
(function(){
  'use strict';

  const CACHE_PREFIX='hn-chat-video-posters-v1-';
  const TTL=7*24*60*60*1000;
  const MAX_POSTERS=18;
  const MAX_EDGE=480;
  const JPEG_QUALITY=.68;
  const CAPTURE_TIMEOUT=12000;

  let observer=null;
  let mutationObserver=null;
  let posterWrite=Promise.resolve();
  let pendingBatch=[];
  const remoteJobs=new Map();

  function profileId(){
    try{return String(JSON.parse(sessionStorage.getItem('hn_profile')||'null')?.id||'');}
    catch(_){return '';}
  }

  function cacheName(){const id=profileId();return id?CACHE_PREFIX+encodeURIComponent(id):'';}
  function sourceUrl(video){return String(video?.currentSrc||video?.getAttribute('src')||video?.src||'').trim();}
  function isRemote(url){return /^https:\/\//i.test(url);}
  function cacheKey(url){return new Request(location.origin+'/__hn_chat_video_poster__?src='+encodeURIComponent(url));}

  function revokePoster(video){
    const local=video?.dataset?.hnLocalVideoPoster;
    if(local){try{URL.revokeObjectURL(local)}catch(_){}delete video.dataset.hnLocalVideoPoster;}
  }

  function applyPosterBlob(video,blob){
    if(!video?.isConnected||!blob?.size)return;
    revokePoster(video);
    const local=URL.createObjectURL(blob);
    video.dataset.hnLocalVideoPoster=local;
    video.poster=local;
    video.preload='none';
  }

  async function readCachedPoster(url){
    const name=cacheName();if(!name||!('caches'in window))return null;
    try{
      const cache=await caches.open(name),response=await cache.match(cacheKey(url));
      if(!response)return null;
      const saved=Number(response.headers.get('x-hn-saved-at')||0);
      if(!saved||Date.now()-saved>TTL){await cache.delete(cacheKey(url));return null;}
      const blob=await response.blob();
      return blob.type.startsWith('image/')&&blob.size?blob:null;
    }catch(_){return null;}
  }

  function storePoster(url,blob){
    const name=cacheName();if(!name||!blob?.size||!('caches'in window))return Promise.resolve();
    posterWrite=posterWrite.then(async()=>{
      try{
        const cache=await caches.open(name),key=cacheKey(url);
        await cache.put(key,new Response(blob,{headers:{'content-type':blob.type||'image/jpeg','x-hn-saved-at':String(Date.now())}}));
        const keys=await cache.keys();
        for(const old of keys.slice(0,Math.max(0,keys.length-MAX_POSTERS)))await cache.delete(old);
      }catch(_){}
    });
    return posterWrite;
  }

  function drawPoster(video){
    const width=Number(video.videoWidth)||0,height=Number(video.videoHeight)||0;
    if(!width||!height)return Promise.resolve(null);
    const scale=Math.min(1,MAX_EDGE/Math.max(width,height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(width*scale));
    canvas.height=Math.max(1,Math.round(height*scale));
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return Promise.resolve(null);
    try{ctx.drawImage(video,0,0,canvas.width,canvas.height);}catch(_){return Promise.resolve(null);}
    return new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',JPEG_QUALITY));
  }

  function captureFromUrl(url){
    if(!isRemote(url)||!navigator.onLine)return Promise.resolve(null);
    if(remoteJobs.has(url))return remoteJobs.get(url);
    const job=new Promise(resolve=>{
      const video=document.createElement('video');
      let settled=false,timer=null;
      const cleanup=()=>{clearTimeout(timer);video.onloadeddata=null;video.onloadedmetadata=null;video.onseeked=null;video.onerror=null;try{video.pause()}catch(_){}video.removeAttribute('src');try{video.load()}catch(_){}};
      const finish=blob=>{if(settled)return;settled=true;cleanup();resolve(blob||null);};
      const capture=async()=>{try{finish(await drawPoster(video));}catch(_){finish(null);}};
      const seekOrCapture=()=>{
        const duration=Number(video.duration)||0;
        if(duration>.2&&video.currentTime<.05){
          video.onseeked=()=>capture();
          try{video.currentTime=Math.min(.18,duration/3);return;}catch(_){}
        }
        if(video.readyState>=2)capture();
      };
      timer=setTimeout(()=>finish(null),CAPTURE_TIMEOUT);
      video.crossOrigin='anonymous';video.muted=true;video.playsInline=true;video.preload='metadata';
      video.onloadeddata=seekOrCapture;
      video.onloadedmetadata=seekOrCapture;
      video.onerror=()=>finish(null);
      video.src=url;
      try{video.load()}catch(_){finish(null);}
    }).finally(()=>remoteJobs.delete(url));
    remoteJobs.set(url,job);return job;
  }

  async function hydrateVideo(video,allowRemoteCapture=false){
    if(!video?.isConnected)return;
    const url=sourceUrl(video);if(!isRemote(url))return;
    if(video.dataset.hnPosterSource===url&&video.poster)return;
    const cached=await readCachedPoster(url);
    if(!video.isConnected||sourceUrl(video)!==url)return;
    if(cached){video.dataset.hnPosterSource=url;applyPosterBlob(video,cached);return;}
    if(!allowRemoteCapture)return;
    const blob=await captureFromUrl(url);
    if(!blob||!video.isConnected||sourceUrl(video)!==url)return;
    await storePoster(url,blob);
    if(video.isConnected&&sourceUrl(video)===url){video.dataset.hnPosterSource=url;applyPosterBlob(video,blob);}
  }

  function ensureObserver(){
    if(observer||typeof IntersectionObserver==='undefined')return;
    observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        observer.unobserve(entry.target);
        void hydrateVideo(entry.target,true);
      });
    },{rootMargin:'220px 0px'});
  }

  function wireRemoteVideos(root=document){
    ensureObserver();
    const scope=root?.querySelectorAll?root:document;
    scope.querySelectorAll('.hn-chat-row[data-chat-key^="message:"] .hn-chat-media-item video').forEach(video=>{
      if(video.dataset.hnPosterCacheBound==='1')return;
      video.dataset.hnPosterCacheBound='1';
      void hydrateVideo(video,false);
      if(observer)observer.observe(video);else void hydrateVideo(video,true);
      video.addEventListener('play',()=>{video.preload='metadata';},{once:true});
    });
  }

  async function capturePendingDom(){
    const box=document.querySelector('#hn-chat-screen .hn-chat-media-pending');
    if(!box?.classList.contains('is-visible')){pendingBatch=[];return;}
    const items=[...box.querySelectorAll('.hn-chat-pending-item')];
    const posters=[];
    for(let i=0;i<items.length;i++){
      const video=items[i].querySelector('video');
      if(!video){posters.push(null);continue;}
      try{
        if(video.readyState<2)await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);resolve();};const timer=setTimeout(finish,2500);video.addEventListener('loadeddata',finish,{once:true});});
        const duration=Number(video.duration)||0;
        if(duration>.2&&video.currentTime<.05){
          await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);resolve();};const timer=setTimeout(finish,1800);video.addEventListener('seeked',finish,{once:true});try{video.currentTime=Math.min(.15,duration/3);}catch(_){finish();}});
        }
        posters.push(await drawPoster(video));
      }catch(_){posters.push(null);}
    }
    pendingBatch=posters;
  }

  async function bindPendingToConfirmed(row){
    if(!pendingBatch.length||!row?.isConnected||!row.matches('.hn-chat-row[data-chat-key^="message:"]'))return;
    const videos=[...row.querySelectorAll('.hn-chat-media-item video')];if(!videos.length)return;
    const posters=pendingBatch.slice();
    const videoPosters=posters.filter(Boolean);
    if(!videoPosters.length){pendingBatch=[];return;}
    let posterIndex=0;
    for(const video of videos){
      const blob=videoPosters[posterIndex++];if(!blob)continue;
      const url=sourceUrl(video);if(!isRemote(url))continue;
      video.dataset.hnPosterSource=url;applyPosterBlob(video,blob);await storePoster(url,blob);
    }
    pendingBatch=[];
  }

  function observe(){
    if(mutationObserver)return;
    mutationObserver=new MutationObserver(mutations=>{
      let pendingChanged=false;
      for(const mutation of mutations){
        if(mutation.target instanceof Element&&mutation.target.closest?.('.hn-chat-media-pending'))pendingChanged=true;
        for(const node of mutation.addedNodes){
          if(!(node instanceof Element))continue;
          wireRemoteVideos(node.parentElement||node);
          if(node.matches?.('.hn-chat-row[data-chat-key^="message:"]'))void bindPendingToConfirmed(node);
          else node.querySelectorAll?.('.hn-chat-row[data-chat-key^="message:"]').forEach(row=>void bindPendingToConfirmed(row));
          if(node.matches?.('.hn-chat-media-pending,.hn-chat-pending-item')||node.querySelector?.('.hn-chat-media-pending,.hn-chat-pending-item'))pendingChanged=true;
        }
        for(const node of mutation.removedNodes){
          if(!(node instanceof Element))continue;
          node.querySelectorAll?.('video[data-hn-local-video-poster]').forEach(revokePoster);
          if(node.matches?.('video[data-hn-local-video-poster]'))revokePoster(node);
          if(node.matches?.('.hn-chat-pending-item')||node.querySelector?.('.hn-chat-pending-item'))pendingChanged=true;
        }
      }
      if(pendingChanged)setTimeout(()=>void capturePendingDom(),40);
    });
    mutationObserver.observe(document.documentElement,{childList:true,subtree:true});
  }

  function init(){wireRemoteVideos();observe();window.addEventListener('hn:session-ready',()=>setTimeout(()=>wireRemoteVideos(),80));window.addEventListener('hn:session-logout',()=>{pendingBatch=[];});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
