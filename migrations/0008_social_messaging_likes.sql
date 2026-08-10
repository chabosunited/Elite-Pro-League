PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profile_likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(user_id,target_user_id),
  CHECK(user_id <> target_user_id)
);
CREATE INDEX IF NOT EXISTS idx_profile_likes_target ON profile_likes(target_user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS club_likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(user_id,club_id)
);
CREATE INDEX IF NOT EXISTS idx_club_likes_target ON club_likes(club_id,created_at DESC);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_a,user_b),
  CHECK(user_a < user_b)
);
CREATE INDEX IF NOT EXISTS idx_conversations_a ON conversations(user_a,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_b ON conversations(user_b,updated_at DESC);

CREATE TABLE IF NOT EXISTS direct_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(conversation_id,id DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages(conversation_id,read_at,sender_user_id);

CREATE TABLE IF NOT EXISTS news_reactions (
  news_id INTEGER NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK(reaction IN ('LIKE','FIRE','CLAP','GOAL')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(news_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_news_reactions_news ON news_reactions(news_id,reaction);

CREATE TABLE IF NOT EXISTS news_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  news_id INTEGER NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  parent_comment_id INTEGER REFERENCES news_comments(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_news_comments_news ON news_comments(news_id,created_at);
CREATE INDEX IF NOT EXISTS idx_news_comments_parent ON news_comments(parent_comment_id);

CREATE TABLE IF NOT EXISTS news_comment_likes (
  comment_id INTEGER NOT NULL REFERENCES news_comments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(comment_id,user_id)
);

-- Normalize the legacy title-frame item to the real shop title-frame asset.
UPDATE shop_items
SET asset_key='/assets/user/shop/titelbildrahmen1.png',
    description='EPL Titelbildrahmen aus dem aktuellen Shop-Asset-Set.'
WHERE id=2 AND category='COVER_FRAME';

-- Re-assert the correct 512x512 legacy avatar frame as well, so v5 is safe even if the older 0007 import was skipped.
UPDATE shop_items
SET asset_key='/assets/user/shop/Profibildrahmen1.png',
    description='Elektrischer blauer 512×512 EPL Profilbildrahmen.'
WHERE id=1 AND category='AVATAR_FRAME';
