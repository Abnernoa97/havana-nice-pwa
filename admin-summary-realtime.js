/* HAVANA NICE — ADMIN SUMMARY REALTIME
   Keeps the existing Summary logic and makes every public database change
   refresh the counters immediately. No polling.
*/
(function(){
  'use strict';
  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const SUPABASE_KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  let client=null;
  let channel=null;
  let started=false;
  let timer=null;
  const $=id=>document.getElementById(id);
  async function getClient(){
    if(client)return client;
    const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    client=mod.createClient(SUPABASE_URL,SUPABASE_KEY);
    return client;
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
    clearTimeout(timer);
    timer=setTimeout(refresh,0);
  }
  async function subscribe(){
    const c=await getClient();
    if(channel){try{await c.removeChannel(channel)}catch(_) {}}
    channel=c.channel('hn-admin-summary-realtime')
      .on('postgres_changes',{event:'*',schema:'public'},scheduleRefresh)
      .subscribe(function(status){
        if(status==='SUBSCRIBED')scheduleRefresh();
        else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
          setTimeout(function(){if(started)subscribe().catch(e=>console.warn('HN summary realtime reconnect',e))},2500);
        }
      });
  }
  async function init(){
    if(started)return;
    started=true;
    await refresh();
    await subscribe();
  }
  function boot(){
    if(!document.getElementById('app'))return;
    init().catch(e=>console.warn('HN summary realtime init',e));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
