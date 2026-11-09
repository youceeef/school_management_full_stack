"use client";

import React from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

export default function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useTheme();
  const { t } = useLanguage();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleDarkMode();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-testid="theme-toggle"
      aria-pressed={darkMode}
      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer select-none shrink-0"
      aria-label={darkMode ? t("common.activateLight") : t("common.activateDark")}
      title={darkMode ? t("common.switchToLight") : t("common.switchToDark")}
    >
      {darkMode ? (
        <>
          <SunIcon className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline text-xs font-medium">{t("common.themeLight")}</span>
        </>
      ) : (
        <>
          <MoonIcon className="h-4 w-4 text-slate-600 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline text-xs font-medium">{t("common.themeDark")}</span>
        </>
      )}
    </button>
  );
}
