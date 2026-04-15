"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { StatCard } from "@/components/StatCard";
import type { SummaryStats } from "@/lib/types";

type HeroStatsPayload = {
  summary: SummaryStats;
};

type HeroStatsProps = {
  intervalMs?: number;
};

const EMPTY_SUMMARY: SummaryStats = {
  editsToday: 0,
  editsThisWeek: 0,
  activeWikisToday: 0,
  botShareToday: 0,
};

export function HeroStats({ intervalMs = 5000 }: HeroStatsProps) {
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState<SummaryStats>(EMPTY_SUMMARY);
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

  const scopeLabel = searchParams.get("wiki") || "All public wikis";

  useEffect(() => {
    let isCancelled = false;

    async function refresh() {
      try {
        const response = await fetch(
          `/api/live-overview${queryString ? `?${queryString}` : ""}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { data: HeroStatsPayload };
        if (!isCancelled) {
          setSummary(payload.data.summary);
        }
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

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [intervalMs, queryString]);

  return (
    <div className="hero-stats-wrap">
      <div className="hero-stats-grid">
        <StatCard
          label="Edits Today"
          sublabel={scopeLabel}
          value={summary.editsToday.toLocaleString()}
          tone="mint"
          compact
        />
        <StatCard
          label="Edits This Week"
          sublabel={scopeLabel}
          value={summary.editsThisWeek.toLocaleString()}
          tone="blue"
          compact
        />
        <StatCard
          label="Active Wikis Today"
          sublabel={scopeLabel}
          value={summary.activeWikisToday.toLocaleString()}
          tone="amber"
          compact
        />
        <StatCard
          label="Bot Share Today"
          sublabel={scopeLabel}
          value={`${summary.botShareToday}%`}
          tone="blue"
          compact
        />
      </div>
      <div className="muted hero-stats-note">
        {isLoaded ? "Quick stats refresh every 5 seconds." : "Loading quick stats..."}
      </div>
    </div>
  );
}
