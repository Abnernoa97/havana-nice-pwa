import {File,FileMode} from 'expo-file-system';
import {HAVANA_V2_DEV_API_BASE_URL as API} from '@havana/shared';
import type {ChatMediaSelection,ChatSession} from '@havana/shared';
type Reply={assetId?:string;nextOffset?:number;chunkBytes?:number;complete?:boolean;error?:string};
async function call(session:ChatSession,path:string,options:RequestInit={}):Promise<Reply>{
 const result=await fetch(API+path,{...options,headers:{Authorization:'Bearer '+session.token,...options.headers}});
 const body=await result.json() as Reply;
 if(!result.ok)throw Error(body.error||'No se pudo guardar el archivo');
 return body;
}
export function newMediaUploadId(){
 // UUID is only an idempotency key. Server uses crypto.randomUUID for asset IDs.
 const rnd=(n:number)=>Array.from({length:n},()=>Math.floor(Math.random()*16).toString(16)).join('');
 return rnd(8)+'-'+rnd(4)+'-4'+rnd(3)+'-8'+rnd(3)+'-'+rnd(12);
}
/** Bounded native reads: never load a 10 GiB video into JavaScript memory. */
export async function uploadNativeOriginal(
 session:ChatSession,selected:ChatMediaSelection,clientId:string,
 batchId:string,batchIndex:number,
 report:(sent:number,total:number)=>void
):Promise<void>{
 const original=new File(selected.uri);
 const handle=original.open(FileMode.ReadOnly);
 try{
  if(handle.size!==selected.sizeBytes)throw Error('El archivo seleccionado ya no está disponible');
  const prepare=()=>call(session,'/api/chat/media/start',{
   method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({clientId,batchId,batchIndex,kind:selected.kind,name:selected.name,
     mimeType:selected.mimeType,sizeBytes:selected.sizeBytes})
  });
  let state=await prepare();
  if(!state.assetId||!Number.isSafeInteger(state.nextOffset))
    throw Error('HAVANA CLOUD no confirmó la sesión');
  let offset=state.nextOffset as number;
  const pieceSize=Math.min(state.chunkBytes||4*1048576,4*1048576);
  if(state.complete)return;
  while(offset<selected.sizeBytes){
   handle.offset=offset;
   const piece=await handle.readBytes(Math.min(pieceSize,selected.sizeBytes-offset));
   if(!piece.length)throw Error('No se pudo leer el archivo original');
   let answer:Reply|undefined;let error:unknown;
   for(let attempt=0;attempt<3;attempt++){
    try{
     answer=await call(session,'/api/chat/media/'+state.assetId+'/chunk',{
       method:'POST',headers:{'content-type':'application/octet-stream',
         'x-havana-v2-offset':String(offset)},
       body:new Blob([piece])
     });break;
    }catch(reason){
     error=reason;
     if(attempt<2)await new Promise<void>(resolve=>setTimeout(resolve,500*(attempt+1)));
    }
   }
   if(!answer){
     // Server has the authoritative offset; do not assume a failed ack
     // means Google failed to store the bytes.
     state=await prepare();
     if(state.complete)return;
     if(state.nextOffset!==offset&&Number.isSafeInteger(state.nextOffset)){
       offset=state.nextOffset as number;continue;
     }
     throw error||Error('Transferencia detenida');
   }
   if(typeof answer.nextOffset!=='number'||answer.nextOffset<=offset||
      answer.nextOffset>selected.sizeBytes)
     throw Error('HAVANA CLOUD no confirmó el avance');
   offset=answer.nextOffset;report(offset,selected.sizeBytes);
   if(answer.complete)return;
  }
  throw Error('La transferencia terminó sin confirmación de almacenamiento');
 }finally{handle.close();}
}
