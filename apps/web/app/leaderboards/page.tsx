import { LeaderboardTable } from "@/components/LeaderboardTable";
import { getTopPages } from "@/lib/queries";
import { buildFilters } from "@/lib/utils";

type LeaderboardsPageProps = {
  searchParams?: Promise<{
    wiki?: string;
    includeBots?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function LeaderboardsPage({
  searchParams,
}: LeaderboardsPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = buildFilters(resolvedSearchParams);

  const [
    topPagesToday,
    topPagesWeek,
    topPagesMonth,
    topPagesYear,
    topPagesAllTime,
  ] = await Promise.all([
    getTopPages("day", filters, 12),
    getTopPages("week", filters, 12),
    getTopPages("month", filters, 12),
    getTopPages("year", filters, 12),
    getTopPages("all", filters, 12),
  ]);

  return (
    <>
      <section className="two-col-equal">
        <LeaderboardTable
          title="Top Pages Today"
          subtitle="Current UTC day leaders across the selected wiki scope."
          rows={topPagesToday}
        />
        <LeaderboardTable
          title="Top Pages This Week"
          subtitle="Current week leaderboard using rollup aggregates."
          rows={topPagesWeek}
        />
        <LeaderboardTable
          title="Top Pages This Month"
          subtitle="Month-to-date leaders across the selected wiki scope."
          rows={topPagesMonth}
        />
        <LeaderboardTable
          title="Top Pages This Year"
          subtitle="Year-to-date activity for the most edited pages."
          rows={topPagesYear}
        />
        <LeaderboardTable
          title="Top Pages All Time"
          subtitle="Cumulative leaders across all ingested history so far."
          rows={topPagesAllTime}
        />
      </section>
    </>
  );
}
