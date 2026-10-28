-- Additive, reversible staging: HAVANA NICE V2 chat metadata for original media.
-- The live old Worker still references v2_media_assets. DO NOT DROP old tables
-- before the replacement Worker is deployed and Chat/Admin are regression-tested.
-- Old routes/source were already physically removed in the foundation branch.
-- HAVANA CLOUD alone stores photo/video bytes and its Profile shows usage only.

CREATE TABLE IF NOT EXISTS chat_media_assets (
 asset_id TEXT PRIMARY KEY NOT NULL,
 sender_id TEXT NOT NULL REFERENCES chat_members(actor_id),
 client_id TEXT NOT NULL,
 batch_id TEXT NOT NULL,
 batch_index INTEGER NOT NULL CHECK(batch_index BETWEEN 0 AND 4),
 kind TEXT NOT NULL CHECK(kind IN ('photo','video')),
 mime TEXT NOT NULL,
 bytes INTEGER NOT NULL CHECK(bytes > 0 AND bytes <= 10737418240),
 original_name TEXT NOT NULL CHECK(length(original_name) BETWEEN 1 AND 180),
 status TEXT NOT NULL CHECK(status IN ('uploading','ready','failed')),
 message_seq INTEGER UNIQUE REFERENCES chat_messages(seq),
 created_at TEXT NOT NULL,
 completed_at TEXT,
 UNIQUE(sender_id,client_id),
 UNIQUE(sender_id,batch_id,batch_index)
);
CREATE INDEX IF NOT EXISTS idx_chat_media_assets_sender ON chat_media_assets(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_media_assets_message ON chat_media_assets(message_seq);
