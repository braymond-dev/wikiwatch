import "server-only";

import { Pool } from "pg";

declare global {
  var __wikiwatchPool: Pool | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const normalized = databaseUrl.trim().replace(/^['"]|['"]$/g, "");

  try {
    const url = new URL(normalized);
    for (const [key, value] of url.searchParams.entries()) {
      url.searchParams.set(key, value.trim().replace(/^['"]|['"]$/g, ""));
    }
    return url.toString();
  } catch {
    return normalized;
  }
}

export function getPool() {
  if (!global.__wikiwatchPool) {
    global.__wikiwatchPool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 10,
    });
  }

  return global.__wikiwatchPool;
}
