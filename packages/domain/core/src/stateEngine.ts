/**
 * tailwind-styled-v4 — Reactive State Engine
 *
 * Zero-JS CSS state management via data attributes.
 * No React re-render needed for style changes.
 *
 * How it works:
 *   1. tw.button({ state: { active: "bg-blue-500", loading: "opacity-70" } })
 *   2. State engine generates a unique class + injects CSS:
 *      .tw-s-abc123[data-active="true"] { @apply bg-blue-500; }
 *      .tw-s-abc123[data-loading="true"] { @apply opacity-70; }
 *   3. Component renders with the state class
 *   4. User sets data-active="true" directly — no state needed
 *
 * Devtools integration:
 *   All components register to __TW_STATE_REGISTRY__ for devtools inspection.
 */

import type { StateConfig } from "./types"
import { getNativeBinding } from "./native"

// ─────────────────────────────────────────────────────────────────────────────
// Registry — tracks all state-enabled components
// ─────────────────────────────────────────────────────────────────────────────

export interface StateComponentEntry {
  id: string
  tag: string
  states: string[]
  cssInjected: boolean
}

const stateRegistry = new Map<string, StateComponentEntry>()

declare global {
  interface Window {
    __TW_STATE_REGISTRY__?: typeof stateRegistry
  }
}

if (typeof window !== "undefined") {
  window.__TW_STATE_REGISTRY__ = stateRegistry
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic hash — same config → same class (no re-injection on HMR)
// ─────────────────────────────────────────────────────────────────────────────

// Cache untuk hashState — state config tidak berubah antar render,
// hash hanya perlu dihitung sekali per (tag, state) kombinasi.
const _hashStateCache = new Map<string, string>()

/**
 * Pure-TS FNV-1a 32-bit hash — mirrors Rust fnv implementation.
 * Used as browser fallback for hashContent("fnv", 6).
 */
function _fnvHash6(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (Math.imul(h, 0x01000193) >>> 0)
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 6)
}

function hashState(tag: string, state: StateConfig): string {
  const sortedKey = tag + JSON.stringify(Object.entries(state).sort())
  const cached = _hashStateCache.get(sortedKey)
  if (cached) return cached

  const native = getNativeBinding()
  const id = native?.hashContent
    ? `tw-s-${native.hashContent(sortedKey, "fnv", 6)}`
    : `tw-s-${_fnvHash6(sortedKey)}`   // browser fallback

  _hashStateCache.set(sortedKey, id)
  return id
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS generator — state config → CSS rules via Rust, satu call (required)
// ─────────────────────────────────────────────────────────────────────────────
//
// generateRuntimeStateCss() menggantikan twClassesToCss() yang dulu dipanggil
// per state entry (N × NAPI calls per injectStateStyles/generateStateCss).
// Sekarang seluruh state map di-resolve dalam satu Rust call. Lihat doc comment
// generate_runtime_state_css() di state_css.rs untuk detail kontrak.

function generateStateRules(id: string, state: StateConfig): string[] {
  const native = getNativeBinding()
  if (!native?.generateRuntimeStateCss) {
    // Browser fallback: state CSS is pre-generated at build time into
    // _tw-state-static.css via withTailwindStyled. Runtime generation
    // is not needed in the browser — return empty so injectStateStyles
    // detects the static CSS and skips injection.
    return []
  }
  return native.generateRuntimeStateCss(id, JSON.stringify(state), null).map((rule) => rule.cssRule)
}

// ─────────────────────────────────────────────────────────────────────────────
// Static CSS detection cache — per component ID
// ─────────────────────────────────────────────────────────────────────────────
// Kalau ID sudah ketemu di stylesheet statis, simpan ke Set ini supaya
// iterasi `document.styleSheets` hanya terjadi SEKALI per component ID,
// bukan setiap kali komponen mount.
const _staticCssDetected = new Set<string>()
// require() di-cache hasilnya di sini supaya tidak ada module resolution overhead
// setiap kali ada state change di browser.
let _batchedInjectFn: ((css: string) => void) | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("@tailwind-styled/runtime-css/batched") as { batchedInject: (css: string) => void }
  if (typeof mod?.batchedInject === "function") _batchedInjectFn = mod.batchedInject
} catch {
  // runtime-css tidak terinstall — fallback ke per-element style tag
}

