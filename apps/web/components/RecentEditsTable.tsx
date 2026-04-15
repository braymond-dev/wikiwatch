"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { RecentEditRow } from "@/lib/types";
import { buildWikiPageUrl } from "@/lib/wiki-links";

type RecentEditsTableProps = {
  rows: RecentEditRow[];
};

export function RecentEditsTable({ rows }: RecentEditsTableProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [displayedRows, setDisplayedRows] = useState(() => rows);
  const [pendingRows, setPendingRows] = useState<RecentEditRow[] | null>(null);

  const pendingCount = useMemo(() => {
    if (!pendingRows) {
      return 0;
    }

    const displayedIds = new Set(displayedRows.map((row) => row.id));
    return pendingRows.filter((row) => !displayedIds.has(row.id)).length;
  }, [displayedRows, pendingRows]);

  useEffect(() => {
    const shell = shellRef.current;
    const isPinnedToTop = !shell || shell.scrollTop <= 24;

    if (isPinnedToTop) {
      setDisplayedRows(rows);
      setPendingRows(null);
      return;
    }

    setPendingRows(rows);
  }, [rows]);

  function applyPendingRows() {
    const nextRows = pendingRows ?? rows;
    setDisplayedRows(nextRows);
    setPendingRows(null);

    if (shellRef.current) {
      shellRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleScroll() {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    if (shell.scrollTop <= 24 && pendingRows) {
      setDisplayedRows(pendingRows);
      setPendingRows(null);
    }
  }

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
          Latest edits from the live ingestion worker, held in a steady scrollable feed.
        </p>
      </div>
      {pendingCount > 0 ? (
        <button className="recent-edits-banner" type="button" onClick={applyPendingRows}>
          Show {pendingCount} new {pendingCount === 1 ? "edit" : "edits"}
        </button>
      ) : null}
      <div className="recent-edits-shell" ref={shellRef} onScroll={handleScroll}>
        <table className="recent-edits-table">
          <colgroup>
            <col className="recent-col-time" />
            <col className="recent-col-wiki" />
            <col className="recent-col-page" />
            <col className="recent-col-editor" />
            <col className="recent-col-notes" />
          </colgroup>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 13 }}>
              <th>Time</th>
              <th>Wiki</th>
              <th>Page</th>
              <th>Editor</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "18px 0", color: "var(--muted)" }}>
                  No edit rows yet.
                </td>
              </tr>
            ) : (
              displayedRows.map((row) => (
                <tr key={row.id} style={{ borderTop: "1px solid rgba(175,214,255,0.1)" }}>
                  <td className="recent-cell-time">{row.eventTime}</td>
                  <td style={{ color: "var(--muted)" }} className="recent-cell-wiki">{row.wiki}</td>
                  <td style={{ fontWeight: 600 }} className="recent-cell-page">
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
                  <td className="recent-cell-editor">
                    {row.userName ?? "Unknown"}
                    {row.isAnon ? " (anon)" : ""}
                    {row.isTempAccount ? " (temp)" : ""}
                    {row.isBot ? " (bot)" : ""}
                  </td>
                  <td style={{ color: "var(--muted)" }} className="recent-cell-notes">
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
