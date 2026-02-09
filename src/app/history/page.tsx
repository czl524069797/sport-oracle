"use client";

import { BetHistory } from "@/components/history/BetHistory";
import { useI18n } from "@/i18n";

export default function HistoryPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-neon-cyan to-neon-blue" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.history.title}</h1>
          <p className="text-muted-foreground mt-0.5">{t.history.subtitle}</p>
        </div>
      </div>
      <BetHistory />
    </div>
  );
}
