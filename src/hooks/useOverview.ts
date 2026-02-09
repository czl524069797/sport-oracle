"use client";

import { useState, useEffect, useCallback } from "react";
import type { FuturesMarket, ApiResponse } from "@/types";

export function useOverview(category: "nba" | "football" | "esports") {
  const [markets, setMarkets] = useState<FuturesMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/overview?category=${category}`);
      const data: ApiResponse<{ category: string; markets: FuturesMarket[] }> = await res.json();
      if (data.success && data.data) {
        setMarkets(data.data.markets);
      } else {
        setError(data.error ?? "Failed to fetch overview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { markets, loading, error, refresh: fetchOverview };
}
