"use client";

import { StrategyForm } from "@/components/strategy/StrategyForm";
import { useI18n } from "@/i18n";

export default function StrategyPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-neon-orange to-amber-500" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.strategy.title}</h1>
          <p className="text-muted-foreground mt-0.5">{t.strategy.subtitle}</p>
        </div>
      </div>
      <div className="max-w-2xl">
        <StrategyForm />
      </div>
    </div>
  );
}
