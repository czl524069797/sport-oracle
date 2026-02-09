"use client";

import { MarketCard } from "./MarketCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n";
import type { GameWithOdds, GameAnalysisSummary } from "@/types";

interface MarketListProps {
  todayMarkets: GameWithOdds[];
  tomorrowMarkets: GameWithOdds[];
  allTodayFinished: boolean;
  loading: boolean;
  error: string | null;
  onAnalyze: (gameId: string) => void;
  analyzingGameId: string | null;
  analysisMap: Record<string, GameAnalysisSummary>;
  labels: { todayLabel: string; tomorrowLabel: string };
}

function MarketSection({
  title,
  badge,
  markets,
  onAnalyze,
  analyzingGameId,
  analysisMap,
}: {
  title: string;
  badge?: string;
  markets: GameWithOdds[];
  onAnalyze: (gameId: string) => void;
  analyzingGameId: string | null;
  analysisMap: Record<string, GameAnalysisSummary>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-neon-cyan to-neon-blue" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {badge && (
          <Badge variant="secondary" className="text-xs">
            {badge}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
          {markets.length}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {markets.map((matched) => (
          <MarketCard
            key={matched.game.gameId}
            matched={matched}
            onAnalyze={onAnalyze}
            analyzing={analyzingGameId === matched.game.gameId}
            analysisSummary={analysisMap[matched.game.gameId]}
          />
        ))}
      </div>
    </div>
  );
}

export function MarketList({
  todayMarkets,
  tomorrowMarkets,
  allTodayFinished,
  loading,
  error,
  onAnalyze,
  analyzingGameId,
  analysisMap,
  labels,
}: MarketListProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-72 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 glass-card rounded-xl">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="mx-auto mb-4">
          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <p className="text-red-400 text-lg">{t.markets.errorLoading}</p>
        <p className="text-muted-foreground mt-2 text-sm">{error}</p>
      </div>
    );
  }

  const hasToday = todayMarkets.length > 0;
  const hasTomorrow = tomorrowMarkets.length > 0;

  if (!hasToday && !hasTomorrow) {
    return (
      <div className="text-center py-16 glass-card rounded-xl">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="1.5" className="mx-auto mb-4 opacity-40">
          <circle cx="12" cy="12" r="10" /><path d="M12 2C12 2 12 22 12 22" /><path d="M2 12C2 12 22 12 22 12" />
        </svg>
        <p className="text-muted-foreground text-lg">{t.markets.noMarkets}</p>
        <p className="text-sm text-muted-foreground mt-2">{t.markets.noMarketsHint}</p>
      </div>
    );
  }

  const todayTitle = labels.todayLabel
    ? `${t.markets.todayLabel} (${t.markets.etDate} ${labels.todayLabel.replace("ET ", "")})`
    : t.markets.todayGames;

  const tomorrowTitle = labels.tomorrowLabel
    ? `${t.markets.tomorrowLabel} (${t.markets.etDate} ${labels.tomorrowLabel.replace("ET ", "")})`
    : t.markets.tomorrowGames;

  return (
    <div className="space-y-8">
      {hasToday && (
        <MarketSection
          title={todayTitle}
          badge={allTodayFinished ? t.markets.gameFinished : undefined}
          markets={todayMarkets}
          onAnalyze={onAnalyze}
          analyzingGameId={analyzingGameId}
          analysisMap={analysisMap}
        />
      )}

      {hasTomorrow && (
        <>
          {hasToday && allTodayFinished && (
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
              <p className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan/40" />
                {t.markets.allTodayFinished}
              </p>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
            </div>
          )}
          <MarketSection
            title={tomorrowTitle}
            markets={tomorrowMarkets}
            onAnalyze={onAnalyze}
            analyzingGameId={analyzingGameId}
            analysisMap={analysisMap}
          />
        </>
      )}
    </div>
  );
}
