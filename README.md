# WikiWatch

WikiWatch is a deployable analytics dashboard for Wikimedia edit activity. It continuously ingests the Wikimedia `recentchange` EventStreams feed into Postgres, maintains compact rollup tables for fast analytics queries, and renders a polished dashboard with leaderboards, charts, and recent activity.

## What It Does

- Shows the most edited Wikipedia pages for:
  - today
  - this week
  - this month
  - this year
- Plots edit activity over time
- Breaks down bot vs human edits
- Shows top active wikis/languages
- Supports filtering by wiki/project and optionally excluding bot edits
- Streams fresh data into Postgres using a separate always-on Python worker

## Architecture Overview

WikiWatch is split into three deployable parts:

1. `apps/worker`
   - Python 3.11 long-running worker
   - Connects to Wikimedia EventStreams SSE
   - Parses edit events safely
   - Writes raw edit rows to Postgres
   - Updates lightweight count rollups in batches
   - Refreshes page leaderboard rollups on a slower maintenance cadence

2. `apps/web`
   - Next.js App Router application
   - Reads from Postgres on the server
   - Exposes API routes for dashboard queries
   - Renders charts, tables, filters, and stat cards

3. `packages/db`
   - Shared SQL schema and migration files
   - Rollup tables and indexes tuned for time-window analytics

## Repository Layout

```text
/wikiwatch
  /apps
    /web
    /worker
  /packages
    /db
  /infra
  README.md
```

## Why Rollup Tables

The Wikimedia stream can become large quickly. Querying only raw events for every dashboard request would make time-window analytics and leaderboards increasingly expensive over time. Rollup tables keep the product responsive and predictable:

- `edit_counts_hourly`
  - powers short-range time series and near-real-time trend views
- `edit_counts_daily`
  - powers longer-range charts and summary metrics
- `current_page_counts_daily|weekly|monthly|yearly`
  - keeps full per-page counts only for the active day, week, month, and year
  - refreshed on a slower background cadence rather than every event flush
- `top_pages_daily|weekly|monthly|yearly`
  - stores only the top ranked leaderboard rows per wiki and period
  - refreshed from the active current-page tables on the same slower cadence
  - defaults to the top `20` article-space pages per wiki

This keeps the SQL simple and maintainable while avoiding repeated scans over the raw event table and prevents historical page-leaderboard storage from growing without bound.

## Most Important Dashboard Queries

### Top pages for a range

```sql
SELECT page_title, wiki, edit_count, bot_edits, human_edits
FROM top_pages_weekly
WHERE period_start = date_trunc('week', now())::date
  AND ($1::text IS NULL OR wiki = $1)
ORDER BY rank ASC
LIMIT 20;
```

### Edits over time

For short windows:

```sql
SELECT bucket_start, total_edits, bot_edits, human_edits
FROM edit_counts_hourly
WHERE bucket_start >= now() - interval '7 days'
  AND ($1::text IS NULL OR wiki = $1)
ORDER BY bucket_start ASC;
```

For long windows:

```sql
SELECT bucket_date, total_edits, bot_edits, human_edits
FROM edit_counts_daily
WHERE bucket_date >= current_date - interval '365 days'
  AND ($1::text IS NULL OR wiki = $1)
ORDER BY bucket_date ASC;
```

### Top wikis/languages

```sql
SELECT wiki, SUM(total_edits) AS total_edits
FROM edit_counts_daily
WHERE bucket_date >= current_date - interval '30 days'
GROUP BY wiki
ORDER BY total_edits DESC
LIMIT 10;
```

## Local Development

### Prerequisites

- Docker and Docker Compose

### 1. Copy environment variables

```bash
cp infra/.env.example infra/.env
```

### 2. Start everything

```bash
docker compose -f infra/docker-compose.yml up --build
```

If you want your local Docker services to use the same environment variables as
your Vercel project, pull them once and Docker Compose will automatically
overlay them on top of `infra/.env`:

```bash
npm run env:pull:vercel
docker compose -f infra/docker-compose.yml up --build
```

By default this pulls the `production` environment into `infra/.env.vercel`.
You can also pull a different Vercel environment:

```bash
bash infra/pull-vercel-env.sh preview
```

This starts:

- Postgres on `localhost:5432`
- Next.js on `http://localhost:3000`
- Python worker connected to the Wikimedia stream

### 3. Verify data is flowing

Open the app:

```text
http://localhost:3000
```

Then inspect the database:

```bash
docker compose -f infra/docker-compose.yml exec postgres \
  psql -U wikiwatch -d wikiwatch -c "select count(*) from raw_edits;"
```

You can also check the most recent edits:

```bash
docker compose -f infra/docker-compose.yml exec postgres \
  psql -U wikiwatch -d wikiwatch -c "select event_time, wiki, page_title, user_name from raw_edits order by event_time desc limit 10;"
```

## Environment Variables

All configuration is environment-driven.

### Shared

