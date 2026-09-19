/* HAVANA NICE — CHAT VIDEO POSTER CACHE V2
   Stable WhatsApp-style video previews.
   Order: local poster cache -> tiny server poster -> legacy remote-frame fallback.
   Full videos stay in Supabase and are loaded only when the user opens them.
*/
(function(){
  'use strict';

  const CACHE_PREFIX='hn-chat-video-posters-v1-';
  const TTL=7*24*60*60*1000;
  const MAX_POSTERS=18;
  const MAX_EDGE=520;
  const JPEG_QUALITY=.70;
  const FETCH_TIMEOUT=5000;
  const CAPTURE_TIMEOUT=10000;
  let observer=null;
  let mutationObserver=null;
  let posterWrite=Promise.resolve();
  const jobs=new Map();

  function profileId(){try{return String(JSON.parse(sessionStorage.getItem('hn_profile')||'null')?.id||'')}catch(_){return ''}}
  function cacheName(){const id=profileId();return id?CACHE_PREFIX+encodeURIComponent(id):''}
  function sourceUrl(video){return String(video?.currentSrc||video?.getAttribute('src')||video?.src||'').trim()}
  function isRemote(url){return /^https:\/\//i.test(url)}
  function cacheKey(url){return new Request(location.origin+'/__hn_chat_video_poster__?src='+encodeURIComponent(url))}
  function serverPosterUrl(url){try{const u=new URL(url);u.pathname=u.pathname+'.poster.jpg';u.search='';u.hash='';return u.toString()}catch(_){return ''}}

  function stableImage(video){return video?.closest('.hn-chat-media-item')?.querySelector('.hn-stable-video-poster')||null}
  function revokePoster(video){
    const local=video?.dataset?.hnLocalVideoPoster;
    if(local){try{URL.revokeObjectURL(local)}catch(_){}delete video.dataset.hnLocalVideoPoster}
    const image=stableImage(video);if(image){image.removeAttribute('src');image.remove()}
  }

  function applyPosterBlob(video,blob){
    if(!video?.isConnected||!blob?.size)return;
    const item=video.closest('.hn-chat-media-item');if(!item)return;
    const old=video.dataset.hnLocalVideoPoster;if(old){try{URL.revokeObjectURL(old)}catch(_){} }
    const local=URL.createObjectURL(blob);video.dataset.hnLocalVideoPoster=local;
    video.poster=local;video.preload='none';
    let image=item.querySelector('.hn-stable-video-poster');
    if(!image){image=document.createElement('img');image.className='hn-stable-video-poster';image.alt='Vista previa del video';item.appendChild(image)}
    image.src=local;
  }

  async function readCachedPoster(url){
    const name=cacheName();if(!name||!('caches'in window))return null;
    try{
      const cache=await caches.open(name),key=cacheKey(url),response=await cache.match(key);
      if(!response)return null;
      const saved=Number(response.headers.get('x-hn-saved-at')||0);
      if(!saved||Date.now()-saved>TTL){await cache.delete(key);return null}
      const blob=await response.blob();return blob.type.startsWith('image/')&&blob.size?blob:null;
    }catch(_){return null}
  }

  function storePoster(url,blob){
    const name=cacheName();if(!name||!blob?.size||!('caches'in window))return Promise.resolve();
    posterWrite=posterWrite.then(async()=>{
      try{
        const cache=await caches.open(name);
        await cache.put(cacheKey(url),new Response(blob,{headers:{'content-type':blob.type||'image/jpeg','x-hn-saved-at':String(Date.now())}}));
        const keys=await cache.keys();
        for(const old of keys.slice(0,Math.max(0,keys.length-MAX_POSTERS)))await cache.delete(old);
      }catch(_){}
    });
    return posterWrite;
  }

  async function fetchServerPoster(videoUrl,noStore=false){
    const url=serverPosterUrl(videoUrl);if(!url||!navigator.onLine)return null;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),FETCH_TIMEOUT);
    try{
      const response=await fetch(url,{signal:controller.signal,cache:noStore?'no-store':'force-cache'});
      if(!response.ok)return null;
      const type=String(response.headers.get('content-type')||'');if(!type.startsWith('image/'))return null;
      const blob=await response.blob();if(!blob.size||blob.size>1024*1024)return null;
      return blob;
    }catch(_){return null}finally{clearTimeout(timer)}
  }

  function drawPoster(video){
    const width=Number(video.videoWidth)||0,height=Number(video.videoHeight)||0;
    if(!width||!height||video.readyState<2)return Promise.resolve(null);
    const scale=Math.min(1,MAX_EDGE/Math.max(width,height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return Promise.resolve(null);
    try{ctx.drawImage(video,0,0,canvas.width,canvas.height)}catch(_){return Promise.resolve(null)}
    return new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',JPEG_QUALITY));
  }

  function captureFromUrl(url){
    if(!isRemote(url)||!navigator.onLine)return Promise.resolve(null);
    if(jobs.has(url))return jobs.get(url);
    const job=new Promise(resolve=>{
      const video=document.createElement('video');let settled=false,timer=null,seeked=false;
      const cleanup=()=>{clearTimeout(timer);video.onloadedmetadata=null;video.onloadeddata=null;video.onseeked=null;video.onerror=null;try{video.pause()}catch(_){}video.removeAttribute('src');try{video.load()}catch(_){}};
      const finish=blob=>{if(settled)return;settled=true;cleanup();resolve(blob||null)};
      const capture=()=>{
        if(settled||video.readyState<2)return;
        const run=async()=>{try{finish(await drawPoster(video))}catch(_){finish(null)}};
        if(typeof video.requestVideoFrameCallback==='function'){try{video.requestVideoFrameCallback(()=>void run());return}catch(_){} }
        setTimeout(()=>void run(),50);
      };
      const seek=()=>{
        if(settled)return;
        const duration=Number(video.duration)||0;
        if(!seeked&&Number.isFinite(duration)&&duration>.1){seeked=true;try{video.currentTime=Math.min(1,Math.max(.25,duration*.08),Math.max(.01,duration-.02));return}catch(_){} }
        capture();
      };
      timer=setTimeout(()=>{if(video.readyState>=2)capture();else finish(null)},CAPTURE_TIMEOUT);
      video.crossOrigin='anonymous';video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='metadata';
      video.onloadedmetadata=seek;video.onloadeddata=()=>{if(seeked)capture();else seek()};video.onseeked=capture;video.onerror=()=>finish(null);
      video.src=url;try{video.load()}catch(_){finish(null)}
    }).finally(()=>jobs.delete(url));
    jobs.set(url,job);return job;
  }

  async function hydrateVideo(video,allowLegacyCapture=false){
    if(!video?.isConnected)return;
    const url=sourceUrl(video);if(!isRemote(url))return;
    video.preload='none';
    if(video.dataset.hnPosterSource===url&&stableImage(video)?.src)return;

    let blob=await readCachedPoster(url);
    if(!video.isConnected||sourceUrl(video)!==url)return;
    if(!blob)blob=await fetchServerPoster(url,false);
    if(!video.isConnected||sourceUrl(video)!==url)return;

    if(!blob&&allowLegacyCapture){
      await new Promise(resolve=>setTimeout(resolve,450));
      blob=await fetchServerPoster(url,true);
      if(!blob)blob=await captureFromUrl(url);
    }
    if(!blob||!video.isConnected||sourceUrl(video)!==url)return;
    await storePoster(url,blob);
    if(video.isConnected&&sourceUrl(video)===url){video.dataset.hnPosterSource=url;applyPosterBlob(video,blob)}
  }

  function ensureObserver(){
    if(observer||typeof IntersectionObserver==='undefined')return;
    observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;observer.unobserve(entry.target);void hydrateVideo(entry.target,true);
    }),{rootMargin:'260px 0px'});
  }

  function wireRemoteVideos(root=document,force=false){
    ensureObserver();
    const videos=[];
    if(root instanceof HTMLVideoElement&&root.closest?.('.hn-chat-row[data-chat-key^="message:"]'))videos.push(root);
    const scope=root?.querySelectorAll?root:document;
    scope.querySelectorAll?.('.hn-chat-row[data-chat-key^="message:"] .hn-chat-media-item video').forEach(video=>videos.push(video));
    [...new Set(videos)].forEach(video=>{
      video.preload='none';
      if(video.dataset.hnPosterCacheBound!=='1'){
        video.dataset.hnPosterCacheBound='1';
        void hydrateVideo(video,false);
        if(observer)observer.observe(video);else void hydrateVideo(video,true);
      }else if(force)void hydrateVideo(video,true);
    });
  }

  function installStyles(){
    if(document.getElementById('hn-stable-video-poster-style'))return;
    const style=document.createElement('style');style.id='hn-stable-video-poster-style';
    style.textContent=`
      #hn-chat-screen .hn-chat-media-item{position:relative!important;overflow:hidden!important}
      #hn-chat-screen .hn-stable-video-poster{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;background:#090909!important;z-index:5!important;pointer-events:none!important}
    `;
    document.head.appendChild(style);
  }

  function observe(){
    if(mutationObserver)return;
    mutationObserver=new MutationObserver(mutations=>{
      for(const mutation of mutations){
        for(const node of mutation.addedNodes){if(node instanceof Element)wireRemoteVideos(node.parentElement||node)}
        for(const node of mutation.removedNodes){
          if(!(node instanceof Element))continue;
          if(node instanceof HTMLVideoElement)revokePoster(node);
          node.querySelectorAll?.('video[data-hn-local-video-poster]').forEach(revokePoster);
        }
      }
    });
    mutationObserver.observe(document.documentElement,{childList:true,subtree:true});
  }

  function init(){
    installStyles();wireRemoteVideos();observe();
    window.hnRefreshChatVideoPosters=root=>wireRemoteVideos(root||document,true);
    window.addEventListener('hn:session-ready',()=>setTimeout(()=>wireRemoteVideos(document,true),80));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
