/* HAVANA NICE — CHAT VIDEO PROCESSING V1
   Bridges Chat Media V10 with the server-side FFmpeg worker.
   New video messages trigger processing; playback URL updates reconcile in realtime.
*/
(function(){
  'use strict';
  if(window.__hnChatVideoProcessingV1)return;
  window.__hnChatVideoProcessingV1=true;

  const TABLE='chat_messages';
  let channel=null,owner='';

  const client=()=>window.hnSupabase||window.hnMusicianSupabase||window.supabaseClient||window.supabase||null;
  const profile=()=>{try{return JSON.parse(sessionStorage.getItem('hn_profile')||'null')}catch(_){return null}};

  function queueFromRow(row){
    const p=profile();
    if(!p?.id||String(row?.profile_id||'')!==String(p.id)||row?.message_type!=='media')return;
    const urls=Array.isArray(row.media_urls)?row.media_urls:[];
    const types=Array.isArray(row.media_types)?row.media_types:[];
    const playbacks=Array.isArray(row.media_playback_urls)?row.media_playback_urls:[];
    const statuses=Array.isArray(row.media_statuses)?row.media_statuses:[];
    urls.forEach((url,index)=>{
      if(!String(types[index]||'').startsWith('video/'))return;
      const playback=String(playbacks[index]||'');
      const status=String(statuses[index]||'');
      if(status==='ready'&&playback&&playback!==url)return;
      window.hnChatMediaV10?.queueTranscode?.(String(url));
    });
  }

  function applyPlaybackUpdate(row){
    const urls=Array.isArray(row?.media_urls)?row.media_urls:[];
    const playbacks=Array.isArray(row?.media_playback_urls)?row.media_playback_urls:[];
    urls.forEach((url,index)=>{
      const playback=String(playbacks[index]||'');
      if(!playback||playback===url)return;
      document.querySelectorAll('.hn-video-card').forEach(button=>{
        if(String(button.dataset.videoUrl||'')===String(url))button.dataset.videoUrl=playback;
      });
    });
    setTimeout(()=>{try{window.hnChatReconcile?.()}catch(_){}},120);
    setTimeout(()=>{try{window.hnChatReconcile?.()}catch(_){}},1800);
  }

  function stop(){
    const sb=client();
    if(channel&&sb){try{sb.removeChannel(channel)}catch(_){}}
    channel=null;owner='';
  }

  function start(){
    const sb=client(),p=profile();
    if(!sb||!p?.id)return;
    const id=String(p.id);
    if(channel&&owner===id)return;
    stop();owner=id;
    channel=sb.channel('hn-chat-video-processing-'+id.slice(0,8))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:TABLE},payload=>{
        if(owner!==String(profile()?.id||''))return;
        queueFromRow(payload.new);
      })
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:TABLE},payload=>{
        if(owner!==String(profile()?.id||''))return;
        const row=payload.new;
        if(String(row?.profile_id||'')!==owner)return;
        applyPlaybackUpdate(row);
      })
      .subscribe();
  }

  function init(){
    window.addEventListener('hn:session-ready',start);
    window.addEventListener('hn:session-logout',stop);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)start()});
    start();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
