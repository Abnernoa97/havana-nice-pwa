/* HAVANA NICE — CHAT MEDIA DISPLAY + VIDEO OPTIMIZATION V3 */
(function(){
  'use strict';

  const STYLE_ID='hn-chat-media-fix-v3';
  const MAX_INPUT_BYTES=12*1024*1024;
  const TARGET_W=854;
  const TARGET_H=480;
  const TARGET_FPS=24;
  const VIDEO_BPS=750000;
  const AUDIO_BPS=64000;
  let videoLightbox=null;
  let videoLightboxHistory=false;

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .hn-chat-media-grid{align-items:start!important;}
      .hn-chat-media-grid .hn-chat-media-item{width:min(100%,280px)!important;height:190px!important;min-height:0!important;max-height:190px!important;}
      .hn-chat-media-grid .hn-chat-media-item img,
      .hn-chat-media-grid .hn-chat-media-item video,
      .hn-chat-media-grid .hn-chat-photo-button,
      .hn-chat-media-grid .hn-chat-photo-button img{width:100%!important;height:100%!important;max-width:100%!important;max-height:190px!important;object-fit:cover!important;}
      .hn-chat-media-grid .hn-chat-media-item video{cursor:zoom-in!important;pointer-events:auto!important;}
      .hn-chat-media-grid .hn-chat-media-item video::-webkit-media-controls{display:none!important;}
      .hn-chat-media-grid .hn-chat-media-item video::-webkit-media-controls-panel{display:none!important;}
      .hn-chat-media-grid:has(> .hn-chat-media-item:only-child){width:min(100%,280px)!important;max-width:100%!important;}
      .hn-chat-media-grid:has(> .hn-chat-media-item:only-child) .hn-chat-media-item{width:100%!important;height:190px!important;max-width:100%!important;}
      .hn-chat-bubble:has(.hn-chat-media-grid){max-width:min(88%,300px)!important;padding:4px!important;}
      @media (min-width:600px){
        .hn-chat-media-grid .hn-chat-media-item{width:240px!important;height:180px!important;max-height:180px!important;}
        .hn-chat-media-grid .hn-chat-media-item img,
        .hn-chat-media-grid .hn-chat-media-item video,
        .hn-chat-media-grid .hn-chat-photo-button,
        .hn-chat-media-grid .hn-chat-photo-button img{max-height:180px!important;}
        .hn-chat-bubble:has(.hn-chat-media-grid){max-width:510px!important;}
      }
      .hn-chat-video-lightbox{position:fixed;inset:0;z-index:100002;display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(0,0,0,.96);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}
      .hn-chat-video-lightbox.is-open{display:flex;}
      .hn-chat-video-lightbox video{display:block;width:auto;height:auto;max-width:96vw;max-height:90vh;object-fit:contain;background:#000;box-shadow:0 12px 50px rgba(0,0,0,.65);outline:none;cursor:pointer;}
      .hn-chat-video-lightbox-close{position:absolute;top:max(16px,env(safe-area-inset-top));right:16px;width:46px;height:46px;border:1px solid rgba(229,189,98,.7);border-radius:50%;background:rgba(0,0,0,.46);color:#f3d77c;font-size:28px;line-height:1;display:flex;align-items:center;justify-content:center;z-index:2;}
      .hn-chat-video-lightbox video::-webkit-media-controls{display:none!important;}
      .hn-chat-video-lightbox video::-webkit-media-controls-panel{display:none!important;}
    `;
    document.head.appendChild(style);
  }

  function getVideoDuration(file){
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file),video=document.createElement('video');
      video.preload='metadata';
      video.onloadedmetadata=()=>{const d=Number(video.duration)||0;URL.revokeObjectURL(url);resolve(d);};
      video.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo leer el video.'));};
      video.src=url;
    });
  }

  function supportedMime(){
    if(!window.MediaRecorder)return '';
    return [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm'
    ].find(type=>MediaRecorder.isTypeSupported(type))||'';
  }

  function needsOptimization(file,meta){
    if(!file?.type?.startsWith('video/'))return false;
    if(file.size>MAX_INPUT_BYTES)return true;
    const w=Number(meta?.width)||0,h=Number(meta?.height)||0;
    return Math.max(w,h)>1280 || Math.min(w,h)>720;
  }

  async function readVideoMeta(file){
    const url=URL.createObjectURL(file);
    try{
      const video=document.createElement('video');
      video.preload='metadata';
      video.playsInline=true;
      const meta=await new Promise((resolve,reject)=>{
        video.onloadedmetadata=()=>resolve({duration:Number(video.duration)||0,width:video.videoWidth||0,height:video.videoHeight||0});
        video.onerror=()=>reject(new Error('No se pudo leer el video.'));
        video.src=url;
      });
      return meta;
    }finally{URL.revokeObjectURL(url);}
  }

  function makeOutputName(file,mime){
    const base=(file.name||'video').replace(/\.[^.]+$/,'');
    return `${base}-hn.${mime.includes('mp4')?'mp4':'webm'}`;
  }

  async function optimizeVideo(file,meta){
    if(!needsOptimization(file,meta))return file;
    if(!HTMLCanvasElement.prototype.captureStream||!window.MediaRecorder)return file;
    const mime=supportedMime();
    if(!mime)return file;
    const sourceUrl=URL.createObjectURL(file);
    const video=document.createElement('video');
    video.preload='auto';video.playsInline=true;video.muted=true;video.src=sourceUrl;
    try{
      await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(new Error('No se pudo preparar el video.'));});
      const srcW=video.videoWidth||meta.width||TARGET_W,srcH=video.videoHeight||meta.height||TARGET_H;
      const scale=Math.min(1,TARGET_W/srcW,TARGET_H/srcH);
      const width=Math.max(2,Math.round(srcW*scale/2)*2),height=Math.max(2,Math.round(srcH*scale/2)*2);
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Canvas no disponible.');
      const canvasStream=canvas.captureStream(TARGET_FPS);
      let sourceStream=null;try{sourceStream=typeof video.captureStream==='function'?video.captureStream():null;}catch(_){sourceStream=null;}
      if(sourceStream?.getAudioTracks?.().length)sourceStream.getAudioTracks().forEach(track=>canvasStream.addTrack(track));
      const recorder=new MediaRecorder(canvasStream,{mimeType,videoBitsPerSecond:VIDEO_BPS,audioBitsPerSecond:AUDIO_BPS});
      const chunks=[];let drawHandle=0;
      const draw=()=>{if(video.readyState>=2)ctx.drawImage(video,0,0,width,height);drawHandle=requestAnimationFrame(draw);};
      const result=await new Promise((resolve,reject)=>{
        recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
        recorder.onerror=()=>reject(new Error('No se pudo comprimir el video.'));
        recorder.onstop=()=>{cancelAnimationFrame(drawHandle);const blob=new Blob(chunks,{type:mime});if(!blob.size)reject(new Error('El video comprimido quedó vacío.'));else resolve(blob);};
        video.onended=()=>{try{recorder.stop();}catch(_) {}};
        recorder.start(1000);draw();video.play().catch(reject);
      });
      if(result.size>=file.size*0.92)return file;
      return new File([result],makeOutputName(file,mime),{type:mime,lastModified:Date.now()});
    }catch(error){console.warn('HAVANA NICE video optimization skipped:',error);return file;}
    finally{try{video.pause();}catch(_){ }if(video.src)URL.revokeObjectURL(sourceUrl);}
  }

  function createOptimizingNotice(input,count){
    const id='hn-video-optimizing-notice';document.getElementById(id)?.remove();
    const el=document.createElement('div');el.id=id;el.textContent=`OPTIMIZANDO ${count===1?'VIDEO':'VIDEOS'}…`;
    el.style.cssText='position:fixed;left:50%;bottom:max(22px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:100001;padding:10px 15px;border:1px solid rgba(229,189,98,.55);background:#0b1710;color:#f3d77c;font:500 9px/1.2 Arial,sans-serif;letter-spacing:.16em;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.35);';
    document.body.appendChild(el);input?.setAttribute('data-hn-optimizing','1');return el;
  }

  function dispatchOptimizedChange(input){const synthetic=new Event('change',{bubbles:true});Object.defineProperty(synthetic,'__hnOptimizedChange',{value:true});input.dispatchEvent(synthetic);}

  async function interceptMediaInput(event){
    const input=event.target;if(!(input instanceof HTMLInputElement)||input.type!=='file')return;
    if(!input.classList.contains('hn-chat-media-input'))return;if(event.__hnOptimizedChange)return;
    const files=[...(input.files||[])],videoFiles=files.filter(file=>file.type.startsWith('video/'));if(!videoFiles.length)return;
    event.preventDefault();event.stopImmediatePropagation();
    let metas=[];try{metas=await Promise.all(videoFiles.map(readVideoMeta));}catch(error){console.warn('HAVANA NICE video metadata read failed:',error);dispatchOptimizedChange(input);return;}
    const work=videoFiles.filter((file,i)=>needsOptimization(file,metas[i]));if(!work.length){dispatchOptimizedChange(input);return;}
    const notice=createOptimizingNotice(input,work.length);
    try{
      const optimized=[];
      for(let i=0;i<files.length;i++){const file=files[i];if(!file.type.startsWith('video/')){optimized.push(file);continue;}const meta=await readVideoMeta(file);optimized.push(await optimizeVideo(file,meta));}
      const transfer=new DataTransfer();optimized.forEach(file=>transfer.items.add(file));input.files=transfer.files;dispatchOptimizedChange(input);
    }catch(error){
      console.warn('HAVANA NICE video optimization failed:',error);const transfer=new DataTransfer();files.forEach(file=>transfer.items.add(file));input.files=transfer.files;dispatchOptimizedChange(input);
    }finally{input.removeAttribute('data-hn-optimizing');notice.remove();}
  }

  function closeVideoLightbox(fromPopState=false){
    if(!videoLightbox?.classList.contains('is-open'))return;
    const video=videoLightbox.querySelector('video');try{video?.pause();}catch(_){}
    videoLightbox.classList.remove('is-open');if(video)video.removeAttribute('src');
    if(videoLightboxHistory){videoLightboxHistory=false;if(!fromPopState){try{history.back();}catch(_) {}}}
  }

  function openVideoLightbox(sourceVideo){
    const src=sourceVideo?.currentSrc||sourceVideo?.src;if(!src)return;
    if(!videoLightbox){
      videoLightbox=document.createElement('div');videoLightbox.className='hn-chat-video-lightbox';
      videoLightbox.innerHTML='<button class="hn-chat-video-lightbox-close" type="button" aria-label="Cerrar video">×</button><video playsinline preload="metadata" disablePictureInPicture controlslist="nodownload noplaybackrate nofullscreen noremoteplayback"></video>';
      document.body.appendChild(videoLightbox);
      videoLightbox.addEventListener('click',e=>{if(e.target===videoLightbox)closeVideoLightbox();});
      videoLightbox.querySelector('.hn-chat-video-lightbox-close').addEventListener('click',()=>closeVideoLightbox());
      videoLightbox.querySelector('video').addEventListener('click',e=>{e.stopPropagation();const video=e.currentTarget;if(video.paused)video.play().catch(()=>{});else video.pause();});
    }
    const video=videoLightbox.querySelector('video');video.src=src;video.currentTime=0;video.muted=sourceVideo.muted;video.controls=false;video.playsInline=true;
    videoLightbox.classList.add('is-open');
    if(!videoLightboxHistory){try{history.pushState({...history.state,hnChat:true,hnVideoLightbox:true},'',location.href);videoLightboxHistory=true;}catch(_) {}}
    video.play().catch(()=>{});
  }

  function bindVideoLightbox(){
    document.querySelectorAll('.hn-chat-media-item video').forEach(video=>{
      video.controls=false;video.setAttribute('playsinline','');video.setAttribute('disablePictureInPicture','');video.setAttribute('controlsList','nodownload noplaybackrate nofullscreen noremoteplayback');
      if(video.dataset.hnVideoLightboxBound==='1')return;
      video.dataset.hnVideoLightboxBound='1';
      video.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openVideoLightbox(video);});
    });
  }

  function install(){
    installStyles();bindVideoLightbox();
    if(document.documentElement.dataset.hnVideoOptimizerInstalled==='1')return;
    document.documentElement.dataset.hnVideoOptimizerInstalled='1';
    document.addEventListener('change',event=>{interceptMediaInput(event);},{capture:true});
    const observer=new MutationObserver(()=>bindVideoLightbox());observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('popstate',()=>{if(videoLightboxHistory||videoLightbox?.classList.contains('is-open'))closeVideoLightbox(true);});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
