"use client";

import React from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "../context/LanguageContext";

export default function SearchInput({ placeholder, value, onChange, onClear, className = "" }) {
  const { tr, t, isRtl } = useLanguage();
  const resolvedPlaceholder = placeholder ? tr(placeholder) : t("common.search");

  return (
    <div className={`relative ${className}`}>
      <div
        className={`absolute inset-y-0 ${
          isRtl ? "right-0 pr-3" : "left-0 pl-3"
        } flex items-center pointer-events-none`}
      >
        <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
      </div>
      <input
        type="text"
        placeholder={resolvedPlaceholder}
        value={value}
        onChange={onChange}
        className={`w-full ${
          isRtl ? "pr-9 pl-8" : "pl-9 pr-8"
        } py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 dark:focus:border-primary-400`}
      />
      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          aria-label={tr("Effacer la recherche")}
          className={`absolute inset-y-0 ${
            isRtl ? "left-0 pl-2.5" : "right-0 pr-2.5"
          } flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300`}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

