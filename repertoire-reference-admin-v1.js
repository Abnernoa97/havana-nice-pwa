/* HAVANA NICE — ADMIN REPERTOIRE REFERENCE LINKS V1
   Adds an optional reference URL to new and existing repertoire songs.
   Keeps the legacy repertoire RPCs intact and layers the V2 link RPCs on top.
*/
(function(){
  'use strict';

  const STYLE_ID='hnRepertoireReferenceAdminStyle';
  let client=null;
  let byId=new Map();
  let observer=null;
  let refreshTimer=null;

  const $=id=>document.getElementById(id);
  const validUrl=value=>{value=String(value||'').trim();return !value||/^https?:\/\//i.test(value)};

  function getClient(){
    if(window.hnAdminSupabase&&typeof window.hnAdminSupabase.rpc==='function')return window.hnAdminSupabase;
    return null;
  }

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      .add-song #songReference{grid-column:1/4}
      .add-song #songAdd{grid-column:4}
      #songList .edit-reference{display:none}
      #songList .song.hn-song-editing .edit-reference{display:block!important;width:100%!important;margin-bottom:7px!important}
      #songList .hn-song-reference-state{margin-top:4px;color:#e5bd62;font-size:8px;letter-spacing:.12em;text-transform:uppercase}
      @media(max-width:760px){
        .add-song #songReference{grid-column:1/-1}
        .add-song #songAdd{grid-column:1/-1}
      }
    `;
    document.head.appendChild(s);
  }

  async function fetchSongs(){
    client=getClient();
    if(!client)return [];
    const {data,error}=await client.rpc('admin_list_repertoire_v2');
    if(error){console.warn('[HN Repertoire Reference] list',error);return []}
    const rows=Array.isArray(data)?data:[];
    byId=new Map(rows.map(row=>[String(row.song_id),row]));
    return rows;
  }

  function ensureAddField(){
    const form=document.querySelector('.add-song');
    const button=$('songAdd');
    if(!form||!button)return;
    let input=$('songReference');
    if(!input){
      input=document.createElement('input');
      input.id='songReference';
      input.type='url';
      input.placeholder='Link de referencia · YouTube, Spotify o cualquier https://';
      form.insertBefore(input,button);
    }
    if(button.dataset.hnReferenceWrapped==='1')return;
    button.dataset.hnReferenceWrapped='1';
    const original=button.onclick;
    button.onclick=async function(event){
      const reference=String(input.value||'').trim();
      if(reference&&!validUrl(reference)){
        const msg=$('songMsg');if(msg)msg.textContent='El link debe comenzar con https://';
        return;
      }
      if(!reference){
        if(typeof original==='function')return original.call(this,event);
        return;
      }
      const before=await fetchSongs();
      const beforeIds=new Set(before.map(row=>String(row.song_id)));
      if(typeof original==='function')await original.call(this,event);
      let created=null;
      for(let attempt=0;attempt<5&&!created;attempt++){
        if(attempt)await new Promise(resolve=>setTimeout(resolve,180));
        const after=await fetchSongs();
        created=after.find(row=>!beforeIds.has(String(row.song_id)))||null;
      }
      if(!created){
        const msg=$('songMsg');if(msg)msg.textContent='Canción creada, pero no se pudo guardar el link';
        return;
      }
      const {error}=await client.rpc('admin_update_repertoire_song_v2',{
        p_id:created.song_id,
        p_title:created.song_title,
        p_artist:created.song_artist||null,
        p_category:created.song_category||'OTHER',
        p_position:Number(created.song_position)||0,
        p_reference_url:reference
      });
      const msg=$('songMsg');
      if(error){console.warn('[HN Repertoire Reference] create link',error);if(msg)msg.textContent='Canción creada, pero no se pudo guardar el link';return}
      input.value='';
      if(msg)msg.textContent='Canción agregada con link de referencia';
      await fetchSongs();
      scheduleDecorate();
    };
  }

  function addReferenceState(song,row){
    const display=song.querySelector('.hn-song-display');
    if(!display)return;
    let state=display.querySelector('.hn-song-reference-state');
    const has=!!String(row?.song_reference_url||'').trim();
    if(!has){state?.remove();return}
    if(!state){state=document.createElement('div');state.className='hn-song-reference-state';display.appendChild(state)}
    state.textContent='LINK DE REFERENCIA ✓';
  }

  function decorateSong(song){
    const titleInput=song.querySelector('.edit-title');
    if(!titleInput)return;
    const id=String(titleInput.dataset.id||'');
    const row=byId.get(id);
    const fields=song.querySelector('.song-fields');
    if(!fields)return;
    let ref=fields.querySelector('.edit-reference');
    if(!ref){
      ref=document.createElement('input');
      ref.type='url';
      ref.className='edit-reference';
      ref.dataset.id=id;
      ref.placeholder='Link de referencia · https://';
      fields.appendChild(ref);
    }
    if(!song.classList.contains('hn-song-editing'))ref.value=String(row?.song_reference_url||'');
    addReferenceState(song,row);

    const save=song.querySelector('.song-save');
    if(!save||save.dataset.hnReferenceSaveWrapped==='1')return;
    save.dataset.hnReferenceSaveWrapped='1';
    const original=save.onclick;
    save.onclick=async function(event){
      const reference=String(ref.value||'').trim();
      if(reference&&!validUrl(reference)){
        const msg=$('songMsg');if(msg)msg.textContent='El link debe comenzar con https://';
        return;
      }
      const current=byId.get(id)||{};
      const title=String(song.querySelector('.edit-title')?.value||'').trim();
      const artist=String(song.querySelector('.edit-artist')?.value||'').trim();
      const category=String(song.querySelector('.edit-category')?.value||'OTHER');
      if(typeof original==='function')await original.call(this,event);
      client=getClient();
      if(!client)return;
      const {error}=await client.rpc('admin_update_repertoire_song_v2',{
        p_id:id,
        p_title:title,
        p_artist:artist||null,
        p_category:category,
        p_position:Number(current.song_position)||0,
        p_reference_url:reference||null
      });
      const msg=$('songMsg');
      if(error){console.warn('[HN Repertoire Reference] update',error);if(msg)msg.textContent='La canción se guardó, pero no el link';return}
      if(msg)msg.textContent='Guardado';
      await fetchSongs();
      song.classList.remove('hn-song-editing');
      scheduleDecorate();
    };
  }

  function decorate(){
    installStyle();
    ensureAddField();
    document.querySelectorAll('#songList .song').forEach(decorateSong);
  }

  function scheduleDecorate(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(decorate,60);
  }

  async function init(){
    installStyle();
    for(let i=0;i<30&&!getClient();i++)await new Promise(resolve=>setTimeout(resolve,100));
    client=getClient();
    if(!client)return;
    await fetchSongs();
    decorate();
    const root=document.querySelector('.dashboard')||document.body;
    observer=new MutationObserver(scheduleDecorate);
    observer.observe(root,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
