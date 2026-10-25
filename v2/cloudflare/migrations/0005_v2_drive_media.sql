-- CHAT 6 — Photo metadata only, NOT photo blobs (Google Drive V2 private folder).
-- Separate from HAVANA CLOUD's production catalog, access tokens and data.
-- Quota cap is enforced in a conditional UPDATE by the V2 Worker (64 MiB).
CREATE TABLE IF NOT EXISTS v2_media_quota (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  bytes_used INTEGER NOT NULL DEFAULT 0 CHECK (bytes_used >= 0)
);
INSERT OR IGNORE INTO v2_media_quota (id,bytes_used) VALUES (1,0);
CREATE TABLE IF NOT EXISTS v2_media_assets (
  asset_id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  mime TEXT NOT NULL CHECK (mime IN ('image/jpeg','image/png','image/webp')),
  bytes INTEGER NOT NULL CHECK (bytes BETWEEN 1 AND 655360),
  status TEXT NOT NULL CHECK (status IN ('pending','ready')),
  drive_file_id TEXT UNIQUE,
  created_at TEXT NOT NULL,
  UNIQUE(sender_id,client_id)
);
CREATE INDEX IF NOT EXISTS idx_v2_media_created ON v2_media_assets(created_at);
