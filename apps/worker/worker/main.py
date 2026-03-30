from __future__ import annotations

import asyncio
import contextlib
import logging
import signal

from .config import get_settings
from .db import Database
from .logging_utils import configure_logging
from .parser import parse_recentchange_event
from .stream import RecentChangeStream

logger = logging.getLogger(__name__)


async def run() -> None:
    settings = get_settings()
    configure_logging(settings.log_level)

    database = Database(
        settings.database_url,
        store_raw_json=settings.store_raw_json,
    )
    await database.connect()

    stream = RecentChangeStream(
        stream_url=settings.stream_url,
        reconnect_delay_seconds=settings.reconnect_delay_seconds,
    )

    stop_event = asyncio.Event()
    loop = asyncio.get_running_loop()

    for signame in ("SIGINT", "SIGTERM"):
        with contextlib.suppress(NotImplementedError):
            loop.add_signal_handler(getattr(signal, signame), stop_event.set)

    batch = []
    last_flush = loop.time()
    last_retention_check = 0.0

    try:
        async for payload in stream.events():
            parsed = parse_recentchange_event(payload)
            if parsed is not None:
                batch.append(parsed)

            now = loop.time()
            should_flush = (
                len(batch) >= settings.batch_size
                or (batch and now - last_flush >= settings.flush_interval_seconds)
            )

            if should_flush:
                await database.insert_batch(batch)
                batch.clear()
                last_flush = now

            should_check_retention = (
                now - last_retention_check >= settings.retention_check_interval_seconds
            )
            if should_check_retention:
                await database.prune_raw_edits(settings.raw_edits_retention_days)
                last_retention_check = now

            if stop_event.is_set():
                break
    finally:
        if batch:
            await database.insert_batch(batch)
        await database.close()


def main() -> None:
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        logger.info("Worker stopped")


if __name__ == "__main__":
    main()
