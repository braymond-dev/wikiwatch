"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useState, useTransition } from "react";

type FiltersProps = {
  availableWikis: string[];
};

export function Filters({ availableWikis }: FiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [wiki, setWiki] = useState(searchParams.get("wiki") ?? "");
  const [includeBots, setIncludeBots] = useState(
    searchParams.get("includeBots") ?? "true",
  );

  useEffect(() => {
    setWiki(searchParams.get("wiki") ?? "");
    setIncludeBots(searchParams.get("includeBots") ?? "true");
  }, [searchParams]);

  function apply() {
    const next = new URLSearchParams(searchParams.toString());
    if (wiki) {
      next.set("wiki", wiki);
    } else {
      next.delete("wiki");
    }
    if (includeBots !== "true") {
      next.set("includeBots", includeBots);
    } else {
      next.delete("includeBots");
    }
    startTransition(() => {
      router.push(`/?${next.toString()}`);
    });
  }

  function reset() {
    startTransition(() => {
      router.push("/");
    });
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: 18,
        borderRadius: 22,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontSize: 13, color: "var(--muted)" }}>Wiki Project</label>
        <select
          value={wiki}
          onChange={(event) => setWiki(event.target.value)}
          style={selectStyle}
        >
          <option value="">All wikis</option>
          {availableWikis.map((wikiName) => (
            <option key={wikiName} value={wikiName}>
              {wikiName}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontSize: 13, color: "var(--muted)" }}>Bot Activity</label>
        <select
          value={includeBots}
          onChange={(event) => setIncludeBots(event.target.value)}
          style={selectStyle}
        >
          <option value="true">Include bots</option>
          <option value="false">Exclude bots</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={apply} style={primaryButton} disabled={isPending}>
          {isPending ? "Updating..." : "Apply filters"}
        </button>
        <button onClick={reset} style={secondaryButton} disabled={isPending}>
          Reset
        </button>
      </div>
    </div>
  );
}

const selectStyle: CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(175,214,255,0.16)",
  background: "rgba(5, 11, 21, 0.5)",
  color: "var(--text)",
  padding: "12px 14px",
};

const primaryButton: CSSProperties = {
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, var(--accent), var(--accent-strong))",
  color: "#032018",
  padding: "11px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton: CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(175,214,255,0.16)",
  background: "rgba(9, 18, 31, 0.55)",
  color: "var(--text)",
  padding: "11px 16px",
  fontWeight: 600,
  cursor: "pointer",
};
