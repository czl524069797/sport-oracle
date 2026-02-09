"use client";

import { useState, useCallback } from "react";
import { MarketList } from "@/components/markets/MarketList";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { SeasonOverview } from "@/components/events/SeasonOverview";
import { useMarkets } from "@/hooks/useMarkets";
import { useOverview } from "@/hooks/useOverview";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import type { GameWithOdds, GameAnalysisSummary, AnalysisWithEdge } from "@/types";

export default function MarketsPage() {
  const { todayMarkets, tomorrowMarkets, allTodayFinished, labels, loading, error, refresh } = useMarkets();
  const { markets: overviewMarkets, loading: overviewLoading, error: overviewError } = useOverview("nba");
  const { t } = useI18n();
  const [selectedGame, setSelectedGame] = useState<GameWithOdds | null>(null);
  const [analyzingGameId, setAnalyzingGameId] = useState<string | null>(null);
  const [analysisMap, setAnalysisMap] = useState<Record<string, GameAnalysisSummary>>({});

  const handleAnalyze = (gameId: string) => {
    const allGames = [...todayMarkets, ...tomorrowMarkets];
    const found = allGames.find((m) => m.game.gameId === gameId);
    if (found) { setSelectedGame(found); setAnalyzingGameId(gameId); }
  };

  const handleAnalysisComplete = useCallback((gameId: string, analysis: AnalysisWithEdge) => {
    setAnalysisMap((prev) => ({
      ...prev,
      [gameId]: {
        homeWinProbability: analysis.homeWinProbability,
        awayWinProbability: analysis.awayWinProbability,
        predictedTotal: analysis.totalPointsAnalysis.predictedTotal,
        overProbability: analysis.totalPointsAnalysis.overProbability,
        underProbability: analysis.totalPointsAnalysis.underProbability,
        newsHighlights: analysis.newsHighlights,
      },
    }));
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-neon-cyan to-neon-blue" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t.markets.title}</h1>
            <p className="text-muted-foreground mt-0.5">{t.markets.subtitle}</p>
          </div>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
              {t.markets.refreshing}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
              {t.markets.refresh}
            </span>
          )}
        </Button>
      </div>

      {/* Season Overview */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-neon-cyan to-neon-blue" />
          <h2 className="text-lg font-semibold text-foreground">{t.overview.seasonTitle}</h2>
          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{t.overview.futures}</span>
        </div>
        <SeasonOverview markets={overviewMarkets} loading={overviewLoading} error={overviewError} theme="nba" />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
        <span className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan/40" />
          {t.overview.dailyMatches}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
      </div>

      {/* Today/Tomorrow Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <MarketList todayMarkets={todayMarkets} tomorrowMarkets={tomorrowMarkets} allTodayFinished={allTodayFinished}
            loading={loading} error={error} onAnalyze={handleAnalyze} analyzingGameId={analyzingGameId} analysisMap={analysisMap} labels={labels} />
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-neon-cyan to-neon-purple" />
              <h2 className="text-lg font-semibold text-foreground">{t.markets.analysis}</h2>
            </div>
            <AnalysisPanel selectedGame={selectedGame} onAnalysisComplete={handleAnalysisComplete} />
          </div>
        </div>
      </div>
    </div>
  );
}
