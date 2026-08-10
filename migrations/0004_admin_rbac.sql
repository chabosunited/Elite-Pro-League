PRAGMA foreign_keys = ON;

-- Flexible admin roles. SUPER_ADMIN remains the unique site-owner role in users.role.
CREATE TABLE IF NOT EXISTS user_admin_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('FULL_ADMIN','USER_ADMIN','LEAGUE_ADMIN','MATCH_ADMIN','NEWS_ADMIN','COIN_ADMIN')),
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_admin_roles_role ON user_admin_roles(role);

-- Fine-grained club/VM permissions. The primary club manager automatically has all four rights.
CREATE TABLE IF NOT EXISTS club_staff_permissions (
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  can_manage_page INTEGER NOT NULL DEFAULT 0 CHECK(can_manage_page IN (0,1)),
  can_submit_results INTEGER NOT NULL DEFAULT 0 CHECK(can_submit_results IN (0,1)),
  can_manage_stats INTEGER NOT NULL DEFAULT 0 CHECK(can_manage_stats IN (0,1)),
  can_manage_roster INTEGER NOT NULL DEFAULT 0 CHECK(can_manage_roster IN (0,1)),
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(club_id, user_id)
);

CREATE TABLE IF NOT EXISTS club_details (
  club_id INTEGER PRIMARY KEY REFERENCES clubs(id) ON DELETE CASCADE,
  bio TEXT,
  discord TEXT,
  website TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS player_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  icon_key TEXT,
  awarded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS club_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  icon_key TEXT,
  awarded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Make the current site-owner account the unique SUPER_ADMIN.
-- Safe if the account does not exist yet: then zero rows are changed.
UPDATE users SET role='SUPER_ADMIN', updated_at=datetime('now') WHERE lower(username)='killuminat';
