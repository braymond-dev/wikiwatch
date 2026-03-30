"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type AutoRefreshProps = {
  intervalMs?: number;
};

function formatRelative(timestamp: number) {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 5) {
    return "just now";
  }
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  return `${diffMinutes}m ago`;
}

export function AutoRefresh({ intervalMs = 15000 }: AutoRefreshProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => Date.now());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      startTransition(() => {
        router.refresh();
        setLastUpdatedAt(Date.now());
      });
    };

    const intervalId = window.setInterval(refresh, intervalMs);
    const relativeClockId = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.clearInterval(relativeClockId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs, router]);

  return (
    <div
      className="glass-card"
      style={{
        padding: "12px 14px",
        borderRadius: 18,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        justifySelf: "start",
      }}
      aria-live="polite"
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: isPending ? "var(--accent-warm)" : "var(--accent)",
          boxShadow: isPending
            ? "0 0 0 6px rgba(255,179,107,0.14)"
            : "0 0 0 6px rgba(119,240,194,0.14)",
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 14 }}>
        {isPending ? "Refreshing live data..." : `Live updates on, last sync ${formatRelative(lastUpdatedAt)}`}
      </span>
      <span key={tick} style={{ display: "none" }} />
    </div>
  );
}

