"use client";

import React from "react";

export default function FormInput({ label, type = "text", id, name, value, onChange, placeholder, required = false, error, className = "", ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 border ${error ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-dark-border"} rounded-md focus:outline-none focus:ring-2 ${
          error ? "focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500" : "focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
        } dark:bg-dark-card dark:text-dark-text dark:placeholder-dark-muted transition-colors duration-200`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
