/* HAVANA NICE — ADMIN GLOBAL BACKGROUND V2
   One global background for every musician.
   Uses app_background_config + Supabase Storage.
*/
(function(){
  'use strict';

  const TABLE = 'app_background_config';
  const BUCKET = 'musician-backgrounds';
  const PREFIX = 'global/';
  const CACHE_SECONDS = '31536000';
  const CARD_ID = 'hnAdminBackgroundPanel';
  const STYLE_ID = 'hnAdminBackgroundStyle';

  function waitForClient(done, tries){
    if(window.hnAdminSupabase){
      done(window.hnAdminSupabase);
      return;
    }

    if((tries || 0) >= 100) return;

    setTimeout(function(){
      waitForClient(done,(tries || 0) + 1);
    },100);
  }

  function style(){
    if(document.getElementById(STYLE_ID)) return;

    const s = document.createElement('style');
    s.id = STYLE_ID;

    s.textContent = `
      #${CARD_ID}{
        margin-top:18px;
        padding-top:16px;
        border-top:1px solid rgba(229,189,98,.18)
      }

      #${CARD_ID} .hn-bg-title{
        font-size:10px;
        letter-spacing:.18em;
        text-transform:uppercase;
        color:#f4f1e8;
        margin-bottom:7px
      }

      #${CARD_ID} .hn-bg-status{
        font-size:8px;
        letter-spacing:.12em;
        text-transform:uppercase;
        color:#9b9b96;
        min-height:15px;
        margin-bottom:10px
      }

      #${CARD_ID} .hn-bg-actions{
        display:flex;
        flex-wrap:wrap;
        gap:7px
      }

      #${CARD_ID} button{
        min-height:34px;
        padding:8px 12px;
        border:1px solid rgba(229,189,98,.55);
        background:rgba(0,0,0,.18);
        color:#e5bd62;
        font-size:8px;
        letter-spacing:.13em;
        text-transform:uppercase
      }

      #${CARD_ID} button:disabled{
        opacity:.45;
        cursor:wait
      }

      #${CARD_ID} .hn-bg-preview{
        width:100%;
        max-width:320px;
        aspect-ratio:16/9;
        background:#020302;
        object-fit:cover;
        display:block;
        margin:0 0 12px;
        border:1px solid rgba(229,189,98,.16)
      }

      #${CARD_ID} input{
        display:none
      }
    `;

    document.head.appendChild(s);
  }

  function findSummary(){
    return [...document.querySelectorAll('.dashboard>.card')]
      .find(function(card){
        return card.querySelector('.card-head h1')?.textContent.trim()==='Resumen';
      }) || null;
  }

  function mount(sb){
    const summary = findSummary();

    if(!summary || document.getElementById(CARD_ID)) return;

    const body = summary.querySelector('.hn-admin-body') || summary;

    const panel = document.createElement('div');
    panel.id = CARD_ID;

    panel.innerHTML = `
      <div class="hn-bg-title">Fondo de la app</div>

      <div class="hn-bg-status" data-bg-status>
        Usando video predeterminado
      </div>

      <video
        class="hn-bg-preview"
        data-bg-preview
        muted
        playsinline
        loop
        preload="metadata"
        hidden>
      </video>

      <div class="hn-bg-actions">
        <input
          data-bg-file
          type="file"
          accept="video/mp4,video/webm" />

        <button
          type="button"
          data-bg-upload>
          CAMBIAR VIDEO
        </button>

        <button
          type="button"
          data-bg-default>
          RESTAURAR DEFAULT
        </button>
      </div>
    `;

    body.appendChild(panel);

    const input = panel.querySelector('[data-bg-file]');
    const status = panel.querySelector('[data-bg-status]');
    const preview = panel.querySelector('[data-bg-preview]');
    const upload = panel.querySelector('[data-bg-upload]');
    const restore = panel.querySelector('[data-bg-default]');

    function setBusy(value){
      upload.disabled = value;
      restore.disabled = value;
    }

    function setStatus(text){
      status.textContent = text;
    }

    async function listGlobalFiles(){
      const {data,error} = await sb.storage
        .from(BUCKET)
        .list('global',{limit:100});

      if(error) throw error;

      return (data || [])
        .map(function(item){
          return PREFIX + item.name;
        });
    }

    async function removeFilesExcept(keep){
      const paths = await listGlobalFiles();

      const remove = paths.filter(function(path){
        return path !== keep;
      });

      if(!remove.length) return;

      const {error} = await sb.storage
        .from(BUCKET)
        .remove(remove);

      if(error) throw error;
    }

    async function ensureLongCache(data,publicUrl){
      try{
        const currentPath = String(data?.storage_path || '');
        if(!currentPath.startsWith(PREFIX) || data?.media_type !== 'video') return currentPath;

        const currentName = currentPath.slice(PREFIX.length);
        const {data:items,error:listError} = await sb.storage
          .from(BUCKET)
          .list('global',{limit:100});

        if(listError) return currentPath;

        const item = (items || []).find(function(entry){
          return entry.name === currentName;
        });

        const cacheControl = String(item?.metadata?.cacheControl || '');
        if(cacheControl.includes(CACHE_SECONDS)) return currentPath;

        const response = await fetch(publicUrl,{cache:'no-store'});
        if(!response.ok) return currentPath;

        const blob = await response.blob();
        if(!blob?.size) return currentPath;

        const ext = currentName.toLowerCase().endsWith('.webm') ? 'webm' : 'mp4';
        const nextPath = PREFIX + 'background-' + Date.now() + '.' + ext;
        const contentType = blob.type || (ext === 'webm' ? 'video/webm' : 'video/mp4');

        const {error:uploadError} = await sb.storage
          .from(BUCKET)
          .upload(
            nextPath,
            blob,
            {
              contentType,
              upsert:false,
              cacheControl:CACHE_SECONDS
            }
          );

        if(uploadError) return currentPath;

        const {error:configError} = await sb
          .from(TABLE)
          .upsert(
            {
              id:1,
              storage_path:nextPath,
              media_type:'video',
              active:true,
              updated_at:new Date().toISOString()
            },
            {
              onConflict:'id'
            }
          );

        if(configError){
          try{await sb.storage.from(BUCKET).remove([nextPath]);}catch(_){}
          return currentPath;
        }

        return nextPath;
      }catch(error){
        console.warn('[HN background cache]',error);
        return String(data?.storage_path || '');
      }
    }

    async function loadCurrent(){
      const {data,error} = await sb
        .from(TABLE)
        .select('storage_path,media_type,active,updated_at')
        .eq('id',1)
        .eq('active',true)
        .maybeSingle();

      if(error){
        setStatus('No se pudo leer el fondo actual');
        return;
      }

      if(!data || !data.storage_path){
        setStatus('Usando video predeterminado');
        preview.hidden = true;
        preview.removeAttribute('src');
        return;
      }

      let activePath = data.storage_path;
      let {data:urlData} = sb.storage
        .from(BUCKET)
        .getPublicUrl(activePath);

      if(!urlData?.publicUrl){
        setStatus('Usando video predeterminado');
        return;
      }

      if(data.media_type === 'video'){
        const upgradedPath = await ensureLongCache(data,urlData.publicUrl);
        if(upgradedPath && upgradedPath !== activePath){
          activePath = upgradedPath;
          ({data:urlData} = sb.storage
            .from(BUCKET)
            .getPublicUrl(activePath));
        }

        preview.src = urlData.publicUrl;
        preview.hidden = false;
        preview.load();
      }

      setStatus('Fondo global activo');
    }

    async function activateFile(file){
      if(!file) return;

      if(file.type !== 'video/mp4' && file.type !== 'video/webm'){
        setStatus('Solo MP4 o WEBM');
        input.value = '';
        return;
      }

      setBusy(true);
      setStatus('Subiendo video…');

      try{
        const ext = file.name
          .split('.')
          .pop()
          .toLowerCase()
          .replace(/[^a-z0-9]/g,'');

        const safeExt = ext === 'webm' ? 'webm' : 'mp4';

        const path =
          PREFIX +
          'background-' +
          Date.now() +
          '.' +
          safeExt;

        const {error:uploadError} = await sb.storage
          .from(BUCKET)
          .upload(
            path,
            file,
            {
              contentType:file.type,
              upsert:false,
              cacheControl:CACHE_SECONDS
            }
          );

        if(uploadError) throw uploadError;

        setStatus('Activando fondo global…');

        const {error:configError} = await sb
          .from(TABLE)
          .upsert(
            {
              id:1,
              storage_path:path,
              media_type:'video',
              active:true,
              updated_at:new Date().toISOString()
            },
            {
              onConflict:'id'
            }
          );

        if(configError) throw configError;

        const {data:urlData} = sb.storage
          .from(BUCKET)
          .getPublicUrl(path);

        if(urlData?.publicUrl){
          preview.src = urlData.publicUrl;
          preview.hidden = false;
          preview.load();
        }

        await removeFilesExcept(path);

        setStatus('Fondo global activo');

      }catch(error){
        setStatus(
          'Error: ' +
          (error?.message || 'No se pudo activar')
        );
      }finally{
        setBusy(false);
        input.value = '';
      }
    }

    async function restoreDefault(){
      setBusy(true);
      setStatus('Restaurando video predeterminado…');

      try{
        const {error} = await sb
          .from(TABLE)
          .upsert(
            {
              id:1,
              storage_path:null,
              media_type:'video',
              active:true,
              updated_at:new Date().toISOString()
            },
            {
              onConflict:'id'
            }
          );

        if(error) throw error;

        await removeFilesExcept(null);

        preview.hidden = true;
        preview.removeAttribute('src');

        setStatus('Video predeterminado activo');

      }catch(error){
        setStatus(
          'Error: ' +
          (error?.message || 'No se pudo restaurar')
        );
      }finally{
        setBusy(false);
      }
    }

    upload.addEventListener('click',function(){
      input.click();
    });

    input.addEventListener('change',function(){
      activateFile(
        input.files && input.files[0]
      );
    });

    restore.addEventListener(
      'click',
      restoreDefault
    );

    loadCurrent();
  }

  function init(){
    style();

    waitForClient(function(sb){
      const root = document.querySelector('.dashboard');

      const scan = function(){
        mount(sb);
      };

      scan();

      if(root){
        const observer = new MutationObserver(scan);

        observer.observe(
          root,
          {
            childList:true,
            subtree:true
          }
        );
      }
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener(
      'DOMContentLoaded',
      init
    );
  }else{
    init();
  }

})();
