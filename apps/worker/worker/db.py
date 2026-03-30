from __future__ import annotations

import json
import logging

import asyncpg

from .aggregator import build_rollups
from .parser import ParsedEditEvent

logger = logging.getLogger(__name__)


RAW_INSERT_SQL = """
INSERT INTO raw_edits (
  event_time, wiki, page_title, page_id, user_name, is_bot, is_anon,
  namespace, change_type, server_name, comment, raw_json
)
SELECT
  x.event_time, x.wiki, x.page_title, x.page_id, x.user_name, x.is_bot, x.is_anon,
  x.namespace, x.change_type, x.server_name, x.comment, x.raw_json
FROM UNNEST(
  $1::timestamptz[],
  $2::text[],
  $3::text[],
  $4::bigint[],
  $5::text[],
  $6::boolean[],
  $7::boolean[],
  $8::int[],
  $9::text[],
  $10::text[],
  $11::text[],
  $12::jsonb[]
) AS x(
  event_time, wiki, page_title, page_id, user_name, is_bot, is_anon,
  namespace, change_type, server_name, comment, raw_json
)
"""

UPSERT_HOURLY_SQL = """
INSERT INTO edit_counts_hourly (
  bucket_start, wiki, total_edits, bot_edits, human_edits, anon_edits
)
SELECT * FROM UNNEST(
  $1::timestamptz[],
  $2::text[],
  $3::int[],
  $4::int[],
  $5::int[],
  $6::int[]
)
ON CONFLICT (bucket_start, wiki) DO UPDATE
SET total_edits = edit_counts_hourly.total_edits + EXCLUDED.total_edits,
    bot_edits = edit_counts_hourly.bot_edits + EXCLUDED.bot_edits,
    human_edits = edit_counts_hourly.human_edits + EXCLUDED.human_edits,
    anon_edits = edit_counts_hourly.anon_edits + EXCLUDED.anon_edits
"""

UPSERT_DAILY_SQL = """
INSERT INTO edit_counts_daily (
  bucket_date, wiki, total_edits, bot_edits, human_edits, anon_edits
)
SELECT * FROM UNNEST(
  $1::date[],
  $2::text[],
  $3::int[],
  $4::int[],
  $5::int[],
  $6::int[]
)
ON CONFLICT (bucket_date, wiki) DO UPDATE
SET total_edits = edit_counts_daily.total_edits + EXCLUDED.total_edits,
    bot_edits = edit_counts_daily.bot_edits + EXCLUDED.bot_edits,
    human_edits = edit_counts_daily.human_edits + EXCLUDED.human_edits,
    anon_edits = edit_counts_daily.anon_edits + EXCLUDED.anon_edits
"""

UPSERT_PAGE_SQL = """
INSERT INTO {table_name} (
  period_start, wiki, page_title, page_id, edit_count, bot_edits, human_edits
)
SELECT * FROM UNNEST(
  $1::date[],
  $2::text[],
  $3::text[],
  $4::bigint[],
  $5::int[],
  $6::int[],
  $7::int[]
)
ON CONFLICT (period_start, wiki, page_title) DO UPDATE
SET page_id = COALESCE(EXCLUDED.page_id, {table_name}.page_id),
    edit_count = {table_name}.edit_count + EXCLUDED.edit_count,
    bot_edits = {table_name}.bot_edits + EXCLUDED.bot_edits,
    human_edits = {table_name}.human_edits + EXCLUDED.human_edits
"""


class Database:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url
        self.pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        self.pool = await asyncpg.create_pool(self.database_url, min_size=1, max_size=10)
        logger.info("Connected to Postgres")

    async def close(self) -> None:
        if self.pool:
            await self.pool.close()
            logger.info("Closed Postgres pool")

    async def insert_batch(self, events: list[ParsedEditEvent]) -> None:
        if not events:
            return
        if not self.pool:
            raise RuntimeError("Database pool is not connected")

        rollups = build_rollups(events)

        async with self.pool.acquire() as connection:
            async with connection.transaction():
                await connection.execute(
                    RAW_INSERT_SQL,
                    [event.event_time for event in events],
                    [event.wiki for event in events],
                    [event.page_title for event in events],
                    [event.page_id for event in events],
                    [event.user_name for event in events],
                    [event.is_bot for event in events],
                    [event.is_anon for event in events],
                    [event.namespace for event in events],
                    [event.change_type for event in events],
                    [event.server_name for event in events],
                    [event.comment for event in events],
                    [json.dumps(event.raw_json) for event in events],
                )
                await self._upsert_count_rollups(connection, UPSERT_HOURLY_SQL, rollups["hourly"])
                await self._upsert_count_rollups(connection, UPSERT_DAILY_SQL, rollups["daily"])
                await self._upsert_page_rollups(connection, "page_edit_counts_daily", rollups["page_daily"])
                await self._upsert_page_rollups(connection, "page_edit_counts_weekly", rollups["page_weekly"])
                await self._upsert_page_rollups(connection, "page_edit_counts_monthly", rollups["page_monthly"])
                await self._upsert_page_rollups(connection, "page_edit_counts_yearly", rollups["page_yearly"])

        logger.info("Inserted batch of %s events", len(events))

    async def _upsert_count_rollups(
        self,
        connection: asyncpg.Connection,
        sql: str,
        rows: list[tuple],
    ) -> None:
        if not rows:
            return
        columns = list(zip(*rows))
        await connection.execute(sql, *columns)

    async def _upsert_page_rollups(
        self,
        connection: asyncpg.Connection,
        table_name: str,
        rows: list[tuple],
    ) -> None:
        if not rows:
            return
        columns = list(zip(*rows))
        await connection.execute(UPSERT_PAGE_SQL.format(table_name=table_name), *columns)
