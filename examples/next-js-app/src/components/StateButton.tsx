"use client"
/**
 * StateButton — demo states API (boolean props via bitmask)
 *
 * tw.button({ states }) — di-resolve Rust bitmask lookup table build time.
 * Boolean props langsung tanpa kondisional className.
 */
import { tw } from "tailwind-styled-v4"

export const StateButton = tw.button({
  base: `
    inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
    transition-all bg-indigo-600 text-white
    focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none
  `,
  states: {
    loading:   "opacity-60 cursor-wait pointer-events-none",
    disabled:  "opacity-50 cursor-not-allowed bg-gray-400",
    fullWidth: "w-full justify-center",
    danger:    "bg-red-600 hover:bg-red-700",
    success:   "bg-green-600 hover:bg-green-700",
  },
})
