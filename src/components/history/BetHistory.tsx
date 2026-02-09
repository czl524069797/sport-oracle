"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAccount } from "wagmi";
import { formatUSD, formatPercent } from "@/lib/utils";
import { useI18n } from "@/i18n";
import type { BetRecord, ApiResponse } from "@/types";

export function BetHistory() {
  const { address } = useAccount();
  const { t } = useI18n();
  const [bets, setBets] = useState<BetRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBets = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/betting?wallet=${address}`);
      const data: ApiResponse<BetRecord[]> = await res.json();
      if (data.success && data.data) setBets(data.data);
    } finally { setLoading(false); }
  }, [address]);

  useEffect(() => { fetchBets(); }, [fetchBets]);

  const statusVariant = (status: string) => {
    switch (status) {
      case "filled": return "success" as const;
      case "placed": return "default" as const;
      case "cancelled": case "failed": return "destructive" as const;
      case "settled": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  if (!address) {
    return (
      <div className="glass-card rounded-xl text-center py-16">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="1.5" className="mx-auto mb-4 opacity-30">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
        </svg>
        <p className="text-muted-foreground">{t.history.connectPrompt}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card rounded-xl text-center py-16 relative overflow-hidden">
        <div className="absolute inset-0 data-stream" />
        <div className="relative z-10">
          <div className="w-10 h-10 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground mt-4">{t.history.loadingBets}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
          </svg>
          {t.history.cardTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t.history.noBets}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neon-cyan/10">
                  <th className="text-left py-3 px-2 text-xs font-medium text-neon-cyan/60 uppercase tracking-wider">{t.history.game}</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-neon-cyan/60 uppercase tracking-wider">{t.history.side}</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-neon-cyan/60 uppercase tracking-wider">{t.history.amount}</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-neon-cyan/60 uppercase tracking-wider">{t.history.price}</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-neon-cyan/60 uppercase tracking-wider">{t.history.pnl}</th>
                  <th className="text-center py-3 px-2 text-xs font-medium text-neon-cyan/60 uppercase tracking-wider">{t.history.status}</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-neon-cyan/60 uppercase tracking-wider">{t.history.date}</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => (
                  <tr key={bet.id} className="border-b border-border/50 hover:bg-neon-cyan/[0.02] transition-colors">
                    <td className="py-3 px-2 text-foreground">{bet.analysis ? `${bet.analysis.awayTeam} @ ${bet.analysis.homeTeam}` : "---"}</td>
                    <td className="py-3 px-2 text-muted-foreground">{bet.side} {bet.outcome}</td>
                    <td className="text-right py-3 px-2 text-foreground">{formatUSD(bet.amount)}</td>
                    <td className="text-right py-3 px-2 text-muted-foreground">{formatPercent(bet.price)}</td>
                    <td className={`text-right py-3 px-2 font-medium ${bet.pnl != null && bet.pnl > 0 ? "text-neon-green" : bet.pnl != null && bet.pnl < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                      {bet.pnl != null ? formatUSD(bet.pnl) : "---"}
                    </td>
                    <td className="text-center py-3 px-2"><Badge variant={statusVariant(bet.status)}>{bet.status}</Badge></td>
                    <td className="text-right py-3 px-2 text-muted-foreground text-xs">{new Date(bet.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
