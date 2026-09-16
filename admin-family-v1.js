/* HAVANA NICE — ADMIN FAMILY V2
   Admin controls for family biographies and profile-photo completion.
*/
(function(){
  'use strict';
  const URL='https://xzfradccsxonmauinecl.supabase.co';
  const KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  const ROOT='hnAdminFamilyPanel';
  let sb=null,channel=null,started=false,loading=false;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  async function client(){if(sb)return sb;const m=await import('https://esm.sh/@supabase/supabase-js@2');sb=m.createClient(URL,KEY);return sb}
  function card(){return [...document.querySelectorAll('.dashboard>.card')].find(c=>c.querySelector('.card-head h1')?.textContent.trim()==='Familia HAVANA NICE')||null}
  function style(){if($('hnAdminFamilyStyle'))return;const s=document.createElement('style');s.id='hnAdminFamilyStyle';s.textContent=`
    #${ROOT}{margin-top:18px;padding-top:18px;border-top:1px solid rgba(229,189,98,.22)}
    .hn-fam-admin-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:12px}.hn-fam-admin-title{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#e5bd62}.hn-fam-admin-total{font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:#9b9b96;text-align:right}
    .hn-fam-admin-grid{display:grid;gap:9px}.hn-fam-admin-row{border:1px solid rgba(130,190,145,.18);background:rgba(0,0,0,.16);padding:12px}.hn-fam-admin-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.hn-fam-admin-name{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#f4f1e8}.hn-fam-admin-role{margin-top:4px;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:#777}.hn-fam-admin-photo{font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:#bfe0c6;white-space:nowrap}.hn-fam-admin-photo.partial{color:#e5bd62}.hn-fam-admin-photo.empty{color:#d9a89b}.hn-fam-admin-bio{margin-top:11px}.hn-fam-admin-bio textarea{min-height:104px;width:100%;font-size:11px;line-height:1.55;letter-spacing:.02em}.hn-fam-admin-actions{display:flex;align-items:center;gap:8px;margin-top:8px}.hn-fam-admin-actions button{min-width:105px;height:34px;padding:8px 10px}.hn-fam-admin-status{font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:#9b9b96}.hn-fam-admin-status.ok{color:#bfe0c6}.hn-fam-admin-status.err{color:#d9a89b}
    .hn-fam-admin-summary{margin-bottom:12px;padding:10px 11px;border:1px solid rgba(229,189,98,.18);font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:#9b9b96}.hn-fam-admin-summary strong{color:#fff1a8;font-weight:400}
    .hn-family-live-stat{border-color:rgba(229,189,98,.22)!important}
    @media(max-width:520px){.hn-fam-admin-top{align-items:flex-start}.hn-fam-admin-photo{font-size:7px}.hn-fam-admin-actions{flex-wrap:wrap}}
  `;document.head.appendChild(s)}
  function ensureSummaryStat(){
    const summary=[...document.querySelectorAll('.dashboard>.card')].find(c=>c.querySelector('.card-head h1')?.textContent.trim()==='Resumen');
    const stats=summary?.querySelector('.stats');
    if(!stats)return null;
    let stat=$('statFamilyPhotos');
    if(stat)return stat;
    const wrap=document.createElement('div');wrap.className='stat hn-family-live-stat';wrap.innerHTML='<div id="statFamilyPhotos" class="stat-number">—</div><div class="stat-label">Fotos familia</div>';stats.appendChild(wrap);
    return $('statFamilyPhotos');
  }
  function ensurePanel(){const c=card();if(!c)return null;const body=c.querySelector('.hn-admin-body')||c;let p=$(ROOT);if(p)return p;p=document.createElement('div');p.id=ROOT;p.innerHTML='<div class="hn-fam-admin-head"><div class="hn-fam-admin-title">Perfiles de familia</div><div class="hn-fam-admin-total" id="hnFamTotal">—</div></div><div class="hn-fam-admin-summary">Fotos de perfil y portada completadas: <strong id="hnFamPhotoTotal">—</strong></div><div class="hn-fam-admin-grid" id="hnFamGrid"></div><div id="hnFamMsg" class="msg"></div>';body.querySelector('.hn-family-placeholder')?.remove();body.appendChild(p);return p}
  async function load(){const p=ensurePanel();ensureSummaryStat();if(!p||loading)return;loading=true;try{const c=await client();const{data,error}=await c.rpc('admin_list_family_profiles');if(error)throw error;render(data||[])}catch(e){console.warn('[HN admin family]',e);if($('hnFamMsg'))$('hnFamMsg').textContent='No se pudieron cargar los perfiles'}finally{loading=false}}
  function render(rows){const grid=$('hnFamGrid');if(!grid)return;const total=rows.reduce((n,r)=>n+Number(r.photo_count||0),0),max=rows.length*2;const complete=rows.filter(r=>Number(r.photo_count||0)===2).length;const stat=ensureSummaryStat();if(stat)stat.textContent=total;$('hnFamTotal').textContent=`${rows.length} perfiles · ${complete} completos`;$('hnFamPhotoTotal').textContent=`${total}/${max}`;grid.innerHTML=rows.map(r=>{const count=Number(r.photo_count||0),cls=count===2?'':' '+(count?'partial':'empty');return `<article class="hn-fam-admin-row"><div class="hn-fam-admin-top"><div><div class="hn-fam-admin-name">${esc(r.name)}</div><div class="hn-fam-admin-role">${esc(r.role)}</div></div><div class="hn-fam-admin-photo${cls}">${count}/2 FOTOS</div></div><div class="hn-fam-admin-bio"><textarea data-bio-key="${esc(r.member_key)}" maxlength="500" placeholder="Escribe la biografía de ${esc(r.name)}">${esc(r.bio||'')}</textarea></div><div class="hn-fam-admin-actions"><button type="button" data-save-bio="${esc(r.member_key)}">GUARDAR BIOGRAFÍA</button><span class="hn-fam-admin-status" data-bio-status="${esc(r.member_key)}"></span></div></article>`}).join('');grid.querySelectorAll('[data-save-bio]').forEach(btn=>btn.addEventListener('click',async()=>{const key=btn.dataset.saveBio,ta=grid.querySelector(`[data-bio-key="${CSS.escape(key)}"]`),st=grid.querySelector(`[data-bio-status="${CSS.escape(key)}"]`);btn.disabled=true;if(st){st.textContent='Guardando…';st.className='hn-fam-admin-status'}try{const c=await client();const{data,error}=await c.rpc('admin_update_family_bio',{p_member_key:key,p_bio:ta?.value||''});if(error||data!==true)throw error||new Error('No autorizado');if(st){st.textContent='Guardado';st.className='hn-fam-admin-status ok'}setTimeout(()=>{if(st)st.textContent=''},1400)}catch(e){console.warn('[HN admin family bio]',e);if(st){st.textContent='No se pudo guardar';st.className='hn-fam-admin-status err'}}finally{btn.disabled=false}}))}
  function subscribe(){if(channel||!sb)return;channel=sb.channel('hn-admin-family-profile').on('postgres_changes',{event:'*',schema:'public',table:'family_profiles'},()=>{load()}).subscribe()}
  async function start(){if(started)return;started=true;style();ensurePanel();ensureSummaryStat();const c=await client();const{data:{session}}=await c.auth.getSession();if(!session)return;await load();subscribe()}
  function boot(){if(!card()){setTimeout(boot,250);return}start()}
  boot();
})();
