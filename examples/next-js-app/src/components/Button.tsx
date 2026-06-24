import { tw } from "tailwind-styled-v4"

/**
 * Button — object config API
 *
 * tw.button({ base, variants, defaultVariants, compoundVariants, sub })
 * Semua di-resolve Rust di build time.
 *
 * Usage:
 *   <Button intent="primary" size="md">Click</Button>
 *   <PrimaryButton>
 *     <PrimaryButton.icon>🔵</PrimaryButton.icon>
 *     <PrimaryButton.text>Save</PrimaryButton.text>
 *     <PrimaryButton.badge>3</PrimaryButton.badge>
 *   </PrimaryButton>
 */

// -- Button dengan variants + sub-components -----------------------------------
export const Button = tw.button({
  base: `
    relative inline-flex items-center gap-2 rounded-lg font-medium
    transition-all focus:ring-2 focus:ring-offset-2 focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  variants: {
    intent: {
      primary:
        "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 focus:ring-indigo-500 disabled:hover:scale-100",
      secondary:
        "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400",
      danger:
        "bg-red-600 text-white hover:bg-red-700 hover:scale-105 focus:ring-red-500 disabled:hover:scale-100",
      outline:
        "border-2 border-indigo-500 text-indigo-600 bg-transparent hover:bg-indigo-500 hover:text-white focus:ring-indigo-500",
      ghost:
        "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400",
    },
    size: {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-base",
    },
  },
  defaultVariants: {
    intent: "primary",
    size: "md",
  },
  compoundVariants: [
    { intent: "primary", size: "lg", class: "shadow-md shadow-indigo-200" },
    { intent: "danger",  size: "lg", class: "shadow-md shadow-red-200" },
  ],
  sub: {
    icon:  "inline-block w-5 h-5 flex-shrink-0",
    text:  "inline-block",
    badge: "absolute -top-2 -right-2 inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full",
  },
})

// -- Alias dengan sub-components (DX shorthand) --------------------------------

export const PrimaryButton = tw.button({
  base: `
    relative inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
    transition-all bg-indigo-600 text-white
    hover:bg-indigo-700 hover:scale-105
    focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
  `,
  sub: {
    icon:  "inline-block w-5 h-5 flex-shrink-0",
    text:  "inline-block",
    badge: "absolute -top-2 -right-2 inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full",
  },
})

export const SecondaryButton = tw.button({
  base: `
    inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
    transition-all bg-gray-200 text-gray-800
    hover:bg-gray-300
    focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
})

export const DangerButton = tw.button({
  base: `
    relative inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
    transition-all bg-red-600 text-white
    hover:bg-red-700 hover:scale-105
    focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
  `,
  sub: {
    icon: "inline-block w-5 h-5 flex-shrink-0",
    text: "inline-block",
  },
})

export const OutlineButton = tw.button({
  base: `
    inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
    transition-all border-2 border-indigo-500 text-indigo-600 bg-transparent
    hover:bg-indigo-500 hover:text-white
    focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
})

export const GhostButton = tw.button({
  base: `
    inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
    transition-all text-gray-600
    hover:bg-gray-100 hover:text-gray-900
    focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  sub: {
    icon: "inline-block w-5 h-5 flex-shrink-0",
    text: "inline-block",
  },
})
