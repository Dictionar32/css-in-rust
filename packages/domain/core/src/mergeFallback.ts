/**
 * tailwind-styled-v4 — pure-TS port of the native merge algorithm
 *
 * This is a MANUAL, line-for-line port of `conflict_group()` / `split_variants()`
 * / `merge_class_string()` in `native/src/application/tw_merge.rs`. It exists
 * ONLY as the browser-side fallback for `twMerge()` — a `.node` N-API addon can
 * never load inside a browser JS engine, so when `createComponent.ts` calls
 * `twMerge()` during a client-side render, there is no native binding to call.
 *
 * Deliberately NOT using the `tailwind-merge` npm package: that would mean two
 * different conflict-resolution algorithms (theirs in the browser, ours on the
 * server) that can silently drift apart and produce different className output
 * for the same input depending on where the component happens to render. This
 * file defines merge semantics with ONE algorithm — ours — at the cost of having
 * to keep it in sync BY HAND with tw_merge.rs. If you change `conflict_group()`
 * in Rust, mirror the change here too.
 *
 * Quirks preserved ON PURPOSE for parity with the compiled Rust (not "fixed"
 * here, since fixing only one side would make them disagree):
 * - `rounded-sm` and `rounded-s-*` collide on the same prefix check (both start
 *   with "rounded-s") — same ambiguity exists in tw_merge.rs.
 * - `rounded-tl-*` / `rounded-tr-*` both reduce to group "rounded-t" (the Rust
 *   code only looks at the first character after "rounded-").
 * - `ring-offset-*` always resolves to ONE group ("ring-offset"); a width/color
 *   split exists further down in tw_merge.rs but is unreachable dead code there
 *   (an earlier identical `if` already returns) — so it's omitted here too.
 */

const TEXT_SIZE_SUFFIXES = new Set([
  "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl",
])

function isTextSize(suffix: string): boolean {
  if (TEXT_SIZE_SUFFIXES.has(suffix)) return true
  if (suffix.startsWith("[")) return true
  return false
}

// Mirrors Rust's `suffix.chars().all(|c| c.is_ascii_digit())`, which is
// vacuously `true` for an empty string — preserved for exact parity.
function isAsciiDigits(s: string): boolean {
  if (s.length === 0) return true
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    if (code < 48 || code > 57) return false
  }
  return true
}

// Mirrors `s.parse::<u32>().is_ok()` for the plain non-negative integer
// suffixes this algorithm actually sees (border/ring widths etc.).
function isU32(s: string): boolean {
  return s.length > 0 && /^[0-9]+$/.test(s)
}

const DISPLAY_VALUES = new Set([
  "block", "inline-block", "inline", "flex", "inline-flex", "grid", "inline-grid",
  "table", "inline-table", "table-row", "table-cell", "table-column", "table-caption",
  "contents", "list-item", "hidden", "flow-root",
])
const POSITION_VALUES = new Set(["static", "relative", "absolute", "fixed", "sticky"])
const FONT_WEIGHT_NAMES = new Set([
  "thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black",
])
const TEXT_ALIGN_VALUES = new Set(["left", "center", "right", "justify", "start", "end"])
const BORDER_SIDE_PREFIXES = ["t-", "r-", "b-", "l-", "x-", "y-", "s-", "e-"]
const BORDER_STYLE_VALUES = new Set(["solid", "dashed", "dotted", "double", "hidden", "none"])

/**
 * Conflict group for a base Tailwind class (variant prefix already stripped).
 * `null` = class never conflicts with anything (e.g. `sr-only`).
 *
 * Mirrors `conflict_group()` in tw_merge.rs — keep both in sync.
 */
