import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Filters } from "@/components/Filters";
import { AutoRefresh } from "@/components/AutoRefresh";
import { LiveOverview } from "@/components/LiveOverview";
import { BotVsHumanChart } from "@/components/charts/BotVsHumanChart";
import { ChartCard } from "@/components/charts/ChartCard";
import { EditsLineChart } from "@/components/charts/EditsLineChart";
import { WikiBarChart } from "@/components/charts/WikiBarChart";
import {
  getAvailableWikis,
  getBotVsHuman,
  getEditsOverTime,
  getRecentEdits,
  getSummaryStats,
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
    summary,
    availableWikis,
    topPagesToday,
    topPagesWeek,
    topPagesMonth,
    topPagesYear,
    editsOverTime,
    botVsHuman,
    topWikis,
    recentEdits,
  ] = await Promise.all([
    getSummaryStats(filters),
    getAvailableWikis(),
    getTopPages("day", filters, 8),
    getTopPages("week", filters, 8),
    getTopPages("month", filters, 8),
    getTopPages("year", filters, 8),
    getEditsOverTime("week", filters),
    getBotVsHuman("month", filters),
    getTopWikis("month", filters),
    getRecentEdits(filters, 18),
  ]);

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "WikiWatch";

  return (
    <main className="page-shell">
      <section
        style={{
          display: "grid",
          gap: 24,
          marginBottom: 28,
        }}
      >
        <div
          className="glass-card"
          style={{
            borderRadius: 28,
            padding: "28px clamp(20px, 4vw, 40px)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "auto -60px -80px auto",
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(119,240,194,0.32), transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <div className="eyebrow">Live Wikimedia Analytics</div>
          <div style={{ marginTop: 14 }}>
            <AutoRefresh intervalMs={60000} />
          </div>
          <div
            className="hero-grid"
            style={{
              marginTop: 16,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display), sans-serif",
                  fontSize: "clamp(2.6rem, 6vw, 4.8rem)",
                  lineHeight: 0.96,
                  letterSpacing: "-0.04em",
                }}
              >
                {appName}
              </h1>
              <p
                className="muted"
                style={{
                  margin: "14px 0 0",
                  maxWidth: 720,
                  fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
                  lineHeight: 1.7,
                }}
              >
                Track the most edited Wikipedia pages across multiple time windows,
                compare human and bot activity, and watch the stream update from
                Wikimedia EventStreams in near real time.
              </p>
            </div>
            <Filters availableWikis={availableWikis} />
          </div>
        </div>

      </section>

      <LiveOverview
        initialSummary={summary}
        initialRecentEdits={recentEdits}
        initialTopPagesToday={topPagesToday}
      />

      <section className="two-col-wide" style={{ marginBottom: 24 }}>
        <ChartCard
          title="Edits Over Time"
          subtitle="Seven-day edit volume using hourly rollups for a crisp trend view."
        >
          <EditsLineChart data={editsOverTime} />
        </ChartCard>

        <ChartCard
          title="Bot vs Human"
          subtitle="Month-to-date contribution split for the current filter selection."
        >
          <BotVsHumanChart data={botVsHuman} />
        </ChartCard>
      </section>

      <section className="two-col-equal" style={{ marginBottom: 24 }}>
        <ChartCard
          title="Top Wikis"
          subtitle="Most active wiki projects this month."
        >
          <WikiBarChart data={topWikis} />
        </ChartCard>
      </section>

      <section className="two-col-equal">
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
      </section>
    </main>
  );
}
