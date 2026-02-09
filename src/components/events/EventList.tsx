"use client";

import { EventCard } from "./EventCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import type { PolymarketEvent } from "@/types";

interface EventListProps {
  events: PolymarketEvent[];
  loading: boolean;
  error: string | null;
  theme: "football" | "esports";
  emptyIcon: React.ReactNode;
}

export function EventList({ events, loading, error, theme, emptyIcon }: EventListProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-56 w-full" />
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
        <p className="text-red-400 text-lg">{t.events.errorLoading}</p>
        <p className="text-muted-foreground mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16 glass-card rounded-xl">
        <div className="mx-auto mb-4 opacity-30 w-10 h-10 flex items-center justify-center">
          {emptyIcon}
        </div>
        <p className="text-muted-foreground text-lg">{t.events.noEvents}</p>
        <p className="text-sm text-muted-foreground mt-2">{t.events.noEventsHint}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} theme={theme} />
      ))}
    </div>
  );
}
