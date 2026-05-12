"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const RainbowConnectButton = dynamic(
  () => import("@/components/wallet/RainbowConnectButton").then((mod) => mod.RainbowConnectButton),
  { ssr: false, loading: () => <ConnectButtonFallback /> },
);

function WalletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

function ConnectButtonFallback() {
  const { t } = useI18n();

  return (
    <Button
      disabled
      className="h-12 rounded-full border border-neon-cyan/40 bg-gradient-to-r from-[#8ef7f4] to-[#58a6ff] px-7 text-sm font-black uppercase tracking-[0.08em] text-[#08111f] shadow-[0_0_18px_rgba(0,240,255,0.35)]"
    >
      <span className="flex items-center gap-2">
        <WalletIcon />
        {t.common.connectWallet}
      </span>
    </Button>
  );
}

export function ConnectButton() {
  return <RainbowConnectButton />;
}
