/* HAVANA NICE — ADMIN SUMMARY REALTIME
   Realtime summary sync. Uses the authenticated Admin Supabase client
   when available and subscribes only to the tables that feed Summary.
*/
(function(){
  'use strict';
  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const SUPABASE_KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  let client=null,channel=null,started=false,reconnectTimer=null,refreshTimer=null;
  const $=id=>document.getElementById(id);
  async function getClient(){
    if(window.hnAdminSupabase&&typeof window.hnAdminSupabase.channel==='function'){
      client=window.hnAdminSupabase;
      return client;
    }
    if(client)return client;
    const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    client=mod.createClient(SUPABASE_URL,SUPABASE_KEY);
    return client;
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
      const [musicians,notifications,songs]=await Promise.all([
        c.rpc('admin_list_musicians'),
        c.rpc('admin_list_notifications'),
        c.rpc('admin_list_repertoire')
      ]);
      if(musicians.data&&$('statMusicians'))$('statMusicians').textContent=musicians.data.filter(x=>x.active).length;
      if(notifications.data&&$('statNotifications'))$('statNotifications').textContent=notifications.data.length;
      if(songs.data&&$('statSongs'))$('statSongs').textContent=songs.data.length;
      if(window.hnAdminSummaryRefresh)await window.hnAdminSummaryRefresh();
    }catch(e){console.warn('HN summary realtime refresh',e)}
  }
  function scheduleRefresh(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(refresh,0);
  }
  function bind(table){
    channel.on('postgres_changes',{event:'*',schema:'public',table},scheduleRefresh);
  }
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
  async function init(){
    if(started)return;
    started=true;
    await waitForAdminClient();
    await refresh();
    await subscribe();
    const script=document.createElement('script');script.src='./admin-storage-usage.js?v=e2d566f736cea380b96f85aceedf91929ebb75c5';document.body.appendChild(script);
  }
  function boot(){
    if(!document.getElementById('app'))return;
    init().catch(e=>console.warn('HN summary realtime init',e));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
