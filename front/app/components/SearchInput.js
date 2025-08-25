"use client";

import React from "react";

export default function SearchInput({ placeholder, value, onChange, className = "" }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400 dark:text-dark-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      </div>
      <input
        type="text"
        placeholder={placeholder || "Rechercher..."}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 pl-10 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-primary-400 focus:border-blue-500 dark:focus:border-primary-400 dark:bg-dark-card dark:text-dark-text dark:placeholder-dark-muted search-input transition-colors duration-200 ${className}`}
      />
    </div>
  );
}
