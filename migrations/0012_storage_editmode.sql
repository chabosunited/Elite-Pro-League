-- EPL v9: storage-aware media changes + edit audit support.
-- Existing users/coins are intentionally not changed. New OAuth users receive 60 coins in application code.

CREATE TABLE IF NOT EXISTS profile_media_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('avatar','cover')),
  source TEXT NOT NULL CHECK(source IN ('UPLOAD','URL')),
  old_value TEXT,
  new_value TEXT NOT NULL,
  cost_coins INTEGER NOT NULL DEFAULT 10,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_profile_media_changes_user_created
  ON profile_media_changes(user_id, created_at DESC);
