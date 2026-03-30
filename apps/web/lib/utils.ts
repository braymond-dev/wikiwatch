import { DashboardFilters, RangeKey } from "@/lib/types";

export function normalizeWiki(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeIncludeBots(
  value: string | null | undefined,
): boolean | undefined {
  if (!value) return undefined;
  if (value === "false") return false;
  if (value === "true") return true;
  return undefined;
}

export function buildFilters(searchParams?: {
  wiki?: string;
  includeBots?: string;
}): DashboardFilters {
  return {
    wiki: normalizeWiki(searchParams?.wiki),
    includeBots: normalizeIncludeBots(searchParams?.includeBots),
  };
}

export function getRangeLabel(range: RangeKey): string {
  switch (range) {
    case "day":
      return "Today";
    case "week":
      return "This Week";
    case "month":
      return "This Month";
    case "year":
      return "This Year";
  }
}

