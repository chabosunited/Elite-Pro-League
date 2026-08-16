PRAGMA foreign_keys = ON;

-- EPL v18: formal league rules, transfer windows, season-based roster limits,
-- evidence retention and rich-news content.

CREATE TABLE IF NOT EXISTS league_rule_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  intro TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS league_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL REFERENCES league_rule_sections(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'INFO',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_league_rules_section ON league_rules(section_id,sort_order,id);

CREATE TABLE IF NOT EXISTS transfer_windows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  opens_at TEXT,
  closes_at TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','OPEN','CLOSED')),
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_transfer_windows_season ON transfer_windows(season_id,status,opens_at,closes_at);

CREATE TABLE IF NOT EXISTS club_season_limits (
  season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  base_release_limit INTEGER NOT NULL DEFAULT 5,
  releases_used INTEGER NOT NULL DEFAULT 0,
  base_transfer_limit INTEGER NOT NULL DEFAULT 5,
  transfers_used INTEGER NOT NULL DEFAULT 0,
  roster_limit INTEGER NOT NULL DEFAULT 25,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(season_id,club_id)
);

INSERT OR IGNORE INTO club_season_limits(season_id,club_id)
SELECT season_id,club_id FROM season_clubs;

ALTER TABLE match_club_submissions ADD COLUMN evidence_keep_until TEXT;

ALTER TABLE contracts ADD COLUMN source_club_id INTEGER REFERENCES clubs(id);
ALTER TABLE contracts ADD COLUMN season_id INTEGER REFERENCES seasons(id);
ALTER TABLE contracts ADD COLUMN transfer_window_id INTEGER REFERENCES transfer_windows(id);
ALTER TABLE contracts ADD COLUMN release_required INTEGER NOT NULL DEFAULT 0;
ALTER TABLE contracts ADD COLUMN release_approved_by INTEGER REFERENCES users(id);
ALTER TABLE contracts ADD COLUMN release_approved_at TEXT;
ALTER TABLE contracts ADD COLUMN player_accepted_at TEXT;

ALTER TABLE news ADD COLUMN body_html TEXT;
ALTER TABLE news ADD COLUMN updated_at TEXT;

-- Seed the EPL rulebook. Text is EPL-specific; admins can edit it later.
INSERT OR IGNORE INTO league_rule_sections(code,title,intro,sort_order) VALUES
('general','1. Allgemeine Bestimmungen & Fair Play','Grundlage für einen fairen, nachvollziehbaren und wettbewerbsorientierten EPL-Ligabetrieb.',10),
('eligibility','2. Teilnahme, Spielberechtigung & Kader','Wer in offiziellen EPL-Partien eingesetzt werden darf und wie Kader geführt werden.',20),
('match_rules','3. Spielregeln','Verbindliche Mindestanforderungen für offizielle EPL-Ligaspiele.',30),
('scheduling','4. Spielvereinbarungen & Pünktlichkeit','Regeln für Terminabsprachen, Erscheinen und Nichtantritt.',40),
('reporting','5. Ergebnis-, Statistik- & Nachweispflichten','Wie Ergebnisse und Spielerstatistiken gemeldet, bestätigt und nachgewiesen werden.',50),
('transfers','6. Transferperioden & Verpflichtungen','Kaderzugänge vor Saisonbeginn, während Transferfenstern und außerhalb eines Fensters.',60),
('releases','7. Spieler-Entlassungen','Saisonlimits für Entlassungen und zusätzliche Club-Shop-Credits.',70),
('protests','8. Proteste & Korrekturen','Verfahren bei Regelverstößen, falschen Angaben und strittigen Spielen.',80),
('withdrawals','9. Aussteiger & Disqualifikationen','Folgen eines Rückzugs oder einer Disqualifikation während einer Saison.',90),
('sanctions','10. Sanktionen & Defwins','Mögliche Konsequenzen bei Regelverstößen und Grundsätze für Wertungen.',100);

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'general_respect','Respekt & Integrität','Alle Teilnehmer behandeln Mitspieler, Gegner, VMs und EPL-Admins respektvoll. Manipulation von Ergebnissen, Statistiken, Accounts, EPL Coins, Shop-Inhalten oder Auszeichnungen ist untersagt.','INFO',10 FROM league_rule_sections WHERE code='general';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'general_admin','Entscheidungen der Ligaleitung','Die EPL-Ligaleitung darf bei technischen Sonderfällen, nachweisbaren Regelverstößen oder nicht ausdrücklich geregelten Situationen Entscheidungen zur Wahrung der Wettbewerbsintegrität treffen und diese dokumentieren.','INFO',20 FROM league_rule_sections WHERE code='general';

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'eligibility_registered','Registrierte Spieler','In einem offiziellen Ligaspiel dürfen ausschließlich Spieler eingesetzt werden, die auf der EPL-Plattform registriert und zum Zeitpunkt des Spiels dem teilnehmenden Club als aktives Kadermitglied zugeordnet sind.','CRITICAL',10 FROM league_rule_sections WHERE code='eligibility';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'eligibility_unregistered','Nicht gemeldeter Spieler','Wird ein nicht registrierter, nicht spielberechtigter oder einem anderen Club zugeordneter Spieler eingesetzt, wird die Partie grundsätzlich als automatische Niederlage des betreffenden Clubs gewertet. Die Standard-Defwin-Wertung beträgt 0:3.','CRITICAL',20 FROM league_rule_sections WHERE code='eligibility';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'eligibility_roster','Kadergröße','Ein EPL-Club darf höchstens 25 aktive Spieler im Kader führen. Neuverpflichtungen sind nur möglich, solange dieses Maximum nicht überschritten wird.','IMPORTANT',30 FROM league_rule_sections WHERE code='eligibility';

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'match_min_players','Mindestspielerzahl','Eine offizielle EPL-Partie darf nur begonnen werden, wenn jedes Team mindestens 5 Feldspieler plus 1 menschlichen Torwart stellt. Damit sind mindestens 6 menschliche Spieler pro Team erforderlich.','CRITICAL',10 FROM league_rule_sections WHERE code='match_rules';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'match_keeper','Menschlicher Torwart','Der sechste Mindestspieler muss als menschlicher Torwart eingesetzt werden. Ein KI-Torwart erfüllt die Mindestanforderung nicht.','IMPORTANT',20 FROM league_rule_sections WHERE code='match_rules';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'match_fairplay','Spielabbruch & technische Probleme','Bei technischen Problemen soll der betroffene VM den Gegner unverzüglich informieren und Beweismaterial sichern. Ob eine Wiederholung, Fortsetzung oder Wertung erfolgt, entscheidet bei Streit die EPL-Ligaleitung anhand der verfügbaren Nachweise.','INFO',30 FROM league_rule_sections WHERE code='match_rules';

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'schedule_agreement','Spieltermin','Die beteiligten VMs vereinbaren den Spieltermin nachvollziehbar und tragen Datum und Startzeit auf der EPL-Plattform ein. Beide Clubs sind für die rechtzeitige Abstimmung verantwortlich.','IMPORTANT',10 FROM league_rule_sections WHERE code='scheduling';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'schedule_15min','15-Minuten-Regel','Erscheint ein Team 15 Minuten nach dem vereinbarten Spielbeginn nicht spielbereit oder erfolgt keine verwertbare Rückmeldung eines zuständigen VM, erhält das wartende Team grundsätzlich einen 3:0-Defwin.','CRITICAL',20 FROM league_rule_sections WHERE code='scheduling';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'schedule_changes','Terminänderungen','Terminänderungen sollen von beiden Teams abgestimmt und anschließend auf der Plattform aktualisiert werden. Im Streitfall zählt der zuletzt nachvollziehbar vereinbarte Termin.','INFO',30 FROM league_rule_sections WHERE code='scheduling';

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'report_result','Ergebnismeldung & Bestätigung','Nach dem Spiel trägt ein VM das Endergebnis ein. Sobald eine Seite das Ergebnis gemeldet hat, bestätigt die gegnerische Seite die Meldung. Erst danach gilt das Ergebnis als bestätigt und fließt verbindlich in Tabelle und Auswertungen ein.','CRITICAL',10 FROM league_rule_sections WHERE code='reporting';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'report_stats','Eigene Spielerstatistiken','Jeder VM ist für die vollständige und wahrheitsgemäße Eingabe der Spielerstatistiken seines eigenen Clubs verantwortlich, insbesondere Tore, Assists, Saves, Clean Sheets, Karten, Rating und gegebenenfalls MOTM.','IMPORTANT',20 FROM league_rule_sections WHERE code='reporting';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'report_evidence','Statistikaufbewahrung – 7 Tage','VMs müssen Screenshots beziehungsweise geeignete Nachweise der relevanten Spielerstatistiken, Matchstatistiken und des Ergebnisses mindestens 7 Tage nach der Partie aufbewahren und auf Anforderung der EPL-Ligaleitung vorlegen können.','IMPORTANT',30 FROM league_rule_sections WHERE code='reporting';

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'transfer_preseason','Vor Saisonbeginn','Solange die Saison noch nicht aktiv ist, dürfen Clubs beliebig viele Spieler verpflichten, solange die maximale Kadergröße von 25 Spielern eingehalten wird.','INFO',10 FROM league_rule_sections WHERE code='transfers';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'transfer_closed','Saisonstart & geschlossenes Fenster','Mit Beginn einer aktiven Saison sind normale Neuverpflichtungen geschlossen, sofern die EPL-Ligaleitung kein Transferfenster geöffnet hat. Free Agents können außerhalb eines geöffneten Transferfensters nicht regulär verpflichtet werden.','CRITICAL',20 FROM league_rule_sections WHERE code='transfers';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'transfer_window','Geöffnetes Transferfenster','Während eines von der EPL-Ligaleitung geöffneten Transferfensters verfügt jeder Club zunächst über 5 Transferplätze für weitere Verpflichtungen. Nach Verbrauch können VMs im Club-Shop jeweils +5 zusätzliche Transfers mit Club-Coins erwerben.','IMPORTANT',30 FROM league_rule_sections WHERE code='transfers';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'transfer_release','Clubwechsel außerhalb der Transferperiode','Möchte ein Spieler außerhalb eines geöffneten Transferfensters von einem teilnehmenden EPL-Club zu einem anderen EPL-Club wechseln, ist die Zustimmung und Freigabe des bisherigen Clubs erforderlich. Der Wechsel wird erst nach Spielerannahme und Clubfreigabe vollzogen.','CRITICAL',40 FROM league_rule_sections WHERE code='transfers';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'transfer_count','Zählweise','Ein Transferplatz wird erst verbraucht, wenn eine Verpflichtung tatsächlich abgeschlossen und der Spieler dem neuen Kader zugeordnet wurde. Abgelehnte oder zurückgezogene Angebote verbrauchen keinen Transferplatz.','INFO',50 FROM league_rule_sections WHERE code='transfers';

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'release_base','5 Entlassungen pro Saison','Jeder Club erhält zu Beginn jeder Saison 5 Spieler-Entlassungen. Mit Beginn einer neuen Saison wird dieses Basislimit automatisch neu bereitgestellt.','IMPORTANT',10 FROM league_rule_sections WHERE code='releases';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'release_shop','Zusätzliche Entlassungen','Sind die 5 Basis-Entlassungen verbraucht, kann ein VM im EPL Club-Shop ein Paket mit +5 weiteren Spieler-Entlassungen gegen Club-Coins erwerben.','INFO',20 FROM league_rule_sections WHERE code='releases';

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'protest_window','Meldung eines Regelverstoßes','Ein mutmaßlicher Regelverstoß soll so schnell wie möglich über das EPL-Meldesystem beziehungsweise den vorgesehenen Ligaweg gemeldet werden. Beweise wie Screenshots oder Videos sollen bis zur Entscheidung aufbewahrt werden.','INFO',10 FROM league_rule_sections WHERE code='protests';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'protest_correction','Korrekturen','EPL-Admins dürfen nachweislich fehlerhafte Ergebnisse, Statistiken, Spielerzuordnungen und Sanktionen korrigieren. Bereits ausgeschüttete automatische Belohnungen können bei einer Ergebnisrücksetzung zurückgebucht werden.','INFO',20 FROM league_rule_sections WHERE code='protests';

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'withdrawal_future','Rückzug während der Saison','Zieht sich ein Club aus dem laufenden Wettbewerb zurück oder wird disqualifiziert, kann die EPL-Ligaleitung noch ausstehende Partien als Defwins für die jeweiligen Gegner werten.','CRITICAL',10 FROM league_rule_sections WHERE code='withdrawals';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'withdrawal_previous','Bereits gespielte Partien','Über die Behandlung bereits bestätigter Spiele eines ausgeschiedenen Clubs entscheidet die EPL-Ligaleitung einheitlich für den betroffenen Wettbewerb, damit Tabelle und Wettbewerb möglichst fair bleiben.','IMPORTANT',20 FROM league_rule_sections WHERE code='withdrawals';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'withdrawal_manipulation','Manipulativer Ausstieg','Ein gezielter Ausstieg zur Manipulation von Tabelle, Transfers oder Saisonwertungen kann zusätzliche Sperren für verantwortliche Accounts oder VMs nach sich ziehen.','CRITICAL',30 FROM league_rule_sections WHERE code='withdrawals';

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'sanctions_defwin','Defwin-Standard','Ein automatischer Sieg beziehungsweise eine automatische Niederlage wird grundsätzlich mit 3:0 für das regelkonforme beziehungsweise wartende Team gewertet, sofern die Ligaleitung im konkreten Fall keine andere begründete Entscheidung trifft.','CRITICAL',10 FROM league_rule_sections WHERE code='sanctions';
INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'sanctions_scale','Mögliche Sanktionen','Je nach Schwere und Wiederholung sind Verwarnung, Ergebnisänderung, Defwin, Punktabzug, Funktionssperre, Transfersperre, temporäre Accountsperre, dauerhafte Sperre oder Disqualifikation möglich.','IMPORTANT',20 FROM league_rule_sections WHERE code='sanctions';
