/* HAVANA NICE — MUSICIAN GLOBAL BACKGROUND V2
   Single global background listener. Default video remains the fallback.
*/
(function(){
  'use strict';

  const TABLE = 'app_background_config';
  const BUCKET = 'musician-backgrounds';
  const FALLBACK = './Video.Guru_20260908-142707130.mp4';

  let supabaseClient = null;
  let channel = null;

  function apply(path, type){
    const video = document.getElementById('backgroundVideo');
    if(!video) return;

    if(type === 'image' && path){
      video.style.display = 'none';

      let image = document.getElementById('backgroundImage');

      if(!image){
        image = document.createElement('img');
        image.id = 'backgroundImage';
        image.className = 'background-video';
        image.alt = '';
        image.setAttribute('aria-hidden','true');
        video.parentNode.insertBefore(image, video);
      }

      if(image.src !== path) image.src = path;
      image.style.display = 'block';
      return;
    }

    const image = document.getElementById('backgroundImage');
    if(image) image.style.display = 'none';

    video.style.display = 'block';

    if(video.getAttribute('data-hn-bg-path') === path) return;

    video.setAttribute('data-hn-bg-path', path);

    const wasMuted = video.muted;
    const wasPlaying = !video.paused;

    video.src = path || FALLBACK;
    video.load();
    video.muted = wasMuted;

    if(wasPlaying){
      const p = video.play();
      if(p && p.catch) p.catch(function(){});
    }
  }

  async function refresh(){
    if(!supabaseClient) return;

    const {data, error} = await supabaseClient
      .from(TABLE)
      .select('storage_path,media_type,active,updated_at')
      .eq('id',1)
      .eq('active',true)
      .maybeSingle();

    if(error || !data || !data.storage_path){
      apply(FALLBACK,'video');
      return;
    }

    const {data:urlData} = supabaseClient
      .storage
      .from(BUCKET)
      .getPublicUrl(data.storage_path);

    apply(
      urlData?.publicUrl || FALLBACK,
      urlData?.publicUrl ? data.media_type : 'video'
    );
  }

  function subscribe(){
    if(channel || !supabaseClient) return;

    channel = supabaseClient
      .channel('hn-app-background')
      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:TABLE,
          filter:'id=eq.1'
        },
        function(){
          refresh();
        }
      )
      .subscribe(function(status){
        if(
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ){
          channel = null;
          setTimeout(subscribe,1500);
        }
      });
  }

  async function init(){
    supabaseClient = window.hnMusicianSupabase;

    if(!supabaseClient){
      setTimeout(init,500);
      return;
    }

    await refresh();
    subscribe();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }

})();
