import { LeaderboardTable } from "@/components/LeaderboardTable";
import { LiveOverview } from "@/components/LiveOverview";
import { TrendingNow } from "@/components/TrendingNow";
import { AnnotatedActivityToggle } from "@/components/charts/AnnotatedActivityToggle";
import { ChartCard } from "@/components/charts/ChartCard";
import { EditorTypeChart } from "@/components/charts/EditorTypeChart";
import { WikiBarChart } from "@/components/charts/WikiBarChart";
import {
  getAnnotatedEdits,
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
    annotatedWeekEdits,
    annotatedMonthEdits,
    editorTypes,
    topWikis,
    recentEdits,
  ] = await Promise.all([
    getTopPages("day", filters, 8),
    getTrendingPages(filters, 5),
    getAnnotatedEdits("week", filters),
    getAnnotatedEdits("month", filters),
    getEditorTypeBreakdown("month", filters),
    getTopWikis("month", { includeBots: filters.includeBots }),
    getRecentEdits(filters, 18),
  ]);
  return (
    <>
      <section style={{ marginBottom: 24 }}>
        <ChartCard
          title="Annotated Activity"
          subtitle="The main activity view with 7-day and 30-day hourly trends, plus optional peak annotations."
        >
          <AnnotatedActivityToggle
            weekData={annotatedWeekEdits}
            monthData={annotatedMonthEdits}
          />
        </ChartCard>
      </section>

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

      <section className="two-col-wide" style={{ marginBottom: 24 }}>
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
