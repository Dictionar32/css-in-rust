import React from "react"
import { tw, cn } from "tailwind-styled-v4"

/**
 * Avatar — object config API
 *
 * tw.div({ base, variants, ... }) — works in both RSC and client context.
 * Deterministic color dari name hash — zero runtime randomness.
 */

// -- Avatar root — size via variants ------------------------------------------
const AvatarRoot = tw.div({
  base: `
    relative inline-flex shrink-0 items-center justify-center
    rounded-full font-semibold select-none overflow-hidden
  `,
  variants: {
    size: {
      xs: "h-6 w-6 text-[10px]",
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
      xl: "h-16 w-16 text-lg",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

const AvatarImage = tw.img({ base: "h-full w-full object-cover" })

const AvatarFallback = tw.span({ base: "absolute inset-0 flex items-center justify-center" })

// -- Color palette (deterministic dari name hash) ------------------------------
const colorPalette = [
  "bg-red-100 text-red-700",
  "bg-orange-100 text-orange-700",
  "bg-amber-100 text-amber-700",
  "bg-green-100 text-green-700",
  "bg-teal-100 text-teal-700",
  "bg-blue-100 text-blue-700",
  "bg-indigo-100 text-indigo-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
]

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function getColor(name: string): string {
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colorPalette[hash % colorPalette.length]
}

// -- Avatar --------------------------------------------------------------------
interface AvatarProps {
  name: string
  src?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const initials = getInitials(name)
  const color = getColor(name)

  return (
    <AvatarRoot
      size={size}
      className={cn(!src && color, className)}
      title={name}
    >
      {src ? (
        <AvatarImage src={src} alt={name} />
      ) : (
        <AvatarFallback>{initials}</AvatarFallback>
      )}
    </AvatarRoot>
  )
}

// -- AvatarGroup ---------------------------------------------------------------
const GroupRoot = tw.div({ base: "flex -space-x-2" })

const GroupItem = tw.div({ base: "ring-2 ring-white rounded-full" })

const Overflow = tw.div({
  base: `
    relative inline-flex shrink-0 items-center justify-center
    rounded-full bg-gray-200 text-gray-600 font-semibold ring-2 ring-white text-xs
  `,
  variants: {
    size: {
      xs: "h-6 w-6 text-[9px]",
      sm: "h-8 w-8 text-[10px]",
      md: "h-10 w-10 text-xs",
      lg: "h-12 w-12 text-sm",
      xl: "h-16 w-16 text-base",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

interface AvatarGroupProps {
  users: { name: string; src?: string }[]
  max?: number
  size?: "xs" | "sm" | "md" | "lg" | "xl"
}

export function AvatarGroup({ users, max = 5, size = "md" }: AvatarGroupProps) {
  const visible = users.slice(0, max)
  const overflow = users.length - max

  return (
    <GroupRoot>
      {visible.map((u) => (
        <GroupItem key={u.name}>
          <Avatar name={u.name} src={u.src} size={size} />
        </GroupItem>
      ))}
      {overflow > 0 && (
        <Overflow size={size}>
          +{overflow}
        </Overflow>
      )}
    </GroupRoot>
  )
}
