import Link from "next/link";

type TopNavProps = {
  current: "home" | "leaderboards";
};

export function TopNav({ current }: TopNavProps) {
  return (
    <nav className="top-nav">
      <Link
        href="/"
        className={`top-nav-link ${current === "home" ? "top-nav-link-active" : ""}`}
      >
        Overview
      </Link>
      <Link
        href="/leaderboards"
        className={`top-nav-link ${current === "leaderboards" ? "top-nav-link-active" : ""}`}
      >
        Leaderboards
      </Link>
    </nav>
  );
}
