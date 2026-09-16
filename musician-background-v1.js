/* HAVANA NICE — MUSICIAN GLOBAL BACKGROUND V3
   Global background for every musician. Realtime primary.
   Does not depend on another module exposing a Supabase client.
*/
(function(){
  'use strict';

  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const SUPABASE_KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  const TABLE='app_background_config';
  const BUCKET='musician-backgrounds';
  const FALLBACK='./Video.Guru_20260908-142707130.mp4';

  let supabaseClient=null;
  let channel=null;
  let lastPath=null;

  function apply(path,type){
    const video=document.getElementById('backgroundVideo');
    if(!video)return;

    if(type==='image'&&path){
      video.style.display='none';
      let image=document.getElementById('backgroundImage');
      if(!image){
        image=document.createElement('img');
        image.id='backgroundImage';
        image.className='background-video';
        image.alt='';
        image.setAttribute('aria-hidden','true');
        video.parentNode.insertBefore(image,video);
      }
      if(image.src!==path)image.src=path;
      image.style.display='block';
      return;
    }

    const image=document.getElementById('backgroundImage');
    if(image)image.style.display='none';
    video.style.display='block';

    const next=path||FALLBACK;
    if(video.getAttribute('data-hn-bg-path')===next)return;

    video.setAttribute('data-hn-bg-path',next);
    lastPath=next;

    const wasMuted=video.muted;
    const wasPlaying=!video.paused;
    video.src=next;
    video.load();
    video.muted=wasMuted;

    const play=function(){
      if(wasPlaying||document.visibilityState!=='hidden'){
        const p=video.play();
        if(p&&p.catch)p.catch(function(){});
      }
    };
    if(video.readyState>=2)play();
    else video.addEventListener('loadeddata',play,{once:true});
  }

  async function refresh(){
    if(!supabaseClient)return;

    const {data,error}=await supabaseClient
      .from(TABLE)
      .select('storage_path,media_type,active,updated_at')
      .eq('id',1)
      .eq('active',true)
      .maybeSingle();

    if(error||!data||!data.storage_path){
      if(lastPath!==FALLBACK)apply(FALLBACK,'video');
      return;
    }

    const {data:urlData}=supabaseClient
      .storage
      .from(BUCKET)
      .getPublicUrl(data.storage_path);

    const publicUrl=urlData?.publicUrl||'';
    if(!publicUrl){
      apply(FALLBACK,'video');
      return;
    }

    apply(publicUrl,data.media_type||'video');
  }

  function subscribe(){
    if(channel||!supabaseClient)return;

    channel=supabaseClient
      .channel('hn-app-background')
      .on('postgres_changes',{event:'*',schema:'public',table:TABLE,filter:'id=eq.1'},function(){
        refresh();
      })
      .subscribe(function(status){
        if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
          try{if(channel)supabaseClient.removeChannel(channel)}catch(_){}
          channel=null;
          setTimeout(subscribe,1500);
        }
      });
  }

  async function init(){
    try{
      const m=await import('https://esm.sh/@supabase/supabase-js@2');
      supabaseClient=m.createClient(SUPABASE_URL,SUPABASE_KEY);
      await refresh();
      subscribe();
    }catch(error){
      console.warn('[HN background]',error);
      apply(FALLBACK,'video');
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
