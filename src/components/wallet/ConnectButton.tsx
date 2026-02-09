"use client";

import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

export function ConnectButton() {
  const { t } = useI18n();

  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div {...(!ready && { "aria-hidden": true, style: { opacity: 0, pointerEvents: "none" as const, userSelect: "none" as const } })}>
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal} className="relative overflow-hidden">
                    <span className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                      </svg>
                      {t.common.connectWallet}
                    </span>
                  </Button>
                );
              }
              if (chain.unsupported) {
                return <Button variant="destructive" onClick={openChainModal}>{t.common.wrongNetwork}</Button>;
              }
              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    className="h-8 px-3 text-xs rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan hover:bg-neon-cyan/10 transition-all flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                    {chain.name}
                  </button>
                  <button
                    onClick={openAccountModal}
                    className="h-8 px-3 text-xs rounded-lg border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-all"
                  >
                    {account.displayName}{account.displayBalance ? ` (${account.displayBalance})` : ""}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
