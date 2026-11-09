"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";

const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
});

const getStoredTheme = () => {
  if (typeof window === "undefined") return null;
  try {
    const local = window.localStorage.getItem("theme");
    if (local === "dark" || local === "light") return local;
  } catch {
    // Ignore storage SecurityError in restricted cross-origin iframes
  }
  try {
    const cookie = Cookies.get("theme");
    if (cookie === "dark" || cookie === "light") return cookie;
  } catch {
    // Ignore cookie access errors
  }
  return null;
};

const setStoredTheme = (themeValue) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("theme", themeValue);
  } catch {
    // Ignore storage SecurityError in restricted cross-origin iframes
  }
  try {
    Cookies.set("theme", themeValue, { expires: 365, sameSite: "Lax", path: "/" });
  } catch {
    // Ignore cookie errors
  }
};

const applyThemeToDom = (isDark) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;

  if (isDark) {
    root.classList.add("dark");
    root.classList.remove("light");
    body?.classList.add("dark");
    body?.classList.remove("light");
    root.style.colorScheme = "dark";
    root.setAttribute("data-theme", "dark");
    body?.setAttribute("data-theme", "dark");
    root.style.setProperty("--background", "#0f172a");
    root.style.setProperty("--foreground", "#f1f5f9");
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
    body?.classList.remove("dark");
    body?.classList.add("light");
    root.style.colorScheme = "light";
    root.setAttribute("data-theme", "light");
    body?.setAttribute("data-theme", "light");
    root.style.setProperty("--background", "#f8fafc");
    root.style.setProperty("--foreground", "#0f172a");
  }
};

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = getStoredTheme();
    let initialDark = false;

    if (savedTheme === "dark" || savedTheme === "light") {
      initialDark = savedTheme === "dark";
    } else if (typeof window !== "undefined" && window.matchMedia) {
      try {
        initialDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } catch {
        initialDark = false;
      }
    }

    setDarkMode(initialDark);
    applyThemeToDom(initialDark);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      applyThemeToDom(next);
      setStoredTheme(next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div
        data-theme={darkMode ? "dark" : "light"}
        className={
          darkMode
            ? "dark min-h-screen bg-slate-950 text-slate-100 transition-colors duration-150"
            : "min-h-screen bg-slate-50 text-slate-900 transition-colors duration-150"
        }
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
