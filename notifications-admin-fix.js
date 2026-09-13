/* HAVANA NICE — ADMIN NOTIFICATIONS IMAGE FIX V4 */
(function(){
  'use strict';
  const SUPABASE_URL='https://xzfradccsxonmauinecl.supabase.co';
  const SUPABASE_KEY='sb_publishable_Ip5rGK0UVXIfOjs_RQ_LhA_c14foHN9';
  let client=null, files=[];
  const $=id=>document.getElementById(id);
  const msg=t=>{const el=$('nMsg');if(el)el.textContent=t||''};

  async function getClient(){
    if(client)return client;
    const m=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    client=m.createClient(SUPABASE_URL,SUPABASE_KEY);
    return client;
  }

  function renderPreviews(){
    const wrap=$('imagePreviewWrap');
    if(!wrap)return;
    if(!files.length){wrap.innerHTML='';wrap.style.display='none';return}
    wrap.innerHTML='<div class="image-preview-list" id="hnAdminImagePreviewList"></div><button id="hnAdminImageRemove" class="image-remove danger" type="button">Quitar</button>';
    const list=$('hnAdminImagePreviewList');
    files.forEach(file=>{
      const img=document.createElement('img');
      img.className='image-preview';
      img.alt='Vista previa';
      img.src=URL.createObjectURL(file);
      list.appendChild(img);
    });
    wrap.style.display='flex';
    $('hnAdminImageRemove').onclick=clearFiles;
  }

  function clearFiles(){
    files=[];
    const input=$('nImage');
    if(input)input.value='';
    renderPreviews();
  }

  async function upload(file){
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase();
    const path='notifications/'+crypto.randomUUID()+'.'+ext;
    const c=await getClient();
    const r=await c.storage.from('notification-images').upload(path,file,{contentType:file.type,upsert:false});
    if(r.error)throw r.error;
    const url=c.storage.from('notification-images').getPublicUrl(path).data.publicUrl;
    return {path,url};
  }

  async function publish(){
    const title=$('nTitle')?.value.trim();
    const message=$('nMessage')?.value.trim();
    const button=$('nAdd');
    if(!title||!message){msg('Completa título y mensaje');return}
    if(files.length>3){msg('Máximo 3 fotos');return}
    button.disabled=true;button.textContent='Publicando…';
    const uploaded=[];
    try{
      const c=await getClient();
      const auth=await c.auth.getSession();
      if(!auth.data.session)throw new Error('not_authenticated');
      for(let i=0;i<files.length;i++){
        msg(files.length===1?'Subiendo imagen…':'Subiendo imagen '+(i+1)+' de '+files.length+'…');
        uploaded.push(await upload(files[i]));
      }
      msg('Publicando…');
      let result;
      if(uploaded.length===0){
        result=await c.rpc('admin_create_notification',{p_title:title,p_message:message});
      }else if(uploaded.length===1){
        result=await c.rpc('admin_create_notification_with_image',{p_title:title,p_message:message,p_image_url:uploaded[0].url});
      }else{
        result=await c.rpc('admin_create_notification_with_images',{p_title:title,p_message:message,p_image_urls:uploaded.map(x=>x.url)});
      }
      if(result.error)throw result.error;
      const row=result.data;
      if(uploaded.length===1 && (!row || row.image_url!==uploaded[0].url))throw new Error('image_url_not_saved');
      if(uploaded.length>1 && (!row || !Array.isArray(row.image_urls) || row.image_urls.length!==uploaded.length))throw new Error('image_urls_not_saved');
      $('nTitle').value='';$('nMessage').value='';clearFiles();msg('Publicada en tiempo real');
      setTimeout(()=>location.reload(),350);
    }catch(e){
      console.error('[HN-Admin-Notifications-V4]',e);
      if(uploaded.length){
        try{const c=await getClient();await c.storage.from('notification-images').remove(uploaded.map(x=>x.path))}catch(_){}
      }
      msg(e.message==='not_authenticated'?'Sesión de administrador no válida':'No se pudo publicar: '+(e.message||'Error'));
    }finally{
      button.disabled=false;button.textContent='Publicar notificación';
    }
  }

  function init(){
    const input=$('nImage'),button=$('nAdd');
    if(!input||!button)return false;
    input.onchange=()=>{
      const chosen=Array.from(input.files||[]);
      if(chosen.length>3){msg('Máximo 3 fotos');clearFiles();return}
      if(chosen.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024)){
        msg('Cada foto debe ser JPG, PNG o WEBP hasta 5 MB');clearFiles();return;
      }
      files=chosen;renderPreviews();msg('');
    };
    button.onclick=publish;
    return true;
  }

  function boot(){
    if(init())return;
    setTimeout(init,250);
    setTimeout(init,1000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
