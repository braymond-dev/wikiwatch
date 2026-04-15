"use client";

import { Suspense } from "react";

import { AutoRefresh } from "@/components/AutoRefresh";
import { FiltersShell } from "@/components/FiltersShell";
import { HeroStats } from "@/components/HeroStats";
import { TopNav } from "@/components/TopNav";

export function AppChrome() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "WikiWatch";

  return (
    <section
      style={{
        display: "grid",
        gap: 24,
      }}
    >
      <div
        className="glass-card"
        style={{
          borderRadius: 28,
          padding: "28px clamp(20px, 4vw, 40px)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "auto -60px -80px auto",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(119,240,194,0.32), transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div className="eyebrow">Live Wikimedia Analytics</div>
        <div style={{ marginTop: 14 }}>
          <AutoRefresh intervalMs={60000} />
        </div>
        <div style={{ marginTop: 16, marginBottom: 18 }}>
          <Suspense fallback={<HeaderNavFallback />}>
            <TopNav />
          </Suspense>
        </div>
        <div
          className="hero-grid"
          style={{
            marginTop: 16,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display), sans-serif",
                fontSize: "clamp(2.6rem, 6vw, 4.8rem)",
                lineHeight: 0.96,
                letterSpacing: "-0.04em",
              }}
            >
              {appName}
            </h1>
            <p
              className="muted"
              style={{
                margin: "14px 0 0",
                maxWidth: 720,
                fontSize: "clamp(1rem, 1.8vw, 1.15rem)",
                lineHeight: 1.7,
              }}
            >
              Track the most edited Wikipedia pages across multiple time windows,
              compare human and bot activity, and watch the stream update from
              Wikimedia EventStreams in near real time.
            </p>
          </div>
          <Suspense fallback={<FiltersFallback />}>
            <FiltersShell />
          </Suspense>
        </div>
        <Suspense fallback={<HeroStatsFallback />}>
          <HeroStats />
        </Suspense>
      </div>
    </section>
  );
}

function HeaderNavFallback() {
  return (
    <nav className="top-nav">
      <span className="top-nav-link top-nav-link-active">Overview</span>
      <span className="top-nav-link">Leaderboards</span>
    </nav>
  );
}

function FiltersFallback() {
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
        <div className="filters-fallback-line" />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontSize: 13, color: "var(--muted)" }}>Bot Activity</label>
        <div className="filters-fallback-line" />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div className="filters-fallback-button filters-fallback-button-primary" />
        <div className="filters-fallback-button" />
      </div>
    </div>
  );
}

function HeroStatsFallback() {
  return (
    <div className="hero-stats-wrap">
      <div className="hero-stats-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="glass-card"
            style={{
              padding: 16,
              borderRadius: 22,
            }}
          >
            <div className="filters-fallback-line" style={{ height: 12, marginBottom: 10 }} />
            <div className="filters-fallback-line" style={{ height: 10, marginBottom: 14 }} />
            <div className="filters-fallback-line" style={{ height: 34 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
