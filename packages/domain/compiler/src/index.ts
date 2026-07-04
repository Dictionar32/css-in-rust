/**
 * tailwind-styled-v5 — Compiler Main Entry Point
 * 
 * Re-exports all sub-entry points for backward compatibility.
 * For better tree-shaking, import from specific sub-entries:
 * - '@tailwind-styled/compiler/compiler' - CSS generation and compilation
 * - '@tailwind-styled/compiler/parser' - Class parsing and extraction
 * - '@tailwind-styled/compiler/analyzer' - Analysis and optimization
 * - '@tailwind-styled/compiler/cache' - Cache management
 * - '@tailwind-styled/compiler/redis' - Redis and distributed cache
 * - '@tailwind-styled/compiler/watch' - File watching and monitoring
 */

import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const _require = createRequire(
  typeof require !== "undefined"
    ? (typeof __filename !== "undefined" ? `file://${__filename}` : "file://unknown")
    : import.meta.url
)

import { getNativeBridge, resetNativeBridgeCache, adaptNativeResult, type NativeBridge, type NativeTransformResult, type ClassExtractResult, type ComponentMetadata, type NativeRscResult } from "./nativeBridge"

export { getNativeBridge, resetNativeBridgeCache, adaptNativeResult }
export type { NativeBridge, NativeTransformResult, ClassExtractResult, ComponentMetadata, NativeRscResult }

// ═══════════════════════════════════════════════════════════════════════════
// RE-EXPORT ALL SUB-ENTRIES FOR BACKWARD COMPATIBILITY
// ═══════════════════════════════════════════════════════════════════════════

// Compiler sub-entry - CSS generation, compilation, ID registry, streaming
export * from './compiler'

// Parser sub-entry - Class parsing and extraction
export * from './parser'

// Analyzer sub-entry - Analysis, optimization, theme resolution
export * from './analyzer'

// Cache sub-entry - Cache management
export * from './cache'

// Redis sub-entry - Redis and distributed cache
export * from './redis'

// Watch sub-entry - File watching and monitoring
export * from './watch'

// Route graph - static import-graph based per-route class attribution
export * from './routeGraph'

// Semantic components - Type inference dan metadata analysis (Build-time)
export * from './semanticComponentAnalyzer'
export * from './typeGeneratorFromMetadata'
export * from './typeGenerationPlugin'

// ═══════════════════════════════════════════════════════════════════════════
// PURE RUST SYNC API (v5.0.19+) — NO FALLBACK
// ═══════════════════════════════════════════════════════════════════════════
// These are the ONLY scanning/generation paths for production builds
// All must go through native Rust module — fail-fast if unavailable

// ═══════════════════════════════════════════════════════════════════════════
// TRANSFORM & CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const transformSource = (source: string, opts?: Record<string, unknown>) => {
  const native = getNativeBridge()
  if (!native?.transformSource) {
    throw new Error("FATAL: Native binding 'transformSource' is required but not available.")
  }
  const stringOpts = opts
    ? Object.fromEntries(Object.entries(opts).map(([k, v]) => [k, String(v)]))
    : undefined
  const result = native.transformSource(source, stringOpts as Record<string, string>)
  if (!result) {
    throw new Error("FATAL: transformSource returned null")
  }
  return result
}

export const hasTwUsage = (source: string): boolean => {
  const native = getNativeBridge()
  if (!native?.hasTwUsage) {
    throw new Error("FATAL: Native binding 'hasTwUsage' is required but not available.")
  }
  return native.hasTwUsage(source)
}

export const isAlreadyTransformed = (source: string): boolean => {
  const native = getNativeBridge()
  if (!native?.isAlreadyTransformed) {
    throw new Error("FATAL: Native binding 'isAlreadyTransformed' is required but not available.")
  }
  return native.isAlreadyTransformed(source)
}

export const shouldProcess = (source: string): boolean => {
  return hasTwUsage(source) && !isAlreadyTransformed(source)
}

// ═══════════════════════════════════════════════════════════════════════════
// ADDITIONAL UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const compileCssFromClasses = (classes: string[], prefix?: string | null) => {
  const native = getNativeBridge()
  if (!native?.transformSource) {
    throw new Error("FATAL: Native binding 'transformSource' is required but not available.")
  }
  const result = native.transformSource(classes.join(" "), { prefix: prefix ?? "" })
  if (!result) {
    throw new Error("FATAL: transformSource returned null")
  }
  return result
}

export const buildStyleTag = (classes: string[]): string => {
  const result = compileCssFromClasses(classes)
  return result?.code ? `<style data-tailwind-styled>${result.code}</style>` : ""
}

