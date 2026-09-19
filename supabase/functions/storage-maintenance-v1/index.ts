import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BUCKETS,chatRefs,notificationRefs,visitAll,oldEnough } from './references.ts';

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const publishableKeys=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}");
const PUBLIC_KEY=publishableKeys.default||Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
if(!SERVICE_KEY)throw new Error("Supabase admin key unavailable");
const ADMIN=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...CORS,"Content-Type":"application/json","Cache-Control":"no-store"}});

async function authorizedClient(req:Request){
  const auth=req.headers.get("Authorization")||"";
  if(!auth.startsWith("Bearer "))throw new Error("not_authorized");
  const USER=createClient(SUPABASE_URL,PUBLIC_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:auth}}});
  const {data,error}=await USER.rpc("admin_is_admin");
  if(error||data!==true)throw new Error("not_authorized");
  return USER;
}

async function referenceMap(){
  const refs=new Map<string,Set<string>>(BUCKETS.map(b=>[b,new Set<string>()]));
  const add=(items:{bucket:string,path:string}[])=>{for(const item of items)refs.get(item.bucket)!.add(item.path)};
  // Only called after admin authorization; service client permits a complete scan.
  await visitAll(ADMIN,'notifications','id,image_url,image_urls',row=>add(notificationRefs(row,SUPABASE_URL)));
  await visitAll(ADMIN,'chat_messages','id,audio_url,media_urls,media_posters,media_playback_urls',row=>add(chatRefs(row,SUPABASE_URL)));
  await visitAll(ADMIN,'family_profiles','id,avatar_path,cover_path',row=>{
    if(row.avatar_path)refs.get('family-media')!.add(String(row.avatar_path));
    if(row.cover_path)refs.get('family-media')!.add(String(row.cover_path));
  });
  return refs;
}
async function removeUnreferenced(bucket:string,paths:string[]){
  let removed=0;
  for(let i=0;i<paths.length;i+=100){
    // Recheck after enumeration / message deletion; never delete on a failed scan.
    const refs=await referenceMap();
    const batch=paths.slice(i,i+100).filter(path=>!refs.get(bucket)?.has(path));
    if(!batch.length)continue;
    const {data,error}=await ADMIN.storage.from(bucket).remove(batch);
    if(error)throw error;
    removed+=(data||[]).length;
  }
  return removed;
}
async function deleteNotification(USER:any,id:string){
  const {data:row,error}=await ADMIN.from('notifications').select('id,image_url,image_urls').eq('id',id).maybeSingle();
  if(error)throw error;if(!row)throw new Error('notification_not_found');
  const refs=notificationRefs(row,SUPABASE_URL);
  const {data:deleted,error:deleteError}=await USER.rpc('admin_delete_notification',{p_id:id});
  if(deleteError)throw deleteError;if(deleted!==true)return {deleted:false,removed:0};
  return {deleted:true,removed:await removeUnreferenced('notification-images',refs.map(x=>x.path))};
}
async function deleteChat(USER:any,id:string){
  const {data:row,error}=await ADMIN.from('chat_messages').select('id,audio_url,media_urls,media_posters,media_playback_urls').eq('id',id).maybeSingle();
  if(error)throw error;if(!row)throw new Error('chat_message_not_found');
  const refs=chatRefs(row,SUPABASE_URL);
  const {data:deleted,error:deleteError}=await USER.rpc('admin_delete_chat_message',{p_id:id});
  if(deleteError)throw deleteError;if(deleted!==true)return {deleted:false,removed:0};
  let removed=0;
  for(const bucket of ['chat-audio','chat-media'])removed+=await removeUnreferenced(bucket,refs.filter(x=>x.bucket===bucket).map(x=>x.path));
  return {deleted:true,removed};
}

type Stored={path:string;created_at:string|null;updated_at:string|null};
async function walk(bucket:string,prefix=''):Promise<Stored[]>{
  const out:Stored[]=[];let offset=0;
  while(true){
    const {data,error}=await ADMIN.storage.from(bucket).list(prefix,{limit:1000,offset,sortBy:{column:'name',order:'asc'}});
    if(error)throw error;if(!Array.isArray(data))throw new Error('Incomplete storage listing');
    if(!data.length)break;
    for(const item of data){const path=prefix?`${prefix}/${item.name}`:item.name;if(item.id)out.push({path,created_at:item.created_at||null,updated_at:item.updated_at||null});else out.push(...await walk(bucket,path))}
    offset+=data.length;
  }
  return out;
}
async function cleanupOrphans(minAgeMinutes:number,dryRun=false){
  const refs=await referenceMap();
  const age=Number.isFinite(minAgeMinutes)?Math.max(1440,minAgeMinutes):1440;
  const cutoff=Date.now()-age*60_000;
  const result:any={removed:0,dry_run:dryRun,buckets:{}};
  for(const bucket of BUCKETS){
    const files=await walk(bucket);
    const paths=files.filter(f=>!refs.get(bucket)!.has(f.path)&&oldEnough(f,cutoff)).map(f=>f.path);
    const removed=dryRun?0:await removeUnreferenced(bucket,paths);
    result.buckets[bucket]={candidates:paths.length,removed};result.removed+=removed;
  }
  return result;
}
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:CORS});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const USER=await authorizedClient(req);const body=await req.json().catch(()=>({}));const action=String(body.action||'');
    if(action==='delete_notification')return json({ok:true,...await deleteNotification(USER,String(body.id||''))});
    if(action==='delete_chat_message')return json({ok:true,...await deleteChat(USER,String(body.id||''))});
    if(action==='cleanup_orphans')return json({ok:true,...await cleanupOrphans(Number(body.min_age_minutes??1440),body.dry_run===true)});
    return json({error:'Unsupported action'},400);
  }catch(e){const message=e instanceof Error?e.message:String(e);return json({ok:false,error:message},message==='not_authorized'?403:500)}
});
