import "server-only";

import { getPool } from "@/lib/db";
import { RecentEditRow, TopPageRow } from "@/lib/types";

const WIKIDATA_ENTITY_PATTERN = /^Q\d+$/i;
const WIKIDATA_API_BASE =
  "https://www.wikidata.org/w/api.php?action=wbgetentities&props=labels|descriptions&languages=en&format=json";

type WikidataApiResponse = {
  entities?: Record<
    string,
    {
      labels?: Record<string, { language: string; value: string }>;
      descriptions?: Record<string, { language: string; value: string }>;
    }
  >;
};

type CachedEntity = {
  entityId: string;
  labelEn: string | null;
};

function isWikidataEntityRow(row: { wiki: string; pageTitle: string }) {
  return row.wiki === "wikidatawiki" && WIKIDATA_ENTITY_PATTERN.test(row.pageTitle);
}

async function fetchCachedLabels(ids: string[]): Promise<Map<string, string>> {
  const pool = getPool();
  const result = await pool.query<CachedEntity>(
    `
      SELECT entity_id AS "entityId", label_en AS "labelEn"
      FROM wikidata_entity_cache
      WHERE entity_id = ANY($1::text[])
    `,
    [ids],
  );

  return new Map(
    result.rows
      .filter((row): row is CachedEntity & { labelEn: string } => Boolean(row.labelEn))
      .map((row) => [row.entityId, row.labelEn]),
  );
}

async function upsertFetchedLabels(
  entities: Array<{ entityId: string; labelEn: string | null; descriptionEn: string | null }>,
): Promise<void> {
  if (entities.length === 0) {
    return;
  }

  const pool = getPool();
  await pool.query(
    `
      INSERT INTO wikidata_entity_cache (
        entity_id,
        label_en,
        description_en,
        last_fetched_at
      )
      SELECT *
      FROM UNNEST(
        $1::text[],
        $2::text[],
        $3::text[],
        $4::timestamptz[]
      )
      ON CONFLICT (entity_id) DO UPDATE
      SET label_en = EXCLUDED.label_en,
          description_en = EXCLUDED.description_en,
          last_fetched_at = EXCLUDED.last_fetched_at
    `,
    [
      entities.map((entity) => entity.entityId),
      entities.map((entity) => entity.labelEn),
      entities.map((entity) => entity.descriptionEn),
      entities.map(() => new Date()),
    ],
  );
}

async function fetchWikidataLabels(ids: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(ids.filter((id) => WIKIDATA_ENTITY_PATTERN.test(id)))];
  const cachedLabels = await fetchCachedLabels(uniqueIds);
  const missingIds = uniqueIds.filter((id) => !cachedLabels.has(id));

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
        const fetchedEntities = missingIds.map((id) => ({
          entityId: id,
          labelEn: payload.entities?.[id]?.labels?.en?.value ?? null,
          descriptionEn: payload.entities?.[id]?.descriptions?.en?.value ?? null,
        }));
        await upsertFetchedLabels(fetchedEntities);

        for (const id of missingIds) {
          const label = payload.entities?.[id]?.labels?.en?.value;
          if (label) {
            cachedLabels.set(id, label);
          }
        }
      }
    } catch {
      // Label enrichment is best-effort; raw IDs are still perfectly usable.
    }
  }

  return cachedLabels;
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
