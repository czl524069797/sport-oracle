"use client";

import Image from "next/image";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useCallback } from "react";
import type { DashboardStats, ApiResponse, BetRecord } from "@/types";
import { formatUSD, formatPercent } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { readApiResponse } from "@/lib/api-response";

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
    <div className={`glass-card rounded-2xl p-5 transition-all duration-300 ${glowClass}`}>
      <div className="mb-3 flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBgClass}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="hero-feature-card rounded-[28px] p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-neon-cyan/10 text-neon-cyan glow-cyan">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold uppercase tracking-wide text-white md:text-2xl">{title}</h3>
          <p className="mt-2 max-w-sm text-sm leading-7 text-slate-300 md:text-base">{description}</p>
        </div>
      </div>
    </div>
  );
}

function HeroSection({ t }: { t: ReturnType<typeof useI18n>["t"] }) {
  return (
    <section className="relative overflow-hidden rounded-none border-y border-neon-cyan/10 bg-[#07111f] sm:rounded-[0] lg:-mx-4 lg:rounded-[32px] lg:border">
      <Image
        src="/images/sport-oracle-main-realistic-2026-05-12.png"
        alt=""
        fill
        priority
        className="object-cover object-center opacity-85"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,15,25,0.12),transparent_42%),linear-gradient(180deg,rgba(3,8,20,0.2),rgba(3,8,20,0.42)_50%,rgba(3,8,20,0.85)),linear-gradient(90deg,rgba(3,8,20,0.72),rgba(3,8,20,0.14)_46%,rgba(3,8,20,0.72))]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.38)),linear-gradient(0deg,rgba(0,240,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.08)_1px,transparent_1px)] bg-[length:auto,48px_48px,48px_48px] [mask-image:linear-gradient(to_top,black,transparent)]" />

      <div className="relative px-4 pb-8 pt-16 sm:px-6 lg:px-10 lg:pb-10 lg:pt-20">
        <div className="mx-auto flex min-h-[480px] max-w-5xl items-center justify-center text-center lg:min-h-[620px]">
          <div className="relative z-10">
            <h1 className="hero-title text-5xl font-black italic tracking-tight text-transparent md:text-7xl lg:text-[7rem]">
              SportOracle
            </h1>
            <p className="mt-4 text-xl font-bold uppercase tracking-wide text-white md:text-3xl">
              AI-DRIVEN SPORTS PREDICTION PLATFORM
            </p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.35em] text-slate-300 md:text-base">
              NBA • Football • eSports • Polymarket
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/markets"
                className="rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-neon-cyan transition hover:bg-neon-cyan/20"
              >
                {t.dashboard.browseMarkets}
              </Link>
              <Link
                href="/strategy"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10"
              >
                {t.dashboard.configStrategy}
              </Link>
            </div>
            <p className="mt-5 text-sm text-slate-400">{t.dashboard.connectPrompt}</p>
          </div>
        </div>

        <div className="relative z-10 mt-6 grid gap-5 lg:grid-cols-3">
          <FeatureCard
            title={t.dashboard.aiAnalysis}
            description={t.dashboard.aiAnalysisDesc}
            icon={
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9.5 2a3.5 3.5 0 00-3.5 3.5V8H5a3 3 0 000 6h1v2.5A3.5 3.5 0 009.5 20H10" />
                <path d="M14.5 2A3.5 3.5 0 0118 5.5V8h1a3 3 0 010 6h-1v2.5a3.5 3.5 0 01-3.5 3.5H14" />
                <path d="M10 8h4" />
                <path d="M10 12h4" />
                <path d="M10 16h4" />
                <path d="M3 12h2" />
                <path d="M19 12h2" />
              </svg>
            }
          />
          <FeatureCard
            title={t.dashboard.smartBetting}
            description={t.dashboard.smartBettingDesc}
            icon={
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2v20" />
                <path d="M5 12H2a10 10 0 0020 0h-3" />
                <circle cx="12" cy="5" r="3" />
                <path d="M6 20l6-6 6 6" />
              </svg>
            }
          />
          <FeatureCard
            title={t.dashboard.polymarket}
            description={t.dashboard.polymarketDesc}
            icon={
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 4h7l7 4v12H12L5 16V4z" />
                <path d="M12 4v16" />
                <path d="M5 10l7 4 7-4" />
              </svg>
            }
          />
        </div>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats>({
    totalBets: 0,
    winRate: 0,
    totalPnl: 0,
    roi: 0,
    activeBets: 0,
    todayBets: 0,
    todayPnl: 0,
    avgConfidence: 0,
  });

  const fetchStats = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/betting?wallet=${address}`);
      const data: ApiResponse<BetRecord[]> = await readApiResponse(res);
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
        avgConfidence:
          bets.length > 0
            ? bets.reduce((s, b) => s + (b.analysis?.confidence ?? 0), 0) / bets.length
            : 0,
      });
    } catch {
      // silently fail
    }
  }, [address]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (!isConnected) {
    return (
      <div className="-mt-8">
        <HeroSection t={t} />
      </div>
    );
  }

  return (
    <div className="-mt-8 space-y-8">
      <HeroSection t={t} />

      <div className="flex items-center gap-3">
        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-neon-cyan to-neon-blue" />
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t.dashboard.title}</h2>
          <p className="mt-0.5 text-muted-foreground">{t.dashboard.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title={t.dashboard.totalBets}
          value={stats.totalBets.toString()}
          subtitle={`${stats.activeBets} ${t.common.active.toLowerCase()}`}
          glowColor="cyan"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22V8" />
              <path d="M5 12H2a10 10 0 0020 0h-3" />
              <circle cx="12" cy="5" r="3" />
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
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
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
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
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
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
            <Link href="/markets" className="group block rounded-lg border border-border bg-secondary/30 p-4 transition-all duration-200 hover:border-neon-cyan/30 hover:bg-neon-cyan/5 active:scale-[0.98]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground transition-colors group-hover:text-neon-cyan">{t.dashboard.browseMarkets}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.dashboard.browseMarketsDesc}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground transition-colors group-hover:text-neon-cyan">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
            <Link href="/strategy" className="group block rounded-lg border border-border bg-secondary/30 p-4 transition-all duration-200 hover:border-neon-orange/30 hover:bg-neon-orange/5 active:scale-[0.98]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground transition-colors group-hover:text-neon-orange">{t.dashboard.configStrategy}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.dashboard.configStrategyDesc}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground transition-colors group-hover:text-neon-orange">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
            <Link href="/history" className="group block rounded-lg border border-border bg-secondary/30 p-4 transition-all duration-200 hover:border-neon-purple/30 hover:bg-neon-purple/5 active:scale-[0.98]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground transition-colors group-hover:text-neon-purple">{t.dashboard.viewHistory}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.dashboard.viewHistoryDesc}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground transition-colors group-hover:text-neon-purple">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2C12 2 12 22 12 22" />
                <path d="M2 12C2 12 22 12 22 12" />
              </svg>
              {t.dashboard.betTypes}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 p-4 glow-cyan">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-cyan/20 text-sm font-bold text-neon-cyan">ML</div>
                <div>
                  <p className="font-medium text-neon-cyan">{t.dashboard.moneyline}</p>
                  <p className="text-sm text-muted-foreground">{t.dashboard.moneylineDesc}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-neon-purple/20 bg-neon-purple/5 p-4 glow-purple">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-purple/20 text-sm font-bold text-neon-purple">SP</div>
                <div>
                  <p className="font-medium text-neon-purple">{t.dashboard.spread}</p>
                  <p className="text-sm text-muted-foreground">{t.dashboard.spreadDesc}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-neon-orange/20 bg-neon-orange/5 p-4 glow-orange">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-orange/20 text-sm font-bold text-neon-orange">OU</div>
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
