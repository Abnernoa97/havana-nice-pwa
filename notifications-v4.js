(function(){
  'use strict';
  var SUPABASE='https://xzfradccsxonmauinecl.supabase.co';
  var KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  var API=SUPABASE+'/rest/v1/notifications?select=id,title,message,created_at&order=created_at.desc';
  var items=[];
  var firstLoad=true;
  var lastTopId=null;

  function addStyle(){
    if(document.getElementById('hnNotifyStyle')) return;
    var s=document.createElement('style'); s.id='hnNotifyStyle';
    s.textContent='#hnNotificationsRoot{position:fixed;right:18px;top:74px;z-index:99999;font-family:Arial,sans-serif}#hnNotifyButton{width:46px;height:46px;border:1px solid rgba(229,189,98,.72);background:rgba(0,0,0,.82);color:#fff1a8;border-radius:50%;font-size:20px;position:relative;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.35)}#hnNotifyCount{position:absolute;right:-3px;top:-4px;min-width:17px;height:17px;padding:0 4px;border-radius:10px;background:#e5bd62;color:#020302;font:700 9px/17px Arial;text-align:center;display:none}#hnNotifyPanel{position:fixed;right:18px;top:132px;width:min(350px,calc(100vw - 36px));max-height:65vh;overflow:auto;border:1px solid rgba(229,189,98,.65);background:rgba(2,3,2,.97);display:none;box-shadow:0 18px 60px rgba(0,0,0,.55)}#hnNotifyPanel.open{display:block}.hn-n-head{padding:18px;border-bottom:1px solid rgba(229,189,98,.22);font:14px Georgia,serif;letter-spacing:.18em;color:#fff1a8;text-transform:uppercase}.hn-n-item{padding:17px 18px;border-bottom:1px solid rgba(255,255,255,.08)}.hn-n-title{color:#f4f1e8;font-size:12px;letter-spacing:.12em;text-transform:uppercase}.hn-n-message{margin-top:8px;color:rgba(244,241,232,.72);font-size:12px;line-height:1.5}.hn-n-date{margin-top:9px;color:rgba(244,241,232,.36);font-size:8px;letter-spacing:.12em;text-transform:uppercase}.hn-n-empty{padding:24px 18px;color:rgba(244,241,232,.42);font-size:10px;letter-spacing:.12em;text-transform:uppercase;text-align:center}';
    document.head.appendChild(s);
  }

  function el(tag,cls,text){var x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;}
  function build(){
    if(document.getElementById('hnNotificationsRoot')) return;
    addStyle();
    var root=el('div');root.id='hnNotificationsRoot';root.style.display='none';
    var btn=el('button');btn.id='hnNotifyButton';btn.setAttribute('aria-label','Notifications');btn.textContent='♢';
    var count=el('span');count.id='hnNotifyCount';btn.appendChild(count);
    var panel=el('div');panel.id='hnNotifyPanel';
    panel.appendChild(el('div','hn-n-head','Notifications'));
    panel.appendChild(el('div','hn-n-empty','Loading...')).id='hnNotifyList';
    root.appendChild(btn);root.appendChild(panel);document.body.appendChild(root);
    btn.addEventListener('click',function(){panel.classList.toggle('open');});
  }
  function render(){
    var list=document.getElementById('hnNotifyList'),count=document.getElementById('hnNotifyCount');if(!list||!count)return;
    count.textContent=items.length>99?'99+':String(items.length);count.style.display=items.length?'block':'none';
    list.innerHTML='';
    if(!items.length){list.appendChild(el('div','hn-n-empty','No notifications'));return;}
    items.forEach(function(n){var a=el('article','hn-n-item');a.appendChild(el('div','hn-n-title',n.title||''));a.appendChild(el('div','hn-n-message',n.message||''));a.appendChild(el('div','hn-n-date',new Date(n.created_at).toLocaleString()));list.appendChild(a);});
  }
  async function load(){
    try{
      var r=await fetch(API,{headers:{apikey:KEY,Authorization:'Bearer '+KEY,Accept:'application/json'},cache:'no-store'});
      if(!r.ok){console.error('HN notifications HTTP',r.status);return;}
      var data=await r.json();if(!Array.isArray(data))return;
      var newTop=data[0]&&data[0].id;
      var changed=!firstLoad&&newTop&&newTop!==lastTopId;
      items=data;lastTopId=newTop;render();
      if(changed) console.log('HN notification received:',data[0].title);
      firstLoad=false;
    }catch(e){console.error('HN notifications error',e);}
  }
  function sync(){
    build();
    var logged=!!sessionStorage.getItem('hn_profile');
    var root=document.getElementById('hnNotificationsRoot');
    if(root)root.style.display=logged?'block':'none';
    if(logged)load();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();
  setInterval(sync,2000);
})();
