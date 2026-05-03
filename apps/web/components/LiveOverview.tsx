"use client";

import { LeaderboardTable } from "@/components/LeaderboardTable";
import { useLiveOverviewData } from "@/components/LiveOverviewDataProvider";
import { RecentEditsTable } from "@/components/RecentEditsTable";
import type { RecentEditRow, TopPageRow } from "@/lib/types";

type LiveOverviewProps = {
  initialRecentEdits: RecentEditRow[];
  initialTopPagesToday: TopPageRow[];
  showTopPagesToday?: boolean;
};

export function LiveOverview({
  initialRecentEdits,
  initialTopPagesToday,
  showTopPagesToday = true,
}: LiveOverviewProps) {
  const liveOverview = useLiveOverviewData();
  const recentEdits = liveOverview?.data?.recentEdits ?? initialRecentEdits;
  const topPagesToday = liveOverview?.data?.topPagesToday ?? initialTopPagesToday;

  return (
    <>
      <RecentEditsTable rows={recentEdits} />

      {showTopPagesToday ? (
        <section style={{ marginTop: 24 }}>
          <LeaderboardTable
            title="Top Pages Today"
            subtitle="Most edited pages in the current UTC day, refreshed every few seconds."
            rows={topPagesToday}
          />
        </section>
      ) : null}
    </>
  );
}
