/**
 * tailwind-styled-v4 — Turbopack / Webpack Loader
 *
 * QA #7: Router-aware loader dengan:
 * - App Router vs Pages Router detection
 * - Directive preservation (use client / use server)
 * - Version-specific Next.js optimizations
 * - Source map passthrough
 * - Skip non-component files (node_modules, .d.ts, already transformed)
 */

import { runLoaderTransform, registerFileClasses } from "@tailwind-styled/compiler/internal"
import fs from "node:fs"
import path from "node:path"

export interface TurbopackContext {
  /** Absolute path ke file yang sedang di-transform */
  resourcePath: string
  /** Next.js version (jika di-inject oleh withTailwindStyled) */
  query?: Record<string, unknown>
}

export interface TurbopackLoaderOptions {
  addDataAttr?: boolean | string
  autoClientBoundary?: boolean | string
  hoist?: boolean | string
  preserveImports?: boolean | string
  /** Debug mode — log transform details */
  debug?: boolean | string
  /** Explicit Next.js major version */
  nextMajor?: number | string
  /** Path ke safelist CSS file — di-inject oleh withTailwindStyled (dev only) */
  safelistPath?: string
}

function parseBool(val: boolean | string | undefined, fallback = false): boolean {
  if (typeof val === "boolean") return val
  if (typeof val === "string") return val === "true" || val === "1"
  return fallback
}

function parseNum(val: number | string | undefined): number | undefined {
  if (typeof val === "number") return val
  if (typeof val === "string") return parseInt(val, 10) || undefined
  return undefined
}

