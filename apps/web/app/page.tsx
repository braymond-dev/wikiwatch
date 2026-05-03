import { LeaderboardTable } from "@/components/LeaderboardTable";
import { LiveOverview } from "@/components/LiveOverview";
import { TrendingNow } from "@/components/TrendingNow";
import { AnnotatedMonthlyEditsChart } from "@/components/charts/AnnotatedMonthlyEditsChart";
import { ChartCard } from "@/components/charts/ChartCard";
import { EditsLineChart } from "@/components/charts/EditsLineChart";
import { EditorTypeChart } from "@/components/charts/EditorTypeChart";
import { WikiBarChart } from "@/components/charts/WikiBarChart";
import {
  getAnnotatedMonthlyEdits,
  getEditsOverTime,
  getEditorTypeBreakdown,
  getRecentEdits,
  getTrendingPages,
  getTopPages,
  getTopWikis,
} from "@/lib/queries";
import { buildFilters } from "@/lib/utils";

type HomeProps = {
  searchParams?: Promise<{
    wiki?: string;
    includeBots?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const filters = buildFilters(resolvedSearchParams);

  const [
    topPagesToday,
    trendingPages,
    annotatedMonthlyEdits,
    editsOverTime,
    editorTypes,
    topWikis,
    recentEdits,
  ] = await Promise.all([
    getTopPages("day", filters, 8),
    getTrendingPages(filters, 5),
    getAnnotatedMonthlyEdits(filters),
    getEditsOverTime("week", filters),
    getEditorTypeBreakdown("month", filters),
    getTopWikis("month", { includeBots: filters.includeBots }),
    getRecentEdits(filters, 18),
  ]);
  return (
    <>
      <section className="two-col-equal" style={{ marginBottom: 24 }}>
        <TrendingNow rows={trendingPages} compact />
        <LeaderboardTable
          title="Top Pages Today"
          subtitle="A quick peek at the current UTC day leaders."
          rows={topPagesToday.slice(0, 5)}
          footerHref="/leaderboards"
          footerLabel="See all leaderboard views"
          compact
        />
      </section>

      <LiveOverview
        initialRecentEdits={recentEdits}
        initialTopPagesToday={topPagesToday}
        showTopPagesToday={false}
      />

      <section style={{ marginBottom: 24 }}>
        <ChartCard
          title="Annotated Activity Last 30 Days"
          subtitle="Daily edit volume with the biggest monthly spikes labeled by the top pages driving each peak."
        >
          <AnnotatedMonthlyEditsChart data={annotatedMonthlyEdits} />
        </ChartCard>
      </section>

      <section className="two-col-wide" style={{ marginBottom: 24 }}>
        <ChartCard
          title="Edits Over Time Last 7 Days"
          subtitle="Seven-day edit volume using hourly rollups for a crisp trend view."
        >
          <EditsLineChart data={editsOverTime} />
        </ChartCard>

        <ChartCard
          title="Editor Types This Month"
          subtitle="Month-to-date mix of registered, temporary-account, and bot edits."
        >
          <EditorTypeChart data={editorTypes} />
        </ChartCard>
      </section>

      <section className="two-col-equal" style={{ marginBottom: 24 }}>
        <ChartCard
          title="Top Wikis This Month"
          subtitle="Most active wiki projects this month."
        >
          <WikiBarChart data={topWikis} />
        </ChartCard>
      </section>
    </>
  );
}
