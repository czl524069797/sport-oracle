"use client";

import { usePolymarketEvents } from "@/hooks/usePolymarketEvents";
import { useOverview } from "@/hooks/useOverview";
import { EventList } from "@/components/events/EventList";
import { SeasonOverview } from "@/components/events/SeasonOverview";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

function GamepadIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 11h4M8 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15" cy="10" r="1" fill="currentColor" opacity="0.8" />
      <circle cx="17" cy="12" r="1" fill="currentColor" opacity="0.8" />
      <path d="M7.5 6h9a5.5 5.5 0 010 11H16l-2 3h-4l-2-3h-.5a5.5 5.5 0 010-11z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 4c1-1 2-1 3 0" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
      <path d="M18 4c1-1 2-1 3 0" stroke="currentColor" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
    </svg>
  );
}

export default function EsportsPage() {
  const { events, loading, error, refresh } = usePolymarketEvents("esports");
  const { markets: overviewMarkets, loading: overviewLoading, error: overviewError } = useOverview("esports");
  const { t } = useI18n();

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-violet-400 to-purple-500" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <GamepadIcon size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t.esports.title}</h1>
              <p className="text-muted-foreground mt-0.5">{t.esports.subtitle}</p>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading} className="border-violet-500/20 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/40">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
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
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-400 to-purple-500" />
          <h2 className="text-lg font-semibold text-foreground">{t.overview.seasonTitle}</h2>
          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{t.overview.futures}</span>
        </div>
        <SeasonOverview markets={overviewMarkets} loading={overviewLoading} error={overviewError} theme="esports" />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        <span className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500/40" />
          {t.overview.dailyMatches}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
      </div>

      {/* Esports banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-violet-500/10 border border-violet-500/15 p-6">
        <div className="absolute top-1/2 right-8 -translate-y-1/2 opacity-10">
          <GamepadIcon size={100} />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
            <GamepadIcon size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-violet-400">{t.esports.banner}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t.esports.bannerDesc}</p>
          </div>
        </div>
      </div>

      <EventList events={events} loading={loading} error={error} theme="esports"
        emptyIcon={<GamepadIcon size={40} className="text-violet-400" />} />
    </div>
  );
}
