"use client";

import React from "react";
import { SUPPORTED_LOCALES, LOCALE_META } from "../i18n/translations";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSwitcher({ className = "" }) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("common.selectLanguage")}
      data-testid="language-switcher"
      className={`inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 shrink-0 ${className}`}
    >
      {SUPPORTED_LOCALES.map((code) => {
        const meta = LOCALE_META[code];
        const isActive = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLocale(code);
            }}
            data-testid={`lang-${code}`}
            aria-pressed={isActive}
            aria-label={`${t("common.language")}: ${meta.label}`}
            title={meta.label}
            className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer select-none ${
              isActive
                ? "bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {meta.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
