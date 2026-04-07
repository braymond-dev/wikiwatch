from __future__ import annotations

import os
from dataclasses import dataclass
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


@dataclass(frozen=True)
class Settings:
    database_url: str
    stream_url: str
    user_agent: str
    stream_read_timeout_seconds: float
    top_pages_limit: int
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


def normalize_env_string(value: str) -> str:
    return value.strip().strip("\"'")


def normalize_database_url(value: str) -> str:
    normalized = normalize_env_string(value)
    parts = urlsplit(normalized)

    if not parts.query:
        return normalized

    cleaned_query = urlencode(
        [
            (key, normalize_env_string(query_value))
            for key, query_value in parse_qsl(parts.query, keep_blank_values=True)
        ],
        doseq=True,
    )
    return urlunsplit((parts.scheme, parts.netloc, parts.path, cleaned_query, parts.fragment))


def get_settings() -> Settings:
    database_url = normalize_database_url(os.environ["DATABASE_URL"])
    return Settings(
        database_url=database_url,
        stream_url=os.getenv(
            "WIKIMEDIA_STREAM_URL",
            "https://stream.wikimedia.org/v2/stream/recentchange",
        ),
        user_agent=os.getenv(
            "WORKER_USER_AGENT",
            "WikiWatchBot/1.0 (https://wikiwatch.vercel.app; ben.ray.1138@gmail.com)",
        ),
        stream_read_timeout_seconds=float(
            os.getenv("WORKER_STREAM_READ_TIMEOUT_SECONDS", "120")
        ),
        top_pages_limit=int(os.getenv("WORKER_TOP_PAGES_LIMIT", "20")),
        batch_size=int(os.getenv("WORKER_BATCH_SIZE", "100")),
        flush_interval_seconds=float(os.getenv("WORKER_FLUSH_INTERVAL_SECONDS", "5")),
        reconnect_delay_seconds=float(
            os.getenv("WORKER_RECONNECT_DELAY_SECONDS", "3")
        ),
        log_level=os.getenv("WORKER_LOG_LEVEL", "INFO").upper(),
        store_raw_json=parse_bool_env(os.getenv("WORKER_STORE_RAW_JSON"), False),
        raw_edits_retention_days=int(os.getenv("RAW_EDITS_RETENTION_DAYS", "3")),
        retention_check_interval_seconds=float(
            os.getenv("RETENTION_CHECK_INTERVAL_SECONDS", "3600")
        ),
    )
