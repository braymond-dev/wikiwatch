"use client";

import { useEffect, useState } from "react";

import { Filters } from "@/components/Filters";

type AvailableWikisResponse = {
  data?: {
    wikis?: string[];
  };
};

export function FiltersShell() {
  const [availableWikis, setAvailableWikis] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadAvailableWikis() {
      try {
        const response = await fetch("/api/available-wikis", {
          cache: "no-store",
        });
        const payload = (await response.json()) as AvailableWikisResponse;

        if (!isCancelled) {
          setAvailableWikis(payload.data?.wikis ?? []);
        }
      } catch {
        if (!isCancelled) {
          setAvailableWikis([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      }
    }

    loadAvailableWikis();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <Filters availableWikis={availableWikis} />
      {!isLoaded ? (
        <div
          className="filters-loading-note"
          style={{
            position: "absolute",
            right: 16,
            bottom: 14,
          }}
        >
          Loading wikis...
        </div>
      ) : null}
    </div>
  );
}
