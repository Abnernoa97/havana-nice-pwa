-- V2 PWA first-device claim, additive and preserves all existing Chat data.
-- Existing musician identities already had name-login available in V2: reserve
-- their first slot to prevent another phone/browser from claiming it by name.
-- New allowlisted members introduced AFTER this migration may claim one first
-- PWA device; the first-claim INSERT is atomic and future devices need Admin.
CREATE TABLE IF NOT EXISTS chat_pwa_first_claims (
 actor_id TEXT PRIMARY KEY NOT NULL,
 enrollment_id TEXT UNIQUE,
 claimed_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO chat_pwa_first_claims(actor_id,enrollment_id,claimed_at)
 SELECT actor_id,NULL,CAST(strftime('%s','now') AS INTEGER)*1000 FROM chat_members;
