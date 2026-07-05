import React from "react"
import { tw, cn } from "tailwind-styled-v4"

/**
 * Card — object config API
 *
 * tw.article({ base, variants, defaultVariants, sub })
 * Sub-components: header, title, badge, body, footer, image
 *
 * Usage:
 *   <Card>
 *     <Card.header>
 *       <Card.title>Title</Card.title>
 *       <Card.badge>New</Card.badge>
 *     </Card.header>
 *     <Card.body>Content</Card.body>
 *     <Card.footer>Footer</Card.footer>
 *   </Card>
 */

// -- Base Card + hoverable variant ---------------------------------------------
export const Card = tw.article({
  base: "rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden",
  variants: {
    hoverable: {
      true:  "transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-indigo-200",
      false: "",
    },
    intent: {
      default: "",
      primary: "border-blue-200",
    },
  },
  defaultVariants: {
    hoverable: false,
    intent: "default",
  },
  sub: {
    // "header:header" → renders <header> tag, accessible sebagai Card.header
    "header:header": "px-6 pt-5 pb-0 flex items-start justify-between gap-3",
    title:  "text-base font-semibold text-gray-900 leading-snug",
    badge:  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-indigo-100 text-indigo-700",
    // "section:body" → renders <section>, accessible sebagai Card.body
    "section:body": "px-6 py-4 text-sm text-gray-500 leading-relaxed",
    // "footer:footer" → renders <footer>, accessible sebagai Card.footer
    "footer:footer": "px-6 pb-5 pt-0 flex items-center gap-2",
    // "img:image" → renders <img>, accessible sebagai Card.image
    "img:image": "w-full aspect-video object-cover",
  },
})

// -- HoverableCard — extend dengan object config -------------------------------
export const HoverableCard = tw.article({
  base: `
    rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden
    transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-indigo-200
  `,
  sub: {
    "header:header": "px-6 pt-5 pb-0 flex items-start justify-between gap-3",
    title:           "text-base font-semibold text-gray-900 leading-snug",
    badge:           "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-indigo-100 text-indigo-700",
    "section:body":  "px-6 py-4 text-sm text-gray-500 leading-relaxed",
    "footer:footer": "px-6 pb-5 pt-0 flex items-center gap-2",
    "img:image":     "w-full aspect-video object-cover",
  },
})

// -- PrimaryCard ----------------------------------------------------------------
export const PrimaryCard = tw.article({
  base: "rounded-2xl border border-blue-200 bg-white shadow-sm overflow-hidden",
  sub: {
    "header:header": "px-6 pt-5 pb-0 flex items-start justify-between gap-3 bg-blue-50 border-b border-blue-100",
    title:           "text-base font-semibold text-blue-800 leading-snug",
    "section:body":  "px-6 py-4 text-sm text-blue-700 leading-relaxed",
    "footer:footer": "px-6 pb-5 pt-0 flex items-center gap-2",
  },
})

// -- CardWrapper — switch hoverable/primary via prop --------------------------
interface CardWrapperProps extends React.HTMLAttributes<HTMLElement> {
  hoverable?: boolean
  children: React.ReactNode
}

export function CardWrapper({ hoverable = false, className, children, ...props }: CardWrapperProps) {
  const Component = hoverable ? HoverableCard : Card
  return (
    <Component className={cn(className)} {...props}>
      {children}
    </Component>
  )
}
