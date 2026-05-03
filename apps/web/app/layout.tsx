import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";

import { AppChrome } from "@/components/AppChrome";
import { LiveOverviewDataProvider } from "@/components/LiveOverviewDataProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "WikiWatch",
  description: "Real-time Wikipedia edit analytics dashboard powered by Wikimedia EventStreams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const shell = (
    <div className="page-shell app-shell">
      <AppChrome />
      <div className="app-content">{children}</div>
    </div>
  );

  return (
    <html lang="en">
      <body>
        <Suspense fallback={shell}>
          <LiveOverviewDataProvider>{shell}</LiveOverviewDataProvider>
        </Suspense>
      </body>
    </html>
  );
}
