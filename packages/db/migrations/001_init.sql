CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS raw_edits (
  id BIGSERIAL PRIMARY KEY,
  event_time TIMESTAMPTZ NOT NULL,
  wiki TEXT NOT NULL,
  page_title TEXT NOT NULL,
  page_id BIGINT,
  user_name TEXT,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  is_anon BOOLEAN NOT NULL DEFAULT FALSE,
  namespace INT,
  change_type TEXT NOT NULL,
  server_name TEXT,
  comment TEXT,
  raw_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS edit_counts_hourly (
  bucket_start TIMESTAMPTZ NOT NULL,
  wiki TEXT NOT NULL,
  total_edits INTEGER NOT NULL DEFAULT 0,
  bot_edits INTEGER NOT NULL DEFAULT 0,
  human_edits INTEGER NOT NULL DEFAULT 0,
  anon_edits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_start, wiki)
);

CREATE TABLE IF NOT EXISTS edit_counts_daily (
  bucket_date DATE NOT NULL,
  wiki TEXT NOT NULL,
  total_edits INTEGER NOT NULL DEFAULT 0,
  bot_edits INTEGER NOT NULL DEFAULT 0,
  human_edits INTEGER NOT NULL DEFAULT 0,
  anon_edits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_date, wiki)
);

CREATE TABLE IF NOT EXISTS page_edit_counts_daily (
  period_start DATE NOT NULL,
  wiki TEXT NOT NULL,
  page_title TEXT NOT NULL,
  page_id BIGINT,
  edit_count INTEGER NOT NULL DEFAULT 0,
  bot_edits INTEGER NOT NULL DEFAULT 0,
  human_edits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (period_start, wiki, page_title)
);

CREATE TABLE IF NOT EXISTS page_edit_counts_weekly (
  period_start DATE NOT NULL,
  wiki TEXT NOT NULL,
  page_title TEXT NOT NULL,
  page_id BIGINT,
  edit_count INTEGER NOT NULL DEFAULT 0,
  bot_edits INTEGER NOT NULL DEFAULT 0,
  human_edits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (period_start, wiki, page_title)
);

CREATE TABLE IF NOT EXISTS page_edit_counts_monthly (
  period_start DATE NOT NULL,
  wiki TEXT NOT NULL,
  page_title TEXT NOT NULL,
  page_id BIGINT,
  edit_count INTEGER NOT NULL DEFAULT 0,
  bot_edits INTEGER NOT NULL DEFAULT 0,
  human_edits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (period_start, wiki, page_title)
);

CREATE TABLE IF NOT EXISTS page_edit_counts_yearly (
  period_start DATE NOT NULL,
  wiki TEXT NOT NULL,
  page_title TEXT NOT NULL,
  page_id BIGINT,
  edit_count INTEGER NOT NULL DEFAULT 0,
  bot_edits INTEGER NOT NULL DEFAULT 0,
  human_edits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (period_start, wiki, page_title)
);

CREATE INDEX IF NOT EXISTS idx_raw_edits_event_time ON raw_edits (event_time DESC);
CREATE INDEX IF NOT EXISTS idx_raw_edits_wiki_event_time ON raw_edits (wiki, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_raw_edits_page_time ON raw_edits (page_title, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_raw_edits_is_bot ON raw_edits (is_bot, event_time DESC);

CREATE INDEX IF NOT EXISTS idx_edit_counts_hourly_wiki_bucket ON edit_counts_hourly (wiki, bucket_start DESC);
CREATE INDEX IF NOT EXISTS idx_edit_counts_daily_wiki_bucket ON edit_counts_daily (wiki, bucket_date DESC);

CREATE INDEX IF NOT EXISTS idx_page_edit_counts_daily_lookup
  ON page_edit_counts_daily (wiki, period_start DESC, edit_count DESC);
CREATE INDEX IF NOT EXISTS idx_page_edit_counts_weekly_lookup
  ON page_edit_counts_weekly (wiki, period_start DESC, edit_count DESC);
CREATE INDEX IF NOT EXISTS idx_page_edit_counts_monthly_lookup
  ON page_edit_counts_monthly (wiki, period_start DESC, edit_count DESC);
CREATE INDEX IF NOT EXISTS idx_page_edit_counts_yearly_lookup
  ON page_edit_counts_yearly (wiki, period_start DESC, edit_count DESC);

