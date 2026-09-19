export const BUCKETS=['chat-media','notification-images','family-media','chat-audio'] as const;
export type FileRef={bucket:string,path:string};
export function pathFromUrl(value:unknown,bucket:string,projectUrl:string):string {
  if(typeof value!=='string'||!value)return '';
  try{
    const u=new URL(value);
    if(u.origin!==new URL(projectUrl).origin)return '';
    const marker=`/storage/v1/object/public/${bucket}/`;
    return u.pathname.startsWith(marker)?decodeURIComponent(u.pathname.slice(marker.length)):'';
  }catch(_){return ''}
}
export function chatRefs(message:any,projectUrl:string):FileRef[]{
  const refs=new Map<string,FileRef>();
  const add=(value:unknown,bucket:string)=>{
    const path=pathFromUrl(value,bucket,projectUrl);
    if(path)refs.set(bucket+'/'+path,{bucket,path});
    return path;
  };
  add(message?.audio_url,'chat-audio');
  for(const field of ['media_urls','media_playback_urls','media_posters']){
    for(const url of Array.isArray(message?.[field])?message[field]:[]){
      const path=add(url,'chat-media');
      // Old messages and delayed uploads can use a derived poster without a DB URL.
      if(path&&field!=='media_posters')refs.set('chat-media/'+path+'.poster.jpg',{bucket:'chat-media',path:path+'.poster.jpg'});
    }
  }
  return [...refs.values()];
}
export function notificationRefs(row:any,projectUrl:string):FileRef[]{
  const paths=new Set<string>();
  for(const url of [row?.image_url,...(Array.isArray(row?.image_urls)?row.image_urls:[])]){
    const path=pathFromUrl(url,'notification-images',projectUrl);if(path)paths.add(path);
  }
  return [...paths].map(path=>({bucket:'notification-images',path}));
}
// Keyset pagination: no UI RPC limit, no offset skips after concurrent deletion.
export async function visitAll(client:any,table:string,fields:string,visit:(row:any)=>void){
  let lastId:any=null;
  while(true){
    let query=client.from(table).select(fields).order('id',{ascending:true}).limit(500);
    if(lastId!==null)query=query.gt('id',lastId);
    const {data,error}=await query;
    if(error)throw error;
    if(!Array.isArray(data))throw new Error('Incomplete reference scan: '+table);
    if(!data.length)return;
    for(const row of data)visit(row);
    const next=data[data.length-1].id;
    if(next===undefined||next===null||next===lastId)throw new Error('Invalid reference cursor: '+table);
    lastId=next;
  }
}
export function oldEnough(file:{created_at:string|null,updated_at:string|null},cutoff:number){
  const time=Date.parse(file.updated_at||file.created_at||'');
  return Number.isFinite(time)&&time<=cutoff;
}
