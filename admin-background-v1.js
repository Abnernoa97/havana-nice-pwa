/* HAVANA NICE — ADMIN GLOBAL BACKGROUND V1
   Isolated background manager. Does not modify frozen modules.
*/
(function(){
  'use strict';
  const STYLE_ID='hnAdminBackgroundStyle';
  const CARD_ID='hnAdminBackgroundPanel';
  const BUCKET='musician-backgrounds';
  const PREFIX='global/';

  function waitForClient(done, tries){
    if(window.hnAdminSupabase){done(window.hnAdminSupabase);return}
    if((tries||0)>=100)return;
    setTimeout(function(){waitForClient(done,(tries||0)+1)},100);
  }

  function style(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #${CARD_ID}{margin-top:18px;padding-top:16px;border-top:1px solid rgba(229,189,98,.18)}
      #${CARD_ID} .hn-bg-title{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#f4f1e8;margin-bottom:7px}
      #${CARD_ID} .hn-bg-status{font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:#9b9b96;min-height:15px;margin-bottom:10px}
      #${CARD_ID} .hn-bg-actions{display:flex;flex-wrap:wrap;gap:7px}
      #${CARD_ID} button{min-height:34px;padding:8px 12px;border:1px solid rgba(229,189,98,.55);background:rgba(0,0,0,.18);color:#e5bd62;font-size:8px;letter-spacing:.13em;text-transform:uppercase}
      #${CARD_ID} button:disabled{opacity:.45;cursor:wait}
      #${CARD_ID} .hn-bg-preview{width:100%;max-width:320px;aspect-ratio:16/9;background:#020302;object-fit:cover;display:block;margin:0 0 12px;border:1px solid rgba(229,189,98,.16)}
      #${CARD_ID} input{display:none}
    `;
    document.head.appendChild(s);
  }

  function findSummary(){
    return [...document.querySelectorAll('.dashboard>.card')].find(function(card){
      return card.querySelector('.card-head h1')?.textContent.trim()==='Resumen';
    })||null;
  }

  function mount(sb){
    const summary=findSummary();
    if(!summary||document.getElementById(CARD_ID))return;
    const body=summary.querySelector('.hn-admin-body')||summary;
    const panel=document.createElement('div');
    panel.id=CARD_ID;
    panel.innerHTML=`
      <div class="hn-bg-title">Fondo de la app</div>
      <div class="hn-bg-status" data-bg-status>Usando video predeterminado</div>
      <video class="hn-bg-preview" data-bg-preview muted playsinline loop preload="metadata" hidden></video>
      <div class="hn-bg-actions">
        <input data-bg-file type="file" accept="video/mp4,video/webm,image/jpeg,image/png,image/webp" />
        <button type="button" data-bg-upload>CAMBIAR VIDEO</button>
        <button type="button" data-bg-default>RESTAURAR DEFAULT</button>
      </div>`;
    body.appendChild(panel);
    const input=panel.querySelector('[data-bg-file]');
    const status=panel.querySelector('[data-bg-status]');
    const preview=panel.querySelector('[data-bg-preview]');
    const upload=panel.querySelector('[data-bg-upload]');
    const restore=panel.querySelector('[data-bg-default]');

    function setBusy(v){upload.disabled=v;restore.disabled=v}
    function setStatus(t){status.textContent=t}

    async function removeGlobalFiles(){
      const {data,error}=await sb.storage.from(BUCKET).list('global',{limit:100});
      if(error)throw error;
      const paths=(data||[]).map(x=>PREFIX+x.name);
      if(paths.length){const r=await sb.storage.from(BUCKET).remove(paths);if(r.error)throw r.error}
    }

    async function writeRows(path,mediaType){
      const {data:profiles,error:profilesError}=await sb.from('profiles').select('id').eq('role','musician').eq('active',true);
      if(profilesError)throw profilesError;
      const rows=(profiles||[]).map(p=>({profile_id:p.id,storage_path:path,media_type:mediaType,active:true,updated_at:new Date().toISOString()}));
      if(!rows.length)throw new Error('No active musicians found');
      const {error}=await sb.from('musician_backgrounds').upsert(rows,{onConflict:'profile_id'});
      if(error)throw error;
      return rows.length;
    }

    async function restoreDefault(){
      setBusy(true);setStatus('Restaurando video predeterminado…');
      try{
        const {data:profiles,error}=await sb.from('profiles').select('id').eq('role','musician').eq('active',true);
        if(error)throw error;
        const ids=(profiles||[]).map(p=>p.id);
        if(ids.length){const {error:e}=await sb.from('musician_backgrounds').delete().in('profile_id',ids);if(e)throw e}
        await removeGlobalFiles();
        preview.hidden=true;preview.removeAttribute('src');
        setStatus('Video predeterminado activo');
      }catch(e){setStatus('Error: '+(e?.message||'No se pudo restaurar'))}
      finally{setBusy(false)}
    }

    async function uploadFile(file){
      if(!file)return;
      if(!file.type.startsWith('video/')&&!file.type.startsWith('image/')){setStatus('Formato no compatible');return}
      setBusy(true);setStatus('Subiendo y activando…');
      try{
        const ext=(file.name.split('.').pop()||'mp4').toLowerCase().replace(/[^a-z0-9]/g,'')||'mp4';
        const path=PREFIX+'background-'+Date.now()+'.'+ext;
        const {error:uploadError}=await sb.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
        if(uploadError)throw uploadError;
        const mediaType=file.type.startsWith('image/')?'image':'video';
        const count=await writeRows(path,mediaType);
        if(mediaType==='video'){
          const {data}=sb.storage.from(BUCKET).getPublicUrl(path);
          preview.src=data.publicUrl;preview.hidden=false;preview.load();
        }
        setStatus('Fondo activo para '+count+' músicos');
        await removeGlobalFilesExcept(path);
      }catch(e){setStatus('Error: '+(e?.message||'No se pudo activar'));}
      finally{setBusy(false);input.value=''}
    }

    async function removeGlobalFilesExcept(keep){
      const {data,error}=await sb.storage.from(BUCKET).list('global',{limit:100});
      if(error)throw error;
      const paths=(data||[]).map(x=>PREFIX+x.name).filter(p=>p!==keep);
      if(paths.length){const r=await sb.storage.from(BUCKET).remove(paths);if(r.error)throw r.error}
    }

    upload.addEventListener('click',function(){input.click()});
    input.addEventListener('change',function(){uploadFile(input.files&&input.files[0])});
    restore.addEventListener('click',restoreDefault);
  }

  function init(){
    style();
    waitForClient(function(sb){
      const root=document.querySelector('.dashboard');
      const scan=function(){mount(sb)};
      scan();
      if(root){const observer=new MutationObserver(scan);observer.observe(root,{childList:true,subtree:true})}
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
