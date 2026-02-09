"use client";

import { useState, useEffect } from "react";
import { PredictionCard } from "./PredictionCard";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useBetting } from "@/hooks/useBetting";
import { useAccount } from "wagmi";
import { useI18n } from "@/i18n";
import { useConfig } from "@/hooks/useConfig";
import type { GameWithOdds, AnalysisWithEdge } from "@/types";

interface AnalysisPanelProps {
  selectedGame: GameWithOdds | null;
  onAnalysisComplete?: (gameId: string, analysis: AnalysisWithEdge) => void;
}

export function AnalysisPanel({ selectedGame, onAnalysisComplete }: AnalysisPanelProps) {
  const { address } = useAccount();
  const { t, locale } = useI18n();
  const { hasPrivateKey } = useConfig();
  const { analysis, loading, error, analyze } = useAnalysis();
  const { placeBet, loading: betting } = useBetting();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    if (analysis && selectedGame && onAnalysisComplete) {
      onAnalysisComplete(selectedGame.game.gameId, analysis);
    }
  }, [analysis, selectedGame, onAnalysisComplete]);

  const handleAnalyze = async () => {
    if (!selectedGame) return;
    await analyze(selectedGame.game.gameId, locale);
    setHasAnalyzed(true);
  };

  const handlePlaceBet = async () => {
    if (!analysis) return;
    if (!address && !hasPrivateKey) return;
    await placeBet({
      analysisId: analysis.marketId,
      tokenId: analysis.tokenId,
      side: "BUY",
      outcome: analysis.recommendedOutcome,
      amount: 10,
      price: analysis.marketPrice,
    });
  };

  if (!selectedGame) {
    return (
      <div className="glass-card rounded-xl text-center py-16 px-6">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="1.5" className="mx-auto mb-4 opacity-30">
          <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
        </svg>
        <p className="text-muted-foreground text-sm">{t.markets.selectMarket}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hasAnalyzed && !loading && (
        <div className="glass-card rounded-xl text-center py-10 px-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="1.5" className="mx-auto mb-4">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
          <p className="text-muted-foreground mb-4 text-sm">
            {t.markets.readyToAnalyze} <span className="text-neon-orange">{selectedGame.game.awayTeam.teamName}</span> @ <span className="text-neon-cyan">{selectedGame.game.homeTeam.teamName}</span>
          </p>
          <button onClick={handleAnalyze} className="px-6 py-2.5 bg-gradient-to-r from-neon-cyan/90 to-neon-blue/90 text-white rounded-lg shadow-neon-cyan hover:shadow-neon-cyan-lg transition-all text-sm font-medium">
            {t.markets.runAnalysis}
          </button>
        </div>
      )}
      {loading && (
        <div className="glass-card rounded-xl text-center py-14 px-6 relative overflow-hidden">
          <div className="absolute inset-0 data-stream" />
          <div className="relative z-10">
            <div className="w-14 h-14 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin mx-auto" />
            <p className="text-neon-cyan mt-5 font-medium text-sm">{t.markets.aiAnalyzing}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{t.markets.aiAnalyzingHint}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="glass-card rounded-xl text-center py-10 px-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="mx-auto mb-3">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={handleAnalyze} className="mt-4 px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary/50 text-muted-foreground transition-colors">{t.common.retry}</button>
        </div>
      )}
      {analysis && (
        <>
          <PredictionCard analysis={analysis} onPlaceBet={handlePlaceBet} betting={betting} />
          {analysis.newsHighlights && analysis.newsHighlights.length > 0 && (
            <div className="glass-card rounded-xl p-4 border border-neon-cyan/10">
              <h4 className="text-xs font-medium text-neon-cyan/80 uppercase tracking-wider mb-2">{t.analysis.newsHighlights}</h4>
              <ul className="space-y-1.5">
                {analysis.newsHighlights.map((news, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-neon-cyan shrink-0">-</span>
                    <span>{news}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
