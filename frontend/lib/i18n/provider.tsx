"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANG, DICT, LANG_STORAGE_KEY, type I18nKey, type Lang } from "./dict";

function isLang(x: string | null | undefined): x is Lang {
  return x === "zh-CN" || x === "en";
}

function getLangFromLocation(): Lang | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const q = url.searchParams.get("lang");
  if (isLang(q)) return q;
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  if (isLang(stored)) return stored;
  return null;
}

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: I18nKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const initial = getLangFromLocation();
    if (initial) setLangState(initial);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LANG_STORAGE_KEY, next);
    // 同步 URL（可分享）
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url.toString());
  }, []);

  const t = useCallback(
    (key: I18nKey) => {
      const v = DICT[lang]?.[key];
      if (typeof v === "string" && v) return v;
      return DICT[DEFAULT_LANG][key] ?? key;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: DEFAULT_LANG,
      setLang: () => {},
      t: (key) => DICT[DEFAULT_LANG][key] ?? key,
    };
  }
  return ctx;
}

