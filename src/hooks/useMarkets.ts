"use client";

import { useState, useEffect, useCallback } from "react";
import type { GameWithOdds, MarketsResponse, ApiResponse } from "@/types";

export function useMarkets() {
  const [todayMarkets, setTodayMarkets] = useState<GameWithOdds[]>([]);
  const [tomorrowMarkets, setTomorrowMarkets] = useState<GameWithOdds[]>([]);
  const [allTodayFinished, setAllTodayFinished] = useState(false);
  const [labels, setLabels] = useState<{ todayLabel: string; tomorrowLabel: string }>({
    todayLabel: "",
    tomorrowLabel: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`/api/markets?tz=${encodeURIComponent(tz)}`);
      const data: ApiResponse<MarketsResponse> = await res.json();
      if (data.success && data.data) {
        setTodayMarkets(data.data.today);
        setTomorrowMarkets(data.data.tomorrow);
        setAllTodayFinished(data.data.allTodayFinished);
        setLabels(data.data.labels);
      } else {
        setError(data.error ?? "Failed to fetch markets");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return {
    todayMarkets,
    tomorrowMarkets,
    allTodayFinished,
    labels,
    loading,
    error,
    refresh: fetchMarkets,
  };
}