// ─────────────────────────────────────────────────────────────────────────────
// Style injection — batched for performance (FIX CSS Rule Batching)
// ─────────────────────────────────────────────────────────────────────────────

function injectStateStyles(id: string, state: StateConfig): void {
  if (typeof document === "undefined") return

  const styleId = `tw-state-${id}`
  if (document.getElementById(styleId)) return // already injected

  // ── Static CSS check ──────────────────────────────────────────────────────
  // Cek apakah CSS untuk component ini sudah ada dari static file
  // (di-generate oleh staticStateExtractor.ts saat build time).
  //
  // Cara detect: cari selector `.{id}[data-` di semua stylesheets yang ada.
  // Kalau ketemu, berarti static pre-generation sudah cover component ini
  // → skip runtime injection sepenuhnya (zero batchedInject call).
  //
  // `_staticCssDetected` cache: iterasi styleSheets hanya sekali per ID.
  if (_staticCssDetected.has(id)) return

  if (typeof document.styleSheets !== "undefined") {
    const selectorPrefix = `.${id}[data-`
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const sheet = document.styleSheets[i]
        // sheet.cssRules bisa throw SecurityError untuk cross-origin sheets
        const rules = sheet.cssRules
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j]
          if (rule instanceof CSSStyleRule && rule.selectorText.startsWith(selectorPrefix)) {
            // Static CSS sudah mencakup component ini — tidak perlu inject
            _staticCssDetected.add(id)
            return
          }
        }
      } catch {
        // Cross-origin atau CSSOM tidak accessible — skip sheet ini
        continue
      }
    }
  }

  const rules = generateStateRules(id, state)

  if (rules.length === 0) return

  // Try batched injector first (available when runtime-css is installed).
  // _batchedInjectFn di-resolve sekali di module level — hindari require() dinamis
  // (dynamic require = module resolution + file I/O) setiap kali ada state change.
  if (_batchedInjectFn) {
    for (const rule of rules) _batchedInjectFn(rule)
    return
  }

  const style = document.createElement("style")
  style.id = styleId
  style.setAttribute("data-tw-state", id)
  style.textContent = rules.join("\n")
  document.head.appendChild(style)
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface StateEngineResult {
  /** CSS class to add to the component */
  stateClass: string
  /** Whether this component uses state (for SSR data attributes) */
  hasState: true
  /** List of state names (for devtools) */
  stateNames: string[]
}

/**
 * Process a StateConfig for a component.
 * Returns the state class and injects CSS (client-side only).
 *
 * @param tag HTML tag name
 * @param state State config object
 * @param precomputedHash Optional pre-computed hash dari `inject_state_hash()` Rust transform.
 *   Kalau ada, skip runtime `hashState()` sepenuhnya → zero hashing overhead.
 */
export function processState(
  tag: string,
  state: StateConfig,
  precomputedHash?: string
): StateEngineResult {
  // Pakai pre-computed hash kalau tersedia (di-inject oleh turbopackLoader via Rust)
  // Format: 6-char FNV-1a hex — identik dengan output hashState()
  const id = precomputedHash
    ? `tw-s-${precomputedHash}`
    : hashState(tag, state)
  const stateNames = Object.keys(state)

  // Register for devtools
  if (!stateRegistry.has(id)) {
    stateRegistry.set(id, {
      id,
      tag,
      states: stateNames,
      cssInjected: false,
    })
  }

  // Inject CSS (client only)
  injectStateStyles(id, state)

  // Mark as injected
  const entry = stateRegistry.get(id)!
  entry.cssInjected = true

  return { stateClass: id, hasState: true, stateNames }
}

/**
 * Generate SSR-safe CSS string for a state config.
 * Used by SSR to inject styles into <head>.
 */
export function generateStateCss(tag: string, state: StateConfig): string {
  const id = hashState(tag, state)
  return generateStateRules(id, state).join("\n")
}

/**
 * Get the state registry (for devtools).
 */
export function getStateRegistry(): Map<string, StateComponentEntry> {
  return stateRegistry
}