export function conflictGroup(base: string): string | null {
  // Arbitrary value — everything before the first `[` is the group.
  const bracket = base.indexOf("[")
  if (bracket !== -1) {
    const prefix = base.slice(0, bracket).replace(/-+$/, "")
    return prefix.length > 0 ? prefix : "arbitrary"
  }

  if (DISPLAY_VALUES.has(base)) return "display"
  if (POSITION_VALUES.has(base)) return "position"

  if (base.startsWith("overflow-x-")) return "overflow-x"
  if (base.startsWith("overflow-y-")) return "overflow-y"
  if (base.startsWith("overflow-")) return "overflow"

  if (base.startsWith("flex-")) return "flex"
  if (base.startsWith("grid-cols-")) return "grid-cols"
  if (base.startsWith("grid-rows-")) return "grid-rows"
  if (base.startsWith("grid-flow-")) return "grid-flow"
  if (base.startsWith("col-")) return "col"
  if (base.startsWith("row-")) return "row"
  if (base === "grow" || base.startsWith("grow-")) return "grow"
  if (base === "shrink" || base.startsWith("shrink-")) return "shrink"

  if (base.startsWith("gap-x-")) return "gap-x"
  if (base.startsWith("gap-y-")) return "gap-y"
  if (base.startsWith("gap-")) return "gap"

  if (base.startsWith("justify-items-")) return "justify-items"
  if (base.startsWith("justify-self-")) return "justify-self"
  if (base.startsWith("justify-")) return "justify"
  if (base.startsWith("items-")) return "items"
  if (base.startsWith("self-")) return "self"
  if (base.startsWith("place-content-")) return "place-content"
  if (base.startsWith("place-items-")) return "place-items"
  if (base.startsWith("place-self-")) return "place-self"
  if (base.startsWith("content-")) return "content"

  if (base.startsWith("px-")) return "px"
  if (base.startsWith("py-")) return "py"
  if (base.startsWith("pt-")) return "pt"
  if (base.startsWith("pr-")) return "pr"
  if (base.startsWith("pb-")) return "pb"
  if (base.startsWith("pl-")) return "pl"
  if (base.startsWith("ps-")) return "ps"
  if (base.startsWith("pe-")) return "pe"
  if (base.startsWith("p-")) return "p"

  if (base.startsWith("mx-")) return "mx"
  if (base.startsWith("my-")) return "my"
  if (base.startsWith("mt-")) return "mt"
  if (base.startsWith("mr-")) return "mr"
  if (base.startsWith("mb-")) return "mb"
  if (base.startsWith("ml-")) return "ml"
  if (base.startsWith("ms-")) return "ms"
  if (base.startsWith("me-")) return "me"
  if (base === "-m" || base.startsWith("m-") || base.startsWith("-m-")) return "m"

  if (base.startsWith("space-x-")) return "space-x"
  if (base.startsWith("space-y-")) return "space-y"

  if (base.startsWith("size-")) return "size"
  if (base.startsWith("min-w-")) return "min-w"
  if (base.startsWith("max-w-")) return "max-w"
  if (base.startsWith("w-")) return "w"
  if (base.startsWith("min-h-")) return "min-h"
  if (base.startsWith("max-h-")) return "max-h"
  if (base.startsWith("h-")) return "h"

  if (base.startsWith("inset-x-")) return "inset-x"
  if (base.startsWith("inset-y-")) return "inset-y"
  if (base.startsWith("inset-")) return "inset"
  if (base.startsWith("top-")) return "top"
  if (base.startsWith("right-") || base.startsWith("end-")) return "right"
  if (base.startsWith("bottom-")) return "bottom"
  if (base.startsWith("left-") || base.startsWith("start-")) return "left"

  if (base.startsWith("z-")) return "z"
  if (base.startsWith("opacity-")) return "opacity"

  if (base.startsWith("bg-")) {
    if (base.startsWith("bg-opacity-")) return "bg-opacity"
    return "bg"
  }
  if (base.startsWith("from-")) return "from"
  if (base.startsWith("via-")) return "via"
  if (base.startsWith("to-")) return "to"

  if (base.startsWith("text-")) {
    const suffix = base.slice("text-".length)
    if (isTextSize(suffix)) return "text-size"
    if (suffix.startsWith("opacity-")) return "text-opacity"
    if (TEXT_ALIGN_VALUES.has(suffix)) return "text-align"
    return "text-color"
  }

  if (base.startsWith("font-")) {
    const suffix = base.slice("font-".length)
    if (FONT_WEIGHT_NAMES.has(suffix) || isAsciiDigits(suffix)) return "font-weight"
    return "font-family"
  }

  if (base.startsWith("leading-")) return "leading"
  if (base.startsWith("tracking-")) return "tracking"

  if (base.startsWith("border-")) {
    const suffix = base.slice("border-".length)
    const sidePrefix = BORDER_SIDE_PREFIXES.find((p) => suffix.startsWith(p))
    if (sidePrefix) {
      const side = suffix.slice(0, 1)
      const rest = suffix.slice(2)
      if (isU32(rest) || rest.length === 0) return `border-${side}-width`
      return `border-${side}-color`
    }
    if (isU32(suffix) || suffix.length === 0) return "border-width"
    if (suffix.startsWith("opacity-")) return "border-opacity"
    if (suffix === "collapse" || suffix === "separate") return "border-collapse"
    if (BORDER_STYLE_VALUES.has(suffix)) return "border-style"
    return "border-color"
  }
  if (base === "border") return "border-width"

  if (base.startsWith("outline-")) return "outline"
  if (base === "outline") return "outline"

  if (
    base.startsWith("rounded-t") ||
    base.startsWith("rounded-r") ||
    base.startsWith("rounded-b") ||
    base.startsWith("rounded-l") ||
    base.startsWith("rounded-s") ||
    base.startsWith("rounded-e")
  ) {
    const firstChar = base.slice("rounded-".length).charAt(0) || "x"
    return `rounded-${firstChar}`
  }
  if (base === "rounded" || base.startsWith("rounded-")) return "rounded"

  if (base === "shadow" || base.startsWith("shadow-")) return "shadow"

  // See file header re: `ring-offset-*` — only one group is reachable.
  if (base.startsWith("ring-offset-")) return "ring-offset"
  if (base === "ring") return "ring-width"
  if (base.startsWith("ring-")) {
    const rest = base.slice("ring-".length)
    const isWidth =
      rest === "0" || rest === "1" || rest === "2" || rest === "4" || rest === "8" ||
      /^-?\d+(\.\d+)?$/.test(rest) ||
      (rest.startsWith("[") && rest.endsWith("]"))
    if (isWidth) return "ring-width"
    if (rest === "inset") return "ring-inset"
    return "ring-color"
  }

  if (base.startsWith("rotate-")) return "rotate"
  if (base.startsWith("scale-x-")) return "scale-x"
  if (base.startsWith("scale-y-")) return "scale-y"
  if (base.startsWith("scale-")) return "scale"
  if (base.startsWith("translate-x-")) return "translate-x"
  if (base.startsWith("translate-y-")) return "translate-y"
  if (base.startsWith("skew-x-")) return "skew-x"
  if (base.startsWith("skew-y-")) return "skew-y"

  if (base === "transition" || base.startsWith("transition-")) return "transition"
  if (base.startsWith("duration-")) return "duration"
  if (base.startsWith("ease-")) return "ease"
  if (base.startsWith("delay-")) return "delay"

  if (base === "animate" || base.startsWith("animate-")) return "animate"
  if (base.startsWith("cursor-")) return "cursor"
  if (base.startsWith("pointer-events-")) return "pointer-events"
  if (base.startsWith("select-")) return "select"

  if (base === "visible" || base === "invisible" || base === "collapse") return "visibility"

  if (base.startsWith("object-")) return "object"
  if (base.startsWith("aspect-")) return "aspect"
  if (base.startsWith("order-")) return "order"
  if (base.startsWith("whitespace-")) return "whitespace"
  if (base.startsWith("list-")) return "list"
  if (base.startsWith("fill-")) return "fill"
  if (base.startsWith("stroke-")) return "stroke"

  if (base.startsWith("backdrop-")) {
    const rest = base.slice("backdrop-".length)
    const seg = rest.split("-")[0] || "x"
    return `backdrop-${seg}`
  }

  if (base.startsWith("scroll-")) return "scroll"
  if (base.startsWith("snap-")) return "snap"
  if (base.startsWith("touch-")) return "touch"
  if (base.startsWith("decoration-")) return "text-decoration"
  if (base.startsWith("caret-")) return "caret"
  if (base.startsWith("accent-")) return "accent"
  if (base.startsWith("appearance-")) return "appearance"

  if (base === "isolate" || base === "isolation-auto") return "isolation"

  if (base.startsWith("mix-blend-")) return "mix-blend"
  if (base.startsWith("bg-blend-")) return "bg-blend"

  if (base.startsWith("float-")) return "float"
  if (base.startsWith("clear-")) return "clear"
  if (base.startsWith("break-")) return "break"
  if (base.startsWith("columns-")) return "columns"

  // No known conflict group → class is always kept as-is.
  return null
}

