PRAGMA foreign_keys = ON;

-- EPL v19: expanded achievements, repeatable automatic awards and accurate award counters.
-- automatic_quantity is the part of user_trophies.quantity derived from confirmed EPL data.
-- Manual admin grants remain additive and are never overwritten by the automatic synchronizer.
ALTER TABLE user_trophies ADD COLUMN automatic_quantity INTEGER NOT NULL DEFAULT 0;


-- Existing v18 counters for result-derived EPL MOTM / EPL Meister are treated as the legacy
-- automatic baseline, so v19 does not double-count them when the first synchronization runs.
UPDATE user_trophies
SET automatic_quantity=quantity
WHERE trophy_id IN (SELECT id FROM trophies WHERE name IN ('EPL MOTM','EPL Meister'));

INSERT OR IGNORE INTO achievement_definitions(code,title,description,category,metric,target_value,asset_key,sort_order) VALUES
('GOALS_25','Goal Machine','Erziele insgesamt 25 bestätigte EPL-Tore.','OFFENSIVE','GOALS_TOTAL',25,'/assets/achievements/25Tore.png',21),
('GOALS_50','Elite Finisher','Erziele insgesamt 50 bestätigte EPL-Tore.','OFFENSIVE','GOALS_TOTAL',50,'/assets/achievements/50Tore.png',22),
('GOALS_100','Centurion','Erziele insgesamt 100 bestätigte EPL-Tore.','OFFENSIVE','GOALS_TOTAL',100,'/assets/achievements/100Tore.png',23),
('ASSISTS_10','Provider','Erreiche insgesamt 10 bestätigte EPL-Assists.','OFFENSIVE','ASSISTS_TOTAL',10,'/assets/achievements/10Assists.png',25),
('ASSISTS_50','Architect','Erreiche insgesamt 50 bestätigte EPL-Assists.','OFFENSIVE','ASSISTS_TOTAL',50,'/assets/achievements/50Assists.png',31),
('ASSISTS_100','Maestro','Erreiche insgesamt 100 bestätigte EPL-Assists.','OFFENSIVE','ASSISTS_TOTAL',100,'/assets/achievements/100Assists.png',32),
('SAVES_25','Shot Stopper','Erreiche insgesamt 25 bestätigte Saves als Torhüter.','DEFENSIVE','SAVES_TOTAL',25,'/assets/achievements/25SavesTorwart.png',41),
('SAVES_100','Guardian','Erreiche insgesamt 100 bestätigte Saves als Torhüter.','DEFENSIVE','SAVES_TOTAL',100,'/assets/achievements/100SavesTorwart.png',42),
('SAVES_250','Brick Wall','Erreiche insgesamt 250 bestätigte Saves als Torhüter.','DEFENSIVE','SAVES_TOTAL',250,'/assets/achievements/250SavesTorwart.png',43),
('CLEAN_SHEETS_25','Fortress','Erreiche 25 Clean Sheets in bestätigten EPL-Matches.','DEFENSIVE','CLEAN_SHEETS',25,'/assets/achievements/25CleanSheets.png',44),
('CLEAN_SHEETS_50','Iron Wall','Erreiche 50 Clean Sheets in bestätigten EPL-Matches.','DEFENSIVE','CLEAN_SHEETS',50,'/assets/achievements/50CleanSheets.png',45),
('FIELD_CLEAN_SHEETS_5','Lockdown','Erreiche als Feldspieler 5 Clean Sheets in bestätigten EPL-Matches.','DEFENSIVE','FIELD_CLEAN_SHEETS',5,'/assets/achievements/5CleanSheetsFeldspieler.png',46),
('GK_FIRST_CLEAN_SHEET','Safe Hands','Erreiche dein erstes bestätigtes Clean Sheet als Torhüter.','DEFENSIVE','GK_CLEAN_SHEETS',1,'/assets/achievements/ErstesCleanSheetsTorwart.png',47),
('MATCHES_ONE_CLUB_25','Home Sweet Home','Absolviere 25 bestätigte EPL-Matches für denselben Club.','CAREER','MATCHES_ONE_CLUB',25,'/assets/achievements/25SpieleSelberClub.png',49),
('SCORING_STREAK_5','Hot Streak','Triff in 5 bestätigten EPL-Einsätzen hintereinander.','OFFENSIVE','SCORING_STREAK',5,'/assets/achievements/5SpieleHintereinanderTreffen.png',79),
('UNBEATEN_15','Relentless','Bleibe in 15 aufeinanderfolgenden bestätigten Einsätzen ungeschlagen.','CAREER','UNBEATEN_STREAK',15,'/assets/achievements/15SiegeInFolge.png',81),
('UNBEATEN_25','Invincible','Bleibe in 25 aufeinanderfolgenden bestätigten Einsätzen ungeschlagen.','CAREER','UNBEATEN_STREAK',25,'/assets/achievements/25SiegeInFolge.png',82),
('REVENGE_WIN','Revenge','Besiege einen Gegner, gegen den du dein vorheriges EPL-Spiel verloren hast.','ELITE','REVENGE_WINS',1,'/assets/achievements/SiegNachNiederlageGegenSelbenClub.png',91),
('STATEMENT_WIN','Statement Win','Gewinne ein bestätigtes EPL-Spiel mit mindestens 5 Toren Unterschied.','ELITE','STATEMENT_WINS',1,'/assets/achievements/Winmit5Torenmehr.png',92);

