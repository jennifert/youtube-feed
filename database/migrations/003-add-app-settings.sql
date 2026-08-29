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