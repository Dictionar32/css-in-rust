/**
 * staticStateExtractor.ts — Build-time State CSS Pre-generator
 *
 * Mengkoordinasi pipeline untuk mengeliminasi runtime CSS injection untuk `states` config.
 *
 * Flow:
 *   1. Walk semua source files (.ts/.tsx/.js/.jsx)
 *   2. Per file: panggil `extractTwStateConfigs()` (Rust NAPI)
 *      → temukan semua `tw.tag({ states: {...} })` calls
 *   3. Kumpulkan semua configs, panggil `generateStaticStateCss()` (Rust NAPI)
 *      → compute hash identik dengan runtime stateEngine.ts
 *      → generate CSS rules dengan selector `.tw-s-[hash][data-stateName="true"]`
 *   4. Append hasilnya ke safelist CSS file
 *
 * Hasilnya: browser load state CSS dari static file — ZERO runtime injection,
 * ZERO flicker saat component dengan states di-render.
 *
 * Dipanggil dari withTailwindStyled.ts setelah initial Tailwind CSS scan.
 *
 * @module staticStateExtractor
 */

import fs from "node:fs"
import path from "node:path"

// ── Types (mirror dari native/src/application/state_css.rs) ────────────────

export interface TwStateConfigEntry {
  tag: string
  componentName: string
  statesJson: string
  sourceFile: string
}

export interface StaticStateCssInput {
  tag: string
  componentName: string
  statesJson: string
}

export interface GeneratedStateRule {
  selector: string
  declarations: string
  cssRule: string
  componentName: string
  stateName: string
}

export interface StaticStateExtractionResult {
  /** Total source files di-scan */
  filesScanned: number
  /** Files yang punya tw() state configs */
  filesWithStates: number
  /** Total komponen dengan states ditemukan */
  componentsFound: number
  /** Total CSS rules yang di-generate */
  rulesGenerated: number
  /** Rules yang tidak bisa di-resolve (butuh Tailwind full pipeline) */
  rulesSkipped: number
  /** CSS yang siap di-append ke safelist file */
  generatedCss: string
  /** Debug: semua rules yang di-generate */
  rules: GeneratedStateRule[]
}

// ── Source file extensions yang di-scan ────────────────────────────────────

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"])
const IGNORE_PATTERNS = ["node_modules", ".next", "dist", "build", ".git", "coverage", "__tests__"]

// ── Native bridge lazy loader ───────────────────────────────────────────────

interface PrefilterFileResult {
  path: string
  content: string
}

let _native: {
  extractTwStateConfigs: (source: string, filename: string) => TwStateConfigEntry[]
  generateStaticStateCss: (inputs: StaticStateCssInput[], resolvedCss?: string | null) => GeneratedStateRule[]
  extractAndGenerateStateCss: (source: string, filename: string) => GeneratedStateRule[]
  walkAndPrefilterSourceFiles?: (
    root: string,
    extensions?: string[] | null,
    ignoreDirs?: string[] | null,
    requiredSubstrings?: string[] | null,
    maxFiles?: number | null,
    parallel?: boolean | null,
  ) => PrefilterFileResult[]
} | null = null

function getNative() {
  if (_native) return _native
  try {
    // Pakai require dinamis — sama dengan pattern di file lain
    const mod = require("@tailwind-styled/compiler/internal") as {
      extractTwStateConfigs?: (source: string, filename: string) => TwStateConfigEntry[]
      generateStaticStateCss?: (inputs: StaticStateCssInput[]) => GeneratedStateRule[]
      extractAndGenerateStateCss?: (source: string, filename: string) => GeneratedStateRule[]
    }
    if (
      typeof mod?.extractTwStateConfigs !== "function" ||
      typeof mod?.generateStaticStateCss !== "function"
    ) {
      return null
    }
    _native = {
      extractTwStateConfigs: mod.extractTwStateConfigs,
      generateStaticStateCss: mod.generateStaticStateCss,
      extractAndGenerateStateCss: mod.extractAndGenerateStateCss ?? (
        // Fallback jika extractAndGenerateStateCss belum di-export
        (source: string, filename: string) => {
          const configs = mod.extractTwStateConfigs!(source, filename)
          if (configs.length === 0) return []
          return mod.generateStaticStateCss!(configs.map((c) => ({
            tag: c.tag,
            componentName: c.componentName,
            statesJson: c.statesJson,
          })))
        }
      ),
    }
    return _native
  } catch {
    return null
  }
}

// ── File walker ──────────────────────────────────────────────────────────────

