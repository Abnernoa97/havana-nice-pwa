-- HAVANA NICE V2 only. No schema changes to HAVANA CLOUD.
-- This is an encrypted, administrator-authorized Cloud device token, never a password.
CREATE TABLE IF NOT EXISTS chat_cloud_link (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  encrypted_token TEXT NOT NULL,
  iv TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
