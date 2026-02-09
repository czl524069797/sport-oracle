"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import type { FuturesMarket } from "@/types";

interface SeasonOverviewProps {
  markets: FuturesMarket[];
  loading: boolean;
  error: string | null;
  theme: "nba" | "football" | "esports";
}

const themeConfig = {
  nba: {
    accentColor: "text-neon-cyan",
    accentBg: "bg-neon-cyan/10",
    borderColor: "border-neon-cyan/15",
    progressBg: "bg-gradient-to-r from-neon-cyan to-neon-blue",
    progressShadow: "0 0 8px rgba(0, 240, 255, 0.4)",
    rankBg: "bg-neon-cyan/20 text-neon-cyan",
    headerGradient: "from-neon-cyan/10 via-transparent to-neon-blue/10",
    barAccent: "from-neon-cyan to-neon-blue",
  },
  football: {
    accentColor: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    borderColor: "border-emerald-500/15",
    progressBg: "bg-gradient-to-r from-emerald-500 to-green-400",
    progressShadow: "0 0 8px rgba(16, 185, 129, 0.4)",
    rankBg: "bg-emerald-500/20 text-emerald-400",
    headerGradient: "from-emerald-500/10 via-transparent to-green-500/10",
    barAccent: "from-emerald-400 to-green-500",
  },
  esports: {
    accentColor: "text-violet-400",
    accentBg: "bg-violet-500/10",
    borderColor: "border-violet-500/15",
    progressBg: "bg-gradient-to-r from-violet-500 to-purple-400",
    progressShadow: "0 0 8px rgba(139, 92, 246, 0.4)",
    rankBg: "bg-violet-500/20 text-violet-400",
    headerGradient: "from-violet-500/10 via-transparent to-purple-500/10",
    barAccent: "from-violet-400 to-purple-500",
  },
};

function translateOutcomeName(name: string, t: ReturnType<typeof useI18n>["t"], locale: string): string {
  if (locale !== "zh") return name;
  // Check if the name exists in the overview translations
  const key = name.toLowerCase().trim();
  const overviewMap = t.overview?.outcomeNames as Record<string, string> | undefined;
  if (overviewMap && overviewMap[key]) return overviewMap[key];
  // Check teams map
  if (t.teams[name]) return t.teams[name];
  return name;
}

export function SeasonOverview({ markets, loading, error, theme }: SeasonOverviewProps) {
  const { t, locale } = useI18n();
  const cfg = themeConfig[theme];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-52 w-full" />
        ))}
      </div>
    );
  }

  if (error || markets.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {markets.map((market) => (
        <div
          key={market.id}
          className={`glass-card rounded-xl overflow-hidden ${cfg.borderColor} hover:border-opacity-40 transition-all`}
        >
          {/* Header with gradient */}
          <div className={`px-4 py-3 bg-gradient-to-r ${cfg.headerGradient} border-b border-border/50`}>
            <h3 className={`text-sm font-semibold ${cfg.accentColor} line-clamp-1`}>
              {translateOutcomeName(market.title, t, locale)}
            </h3>
          </div>

          {/* Ranked outcomes */}
          <div className="p-4 space-y-2.5">
            {market.outcomes.map((outcome, i) => {
              const pct = Math.round(outcome.price * 100);
              const isTop = i === 0;
              return (
                <div key={outcome.marketId} className="flex items-center gap-2.5">
                  {/* Rank */}
                  <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${
                    isTop ? cfg.rankBg : "bg-secondary/50 text-muted-foreground"
                  }`}>
                    {i + 1}
                  </span>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-xs truncate mr-2 ${isTop ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {translateOutcomeName(outcome.name, t, locale)}
                      </span>
                      <span className={`text-xs font-bold shrink-0 ${isTop ? cfg.accentColor : "text-muted-foreground"}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-secondary/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cfg.progressBg}`}
                        style={{
                          width: `${pct}%`,
                          boxShadow: isTop ? cfg.progressShadow : "none",
                          opacity: isTop ? 1 : 0.5 + (0.5 * (1 - i / 5)),
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
