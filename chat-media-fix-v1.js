/* HAVANA NICE — CHAT MEDIA DISPLAY + PHOTO OPTIMIZATION V9
   Owns chat media sizing and lightweight photo optimization only.
   Video preview/upload is owned by chat-video-fast-path-v1.js and
   chat-video-poster-cache-v1.js. Fullscreen stays in chat-media-lightbox-v2.js.
*/
(function(){
  'use strict';

  const STYLE_ID='hn-chat-media-fix-v7';
  const IMAGE_MAX_EDGE=1280;
  const IMAGE_QUALITY=.78;
  const IMAGE_OPTIMIZE_BYTES=250*1024;

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
    ['hn-chat-media-fix-v4','hn-chat-media-fix-v5','hn-chat-media-fix-v6'].forEach(id=>document.getElementById(id)?.remove());
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
      const mime=blob.type||'image/webp';
      const name=(file.name||'photo').replace(/\.[^.]+$/,'')+'-hn.'+(mime==='image/webp'?'webp':mime==='image/jpeg'?'jpg':'png');
      return new File([blob],name,{type:mime,lastModified:Date.now()});
    }catch(error){
      console.warn('HAVANA NICE photo optimization skipped:',error);
      return file;
    }finally{
      if(loaded?.url)URL.revokeObjectURL(loaded.url);
    }
  }

  function createOptimizingNotice(input,count){
    const id='hn-media-optimizing-notice';document.getElementById(id)?.remove();
    const el=document.createElement('div');
    el.id=id;el.textContent=`PREPARANDO ${count===1?'FOTO':'FOTOS'}…`;
    el.style.cssText='position:fixed;left:50%;bottom:max(22px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:100001;padding:10px 15px;border:1px solid rgba(229,189,98,.55);background:#0b1710;color:#f3d77c;font:500 9px/1.2 Arial,sans-serif;letter-spacing:.16em;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.35);';
    document.body.appendChild(el);input?.setAttribute('data-hn-optimizing','1');return el;
  }

  function dispatchOptimizedChange(input){
    const synthetic=new Event('change',{bubbles:true});
    Object.defineProperty(synthetic,'__hnOptimizedChange',{value:true});
    input.dispatchEvent(synthetic);
  }

  async function interceptPhotoInput(event){
    const input=event.target;
    if(!(input instanceof HTMLInputElement)||input.type!=='file')return;
    if(!input.classList.contains('hn-chat-media-input')||event.__hnOptimizedChange)return;
    const files=[...(input.files||[])];if(!files.length)return;

    // Video selections are owned entirely by the fast video path.
    if(files.some(file=>file.type.startsWith('video/')))return;
    if(!files.every(file=>file.type.startsWith('image/')))return;

    event.preventDefault();event.stopImmediatePropagation();
    const notice=createOptimizingNotice(input,files.length);
    try{
      const optimized=[];
      for(const file of files)optimized.push(await optimizeImage(file));
      if(typeof DataTransfer==='undefined')throw new Error('DataTransfer no disponible');
      const transfer=new DataTransfer();optimized.forEach(file=>transfer.items.add(file));
      input.files=transfer.files;dispatchOptimizedChange(input);
    }catch(error){
      console.warn('HAVANA NICE photo optimization failed:',error);
      dispatchOptimizedChange(input);
    }finally{
      input.removeAttribute('data-hn-optimizing');notice.remove();
    }
  }

  function install(){
    installStyles();
    installBubbleMarker();
    if(document.documentElement.dataset.hnPhotoOptimizerInstalled==='1')return;
    document.documentElement.dataset.hnPhotoOptimizerInstalled='1';
    document.addEventListener('change',interceptPhotoInput,{capture:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
