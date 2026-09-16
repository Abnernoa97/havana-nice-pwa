/* HAVANA NICE — ADMIN STORAGE SUMMARY V3
   Visual Supabase Storage usage for the Free Plan target.
   Injects directly into the Summary card after its stats.
*/
(function(){
  'use strict';
  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const SUPABASE_KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  const STYLE_ID='hnAdminStorageStyle';
  const CARD_ID='hnAdminStorageCard';
  let client=null,started=false,refreshTimer=null;
  const $=id=>document.getElementById(id);
  function style(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=`
      #${CARD_ID}{display:block!important;width:100%;margin:16px 0 0!important;border:1px solid rgba(130,190,145,.28);background:rgba(0,0,0,.22);padding:16px;box-sizing:border-box}
      #${CARD_ID} .hn-storage-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px}
      #${CARD_ID} .hn-storage-eyebrow{font-size:8px;letter-spacing:.18em;color:#e5bd62;text-transform:uppercase}
      #${CARD_ID} .hn-storage-title{margin-top:5px;font:21px Georgia,serif;color:#fff1a8}
      #${CARD_ID} .hn-storage-main{text-align:right}
      #${CARD_ID} .hn-storage-used{font:23px Georgia,serif;color:#fff1a8;white-space:nowrap}
      #${CARD_ID} .hn-storage-limit{margin-top:3px;font-size:8px;letter-spacing:.12em;color:#9b9b96;text-transform:uppercase}
      #${CARD_ID} .hn-storage-track{height:14px;margin-top:15px;border:1px solid rgba(130,190,145,.25);background:#030504;overflow:hidden}
      #${CARD_ID} .hn-storage-fill{height:100%;width:0;background:#82be91;transition:width .35s ease}
      #${CARD_ID} .hn-storage-fill.warn{background:#e5bd62}#${CARD_ID} .hn-storage-fill.danger{background:#c66b5f}
      #${CARD_ID} .hn-storage-foot{display:flex;justify-content:space-between;gap:12px;margin-top:8px;font-size:8px;letter-spacing:.1em;color:#9b9b96;text-transform:uppercase}
      #${CARD_ID} .hn-storage-details{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
      #${CARD_ID} .hn-storage-detail{border:1px solid rgba(130,190,145,.14);padding:9px;background:rgba(0,0,0,.12)}
      #${CARD_ID} .hn-storage-detail-value{font:16px Georgia,serif;color:#fff1a8}
      #${CARD_ID} .hn-storage-detail-label{margin-top:3px;font-size:7px;letter-spacing:.12em;color:#9b9b96;text-transform:uppercase}
      @media(max-width:460px){#${CARD_ID}{padding:14px}#${CARD_ID} .hn-storage-head{align-items:flex-start}#${CARD_ID} .hn-storage-used{font-size:19px}}
    `;document.head.appendChild(s)
  }
  function fmtMB(bytes){return(bytes/1048576).toFixed(2)}
  function fmtGB(bytes){return(bytes/1073741824).toFixed(3)}
  async function getClient(){
    if(client)return client;
    const mod=await import('https://esm.sh/@supabase/supabase-js@2');
    client=mod.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    return client
  }
  function findSummary(){return [...document.querySelectorAll('.dashboard>.card')].find(c=>c.querySelector('.card-head h1')?.textContent.trim()==='Resumen')||null}
  function ensureCard(){
    const summary=findSummary();if(!summary)return null;
    const stats=summary.querySelector('.stats');if(!stats)return null;
    let card=document.getElementById(CARD_ID);
    if(card && card.parentElement!==summary)return null;
    if(card)return card;
    card=document.createElement('div');card.id=CARD_ID;
    card.innerHTML='<div class="hn-storage-head"><div><div class="hn-storage-eyebrow">Almacenamiento · Plan Free</div><div class="hn-storage-title">Uso de archivos</div></div><div class="hn-storage-main"><div id="hnStorageUsed" class="hn-storage-used">—</div><div id="hnStorageLimit" class="hn-storage-limit">Límite 1.000 GB</div></div></div><div class="hn-storage-track" role="progressbar" aria-label="Almacenamiento usado" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="hnStorageFill" class="hn-storage-fill"></div></div><div class="hn-storage-foot"><span id="hnStoragePercent">Calculando…</span><span id="hnStorageFree">—</span></div><div class="hn-storage-details"><div class="hn-storage-detail"><div id="hnStorageMB" class="hn-storage-detail-value">—</div><div class="hn-storage-detail-label">Megabytes usados</div></div><div class="hn-storage-detail"><div id="hnStorageGB" class="hn-storage-detail-value">—</div><div class="hn-storage-detail-label">Gigabytes usados</div></div></div>';
    stats.insertAdjacentElement('afterend',card);
    return card
  }
  async function refresh(){
    const card=ensureCard();
    if(!card){refreshTimer=window.setTimeout(refresh,250);return}
    try{
      const c=await getClient();
      const sessionResult=await c.auth.getSession();
      if(!sessionResult.data?.session){refreshTimer=window.setTimeout(refresh,500);return}
      const {data,error}=await c.rpc('admin_storage_usage');
      if(error||!data||data.error){console.warn('[HN storage]',error||data);return}
      const bytes=Math.max(0,Number(data.storage_bytes||0));
      const limit=Math.max(1,Number(data.storage_limit_bytes||1073741824));
      const pct=Math.min(100,(bytes/limit)*100),free=Math.max(0,limit-bytes);
      $('hnStorageUsed').textContent=fmtMB(bytes)+' MB';
      $('hnStorageMB').textContent=fmtMB(bytes)+' MB';
      $('hnStorageGB').textContent=fmtGB(bytes)+' GB';
      $('hnStoragePercent').textContent=pct<0.01?'< 0.01% utilizado':pct.toFixed(2)+'% utilizado';
      $('hnStorageFree').textContent=fmtMB(free)+' MB disponibles';
      $('hnStorageLimit').textContent='Límite '+fmtGB(limit)+' GB';
      const fill=$('hnStorageFill'),track=fill?.parentElement;
      if(fill){fill.style.width=Math.max(bytes?0.35:0,pct)+'%';fill.classList.toggle('warn',pct>=70&&pct<90);fill.classList.toggle('danger',pct>=90)}
      if(track)track.setAttribute('aria-valuenow',pct.toFixed(2));
    }catch(e){console.warn('[HN storage summary]',e)}
  }
  function boot(){if(started)return;started=true;style();refresh();window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh()});window.addEventListener('focus',refresh)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
