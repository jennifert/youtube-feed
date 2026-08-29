ALTER TABLE youtube_videos
ADD COLUMN duration_seconds INTEGER;

ALTER TABLE youtube_videos
ADD COLUMN is_short INTEGER NOT NULL DEFAULT 0;