"use client";

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import type { ReactNode } from "react";
import { config } from "@/lib/wagmi";

import "@rainbow-me/rainbowkit/styles.css";

export function WalletProviders({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: "#3b82f6",
          accentColorForeground: "white",
          borderRadius: "medium",
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
