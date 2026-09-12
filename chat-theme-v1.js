/* HAVANA NICE — CHAT SETTINGS BRIDGE V3 */
(() => {
  'use strict';
  if (window.__hnChatThemeV3) return;
  window.__hnChatThemeV3 = true;

  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const KEY='sb_publishable_Ip5rGK0UVIfXOfjs_RQ_LhA_c14foHN9';
  const RPC_URL=`${SUPABASE_URL}/rest/v1/rpc/get_chat_settings`;
  const AUDIO_BUCKET='chat-audio';
  let settings=null, sb=null, channel=null;
  let voiceRecorder=null, voiceStream=null, voiceChunks=[], voiceStartedAt=0, voiceStarting=false, voiceStopRequested=false, voiceSending=false;

  const validColor=v=>/^#[0-9a-fA-F]{6}$/.test(v||'');

  function syncChatBackground(){
    const screen=document.getElementById('hn-chat-screen');
    const video=document.getElementById('backgroundVideo');
    if(!screen||!video)return;
    const active=screen.classList.contains('is-active');
    if(active){
      if(!video.paused){
        video.pause();
        video.dataset.hnChatPaused='1';
      }
    }else if(video.dataset.hnChatPaused==='1'){
      delete video.dataset.hnChatPaused;
      video.play().catch(()=>{});
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

  function chatEls(){
    const screen=document.getElementById('hn-chat-screen');
    return screen?{screen,mic:screen.querySelector('.hn-chat-mic'),send:screen.querySelector('.hn-chat-send'),attach:screen.querySelector('.hn-chat-attach'),recording:screen.querySelector('.hn-chat-recording'),status:screen.querySelector('.hn-chat-recording-status'),time:screen.querySelector('.hn-chat-recording-time')}:null;
  }

  function pickVoiceMime(){
    if(!window.MediaRecorder)return '';
    return ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t))||'';
  }

  function stopVoiceStream(){
    if(voiceStream){voiceStream.getTracks().forEach(t=>{try{t.stop();}catch(_){}});voiceStream=null;}
  }

  function setVoiceUI(recording=false,sending=false){
    const els=chatEls();if(!els)return;
    if(recording){
      els.mic?.classList.add('is-recording');
      els.mic?.setAttribute('aria-label','Detener grabación');
      els.mic?.setAttribute('title','Detener grabación');
      els.recording?.classList.add('is-visible');
      els.recording?.classList.remove('is-pending');
      if(els.status)els.status.textContent='GRABANDO NOTA DE VOZ';
      if(els.send){els.send.textContent='GRABANDO...';els.send.disabled=true;}
      if(els.attach)els.attach.disabled=true;
    }else if(sending){
      els.mic?.classList.remove('is-recording');
      els.mic?.setAttribute('aria-label','Enviando nota de voz');
      els.mic?.setAttribute('title','Enviando nota de voz');
      els.mic&&(els.mic.disabled=true);
      els.recording?.classList.add('is-visible');
      els.recording?.classList.remove('is-pending');
      if(els.status)els.status.textContent='ENVIANDO NOTA DE VOZ';
      if(els.send){els.send.textContent='ENVIANDO...';els.send.disabled=true;}
      if(els.attach)els.attach.disabled=true;
    }else{
      els.mic?.classList.remove('is-recording');
      els.mic?.removeAttribute('disabled');
      els.mic?.setAttribute('aria-label','Grabar nota de voz');
      els.mic?.setAttribute('title','Grabar nota de voz');
      els.recording?.classList.remove('is-visible','is-pending');
      if(els.time)els.time.textContent='00:00';
      if(els.attach)els.attach.disabled=false;
    }
  }

  function updateVoiceTimer(){
    const els=chatEls();
    if(els?.time&&voiceStartedAt)els.time.textContent=new Intl.DateTimeFormat('es-MX',{minute:'2-digit',second:'2-digit'}).format(new Date(0,0,0,0,0,Math.floor((Date.now()-voiceStartedAt)/1000)));
  }

  async function uploadVoice(blob,duration){
    const profile=(()=>{try{return JSON.parse(sessionStorage.getItem('hn_profile')||'null')}catch(_){return null}})();
    const client=window.hnSupabase||window.supabaseClient||window.supabase||null;
    if(!client||!profile?.id||!blob?.size)throw new Error('No se pudo preparar el audio.');
    const mime=blob.type||'audio/webm';
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

  async function finishVoice(blob,duration){
    if(voiceSending)return;
    voiceSending=true;
    setVoiceUI(false,true);
    try{
      await uploadVoice(blob,duration);
    }catch(error){
      console.error('HAVANA NICE voice note send failed:',error);
      alert(error?.message||'No se pudo enviar la nota de voz.');
    }finally{
      voiceSending=false;
      voiceChunks=[];
      voiceRecorder=null;
      voiceStartedAt=0;
      setVoiceUI(false,false);
      const els=chatEls();
      if(els?.send){els.send.textContent='ENVIAR';els.send.disabled=true;}
    }
  }

  function stopVoice(){
    voiceStopRequested=true;
    if(voiceRecorder&&voiceRecorder.state!=='inactive'){
      try{voiceRecorder.stop();}catch(_){voiceRecorder=null;stopVoiceStream();setVoiceUI(false,false);}
    }
  }

  async function startVoice(){
    if(voiceSending||voiceStarting)return;
    const els=chatEls();
    if(!els)return;
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
      return;
    }
    if(els.attach?.disabled&&!voiceRecorder)return;
    voiceStarting=true;
    voiceStopRequested=false;
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      voiceStream=stream;
      const mimeType=pickVoiceMime();
      voiceChunks=[];
      voiceRecorder=mimeType?new MediaRecorder(stream,{mimeType}):new MediaRecorder(stream);
      voiceStartedAt=Date.now();
      setVoiceUI(true,false);
      const recorder=voiceRecorder;
      recorder.ondataavailable=e=>{if(e.data?.size)voiceChunks.push(e.data)};
      recorder.onerror=()=>{
        stopVoiceStream();
        voiceRecorder=null;
        voiceStarting=false;
        setVoiceUI(false,false);
        alert('No se pudo grabar el audio.');
      };
      recorder.onstop=()=>{
        const duration=Math.max(1,Math.round((Date.now()-voiceStartedAt)/1000));
        const blob=new Blob(voiceChunks,{type:recorder.mimeType||mimeType||'audio/webm'});
        stopVoiceStream();
        voiceRecorder=null;
        voiceStarting=false;
        if(blob.size)finishVoice(blob,duration);
        else setVoiceUI(false,false);
      };
      recorder.start();
      if(voiceStopRequested)stopVoice();
    }catch(error){
      voiceStarting=false;
      stopVoiceStream();
      console.error('HAVANA NICE microphone permission failed:',error);
      alert('Necesitamos permiso para usar el micrófono.');
    }
  }

  function interceptVoiceButton(){
    if(window.__hnChatVoiceFixV1)return;
    window.__hnChatVoiceFixV1=true;
    window.addEventListener('click',event=>{
      const target=event.target;
      const mic=target?.closest?.('#hn-chat-screen .hn-chat-mic');
      if(!mic)return;
      const screen=document.getElementById('hn-chat-screen');
      if(!screen?.classList.contains('is-active')||voiceSending)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if(voiceRecorder&&voiceRecorder.state==='recording')stopVoice();
      else if(!voiceStarting)startVoice();
    },true);
  }

  async function load(){
    try{
      const r=await fetch(RPC_URL,{
        method:'POST',
        headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},
        body:'{}'
      });
      if(!r.ok)return;
      const data=await r.json();
      settings=Array.isArray(data)?data[0]:data;
      if(settings)apply();
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
    if(!style){
      style=document.createElement('style');
      style.id='hn-chat-live-settings';
      document.head.appendChild(style);
    }
    const css=`#hn-chat-screen{--hn-chat-bg:${bg};--hn-chat-own:${own};--hn-chat-other:${other};--hn-chat-accent:${accent};--hn-chat-text:${text};background:${bg}!important;position:absolute;overflow:hidden}#hn-chat-screen::before{content:"";position:absolute;inset:-35%;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 18% 50%,rgba(229,189,98,.16) 0%,rgba(229,189,98,.07) 14%,transparent 34%),radial-gradient(ellipse at 82% 35%,rgba(13,90,61,.22) 0%,transparent 40%);transform:translateX(-35%);animation:hnChatGoldSweep 8s ease-in-out infinite alternate;will-change:transform}#hn-chat-screen .hn-chat-wrap{background:transparent!important;position:relative;z-index:1}@keyframes hnChatGoldSweep{0%{transform:translateX(-35%) rotate(-2deg)}100%{transform:translateX(35%) rotate(2deg)}}#hn-chat-screen .hn-chat-bubble{border-color:${accent}55!important;background:${other}!important}#hn-chat-screen .hn-chat-row.mine .hn-chat-bubble{background:${own}!important;border-color:${accent}!important}#hn-chat-screen .hn-chat-sender,#hn-chat-screen .hn-chat-audio-icon,#hn-chat-screen .hn-chat-recording-status,#hn-chat-screen .hn-chat-reply-label{color:${accent}!important}#hn-chat-screen .hn-chat-text,#hn-chat-screen .hn-chat-audio-label,#hn-chat-screen .hn-chat-input,#hn-chat-screen .hn-chat-recording,#hn-chat-screen .hn-chat-send,#hn-chat-screen .hn-chat-head-title{color:${text}!important}#hn-chat-screen .hn-chat-input{border-color:${accent}73!important}#hn-chat-screen .hn-chat-send{border-color:${accent}!important;color:${text}!important}#hn-chat-screen .hn-chat-list{background:transparent!important}`;
    if(style.textContent!==css)style.textContent=css;
    wireLimits();
    wireChatBackground();
  }

  function wireLimits(){
    const input=document.querySelector('.hn-chat-media-input');
    if(!input||input.dataset.hnSettingsBound==='1')return;
    input.dataset.hnSettingsBound='1';
    input.addEventListener('change',e=>{
      const max=Math.max(1,Math.min(5,Number(settings?.max_media_files)||5));
      const files=[...(input.files||[])];
      if(files.length>max){
        e.stopImmediatePropagation();
        input.value='';
        alert(`Puedes subir máximo ${max} fotos/videos por envío.`);
        return;
      }
      const maxMinutes=Math.max(1,Math.min(5,Number(settings?.max_video_minutes)||5));
      const maxSeconds=maxMinutes*60;
      const videos=files.filter(f=>f.type.startsWith('video/'));
      if(videos.length){
        let rejected=false;
        for(const file of videos){
          const url=URL.createObjectURL(file),v=document.createElement('video');
          v.preload='metadata';
          v.onloadedmetadata=()=>{
            const tooLong=(Number(v.duration)||0)>maxSeconds;
            URL.revokeObjectURL(url);
            if(tooLong&&!rejected){
              rejected=true;
              input.value='';
              alert(`Los videos pueden durar máximo ${maxMinutes} minutos.`);
            }
          };
          v.onerror=()=>URL.revokeObjectURL(url);
          v.src=url;
        }
      }
    },true);
  }

  async function realtime(){
    try{
      const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      sb=mod.createClient(SUPABASE_URL,KEY);
      channel=sb.channel('hn-chat-settings-live').on('postgres_changes',{event:'UPDATE',schema:'public',table:'chat_settings',filter:'id=eq.1'},payload=>{
        settings=payload.new;
        apply();
      });
      await channel.subscribe();
    }catch(e){console.warn('HN chat settings realtime',e)}
  }

  const observer=new MutationObserver(mutations=>{
    const chatAdded=mutations.some(m=>[...m.addedNodes].some(node=>
      node.nodeType===1 && (node.id==='hn-chat-screen' || node.querySelector?.('#hn-chat-screen'))
    ));
    if(chatAdded){
      apply();
      wireChatBackground();
    }
  });
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});

  interceptVoiceButton();
  load();
  realtime();
  setInterval(()=>{
    load();
    wireLimits();
    wireChatBackground();
  },60000);
})();