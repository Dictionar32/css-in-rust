/**
 * ContainerDemo — demo container queries API
 *
 * tw.div({ container }) — generates @container rules via Rust.
 * Layout berubah berdasarkan lebar container parent, bukan viewport.
 */
import { tw } from "tailwind-styled-v4"

// Wrapper dengan @container context
export const ContainerWrapper = tw.div({ base: "@container w-full" })

// Card yang responsif terhadap lebar container-nya
export const ContainerCard = tw.article({
  base: `
    rounded-xl border border-gray-200 bg-white p-4
    flex flex-col gap-3
  `,
  container: {
    sm: "flex-row",          // @container (min-width: 320px)
    md: "items-center",      // @container (min-width: 640px)
    lg: "gap-6 p-6",        // @container (min-width: 1024px)
  },
})

export const ContainerImage = tw.div({
  base: "rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex-shrink-0",
  container: {
    sm: "w-20 h-20",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  },
})

export const ContainerText = tw.div({ base: "flex-1 min-w-0 space-y-1" })

export const ContainerTitle = tw.h3({
  base: "font-semibold text-gray-900",
  container: {
    md: "text-lg",
    lg: "text-xl",
  },
})

export const ContainerDesc = tw.p({
  base: "text-gray-500 text-sm",
  container: {
    lg: "text-base",
  },
})