- `DATABASE_URL`
  - Postgres connection string used by the web app and worker
  - if `infra/.env.vercel` exists, Docker Compose will prefer the Vercel-pulled value over `infra/.env`

### Web

- `NEXT_PUBLIC_APP_NAME`
  - Optional display name override

### Worker

- `WIKIMEDIA_STREAM_URL`
  - Defaults to Wikimedia recentchange SSE stream
- `WORKER_USER_AGENT`
  - Descriptive user agent sent to Wikimedia; include contact info
- `WORKER_BATCH_SIZE`
  - Number of parsed events per batch insert
- `WORKER_STREAM_READ_TIMEOUT_SECONDS`
  - Max seconds to wait for stream activity before reconnecting; defaults to `120`
- `WORKER_FLUSH_INTERVAL_SECONDS`
  - Max seconds before flushing a partial batch
- `WORKER_LEADERBOARD_REFRESH_INTERVAL_SECONDS`
  - Max seconds between page leaderboard refreshes; defaults to `300`
- `WORKER_RECONNECT_DELAY_SECONDS`
  - Delay before reconnecting after stream failures
- `WORKER_LOG_LEVEL`
  - Logging level
- `WORKER_STORE_RAW_JSON`
  - Set to `false` to skip storing full raw event payloads in `raw_edits.raw_json`
  - defaults to `false`
- `RAW_EDITS_RETENTION_DAYS`
  - Number of days of raw edit rows to retain; defaults to `3`
- `RETENTION_CHECK_INTERVAL_SECONDS`
  - How often the worker checks for old `raw_edits` rows to prune; defaults to hourly
- `WORKER_TOP_PAGES_LIMIT`
  - Number of ranked pages per wiki and period to retain in `top_pages_*`; defaults to `20`

## Running Components Individually

### Database

Apply the single schema file manually against any Postgres instance:

```bash
npm run db:migrate
```

The schema file is idempotent for fresh environment setup: it uses `IF NOT EXISTS`
for extensions, tables, and indexes, so rerunning `npm run db:migrate` will not
drop or recreate existing tables.

### Worker

```bash
cd apps/worker
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m worker.main
```

### Web App

```bash
cd apps/web
npm install
npm run dev
```

## Production Deployment Model

Recommended production layout:

- `apps/web`
  - deploy to Vercel
  - set `DATABASE_URL` in Vercel project environment variables
- Postgres
  - host on Neon or any managed Postgres provider
- `apps/worker`
  - deploy as an always-on service on Railway, Fly.io, Render, a VM, or container host
  - set the same `DATABASE_URL`

The worker is intentionally not designed to run on Vercel because it must keep a continuous SSE connection open.

### Railway Worker Deployment

The repo includes a root-level [railway.json](/home/ben/workspace/wikiwatch/railway.json) that points Railway at the worker Dockerfile:

- Dockerfile: `apps/worker/Dockerfile`
- Start command: `python -m worker.main`

To deploy the worker on Railway:

1. Create a new Railway project from this GitHub repository.
2. Keep the repo root as the service source.
3. Railway will pick up `railway.json` and build the worker service from `apps/worker/Dockerfile`.
4. Set these environment variables in Railway:
   - `DATABASE_URL`
   - `WIKIMEDIA_STREAM_URL`
   - `WORKER_USER_AGENT`
   - `WORKER_STREAM_READ_TIMEOUT_SECONDS`
   - `WORKER_TOP_PAGES_LIMIT`
   - `WORKER_BATCH_SIZE`
   - `WORKER_FLUSH_INTERVAL_SECONDS`
   - `WORKER_RECONNECT_DELAY_SECONDS`
   - `WORKER_LOG_LEVEL`
   - `WORKER_STORE_RAW_JSON`
   - `RAW_EDITS_RETENTION_DAYS`
   - `RETENTION_CHECK_INTERVAL_SECONDS`
5. Use the same production `DATABASE_URL` that the Vercel app uses.

Once Railway starts the worker, the Vercel dashboard should begin filling as events are ingested into the shared Postgres database.

## Key Design Choices

- Simple Postgres schema with explicit rollups rather than a more complex analytics stack
- Python worker uses `aiohttp` plus `asyncpg` for straightforward async ingestion
- Dashboard queries read only from server-side code to avoid exposing direct DB access
- Hourly and daily rollups balance freshness with efficient time-range analytics
- Historical page leaderboards are stored as compact top-N snapshots instead of full per-page history
- Raw event JSON storage is optional and disabled by default to reduce storage growth

## Notes and Tradeoffs

- The worker currently stores `edit` events from `recentchange`; non-edit event types are ignored to keep the product focused on page edit activity
- Rollups are updated during ingestion, which keeps reads fast but adds some write amplification
- Only the active day/week/month/year retain full per-page counts; historical leaderboards are compact snapshots
- This MVP favors understandable SQL and maintainable code over advanced stream-processing patterns
