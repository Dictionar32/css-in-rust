/**
 * ExtendDemo — demo tw(Component) wrap + .extend() + .withSub<>()
 *
 * tw(Link) — wrap existing React component
 * .extend() — tambah class di atas base
 * .withSub<>() — strict TypeScript untuk template literal sub-components
 */
import { tw } from "tailwind-styled-v4"

// -- tw(Component) — wrap existing component ----------------------------------
// Simulasi dengan tw(<a>) — bisa juga tw(Link) dari next/link
export const StyledLink = tw.a({
  base: `
    inline-flex items-center gap-1.5 text-[var(--accent)]
    hover:underline underline-offset-2 transition-colors font-medium
  `,
})

// -- .extend() dari komponen yang sudah ada ------------------------------------
const BaseCard = tw.div({
  base: "rounded-xl border border-gray-200 bg-white p-5 shadow-sm",
})

export const ElevatedCard = BaseCard.extend({
  classes: "shadow-lg hover:shadow-xl transition-shadow duration-300",
})

export const WarningCard = BaseCard.extend({
  classes: "border-yellow-300 bg-yellow-50",
})

export const ErrorCard = BaseCard.extend({
  classes: "border-red-300 bg-red-50",
})

// -- Template literal + .withSub<>() untuk strict TypeScript ------------------
// TypeScript tahu persis sub-component yang valid
export const NavBar = tw.nav`
  flex items-center justify-between px-6 py-3 bg-white border-b
`.withSub<"logo" | "links" | "actions">()
// NavBar.logo ✅, NavBar.links ✅, NavBar.actions ✅, NavBar.unknown ❌

// -- tw(Component) wrap dengan object config -----------------------------------
// Demonstrasi wrapping komponen yang sudah ada
const BaseButton = tw.button({
  base: "inline-flex items-center gap-2 rounded-lg font-medium transition-all px-4 py-2",
})

// Extend base button dengan intent baru
export const GradientButton = BaseButton.extend({
  classes: `
    bg-gradient-to-r from-indigo-500 to-purple-600 text-white
    hover:from-indigo-600 hover:to-purple-700
    shadow-md shadow-indigo-200 hover:shadow-lg
  `,
})
