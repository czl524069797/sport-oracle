"use client";

import { useI18n } from "@/i18n";
import type { MatchAnalysisWithEdge } from "@/types";

interface MatchAnalysisCardProps {
  analysis: MatchAnalysisWithEdge;
  theme: "football" | "esports";
}

const themeConfig = {
  football: {
    accentColor: "text-emerald-400",
    secondaryAccent: "text-amber-400",
    drawColor: "text-slate-300",
    progressBg: "bg-gradient-to-r from-emerald-500 to-green-400",
    secondaryProgressBg: "bg-gradient-to-r from-amber-500 to-orange-400",
    drawProgressBg: "bg-gradient-to-r from-slate-400 to-slate-500",
    cardBorder: "border-emerald-500/20",
    tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  esports: {
    accentColor: "text-violet-400",
    secondaryAccent: "text-rose-400",
    drawColor: "text-slate-300",
    progressBg: "bg-gradient-to-r from-violet-500 to-purple-400",
    secondaryProgressBg: "bg-gradient-to-r from-rose-500 to-pink-400",
    drawProgressBg: "bg-gradient-to-r from-slate-400 to-slate-500",
    cardBorder: "border-violet-500/20",
    tagColor: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  },
};

export function MatchAnalysisCard({ analysis, theme }: MatchAnalysisCardProps) {
  const { t } = useI18n();
  const cfg = themeConfig[theme];

  const homePct = Math.round(analysis.homeWinProbability * 100);
  const awayPct = Math.round(analysis.awayWinProbability * 100);
  const drawPct = analysis.drawProbability
    ? Math.round(analysis.drawProbability * 100)
    : null;
  const confidencePct = Math.round(analysis.confidence * 100);
  const edgePct = Math.round(analysis.edgePercent * 100);

  const isFootball = theme === "football";

  return (
    <div className={`glass-card rounded-xl p-5 border ${cfg.cardBorder}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          {isFootball
            ? t.matchAnalysis?.title ?? "AI Football Analysis"
            : t.matchAnalysis?.title ?? "AI Esports Analysis"}
        </h3>
        <div className={`px-2 py-1 rounded-md text-xs font-medium border ${cfg.tagColor}`}>
          {t.matchAnalysis?.confidence ?? "Confidence"}: {confidencePct}%
        </div>
      </div>

      {/* Probabilities */}
      <div className="space-y-3 mb-4">
        {/* Home Win */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${cfg.accentColor}`}>
              {analysis.homeTeam}
            </span>
            <span className={`text-xs font-bold ${cfg.accentColor}`}>{homePct}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
            <div
              className={`h-full rounded-full ${cfg.progressBg}`}
              style={{ width: `${homePct}%` }}
            />
          </div>
        </div>

        {/* Draw (Football only) */}
        {isFootball && drawPct !== null && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-medium ${cfg.drawColor}`}>
                {t.events?.draw ?? "Draw"}
              </span>
              <span className={`text-xs font-bold ${cfg.drawColor}`}>{drawPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
              <div
                className={`h-full rounded-full ${cfg.drawProgressBg}`}
                style={{ width: `${drawPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Away Win */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium ${cfg.secondaryAccent}`}>
              {analysis.awayTeam}
            </span>
            <span className={`text-xs font-bold ${cfg.secondaryAccent}`}>{awayPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
            <div
              className={`h-full rounded-full ${cfg.secondaryProgressBg}`}
              style={{ width: `${awayPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goal Difference / Map Analysis */}
      {isFootball && analysis.goalDifferenceAnalysis && (
        <div className="mb-4 p-3 rounded-lg bg-secondary/30 border border-border/50">
          <h4 className="text-xs font-semibold text-foreground mb-2">
            {t.footballAnalysis?.goalDifference ?? "Goal Difference Analysis"}
          </h4>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">
                {t.footballAnalysis?.predictedGoalDiff ?? "Predicted Goal Diff"}:
              </span>
              <span className="ml-1 font-bold text-foreground">
                {analysis.goalDifferenceAnalysis.predictedGoalDiff > 0 ? "+" : ""}
                {analysis.goalDifferenceAnalysis.predictedGoalDiff}
              </span>
            </div>
            {analysis.goalDifferenceAnalysis.overUnderGoals !== undefined && (
              <div>
                <span className="text-muted-foreground">
                  {t.footballAnalysis?.totalGoals ?? "Total Goals"}:
                </span>
                <span className="ml-1 font-bold text-foreground">
                  {analysis.goalDifferenceAnalysis.overUnderGoals}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {!isFootball && analysis.mapAnalysis && (
        <div className="mb-4 p-3 rounded-lg bg-secondary/30 border border-border/50">
          <h4 className="text-xs font-semibold text-foreground mb-2">
            {t.esportsAnalysis?.mapAnalysis ?? "Map Analysis"}
          </h4>
          <div className="text-xs">
            <span className="text-muted-foreground">
              {t.esportsAnalysis?.predictedMaps ?? "Predicted Maps"}:
            </span>
            <span className="ml-1 font-bold text-foreground">
              {analysis.mapAnalysis.predictedMaps}
            </span>
          </div>
        </div>
      )}

      {/* Market Edge */}
      <div className="mb-4 p-3 rounded-lg bg-secondary/30 border border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {t.matchAnalysis?.marketEdge ?? "Market Edge"}
          </span>
          <span
            className={`text-sm font-bold ${
              edgePct > 0 ? "text-green-400" : edgePct < 0 ? "text-red-400" : "text-muted-foreground"
            }`}
          >
            {edgePct > 0 ? "+" : ""}
            {edgePct}%
          </span>
        </div>
        {analysis.recommendedSide !== "none" && (
          <div className="mt-2 text-xs">
            <span className="text-muted-foreground">
              {t.analysis?.recommendation ?? "Recommendation"}:
            </span>
            <span className={`ml-1 font-semibold ${cfg.accentColor}`}>
              {analysis.recommendedSide === "home"
                ? analysis.homeTeam
                : analysis.recommendedSide === "away"
                ? analysis.awayTeam
                : t.events?.draw ?? "Draw"}
            </span>
          </div>
        )}
      </div>

      {/* Key Factors */}
      {analysis.keyFactors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-foreground mb-2">
            {t.matchAnalysis?.keyFactors ?? "Key Factors"}
          </h4>
          <ul className="space-y-1">
            {analysis.keyFactors.slice(0, 4).map((factor, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className={`mt-1 w-1 h-1 rounded-full ${cfg.progressBg} shrink-0`} />
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reasoning */}
      {analysis.reasoning && (
        <div className="pt-3 border-t border-border/50">
          <h4 className="text-xs font-semibold text-foreground mb-2">
            {t.matchAnalysis?.reasoning ?? "AI Reasoning"}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
            {analysis.reasoning}
          </p>
        </div>
      )}
    </div>
  );
}
