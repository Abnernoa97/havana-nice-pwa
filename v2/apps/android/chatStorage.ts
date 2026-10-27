import Storage from 'expo-sqlite/kv-store';
import {usablePendingChatEnrollment,type PendingChatDeviceEnrollment,type ChatMessage,type ChatSession} from '@havana/shared';

// Private sandbox database in the isolated V2 Android package. Lab sessions
// expire after 12 hours; permanent authentication requires secure token storage.
export interface NativeLocalChat {
  session: ChatSession;
  outbox: ChatMessage[];
  draft?: string;
  // Preserve the target of an interrupted edit, not just the edited text.
  editing?: ChatMessage | null;
  beforeEdit?: { draft:string; replyTo:ChatMessage|null } | null;
}
const KEY = 'havana-v2-chat-local-v1';

export async function loadNativeLocalChat(): Promise<NativeLocalChat | null> {
  const raw = await Storage.getItem(KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as NativeLocalChat;
    if (!data?.session?.token || !Array.isArray(data.outbox)) return null;
    return data;
  } catch { return null; }
}
export async function saveNativeLocalChat(value: NativeLocalChat | null): Promise<void> {
  if (!value) await Storage.removeItem(KEY);
  else await Storage.setItem(KEY, JSON.stringify(value));
}

// Keep pending approval separate from the existing SQLite chat/session key.
const PENDING_KEY='havana-v2-chat-pending-device-v1';
export async function loadNativePendingEnrollment():Promise<PendingChatDeviceEnrollment|null>{
 const raw=await Storage.getItem(PENDING_KEY);if(!raw)return null;
 try{const val=JSON.parse(raw) as unknown;if(usablePendingChatEnrollment(val))return val;}
 catch{/* ignore invalid data */}
 await Storage.removeItem(PENDING_KEY);return null;
}
export async function saveNativePendingEnrollment(value:PendingChatDeviceEnrollment|null):Promise<void>{
 if(!value){await Storage.removeItem(PENDING_KEY);return;}
 if(!usablePendingChatEnrollment(value))throw new Error('Solicitud vencida o inválida');
 await Storage.setItem(PENDING_KEY,JSON.stringify(value));
}
