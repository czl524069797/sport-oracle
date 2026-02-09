"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPercent } from "@/lib/utils";
import { useI18n, useLocaleDateFormat, getTeamName } from "@/i18n";
import { getNBATeamLink } from "@/lib/team-links";
import type { GameWithOdds, GameAnalysisSummary } from "@/types";

interface MarketCardProps {
  matched: GameWithOdds;
  onAnalyze: (gameId: string) => void;
  analyzing: boolean;
  analysisSummary?: GameAnalysisSummary;
}

function getGameStatusVariant(status: string): "success" | "live" | "secondary" {
  const s = status.toLowerCase().trim();
  if (s === "final" || s.startsWith("final/")) return "secondary";
  if (s.includes("live") || s.includes("q") || s.includes("half")) return "live";
  return "success";
}

function getGameStatusLabel(status: string, t: ReturnType<typeof useI18n>["t"]): string {
  const s = status.toLowerCase().trim();
  if (s === "final" || s.startsWith("final/")) return t.markets.gameFinished;
  if (s.includes("live") || s.includes("q") || s.includes("half")) return t.markets.gameLive;
  return t.markets.gameScheduled;
}

function formatLocalGameTime(gameDate: string, status: string, dateLocale: string): string {
  const s = status.toLowerCase().trim();
  const match = s.match(/(\d{1,2}):(\d{2})\s*(am|pm)\s*et/);
  if (!match) return status;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm === "pm" && hours !== 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;

  const datePart = gameDate.split("T")[0];
  const etDateStr = `${datePart}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  const etOffsetDate = new Date(`${etDateStr}-05:00`);

  if (isNaN(etOffsetDate.getTime())) return status;

  return etOffsetDate.toLocaleString(dateLocale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function MarketCard({ matched, onAnalyze, analyzing, analysisSummary }: MarketCardProps) {
  const { game } = matched;
  const { t, locale } = useI18n();
  const { formatGameDate, dateLocale } = useLocaleDateFormat();

  const homeName = getTeamName(game.homeTeam.teamName, locale);
  const awayName = getTeamName(game.awayTeam.teamName, locale);
  const homeLink = getNBATeamLink(game.homeTeam.teamName);
  const awayLink = getNBATeamLink(game.awayTeam.teamName);
  const homeRecord = game.homeTeam.homeRecord || game.homeTeam.record;
  const awayRecord = game.awayTeam.awayRecord || game.awayTeam.record;

  const statusLower = game.status.toLowerCase().trim();
  const isScheduled = statusLower.includes("pm") || statusLower.includes("am");
  const isLive = statusLower.includes("live") || statusLower.includes("q") || statusLower.includes("half");
  const gameTime = isScheduled
    ? formatLocalGameTime(game.gameDate, game.status, dateLocale)
    : formatGameDate(game.gameDate);

  return (
    <Card className={`relative overflow-hidden group ${isLive ? "animate-glow-pulse" : ""}`}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {awayLink ? (
              <a href={awayLink} target="_blank" rel="noopener noreferrer" className="text-neon-orange hover:underline underline-offset-2">{awayName}</a>
            ) : (
              <span className="text-neon-orange">{awayName}</span>
            )}
            <span className="text-muted-foreground mx-2 text-xs">@</span>
            {homeLink ? (
              <a href={homeLink} target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline underline-offset-2">{homeName}</a>
            ) : (
              <span className="text-neon-cyan">{homeName}</span>
            )}
          </CardTitle>
          <Badge variant={getGameStatusVariant(game.status)}>
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 live-indicator" />}
            {getGameStatusLabel(game.status, t)}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {gameTime}
        </p>
      </CardHeader>

      <CardContent>
        {/* Team matchup - VS style */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 mb-4">
          {/* Home team */}
          <div className="text-center p-3 rounded-lg border border-neon-cyan/15 bg-neon-cyan/5">
            {homeLink ? (
              <a href={homeLink} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-neon-cyan hover:underline underline-offset-2">{homeName}</a>
            ) : (
              <p className="text-sm font-semibold text-neon-cyan">{homeName}</p>
            )}
            <p className="text-[10px] text-muted-foreground mb-2">
              ({t.markets.home}) {homeRecord}
            </p>
            {analysisSummary ? (
              <div className="space-y-1.5">
                <div className="text-center">
                  <span className="text-lg font-bold text-neon-cyan">
                    {formatPercent(analysisSummary.homeWinProbability)}
                  </span>
                  <p className="text-[10px] text-muted-foreground">{t.markets.winProbability}</p>
                </div>
                <div className="neon-progress">
                  <div className="neon-progress-bar" style={{ width: `${Math.round(analysisSummary.homeWinProbability * 100)}%` }} />
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic">{t.markets.noAnalysis}</p>
            )}
          </div>

          {/* VS divider */}
          <div className="flex flex-col items-center justify-center px-1">
            <span className="text-xs font-bold text-muted-foreground bg-secondary/80 rounded-full w-8 h-8 flex items-center justify-center border border-border">
              VS
            </span>
          </div>

          {/* Away team */}
          <div className="text-center p-3 rounded-lg border border-neon-orange/15 bg-neon-orange/5">
            {awayLink ? (
              <a href={awayLink} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-neon-orange hover:underline underline-offset-2">{awayName}</a>
            ) : (
              <p className="text-sm font-semibold text-neon-orange">{awayName}</p>
            )}
            <p className="text-[10px] text-muted-foreground mb-2">
              ({t.markets.away}) {awayRecord}
            </p>
            {analysisSummary ? (
              <div className="space-y-1.5">
                <div className="text-center">
                  <span className="text-lg font-bold text-neon-orange">
                    {formatPercent(analysisSummary.awayWinProbability)}
                  </span>
                  <p className="text-[10px] text-muted-foreground">{t.markets.winProbability}</p>
                </div>
                <div className="neon-progress">
                  <div className="h-full rounded-sm bg-gradient-to-r from-neon-orange to-amber-500" style={{ width: `${Math.round(analysisSummary.awayWinProbability * 100)}%`, boxShadow: "0 0 8px rgba(249, 115, 22, 0.5)" }} />
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic">{t.markets.noAnalysis}</p>
            )}
          </div>
        </div>

        {/* Analysis data row */}
        {analysisSummary && (
          <div className="flex items-center justify-between mb-4 p-2.5 rounded-lg bg-secondary/40 border border-border text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">{t.markets.overUnder}:</span>
              <span className="font-semibold text-neon-purple">{analysisSummary.predictedTotal.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">O/U:</span>
              <span className="font-semibold text-neon-green">{formatPercent(analysisSummary.overProbability)}</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-semibold text-neon-orange">{formatPercent(analysisSummary.underProbability)}</span>
            </div>
          </div>
        )}

        {/* News highlights */}
        {analysisSummary && analysisSummary.newsHighlights.length > 0 && (
          <div className="mb-4 p-3 rounded-lg border border-neon-cyan/10 bg-neon-cyan/[0.03]">
            <p className="text-[10px] font-medium text-neon-cyan/80 uppercase tracking-wider mb-1.5">{t.markets.newsImpact}</p>
            <ul className="space-y-0.5">
              {analysisSummary.newsHighlights.slice(0, 3).map((news, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                  <span className="text-neon-cyan shrink-0">-</span>
                  <span className="line-clamp-2">{news}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button className="w-full" onClick={() => onAnalyze(game.gameId)} disabled={analyzing}>
          {analyzing ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t.markets.analyzing}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
              {t.markets.aiAnalyze}
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
