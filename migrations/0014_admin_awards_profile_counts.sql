PRAGMA foreign_keys = ON;

-- EPL v12: audit trail for full-admin award grants/revokes.
-- Existing user_trophies already stores cumulative quantities (x2, x5, ...).
CREATE TABLE IF NOT EXISTS admin_award_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  award_kind TEXT NOT NULL CHECK(award_kind IN ('TROPHY','ACHIEVEMENT','CUSTOM')),
  trophy_id INTEGER REFERENCES trophies(id) ON DELETE SET NULL,
  achievement_id INTEGER REFERENCES achievement_definitions(id) ON DELETE SET NULL,
  custom_title TEXT,
  quantity_delta INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  admin_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_admin_award_log_user ON admin_award_log(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_award_log_admin ON admin_award_log(admin_user_id,created_at DESC);
