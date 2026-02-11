"use client";

import { useState, useCallback } from "react";
import type { MatchAnalysisWithEdge, ApiResponse, PolymarketMatch } from "@/types";

export function useMatchAnalysis() {
  const [analysis, setAnalysis] = useState<MatchAnalysisWithEdge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (match: PolymarketMatch, category: "football" | "esports", locale: string = "en") => {
      setLoading(true);
      setError(null);
      setAnalysis(null);

      try {
        const res = await fetch("/api/match-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ match, category, locale }),
        });

        const data: ApiResponse<MatchAnalysisWithEdge> = await res.json();

        if (data.success && data.data) {
          setAnalysis(data.data);
        } else {
          setError(data.error ?? "Analysis failed");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setLoading(false);
  }, []);

  return { analysis, loading, error, analyze, reset };
}
