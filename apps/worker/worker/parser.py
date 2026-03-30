from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any


@dataclass(slots=True)
class ParsedEditEvent:
    event_time: datetime
    wiki: str
    page_title: str
    page_id: int | None
    user_name: str | None
    is_bot: bool
    is_anon: bool
    is_temp_account: bool
    namespace: int | None
    change_type: str
    server_name: str | None
    comment: str | None
    raw_json: dict[str, Any]


def parse_recentchange_event(payload: dict[str, Any]) -> ParsedEditEvent | None:
    change_type = str(payload.get("type") or "").strip()
    if change_type != "edit":
        return None

    page_title = payload.get("title")
    wiki = payload.get("wiki")
    if not page_title or not wiki:
        return None

    meta = payload.get("meta") or {}
    event_time_raw = meta.get("dt")
    if event_time_raw:
        event_time = datetime.fromisoformat(event_time_raw.replace("Z", "+00:00"))
    else:
        timestamp = payload.get("timestamp")
        if timestamp is None:
            return None
        event_time = datetime.fromtimestamp(int(timestamp), tz=timezone.utc)

    bot_flag = bool(payload.get("bot", False))
    user_name = payload.get("user")
    is_anon = bool(payload.get("anon", False)) or (user_name is None)
    is_temp_account = bool(user_name) and str(user_name).startswith("~")

    page_id = payload.get("page_id")
    namespace = payload.get("namespace")

    return ParsedEditEvent(
        event_time=event_time,
        wiki=str(wiki),
        page_title=str(page_title),
        page_id=int(page_id) if page_id is not None else None,
        user_name=str(user_name) if user_name is not None else None,
        is_bot=bot_flag,
        is_anon=is_anon,
        is_temp_account=is_temp_account,
        namespace=int(namespace) if namespace is not None else None,
        change_type=change_type,
        server_name=payload.get("server_name"),
        comment=payload.get("comment"),
        raw_json=payload,
    )
