SELECT COUNT(*) AS raw_edit_rows FROM raw_edits;
SELECT COUNT(*) AS hourly_rollup_rows FROM edit_counts_hourly;
SELECT COUNT(*) AS daily_rollup_rows FROM edit_counts_daily;
SELECT COUNT(*) AS current_page_daily_rows FROM current_page_counts_daily;
SELECT COUNT(*) AS current_page_weekly_rows FROM current_page_counts_weekly;
SELECT COUNT(*) AS current_page_monthly_rows FROM current_page_counts_monthly;
SELECT COUNT(*) AS current_page_yearly_rows FROM current_page_counts_yearly;
SELECT COUNT(*) AS top_pages_daily_rows FROM top_pages_daily;
SELECT COUNT(*) AS top_pages_weekly_rows FROM top_pages_weekly;
SELECT COUNT(*) AS top_pages_monthly_rows FROM top_pages_monthly;
SELECT COUNT(*) AS top_pages_yearly_rows FROM top_pages_yearly;

SELECT event_time, wiki, page_title, user_name, is_bot
FROM raw_edits
ORDER BY event_time DESC
LIMIT 20;

SELECT bucket_start, wiki, total_edits, bot_edits, human_edits
FROM edit_counts_hourly
ORDER BY bucket_start DESC
LIMIT 20;

SELECT period_start, wiki, rank, page_title, edit_count, human_edits, bot_edits
FROM top_pages_daily
ORDER BY period_start DESC, wiki ASC, rank ASC
LIMIT 20;
