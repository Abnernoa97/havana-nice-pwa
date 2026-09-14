/* HAVANA NICE — ADMIN ACCESS / DEVICES V1 */
(function(){
  'use strict';
  const URL='https://xzfradccsxonmauinecl.supabase.co';
  const KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  const STYLE='hnAdminDeviceAccessStyle';
  const ROOT='hnDeviceAccessPanel';
  let sb=null;
  let channel=null;
  let started=false;

  function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));}
  function card(){return [...document.querySelectorAll('.dashboard>.card')].find(c=>c.querySelector('.card-head h1')?.textContent.trim()==='Accesos a músicos')||null;}
  function root(){return document.getElementById(ROOT);}
  function style(){
    if(document.getElementById(STYLE))return;
    const s=document.createElement('style');s.id=STYLE;s.textContent=`
      #${ROOT}{margin-top:18px;padding-top:18px;border-top:1px solid rgba(130,190,145,.22)}
      .hn-da-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:12px}.hn-da-title{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#e5bd62}.hn-da-summary{font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:#9b9b96;text-align:right}
      .hn-da-grid{display:grid;gap:8px}.hn-da-row{border:1px solid rgba(130,190,145,.18);background:rgba(0,0,0,.18);padding:11px}.hn-da-main{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.hn-da-name{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#f4f1e8}.hn-da-meta{font-size:8px;line-height:1.6;color:#9b9b96;margin-top:5px}.hn-da-status{font-size:8px;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}.hn-da-status.authorized{color:#bfe0c6}.hn-da-status.pending{color:#e5bd62}.hn-da-status.blocked,.hn-da-status.revoked{color:#d9a89b}.hn-da-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.hn-da-actions button{min-width:86px;height:32px;padding:7px 9px;font-size:8px}.hn-da-alerts{margin-top:15px}.hn-da-alert{border-left:2px solid #e5bd62;padding:10px 11px;background:rgba(229,189,98,.035);margin-top:7px}.hn-da-alert.unread{background:rgba(229,189,98,.07)}.hn-da-alert-title{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#fff1a8}.hn-da-alert-msg{font-size:8px;line-height:1.55;color:#d6d1c6;margin-top:4px}.hn-da-alert-date{font-size:7px;color:#777;margin-top:5px}.hn-da-empty{padding:10px 0;color:#777;font-size:8px;letter-spacing:.12em;text-transform:uppercase}
    `;document.head.appendChild(s);
  }
  function ensurePanel(){
    const c=card();if(!c)return null;
    let panel=root();if(panel)return panel;
    const body=c.querySelector('.hn-admin-body')||c;
    panel=document.createElement('div');panel.id=ROOT;
    panel.innerHTML='<div class="hn-da-head"><div class="hn-da-title">Dispositivos / Accesos</div><div class="hn-da-summary" id="hnDaSummary">—</div></div><div class="hn-da-grid" id="hnDaDevices"></div><div class="hn-da-alerts"><div class="hn-da-title">Alertas de acceso</div><div id="hnDaAlerts"></div></div><div id="hnDaMsg" class="msg"></div>';
    body.appendChild(panel);return panel;
  }
  async function client(){
    if(sb)return sb;
    const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    sb=mod.createClient(URL,KEY);return sb;
  }
  async function load(){
    const panel=ensurePanel();if(!panel)return;
    const api=await client();
    const {data:session}=await api.auth.getSession();
    if(!session?.session)return;
    const [devices,alerts]=await Promise.all([
      api.rpc('admin_list_musician_devices'),
      api.rpc('admin_list_musician_access_alerts')
    ]);
    if(devices.error){panel.querySelector('#hnDaMsg').textContent='No se pudieron cargar los dispositivos';return;}
    renderDevices(devices.data||[]);renderAlerts(alerts.data||[]);
  }
  function renderDevices(rows){
    const el=document.getElementById('hnDaDevices');const sum=document.getElementById('hnDaSummary');if(!el||!sum)return;
    const by={};(rows||[]).forEach(r=>{(by[r.profile_id]??=[]).push(r)});
    const profiles=Object.values(by);
    const authorized=profiles.filter(list=>list.some(r=>r.status==='authorized')).length;
    sum.textContent=`${authorized} autorizados · ${profiles.length} perfiles con registro`;
    const order=['FER','ORLY','JALI','RAFA','ANDY'];
    const sorted=profiles.sort((a,b)=>{const ai=order.indexOf(String(a[0].username).toUpperCase());const bi=order.indexOf(String(b[0].username).toUpperCase());return (ai<0?99:ai)-(bi<0?99:bi)});
    el.innerHTML=sorted.length?sorted.map(list=>list.map(r=>row(r,list.some(x=>x.status==='authorized'))).join('')).join(''):'<div class="hn-da-empty">Sin dispositivos registrados</div>';
    el.querySelectorAll('[data-da-action]').forEach(btn=>btn.addEventListener('click',async()=>{
      const action=btn.dataset.daAction,id=btn.dataset.id;
      btn.disabled=true;
      try{
        const fn=action==='authorize'?'admin_authorize_musician_device':action==='replace'?'admin_replace_musician_device':action==='block'?'admin_block_musician_device':'admin_revoke_musician_device';
        const {data,error}=await sb.rpc(fn,{p_device_id:id});
        if(error||data!==true)throw error||new Error('No autorizado');
        await load();
      }catch(e){const m=document.getElementById('hnDaMsg');if(m)m.textContent='No se pudo aplicar el cambio';btn.disabled=false;}
    }));
  }
  function row(r,hasAuthorized){
    const status=String(r.status||'').toLowerCase();
    const label=status==='authorized'?'AUTORIZADO':status==='pending'?'PENDIENTE':status==='blocked'?'BLOQUEADO':'REVOCADO';
    let actions='';
    if(status==='pending')actions+=`<button data-da-action="${hasAuthorized?'replace':'authorize'}" data-id="${esc(r.id)}">${hasAuthorized?'REEMPLAZAR':'AUTORIZAR'}</button><button class="danger" data-da-action="block" data-id="${esc(r.id)}">BLOQUEAR</button>`;
    if(status==='authorized')actions='<button class="danger" data-da-action="revoke" data-id="'+esc(r.id)+'">REVOCAR</button>';
    return `<div class="hn-da-row"><div class="hn-da-main"><div><div class="hn-da-name">${esc(r.username)}</div><div class="hn-da-meta">${esc(r.device_label)}<br>Última actividad: ${r.last_seen_at?new Date(r.last_seen_at).toLocaleString('es-MX'): '—'}</div></div><div class="hn-da-status ${status}">${label}</div></div>${actions?'<div class="hn-da-actions">'+actions+'</div>':''}</div>`;
  }
  function renderAlerts(rows){
    const el=document.getElementById('hnDaAlerts');if(!el)return;
    const list=(rows||[]).slice(0,12);
    el.innerHTML=list.length?list.map(a=>`<div class="hn-da-alert ${a.read_at?'':'unread'}"><div class="hn-da-alert-title">${esc(a.title||'NUEVO ACCESO')} · ${esc(a.username)}</div><div class="hn-da-alert-msg">${esc(a.message)}</div><div class="hn-da-alert-date">${a.created_at?new Date(a.created_at).toLocaleString('es-MX'):''}</div>${a.read_at?'':'<div class="hn-da-actions"><button data-alert-read="'+esc(a.id)+'">MARCAR LEÍDA</button></div>'}</div>`).join(''):'<div class="hn-da-empty">Sin alertas nuevas</div>';
    el.querySelectorAll('[data-alert-read]').forEach(btn=>btn.addEventListener('click',async()=>{btn.disabled=true;await sb.rpc('admin_mark_musician_access_alert_read',{p_alert_id:btn.dataset.alertRead});await load();}));
  }
  function subscribe(){
    if(channel||!sb)return;
    channel=sb.channel('hn-admin-musician-access-alerts').on('postgres_changes',{event:'*',schema:'public',table:'musician_access_alerts'},()=>load()).subscribe();
  }
  async function start(){
    if(started)return;started=true;style();ensurePanel();
    const api=await client();
    api.auth.onAuthStateChange((event,session)=>{if(session){setTimeout(load,0);subscribe();}});
    await load();subscribe();
  }
  function boot(){if(!card()){setTimeout(boot,250);return}start();}
  boot();
})();
