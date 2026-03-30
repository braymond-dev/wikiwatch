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
    )

