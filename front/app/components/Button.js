"use client";

import React from "react";
import { useLanguage } from "../context/LanguageContext";

const Button = React.forwardRef(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      children,
      loading = false,
      icon = null,
      type = "button",
      ...props
    },
    ref
  ) => {
    const { tr } = useLanguage();
    const baseClasses =
      "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-primary-600 hover:bg-primary-700 text-white focus-visible:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-500 shadow-xs",
      secondary:
        "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 focus-visible:ring-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700",
      danger:
        "bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500 dark:bg-red-600 dark:hover:bg-red-500",
      success:
        "bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500",
      warning:
        "bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500",
      ghost:
        "bg-transparent hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
      "table-action":
        "text-xs px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 rounded-lg",
      md: "text-sm px-4 py-2 rounded-lg",
      lg: "text-sm px-5 py-2.5 rounded-lg",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
        {...props}
        disabled={loading || props.disabled}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4 text-current shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon && (
            <span className="shrink-0 inline-flex items-center">
              {React.isValidElement(icon)
                ? icon
                : typeof icon === "function" || (typeof icon === "object" && icon !== null)
                ? React.createElement(icon, { className: "w-4 h-4 shrink-0" })
                : null}
            </span>
          )
        )}
        {typeof children === "string" ? tr(children) : children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

