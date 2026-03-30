export type RangeKey = "day" | "week" | "month" | "year";

export type DashboardFilters = {
  wiki?: string;
  includeBots?: boolean;
};

export type TimeSeriesPoint = {
  bucket: string;
  totalEdits: number;
  botEdits: number;
  humanEdits: number;
};

export type TopPageRow = {
  pageTitle: string;
  displayTitle?: string;
  wiki: string;
  editCount: number;
  botEdits: number;
  humanEdits: number;
};

export type RecentEditRow = {
  id: number;
  eventTime: string;
  wiki: string;
  pageTitle: string;
  displayTitle?: string;
  userName: string | null;
  isBot: boolean;
  isAnon: boolean;
  comment: string | null;
};

export type BotVsHumanRow = {
  name: string;
  value: number;
};

export type WikiBreakdownRow = {
  wiki: string;
  totalEdits: number;
};

export type SummaryStats = {
  editsToday: number;
  editsThisWeek: number;
  activeWikisToday: number;
  botShareToday: number;
};
