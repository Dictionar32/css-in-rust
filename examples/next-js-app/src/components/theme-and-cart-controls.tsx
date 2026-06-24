"use client";

import { useMemo, useState } from "react";
import { tw } from "tailwind-styled-v4";

/**
 * ThemeAndCartControls — tw object config API
 *
 * tw.button({ base, variants, defaultVariants }) — build time.
 */

const ThemeButton = tw.button({
  base: `
    inline-flex items-center gap-2 rounded-full
    border border-[color-mix(in_srgb,var(--foreground)_15%,transparent)]
    px-3 py-1.5 text-sm font-medium
    hover:bg-[var(--surface-muted)] transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--accent)]
  `,
})

const tokenPresets = {
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

type ThemeMode = keyof typeof tokenPresets;

function applyTokens(theme: ThemeMode) {
  const vars = tokenPresets[theme].vars;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

export function ThemeAndCartControls() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const nextTheme = useMemo<ThemeMode>(
    () => (theme === "light" ? "dark" : "light"),
    [theme],
  );
  const next = tokenPresets[nextTheme];

  return (
    <ThemeButton
      type="button"
      onClick={() => {
        setTheme(nextTheme);
        applyTokens(nextTheme);
      }}
      aria-label={`Switch to ${next.label} mode`}
    >
      <span aria-hidden="true">{next.icon}</span>
      {next.label}
    </ThemeButton>
  );
}
