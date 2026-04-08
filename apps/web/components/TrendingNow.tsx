import { TrendingPageRow } from "@/lib/types";
import { buildWikiPageUrl } from "@/lib/wiki-links";

type TrendingNowProps = {
  rows: TrendingPageRow[];
  compact?: boolean;
};

function formatDelta(delta: number) {
  return `${delta > 0 ? "+" : ""}${delta.toLocaleString()}`;
}

export function TrendingNow({ rows, compact = false }: TrendingNowProps) {
  return (
    <section className={`glass-card trending-shell${compact ? " trending-shell-compact" : ""}`}>
      <div className="trending-header">
        <div>
          <h2 className="trending-title">Trending Pages Last Hour</h2>
          <p className="muted trending-subtitle">
            Pages gaining momentum in the last hour compared with the hour before.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="muted trending-empty">
          No strong surges yet. Let the stream accumulate a bit more recent activity.
        </div>
      ) : (
        compact ? (
          <div className="compact-board-list">
            {rows.map((row, index) => {
              const href = buildWikiPageUrl(row.wiki, row.pageTitle);

              return (
                <article key={`${row.wiki}-${row.pageTitle}`} className="compact-board-item">
                  <div className="compact-board-rank">#{index + 1}</div>
                  <div className="compact-board-main">
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer" className="compact-board-link">
                        {row.displayTitle ?? row.pageTitle}
                      </a>
                    ) : (
                      <div className="compact-board-link">{row.displayTitle ?? row.pageTitle}</div>
                    )}
                    <div className="compact-board-meta">
                      <span>{row.wiki}</span>
                      <span className="trending-delta">
                        {row.currentEdits.toLocaleString()} last hour
                      </span>
                    </div>
                  </div>
                  <div className="compact-board-side">
                    <div className="compact-board-side-label muted">Previous Hour</div>
                    <div className="compact-board-side-value">
                      <span className="compact-board-human">
                        {row.previousEdits.toLocaleString()}
                      </span>
                      <span className="muted"> · </span>
                      <span className="trending-delta">{formatDelta(row.deltaEdits)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={`trending-grid${compact ? " trending-grid-compact" : ""}`}>
            {rows.map((row, index) => {
              const href = buildWikiPageUrl(row.wiki, row.pageTitle);

              return (
                <article key={`${row.wiki}-${row.pageTitle}`} className="trending-card">
                  <div className="trending-rank">#{index + 1}</div>
                  <div className="trending-page">
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer" className="trending-link">
                        {row.displayTitle ?? row.pageTitle}
                      </a>
                    ) : (
                      <div className="trending-link">{row.displayTitle ?? row.pageTitle}</div>
                    )}
                  </div>
                  <div className="trending-meta">
                    <span>{row.wiki}</span>
                    <span className="trending-delta">
                      {formatDelta(row.deltaEdits)} vs previous hour
                    </span>
                  </div>
                  <div className="trending-stats">
                    <div>
                      <div className="muted trending-stat-label">Last Hour</div>
                      <div className="trending-stat-value">{row.currentEdits.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="muted trending-stat-label">Previous Hour</div>
                      <div className="trending-stat-value trending-stat-value-subtle">
                        {row.previousEdits.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="muted trending-stat-label">Human / Bot</div>
                      <div className="trending-stat-value trending-stat-value-inline">
                        <span className="trending-human">{row.humanEdits.toLocaleString()}</span>
                        <span className="muted"> / </span>
                        <span className="trending-bot">{row.botEdits.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )
      )}
    </section>
  );
}
