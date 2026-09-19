/* HAVANA NICE — CHAT MEDIA V10
   Single media layer for iPhone-first chat video UX.
   - Chat history never needs to decode full videos: confirmed <video> nodes are replaced by poster cards.
   - New video posters are generated once from the local file and persisted beside the uploaded video.
   - Fullscreen opens on the poster immediately and keeps it visible until the video is actually playing.
   - Photos and videos share one fullscreen viewer.
*/
(function(){
  'use strict';
  if(window.__hnChatMediaV10)return;
  window.__hnChatMediaV10=true;

  const INPUT='.hn-chat-media-input';
  const MEDIA_BUCKET='chat-media';
  const STYLE_ID='hn-chat-media-v10-style';
  const VIEWER_ID='hnChatMediaV10';
  const HISTORY_KEY='hnChatMediaV10';
  const MAX_EDGE=640;
  const JPEG_QUALITY=.76;
  const POSTER_TIMEOUT=9000;
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

  let selection=[];
  let generation=0;
  let baselineKeys=new Set();
  let sendArmed=false;
  let binding=false;
  let observer=null;
  let overlay=null,viewerImage=null,viewerPoster=null,viewerVideo=null,viewerSpinner=null,viewerPlay=null,viewerError=null;
  let historyArmed=false,closingHistory=false;

  const client=()=>window.hnSupabase||window.hnMusicianSupabase||window.supabaseClient||window.supabase||null;
  const isVideo=file=>!!file?.type?.startsWith('video/');
  const currentKeys=()=>new Set([...document.querySelectorAll('#hn-chat-screen .hn-chat-row.mine[data-chat-key^="message:"]')].map(row=>row.dataset.chatKey).filter(Boolean));
  const sourceOf=video=>String(video?.getAttribute('src')||video?.currentSrc||video?.src||'').trim();
  const isRemote=url=>/^https:\/\//i.test(String(url||''));

  function posterUrl(videoUrl){
    try{const u=new URL(videoUrl);u.pathname=u.pathname+'.poster.jpg';u.search='';u.hash='';return u.toString()}catch(_){return ''}
  }
  function objectPath(videoUrl){
    try{
      const u=new URL(videoUrl),marker='/storage/v1/object/public/'+MEDIA_BUCKET+'/';
      const i=u.pathname.indexOf(marker);if(i<0)return '';
      return decodeURIComponent(u.pathname.slice(i+marker.length));
    }catch(_){return ''}
  }

  function revokeEntry(entry){if(entry?.url){try{URL.revokeObjectURL(entry.url)}catch(_){}entry.url=''}}
  function clearSelection(){selection.forEach(revokeEntry);selection=[];baselineKeys=new Set();sendArmed=false;generation++}

  function posterFromFile(file,expectedGeneration){
    return new Promise(resolve=>{
      const src=URL.createObjectURL(file),video=document.createElement('video');
      let done=false,timer=null,seeked=false,framePending=false;
      const finish=blob=>{
        if(done)return;done=true;clearTimeout(timer);
        try{video.pause()}catch(_){}
        video.onloadedmetadata=video.onloadeddata=video.onseeked=video.onerror=null;
        video.removeAttribute('src');try{video.load()}catch(_){}URL.revokeObjectURL(src);
        if(!blob?.size||expectedGeneration!==generation){resolve(null);return}
        resolve({blob,url:URL.createObjectURL(blob)});
      };
      const draw=()=>{
        if(done||video.readyState<2)return;
        const w=Number(video.videoWidth)||0,h=Number(video.videoHeight)||0;if(!w||!h)return;
        const scale=Math.min(1,MAX_EDGE/Math.max(w,h));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
        const ctx=canvas.getContext('2d',{alpha:false});if(!ctx){finish(null);return}
        try{ctx.drawImage(video,0,0,canvas.width,canvas.height)}catch(_){finish(null);return}
        canvas.toBlob(finish,'image/jpeg',JPEG_QUALITY);
      };
      const requestFrame=()=>{
        if(done||framePending)return;framePending=true;
        if(typeof video.requestVideoFrameCallback==='function'){
          try{video.requestVideoFrameCallback(()=>draw());return}catch(_){}
        }
        setTimeout(()=>requestAnimationFrame(draw),30);
      };
      const seek=()=>{
        if(done)return;
        const duration=Number(video.duration)||0;
        if(!seeked&&Number.isFinite(duration)&&duration>.12){
          seeked=true;
          try{video.currentTime=Math.min(Math.max(.2,duration*.06),Math.max(.01,duration-.03));return}catch(_){}
        }
        requestFrame();
      };
      timer=setTimeout(()=>{if(video.readyState>=2)requestFrame();else finish(null)},POSTER_TIMEOUT);
      video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='auto';
      video.onloadedmetadata=()=>{
        try{
          const p=video.play();
          if(p?.then)p.then(()=>setTimeout(()=>{try{video.pause()}catch(_){}seek()},50)).catch(seek);
          else seek();
        }catch(_){seek()}
      };
      video.onloadeddata=()=>{framePending=false;seek()};
      video.onseeked=()=>{framePending=false;requestFrame()};
      video.onerror=()=>finish(null);
      video.src=src;try{video.load()}catch(_){finish(null)}
    });
  }

  function prepare(files){
    clearSelection();
    baselineKeys=currentKeys();
    const g=generation;
    selection=files.map(file=>{
      if(!isVideo(file))return null;
      const entry={file,blob:null,url:'',promise:null};
      entry.promise=posterFromFile(file,g).then(result=>{
        if(!result||g!==generation)return null;
        entry.blob=result.blob;entry.url=result.url;paintPending();return entry;
      });
      return entry;
    });
  }

  function makePlaceholder(item){
    item.classList.add('hn-video-card-shell');
    item.querySelector('.hn-video-card-placeholder')?.remove();
    const placeholder=document.createElement('div');placeholder.className='hn-video-card-placeholder';placeholder.innerHTML='<span class="hn-video-card-play">▶</span><span class="hn-video-card-label">VIDEO</span>';
    item.appendChild(placeholder);return placeholder;
  }

  function makeCard(item,videoUrl,poster,localPoster){
    if(!item||!videoUrl)return null;
    item.classList.add('hn-video-card-shell');
    item.replaceChildren();
    const button=document.createElement('button');button.type='button';button.className='hn-video-card';button.dataset.videoUrl=videoUrl;button.dataset.posterUrl=poster||'';button.setAttribute('aria-label','Reproducir video');
    const img=document.createElement('img');img.alt='Vista previa del video';img.decoding='async';img.loading='lazy';
    const placeholder=document.createElement('span');placeholder.className='hn-video-card-fallback';placeholder.innerHTML='<span class="hn-video-card-play">▶</span><span class="hn-video-card-label">VIDEO</span>';
    const play=document.createElement('span');play.className='hn-video-card-play-overlay';play.textContent='▶';
    button.append(img,placeholder,play);item.appendChild(button);
    const src=localPoster||poster||'';
    if(src){
      img.addEventListener('load',()=>button.classList.add('has-poster'),{once:true});
      img.addEventListener('error',()=>{img.removeAttribute('src');button.classList.remove('has-poster')},{once:true});
      img.src=src;
    }
    return button;
  }

  function paintPending(){
    const screen=document.getElementById('hn-chat-screen');if(!screen)return;
    const containers=[screen.querySelector('.hn-chat-media-pending'),screen.querySelector('.hn-chat-row[data-chat-key="outgoing"]')].filter(Boolean);
    for(const container of containers){
      const items=[...container.querySelectorAll('.hn-chat-pending-item,.hn-chat-media-item')];
      items.forEach((item,index)=>{
        const entry=selection[index];if(!entry)return;
        const video=item.querySelector('video');if(video){video.preload='none';video.muted=true}
        if(entry.url){
          let img=item.querySelector('.hn-v10-local-poster');
          if(!img){img=document.createElement('img');img.className='hn-v10-local-poster';img.alt='Vista previa del video';item.appendChild(img)}
          img.src=entry.url;
        }else if(!item.querySelector('.hn-video-card-placeholder'))makePlaceholder(item);
      });
    }
  }

  async function uploadPoster(videoUrl,blob){
    const sb=client(),path=objectPath(videoUrl);if(!sb||!path||!blob?.size)return false;
    try{
      const result=await sb.storage.from(MEDIA_BUCKET).upload(path+'.poster.jpg',blob,{contentType:'image/jpeg',cacheControl:'31536000',upsert:false});
      if(result?.error&&!/exist|duplicate|already/i.test(String(result.error.message||'')))throw result.error;
      return true;
    }catch(error){console.warn('HAVANA NICE Media V10 poster upload:',error);return false}
  }

  function isCandidateRow(row){
    if(!row?.matches?.('#hn-chat-screen .hn-chat-row.mine[data-chat-key^="message:"]'))return false;
    if(baselineKeys.has(row.dataset.chatKey)||row.dataset.hnMediaV10Bound==='1')return false;
    const items=[...row.querySelectorAll('.hn-chat-media-item')];
    return !!items.length&&items.length===selection.length&&selection.some(Boolean);
  }

  async function bindConfirmed(row){
    if(binding||!isCandidateRow(row))return false;
    binding=true;row.dataset.hnMediaV10Bound='1';
    try{
      const items=[...row.querySelectorAll('.hn-chat-media-item')];
      const ready=await Promise.all(selection.map(entry=>entry?entry.promise:Promise.resolve(null)));
      for(let i=0;i<items.length;i++){
        const entry=selection[i];if(!entry)continue;
        const video=items[i].querySelector('video');if(!video)continue;
        const videoUrl=sourceOf(video);if(!isRemote(videoUrl))continue;
        const result=ready[i];
        makeCard(items[i],videoUrl,posterUrl(videoUrl),result?.url||'');
        if(result?.blob)void uploadPoster(videoUrl,result.blob);
      }
      setTimeout(clearSelection,4000);
      return true;
    }finally{binding=false}
  }

  function convertConfirmed(root=document){
    const scope=root?.querySelectorAll?root:document;
    const rows=[];
    if(root instanceof Element&&root.matches?.('#hn-chat-screen .hn-chat-row[data-chat-key^="message:"]'))rows.push(root);
    scope.querySelectorAll?.('#hn-chat-screen .hn-chat-row[data-chat-key^="message:"]').forEach(row=>rows.push(row));
    [...new Set(rows)].forEach(row=>{
      if(isCandidateRow(row)){void bindConfirmed(row);return}
      row.querySelectorAll('.hn-chat-media-item video').forEach(video=>{
        const item=video.closest('.hn-chat-media-item');if(!item||item.querySelector('.hn-video-card'))return;
        const url=sourceOf(video);if(!isRemote(url))return;
        makeCard(item,url,posterUrl(url),'');
      });
    });
  }

  function ensureViewer(){
    if(overlay)return;
    const node=document.createElement('div');node.id=VIEWER_ID;node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-label','Contenido multimedia');
    node.innerHTML='<button class="hn-media-v10-close" type="button" aria-label="Cerrar">×</button><img class="hn-media-v10-image" alt=""><img class="hn-media-v10-poster" alt="Vista previa"><video class="hn-media-v10-video" playsinline controls preload="none"></video><div class="hn-media-v10-spinner" aria-hidden="true"></div><button class="hn-media-v10-play" type="button">▶</button><div class="hn-media-v10-error">NO SE PUDO CARGAR EL VIDEO</div>';
    document.body.appendChild(node);overlay=node;viewerImage=node.querySelector('.hn-media-v10-image');viewerPoster=node.querySelector('.hn-media-v10-poster');viewerVideo=node.querySelector('.hn-media-v10-video');viewerSpinner=node.querySelector('.hn-media-v10-spinner');viewerPlay=node.querySelector('.hn-media-v10-play');viewerError=node.querySelector('.hn-media-v10-error');
    node.querySelector('.hn-media-v10-close').addEventListener('click',closeViewerFromUser);
    node.addEventListener('click',e=>{if(e.target===node)closeViewerFromUser()});
    viewerPlay.addEventListener('click',e=>{e.stopPropagation();viewerPlay.hidden=true;viewerSpinner.hidden=false;viewerVideo.play().catch(()=>{viewerPlay.hidden=false;viewerSpinner.hidden=true})});
    viewerVideo.addEventListener('playing',()=>{overlay.classList.add('is-playing');viewerSpinner.hidden=true;viewerPlay.hidden=true});
    viewerVideo.addEventListener('waiting',()=>{if(overlay.classList.contains('is-playing'))viewerSpinner.hidden=false});
    viewerVideo.addEventListener('canplay',()=>{if(!viewerVideo.paused)viewerSpinner.hidden=false});
    viewerVideo.addEventListener('error',()=>{overlay.classList.remove('is-playing');viewerSpinner.hidden=true;viewerPlay.hidden=true;viewerError.hidden=false});
  }

  function resetViewer(){
    if(!overlay)return;
    overlay.classList.remove('is-playing','is-video','is-image');viewerError.hidden=true;viewerSpinner.hidden=true;viewerPlay.hidden=true;
    viewerImage.hidden=true;viewerImage.removeAttribute('src');viewerPoster.hidden=true;viewerPoster.removeAttribute('src');
    try{viewerVideo.pause()}catch(_){}viewerVideo.hidden=true;viewerVideo.removeAttribute('src');viewerVideo.removeAttribute('poster');try{viewerVideo.load()}catch(_){}
  }

  function armHistory(){if(historyArmed)return;try{history.pushState({...history.state,[HISTORY_KEY]:true},'',location.href);historyArmed=true}catch(_){}}
  function openPhoto(url){
    if(!url)return;ensureViewer();resetViewer();overlay.classList.add('is-open','is-image');viewerImage.hidden=false;viewerImage.src=url;armHistory();
  }
  function openVideo(videoUrl,poster){
    if(!videoUrl)return;ensureViewer();resetViewer();overlay.classList.add('is-open','is-video');viewerPoster.hidden=false;viewerPoster.src=poster||posterUrl(videoUrl);viewerVideo.hidden=false;viewerVideo.poster=poster||posterUrl(videoUrl);viewerSpinner.hidden=false;viewerVideo.src=videoUrl;try{viewerVideo.load()}catch(_){}armHistory();
    const p=viewerVideo.play();if(p?.catch)p.catch(()=>{viewerSpinner.hidden=true;viewerPlay.hidden=false});
  }
  function finishClose(){historyArmed=false;overlay?.classList.remove('is-open');resetViewer()}
  function closeViewerFromUser(){
    if(!overlay?.classList.contains('is-open'))return;
    if(historyArmed&&!closingHistory){closingHistory=true;try{history.back();return}catch(_){closingHistory=false}}
    finishClose();closingHistory=false;
  }

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
      #hn-chat-screen .hn-chat-media-item>video{visibility:hidden!important;position:absolute!important;inset:0!important;pointer-events:none!important}
      #hn-chat-screen .hn-video-card-shell{position:relative!important;overflow:hidden!important;background:#090909!important;aspect-ratio:4/3!important;min-height:120px!important}
      #hn-chat-screen .hn-video-card{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;padding:0!important;border:0!important;background:#090909!important;display:block!important;overflow:hidden!important;cursor:pointer!important}
      #hn-chat-screen .hn-video-card img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;opacity:0!important}
      #hn-chat-screen .hn-video-card.has-poster img{opacity:1!important}
      #hn-chat-screen .hn-video-card-fallback,#hn-chat-screen .hn-video-card-placeholder{position:absolute!important;inset:0!important;display:flex!important;flex-direction:column!important;gap:8px!important;align-items:center!important;justify-content:center!important;background:linear-gradient(145deg,#101613,#070a08)!important;color:rgba(244,241,232,.56)!important}
      #hn-chat-screen .hn-video-card.has-poster .hn-video-card-fallback{display:none!important}
      #hn-chat-screen .hn-video-card-play,#hn-chat-screen .hn-video-card-play-overlay{width:48px!important;height:48px!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;background:rgba(0,0,0,.50)!important;border:1px solid rgba(255,255,255,.55)!important;color:#fff!important;font:700 20px/1 Arial,sans-serif!important;padding-left:3px!important;box-sizing:border-box!important}
      #hn-chat-screen .hn-video-card-play-overlay{position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;z-index:3!important}
      #hn-chat-screen .hn-video-card-label{font:500 8px/1 Arial,sans-serif!important;letter-spacing:.18em!important}
      #hn-chat-screen .hn-v10-local-poster{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;z-index:6!important;background:#090909!important}
      #${VIEWER_ID}{position:fixed;inset:0;z-index:310000;display:none;background:#000;overflow:hidden;touch-action:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);box-sizing:border-box}
      #${VIEWER_ID}.is-open{display:block}
      #${VIEWER_ID} .hn-media-v10-image,#${VIEWER_ID} .hn-media-v10-poster,#${VIEWER_ID} .hn-media-v10-video{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:auto;height:auto;max-width:100vw;max-height:100dvh;object-fit:contain;background:#000}
      #${VIEWER_ID} .hn-media-v10-video{z-index:2;opacity:0;transition:opacity .12s linear}
      #${VIEWER_ID} .hn-media-v10-poster{z-index:3;opacity:1;transition:opacity .12s linear}
      #${VIEWER_ID}.is-playing .hn-media-v10-video{opacity:1}
      #${VIEWER_ID}.is-playing .hn-media-v10-poster{opacity:0;pointer-events:none}
      #${VIEWER_ID} .hn-media-v10-image{z-index:3}
      #${VIEWER_ID} [hidden]{display:none!important}
      #${VIEWER_ID} .hn-media-v10-close{position:absolute;top:max(14px,calc(env(safe-area-inset-top) + 8px));right:max(14px,calc(env(safe-area-inset-right) + 8px));z-index:20;width:46px;height:46px;border-radius:50%;border:1px solid rgba(229,189,98,.78);background:rgba(0,0,0,.58);color:#fff1a8;font-size:28px}
      #${VIEWER_ID} .hn-media-v10-spinner{position:absolute;left:50%;top:50%;z-index:10;width:38px;height:38px;margin:-19px;border:3px solid rgba(255,255,255,.20);border-top-color:#fff;border-radius:50%;animation:hnMediaV10Spin .8s linear infinite}
      #${VIEWER_ID} .hn-media-v10-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:11;width:62px;height:62px;border-radius:50%;border:1px solid rgba(255,255,255,.65);background:rgba(0,0,0,.55);color:#fff;font-size:25px;padding-left:5px}
      #${VIEWER_ID} .hn-media-v10-error{position:absolute;left:50%;bottom:max(42px,calc(env(safe-area-inset-bottom) + 28px));transform:translateX(-50%);z-index:12;color:#fff;font:500 10px/1.3 Arial,sans-serif;letter-spacing:.12em;white-space:nowrap}
      @keyframes hnMediaV10Spin{to{transform:rotate(360deg)}}
    `;document.head.appendChild(style);
  }

  function handleChange(event){
    const input=event.target;if(!(input instanceof HTMLInputElement)||!input.matches(INPUT))return;
    const files=[...(input.files||[])];if(!files.length){clearSelection();return}
    if(files.some(isVideo))prepare(files);else clearSelection();
  }
  function handleSubmit(event){
    if(!event.target?.matches?.('.hn-chat-compose')||!selection.some(Boolean))return;
    baselineKeys=currentKeys();sendArmed=true;paintPending();
  }
  function handleClick(event){
    const remove=event.target.closest?.('.hn-chat-pending-remove');
    if(remove&&selection.length){const i=Number(remove.dataset.index);if(Number.isInteger(i)&&i>=0){revokeEntry(selection[i]);selection.splice(i,1)}return}
    const videoButton=event.target.closest?.('.hn-video-card');
    if(videoButton){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();openVideo(videoButton.dataset.videoUrl,videoButton.dataset.posterUrl);return}
    const photoButton=event.target.closest?.('.hn-chat-photo-button');
    if(photoButton){const img=photoButton.querySelector('img');const src=img?.currentSrc||img?.src||photoButton.dataset.photoUrl;if(src){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();openPhoto(src)}}
  }

  function scan(root=document){
    paintPending();
    if(sendArmed){
      const candidates=[...document.querySelectorAll('#hn-chat-screen .hn-chat-row.mine[data-chat-key^="message:"]')].reverse();
      const row=candidates.find(isCandidateRow);if(row)void bindConfirmed(row);
    }
    convertConfirmed(root);
  }

  function install(){
    installStyles();ensureViewer();
    document.addEventListener('change',handleChange,true);
    document.addEventListener('submit',handleSubmit,true);
    document.addEventListener('click',handleClick,true);
    observer=new MutationObserver(mutations=>{for(const mutation of mutations)for(const node of mutation.addedNodes)if(node instanceof Element)scan(node.parentElement||node)});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('hn:session-ready',()=>setTimeout(()=>scan(document),60));
    window.addEventListener('hn:session-logout',clearSelection);
    window.addEventListener('popstate',e=>{
      if(!overlay?.classList.contains('is-open'))return;
      if(historyArmed||e.state?.[HISTORY_KEY]||closingHistory){e.stopImmediatePropagation();finishClose();closingHistory=false}
    },true);
    scan(document);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
