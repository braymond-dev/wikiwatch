import "server-only";

import { getPool } from "@/lib/db";
import {
  AnnotatedMonthlyEdits,
  DashboardFilters,
  EditorTypeRow,
  PeakAnnotation,
  RangeKey,
  RecentEditRow,
  SummaryStats,
  TimeSeriesPoint,
  TrendingPageRow,
  TopPageRow,
  WikiBreakdownRow,
} from "@/lib/types";
import {
  enrichRecentEditRowsWithWikidataLabels,
  enrichTopPageRowsWithWikidataLabels,
} from "@/lib/wikidata";

const RANGE_TO_TABLE = {
  day: "top_pages_daily",
  week: "top_pages_weekly",
  month: "top_pages_monthly",
  year: "top_pages_yearly",
} as const;

const DEFAULT_EXCLUDED_WIKIS = [
  "labswiki",
  "officewiki",
  "foundationwiki",
  "donatewiki",
] as const;

function getPeriodStartExpression(range: RangeKey) {
  switch (range) {
    case "day":
      return "CURRENT_DATE";
    case "week":
      return "date_trunc('week', NOW())::date";
    case "month":
      return "date_trunc('month', NOW())::date";
    case "year":
      return "date_trunc('year', NOW())::date";
    case "all":
      return null;
  }
}

function buildBotClause(includeBots?: boolean, tableAlias = "") {
  const prefix = tableAlias ? `${tableAlias}.` : "";
  if (includeBots === false) {
    return ` AND ${prefix}human_edits > 0`;
  }
  return "";
}

function applyWikiScope(baseIndex: number, wiki?: string) {
  if (!wiki) {
    const placeholders = DEFAULT_EXCLUDED_WIKIS.map(
      (_, index) => `$${baseIndex + index}`,
    ).join(", ");
    return {
      sql: ` AND wiki NOT IN (${placeholders})`,
      values: [...DEFAULT_EXCLUDED_WIKIS],
    };
  }
  return {
    sql: ` AND wiki = $${baseIndex}`,
    values: [wiki],
  };
}

export async function getTopPages(
  range: RangeKey,
  filters: DashboardFilters = {},
  limit = 10,
): Promise<TopPageRow[]> {
  const pool = getPool();

  let result;

  if (range === "all") {
    const wikiFilter = applyWikiScope(1, filters.wiki);
    const limitIndex = wikiFilter.values.length + 1;
    result = await pool.query(
      `
        SELECT
          page_title AS "pageTitle",
          wiki,
          CASE
            WHEN $${limitIndex + 1}::boolean = false THEN SUM(human_edits)
            ELSE SUM(edit_count)
          END::int AS "editCount",
          SUM(bot_edits)::int AS "botEdits",
          SUM(human_edits)::int AS "humanEdits"
        FROM top_pages_yearly
        WHERE 1 = 1
        ${wikiFilter.sql}
        ${buildBotClause(filters.includeBots, "")}
        GROUP BY wiki, page_title
        ORDER BY "editCount" DESC, "pageTitle" ASC
        LIMIT $${limitIndex}
      `,
      [...wikiFilter.values, limit, filters.includeBots !== false],
    );
  } else {
    const tableName = RANGE_TO_TABLE[range];
    const periodExpression = getPeriodStartExpression(range);
    const wikiFilter = applyWikiScope(1, filters.wiki);
    const limitIndex = wikiFilter.values.length + 1;

    result = await pool.query(
      `
        SELECT
          page_title AS "pageTitle",
          wiki,
          CASE
            WHEN $${limitIndex + 1}::boolean = false THEN human_edits
            ELSE edit_count
          END AS "editCount",
          bot_edits AS "botEdits",
          human_edits AS "humanEdits"
        FROM ${tableName}
        WHERE period_start = ${periodExpression}
        ${wikiFilter.sql}
        ${buildBotClause(filters.includeBots, "")}
        ORDER BY rank ASC, "pageTitle" ASC
        LIMIT $${limitIndex}
      `,
      [...wikiFilter.values, limit, filters.includeBots !== false],
    );
  }

  return enrichTopPageRowsWithWikidataLabels(result.rows);
}

