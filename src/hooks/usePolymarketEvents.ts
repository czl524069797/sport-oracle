"use client";

import { useState, useEffect, useCallback } from "react";
import type { PolymarketEvent, PolymarketMatch, MatchesResponse, ApiResponse } from "@/types";

export function usePolymarketEvents(category: "football" | "esports") {
  const [matches, setMatches] = useState<PolymarketMatch[]>([]);
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/${category}`);
      const data: ApiResponse<MatchesResponse> = await res.json();
      if (data.success && data.data) {
        setMatches(data.data.matches ?? []);
        setEvents(data.data.events ?? []);
      } else {
        setError(data.error ?? "Failed to fetch events");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { matches, events, loading, error, refresh: fetchEvents };
}
