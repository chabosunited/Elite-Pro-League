PRAGMA foreign_keys = ON;

-- EPL v8: notification center, active-time rewards/reputation, contract workflow audit.

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id,read_at,created_at DESC);

CREATE TABLE IF NOT EXISTS activity_reward_state (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_heartbeat_epoch INTEGER NOT NULL,
  active_seconds INTEGER NOT NULL DEFAULT 0,
  total_rewards INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS club_reputation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(club_id,event_type,reference_type,reference_id)
);
CREATE INDEX IF NOT EXISTS idx_club_rep_events ON club_reputation_events(club_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contracts_user_created ON contracts(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_club_created ON contracts(club_id,created_at DESC);

-- Existing active players should not receive an instant activity reward after deployment.
INSERT OR IGNORE INTO activity_reward_state(user_id,last_heartbeat_epoch,active_seconds,total_rewards)
SELECT id,unixepoch('now'),0,0 FROM users WHERE status='ACTIVE';
