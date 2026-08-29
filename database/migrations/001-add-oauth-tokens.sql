CREATE TABLE oauth_tokens (
  provider TEXT PRIMARY KEY,
  access_token TEXT,
  refresh_token TEXT,
  scope TEXT,
  token_type TEXT,
  expiry_date INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);