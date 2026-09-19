/* HAVANA NICE — CHAT PHOTO OPTIMIZER V11
   Single owner for chat photo sizing + upload optimization.
   - Same layout on iPhone and Android; no Safari shrink-to-fit dependency.
   - Photo optimization happens at the Storage upload boundary, not by rewriting input.files.
   - Video remains fully owned by Chat Media V13.
*/
(function(){
  'use strict';

  if(window.__hnChatPhotoOptimizerV11)return;
  window.__hnChatPhotoOptimizerV11=true;

  const BUCKET='chat-media';
  const STYLE_ID='hn-chat-photo-layout-v11';
  const IMAGE_MAX_EDGE=1280;
  const IMAGE_QUALITY=.76;
  const IMAGE_OPTIMIZE_BYTES=250*1024;
  let patchedPrototype=null;

  const sb=()=>window.hnSupabase||window.hnMusicianSupabase||window.supabaseClient||window.supabase||null;

  function installLayout(){
    document.getElementById('hn-chat-photo-layout-v10')?.remove();
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      /* Give the grid a real width. WebKit must not infer it from fit-content/:has. */
      #hn-chat-screen .hn-chat-media-grid{
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:5px!important;
        align-items:start!important;
        width:min(82vw,340px)!important;
        min-width:min(82vw,340px)!important;
        max-width:min(82vw,340px)!important;
        margin:0!important;
      }
      #hn-chat-screen .hn-chat-media-grid .hn-chat-media-item{
        position:relative!important;
        width:100%!important;
        min-width:0!important;
        height:auto!important;
        overflow:hidden!important;
        background:#090909!important;
      }
      #hn-chat-screen .hn-chat-media-grid .hn-chat-media-item:only-child{
        grid-column:1/-1!important;
        width:100%!important;
      }
      #hn-chat-screen .hn-chat-media-grid .hn-chat-photo-button{
        display:block!important;
        width:100%!important;
        min-width:100%!important;
        height:auto!important;
        padding:0!important;
        border:0!important;
        background:transparent!important;
        line-height:0!important;
      }
      #hn-chat-screen .hn-chat-media-grid .hn-chat-photo-button img,
      #hn-chat-screen .hn-chat-media-grid .hn-chat-media-item>img{
        display:block!important;
        width:100%!important;
        min-width:100%!important;
        height:auto!important;
        max-width:100%!important;
        max-height:430px!important;
        object-fit:contain!important;
        background:#090909!important;
      }
      @media (min-width:600px){
        #hn-chat-screen .hn-chat-media-grid{
          width:min(72vw,480px)!important;
          min-width:min(72vw,480px)!important;
          max-width:min(72vw,480px)!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function loadImage(file){
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file),img=new Image();
      let settled=false;
      const finish=(fn,value)=>{if(settled)return;settled=true;fn(value)};
      img.onload=()=>finish(resolve,{img,url});
      img.onerror=()=>{URL.revokeObjectURL(url);finish(reject,new Error('No se pudo leer la foto.'))};
      img.src=url;
    });
  }

  function canvasBlob(canvas,type,quality){
    return new Promise(resolve=>canvas.toBlob(resolve,type,quality));
  }

  async function optimizeImage(file){
    if(!(file instanceof Blob)||!String(file.type||'').startsWith('image/'))return file;
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
      const ctx=canvas.getContext('2d',{alpha:false});
      if(!ctx)return file;
      ctx.drawImage(img,0,0,width,height);

      let blob=await canvasBlob(canvas,'image/webp',IMAGE_QUALITY);
      if(!blob?.size)blob=await canvasBlob(canvas,'image/jpeg',.80);
      if(!blob?.size||blob.size>=file.size*.95)return file;

      const type=blob.type||'image/jpeg';
      const base=(file.name||'photo').replace(/\.[^.]+$/,'');
      const ext=type==='image/webp'?'webp':'jpg';
      return new File([blob],base+'-hn.'+ext,{type,lastModified:Date.now()});
    }catch(error){
      console.warn('HAVANA NICE photo optimization skipped:',error);
      return file;
    }finally{
      if(loaded?.url)URL.revokeObjectURL(loaded.url);
    }
  }

  function installUploadAdapter(){
    const client=sb(),storage=client?.storage;
    if(!storage)return false;
    try{
      const sample=storage.from(BUCKET),proto=Object.getPrototypeOf(sample);
      if(!proto)return false;
      if(proto.__hnChatPhotoUploadV11){patchedPrototype=proto;return true;}
      const originalUpload=proto.upload;
      if(typeof originalUpload!=='function')return false;

      proto.upload=async function(path,body,options){
        const bucket=String(this?.bucketId||'');
        if(bucket===BUCKET&&body instanceof Blob&&String(body.type||'').startsWith('image/')){
          const prepared=await optimizeImage(body);
          const nextOptions={...(options||{}),contentType:prepared.type||body.type||options?.contentType||'image/jpeg'};
          return originalUpload.call(this,path,prepared,nextOptions);
        }
        return originalUpload.call(this,path,body,options);
      };
      proto.__hnChatPhotoUploadV11=true;
      patchedPrototype=proto;
      return true;
    }catch(error){
      console.warn('HAVANA NICE photo upload optimizer unavailable:',error);
      return false;
    }
  }

  function ensureAdapter(){
    if(installUploadAdapter())return;
    setTimeout(installUploadAdapter,250);
    setTimeout(installUploadAdapter,1000);
  }

  function install(){
    installLayout();
    ensureAdapter();
    window.addEventListener('hn:session-ready',ensureAdapter);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