function detectRouter(resourcePath: string): "app" | "pages" | "unknown" {
  const normalized = resourcePath.replace(/\\/g, "/")
  if (/\/app\//.test(normalized)) return "app"
  if (/\/pages\//.test(normalized)) return "pages"
  return "unknown"
}

/**
 * Next.js App Router entry-point files yang TIDAK boleh diproses loader ini.
 *
 * Turbopack tidak support `exclude` di rule level seperti webpack, sehingga
 * *.tsx glob akan match layout.tsx, page.tsx, dll. Guard ini memastikan loader
 * skip file-file tersebut secara eksplisit — identik dengan NEXT_RSC_ENTRIES
 * di withTailwindStyled.ts yang hanya efektif untuk webpack path.
 *
 * Tanpa guard ini: loader menyentuh layout.tsx → Next.js/React Compiler
 * kehilangan sinyal pure RSC → locale injection dari Accept-Language header
 * (Next.js 16+) tidak konsisten antara SSR pass dan hydration pass →
 * hydration mismatch `lang="id"` vs `lang="en"`.
 */
const NEXT_RSC_ENTRIES =
  /(?:^|[\\/])(?:layout|page|loading|error|not-found|template|default)\.[jt]sx?$/

function isSkippable(resourcePath: string): boolean {
  const normalized = resourcePath.replace(/\\/g, "/")
  return (
    normalized.includes("/node_modules/") ||
    normalized.endsWith(".d.ts") ||
    normalized.endsWith(".d.mts") ||
    normalized.endsWith(".d.cts") ||
    // Skip CSS/assets
    /\.(css|scss|sass|less|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$/.test(normalized) ||
    // Skip Next.js RSC entry files — Turbopack tidak punya exclude di rule level,
    // jadi guard ini menggantikan NEXT_RSC_ENTRIES exclude yang ada di webpack path.
    NEXT_RSC_ENTRIES.test(normalized)
  )
}

/** Extract directive line dari source */
function extractDirective(source: string): { directive: string; stripped: string } {
  const match = source.match(/^(\s*["'](use client|use server)["']\s*;?\s*\n?)/)
  if (!match) return { directive: "", stripped: source }
  const directive = match[1].trim().replace(/['"]/g, '"') + "\n"
  const stripped = source.slice(match[0].length)
  return { directive, stripped }
}


// ─── Per-file safelist writer ─────────────────────────────────────────────────
// Turbopack tidak punya afterCompile hook dan bisa spawn multiple workers.
// Solusi: tiap file menulis file CSS-nya sendiri di .next/tw-classes/<slug>.css
// Tailwind scan seluruh direktori via @source ".next/tw-classes/**"
// Tidak ada race condition karena tiap file punya output path unik.
//
// Stale file handling:
// - Setiap dev server start, Next.js hapus .next/ → tw-classes/ otomatis hilang
// - Setiap compile cycle, TwSafelistDevPlugin (webpack) clear tw-classes/
// - Turbopack: pakai _cycle sentinel file — kalau cycle berubah, clear dulu

// ─── Cycle ID ─────────────────────────────────────────────────────────────────
// withTailwindStyled menulis _start.txt saat wrap() dipanggil (= saat next.config.ts
// di-load, yaitu sekali per dev server start). Setiap compile cycle Turbopack,
// loader baca _start.txt dan compare dengan _cycle.txt di tw-classes/:
//
//   _start.txt  = timestamp dev server start  (ditulis withTailwindStyled)
//   _cycle.txt  = timestamp cycle terakhir    (ditulis loader pertama di tiap cycle)
//
// Kalau _cycle.txt != _start.txt → compile cycle baru → clear tw-classes/ dulu.
// Ini solve masalah "file yang dihapus tetap ada di safelist" tanpa butuh hook.

const CYCLE_SENTINEL = "_cycle.txt"
const START_SENTINEL = "_start.txt"

// Cached per worker instance — hindari readFileSync berulang di file yang sama
const _workerCache = new Map<string, string>()

function getTwClassesDir(safelistPath: string): string {
  return path.join(path.dirname(safelistPath), "tw-classes")
}

function readSentinel(filePath: string): string {
  try { return fs.readFileSync(filePath, "utf-8").trim() } catch { return "" }
}

function clearAndMarkCycle(twClassesDir: string, startId: string): void {
  try {
    if (fs.existsSync(twClassesDir)) {
      for (const file of fs.readdirSync(twClassesDir)) {
        if (file === START_SENTINEL || file === "_webpack-merged.css") continue
        try { fs.unlinkSync(path.join(twClassesDir, file)) } catch { /* non-fatal */ }
      }
    } else {
      fs.mkdirSync(twClassesDir, { recursive: true })
    }
    fs.writeFileSync(path.join(twClassesDir, CYCLE_SENTINEL), startId, "utf-8")
    _workerCache.set(twClassesDir, startId)
  } catch { /* non-fatal */ }
}

function getPerFileSafelistPath(safelistDir: string, resourcePath: string): string {
  const normalized = resourcePath.replace(/\\/g, "/")
  const slug = normalized
    .replace(/^.*\/src\//, "")
    .replace(/\.[tj]sx?$/, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 80)
  return path.join(safelistDir, `${slug}.css`)
}

function writePerFileSafelist(
  safelistPath: string | undefined,
  resourcePath: string,
  classes: string[]
): void {
  if (!safelistPath || classes.length === 0) return
  try {
    const twClassesDir = getTwClassesDir(safelistPath)

    // Baca start ID dari _start.txt (ditulis withTailwindStyled saat config load)
    const startId = readSentinel(path.join(twClassesDir, START_SENTINEL))

    // Compare dengan cycle ID terakhir — pakai in-memory cache dulu, fallback ke disk
    const cachedCycle = _workerCache.get(twClassesDir) ?? readSentinel(path.join(twClassesDir, CYCLE_SENTINEL))

    if (startId && cachedCycle !== startId) {
      // Compile cycle baru — clear tw-classes/ dan tulis _cycle.txt baru
      clearAndMarkCycle(twClassesDir, startId)
    } else if (!fs.existsSync(twClassesDir)) {
      fs.mkdirSync(twClassesDir, { recursive: true })
    }

    const outPath = getPerFileSafelistPath(twClassesDir, resourcePath)
    const sorted = [...new Set(classes)].sort()
    const css = [
      `/* tw-safelist: ${path.basename(resourcePath)} — auto-generated */`,
      "@layer utilities {",
      sorted.map((cls) => `.${cls.replace(/([^a-zA-Z0-9_-])/g, "\\$1")} {}`).join("\n"),
      "}",
    ].join("\n")

    // Skip write jika isi sama — avoid Tailwind re-scan yang tidak perlu
    try {
      if (fs.readFileSync(outPath, "utf-8") === css) return
    } catch { /* file belum ada, lanjut write */ }

    fs.writeFileSync(outPath, css, "utf-8")
  } catch {
    // Non-fatal
  }
}

/**
 * Main loader function — compatible dengan Turbopack, Webpack 5, rspack.
 */
export default function turbopackLoader(
  this: TurbopackContext,
  source: string,
  options: TurbopackLoaderOptions = {}
): string {
  // Skip files yang tidak perlu di-transform
  if (isSkippable(this.resourcePath)) return source

  // Detect router context
  const router = detectRouter(this.resourcePath)
  const nextMajor = parseNum(options.nextMajor)
  const debug = parseBool(options.debug)
  const filename = path.basename(this.resourcePath)

  // Build effective options berdasarkan router context
  const effective = {
    addDataAttr: parseBool(options.addDataAttr),
    // App Router: selalu auto-detect client boundary
    // Pages Router: opt-in via option
    autoClientBoundary: router === "app" ? true : parseBool(options.autoClientBoundary),
    // Hoist by default untuk semua contexts
    hoist: parseBool(options.hoist, true),
    // Pages Router: preserve imports (RSC tidak berlaku)
    preserveImports: router === "pages" ? true : parseBool(options.preserveImports, false),
  }

  if (debug) {
    console.debug(`[tw-loader] ${filename}: router=${router} nextMajor=${nextMajor ?? "unknown"}`)
  }

  // Preserve directive (use client / use server)
  const { directive, stripped } = extractDirective(source)

  try {
    const output = runLoaderTransform({
      filepath: this.resourcePath,
      source: stripped,
      options: effective,
    })

    // Tidak ada perubahan — Rust kembalikan source asli (bukan string kosong).
    // Guard lama `!output.code.length` selalu false karena code = original source.
    // Fix: cukup cek changed flag saja; return source asli agar Next.js RSC boundary
    // tetap intact dan tidak ada interaksi dengan React Compiler locale detection.
    if (!output.changed) return source

    // Register classes untuk route map (dipakai webpack dev plugin & build manifest)
    if (output.classes.length > 0) {
      registerFileClasses(this.resourcePath, output.classes)
      // Turbopack: tulis per-file safelist langsung dari loader.
      // Race-condition-safe karena tiap file punya output path unik.
      writePerFileSafelist(options.safelistPath, this.resourcePath, output.classes)
    }

    // Re-attach directive di depan
    if (!directive) return output.code

    // Strip any duplicate directives yang mungkin diinject oleh compiler
    const clean = output.code.replace(/^\s*["'](use client|use server)["']\s*;?\s*\n?/, "")
    return directive + clean
  } catch (err) {
    // Loader harus tidak pernah throw — return source asli dengan warning
    const msg = err instanceof Error ? err.message : String(err)
    if (debug) {
      console.warn(`[tw-loader] transform failed for ${filename}: ${msg}`)
    }
    return source
  }
}
