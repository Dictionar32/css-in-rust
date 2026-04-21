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

function isSkippable(resourcePath: string): boolean {
  const normalized = resourcePath.replace(/\\/g, "/")
  return (
    normalized.includes("/node_modules/") ||
    normalized.endsWith(".d.ts") ||
    normalized.endsWith(".d.mts") ||
    normalized.endsWith(".d.cts") ||
    // Skip CSS/assets
    /\.(css|scss|sass|less|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$/.test(normalized)
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


// ─── Safelist write scheduler ────────────────────────────────────────────────
// Turbopack tidak punya afterCompile hook seperti webpack, jadi safelist ditulis
// langsung dari loader dengan debounce 80ms agar burst cold-start hanya trigger
// satu kali write.

let _safelistTimer: ReturnType<typeof setTimeout> | null = null
const _pendingSafelistPaths = new Set<string>()

function scheduleSafelistWrite(safelistPath: string | undefined): void {
  if (!safelistPath) return
  _pendingSafelistPaths.add(safelistPath)

  if (_safelistTimer) clearTimeout(_safelistTimer)
  _safelistTimer = setTimeout(() => {
    _safelistTimer = null
    for (const outPath of _pendingSafelistPaths) {
      writeSafelist(outPath)
    }
    _pendingSafelistPaths.clear()
  }, 80)
}

function writeSafelist(safelistPath: string): void {
  try {
    const { getAllRouteClasses } = require("@tailwind-styled/compiler/internal")
    const routeMap: Map<string, Set<string>> = getAllRouteClasses()
    const allClasses = new Set<string>()
    for (const classes of routeMap.values()) {
      for (const cls of classes) allClasses.add(cls)
    }
    if (allClasses.size === 0) return

    const sorted = [...allClasses].sort()
    const css = [
      "/* tailwind-styled-v4 safelist — auto-generated, do not edit */",
      "/* @tw-safelist */",
      ".tw-safelist {",
      sorted.map((cls) => `  /* ${cls} */`).join("\n"),
      "}",
      "@layer utilities {",
      sorted.map((cls) => `.${cls.replace(/([^a-zA-Z0-9_-])/g, "\\$1")} {}`).join("\n"),
      "}",
    ].join("\n")

    const dir = safelistPath.slice(0, safelistPath.lastIndexOf("/"))
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(safelistPath, css, "utf-8")
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

    // Tidak ada perubahan → return original (avoid unnecessary HMR)
    if (!output.changed && !output.code.length) return source

    // Register classes untuk safelist dev plugin
    if (output.classes.length > 0) {
      registerFileClasses(this.resourcePath, output.classes)
      // Turbopack tidak punya afterCompile hook — schedule write langsung dari loader.
      // safelistPath di-inject oleh withTailwindStyled sebagai loader option.
      scheduleSafelistWrite(options.safelistPath)
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