/* HAVANA NICE — CHAT SETTINGS BRIDGE V2 */
(() => {
  'use strict';
  if (window.__hnChatThemeV2) return;
  window.__hnChatThemeV2 = true;
  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  const RPC_URL=`${SUPABASE_URL}/rest/v1/rpc/get_chat_settings`;
  let settings=null, sb=null, channel=null;
  const validColor=v=>/^#[0-9a-fA-F]{6}$/.test(v||'');
  async function load(){
    try{
      const r=await fetch(RPC_URL,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},body:'{}'});
      if(!r.ok)return;
      const data=await r.json();
      settings=Array.isArray(data)?data[0]:data;
      if(settings)apply();
    }catch(e){console.warn('HN chat settings',e)}
  }
  function apply(){
    const s=settings;if(!s)return;
    const bg=validColor(s.background_color)?s.background_color:'#020302',own=validColor(s.own_bubble_color)?s.own_bubble_color:'#0d5a3d',other=validColor(s.other_bubble_color)?s.other_bubble_color:'#171717',accent=validColor(s.accent_color)?s.accent_color:'#e5bd62',text=validColor(s.text_color)?s.text_color:'#f4f1e8';
    let style=document.getElementById('hn-chat-live-settings');
    if(!style){style=document.createElement('style');style.id='hn-chat-live-settings';document.head.appendChild(style)}
    style.textContent=`#hn-chat-screen{--hn-chat-bg:${bg};--hn-chat-own:${own};--hn-chat-other:${other};--hn-chat-accent:${accent};--hn-chat-text:${text};background:${bg}!important}#hn-chat-screen .hn-chat-wrap{background:${bg}!important}#hn-chat-screen .hn-chat-bubble{border-color:${accent}55!important;background:${other}!important}#hn-chat-screen .hn-chat-row.mine .hn-chat-bubble{background:${own}!important;border-color:${accent}!important}#hn-chat-screen .hn-chat-sender,#hn-chat-screen .hn-chat-audio-icon,#hn-chat-screen .hn-chat-recording-status,#hn-chat-screen .hn-chat-reply-label{color:${accent}!important}#hn-chat-screen .hn-chat-text,#hn-chat-screen .hn-chat-audio-label,#hn-chat-screen .hn-chat-input,#hn-chat-screen .hn-chat-recording,#hn-chat-screen .hn-chat-send,#hn-chat-screen .hn-chat-head-title{color:${text}!important}#hn-chat-screen .hn-chat-input{border-color:${accent}73!important}#hn-chat-screen .hn-chat-send{border-color:${accent}!important;color:${text}!important}#hn-chat-screen .hn-chat-list{background:${bg}!important}`;
    wireLimits();
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
      const maxSeconds=maxMinutes*60;
      const videos=files.filter(f=>f.type.startsWith('video/'));
      if(videos.length){let rejected=false;for(const file of videos){const url=URL.createObjectURL(file),v=document.createElement('video');v.preload='metadata';v.onloadedmetadata=()=>{const tooLong=(Number(v.duration)||0)>maxSeconds;URL.revokeObjectURL(url);if(tooLong&&!rejected){rejected=true;input.value='';alert(`Los videos pueden durar máximo ${maxMinutes} minutos.`)}};v.onerror=()=>URL.revokeObjectURL(url);v.src=url;}}
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
  const observer=new MutationObserver(()=>{if(document.querySelector('#hn-chat-screen')){apply();}});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  load();realtime();setInterval(load,60000);
})();