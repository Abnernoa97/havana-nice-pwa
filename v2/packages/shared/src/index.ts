export type ClientPlatform = 'android' | 'pwa';
export type EnvironmentName = 'development' | 'production';
export type ConnectionState = 'offline' | 'connecting' | 'online' | 'error';

export const HAVANA_V2_DEV_API_BASE_URL =
  'https://havana-nice-v2-dev.soloaplicaciones97.workers.dev';

export interface FoundationStatus {
  platform: ClientPlatform;
  environment: EnvironmentName;
  connection: ConnectionState;
  build: string;
  lastSyncAt: string | null;
}

export interface HavanaUser {
  id: string;
  username: string;
  displayName: string;
  active: boolean;
}

export interface PublicBackendConfig {
  apiBaseUrl: string;
}

export interface BackendHealth {
  ok: boolean;
  app: string;
  environment: string;
  database: string;
  schemaVersion: string | null;
  realtime: string;
  media: string;
}

export async function fetchBackendHealth(
  apiBaseUrl = HAVANA_V2_DEV_API_BASE_URL,
): Promise<BackendHealth> {
  const response = await fetch(`${apiBaseUrl}/health`, {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json() as Promise<BackendHealth>;
}

export interface RealtimeEnvelope<TPayload = unknown> {
  id: string;
  topic: string;
  sentAt: string;
  payload: TPayload;
}

export interface RealtimeTransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish<T>(message: RealtimeEnvelope<T>): Promise<void>;
  subscribe<T>(
    topic: string,
    handler: (message: RealtimeEnvelope<T>) => void,
  ): () => void;
}

export interface CacheRecord<T> {
  key: string;
  value: T;
  updatedAt: string;
}

export interface LocalCache {
  get<T>(key: string): Promise<CacheRecord<T> | null>;
  set<T>(record: CacheRecord<T>): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

/** CHAT 1 — shared contract across Android and iPhone PWA (V2 only). */
export interface ChatSession {
  token: string;
  actorId: string;
  displayName: string;
  expiresAt: string;
}

export interface ChatMessage {
  seq: number;
  clientMessageId: string;
  senderId: string;
  senderName: string;
  text: string;
  sentAt: string;
  media?: {assetId:string;kind:'photo'|'video';mimeType:string;sizeBytes:number;name:string}|null;
  pending?: boolean;
  failed?: boolean;
  deliveryStatus?: 'queued' | 'sending' | 'error' | 'sent';
  replyToSeq?: number | null;
  editedAt?: string | null;
  deletedAt?: string | null;
}

export type ChatServerEvent =
  | { type: 'chat.ready'; at: string; users?: ChatOnlineUser[] }
  | { type: 'chat.message'; message: ChatMessage }
  | { type: 'chat.error'; error: string }
  | { type: 'chat.revoked'; error: string }
  | { type: 'chat.presence'; users: ChatOnlineUser[] }
  | { type: 'chat.typing'; actorId: string; senderName: string; active: boolean; expiresAt: number }
  | { type: 'chat.reaction'; messageSeq: number; actorId: string; emoji: ChatEmoji; active: boolean }
  | { type:'chat.updated'; message: ChatMessage }
  | { type:'chat.deleted'; seq:number }
  | { type:'chat.read'; actorId:string; displayName:string; seq:number };

export type ChatEmoji = '❤️' | '😂' | '👍';
export interface ChatOnlineUser { actorId: string; displayName: string }
export interface ChatReaction { messageSeq: number; actorId: string; emoji: ChatEmoji }
export interface ChatReadReceipt { actorId: string;displayName:string;seq:number }
export interface ChatSnapshot { messages: ChatMessage[]; reactions: ChatReaction[]; receipts:ChatReadReceipt[]; hasMore: boolean }

export function reconcileUpdatedMessage(before: ChatMessage[], updated:ChatMessage):ChatMessage[] {
  return before.map(item => item.seq === updated.seq && updated.seq > 0 ? {...item,...updated,pending:false} : item);
}
export function reconcileDeletedMessage(before:ChatMessage[],seq:number):ChatMessage[]{
 return before.filter(m=>m.seq!==seq&&!m.deletedAt).map(m=>m.replyToSeq===seq?{...m,replyToSeq:null}:m);
}
export function reconcileChatSnapshot(before:ChatMessage[],server:ChatMessage[]):ChatMessage[]{
 const latest=server.filter(m=>!m.deletedAt),ids=new Set(latest.map(m=>m.seq));
 const min=latest.length?Math.min(...latest.map(m=>m.seq)):0;
 const max=latest.length?Math.max(...latest.map(m=>m.seq)):0;
 // Keep older pages and WebSocket messages that arrived after the GET began.
 return reconcileChatMessages(before.filter(m=>!m.deletedAt&&(m.pending||m.seq<=0||
 (min>0&&(m.seq<min||m.seq>max))||ids.has(m.seq))),latest);
}
export function lastReadByOther(reads:ChatReadReceipt[],ownActor:string):number {
  return Math.max(0,...reads.filter(r=>r.actorId!==ownActor).map(r=>r.seq));
}
export async function getOlderChatMessages(session:ChatSession,beforeSeq:number,base=HAVANA_V2_DEV_API_BASE_URL):Promise<ChatSnapshot>{
  const result=await fetch(`${base}/api/chat/messages?beforeSeq=${encodeURIComponent(String(beforeSeq))}`,{
    headers:{Authorization:`Bearer ${session.token}`},
  });
  const data=await result.json() as ChatSnapshot & {error?:string};
  if(!result.ok)throw new Error(data.error||'No se pudo cargar más mensajes');
  return {...data,messages:data.messages||[],reactions:data.reactions||[],receipts:data.receipts||[]};
}
export async function searchChatMessages(session:ChatSession,query:string,base=HAVANA_V2_DEV_API_BASE_URL):Promise<ChatMessage[]>{
  const result=await fetch(`${base}/api/chat/messages?search=${encodeURIComponent(query)}`,{
    headers:{Authorization:`Bearer ${session.token}`},
  });
  const data=await result.json() as ChatSnapshot & {error?:string};
  if(!result.ok)throw new Error(data.error||'No se pudo buscar');
  return data.messages||[];
}

export function reconcileReactions(before: ChatReaction[], event: {messageSeq: number;actorId: string;emoji: ChatEmoji;active: boolean}): ChatReaction[] {
  const kept = before.filter(x => !(x.messageSeq === event.messageSeq && x.actorId === event.actorId && x.emoji === event.emoji));
  return event.active ? [...kept, {messageSeq:event.messageSeq,actorId:event.actorId,emoji:event.emoji}] : kept;
}

export async function getChatSnapshot(session: ChatSession, apiBaseUrl = HAVANA_V2_DEV_API_BASE_URL): Promise<ChatSnapshot> {
  const response = await fetch(`${apiBaseUrl}/api/chat/messages`, { headers: { Authorization: `Bearer ${session.token}` } });
  const data = await response.json() as ChatSnapshot & {error?: string};
  if (!response.ok) throw new Error(data.error || 'Cannot load chat snapshot');
  return { messages: data.messages || [], reactions: data.reactions || [], receipts:data.receipts||[], hasMore: !!data.hasMore };
}

export async function startNamedChatSession(
  displayName: string,
  apiBaseUrl = HAVANA_V2_DEV_API_BASE_URL,
): Promise<ChatSession> {
  const response = await fetch(`${apiBaseUrl}/api/chat/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
  });
  const data = await response.json() as ChatSession & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Could not join the lab chat');
  return data;
}

export async function restoreNamedChatSession(
  saved: ChatSession,
  apiBaseUrl = HAVANA_V2_DEV_API_BASE_URL,
): Promise<ChatSession | null> {
  const response = await fetch(`${apiBaseUrl}/api/chat/session`, {
    headers: { Authorization: `Bearer ${saved.token}` },
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error(`Session validation failed: ${response.status}`);
  return response.json() as Promise<ChatSession>;
}

export async function getChatMessages(
  session: ChatSession,
  apiBaseUrl = HAVANA_V2_DEV_API_BASE_URL,
  afterSeq?: number,
): Promise<ChatMessage[]> {
  const suffix = afterSeq === undefined ? '' : `?afterSeq=${afterSeq}`;
  const response = await fetch(`${apiBaseUrl}/api/chat/messages${suffix}`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const data = await response.json() as { messages?: ChatMessage[]; error?: string };
  if (!response.ok) throw new Error(data.error || 'Could not load chat history');
  return data.messages || [];
}

export function openChatSocket(session: ChatSession): WebSocket {
  const base = HAVANA_V2_DEV_API_BASE_URL.replace(/^http/, 'ws');
  return new WebSocket(`${base}/ws`, ['havana-v2', `session.${session.token}`]);
}

export function messageDeliveryLabel(message: ChatMessage): string {
  if (!message.pending) return 'enviado';
  if (message.deliveryStatus === 'error' || message.failed) return 'error · reintentar';
  if (message.deliveryStatus === 'sending') return 'enviando…';
  return 'en cola';
}

export function newClientMessageId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

export function reconcileChatMessages(
  before: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const map = new Map<string, ChatMessage>();
  for (const message of [...before, ...incoming]) {
    const key = `${message.senderId}:${message.clientMessageId}`;
    const previous = map.get(key);
    // Later server snapshots must override stale edits/deletions in local memory.
    // Never allow a pending offline copy to overwrite a confirmed server row.
    if (!previous || (!message.pending && message.seq > 0) || (previous.pending && !message.pending)) {
      map.set(key, message);
    }
  }
  return [...map.values()].sort((a, b) => {
    if (a.seq && b.seq) return a.seq - b.seq;
    if (a.seq) return -1;
    if (b.seq) return 1;
    return a.sentAt.localeCompare(b.sentAt);
  });
}

// M01/M02: one selection policy shared by the PWA and native Chat.
// Actual media uploads remain disabled until HAVANA CLOUD's private bridge is ready.
export type ChatMediaKind='photo'|'video';
export type ChatMediaSource='gallery'|'camera';
export type ChatMediaSelection={kind:ChatMediaKind;source:ChatMediaSource;
 name:string;mimeType:string;sizeBytes:number;uri:string};
export const CHAT_MEDIA_UPLOAD_ENABLED=false as const;
export const CHAT_MEDIA_LIMITS={
 photo:{maxBytes:100*1024*1024,mimes:['image/jpeg','image/png','image/webp','image/heic','image/heif']},
 video:{maxBytes:10*1024*1024*1024,mimes:['video/mp4','video/quicktime']}
} as const;
export function validateChatMediaSelection(
 item:Pick<ChatMediaSelection,'kind'|'name'|'mimeType'|'sizeBytes'>
):string|null{
 const rule=CHAT_MEDIA_LIMITS[item.kind];
 if(!rule)return 'Solo se admiten fotografías y videos.';
 if(typeof item.name!=='string'||!item.name.trim()||item.name.length>180||
    /[\\/\x00-\x1f\x7f]/.test(item.name))return 'Nombre de archivo no válido.';
 if(typeof item.mimeType!=='string'||!(rule.mimes as readonly string[]).includes(item.mimeType.toLowerCase()))
  return 'Formato no admitido por HAVANA CLOUD.';
 if(!Number.isSafeInteger(item.sizeBytes)||item.sizeBytes<=0||item.sizeBytes>rule.maxBytes)
  return 'El archivo está vacío o supera el límite permitido.';
 return null;
}
