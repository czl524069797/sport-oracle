"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useI18n } from "@/i18n";

function BasketballIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="animate-bounce-ball">
      <circle cx="12" cy="12" r="10" stroke="#00f0ff" strokeWidth="1.5" />
      <path d="M12 2C12 2 12 22 12 22" stroke="#00f0ff" strokeWidth="1" opacity="0.5" />
      <path d="M2 12C2 12 22 12 22 12" stroke="#00f0ff" strokeWidth="1" opacity="0.5" />
      <path d="M4.93 4.93C8 8 8 16 4.93 19.07" stroke="#00f0ff" strokeWidth="1" opacity="0.4" />
      <path d="M19.07 4.93C16 8 16 16 19.07 19.07" stroke="#00f0ff" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

export function AppHeader() {
  const { t } = useI18n();
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: t.nav.dashboard },
    { href: "/markets", label: t.nav.markets },
    { href: "/football", label: t.nav.football },
    { href: "/esports", label: t.nav.esports },
    { href: "/strategy", label: t.nav.strategy },
    { href: "/history", label: t.nav.history },
  ];

  return (
    <header className="glass border-b border-neon-cyan/10 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <BasketballIcon />
            <span className="text-xl font-bold bg-gradient-to-r from-neon-cyan to-neon-blue bg-clip-text text-transparent text-glow-cyan">
              {t.nav.brand}
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative px-3 py-2 text-sm rounded-lg transition-all duration-200
                    ${isActive
                      ? "text-neon-cyan bg-neon-cyan/10"
                      : "text-muted-foreground hover:text-neon-cyan/80 hover:bg-neon-cyan/5"
                    }
                  `}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-neon-cyan rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

export function AppFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-neon-cyan/5 py-6 relative z-10">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t.footer.text}
        </p>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
          <span className="text-xs text-muted-foreground">System Online</span>
        </div>
      </div>
    </footer>
  );
}
