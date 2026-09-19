/* HAVANA NICE — CHAT VIDEO FAST PATH V2
   Videos never enter the slow client-side re-encoding path.
   A lightweight poster is generated from the local file and reused for pending/outgoing UI.
   The selected thumbnail is hidden while the large ENVIANDO bubble is visible.
*/
(function(){
  'use strict';

  const INPUT_SELECTOR='.hn-chat-media-input';
  const MAX_EDGE=520;
  const QUALITY=.72;
  const POSTER_TIMEOUT=9000;
  let selection=[];
  let selectionGeneration=0;
  let observer=null;

  function isVideo(file){return !!file?.type?.startsWith('video/');}
  function revokeEntry(entry){if(entry?.url){try{URL.revokeObjectURL(entry.url)}catch(_){}entry.url='';}}
  function clearSelection(){selection.forEach(revokeEntry);selection=[];selectionGeneration++;}

  function posterFromFile(file,generation){
    return new Promise(resolve=>{
      const sourceUrl=URL.createObjectURL(file),video=document.createElement('video');
      let settled=false,timer=null,frameRequested=false;
      const finish=blob=>{
        if(settled)return;settled=true;clearTimeout(timer);
        try{video.pause()}catch(_){}
        video.onloadedmetadata=null;video.onloadeddata=null;video.onseeked=null;video.onerror=null;
        video.removeAttribute('src');try{video.load()}catch(_){}
        URL.revokeObjectURL(sourceUrl);
        if(!blob?.size||generation!==selectionGeneration){resolve(null);return;}
        const url=URL.createObjectURL(blob);resolve({blob,url});
      };
      const draw=()=>{
        if(settled||video.readyState<2)return;
        const w=Number(video.videoWidth)||0,h=Number(video.videoHeight)||0;if(!w||!h)return;
        const scale=Math.min(1,MAX_EDGE/Math.max(w,h));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
        const ctx=canvas.getContext('2d',{alpha:false});if(!ctx){finish(null);return;}
        try{ctx.drawImage(video,0,0,canvas.width,canvas.height);}catch(_){finish(null);return;}
        canvas.toBlob(finish,'image/jpeg',QUALITY);
      };
      const requestFrame=()=>{
        if(settled||frameRequested)return;frameRequested=true;
        if(typeof video.requestVideoFrameCallback==='function'){
          try{video.requestVideoFrameCallback(()=>draw());return;}catch(_){}
        }
        requestAnimationFrame(draw);
      };
      const seekFrame=()=>{
        if(settled)return;
        const duration=Number(video.duration)||0;
        if(Number.isFinite(duration)&&duration>.08){
          try{
            const target=Math.min(.12,Math.max(.01,duration/3));
            if(Math.abs((video.currentTime||0)-target)>.005){video.currentTime=target;return;}
          }catch(_){}
        }
        requestFrame();
      };
      timer=setTimeout(()=>{if(video.readyState>=2)draw();else finish(null);},POSTER_TIMEOUT);
      video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';
      video.onloadedmetadata=()=>{
        // Muted one-frame playback makes iOS decode a real frame instead of keeping the surface black.
        try{const p=video.play();if(p?.then)p.then(()=>{try{video.pause()}catch(_){}seekFrame();}).catch(()=>seekFrame());else seekFrame();}catch(_){seekFrame();}
      };
      video.onloadeddata=()=>{frameRequested=false;seekFrame();};
      video.onseeked=()=>{frameRequested=false;requestFrame();};
      video.onerror=()=>finish(null);
      video.src=sourceUrl;try{video.load()}catch(_){finish(null);}
    });
  }

  function prepareSelection(files){
    clearSelection();
    const generation=selectionGeneration;
    selection=files.map(file=>{
      if(!isVideo(file))return null;
      const entry={file,url:'',promise:null};
      entry.promise=posterFromFile(file,generation).then(result=>{
        if(!result||generation!==selectionGeneration)return null;
        entry.url=result.url;applySelectionPosters();return entry.url;
      });
      return entry;
    });
  }

  function decorateItem(item,url){
    if(!item?.isConnected||!url)return;
    const video=item.querySelector('video');if(!video)return;
    video.poster=url;video.preload='none';
    let image=item.querySelector('.hn-fast-video-poster');
    if(!image){image=document.createElement('img');image.className='hn-fast-video-poster';image.alt='Vista previa del video';item.appendChild(image);}
    if(image.src!==url)image.src=url;
  }

  function applyToContainer(container){
    if(!container)return;
    const items=[...container.querySelectorAll('.hn-chat-media-item,.hn-chat-pending-item')];
    if(!items.length)return;
    items.forEach((item,index)=>{
      const entry=selection[index];if(!entry)return;
      if(entry.url)decorateItem(item,entry.url);
      else entry.promise?.then(url=>{if(url)decorateItem(item,url);});
    });
  }

  function applySelectionPosters(){
    const screen=document.getElementById('hn-chat-screen');if(!screen)return;
    applyToContainer(screen.querySelector('.hn-chat-media-pending'));
    applyToContainer(screen.querySelector('.hn-chat-row[data-chat-key="outgoing"]'));
  }

  function syncSendingState(){
    const screen=document.getElementById('hn-chat-screen');if(!screen)return;
    const sending=!!screen.querySelector('.hn-chat-row[data-chat-key="outgoing"]');
    screen.classList.toggle('hn-video-media-sending',sending);
    if(sending)applySelectionPosters();
  }

  function redispatchFast(input){
    const synthetic=new Event('change',{bubbles:true});
    Object.defineProperty(synthetic,'__hnOptimizedChange',{value:true});
    input.dispatchEvent(synthetic);
  }

  function bypassVideoOptimization(event){
    const input=event.target;
    if(!(input instanceof HTMLInputElement)||!input.matches(INPUT_SELECTOR)||event.__hnOptimizedChange)return;
    const files=[...(input.files||[])];if(!files.length)return;
    if(!files.some(isVideo)){clearSelection();return;}

    // Any selection containing video bypasses the legacy canvas/MediaRecorder optimizer.
    // Photos-only selections still use the normal lightweight image optimizer.
    prepareSelection(files);
    event.preventDefault();event.stopImmediatePropagation();
    queueMicrotask(()=>redispatchFast(input));
  }

  function installStyles(){
    if(document.getElementById('hn-video-fast-path-style'))return;
    const style=document.createElement('style');style.id='hn-video-fast-path-style';
    style.textContent=`
      #hn-chat-screen.hn-video-media-sending .hn-chat-media-pending{display:none!important}
      #hn-chat-screen .hn-chat-pending-item,#hn-chat-screen .hn-chat-row[data-chat-key="outgoing"] .hn-chat-media-item{position:relative!important;overflow:hidden!important}
      #hn-chat-screen .hn-fast-video-poster{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;background:#090909!important;z-index:3!important;pointer-events:none!important}
    `;
    document.head.appendChild(style);
  }

  function install(){
    installStyles();
    document.addEventListener('change',bypassVideoOptimization,{capture:true});
    observer=new MutationObserver(()=>{applySelectionPosters();syncSendingState();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('hn:session-logout',clearSelection);
    applySelectionPosters();syncSendingState();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
