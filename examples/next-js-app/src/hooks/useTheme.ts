"use client";

import { useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "tw-theme-preference";

const themePresets = {
    light: {
        label: "Light",
        icon: "☀️",
        vars: {
            "--background": "#f5f7fb",
            "--foreground": "#111827",
            "--surface": "#ffffff",
            "--surface-muted": "#eef2ff",
            "--accent": "#2563eb",
            "--accent-hover": "#1d4ed8",
            "--accent-contrast": "#eff6ff",
        },
    },
    dark: {
        label: "Dark",
        icon: "🌙",
        vars: {
            "--background": "#070b16",
            "--foreground": "#e5e7eb",
            "--surface": "#0f172a",
            "--surface-muted": "#111b34",
            "--accent": "#60a5fa",
            "--accent-hover": "#93c5fd",
            "--accent-contrast": "#0b1220",
        },
    },
} as const;

/**
 * Get system preference via matchMedia
 * Returns "light" atau "dark" based on prefers-color-scheme
 */
function getSystemPreference(): ThemeMode {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

/**
 * Get stored preference dari localStorage
 * Returns null jika belum ada preference tersimpan
 */
function getStoredPreference(): ThemeMode | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as ThemeMode) || null;
}

/**
 * Apply theme ke DOM
 * Set data-theme attribute dan CSS variables
 */
function applyTheme(theme: ThemeMode): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const preset = themePresets[theme];

    root.setAttribute("data-theme", theme);
    for (const [key, value] of Object.entries(preset.vars)) {
        root.style.setProperty(key, value);
    }
}

/**
 * Save preference ke localStorage
 */
function savePreference(theme: ThemeMode): void {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * useTheme hook — complete theme management
 * - Detects stored preference
 * - Falls back ke system preference
 * - Syncs dengan prefers-color-scheme changes
 * - Persists pilihan ke localStorage
 */
export function useTheme() {
    const [theme, setTheme] = useState<ThemeMode>("light");
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize theme on mount
    useEffect(() => {
        const storedTheme = getStoredPreference();
        const initialTheme = storedTheme || getSystemPreference();
        setTheme(initialTheme);
        applyTheme(initialTheme);
        setIsLoaded(true);
    }, []);

    // Listen untuk system preference changes
    useEffect(() => {
        if (!isLoaded) return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleChange = (e: MediaQueryListEvent) => {
            const storedTheme = getStoredPreference();
            // Hanya update jika user belum pernah set preference
            // (masih follow system preference)
            if (!storedTheme) {
                const newTheme = e.matches ? "dark" : "light";
                setTheme(newTheme);
                applyTheme(newTheme);
            }
        };

        // Gunakan addEventListener untuk compatibility
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [isLoaded]);

    // Callback untuk toggle theme
    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const nextTheme = prev === "light" ? "dark" : "light";
            applyTheme(nextTheme);
            savePreference(nextTheme);
            return nextTheme;
        });
    }, []);

    // Callback untuk set theme ke value spesifik
    const setThemeMode = useCallback((mode: ThemeMode) => {
        applyTheme(mode);
        savePreference(mode);
        setTheme(mode);
    }, []);

    return {
        theme,
        toggleTheme,
        setTheme: setThemeMode,
        isLoaded,
        presets: themePresets,
    };
}

/**
 * Get next theme untuk UI display
 */
export function getNextTheme(current: ThemeMode) {
    return current === "light" ? "dark" : "light";
}
