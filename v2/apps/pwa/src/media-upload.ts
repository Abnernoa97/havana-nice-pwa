import {HAVANA_V2_DEV_API_BASE_URL as API} from '@havana/shared';
import type {ChatMediaSelection,ChatSession} from '@havana/shared';
export type UploadProgress={sent:number;total:number};
async function request(session:ChatSession,path:string,options:RequestInit={}){
 const response=await fetch(API+path,{...options,cache:'no-store',headers:{
  Authorization:'Bearer '+session.token,...options.headers
 }});
 const data=await response.json() as {error?:string;assetId?:string;
  nextOffset?:number;chunkBytes?:number;complete?:boolean};
 if(!response.ok)throw Error(data.error||'La transferencia no se pudo completar');
 return data;
}
// Identical bytes from the gallery; no canvas, compression or base64.
export async function uploadOriginalMedia(
 session:ChatSession,selection:ChatMediaSelection,file:File,clientId:string,
 onProgress:(progress:UploadProgress)=>void
):Promise<void>{
 if(file.size!==selection.sizeBytes)throw Error('La fotografía o video seleccionado cambió');
 const meta=await request(session,'/api/chat/media/start',{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({clientId,kind:selection.kind,name:selection.name,
   mimeType:selection.mimeType,sizeBytes:selection.sizeBytes})
 });
 if(!meta.assetId||!Number.isSafeInteger(meta.nextOffset))throw Error('No se confirmó la sesión de almacenamiento');
 if(meta.complete)return;
 let offset=meta.nextOffset as number;
 const chunkBytes=Math.min(4*1048576,meta.chunkBytes||4*1048576);
 while(offset<file.size){
  const chunk=file.slice(offset,Math.min(offset+chunkBytes,file.size));
  let result=null,failed=null;
  for(let attempt=0;attempt<3;attempt++){
   try{
    result=await request(session,'/api/chat/media/'+meta.assetId+'/chunk',{
      method:'POST',headers:{
        'content-type':'application/octet-stream',
        'x-havana-v2-offset':String(offset)
      },body:chunk
    });
    break;
   }catch(reason){
    failed=reason;
    if(attempt<2)await new Promise(resolve=>setTimeout(resolve,400*(2**attempt)));
   }
  }
  if(!result)throw failed||Error('La subida fue interrumpida');
  if(typeof result.nextOffset!=='number'||!Number.isSafeInteger(result.nextOffset)||result.nextOffset<=offset||
      result.nextOffset>file.size)throw Error('No se pudo confirmar el avance del archivo');
  offset=result.nextOffset;
  onProgress({sent:offset,total:file.size});
  if(result.complete)return;
 }
 throw Error('El archivo terminó, pero no se confirmó en HAVANA CLOUD');
}
