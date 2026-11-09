"use client";

import React from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function StatsCard({ title, value, subtitle, icon: Icon, loading = false }) {
  const { tr } = useLanguage();
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
          {typeof title === "string" ? tr(title) : title}
        </p>
        {loading ? (
          <div className="animate-pulse mt-2.5">
            <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        ) : (
          <p className="mt-2 text-2xl font-semibold font-mono tabular-nums tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
        )}
        {subtitle && !loading && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {typeof subtitle === "string" ? tr(subtitle) : subtitle}
          </p>
        )}
      </div>
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-center shrink-0 text-primary-600 dark:text-primary-400">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

