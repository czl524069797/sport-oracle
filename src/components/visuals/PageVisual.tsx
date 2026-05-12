"use client";

import { Activity, BarChart3, Gamepad2, History, SlidersHorizontal, Trophy } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

type VisualVariant = "markets" | "football" | "esports" | "strategy" | "history";

interface PageVisualProps {
  variant: VisualVariant;
}

const variantConfig = {
  markets: {
    accent: "cyan",
    icon: BarChart3,
    image: "/images/generated/sport-oracle-nba-markets-2026-05-12.png",
    glow: "from-neon-cyan/30 via-neon-blue/15 to-transparent",
    line: "stroke-neon-cyan",
    fill: "bg-neon-cyan",
    ring: "border-neon-cyan/40",
  },
  football: {
    accent: "emerald",
    icon: Trophy,
    image: "/images/generated/sport-oracle-football-2026-05-12.png",
    glow: "from-emerald-400/30 via-green-500/15 to-transparent",
    line: "stroke-emerald-400",
    fill: "bg-emerald-400",
    ring: "border-emerald-400/40",
  },
  esports: {
    accent: "violet",
    icon: Gamepad2,
    image: "/images/sport-oracle-main-realistic-2026-05-12.png",
    glow: "from-violet-400/30 via-purple-500/15 to-transparent",
    line: "stroke-violet-400",
    fill: "bg-violet-400",
    ring: "border-violet-400/40",
  },
  strategy: {
    accent: "amber",
    icon: SlidersHorizontal,
    image: "/images/generated/sport-oracle-nba-markets-2026-05-12.png",
    glow: "from-amber-400/30 via-neon-orange/15 to-transparent",
    line: "stroke-amber-400",
    fill: "bg-amber-400",
    ring: "border-amber-400/40",
  },
  history: {
    accent: "blue",
    icon: History,
    image: "/images/generated/sport-oracle-football-2026-05-12.png",
    glow: "from-sky-400/30 via-neon-blue/15 to-transparent",
    line: "stroke-sky-400",
    fill: "bg-sky-400",
    ring: "border-sky-400/40",
  },
} as const;

function MetricPill({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-slate-200 shadow-[0_0_18px_rgba(0,0,0,0.18)]">
      {children}
    </div>
  );
}

export function PageVisual({ variant }: PageVisualProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className="relative min-h-[168px] overflow-hidden rounded-2xl border border-white/10 bg-[#07111f]/80 shadow-[0_18px_60px_rgba(0,0,0,0.28)] lg:min-h-[190px]">
      <Image
        src={config.image}
        alt=""
        fill
        unoptimized
        className="object-cover object-center opacity-80"
        sizes="(min-width: 1024px) 420px, 100vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,10,22,0.86),rgba(5,10,22,0.36)_48%,rgba(5,10,22,0.78)),linear-gradient(180deg,rgba(5,10,22,0.1),rgba(5,10,22,0.72))]" />
      <div className={`absolute inset-0 bg-gradient-to-br ${config.glow}`} />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:24px_24px]" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative z-10 flex h-full min-h-[168px] items-center justify-between gap-6 p-5 lg:min-h-[190px] lg:p-6">
        <div className="space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-white">
            <Icon size={24} strokeWidth={1.8} />
          </div>
          <div className="flex flex-wrap gap-2">
            <MetricPill>67%</MetricPill>
            <MetricPill>+12.4</MetricPill>
            <MetricPill>0.41</MetricPill>
          </div>
        </div>

        <div className="relative h-28 w-28 rounded-3xl border border-white/10 bg-black/25 backdrop-blur-sm">
          <div className={`absolute inset-3 rounded-2xl ${config.fill}/10`} />
          <div className={`absolute inset-6 rounded-full border ${config.ring}`} />
          <div className={`absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${config.fill} shadow-[0_0_24px_currentColor]`} />
          <Activity className="absolute right-4 top-4 text-white/70" size={18} />
        </div>
      </div>
    </div>
  );
}
