PRAGMA foreign_keys = ON;

-- ============================================================
-- EPL v4: Shop catalog, bundles, badges, moderation, CMS and
-- season goals. Run exactly once after migrations 0001-0005.
-- ============================================================

ALTER TABLE shop_items ADD COLUMN price_eur_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN equipped_badge_id INTEGER;

CREATE TABLE IF NOT EXISTS shop_bundle_items (
  bundle_item_id INTEGER NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  PRIMARY KEY(bundle_item_id,item_id),
  CHECK(bundle_item_id <> item_id)
);

CREATE TABLE IF NOT EXISTS shop_orders (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES shop_items(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  provider TEXT NOT NULL DEFAULT 'STRIPE',
  provider_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PAID','FAILED','CANCELLED','REFUNDED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT
);

-- User reports + moderator workflow.
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK(target_type IN ('POST','COMMENT','USER','CLUB','NEWS')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','REVIEWED','RESOLVED','REJECTED')),
  handled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  handled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type,target_id);

-- Public content management system used by the Admin page editor.
CREATE TABLE IF NOT EXISTS cms_page_settings (
  page_key TEXT PRIMARY KEY,
  eyebrow TEXT,
  title TEXT,
  subtitle TEXT,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cms_home_slides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  eyebrow TEXT,
  title TEXT NOT NULL,
  copy TEXT,
  cta_primary_label TEXT,
  cta_primary_href TEXT,
  cta_secondary_label TEXT,
  cta_secondary_href TEXT,
  visual_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cms_content_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_key TEXT NOT NULL,
  content_key TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(page_key, content_key)
);
CREATE INDEX IF NOT EXISTS idx_cms_content_page ON cms_content_entries(page_key,sort_order,id);

CREATE TABLE IF NOT EXISTS cms_page_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_key TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  image_key TEXT,
  cta_label TEXT,
  cta_href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cms_blocks_page ON cms_page_blocks(page_key,active,sort_order,id);

-- Season goal system.
CREATE TABLE IF NOT EXISTS season_goal_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL CHECK(scope IN ('PLAYER','CLUB')),
  position_group TEXT NOT NULL DEFAULT 'ANY' CHECK(position_group IN ('ANY','FIELD','GK')),
  metric TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_value REAL NOT NULL,
  reward_coins INTEGER NOT NULL CHECK(reward_coins >= 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))
);

