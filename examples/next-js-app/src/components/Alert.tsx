import { tw } from "tailwind-styled-v4"

/**
 * Alert — object config API
 *
 * tw.div({ base, variants, defaultVariants, sub })
 * Sub-components: icon, content, title, message, close
 */

// -- Base Alert + variants -----------------------------------------------------
export const Alert = tw.div({
  base: "relative flex items-start gap-3 rounded-lg p-4 border-l-4",
  variants: {
    intent: {
      info:    "border-l-blue-500 bg-blue-50",
      success: "border-l-green-500 bg-green-50",
      warning: "border-l-yellow-500 bg-yellow-50",
      error:   "border-l-red-500 bg-red-50",
    },
  },
  defaultVariants: {
    intent: "info",
  },
  sub: {
    icon:    "flex-shrink-0 w-5 h-5 mt-0.5",
    content: "flex-1 min-w-0",
    title:   "font-semibold mb-1 leading-snug",
    message: "text-sm leading-relaxed opacity-80",
    close:   "flex-shrink-0 ml-auto -mr-1 -mt-1 rounded-lg p-1 opacity-50 cursor-pointer hover:opacity-100 transition-opacity",
  },
})

// -- Per-intent aliases dengan warna sub-components via states -----------------
// (pakai states karena sub-component classes tidak bisa di-variant langsung)

export const InfoAlert = tw.div({
  base: "relative flex items-start gap-3 rounded-lg p-4 border-l-4 border-l-blue-500 bg-blue-50",
  sub: {
    icon:            "flex-shrink-0 w-5 h-5 mt-0.5 text-blue-500",
    "div:content":   "flex-1 min-w-0",
    "strong:title":  "font-semibold mb-1 leading-snug text-blue-800 block",
    "p:message":     "text-sm leading-relaxed text-blue-700 opacity-80",
    close:           "flex-shrink-0 ml-auto -mr-1 -mt-1 rounded-lg p-1 opacity-50 cursor-pointer hover:opacity-100 transition-opacity",
  },
})

export const SuccessAlert = tw.div({
  base: "relative flex items-start gap-3 rounded-lg p-4 border-l-4 border-l-green-500 bg-green-50",
  sub: {
    icon:            "flex-shrink-0 w-5 h-5 mt-0.5 text-green-500",
    "div:content":   "flex-1 min-w-0",
    "strong:title":  "font-semibold mb-1 leading-snug text-green-800 block",
    "p:message":     "text-sm leading-relaxed text-green-700 opacity-80",
    close:           "flex-shrink-0 ml-auto -mr-1 -mt-1 rounded-lg p-1 opacity-50 cursor-pointer hover:opacity-100 transition-opacity",
  },
})

export const WarningAlert = tw.div({
  base: "relative flex items-start gap-3 rounded-lg p-4 border-l-4 border-l-yellow-500 bg-yellow-50",
  sub: {
    icon:            "flex-shrink-0 w-5 h-5 mt-0.5 text-yellow-500",
    "div:content":   "flex-1 min-w-0",
    "strong:title":  "font-semibold mb-1 leading-snug text-yellow-800 block",
    "p:message":     "text-sm leading-relaxed text-yellow-700 opacity-80",
    close:           "flex-shrink-0 ml-auto -mr-1 -mt-1 rounded-lg p-1 opacity-50 cursor-pointer hover:opacity-100 transition-opacity",
  },
})

export const ErrorAlert = tw.div({
  base: "relative flex items-start gap-3 rounded-lg p-4 border-l-4 border-l-red-500 bg-red-50",
  sub: {
    icon:            "flex-shrink-0 w-5 h-5 mt-0.5 text-red-500",
    "div:content":   "flex-1 min-w-0",
    "strong:title":  "font-semibold mb-1 leading-snug text-red-800 block",
    "p:message":     "text-sm leading-relaxed text-red-700 opacity-80",
    close:           "flex-shrink-0 ml-auto -mr-1 -mt-1 rounded-lg p-1 opacity-50 cursor-pointer hover:opacity-100 transition-opacity",
  },
})
