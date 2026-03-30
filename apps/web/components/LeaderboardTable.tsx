import { TopPageRow } from "@/lib/types";
import { buildWikiPageUrl } from "@/lib/wiki-links";

type LeaderboardTableProps = {
  title: string;
  subtitle: string;
  rows: TopPageRow[];
};

export function LeaderboardTable({
  title,
  subtitle,
  rows,
}: LeaderboardTableProps) {
  return (
    <section className="glass-card" style={{ padding: 20, borderRadius: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--font-display), sans-serif",
              fontSize: 22,
            }}
          >
            {title}
          </h3>
          <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
            {subtitle}
          </p>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 13 }}>
              <th style={{ padding: "0 0 12px" }}>Page</th>
              <th style={{ padding: "0 0 12px" }}>Wiki</th>
              <th style={{ padding: "0 0 12px" }}>Edits</th>
              <th style={{ padding: "0 0 12px" }}>Human</th>
              <th style={{ padding: "0 0 12px" }}>Bot</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "18px 0", color: "var(--muted)" }}>
                  No data yet. Let the worker ingest a bit more activity.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.wiki}-${row.pageTitle}`} style={{ borderTop: "1px solid rgba(175,214,255,0.1)" }}>
                  <td style={{ padding: "14px 0", maxWidth: 280 }}>
                    {buildWikiPageUrl(row.wiki, row.pageTitle) ? (
                      <a
                        href={buildWikiPageUrl(row.wiki, row.pageTitle) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontWeight: 600, textDecoration: "underline", textDecorationColor: "rgba(119,240,194,0.35)" }}
                      >
                        {row.displayTitle ?? row.pageTitle}
                      </a>
                    ) : (
                      <div style={{ fontWeight: 600 }}>{row.displayTitle ?? row.pageTitle}</div>
                    )}
                  </td>
                  <td style={{ padding: "14px 0", color: "var(--muted)" }}>{row.wiki}</td>
                  <td style={{ padding: "14px 0" }}>{row.editCount.toLocaleString()}</td>
                  <td style={{ padding: "14px 0", color: "var(--accent)" }}>
                    {row.humanEdits.toLocaleString()}
                  </td>
                  <td style={{ padding: "14px 0", color: "var(--accent-warm)" }}>
                    {row.botEdits.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
