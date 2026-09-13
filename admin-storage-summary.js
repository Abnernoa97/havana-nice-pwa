/* HAVANA NICE — ADMIN STORAGE SUMMARY
   Visual storage usage for the Admin Summary. No polling.
*/
(function(){
  'use strict';
  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const SUPABASE_KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  let client=null,started=false;
  const STYLE_ID='hnAdminStorageStyle';
  const CARD_ID='hnAdminStorageCard';
  const $=id=>document.getElementById(id);
  function style(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      @media(max-width:460px){.hn-summary-video-stat{grid-column:auto!important}}
      .hn-storage{margin-top:10px;border:1px solid rgba(130,190,145,.20);background:rgba(0,0,0,.18);padding:18px 16px}
      .hn-storage-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px}
      .hn-storage-eyebrow{font-size:8px;letter-spacing:.18em;color:#e5bd62;text-transform:uppercase}
      .hn-storage-title{margin-top:5px;font:22px Georgia,serif;color:#fff1a8}
      .hn-storage-main{text-align:right}
      .hn-storage-used{font:24px Georgia,serif;color:#fff1a8;white-space:nowrap}
      .hn-storage-limit{margin-top:3px;font-size:8px;letter-spacing:.12em;color:#9b9b96;text-transform:uppercase}
      .hn-storage-track{height:14px;margin-top:16px;border:1px solid rgba(130,190,145,.25);background:#030504;overflow:hidden}
      .hn-storage-fill{height:100%;width:0;background:#82be91;transition:width .35s ease}
      .hn-storage-fill.warn{background:#e5bd62}.hn-storage-fill.danger{background:#c66b5f}
      .hn-storage-foot{display:flex;justify-content:space-between;gap:12px;margin-top:9px;font-size:8px;letter-spacing:.1em;color:#9b9b96;text-transform:uppercase}
      .hn-storage-details{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
      .hn-storage-detail{border:1px solid rgba(130,190,145,.14);padding:10px 9px;background:rgba(0,0,0,.12)}
      .hn-storage-detail-value{font:17px Georgia,serif;color:#fff1a8}.hn-storage-detail-label{margin-top:3px;font-size:7px;letter-spacing:.12em;color:#9b9b96;text-transform:uppercase}
      @media(max-width:460px){.hn-storage-head{align-items:flex-start}.hn-storage-main{text-align:right}.hn-storage-used{font-size:20px}.hn-storage-details{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(s)
  }
  function fmtMB(bytes){return(bytes/1048576).toFixed(2)}
  function fmtGB(bytes){return(bytes/1073741824).toFixed(3)}
  async function getClient(){
    if(window.hnAdminSupabase&&typeof window.hnAdminSupabase.rpc==='function')return window.hnAdminSupabase;
    if(client)return client;
    const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    client=mod.createClient(SUPABASE_URL,SUPABASE_KEY);
    return client
  }
  function ensureCard(){
    const summary=[...document.querySelectorAll('.dashboard>.card')].find(c=>c.querySelector('.card-head h1')?.textContent.trim()==='Resumen');
    if(!summary)return null;
    const stats=summary.querySelector('.stats');
    if(!stats)return null;
    const video=$('statVideos')?.closest('.stat');
    if(video)video.classList.add('hn-summary-video-stat');
    let card=document.getElementById(CARD_ID);
    if(card)return card;
    card=document.createElement('div');
    card.id=CARD_ID;
    card.className='hn-storage';
    card.innerHTML='<div class="hn-storage-head"><div><div class="hn-storage-eyebrow">Almacenamiento</div><div class="hn-storage-title">Uso de archivos</div></div><div class="hn-storage-main"><div id="hnStorageUsed" class="hn-storage-used">—</div><div id="hnStorageLimit" class="hn-storage-limit">Límite 1 GB</div></div></div><div class="hn-storage-track"><div id="hnStorageFill" class="hn-storage-fill"></div></div><div class="hn-storage-foot"><span id="hnStoragePercent">—</span><span id="hnStorageFree">—</span></div><div class="hn-storage-details"><div class="hn-storage-detail"><div id="hnStorageMB" class="hn-storage-detail-value">—</div><div class="hn-storage-detail-label">Megabytes usados</div></div><div class="hn-storage-detail"><div id="hnStorageGB" class="hn-storage-detail-value">—</div><div class="hn-storage-detail-label">Gigabytes usados</div></div></div>';
    const logout=$('logout');
    summary.insertBefore(card,logout||null);
    return card
  }
  async function refresh(){
    const card=ensureCard();
    if(!card)return;
    try{
      const c=await getClient();
      const {data,error}=await c.rpc('admin_storage_usage');
      if(error||!data||data.error){$('hnStorageUsed').textContent='—';return}
      const bytes=Number(data.storage_bytes||0),limit=Number(data.storage_limit_bytes||1073741824);
      const pct=Math.min(100,(bytes/limit)*100),free=Math.max(0,limit-bytes);
      $('hnStorageUsed').textContent=fmtMB(bytes)+' MB';
      $('hnStorageMB').textContent=fmtMB(bytes)+' MB';
      $('hnStorageGB').textContent=fmtGB(bytes)+' GB';
      $('hnStoragePercent').textContent=pct<0.01?'< 0.01% utilizado':pct.toFixed(2)+'% utilizado';
      $('hnStorageFree').textContent=fmtMB(free)+' MB disponibles';
      $('hnStorageLimit').textContent='Límite '+fmtGB(limit)+' GB';
      const fill=$('hnStorageFill');fill.style.width=Math.max(bytes?0.35:0,pct)+'%';fill.classList.toggle('warn',pct>=70&&pct<90);fill.classList.toggle('danger',pct>=90)
    }catch(e){console.warn('HN storage summary',e)}
  }
  function boot(){
    if(started)return;started=true;style();refresh();setTimeout(refresh,1200)
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
