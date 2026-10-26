-- HAVANA NICE V2. Additive device authorization; does not revoke or alter legacy sessions.
-- Deploy this migration BEFORE ever setting V2_DEVICE_APPROVAL_MODE=enforce.
ALTER TABLE chat_sessions ADD COLUMN enrollment_id TEXT;
CREATE INDEX IF NOT EXISTS idx_chat_sessions_enrollment ON chat_sessions(enrollment_id);
CREATE TABLE IF NOT EXISTS chat_device_requests (
  request_id TEXT PRIMARY KEY NOT NULL,
  request_secret_hash TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  device_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','approved','denied','revoked')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  decided_at INTEGER,
  redeemed_at INTEGER,
  redemption_nonce TEXT
);
CREATE INDEX IF NOT EXISTS idx_chat_device_requests_actor_created ON chat_device_requests(actor_id,created_at);
CREATE INDEX IF NOT EXISTS idx_chat_device_requests_status ON chat_device_requests(status,expires_at);
