"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { RecentEditRow, SummaryStats, TopPageRow } from "@/lib/types";

type LiveOverviewPayload = {
  summary: SummaryStats;
  recentEdits: RecentEditRow[];
  topPagesToday: TopPageRow[];
};

type LiveOverviewContextValue = {
  data: LiveOverviewPayload | null;
  isLoaded: boolean;
};

const LiveOverviewDataContext = createContext<LiveOverviewContextValue | null>(null);

const MAX_RECENT_EDITS = 40;
export const DEFAULT_LIVE_OVERVIEW_INTERVAL_MS = 5000;

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

type LiveOverviewDataProviderProps = {
  children: React.ReactNode;
  intervalMs?: number;
};

export function LiveOverviewDataProvider({
  children,
  intervalMs = DEFAULT_LIVE_OVERVIEW_INTERVAL_MS,
}: LiveOverviewDataProviderProps) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<LiveOverviewPayload | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
            recentEdits: mergeRecentEdits(
              previous?.recentEdits ?? [],
              payload.data.recentEdits,
            ),
          }));
        }
      } catch {
        return;
      } finally {
        if (!isCancelled) {
          setIsLoaded(true);
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
    <LiveOverviewDataContext.Provider value={{ data, isLoaded }}>
      {children}
    </LiveOverviewDataContext.Provider>
  );
}

export function useLiveOverviewData() {
  return useContext(LiveOverviewDataContext);
}
