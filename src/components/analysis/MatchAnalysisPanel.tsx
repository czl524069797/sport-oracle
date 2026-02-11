"use client";

import { useState, useCallback, useEffect } from "react";
import { useI18n } from "@/i18n";
import { useMatchAnalysis } from "@/hooks/useMatchAnalysis";
import { MatchAnalysisCard } from "./MatchAnalysisCard";
import type { PolymarketMatch, MatchAnalysisWithEdge } from "@/types";

interface MatchAnalysisPanelProps {
  match: PolymarketMatch;
  theme: "football" | "esports";
  isOpen: boolean;
  onClose: () => void;
}

export function MatchAnalysisPanel({ match, theme, isOpen, onClose }: MatchAnalysisPanelProps) {
  const { t, locale } = useI18n();
  const { analysis, loading, error, analyze, reset } = useMatchAnalysis();
  const [hasTriggered, setHasTriggered] = useState(false);

  // Auto-trigger analysis when panel opens
  useEffect(() => {
    if (isOpen && !hasTriggered && !loading && !analysis) {
      setHasTriggered(true);
      analyze(match, theme, locale);
    }
  }, [isOpen, hasTriggered, loading, analysis, analyze, match, theme, locale]);

  // Reset when panel closes
  useEffect(() => {
    if (!isOpen) {
      setHasTriggered(false);
      reset();
    }
  }, [isOpen, reset]);

  const handleRetry = useCallback(() => {
    analyze(match, theme, locale);
  }, [analyze, match, theme, locale]);

  if (!isOpen) return null;

  const themeColors = {
    football: {
      overlay: "bg-emerald-950/20",
      border: "border-emerald-500/30",
      spinner: "border-emerald-500",
    },
    esports: {
      overlay: "bg-violet-950/20",
      border: "border-violet-500/30",
      spinner: "border-violet-500",
    },
  };

  const cfg = themeColors[theme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${cfg.overlay} backdrop-blur-sm`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-lg max-h-[85vh] overflow-y-auto glass-card rounded-2xl border ${cfg.border} shadow-2xl`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border/50 bg-background/95 backdrop-blur-sm rounded-t-2xl">
          <h2 className="text-base font-semibold text-foreground">
            {theme === "football"
              ? t.footballAnalysis?.title ?? "AI Football Analysis"
              : t.esportsAnalysis?.title ?? "AI Esports Analysis"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Match info */}
          <div className="mb-4 text-center">
            <p className="text-sm font-medium text-foreground">
              {match.homeTeam} vs {match.awayTeam}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {match.event.title}
            </p>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div
                className={`w-10 h-10 border-2 ${cfg.spinner} border-t-transparent rounded-full animate-spin mb-4`}
              />
              <p className="text-sm text-muted-foreground">
                {t.matchAnalysis?.analyzing ?? "AI is analyzing the match..."}
              </p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-sm text-red-400 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {t.common?.retry ?? "Retry"}
              </button>
            </div>
          )}

          {/* Analysis result */}
          {analysis && !loading && (
            <MatchAnalysisCard analysis={analysis} theme={theme} />
          )}
        </div>
      </div>
    </div>
  );
}
