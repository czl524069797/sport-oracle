"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  binanceWallet,
  injectedWallet,
  okxWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { polygon } from "wagmi/chains";
import { http } from "wagmi";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export const config = getDefaultConfig({
  appName: "Sport Oracle",
  projectId,
  chains: [polygon],
  wallets: [
    {
      groupName: "Recommended",
      wallets: [
        okxWallet,
        binanceWallet,
        walletConnectWallet,
        injectedWallet,
      ],
    },
  ],
  transports: {
    [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL),
  },
  ssr: true,
});
