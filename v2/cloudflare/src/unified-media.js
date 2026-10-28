// HAVANA NICE V2 / one media API. D1 owns only metadata and message relations.
import {cloudLinkConfigured,cloudLinkStatus} from './cloud-link.js';
import {cloudStart,cloudChunk,cloudRead} from './cloud-media-adapter.js';
// HAVANA CLOUD owns original bytes; the private service binding never exposes Google IDs.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPES={photo:{max:100*1048576,mimes:['image/jpeg','image/png','image/webp','image/heic','image/heif']},
 video:{max:10*1024*1024*1024,mimes:['video/mp4','video/quicktime']}};
const CHUNK_BYTES=4*1048576;
const MAX_BATCH_FILES=5;
const enc=new TextEncoder();
async function signGrant(env,assetId,expires){
 const key=await crypto.subtle.importKey('raw',enc.encode(env.V2_ADMIN_LOGIN_SECRET),
   {name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(assetId+':'+expires)));
 return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export async function verifyMediaGrant(env,url){
 if(!mediaConfigured(env))return false;
 const match=/^\/api\/chat\/media\/([0-9a-f-]{36})\/file$/.exec(url.pathname);
 if(!match||!UUID.test(match[1]))return false;
 const expires=Number(url.searchParams.get('exp'));
 const sig=url.searchParams.get('sig')||'';
 if(!Number.isSafeInteger(expires)||expires<Date.now()||expires>Date.now()+3600_000||
    !/^[A-Za-z0-9_-]{40,60}$/.test(sig))return false;
 const expected=await signGrant(env,match[1],expires);
 if(sig.length!==expected.length)return false;
 let difference=0;for(let i=0;i<sig.length;i++)difference|=sig.charCodeAt(i)^expected.charCodeAt(i);
 return difference===0;
}
export const mediaConfigured=env=>cloudLinkConfigured(env)&&
 env?.V2_CLOUD_MEDIA_ENABLED==='enabled';
function validMetadata(m){
 const rule=TYPES[m?.kind];
 return rule&&UUID.test(m.clientId||'')&&UUID.test(m.batchId||'')&&
   Number.isInteger(m.batchIndex)&&m.batchIndex>=0&&m.batchIndex<MAX_BATCH_FILES&&
   typeof m.name==='string'&&m.name.length>0&&m.name.length<=180&&
   !/[\\/\x00-\x1f\x7f]/.test(m.name)&&
   rule.mimes.includes(m.mimeType)&&
   Number.isSafeInteger(m.sizeBytes)&&m.sizeBytes>0&&m.sizeBytes<=rule.max;
}
export async function attachChatMedia(env,messages){
 if(!messages?.length)return messages||[];
 const ids=messages.map(m=>m.seq).filter(Number.isSafeInteger);
 if(!ids.length)return messages;
 try{
 const result=await env.DB.prepare(
  'SELECT asset_id,message_seq,kind,mime,bytes,original_name FROM chat_media_assets '+
  'WHERE status=? AND message_seq IN ('+ids.map(()=>'?').join(',')+')')
   .bind('ready',...ids).all();
 const map=new Map((result.results||[]).map(row=>[row.message_seq,{
  assetId:row.asset_id,kind:row.kind,mimeType:row.mime,
  sizeBytes:row.bytes,name:row.original_name
 }]));
 return messages.map(m=>({...m,media:map.get(m.seq)||null}));
 }catch{return messages;}
}
// Persist the original's Chat bubble atomically, only AFTER Drive confirmation.
// Repeating start after a lost response repairs the same message without duplicates.
export async function finalizeConfirmedMedia(env,record,session,notify){
 const now=new Date().toISOString();
 await env.DB.batch([
  env.DB.prepare(
   'INSERT OR IGNORE INTO chat_messages(client_message_id,sender_id,sender_name,body,created_at) VALUES(?,?,?,?,?)'
  ).bind(record.client_id,record.sender_id,session.displayName,
    record.kind==='photo'?'📷 Foto':'🎬 Video',now),
  env.DB.prepare(
   "UPDATE chat_media_assets SET status='ready',completed_at=COALESCE(completed_at,?),"+
   ' message_seq=(SELECT seq FROM chat_messages WHERE sender_id=? AND client_message_id=?) '+
   'WHERE asset_id=? AND sender_id=?'
  ).bind(now,record.sender_id,record.client_id,record.asset_id,record.sender_id)
 ]);
 const linked=await env.DB.prepare('SELECT message_seq FROM chat_media_assets WHERE asset_id=? AND status=?')
   .bind(record.asset_id,'ready').first();
 if(!Number.isSafeInteger(linked?.message_seq)||linked.message_seq<1)
   throw Error('media_chat_link_not_confirmed');
 await notify(linked.message_seq).catch(()=>{});
 return linked.message_seq;
}
export async function handleUnifiedChatMedia(request,env,session,url,origin,respond,notify){
 const reply=(obj,status=200)=>respond(obj,status,origin);
 const path=url.pathname;
 if(!session)return reply({error:'No autorizado'},401);
 if(path==='/api/chat/media/status'&&request.method==='GET'){
   const linked=mediaConfigured(env)&&((await cloudLinkStatus(env)).linked===true);
   return reply({enabled:linked,maxPhotoBytes:TYPES.photo.max,
     maxVideoBytes:TYPES.video.max,chunkBytes:CHUNK_BYTES,maxFilesPerSend:MAX_BATCH_FILES});
 }
 if(!mediaConfigured(env))return reply({error:'HAVANA CLOUD todavía no está enlazada'},503);
 if(path==='/api/chat/media/start'&&request.method==='POST'){
   let m;try{m=await request.json()}catch{return reply({error:'Archivo inválido'},400);}
   if(!validMetadata(m))return reply({error:'Archivo no admitido'},400);
   // Do not create a D1 asset or remote upload before owner pairing.
   if(!(await cloudLinkStatus(env)).linked)
     return reply({error:'Vincula HAVANA CLOUD desde el Administrador'},503);
   const old=await env.DB.prepare('SELECT * FROM chat_media_assets WHERE sender_id=? AND client_id=?')
     .bind(session.actorId,m.clientId).first();
   if(old&&(old.batch_id!==m.batchId||old.batch_index!==m.batchIndex||
      old.kind!==m.kind||old.mime!==m.mimeType||
      old.bytes!==m.sizeBytes||old.original_name!==m.name))
     return reply({error:'El identificador ya corresponde a otro archivo'},409);
   const assetId=old?.asset_id||crypto.randomUUID();
   if(!old){
     const ins=await env.DB.prepare(
       "INSERT OR IGNORE INTO chat_media_assets(asset_id,sender_id,client_id,batch_id,batch_index,kind,mime,bytes,original_name,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,'uploading',?)"
     ).bind(assetId,session.actorId,m.clientId,m.batchId,m.batchIndex,m.kind,m.mimeType,m.sizeBytes,m.name,new Date().toISOString()).run();
     if(ins.meta?.changes!==1)return reply({error:'Vuelve a intentar preparar el archivo'},409);
   }
   if(old?.status==='ready'&&old.message_seq)
     return reply({assetId,complete:true,nextOffset:m.sizeBytes,chunkBytes:CHUNK_BYTES});
   let remote;
   try{
     remote=await cloudStart(env,old||{
       asset_id:assetId,bytes:m.sizeBytes,mime:m.mimeType,
       original_name:m.name,sender_id:session.actorId,client_id:m.clientId,kind:m.kind
     });
   }catch(error){
     const reason=error instanceof Error?error.message:'cloud_session_failed';
     return reply({error:reason==='cloud_not_linked'?'Autoriza HAVANA CLOUD desde el Administrador':
       reason==='cloud_no_space'?'No queda espacio de Google Drive':
       reason==='cloud_session_preparing'?'Archivo en preparación; vuelve a intentar':
       'No se pudo preparar la transferencia con HAVANA CLOUD'},
       reason==='cloud_no_space'?507:reason==='cloud_session_preparing'?409:503);
   }
   if(remote.complete){
     try{await finalizeConfirmedMedia(env,old||{
       asset_id:assetId,client_id:m.clientId,kind:m.kind,sender_id:session.actorId
     },session,notify);}
     catch{return reply({error:'Archivo guardado; mensaje pendiente de confirmación'},503);}
   }
   return reply({assetId,complete:remote.complete===true,
     nextOffset:remote.nextOffset,chunkBytes:CHUNK_BYTES});
 }
 const grant=/^\/api\/chat\/media\/([0-9a-f-]{36})\/grant$/.exec(path);
 if(grant&&request.method==='GET'&&UUID.test(grant[1])){
   const row=await env.DB.prepare("SELECT asset_id FROM chat_media_assets WHERE asset_id=? AND status='ready' AND message_seq IS NOT NULL")
     .bind(grant[1]).first();
   if(!row)return reply({error:'Archivo no encontrado'},404);
   const expires=Date.now()+45*60*1000;
   const sig=await signGrant(env,grant[1],expires);
   return reply({url:url.origin+'/api/chat/media/'+grant[1]+'/file?exp='+expires+'&sig='+sig,
     expiresAt:new Date(expires).toISOString()});
 }
 const found=/^\/api\/chat\/media\/([0-9a-f-]{36})\/(chunk|file)$/.exec(path);
 if(!found||!UUID.test(found[1]))return reply({error:'Archivo no encontrado'},404);
 const assetId=found[1],action=found[2];
 const record=await env.DB.prepare('SELECT * FROM chat_media_assets WHERE asset_id=?')
   .bind(assetId).first();
 if(!record)return reply({error:'Archivo no encontrado'},404);
 if(action==='chunk'&&request.method==='POST'){
   if(record.sender_id!==session.actorId)return reply({error:'No autorizado'},403);
   const offset=Number(request.headers.get('x-havana-v2-offset'));
   if(!Number.isSafeInteger(offset)||offset<0||offset>=record.bytes||
      Number(request.headers.get('content-length')||0)>CHUNK_BYTES)
     return reply({error:'Fragmento inválido'},400);
   if(!request.body)return reply({error:'Fragmento vacío'},400);
   const data=await request.arrayBuffer();
   if(!data.byteLength||data.byteLength>CHUNK_BYTES)return reply({error:'Fragmento inválido'},400);
   let received;
   try{received=await cloudChunk(env,record,offset,data);}
   catch(error){
     const reason=error instanceof Error?error.message:'cloud_chunk_failed';
     return reply({error:reason==='cloud_offset_conflict'?'Fragmento fuera de orden':
       reason==='cloud_session_preparing'?'Fragmento en preparación; reintenta':
       'Transferencia pendiente de confirmación'},
       reason==='cloud_offset_conflict'||reason==='cloud_session_preparing'?409:502);
   }
   if(received.complete){
     try{await finalizeConfirmedMedia(env,record,session,notify);}
     catch{return reply({error:'Archivo guardado; mensaje pendiente de confirmación'},503);}
   }
   return reply({assetId,complete:received.complete,nextOffset:received.nextOffset});
 }
 if(action==='file'&&request.method==='GET'){
   if(record.status!=='ready'||!record.message_seq)return reply({error:'Archivo no disponible'},404);
   const headers=new Headers();
   if(request.headers.has('range'))headers.set('range',request.headers.get('range'));
   try{
     const result=await cloudRead(env,assetId,headers.get('range'));
     if(!result.ok)return reply({error:'Archivo temporalmente no disponible'},result.status===404?404:502);
     const output=new Headers(result.headers);
     output.set('access-control-allow-origin',origin||'https://havana-nice-v2-dev.pages.dev');
     output.set('vary','Origin');output.set('cache-control','private, no-store');
     return new Response(result.body,{status:result.status,headers:output});
   }catch{return reply({error:'No se pudo leer el archivo'},502);}
 }
 return reply({error:'Método no permitido'},405);
}
