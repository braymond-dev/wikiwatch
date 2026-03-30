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
  return databaseUrl.trim().replace(/^['"]|['"]$/g, "");
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
