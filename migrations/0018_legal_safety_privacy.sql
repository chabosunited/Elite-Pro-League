PRAGMA foreign_keys = ON;

-- EPL v17: legal/privacy/safety foundation.
ALTER TABLE users ADD COLUMN birth_date TEXT;
ALTER TABLE users ADD COLUMN legal_terms_accepted_at TEXT;
ALTER TABLE users ADD COLUMN privacy_acknowledged_at TEXT;
ALTER TABLE users ADD COLUMN community_guidelines_accepted_at TEXT;

ALTER TABLE profile_onboarding ADD COLUMN parental_consent_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED';
ALTER TABLE profile_onboarding ADD COLUMN guardian_email TEXT;

-- Reports are rebuilt so message reports can be stored without weakening existing data integrity.
ALTER TABLE reports RENAME TO reports_v16_legacy;
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK(target_type IN ('POST','COMMENT','USER','CLUB','NEWS','MESSAGE','OTHER')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','REVIEWED','RESOLVED','REJECTED')),
  handled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  handled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  decision_reason TEXT,
  decision_action TEXT
);
INSERT INTO reports(id,reporter_user_id,target_type,target_id,reason,details,status,handled_by,handled_at,created_at)
SELECT id,reporter_user_id,target_type,target_id,reason,details,status,handled_by,handled_at,created_at FROM reports_v16_legacy;
DROP TABLE reports_v16_legacy;
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type,target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS parental_consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guardian_email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','EXPIRED')),
  guardian_name TEXT,
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  consented_at TEXT,
  ip_hash TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_parental_consents_user ON parental_consents(user_id,status,requested_at DESC);

CREATE TABLE IF NOT EXISTS privacy_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK(request_type IN ('ACCESS','DELETE')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','COMPLETED','REJECTED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_user ON privacy_requests(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS user_restrictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('SUSPENDED','BANNED','WARNING')),
  rule_code TEXT,
  reason TEXT NOT NULL,
  starts_at TEXT NOT NULL DEFAULT (datetime('now')),
  ends_at TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  lifted_at TEXT,
  lifted_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_active ON user_restrictions(user_id,active,created_at DESC);

ALTER TABLE moderation_actions ADD COLUMN report_id INTEGER REFERENCES reports(id) ON DELETE SET NULL;
ALTER TABLE moderation_actions ADD COLUMN target_type TEXT;
ALTER TABLE moderation_actions ADD COLUMN target_id TEXT;
CREATE INDEX IF NOT EXISTS idx_moderation_actions_report ON moderation_actions(report_id,created_at DESC);
