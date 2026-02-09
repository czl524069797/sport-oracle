"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPercent } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { useConfig } from "@/hooks/useConfig";
import { useAccount } from "wagmi";
import type { AnalysisWithEdge } from "@/types";

interface PredictionCardProps {
  analysis: AnalysisWithEdge;
  onPlaceBet: () => void;
  betting: boolean;
}

export function PredictionCard({ analysis, onPlaceBet, betting }: PredictionCardProps) {
  const { t } = useI18n();
  const { address } = useAccount();
  const { hasPrivateKey } = useConfig();
  const edgeColor = analysis.edgePercent > 0.1 ? "text-neon-green" : analysis.edgePercent > 0.05 ? "text-neon-orange" : "text-red-400";
  const edgeGlow = analysis.edgePercent > 0.1 ? "glow-green" : analysis.edgePercent > 0.05 ? "glow-orange" : "";

  const canBet = !!address || hasPrivateKey;

  return (
    <Card className="relative overflow-hidden border-neon-cyan/20">
      {/* Animated top border */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple" />

      {/* Scan line effect */}
      <div className="absolute inset-0 scan-line pointer-events-none opacity-30" />

      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            {t.analysis.title}
          </CardTitle>
          <Badge variant={analysis.confidence > 0.7 ? "success" : "warning"}>
            {t.analysis.confidence}: {formatPercent(analysis.confidence)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <span className="text-neon-orange">{analysis.awayTeam}</span>
          <span className="text-xs">@</span>
          <span className="text-neon-cyan">{analysis.homeTeam}</span>
          <span className="mx-1 text-border">|</span>
          {new Date(analysis.gameDate).toLocaleDateString()}
        </p>
      </CardHeader>

      <CardContent className="space-y-5 relative">
        {/* Confidence Explanation */}
        {analysis.confidenceExplanation && (
          <div className="p-3 rounded-lg border border-neon-cyan/10 bg-neon-cyan/[0.03]">
            <h4 className="text-xs font-medium text-neon-cyan/80 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              {t.analysis.confidenceExplanation}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{analysis.confidenceExplanation}</p>
          </div>
        )}

        {/* Moneyline */}
        <div>
          <h4 className="text-xs font-medium text-neon-cyan/80 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-4 h-px bg-neon-cyan/40" />
            {t.analysis.moneyline}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 rounded-lg border border-neon-cyan/15 bg-neon-cyan/5">
              <p className="text-xs text-muted-foreground mb-1">{analysis.homeTeam}</p>
              <p className="text-2xl font-bold text-neon-cyan text-glow-cyan">{formatPercent(analysis.homeWinProbability)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{t.analysis.aiWinProb}</p>
              <div className="neon-progress mt-2">
                <div className="neon-progress-bar" style={{ width: `${Math.round(analysis.homeWinProbability * 100)}%` }} />
              </div>
            </div>
            <div className="text-center p-4 rounded-lg border border-neon-orange/15 bg-neon-orange/5">
              <p className="text-xs text-muted-foreground mb-1">{analysis.awayTeam}</p>
              <p className="text-2xl font-bold text-neon-orange text-glow-orange">{formatPercent(analysis.awayWinProbability)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{t.analysis.aiWinProb}</p>
              <div className="neon-progress mt-2">
                <div className="h-full rounded-sm bg-gradient-to-r from-neon-orange to-amber-500" style={{ width: `${Math.round(analysis.awayWinProbability * 100)}%`, boxShadow: "0 0 8px rgba(249, 115, 22, 0.5)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Spread */}
        {analysis.spreadAnalysis && (
          <div>
            <h4 className="text-xs font-medium text-neon-purple/80 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-4 h-px bg-neon-purple/40" />
              {t.analysis.spread}
            </h4>
            <div className="p-4 rounded-lg border border-neon-purple/15 bg-neon-purple/5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t.analysis.favored}: <strong className="text-neon-purple">{analysis.spreadAnalysis.favoredTeam === "home" ? analysis.homeTeam : analysis.awayTeam}</strong>
                </span>
                <span className="text-xl font-bold text-neon-purple text-glow-cyan">
                  {analysis.spreadAnalysis.spreadValue > 0 ? "-" : "+"}{Math.abs(analysis.spreadAnalysis.spreadValue).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                <span>{t.analysis.cover}: <span className="text-neon-purple">{analysis.spreadAnalysis.coverRecommendation}</span></span>
                <span>{t.analysis.confidence}: <span className="text-neon-purple">{formatPercent(analysis.spreadAnalysis.spreadConfidence)}</span></span>
              </div>
            </div>
          </div>
        )}

        {/* Over/Under */}
        {analysis.totalPointsAnalysis && (
          <div>
            <h4 className="text-xs font-medium text-neon-orange/80 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-4 h-px bg-neon-orange/40" />
              {t.analysis.overUnder}
            </h4>
            <div className="p-4 rounded-lg border border-neon-orange/15 bg-neon-orange/5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t.analysis.predictedTotal}: <strong className="text-neon-orange text-lg">{analysis.totalPointsAnalysis.predictedTotal.toFixed(1)}</strong>
                </span>
                <Badge variant={analysis.totalPointsAnalysis.recommendation === "over" ? "success" : "warning"}>
                  {analysis.totalPointsAnalysis.recommendation === "over" ? t.analysis.over : t.analysis.under}
                </Badge>
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                <span>{t.analysis.ouLine}: <span className="text-neon-orange">{analysis.totalPointsAnalysis.overUnderLine.toFixed(1)}</span></span>
                <span>
                  <span className="text-neon-green">{t.analysis.over}: {formatPercent(analysis.totalPointsAnalysis.overProbability)}</span>
                  <span className="mx-1 text-border">|</span>
                  <span className="text-neon-orange">{t.analysis.under}: {formatPercent(analysis.totalPointsAnalysis.underProbability)}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Edge */}
        <div className={`p-4 rounded-lg border border-border bg-secondary/30 ${edgeGlow}`}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neon-cyan">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
              </svg>
              {t.analysis.marketEdge}
            </span>
            <span className={`text-xl font-bold ${edgeColor}`}>{formatPercent(analysis.edgePercent)}</span>
          </div>
          {analysis.recommendedSide !== "none" && (
            <p className="text-sm mt-2 text-muted-foreground">
              {t.analysis.recommendation}: <strong className="text-neon-cyan">{t.analysis.buy} {analysis.recommendedSide === "home" ? analysis.homeTeam : analysis.awayTeam}</strong> @ <span className="text-foreground">{formatPercent(analysis.marketPrice)}</span>
            </p>
          )}
        </div>

        {/* Key Factors */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-4 h-px bg-border" />
            {t.analysis.keyFactors}
          </h4>
          <ul className="space-y-1.5">
            {analysis.keyFactors.map((factor, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-neon-cyan shrink-0">-</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>

        {/* Reasoning */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-4 h-px bg-border" />
            {t.analysis.aiReasoning}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{analysis.reasoning}</p>
        </div>
      </CardContent>

      <CardFooter>
        {analysis.recommendedSide !== "none" ? (
          <Button className="w-full" onClick={onPlaceBet} disabled={betting || !canBet}>
            {betting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t.analysis.placingBet}
              </span>
            ) : hasPrivateKey && !address ? (
              `${t.analysis.directBet} - ${analysis.recommendedSide === "home" ? analysis.homeTeam : analysis.awayTeam}`
            ) : canBet ? (
              `${t.analysis.placeBet} - ${analysis.recommendedSide === "home" ? analysis.homeTeam : analysis.awayTeam}`
            ) : (
              t.common.connectWallet
            )}
          </Button>
        ) : (
          <Button className="w-full" variant="secondary" disabled>{t.analysis.noEdge}</Button>
        )}
      </CardFooter>
    </Card>
  );
}
