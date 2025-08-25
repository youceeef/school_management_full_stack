"use client";

import React from "react";

export default function FormSelect({ label, id, name, value, onChange, options = [], required = false, error, placeholder = "Sélectionner une option", className = "", ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-3 py-2 border ${error ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-dark-border"} rounded-md focus:outline-none focus:ring-2 ${
          error ? "focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500" : "focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
        } dark:bg-dark-card dark:text-dark-text appearance-none transition-colors duration-200`}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
