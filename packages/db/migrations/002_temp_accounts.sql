ALTER TABLE raw_edits
  ADD COLUMN IF NOT EXISTS is_temp_account BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE edit_counts_hourly
  ADD COLUMN IF NOT EXISTS temp_account_edits INTEGER NOT NULL DEFAULT 0;

ALTER TABLE edit_counts_daily
  ADD COLUMN IF NOT EXISTS temp_account_edits INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_raw_edits_is_temp_account
  ON raw_edits (is_temp_account, event_time DESC);

UPDATE raw_edits
SET is_temp_account = (user_name LIKE '~%')
WHERE is_temp_account IS DISTINCT FROM (user_name LIKE '~%');

WITH hourly_temp_counts AS (
  SELECT
    date_trunc('hour', event_time) AS bucket_start,
    wiki,
    COUNT(*) FILTER (WHERE is_temp_account)::int AS temp_account_edits
  FROM raw_edits
  GROUP BY 1, 2
)
UPDATE edit_counts_hourly AS target
SET temp_account_edits = source.temp_account_edits
FROM hourly_temp_counts AS source
WHERE target.bucket_start = source.bucket_start
  AND target.wiki = source.wiki;

WITH daily_temp_counts AS (
  SELECT
    event_time::date AS bucket_date,
    wiki,
    COUNT(*) FILTER (WHERE is_temp_account)::int AS temp_account_edits
  FROM raw_edits
  GROUP BY 1, 2
)
UPDATE edit_counts_daily AS target
SET temp_account_edits = source.temp_account_edits
FROM daily_temp_counts AS source
WHERE target.bucket_date = source.bucket_date
  AND target.wiki = source.wiki;