/**
 * Splits `hover:dark:bg-red-500` into `["hover:dark:", "bg-red-500"]`.
 * Tracks `[...]` bracket depth so a `:` inside an arbitrary value (e.g.
 * `[mask-type:luminance]`) isn't mistaken for a variant separator.
 *
 * Mirrors `split_variants()` in tw_merge.rs — keep both in sync.
 */
export function splitVariants(klass: string): [variants: string, base: string] {
  let depth = 0
  let lastColon = 0 // index AFTER the last top-level ':'; 0 = none found
  for (let i = 0; i < klass.length; i++) {
    const ch = klass.charCodeAt(i)
    if (ch === 91 /* [ */) depth++
    else if (ch === 93 /* ] */) depth = depth > 0 ? depth - 1 : 0
    else if (ch === 58 /* : */ && depth === 0) lastColon = i + 1
  }
  if (lastColon === 0) return ["", klass]
  return [klass.slice(0, lastColon), klass.slice(lastColon)]
}

/**
 * Conflict-aware merge of a single space-separated class string — last class
 * wins per `{variants}::{conflictGroup}` key, original order otherwise kept.
 *
 * Mirrors `merge_class_string()` in tw_merge.rs — keep both in sync.
 */
export function mergeClassStringJs(input: string): string {
  const tokens = input.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return ""
  if (tokens.length === 1) return tokens[0]

  const groupOwner = new Map<string, number>()
  const slots: Array<string | null> = []

  for (const token of tokens) {
    const [variants, base] = splitVariants(token)
    const group = conflictGroup(base)
    if (group !== null) {
      const key = `${variants}::${group}`
      const prevIdx = groupOwner.get(key)
      if (prevIdx !== undefined) slots[prevIdx] = null
      groupOwner.set(key, slots.length)
      slots.push(token)
    } else {
      slots.push(token)
    }
  }

  return slots.filter((s): s is string => s !== null).join(" ")
}

/**
 * Browser-side equivalent of the native `twMergeRaw` NAPI export.
 * Mirrors `tw_merge_raw()` in tw_merge.rs — keep both in sync.
 */
export function twMergeRawJs(classLists: string[]): string {
  const joined = classLists
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join(" ")
  if (joined.length === 0) return ""
  return mergeClassStringJs(joined)
}