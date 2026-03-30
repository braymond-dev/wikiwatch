"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { LeaderboardTable } from "@/components/LeaderboardTable";
import { RecentEditsTable } from "@/components/RecentEditsTable";
import { StatCard } from "@/components/StatCard";
import { RecentEditRow, SummaryStats, TopPageRow } from "@/lib/types";

type LiveOverviewPayload = {
  summary: SummaryStats;
  recentEdits: RecentEditRow[];
  topPagesToday: TopPageRow[];
};

const MAX_RECENT_EDITS = 40;

function mergeRecentEdits(
  previousRows: RecentEditRow[],
  incomingRows: RecentEditRow[],
): RecentEditRow[] {
  const byId = new Map<number, RecentEditRow>();

  for (const row of incomingRows) {
    byId.set(row.id, row);
  }

  for (const row of previousRows) {
    if (!byId.has(row.id)) {
      byId.set(row.id, row);
    }
  }

  return Array.from(byId.values())
    .sort((left, right) => right.id - left.id)
    .slice(0, MAX_RECENT_EDITS);
}

type LiveOverviewProps = {
  initialSummary: SummaryStats;
  initialRecentEdits: RecentEditRow[];
  initialTopPagesToday: TopPageRow[];
  intervalMs?: number;
};

export function LiveOverview({
  initialSummary,
  initialRecentEdits,
  initialTopPagesToday,
  intervalMs = 5000,
}: LiveOverviewProps) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<LiveOverviewPayload>({
    summary: initialSummary,
    recentEdits: initialRecentEdits,
    topPagesToday: initialTopPagesToday,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    const wiki = searchParams.get("wiki");
    const includeBots = searchParams.get("includeBots");
    if (wiki) {
      params.set("wiki", wiki);
    }
    if (includeBots) {
      params.set("includeBots", includeBots);
    }
    return params.toString();
  }, [searchParams]);

  useEffect(() => {
    let isCancelled = false;

    async function refresh() {
      if (document.visibilityState !== "visible") {
        return;
      }

      setIsRefreshing(true);
      try {
        const response = await fetch(
          `/api/live-overview${queryString ? `?${queryString}` : ""}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { data: LiveOverviewPayload };
        if (!isCancelled) {
          setData((previous) => ({
            summary: payload.data.summary,
            topPagesToday: payload.data.topPagesToday,
            recentEdits: mergeRecentEdits(previous.recentEdits, payload.data.recentEdits),
          }));
        }
      } finally {
        if (!isCancelled) {
          setIsRefreshing(false);
        }
      }
    }

    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, intervalMs);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs, queryString]);

  return (
    <>
      <section style={{ display: "grid", gap: 16, marginBottom: 24 }}>
        <div className="stats-grid">
          <StatCard
            label="Edits Today"
            value={data.summary.editsToday.toLocaleString()}
            tone="mint"
          />
          <StatCard
            label="Edits This Week"
            value={data.summary.editsThisWeek.toLocaleString()}
            tone="blue"
          />
          <StatCard
            label="Active Wikis Today"
            value={data.summary.activeWikisToday.toLocaleString()}
            tone="amber"
          />
          <StatCard
            label="Bot Share Today"
            value={`${data.summary.botShareToday}%`}
            tone="blue"
          />
        </div>
        <div className="muted" style={{ fontSize: 13 }}>
          {isRefreshing ? "Refreshing quick stats..." : "Quick stats refresh every 5 seconds."}
        </div>
      </section>

      <RecentEditsTable rows={data.recentEdits} />

      <section style={{ marginTop: 24 }}>
        <LeaderboardTable
          title="Top Pages Today"
          subtitle="Most edited pages in the current UTC day, refreshed every few seconds."
          rows={data.topPagesToday}
        />
      </section>
    </>
  );
}
