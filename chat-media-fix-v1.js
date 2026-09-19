/* HAVANA NICE — CHAT MEDIA DISPLAY + MEDIA OPTIMIZATION V6
   Owns chat photo/video sizing and client-side media optimization.
   Fullscreen viewing remains owned by chat-media-lightbox-v2.js.
*/
(function(){
  'use strict';

  const STYLE_ID='hn-chat-media-fix-v6';
  const MAX_INPUT_BYTES=12*1024*1024;
  const IMAGE_MAX_EDGE=1600;
  const IMAGE_QUALITY=.82;
  const IMAGE_OPTIMIZE_BYTES=900*1024;
  const TARGET_W=854;
  const TARGET_H=480;
  const TARGET_FPS=24;
  const VIDEO_BPS=750000;
  const AUDIO_BPS=64000;

  function isIOS(){
    const ua=navigator.userAgent||'';
    return /iPad|iPhone|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  }

  function markMediaBubbles(root=document){
    const scope=root&&root.querySelectorAll?root:document;
    scope.querySelectorAll('.hn-chat-media-grid').forEach(grid=>{
      const bubble=grid.closest('.hn-chat-bubble');
      if(bubble)bubble.classList.add('hn-chat-media-bubble');
    });
  }

  function installStyles(){
    document.getElementById('hn-chat-media-fix-v4')?.remove();
    document.getElementById('hn-chat-media-fix-v5')?.remove();
    if(document.getElementById(STYLE_ID))return;
    if(isIOS())document.documentElement.classList.add('hn-chat-media-ios');
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .hn-chat-media-bubble{width:auto!important;max-width:min(88vw,360px)!important;padding:4px!important;}
      .hn-chat-media-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important;align-items:start!important;width:min(82vw,340px)!important;max-width:100%!important;margin-top:3px!important;}
      .hn-chat-media-grid .hn-chat-media-item{position:relative!important;width:100%!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;overflow:hidden!important;background:#090909!important;}
      .hn-chat-media-grid .hn-chat-media-item:only-child{grid-column:1/-1!important;width:100%!important;}
      .hn-chat-media-grid .hn-chat-photo-button{display:block!important;width:100%!important;height:auto!important;padding:0!important;border:0!important;background:transparent!important;line-height:0!important;}
      .hn-chat-media-grid .hn-chat-photo-button img,
      .hn-chat-media-grid .hn-chat-media-item img{display:block!important;width:100%!important;height:auto!important;max-width:100%!important;max-height:430px!important;object-fit:contain!important;background:#090909!important;}
      .hn-chat-media-grid .hn-chat-media-item video{display:block!important;width:100%!important;height:auto!important;aspect-ratio:4/3!important;max-width:100%!important;max-height:320px!important;object-fit:cover!important;background:#000!important;cursor:zoom-in!important;pointer-events:auto!important;}
      .hn-chat-media-grid .hn-chat-media-item video::-webkit-media-controls{display:none!important;}
      .hn-chat-media-grid .hn-chat-media-item video::-webkit-media-controls-panel{display:none!important;}
      .hn-chat-media-ios .hn-chat-media-bubble{width:88%!important;max-width:360px!important;}
      .hn-chat-media-ios .hn-chat-media-grid{width:100%!important;max-width:none!important;}
      @media (min-width:600px){
        .hn-chat-media-bubble{max-width:520px!important;}
        .hn-chat-media-grid{width:min(72vw,480px)!important;}
        .hn-chat-media-ios .hn-chat-media-bubble{width:72%!important;max-width:520px!important;}
        .hn-chat-media-ios .hn-chat-media-grid{width:100%!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function installBubbleMarker(){
    markMediaBubbles();
    if(document.documentElement.dataset.hnChatMediaBubbleMarker==='1')return;
    document.documentElement.dataset.hnChatMediaBubbleMarker='1';
    const observer=new MutationObserver(mutations=>{
      for(const mutation of mutations){
        for(const node of mutation.addedNodes){
          if(!(node instanceof Element))continue;
          if(node.matches?.('.hn-chat-media-grid'))markMediaBubbles(node.parentElement||document);
          else if(node.querySelector?.('.hn-chat-media-grid'))markMediaBubbles(node);
        }
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  function readVideoMeta(file){
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file);
      const video=document.createElement('video');
      video.preload='metadata';
      video.onloadedmetadata=()=>{const meta={duration:Number(video.duration)||0,width:video.videoWidth||0,height:video.videoHeight||0};URL.revokeObjectURL(url);resolve(meta)};
      video.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo leer el video.'))};
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

  function needsVideoOptimization(file,meta){
    if(!file?.type?.startsWith('video/'))return false;
    if(file.size>MAX_INPUT_BYTES)return true;
    const w=Number(meta?.width)||0,h=Number(meta?.height)||0;
    return Math.max(w,h)>1280||Math.min(w,h)>720;
  }

  function makeOutputName(file,mime){
    const base=(file.name||'media').replace(/\.[^.]+$/,'');
    if(mime.startsWith('image/'))return `${base}-hn.webp`;
    return `${base}-hn.${mime.includes('mp4')?'mp4':'webm'}`;
  }

  async function optimizeVideo(file,meta){
    if(!needsVideoOptimization(file,meta))return file;
    if(!HTMLCanvasElement.prototype.captureStream||!window.MediaRecorder)return file;
    const mime=supportedMime();
    if(!mime)return file;
    const sourceUrl=URL.createObjectURL(file);
    const video=document.createElement('video');
    video.preload='auto';video.playsInline=true;video.muted=true;video.src=sourceUrl;
    try{
      await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(new Error('No se pudo preparar el video.'))});
      const srcW=video.videoWidth||meta.width||TARGET_W,srcH=video.videoHeight||meta.height||TARGET_H;
      const scale=Math.min(1,TARGET_W/srcW,TARGET_H/srcH);
      const width=Math.max(2,Math.round(srcW*scale/2)*2),height=Math.max(2,Math.round(srcH*scale/2)*2);
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Canvas no disponible.');
      const canvasStream=canvas.captureStream(TARGET_FPS);
      let sourceStream=null;try{sourceStream=typeof video.captureStream==='function'?video.captureStream():null}catch(_){sourceStream=null}
      if(sourceStream?.getAudioTracks?.().length)sourceStream.getAudioTracks().forEach(track=>canvasStream.addTrack(track));
      const recorder=new MediaRecorder(canvasStream,{mimeType:mime,videoBitsPerSecond:VIDEO_BPS,audioBitsPerSecond:AUDIO_BPS});
      const chunks=[];let drawHandle=0;
      const draw=()=>{if(video.readyState>=2)ctx.drawImage(video,0,0,width,height);drawHandle=requestAnimationFrame(draw)};
      const result=await new Promise((resolve,reject)=>{
        recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
        recorder.onerror=()=>reject(new Error('No se pudo comprimir el video.'));
        recorder.onstop=()=>{cancelAnimationFrame(drawHandle);const blob=new Blob(chunks,{type:mime});if(!blob.size)reject(new Error('El video comprimido quedó vacío.'));else resolve(blob)};
        video.onended=()=>{try{recorder.stop()}catch(_){}};
        recorder.start(1000);draw();video.play().catch(reject);
      });
      if(result.size>=file.size*.92)return file;
      return new File([result],makeOutputName(file,mime),{type:mime,lastModified:Date.now()});
    }catch(error){console.warn('HAVANA NICE video optimization skipped:',error);return file}
    finally{try{video.pause()}catch(_){}URL.revokeObjectURL(sourceUrl)}
  }

  function loadImage(file){
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file),img=new Image();
      img.onload=()=>resolve({img,url});
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo leer la foto.'))};
      img.src=url;
    });
  }

  async function optimizeImage(file){
    if(!file?.type?.startsWith('image/'))return file;
    let loaded=null;
    try{
      loaded=await loadImage(file);
      const img=loaded.img,w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
      if(!w||!h)return file;
      if(file.size<=IMAGE_OPTIMIZE_BYTES&&Math.max(w,h)<=IMAGE_MAX_EDGE)return file;
      const scale=Math.min(1,IMAGE_MAX_EDGE/Math.max(w,h));
      const width=Math.max(1,Math.round(w*scale)),height=Math.max(1,Math.round(h*scale));
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return file;
      ctx.drawImage(img,0,0,width,height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',IMAGE_QUALITY));
      if(!blob?.size||blob.size>=file.size*.95)return file;
      return new File([blob],makeOutputName(file,'image/webp'),{type:'image/webp',lastModified:Date.now()});
    }catch(error){console.warn('HAVANA NICE photo optimization skipped:',error);return file}
    finally{if(loaded?.url)URL.revokeObjectURL(loaded.url)}
  }

  function createOptimizingNotice(input,count){
    const id='hn-media-optimizing-notice';document.getElementById(id)?.remove();
    const el=document.createElement('div');el.id=id;el.textContent=`OPTIMIZANDO ${count===1?'ARCHIVO':'ARCHIVOS'}…`;
    el.style.cssText='position:fixed;left:50%;bottom:max(22px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:100001;padding:10px 15px;border:1px solid rgba(229,189,98,.55);background:#0b1710;color:#f3d77c;font:500 9px/1.2 Arial,sans-serif;letter-spacing:.16em;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.35);';
    document.body.appendChild(el);input?.setAttribute('data-hn-optimizing','1');return el;
  }

  function dispatchOptimizedChange(input){
    const synthetic=new Event('change',{bubbles:true});
    Object.defineProperty(synthetic,'__hnOptimizedChange',{value:true});
    input.dispatchEvent(synthetic);
  }

  async function interceptMediaInput(event){
    const input=event.target;
    if(!(input instanceof HTMLInputElement)||input.type!=='file')return;
    if(!input.classList.contains('hn-chat-media-input')||event.__hnOptimizedChange)return;
    const files=[...(input.files||[])];if(!files.length)return;
    const candidates=files.filter(file=>file.type.startsWith('image/')||file.type.startsWith('video/'));
    if(!candidates.length)return;
    event.preventDefault();event.stopImmediatePropagation();
    const notice=createOptimizingNotice(input,candidates.length);
    try{
      const optimized=[];
      for(const file of files){
        if(file.type.startsWith('image/'))optimized.push(await optimizeImage(file));
        else if(file.type.startsWith('video/'))optimized.push(await optimizeVideo(file,await readVideoMeta(file)));
        else optimized.push(file);
      }
      if(typeof DataTransfer==='undefined')throw new Error('DataTransfer no disponible');
      const transfer=new DataTransfer();optimized.forEach(file=>transfer.items.add(file));input.files=transfer.files;dispatchOptimizedChange(input);
    }catch(error){
      console.warn('HAVANA NICE media optimization failed:',error);
      dispatchOptimizedChange(input);
    }finally{input.removeAttribute('data-hn-optimizing');notice.remove()}
  }

  function install(){
    installStyles();
    installBubbleMarker();
    if(document.documentElement.dataset.hnMediaOptimizerInstalled==='1')return;
    document.documentElement.dataset.hnMediaOptimizerInstalled='1';
    document.addEventListener('change',interceptMediaInput,{capture:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
