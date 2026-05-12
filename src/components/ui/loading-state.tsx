"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label: string;
  hint?: string;
}

export function LoadingState({ label, hint }: LoadingStateProps) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-neon-cyan/10 bg-neon-cyan/[0.04] px-4 py-3 text-sm text-neon-cyan">
      <Loader2 className="h-4 w-4 animate-spin" />
      <div>
        <p className="font-semibold">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
