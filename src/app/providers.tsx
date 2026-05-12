"use client";

import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/i18n";
import { useState, type ReactNode } from "react";

const WalletProviders = dynamic(
  () => import("@/components/wallet/WalletProviders").then((mod) => mod.WalletProviders),
  { ssr: false },
);

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <WalletProviders>{children}</WalletProviders>
      </QueryClientProvider>
    </I18nProvider>
  );
}
