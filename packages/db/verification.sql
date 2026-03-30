SELECT COUNT(*) AS raw_edit_rows FROM raw_edits;
SELECT COUNT(*) AS hourly_rollup_rows FROM edit_counts_hourly;
SELECT COUNT(*) AS daily_rollup_rows FROM edit_counts_daily;

SELECT event_time, wiki, page_title, user_name, is_bot
FROM raw_edits
ORDER BY event_time DESC
LIMIT 20;

SELECT bucket_start, wiki, total_edits, bot_edits, human_edits
FROM edit_counts_hourly
ORDER BY bucket_start DESC
LIMIT 20;
