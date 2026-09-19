/* HAVANA NICE — CHAT VIDEO FAST PATH V1
   Pure videos skip client-side re-encoding and use the local file for an immediate preview.
   Remote/cached posters remain owned by chat-video-poster-cache-v1.js.
*/
(function(){
  'use strict';

  const INPUT_SELECTOR='.hn-chat-media-input';
  const MAX_EDGE=480;
  const QUALITY=.66;
  const bound=new WeakSet();

  function source(video){return String(video?.currentSrc||video?.getAttribute('src')||video?.src||'').trim();}
  function isLocalVideo(video){return source(video).startsWith('blob:');}

  function releasePoster(video){
    const url=video?.dataset?.hnFastVideoPoster;
    if(url){try{URL.revokeObjectURL(url)}catch(_){}delete video.dataset.hnFastVideoPoster;}
  }

  function drawPoster(video){
    const w=Number(video.videoWidth)||0,h=Number(video.videoHeight)||0;
    if(!w||!h||video.readyState<2)return;
    const scale=Math.min(1,MAX_EDGE/Math.max(w,h));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(w*scale));
    canvas.height=Math.max(1,Math.round(h*scale));
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return;
    try{ctx.drawImage(video,0,0,canvas.width,canvas.height);}catch(_){return;}
    canvas.toBlob(blob=>{
      if(!blob?.size||!video.isConnected||!isLocalVideo(video))return;
      releasePoster(video);
      const url=URL.createObjectURL(blob);
      video.dataset.hnFastVideoPoster=url;
      video.poster=url;
      video.preload='metadata';
    },'image/jpeg',QUALITY);
  }

  function primeLocalVideo(video){
    if(!video||bound.has(video)||!isLocalVideo(video))return;
    bound.add(video);
    video.muted=true;video.playsInline=true;video.preload='auto';
    let sought=false;
    const capture=()=>{if(video.readyState>=2)drawPoster(video);};
    const seek=()=>{
      const duration=Number(video.duration)||0;
      if(!sought&&duration>.15){
        sought=true;
        try{video.currentTime=Math.min(.12,duration/3);return;}catch(_){}
      }
      capture();
    };
    video.addEventListener('loadedmetadata',seek,{once:true});
    video.addEventListener('loadeddata',()=>{if(!sought)seek();else capture();},{once:true});
    video.addEventListener('seeked',capture,{once:true});
    if(video.readyState>=1)seek();
    try{video.load()}catch(_){}
  }

  function scan(root=document){
    const scope=root?.querySelectorAll?root:document;
    scope.querySelectorAll('.hn-chat-pending-item video,.hn-chat-row[data-chat-key="outgoing"] video').forEach(primeLocalVideo);
    if(root instanceof HTMLVideoElement)primeLocalVideo(root);
  }

  function redispatchFast(input){
    const synthetic=new Event('change',{bubbles:true});
    Object.defineProperty(synthetic,'__hnOptimizedChange',{value:true});
    input.dispatchEvent(synthetic);
  }

  function bypassVideoOptimization(event){
    const input=event.target;
    if(!(input instanceof HTMLInputElement)||!input.matches(INPUT_SELECTOR)||event.__hnOptimizedChange)return;
    const files=[...(input.files||[])];
    if(!files.length||!files.every(file=>file.type.startsWith('video/')))return;
    // The old optimizer re-records Android video in real time. For pure video
    // selections we skip that path completely and continue with the original file.
    event.preventDefault();
    event.stopImmediatePropagation();
    queueMicrotask(()=>redispatchFast(input));
  }

  function install(){
    document.addEventListener('change',bypassVideoOptimization,{capture:true});
    scan();
    const observer=new MutationObserver(mutations=>{
      for(const mutation of mutations){
        for(const node of mutation.addedNodes){if(node instanceof Element)scan(node.parentElement||node);}
        for(const node of mutation.removedNodes){
          if(!(node instanceof Element))continue;
          if(node instanceof HTMLVideoElement)releasePoster(node);
          node.querySelectorAll?.('video[data-hn-fast-video-poster]').forEach(releasePoster);
        }
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
