PRAGMA foreign_keys = ON;

-- EPL v10: manual Team of the Week, career/market value support and achievements.
ALTER TABLE profiles ADD COLUMN use_totw_frame INTEGER NOT NULL DEFAULT 0 CHECK(use_totw_frame IN (0,1));

CREATE TABLE IF NOT EXISTS totw_selections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  division_id INTEGER REFERENCES divisions(id) ON DELETE SET NULL,
  matchday INTEGER NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_label TEXT,
  selected_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  selected_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  coins_awarded INTEGER NOT NULL DEFAULT 250,
  UNIQUE(season_id,division_id,matchday,user_id)
);
CREATE INDEX IF NOT EXISTS idx_totw_user_expiry ON totw_selections(user_id,expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_totw_week ON totw_selections(season_id,division_id,matchday);

CREATE TABLE IF NOT EXISTS achievement_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  metric TEXT NOT NULL,
  target_value REAL NOT NULL,
  asset_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))
);

CREATE TABLE IF NOT EXISTS player_achievement_unlocks (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(user_id,achievement_id)
);
CREATE INDEX IF NOT EXISTS idx_achievement_unlocks_user ON player_achievement_unlocks(user_id,unlocked_at DESC);

CREATE TABLE IF NOT EXISTS market_value_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value_eur INTEGER NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_market_value_user_created ON market_value_snapshots(user_id,created_at DESC);

INSERT OR IGNORE INTO achievement_definitions(code,title,description,category,metric,target_value,asset_key,sort_order) VALUES
('FIRST_GOAL','First Blood','Erziele dein erstes bestätigtes EPL-Tor.','OFFENSIVE','GOALS_TOTAL',1,'/assets/achievements/ErstesTorArchievment.png',10),
('GOALS_10','Sniper','Erziele insgesamt 10 bestätigte EPL-Tore.','OFFENSIVE','GOALS_TOTAL',10,'/assets/achievements/10ToreArchievment.png',20),
('ASSISTS_20','Playmaker','Erreiche insgesamt 20 bestätigte Assists.','OFFENSIVE','ASSISTS_TOTAL',20,'/assets/achievements/20AssistsArchievment.png',30),
('CLEAN_SHEETS_10','The Wall','Erreiche 10 Clean Sheets in bestätigten EPL-Matches.','DEFENSIVE','CLEAN_SHEETS',10,'/assets/achievements/10CleanSheetsArchievment.png',40),
('MATCHES_ONE_CLUB_100','One Club Man','Absolviere 100 bestätigte EPL-Matches für denselben Club.','CAREER','MATCHES_ONE_CLUB',100,'/assets/achievements/100Spiele1ClubArchievment.png',50),
('SAME_CLUB_3_SEASONS','Loyalty','Spiele in 3 unterschiedlichen EPL-Saisons für denselben Club.','CAREER','SEASONS_SAME_CLUB',3,'/assets/achievements/3SaisonsSelbesTeamArchievment.png',60),
('MATCHES_250','EPL Legend','Absolviere insgesamt 250 bestätigte EPL-Matches.','CAREER','MATCHES_TOTAL',250,'/assets/achievements/250EplSpieleArchievment.png',70),
('UNBEATEN_10','Unbeaten','Bleibe in 10 aufeinanderfolgenden bestätigten Einsätzen ungeschlagen.','CAREER','UNBEATEN_STREAK',10,'/assets/achievements/10SpieleUngeschlagenArchievment.png',80),
('RIVAL_GOALS_5','Derby King','Erziele insgesamt 5 Tore gegen denselben gegnerischen Club.','OFFENSIVE','GOALS_VS_RIVAL',5,'/assets/achievements/5ToreVsRivalArchievment.png',90),
('TOP_SCORER','Golden Boot','Beende eine EPL-Saison als alleiniger oder geteilter Torschützenkönig.','ELITE','TOP_SCORER',1,'/assets/achievements/TopScorerArchievment.png',100);

-- Visual award catalog from the uploaded EPL trophy/badge asset pack.
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'EPL Meister','/assets/trophies/eplmeistertrophy.png',NULL,'TROPHY' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='EPL Meister');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'EPL Supercup','/assets/trophies/eplsupercuptrophy.png',NULL,'TROPHY' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='EPL Supercup');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'EPL Turniersieger','/assets/trophies/EPLturniertrophy.png',NULL,'TROPHY' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='EPL Turniersieger');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'EPL MOTM','/assets/trophies/eplmotmtrophy.png',NULL,'TROPHY' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='EPL MOTM');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Meister Badge','/assets/trophies/MeisterBadge.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Meister Badge');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Torjäger Badge','/assets/trophies/TorjagerBadge.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Torjäger Badge');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Legende Badge','/assets/trophies/LegendeBadge.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Legende Badge');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Rekordspieler Badge','/assets/trophies/RekordspielerBadge.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Rekordspieler Badge');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Rekordtorhüter Badge','/assets/trophies/RekordtorhuterBadge.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Rekordtorhüter Badge');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Rekordmanager Badge','/assets/trophies/RekordmanagerBadge.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Rekordmanager Badge');
