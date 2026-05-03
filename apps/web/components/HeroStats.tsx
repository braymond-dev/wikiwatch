"use client";

import { useSearchParams } from "next/navigation";

import { useLiveOverviewData } from "@/components/LiveOverviewDataProvider";
import { StatCard } from "@/components/StatCard";
import type { SummaryStats } from "@/lib/types";

const EMPTY_SUMMARY: SummaryStats = {
  editsToday: 0,
  editsThisWeek: 0,
  activeWikisToday: 0,
  botShareToday: 0,
};

export function HeroStats() {
  const searchParams = useSearchParams();
  const liveOverview = useLiveOverviewData();

  const scopeLabel = searchParams.get("wiki") || "All public wikis";
  const summary = liveOverview?.data?.summary ?? EMPTY_SUMMARY;
  const isLoaded = liveOverview?.isLoaded ?? false;

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