export async function getEditsOverTime(
  range: RangeKey,
  filters: DashboardFilters = {},
): Promise<TimeSeriesPoint[]> {
  const wikiFilter = applyWikiScope(1, filters.wiki);
  const includeBotsFlagIndex = wikiFilter.values.length + 1;
  const pool = getPool();

  if (range === "day" || range === "week") {
    const interval = range === "day" ? "1 day" : "7 days";
    const result = await pool.query(
      `
        SELECT
          to_char(bucket_start, 'YYYY-MM-DD"T"HH24:00:00"Z"') AS bucket,
          CASE
            WHEN $${includeBotsFlagIndex}::boolean = false THEN human_edits
            ELSE total_edits
          END AS "totalEdits",
          bot_edits AS "botEdits",
          human_edits AS "humanEdits",
          GREATEST(human_edits - temp_account_edits, 0) AS "registeredEdits",
          temp_account_edits AS "tempAccountEdits"
        FROM edit_counts_hourly
        WHERE bucket_start >= NOW() - interval '${interval}'
        ${wikiFilter.sql}
        ORDER BY bucket_start ASC
      `,
      [...wikiFilter.values, filters.includeBots !== false],
    );
    return result.rows;
  }

  const interval = range === "month" ? "31 days" : "365 days";
  const result = await pool.query(
    `
      SELECT
        to_char(bucket_date, 'YYYY-MM-DD') AS bucket,
        CASE
          WHEN $${includeBotsFlagIndex}::boolean = false THEN human_edits
          ELSE total_edits
        END AS "totalEdits",
        bot_edits AS "botEdits",
        human_edits AS "humanEdits",
        GREATEST(human_edits - temp_account_edits, 0) AS "registeredEdits",
        temp_account_edits AS "tempAccountEdits"
      FROM edit_counts_daily
      WHERE bucket_date >= CURRENT_DATE - interval '${interval}'
      ${wikiFilter.sql}
      ORDER BY bucket_date ASC
    `,
    [...wikiFilter.values, filters.includeBots !== false],
  );
  return result.rows;
}

export async function getEditorTypeBreakdown(
  range: RangeKey,
  filters: DashboardFilters = {},
): Promise<EditorTypeRow[]> {
  const wikiFilter = applyWikiScope(1, filters.wiki);
  const pool = getPool();
  let table = "edit_counts_daily";
  let dateFilter = "bucket_date = CURRENT_DATE";

  if (range === "week") {
    dateFilter = "bucket_date >= date_trunc('week', NOW())::date";
  } else if (range === "month") {
    dateFilter = "bucket_date >= date_trunc('month', NOW())::date";
  } else if (range === "year") {
    dateFilter = "bucket_date >= date_trunc('year', NOW())::date";
  }

  if (range === "day") {
    table = "edit_counts_hourly";
    dateFilter = "bucket_start >= NOW() - interval '1 day'";
  }

  const result = await pool.query(
    `
      SELECT
        COALESCE(SUM(bot_edits), 0)::int AS "botEdits",
        COALESCE(SUM(human_edits), 0)::int AS "humanEdits",
        COALESCE(SUM(temp_account_edits), 0)::int AS "tempAccountEdits"
      FROM ${table}
      WHERE ${dateFilter}
      ${wikiFilter.sql}
    `,
    wikiFilter.values,
  );

  const row = result.rows[0] ?? { botEdits: 0, humanEdits: 0, tempAccountEdits: 0 };
  const tempAccountValue = row.tempAccountEdits;
  const registeredValue = Math.max(0, row.humanEdits - tempAccountValue);

  return [
    { name: "Registered", value: registeredValue },
    { name: "Temporary", value: tempAccountValue },
    { name: "Bot", value: filters.includeBots === false ? 0 : row.botEdits },
  ];
}

export async function getTopWikis(
  range: RangeKey,
  filters: DashboardFilters = {},
): Promise<WikiBreakdownRow[]> {
  const includeBotsOnlyHuman = filters.includeBots === false;
  let dateFilter = "bucket_date = CURRENT_DATE";
  const wikiFilter = applyWikiScope(1, filters.wiki);
  const pool = getPool();

  if (range === "week") {
    dateFilter = "bucket_date >= date_trunc('week', NOW())::date";
  } else if (range === "month") {
    dateFilter = "bucket_date >= date_trunc('month', NOW())::date";
  } else if (range === "year") {
    dateFilter = "bucket_date >= date_trunc('year', NOW())::date";
  }

  const result = await pool.query(
    `
      SELECT
        wiki,
        COALESCE(SUM(${includeBotsOnlyHuman ? "human_edits" : "total_edits"}), 0)::int AS "totalEdits"
      FROM edit_counts_daily
      WHERE ${dateFilter}
      ${wikiFilter.sql}
      GROUP BY wiki
      ORDER BY "totalEdits" DESC, wiki ASC
      LIMIT 10
    `,
    wikiFilter.values,
  );
  return result.rows;
}

