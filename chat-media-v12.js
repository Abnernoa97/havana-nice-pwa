/* HAVANA NICE — CHAT MEDIA V12
   iPhone-first media layer.
   - History uses lightweight JPG poster cards only.
   - Full video loads only in fullscreen.
   - Videos larger than 6 MB use Supabase TUS resumable upload through the direct Storage hostname.
   - Upload progress is shown inside the outgoing bubble.
   - No client-side video re-encode and no external FFmpeg worker.
*/
(function(){
  'use strict';
  if(window.__hnChatMediaV12)return;
  window.__hnChatMediaV12=true;

  const INPUT='.hn-chat-media-input';
  const BUCKET='chat-media';
  const STYLE='hn-chat-media-v12-style';
  const VIEWER='hnChatMediaV12';
  const HISTORY='hnChatMediaV12';
  const PROJECT_ID='xzfradccsxonmauinecl';
  const PUBLISHABLE_KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  const TUS_ENDPOINT=`https://${PROJECT_ID}.storage.supabase.co/storage/v1/upload/resumable`;
  const TUS_URL='https://esm.sh/tus-js-client@4.3.1?bundle&target=es2022';
  const LARGE_UPLOAD_BYTES=6*1024*1024;
  const MAX_EDGE=640;
  const POSTER_QUALITY=.76;
  const POSTER_TIMEOUT=9000;

  let selection=[];
  let generation=0;
  let overlay,image,poster,video,spinner,play,errorBox,historyArmed=false,closing=false;
  let tusLibPromise=null;
  let patchedStorage=null;

  const sb=()=>window.hnSupabase||window.hnMusicianSupabase||window.supabaseClient||window.supabase||null;
  const isVideo=file=>!!file?.type?.startsWith('video/');

  function loadTus(){
    if(tusLibPromise)return tusLibPromise;
    tusLibPromise=import(TUS_URL).catch(error=>{
      tusLibPromise=null;
      console.warn('HAVANA NICE TUS unavailable:',error);
      return null;
    });
    return tusLibPromise;
  }

  function setUploadProgress(percent){
    const status=document.querySelector('#hn-chat-screen .hn-chat-row[data-chat-key="outgoing"] .hn-chat-time');
    if(!status)return;
    const value=Math.max(0,Math.min(100,Math.round(Number(percent)||0)));
    status.textContent=value>0?`ENVIANDO ${value}%`:'ENVIANDO…';
  }

  async function tusUpload(api,path,file,options){
    const lib=await loadTus();
    const Upload=lib?.Upload||lib?.default?.Upload;
    if(typeof Upload!=='function')throw new Error('TUS no disponible.');

    const signed=await api.createSignedUploadUrl(path,{upsert:false});
    if(signed?.error)throw signed.error;
    const token=signed?.data?.token;
    if(!token)throw new Error('No se pudo crear el permiso de subida.');

    return new Promise((resolve,reject)=>{
      const upload=new Upload(file,{
        endpoint:TUS_ENDPOINT,
        retryDelays:[0,1000,3000,5000,10000],
        headers:{
          apikey:PUBLISHABLE_KEY,
          'x-signature':token,
          'x-upsert':'false'
        },
        uploadDataDuringCreation:true,
        removeFingerprintOnSuccess:true,
        chunkSize:6*1024*1024,
        metadata:{
          bucketName:BUCKET,
          objectName:path,
          contentType:file.type||options?.contentType||'application/octet-stream',
          cacheControl:String(options?.cacheControl||'31536000')
        },
        onProgress:(uploaded,total)=>{
          const percent=total>0?(uploaded/total)*100:0;
          setUploadProgress(percent);
          window.dispatchEvent(new CustomEvent('hn:chat-media-upload-progress',{detail:{path,uploaded,total,percent}}));
        },
        onError:error=>reject(error),
        onSuccess:()=>{
          setUploadProgress(100);
          resolve({data:{path,fullPath:`${BUCKET}/${path}`},error:null});
        }
      });

      Promise.resolve(upload.findPreviousUploads?.()).then(previous=>{
        if(Array.isArray(previous)&&previous.length){try{upload.resumeFromPreviousUpload(previous[0])}catch(_){}}
        upload.start();
      }).catch(()=>upload.start());
    });
  }

  function posterUrl(videoUrl){
    try{const u=new URL(videoUrl);u.pathname=u.pathname+'.poster.jpg';u.search='';u.hash='';return u.toString()}catch(_){return ''}
  }
  function objectPath(videoUrl){
    try{const u=new URL(videoUrl),marker='/storage/v1/object/public/'+BUCKET+'/',i=u.pathname.indexOf(marker);return i<0?'':decodeURIComponent(u.pathname.slice(i+marker.length))}catch(_){return ''}
  }
  function revoke(entry){
    if(entry?.url){try{URL.revokeObjectURL(entry.url)}catch(_){}entry.url=''}
  }
  function clearSelection(){selection.forEach(revoke);selection=[];generation++}

  function posterFromFile(file,g){
    return new Promise(resolve=>{
      const src=URL.createObjectURL(file),v=document.createElement('video');
      let done=false,timer=null,seeked=false,frame=false;
      const finish=blob=>{
        if(done)return;done=true;clearTimeout(timer);
        try{v.pause()}catch(_){}
        v.onloadedmetadata=v.onloadeddata=v.onseeked=v.onerror=null;
        v.removeAttribute('src');try{v.load()}catch(_){}
        URL.revokeObjectURL(src);
        if(!blob?.size||g!==generation){resolve(null);return}
        resolve({blob,url:URL.createObjectURL(blob)});
      };
      const draw=()=>{
        if(done||v.readyState<2)return;
        const w=Number(v.videoWidth)||0,h=Number(v.videoHeight)||0;if(!w||!h)return;
        const scale=Math.min(1,MAX_EDGE/Math.max(w,h));
        const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));
        const ctx=c.getContext('2d',{alpha:false});if(!ctx){finish(null);return}
        try{ctx.drawImage(v,0,0,c.width,c.height)}catch(_){finish(null);return}
        c.toBlob(finish,'image/jpeg',POSTER_QUALITY);
      };
      const requestFrame=()=>{
        if(done||frame)return;frame=true;
        if(typeof v.requestVideoFrameCallback==='function'){try{v.requestVideoFrameCallback(draw);return}catch(_){}}
        setTimeout(()=>requestAnimationFrame(draw),30);
      };
      const seek=()=>{
        if(done)return;const d=Number(v.duration)||0;
        if(!seeked&&Number.isFinite(d)&&d>.12){seeked=true;try{v.currentTime=Math.min(Math.max(.2,d*.06),Math.max(.01,d-.03));return}catch(_){}}
        requestFrame();
      };
      timer=setTimeout(()=>{if(v.readyState>=2)requestFrame();else finish(null)},POSTER_TIMEOUT);
      v.muted=true;v.defaultMuted=true;v.playsInline=true;v.preload='auto';
      v.onloadedmetadata=()=>{try{const p=v.play();if(p?.then)p.then(()=>setTimeout(()=>{try{v.pause()}catch(_){}seek()},50)).catch(seek);else seek()}catch(_){seek()}};
      v.onloadeddata=()=>{frame=false;seek()};v.onseeked=()=>{frame=false;requestFrame()};v.onerror=()=>finish(null);v.src=src;
      try{v.load()}catch(error){finish(null)}
    });
  }

  function makeEntry(file,g){
    const entry={file,blob:null,url:'',posterPromise:null};
    entry.posterPromise=posterFromFile(file,g).then(result=>{
      if(!result||g!==generation)return null;
      entry.blob=result.blob;entry.url=result.url;paintPending();return entry;
    });
    return entry;
  }
  function prepare(files){
    clearSelection();const g=generation;
    selection=files.map(file=>isVideo(file)?makeEntry(file,g):null);
  }
  function findEntry(file){return selection.find(item=>item?.file===file)||null}
  async function ensurePoster(file){
    if(!isVideo(file))return null;
    let entry=findEntry(file);if(entry)return entry.posterPromise;
    const g=generation;entry=makeEntry(file,g);selection.push(entry);return entry.posterPromise;
  }
  async function persistPoster(file,videoUrl){
    const entry=await ensurePoster(file);if(!entry?.blob?.size)return '';
    const client=sb(),path=objectPath(videoUrl);if(!client||!path)return '';
    try{
      const result=await client.storage.from(BUCKET).upload(path+'.poster.jpg',entry.blob,{contentType:'image/jpeg',cacheControl:'31536000',upsert:false});
      if(result?.error&&!/exist|duplicate|already/i.test(String(result.error.message||'')))throw result.error;
      return posterUrl(videoUrl);
    }catch(err){console.warn('HAVANA NICE poster upload skipped:',err);return ''}
  }

  function paintPending(){
    const screen=document.getElementById('hn-chat-screen');if(!screen)return;
    [screen.querySelector('.hn-chat-media-pending'),screen.querySelector('.hn-chat-row[data-chat-key="outgoing"]')].filter(Boolean).forEach(container=>{
      [...container.querySelectorAll('.hn-chat-pending-item,.hn-chat-media-item')].forEach((item,i)=>{
        const entry=selection[i];if(!entry)return;
        let img=item.querySelector('.hn-v12-local-poster');
        if(!img){img=document.createElement('img');img.className='hn-v12-local-poster';img.alt='Vista previa del video';item.appendChild(img)}
        if(entry.url)img.src=entry.url;else entry.posterPromise?.then(result=>{if(result?.url&&img.isConnected)img.src=result.url});
      });
    });
  }

  function installUploadAdapter(){
    const client=sb(),storage=client?.storage;
    if(!storage||patchedStorage===storage)return;
    if(storage.__hnChatVideoUploadV12){patchedStorage=storage;return}
    try{
      const originalFrom=storage.from.bind(storage);
      storage.from=function(bucket){
        const api=originalFrom(bucket);
        if(bucket!==BUCKET||api.__hnVideoUploadWrappedV12)return api;
        const originalUpload=api.upload.bind(api);
        api.upload=async function(path,body,options){
          if(body instanceof File&&isVideo(body)&&body.size>LARGE_UPLOAD_BYTES){
            try{
              setUploadProgress(0);
              return await tusUpload(api,path,body,options);
            }catch(error){
              console.warn('HAVANA NICE TUS fallback to standard upload:',error);
              setUploadProgress(0);
            }
          }
          return originalUpload(path,body,options);
        };
        api.__hnVideoUploadWrappedV12=true;
        return api;
      };
      storage.__hnChatVideoUploadV12=true;
      patchedStorage=storage;
    }catch(error){console.warn('HAVANA NICE upload adapter unavailable:',error)}
  }

  function ensureViewer(){
    if(overlay)return;
    overlay=document.createElement('div');overlay.id=VIEWER;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
    overlay.innerHTML='<button class="hn-media-v12-close" type="button" aria-label="Cerrar">×</button><img class="hn-media-v12-image" alt=""><img class="hn-media-v12-poster" alt=""><video class="hn-media-v12-video" playsinline controls preload="none"></video><div class="hn-media-v12-spinner"></div><button class="hn-media-v12-play" type="button">▶</button><div class="hn-media-v12-error">NO SE PUDO CARGAR EL VIDEO</div>';
    document.body.appendChild(overlay);
    image=overlay.querySelector('.hn-media-v12-image');poster=overlay.querySelector('.hn-media-v12-poster');video=overlay.querySelector('.hn-media-v12-video');spinner=overlay.querySelector('.hn-media-v12-spinner');play=overlay.querySelector('.hn-media-v12-play');errorBox=overlay.querySelector('.hn-media-v12-error');
    overlay.querySelector('.hn-media-v12-close').addEventListener('click',closeFromUser);
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeFromUser()});
    play.addEventListener('click',e=>{e.stopPropagation();play.hidden=true;spinner.hidden=false;video.play().catch(()=>{play.hidden=false;spinner.hidden=true})});
    video.addEventListener('playing',()=>{overlay.classList.add('is-playing');spinner.hidden=true;play.hidden=true});
    video.addEventListener('waiting',()=>{if(overlay.classList.contains('is-playing'))spinner.hidden=false});
    video.addEventListener('error',()=>{overlay.classList.remove('is-playing');spinner.hidden=true;play.hidden=true;errorBox.hidden=false});
  }
  function resetViewer(){
    if(!overlay)return;overlay.classList.remove('is-playing','is-video','is-image');errorBox.hidden=true;spinner.hidden=true;play.hidden=true;
    image.hidden=true;image.removeAttribute('src');poster.hidden=true;poster.removeAttribute('src');
    try{video.pause()}catch(_){}video.hidden=true;video.removeAttribute('src');video.removeAttribute('poster');try{video.load()}catch(_){}
  }
  function armHistory(){if(historyArmed)return;try{history.pushState({...history.state,[HISTORY]:true},'',location.href);historyArmed=true}catch(_){}}
  function openPhoto(url){if(!url)return;ensureViewer();resetViewer();overlay.classList.add('is-open','is-image');image.hidden=false;image.src=url;armHistory()}
  function openVideo(url,pUrl){
    if(!url)return;ensureViewer();resetViewer();overlay.classList.add('is-open','is-video');
    const preview=pUrl||posterUrl(url);poster.hidden=false;if(preview)poster.src=preview;video.hidden=false;if(preview)video.poster=preview;
    spinner.hidden=false;video.src=url;try{video.load()}catch(_){}armHistory();
    const p=video.play();if(p?.catch)p.catch(()=>{spinner.hidden=true;play.hidden=false});
  }
  function finishClose(){historyArmed=false;overlay?.classList.remove('is-open');resetViewer()}
  function closeFromUser(){if(!overlay?.classList.contains('is-open'))return;if(historyArmed&&!closing){closing=true;try{history.back();return}catch(_){closing=false}}finishClose();closing=false}

  function installStyles(){
    if(document.getElementById(STYLE))return;
    const s=document.createElement('style');s.id=STYLE;s.textContent=`
      #hn-chat-screen .hn-video-card-shell{position:relative!important;overflow:hidden!important;background:#090909!important;aspect-ratio:4/3!important;min-height:120px!important}
      #hn-chat-screen .hn-video-card{position:relative!important;width:100%!important;height:100%!important;min-height:120px!important;padding:0!important;border:0!important;background:#090909!important;display:block!important;overflow:hidden!important;cursor:pointer!important;aspect-ratio:4/3!important}
      #hn-chat-screen .hn-video-card img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;z-index:2!important;opacity:0!important}
      #hn-chat-screen .hn-video-card.has-poster img{opacity:1!important}
      #hn-chat-screen .hn-video-card-fallback{position:absolute!important;inset:0!important;z-index:1!important;display:flex!important;flex-direction:column!important;gap:8px!important;align-items:center!important;justify-content:center!important;background:linear-gradient(145deg,#101613,#070a08)!important;color:rgba(244,241,232,.56)!important}
      #hn-chat-screen .hn-video-card-play-overlay{position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;z-index:3!important;width:48px!important;height:48px!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;background:rgba(0,0,0,.50)!important;border:1px solid rgba(255,255,255,.55)!important;color:#fff!important;font:700 20px/1 Arial,sans-serif!important;padding-left:3px!important;box-sizing:border-box!important}
      #hn-chat-screen .hn-video-card-label{font:500 8px/1 Arial,sans-serif!important;letter-spacing:.18em!important}
      #hn-chat-screen .hn-v12-local-poster{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;z-index:6!important;background:#090909!important}
      #hn-chat-screen:has(.hn-chat-row[data-chat-key="outgoing"]) .hn-chat-media-pending{display:none!important}
      #${VIEWER}{position:fixed;inset:0;z-index:310000;display:none;background:#000;overflow:hidden;touch-action:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);box-sizing:border-box}
      #${VIEWER}.is-open{display:block}#${VIEWER} [hidden]{display:none!important}
      #${VIEWER} .hn-media-v12-image,#${VIEWER} .hn-media-v12-poster,#${VIEWER} .hn-media-v12-video{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:auto;height:auto;max-width:100vw;max-height:100dvh;object-fit:contain;background:#000}
      #${VIEWER} .hn-media-v12-video{z-index:2;opacity:0;transition:opacity .12s linear}#${VIEWER} .hn-media-v12-poster{z-index:3;opacity:1;transition:opacity .12s linear}#${VIEWER}.is-playing .hn-media-v12-video{opacity:1}#${VIEWER}.is-playing .hn-media-v12-poster{opacity:0;pointer-events:none}#${VIEWER} .hn-media-v12-image{z-index:3}
      #${VIEWER} .hn-media-v12-close{position:absolute;top:max(14px,calc(env(safe-area-inset-top) + 8px));right:max(14px,calc(env(safe-area-inset-right) + 8px));z-index:20;width:46px;height:46px;border-radius:50%;border:1px solid rgba(229,189,98,.78);background:rgba(0,0,0,.58);color:#fff1a8;font-size:28px}
      #${VIEWER} .hn-media-v12-spinner{position:absolute;left:50%;top:50%;z-index:10;width:38px;height:38px;margin:-19px;border:3px solid rgba(255,255,255,.20);border-top-color:#fff;border-radius:50%;animation:hnMediaV12Spin .8s linear infinite}
      #${VIEWER} .hn-media-v12-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:11;width:62px;height:62px;border-radius:50%;border:1px solid rgba(255,255,255,.65);background:rgba(0,0,0,.55);color:#fff;font-size:25px;padding-left:5px}
      #${VIEWER} .hn-media-v12-error{position:absolute;left:50%;bottom:max(42px,calc(env(safe-area-inset-bottom) + 28px));transform:translateX(-50%);z-index:12;color:#fff;font:500 10px/1.3 Arial,sans-serif;letter-spacing:.12em;white-space:nowrap}@keyframes hnMediaV12Spin{to{transform:rotate(360deg)}}
    `;document.head.appendChild(s);
  }

  function handleChange(e){
    const input=e.target;if(!(input instanceof HTMLInputElement)||!input.matches(INPUT))return;
    const files=[...(input.files||[])];if(!files.length){clearSelection();return}
    if(files.some(isVideo))prepare(files);else clearSelection();
  }
  function handleClick(e){
    const remove=e.target.closest?.('.hn-chat-pending-remove');
    if(remove&&selection.length){const i=Number(remove.dataset.index);if(Number.isInteger(i)&&i>=0){revoke(selection[i]);selection.splice(i,1)}return}
    const videoButton=e.target.closest?.('.hn-video-card');
    if(videoButton){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openVideo(videoButton.dataset.videoUrl,videoButton.dataset.posterUrl);return}
    const photo=e.target.closest?.('.hn-chat-photo-button');
    if(photo){const img=photo.querySelector('img'),src=img?.currentSrc||img?.src||photo.dataset.photoUrl;if(src){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openPhoto(src)}}
  }
  function handleImageEvent(e){
    const img=e.target;if(!(img instanceof HTMLImageElement)||!img.closest?.('.hn-video-card'))return;
    const button=img.closest('.hn-video-card');if(e.type==='load')button.classList.add('has-poster');else{button.classList.remove('has-poster');img.remove()}
  }

  function install(){
    installStyles();ensureViewer();installUploadAdapter();
    document.addEventListener('change',handleChange,true);
    document.addEventListener('click',handleClick,true);
    document.addEventListener('load',handleImageEvent,true);
    document.addEventListener('error',handleImageEvent,true);
    window.addEventListener('hn:session-ready',()=>{installUploadAdapter();setTimeout(installUploadAdapter,250)});
    window.addEventListener('hn:session-logout',clearSelection);
    window.addEventListener('popstate',e=>{if(!overlay?.classList.contains('is-open'))return;if(historyArmed||e.state?.[HISTORY]||closing){e.stopImmediatePropagation();finishClose();closing=false}},true);
    window.hnChatMediaV10={prepare,ensurePoster,persistPoster,posterUrl,paintPending,clearSelection,openPhoto,openVideo};
    [250,900,2200].forEach(delay=>setTimeout(installUploadAdapter,delay));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
