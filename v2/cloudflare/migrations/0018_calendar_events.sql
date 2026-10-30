-- HAVANA NICE V2: canonical calendar data; no existing Chat table is altered.
-- Apply only to the existing V2 D1 after the dedicated calendar tests pass.
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY NOT NULL,
  event_date TEXT NOT NULL,
  time_zone TEXT NOT NULL,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 160),
  venue TEXT NOT NULL DEFAULT '' CHECK(length(venue)<=160),
  city TEXT NOT NULL DEFAULT '' CHECK(length(city)<=120),
  call_time TEXT,
  arrival_time TEXT,
  show_time TEXT,
  end_time TEXT,
  wardrobe TEXT NOT NULL DEFAULT '' CHECK(length(wardrobe)<=500),
  notes TEXT NOT NULL DEFAULT '' CHECK(length(notes)<=4000),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('tentative','confirmed','cancelled')),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date,id);
