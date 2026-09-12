/* HAVANA NICE — CHAT SETTINGS BRIDGE V3 */
(() => {
  'use strict';
  if (window.__hnChatThemeV3) return;
  window.__hnChatThemeV3 = true;

  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const KEY='sb_publishable_Ip5rGK0UVIfXOfjs_RQ_LhA_c14foHN9';
  const RPC_URL=`${SUPABASE_URL}/rest/v1/rpc/get_chat_settings`;
  let settings=null, sb=null, channel=null;

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

  load();
  realtime();
  setInterval(()=>{
    load();
    wireLimits();
    wireChatBackground();
  },60000);
})();