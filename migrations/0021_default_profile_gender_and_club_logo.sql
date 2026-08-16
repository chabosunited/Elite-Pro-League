ALTER TABLE profiles ADD COLUMN gender TEXT NOT NULL DEFAULT 'MALE';
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);

UPDATE profiles
SET gender='MALE'
WHERE gender IS NULL OR trim(gender)='';

UPDATE profiles
SET avatar_key=NULL,
    updated_at=datetime('now')
WHERE avatar_key IN ('/assets/user/standardprofilbild.png','standardprofilbild.png');

UPDATE clubs
SET logo_key='/assets/user/standardprofilbildclub.png',
    updated_at=datetime('now')
WHERE logo_key IS NULL
   OR trim(COALESCE(logo_key,''))=''
   OR logo_key IN ('/assets/user/EPLTrophy.png','EPLTrophy.png','/assets/user/standardprofilbild.png','standardprofilbild.png');
