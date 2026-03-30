from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timezone

from .parser import ParsedEditEvent


@dataclass(slots=True)
class CountRollup:
    total_edits: int = 0
    bot_edits: int = 0
    human_edits: int = 0
    anon_edits: int = 0
    temp_account_edits: int = 0

    def add_event(self, event: ParsedEditEvent) -> None:
        self.total_edits += 1
        self.bot_edits += int(event.is_bot)
        self.human_edits += int(not event.is_bot)
        self.anon_edits += int(event.is_anon)
        self.temp_account_edits += int(event.is_temp_account)


@dataclass(slots=True)
class PageRollup:
    page_id: int | None = None
    edit_count: int = 0
    bot_edits: int = 0
    human_edits: int = 0

    def add_event(self, event: ParsedEditEvent) -> None:
        self.page_id = event.page_id or self.page_id
        self.edit_count += 1
        self.bot_edits += int(event.is_bot)
        self.human_edits += int(not event.is_bot)


def start_of_hour(dt: datetime) -> datetime:
    dt = dt.astimezone(timezone.utc)
    return dt.replace(minute=0, second=0, microsecond=0)


def start_of_day(dt: datetime) -> date:
    return dt.astimezone(timezone.utc).date()


def start_of_week(dt: datetime) -> date:
    current = start_of_day(dt)
    return current.fromordinal(current.toordinal() - current.weekday())


def start_of_month(dt: datetime) -> date:
    current = start_of_day(dt)
    return current.replace(day=1)


def start_of_year(dt: datetime) -> date:
    current = start_of_day(dt)
    return current.replace(month=1, day=1)


def build_rollups(events: list[ParsedEditEvent]) -> dict[str, list[tuple]]:
    hourly: dict[tuple[datetime, str], CountRollup] = defaultdict(CountRollup)
    daily: dict[tuple[date, str], CountRollup] = defaultdict(CountRollup)
    page_daily: dict[tuple[date, str, str], PageRollup] = defaultdict(PageRollup)
    page_weekly: dict[tuple[date, str, str], PageRollup] = defaultdict(PageRollup)
    page_monthly: dict[tuple[date, str, str], PageRollup] = defaultdict(PageRollup)
    page_yearly: dict[tuple[date, str, str], PageRollup] = defaultdict(PageRollup)

    for event in events:
        hour_key = (start_of_hour(event.event_time), event.wiki)
        day_key = (start_of_day(event.event_time), event.wiki)
        hourly[hour_key].add_event(event)
        daily[day_key].add_event(event)

        daily_page_key = (start_of_day(event.event_time), event.wiki, event.page_title)
        weekly_page_key = (start_of_week(event.event_time), event.wiki, event.page_title)
        monthly_page_key = (
            start_of_month(event.event_time),
            event.wiki,
            event.page_title,
        )
        yearly_page_key = (start_of_year(event.event_time), event.wiki, event.page_title)

        page_daily[daily_page_key].add_event(event)
        page_weekly[weekly_page_key].add_event(event)
        page_monthly[monthly_page_key].add_event(event)
        page_yearly[yearly_page_key].add_event(event)

    return {
        "hourly": [
            (
                bucket_start,
                wiki,
                data.total_edits,
                data.bot_edits,
                data.human_edits,
                data.anon_edits,
                data.temp_account_edits,
            )
            for (bucket_start, wiki), data in hourly.items()
        ],
        "daily": [
            (
                bucket_date,
                wiki,
                data.total_edits,
                data.bot_edits,
                data.human_edits,
                data.anon_edits,
                data.temp_account_edits,
            )
            for (bucket_date, wiki), data in daily.items()
        ],
        "page_daily": [
            (period_start, wiki, page_title, data.page_id, data.edit_count, data.bot_edits, data.human_edits)
            for (period_start, wiki, page_title), data in page_daily.items()
        ],
        "page_weekly": [
            (period_start, wiki, page_title, data.page_id, data.edit_count, data.bot_edits, data.human_edits)
            for (period_start, wiki, page_title), data in page_weekly.items()
        ],
        "page_monthly": [
            (period_start, wiki, page_title, data.page_id, data.edit_count, data.bot_edits, data.human_edits)
            for (period_start, wiki, page_title), data in page_monthly.items()
        ],
        "page_yearly": [
            (period_start, wiki, page_title, data.page_id, data.edit_count, data.bot_edits, data.human_edits)
            for (period_start, wiki, page_title), data in page_yearly.items()
        ],
    }
