/* HAVANA NICE — CHAT PHOTO OPTIMIZER V10
   Photo-only preparation layer.
   Video preview, posters, fullscreen and server processing belong to Chat Media V10.
   No DOM observer and no video styling live here.
*/
(function(){
  'use strict';

  if(window.__hnChatPhotoOptimizerV10)return;
  window.__hnChatPhotoOptimizerV10=true;

  const INPUT='.hn-chat-media-input';
  const STYLE_ID='hn-chat-photo-layout-v10';
  const IMAGE_MAX_EDGE=1280;
  const IMAGE_QUALITY=.78;
  const IMAGE_OPTIMIZE_BYTES=250*1024;

  function installLayout(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #hn-chat-screen .hn-chat-bubble:has(.hn-chat-media-grid){width:auto!important;max-width:min(88vw,360px)!important;padding:4px!important}
      #hn-chat-screen .hn-chat-media-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:5px!important;align-items:start!important;width:min(82vw,340px)!important;max-width:100%!important;margin-top:3px!important}
      #hn-chat-screen .hn-chat-media-grid .hn-chat-media-item{position:relative!important;width:100%!important;min-width:0!important;overflow:hidden!important;background:#090909!important}
      #hn-chat-screen .hn-chat-media-grid .hn-chat-media-item:only-child{grid-column:1/-1!important;width:100%!important}
      #hn-chat-screen .hn-chat-media-grid .hn-chat-photo-button{display:block!important;width:100%!important;height:auto!important;padding:0!important;border:0!important;background:transparent!important;line-height:0!important}
      #hn-chat-screen .hn-chat-media-grid .hn-chat-photo-button img{display:block!important;width:100%!important;height:auto!important;max-width:100%!important;max-height:430px!important;object-fit:contain!important;background:#090909!important}
      @media (min-width:600px){
        #hn-chat-screen .hn-chat-bubble:has(.hn-chat-media-grid){max-width:520px!important}
        #hn-chat-screen .hn-chat-media-grid{width:min(72vw,480px)!important}
      }
    `;
    document.head.appendChild(style);
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
      const canvas=document.createElement('canvas');
      canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d',{alpha:true});
      if(!ctx)return file;
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

  function createNotice(input,count){
    const id='hn-media-optimizing-notice';
    document.getElementById(id)?.remove();
    const el=document.createElement('div');
    el.id=id;
    el.textContent=`PREPARANDO ${count===1?'FOTO':'FOTOS'}…`;
    el.style.cssText='position:fixed;left:50%;bottom:max(22px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:100001;padding:10px 15px;border:1px solid rgba(229,189,98,.55);background:#0b1710;color:#f3d77c;font:500 9px/1.2 Arial,sans-serif;letter-spacing:.16em;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.35);';
    document.body.appendChild(el);
    input?.setAttribute('data-hn-optimizing','1');
    return el;
  }

  function dispatchOptimizedChange(input){
    const synthetic=new Event('change',{bubbles:true});
    Object.defineProperty(synthetic,'__hnOptimizedChange',{value:true});
    input.dispatchEvent(synthetic);
  }

  async function interceptPhotoInput(event){
    const input=event.target;
    if(!(input instanceof HTMLInputElement)||!input.matches(INPUT)||event.__hnOptimizedChange)return;
    const files=[...(input.files||[])];
    if(!files.length)return;

    // Any selection containing video goes untouched to Chat Media V10.
    if(files.some(file=>file.type.startsWith('video/')))return;
    if(!files.every(file=>file.type.startsWith('image/')))return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const notice=createNotice(input,files.length);
    try{
      const optimized=[];
      for(const file of files)optimized.push(await optimizeImage(file));
      if(typeof DataTransfer==='undefined')throw new Error('DataTransfer no disponible');
      const transfer=new DataTransfer();
      optimized.forEach(file=>transfer.items.add(file));
      input.files=transfer.files;
      dispatchOptimizedChange(input);
    }catch(error){
      console.warn('HAVANA NICE photo optimization failed:',error);
      dispatchOptimizedChange(input);
    }finally{
      input.removeAttribute('data-hn-optimizing');
      notice.remove();
    }
  }

  function install(){
    installLayout();
    document.addEventListener('change',interceptPhotoInput,{capture:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