function* walkSourceFiles(dir: string): Generator<string> {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (IGNORE_PATTERNS.some((p) => entry.name === p || entry.name.startsWith(p))) continue
      yield* walkSourceFiles(fullPath)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (SOURCE_EXTENSIONS.has(ext)) yield fullPath
    }
  }
}

// ── CSS generation header ────────────────────────────────────────────────────

function buildCssHeader(result: StaticStateExtractionResult): string {
  return [
    "/* ─────────────────────────────────────────────────────────────────────",
    " * tw-state-static.css — Auto-generated by staticStateExtractor.ts",
    " * DO NOT EDIT. Re-generated on each build.",
    " *",
    ` * Files scanned:      ${result.filesScanned}`,
    ` * Files with states:  ${result.filesWithStates}`,
    ` * Components found:   ${result.componentsFound}`,
    ` * Rules generated:    ${result.rulesGenerated}`,
    ` * Rules skipped:      ${result.rulesSkipped} (akan di-inject runtime sebagai fallback)`,
    " *",
    " * Selector format: .tw-s-[hash][data-stateName=\"true\"] { ... }",
    " * Hash identik dengan yang dibuat oleh stateEngine.ts di runtime.",
    " * ─────────────────────────────────────────────────────────────────── */",
    "",
  ].join("\n")
}

// ── Main API ─────────────────────────────────────────────────────────────────

/**
 * Scan semua source files di `srcDir`, extract tw() state configs,
 * generate static CSS, dan return hasilnya.
 *
 * @param srcDir Root directory untuk scan (biasanya `process.cwd()/src`)
 * @param options Optional configuration
 */
