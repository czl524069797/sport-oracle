"use client";

import { useState, useEffect, useCallback } from "react";
import type { EsportsGameKey, FuturesMarket, ApiResponse } from "@/types";
import { readApiResponse } from "@/lib/api-response";

export function useOverview(category: "nba" | "football" | "esports", esportsGame?: EsportsGameKey) {
  const [markets, setMarkets] = useState<FuturesMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ category });
      if (category === "esports" && esportsGame) params.set("game", esportsGame);
      const res = await fetch(`/api/overview?${params.toString()}`);
      const data: ApiResponse<{ category: string; markets: FuturesMarket[] }> = await readApiResponse(res);
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
  }, [category, esportsGame]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { markets, loading, error, refresh: fetchOverview };
}
