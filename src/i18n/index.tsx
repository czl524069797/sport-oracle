"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import zh, { type Translations } from "./zh";
import en from "./en";

export type Locale = "zh" | "en";

const translations: Record<Locale, Translations> = { zh, en };

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "zh",
  t: zh,
  setLocale: () => {},
  toggleLocale: () => {},
});

const STORAGE_KEY = "nba-predict-locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && (saved === "zh" || saved === "en")) {
      setLocaleState(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh" : "en";
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "zh" ? "en" : "zh");
  }, [locale, setLocale]);

  return (
    <I18nContext.Provider
      value={{
        locale,
        t: translations[locale],
        setLocale,
        toggleLocale,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function getTeamName(teamName: string, locale: Locale): string {
  if (locale === "zh") {
    return translations.zh.teams[teamName] ?? teamName;
  }
  return teamName;
}

const DATE_LOCALE_MAP: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en-US",
};

export function useLocaleDateFormat() {
  const { locale } = useI18n();
  const dateLocale = DATE_LOCALE_MAP[locale];

  const formatGameDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString(dateLocale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString(dateLocale, {
      month: "short",
      day: "numeric",
    });
  };

  return { dateLocale, formatGameDate, formatShortDate };
}
