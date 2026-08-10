PRAGMA foreign_keys = ON;

-- Presence + equipped cosmetics on player profiles.
ALTER TABLE profiles ADD COLUMN last_seen_at TEXT;
ALTER TABLE profiles ADD COLUMN equipped_avatar_frame_id INTEGER;
ALTER TABLE profiles ADD COLUMN equipped_cover_frame_id INTEGER;
ALTER TABLE profiles ADD COLUMN equipped_name_effect_id INTEGER;

-- Threaded comments and reactions.
ALTER TABLE comments ADD COLUMN parent_comment_id INTEGER;

CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(comment_id,user_id)
);

CREATE TABLE IF NOT EXISTS post_reactions (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK(reaction IN ('LIKE','FIRE','CLAP','GOAL')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(post_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id,reaction);
CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON comments(post_id,parent_comment_id,created_at);

-- Backfill the old heart-like table into the new reaction model.
INSERT OR IGNORE INTO post_reactions(post_id,user_id,reaction,created_at)
SELECT post_id,user_id,'LIKE',created_at FROM post_likes;

-- Club identity for social interactions. A manager/VM acts on behalf of the club;
-- user_id remains the audit trail for who performed the action.
ALTER TABLE comments ADD COLUMN actor_club_id INTEGER;

CREATE TABLE IF NOT EXISTS club_post_reactions (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK(reaction IN ('LIKE','FIRE','CLAP','GOAL')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(post_id,club_id)
);
CREATE INDEX IF NOT EXISTS idx_club_post_reactions_post ON club_post_reactions(post_id,reaction);
