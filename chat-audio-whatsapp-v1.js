/* HAVANA NICE — CHAT AUDIO / DIRECT RECORD + SEND
   Owns only the microphone interaction layer.
   1 tap: record. 2nd tap: stop + send immediately. Trash: cancel.
*/
(()=>{
  'use strict';

  const AUDIO_BUCKET='chat-audio';
  const CHAT_TABLE='chat_messages';
  let recorder=null;
  let chunks=[];
  let stream=null;
  let startedAt=0;
  let timer=null;
  let cancelOnStop=false;
  let sendOnStop=false;
  let busy=false;

  const micSvg=`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8.2 3.2h7.6c1 0 1.8.8 1.8 1.8v7.2c0 3.1-2.5 5.6-5.6 5.6s-5.6-2.5-5.6-5.6V5c0-1 .8-1.8 1.8-1.8Z"></path><path d="M7.1 6h9.8M7.1 8.6h9.8M7.1 11.2h9.8M7.4 13.8h9.2"></path><path d="M9.4 3.2v13.6M14.6 3.2v13.6"></path><path d="M12 17.8V21"></path><path d="M8.6 21h6.8"></path></svg>`;
  const trashSvg=`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16"></path><path d="M9 7V4.5h6V7"></path><path d="M6.5 7l1 13h9l1-13"></path><path d="M10 10.5v6M14 10.5v6"></path></svg>`;

  function session(){try{return JSON.parse(sessionStorage.getItem('hn_profile')||'null')}catch(_){return null}}
  function sb(){return window.hnSupabase||window.hnMusicianSupabase||window.supabaseClient||window.supabase||null}
  function formatDuration(seconds){const total=Math.max(0,Math.floor(Number(seconds)||0));return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`}
  function pickMime(){if(!window.MediaRecorder)return '';return ['audio/mp4;codecs=mp4a.40.2','audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t))||''}

  function installStyle(){
    if(document.getElementById('hn-chat-audio-direct-style'))return;
    const style=document.createElement('style');style.id='hn-chat-audio-direct-style';style.textContent=`
      #hn-chat-screen .hn-chat-mic{display:flex!important;align-items:center!important;justify-content:center!important}
      #hn-chat-screen .hn-chat-mic svg{width:23px!important;height:23px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.65!important;stroke-linecap:round!important;stroke-linejoin:round!important}
      #hn-chat-screen .hn-chat-mic.is-recording{background:#7f2525!important;color:#fff!important;box-shadow:0 0 0 4px rgba(127,37,37,.12)!important;animation:hnVintageMicPulse 1.05s ease-in-out infinite!important}
      #hn-chat-screen .hn-chat-recording{position:relative!important;gap:12px!important;padding:8px 10px 8px 14px!important}
      #hn-chat-screen .hn-chat-recording-status{flex:1!important;min-width:0!important}
      #hn-chat-screen .hn-chat-recording-time{font-variant-numeric:tabular-nums!important}
      #hn-chat-screen .hn-chat-recording-trash{display:none;width:40px;height:40px;flex:0 0 40px;border:0;border-radius:50%;background:#efe9df;color:#7e2626;align-items:center;justify-content:center;cursor:pointer}
      #hn-chat-screen .hn-chat-recording.is-live .hn-chat-recording-trash{display:flex}
      #hn-chat-screen .hn-chat-recording-trash svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
      #hn-chat-screen .hn-chat-recording.is-sending .hn-chat-recording-trash{display:none}
      #hn-chat-screen .hn-chat-recording.is-sending{border-color:#315f50!important}
      #hn-chat-screen .hn-chat-recording.is-sending .hn-chat-recording-status{color:#315f50!important}
      @keyframes hnVintageMicPulse{0%,100%{transform:scale(1);box-shadow:0 0 0 3px rgba(127,37,37,.08)}50%{transform:scale(1.055);box-shadow:0 0 0 7px rgba(127,37,37,.12)}}
    `;document.head.appendChild(style);
  }

  function elements(){
    const root=document.getElementById('hn-chat-screen');
    if(!root)return {};
    return {root,mic:root.querySelector('.hn-chat-mic'),box:root.querySelector('.hn-chat-recording'),status:root.querySelector('.hn-chat-recording-status'),time:root.querySelector('.hn-chat-recording-time')};
  }

  function decorate(){
    installStyle();
    const {mic,box}=elements();
    if(mic&&mic.dataset.hnDirectAudio!=='1'){
      mic.dataset.hnDirectAudio='1';
      mic.innerHTML=micSvg;
      mic.setAttribute('aria-label','Grabar nota de voz');
      mic.setAttribute('title','Grabar nota de voz');
    }
    if(box&&!box.querySelector('.hn-chat-recording-trash')){
      const trash=document.createElement('button');trash.type='button';trash.className='hn-chat-recording-trash';trash.setAttribute('aria-label','Eliminar grabación');trash.setAttribute('title','Eliminar grabación');trash.innerHTML=trashSvg;box.appendChild(trash);
    }
  }

  function clearTimer(){if(timer)clearInterval(timer);timer=null}
  function setIdle(){
    clearTimer();
    const {mic,box,status,time}=elements();
    mic?.classList.remove('is-recording');
    if(mic){mic.disabled=false;mic.innerHTML=micSvg;mic.setAttribute('aria-label','Grabar nota de voz');mic.setAttribute('title','Grabar nota de voz')}
    if(box){box.classList.remove('is-visible','is-pending','is-live','is-sending')}
    if(status)status.textContent='GRABANDO';
    if(time)time.textContent='00:00';
  }
  function showLive(){
    const {mic,box,status,time}=elements();
    mic?.classList.add('is-recording');
    mic?.setAttribute('aria-label','Enviar nota de voz');mic?.setAttribute('title','Enviar nota de voz');
    box?.classList.add('is-visible','is-live');box?.classList.remove('is-pending','is-sending');
    if(status)status.textContent='GRABANDO · TOCA EL MICRÓFONO PARA ENVIAR';
    if(time)time.textContent='00:00';
    clearTimer();timer=setInterval(()=>{const e=elements().time;if(e)e.textContent=formatDuration((Date.now()-startedAt)/1000)},250);
  }
  function showSending(duration){
    clearTimer();
    const {mic,box,status,time}=elements();
    if(mic){mic.classList.remove('is-recording');mic.disabled=true}
    if(box){box.classList.add('is-visible','is-sending');box.classList.remove('is-live','is-pending')}
    if(status)status.textContent='ENVIANDO AUDIO…';
    if(time)time.textContent=formatDuration(duration);
  }

  function stopTracks(){try{stream?.getTracks()?.forEach(t=>t.stop())}catch(_){}stream=null}

  async function uploadVoice(blob,duration){
    const client=sb(),profile=session();
    if(!client||!profile?.id)throw new Error('Sesión no disponible.');
    const ext=blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':'webm';
    const id=(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now());
    const path=`${profile.id}/${Date.now()}-${id}.${ext}`;
    const up=await client.storage.from(AUDIO_BUCKET).upload(path,blob,{contentType:blob.type||'audio/webm',upsert:false});
    if(up.error)throw up.error;
    try{
      const pub=client.storage.from(AUDIO_BUCKET).getPublicUrl(path)?.data?.publicUrl;
      if(!pub)throw new Error('No se pudo generar el audio.');
      const ins=await client.from(CHAT_TABLE).insert({profile_id:profile.id,sender_name:profile.username||'MIEMBRO',message:'',message_type:'audio',audio_url:pub,audio_duration:duration});
      if(ins.error)throw ins.error;
    }catch(error){try{await client.storage.from(AUDIO_BUCKET).remove([path])}catch(_){}throw error}
  }

  async function finishRecording(){
    if(!recorder||recorder.state==='inactive')return;
    sendOnStop=true;cancelOnStop=false;
    const duration=Math.max(1,Math.round((Date.now()-startedAt)/1000));
    showSending(duration);
    try{recorder.stop()}catch(error){console.error('[HN direct audio stop]',error);setIdle();stopTracks();recorder=null;busy=false}
  }
  function cancelRecording(){
    if(busy&&!recorder)return;
    cancelOnStop=true;sendOnStop=false;
    if(recorder&&recorder.state!=='inactive'){
      try{recorder.stop()}catch(_){}
    }else{
      stopTracks();recorder=null;chunks=[];busy=false;setIdle();
    }
  }

  async function startRecording(){
    if(busy)return;
    const root=document.getElementById('hn-chat-screen');if(!root?.classList.contains('is-active'))return;
    if(root.querySelector('.hn-chat-media-pending.is-visible')){alert('Primero envía o elimina las fotos/videos seleccionados.');return}
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){alert('Este dispositivo o navegador no permite grabar notas de voz.');return}
    busy=true;cancelOnStop=false;sendOnStop=false;chunks=[];
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mime=pickMime();recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);
      startedAt=Date.now();
      recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
      recorder.onerror=error=>{console.error('[HN direct audio recorder]',error);stopTracks();recorder=null;chunks=[];busy=false;setIdle();alert('No se pudo grabar el audio.')};
      recorder.onstop=async()=>{
        clearTimer();
        const localRecorder=recorder;
        const duration=Math.max(1,Math.round((Date.now()-startedAt)/1000));
        const type=localRecorder?.mimeType||mime||'audio/webm';
        const blob=new Blob(chunks,{type});
        recorder=null;chunks=[];stopTracks();
        if(cancelOnStop||!sendOnStop){cancelOnStop=false;sendOnStop=false;busy=false;setIdle();return}
        sendOnStop=false;
        if(!blob.size){busy=false;setIdle();return}
        showSending(duration);
        try{await uploadVoice(blob,duration)}catch(error){console.error('[HN direct audio send]',error);alert(error?.message||'No se pudo enviar el audio.')}
        finally{busy=false;setIdle()}
      };
      recorder.start();showLive();
    }catch(error){console.error('[HN direct audio permission]',error);stopTracks();recorder=null;chunks=[];busy=false;setIdle();alert('Necesitamos permiso para usar el micrófono.')}
  }

  function handleMic(event){
    const mic=event.target?.closest?.('#hn-chat-screen .hn-chat-mic');if(!mic)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(mic.disabled)return;
    if(recorder&&recorder.state==='recording')finishRecording();else if(!busy)startRecording();
  }
  function handleTrash(event){
    const trash=event.target?.closest?.('#hn-chat-screen .hn-chat-recording-trash');if(!trash)return;
    event.preventDefault();event.stopImmediatePropagation();cancelRecording();
  }

  document.addEventListener('click',handleMic,true);
  document.addEventListener('click',handleTrash,true);
  const observer=new MutationObserver(decorate);observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
})();
