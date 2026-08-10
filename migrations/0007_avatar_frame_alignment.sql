-- EPL v4.1: repair legacy avatar-frame asset and normalize equipped profile frames
-- Existing shop item 1 referenced an old 1536x1024 asset. All profile frames now use 512x512 assets.
UPDATE shop_items
SET asset_key='/assets/user/shop/Profibildrahmen1.png',
    description='Elektrischer blauer 512×512 EPL Profilbildrahmen.'
WHERE id=1 AND category='AVATAR_FRAME';
