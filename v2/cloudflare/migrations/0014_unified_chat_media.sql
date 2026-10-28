-- One storage contract: HAVANA NICE V2 owns chat metadata and permissions;
-- HAVANA CLOUD owns original photo/video bytes in existing connected Google Drive.
-- The old standalone OAuth path was removed from the application source.
-- Abort safely instead of deleting any legacy record if a different environment
-- unexpectedly contains pre-existing media.
CREATE TABLE IF NOT EXISTS _v2_legacy_cleanup_guard (
  empty_only INTEGER NOT NULL CHECK(empty_only = 0)
);
INSERT INTO _v2_legacy_cleanup_guard(empty_only)
 SELECT 1 WHERE EXISTS (SELECT 1 FROM v2_media_assets);
INSERT INTO _v2_legacy_cleanup_guard(empty_only)
 SELECT 1 WHERE EXISTS (SELECT 1 FROM v2_media_quota WHERE bytes_used > 0);
DROP TABLE IF EXISTS v2_media_assets;
DROP TABLE IF EXISTS v2_media_quota;
DROP TABLE IF EXISTS _v2_legacy_cleanup_guard;

-- New ledger stores metadata ONLY, never actual file bytes or OAuth secrets.
CREATE TABLE IF NOT EXISTS chat_media_assets (
 asset_id TEXT PRIMARY KEY NOT NULL,
 sender_id TEXT NOT NULL REFERENCES chat_members(actor_id),
 client_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('photo','video')),
 mime TEXT NOT NULL,
 bytes INTEGER NOT NULL CHECK(bytes > 0 AND bytes <= 10737418240),
 original_name TEXT NOT NULL CHECK(length(original_name) BETWEEN 1 AND 180),
 status TEXT NOT NULL CHECK(status IN ('uploading','ready','failed')),
 message_seq INTEGER UNIQUE REFERENCES chat_messages(seq),
 created_at TEXT NOT NULL,
 completed_at TEXT,
 UNIQUE(sender_id,client_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_media_assets_sender ON chat_media_assets(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_media_assets_message ON chat_media_assets(message_seq);
