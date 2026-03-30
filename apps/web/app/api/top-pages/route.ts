import { NextResponse } from "next/server";

import { parseRequestParams } from "@/lib/api";
import { getTopPages } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { range, filters } = parseRequestParams(request);
  const data = await getTopPages(range, filters, 20);
  return NextResponse.json({ data });
}
