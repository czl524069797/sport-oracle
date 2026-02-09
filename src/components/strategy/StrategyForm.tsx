"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccount } from "wagmi";
import { useI18n } from "@/i18n";
import type { StrategyConfig, ApiResponse } from "@/types";

export function StrategyForm() {
  const { address } = useAccount();
  const { t } = useI18n();
  const [strategies, setStrategies] = useState<StrategyConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<StrategyConfig>({
    name: "Default Strategy", isActive: true, minConfidence: 0.65,
    maxBetAmount: 10, dailyBudget: 50, autoExecute: false,
  });

  const fetchStrategies = useCallback(async () => {
    if (!address) return;
    const res = await fetch(`/api/strategy?wallet=${address}`);
    const data: ApiResponse<StrategyConfig[]> = await res.json();
    if (data.success && data.data) {
      setStrategies(data.data);
      if (data.data.length > 0) setForm(data.data[0]);
    }
  }, [address]);

  useEffect(() => { fetchStrategies(); }, [fetchStrategies]);

  const handleSave = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const method = form.id ? "PUT" : "POST";
      const body = form.id ? { id: form.id, ...form } : { ...form, walletAddress: address };
      const res = await fetch("/api/strategy", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) await fetchStrategies();
    } finally { setLoading(false); }
  };

  if (!address) {
    return (
      <div className="glass-card rounded-xl text-center py-16">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="1.5" className="mx-auto mb-4 opacity-30">
          <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
        <p className="text-muted-foreground">{t.strategy.connectPrompt}</p>
      </div>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-orange/30 to-transparent" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33" />
          </svg>
          {t.strategy.cardTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.strategy.name}</label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.strategy.minConfidence}</label>
            <Input type="number" min={0} max={1} step={0.05} value={form.minConfidence} onChange={(e) => setForm({ ...form, minConfidence: Number(e.target.value) })} className="mt-1.5" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.strategy.maxBet}</label>
            <Input type="number" min={1} max={1000} value={form.maxBetAmount} onChange={(e) => setForm({ ...form, maxBetAmount: Number(e.target.value) })} className="mt-1.5" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.strategy.dailyBudget}</label>
          <Input type="number" min={1} max={10000} value={form.dailyBudget} onChange={(e) => setForm({ ...form, dailyBudget: Number(e.target.value) })} className="mt-1.5" />
        </div>
        <div className="flex items-center gap-6 py-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="sr-only peer" />
              <div className="w-9 h-5 bg-secondary rounded-full peer-checked:bg-neon-cyan/30 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-muted-foreground rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-neon-cyan" />
            </div>
            <span className="text-sm text-muted-foreground">{t.strategy.active}</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative">
              <input type="checkbox" checked={form.autoExecute} onChange={(e) => setForm({ ...form, autoExecute: e.target.checked })} className="sr-only peer" />
              <div className="w-9 h-5 bg-secondary rounded-full peer-checked:bg-neon-orange/30 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-muted-foreground rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-neon-orange" />
            </div>
            <span className="text-sm text-muted-foreground">{t.strategy.autoExecute}</span>
          </label>
        </div>
        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t.strategy.saving}
            </span>
          ) : (
            form.id ? t.strategy.updateStrategy : t.strategy.createStrategy
          )}
        </Button>
        {strategies.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{t.strategy.savedStrategies} ({strategies.length})</h4>
            <div className="space-y-2">
              {strategies.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20 text-sm cursor-pointer hover:border-neon-cyan/30 hover:bg-neon-cyan/5 transition-all" onClick={() => setForm(s)}>
                  <span className="text-foreground">{s.name}</span>
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? "bg-neon-green" : "bg-muted-foreground/30"}`} />
                    <span className={`text-xs ${s.isActive ? "text-neon-green" : "text-muted-foreground"}`}>{s.isActive ? t.common.active : t.common.inactive}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
