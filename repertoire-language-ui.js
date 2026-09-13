(function(){
  'use strict';
  function apply(){
    var inner=document.querySelector('.hn-rep-screen');
    if(!inner)return;
    var songs=[].slice.call(inner.querySelectorAll('.hn-r-song'));
    if(!songs.length)return;
    var old=[].slice.call(inner.querySelectorAll('.hn-r-category'));old.forEach(function(x){x.remove()});
    var english=[],spanish=[];
    songs.forEach(function(song){
      var title=(song.querySelector('.hn-r-title')||{}).textContent||'';
      var lang=song.getAttribute('data-language');
      (String(lang).toUpperCase()==='ESPAÑOL'?spanish:english).push(song);
    });
    var back=inner.querySelector('.hn-r-back');
    function group(label,list){
      if(!list.length)return;
      var h=document.createElement('div');h.className='hn-r-category';h.textContent=label;
      if(back)inner.insertBefore(h,back);else inner.appendChild(h);
      list.forEach(function(x){if(back)inner.insertBefore(x,back);else inner.appendChild(x)});
    }
    group('ENGLISH',english);group('ESPAÑOL',spanish);
  }
  var t=null;function schedule(){clearTimeout(t);t=setTimeout(apply,80)}
  document.addEventListener('DOMContentLoaded',schedule);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})();
