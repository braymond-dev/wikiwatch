"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function TopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = pathname === "/leaderboards" ? "leaderboards" : "home";
  const query = searchParams.toString();
  const overviewHref = query ? `/?${query}` : "/";
  const leaderboardsHref = query ? `/leaderboards?${query}` : "/leaderboards";

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
