"use client";

import { ReactNode, useEffect, useState, createContext, useContext } from "react";

const STORAGE_KEY = "tw-theme-preference";

/**
 * Get theme preference:
 * 1. localStorage (user's explicit choice)
 * 2. 'light' (let Tailwind handle prefers-color-scheme)
 */
function getThemePreference(): "light" | "dark" {
  if (typeof localStorage === "undefined") return "light";

  const stored = localStorage.getItem(STORAGE_KEY);
  return (stored === "light" || stored === "dark") ? stored : "light";
}

/**
 * Apply theme by setting data-theme attribute
 * CSS (globals.css) handles the rest via [data-theme] selectors
 */
function applyTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
}

interface ThemeContextType {
  mounted: boolean;
  theme: "light" | "dark" | null;
  setTheme: (theme: "light" | "dark") => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * ThemeProvider — Ultra-minimal theme management
 * 
 * Let Tailwind handle CSS custom properties.
 * We just:
 * 1. Apply stored theme preference on mount
 * 2. Provide context for components
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    // Apply stored preference after hydration
    const currentTheme = getThemePreference();
    setThemeState(currentTheme);
    applyTheme(currentTheme);
    setMounted(true);
  }, []);

  const setTheme = (newTheme: "light" | "dark") => {
    localStorage.setItem(STORAGE_KEY, newTheme);
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ mounted, theme: theme || "light", setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
