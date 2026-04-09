import { NextResponse } from "next/server";

import { getAvailableWikis } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET() {
  const wikis = await getAvailableWikis();

  return NextResponse.json({
    data: {
      wikis,
    },
  });
}
