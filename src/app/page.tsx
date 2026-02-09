"use client";

import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useCallback } from "react";
import type { DashboardStats, ApiResponse, BetRecord } from "@/types";
import { formatUSD, formatPercent } from "@/lib/utils";
import { useI18n } from "@/i18n";

function StatCard({
  title,
  value,
  subtitle,
  icon,
  glowColor = "cyan",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  glowColor?: "cyan" | "orange" | "green" | "purple";
}) {
  const glowClass = {
    cyan: "glow-cyan border-neon-cyan/20 hover:border-neon-cyan/40",
    orange: "glow-orange border-neon-orange/20 hover:border-neon-orange/40",
    green: "glow-green border-neon-green/20 hover:border-neon-green/40",
    purple: "glow-purple border-neon-purple/20 hover:border-neon-purple/40",
  }[glowColor];

  const iconBgClass = {
    cyan: "bg-neon-cyan/10 text-neon-cyan",
    orange: "bg-neon-orange/10 text-neon-orange",
    green: "bg-neon-green/10 text-neon-green",
    purple: "bg-neon-purple/10 text-neon-purple",
  }[glowColor];

  return (
    <div className={`glass-card rounded-xl p-5 transition-all duration-300 ${glowClass}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgClass}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

function HeroSection({ t }: { t: ReturnType<typeof useI18n>["t"] }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-grid-animated py-16 px-8 text-center mb-8">
      {/* Decorative court circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-neon-cyan/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-neon-cyan/5 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 space-y-4">
        {/* Basketball SVG */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="animate-bounce-ball">
              <circle cx="12" cy="12" r="10" stroke="#00f0ff" strokeWidth="1.5" />
              <path d="M12 2C12 2 12 22 12 22" stroke="#00f0ff" strokeWidth="1" opacity="0.5" />
              <path d="M2 12C2 12 22 12 22 12" stroke="#00f0ff" strokeWidth="1" opacity="0.5" />
              <path d="M4.93 4.93C8 8 8 16 4.93 19.07" stroke="#00f0ff" strokeWidth="1" opacity="0.4" />
              <path d="M19.07 4.93C16 8 16 16 19.07 19.07" stroke="#00f0ff" strokeWidth="1" opacity="0.4" />
            </svg>
            <div className="absolute inset-0 bg-neon-cyan/20 rounded-full blur-xl animate-pulse" />
          </div>
        </div>

        <h1 className="text-5xl font-bold bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple bg-clip-text text-transparent animate-fade-in-up">
          {t.dashboard.heroTitle}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up stagger-1">
          {t.dashboard.heroSubtitle}
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12 max-w-4xl mx-auto relative z-10">
        <div className="glass-card rounded-xl p-6 text-left glow-cyan animate-fade-in-up stagger-1 group hover:border-neon-cyan/30 transition-all">
          <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h3 className="font-semibold text-foreground mb-1">{t.dashboard.aiAnalysis}</h3>
          <p className="text-sm text-muted-foreground">{t.dashboard.aiAnalysisDesc}</p>
        </div>

        <div className="glass-card rounded-xl p-6 text-left glow-orange animate-fade-in-up stagger-2 group hover:border-neon-orange/30 transition-all">
          <div className="w-10 h-10 rounded-lg bg-neon-orange/10 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
              <path d="M12 22V8" /><path d="M5 12H2a10 10 0 0020 0h-3" /><circle cx="12" cy="5" r="3" />
            </svg>
          </div>
          <h3 className="font-semibold text-foreground mb-1">{t.dashboard.smartBetting}</h3>
          <p className="text-sm text-muted-foreground">{t.dashboard.smartBettingDesc}</p>
        </div>

        <div className="glass-card rounded-xl p-6 text-left glow-purple animate-fade-in-up stagger-3 group hover:border-neon-purple/30 transition-all">
          <div className="w-10 h-10 rounded-lg bg-neon-purple/10 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
            </svg>
          </div>
          <h3 className="font-semibold text-foreground mb-1">{t.dashboard.polymarket}</h3>
          <p className="text-sm text-muted-foreground">{t.dashboard.polymarketDesc}</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-10 relative z-10 animate-fade-in-up stagger-4">
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
          {t.dashboard.connectPrompt}
        </span>
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats>({
    totalBets: 0, winRate: 0, totalPnl: 0, roi: 0,
    activeBets: 0, todayBets: 0, todayPnl: 0, avgConfidence: 0,
  });

  const fetchStats = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/betting?wallet=${address}`);
      const data: ApiResponse<BetRecord[]> = await res.json();
      if (!data.success || !data.data) return;
      const bets = data.data;
      const settled = bets.filter((b) => b.status === "settled");
      const wins = settled.filter((b) => b.pnl != null && b.pnl > 0);
      const totalPnl = settled.reduce((s, b) => s + (b.pnl ?? 0), 0);
      const totalBetAmount = bets.reduce((s, b) => s + b.amount, 0);
      const today = new Date().toISOString().split("T")[0];
      const todayBets = bets.filter((b) => b.createdAt.startsWith(today));
      setStats({
        totalBets: bets.length,
        winRate: settled.length > 0 ? wins.length / settled.length : 0,
        totalPnl,
        roi: totalBetAmount > 0 ? totalPnl / totalBetAmount : 0,
        activeBets: bets.filter((b) => ["pending", "placed", "filled"].includes(b.status)).length,
        todayBets: todayBets.length,
        todayPnl: todayBets.reduce((s, b) => s + (b.pnl ?? 0), 0),
        avgConfidence: bets.length > 0 ? bets.reduce((s, b) => s + (b.analysis?.confidence ?? 0), 0) / bets.length : 0,
      });
    } catch { /* silently fail */ }
  }, [address]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (!isConnected) {
    return <HeroSection t={t} />;
  }

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-neon-cyan to-neon-blue" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.dashboard.title}</h1>
          <p className="text-muted-foreground mt-0.5">{t.dashboard.subtitle}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={t.dashboard.totalBets}
          value={stats.totalBets.toString()}
          subtitle={`${stats.activeBets} ${t.common.active.toLowerCase()}`}
          glowColor="cyan"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22V8" /><path d="M5 12H2a10 10 0 0020 0h-3" /><circle cx="12" cy="5" r="3" />
            </svg>
          }
        />
        <StatCard
          title={t.dashboard.winRate}
          value={formatPercent(stats.winRate)}
          subtitle={`${t.dashboard.avgConfidence}: ${formatPercent(stats.avgConfidence)}`}
          glowColor="green"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
            </svg>
          }
        />
        <StatCard
          title={t.dashboard.totalPnl}
          value={formatUSD(stats.totalPnl)}
          subtitle={`${t.dashboard.roi}: ${formatPercent(stats.roi)}`}
          glowColor="orange"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          }
        />
        <StatCard
          title={t.dashboard.today}
          value={`${stats.todayBets} ${t.dashboard.bets}`}
          subtitle={`${t.dashboard.pnl}: ${formatUSD(stats.todayPnl)}`}
          glowColor="purple"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      {/* Quick actions & bet types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              {t.dashboard.quickActions}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="/markets" className="group block p-4 rounded-lg border border-border bg-secondary/30 hover:border-neon-cyan/30 hover:bg-neon-cyan/5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground group-hover:text-neon-cyan transition-colors">{t.dashboard.browseMarkets}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{t.dashboard.browseMarketsDesc}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground group-hover:text-neon-cyan transition-colors">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </a>
            <a href="/strategy" className="group block p-4 rounded-lg border border-border bg-secondary/30 hover:border-neon-orange/30 hover:bg-neon-orange/5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground group-hover:text-neon-orange transition-colors">{t.dashboard.configStrategy}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{t.dashboard.configStrategyDesc}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground group-hover:text-neon-orange transition-colors">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </a>
            <a href="/history" className="group block p-4 rounded-lg border border-border bg-secondary/30 hover:border-neon-purple/30 hover:bg-neon-purple/5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground group-hover:text-neon-purple transition-colors">{t.dashboard.viewHistory}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{t.dashboard.viewHistoryDesc}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground group-hover:text-neon-purple transition-colors">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </a>
          </CardContent>
        </Card>

        {/* Bet types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 2C12 2 12 22 12 22" /><path d="M2 12C2 12 22 12 22 12" />
              </svg>
              {t.dashboard.betTypes}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 glow-cyan">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 flex items-center justify-center text-neon-cyan font-bold text-sm">ML</div>
                <div>
                  <p className="font-medium text-neon-cyan">{t.dashboard.moneyline}</p>
                  <p className="text-sm text-muted-foreground">{t.dashboard.moneylineDesc}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-neon-purple/20 bg-neon-purple/5 glow-purple">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center text-neon-purple font-bold text-sm">SP</div>
                <div>
                  <p className="font-medium text-neon-purple">{t.dashboard.spread}</p>
                  <p className="text-sm text-muted-foreground">{t.dashboard.spreadDesc}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-neon-orange/20 bg-neon-orange/5 glow-orange">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-orange/20 flex items-center justify-center text-neon-orange font-bold text-sm">OU</div>
                <div>
                  <p className="font-medium text-neon-orange">{t.dashboard.overUnder}</p>
                  <p className="text-sm text-muted-foreground">{t.dashboard.overUnderDesc}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
