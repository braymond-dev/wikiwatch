from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncIterator
from typing import Any

import aiohttp
from aiohttp import client_exceptions

logger = logging.getLogger(__name__)


class RecentChangeStream:
    def __init__(self, stream_url: str, reconnect_delay_seconds: float) -> None:
        self.stream_url = stream_url
        self.reconnect_delay_seconds = reconnect_delay_seconds

    async def events(self) -> AsyncIterator[dict[str, Any]]:
        timeout = aiohttp.ClientTimeout(total=None, sock_connect=30, sock_read=None)
        headers = {"Accept": "text/event-stream", "User-Agent": "WikiWatch/1.0"}

        while True:
            try:
                async with aiohttp.ClientSession(timeout=timeout, headers=headers) as session:
                    logger.info("Connecting to Wikimedia stream: %s", self.stream_url)
                    async with session.get(self.stream_url) as response:
                        response.raise_for_status()
                        async for payload in self._iter_sse_data(response):
                            yield payload
            except asyncio.CancelledError:
                raise
            except (
                asyncio.TimeoutError,
                client_exceptions.ClientConnectionError,
                client_exceptions.ClientPayloadError,
                client_exceptions.ServerDisconnectedError,
            ) as exc:
                logger.warning(
                    "Stream disconnected (%s); reconnecting in %ss",
                    exc.__class__.__name__,
                    self.reconnect_delay_seconds,
                )
                await asyncio.sleep(self.reconnect_delay_seconds)
            except Exception:
                logger.exception("Stream connection failed; reconnecting shortly")
                await asyncio.sleep(self.reconnect_delay_seconds)

    async def _iter_sse_data(
        self, response: aiohttp.ClientResponse
    ) -> AsyncIterator[dict[str, Any]]:
        data_lines: list[str] = []

        while True:
            raw_line = await response.content.readline()
            if not raw_line:
                break
            line = raw_line.decode("utf-8", errors="ignore").strip()

            if not line:
                if data_lines:
                    payload = "\n".join(data_lines)
                    data_lines.clear()
                    try:
                        parsed = json.loads(payload)
                    except json.JSONDecodeError:
                        logger.warning("Skipping malformed JSON event")
                        continue
                    if isinstance(parsed, dict):
                        yield parsed
                continue

            if line.startswith(":"):
                continue
            if line.startswith("data:"):
                data_lines.append(line[5:].lstrip())
