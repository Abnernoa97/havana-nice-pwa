/* HAVANA NICE — ADMIN SUMMARY REALTIME
   Realtime Summary sync. Reuses the authenticated Admin Supabase client.
   No polling and no global schema subscription.
*/
(function(){
  'use strict';
  let client=null,channel=null,started=false,reconnectTimer=null,refreshTimer=null;
  const $=id=>document.getElementById(id);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  async function waitForAdminClient(){
    for(let i=0;i<40;i++){
      if(window.hnAdminSupabase&&typeof window.hnAdminSupabase.channel==='function'){
        client=window.hnAdminSupabase;
        return client;
      }
      await sleep(250);
    }
    throw new Error('Admin Supabase client unavailable');
  }

  async function refresh(){
    try{
      const c=client||await waitForAdminClient();
      const [musicians,notifications,songs,events,chat]=await Promise.all([
        c.rpc('admin_list_musicians'),
        c.rpc('admin_list_notifications'),
        c.rpc('admin_list_repertoire'),
        c.rpc('admin_list_calendar_events'),
        c.rpc('admin_list_chat_messages')
      ]);
      if(musicians.data&&$('statMusicians'))$('statMusicians').textContent=musicians.data.filter(x=>x.active).length;
      if(notifications.data&&$('statNotifications'))$('statNotifications').textContent=notifications.data.length;
      if(songs.data&&$('statSongs'))$('statSongs').textContent=songs.data.length;
      if(events.data&&$('statEvents'))$('statEvents').textContent=events.data.length;
      if(chat.data){
        const rows=chat.data||[];
        const audio=rows.filter(x=>String(x.message_type||'').toLowerCase()==='audio').length;
        const media=rows.filter(x=>String(x.message_type||'').toLowerCase()==='media');
        const videos=media.filter(x=>String(x.media_type||x.mime_type||x.file_type||'').toLowerCase().includes('video')).length;
        const photos=media.length-videos;
        const written=rows.length-audio-media.length;
        if($('statChatWritten'))$('statChatWritten').textContent=written;
        if($('statChatAudio'))$('statChatAudio').textContent=audio;
        if($('statPhotos'))$('statPhotos').textContent=photos;
        if($('statVideos'))$('statVideos').textContent=videos;
      }
    }catch(e){console.warn('HN summary realtime refresh',e)}
  }

  function scheduleRefresh(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(refresh,0);
  }

  async function subscribe(){
    const c=client||await waitForAdminClient();
    if(channel){try{await c.removeChannel(channel)}catch(_) {}}
    channel=c.channel('hn-admin-summary-realtime');
    ['notifications','repertoire_songs','calendar_events','calendar_event_recipients','chat_messages'].forEach(table=>{
      channel.on('postgres_changes',{event:'*',schema:'public',table},scheduleRefresh);
    });
    channel.subscribe(function(status){
      if(status==='SUBSCRIBED')scheduleRefresh();
      else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
        clearTimeout(reconnectTimer);
        reconnectTimer=setTimeout(function(){if(started)subscribe().catch(e=>console.warn('HN summary realtime reconnect',e))},2500);
      }
    });
  }

  async function init(){
    if(started)return;
    started=true;
    client=await waitForAdminClient();
    await refresh();
    await subscribe();
  }

  function boot(){
    if(!document.getElementById('app'))return;
    init().catch(e=>console.warn('HN summary realtime init',e));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
