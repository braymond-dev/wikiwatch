from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str
    stream_url: str
    batch_size: int
    flush_interval_seconds: float
    reconnect_delay_seconds: float
    log_level: str
    store_raw_json: bool
    raw_edits_retention_days: int
    retention_check_interval_seconds: float


def parse_bool_env(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def get_settings() -> Settings:
    database_url = os.environ["DATABASE_URL"]
    return Settings(
        database_url=database_url,
        stream_url=os.getenv(
            "WIKIMEDIA_STREAM_URL",
            "https://stream.wikimedia.org/v2/stream/recentchange",
        ),
        batch_size=int(os.getenv("WORKER_BATCH_SIZE", "100")),
        flush_interval_seconds=float(os.getenv("WORKER_FLUSH_INTERVAL_SECONDS", "5")),
        reconnect_delay_seconds=float(
            os.getenv("WORKER_RECONNECT_DELAY_SECONDS", "3")
        ),
        log_level=os.getenv("WORKER_LOG_LEVEL", "INFO").upper(),
        store_raw_json=parse_bool_env(os.getenv("WORKER_STORE_RAW_JSON"), True),
        raw_edits_retention_days=int(os.getenv("RAW_EDITS_RETENTION_DAYS", "32")),
        retention_check_interval_seconds=float(
            os.getenv("RETENTION_CHECK_INTERVAL_SECONDS", "3600")
        ),
    )
