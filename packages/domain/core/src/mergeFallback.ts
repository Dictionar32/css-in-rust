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
 * Conflict group untuk base Tailwind class (variant prefix sudah di-strip).
 * Jika `prefix` diberikan (e.g. "tw-"), strip dari `base` sebelum lookup.
 * `null` = class tidak pernah konflik (e.g. `sr-only`).
 *
 * Mirrors `conflict_group_with_prefix()` in tw_merge.rs — keep both in sync.
 */
export function conflictGroup(base: string, prefix = ""): string | null {
  // Strip custom Tailwind prefix sebelum matching conflict groups.
  // "tw-bg-red-500" dengan prefix "tw-" → base menjadi "bg-red-500"
  const b = prefix && base.startsWith(prefix) ? base.slice(prefix.length) : base
  // Arbitrary value — everything before the first `[` is the group.
  const bracket = b.indexOf("[")
  if (bracket !== -1) {
    const grp = b.slice(0, bracket).replace(/-+$/, "")
    return grp.length > 0 ? grp : "arbitrary"
  }

  if (DISPLAY_VALUES.has(b)) return "display"
  if (POSITION_VALUES.has(b)) return "position"

  if (b.startsWith("overflow-x-")) return "overflow-x"
  if (b.startsWith("overflow-y-")) return "overflow-y"
  if (b.startsWith("overflow-")) return "overflow"

  if (b.startsWith("flex-")) return "flex"
  if (b.startsWith("grid-cols-")) return "grid-cols"
  if (b.startsWith("grid-rows-")) return "grid-rows"
  if (b.startsWith("grid-flow-")) return "grid-flow"
  if (b.startsWith("col-")) return "col"
  if (b.startsWith("row-")) return "row"
  if (b === "grow" || b.startsWith("grow-")) return "grow"
  if (b === "shrink" || b.startsWith("shrink-")) return "shrink"

  if (b.startsWith("gap-x-")) return "gap-x"
  if (b.startsWith("gap-y-")) return "gap-y"
  if (b.startsWith("gap-")) return "gap"

  if (b.startsWith("justify-items-")) return "justify-items"
  if (b.startsWith("justify-self-")) return "justify-self"
  if (b.startsWith("justify-")) return "justify"
  if (b.startsWith("items-")) return "items"
  if (b.startsWith("self-")) return "self"
  if (b.startsWith("place-content-")) return "place-content"
  if (b.startsWith("place-items-")) return "place-items"
  if (b.startsWith("place-self-")) return "place-self"
  if (b.startsWith("content-")) return "content"

  if (b.startsWith("px-")) return "px"
  if (b.startsWith("py-")) return "py"
  if (b.startsWith("pt-")) return "pt"
  if (b.startsWith("pr-")) return "pr"
  if (b.startsWith("pb-")) return "pb"
  if (b.startsWith("pl-")) return "pl"
  if (b.startsWith("ps-")) return "ps"
  if (b.startsWith("pe-")) return "pe"
  if (b.startsWith("p-")) return "p"

  if (b.startsWith("mx-")) return "mx"
  if (b.startsWith("my-")) return "my"
  if (b.startsWith("mt-")) return "mt"
  if (b.startsWith("mr-")) return "mr"
  if (b.startsWith("mb-")) return "mb"
  if (b.startsWith("ml-")) return "ml"
  if (b.startsWith("ms-")) return "ms"
  if (b.startsWith("me-")) return "me"
  if (b === "-m" || b.startsWith("m-") || b.startsWith("-m-")) return "m"

  if (b.startsWith("space-x-")) return "space-x"
  if (b.startsWith("space-y-")) return "space-y"

  if (b.startsWith("size-")) return "size"
  if (b.startsWith("min-w-")) return "min-w"
  if (b.startsWith("max-w-")) return "max-w"
  if (b.startsWith("w-")) return "w"
  if (b.startsWith("min-h-")) return "min-h"
  if (b.startsWith("max-h-")) return "max-h"
  if (b.startsWith("h-")) return "h"

  if (b.startsWith("inset-x-")) return "inset-x"
  if (b.startsWith("inset-y-")) return "inset-y"
  if (b.startsWith("inset-")) return "inset"
  if (b.startsWith("top-")) return "top"
  if (b.startsWith("right-") || b.startsWith("end-")) return "right"
  if (b.startsWith("bottom-")) return "bottom"
  if (b.startsWith("left-") || b.startsWith("start-")) return "left"

  if (b.startsWith("z-")) return "z"
  if (b.startsWith("opacity-")) return "opacity"

  if (b.startsWith("bg-")) {
    if (b.startsWith("bg-opacity-")) return "bg-opacity"
    return "bg"
  }
  if (b.startsWith("from-")) return "from"
  if (b.startsWith("via-")) return "via"
  if (b.startsWith("to-")) return "to"

  if (b.startsWith("text-")) {
    const suffix = b.slice("text-".length)
    if (isTextSize(suffix)) return "text-size"
    if (suffix.startsWith("opacity-")) return "text-opacity"
    if (TEXT_ALIGN_VALUES.has(suffix)) return "text-align"
    return "text-color"
  }

  if (b.startsWith("font-")) {
    const suffix = b.slice("font-".length)
    if (FONT_WEIGHT_NAMES.has(suffix) || isAsciiDigits(suffix)) return "font-weight"
    return "font-family"
  }

  if (b.startsWith("leading-")) return "leading"
  if (b.startsWith("tracking-")) return "tracking"

  if (b.startsWith("border-")) {
    const suffix = b.slice("border-".length)
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
  if (b === "border") return "border-width"

  if (b.startsWith("outline-")) return "outline"
  if (b === "outline") return "outline"

  if (
    b.startsWith("rounded-t") ||
    b.startsWith("rounded-r") ||
    b.startsWith("rounded-b") ||
    b.startsWith("rounded-l") ||
    b.startsWith("rounded-s") ||
    b.startsWith("rounded-e")
  ) {
    const firstChar = b.slice("rounded-".length).charAt(0) || "x"
    return `rounded-${firstChar}`
  }
  if (b === "rounded" || b.startsWith("rounded-")) return "rounded"

  if (b === "shadow" || b.startsWith("shadow-")) return "shadow"

  // See file header re: `ring-offset-*` — only one group is reachable.
  if (b.startsWith("ring-offset-")) return "ring-offset"
  if (b === "ring") return "ring-width"
  if (b.startsWith("ring-")) {
    const rest = b.slice("ring-".length)
    const isWidth =
      rest === "0" || rest === "1" || rest === "2" || rest === "4" || rest === "8" ||
      /^-?\d+(\.\d+)?$/.test(rest) ||
      (rest.startsWith("[") && rest.endsWith("]"))
    if (isWidth) return "ring-width"
    if (rest === "inset") return "ring-inset"
    return "ring-color"
  }

  if (b.startsWith("rotate-")) return "rotate"
  if (b.startsWith("scale-x-")) return "scale-x"
  if (b.startsWith("scale-y-")) return "scale-y"
  if (b.startsWith("scale-")) return "scale"
  if (b.startsWith("translate-x-")) return "translate-x"
  if (b.startsWith("translate-y-")) return "translate-y"
  if (b.startsWith("skew-x-")) return "skew-x"
  if (b.startsWith("skew-y-")) return "skew-y"

  if (b === "transition" || b.startsWith("transition-")) return "transition"
  if (b.startsWith("duration-")) return "duration"
  if (b.startsWith("ease-")) return "ease"
  if (b.startsWith("delay-")) return "delay"

  if (b === "animate" || b.startsWith("animate-")) return "animate"
  if (b.startsWith("cursor-")) return "cursor"
  if (b.startsWith("pointer-events-")) return "pointer-events"
  if (b.startsWith("select-")) return "select"

  if (b === "visible" || b === "invisible" || b === "collapse") return "visibility"

  if (b.startsWith("object-")) return "object"
  if (b.startsWith("aspect-")) return "aspect"
  if (b.startsWith("order-")) return "order"
  if (b.startsWith("whitespace-")) return "whitespace"
  if (b.startsWith("list-")) return "list"
  if (b.startsWith("fill-")) return "fill"
  if (b.startsWith("stroke-")) return "stroke"

  if (b.startsWith("backdrop-")) {
    const rest = b.slice("backdrop-".length)
    const seg = rest.split("-")[0] || "x"
    return `backdrop-${seg}`
  }

  if (b.startsWith("scroll-")) return "scroll"
  if (b.startsWith("snap-")) return "snap"
  if (b.startsWith("touch-")) return "touch"
  if (b.startsWith("decoration-")) return "text-decoration"
  if (b.startsWith("caret-")) return "caret"
  if (b.startsWith("accent-")) return "accent"
  if (b.startsWith("appearance-")) return "appearance"

  if (b === "isolate" || b === "isolation-auto") return "isolation"

  if (b.startsWith("mix-blend-")) return "mix-blend"
  if (b.startsWith("bg-blend-")) return "bg-blend"

  if (b.startsWith("float-")) return "float"
  if (b.startsWith("clear-")) return "clear"
  if (b.startsWith("break-")) return "break"
  if (b.startsWith("columns-")) return "columns"

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
 * Mirrors `merge_class_string_with_prefix()` in tw_merge.rs — keep both in sync.
 */
export function mergeClassStringJs(input: string, prefix = ""): string {
  const tokens = input.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return ""
  if (tokens.length === 1) return tokens[0]

  const groupOwner = new Map<string, number>()
  const slots: Array<string | null> = []

  for (const token of tokens) {
    const [variants, base] = splitVariants(token)
    const group = conflictGroup(base, prefix)
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
 * Browser-side equivalent of the native `twMergeRaw` / `twMergeRawWithOptions` NAPI export.
 * Mirrors `tw_merge_raw_with_options()` in tw_merge.rs — keep both in sync.
 */
export function twMergeRawJs(classLists: string[], prefix = ""): string {
  const joined = classLists
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join(" ")
  if (joined.length === 0) return ""
  return mergeClassStringJs(joined, prefix)
}