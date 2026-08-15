PRAGMA foreign_keys = ON;

-- EPL v16: first animated avatar-frame shop item.
-- The legacy category remains AVATAR_FRAME to satisfy the original CHECK constraint.
INSERT OR IGNORE INTO shop_items(id,sku,name,category,description,price_coins,asset_key,rarity,active,price_eur_cents,shop_group,item_type,style_key,style_value) VALUES
(360,'animated_frame_epl_storm','EPL STORM FRAME','AVATAR_FRAME','Premium EPL Profilbildrahmen mit elektrischem Motion-/Glow-Look. Unterstützt animierte GIF/APNG/WebP Assets auf Desktop und Mobile.',2200,'/assets/shop/animated/epl-storm-frame.png','LEGENDARY',1,799,'ANIMATED_FRAME','ANIMATED_AVATAR_FRAME','epl-storm','animated');
