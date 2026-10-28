// HAVANA NICE V2: adapter exclusively to EXISTING HAVANA CLOUD API.
// CLOUD Worker/repository, Google OAuth and personal gallery are not modified.
import {requestExistingCloud} from './cloud-link.js';

const FIELDS='asset_id,upload_key,next_offset,cloud_media_key,owner_nonce,stage';
const CHUNK=4*1048576;
const bytesJson=async response=>{try{return await response.json()}catch{return{}}};
const status=async(env,assetId)=>env.DB.prepare('SELECT '+FIELDS+' FROM chat_cloud_uploads WHERE asset_id=?').bind(assetId).first();

export async function cloudStart(env,record){
 let row=await status(env,record.asset_id);
 if(row?.stage==='ready'&&row.cloud_media_key)
  return {complete:true,nextOffset:record.bytes,cloudKey:row.cloud_media_key};
 if(row?.stage==='uploading'&&row.upload_key)
  return {complete:false,nextOffset:row.next_offset,chunkBytes:CHUNK};
 if(row?.stage==='starting')throw Error('cloud_session_preparing');

 // Only one request creates an upload session for each Chat attachment.
 const nonce=crypto.randomUUID(),now=Date.now();
 if(!row){
  const created=await env.DB.prepare(
   "INSERT OR IGNORE INTO chat_cloud_uploads(asset_id,upload_key,next_offset,cloud_media_key,owner_nonce,stage,updated_at) VALUES(?,NULL,0,NULL,?,'starting',?)"
  ).bind(record.asset_id,nonce,now).run();
  if(created.meta?.changes!==1)throw Error('cloud_session_preparing');
 }else{
  const owned=await env.DB.prepare(
   "UPDATE chat_cloud_uploads SET stage='starting',owner_nonce=?,updated_at=? WHERE asset_id=? AND stage='failed'"
  ).bind(nonce,now,record.asset_id).run();
  if(owned.meta?.changes!==1)throw Error('cloud_session_preparing');
 }
 try{
  const cloud=await requestExistingCloud(env,'/api/google/upload/session',{
   method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({name:record.original_name,size:record.bytes,
     type:record.mime,eventName:'HAVANA NICE APP'})
  });
  if(!cloud.ok)throw Error(cloud.status===413?'cloud_no_space':'cloud_session_failed');
  const answer=await bytesJson(cloud);
  if(typeof answer.uploadKey!=='string'||answer.uploadKey.length<8)
   throw Error('cloud_session_failed');
  const updated=await env.DB.prepare(
   "UPDATE chat_cloud_uploads SET upload_key=?,stage='uploading',next_offset=0,updated_at=? WHERE asset_id=? AND owner_nonce=? AND stage='starting'"
  ).bind(answer.uploadKey,Date.now(),record.asset_id,nonce).run();
  if(updated.meta?.changes!==1)throw Error('cloud_session_preparing');
  return {complete:false,nextOffset:0,chunkBytes:CHUNK};
 }catch(err){
  await env.DB.prepare(
   "UPDATE chat_cloud_uploads SET stage='failed',updated_at=? WHERE asset_id=? AND owner_nonce=? AND stage='starting'"
  ).bind(Date.now(),record.asset_id,nonce).run().catch(()=>{});
  throw err;
 }
}
export async function cloudChunk(env,record,offset,data){
 const row=await status(env,record.asset_id);
 if(!row||row.stage==='starting')throw Error('cloud_session_preparing');
 if(row.stage==='ready'&&row.cloud_media_key)
  return {complete:true,nextOffset:record.bytes,cloudKey:row.cloud_media_key};
 if(row.stage!=='uploading'||!row.upload_key)throw Error('cloud_session_failed');
 if(offset<row.next_offset)return {complete:false,nextOffset:row.next_offset};
 if(offset!==row.next_offset)throw Error('cloud_offset_conflict');
 if(!(data instanceof ArrayBuffer)||data.byteLength<1||data.byteLength>CHUNK||
    offset+data.byteLength>record.bytes)throw Error('cloud_chunk_invalid');
 if(offset+data.byteLength<record.bytes&&data.byteLength%262144!==0)
  throw Error('cloud_chunk_invalid');
 const nonce=crypto.randomUUID();
 const locked=await env.DB.prepare(
   "UPDATE chat_cloud_uploads SET stage='starting',owner_nonce=?,updated_at=? WHERE asset_id=? AND next_offset=? AND stage='uploading'"
 ).bind(nonce,Date.now(),record.asset_id,offset).run();
 if(locked.meta?.changes!==1)throw Error('cloud_session_preparing');
 try{
  const cloud=await requestExistingCloud(env,'/api/google/upload/chunk',{
   method:'POST',headers:{'content-type':'application/octet-stream',
     'x-upload-key':row.upload_key,'x-upload-start':String(offset)},
   body:data
  });
  const answer=await bytesJson(cloud);
  if(!cloud.ok)throw Error(cloud.status===404?'cloud_remote_session_missing':'cloud_chunk_failed');
  if(answer.complete){
   const cloudKey=answer.item?.key;
   if(typeof cloudKey!=='string'||!/^[0-9a-f-]{36}$/i.test(cloudKey))
    throw Error('cloud_file_unconfirmed');
   await env.DB.prepare(
    "UPDATE chat_cloud_uploads SET stage='ready',cloud_media_key=?,next_offset=?,updated_at=? WHERE asset_id=? AND owner_nonce=?"
   ).bind(cloudKey,record.bytes,Date.now(),record.asset_id,nonce).run();
   return{complete:true,nextOffset:record.bytes,cloudKey};
  }
  const next=Number(answer.nextOffset);
  if(!Number.isSafeInteger(next)||next<=offset||next>record.bytes)
   throw Error('cloud_offset_unconfirmed');
  await env.DB.prepare(
   "UPDATE chat_cloud_uploads SET stage='uploading',next_offset=?,updated_at=? WHERE asset_id=? AND owner_nonce=?"
  ).bind(next,Date.now(),record.asset_id,nonce).run();
  return{complete:false,nextOffset:next};
 }catch(err){
  // Do not open a second Drive session on an uncertain Google reply.
  // A retry of the same chunk is safe, while an unconfirmed final chunk
  // stays pending rather than manufacturing a Chat message.
  await env.DB.prepare(
   "UPDATE chat_cloud_uploads SET stage='uploading',updated_at=? WHERE asset_id=? AND owner_nonce=? AND stage='starting'"
  ).bind(Date.now(),record.asset_id,nonce).run().catch(()=>{});
  throw err;
 }
}
export async function cloudRead(env,assetId,range){
 const row=await status(env,assetId);
 if(row?.stage!=='ready'||!row.cloud_media_key)throw Error('cloud_file_unavailable');
 const headers=new Headers();
 if(range)headers.set('range',range);
 return requestExistingCloud(env,'/api/media/'+row.cloud_media_key+'/content',{method:'GET',headers});
}
export async function cloudDelete(env,assetId){
 const row=await status(env,assetId);
 if(!row?.cloud_media_key)throw Error('cloud_file_unavailable');
 const call=(path)=>requestExistingCloud(env,path,{method:'POST',
  headers:{'content-type':'application/json'},body:JSON.stringify({keys:[row.cloud_media_key]})});
 // A previous attempt can have moved the original to Cloud's bin before
 // losing its response. Retry the existing permanent-delete endpoint even if
 // the item is already there. Never claim success without a deletedKeys ack.
 const trash=await call('/api/media/delete');
 if(!trash.ok)throw Error('cloud_delete_unconfirmed');
 const deleteResult=await call('/api/trash/delete'),confirmed=await bytesJson(deleteResult);
 if(!deleteResult.ok||!confirmed.deletedKeys?.includes(row.cloud_media_key))
  throw Error('cloud_delete_unconfirmed');
 return true;
}
