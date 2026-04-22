/**
 * tailwindEngine.ts
 *
 * Pipeline: classes[] → Tailwind JS (expand) → Rust LightningCSS (post-process)
 *
 * Tailwind adalah sumber kebenaran untuk semua CSS declarations.
 * Rust/LightningCSS handle: vendor prefix, minify, dead-code strip.
 *
 * Tidak ada hardcoded CSS di sini — semuanya dari Tailwind engine.
 */

import { createRequire } from "node:module"
import { getNativeBridge } from "./nativeBridge"

const require = createRequire(import.meta.url)

// ─────────────────────────────────────────────────────────────────────────────
// Tailwind CSS v4 engine loader
// ─────────────────────────────────────────────────────────────────────────────

interface TailwindV4Engine {
  compile: (input: string, options?: { loadPlugin?: () => unknown }) => {
    build: (candidates: string[]) => string
  }
}

let _twEngine: TailwindV4Engine | null = null
let _twEngineError: Error | null = null

function loadTailwindEngine(): TailwindV4Engine {
  if (_twEngine) return _twEngine
  if (_twEngineError) throw _twEngineError

  try {
    // Tailwind CSS v4 exposes a compile() API
    const tw = require("tailwindcss") as TailwindV4Engine
    if (typeof tw.compile !== "function") {
      throw new Error("tailwindcss v4 not found — compile() API missing. Check tailwindcss version >= 4.")
    }
    _twEngine = tw
    return _twEngine
  } catch (e) {
    _twEngineError = e instanceof Error ? e : new Error(String(e))
    throw _twEngineError
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tailwind → raw CSS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate raw CSS dari Tailwind engine.
 * Input: array of Tailwind class names.
 * Output: expanded CSS string (belum diminify).
 *
 * @example
 *   generateRawCss(["flex", "items-center", "hover:bg-blue-500"])
 *   // → ".flex{display:flex}.items-center{align-items:center}..."
 */
export function generateRawCss(classes: string[]): string {
  if (classes.length === 0) return ""

  const tw = loadTailwindEngine()

  // Tailwind v4: compile() returns a compiler instance, build() takes candidates
  const compiler = tw.compile("@import 'tailwindcss';")
  return compiler.build(classes)
}

// ─────────────────────────────────────────────────────────────────────────────
// LightningCSS post-process via Rust
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kirim raw CSS ke Rust untuk diproses LightningCSS.
 * - Vendor prefix otomatis
 * - Minify
 * - Canonical output
 */
function postProcessWithLightning(rawCss: string): string {
  if (!rawCss) return ""

  const native = getNativeBridge()

  // process_tailwind_css_lightning sudah ada di css_compiler.rs
  if (typeof native.processTailwindCssLightning === "function") {
    const result = native.processTailwindCssLightning(rawCss)
    return result?.css ?? rawCss
  }

  // Fallback: return raw jika binding belum tersedia
  console.warn("[tailwind-styled] processTailwindCssLightning tidak tersedia — gunakan raw CSS")
  return rawCss
}

// ─────────────────────────────────────────────────────────────────────────────
// Main pipeline
// ─────────────────────────────────────────────────────────────────────────────

export interface CssPipelineResult {
  css: string
  classes: string[]
  sizeBytes: number
  /** true jika LightningCSS berhasil dijalankan */
  optimized: boolean
}

/**
 * Full pipeline: classes[] → Tailwind → LightningCSS → final CSS
 *
 * @example
 *   const result = await runCssPipeline(["flex", "p-4", "hover:bg-blue-500"])
 *   // inject result.css ke <head>
 */
export async function runCssPipeline(classes: string[]): Promise<CssPipelineResult> {
  const unique = [...new Set(classes.filter(Boolean))]

  if (unique.length === 0) {
    return { css: "", classes: [], sizeBytes: 0, optimized: false }
  }

  // Step 1: Tailwind JS → raw CSS
  const rawCss = generateRawCss(unique)

  // Step 2: Rust LightningCSS → optimized CSS
  const native = getNativeBridge()
  const hasLightning = typeof native.processTailwindCssLightning === "function"

  const finalCss = hasLightning ? postProcessWithLightning(rawCss) : rawCss

  return {
    css: finalCss,
    classes: unique,
    sizeBytes: finalCss.length,
    optimized: hasLightning,
  }
}

/**
 * Sync version — untuk konteks yang tidak support async (webpack loader).
 * Tanpa async karena Tailwind v4 compile() sync.
 */
export function runCssPipelineSync(classes: string[]): CssPipelineResult {
  const unique = [...new Set(classes.filter(Boolean))]

  if (unique.length === 0) {
    return { css: "", classes: [], sizeBytes: 0, optimized: false }
  }

  const rawCss = generateRawCss(unique)

  const native = getNativeBridge()
  const hasLightning = typeof native.processTailwindCssLightning === "function"
  const finalCss = hasLightning ? postProcessWithLightning(rawCss) : rawCss

  return {
    css: finalCss,
    classes: unique,
    sizeBytes: finalCss.length,
    optimized: hasLightning,
  }
}