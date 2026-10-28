import React,{useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,Image,Modal,Pressable,Text,View,useWindowDimensions} from 'react-native';
import {File,Paths} from 'expo-file-system';
import {VideoView,useVideoPlayer} from 'expo-video';
import {HAVANA_V2_DEV_API_BASE_URL as API} from '@havana/shared';
import type {ChatMessage,ChatSession} from '@havana/shared';

type Media=NonNullable<ChatMessage['media']>;
const MAX_ORIGINAL_IMAGE_BYTES=100*1024*1024;
const pendingPhotos=new Map<string,Promise<string>>();
const identifier=(value:string)=>value.replace(/[^0-9a-f-]/gi,'').slice(0,36);
const photoPath=(media:Media)=>{const ext=media.mimeType==='image/png'?'png':media.mimeType==='image/webp'?'webp':media.mimeType==='image/heic'||media.mimeType==='image/heif'?'heic':'jpg';return new File(Paths.cache,'hn-v2-chat-photo-'+identifier(media.assetId)+'-'+media.sizeBytes+'.'+ext);};

// The private app cache is best effort: no Google credentials, device tokens or
// private signed URLs are persisted. Complete originals are atomic on disk.
// A failed/partial download is NEVER opened as a photograph.
async function cacheWholePhoto(media:Media,remoteUrl:string){
 if(media.sizeBytes<=0||media.sizeBytes>MAX_ORIGINAL_IMAGE_BYTES)
  throw Error('Fotografía no admitida');
 const key=identifier(media.assetId)+':'+media.sizeBytes;
 const existing=pendingPhotos.get(key);
 if(existing)return existing;
 const work=(async()=>{
  const cached=photoPath(media);
  if(cached.exists&&cached.size===media.sizeBytes)return cached.uri;
  if(cached.exists)cached.delete();
  const temporary=new File(Paths.cache,'hn-v2-photo-transfer-'+identifier(media.assetId)+'-'+Date.now()+'.part');
  try{
   const finished=await File.downloadFileAsync(remoteUrl,temporary,{idempotent:true});
   if(!finished.exists||finished.size!==media.sizeBytes)
    throw Error('No se recibió la fotografía completa');
   await finished.move(cached);
   if(!cached.exists||cached.size!==media.sizeBytes)
    throw Error('No se verificó la fotografía original');
   return cached.uri;
  }catch(error){
   if(temporary.exists)temporary.delete();
   throw error;
  }
 })();
 pendingPhotos.set(key,work);
 try{return await work;}
 finally{if(pendingPhotos.get(key)===work)pendingPhotos.delete(key);}
}

function InlineNativeVideo({url,width}:{url:string;width:number}){
 const player=useVideoPlayer({uri:url},value=>{value.loop=false;});
 return <View style={{width,overflow:'hidden',borderRadius:12,backgroundColor:'#171717'}}>
  <VideoView player={player} nativeControls contentFit="contain"
   surfaceType="textureView" style={{width,height:Math.round(width*1.16)}}/>
 </View>;
}

export default function NativeChatMediaView({
 media,session
}:{media:Media;session:ChatSession}){
 const [signed,setSigned]=useState('');
 const [photo,setPhoto]=useState('');
 const [ratio,setRatio]=useState(1);
 const [enlarged,setEnlarged]=useState(false);
 const [error,setError]=useState('');
 const {width:screenWidth,height:screenHeight}=useWindowDimensions();
 const width=useMemo(()=>Math.max(170,Math.min(350,Math.floor(screenWidth*.85)-28)),[screenWidth]);
 const height=Math.max(60,Math.round(width/ratio));

 useEffect(()=>{
  let active=true;
  const abort=new AbortController();
  setSigned('');setPhoto('');setRatio(1);setError('');setEnlarged(false);
  void (async()=>{
   // Reuse a verified original directly from private app cache, including
   // offline views. No new signed grant or network download is needed.
   if(media.kind==='photo'){
    const cached=photoPath(media);
    if(cached.exists&&cached.size===media.sizeBytes){
     Image.getSize(cached.uri,(w,h)=>{if(active){setRatio(w>0&&h>0?w/h:1);setPhoto(cached.uri);}},()=>{});
     return;
    }
   }
   // Refresh signed URLs only for network reads, never persist them.
   const result=await fetch(API+'/api/chat/media/'+media.assetId+'/grant',{
    headers:{Authorization:'Bearer '+session.token},signal:abort.signal
   });
   if(!result.ok)throw Error('Archivo no disponible');
   const grant=await result.json() as {url?:string};
   const url=grant.url||'';
   if(!url.startsWith(API+'/api/chat/media/'))throw Error('Archivo no disponible');
   if(!active)return;
   setSigned(url);
   if(media.kind!=='photo')return;
   const local=await cacheWholePhoto(media,url);
   if(!active)return;
   Image.getSize(local,(w,h)=>{
    if(active){setRatio(w>0&&h>0?w/h:1);setPhoto(local);}
   },()=>{if(active)setError('No se pudo visualizar la fotografía');});
  })().catch(()=>{if(active)setError('Archivo no disponible');});
  return()=>{active=false;abort.abort();};
 },[media.assetId,media.kind,media.sizeBytes,session.token]);

 return <View style={{marginVertical:3,alignSelf:'flex-start',maxWidth:'100%'}}>
  {media.kind==='photo'?
    photo?
      <Pressable accessibilityLabel="Ampliar fotografía" accessibilityRole="button"
        onPress={()=>setEnlarged(true)}>
       <Image source={{uri:photo}} resizeMode="contain"
        style={{width,height,borderRadius:12}}/>
      </Pressable>:
      error?<Text style={{color:'#7c4141'}}>{error}</Text>:
       <View style={{width,height:92,alignItems:'center',justifyContent:'center'}}>
        <ActivityIndicator color="#77736d"/>
       </View>
    :signed?<InlineNativeVideo url={signed} width={width}/>:
      error?<Text style={{color:'#7c4141'}}>{error}</Text>:
       <View style={{width,height:92,alignItems:'center',justifyContent:'center'}}>
        <ActivityIndicator color="#77736d"/>
       </View>}
  <Modal visible={media.kind==='photo'&&enlarged&&!!photo}
    animationType="fade" transparent statusBarTranslucent
    onRequestClose={()=>setEnlarged(false)}>
   <View style={{flex:1,backgroundColor:'#101010',justifyContent:'center',alignItems:'center'}}>
    <Image source={{uri:photo}} resizeMode="contain"
      style={{width:screenWidth,height:screenHeight}}/>
    <Pressable onPress={()=>setEnlarged(false)} accessibilityRole="button"
      accessibilityLabel="Cerrar fotografía ampliada"
      style={{position:'absolute',top:45,right:18,paddingHorizontal:15,paddingVertical:8,
       borderRadius:24,backgroundColor:'#222'}}>
      <Text style={{fontSize:26,color:'#fff'}}>×</Text>
    </Pressable>
   </View>
  </Modal>
 </View>;
}