export function extractStaticStateCss(
  srcDir: string,
  options: {
    /** Emit debug logging */
    verbose?: boolean
    /** Max files untuk di-scan (default: unlimited) */
    maxFiles?: number
    /**
     * CSS output dari Tailwind pipeline (isi `_initial-scan.css`).
     *
     * Kalau di-provide, dipakai untuk resolve class names via `parseTailwindCssToClassMap`
     * → semua Tailwind class (termasuk `w-full`, `ring-2`, dll) bisa di-resolve dengan benar.
     *
     * Kalau tidak di-provide, fallback ke Rust resolver (hanya class sederhana yang ter-resolve).
     */
    resolvedCss?: string
  } = {}
): StaticStateExtractionResult {
  const { verbose = false, maxFiles = Infinity } = options

  const native = getNative()
  if (!native) {
    if (verbose) {
      process.stderr.write(
        "[tw:static-state] native module tidak tersedia — skip static CSS pre-generation\n"
      )
    }
    return {
      filesScanned: 0,
      filesWithStates: 0,
      componentsFound: 0,
      rulesGenerated: 0,
      rulesSkipped: 0,
      generatedCss: "",
      rules: [],
    }
  }

  // ── Step 1: Collect all configs dari semua source files ──────────────────

  const allConfigs: TwStateConfigEntry[] = []
  let filesScanned = 0
  let filesWithStates = 0

  // ── Fast path: walkAndPrefilterSourceFiles — walk + read + pre-filter di Rust ──
  // Eliminasi: JS fs.readdirSync recursive + fs.readFileSync per file +
  // JS String.includes() pre-filter. Rust fs::read_dir + contains() ~5-10x lebih cepat.
  if (native.walkAndPrefilterSourceFiles) {
    const prefiltered = native.walkAndPrefilterSourceFiles(
      srcDir,
      [".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"],
      ["node_modules", ".next", "dist", "build", ".git", "coverage", "__tests__"],
      // Required substrings — AND logic, identik dengan JS pre-filter di bawah
      ["states:", "tw."],
      maxFiles === Infinity ? null : maxFiles,
      null  // sequential — parallel mode opsional untuk large monorepo
    )

    for (const { path: filePath, content: source } of prefiltered) {
      filesScanned++
      const configs = native.extractTwStateConfigs(source, filePath)
      if (configs.length > 0) {
        filesWithStates++
        allConfigs.push(...configs)
        if (verbose) {
          process.stderr.write(
            `[tw:static-state] ${path.relative(srcDir, filePath)}: ${configs.length} komponen\n`
          )
        }
      }
    }
  } else {
    // ── Fallback: JS generator + readFileSync + JS pre-filter ────────────────
    for (const filePath of walkSourceFiles(srcDir)) {
      if (filesScanned >= maxFiles) break

      let source: string
      try {
        source = fs.readFileSync(filePath, "utf-8")
      } catch {
        continue
      }

      filesScanned++

      // Quick pre-filter — skip files tanpa states config
      if (!source.includes("states:") && !source.includes("states :")) continue
      if (!source.includes("tw.") && !source.includes("tailwind-styled")) continue

      const configs = native.extractTwStateConfigs(source, filePath)
      if (configs.length > 0) {
        filesWithStates++
        allConfigs.push(...configs)
        if (verbose) {
          process.stderr.write(
            `[tw:static-state] ${path.relative(srcDir, filePath)}: ${configs.length} komponen\n`
          )
        }
      }
    }
  }

  if (allConfigs.length === 0) {
    return {
      filesScanned,
      filesWithStates: 0,
      componentsFound: 0,
      rulesGenerated: 0,
      rulesSkipped: 0,
      generatedCss: "",
      rules: [],
    }
  }

  // ── Step 2: Deduplicate configs (sama statesJson dari files berbeda) ─────

  const seen = new Set<string>()
  const uniqueConfigs: StaticStateCssInput[] = []

  for (const config of allConfigs) {
    const key = `${config.tag}::${config.statesJson}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueConfigs.push({
        tag: config.tag,
        componentName: config.componentName,
        statesJson: config.statesJson,
      })
    }
  }

  // ── Step 3: Generate CSS rules ─────────────────────────────────────────────
  // Rust handles everything: parse resolvedCss → class map → build rules.
  // Pass resolvedCss (Tailwind pipeline output) agar Rust bisa resolve semua
  // Tailwind class termasuk `w-full`, `ring-2`, dll yang tidak ada di TW_MAP statis.

  const allRules = native.generateStaticStateCss(uniqueConfigs, options.resolvedCss ?? null)
  // Count skipped: rules yang declarations-nya kosong atau unresolved (tidak mengandung ":")
  // Lebih akurat daripada menghitung (total state entries - generated rules) karena Rust
  // bisa generate multiple rules per state entry (misalnya untuk berbagai breakpoint).
  const rulesSkipped = allRules.filter((r) => {
    const decl = r.declarations.trim()
    return decl.length === 0 || !decl.includes(":")
  }).length

  // ── Step 4: Build CSS output ───────────────────────────────────────────────

  /**
   * Sanitize cssRule: filter out any declaration lines that are raw Tailwind
   * class names (no ":") instead of real CSS property:value pairs.
   *
   * Rust may return mixed declarations when partial resolution succeeds —
   * e.g. `declarations = "width: 100%\nw-full"`. The top-level isUnresolved
   * check (which relies on `declarations.includes(":")`) would pass, but the
   * resulting cssRule would still have `w-full` as an invalid CSS declaration.
   *
   * This function rebuilds the rule body keeping only valid `prop: val` lines.
   * Returns null if no valid declarations remain (caller skips the rule).
   */
  function sanitizeCssRule(cssRule: string, declarations: string): string | null {
    // Fast path: all declarations are valid (every non-empty segment has ":")
    const segments = declarations.split(/[;\n]/).map(s => s.trim()).filter(Boolean)
    const validSegs = segments.filter(s => s.includes(":"))
    const invalidSegs = segments.filter(s => !s.includes(":"))

    // Nothing invalid — emit as-is
    if (invalidSegs.length === 0) return cssRule

    // Everything invalid — skip entirely
    if (validSegs.length === 0) return null

    // Mixed: rebuild the rule with only valid declarations.
    // Extract selector from cssRule (text before first "{")
    const braceIdx = cssRule.indexOf("{")
    if (braceIdx === -1) return null
    const selector = cssRule.slice(0, braceIdx).trim()
    return `${selector} {\n  ${validSegs.join(";\n  ")};\n}`
  }

  // Group rules per component untuk komentar yang informatif
  const byComponent = new Map<string, GeneratedStateRule[]>()
  for (const rule of allRules) {
    const existing = byComponent.get(rule.componentName) ?? []
    existing.push(rule)
    byComponent.set(rule.componentName, existing)
  }

  const cssBlocks: string[] = []
  for (const [componentName, rules] of byComponent) {
    cssBlocks.push(`/* ${componentName} */`)
    for (const rule of rules) {
      cssBlocks.push(`/* state: ${rule.stateName} */`)

      // Detect unresolved Tailwind class names: real CSS declarations always
      // contain ":" (e.g. "width: 100%"), but raw class names never do.
      // When Rust can't resolve classes, declarations berisi raw class names
      // (e.g. "w-full") — bukan valid CSS.
      //
      // PENTING: jangan tulis raw class names di output CSS — Tailwind v4 PostCSS
      // akan throw CssSyntaxError: Invalid declaration ketika @import file ini.
      // Rust seharusnya sudah resolve semua classes via resolvedCss; kalau masih
      // unresolved, runtime stateEngine.ts akan handle sebagai fallback.
      const isFullyUnresolved =
        rule.declarations.trim().length > 0 &&
        !rule.declarations.includes(":")

      if (isFullyUnresolved) {
        // Semua deklarasi unresolved — skip seluruh rule.
        // Encode class names di komentar agar tidak di-scan Tailwind v4 @source.
        const encoded = rule.declarations.replace(/([\w-]+)/g, "[$1]")
        cssBlocks.push(`/* SKIP [unresolved]: ${encoded} */`)
      } else {
        // Partial or full resolution — sanitize before emitting.
        // sanitizeCssRule strips any individual declarations without ":" so the
        // emitted CSS is always syntactically valid even if Rust returned mixed content.
        const sanitized = sanitizeCssRule(rule.cssRule, rule.declarations)
        if (sanitized !== null) {
          cssBlocks.push(sanitized)
        } else {
          const encoded = rule.declarations.replace(/([\w-]+)/g, "[$1]")
          cssBlocks.push(`/* SKIP [sanitized-empty]: ${encoded} */`)
        }
      }
    }
    cssBlocks.push("")
  }

  const result: StaticStateExtractionResult = {
    filesScanned,
    filesWithStates,
    componentsFound: allConfigs.length,
    rulesGenerated: allRules.length,
    rulesSkipped,
    generatedCss: cssBlocks.join("\n"),
    rules: allRules,
  }

  result.generatedCss = buildCssHeader(result) + result.generatedCss
  return result
}

/** Nama file output untuk static state CSS — di-import langsung dari globals.css */
export const TW_STATE_STATIC_FILENAME = "_tw-state-static.css"

/**
 * Extract static state CSS dan tulis ke file terpisah `_tw-state-static.css`
 * di `.next/tw-classes/_tw-state-static.css` — grouped bersama `_initial-scan.css`.
 *
 * File ini harus di-`@import` langsung dari globals.css karena berisi raw CSS
 * (bukan Tailwind class names), sehingga tidak bisa di-pickup oleh `@source`.
 *
 * Dipanggil dari `withTailwindStyled.ts` setelah initial Tailwind scan.
 *
 * @param srcDir Source directory untuk scan
 * @param safelistPath Path ke safelist CSS file — dipakai untuk derive direktori output
 * @param options Optional config
 * @returns Summary string untuk logging
 */
export function appendStaticStateCssToSafelist(
  srcDir: string,
  safelistPath: string,
  options: {
    verbose?: boolean
    /**
     * CSS output dari Tailwind pipeline — isi dari `_initial-scan.css`.
     *
     * Wajib di-provide untuk resolve semua Tailwind class dengan benar.
     * Kalau tidak di-provide, fallback ke Rust resolver (class sederhana saja).
     */
    resolvedCss?: string
  } = {}
): string {
  const result = extractStaticStateCss(srcDir, {
    verbose: options.verbose,
    resolvedCss: options.resolvedCss || ""  // ← ensure always passed
  })

  // Selalu tulis file (kosong jika tidak ada rules) supaya @import di globals.css
  // tidak error saat cold start sebelum ada komponen dengan states.
  const twClassesDir = path.join(path.dirname(safelistPath), "tw-classes")
  fs.mkdirSync(twClassesDir, { recursive: true })
  const stateFilePath = path.join(twClassesDir, TW_STATE_STATIC_FILENAME)

  if (result.rulesGenerated === 0) {
    try {
      // Tulis file kosong agar @import globals.css tidak error
      fs.writeFileSync(
        stateFilePath,
        "/* tw-state-static.css — tidak ada state rules yang di-generate */\n",
        "utf-8"
      )
    } catch { /* non-fatal */ }
    return `[tw:static-state] tidak ada state rules yang di-generate (${result.filesScanned} files di-scan)`
  }

  try {
    // Tulis ke file terpisah — REPLACE setiap build supaya selalu fresh.
    // File ini di-@import langsung dari globals.css (bukan @source),
    // karena berisi raw CSS selector (.tw-s-[hash][data-state="true"]),
    // bukan Tailwind class names yang bisa di-scan oleh @source.
    fs.writeFileSync(stateFilePath, result.generatedCss, "utf-8")

    return [
      `[tw:static-state] ${result.rulesGenerated} static state rules di-generate`,
      `  → ${result.filesScanned} files scanned, ${result.filesWithStates} dengan states`,
      `  → ${result.componentsFound} components, ${result.rulesSkipped} rules skipped (fallback ke runtime)`,
      `  → ditulis ke tw-classes/${TW_STATE_STATIC_FILENAME}`,
    ].join("\n")
  } catch (writeErr) {
    const msg = writeErr instanceof Error ? writeErr.message : String(writeErr)
    return `[tw:static-state] gagal tulis state CSS: ${msg}`
  }
}