export async function getRecentEdits(
  filters: DashboardFilters = {},
  limit = 20,
): Promise<RecentEditRow[]> {
  const pool = getPool();
  const values: Array<string | number> = [];
  const clauses: string[] = [];

  if (filters.wiki) {
    values.push(filters.wiki);
    clauses.push(`wiki = $${values.length}`);
  } else {
    values.push(...DEFAULT_EXCLUDED_WIKIS);
    clauses.push(
      `wiki NOT IN (${DEFAULT_EXCLUDED_WIKIS.map((_, index) => `$${index + 1}`).join(", ")})`,
    );
  }
  if (filters.includeBots === false) {
    clauses.push("is_bot = false");
  }
  values.push(limit);

  const result = await pool.query(
    `
      SELECT
        id,
        to_char(event_time, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "eventTime",
        wiki,
        page_title AS "pageTitle",
        user_name AS "userName",
        is_bot AS "isBot",
        is_anon AS "isAnon",
        is_temp_account AS "isTempAccount",
        comment
      FROM raw_edits
      ${clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : ""}
      ORDER BY event_time DESC
      LIMIT $${values.length}
    `,
    values,
  );
  return result.rows;
}

export async function getSummaryStats(
  filters: DashboardFilters = {},
): Promise<SummaryStats> {
  const wikiFilter = applyWikiScope(1, filters.wiki);
  const pool = getPool();

  const todayResult = await pool.query(
    `
      SELECT
        COALESCE(SUM(total_edits), 0)::int AS "editsToday",
        COALESCE(SUM(bot_edits), 0)::int AS "botEdits",
        COALESCE(SUM(human_edits), 0)::int AS "humanEdits",
        COUNT(DISTINCT wiki)::int AS "activeWikisToday"
      FROM edit_counts_daily
      WHERE bucket_date = CURRENT_DATE
      ${wikiFilter.sql}
    `,
    wikiFilter.values,
  );

  const weekResult = await pool.query(
    `
      SELECT
        COALESCE(SUM(total_edits), 0)::int AS "editsThisWeek",
        COALESCE(SUM(human_edits), 0)::int AS "humanEditsThisWeek"
      FROM edit_counts_daily
      WHERE bucket_date >= date_trunc('week', NOW())::date
      ${wikiFilter.sql}
    `,
    wikiFilter.values,
  );

  const today = todayResult.rows[0];
  const week = weekResult.rows[0];
  const editsToday = filters.includeBots === false ? today.humanEdits : today.editsToday;
  const editsThisWeek =
    filters.includeBots === false ? week.humanEditsThisWeek : week.editsThisWeek;
  const totalForShare = today.editsToday || 0;
  const botShareToday =
    filters.includeBots === false || totalForShare === 0
      ? 0
      : Math.round((today.botEdits / totalForShare) * 100);

  return {
    editsToday,
    editsThisWeek,
    activeWikisToday: today.activeWikisToday,
    botShareToday,
  };
}

export async function getTrendingPages(
  filters: DashboardFilters = {},
  limit = 6,
): Promise<TrendingPageRow[]> {
  const pool = getPool();
  const values: Array<string | number> = [];
  const clauses: string[] = [
    "event_time >= NOW() - interval '2 hours'",
    "namespace = 0",
  ];

  if (filters.wiki) {
    values.push(filters.wiki);
    clauses.push(`wiki = $${values.length}`);
  } else {
    values.push(...DEFAULT_EXCLUDED_WIKIS);
    clauses.push(
      `wiki NOT IN (${DEFAULT_EXCLUDED_WIKIS.map((_, index) => `$${index + 1}`).join(", ")})`,
    );
  }

  if (filters.includeBots === false) {
    clauses.push("is_bot = false");
  }

  values.push(limit);

  const result = await pool.query<TrendingPageRow>(
    `
      WITH page_windows AS (
        SELECT
          wiki,
          page_title AS "pageTitle",
          COUNT(*) FILTER (
            WHERE event_time >= NOW() - interval '1 hour'
          )::int AS "currentEdits",
          COUNT(*) FILTER (
            WHERE event_time >= NOW() - interval '2 hours'
              AND event_time < NOW() - interval '1 hour'
          )::int AS "previousEdits",
          COUNT(*) FILTER (
            WHERE event_time >= NOW() - interval '1 hour' AND is_bot = true
          )::int AS "botEdits",
          COUNT(*) FILTER (
            WHERE event_time >= NOW() - interval '1 hour' AND is_bot = false
          )::int AS "humanEdits"
        FROM raw_edits
        WHERE ${clauses.join(" AND ")}
        GROUP BY wiki, page_title
      )
      SELECT
        wiki,
        "pageTitle",
        "currentEdits",
        "previousEdits",
        ("currentEdits" - "previousEdits")::int AS "deltaEdits",
        "botEdits",
        "humanEdits"
      FROM page_windows
      WHERE "currentEdits" >= 5
        AND "currentEdits" > "previousEdits"
      ORDER BY
        ("currentEdits" - "previousEdits") DESC,
        "currentEdits" DESC,
        "pageTitle" ASC
      LIMIT $${values.length}
    `,
    values,
  );

  const enriched = await enrichTopPageRowsWithWikidataLabels(
    result.rows.map((row) => ({
      pageTitle: row.pageTitle,
      displayTitle: row.displayTitle,
      wiki: row.wiki,
      editCount: row.currentEdits,
      botEdits: row.botEdits,
      humanEdits: row.humanEdits,
    })),
  );

  const displayTitles = new Map(
    enriched.map((row) => [`${row.wiki}:${row.pageTitle}`, row.displayTitle]),
  );

  return result.rows.map((row) => ({
    ...row,
    displayTitle: displayTitles.get(`${row.wiki}:${row.pageTitle}`),
  }));
}

