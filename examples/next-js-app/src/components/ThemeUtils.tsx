/**
 * ThemeUtils — demo t.bg(), cssVar(), twVar(), v4Tokens API
 *
 * Helper untuk reference CSS variables sebagai Tailwind arbitrary values.
 */
import { tw, t, cssVar, twVar, v4Tokens, createTheme } from "tailwind-styled-v4"

// -- createTheme — typed token map ---------------------------------------------
const theme = createTheme({
  colors: {
    bg:      "color-background",
    fg:      "color-foreground",
    surface: "color-surface",
    accent:  "color-accent",
  },
  fonts: {
    sans: "font-sans",
    mono: "font-mono",
  },
})

// -- Komponen menggunakan t.bg(), t.text(), dll ---------------------------------
// t.bg("color-background") → "bg-[var(--color-background)]"
export const ThemeAwareCard = tw.div({
  base: `
    rounded-xl p-5 border
    bg-[var(--surface)] text-[var(--foreground)]
    border-[color-mix(in_srgb,var(--foreground)_10%,transparent)]
  `,
})

// Menggunakan createTheme untuk type-safe token references
export const ThemeHeading = tw.h3({
  base: `text-lg font-bold ${t.text("color-foreground")}`,
})

// cssVar() dan twVar() untuk arbitrary values
export const AccentBox = tw.div({
  base: `
    rounded-lg p-4
    border-l-4 border-l-[var(--accent)]
    bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]
  `,
})

// v4Tokens — pre-built references untuk token Tailwind v4 standar
export const V4TokensDemo = tw.div({
  base: `
    rounded-xl p-4
    ${v4Tokens.bg}
    ${v4Tokens.text}
    font-[${v4Tokens.fontSans}]
  `,
})

// Export theme untuk dipakai di JSX
export { theme, cssVar, twVar }
