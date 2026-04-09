import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppChrome } from "@/components/AppChrome";

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
  return (
    <html lang="en">
      <body>
        <div className="page-shell app-shell">
          <AppChrome />
          <div className="app-content">{children}</div>
        </div>
      </body>
    </html>
  );
}
