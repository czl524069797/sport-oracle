"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n";
import { getTeamLink } from "@/lib/team-links";
import type { PolymarketEvent } from "@/types";

interface EventCardProps {
  event: PolymarketEvent;
  theme: "football" | "esports";
}

const themeConfig = {
  football: {
    borderColor: "border-emerald-500/15",
    hoverBorder: "hover:border-emerald-500/30",
    glowClass: "glow-green",
    accentColor: "text-emerald-400",
    secondaryAccent: "text-amber-400",
    accentBg: "bg-emerald-500/10",
    secondaryBg: "bg-amber-500/10",
    tagColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    progressBg: "bg-gradient-to-r from-emerald-500 to-green-400",
    secondaryProgressBg: "bg-gradient-to-r from-amber-500 to-orange-400",
    progressShadow: "0 0 8px rgba(16, 185, 129, 0.5)",
    secondaryProgressShadow: "0 0 8px rgba(245, 158, 11, 0.5)",
    borderAccent: "border-emerald-500/15",
    secondaryBorderAccent: "border-amber-500/15",
    buttonBg: "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400",
    buttonShadow: "shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]",
  },
  esports: {
    borderColor: "border-violet-500/15",
    hoverBorder: "hover:border-violet-500/30",
    glowClass: "glow-purple",
    accentColor: "text-violet-400",
    secondaryAccent: "text-rose-400",
    accentBg: "bg-violet-500/10",
    secondaryBg: "bg-rose-500/10",
    tagColor: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    progressBg: "bg-gradient-to-r from-violet-500 to-purple-400",
    secondaryProgressBg: "bg-gradient-to-r from-rose-500 to-pink-400",
    progressShadow: "0 0 8px rgba(139, 92, 246, 0.5)",
    secondaryProgressShadow: "0 0 8px rgba(244, 63, 94, 0.5)",
    borderAccent: "border-violet-500/15",
    secondaryBorderAccent: "border-rose-500/15",
    buttonBg: "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400",
    buttonShadow: "shadow-[0_0_12px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]",
  },
};

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

function translateOutcomeName(name: string, t: ReturnType<typeof useI18n>["t"], locale: string): string {
  if (locale !== "zh") return name;
  const key = name.toLowerCase().trim();
  const overviewMap = t.overview?.outcomeNames as Record<string, string> | undefined;
  if (overviewMap && overviewMap[key]) return overviewMap[key];
  if (t.teams[name]) return t.teams[name];
  return name;
}

