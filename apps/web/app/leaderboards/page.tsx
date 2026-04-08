import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Filters } from "@/components/Filters";
import { TopNav } from "@/components/TopNav";
import { getAvailableWikis, getTopPages } from "@/lib/queries";
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
    availableWikis,
    topPagesToday,
    topPagesWeek,
    topPagesMonth,
    topPagesYear,
    topPagesAllTime,
  ] = await Promise.all([
    getAvailableWikis(),
    getTopPages("day", filters, 12),
    getTopPages("week", filters, 12),
    getTopPages("month", filters, 12),
    getTopPages("year", filters, 12),
    getTopPages("all", filters, 12),
  ]);

  return (
    <main className="page-shell">
      <section style={{ display: "grid", gap: 24, marginBottom: 28 }}>
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
              background:
                "radial-gradient(circle, rgba(127,194,255,0.28), transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <div className="eyebrow">Top Edited Pages</div>
          <div style={{ marginTop: 16, marginBottom: 18 }}>
            <TopNav current="leaderboards" />
          </div>
          <div className="hero-grid">
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display), sans-serif",
                  fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.04em",
                }}
              >
                Leaderboards
              </h1>
              <p
                className="muted"
                style={{
                  margin: "14px 0 0",
                  maxWidth: 720,
                  fontSize: "clamp(1rem, 1.8vw, 1.1rem)",
                  lineHeight: 1.7,
                }}
              >
                Compare the most edited pages across today, this week, this month,
                this year, and all ingested history.
              </p>
            </div>
            <Filters availableWikis={availableWikis} />
          </div>
        </div>
      </section>

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
    </main>
  );
}
