import { NextResponse } from "next/server";

import { parseRequestParams } from "@/lib/api";
import { getBotVsHuman } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { range, filters } = parseRequestParams(request);
  const data = await getBotVsHuman(range, filters);
  return NextResponse.json({ data });
}
