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
