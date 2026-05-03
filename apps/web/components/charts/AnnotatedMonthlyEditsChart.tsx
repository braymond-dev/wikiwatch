"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { tooltipTheme } from "@/components/charts/tooltip-theme";
import type { AnnotatedMonthlyEdits, PeakAnnotation, TimeSeriesPoint } from "@/lib/types";

type AnnotatedMonthlyEditsChartProps = {
  data: AnnotatedMonthlyEdits;
};

type PeakPoint = {
  bucket: string;
  totalEdits: number;
  pages: PeakAnnotation["pages"];
};

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return `${value}`;
}

function formatBucketLabel(bucket: string) {
  return new Date(`${bucket}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function PeakBubble({
  cx,
  cy,
  payload,
}: {
  cx?: number;
  cy?: number;
  payload?: PeakPoint;
}) {
  if (!payload || cx == null || cy == null) {
    return null;
  }

  const lines = payload.pages.map((page) => page.displayTitle ?? page.pageTitle);
  const bubbleWidth = 188;
  const bubbleHeight = 52 + lines.length * 16;
  const bubbleX = cx - bubbleWidth / 2;
  const bubbleY = Math.max(8, cy - bubbleHeight - 22);
  const stemTop = bubbleY + bubbleHeight;

  return (
    <g>
      <line
        x1={cx}
        y1={cy - 4}
        x2={cx}
        y2={stemTop}
        stroke="rgba(127,194,255,0.45)"
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
      <circle
        cx={cx}
        cy={cy}
        r={5.5}
        fill="#77f0c2"
        stroke="rgba(5,11,21,0.9)"
        strokeWidth={2}
      />
      <rect
        x={bubbleX}
        y={bubbleY}
        width={bubbleWidth}
        height={bubbleHeight}
        rx={16}
        fill="rgba(5,11,21,0.92)"
        stroke="rgba(175,214,255,0.16)"
      />
      <text
        x={bubbleX + 14}
        y={bubbleY + 20}
        fill="#99abc2"
        fontSize="11"
        fontWeight="600"
      >
        {formatBucketLabel(payload.bucket)} · {formatCompactNumber(payload.totalEdits)}
      </text>
      {lines.map((line, index) => (
        <text
          key={`${payload.bucket}-${line}-${index}`}
          x={bubbleX + 14}
          y={bubbleY + 40 + index * 16}
          fill="#eff7ff"
          fontSize="12"
          fontWeight={index === 0 ? "700" : "500"}
        >
          {line.length > 28 ? `${line.slice(0, 28)}...` : line}
        </text>
      ))}
    </g>
  );
}

function MonthlyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: TimeSeriesPoint | PeakPoint }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0 || !label) {
    return null;
  }

  const point = payload[0]?.payload as TimeSeriesPoint | undefined;
  const maybePeak = payload.find(
    (entry) => "pages" in entry.payload,
  )?.payload as PeakPoint | undefined;

  if (!point) {
    return null;
  }

  return (
    <div style={tooltipTheme.contentStyle}>
      <div style={{ ...tooltipTheme.labelStyle, marginBottom: 8 }}>
        {formatBucketLabel(label)}
      </div>
      <div style={{ fontWeight: 700, marginBottom: maybePeak ? 10 : 0 }}>
        {formatCompactNumber(point.totalEdits)} edits
      </div>
      {maybePeak ? (
        <div style={{ display: "grid", gap: 6 }}>
          {maybePeak.pages.map((page) => (
            <div key={`${page.wiki}:${page.pageTitle}`}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {page.displayTitle ?? page.pageTitle}
              </div>
              <div style={{ color: "#99abc2", fontSize: 12 }}>
                {page.wiki} · {formatCompactNumber(page.editCount)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AnnotatedMonthlyEditsChart({
  data,
}: AnnotatedMonthlyEditsChartProps) {
  const peakData: PeakPoint[] = data.peaks.map((peak) => ({
    bucket: peak.bucket,
    totalEdits: peak.totalEdits,
    pages: peak.pages,
  }));

  return (
    <div className="chart-shell chart-shell-tall">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data.series}
          margin={{ top: 76, right: 24, left: 8, bottom: 8 }}
        >
          <CartesianGrid stroke="rgba(175,214,255,0.08)" vertical={false} />
          <XAxis dataKey="bucket" stroke="#99abc2" tickLine={false} minTickGap={28} />
          <YAxis
            stroke="#99abc2"
            tickLine={false}
            width={58}
            tickFormatter={formatCompactNumber}
          />
          <Tooltip content={<MonthlyTooltip />} />
          <ReferenceLine y={0} stroke="rgba(175,214,255,0.12)" />
          <Line
            type="monotone"
            dataKey="totalEdits"
            stroke="#77f0c2"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: "#77f0c2", stroke: "#07111f", strokeWidth: 2 }}
          />
          <Scatter data={peakData} shape={<PeakBubble />} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
