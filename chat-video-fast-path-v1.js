/* HAVANA NICE — CHAT VIDEO FAST PATH V3
   Video sends stay original: no client-side re-encoding.
   A lightweight JPEG poster is generated from the local file, shown immediately,
   cached locally and uploaded beside the confirmed video for stable iPhone previews.
*/
(function(){
  'use strict';

  const INPUT_SELECTOR='.hn-chat-media-input';
  const MEDIA_BUCKET='chat-media';
  const CACHE_PREFIX='hn-chat-video-posters-v1-';
  const MAX_EDGE=520;
  const QUALITY=.72;
  const POSTER_TIMEOUT=9000;
  let selection=[];
  let selectionGeneration=0;
  let baselineKeys=new Set();
  let observer=null;
  let hadOutgoing=false;
  let binding=false;

  function isVideo(file){return !!file?.type?.startsWith('video/');}
  function profileId(){try{return String(JSON.parse(sessionStorage.getItem('hn_profile')||'null')?.id||'')}catch(_){return ''}}
  function client(){return window.hnSupabase||window.hnMusicianSupabase||window.supabaseClient||window.supabase||null}
  function source(video){return String(video?.currentSrc||video?.getAttribute('src')||video?.src||'').trim()}
  function isRemote(url){return /^https:\/\//i.test(url)}
  function cacheKey(url){return new Request(location.origin+'/__hn_chat_video_poster__?src='+encodeURIComponent(url))}
  function currentMessageKeys(){return new Set([...document.querySelectorAll('#hn-chat-screen .hn-chat-row.mine[data-chat-key^="message:"]')].map(row=>row.dataset.chatKey).filter(Boolean))}

  function revokeEntry(entry){if(entry?.url){try{URL.revokeObjectURL(entry.url)}catch(_){}entry.url=''}}
  function clearSelection(){selection.forEach(revokeEntry);selection=[];baselineKeys=new Set();selectionGeneration++}

  function posterFromFile(file,generation){
    return new Promise(resolve=>{
      const sourceUrl=URL.createObjectURL(file),video=document.createElement('video');
      let settled=false,timer=null,frameRequested=false,seekAttempted=false;
      const finish=blob=>{
        if(settled)return;settled=true;clearTimeout(timer);
        try{video.pause()}catch(_){}
        video.onloadedmetadata=null;video.onloadeddata=null;video.onseeked=null;video.onerror=null;
        video.removeAttribute('src');try{video.load()}catch(_){}
        URL.revokeObjectURL(sourceUrl);
        if(!blob?.size||generation!==selectionGeneration){resolve(null);return;}
        resolve({blob,url:URL.createObjectURL(blob)});
      };
      const draw=()=>{
        if(settled||video.readyState<2)return;
        const w=Number(video.videoWidth)||0,h=Number(video.videoHeight)||0;if(!w||!h)return;
        const scale=Math.min(1,MAX_EDGE/Math.max(w,h));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
        const ctx=canvas.getContext('2d',{alpha:false});if(!ctx){finish(null);return;}
        try{ctx.drawImage(video,0,0,canvas.width,canvas.height)}catch(_){finish(null);return;}
        canvas.toBlob(finish,'image/jpeg',QUALITY);
      };
      const requestFrame=()=>{
        if(settled||frameRequested)return;frameRequested=true;
        if(typeof video.requestVideoFrameCallback==='function'){
          try{video.requestVideoFrameCallback(()=>draw());return}catch(_){}
        }
        setTimeout(()=>requestAnimationFrame(draw),40);
      };
      const seekFrame=()=>{
        if(settled)return;
        const duration=Number(video.duration)||0;
        if(!seekAttempted&&Number.isFinite(duration)&&duration>.1){
          seekAttempted=true;
          const target=Math.min(1,Math.max(.25,duration*.08));
          try{video.currentTime=Math.min(target,Math.max(.01,duration-.02));return}catch(_){}
        }
        requestFrame();
      };
      timer=setTimeout(()=>{if(video.readyState>=2)requestFrame();else finish(null)},POSTER_TIMEOUT);
      video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';
      video.onloadedmetadata=()=>{
        try{
          const play=video.play();
          if(play?.then)play.then(()=>setTimeout(()=>{try{video.pause()}catch(_){}seekFrame()},80)).catch(()=>seekFrame());
          else seekFrame();
        }catch(_){seekFrame()}
      };
      video.onloadeddata=()=>{if(seekAttempted)requestFrame();else seekFrame()};
      video.onseeked=()=>{frameRequested=false;requestFrame()};
      video.onerror=()=>finish(null);
      video.src=sourceUrl;try{video.load()}catch(_){finish(null)}
    });
  }

  function prepareSelection(files){
    clearSelection();
    baselineKeys=currentMessageKeys();
    const generation=selectionGeneration;
    selection=files.map(file=>{
      if(!isVideo(file))return null;
      const entry={file,url:'',blob:null,promise:null};
      entry.promise=posterFromFile(file,generation).then(result=>{
        if(!result||generation!==selectionGeneration)return null;
        entry.url=result.url;entry.blob=result.blob;applySelectionPosters();return entry;
      });
      return entry;
    });
  }

  function decorateItem(item,url,className='hn-fast-video-poster'){
    if(!item?.isConnected||!url)return;
    const video=item.querySelector('video');if(!video)return;
    video.poster=url;video.preload='none';
    let image=item.querySelector('.'+className);
    if(!image){image=document.createElement('img');image.className=className;image.alt='Vista previa del video';item.appendChild(image)}
    if(image.src!==url)image.src=url;
  }

  function applyToContainer(container){
    if(!container)return;
    const items=[...container.querySelectorAll('.hn-chat-media-item,.hn-chat-pending-item')];
    if(!items.length)return;
    items.forEach((item,index)=>{
      const entry=selection[index];if(!entry)return;
      if(entry.url)decorateItem(item,entry.url);
      else entry.promise?.then(result=>{if(result?.url)decorateItem(item,result.url)})
    });
  }

  function applySelectionPosters(){
    const screen=document.getElementById('hn-chat-screen');if(!screen)return;
    applyToContainer(screen.querySelector('.hn-chat-media-pending'));
    applyToContainer(screen.querySelector('.hn-chat-row[data-chat-key="outgoing"]'));
  }

  async function storeLocalPoster(remoteUrl,blob){
    const id=profileId();if(!id||!blob?.size||!('caches'in window))return;
    try{
      const cache=await caches.open(CACHE_PREFIX+encodeURIComponent(id));
      await cache.put(cacheKey(remoteUrl),new Response(blob,{headers:{'content-type':'image/jpeg','x-hn-saved-at':String(Date.now())}}));
    }catch(_){}
  }

  function objectPath(remoteUrl){
    try{
      const u=new URL(remoteUrl),marker='/storage/v1/object/public/'+MEDIA_BUCKET+'/';
      const index=u.pathname.indexOf(marker);if(index<0)return '';
      return decodeURIComponent(u.pathname.slice(index+marker.length));
    }catch(_){return ''}
  }

  async function uploadServerPoster(remoteUrl,blob){
    const sb=client(),path=objectPath(remoteUrl);if(!sb||!path||!blob?.size)return;
    try{
      const result=await sb.storage.from(MEDIA_BUCKET).upload(path+'.poster.jpg',blob,{contentType:'image/jpeg',upsert:false});
      if(result?.error&&!/exist|duplicate|already/i.test(String(result.error.message||'')))console.warn('HAVANA NICE poster upload skipped:',result.error);
    }catch(error){console.warn('HAVANA NICE poster upload failed:',error)}
  }

  async function bindSelectionToConfirmed(){
    if(binding||!selection.some(Boolean))return false;
    const rows=[...document.querySelectorAll('#hn-chat-screen .hn-chat-row.mine[data-chat-key^="message:"]')].reverse();
    const candidate=rows.find(row=>{
      if(!row.dataset.chatKey||baselineKeys.has(row.dataset.chatKey)||row.dataset.hnFastSelectionBound==='1')return false;
      const items=[...row.querySelectorAll('.hn-chat-media-item')];
      return items.length===selection.length&&items.some(item=>item.querySelector('video'));
    });
    if(!candidate)return false;
    binding=true;
    try{
      const items=[...candidate.querySelectorAll('.hn-chat-media-item')];
      const ready=await Promise.all(selection.map(entry=>entry?entry.promise:Promise.resolve(null)));
      let boundAny=false;
      for(let i=0;i<items.length;i++){
        const entry=selection[i],result=ready[i];if(!entry||!result?.blob)continue;
        const video=items[i].querySelector('video');if(!video)continue;
        const remoteUrl=source(video);if(!isRemote(remoteUrl))continue;
        decorateItem(items[i],result.url);
        await storeLocalPoster(remoteUrl,result.blob);
        void uploadServerPoster(remoteUrl,result.blob);
        video.dataset.hnPosterSource=remoteUrl;
        boundAny=true;
      }
      if(!boundAny)return false;
      candidate.dataset.hnFastSelectionBound='1';
      try{window.hnRefreshChatVideoPosters?.(candidate)}catch(_){}
      setTimeout(clearSelection,2500);
      return true;
    }finally{binding=false}
  }

  function scheduleConfirmedBinding(){[40,180,600,1400].forEach(delay=>setTimeout(()=>void bindSelectionToConfirmed(),delay))}

  function syncSendingState(){
    const screen=document.getElementById('hn-chat-screen');if(!screen)return;
    const sending=!!screen.querySelector('.hn-chat-row[data-chat-key="outgoing"]');
    screen.classList.toggle('hn-video-media-sending',sending);
    if(sending){hadOutgoing=true;applySelectionPosters()}
    else if(hadOutgoing){hadOutgoing=false;scheduleConfirmedBinding()}
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
    prepareSelection(files);
    event.preventDefault();event.stopImmediatePropagation();
    queueMicrotask(()=>redispatchFast(input));
  }

  function installStyles(){
    document.getElementById('hn-video-fast-path-style')?.remove();
    const style=document.createElement('style');style.id='hn-video-fast-path-style';
    style.textContent=`
      #hn-chat-screen.hn-video-media-sending .hn-chat-media-pending{display:none!important}
      #hn-chat-screen .hn-chat-pending-item,#hn-chat-screen .hn-chat-row[data-chat-key="outgoing"] .hn-chat-media-item{position:relative!important;overflow:hidden!important}
      #hn-chat-screen .hn-fast-video-poster{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;background:#090909!important;z-index:4!important;pointer-events:none!important}
    `;
    document.head.appendChild(style);
  }

  function install(){
    installStyles();
    document.addEventListener('change',bypassVideoOptimization,{capture:true});
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('.hn-chat-pending-remove');if(!button||!selection.length)return;
      const index=Number(button.dataset.index);if(!Number.isInteger(index)||index<0)return;
      const entry=selection[index];if(entry)revokeEntry(entry);
      selection.splice(index,1);
    },true);
    observer=new MutationObserver(()=>{applySelectionPosters();syncSendingState()});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('hn:session-logout',clearSelection);
    applySelectionPosters();syncSendingState();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