export async function getAvailableWikis(): Promise<string[]> {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT wiki
      FROM edit_counts_daily
      GROUP BY wiki
      ORDER BY wiki ASC
    `,
  );
  return result.rows.map((row) => row.wiki as string);
}

function selectPeakBuckets(
  series: TimeSeriesPoint[],
  limit: number,
): Array<{ bucket: string; totalEdits: number }> {
  const candidates = series
    .map((point, index) => {
      const previous = series[index - 1]?.totalEdits ?? -1;
      const next = series[index + 1]?.totalEdits ?? -1;
      const isLocalPeak =
        index > 0 &&
        index < series.length - 1 &&
        point.totalEdits >= previous &&
        point.totalEdits >= next &&
        (point.totalEdits > previous || point.totalEdits > next);

      const prominence = point.totalEdits - Math.max(previous, next, 0);

      return {
        bucket: point.bucket,
        totalEdits: point.totalEdits,
        prominence,
        isLocalPeak,
      };
    })
    .filter((point) => point.totalEdits > 0 && (point.isLocalPeak || point.prominence > 0))
    .sort((left, right) => {
      if (right.prominence !== left.prominence) {
        return right.prominence - left.prominence;
      }
      return right.totalEdits - left.totalEdits;
    });

  const selected: Array<{ bucket: string; totalEdits: number }> = [];

  for (const candidate of candidates) {
    const candidateDate = new Date(`${candidate.bucket}T00:00:00Z`);
    const tooClose = selected.some((existing) => {
      const existingDate = new Date(`${existing.bucket}T00:00:00Z`);
      const distanceDays = Math.abs(
        Math.round((candidateDate.getTime() - existingDate.getTime()) / 86400000),
      );
      return distanceDays < 3;
    });

    if (!tooClose) {
      selected.push({
        bucket: candidate.bucket,
        totalEdits: candidate.totalEdits,
      });
    }

    if (selected.length === limit) {
      break;
    }
  }

  return selected.sort((left, right) => left.bucket.localeCompare(right.bucket));
}

export async function getAnnotatedMonthlyEdits(
  filters: DashboardFilters = {},
  peakLimit = 4,
  pagesPerPeak = 3,
): Promise<AnnotatedMonthlyEdits> {
  const series = await getEditsOverTime("month", filters);
  const peakBuckets = selectPeakBuckets(series, peakLimit);

  if (peakBuckets.length === 0) {
    return { series, peaks: [] };
  }

  const pool = getPool();

  const peaks = await Promise.all(
    peakBuckets.map(async (peak): Promise<PeakAnnotation> => {
      const wikiFilter = applyWikiScope(2, filters.wiki);
      const limitIndex = wikiFilter.values.length + 2;
      const result = await pool.query<TopPageRow>(
        `
          SELECT
            page_title AS "pageTitle",
            wiki,
            CASE
              WHEN $${limitIndex + 1}::boolean = false THEN human_edits
              ELSE edit_count
            END AS "editCount",
            bot_edits AS "botEdits",
            human_edits AS "humanEdits"
          FROM top_pages_daily
          WHERE period_start = $1::date
          ${wikiFilter.sql}
          ${buildBotClause(filters.includeBots, "")}
          ORDER BY rank ASC, "pageTitle" ASC
          LIMIT $${limitIndex}
        `,
        [peak.bucket, ...wikiFilter.values, pagesPerPeak, filters.includeBots !== false],
      );

      const pages = await enrichTopPageRowsWithWikidataLabels(result.rows);

      return {
        bucket: peak.bucket,
        totalEdits: peak.totalEdits,
        pages,
      };
    }),
  );

  return {
    series,
    peaks,
  };
}
