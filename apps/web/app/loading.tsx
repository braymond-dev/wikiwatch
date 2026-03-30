export default function Loading() {
  return (
    <main className="page-shell">
      <section
        className="glass-card"
        style={{ borderRadius: 28, padding: 28, minHeight: 240 }}
      >
        <div className="eyebrow">Loading Dashboard</div>
        <h1
          style={{
            margin: "18px 0 8px",
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "clamp(2.4rem, 5vw, 4rem)",
          }}
        >
          WikiWatch
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Pulling the latest rollups and recent activity from Postgres.
        </p>
      </section>
    </main>
  );
}