CREATE TABLE IF NOT EXISTS user_season_goals (
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id INTEGER NOT NULL REFERENCES season_goal_templates(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'SELECTED' CHECK(status IN ('SELECTED','COMPLETED','FAILED')),
  progress_value REAL NOT NULL DEFAULT 0,
  selected_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  PRIMARY KEY(season_id,user_id,goal_id)
);

CREATE TABLE IF NOT EXISTS club_season_goals (
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  goal_id INTEGER NOT NULL REFERENCES season_goal_templates(id) ON DELETE CASCADE,
  selected_by INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'SELECTED' CHECK(status IN ('SELECTED','COMPLETED','FAILED')),
  progress_value REAL NOT NULL DEFAULT 0,
  selected_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  PRIMARY KEY(season_id,club_id,goal_id)
);

-- ---------------------------
-- CMS default page headings.
-- ---------------------------
INSERT OR IGNORE INTO cms_page_settings(page_key,eyebrow,title,subtitle) VALUES
('home','Willkommen','Willkommen bei der Elite Pro League','Die Elite Pro League ist die kompetitive Online Pro-Clubs-Liga für ambitionierte Spieler, starke Teams und echte Fußball-Esports-Action.'),
('news','EPL Redaktion','News','Ligabetrieb, Transfers, Interviews und Community Updates.'),
('liga','Saisonbetrieb','Liga & Spielplan','Fixtures, Ergebnisse und Wettbewerbe der Elite Pro League.'),
('tabelle','EPL Division 1','Tabelle','Aktuelle Platzierungen der laufenden EPL Saison.'),
('teams','Clubs','Teams','Registrierte EPL Clubs mit Profil, Kader und Bewerbungsfunktion.'),
('spieler','Community','Spieler','Alle registrierten Spielerprofile mit Social Feed, Karriere und Leistungsdaten.'),
('transfers','Markt','Transfers','Vertragsbewegungen, Free Agents und Bewerbungen.'),
('shop','EPL Coins','Shop','Cosmetics, Bundles und EPL Coins für dein persönliches Liga-Profil.'),
('regeln','Fair Play','Regelwerk','Grundregeln für Spieler, Manager und Ligabetrieb.');

-- Home sliders become editable in the Admin page editor.
INSERT OR IGNORE INTO cms_content_entries(page_key,content_key,label,value,sort_order) VALUES
('site','footer_tagline','Footer – Slogan','ELITE PRO LEAGUE – COMPETE. CONNECT. CONQUER.',10),
('home','register_title','Home – Registrierung Titel','REGISTRIERUNG IST GEÖFFNET!',10),
('home','register_body','Home – Registrierung Text','Erstelle jetzt dein Spielerprofil, tritt einem Club bei oder gründe dein eigenes Team.',20),
('home','register_step_1','Home – Registrierung Schritt 1','Profil erstellen und loslegen',30),
('home','register_step_2','Home – Registrierung Schritt 2','Club beitreten oder gründen',40),
('home','register_step_3','Home – Registrierung Schritt 3','Um den Titel kämpfen',50),
('home','register_button','Home – Registrierung Button','JETZT REGISTRIEREN',60),
('home','welcome_feature_1','Home – Willkommen Feature 1','Echte Wettbewerbe',70),
('home','welcome_feature_2','Home – Willkommen Feature 2','Aktive Community',80),
('home','welcome_feature_3','Home – Willkommen Feature 3','Professionelle Organisation',90),
('home','welcome_feature_4','Home – Willkommen Feature 4','Faire Regeln',100),
('home','why_title_1','Warum EPL – Titel 1','Echte Statistiken',110),
('home','why_text_1','Warum EPL – Text 1','Verfolge alle Daten, Ergebnisse und Statistiken in Echtzeit – transparent und detailliert.',120),
('home','why_title_2','Warum EPL – Titel 2','Transfers & Markt',130),
('home','why_text_2','Warum EPL – Text 2','Ein dynamischer Transfermarkt bringt Strategie und Spannung in jede Saison.',140),
('home','why_title_3','Warum EPL – Titel 3','Saisonbetrieb',150),
('home','why_text_3','Warum EPL – Text 3','Realistischer Ligabetrieb mit Auf- und Abstieg sowie Pokalwettbewerben.',160),
('home','why_title_4','Warum EPL – Titel 4','Manager-System',170),
('home','why_text_4','Warum EPL – Text 4','Organisiere dein Team, manage Verträge und führe deinen Club zum Erfolg.',180);

INSERT OR IGNORE INTO cms_home_slides(id,eyebrow,title,copy,cta_primary_label,cta_primary_href,cta_secondary_label,cta_secondary_href,visual_key,sort_order,active) VALUES
(1,'Top-News','Die Elite Pro League\nstartet in die neue Saison','Registriere dein Team, baue deinen Kader auf und kämpfe um den Titel in einer professionellen Pro-Clubs-Liga mit echter Tabellenführung, Transfers und Saisonbetrieb.','JETZT REGISTRIEREN','/registrieren','MEHR ERFAHREN','/liga','/assets/user/slider-1.png',10,1),
(2,'Social Profiles','Spieler- und Teamprofile\nmit echtem Social-Look','Profilbild, Titelbild, Folgen-Funktion, Feed, Highlights, Trophäen und individuelle Statistiken sorgen für eine moderne Community-Plattform.','SPIELER ENTDECKEN','/spieler','TEAMS ENTDECKEN','/teams','/assets/user/news2.png',20,1),
(3,'Manager Tools','Verträge, Bewerbungen\nund Matchverwaltung','Manager verwalten Kader, senden Vertragsangebote, prüfen Bewerbungen und bestätigen Ergebnisse direkt auf der Plattform.','MANAGER PANEL','/manager','REGELWERK','/regeln','/assets/user/news1.png',30,1),
(4,'EPL Coins','Verdiene Coins durch Leistung\nund nutze sie im Shop','Mit Siegen, MOTM-Auszeichnungen und Saisonzielen verdienst du EPL Coins für Rahmen, Badges, Namenseffekte und mehr.','ZUM SHOP','/shop','COINS SYSTEM','/shop','/assets/user/coin-balance-box.png',40,1);

-- ----------------------------------------
-- Seed full articles for the current news.
-- ----------------------------------------
INSERT OR IGNORE INTO news(slug,title,excerpt,body,image_key,status,published_at) VALUES
('saison-1-anmeldung-eroeffnet','Saison 1: Die Anmeldung ist eröffnet','Spieler und Teams können sich jetzt offiziell für die erste Saison der Elite Pro League registrieren.','Die Elite Pro League öffnet offiziell die Anmeldung für ihre erste vollständige Online-Saison. Spieler können ihr EPL-Profil anlegen, ihre EA ID und Position hinterlegen und anschließend einem bestehenden Club beitreten oder gemeinsam mit ihrer Mannschaft einen neuen Verein gründen.\n\nFür Clubs beginnt damit die Vorbereitungsphase: Kader aufbauen, Vereinsprofil vervollständigen, Managerrechte verteilen und sich auf den Ligastart vorbereiten. Spielplan, Tabelle, Matchstatistiken und Transfers werden zentral über die EPL-Plattform verwaltet.\n\nUnser Ziel ist ein übersichtlicher und fairer Pro-Clubs-Ligabetrieb, bei dem sportliche Leistungen und Community gleichermaßen im Mittelpunkt stehen. Weitere Informationen zu Saisonstart, Divisionen und Spieltagen werden über den Newsbereich veröffentlicht.','/assets/user/news.png','PUBLISHED','2026-08-09T12:00:00Z'),
('transfermarkt-vertraege-vorbereitet','Transfermarkt und Verträge sind vorbereitet','Manager können Vertragsangebote, Bewerbungen und künftige Wechsel direkt über die Plattform organisieren.','Mit dem EPL Transfer- und Vertragssystem erhalten Manager eine zentrale Anlaufstelle für ihre Kaderplanung. Spieler können sich bei Vereinen bewerben, Clubs können Vertragsangebote aussprechen und bestätigte Wechsel werden transparent im Transferbereich dokumentiert.\n\nVereinsmanager erhalten nur die Rechte für ihren eigenen Club. Liga- und Match-Admins behalten gleichzeitig den Überblick über Transfers, Kader und Spielberechtigungen. Dadurch soll verhindert werden, dass Änderungen außerhalb der vorgesehenen Zuständigkeiten vorgenommen werden.\n\nDer Transfermarkt wird mit dem Saisonbetrieb weiter ausgebaut. Geplant sind unter anderem Transferfenster, Free-Agent-Übersichten und zusätzliche Benachrichtigungen für Angebote und Bewerbungen.','/assets/user/news1.png','PUBLISHED','2026-08-09T12:05:00Z'),
('social-profile-spieler-teams','Social-Media-Profile für Spieler und Teams','Profile mit Titelbild, Feed und Follow-System sorgen für einen modernen Community-Look.','EPL verbindet klassischen Ligabetrieb mit einem eigenen Social-Bereich für die Pro-Clubs-Community. Jeder Spieler besitzt ein individuelles Profil mit Profilbild, Titelbild, Statistiken, Karriere, Erfolgen und Shop-Cosmetics. Clubs erhalten eigene Vereinsseiten mit Kader, Ergebnissen, Transfers und Beiträgen.\n\nSpieler können anderen Spielern und Clubs folgen. Neue Beiträge der gefolgten Accounts erscheinen anschließend im persönlichen Community Feed auf der Startseite. Beiträge unterstützen Reaktionen, Kommentare und Antworten, sodass die Liga nicht nur aus Tabellen und Ergebnissen besteht, sondern auch als echte Community-Plattform funktioniert.\n\nWeitere Social-Funktionen und Moderationswerkzeuge werden kontinuierlich ergänzt, damit Inhalte übersichtlich, fair und sicher verwaltet werden können.','/assets/user/news2.png','PUBLISHED','2026-08-09T12:10:00Z');

-- -------------------------------------------------------
-- Expanded Shop catalog using the uploaded EPL frame art.
-- IDs 10-29 are individual frames; 100+ are bundles.
-- -------------------------------------------------------
INSERT OR IGNORE INTO shop_items(id,sku,name,category,description,price_coins,asset_key,rarity,active,price_eur_cents) VALUES
(10,'avatar_frost_crown','FROST CROWN','AVATAR_FRAME','Eisblauer EPL Profilrahmen mit kristalliner Krone.',850,'/assets/user/shop/Profibildrahmen1.png','EPIC',1,399),
(11,'avatar_crimson_force','CRIMSON FORCE','AVATAR_FRAME','Aggressiver roter Rahmen für dominante Matchday-Profile.',800,'/assets/user/shop/Profibildrahmen2.png','EPIC',1,399),
(12,'avatar_emerald_core','EMERALD CORE','AVATAR_FRAME','Leuchtender grüner EPL Rahmen.',700,'/assets/user/shop/Profibildrahmen3.png','RARE',1,299),
(13,'avatar_royal_gold','ROYAL GOLD','AVATAR_FRAME','Edler goldener Rahmen für Elite-Spieler.',1100,'/assets/user/shop/Profibildrahmen4.png','LEGENDARY',1,499),
(14,'avatar_neon_violet','NEON VIOLET','AVATAR_FRAME','Violetter Neonrahmen mit futuristischem EPL Look.',750,'/assets/user/shop/Profibildrahmen5.png','EPIC',1,349),
(15,'avatar_blue_steel','BLUE STEEL','AVATAR_FRAME','Kühler metallischer Rahmen in EPL Blau.',650,'/assets/user/shop/Profibildrahmen6.png','RARE',1,299),
(16,'avatar_inferno','INFERNO','AVATAR_FRAME','Feuriger Rahmen für Torjäger und Matchwinner.',900,'/assets/user/shop/Profibildrahmen7.png','EPIC',1,399),
(17,'avatar_cyber_wave','CYBER WAVE','AVATAR_FRAME','Digitaler Cyber-Rahmen mit energiegeladenen Details.',780,'/assets/user/shop/Profibildrahmen8.png','EPIC',1,349),
(18,'avatar_shadow_elite','SHADOW ELITE','AVATAR_FRAME','Dunkler Premiumrahmen für einen minimalistischen Elite-Look.',950,'/assets/user/shop/Profibildrahmen9.png','EPIC',1,449),
(19,'avatar_platinum','PLATINUM','AVATAR_FRAME','Heller Platinrahmen mit cleanem Turnier-Look.',1050,'/assets/user/shop/Profibildrahmen10.png','LEGENDARY',1,449),
(20,'avatar_champion_x','CHAMPION X','AVATAR_FRAME','Limitierter Championship-Rahmen mit maximaler Präsenz.',1400,'/assets/user/shop/Profibildrahmen11.png','MYTHIC',1,599),
(21,'cover_royal_gold','ROYAL GOLD COVER','COVER_FRAME','Goldener Titelbildrahmen im EPL Premium-Stil.',1300,'/assets/user/shop/titelbildrahmen1.png','LEGENDARY',1,549),
(22,'cover_neon_blue','NEON BLUE COVER','COVER_FRAME','Elektrischer blauer Titelbildrahmen.',1000,'/assets/user/shop/titelbildrahmen2.png','EPIC',1,449),
(23,'cover_inferno','INFERNO COVER','COVER_FRAME','Feuriger Titelbildrahmen für Matchwinner.',1100,'/assets/user/shop/titelbildrahmen3.png','EPIC',1,449),
(24,'cover_emerald','EMERALD COVER','COVER_FRAME','Grüner Titelbildrahmen mit Turniercharakter.',900,'/assets/user/shop/titelbildrahmen4.png','RARE',1,399),
(25,'cover_violet','VIOLET COVER','COVER_FRAME','Violetter Titelbildrahmen mit Neon-Akzenten.',950,'/assets/user/shop/titelbildrahmen5.png','EPIC',1,399),
(26,'cover_platinum','PLATINUM COVER','COVER_FRAME','Platinfarbener Titelbildrahmen.',1200,'/assets/user/shop/titelbildrahmen6.png','LEGENDARY',1,499),
(27,'cover_shadow','SHADOW COVER','COVER_FRAME','Dunkler Titelbildrahmen für einen cleanen Club-Look.',850,'/assets/user/shop/titelbildrahmen7.png','RARE',1,349),
(28,'cover_champion','CHAMPION COVER','COVER_FRAME','Championship-Titelbildrahmen mit starken EPL Details.',1450,'/assets/user/shop/titelbildrahmen8.png','MYTHIC',1,599),
(29,'cover_ice','ICE COVER','COVER_FRAME','Eisblauer Titelbildrahmen passend zum Frost-Crown-Set.',1050,'/assets/user/shop/titelbildrahmen9.png','EPIC',1,449),
(100,'bundle_frost_elite','FROST ELITE BUNDLE','BUNDLE','Frost Crown Profilrahmen + Ice Cover + Lightning Namenseffekt.',2100,'/assets/user/bundles-box.png','LEGENDARY',1,899),
(101,'bundle_royal_champion','ROYAL CHAMPION BUNDLE','BUNDLE','Royal Gold Profilrahmen + Royal Gold Cover + EPL Champion Badge.',3200,'/assets/user/bundles-box.png','MYTHIC',1,1299),
(102,'bundle_neon_nights','NEON NIGHTS BUNDLE','BUNDLE','Neon Violet Profilrahmen + Neon Blue Cover + Lightning Namenseffekt.',2350,'/assets/user/bundles-box.png','LEGENDARY',1,999),
(103,'bundle_frame_vault','FRAME VAULT','BUNDLE','Vier unterschiedliche Profilrahmen für maximale Abwechslung.',2500,'/assets/user/bundles-box.png','LEGENDARY',1,1099);

-- Bring the original four items in line with the real uploaded assets.
UPDATE shop_items SET asset_key='/assets/user/Profilrahmen1.png',price_eur_cents=349 WHERE id=1;
UPDATE shop_items SET asset_key='/assets/user/Titelbildrahmen1.png',price_eur_cents=499 WHERE id=2;
UPDATE shop_items SET asset_key='/assets/user/Namenseffekt1.png',price_eur_cents=399 WHERE id=3;
UPDATE shop_items SET asset_key='/assets/user/EPLTrophy.png',price_eur_cents=499 WHERE id=4;

INSERT OR IGNORE INTO shop_bundle_items(bundle_item_id,item_id) VALUES
(100,10),(100,29),(100,3),
(101,13),(101,21),(101,4),
(102,14),(102,22),(102,3),
(103,10),(103,13),(103,16),(103,20);

-- -----------------------
-- Season goal templates.
-- -----------------------
INSERT OR IGNORE INTO season_goal_templates(code,scope,position_group,metric,title,description,target_value,reward_coins,active) VALUES
('field_goals_10','PLAYER','FIELD','GOALS','10 Tore','Erziele mindestens 10 Tore in dieser Saison.',10,350,1),
('field_goals_25','PLAYER','FIELD','GOALS','25 Tore','Erziele mindestens 25 Tore in dieser Saison.',25,900,1),
('field_assists_15','PLAYER','FIELD','ASSISTS','15 Assists','Bereite mindestens 15 Tore vor.',15,650,1),
('field_gcontrib_30','PLAYER','FIELD','GOAL_CONTRIBUTIONS','30 Scorerpunkte','Erreiche zusammen mindestens 30 Tore + Assists.',30,850,1),
('field_motm_5','PLAYER','FIELD','MOTM','5× MOTM','Werde mindestens fünfmal Man of the Match.',5,650,1),
('field_rating_75','PLAYER','FIELD','AVG_RATING','7,50 Durchschnitt','Beende die Saison mit mindestens 7,50 Durchschnittsrating.',7.5,800,1),
('field_matches_20','PLAYER','FIELD','MATCHES','20 Einsätze','Absolviere mindestens 20 bestätigte EPL Matches.',20,300,1),
('gk_saves_75','PLAYER','GK','SAVES','75 Paraden','Erreiche mindestens 75 Saves in der Saison.',75,500,1),
('gk_saves_150','PLAYER','GK','SAVES','150 Paraden','Erreiche mindestens 150 Saves in der Saison.',150,1000,1),
('gk_cs_5','PLAYER','GK','CLEAN_SHEETS','5 Zu-Null-Spiele','Halte mindestens fünfmal die Null.',5,650,1),
('gk_cs_10','PLAYER','GK','CLEAN_SHEETS','10 Zu-Null-Spiele','Halte mindestens zehnmal die Null.',10,1250,1),
('gk_rating_73','PLAYER','GK','AVG_RATING','7,30 Keeper-Rating','Beende die Saison mit mindestens 7,30 Durchschnittsrating.',7.3,750,1),
('gk_motm_5','PLAYER','GK','MOTM','5× Keeper MOTM','Werde mindestens fünfmal Man of the Match.',5,700,1),
('gk_matches_20','PLAYER','GK','MATCHES','20 Torwart-Einsätze','Absolviere mindestens 20 EPL Matches als Torwart.',20,300,1),
('club_wins_10','CLUB','ANY','WINS','10 Saisonsiege','Gewinnt mindestens zehn Ligaspiele.',10,450,1),
('club_wins_20','CLUB','ANY','WINS','20 Saisonsiege','Gewinnt mindestens zwanzig Ligaspiele.',20,900,1),
('club_points_40','CLUB','ANY','POINTS','40 Punkte','Erreicht mindestens 40 Tabellenpunkte.',40,600,1),
('club_points_60','CLUB','ANY','POINTS','60 Punkte','Erreicht mindestens 60 Tabellenpunkte.',60,1100,1),
('club_cs_5','CLUB','ANY','CLEAN_SHEETS','5 Team Clean Sheets','Spielt mindestens fünfmal zu Null.',5,500,1),
('club_champion','CLUB','ANY','CHAMPION','EPL Meister','Beendet die Division auf Tabellenplatz 1.',1,1800,1);
