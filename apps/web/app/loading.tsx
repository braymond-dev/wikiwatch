export default function Loading() {
  return (
    <section className="glass-card page-loading-shell">
      <div className="eyebrow">Loading Dashboard</div>
      <h2 className="page-loading-title">Updating the current view</h2>
      <p className="muted page-loading-copy">
        Pulling the latest rollups, leaderboard rows, and recent activity from
        Postgres.
      </p>
    </section>
  );
}
