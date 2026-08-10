PRAGMA foreign_keys = ON;

-- EPL v6: paid season goals, club treasury, larger goal catalog.
-- Google OAuth itself uses the existing oauth_accounts table and needs no DB schema change.

ALTER TABLE season_goal_templates ADD COLUMN entry_cost_coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_season_goals ADD COLUMN entry_cost_coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_season_goals ADD COLUMN payout_coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE club_season_goals ADD COLUMN entry_cost_coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE club_season_goals ADD COLUMN payout_coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE club_members ADD COLUMN squad_status TEXT NOT NULL DEFAULT 'SQUAD' CHECK(squad_status IN ('SQUAD','STARTER','BENCH','RESERVE'));

CREATE TABLE IF NOT EXISTS club_coin_wallets (
  club_id INTEGER PRIMARY KEY REFERENCES clubs(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK(balance >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS club_coin_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('PERFORMANCE','SEASON_GOAL','ADMIN_ADJUSTMENT','REFUND')),
  reference_type TEXT,
  reference_id TEXT,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(type,reference_type,reference_id,club_id)
);
CREATE INDEX IF NOT EXISTS idx_club_coin_tx ON club_coin_transactions(club_id,created_at DESC);

INSERT OR IGNORE INTO club_coin_wallets(club_id,balance) SELECT id,0 FROM clubs;

-- Existing goal rewards become a 2x payout relative to their entry fee.
UPDATE season_goal_templates SET entry_cost_coins = CAST(reward_coins / 2 AS INTEGER) WHERE entry_cost_coins=0;
UPDATE season_goal_templates SET entry_cost_coins=225,reward_coins=450 WHERE code='club_wins_10';

-- More field-player goals.
INSERT OR IGNORE INTO season_goal_templates(code,scope,position_group,metric,title,description,target_value,reward_coins,active,entry_cost_coins) VALUES
('field_goals_5','PLAYER','FIELD','GOALS','5 Tore','Erziele mindestens 5 Tore in dieser Saison.',5,200,1,100),
('field_goals_15','PLAYER','FIELD','GOALS','15 Tore','Erziele mindestens 15 Tore in dieser Saison.',15,500,1,250),
('field_goals_20','PLAYER','FIELD','GOALS','20 Tore','Erziele mindestens 20 Tore in dieser Saison.',20,700,1,350),
('field_goals_35','PLAYER','FIELD','GOALS','35 Tore','Erziele mindestens 35 Tore in dieser Saison.',35,1400,1,700),
('field_assists_5','PLAYER','FIELD','ASSISTS','5 Assists','Bereite mindestens 5 Tore vor.',5,180,1,90),
('field_assists_10','PLAYER','FIELD','ASSISTS','10 Assists','Bereite mindestens 10 Tore vor.',10,400,1,200),
('field_assists_20','PLAYER','FIELD','ASSISTS','20 Assists','Bereite mindestens 20 Tore vor.',20,900,1,450),
('field_gcontrib_20','PLAYER','FIELD','GOAL_CONTRIBUTIONS','20 Scorerpunkte','Erreiche zusammen mindestens 20 Tore + Assists.',20,500,1,250),
('field_gcontrib_40','PLAYER','FIELD','GOAL_CONTRIBUTIONS','40 Scorerpunkte','Erreiche zusammen mindestens 40 Tore + Assists.',40,1300,1,650),
('field_motm_3','PLAYER','FIELD','MOTM','3× MOTM','Werde mindestens dreimal Man of the Match.',3,300,1,150),
('field_motm_8','PLAYER','FIELD','MOTM','8× MOTM','Werde mindestens achtmal Man of the Match.',8,1000,1,500),
('field_rating_70','PLAYER','FIELD','AVG_RATING','7,00 Durchschnitt','Beende die Saison mit mindestens 7,00 Durchschnittsrating.',7.0,300,1,150),
('field_rating_78','PLAYER','FIELD','AVG_RATING','7,80 Durchschnitt','Beende die Saison mit mindestens 7,80 Durchschnittsrating.',7.8,1200,1,600),
('field_matches_10','PLAYER','FIELD','MATCHES','10 Einsätze','Absolviere mindestens 10 bestätigte EPL Matches.',10,160,1,80),
('field_matches_25','PLAYER','FIELD','MATCHES','25 Einsätze','Absolviere mindestens 25 bestätigte EPL Matches.',25,500,1,250),
('field_matches_30','PLAYER','FIELD','MATCHES','30 Einsätze','Absolviere mindestens 30 bestätigte EPL Matches.',30,700,1,350);

-- More goalkeeper goals.
INSERT OR IGNORE INTO season_goal_templates(code,scope,position_group,metric,title,description,target_value,reward_coins,active,entry_cost_coins) VALUES
('gk_saves_50','PLAYER','GK','SAVES','50 Paraden','Erreiche mindestens 50 Saves in der Saison.',50,260,1,130),
('gk_saves_100','PLAYER','GK','SAVES','100 Paraden','Erreiche mindestens 100 Saves in der Saison.',100,600,1,300),
('gk_saves_200','PLAYER','GK','SAVES','200 Paraden','Erreiche mindestens 200 Saves in der Saison.',200,1500,1,750),
('gk_cs_3','PLAYER','GK','CLEAN_SHEETS','3 Zu-Null-Spiele','Halte mindestens dreimal die Null.',3,240,1,120),
('gk_cs_8','PLAYER','GK','CLEAN_SHEETS','8 Zu-Null-Spiele','Halte mindestens achtmal die Null.',8,800,1,400),
('gk_cs_15','PLAYER','GK','CLEAN_SHEETS','15 Zu-Null-Spiele','Halte mindestens fünfzehnmal die Null.',15,1800,1,900),
('gk_rating_70','PLAYER','GK','AVG_RATING','7,00 Keeper-Rating','Beende die Saison mit mindestens 7,00 Durchschnittsrating.',7.0,300,1,150),
('gk_rating_76','PLAYER','GK','AVG_RATING','7,60 Keeper-Rating','Beende die Saison mit mindestens 7,60 Durchschnittsrating.',7.6,1000,1,500),
('gk_motm_3','PLAYER','GK','MOTM','3× Keeper MOTM','Werde mindestens dreimal Man of the Match.',3,320,1,160),
('gk_motm_8','PLAYER','GK','MOTM','8× Keeper MOTM','Werde mindestens achtmal Man of the Match.',8,1100,1,550),
('gk_matches_10','PLAYER','GK','MATCHES','10 Torwart-Einsätze','Absolviere mindestens 10 EPL Matches als Torwart.',10,160,1,80),
('gk_matches_30','PLAYER','GK','MATCHES','30 Torwart-Einsätze','Absolviere mindestens 30 EPL Matches als Torwart.',30,700,1,350);

-- More club goals. Reward is always exactly 2x the entry fee.
INSERT OR IGNORE INTO season_goal_templates(code,scope,position_group,metric,title,description,target_value,reward_coins,active,entry_cost_coins) VALUES
('club_wins_5','CLUB','ANY','WINS','5 Saisonsiege','Gewinnt mindestens fünf Ligaspiele.',5,220,1,110),
('club_wins_15','CLUB','ANY','WINS','15 Saisonsiege','Gewinnt mindestens fünfzehn Ligaspiele.',15,700,1,350),
('club_wins_25','CLUB','ANY','WINS','25 Saisonsiege','Gewinnt mindestens fünfundzwanzig Ligaspiele.',25,1500,1,750),
('club_points_30','CLUB','ANY','POINTS','30 Punkte','Erreicht mindestens 30 Tabellenpunkte.',30,300,1,150),
('club_points_50','CLUB','ANY','POINTS','50 Punkte','Erreicht mindestens 50 Tabellenpunkte.',50,800,1,400),
('club_points_75','CLUB','ANY','POINTS','75 Punkte','Erreicht mindestens 75 Tabellenpunkte.',75,1800,1,900),
('club_cs_3','CLUB','ANY','CLEAN_SHEETS','3 Team Clean Sheets','Spielt mindestens dreimal zu Null.',3,200,1,100),
('club_cs_8','CLUB','ANY','CLEAN_SHEETS','8 Team Clean Sheets','Spielt mindestens achtmal zu Null.',8,700,1,350),
('club_cs_12','CLUB','ANY','CLEAN_SHEETS','12 Team Clean Sheets','Spielt mindestens zwölfmal zu Null.',12,1200,1,600),
('club_goals_30','CLUB','ANY','GOALS_FOR','30 Team-Tore','Erzielt mindestens 30 Ligatore.',30,400,1,200),
('club_goals_50','CLUB','ANY','GOALS_FOR','50 Team-Tore','Erzielt mindestens 50 Ligatore.',50,900,1,450),
('club_played_20','CLUB','ANY','PLAYED','20 Ligaspiele','Absolviert mindestens 20 bestätigte Ligaspiele.',20,300,1,150);

-- Normalize legacy rewards to exactly double their stakes.
UPDATE season_goal_templates SET reward_coins=entry_cost_coins*2 WHERE entry_cost_coins>0;
