"use client";

import React from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "../context/LanguageContext";

export default function FormSelect({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  required = false,
  error,
  placeholder = "Sélectionner une option",
  className = "",
  ...props
}) {
  const { tr, isRtl } = useLanguage();
  const selectId = id || name;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {typeof label === "string" ? tr(label) : label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full ${
            isRtl ? "pr-3.5 pl-10" : "pl-3.5 pr-10"
          } py-2 text-sm bg-white dark:bg-slate-900 border ${
            error ? "border-red-500 dark:border-red-500" : "border-slate-300 dark:border-slate-700"
          } rounded-lg text-slate-900 dark:text-slate-100 appearance-none focus:outline-none focus:ring-2 ${
            error
              ? "focus:ring-red-500/20 focus:border-red-500"
              : "focus:ring-primary-500/20 focus:border-primary-600 dark:focus:border-primary-400"
          }`}
          {...props}
        >
          <option value="" disabled>
            {typeof placeholder === "string" ? tr(placeholder) : placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {typeof option.label === "string" ? tr(option.label) : option.label}
            </option>
          ))}
        </select>
        <div
          className={`pointer-events-none absolute inset-y-0 ${
            isRtl ? "left-0 pl-3" : "right-0 pr-3"
          } flex items-center text-slate-400 dark:text-slate-500`}
        >
          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

