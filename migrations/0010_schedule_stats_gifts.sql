PRAGMA foreign_keys = ON;

-- v7: season schedule generation, VM scheduling audit, per-club stat submissions and coin gifts.

CREATE TABLE IF NOT EXISTS match_schedule_meta (
  match_id INTEGER PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  generated_by INTEGER REFERENCES users(id),
  generated_at TEXT,
  scheduled_by INTEGER REFERENCES users(id),
  scheduled_updated_at TEXT,
  source TEXT NOT NULL DEFAULT 'MANUAL'
);

CREATE TABLE IF NOT EXISTS match_club_submissions (
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  submitted_by INTEGER REFERENCES users(id),
  result_submitted_at TEXT,
  stats_submitted_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(match_id,club_id)
);

CREATE TABLE IF NOT EXISTS coin_gifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sender_club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
  recipient_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  recipient_club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL CHECK(amount > 0),
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK ((sender_user_id IS NOT NULL) != (sender_club_id IS NOT NULL)),
  CHECK ((recipient_user_id IS NOT NULL) != (recipient_club_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_coin_gifts_sender_user ON coin_gifts(sender_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_gifts_recipient_user ON coin_gifts(recipient_user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_gifts_sender_club ON coin_gifts(sender_club_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_gifts_recipient_club ON coin_gifts(recipient_club_id,created_at DESC);

-- Make existing club -> division assignments visible in season tables immediately.
INSERT OR IGNORE INTO season_clubs(season_id,division_id,club_id)
SELECT d.season_id,d.id,c.id
FROM clubs c
JOIN divisions d ON d.id=c.division_id
WHERE c.division_id IS NOT NULL;
