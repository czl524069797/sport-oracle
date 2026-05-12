"use client";

import { Activity, BarChart3, Gamepad2, History, SlidersHorizontal, Trophy } from "lucide-react";
import type { ReactNode } from "react";

type VisualVariant = "markets" | "football" | "esports" | "strategy" | "history";

interface PageVisualProps {
  variant: VisualVariant;
}

const variantConfig = {
  markets: {
    accent: "cyan",
    icon: BarChart3,
    glow: "from-neon-cyan/30 via-neon-blue/15 to-transparent",
    line: "stroke-neon-cyan",
    fill: "bg-neon-cyan",
    ring: "border-neon-cyan/40",
  },
  football: {
    accent: "emerald",
    icon: Trophy,
    glow: "from-emerald-400/30 via-green-500/15 to-transparent",
    line: "stroke-emerald-400",
    fill: "bg-emerald-400",
    ring: "border-emerald-400/40",
  },
  esports: {
    accent: "violet",
    icon: Gamepad2,
    glow: "from-violet-400/30 via-purple-500/15 to-transparent",
    line: "stroke-violet-400",
    fill: "bg-violet-400",
    ring: "border-violet-400/40",
  },
  strategy: {
    accent: "amber",
    icon: SlidersHorizontal,
    glow: "from-amber-400/30 via-neon-orange/15 to-transparent",
    line: "stroke-amber-400",
    fill: "bg-amber-400",
    ring: "border-amber-400/40",
  },
  history: {
    accent: "blue",
    icon: History,
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
    <div className="relative min-h-[136px] overflow-hidden rounded-2xl border border-white/10 bg-[#07111f]/80 shadow-[0_18px_60px_rgba(0,0,0,0.28)] lg:min-h-[156px]">
      <div className={`absolute inset-0 bg-gradient-to-br ${config.glow}`} />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px]" />
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-white/10" />
      <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full border border-white/10" />

      <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 420 180" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M18 135 C 64 82, 106 142, 152 82 S 248 52, 294 100 S 362 128, 402 44"
          className={`${config.line} drop-shadow-[0_0_10px_currentColor]`}
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M18 144 C 76 108, 120 126, 170 104 S 256 72, 314 86 S 374 74, 408 58"
          className={`${config.line} opacity-30`}
          strokeWidth="2"
          fill="none"
        />
      </svg>

      <div className="relative z-10 flex h-full min-h-[136px] items-center justify-between gap-6 p-5 lg:min-h-[156px] lg:p-6">
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

        <div className="relative h-24 w-24">
          <div className={`absolute inset-0 rounded-full ${config.fill}/10`} />
          <div className={`absolute inset-4 rounded-full border ${config.ring}`} />
          <div className={`absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${config.fill} shadow-[0_0_24px_currentColor]`} />
          <Activity className="absolute right-1 top-2 text-white/70" size={18} />
        </div>
      </div>
    </div>
  );
}
