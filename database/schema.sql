CREATE TABLE IF NOT EXISTS youtube_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  category TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS youtube_videos (
  video_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  title TEXT NOT NULL,
  published_at TEXT NOT NULL,
  thumbnail_url TEXT,
  url TEXT NOT NULL,
  duration_seconds INTEGER,
  is_short INTEGER NOT NULL DEFAULT 0,
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (channel_id)
    REFERENCES youtube_channels(channel_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_youtube_videos_published_at
ON youtube_videos(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_youtube_videos_channel_id
ON youtube_videos(channel_id);

CREATE TABLE IF NOT EXISTS oauth_tokens (
  provider TEXT PRIMARY KEY,
  access_token TEXT,
  refresh_token TEXT,
  scope TEXT,
  token_type TEXT,
  expiry_date INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    feed_size INTEGER NOT NULL DEFAULT 50,
    default_view TEXT NOT NULL DEFAULT 'all',
    shorts_behavior TEXT NOT NULL DEFAULT 'include',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO app_settings (
    id,
    feed_size,
    default_view,
    shorts_behavior
)
VALUES (
    1,
    50,
    'all',
    'include'
);