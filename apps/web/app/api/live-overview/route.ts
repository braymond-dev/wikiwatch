import { NextResponse } from "next/server";

import { parseRequestParams } from "@/lib/api";
import { getRecentEdits, getSummaryStats, getTopPages } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { filters } = parseRequestParams(request);
  const [summary, recentEdits, topPagesToday] = await Promise.all([
    getSummaryStats(filters),
    getRecentEdits(filters, 18),
    getTopPages("day", filters, 8),
  ]);

  return NextResponse.json({
    data: {
      summary,
      recentEdits,
      topPagesToday,
    },
  });
}
