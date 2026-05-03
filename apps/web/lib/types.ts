export type RangeKey = "day" | "week" | "month" | "year" | "all";

export type DashboardFilters = {
  wiki?: string;
  includeBots?: boolean;
};

export type TimeSeriesPoint = {
  bucket: string;
  totalEdits: number;
  botEdits: number;
  humanEdits: number;
  registeredEdits: number;
  tempAccountEdits: number;
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
  isTempAccount: boolean;
  comment: string | null;
};

export type EditorTypeRow = {
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

export type TrendingPageRow = {
  pageTitle: string;
  displayTitle?: string;
  wiki: string;
  currentEdits: number;
  previousEdits: number;
  deltaEdits: number;
  botEdits: number;
  humanEdits: number;
};

export type PeakAnnotation = {
  bucket: string;
  totalEdits: number;
  pages: TopPageRow[];
};

export type AnnotatedEditsData = {
  series: TimeSeriesPoint[];
  peaks: PeakAnnotation[];
};
