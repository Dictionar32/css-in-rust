"use client";

import { useMemo } from "react";
import { tw } from "tailwind-styled-v4";
import { useTheme, getNextTheme } from "@/hooks/useTheme";

/**
 * ThemeAndCartControls — theme switching dengan persistence
 *
 * Features:
 * - Persistent theme preference (localStorage)
 * - Syncs dengan system preference (prefers-color-scheme)
 * - Auto-detection saat user change system settings
 * - No flash of wrong theme (SSR-safe init script)
 */

const ThemeButton = tw.button({
  base: `
    inline-flex items-center gap-2 rounded-full
    border border-[color-mix(in_srgb,var(--foreground)_15%,transparent)]
    px-3 py-1.5 text-sm font-medium
    hover:bg-[var(--surface-muted)] transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--accent)]
  `,
  // Wave 3: Semantic metadata untuk theme toggle button
  '@semantic': 'button',
  '@aria': {
    role: 'button',
    'aria-label': 'Toggle theme',
  },
  '@state': {
    disabled: 'aria-disabled',
  },
});

export function ThemeAndCartControls() {
  const { theme, toggleTheme, presets, isLoaded } = useTheme();

  // Get next theme untuk display
  const nextTheme = useMemo(() => getNextTheme(theme), [theme]);
  const nextPreset = presets[nextTheme];

  // Prevent render sebelum hydrate selesai
  if (!isLoaded) {
    return (
      <ThemeButton disabled aria-busy="true">
        <span aria-hidden="true">⏳</span>
        Loading...
      </ThemeButton>
    );
  }

  return (
    <ThemeButton
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextPreset.label} mode`}
      title={`Current: ${theme} mode • Click to switch to ${nextTheme}`}
    >
      <span aria-hidden="true">{nextPreset.icon}</span>
      {nextPreset.label}
    </ThemeButton>
  );
}
