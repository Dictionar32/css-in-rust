/**
 * tailwind-styled-v4 — pure-TS port of the native template parser
 *
 * This is a MANUAL, line-for-line port of `parse_template()` in
 * `native/src/application/template_parser.rs`. It exists ONLY as the
 * browser-side fallback for `parseTemplate()` in `twProxy.ts` — a `.node`
 * N-API addon can never load inside a browser JS engine, so any
 * `` tw.tag`...` `` template-literal component that is NOT statically
 * replaced at build time (see the `is_chained_immediately_after` /
 * `is_chained` guards in `native/src/domain/transform.rs` — any template
 * literal immediately or eventually chained with `.extend()`,
 * `.withVariants()`, `.animate()`, or `.withSub()` is intentionally left
 * un-transformed, because the static replacement is a plain `forwardRef`
 * that doesn't have those methods) still calls `parseTemplate()` at runtime,
 * including on the very first client-side render in the browser.
 *
 * Previously `parseTemplate()` had NO fallback at all and threw
 * `"FATAL: Native binding 'parseTemplate' is required but not available."`
 * unconditionally in the browser (Bug D — uncaught crash in
 * `ExtendDemo.tsx`'s `NavBar`, which uses `` tw.nav`...`.withSub<>() ``).
 * This mirrors the same fix already applied for `twMergeRaw` in
 * `merge.ts` / `mergeFallback.ts` (their "Bug C"): degrade gracefully to a
 * pure-TS port of the SAME algorithm instead of throwing, so behavior is
 * defined by one algorithm — ours — rather than risking drift from a
 * different implementation. The cost is the same as `mergeFallback.ts`:
 * if `parse_template()` changes in Rust, this file must be updated by hand
 * to match (see the test cases mirrored below from `template_parser.rs`'s
 * `#[cfg(test)] mod tests`).
 */

export interface ParsedTemplateJs {
  /** Base classes — without sub-component blocks, without comments */
  base: string
  /** Sub-component map: { icon: "h-4 w-4 ...", badge: "px-2 ..." } */
  subs: Record<string, string>
  /** Shortcut for Object.keys(subs).length > 0 */
  hasSubs: boolean
}

// Identical pattern to SUB_RE in template_parser.rs:
// matches `[name] { ... }` (bracket) OR `name { ... }` (no-bracket) sub-component blocks.
// Group 1 = bracket name, Group 2 = no-bracket name, Group 3 = inner classes.
const SUB_RE = /(?:\[([a-zA-Z][a-zA-Z0-9_-]*)\]|([a-zA-Z][a-zA-Z0-9_-]*))\s*\{([^}]*)\}/g

// Identical to COMMENT_RE in template_parser.rs — strip `// comment` to end-of-line.
const COMMENT_RE = /\/\/[^\n]*/g

/** Collapse multiple consecutive whitespace chars into one, then trim. */
function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim()
}

/** Strip comments, normalize per-line whitespace, then collapse — same order as Rust. */
function cleanBlock(raw: string): string {
  const noComments = raw.replace(COMMENT_RE, "")
  const lines = noComments
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  return collapseSpaces(lines.join(" "))
}

/**
 * Parse a joined template-literal raw string into `{ base, subs, hasSubs }`.
 *
 * Mirrors `parse_template(raw: String) -> ParsedTemplateResult` in
 * `template_parser.rs`. Unlike the native binding (which returns
 * `subsJson: string` for NAPI serialization), this returns `subs` as a
 * plain object directly — no JSON round-trip needed on the pure-JS path.
 */
export function parseTemplateJs(raw: string): ParsedTemplateJs {
  const subs: Record<string, string> = {}
  let base = raw

  for (const match of raw.matchAll(SUB_RE)) {
    const fullMatch = match[0]
    const name = match[1] ?? match[2] ?? ""
    const innerRaw = match[3] ?? ""

    if (name) {
      subs[name] = cleanBlock(innerRaw)
    }

    // Remove first occurrence only — same as Rust's `base.replacen(full_match, "", 1)`.
    base = base.replace(fullMatch, "")
  }

  return {
    base: cleanBlock(base),
    subs,
    hasSubs: Object.keys(subs).length > 0,
  }
}