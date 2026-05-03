"use client";

import { useEffect, useRef, useState } from "react";

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
import { buildWikiPageUrl } from "@/lib/wiki-links";
import type { AnnotatedMonthlyEdits, PeakAnnotation, TimeSeriesPoint } from "@/lib/types";

type AnnotatedMonthlyEditsChartProps = {
  data: AnnotatedMonthlyEdits;
};

type PeakPoint = {
  bucket: string;
  totalEdits: number;
  pages: PeakAnnotation["pages"];
};

const BUBBLE_WIDTH = 236;
const BUBBLE_HORIZONTAL_PADDING = 14;
const CHART_MARGIN = { top: 92, right: 88, left: 88, bottom: 12 };

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return `${value}`;
}

function withChartHeadroom(value: number) {
  if (value <= 0) {
    return 0;
  }

  return Math.ceil(value * 1.18);
}

function formatBucketLabel(bucket: string) {
  const date = new Date(bucket);
  const hasTimeComponent = !bucket.endsWith("T00:00:00Z");

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(hasTimeComponent
      ? {
          hour: "numeric" as const,
          minute: "2-digit" as const,
          hour12: true,
        }
      : {}),
    timeZone: "UTC",
  });
}

function formatAxisTick(bucket: string) {
  return new Date(bucket).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function PeakBubble({
  cx,
  cy,
  payload,
  chartWidth,
}: {
  cx?: number;
  cy?: number;
  payload?: PeakPoint;
  chartWidth: number;
}) {
  if (!payload || cx == null || cy == null) {
    return null;
  }

  const lines = payload.pages.map((page) => ({
    label: page.displayTitle ?? page.pageTitle,
    href: buildWikiPageUrl(page.wiki, page.pageTitle),
  }));
  const bubbleHeight = 52 + lines.length * 16;
  const proposedX = cx - BUBBLE_WIDTH / 2;
  const bubbleX =
    chartWidth > 0
      ? Math.max(
          BUBBLE_HORIZONTAL_PADDING,
          Math.min(
            proposedX,
            chartWidth - BUBBLE_WIDTH - BUBBLE_HORIZONTAL_PADDING,
          ),
        )
      : proposedX;
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
        width={BUBBLE_WIDTH}
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
      {lines.map((line, index) => {
        const label = line.label.length > 28 ? `${line.label.slice(0, 28)}...` : line.label;
        const textNode = (
          <text
            x={bubbleX + 14}
            y={bubbleY + 40 + index * 16}
            fill="#eff7ff"
            fontSize="12"
            fontWeight={index === 0 ? "700" : "500"}
            style={line.href ? { cursor: "pointer", textDecoration: "underline" } : undefined}
          >
            {label}
          </text>
        );

        return line.href ? (
          <a
            key={`${payload.bucket}-${line.label}-${index}`}
            href={line.href}
            target="_blank"
            rel="noreferrer"
          >
            {textNode}
          </a>
        ) : (
          <g key={`${payload.bucket}-${line.label}-${index}`}>{textNode}</g>
        );
      })}
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
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    const updateWidth = () => {
      setChartWidth(shell.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });
    observer.observe(shell);

    return () => {
      observer.disconnect();
    };
  }, []);

  const peakData: PeakPoint[] = data.peaks.map((peak) => ({
    bucket: peak.bucket,
    totalEdits: peak.totalEdits,
    pages: peak.pages,
  }));

  return (
    <div className="chart-shell chart-shell-tall" ref={shellRef}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data.series}
          margin={CHART_MARGIN}
        >
          <CartesianGrid stroke="rgba(175,214,255,0.08)" vertical={false} />
          <XAxis
            dataKey="bucket"
            stroke="#99abc2"
            tickLine={false}
            minTickGap={28}
            tickFormatter={formatAxisTick}
          />
          <YAxis
            stroke="#99abc2"
            tickLine={false}
            width={58}
            tickFormatter={formatCompactNumber}
            domain={[0, (max: number) => withChartHeadroom(max)]}
          />
          <Tooltip content={<MonthlyTooltip />} />
          <ReferenceLine y={0} stroke="rgba(175,214,255,0.12)" />
          <Line
            type="linear"
            dataKey="totalEdits"
            stroke="#77f0c2"
            strokeWidth={3}
            dot={{
              r: 2.5,
              fill: "#77f0c2",
              stroke: "rgba(7,17,31,0.9)",
              strokeWidth: 1.5,
            }}
            activeDot={{ r: 6, fill: "#77f0c2", stroke: "#07111f", strokeWidth: 2 }}
          />
          <Scatter
            data={peakData}
            dataKey="totalEdits"
            shape={(props: { cx?: number; cy?: number; payload?: PeakPoint }) => (
              <PeakBubble {...props} chartWidth={chartWidth} />
            )}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
