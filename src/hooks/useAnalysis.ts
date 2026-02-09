"use client";

import { useState, useCallback } from "react";
import type { AnalysisWithEdge, ApiResponse } from "@/types";

export function useAnalysis() {
  const [analysis, setAnalysis] = useState<AnalysisWithEdge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (gameId: string, locale: string = "en") => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, locale }),
      });
      const data: ApiResponse<AnalysisWithEdge> = await res.json();
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
  }, []);

  return { analysis, loading, error, analyze };
}
