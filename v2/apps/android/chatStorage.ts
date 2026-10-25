import Storage from 'expo-sqlite/kv-store';
import type { ChatMessage, ChatSession } from '@havana/shared';

// Private sandbox database in the isolated V2 Android package. Lab sessions
// expire after 12 hours; permanent authentication requires secure token storage.
export interface NativeLocalChat {
  session: ChatSession;
  outbox: ChatMessage[];
  draft?: string;
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
