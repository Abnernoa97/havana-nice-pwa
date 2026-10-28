import React,{useEffect,useState} from 'react';
import {Image,Linking,Pressable,Text,View} from 'react-native';
import {HAVANA_V2_DEV_API_BASE_URL as API} from '@havana/shared';
import type {ChatMessage,ChatSession} from '@havana/shared';
// Same file shown to Android Chat and Admin; original is stored only in CLOUD.
export default function NativeChatMediaView({
 media,session
}:{media:NonNullable<ChatMessage['media']>;session:ChatSession}){
 const [url,setUrl]=useState(''),[error,setError]=useState('');
 useEffect(()=>{
  let active=true;setUrl('');setError('');
  void fetch(API+'/api/chat/media/'+media.assetId+'/grant',{
   headers:{Authorization:'Bearer '+session.token}
  }).then(async r=>{
   if(!r.ok)throw Error('Vista previa no disponible');
   return r.json() as Promise<{url:string}>;
  }).then(r=>{if(active&&r.url.startsWith(API+'/api/chat/media/'))setUrl(r.url);})
    .catch(()=>{if(active)setError('Archivo no disponible');});
  return()=>{active=false;};
 },[media.assetId,session.token]);
 return <View style={{marginVertical:6,maxWidth:300}}>
  {url?(media.kind==='photo'
   ?<Pressable accessibilityLabel={'Abrir fotografía '+media.name}
      onPress={()=>void Linking.openURL(url)}>
      <Image source={{uri:url}} resizeMode="contain"
       style={{width:240,height:220,borderRadius:10,backgroundColor:'#e5e5e5'}}/>
    </Pressable>
   :<Pressable accessibilityRole="button" onPress={()=>void Linking.openURL(url)}
     style={{padding:12,borderRadius:12,backgroundColor:'#eaf2f2'}}>
      <Text>▶ Reproducir video</Text>
    </Pressable>)
   :<Text>{error||'Preparando archivo…'}</Text>}
  <Text style={{fontSize:11,marginTop:3}} numberOfLines={2}>
   {media.name} · {(media.sizeBytes/1048576).toFixed(1)} MB
  </Text>
 </View>;
}
