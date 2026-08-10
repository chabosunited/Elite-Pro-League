PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS oauth_accounts (
  provider TEXT NOT NULL CHECK(provider IN ('google','discord')),
  provider_user_id TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_email TEXT,
  provider_username TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(provider, provider_user_id),
  UNIQUE(provider, user_id)
);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user ON oauth_accounts(user_id);

CREATE TABLE IF NOT EXISTS profile_onboarding (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  shirt_number INTEGER CHECK(shirt_number IS NULL OR (shirt_number BETWEEN 1 AND 99)),
  completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO profile_onboarding(user_id,shirt_number,completed)
SELECT p.user_id,NULL,
  CASE WHEN length(trim(COALESCE(p.ea_id,''))) > 0 AND length(trim(COALESCE(p.position,''))) > 0 THEN 1 ELSE 0 END
FROM profiles p;
