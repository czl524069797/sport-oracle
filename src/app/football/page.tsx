"use client";

import { usePolymarketEvents } from "@/hooks/usePolymarketEvents";
import { useOverview } from "@/hooks/useOverview";
import { EventList } from "@/components/events/EventList";
import { SeasonOverview } from "@/components/events/SeasonOverview";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

function FootballIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <polygon points="12,7 15.5,9.5 14.2,13.5 9.8,13.5 8.5,9.5" stroke="currentColor" strokeWidth="1" fill="none" />
      <line x1="12" y1="7" x2="12" y2="2" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="15.5" y1="9.5" x2="21" y2="6.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="14.2" y1="13.5" x2="19" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="9.8" y1="13.5" x2="5" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="8.5" y1="9.5" x2="3" y2="6.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

export default function FootballPage() {
  const { matches, events, loading, error, refresh } = usePolymarketEvents("football");
  const { markets: overviewMarkets, loading: overviewLoading, error: overviewError } = useOverview("football");
  const { t } = useI18n();

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-emerald-400 to-green-500" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <FootballIcon size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t.football.title}</h1>
              <p className="text-muted-foreground mt-0.5">{t.football.subtitle}</p>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading} className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
              {t.events.refreshing}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
              {t.events.refresh}
            </span>
          )}
        </Button>
      </div>

      {/* Season Overview */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-green-500" />
          <h2 className="text-lg font-semibold text-foreground">{t.overview.seasonTitle}</h2>
          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{t.overview.futures}</span>
        </div>
        <SeasonOverview markets={overviewMarkets} loading={overviewLoading} error={overviewError} theme="football" />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <span className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
          {t.overview.dailyMatches}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      </div>

      {/* World Cup banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-emerald-500/10 border border-emerald-500/15 p-6">
        <div className="absolute top-1/2 right-8 -translate-y-1/2 opacity-10">
          <FootballIcon size={100} />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FootballIcon size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-emerald-400">{t.football.worldCupBanner}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t.football.worldCupDesc}</p>
          </div>
        </div>
      </div>

      <EventList events={events} matches={matches} loading={loading} error={error} theme="football"
        emptyIcon={<FootballIcon size={40} className="text-emerald-400" />} />
    </div>
  );
}
