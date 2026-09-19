/* HAVANA NICE — CHAT PERSISTED VIDEO POSTER V1
   Deterministic video thumbnails after app restart.
   Every confirmed video first tries its tiny persisted JPG stored beside the video.
   The full video is not decoded just to paint the chat card.
*/
(function(){
  'use strict';

  const STYLE_ID='hn-persisted-video-poster-style';
  const VIDEO_SELECTOR='#hn-chat-screen .hn-chat-row[data-chat-key^="message:"] .hn-chat-media-item video';
  let observer=null;

  function sourceUrl(video){return String(video?.getAttribute('src')||video?.currentSrc||video?.src||'').trim()}
  function posterUrl(videoUrl){
    try{
      const url=new URL(videoUrl);
      if(!/^https?:$/.test(url.protocol))return '';
      url.pathname=url.pathname+'.poster.jpg';
      url.search='';url.hash='';
      return url.toString();
    }catch(_){return ''}
  }

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #hn-chat-screen .hn-chat-media-item{position:relative!important;overflow:hidden!important;background:#090909!important}
      #hn-chat-screen .hn-persisted-video-poster{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:contain!important;background:#090909!important;z-index:6!important;pointer-events:none!important;opacity:0;transition:opacity .08s linear}
      #hn-chat-screen .hn-persisted-video-poster.is-ready{opacity:1}
      #hn-chat-screen .hn-persisted-video-play{position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;z-index:7!important;width:52px!important;height:52px!important;border-radius:50%!important;display:none!important;align-items:center!important;justify-content:center!important;background:rgba(0,0,0,.48)!important;border:1px solid rgba(255,255,255,.38)!important;color:#fff!important;font:700 24px/1 Arial,sans-serif!important;padding-left:3px!important;box-sizing:border-box!important;pointer-events:none!important}
      #hn-chat-screen .hn-persisted-video-play.is-ready{display:flex!important}
    `;
    document.head.appendChild(style);
  }

  function removeDirectPoster(video){
    const item=video?.closest('.hn-chat-media-item');if(!item)return;
    item.querySelector('.hn-persisted-video-poster')?.remove();
    item.querySelector('.hn-persisted-video-play')?.remove();
  }

  function bind(video){
    if(!video?.isConnected)return;
    const src=sourceUrl(video),poster=posterUrl(src);if(!poster)return;
    if(video.dataset.hnPersistedPosterSource===src&&video.closest('.hn-chat-media-item')?.querySelector('.hn-persisted-video-poster'))return;

    removeDirectPoster(video);
    video.dataset.hnPersistedPosterSource=src;
    video.preload='none';
    video.setAttribute('poster',poster);

    const item=video.closest('.hn-chat-media-item');if(!item)return;
    const image=document.createElement('img');
    image.className='hn-persisted-video-poster';
    image.alt='Vista previa del video';
    image.decoding='async';
    image.loading='eager';

    const play=document.createElement('span');
    play.className='hn-persisted-video-play';
    play.setAttribute('aria-hidden','true');
    play.textContent='▶';

    image.addEventListener('load',()=>{
      if(!image.isConnected||sourceUrl(video)!==src)return;
      image.classList.add('is-ready');
      play.classList.add('is-ready');
    },{once:true});
    image.addEventListener('error',()=>{
      if(sourceUrl(video)===src)video.removeAttribute('poster');
      image.remove();play.remove();
    },{once:true});

    video.addEventListener('play',()=>{image.classList.remove('is-ready');play.classList.remove('is-ready')});
    video.addEventListener('pause',()=>{if(image.complete&&image.naturalWidth){image.classList.add('is-ready');play.classList.add('is-ready')}});

    item.appendChild(image);item.appendChild(play);
    image.src=poster;
  }

  function scan(root=document){
    if(root instanceof HTMLVideoElement&&root.matches(VIDEO_SELECTOR))bind(root);
    const scope=root?.querySelectorAll?root:document;
    scope.querySelectorAll?.(VIDEO_SELECTOR).forEach(bind);
  }

  function install(){
    installStyles();scan();
    if(!observer){
      observer=new MutationObserver(mutations=>{
        for(const mutation of mutations){
          for(const node of mutation.addedNodes){if(node instanceof Element)scan(node.parentElement||node)}
        }
      });
      observer.observe(document.documentElement,{childList:true,subtree:true});
    }
    window.hnRefreshPersistedVideoPosters=root=>scan(root||document);
    window.addEventListener('hn:session-ready',()=>setTimeout(()=>scan(document),60));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
