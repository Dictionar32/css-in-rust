"use client"
/**
 * DesignSystem — demo createStyledSystem() API
 *
 * Design system factory dengan token terpusat.
 * Token di-inject sebagai CSS custom properties --sys-{group}-{name}.
 */
import React from "react"
import { createStyledSystem } from "tailwind-styled-v4"

// -- Buat design system dengan token -------------------------------------------
export const ui = createStyledSystem({
  tokens: {
    colors: {
      primary: "#6366f1",
      danger:  "#ef4444",
      success: "#22c55e",
      muted:   "#6b7280",
    },
    radius: {
      sm:   "0.375rem",
      base: "0.5rem",
      lg:   "0.75rem",
      full: "9999px",
    },
    shadow: {
      sm:   "0 1px 2px rgba(0,0,0,0.05)",
      base: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    },
  },
  components: {
    button: {
      tag: "button",
      base: "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
      variants: {
        intent: {
          primary: "bg-[var(--sys-colors-primary)] text-white hover:opacity-90 focus:ring-[var(--sys-colors-primary)]",
          danger:  "bg-[var(--sys-colors-danger)] text-white hover:opacity-90 focus:ring-[var(--sys-colors-danger)]",
          success: "bg-[var(--sys-colors-success)] text-white hover:opacity-90 focus:ring-[var(--sys-colors-success)]",
          outline: "border-2 border-[var(--sys-colors-primary)] text-[var(--sys-colors-primary)] bg-transparent hover:bg-[var(--sys-colors-primary)] hover:text-white",
        },
        size: {
          sm: "px-3 py-1.5 text-xs",
          md: "px-4 py-2 text-sm",
          lg: "px-5 py-2.5 text-base",
        },
      },
      defaultVariants: { intent: "primary", size: "md" },
    },
    badge: {
      tag: "span",
      base: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
      variants: {
        intent: {
          primary: "bg-[color-mix(in_srgb,var(--sys-colors-primary)_15%,white)] text-[var(--sys-colors-primary)]",
          danger:  "bg-[color-mix(in_srgb,var(--sys-colors-danger)_15%,white)] text-[var(--sys-colors-danger)]",
          success: "bg-[color-mix(in_srgb,var(--sys-colors-success)_15%,white)] text-[var(--sys-colors-success)]",
          muted:   "bg-gray-100 text-[var(--sys-colors-muted)]",
        },
      },
      defaultVariants: { intent: "primary" },
    },
    card: {
      tag: "div",
      base: "rounded-xl border border-gray-200 bg-white p-5 shadow-[var(--sys-shadow-base)]",
    },
  },
})

// -- Komponen dari sistem -------------------------------------------------------
export const SysButton = ui.button()
export const SysBadge  = ui.badge()
export const SysCard   = ui.card()

// -- Token reference accessor --------------------------------------------------
export const primaryVar = ui.token("colors.primary")
export const dangerVar  = ui.token("colors.danger")
