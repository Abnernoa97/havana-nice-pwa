/* HAVANA NICE — CHAT SETTINGS BRIDGE V3 */
(() => {
  'use strict';
  if (window.__hnChatThemeV3) return;
  window.__hnChatThemeV3 = true;

  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const KEY='sb_publishable_Ip5rGK0UVIfXOfjs_RQ_LhA_c14foHN9';
  const RPC_URL=`${SUPABASE_URL}/rest/v1/rpc/get_chat_settings`;
  const AUDIO_BUCKET='chat-audio';
  const MEDIA_BUCKET='chat-media';
  const MEDIA_IMAGE_MAX=1280;
  const MEDIA_IMAGE_QUALITY=.62;
  const MEDIA_VIDEO_MAX=720;
  const MEDIA_VIDEO_FPS=20;
  const MEDIA_VIDEO_BPS=900000;
  const MEDIA_AUDIO_BPS=64000;
  let settings=null, sb=null, channel=null;
  let voiceRecorder=null, voiceStream=null, voiceChunks=[], voiceMime='', voiceStartedAt=0, voiceElapsed=0, voiceTimer=null, voiceStarting=false, voiceSending=false;
  let mediaCompressionInstalled=false;

  const validColor=v=>/^#[0-9a-fA-F]{6}$/.test(v||'');

  function chatEls(){
    const screen=document.getElementById('hn-chat-screen');
    return screen?{screen,mic:screen.querySelector('.hn-chat-mic'),send:screen.querySelector('.hn-chat-send'),attach:screen.querySelector('.hn-chat-attach'),input:screen.querySelector('.hn-chat-input'),recording:screen.querySelector('.hn-chat-recording'),status:screen.querySelector('.hn-chat-recording-status'),time:screen.querySelector('.hn-chat-recording-time')}:null;
  }

  function syncChatBackground(){
    const screen=document.getElementById('hn-chat-screen');
    const video=document.getElementById('backgroundVideo');
    if(!screen)return;
    const active=screen.classList.contains('is-active');
    if(active){
      if(video&&!video.paused){video.pause();video.dataset.hnChatPaused='1';}
    }else{
      if(voiceRecorder&&voiceRecorder.state!=='inactive')cancelVoice();
      if(video&&video.dataset.hnChatPaused==='1'){delete video.dataset.hnChatPaused;video.play().catch(()=>{});}
    }
  }

  function wireChatBackground(){
    const screen=document.getElementById('hn-chat-screen');
    if(!screen||screen.dataset.hnChatBgBound==='1')return;
    screen.dataset.hnChatBgBound='1';
    const observer=new MutationObserver(syncChatBackground);
    observer.observe(screen,{attributes:true,attributeFilter:['class']});
    syncChatBackground();
  }

  function pickVoiceMime(){
    if(!window.MediaRecorder)return '';
    return ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t))||'';
  }

  function stopVoiceStream(){
    if(voiceStream){voiceStream.getTracks().forEach(t=>{try{t.stop();}catch(_){}});voiceStream=null;}
  }

  function stopVoiceTimer(){
    if(voiceTimer)clearInterval(voiceTimer);
    voiceTimer=null;
  }

  function voiceSeconds(){
    return voiceElapsed+(voiceRecorder?.state==='recording'?Math.max(0,(Date.now()-voiceStartedAt)/1000):0);
  }

  function updateVoiceTimer(){
    const els=chatEls();
    if(els?.time)els.time.textContent=new Intl.DateTimeFormat('es-MX',{minute:'2-digit',second:'2-digit'}).format(new Date(0,0,0,0,0,Math.floor(voiceSeconds())));
  }

  function setVoiceUI(mode){
    const els=chatEls();if(!els)return;
    const recording=mode==='recording', paused=mode==='paused', sending=mode==='sending';
    els.mic?.classList.toggle('is-recording',recording);
    els.mic?.classList.toggle('is-paused',paused);
    if(sending){
      els.mic?.setAttribute('disabled','disabled');
      els.mic?.setAttribute('aria-label','Enviando audio');
      els.mic?.setAttribute('title','Enviando audio');
    }else{
      els.mic?.removeAttribute('disabled');
      els.mic?.setAttribute('aria-label',recording?'Pausar grabación':paused?'Reanudar grabación':'Grabar audio');
      els.mic?.setAttribute('title',recording?'Pausar grabación':paused?'Reanudar grabación':'Grabar audio');
    }
    if(els.recording)els.recording.classList.toggle('is-visible',recording||paused||sending);
    if(els.status)els.status.textContent=paused?'PAUSADO':sending?'ENVIANDO...':'GRABANDO';
    if(els.send){els.send.textContent='ENVIAR';els.send.disabled=recording||sending||(!paused&&voiceRecorder==null);}
    if(els.attach)els.attach.disabled=recording||paused||sending;
    if(els.input)els.input.disabled=recording||paused||sending;
    updateVoiceTimer();
  }

  function resetVoiceUI(){
    stopVoiceTimer();
    const els=chatEls();
    if(els){
      els.mic?.classList.remove('is-recording','is-paused');
      els.mic?.removeAttribute('disabled');
      els.mic?.setAttribute('aria-label','Grabar audio');
      els.mic?.setAttribute('title','Grabar audio');
      els.send&&(els.send.textContent='ENVIAR');
      els.attach?.removeAttribute('disabled');
      els.input?.removeAttribute('disabled');
      els.recording?.classList.remove('is-visible','is-pending');
      if(els.time)els.time.textContent='00:00';
    }
  }

  function cancelVoice(){
    stopVoiceTimer();
    try{if(voiceRecorder&&voiceRecorder.state!=='inactive')voiceRecorder.stop();}catch(_){ }
    stopVoiceStream();
    voiceRecorder=null;voiceChunks=[];voiceMime='';voiceStartedAt=0;voiceElapsed=0;voiceStarting=false;voiceSending=false;
    resetVoiceUI();
  }

  async function startVoice(){
    if(voiceStarting||voiceSending)return;
    const els=chatEls();if(!els)return;
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)return;
    voiceStarting=true;
    try{
      voiceStream=await navigator.mediaDevices.getUserMedia({audio:true});
      voiceMime=pickVoiceMime();
      voiceChunks=[];voiceElapsed=0;voiceStartedAt=Date.now();
      voiceRecorder=voiceMime?new MediaRecorder(voiceStream,{mimeType:voiceMime}):new MediaRecorder(voiceStream);
      const recorder=voiceRecorder;
      recorder.ondataavailable=e=>{if(e.data?.size)voiceChunks.push(e.data)};
      recorder.onerror=()=>{cancelVoice();alert('No se pudo grabar el audio.');};
      recorder.onstart=()=>{voiceStarting=false;setVoiceUI('recording');stopVoiceTimer();voiceTimer=setInterval(updateVoiceTimer,250);};
      recorder.onpause=()=>{if(voiceStartedAt){voiceElapsed+=(Date.now()-voiceStartedAt)/1000;voiceStartedAt=0;}setVoiceUI('paused');};
      recorder.onresume=()=>{voiceStartedAt=Date.now();setVoiceUI('recording');};
      recorder.start();
    }catch(error){
      voiceStarting=false;stopVoiceStream();voiceRecorder=null;console.error('HAVANA NICE microphone permission failed:',error);alert('Necesitamos permiso para usar el micrófono.');
    }
  }

  function toggleVoice(){
    if(voiceSending||voiceStarting)return;
    if(!voiceRecorder||voiceRecorder.state==='inactive'){startVoice();return;}
    if(voiceRecorder.state==='recording'){try{voiceRecorder.pause();}catch(_){} }
    else if(voiceRecorder.state==='paused'){try{voiceRecorder.resume();}catch(_){} }
  }

  async function uploadVoice(blob,duration){
    const profile=(()=>{try{return JSON.parse(sessionStorage.getItem('hn_profile')||'null')}catch(_){return null}})();
    const client=window.hnSupabase||window.supabaseClient||window.supabase||null;
    if(!client||!profile?.id||!blob?.size)throw new Error('No se pudo preparar el audio.');
    const mime=blob.type||voiceMime||'audio/webm';
    const ext=mime.includes('mp4')?'m4a':mime.includes('ogg')?'ogg':'webm';
    const path=`${profile.id}/${crypto.randomUUID()}.${ext}`;
    const {error:uploadError}=await client.storage.from(AUDIO_BUCKET).upload(path,blob,{contentType:mime,upsert:false});
    if(uploadError)throw uploadError;
    const {data:urlData}=client.storage.from(AUDIO_BUCKET).getPublicUrl(path);
    const audioUrl=urlData?.publicUrl;
    if(!audioUrl)throw new Error('No se pudo obtener la URL del audio.');
    const {error}=await client.rpc('send_chat_audio',{p_profile_id:profile.id,p_audio_url:audioUrl,p_audio_duration:duration});
    if(error)throw error;
  }

  function finishVoiceSend(){
    if(voiceSending||!voiceRecorder)return;
    if(voiceRecorder.state==='recording'){try{voiceRecorder.pause();}catch(_){} }
    if(voiceRecorder.state!=='paused')return;
    voiceSending=true;setVoiceUI('sending');stopVoiceTimer();
    const recorder=voiceRecorder;
    recorder.ondataavailable=e=>{if(e.data?.size)voiceChunks.push(e.data)};
    recorder.onstop=async()=>{
      const duration=Math.max(1,Math.round(voiceElapsed));
      const blob=new Blob(voiceChunks,{type:recorder.mimeType||voiceMime||'audio/webm'});
      stopVoiceStream();
      voiceRecorder=null;voiceChunks=[];voiceMime='';voiceStartedAt=0;voiceElapsed=0;
      try{await uploadVoice(blob,duration);}catch(error){console.error('HAVANA NICE voice note send failed:',error);alert(error?.message||'No se pudo enviar el audio.');}
      finally{voiceSending=false;resetVoiceUI();}
    };
    try{recorder.stop();}catch(error){console.error(error);voiceSending=false;cancelVoice();}
  }

  function interceptVoiceAndSend(){
    if(window.__hnChatVoiceFixV2)return;
    window.__hnChatVoiceFixV2=true;
    window.addEventListener('click',event=>{
      const target=event.target;
      const mic=target?.closest?.('#hn-chat-screen .hn-chat-mic');
      if(mic){
        const screen=document.getElementById('hn-chat-screen');
        if(!screen?.classList.contains('is-active'))return;
        event.preventDefault();event.stopImmediatePropagation();toggleVoice();return;
      }
    },true);
    window.addEventListener('submit',event=>{
      const form=event.target;
      if(!form?.closest?.('#hn-chat-screen .hn-chat-compose'))return;
      if(!voiceRecorder||voiceRecorder.state==='inactive')return;
      event.preventDefault();event.stopImmediatePropagation();
      if(voiceRecorder.state==='paused')finishVoiceSend();
    },true);
  }

  function waitForVideoMetadata(video){
    return new Promise((resolve,reject)=>{
      if(video.readyState>=1&&video.videoWidth&&video.videoHeight){resolve();return;}
      const ok=()=>{cleanup();resolve();};
      const fail=()=>{cleanup();reject(new Error('No se pudo leer el video.'));};
      const cleanup=()=>{video.removeEventListener('loadedmetadata',ok);video.removeEventListener('error',fail);};
      video.addEventListener('loadedmetadata',ok,{once:true});video.addEventListener('error',fail,{once:true});
    });
  }

  function pickVideoMime(){
    if(!window.MediaRecorder)return '';
    return ['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t))||'';
  }

  async function compressImage(file){
    if(!file?.type?.startsWith('image/'))return file;
    const url=URL.createObjectURL(file);
    try{
      const image=new Image();
      image.decoding='async';
      image.src=url;
      await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;});
      const scale=Math.min(1,MEDIA_IMAGE_MAX/Math.max(image.naturalWidth||image.width,image.naturalHeight||image.height));
      const width=Math.max(1,Math.round((image.naturalWidth||image.width)*scale));
      const height=Math.max(1,Math.round((image.naturalHeight||image.height)*scale));
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Canvas no disponible.');
      ctx.drawImage(image,0,0,width,height);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('No se pudo comprimir la foto.')),'image/jpeg',MEDIA_IMAGE_QUALITY));
      if(!blob?.size||blob.size>=file.size)return file;
      const base=file.name.replace(/\.[^.]+$/,'')||'foto';
      return new File([blob],`${base}.jpg`,{type:'image/jpeg',lastModified:file.lastModified||Date.now()});
    }finally{URL.revokeObjectURL(url);}
  }

  async function compressVideo(file){
    if(!file?.type?.startsWith('video/'))return file;
    if(!window.MediaRecorder||!window.MediaStream||!HTMLCanvasElement.prototype.captureStream)return file;
    const mime=pickVideoMime();if(!mime)return file;
    const url=URL.createObjectURL(file),video=document.createElement('video');
    let sourceStream=null,outputStream=null,raf=0;
    video.muted=true;video.playsInline=true;video.preload='auto';video.src=url;
    try{
      await waitForVideoMetadata(video);
      const sourceWidth=video.videoWidth,sourceHeight=video.videoHeight;
      if(!sourceWidth||!sourceHeight)return file;
      const scale=Math.min(1,MEDIA_VIDEO_MAX/Math.max(sourceWidth,sourceHeight));
      const width=Math.max(2,Math.round(sourceWidth*scale/2)*2);
      const height=Math.max(2,Math.round(sourceHeight*scale/2)*2);
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Canvas no disponible.');
      sourceStream=video.captureStream?video.captureStream():(video.mozCaptureStream?video.mozCaptureStream():null);
      if(!sourceStream) return file;
      const canvasStream=canvas.captureStream(MEDIA_VIDEO_FPS);
      outputStream=new MediaStream();
      canvasStream.getVideoTracks().forEach(track=>outputStream.addTrack(track));
      sourceStream.getAudioTracks().forEach(track=>outputStream.addTrack(track));
      const chunks=[];
      const recorder=new MediaRecorder(outputStream,{mimeType,videoBitsPerSecond:MEDIA_VIDEO_BPS,audioBitsPerSecond:MEDIA_AUDIO_BPS});
      const finished=new Promise((resolve,reject)=>{
        recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
        recorder.onerror=()=>reject(new Error('No se pudo comprimir el video.'));
        recorder.onstop=()=>resolve(new Blob(chunks,{type:recorder.mimeType||mime}));
      });
      const draw=()=>{if(video.ended)return;try{ctx.drawImage(video,0,0,width,height);}catch(_){ }raf=requestAnimationFrame(draw);};
      video.onended=()=>{if(raf)cancelAnimationFrame(raf);if(recorder.state!=='inactive')recorder.stop();};
      recorder.start(1000);
      await video.play();
      draw();
      const blob=await finished;
      if(!blob?.size||blob.size>=file.size)return file;
      const base=file.name.replace(/\.[^.]+$/,'')||'video';
      const ext=(blob.type||mime).includes('mp4')?'mp4':'webm';
      return new File([blob],`${base}.${ext}`,{type:blob.type||mime,lastModified:file.lastModified||Date.now()});
    }catch(error){
      console.warn('HAVANA NICE media compression fallback:',error);
      try{if(raf)cancelAnimationFrame(raf);}catch(_){ }
      return file;
    }finally{
      try{video.pause();}catch(_){ }
      try{sourceStream?.getTracks().forEach(t=>t.stop());}catch(_){ }
      try{outputStream?.getTracks().forEach(t=>t.stop());}catch(_){ }
      URL.revokeObjectURL(url);
    }
  }

  async function optimizeMedia(file){
    if(file?.type?.startsWith('image/'))return compressImage(file);
    if(file?.type?.startsWith('video/'))return compressVideo(file);
    return file;
  }

  function installMediaCompression(){
    const client=window.hnSupabase||window.supabaseClient||window.supabase||null;
    const storage=client?.storage;
    if(!storage?.from||mediaCompressionInstalled)return;
    const originalFrom=storage.from.bind(storage);
    storage.from=function(bucket,...args){
      const api=originalFrom(bucket,...args);
      if(bucket!==MEDIA_BUCKET||!api?.upload||api.__hnMediaCompressionUpload)return api;
      const originalUpload=api.upload.bind(api);
      api.upload=async(path,file,options={})=>{
        let optimized=file;
        try{optimized=await optimizeMedia(file);}catch(error){console.warn('HAVANA NICE media optimization failed:',error);optimized=file;}
        let finalPath=path,finalOptions={...options};
        if(optimized!==file){
          const ext=(optimized.type||'').includes('jpeg')?'jpg':(optimized.type||'').includes('mp4')?'mp4':'webm';
          finalPath=String(path).replace(/\.[^.]+$/,`.${ext}`);
          finalOptions.contentType=optimized.type;
        }
        return originalUpload(finalPath,optimized,finalOptions);
      };
      api.__hnMediaCompressionUpload=true;
      return api;
    };
    mediaCompressionInstalled=true;
  }

  async function load(){
    try{
      const r=await fetch(RPC_URL,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},body:'{}'});
      if(!r.ok)return;
      const data=await r.json();settings=Array.isArray(data)?data[0]:data;if(settings)apply();
    }catch(e){console.warn('HN chat settings',e)}
  }

  function apply(){
    const s=settings;if(!s)return;
    const bg=validColor(s.background_color)?s.background_color:'#020302';
    const own=validColor(s.own_bubble_color)?s.own_bubble_color:'#0d5a3d';
    const other=validColor(s.other_bubble_color)?s.other_bubble_color:'#171717';
    const accent=validColor(s.accent_color)?s.accent_color:'#e5bd62';
    const text=validColor(s.text_color)?s.text_color:'#f4f1e8';
    let style=document.getElementById('hn-chat-live-settings');
    if(!style){style=document.createElement('style');style.id='hn-chat-live-settings';document.head.appendChild(style);}
    const css=`#hn-chat-screen{--hn-chat-bg:${bg};--hn-chat-own:${own};--hn-chat-other:${other};--hn-chat-accent:${accent};--hn-chat-text:${text};background:${bg}!important;position:absolute;overflow:hidden}#hn-chat-screen::before{content:"";position:absolute;inset:-35%;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 18% 50%,rgba(229,189,98,.16) 0%,rgba(229,189,98,.07) 14%,transparent 34%),radial-gradient(ellipse at 82% 35%,rgba(13,90,61,.22) 0%,transparent 40%);transform:translateX(-35%);animation:hnChatGoldSweep 8s ease-in-out infinite alternate;will-change:transform}#hn-chat-screen .hn-chat-wrap{background:transparent!important;position:relative;z-index:1}@keyframes hnChatGoldSweep{0%{transform:translateX(-35%) rotate(-2deg)}100%{transform:translateX(35%) rotate(2deg)}}#hn-chat-screen .hn-chat-bubble{border-color:${accent}55!important;background:${other}!important}#hn-chat-screen .hn-chat-row.mine .hn-chat-bubble{background:${own}!important;border-color:${accent}!important}#hn-chat-screen .hn-chat-sender,#hn-chat-screen .hn-chat-audio-icon,#hn-chat-screen .hn-chat-recording-status,#hn-chat-screen .hn-chat-reply-label{color:${accent}!important}#hn-chat-screen .hn-chat-text,#hn-chat-screen .hn-chat-audio-label,#hn-chat-screen .hn-chat-input,#hn-chat-screen .hn-chat-recording,#hn-chat-screen .hn-chat-send,#hn-chat-screen .hn-chat-head-title{color:${text}!important}#hn-chat-screen .hn-chat-input{border-color:${accent}73!important}#hn-chat-screen .hn-chat-send{border-color:${accent}!important;color:${text}!important}#hn-chat-screen .hn-chat-list{background:transparent!important}#hn-chat-screen .hn-chat-recording{justify-content:flex-end}#hn-chat-screen .hn-chat-recording-status{display:none!important}#hn-chat-screen .hn-chat-mic.is-paused{border-color:${accent}!important;background:rgba(229,189,98,.16);color:${accent}!important}`;
    if(style.textContent!==css)style.textContent=css;
    wireLimits();wireChatBackground();installMediaCompression();
  }

  function wireLimits(){
    const input=document.querySelector('.hn-chat-media-input');
    if(!input||input.dataset.hnSettingsBound==='1')return;
    input.dataset.hnSettingsBound='1';
    input.addEventListener('change',e=>{
      const max=Math.max(1,Math.min(5,Number(settings?.max_media_files)||5));
      const files=[...(input.files||[])];
      if(files.length>max){e.stopImmediatePropagation();input.value='';alert(`Puedes subir máximo ${max} fotos/videos por envío.`);return;}
      const maxMinutes=Math.max(1,Math.min(5,Number(settings?.max_video_minutes)||5));
      const maxSeconds=maxMinutes*60;const videos=files.filter(f=>f.type.startsWith('video/'));
      if(videos.length){let rejected=false;for(const file of videos){const url=URL.createObjectURL(file),v=document.createElement('video');v.preload='metadata';v.onloadedmetadata=()=>{const tooLong=(Number(v.duration)||0)>maxSeconds;URL.revokeObjectURL(url);if(tooLong&&!rejected){rejected=true;input.value='';alert(`Los videos pueden durar máximo ${maxMinutes} minutos.`);}};v.onerror=()=>URL.revokeObjectURL(url);v.src=url;}}
    },true);
  }

  async function realtime(){
    try{
      const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      sb=mod.createClient(SUPABASE_URL,KEY);
      channel=sb.channel('hn-chat-settings-live').on('postgres_changes',{event:'UPDATE',schema:'public',table:'chat_settings',filter:'id=eq.1'},payload=>{settings=payload.new;apply();});
      await channel.subscribe();
    }catch(e){console.warn('HN chat settings realtime',e)}
  }

  const observer=new MutationObserver(mutations=>{
    const chatAdded=mutations.some(m=>[...m.addedNodes].some(node=>node.nodeType===1&&(node.id==='hn-chat-screen'||node.querySelector?.('#hn-chat-screen'))));
    if(chatAdded){apply();wireChatBackground();}
  });
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});

  interceptVoiceAndSend();
  load();realtime();
  setInterval(()=>{load();wireLimits();wireChatBackground();installMediaCompression();},60000);
})();