function TeamLink({
  name,
  category,
  eventTitle,
  className,
}: {
  name: string;
  category: "football" | "esports";
  eventTitle: string;
  className?: string;
}) {
  const link = getTeamLink(name, category, eventTitle);
  if (!link) return <span className={className}>{name}</span>;
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} hover:underline underline-offset-2 cursor-pointer transition-opacity hover:opacity-80`}
    >
      {name}
    </a>
  );
}

/**
 * Detect if an event is a 2-team matchup (VS-style).
 * Criteria: has at least 1 market with exactly 2 outcomes.
 */
function isVsMatchup(event: PolymarketEvent): boolean {
  if (!event.markets || event.markets.length === 0) return false;
  const primaryMarket = event.markets[0];
  return primaryMarket.outcomes.length === 2 && primaryMarket.outcomePrices.length === 2;
}

function VsMatchupCard({ event, theme }: EventCardProps) {
  const { t, locale } = useI18n();
  const cfg = themeConfig[theme];
  const market = event.markets[0];
  const team1 = market.outcomes[0];
  const team2 = market.outcomes[1];
  const price1 = market.outcomePrices[0] ?? 0;
  const price2 = market.outcomePrices[1] ?? 0;
  const pct1 = Math.round(price1 * 100);
  const pct2 = Math.round(price2 * 100);

  const displayName1 = translateOutcomeName(team1, t, locale);
  const displayName2 = translateOutcomeName(team2, t, locale);

  const polymarketUrl = `https://polymarket.com/event/${event.slug}`;

  return (
    <div className={`glass-card rounded-xl overflow-hidden transition-all duration-300 ${cfg.borderColor} ${cfg.hoverBorder}`}>
      {/* Top accent line */}
      <div className={`h-0.5 ${cfg.progressBg}`} />

      <div className="p-5">
        {/* Title + volume */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 flex-1">
            {event.title}
          </h3>
          <Badge className={`shrink-0 text-[10px] ${cfg.tagColor}`}>
            {formatVolume(event.volume)}
          </Badge>
        </div>

        {/* VS Matchup Layout */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 mb-4">
          {/* Team 1 */}
          <div className={`text-center p-3 rounded-lg border ${cfg.borderAccent} ${cfg.accentBg}`}>
            <TeamLink
              name={displayName1}
              category={theme}
              eventTitle={event.title}
              className={`text-sm font-semibold ${cfg.accentColor}`}
            />
            <div className="mt-2 space-y-1.5">
              <span className={`text-lg font-bold ${cfg.accentColor}`}>{pct1}%</span>
              <p className="text-[10px] text-muted-foreground">{t.events.odds}</p>
              <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                <div
                  className={`h-full rounded-full ${cfg.progressBg}`}
                  style={{ width: `${pct1}%`, boxShadow: cfg.progressShadow }}
                />
              </div>
            </div>
          </div>

          {/* VS divider */}
          <div className="flex flex-col items-center justify-center px-1">
            <span className="text-xs font-bold text-muted-foreground bg-secondary/80 rounded-full w-8 h-8 flex items-center justify-center border border-border">
              {t.events.vs}
            </span>
          </div>

          {/* Team 2 */}
          <div className={`text-center p-3 rounded-lg border ${cfg.secondaryBorderAccent} ${cfg.secondaryBg}`}>
            <TeamLink
              name={displayName2}
              category={theme}
              eventTitle={event.title}
              className={`text-sm font-semibold ${cfg.secondaryAccent}`}
            />
            <div className="mt-2 space-y-1.5">
              <span className={`text-lg font-bold ${cfg.secondaryAccent}`}>{pct2}%</span>
              <p className="text-[10px] text-muted-foreground">{t.events.odds}</p>
              <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                <div
                  className={`h-full rounded-full ${cfg.secondaryProgressBg}`}
                  style={{ width: `${pct2}%`, boxShadow: cfg.secondaryProgressShadow }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional markets summary */}
        {event.markets.length > 1 && (
          <div className="flex items-center gap-1.5 mb-3 text-[10px] text-muted-foreground">
            <span>+{event.markets.length - 1} {t.events.eventMarkets}</span>
          </div>
        )}

        {/* View on Polymarket button */}
        <a
          href={polymarketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`block w-full text-center py-2.5 rounded-lg text-white text-sm font-semibold transition-all ${cfg.buttonBg} ${cfg.buttonShadow}`}
        >
          {t.events.viewOnPolymarket}
        </a>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground">
            {event.markets.length} {t.events.markets}
          </span>
          {event.endDate && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {new Date(event.endDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MultiOutcomeCard({ event, theme }: EventCardProps) {
  const { t, locale } = useI18n();
  const cfg = themeConfig[theme];
  const topMarket = event.markets[0];
  const hasOutcomes = topMarket && topMarket.outcomes.length >= 2 && topMarket.outcomePrices.length >= 2;
  const polymarketUrl = `https://polymarket.com/event/${event.slug}`;

  return (
    <div className={`glass-card rounded-xl overflow-hidden transition-all duration-300 ${cfg.borderColor} ${cfg.hoverBorder}`}>
      {/* Top accent line */}
      <div className={`h-0.5 ${cfg.progressBg}`} />

      <div className="p-5">
        {/* Title + volume */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 flex-1">
            {event.title}
          </h3>
          <Badge className={`shrink-0 text-[10px] ${cfg.tagColor}`}>
            {formatVolume(event.volume)}
          </Badge>
        </div>

        {/* Primary market question */}
        {topMarket && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
            {topMarket.question}
          </p>
        )}

        {/* Outcomes with probability bars */}
        {hasOutcomes && (
          <div className="space-y-2 mb-4">
            {topMarket.outcomes.slice(0, 4).map((outcome, i) => {
              const price = topMarket.outcomePrices[i] ?? 0;
              const pct = Math.round(price * 100);
              const displayName = translateOutcomeName(outcome, t, locale);
              const link = getTeamLink(outcome, theme, event.title);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground truncate mr-2 hover:underline underline-offset-2 hover:text-foreground transition-colors"
                      >
                        {displayName}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground truncate mr-2">{displayName}</span>
                    )}
                    <span className={`text-xs font-bold ${cfg.accentColor}`}>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cfg.progressBg}`}
                      style={{
                        width: `${pct}%`,
                        boxShadow: cfg.progressShadow,
                        opacity: i === 0 ? 1 : 0.6 + 0.4 * (1 - i / 4),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View on Polymarket button */}
        <a
          href={polymarketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`block w-full text-center py-2.5 rounded-lg text-white text-sm font-semibold transition-all ${cfg.buttonBg} ${cfg.buttonShadow}`}
        >
          {t.events.viewOnPolymarket}
        </a>

        {/* Footer: markets count + date */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground">
            {event.markets.length} {t.events.markets}
          </span>
          {event.endDate && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {new Date(event.endDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventCard({ event, theme }: EventCardProps) {
  if (isVsMatchup(event)) {
    return <VsMatchupCard event={event} theme={theme} />;
  }
  return <MultiOutcomeCard event={event} theme={theme} />;
}
