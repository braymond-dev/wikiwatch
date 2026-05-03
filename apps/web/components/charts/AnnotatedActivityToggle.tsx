"use client";

import { useMemo, useState } from "react";

import { AnnotatedEditsChart } from "@/components/charts/AnnotatedMonthlyEditsChart";
import type { AnnotatedEditsData } from "@/lib/types";

type AnnotatedActivityToggleProps = {
  weekData: AnnotatedEditsData;
  monthData: AnnotatedEditsData;
};

type RangeKey = "week" | "month";

const RANGE_LABELS: Record<RangeKey, string> = {
  week: "Last 7 Days",
  month: "Last 30 Days",
};

export function AnnotatedActivityToggle({
  weekData,
  monthData,
}: AnnotatedActivityToggleProps) {
  const [selectedRange, setSelectedRange] = useState<RangeKey>("week");
  const [showAnnotations, setShowAnnotations] = useState(true);

  const activeData = useMemo(
    () => (selectedRange === "week" ? weekData : monthData),
    [monthData, selectedRange, weekData],
  );

  return (
    <div className="annotated-activity-shell">
      <div className="annotated-activity-controls">
        <div className="annotated-activity-toggle" role="tablist" aria-label="Annotated activity range">
          {(["week", "month"] as const).map((range) => (
            <button
              key={range}
              type="button"
              role="tab"
              aria-selected={selectedRange === range}
              className={`annotated-activity-toggle-button${
                selectedRange === range ? " annotated-activity-toggle-button-active" : ""
              }`}
              onClick={() => setSelectedRange(range)}
            >
              {RANGE_LABELS[range]}
            </button>
          ))}
        </div>
        <div className="annotated-activity-toggle" role="group" aria-label="Annotation visibility">
          <button
            type="button"
            className={`annotated-activity-toggle-button${
              showAnnotations ? " annotated-activity-toggle-button-active" : ""
            }`}
            onClick={() => setShowAnnotations(true)}
          >
            Annotations On
          </button>
          <button
            type="button"
            className={`annotated-activity-toggle-button${
              !showAnnotations ? " annotated-activity-toggle-button-active" : ""
            }`}
            onClick={() => setShowAnnotations(false)}
          >
            Annotations Off
          </button>
        </div>
      </div>
      <AnnotatedEditsChart data={activeData} showAnnotations={showAnnotations} />
    </div>
  );
}
