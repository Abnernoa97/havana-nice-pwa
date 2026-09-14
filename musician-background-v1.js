/* HAVANA NICE — MUSICIAN GLOBAL BACKGROUND V1
   Isolated background listener. Default video remains the fallback.
*/
(function(){
  'use strict';
  const TABLE='musician_backgrounds';
  const BUCKET='musician-backgrounds';
  const FALLBACK='./Video.Guru_20260908-142707130.mp4';
  const SUPABASE_URL=['https://xzfradccsxonmauinecl.','supabase.co'].join('');
  const SUPABASE_KEY=['sb_publishable_','Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9'].join('');
  let supabaseClient=null;
  let channel=null;

  function apply(path,type){
    const video=document.getElementById('backgroundVideo');
    if(!video)return;
    if(type==='image'){
      video.style.display='none';
      let image=document.getElementById('backgroundImage');
      if(!image){image=document.createElement('img');image.id='backgroundImage';image.className='background-video';image.alt='';image.setAttribute('aria-hidden','true');video.parentNode.insertBefore(image,video)}
      image.src=path;
      image.style.display='block';
      return;
    }
    const image=document.getElementById('backgroundImage');
    if(image)image.style.display='none';
    video.style.display='block';
    if(video.getAttribute('data-hn-bg-path')===path)return;
    video.setAttribute('data-hn-bg-path',path);
    const wasMuted=video.muted;
    const wasPlaying=!video.paused;
    video.src=path;
    video.load();
    video.muted=wasMuted;
    if(wasPlaying){const p=video.play();if(p&&p.catch)p.catch(function(){})}
  }

  async function refresh(){
    if(!supabaseClient)return;
    const {data,error}=await supabaseClient.from(TABLE).select('storage_path,media_type,updated_at').eq('active',true).order('updated_at',{ascending:false}).limit(1);
    if(error||!data||!data.length){apply(FALLBACK,'video');return}
    const row=data[0];
    const {data:urlData}=supabaseClient.storage.from(BUCKET).getPublicUrl(row.storage_path);
    if(!urlData?.publicUrl){apply(FALLBACK,'video');return}
    apply(urlData.publicUrl,row.media_type);
  }

  function subscribe(){
    if(channel||!supabaseClient)return;
    channel=supabaseClient.channel('hn-musician-background')
      .on('postgres_changes',{event:'*',schema:'public',table:TABLE},function(){refresh()})
      .subscribe(function(status){
        if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
          channel=null;
          setTimeout(subscribe,1500);
        }
      });
  }

  async function init(){
    if(window.hnMusicianSupabase){supabaseClient=window.hnMusicianSupabase;refresh();subscribe();return}
    try{
      const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      supabaseClient=mod.createClient(SUPABASE_URL,SUPABASE_KEY);
      refresh();
      subscribe();
    }catch(e){
      console.warn('HAVANA NICE background listener unavailable',e);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
