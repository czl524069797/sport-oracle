import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { AppHeader, AppFooter } from "@/components/layout/AppShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SportOracle - AI Sports Prediction Platform",
  description:
    "AI-powered sports prediction platform covering NBA, football, and esports. Analyze odds, track markets, and make smarter bets on Polymarket.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "SportOracle",
    description: "AI-Powered Sports Predictions on Polymarket",
    siteName: "SportOracle",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen flex flex-col bg-grid relative">
            {/* Background radial glow */}
            <div className="fixed inset-0 bg-gradient-radial from-neon-cyan/[0.02] via-transparent to-transparent pointer-events-none" />
            <AppHeader />
            <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
              {children}
            </main>
            <AppFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
