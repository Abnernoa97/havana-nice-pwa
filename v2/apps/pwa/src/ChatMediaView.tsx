import {useEffect,useState} from 'react';
import {HAVANA_V2_DEV_API_BASE_URL as API} from '@havana/shared';
export type ChatMedia={assetId:string;kind:'photo'|'video';mimeType:string;sizeBytes:number;name:string};
/** One viewer used by Chat and Administrator; original bytes stay in HAVANA CLOUD. */
export default function ChatMediaView({media,token}:{media:ChatMedia;token:string}){
 const [url,setUrl]=useState(''),[error,setError]=useState('');
 useEffect(()=>{
   let mounted=true;
   setUrl('');setError('');
   void fetch(API+'/api/chat/media/'+media.assetId+'/grant',{
     headers:{Authorization:'Bearer '+token},cache:'no-store'
   }).then(async r=>{
     if(!r.ok)throw Error('No se pudo abrir el archivo');
     return r.json() as Promise<{url:string}>;
   }).then(value=>{
     if(mounted&&value.url.startsWith(API+'/api/chat/media/'))setUrl(value.url);
     else if(mounted)setError('Vista previa no disponible');
   }).catch(()=>{if(mounted)setError('No se pudo abrir el archivo');});
   return()=>{mounted=false;};
 },[media.assetId,token]);
 return <div className="hn-chat-media" style={{maxWidth:360,width:'100%',margin:'6px 0'}}>
   {url?(media.kind==='photo'
     ?<a href={url} target="_blank" rel="noreferrer" aria-label={'Abrir fotografía '+media.name}>
       <img src={url} alt={media.name} loading="lazy" style={{maxWidth:'100%',maxHeight:340,objectFit:'contain',borderRadius:10}}/>
      </a>
     :<video src={url} controls playsInline preload="metadata"
       aria-label={'Reproducir video '+media.name} style={{width:'100%',maxHeight:340,borderRadius:10}}/>)
     :<span>{error||'Cargando archivo…'}</span>}
   <small style={{display:'block',marginTop:4,overflowWrap:'anywhere'}}>
     {media.name} · {(media.sizeBytes/1048576).toFixed(1)} MB
   </small>
 </div>;
}
