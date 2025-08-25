"use client";

import React from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" aria-label={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}>
      {darkMode ? <SunIcon className="h-5 w-5 text-yellow-500" /> : <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
    </button>
  );
}
