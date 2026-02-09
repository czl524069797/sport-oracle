"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/i18n";

const languages = [
  { code: "zh", label: "中文", flag: "CN" },
  { code: "en", label: "English", flag: "EN" },
] as const;

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = languages.find((l) => l.code === locale) ?? languages[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="h-8 px-2.5 text-xs rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-neon-cyan/30 transition-all flex items-center gap-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
        <span className="font-medium">{current.flag}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-32 rounded-lg glass-card border border-neon-cyan/15 shadow-neon-cyan py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLocale(lang.code);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                locale === lang.code
                  ? "text-neon-cyan bg-neon-cyan/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-neon-cyan/5"
              }`}
            >
              <span className="font-medium w-6">{lang.flag}</span>
              <span>{lang.label}</span>
              {locale === lang.code && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="ml-auto text-neon-cyan">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
