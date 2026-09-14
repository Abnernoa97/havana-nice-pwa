/* HAVANA NICE — ADMIN SUMMARY REALTIME */
(function(){
  'use strict';
  let client=null,channel=null,started=false,reconnectTimer=null,refreshTimer=null;
  const $=id=>document.getElementById(id);
  async function getClient(){
    if(window.hnAdminSupabase&&typeof window.hnAdminSupabase.channel==='function'){
      client=window.hnAdminSupabase;
      return client;
    }
    if(client)return client;
    throw new Error('Admin Supabase client unavailable');
  }
  async function waitForAdminClient(){
    for(let i=0;i<40;i++){
      if(window.hnAdminSupabase&&typeof window.hnAdminSupabase.channel==='function')return window.hnAdminSupabase;
      await new Promise(r=>setTimeout(r,250));
    }
    return getClient();
  }
  async function refresh(){
    try{
      const c=await getClient();
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
        let written=0,audio=0,photos=0,videos=0;
        (Array.isArray(chat.data)?chat.data:[]).forEach(m=>{
          if(m.message_type==='audio')audio++;
          else if(m.message_type==='media'){
            const urls=Array.isArray(m.media_urls)?m.media_urls:[];
            const types=Array.isArray(m.media_types)?m.media_types:[];
            urls.forEach((_,i)=>types[i]==='video'?videos++:photos++);
          }else written++;
        });
        (Array.isArray(notifications.data)?notifications.data:[]).forEach(n=>{
          if(Array.isArray(n.image_urls)&&n.image_urls.length)photos+=n.image_urls.length;
          else if(n.image_url)photos++;
        });
        if($('statChatWritten'))$('statChatWritten').textContent=written;
        if($('statChatAudio'))$('statChatAudio').textContent=audio;
        if($('statPhotos'))$('statPhotos').textContent=photos;
        if($('statVideos'))$('statVideos').textContent=videos;
      }
    }catch(e){console.warn('HN summary realtime refresh',e)}
  }
  function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,0)}
  function bind(table){channel.on('postgres_changes',{event:'*',schema:'public',table},scheduleRefresh)}
  async function subscribe(){
    const c=await waitForAdminClient();
    if(channel){try{await c.removeChannel(channel)}catch(_) {}}
    channel=c.channel('hn-admin-summary-realtime');
    ['notifications','repertoire_songs','calendar_events','calendar_event_recipients','chat_messages','musicians','musician_profiles','profiles'].forEach(bind);
    channel.subscribe(function(status){
      if(status==='SUBSCRIBED')scheduleRefresh();
      else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
        clearTimeout(reconnectTimer);
        reconnectTimer=setTimeout(function(){if(started)subscribe().catch(e=>console.warn('HN summary realtime reconnect',e))},2500);
      }
    });
  }
  async function init(){if(started)return;started=true;await waitForAdminClient();await refresh();await subscribe()}
  function boot(){if(!document.getElementById('app'))return;init().catch(e=>console.warn('HN summary realtime init',e))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
