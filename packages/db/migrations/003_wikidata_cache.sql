CREATE TABLE IF NOT EXISTS wikidata_entity_cache (
  entity_id TEXT PRIMARY KEY,
  label_en TEXT,
  description_en TEXT,
  last_fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wikidata_entity_cache_last_fetched_at
  ON wikidata_entity_cache (last_fetched_at DESC);
