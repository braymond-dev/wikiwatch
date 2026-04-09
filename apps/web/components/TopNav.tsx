"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useSearchParams } from "next/navigation";

export function TopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = pathname === "/leaderboards" ? "leaderboards" : "home";
  const query = Object.fromEntries(searchParams.entries());
  const hasQuery = Object.keys(query).length > 0;
  const overviewHref = hasQuery
    ? { pathname: "/" as Route, query }
    : ("/" as Route);
  const leaderboardsHref = hasQuery
    ? { pathname: "/leaderboards" as Route, query }
    : ("/leaderboards" as Route);

  return (
    <nav className="top-nav">
      <Link
        href={overviewHref}
        className={`top-nav-link ${current === "home" ? "top-nav-link-active" : ""}`}
      >
        Overview
      </Link>
      <Link
        href={leaderboardsHref}
        className={`top-nav-link ${current === "leaderboards" ? "top-nav-link-active" : ""}`}
      >
        Leaderboards
      </Link>
    </nav>
  );
}
