/* HAVANA NICE — ADMIN ACCESS ALERT DELETE V2
   Allows the administrator to remove access-entry alerts without touching device authorization data.
*/
(function(){
  'use strict';
  const URL='https://xzfradccsxonmauinecl.supabase.co';
  const KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  const STYLE='hnAdminAccessAlertDeleteStyle';
  let sb=null,started=false,syncing=false,syncTimer=null;

  async function client(){
    if(sb)return sb;
    const mod=await import('https://esm.sh/@supabase/supabase-js@2');
    sb=mod.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    return sb;
  }
  function style(){
    if(document.getElementById(STYLE))return;
    const s=document.createElement('style');s.id=STYLE;s.textContent=`
      .hn-da-alert-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
      .hn-da-alert-clear{min-width:120px!important;height:32px!important;padding:7px 10px!important;font-size:8px!important}
      .hn-da-alert-delete{color:#d9a89b!important;border-color:#714039!important}
      .hn-da-alert-delete:hover{border-color:#e9b0a0!important;background:rgba(217,168,155,.08)!important}
      @media(max-width:520px){.hn-da-alert-head{align-items:flex-start;flex-direction:column}.hn-da-alert-clear{width:100%}}
    `;document.head.appendChild(s);
  }
  function alerts(){return document.getElementById('hnDaAlerts')}
  function ensureHeader(){
    const el=alerts();if(!el)return null;
    const parent=el.parentElement;if(!parent)return null;
    let head=parent.querySelector('.hn-da-alert-head');
    if(!head){
      const title=[...parent.children].find(x=>x.classList.contains('hn-da-title'));
      if(!title)return null;
      head=document.createElement('div');head.className='hn-da-alert-head';title.parentElement.insertBefore(head,title);head.appendChild(title);
    }
    let btn=head.querySelector('[data-alert-clear-all]');
    if(!btn){btn=document.createElement('button');btn.type='button';btn.className='hn-da-alert-clear danger';btn.dataset.alertClearAll='1';btn.textContent='LIMPIAR ALERTAS';head.appendChild(btn);btn.addEventListener('click',clearAll)}
    return btn;
  }
  async function syncAlertIds(){
    if(syncing)return;
    const el=alerts();if(!el)return;
    const cards=[...el.querySelectorAll('.hn-da-alert')];if(!cards.length)return;
    if(cards.every(c=>c.dataset.alertId))return;
    syncing=true;
    try{
      const c=await client();
      const {data,error}=await c.rpc('admin_list_musician_access_alerts');
      if(error||!Array.isArray(data))throw error||new Error('No se pudieron leer alertas');
      data.slice(0,cards.length).forEach((a,i)=>{if(cards[i]&&a?.id)cards[i].dataset.alertId=a.id});
      cards.forEach((card,i)=>{
        if(card.dataset.hnDeleteBound==='1')return;
        const row=card.querySelector('.hn-da-actions')||(()=>{const x=document.createElement('div');x.className='hn-da-actions';card.appendChild(x);return x})();
        const btn=document.createElement('button');btn.type='button';btn.className='danger hn-da-alert-delete';btn.textContent='ELIMINAR';
        const existing=row.querySelector('[data-alert-read]');
        if(existing)row.insertBefore(btn,existing);else row.appendChild(btn);
        card.dataset.hnDeleteBound='1';
        btn.addEventListener('click',()=>removeOne(card.dataset.alertId,btn));
      });
    }catch(e){const m=document.getElementById('hnDaMsg');if(m)m.textContent='No se pudieron preparar las alertas';}
    finally{syncing=false}
  }
  async function removeOne(id,btn){
    if(!id||!sb)return;
    btn.disabled=true;
    try{
      const {data,error}=await sb.rpc('admin_delete_musician_access_alert',{p_alert_id:id});
      if(error||data!==true)throw error||new Error('No autorizado');
      const card=btn.closest('.hn-da-alert');if(card)card.remove();
      normalizeEmpty();
    }catch(e){btn.disabled=false;const m=document.getElementById('hnDaMsg');if(m)m.textContent='No se pudo eliminar la alerta';}
  }
  async function clearAll(e){
    const btn=e.currentTarget;if(btn.disabled)return;
    if(!confirm('¿Eliminar todas las alertas de acceso? Esta acción no revoca dispositivos ni accesos.'))return;
    btn.disabled=true;
    try{
      const {data,error}=await sb.rpc('admin_delete_all_musician_access_alerts');
      if(error)throw error;
      const el=alerts();if(el)el.innerHTML='<div class="hn-da-empty">Sin alertas nuevas</div>';
      const m=document.getElementById('hnDaMsg');if(m)m.textContent=`${Number(data||0)} alertas eliminadas`;
    }catch(e){btn.disabled=false;const m=document.getElementById('hnDaMsg');if(m)m.textContent='No se pudieron eliminar las alertas';}
  }
  function normalizeEmpty(){
    const el=alerts();if(!el)return;
    if(!el.querySelector('.hn-da-alert'))el.innerHTML='<div class="hn-da-empty">Sin alertas nuevas</div>';
  }
  function enhance(){
    const el=alerts();if(!el)return;
    ensureHeader();
    const cards=[...el.querySelectorAll('.hn-da-alert')];
    if(!cards.length)return;
    if(cards.some(c=>!c.dataset.alertId||c.dataset.hnDeleteBound!=='1')){
      clearTimeout(syncTimer);syncTimer=setTimeout(syncAlertIds,80);
    }
  }
  function boot(){
    if(started)return;started=true;style();
    const observer=new MutationObserver(()=>enhance());
    const root=document.getElementById('hnDeviceAccessPanel');
    if(root){observer.observe(root,{childList:true,subtree:true});enhance();return;}
    setTimeout(boot,250);
  }
  boot();
})();
