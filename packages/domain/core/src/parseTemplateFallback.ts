/**
 * parseTemplateFallback — pure-TS fallback for parseSubcomponentBlocksNapi.
 *
 * Used in browser when native binding is unavailable.
 * Parses sub-component block syntax from template strings:
 *   "[icon] { h-4 w-4 }" or "icon { h-4 w-4 }"
 *
 * Mirrors the Rust implementation in parseSubcomponentBlocksNapi.
 * Must be kept in sync if block syntax changes.
 */

// Matches: [name] { ... } or name { ... } (no hyphen before bracket = sub-block)
const SUB_RE = /(?:\[([a-zA-Z][a-zA-Z0-9_-]*)\]|([a-zA-Z][a-zA-Z0-9_-]*))\s*\{([^}]*)\}/g
const COMMENT_RE = /\/\/[^\n]*/g

function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim()
}

function cleanBlock(raw: string): string {
  const noComments = raw.replace(COMMENT_RE, "")
  const lines = noComments.split("\n").map((l) => l.trim()).filter((l) => l.length > 0)
  return collapseSpaces(lines.join(" "))
}

export interface ParsedTemplateFallback {
  base: string
  subs: Record<string, string>
  hasSubs: boolean
}

export function parseTemplateJs(raw: string): ParsedTemplateFallback {
  const subs: Record<string, string> = {}
  let base = raw

  for (const match of raw.matchAll(SUB_RE)) {
    const fullMatch = match[0]
    const name = match[1] ?? match[2] ?? ""
    const innerRaw = match[3] ?? ""
    if (name) {
      subs[name] = cleanBlock(innerRaw)
    }
    base = base.replace(fullMatch, "")
  }

  return {
    base: collapseSpaces(base),
    subs,
    hasSubs: Object.keys(subs).length > 0,
  }
}
