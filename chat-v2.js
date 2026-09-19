/* HAVANA NICE — CHAT DE INFORMACIÓN / REAL TIME V10
   Local-first history + incremental sync + progressive paging.
   Confirmed video messages render as lightweight poster cards only; the full video
   is loaded exclusively by Chat Media V10 when the user opens it.
*/
(() => {
  'use strict';

  const CHAT_TABLE = 'chat_messages';
  const AUDIO_BUCKET = 'chat-audio';
  const MEDIA_BUCKET = 'chat-media';
  const SETTINGS_RPC = 'get_chat_settings';
  const MAX_LENGTH = 1000;
  const MAX_MEDIA = 5;
  const READ_KEY = 'hn_chat_last_read_at';
  const PAGE_SIZE = 60;
  const LOCAL_HISTORY_LIMIT = 120;

  let chatChannel = null, messages = [], chatScreen = null, listEl = null;
  let inputEl = null, sendEl = null, micEl = null, mediaEl = null;
  let initialized = false, replyTarget = null, historyArmed = false;
  let previousScreen = null, videoWasMuted = true;
  let mediaRecorder = null, audioChunks = [], recordingStartedAt = 0, recordingTimer = null;
  let pendingVoice = null, pendingMedia = [], pendingPreviewUrls = [];
  let chatReconnectTimer = null, chatReconnectDelay = 1000;
  let sending=false, outgoing=null, outgoingUrls=[];
  let activeProfileId=null, historyRestoredFor=null, historyDB=null;
  let loadFlight=null, syncRevision=0, syncedAt=0;
  let loadingOlder=false, hasMore=true, oldestLoadedAt=null;
  const liveChanges=new Map();
  const HISTORY_TTL=7*24*60*60*1000;
  const MESSAGE_FIELDS='id,profile_id,sender_name,message,created_at,message_type,audio_url,audio_duration,media_urls,media_types,media_posters,media_playback_urls,reply_to_message_id';
  let chatSettings = {max_media_files: MAX_MEDIA, max_video_minutes: 5};

  const esc = value => String(value ?? '').replace(/[&<>'\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));
  const session = () => { try { return JSON.parse(sessionStorage.getItem('hn_profile') || 'null'); } catch (_) { return null; } };
  const client = () => window.hnSupabase || window.hnMusicianSupabase || window.supabaseClient || window.supabase || null;
  const currentProfile = () => { const p = session(); return p && p.id ? p : null; };
  const readKey = () => `${READ_KEY}:${currentProfile()?.id || 'anonymous'}`;
  const formatTime = ts => { try { return new Intl.DateTimeFormat('es-MX',{hour:'2-digit',minute:'2-digit'}).format(new Date(ts)); } catch (_) { return ''; } };
  const formatDuration = seconds => { const total=Math.max(0,Math.floor(Number(seconds)||0)); return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`; };
  const dayLabel = ts => { const d=new Date(ts), now=new Date(); const same=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); if(same(d,now))return 'HOY'; const y=new Date(now);y.setDate(now.getDate()-1);if(same(d,y))return 'AYER';return new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',year:'numeric'}).format(d).toUpperCase(); };
  const derivedPosterUrl = url => { try { const u=new URL(url);u.pathname=u.pathname+'.poster.jpg';u.search='';u.hash='';return u.toString(); } catch (_) { return ''; } };
  const posterFor = (message,index,url) => String(message?.media_posters?.[index] || derivedPosterUrl(url) || '');
  const playbackFor = (message,index,url) => String(message?.media_playback_urls?.[index] || url || '');

  function openHistoryDB(){
    if(historyDB)return historyDB;
    historyDB=new Promise(resolve=>{
      let done=false;
      const finish=db=>{if(done){db?.close();return;}done=true;clearTimeout(timer);resolve(db);};
      const timer=setTimeout(()=>finish(null),1200);
      try{
        const request=indexedDB.open('hn-chat-local-v1',1);
        request.onupgradeneeded=()=>request.result.createObjectStore('history');
        request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();finish(db);};
        request.onerror=()=>finish(null);request.onblocked=()=>finish(null);
      }catch(_){finish(null);}
    });
    return historyDB;
  }
  async function historyOperation(mode,id,value){
    const db=await openHistoryDB();if(!db||!id)return null;
    return new Promise(resolve=>{
      let done=false;const finish=value=>{if(done)return;done=true;clearTimeout(timer);resolve(value);};
      const timer=setTimeout(()=>finish(null),1000);
      try{
        const tx=db.transaction('history',mode),store=tx.objectStore('history');
        const request=mode==='readonly'?store.get(id):store.put(value,id);
        let result=null;request.onsuccess=()=>{result=request.result;};
        tx.oncomplete=()=>finish(result);tx.onerror=()=>finish(null);tx.onabort=()=>finish(null);
      }catch(_){finish(null);}
    });
  }
  function persistHistory(){
    const id=activeProfileId;if(!id)return;
    void historyOperation('readwrite',id,{savedAt:Date.now(),rows:messages.slice(-LOCAL_HISTORY_LIMIT)});
  }
  function ensureChatIdentity(){
    const id=String(currentProfile()?.id||'');
    if(id===activeProfileId)return id;
    activeProfileId=id;historyRestoredFor=null;messages=[];syncedAt=0;oldestLoadedAt=null;hasMore=true;loadingOlder=false;
    syncRevision++;liveChanges.clear();loadFlight=null;clearOutgoing();
    if(listEl){releaseLocalImages(listEl);listEl.replaceChildren();}
    return id;
  }
  async function restoreHistory(){
    const id=ensureChatIdentity();if(!id||historyRestoredFor===id)return;
    historyRestoredFor=id;const revision=syncRevision;
    const saved=await historyOperation('readonly',id);
    if(activeProfileId!==id||revision!==syncRevision||messages.length||!saved)return;
    if(Date.now()-saved.savedAt>HISTORY_TTL||!Array.isArray(saved.rows))return;
    messages=saved.rows.filter(row=>row&&row.id&&row.created_at).slice(-LOCAL_HISTORY_LIMIT);
    oldestLoadedAt=messages[0]?.created_at||null;
    render(true);updateUnread();
  }
  function noteLiveChange(row,deleted=false){syncRevision++;liveChanges.set(String(row.id),{revision:syncRevision,row,deleted});}
  function mergeConfirmed(row){
    if(!row?.id)return;
    noteLiveChange(row);
    if(!messages.some(m=>String(m.id)===String(row.id)))messages.push(row);
    messages.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
    oldestLoadedAt=messages[0]?.created_at||null;
    persistHistory();render(true);if(chatScreen?.classList.contains('is-active'))markRead();
  }

  const PHOTO_CACHE_PREFIX='hn-chat-photos-v1-';
  let photoWrite=Promise.resolve();
  function releaseLocalImages(root){root?.querySelectorAll?.('img[data-hn-local-url]').forEach(img=>URL.revokeObjectURL(img.dataset.hnLocalUrl));}
  async function cachedPhoto(img,url){
    const id=activeProfileId;if(!id)return;
    try{
      const cache=await caches.open(PHOTO_CACHE_PREFIX+encodeURIComponent(id));
      const hit=await cache.match(url);
      if(!img.isConnected||id!==activeProfileId)return;
      if(hit&&Date.now()-Number(hit.headers.get('x-hn-saved-at'))<HISTORY_TTL){
        const blob=await hit.blob();
        if(!img.isConnected||id!==activeProfileId||!blob.type.startsWith('image/'))return;
        const local=URL.createObjectURL(blob);img.dataset.hnLocalUrl=local;img.src=local;
      }
    }catch(_){}
  }
  function warmPhoto(url){
    const id=activeProfileId;if(!id||!navigator.onLine)return;
    photoWrite=photoWrite.then(async()=>{
      if(id!==activeProfileId)return;
      try{
        const cache=await caches.open(PHOTO_CACHE_PREFIX+encodeURIComponent(id));
        const previous=await cache.match(url);
        if(previous&&Date.now()-Number(previous.headers.get('x-hn-saved-at'))<HISTORY_TTL)return;
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
        try{
          const response=await fetch(url,{signal:controller.signal,cache:'force-cache'});
          const size=Number(response.headers.get('content-length'));
          if(!response.ok||!size||size>1024*1024||!response.headers.get('content-type')?.startsWith('image/'))return;
          const blob=await response.blob();if(blob.size>1024*1024||id!==activeProfileId)return;
          const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-23)))await cache.delete(key);
          await cache.put(url,new Response(blob,{headers:{'content-type':blob.type,'x-hn-saved-at':String(Date.now())}}));
        }finally{clearTimeout(timer);}
      }catch(_){}
    });
  }
  function wirePhotoCache(){
    listEl?.querySelectorAll('.hn-chat-photo-button img').forEach(img=>{
      if(img.dataset.hnPhotoBound==='1')return;img.dataset.hnPhotoBound='1';
      const url=img.dataset.hnPhotoSource;if(!url||!url.startsWith('https://'))return;
      const network=()=>{if(img.isConnected&&!img.getAttribute('src'))img.src=url;};
      const timer=setTimeout(network,80);
      void cachedPhoto(img,url).finally(()=>{clearTimeout(timer);network();});
      if(img.complete&&img.naturalWidth)warmPhoto(url);else img.addEventListener('load',()=>warmPhoto(url),{once:true});
    });
  }

  function showOutgoing(){
    if(!listEl)return;
    listEl.querySelector('.hn-chat-empty')?.remove();
    outgoing=document.createElement('div');outgoing.className='hn-chat-row mine';outgoing.dataset.chatKey='outgoing';
    const bubble=document.createElement('div');bubble.className='hn-chat-bubble';
    if(pendingMedia.length){
      bubble.classList.add('hn-chat-media-bubble');
      const grid=document.createElement('div');grid.className='hn-chat-media-grid';
      pendingMedia.forEach((file,index)=>{
        const item=document.createElement('div');item.className='hn-chat-media-item';item.dataset.mediaIndex=String(index);
        if(file.type.startsWith('image/')){
          const img=document.createElement('img');const url=URL.createObjectURL(file);outgoingUrls.push(url);img.src=url;img.alt='Foto pendiente de envío';item.appendChild(img);
        }else{
          item.classList.add('hn-video-card-shell');
          const placeholder=document.createElement('div');placeholder.className='hn-video-card-fallback';placeholder.innerHTML='<span class="hn-video-card-play-overlay">▶</span><span class="hn-video-card-label">VIDEO</span>';item.appendChild(placeholder);
        }
        grid.appendChild(item);
      });bubble.appendChild(grid);
    }else{
      const text=document.createElement('div');text.className='hn-chat-text';text.textContent=pendingVoice?'NOTA DE VOZ':String(inputEl.value||'').trim();bubble.appendChild(text);
    }
    const status=document.createElement('div');status.className='hn-chat-time';status.textContent='ENVIANDO…';status.setAttribute('role','status');bubble.appendChild(status);
    outgoing.appendChild(bubble);listEl.appendChild(outgoing);window.hnChatMediaV10?.paintPending?.();scrollToLatest();
  }
  function clearOutgoing(){outgoing?.remove();outgoing=null;outgoingUrls.forEach(url=>URL.revokeObjectURL(url));outgoingUrls=[];}

  function parseLegacyReply(value) {
    const raw=String(value??'');if(!raw.startsWith('↳ ')) return {quote:null,text:raw};
    const i=raw.indexOf('\n---\n');if(i<0) return {quote:null,text:raw};
    const q=raw.slice(2,i), t=raw.slice(i+5), c=q.indexOf(': ');
    return {quote:c>=0?{sender:q.slice(0,c),text:q.slice(c+2)}:{sender:'MIEMBRO',text:q},text:t};
  }
  function getReplyTarget(message) {if(message?.reply_to_message_id) return messages.find(m => String(m.id)===String(message.reply_to_message_id)) || null;return null;}
  function replyPreview(message) {
    if(!message) return '';
    if(message.message_type==='audio') return '🎙 NOTA DE VOZ';
    if(message.message_type==='media') return message.message ? message.message.slice(0,160) : '📎 FOTOS / VIDEOS';
    return String(message.message||'').slice(0,160);
  }

  function ensureHomeModule(){
    const modules=document.querySelector('.modules'); if(!modules)return null;
    let existing=[...modules.querySelectorAll('.module')].find(el=>/CHAT DE INFORMACIÓN|CHAT DE INFORMACION/i.test(el.textContent||''));
    if(!existing){existing=document.createElement('button');existing.type='button';existing.className='module hn-chat-module';existing.innerHTML='<span class="module-number">05</span><span class="module-copy"><span class="module-title">CHAT DE INFORMACIÓN</span><span class="module-subtitle">MENSAJES DEL EQUIPO</span></span><span class="module-arrow">›</span>';const family=[...modules.querySelectorAll('.module')].find(el=>/FAMILIA/i.test(el.textContent||''));if(family&&family.nextSibling)modules.insertBefore(existing,family.nextSibling);else modules.appendChild(existing);}
    return existing;
  }

  function ensureStyles(){
    let style=document.getElementById('hn-chat-styles');if(!style){style=document.createElement('style');style.id='hn-chat-styles';document.head.appendChild(style);}
    style.textContent=`
      .hn-chat-module{position:relative!important;background:linear-gradient(145deg,#0b1710,#08110c)!important;border-color:rgba(229,189,98,.30)!important;box-shadow:0 6px 18px rgba(0,0,0,.14)}
      .hn-chat-module:hover{background:linear-gradient(145deg,#102017,#0c160f)!important;border-color:rgba(229,189,98,.46)!important}
      .hn-chat-screen{padding-bottom:max(24px,env(safe-area-inset-bottom))}.hn-chat-screen.is-active~.controls{display:none!important}.experience:has(#hn-chat-screen.is-active) .controls{display:none!important}
      .hn-chat-wrap{width:min(100%,720px);height:100%;margin:0 auto;display:flex;flex-direction:column;min-height:0}.hn-chat-head{flex:0 0 auto;text-align:center;padding:4px 0 18px}.hn-chat-head-title{margin:0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(25px,7vw,38px);font-weight:400;letter-spacing:.04em;text-transform:uppercase}.hn-chat-head-sub{margin:9px 0 0;color:rgba(244,241,232,.44);font-size:8px;letter-spacing:.22em;text-transform:uppercase}
      .hn-chat-list{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:4px 2px 18px;scrollbar-width:none}.hn-chat-list::-webkit-scrollbar{display:none}.hn-chat-day{text-align:center;margin:13px 0 10px;color:rgba(244,241,232,.30);font-size:8px;letter-spacing:.22em}.hn-chat-row{display:flex;margin:7px 0}.hn-chat-row.mine{justify-content:flex-end}.hn-chat-bubble{max-width:min(88%,560px);padding:10px 12px 8px;border:1px solid rgba(229,189,98,.22);background:#151a17!important;backdrop-filter:blur(7px);cursor:pointer;touch-action:pan-y;user-select:none}.hn-chat-row.mine .hn-chat-bubble{border-color:#d9b45f!important;background:#173a2b!important;box-shadow:inset 0 0 0 1px rgba(255,241,168,.05),0 4px 18px rgba(0,0,0,.12)}.hn-chat-bubble.hn-chat-selected{border-color:#f3d77c!important;box-shadow:0 0 0 1px rgba(229,189,98,.35),0 0 18px rgba(229,189,98,.1)}
      .hn-chat-sender{margin-bottom:5px;color:#d9b45f;font-size:8px;font-weight:500;letter-spacing:.16em;text-transform:uppercase}.hn-chat-text{color:#eee9df;font-size:14px;line-height:1.42;white-space:pre-wrap;overflow-wrap:anywhere;user-select:text}.hn-chat-time{margin-top:5px;color:rgba(244,241,232,.34);font-size:8px;text-align:right;letter-spacing:.08em}.hn-chat-quoted{margin-bottom:8px;padding:7px 9px;border-left:2px solid #d9b45f;background:rgba(229,189,98,.05)}.hn-chat-quoted-sender{color:#d9b45f;font-size:8px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;margin-bottom:3px}.hn-chat-quoted-text{color:rgba(244,241,232,.52);font-size:11px;line-height:1.3;white-space:pre-wrap;overflow:hidden;max-height:42px}
      .hn-chat-audio-label{display:flex;align-items:center;gap:8px;color:#eee9df;font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px}.hn-chat-audio-icon{color:#d9b45f;font-size:17px;line-height:1}.hn-chat-audio-player{width:min(100%,360px);display:flex;align-items:center;gap:9px}.hn-chat-audio-play{width:40px;height:40px;flex:0 0 40px;border:1px solid rgba(229,189,98,.50);border-radius:50%;background:rgba(0,0,0,.26);color:#f3d77c;display:flex;align-items:center;justify-content:center;font-size:17px;line-height:1;padding:0}.hn-chat-audio-progress{flex:1;min-width:50px;height:4px;appearance:none;-webkit-appearance:none;background:rgba(244,241,232,.16);accent-color:#d9b45f}.hn-chat-audio-duration{min-width:40px;color:rgba(244,241,232,.54);font-size:9px;font-variant-numeric:tabular-nums;text-align:right}.hn-chat-audio-native{display:none}
      .hn-chat-media-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin-top:3px}.hn-chat-media-item{position:relative;overflow:hidden;background:#090909;border:1px solid rgba(229,189,98,.14);min-height:100px}.hn-chat-media-item img{width:100%;height:100%;display:block;object-fit:cover;max-height:260px}.hn-chat-photo-button{display:block;width:100%;height:100%;padding:0;border:0;background:transparent;cursor:zoom-in}.hn-chat-photo-button img{width:100%;height:100%;display:block;object-fit:cover;max-height:260px}.hn-chat-bubble:has(.hn-chat-media-grid){padding:4px;width:fit-content;max-width:min(88%,560px)}
      .hn-chat-reply{flex:0 0 auto;display:none;align-items:stretch;border-top:1px solid rgba(229,189,98,.13);background:rgba(0,0,0,.18)}.hn-chat-reply.is-visible{display:flex}.hn-chat-reply-line{width:2px;flex:0 0 2px;background:#d9b45f}.hn-chat-reply-copy{flex:1;min-width:0;padding:8px 10px}.hn-chat-reply-label{color:#d9b45f;font-size:8px;font-weight:500;letter-spacing:.16em;text-transform:uppercase}.hn-chat-quoted-text{color:rgba(244,241,232,.52);font-size:11px}.hn-chat-reply-text{margin-top:4px;color:rgba(244,241,232,.6);font-size:11px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hn-chat-reply-close{width:42px;border:0;background:transparent;color:rgba(244,241,232,.6);font-size:18px}
      .hn-chat-compose{flex:0 0 auto;display:flex;flex-direction:column;gap:8px;padding-top:8px;border-top:1px solid rgba(229,189,98,.13)}.hn-chat-input-wrap{position:relative;width:100%}.hn-chat-input{width:100%;min-width:0;min-height:78px;max-height:150px;resize:none;box-sizing:border-box;padding:14px 106px 14px 12px;border:1px solid rgba(229,189,98,.34);border-radius:0;outline:none;background:rgba(0,0,0,.34);color:#eee9df;font-size:14px;line-height:1.4}.hn-chat-input::placeholder{color:rgba(244,241,232,.30)}.hn-chat-mic,.hn-chat-attach{position:absolute;bottom:9px;width:42px;height:42px;border:1px solid rgba(229,189,98,.50);border-radius:50%;background:rgba(0,0,0,.46);color:#d9b45f;display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1}.hn-chat-mic{right:9px}.hn-chat-attach{right:58px;font-size:19px}.hn-chat-mic.is-recording{border-color:#f3d77c;background:#6d1515;color:#f3d77c;animation:hnChatPulse 1.15s ease-in-out infinite}.hn-chat-mic:disabled,.hn-chat-attach:disabled{opacity:.45}.hn-chat-recording{display:none;align-items:center;justify-content:space-between;min-height:42px;padding:0 12px;border:1px solid rgba(229,189,98,.35);background:rgba(0,0,0,.34);color:#eee9df}.hn-chat-recording.is-visible{display:flex}.hn-chat-recording.is-pending{border-color:#d9b45f}.hn-chat-recording-status{color:#d9b45f;font-size:9px;font-weight:500;letter-spacing:.15em;text-transform:uppercase}.hn-chat-recording-time{font-variant-numeric:tabular-nums;font-size:13px;letter-spacing:.08em}.hn-chat-media-pending{display:none;gap:7px;overflow-x:auto;padding:4px 0}.hn-chat-media-pending.is-visible{display:flex}.hn-chat-pending-item{position:relative;width:72px;height:72px;flex:0 0 72px;border:1px solid rgba(229,189,98,.34);overflow:hidden;background:#111}.hn-chat-pending-item img{width:100%;height:100%;object-fit:cover}.hn-chat-pending-remove{position:absolute;top:3px;right:3px;width:22px;height:22px;border:1px solid #d9b45f;border-radius:50%;background:#111;color:#fff;font-size:14px;line-height:18px;padding:0}.hn-chat-send{width:100%;min-height:52px;border:1px solid #d9b45f;border-radius:0;background:rgba(0,0,0,.35);color:#f3d77c;font-size:10px;font-weight:500;letter-spacing:.16em;text-transform:uppercase}.hn-chat-send:disabled{opacity:.4}.hn-chat-empty{padding:45px 20px;text-align:center;color:rgba(244,241,232,.38);font-size:10px;letter-spacing:.18em;text-transform:uppercase}
      @keyframes hnChatPulse{0%,100%{box-shadow:0 0 0 0 rgba(243,215,124,0)}50%{box-shadow:0 0 0 6px rgba(243,215,124,.08)}}
    `;
  }

  async function loadChatSettings(){
    const sb=client();if(!sb)return;
    try{const {data,error}=await sb.rpc(SETTINGS_RPC);if(error)throw error;const row=Array.isArray(data)?data[0]:data;if(!row)return;chatSettings={max_media_files:Math.min(10,Math.max(1,Number(row.max_media_files)||MAX_MEDIA)),max_video_minutes:Math.min(60,Math.max(1,Number(row.max_video_minutes)||5))};}
    catch(error){console.warn('HAVANA NICE chat settings load failed:',error);}
  }

  function buildScreen(){
    if(chatScreen){wireModule();return;}
    chatScreen=document.createElement('section');chatScreen.id='hn-chat-screen';chatScreen.className='screen hn-chat-screen';chatScreen.setAttribute('aria-label','Chat de información');
    chatScreen.innerHTML=`<div class="hn-chat-wrap"><header class="hn-chat-head"><h1 class="hn-chat-head-title">CHAT DE INFORMACIÓN</h1><p class="hn-chat-head-sub">MENSAJES DEL EQUIPO</p></header><div class="hn-chat-list" aria-live="polite"></div><div class="hn-chat-reply"><div class="hn-chat-reply-line"></div><div class="hn-chat-reply-copy"><div class="hn-chat-reply-label"></div><div class="hn-chat-reply-text"></div></div><button class="hn-chat-reply-close" type="button" aria-label="Cancelar respuesta">×</button></div><form class="hn-chat-compose"><div class="hn-chat-input-wrap"><textarea class="hn-chat-input" maxlength="1000" placeholder="ESCRIBE UN MENSAJE" aria-label="Mensaje"></textarea><button class="hn-chat-attach" type="button" aria-label="Adjuntar fotos o videos">＋</button><button class="hn-chat-mic" type="button" aria-label="Grabar nota de voz">◉</button><input class="hn-chat-media-input" type="file" accept="image/*,video/*" multiple hidden></div><div class="hn-chat-media-pending"></div><div class="hn-chat-recording"><span class="hn-chat-recording-status">GRABANDO</span><span class="hn-chat-recording-time">00:00</span></div><button class="hn-chat-send" type="submit">ENVIAR</button></form></div>`;
    document.querySelector('.experience')?.appendChild(chatScreen);listEl=chatScreen.querySelector('.hn-chat-list');inputEl=chatScreen.querySelector('.hn-chat-input');sendEl=chatScreen.querySelector('.hn-chat-send');micEl=chatScreen.querySelector('.hn-chat-mic');mediaEl=chatScreen.querySelector('.hn-chat-media-input');
    chatScreen.querySelector('.hn-chat-reply-close').addEventListener('click',closeReply);chatScreen.querySelector('.hn-chat-compose').addEventListener('submit',sendMessage);micEl.addEventListener('click',toggleRecording);chatScreen.querySelector('.hn-chat-attach').addEventListener('click',()=>{if(!sending)mediaEl.click();});mediaEl.addEventListener('change',e=>{if(!sending)handleMediaFiles(e.target.files)});inputEl.addEventListener('input',()=>{inputEl.style.height='auto';inputEl.style.height=Math.min(inputEl.scrollHeight,150)+'px';updateSendState();});
    listEl.addEventListener('scroll',()=>{if(listEl.scrollTop<90)void loadOlderMessages();},{passive:true});
    ensureStyles();wireModule();void restoreHistory();subscribe();loadMessages();loadChatSettings();
  }

  function scrollToLatest(){
    if(!listEl||!chatScreen?.classList.contains('is-active'))return;
    const move=()=>{try{listEl.scrollTop=listEl.scrollHeight;}catch(_){}};
    requestAnimationFrame(()=>{move();requestAnimationFrame(move);});[80,250,600].forEach(delay=>setTimeout(move,delay));
    listEl.querySelectorAll('img').forEach(img=>{if(img.complete)return;if(img.dataset.hnScrollBound==='1')return;img.dataset.hnScrollBound='1';img.addEventListener('load',move,{once:true});});
  }

  function videoCardHtml(message,url,i){
    const poster=posterFor(message,i,url),playback=playbackFor(message,i,url);
    return `<div class="hn-chat-media-item hn-video-card-shell"><button class="hn-video-card" type="button" data-video-url="${esc(playback)}" data-poster-url="${esc(poster)}" aria-label="Reproducir video">${poster?`<img src="${esc(poster)}" alt="" loading="${i<2?'eager':'lazy'}" decoding="async">`:''}<span class="hn-video-card-fallback"><span class="hn-video-card-label">VIDEO</span></span><span class="hn-video-card-play-overlay">▶</span></button></div>`;
  }

  function render(forceBottom=false){
    if(!listEl)return;
    if(!messages.length&&!outgoing){releaseLocalImages(listEl);listEl.innerHTML='<div class="hn-chat-empty">AÚN NO HAY MENSAJES</div>';return;}
    const nearBottom=listEl.scrollHeight-listEl.scrollTop-listEl.clientHeight<120;
    const existing=new Map([...listEl.children].map(node=>[node.dataset.chatKey,node]));
    const desired=[];let lastDay='';
    messages.forEach((message,index)=>{
      const day=dayLabel(message.created_at);if(day!==lastDay){const key='day:'+day;const d=existing.get(key)||document.createElement('div');d.dataset.chatKey=key;d.className='hn-chat-day';d.textContent=day;desired.push(d);lastDay=day;}
      const key='message:'+message.id;
      const signature=JSON.stringify([message.id,message.profile_id,message.sender_name,message.message,message.created_at,message.message_type,message.audio_url,message.audio_duration,message.media_urls,message.media_types,message.media_posters,message.media_playback_urls,message.reply_to_message_id,replyPreview(getReplyTarget(message)),getReplyTarget(message)?.sender_name,currentProfile()?.id]);
      const previous=existing.get(key);if(previous?.dataset.chatSignature===signature){desired.push(previous);return;}
      const row=document.createElement('div');row.dataset.chatKey=key;row.dataset.chatSignature=signature;const mine=String(message.profile_id)===String(currentProfile()?.id||'');row.className='hn-chat-row'+(mine?' mine':'');
      const bubble=document.createElement('div');bubble.className='hn-chat-bubble';bubble.dataset.messageId=message.id;
      const reply=getReplyTarget(message);let body='';if(reply)body+=`<div class="hn-chat-quoted"><div class="hn-chat-quoted-sender">${esc(reply.sender_name||'MIEMBRO')}</div><div class="hn-chat-quoted-text">${esc(replyPreview(reply))}</div></div>`;
      if(message.message_type==='audio'&&message.audio_url){
        body+=`<div class="hn-chat-audio-label"><span class="hn-chat-audio-icon">◉</span><span>NOTA DE VOZ</span></div><div class="hn-chat-audio-player"><button class="hn-chat-audio-play" type="button" aria-label="Reproducir nota de voz">▶</button><input class="hn-chat-audio-progress" type="range" min="0" max="100" value="0" aria-label="Progreso del audio"><span class="hn-chat-audio-duration">00:00 / ${formatDuration(message.audio_duration)}</span><audio class="hn-chat-audio-native" preload="metadata" src="${esc(message.audio_url)}"></audio></div>`;
      }else if(message.message_type==='media'&&Array.isArray(message.media_urls)){
        body+=`<div class="hn-chat-media-grid">${message.media_urls.map((url,i)=>{const type=message.media_types?.[i]||'';return type.startsWith('image/')?`<div class="hn-chat-media-item"><button class="hn-chat-photo-button" type="button" data-photo-url="${esc(url)}"><img data-hn-photo-source="${esc(url)}" alt="Foto compartida" loading="${index>=messages.length-5?'eager':'lazy'}" decoding="async"></button></div>`:videoCardHtml(message,url,i);}).join('')}</div>`;
      }else body+=`<div class="hn-chat-text">${esc(message.message||'')}</div>`;
      body+=`<div class="hn-chat-time">${esc(message.sender_name||'MIEMBRO')} · ${formatTime(message.created_at)}</div>`;bubble.innerHTML=body;row.appendChild(bubble);desired.push(row);
    });
    if(outgoing)desired.push(outgoing);
    const keep=new Set(desired);[...listEl.children].forEach(node=>{if(!keep.has(node)){releaseLocalImages(node);node.remove();}});
    let cursor=listEl.firstChild;desired.forEach(node=>{if(node===cursor)cursor=cursor.nextSibling;else listEl.insertBefore(node,cursor);});
    wireMessageInteractions();wirePhotoCache();if(forceBottom||nearBottom)scrollToLatest();
  }

  function wireMessageInteractions(){
    if(!listEl)return;
    listEl.querySelectorAll('.hn-chat-bubble').forEach(bubble=>{if(bubble.dataset.hnInteractions==='1')return;bubble.dataset.hnInteractions='1';bubble.addEventListener('click',e=>{if(e.target.closest('audio,button,input'))return;if(bubble.dataset.hnSwiped==='1'){bubble.dataset.hnSwiped='0';return;}selectMessage(bubble.dataset.messageId);});let startX=0,startY=0,tracking=false;bubble.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;startX=e.clientX;startY=e.clientY;tracking=true;try{bubble.setPointerCapture(e.pointerId);}catch(_){}});bubble.addEventListener('pointermove',e=>{if(!tracking)return;const dx=e.clientX-startX,dy=e.clientY-startY;if(dx>12&&Math.abs(dx)>Math.abs(dy))bubble.style.transform=`translateX(${Math.min(dx,72)}px)`});const finish=e=>{if(!tracking)return;const dx=e.clientX-startX,dy=e.clientY-startY;tracking=false;bubble.style.transform='';if(dx>=55&&Math.abs(dx)>Math.abs(dy)*1.15){bubble.dataset.hnSwiped='1';selectMessage(bubble.dataset.messageId);}};bubble.addEventListener('pointerup',finish);bubble.addEventListener('pointercancel',()=>{tracking=false;bubble.style.transform='';});});
    listEl.querySelectorAll('.hn-chat-audio-player').forEach(box=>{if(box.dataset.hnInteractions==='1')return;box.dataset.hnInteractions='1';const audio=box.querySelector('audio'),play=box.querySelector('.hn-chat-audio-play'),bar=box.querySelector('.hn-chat-audio-progress'),duration=box.querySelector('.hn-chat-audio-duration');if(!audio||!play)return;const refresh=()=>{const dur=audio.duration||Number(audio.dataset.duration)||0;if(bar)bar.value=dur?(audio.currentTime/dur)*100:0;if(duration)duration.textContent=`${formatDuration(audio.currentTime)} / ${formatDuration(dur)}`;play.textContent=audio.paused?'▶':'❚❚';};play.addEventListener('click',e=>{e.stopPropagation();if(audio.paused)audio.play().catch(()=>{});else audio.pause();});audio.addEventListener('timeupdate',refresh);audio.addEventListener('loadedmetadata',refresh);audio.addEventListener('ended',refresh);bar?.addEventListener('input',e=>{e.stopPropagation();if(audio.duration)audio.currentTime=(Number(bar.value)/100)*audio.duration;});refresh();});
  }

  function pickAudioMime(){if(!window.MediaRecorder)return '';return ['audio/mp4;codecs=mp4a.40.2','audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t))||'';}
  function updateRecordingUI(){const box=chatScreen?.querySelector('.hn-chat-recording'),time=chatScreen?.querySelector('.hn-chat-recording-time');if(!box||!time)return;box.classList.add('is-visible');time.textContent=formatDuration((Date.now()-recordingStartedAt)/1000);}
  function stopRecordingTimer(){if(recordingTimer)clearInterval(recordingTimer);recordingTimer=null;}
  function resetRecordingUI(pending=false){stopRecordingTimer();const box=chatScreen?.querySelector('.hn-chat-recording'),time=chatScreen?.querySelector('.hn-chat-recording-time');if(box)box.classList.toggle('is-visible',pending);if(box)box.classList.toggle('is-pending',pending);if(time&&!pending)time.textContent='00:00';micEl?.classList.remove('is-recording');micEl?.setAttribute('aria-label','Grabar nota de voz');micEl?.setAttribute('title','Grabar nota de voz');if(pending){const status=chatScreen?.querySelector('.hn-chat-recording-status');if(status)status.textContent='NOTA DE VOZ LISTA';if(time)time.textContent=formatDuration(pendingVoice?.duration||0);}}
  function startRecording(){if(sending)return;if(pendingMedia.length){alert('Primero envía o elimina las fotos/videos seleccionados.');return;}if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){alert('Este dispositivo o navegador no permite grabar notas de voz.');return;}const mimeType=pickAudioMime();navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{audioChunks=[];mediaRecorder=mimeType?new MediaRecorder(stream,{mimeType}):new MediaRecorder(stream);recordingStartedAt=Date.now();micEl?.classList.add('is-recording');micEl?.setAttribute('aria-label','Detener grabación');micEl?.setAttribute('title','Detener grabación');updateRecordingUI();recordingTimer=setInterval(updateRecordingUI,250);mediaRecorder.ondataavailable=e=>{if(e.data?.size)audioChunks.push(e.data)};mediaRecorder.onerror=()=>{stream.getTracks().forEach(t=>t.stop());mediaRecorder=null;resetRecordingUI(false);alert('No se pudo grabar el audio.');};mediaRecorder.onstop=()=>{stopRecordingTimer();stream.getTracks().forEach(t=>t.stop());const duration=Math.max(1,Math.round((Date.now()-recordingStartedAt)/1000));const blob=new Blob(audioChunks,{type:mediaRecorder?.mimeType||mimeType||'audio/webm'});mediaRecorder=null;if(!blob.size)return;pendingVoice={blob,duration};resetRecordingUI(true);updateSendState();inputEl?.focus();};mediaRecorder.start();}).catch(error=>{console.error('HAVANA NICE microphone permission failed:',error);alert('Necesitamos permiso para usar el micrófono.');});}
  function stopRecording(){if(mediaRecorder&&mediaRecorder.state!=='inactive')mediaRecorder.stop();}
  function toggleRecording(){if(micEl?.disabled)return;if(mediaRecorder&&mediaRecorder.state==='recording')stopRecording();else startRecording();}
  function getVideoDuration(file){
    return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),video=document.createElement('video');let settled=false;const finish=(error,duration)=>{if(settled)return;settled=true;clearTimeout(timer);video.onloadedmetadata=null;video.onerror=null;video.removeAttribute('src');try{video.load()}catch(_){}URL.revokeObjectURL(url);if(error)reject(error);else resolve(duration)};const timer=setTimeout(()=>finish(new Error('No se pudo leer el video.')),10000);video.preload='metadata';video.muted=true;video.playsInline=true;video.onloadedmetadata=()=>{const d=Number(video.duration);finish(Number.isFinite(d)&&d>0?null:new Error('Duración no válida.'),d)};video.onerror=()=>finish(new Error('No se pudo leer el video.'));video.src=url;try{video.load()}catch(error){finish(error)}});
  }
  async function handleMediaFiles(fileList){
    const files=[...fileList];if(!files.length)return;if(pendingVoice){pendingVoice=null;resetRecordingUI(false);}
    const maxMedia=Math.min(10,Math.max(1,Number(chatSettings.max_media_files)||MAX_MEDIA));if(pendingMedia.length+files.length>maxMedia){alert(`Puedes subir máximo ${maxMedia} fotos/videos por envío.`);mediaEl.value='';return;}
    for(const file of files){if(!file.type.startsWith('image/')&&!file.type.startsWith('video/')){alert('Solo puedes subir fotos o videos.');continue;}if(file.type.startsWith('video/')){try{const duration=await getVideoDuration(file),maxSeconds=Math.min(60,Math.max(1,Number(chatSettings.max_video_minutes)||5))*60;if(!duration||duration>maxSeconds){alert(`El video "${file.name}" supera el máximo de ${Math.round(maxSeconds/60)} minutos.`);continue;}}catch(_){alert(`No se pudo revisar el video "${file.name}".`);continue;}}pendingMedia.push(file);}
    mediaEl.value='';renderPendingMedia();updateSendState();window.hnChatMediaV10?.paintPending?.();
  }
  function clearPendingPreviewUrls(){pendingPreviewUrls.forEach(url=>{try{URL.revokeObjectURL(url)}catch(_){}});pendingPreviewUrls=[];}
  function renderPendingMedia(){
    const box=chatScreen?.querySelector('.hn-chat-media-pending');if(!box)return;clearPendingPreviewUrls();if(!pendingMedia.length){box.classList.remove('is-visible');box.innerHTML='';return;}
    box.classList.add('is-visible');box.innerHTML=pendingMedia.map((file,i)=>{if(file.type.startsWith('video/'))return `<div class="hn-chat-pending-item hn-video-card-shell" data-media-index="${i}"><div class="hn-video-card-fallback"><span class="hn-video-card-label">VIDEO</span></div><button class="hn-chat-pending-remove" type="button" data-index="${i}" aria-label="Eliminar archivo">×</button></div>`;const url=URL.createObjectURL(file);pendingPreviewUrls.push(url);return `<div class="hn-chat-pending-item" data-media-index="${i}"><img src="${url}" alt="Vista previa"><button class="hn-chat-pending-remove" type="button" data-index="${i}" aria-label="Eliminar archivo">×</button></div>`;}).join('');
    box.querySelectorAll('.hn-chat-pending-remove').forEach(btn=>btn.addEventListener('click',()=>{if(sending)return;pendingMedia.splice(Number(btn.dataset.index),1);renderPendingMedia();updateSendState();window.hnChatMediaV10?.paintPending?.();}));
  }

  async function removeUploadedObjects(sb,bucket,paths){if(!sb||!paths?.length)return;try{const result=await sb.storage.from(bucket).remove(paths);if(result?.error)throw result.error;}catch(error){console.warn('HAVANA NICE orphan cleanup failed:',error);}}
  async function uploadVoiceNote(blob,duration){const sb=client(),p=currentProfile();if(!sb||!p?.id)throw new Error('Sesión no disponible.');const ext=blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':'webm';const path=`${p.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;const up=await sb.storage.from(AUDIO_BUCKET).upload(path,blob,{contentType:blob.type||'audio/webm',upsert:false});if(up.error)throw up.error;try{const {data}=sb.storage.from(AUDIO_BUCKET).getPublicUrl(path);const ins=await sb.from(CHAT_TABLE).insert({profile_id:p.id,sender_name:p.username||'MIEMBRO',message:'',message_type:'audio',audio_url:data.publicUrl,audio_duration:duration}).select(MESSAGE_FIELDS).single();if(ins.error)throw ins.error;clearOutgoing();mergeConfirmed(ins.data);}catch(error){await removeUploadedObjects(sb,AUDIO_BUCKET,[path]);throw error;}}
  async function uploadMedia(){
    const sb=client(),p=currentProfile(),files=pendingMedia.slice();if(!sb||!p?.id||!files.length)return;
    const urls=new Array(files.length),types=files.map(file=>file.type||''),posters=new Array(files.length).fill(''),playbacks=new Array(files.length).fill(''),paths=[];
    let next=0,failed=null,committed=false;
    const worker=async()=>{
      while(next<files.length&&!failed){
        const index=next++,file=files[index],ext=(file.name.split('.').pop()||'bin').toLowerCase(),path=`${p.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        try{
          const up=await sb.storage.from(MEDIA_BUCKET).upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});if(up.error)throw up.error;
          paths.push(path);urls[index]=sb.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;playbacks[index]=urls[index];
          if(file.type.startsWith('video/'))posters[index]=await window.hnChatMediaV10?.persistPoster?.(file,urls[index])||'';
        }catch(error){failed=error;}
      }
    };
    try{
      const concurrency=files.every(file=>file.type.startsWith('image/'))?Math.min(2,files.length):1;await Promise.all(Array.from({length:concurrency},worker));if(failed)throw failed;
      const ins=await sb.from(CHAT_TABLE).insert({profile_id:p.id,sender_name:p.username||'MIEMBRO',message:'',message_type:'media',media_urls:urls,media_types:types,media_posters:posters,media_playback_urls:playbacks}).select(MESSAGE_FIELDS).single();if(ins.error)throw ins.error;
      committed=true;if(String(p.id)!==activeProfileId)return;clearOutgoing();mergeConfirmed(ins.data);pendingMedia=[];clearPendingPreviewUrls();renderPendingMedia();window.hnChatMediaV10?.clearSelection?.();
    }catch(error){if(!committed)await removeUploadedObjects(sb,MEDIA_BUCKET,paths);throw error;}
  }
  function updateSendState(){if(!sendEl)return;sendEl.disabled=sending||!!mediaRecorder||(!String(inputEl?.value||'').trim()&&!pendingVoice&&!pendingMedia.length);}
  async function sendMessage(e){e.preventDefault();if(sending||(mediaRecorder&&mediaRecorder.state==='recording'))return;const sb=client(),p=currentProfile();if(!sb||!p?.id)return;if(!pendingVoice&&!pendingMedia.length&&!String(inputEl.value||'').trim())return;sending=true;sendEl.disabled=true;inputEl.disabled=true;micEl.disabled=true;showOutgoing();try{if(pendingVoice){const voice=pendingVoice;await uploadVoiceNote(voice.blob,voice.duration);pendingVoice=null;inputEl.value='';inputEl.style.height='auto';closeReply();resetRecordingUI(false);return;}if(pendingMedia.length){await uploadMedia();inputEl.value='';inputEl.style.height='auto';closeReply();return;}const text=String(inputEl.value||'').trim();if(!text)return;const payload={profile_id:p.id,sender_name:p.username||'MIEMBRO',message:text.slice(0,MAX_LENGTH),message_type:'text'};if(replyTarget?.id)payload.reply_to_message_id=replyTarget.id;const ins=await sb.from(CHAT_TABLE).insert(payload).select(MESSAGE_FIELDS).single();if(ins.error)throw ins.error;clearOutgoing();mergeConfirmed(ins.data);inputEl.value='';inputEl.style.height='auto';closeReply();}catch(error){console.error('HAVANA NICE chat send failed:',error);alert(error?.message||'No se pudo enviar.');}finally{sending=false;inputEl.disabled=false;micEl.disabled=false;clearOutgoing();updateSendState();inputEl?.focus();}}

  function updateUnread(){const module=ensureHomeModule();if(!module)return;const last=localStorage.getItem(readKey()),lastTime=last?Date.parse(last):NaN,count=Number.isNaN(lastTime)?messages.length:messages.filter(m=>Date.parse(m.created_at)>lastTime).length;let badge=module.querySelector('.hn-chat-unread');if(count<=0){if(badge)badge.remove();return;}if(!badge){badge=document.createElement('span');badge.className='hn-chat-unread';badge.style.cssText='position:absolute;top:10px;right:48px;min-width:19px;height:19px;padding:0 5px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#d9b45f;color:#020302;font-size:9px;font-weight:700;';module.appendChild(badge);}badge.textContent=count>99?'99+':String(count);badge.hidden=false;}
  function markRead(){try{localStorage.setItem(readKey(),new Date().toISOString());}catch(_){}updateUnread();}

  async function loadMessages(){
    const id=ensureChatIdentity(),sb=client();if(!id||!sb)return;if(loadFlight)return loadFlight;const revision=syncRevision;
    const task=(async()=>{try{
      const {data,error}=await sb.from(CHAT_TABLE).select(MESSAGE_FIELDS).order('created_at',{ascending:false}).limit(PAGE_SIZE);if(activeProfileId!==id)return;if(error){console.warn('HAVANA NICE chat load failed:',error);return;}
      const rows=new Map((data||[]).map(row=>[String(row.id),row]));for(const [key,change] of liveChanges){if(change.revision<=revision)continue;if(change.deleted)rows.delete(key);else rows.set(key,change.row);}
      messages=[...rows.values()].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));oldestLoadedAt=messages[0]?.created_at||null;hasMore=(data||[]).length===PAGE_SIZE;syncRevision++;syncedAt=Date.now();for(const [key,change] of liveChanges)if(change.revision<=revision)liveChanges.delete(key);persistHistory();render(!!chatScreen?.classList.contains('is-active'));updateUnread();
    }catch(error){console.warn('HAVANA NICE chat reconcile failed:',error);}})();
    loadFlight=task;try{await task;}finally{if(loadFlight===task)loadFlight=null;}
  }

  async function loadOlderMessages(){
    if(loadingOlder||!hasMore||!oldestLoadedAt||!listEl)return;const sb=client(),id=activeProfileId;if(!sb||!id)return;loadingOlder=true;
    const beforeHeight=listEl.scrollHeight,beforeTop=listEl.scrollTop;
    try{
      const {data,error}=await sb.from(CHAT_TABLE).select(MESSAGE_FIELDS).lt('created_at',oldestLoadedAt).order('created_at',{ascending:false}).limit(PAGE_SIZE);if(error)throw error;if(id!==activeProfileId)return;
      const older=(data||[]).reverse();if(!older.length){hasMore=false;return;}const known=new Set(messages.map(m=>String(m.id)));messages=[...older.filter(row=>!known.has(String(row.id))),...messages].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));oldestLoadedAt=messages[0]?.created_at||oldestLoadedAt;hasMore=(data||[]).length===PAGE_SIZE;persistHistory();render(false);
      requestAnimationFrame(()=>{const delta=listEl.scrollHeight-beforeHeight;listEl.scrollTop=Math.max(0,beforeTop+delta);});
    }catch(error){console.warn('HAVANA NICE older messages load failed:',error);}finally{loadingOlder=false;}
  }

  window.hnChatReconcile=()=>{if(Date.now()-syncedAt<1500)return;return loadMessages();};
  function subscribe(){const sb=client(),owner=ensureChatIdentity();if(!sb||!owner)return;clearTimeout(chatReconnectTimer);if(chatChannel){try{sb.removeChannel(chatChannel);}catch(_){}chatChannel=null;}chatChannel=sb.channel('hn-chat-realtime').on('postgres_changes',{event:'INSERT',schema:'public',table:CHAT_TABLE},payload=>{if(owner!==String(currentProfile()?.id||''))return;const row=payload.new;noteLiveChange(row);if(!messages.some(m=>String(m.id)===String(row.id))){messages.push(row);messages.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));persistHistory();render(true);}if(chatScreen?.classList.contains('is-active'))markRead();else updateUnread();}).on('postgres_changes',{event:'DELETE',schema:'public',table:CHAT_TABLE},payload=>{if(owner!==String(currentProfile()?.id||''))return;const id=payload.old?.id;if(!id)return;noteLiveChange({id},true);const had=messages.some(m=>String(m.id)===String(id));messages=messages.filter(m=>String(m.id)!==String(id));if(replyTarget?.id===id)closeReply();persistHistory();if(had)render();else updateUnread();}).on('postgres_changes',{event:'UPDATE',schema:'public',table:'chat_settings'},()=>{loadChatSettings();}).subscribe(status=>{if(status==='SUBSCRIBED'){chatReconnectDelay=1000;clearTimeout(chatReconnectTimer);void loadMessages();}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){clearTimeout(chatReconnectTimer);chatReconnectTimer=setTimeout(()=>subscribe(),chatReconnectDelay);chatReconnectDelay=Math.min(chatReconnectDelay*2,10000);}});}
  function closeReply(){replyTarget=null;chatScreen?.querySelector('.hn-chat-reply')?.classList.remove('is-visible');chatScreen?.querySelectorAll('.hn-chat-bubble.hn-chat-selected').forEach(el=>el.classList.remove('hn-chat-selected'));}
  function selectMessage(id){const message=messages.find(m=>String(m.id)===String(id));if(!message)return;replyTarget=message;chatScreen?.querySelectorAll('.hn-chat-bubble').forEach(el=>el.classList.toggle('hn-chat-selected',el.dataset.messageId===String(id)));const reply=chatScreen?.querySelector('.hn-chat-reply');if(reply){reply.classList.add('is-visible');const who=reply.querySelector('.hn-chat-reply-label'),text=reply.querySelector('.hn-chat-reply-text');if(who)who.textContent=`RESPONDER A ${message.sender_name||'MIEMBRO'}`;if(text)text.textContent=replyPreview(message);}inputEl?.focus();}
  function closeChat(fromButton=false){if(!chatScreen)return;if(mediaRecorder&&mediaRecorder.state==='recording'){try{mediaRecorder.stop();}catch(_){} }closeReply();chatScreen.classList.remove('is-active');if(previousScreen)previousScreen.classList.add('is-active');else document.getElementById('homeScreen')?.classList.add('is-active');const video=document.getElementById('backgroundVideo');if(video)video.muted=videoWasMuted;if(historyArmed&&fromButton){historyArmed=false;try{history.back();}catch(_){}}else if(!fromButton)historyArmed=false;}
  function openChat(fromPopState=false){buildScreen();previousScreen=document.querySelector('.screen.is-active:not(#hn-chat-screen)')||document.getElementById('homeScreen');document.querySelectorAll('.screen').forEach(s=>{if(s!==chatScreen)s.classList.remove('is-active')});chatScreen.classList.add('is-active');void restoreHistory();markRead();render(true);const video=document.getElementById('backgroundVideo');if(video){videoWasMuted=!!video.muted;video.muted=true;video.play().catch(()=>{});}if(!fromPopState&&!historyArmed){try{history.pushState({...history.state,hnChat:true},'',location.href);historyArmed=true;}catch(_){}}setTimeout(()=>inputEl?.focus(),250);}
  function wireModule(){const module=ensureHomeModule();if(!module||module.dataset.hnChatBound==='1')return;module.dataset.hnChatBound='1';module.addEventListener('click',()=>openChat());}
  window.addEventListener('popstate',()=>{if(historyArmed){historyArmed=false;closeChat(false);}});
  const observer=new MutationObserver(()=>wireModule());observer.observe(document.documentElement,{childList:true,subtree:true});
  function init(){if(initialized)return;initialized=true;ensureStyles();wireModule();window.addEventListener('hn:session-ready',()=>{void restoreHistory();subscribe();loadMessages();loadChatSettings();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
