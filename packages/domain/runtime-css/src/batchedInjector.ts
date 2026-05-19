"use client"

/**
 * tailwind-styled-v5 — Batched CSS Injector (Client Runtime)
 *
 * Menggantikan pattern inject-per-komponen yang menyebabkan banyak
 * style recalculation saat banyak komponen mount bersamaan.
 *
 * Cara kerja:
 *   - Semua CSS rules dari render cycle yang sama dikumpulkan
 *   - Satu requestAnimationFrame = satu DOM style update
 *   - Deduplication via Set<string> — rule yang sama tidak diinjeksi dua kali
 *   - Injection via CSSStyleSheet.insertRule() — TIDAK menghapus rules yang ada
 *   - Fallback ke textContent += jika CSSOM API tidak tersedia
 *
 * PENTING — Kenapa insertRule() bukan textContent +=:
 *   `el.textContent += css` terlihat additive tapi sebenarnya:
 *     1. Browser baca semua textContent yang ada
 *     2. HAPUS semua rules dari stylesheet
 *     3. Concat string baru
 *     4. Parse ulang dan re-add semua rules
 *   Di step 2-3, ada window singkat dimana SEMUA styles hilang → FLICKER.
 *
 *   `sheet.insertRule()` benar-benar additive — hanya menambah rule baru
 *   tanpa menyentuh rules yang sudah ada. Zero flicker.
 *
 * Usage (internal, dipakai oleh stateEngine dan containerQuery):
 *   import { batchedInject, flushBatchedCss } from "./batchedInjector"
 *
 *   // Queue a rule
 *   batchedInject(".tw-s-abc123[data-active=\"true\"]{opacity:0.5}")
 *
 *   // Force flush (biasanya tidak perlu — RAF melakukan ini otomatis)
 *   flushBatchedCss()
 */

// ─────────────────────────────────────────────────────────────────────────────
// Singleton state
// ─────────────────────────────────────────────────────────────────────────────

/** All injected rules (deduplication registry) */
const injected = new Set<string>()

/** Pending rules for current RAF batch */
const pending: string[] = []

/** RAF handle and style element state */
const _state = {
  rafHandle: null as ReturnType<typeof requestAnimationFrame> | null,
  styleEl: null as HTMLStyleElement | null,
}

function getStyleElement(): HTMLStyleElement {
  if (_state.styleEl && document.head.contains(_state.styleEl)) return _state.styleEl

  _state.styleEl = document.createElement("style")
  _state.styleEl.id = "__tw-runtime-css"
  _state.styleEl.setAttribute("data-tw-batched", "true")
  // Harus diappend ke DOM sebelum .sheet bisa diakses
  document.head.appendChild(_state.styleEl)
  return _state.styleEl
}

/**
 * Inject satu CSS rule via CSSStyleSheet.insertRule().
 *
 * Ini benar-benar additive — tidak menyentuh rules yang sudah ada.
 * Fallback ke textContent append jika sheet belum siap (edge case).
 *
 * @internal
 */
function insertRuleToSheet(cssRule: string): void {
  const trimmed = cssRule.trim()
  if (!trimmed) return

  const el = getStyleElement()
  const sheet = el.sheet

  if (sheet) {
    try {
      // insertRule() di akhir — urutan tidak kritis untuk utility CSS
      sheet.insertRule(trimmed, sheet.cssRules.length)
      return
    } catch {
      // insertRule() bisa throw jika:
      // 1. Rule syntax tidak valid
      // 2. Multi-rule string (insertRule() hanya terima satu rule)
      // Fallback ke textContent append untuk kasus ini.
      if (process.env.NODE_ENV === "development") {
        console.warn("[tw] insertRule failed, falling back to textContent append for rule:", trimmed.slice(0, 80))
      }
    }
  }

  // Fallback: textContent append.
  // Lebih jarang terjadi sekarang karena stateEngine sudah loop per-rule,
  // tapi tetap perlu sebagai safety net.
  el.textContent = (el.textContent ?? "") + `\n${trimmed}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Core API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Queue a CSS rule for batched injection.
 * Multiple rules accumulated during one event loop tick are flushed together
 * in one requestAnimationFrame → one style recalculation.
 *
 * Rules diinjeksi via insertRule() — zero flicker, truly additive.
 */
export function batchedInject(cssRule: string): void {
  if (typeof window === "undefined") return // SSR — no-op
  if (!cssRule || injected.has(cssRule)) return

  injected.add(cssRule)
  pending.push(cssRule)

  if (_state.rafHandle === null) {
    _state.rafHandle = requestAnimationFrame(flushBatchedCss)
  }
}

/**
 * Immediately flush all pending CSS rules to the DOM.
 * Called automatically by RAF each frame. Can also be called manually
 * after synchronous component setup where RAF timing is too late.
 *
 * Setiap rule diinjeksi secara individual via insertRule() — tidak ada
 * window dimana existing rules hilang.
 */
export function flushBatchedCss(): void {
  _state.rafHandle = null

  if (pending.length === 0 || typeof document === "undefined") return

  // Flush semua rules sekaligus — satu per satu via insertRule()
  // insertRule() atomic per-rule: rule lama tidak pernah dihapus
  const rules = pending.splice(0)
  for (const rule of rules) {
    insertRuleToSheet(rule)
  }
}

/**
 * Synchronous inject — skips batching.
 * Use for SSR / critical path where RAF is not available.
 *
 * Menggunakan insertRule() — tidak ada flicker meskipun dipanggil
 * di tengah render cycle.
 */
export function syncInject(cssRule: string): void {
  if (typeof document === "undefined") return
  if (!cssRule || injected.has(cssRule)) return

  injected.add(cssRule)
  insertRuleToSheet(cssRule)
}

/**
 * Check if a rule has already been injected (deduplication check).
 */
export function isInjected(cssRule: string): boolean {
  return injected.has(cssRule)
}

/**
 * Clear all injected rules and remove the style element.
 * Useful for testing / SSR resets. Not for production use.
 */
export function resetBatchedCss(): void {
  injected.clear()
  pending.length = 0

  if (_state.rafHandle !== null) {
    cancelAnimationFrame(_state.rafHandle)
    _state.rafHandle = null
  }

  // Guard: document tidak tersedia di SSR / Node test environment
  if (typeof document !== "undefined" && _state.styleEl && document.head.contains(_state.styleEl)) {
    document.head.removeChild(_state.styleEl)
    _state.styleEl = null
  } else {
    _state.styleEl = null
  }
}

/**
 * Get stats about the current injection state (for devtools).
 */
export function getBatchedCssStats(): {
  totalInjected: number
  pendingCount: number
  hasBatchScheduled: boolean
} {
  return {
    totalInjected: injected.size,
    pendingCount: pending.length,
    hasBatchScheduled: _state.rafHandle !== null,
  }
}