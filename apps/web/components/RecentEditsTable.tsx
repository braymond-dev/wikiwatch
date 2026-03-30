import { RecentEditRow } from "@/lib/types";
import { buildWikiPageUrl } from "@/lib/wiki-links";

type RecentEditsTableProps = {
  rows: RecentEditRow[];
};

export function RecentEditsTable({ rows }: RecentEditsTableProps) {
  return (
    <section className="glass-card" style={{ padding: 20, borderRadius: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--font-display), sans-serif",
            fontSize: 22,
          }}
        >
          Recent Edit Activity
        </h3>
        <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
          Latest edits from the live ingestion worker.
        </p>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 13 }}>
              <th style={{ padding: "0 0 12px" }}>Time</th>
              <th style={{ padding: "0 0 12px" }}>Wiki</th>
              <th style={{ padding: "0 0 12px" }}>Page</th>
              <th style={{ padding: "0 0 12px" }}>Editor</th>
              <th style={{ padding: "0 0 12px" }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "18px 0", color: "var(--muted)" }}>
                  No edit rows yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} style={{ borderTop: "1px solid rgba(175,214,255,0.1)" }}>
                  <td style={{ padding: "14px 0", whiteSpace: "nowrap" }}>{row.eventTime}</td>
                  <td style={{ padding: "14px 0", color: "var(--muted)" }}>{row.wiki}</td>
                  <td style={{ padding: "14px 0", fontWeight: 600 }}>
                    {buildWikiPageUrl(row.wiki, row.pageTitle) ? (
                      <a
                        href={buildWikiPageUrl(row.wiki, row.pageTitle) ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: "underline", textDecorationColor: "rgba(119,240,194,0.35)" }}
                      >
                        {row.displayTitle ?? row.pageTitle}
                      </a>
                    ) : (
                      row.displayTitle ?? row.pageTitle
                    )}
                  </td>
                  <td style={{ padding: "14px 0" }}>
                    {row.userName ?? "Unknown"}
                    {row.isAnon ? " (anon)" : ""}
                    {row.isBot ? " (bot)" : ""}
                  </td>
                  <td style={{ padding: "14px 0", color: "var(--muted)" }}>
                    {row.comment || "No comment"}
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
