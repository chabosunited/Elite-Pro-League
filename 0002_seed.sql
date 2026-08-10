INSERT OR IGNORE INTO seasons(id,name,status,starts_at,ends_at)
VALUES (1,'Saison 2026','ACTIVE','2026-05-01','2026-09-30');

INSERT OR IGNORE INTO divisions(id,season_id,name,level,max_clubs)
VALUES (1,1,'EPL Division 1',1,16);

INSERT OR IGNORE INTO shop_items(id,sku,name,category,description,price_coins,asset_key,rarity,active) VALUES
(1,'frame_neon_blue','NEON BLUE','AVATAR_FRAME','Elektrischer blauer Profilbildrahmen.',750,'shop/frame-neon-blue.svg','EPIC',1),
(2,'cover_elite_gold','ELITE GOLD','COVER_FRAME','Goldener Titelbildrahmen für Elite-Spieler.',1250,'shop/cover-elite-gold.svg','LEGENDARY',1),
(3,'name_lightning','LIGHTNING','NAME_EFFECT','Animierter Blitz-Namenseffekt.',1000,'shop/name-lightning.svg','EPIC',1),
(4,'badge_epl_champion','EPL CHAMPION','BADGE','Champion Badge für dein Profil.',1500,'shop/badge-champion.svg','LEGENDARY',1);
