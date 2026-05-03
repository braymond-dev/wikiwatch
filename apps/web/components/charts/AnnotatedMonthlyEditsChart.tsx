"use client";

import { useEffect, useRef, useState } from "react";

import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";

import { buildWikiPageUrl } from "@/lib/wiki-links";
import type { AnnotatedEditsData, PeakAnnotation, TimeSeriesPoint } from "@/lib/types";

type AnnotatedEditsChartProps = {
  data: AnnotatedEditsData;
  showAnnotations?: boolean;
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

export function AnnotatedEditsChart({
  data,
  showAnnotations = true,
}: AnnotatedEditsChartProps) {
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

  const peakData: PeakPoint[] = showAnnotations
    ? data.peaks.map((peak) => ({
        bucket: peak.bucket,
        totalEdits: peak.totalEdits,
        pages: peak.pages,
      }))
    : [];
  const seriesMax = data.series.reduce((max, point) => Math.max(max, point.totalEdits), 0);
  const yDomainMax = withChartHeadroom(seriesMax);

  return (
    <div className="chart-shell chart-shell-tall annotated-chart-stack" ref={shellRef}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data.series} margin={CHART_MARGIN}>
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
            domain={[0, yDomainMax]}
          />
          <Legend />
          <ReferenceLine y={0} stroke="rgba(175,214,255,0.12)" />
          <Line
            type="monotone"
            dataKey="totalEdits"
            stroke="#77f0c2"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: "#77f0c2", stroke: "#07111f", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="registeredEdits"
            stroke="#7fc2ff"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="tempAccountEdits"
            stroke="#f08ae8"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="botEdits"
            stroke="#ffb36b"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      {showAnnotations ? (
        <div className="annotated-chart-overlay" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.series} margin={CHART_MARGIN}>
              <XAxis dataKey="bucket" hide />
              <YAxis domain={[0, yDomainMax]} hide />
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
      ) : null}
    </div>
  );
}
