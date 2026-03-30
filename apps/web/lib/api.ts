import { z } from "zod";

import { buildFilters } from "@/lib/utils";

const rangeSchema = z.enum(["day", "week", "month", "year"]).default("day");

export function parseRequestParams(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedRange = rangeSchema.safeParse(searchParams.get("range") ?? undefined);
  return {
    range: parsedRange.success ? parsedRange.data : "day",
    filters: buildFilters({
      wiki: searchParams.get("wiki") ?? undefined,
      includeBots: searchParams.get("includeBots") ?? undefined,
    }),
  };
}
