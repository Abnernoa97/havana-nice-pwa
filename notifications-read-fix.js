/* HAVANA NICE — NOTIFICATIONS READ PERSISTENCE FIX */
(function(){
  'use strict';
  var READ_KEY='hn_notifications_read_v1';
  var CACHE_KEY='hn_notifications_cache_v1';

  function readJson(key,fallback){
    try{
      var raw=localStorage.getItem(key);
      var value=raw?JSON.parse(raw):fallback;
      return value===null||value===undefined?fallback:value;
    }catch(_){return fallback;}
  }

  function markCachedAsRead(){
    var cache=readJson(CACHE_KEY,[]);
    if(!Array.isArray(cache)||!cache.length)return;
    var read=readJson(READ_KEY,[]);
    if(!Array.isArray(read))read=[];
    var set=new Set(read);
    cache.forEach(function(item){if(item&&item.id)set.add(item.id)});
    try{localStorage.setItem(READ_KEY,JSON.stringify(Array.from(set)));}catch(_){ }
    try{
      if(typeof navigator.clearAppBadge==='function')navigator.clearAppBadge();
      else if(typeof navigator.setAppBadge==='function')navigator.setAppBadge(0);
    }catch(_){ }
    document.querySelectorAll('.hn-notify-badge').forEach(function(badge){
      badge.textContent='';
      badge.classList.remove('hn-notify-badge-visible');
      badge.style.display='none';
    });
  }

  function notificationScreenIsOpen(){
    var screen=document.getElementById('moduleScreen');
    return !!(screen&&screen.classList.contains('is-active')&&screen.querySelector('.hn-notify-screen'));
  }

  function check(){if(notificationScreenIsOpen())markCachedAsRead();}

  function init(){
    document.addEventListener('click',function(event){
      var module=event.target.closest&&event.target.closest('.module');
      if(module){
        var title=module.querySelector('.module-title');
        if(title&&title.textContent.trim().toUpperCase()==='NOTIFICACIONES')setTimeout(check,80);
      }
    },true);
    var observer=new MutationObserver(function(){check();});
    observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(check,100);});
    setTimeout(check,250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
