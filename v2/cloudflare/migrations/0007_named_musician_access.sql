-- HAVANA NICE 2: allowlisted musician names, independent of official HAVANA NICE.
-- Login is only the approved name (case-insensitive); a random per-installation
-- bearer token is remembered locally and revoked centrally by changing active=0.
CREATE TABLE IF NOT EXISTS chat_members (
 username TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
 actor_id TEXT NOT NULL UNIQUE,
 display_name TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 updated_at TEXT NOT NULL DEFAULT (datetime('now')),
 CHECK(length(username) BETWEEN 1 AND 28)
);
CREATE INDEX IF NOT EXISTS idx_chat_members_active ON chat_members(active);

-- Existing lab sessions remain in D1 for audit; auth will reject tokens whose
-- actor_id does not belong to an enabled member.
INSERT OR IGNORE INTO chat_members(username,actor_id,display_name,active)
 VALUES ('orly','member:orly','Orly',1);
INSERT OR IGNORE INTO chat_members(username,actor_id,display_name,active)
 VALUES ('andy','member:andy','Andy',1);
INSERT OR IGNORE INTO chat_members(username,actor_id,display_name,active)
 VALUES ('jali','member:jali','Jali',1);
INSERT OR IGNORE INTO chat_members(username,actor_id,display_name,active)
 VALUES ('rafa','member:rafa','Rafa',1);
INSERT OR IGNORE INTO chat_members(username,actor_id,display_name,active)
 VALUES ('noa','member:noa','Noa',1);
INSERT OR IGNORE INTO chat_members(username,actor_id,display_name,active)
 VALUES ('fer','member:fer','Fer',1);
