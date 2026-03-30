import "server-only";

import { RecentEditRow, TopPageRow } from "@/lib/types";

const WIKIDATA_ENTITY_PATTERN = /^Q\d+$/i;
const WIKIDATA_API_BASE =
  "https://www.wikidata.org/w/api.php?action=wbgetentities&props=labels&languages=en&format=json";

type WikidataApiResponse = {
  entities?: Record<
    string,
    {
      labels?: Record<string, { language: string; value: string }>;
    }
  >;
};

const labelCache = new Map<string, string>();

function isWikidataEntityRow(row: { wiki: string; pageTitle: string }) {
  return row.wiki === "wikidatawiki" && WIKIDATA_ENTITY_PATTERN.test(row.pageTitle);
}

async function fetchWikidataLabels(ids: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(ids.filter((id) => WIKIDATA_ENTITY_PATTERN.test(id)))];
  const missingIds = uniqueIds.filter((id) => !labelCache.has(id));

  if (missingIds.length > 0) {
    try {
      const response = await fetch(
        `${WIKIDATA_API_BASE}&ids=${encodeURIComponent(missingIds.join("|"))}`,
        {
          next: { revalidate: 3600 },
          headers: {
            "User-Agent": "WikiWatch/1.0",
          },
        },
      );

      if (response.ok) {
        const payload = (await response.json()) as WikidataApiResponse;
        for (const id of missingIds) {
          const label = payload.entities?.[id]?.labels?.en?.value;
          if (label) {
            labelCache.set(id, label);
          }
        }
      }
    } catch {
      // Label enrichment is best-effort; raw IDs are still perfectly usable.
    }
  }

  return new Map(
    uniqueIds
      .map((id) => [id, labelCache.get(id)] as const)
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

function toDisplayTitle(pageTitle: string, labels: Map<string, string>) {
  const label = labels.get(pageTitle);
  if (!label) {
    return pageTitle;
  }
  return `${label} (${pageTitle})`;
}

export async function enrichTopPageRowsWithWikidataLabels(
  rows: TopPageRow[],
): Promise<TopPageRow[]> {
  const ids = rows.filter(isWikidataEntityRow).map((row) => row.pageTitle);
  if (ids.length === 0) {
    return rows;
  }

  const labels = await fetchWikidataLabels(ids);
  return rows.map((row) =>
    isWikidataEntityRow(row)
      ? {
          ...row,
          displayTitle: toDisplayTitle(row.pageTitle, labels),
        }
      : row,
  );
}

export async function enrichRecentEditRowsWithWikidataLabels(
  rows: RecentEditRow[],
): Promise<RecentEditRow[]> {
  const ids = rows.filter(isWikidataEntityRow).map((row) => row.pageTitle);
  if (ids.length === 0) {
    return rows;
  }

  const labels = await fetchWikidataLabels(ids);
  return rows.map((row) =>
    isWikidataEntityRow(row)
      ? {
          ...row,
          displayTitle: toDisplayTitle(row.pageTitle, labels),
        }
      : row,
  );
}
