"use client";

import React from "react";
import { useLanguage } from "../context/LanguageContext";

export default function FormInput({
  label,
  type = "text",
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  hint,
  className = "",
  ...props
}) {
  const { tr } = useLanguage();
  const inputId = id || name;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {typeof label === "string" ? tr(label) : label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={typeof placeholder === "string" ? tr(placeholder) : placeholder}
        required={required}
        className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border ${
          error ? "border-red-500 dark:border-red-500" : "border-slate-300 dark:border-slate-700"
        } rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
          error
            ? "focus:ring-red-500/20 focus:border-red-500"
            : "focus:ring-primary-500/20 focus:border-primary-600 dark:focus:border-primary-400"
        } disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500`}
        {...props}
      />
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {typeof hint === "string" ? tr(hint) : hint}
        </p>
      )}
      {error && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

