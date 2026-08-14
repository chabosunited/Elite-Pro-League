PRAGMA foreign_keys = ON;

-- EPL v13: composable username styles, VM/team consumables and extra profile items.
ALTER TABLE profiles ADD COLUMN equipped_name_font_id INTEGER;
ALTER TABLE profiles ADD COLUMN equipped_name_color_id INTEGER;
ALTER TABLE profiles ADD COLUMN shop_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN shop_spotlight INTEGER NOT NULL DEFAULT 0;

ALTER TABLE shop_items ADD COLUMN shop_group TEXT NOT NULL DEFAULT 'COSMETIC';
ALTER TABLE shop_items ADD COLUMN item_type TEXT NOT NULL DEFAULT 'COSMETIC';
ALTER TABLE shop_items ADD COLUMN style_key TEXT;
ALTER TABLE shop_items ADD COLUMN style_value TEXT;

ALTER TABLE contracts ADD COLUMN transfer_credit_reserved INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS club_shop_entitlements (
  club_id INTEGER PRIMARY KEY REFERENCES clubs(id) ON DELETE CASCADE,
  transfer_credits INTEGER NOT NULL DEFAULT 0 CHECK(transfer_credits >= 0),
  release_credits INTEGER NOT NULL DEFAULT 0 CHECK(release_credits >= 0),
  red_card_removal_credits INTEGER NOT NULL DEFAULT 0 CHECK(red_card_removal_credits >= 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO club_shop_entitlements(club_id) SELECT id FROM clubs;

-- Classify all existing shop items without changing the legacy category CHECK.
UPDATE shop_items SET shop_group=CASE category
  WHEN 'AVATAR_FRAME' THEN 'AVATAR_FRAME'
  WHEN 'COVER_FRAME' THEN 'COVER_FRAME'
  WHEN 'NAME_EFFECT' THEN 'NAME_STYLES'
  WHEN 'BADGE' THEN 'BADGE'
  WHEN 'BUNDLE' THEN 'BUNDLE'
  ELSE 'COSMETIC' END
WHERE shop_group='COSMETIC';
UPDATE shop_items SET item_type=CASE category
  WHEN 'AVATAR_FRAME' THEN 'AVATAR_FRAME'
  WHEN 'COVER_FRAME' THEN 'COVER_FRAME'
  WHEN 'NAME_EFFECT' THEN 'NAME_EFFECT'
  WHEN 'BADGE' THEN 'BADGE'
  WHEN 'BUNDLE' THEN 'BUNDLE'
  ELSE 'COSMETIC' END
WHERE item_type='COSMETIC';

-- The original LIGHTNING item becomes a usable neon-style username effect.
UPDATE shop_items SET shop_group='NAME_STYLES',item_type='NAME_EFFECT',style_key='neon',style_value='neon' WHERE sku='name_lightning';

-- Username fonts. Stored as NAME_EFFECT only to remain compatible with the legacy category CHECK;
-- item_type determines the actual equip slot.
INSERT OR IGNORE INTO shop_items(id,sku,name,category,description,price_coins,asset_key,rarity,active,price_eur_cents,shop_group,item_type,style_key,style_value) VALUES
(300,'name_font_classic','CLASSIC BOLD','NAME_EFFECT','Klarer, sportlicher EPL Display-Font.',350,NULL,'COMMON',1,0,'NAME_STYLES','NAME_FONT','classic','Rajdhani'),
(301,'name_font_rounded','ROUNDED PRO','NAME_EFFECT','Moderner, weicher Social-Profile Look.',450,NULL,'RARE',1,0,'NAME_STYLES','NAME_FONT','rounded','Trebuchet'),
(302,'name_font_serif','SERIF ELITE','NAME_EFFECT','Edler Serif-Look für einen klassischen Auftritt.',450,NULL,'RARE',1,0,'NAME_STYLES','NAME_FONT','serif','Georgia'),
(303,'name_font_script','SCRIPT STAR','NAME_EFFECT','Geschwungener Signature-Stil.',600,NULL,'EPIC',1,0,'NAME_STYLES','NAME_FONT','script','Cursive'),
(304,'name_font_mono','MONO TECH','NAME_EFFECT','Technischer Monospace-Look.',400,NULL,'RARE',1,0,'NAME_STYLES','NAME_FONT','mono','Courier'),
(305,'name_font_impact','IMPACT','NAME_EFFECT','Breiter, massiver Matchday-Schriftzug.',550,NULL,'EPIC',1,0,'NAME_STYLES','NAME_FONT','impact','Impact'),
(306,'name_font_pixel','PIXEL CLUB','NAME_EFFECT','Digitaler Retro-/Gaming-Stil.',550,NULL,'EPIC',1,0,'NAME_STYLES','NAME_FONT','pixel','Pixel'),
(307,'name_font_wide','WIDE ELITE','NAME_EFFECT','Extra breite Buchstaben für maximale Präsenz.',500,NULL,'EPIC',1,0,'NAME_STYLES','NAME_FONT','wide','Wide');

-- Username visual effects inspired by Discord-style display-name effects plus additional EPL variants.
INSERT OR IGNORE INTO shop_items(id,sku,name,category,description,price_coins,asset_key,rarity,active,price_eur_cents,shop_group,item_type,style_key,style_value) VALUES
(310,'name_fx_stable','STABIL','NAME_EFFECT','Dezenter, sauberer Glanz ohne Animation.',300,NULL,'COMMON',1,0,'NAME_STYLES','NAME_EFFECT','stable','stable'),
(311,'name_fx_gradient','FARBVERLAUF','NAME_EFFECT','Animierter Farbverlauf über deinem Namen.',650,NULL,'EPIC',1,0,'NAME_STYLES','NAME_EFFECT','gradient','gradient'),
(312,'name_fx_neon','NEON','NAME_EFFECT','Leuchtender Neon-Glow wie bei Premium Social-Profilen.',750,NULL,'EPIC',1,0,'NAME_STYLES','NAME_EFFECT','neon','neon'),
(313,'name_fx_toon','TOON','NAME_EFFECT','Comic-Kontur mit kräftigem Schatten.',600,NULL,'EPIC',1,0,'NAME_STYLES','NAME_EFFECT','toon','toon'),
(314,'name_fx_pop','POP','NAME_EFFECT','Leicht pulsierender Pop-Effekt.',650,NULL,'EPIC',1,0,'NAME_STYLES','NAME_EFFECT','pop','pop'),
(315,'name_fx_glitch','GLITCH','NAME_EFFECT','Digitaler RGB-Glitch für Cyber-Profile.',800,NULL,'LEGENDARY',1,0,'NAME_STYLES','NAME_EFFECT','glitch','glitch'),
(316,'name_fx_hologram','HOLOGRAM','NAME_EFFECT','Holografischer Farbshift mit Bewegung.',900,NULL,'LEGENDARY',1,0,'NAME_STYLES','NAME_EFFECT','hologram','hologram'),
(317,'name_fx_pulse','PULSE','NAME_EFFECT','Rhythmischer Glow-Pulse.',650,NULL,'EPIC',1,0,'NAME_STYLES','NAME_EFFECT','pulse','pulse'),
(318,'name_fx_ice','ICE','NAME_EFFECT','Eisiger Lichtschein und kalte Highlights.',700,NULL,'EPIC',1,0,'NAME_STYLES','NAME_EFFECT','ice','ice'),
(319,'name_fx_fire','FIRE','NAME_EFFECT','Warmer Feuer-Glow mit intensiver Kante.',800,NULL,'LEGENDARY',1,0,'NAME_STYLES','NAME_EFFECT','fire','fire');

-- Username colors. Fonts, effect and color can be combined independently.
INSERT OR IGNORE INTO shop_items(id,sku,name,category,description,price_coins,asset_key,rarity,active,price_eur_cents,shop_group,item_type,style_key,style_value) VALUES
(320,'name_color_epl_blue','EPL BLUE','NAME_EFFECT','Offizielles elektrisches EPL Blau.',180,NULL,'COMMON',1,0,'NAME_STYLES','NAME_COLOR','epl-blue','#1da1ff'),
(321,'name_color_cyan','CYAN','NAME_EFFECT','Leuchtendes Cyan.',180,NULL,'COMMON',1,0,'NAME_STYLES','NAME_COLOR','cyan','#22e7e2'),
(322,'name_color_mint','MINT','NAME_EFFECT','Frisches Mintgrün.',180,NULL,'COMMON',1,0,'NAME_STYLES','NAME_COLOR','mint','#36e7a5'),
(323,'name_color_green','GREEN','NAME_EFFECT','Sattes Wettbewerbsgrün.',180,NULL,'COMMON',1,0,'NAME_STYLES','NAME_COLOR','green','#24d56b'),
(324,'name_color_violet','VIOLET','NAME_EFFECT','Kräftiges Elite-Violett.',220,NULL,'RARE',1,0,'NAME_STYLES','NAME_COLOR','violet','#8d52ff'),
(325,'name_color_pink','PINK','NAME_EFFECT','Neonpink für auffällige Profile.',220,NULL,'RARE',1,0,'NAME_STYLES','NAME_COLOR','pink','#ff3fa8'),
(326,'name_color_red','RED','NAME_EFFECT','Intensives Rot.',220,NULL,'RARE',1,0,'NAME_STYLES','NAME_COLOR','red','#ff4357'),
(327,'name_color_gold','GOLD','NAME_EFFECT','Premium Gold für Champions.',350,NULL,'EPIC',1,0,'NAME_STYLES','NAME_COLOR','gold','#f5c94a'),
(328,'name_color_orange','ORANGE','NAME_EFFECT','Warm leuchtendes Orange.',220,NULL,'RARE',1,0,'NAME_STYLES','NAME_COLOR','orange','#ff8b2d'),
(329,'name_color_platinum','PLATINUM','NAME_EFFECT','Helles Platinweiß.',300,NULL,'EPIC',1,0,'NAME_STYLES','NAME_COLOR','platinum','#ecf4ff');

-- VM/team-only consumables. Their legacy category remains BUNDLE; shop_group/item_type drive the special logic.
INSERT OR IGNORE INTO shop_items(id,sku,name,category,description,price_coins,asset_key,rarity,active,price_eur_cents,shop_group,item_type,style_key,style_value) VALUES
(340,'team_release_pack_5','5 SPIELER-ENTLASSUNGEN','BUNDLE','Fünf Entlassungs-Credits für den aktiven Kader. Wird aus der Clubkasse bezahlt.',1200,NULL,'RARE',1,0,'TEAM','TEAM_RELEASE_5',NULL,NULL),
(341,'team_transfer_pack_5','5 SPIELER-TRANSFERS','BUNDLE','Fünf Transfer-Credits für neue Verpflichtungen. Offene Vertragsangebote reservieren einen Credit.',1500,NULL,'EPIC',1,0,'TEAM','TEAM_TRANSFER_5',NULL,NULL),
(342,'team_red_card_remove','ROTE KARTE ENTFERNEN','BUNDLE','Ein Credit, um eine rote Karte eines eigenen Clubspielers zu entfernen.',750,NULL,'EPIC',1,0,'TEAM','TEAM_RED_CARD_REMOVE',NULL,NULL);

-- Other premium profile items.
INSERT OR IGNORE INTO shop_items(id,sku,name,category,description,price_coins,asset_key,rarity,active,price_eur_cents,shop_group,item_type,style_key,style_value) VALUES
(350,'other_verified_profile','VERIFIZIERT-Haken','BADGE','Permanenter blauer Verifiziert-Haken für dein EPL Spielerprofil.',2500,NULL,'LEGENDARY',1,0,'OTHER','PROFILE_VERIFIED','verified','verified'),
(351,'other_profile_spotlight','PROFILE SPOTLIGHT','BADGE','Permanenter Premium-Glow für den Kopfbereich deines Spielerprofils.',1800,NULL,'EPIC',1,0,'OTHER','PROFILE_SPOTLIGHT','spotlight','spotlight'),
(352,'other_supporter_badge','EPL SUPPORTER','BADGE','Exklusives Supporter-Badge für dein Profil und deine Badge-Auswahl.',900,NULL,'RARE',1,0,'OTHER','BADGE','supporter','supporter');
