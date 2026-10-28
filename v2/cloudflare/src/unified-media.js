// HAVANA NICE V2 / one media API. D1 owns only metadata and message relations.
// HAVANA CLOUD owns original bytes; the private service binding never exposes Google IDs.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPES={photo:{max:100*1048576,mimes:['image/jpeg','image/png','image/webp','image/heic','image/heif']},
 video:{max:10*1024*1024*1024,mimes:['video/mp4','video/quicktime']}};
const CHUNK_BYTES=4*1048576;
export const mediaConfigured=env=>env?.V2_CLOUD_BRIDGE_ENABLED==='enabled'&&
 env?.V2_CLOUD_BRIDGE_MEDIA_ENABLED==='enabled'&&
 typeof env?.V2_CLOUD_BRIDGE_SECRET==='string'&&env.V2_CLOUD_BRIDGE_SECRET.length>=40&&
 typeof env?.HAVANA_CLOUD_BRIDGE?.fetch==='function';
function privateRequest(env,path,options={}){
 const headers=new Headers(options.headers||{});
 headers.set('x-havana-v2-internal-token',env.V2_CLOUD_BRIDGE_SECRET);
 return env.HAVANA_CLOUD_BRIDGE.fetch('https://havana-cloud.internal'+path,
   {...options,headers});
}
const bad=(respond,origin,error,status)=>respond({error},status,origin);
function validMetadata(m){
 const rule=TYPES[m?.kind];
 return rule&&UUID.test(m.clientId||'')&&
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
export async function handleUnifiedChatMedia(request,env,session,url,origin,respond,notify){
 const reply=(obj,status=200)=>respond(obj,status,origin);
 const path=url.pathname;
 if(!session)return reply({error:'No autorizado'},401);
 if(path==='/api/chat/media/status'&&request.method==='GET')
   return reply({enabled:mediaConfigured(env),maxPhotoBytes:TYPES.photo.max,
     maxVideoBytes:TYPES.video.max,chunkBytes:CHUNK_BYTES});
 if(!mediaConfigured(env))return reply({error:'HAVANA CLOUD todavía no está enlazada'},503);
 if(path==='/api/chat/media/start'&&request.method==='POST'){
   let m;try{m=await request.json()}catch{return reply({error:'Archivo inválido'},400);}
   if(!validMetadata(m))return reply({error:'Archivo no admitido'},400);
   const old=await env.DB.prepare('SELECT * FROM chat_media_assets WHERE sender_id=? AND client_id=?')
     .bind(session.actorId,m.clientId).first();
   if(old&&(old.kind!==m.kind||old.mime!==m.mimeType||
      old.bytes!==m.sizeBytes||old.original_name!==m.name))
     return reply({error:'El identificador ya corresponde a otro archivo'},409);
   const assetId=old?.asset_id||crypto.randomUUID();
   if(!old){
     const ins=await env.DB.prepare(
       "INSERT OR IGNORE INTO chat_media_assets(asset_id,sender_id,client_id,kind,mime,bytes,original_name,status,created_at) VALUES(?,?,?,?,?,?,?,'uploading',?)"
     ).bind(assetId,session.actorId,m.clientId,m.kind,m.mimeType,m.sizeBytes,m.name,new Date().toISOString()).run();
     if(ins.meta?.changes!==1)return reply({error:'Vuelve a intentar preparar el archivo'},409);
   }
   if(old?.status==='ready'&&old.message_seq)
     return reply({assetId,complete:true,nextOffset:m.sizeBytes,chunkBytes:CHUNK_BYTES});
   let remote;
   try{
     const r=await privateRequest(env,'/api/internal/havana-v2/media/start',{
       method:'POST',headers:{'content-type':'application/json'},
       body:JSON.stringify({assetId,actorId:session.actorId,clientId:m.clientId,
         kind:m.kind,fileName:m.name,mimeType:m.mimeType,sizeBytes:m.sizeBytes})
     });
     if(!r.ok)return reply({error:'No hay almacenamiento disponible'},r.status===507?507:502);
     remote=await r.json();
   }catch{return reply({error:'No se pudo conectar con HAVANA CLOUD'},502);}
   return reply({assetId,complete:remote.state==='ready',
     nextOffset:remote.nextOffset,chunkBytes:CHUNK_BYTES});
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
   let upstream;
   try{
     upstream=await privateRequest(env,'/api/internal/havana-v2/media/'+assetId+'/chunk',{
       method:'POST',headers:{
         'x-havana-v2-actor-id':session.actorId,'x-havana-v2-offset':String(offset),
         'content-type':'application/octet-stream'},
       body:request.body
     });
   }catch{return reply({error:'Error temporal de conexión'},502);}
   if(!upstream.ok)return reply({error:'Transferencia pendiente de reconciliar'},upstream.status===409?409:502);
   const received=await upstream.json();
   if(received.complete){
     if(record.status!=='ready'||!record.message_seq){
       const [marker]=await env.DB.batch([
         env.DB.prepare("UPDATE chat_media_assets SET status='ready',completed_at=? WHERE asset_id=?")
           .bind(new Date().toISOString(),assetId)
       ]);
       const text=record.kind==='photo'?'📷 Foto':'🎬 Video';
       await env.DB.prepare(
         'INSERT OR IGNORE INTO chat_messages(client_message_id,sender_id,sender_name,body,created_at) VALUES(?,?,?,?,?)'
       ).bind(record.client_id,session.actorId,session.displayName,text,new Date().toISOString()).run();
       const message=await env.DB.prepare(
         'SELECT seq FROM chat_messages WHERE sender_id=? AND client_message_id=?'
       ).bind(session.actorId,record.client_id).first();
       if(!message)return reply({error:'Archivo guardado, mensaje pendiente'},503);
       await env.DB.prepare('UPDATE chat_media_assets SET message_seq=? WHERE asset_id=? AND message_seq IS NULL')
         .bind(message.seq,assetId).run();
       await notify(message.seq).catch(()=>{});
     }
   }
   return reply({assetId,complete:received.complete,nextOffset:received.nextOffset});
 }
 if(action==='file'&&request.method==='GET'){
   if(record.status!=='ready'||!record.message_seq)return reply({error:'Archivo no disponible'},404);
   const headers=new Headers();
   if(request.headers.has('range'))headers.set('range',request.headers.get('range'));
   try{
     const result=await privateRequest(env,'/api/internal/havana-v2/media/'+assetId+'/file',{headers});
     if(!result.ok)return reply({error:'Archivo temporalmente no disponible'},result.status===404?404:502);
     const output=new Headers(result.headers);
     output.set('access-control-allow-origin',origin||'https://havana-nice-v2-dev.pages.dev');
     output.set('vary','Origin');output.set('cache-control','private, no-store');
     return new Response(result.body,{status:result.status,headers:output});
   }catch{return reply({error:'No se pudo leer el archivo'},502);}
 }
 return reply({error:'Método no permitido'},405);
}
