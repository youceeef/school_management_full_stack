"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import Cookies from "js-cookie";
import {
  DEFAULT_LOCALE,
  LOCALE_META,
  normalizeLocale,
  getDirection,
  translate,
  translatePhrase,
} from "../i18n/translations";

const LanguageContext = createContext({
  locale: DEFAULT_LOCALE,
  dir: "ltr",
  isRtl: false,
  dateLocale: "fr-FR",
  setLocale: () => {},
  t: (key) => key,
  tr: (phrase) => phrase,
});

const getStoredLocale = () => {
  if (typeof window === "undefined") return null;
  try {
    const local = window.localStorage.getItem("eduspace_locale");
    if (local) return normalizeLocale(local);
  } catch {
    // Ignore storage SecurityError in restricted cross-origin iframes
  }
  try {
    const cookie = Cookies.get("eduspace_locale");
    if (cookie) return normalizeLocale(cookie);
  } catch {
    // Ignore cookie access errors
  }
  return null;
};

const setStoredLocale = (localeValue) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("eduspace_locale", localeValue);
  } catch {
    // Ignore storage SecurityError in restricted cross-origin iframes
  }
  try {
    Cookies.set("eduspace_locale", localeValue, { expires: 365, sameSite: "Lax", path: "/" });
  } catch {
    // Ignore cookie errors
  }
};

const applyLocaleToDom = (localeValue) => {
  if (typeof document === "undefined") return;
  const normalized = normalizeLocale(localeValue);
  const dir = getDirection(normalized);
  const root = document.documentElement;
  const body = document.body;

  root.setAttribute("lang", normalized);
  root.setAttribute("dir", dir);
  body?.setAttribute("dir", dir);
};

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = getStoredLocale();
    const initial = saved || DEFAULT_LOCALE;
    setLocaleState(initial);
    applyLocaleToDom(initial);
  }, []);

  const setLocale = useCallback((nextLocale) => {
    const normalized = normalizeLocale(nextLocale);
    setLocaleState(normalized);
    applyLocaleToDom(normalized);
    setStoredLocale(normalized);
  }, []);

  const t = useCallback(
    (key, params) => translate(locale, key, params),
    [locale]
  );

  const tr = useCallback(
    (frenchPhrase) => translatePhrase(locale, frenchPhrase),
    [locale]
  );

  const dir = getDirection(locale);
  const isRtl = dir === "rtl";
  const dateLocale = LOCALE_META[locale]?.dateLocale || "fr-FR";

  const value = useMemo(
    () => ({
      locale,
      dir,
      isRtl,
      dateLocale,
      setLocale,
      t,
      tr,
    }),
    [locale, dir, isRtl, dateLocale, setLocale, t, tr]
  );

  return (
    <LanguageContext.Provider value={value}>
      <div dir={dir} lang={locale} className="min-h-screen">
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