-- Repeatable player-profile awards. Their counters are synchronized from confirmed match/season data.
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Masterclass','/assets/awards/1Tor2AssistsInEinemSPiel.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Masterclass');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Seasoned','/assets/awards/2EPLSaisonsGespielt.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Seasoned');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Back to Back','/assets/awards/2MeisterschaftenInFolge.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Back to Back');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Unbeatable','/assets/awards/3CleanSheetsInFolge.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Unbeatable');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'On Fire','/assets/awards/3SpieleHintereinanderTreffen.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='On Fire');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Hat-Trick Hero','/assets/awards/3ToreInEinemSpiel.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Hat-Trick Hero');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Poker Face','/assets/awards/4ToreInEInemSpiel.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Poker Face');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Old Guard','/assets/awards/5EPLSaisonsGespielt.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Old Guard');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Dominant','/assets/awards/5SiegeInFolge.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Dominant');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Assist Streak','/assets/awards/5SpieleMind1Assist.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Assist Streak');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Fortress Run','/assets/awards/5SpieleOhneGegentor.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Fortress Run');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Consistency','/assets/awards/5SpieleRating8plus.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Consistency');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Promoted','/assets/awards/Aufgestiegen.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Promoted');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Perfect Start','/assets/awards/Erste5SaisonspieleGewinnen.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Perfect Start');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Survivor','/assets/awards/KlasseGehalten.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Survivor');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Defensive Masterclass','/assets/awards/MOTMAlsVerteidiger.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Defensive Masterclass');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Ice Cold','/assets/awards/MehrAls4ToreInEinemSpiel.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Ice Cold');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Assist King','/assets/awards/MeisteAssistsEineSaison.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Assist King');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Clean Sheet King','/assets/awards/MeisteCleanSheetsEInerSaison.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Clean Sheet King');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'MVP','/assets/awards/MeisteMOTMInEInerSaison.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='MVP');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'TOTW','/assets/awards/TOTWSpielerAuszeichnung.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='TOTW');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Keeper of the Year','/assets/awards/TorwartdesJahresAuszeichnung.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Keeper of the Year');
INSERT INTO trophies(name,icon_key,season_id,type) SELECT 'Invincibles','/assets/awards/1SaisonOhneNiderlage.png',NULL,'BADGE' WHERE NOT EXISTS(SELECT 1 FROM trophies WHERE name='Invincibles');

-- Old v10 TOTW rows used a temporary profile-frame image as a manual achievement.
-- v19 represents TOTW once, correctly, as a repeatable badge with xN counter.
DELETE FROM player_achievements WHERE title='EPL Team of the Week' AND icon_key='/assets/totw/SpielerDerWocheRahmen.png';
