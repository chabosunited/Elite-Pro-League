PRAGMA foreign_keys = ON;

-- v15: profile / club social links and optional admin market-value override.
ALTER TABLE profiles ADD COLUMN tiktok TEXT;
ALTER TABLE profiles ADD COLUMN twitch TEXT;
ALTER TABLE profiles ADD COLUMN market_value_override INTEGER;

ALTER TABLE club_details ADD COLUMN tiktok TEXT;
ALTER TABLE club_details ADD COLUMN twitch TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_market_override ON profiles(market_value_override);