export const generateCssForClasses = async (
  classes: string[],
  _tailwindConfig?: Record<string, unknown>,
  root?: string,
  cssEntryContent?: string,
  minify = false
): Promise<string> => {
  try {
    const { runCssPipeline } = await import("./compiler/tailwindEngine")
    const result = await runCssPipeline(classes, cssEntryContent, root, minify)
    return result.css
  } catch {
    // Fallback if import fails
    const native = getNativeBridge()
    if (!native?.transformSource) {
      throw new Error("FATAL: Native binding 'transformSource' is required but not available.")
    }
    const result = native.transformSource(classes.join(" "), {})
    return result?.code || ""
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEAD STYLE ELIMINATION
// ═══════════════════════════════════════════════════════════════════════════

export const eliminateDeadCss = (css: string, deadClasses: Set<string>): string => {
  const native = getNativeBridge()
  if (!native?.eliminateDeadCss) {
    throw new Error("FATAL: Native binding 'eliminateDeadCss' is required but not available.")
  }
  return native.eliminateDeadCss(css, Array.from(deadClasses)) as string
}

export const findDeadVariants = (
  variantConfig: Record<string, unknown> | Array<{ name: string; variants: Record<string, Record<string, string>>; defaultVariants?: Record<string, string> }>,
  usage: Record<string, Set<string>>
) => {
  const unused: string[] = []

  const configs = Array.isArray(variantConfig)
    ? variantConfig
    : [{ name: "__root__", variants: variantConfig as Record<string, Record<string, string>> }]

  for (const component of configs) {
    const componentUsage = usage[component.name] ?? new Set<string>()
    const variants = component.variants as Record<string, Record<string, string>>
    for (const [key, values] of Object.entries(variants)) {
      for (const [value] of Object.entries(values)) {
        if (!componentUsage.has(`${key}:${value}`)) {
          unused.push(`${component.name !== "__root__" ? `${component.name}/` : ""}${key}:${value}`)
        }
      }
    }
  }

  return { unusedCount: unused.length, unused }
}

export const runElimination = (css: string, scanResult: unknown): string => {
  const native = getNativeBridge()
  if (!native?.detectDeadCode) {
    throw new Error("FATAL: Native binding 'detectDeadCode' is required but not available.")
  }
  const dead = native.detectDeadCode(JSON.stringify(scanResult), css) as { deadInCss: string[] }
  return eliminateDeadCss(css, new Set(dead.deadInCss ?? []))
}

export const scanProjectUsage = (dirs: string[], cwd: string) => {
  // Import locally to avoid circular dependency
  const { batchExtractClasses } = _require('./parser')
  const files = dirs.map(dir => path.resolve(cwd, dir))
  const results = batchExtractClasses(files) || []

  const combined: Record<string, Record<string, Set<string>>> = {}
  for (const result of results) {
    if (result.ok && result.classes) {
      for (const cls of result.classes) {
        if (!combined[cls]) combined[cls] = {}
        combined[cls][result.file] = new Set([cls])
      }
    }
  }
  return combined
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG & UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const generateSafelist = (scanDirs: string[], outputPath?: string, cwd?: string) => {
  const classes = scanProjectUsage(scanDirs, cwd || process.cwd())
  const allClasses = Object.keys(classes).sort()
  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(allClasses, null, 2))
  }
  return allClasses
}

export const loadSafelist = (safelistPath: string): string[] => {
  try {
    const content = fs.readFileSync(safelistPath, "utf-8")
    return JSON.parse(content)
  } catch {
    return []
  }
}

export const loadTailwindConfig = (cwd: string = process.cwd()) => {
  const configFiles = [
    "tailwind.config.ts",
    "tailwind.config.js",
    "tailwind.config.mjs",
    "tailwind.config.cjs",
  ]
  for (const file of configFiles) {
    const fullPath = path.join(cwd, file)
    if (fs.existsSync(fullPath)) {
      const mod = require(fullPath) as { default?: unknown }
      return mod.default || mod
    }
  }
  return {}
}

export const getContentPaths = (cwd: string = process.cwd()) => {
  return {
    content: [
      path.join(cwd, "src/**/*.{js,ts,jsx,tsx}"),
      path.join(cwd, "app/**/*.{js,ts,jsx,tsx}"),
      path.join(cwd, "pages/**/*.{js,ts,jsx,tsx}"),
    ],
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTAINER CSS EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

function _layoutClassesToCss(classes: string): string {
  const native = getNativeBridge()
  if (!native?.layoutClassesToCss) {
    throw new Error("FATAL: Native binding 'layoutClassesToCss' is required but not available.")
  }
  return native.layoutClassesToCss(classes)
}

function _hashContainer(tag: string, containerJson: string, name?: string): string {
  const sortedKey = tag + (name ?? "") + containerJson
  const native = getNativeBridge()
  if (!native?.hashContent) {
    throw new Error("FATAL: Native binding 'hashContent' is required but not available.")
  }
  return `tw-cq-${native.hashContent(sortedKey, "fnv", 6)}`
}

const _CONTAINER_BREAKPOINTS: Record<string, string> = {
  xs: "240px",
  sm: "320px",
  md: "640px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
}

export function extractContainerCssFromSource(source: string): string {
  const native = getNativeBridge()
  if (!native?.extractTwContainerConfigs) {
    throw new Error("FATAL: Native binding 'extractTwContainerConfigs' is required but not available.")
  }

  const configs = native.extractTwContainerConfigs(source) as Array<{
    tag: string
    containerJson: string
    containerName?: string
    breakpoints: Array<{ key: string; classes: string }>
  }>

  const rules: string[] = []
  for (const cfg of configs) {
    const id = _hashContainer(cfg.tag, cfg.containerJson, cfg.containerName)
    for (const { key, classes } of cfg.breakpoints) {
      const minWidth = _CONTAINER_BREAKPOINTS[key] ?? key
      const css = _layoutClassesToCss(classes)
      if (!css) continue
      const query = cfg.containerName
        ? `@container ${cfg.containerName} (min-width: ${minWidth})`
        : `@container (min-width: ${minWidth})`
      rules.push(`${query}{.${id}{${css}}}`)
    }
  }
  return rules.join("\n")
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADER INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export type LoaderOutput = {
  code: string
  changed: boolean
  classes: string[]
  staticCss?: string
  rsc?: { isServer?: boolean; needsClientDirective?: boolean; clientReasons?: string[] }
  engine?: string
}

export const runLoaderTransform = (ctx: { filepath: string; source: string; options?: Record<string, unknown> }) => {
  const { filepath, source, options } = ctx
  const result = transformSource(source, { filename: filepath, ...options })

  let staticCss: string | undefined
  try {
    const cssChunks: string[] = []

    const stateRules = extractAndGenerateStateCss(source, filepath)
    if (stateRules.length > 0) {
      // Filter out unresolved rules: when Rust can't resolve a Tailwind class,
      // `declarations` contains the raw class name (e.g. "w-full") instead of
      // a real CSS declaration (e.g. "width: 100%"). Real declarations always
      // contain ":". Emitting unresolved rules causes Tailwind v4 PostCSS to
      // throw "CssSyntaxError: Invalid declaration: `w-full`".
      // Mirror of the identical guard in staticStateExtractor.ts.
      const resolvedRules = stateRules.filter((r) => {
        const decl = r.declarations.trim()
        return decl.length === 0 || decl.includes(":")
      })
      if (resolvedRules.length > 0) {
        cssChunks.push(resolvedRules.map((r) => r.cssRule).join("\n"))
      }
    }

    const containerCss = extractContainerCssFromSource(source)
    if (containerCss) cssChunks.push(containerCss)

    const combined = cssChunks.join("\n").trim()
    if (combined) staticCss = combined
  } catch (err) {
    // Non-fatal — static CSS extraction failure should not break transform pipeline.
    console.debug("Static CSS extraction warning:", err)
  }

  return {
    code: result?.code || "",
    changed: result?.changed || false,
    classes: result?.classes || [],
    staticCss,
  } as LoaderOutput
}

export const shouldSkipFile = (filepath: string): boolean => {
  const SKIP_PATHS = ["node_modules", ".next", ".rspack-dist", ".turbo", "dist/", "out/"]
  const skipExtensions = [".css", ".json", ".md", ".txt", ".yaml", ".yml"]
  for (const p of SKIP_PATHS) {
    if (filepath.includes(p)) return true
  }
  for (const ext of skipExtensions) {
    if (filepath.endsWith(ext)) return true
  }
  return false
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

export const fileToRoute = (filepath: string): string | null => {
  const normalized = filepath.replace(/\\/g, "/")
  if (normalized.includes("/layout.") || normalized.includes("/loading.") || normalized.includes("/error.")) {
    return "__global"
  }
  const pageMatch = normalized.match(/(?:^|\/)app\/(.+?)\/page\.[tj]sx?$/)
  if (pageMatch) return `/${pageMatch[1]}`
  const rootPage = normalized.match(/(?:^|\/)app\/page\.[tj]sx?$/)
  if (rootPage) return "/"
  return null
}

export const getAllRoutes = (): string[] => {
  const native = getNativeBridge()
  if (!native?.analyzeClasses) {
    throw new Error("FATAL: Native binding 'analyzeClasses' is required but not available.")
  }
  return ["/", "__global"]
}

// ── Route/class registry (FIX) ──────────────────────────────────────────────
// Sebelumnya getRouteClasses/registerFileClasses/registerGlobalClasses adalah
// no-op stubs (params di-prefix underscore, body kosong) — akibatnya
// TwCssInjector SELALU gagal nemu manifest CSS walau "routeCss: true" sudah
// diset di withTailwindStyled(...), karena memang tidak ada satu pun kode
// yang pernah menulis isi map ini. webpackLoader.ts/turbopackLoader.ts sudah
// benar memanggil registerFileClasses(filepath, output.classes) per file,
// tapi panggilan itu jatuh ke lubang hitam.
//
// Map ini di-key per filepath (bukan per route langsung) — sama pola dengan
// _fileStaticCssMap di staticCssWebpackPlugin.ts — supaya file yang
// diedit/dihapus saat HMR gak nyisain stale classes dari versi lama file
// tersebut. getRouteClasses() menghitung ulang dari scratch tiap dipanggil
// dengan mem-bucket lewat fileToRoute(); ini O(files) per call, yang cukup
// murah untuk ukuran project tipikal dan menghindari kelas bug "double
// counting" kalau dihitung incremental.
const _fileClassesMap = new Map<string, Set<string>>()
const _globalClasses = new Set<string>()

export const getRouteClasses = (route: string): Set<string> => {
  const result = new Set<string>()
  for (const [filepath, classes] of _fileClassesMap) {
    const fileRoute = fileToRoute(filepath) ?? "__global"
    if (fileRoute === route) {
      for (const cls of classes) result.add(cls)
    }
  }
  return result
}

/**
 * Semua classes yang ke-register dari semua file + registerGlobalClasses(),
 * tanpa peduli route. TIDAK dipakai untuk manifest per-route (lihat
 * withTailwindStyled.ts — manifest ditulis dari `result.files` hasil
 * scanWorkspace() + buildRouteClassBuckets() di ./routeGraph.ts, karena
 * registry ini baru ke-isi progresif saat bundler benar-benar meng-compile
 * file, sementara manifest ditulis di config-eval time, sebelum itu).
 * getRouteClasses()/fileToRoute() di bawah juga TIDAK dipakai jalur itu —
 * cuma mengenali page.tsx/layout.tsx/loading.tsx/error.tsx secara langsung,
 * gak ngikutin import transitif. Per-route splitting yang sesungguhnya
 * (import-graph tracing: file mana di-import transitif oleh route mana)
 * sudah ada — lihat ./routeGraph.ts (buildRouteClassBuckets), dipanggil
 * dari withTailwindStyled.ts, bukan dari registry/fungsi di bawah ini.
 * Fungsi-fungsi di bawah dipertahankan untuk konsumer lain (CLI `tw split`,
 * dll) yang mungkin masih bergantung pada registry incremental ini.
 */
export const getAllRegisteredClasses = (): Set<string> => {
  const result = new Set<string>(_globalClasses)
  for (const classes of _fileClassesMap.values()) {
    for (const cls of classes) result.add(cls)
  }
  return result
}

/** Dipanggil oleh webpackLoader.ts/turbopackLoader.ts setiap file di-transform. */
export const registerFileClasses = (filepath: string, classes: string[]): void => {
  if (!classes || classes.length === 0) {
    _fileClassesMap.delete(filepath)
    return
  }
  _fileClassesMap.set(filepath, new Set(classes))
}

export const registerGlobalClasses = (classes: string[]): void => {
  for (const cls of classes) _globalClasses.add(cls)
}

/** Reset registry — dipakai test, atau awal compilation run kalau perlu state bersih. */
export const resetRouteClassRegistry = (): void => {
  _fileClassesMap.clear()
  _globalClasses.clear()
}

// ═══════════════════════════════════════════════════════════════════════════
// INCREMENTAL ENGINE
// ═══════════════════════════════════════════════════════════════════════════

let _incrementalEngineInstance: InstanceType<typeof IncrementalEngine> | null = null

export const getIncrementalEngine = () => {
  if (!_incrementalEngineInstance) {
    _incrementalEngineInstance = new IncrementalEngine()
  }
  return _incrementalEngineInstance
}

export const resetIncrementalEngine = (): void => {
  _incrementalEngineInstance = null
}

export class IncrementalEngine {
  compile(source: string) {
    return transformSource(source)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLE BUCKET SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export const getBucketEngine = () => {
  const native = getNativeBridge()
  if (!native?.classifyAndSortClasses) {
    throw new Error("FATAL: Native binding 'classifyAndSortClasses' is required but not available.")
  }
  return {
    add: (className: string) => className,
    get: (_bucket: string): string[] => [],
  }
}

export const resetBucketEngine = (): void => { }

export class BucketEngine {
  add(className: string) { return className }
}

export const classifyNode = (_node: unknown): string => {
  const native = getNativeBridge()
  if (!native?.classifyAndSortClasses) {
    throw new Error("FATAL: Native binding 'classifyAndSortClasses' is required but not available.")
  }
  return "unknown"
}

export const detectConflicts = (_classes: string[]): string[] => {
  const native = getNativeBridge()
  if (!native?.analyzeClassUsage) {
    throw new Error("FATAL: Native binding 'analyzeClassUsage' is required but not available.")
  }
  return []
}

export const bucketSort = (classes: string[]): string[] => {
  const native = getNativeBridge()
  if (!native?.classifyAndSortClasses) {
    throw new Error("FATAL: Native binding 'classifyAndSortClasses' is required but not available.")
  }
  const sorted = native.classifyAndSortClasses(classes)
  return sorted.map((c) => (c as { raw?: string }).raw ?? (c as unknown as string))
}

// ═══════════════════════════════════════════════════════════════════════════
// RSC & FILE ANALYSIS CONTINUED
// ═══════════════════════════════════════════════════════════════════════════

export const analyzeFile = (source: string, filename: string) => {
  const native = getNativeBridge()
  if (!native?.analyzeRsc) {
    throw new Error("FATAL: Native binding 'analyzeRsc' is required but not available.")
  }
  const rsc = native.analyzeRsc(source, filename)
  return {
    isServer: rsc?.isServer ?? true,
    needsClientDirective: rsc?.needsClientDirective ?? false,
    clientReasons: rsc?.clientReasons ?? [],
    interactiveClasses: [],
    canStaticResolveVariants: true,
  }
}

export const analyzeVariantUsage = (_source: string, _componentName: string, _variantKeys: string[]) => {
  return { resolved: {} as Record<string, string>, dynamic: [] as string[] }
}

export const injectClientDirective = (source: string): string => {
  if (!source.includes('"use client"') && !source.includes("'use client'")) {
    return '"use client";\n' + source
  }
  return source
}

export const injectServerOnlyComment = (source: string): string => {
  return `/* @server-only */\n${source}`
}

// ═══════════════════════════════════════════════════════════════════════════
// FULL ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

export const analyzeClasses = (filesJson: string, cwd: string, flags: number) => {
  const native = getNativeBridge()
  if (!native?.analyzeClasses) {
    throw new Error("FATAL: Native binding 'analyzeClasses' is required but not available.")
  }
  return native.analyzeClasses(filesJson, cwd, flags)
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE CSS PRE-GENERATION
// ═══════════════════════════════════════════════════════════════════════════

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

export const extractTwStateConfigs = (source: string, filename: string): TwStateConfigEntry[] => {
  const native = getNativeBridge()
  if (!native?.extractTwStateConfigs) {
    throw new Error("FATAL: Native binding 'extractTwStateConfigs' is required but not available.")
  }
  return native.extractTwStateConfigs(source, filename)
}

export const generateStaticStateCss = (
  entries: TwStateConfigEntry[],
  resolvedCssOrThemeConfig?: string | Record<string, unknown>
): GeneratedStateRule[] => {
  const native = getNativeBridge()
  if (!native?.generateStaticStateCss) {
    throw new Error("FATAL: Native binding 'generateStaticStateCss' is required but not available.")
  }
  // Normalize: resolvedCssOrThemeConfig bisa string (resolvedCss) atau object (legacy themeConfig)
  const resolvedCss = typeof resolvedCssOrThemeConfig === "string" ? resolvedCssOrThemeConfig : null
  const inputs = entries.map((e) => ({
    tag: e.tag,
    componentName: e.componentName,
    statesJson: e.statesJson,
  }))
  return native.generateStaticStateCss(inputs, resolvedCss) as GeneratedStateRule[]
}

export const extractAndGenerateStateCss = (source: string, filename: string): GeneratedStateRule[] => {
  const native = getNativeBridge()
  if (!native?.extractAndGenerateStateCss) {
    // Fallback: extract lalu generate secara terpisah
    const entries = extractTwStateConfigs(source, filename)
    return generateStaticStateCss(entries)
  }
  return native.extractAndGenerateStateCss(source, filename) as GeneratedStateRule[]
}
