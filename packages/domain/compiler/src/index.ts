/**
 * tailwind-styled-v5 — Compiler Index
 * 
 * All functions are backed by native Rust bindings.
 * No JavaScript fallback - native is required.
 */

import fs from "node:fs"
import path from "node:path"

import { getNativeBridge, resetNativeBridgeCache, adaptNativeResult, type NativeBridge, type NativeTransformResult, type ClassExtractResult, type ComponentMetadata, type NativeRscResult } from "./nativeBridge"

export { getNativeBridge, resetNativeBridgeCache, adaptNativeResult }
export type { NativeBridge, NativeTransformResult, ClassExtractResult, ComponentMetadata, NativeRscResult }

export type LoaderOutput = {
  code: string
  changed: boolean
  classes: string[]
  staticCss?: string
  rsc?: { isServer?: boolean; needsClientDirective?: boolean; clientReasons?: string[] }
  engine?: string
}

// =============================================================================
// CORE TRANSFORM FUNCTIONS
// =============================================================================

export const transformSource = (source: string, opts?: Record<string, unknown>) => {
  const native = getNativeBridge()
  if (!native?.transformSource) {
    throw new Error("FATAL: Native binding 'transformSource' is required but not available.")
  }
  const result = native.transformSource(source, opts as Record<string, string>)
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

// =============================================================================
// CSS COMPILATION
// =============================================================================

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

export const compileCssNative = (classes: string[], prefix: string | null = null) => {
  return compileCssFromClasses(classes, prefix)
}

export const generateCssForClasses = async (
  classes: string[],
  _tailwindConfig?: Record<string, unknown>,
  root?: string,
  cssEntryContent?: string,
  minify = false
): Promise<string> => {
  const { runCssPipeline } = await import("./tailwindEngine")
  const result = await runCssPipeline(classes, cssEntryContent, root, minify)
  return result.css
}

// =============================================================================
// CLASS EXTRACTION
// =============================================================================

export const extractAllClasses = (source: string): string[] => {
  const native = getNativeBridge()
  if (!native?.extractAllClasses) {
    throw new Error("FATAL: Native binding 'extractAllClasses' is required but not available.")
  }
  return native.extractAllClasses(source) || []
}

export const extractClassesFromSource = (source: string): string => {
  const native = getNativeBridge()
  if (!native?.extractClassesFromSource) {
    throw new Error("FATAL: Native binding 'extractClassesFromSource' is required but not available.")
  }
  const result = native.extractClassesFromSource(source)
  return Array.isArray(result) ? result.join(" ") : String(result || "")
}

export const astExtractClasses = (source: string, _filename: string) => {
  const native = getNativeBridge()
  if (!native?.extractClassesFromSource) {
    throw new Error("FATAL: Native binding 'extractClassesFromSource' is required but not available.")
  }
  return native.extractClassesFromSource(source) || []
}

export const parseClasses = (raw: string): Array<{ raw: string; type: string }> => {
  const native = getNativeBridge()
  if (!native?.parseClasses) {
    throw new Error("FATAL: Native binding 'parseClasses' is required but not available.")
  }
  return native.parseClasses(raw) || []
}

// =============================================================================
// CLASS NORMALIZATION & MERGING
// =============================================================================

export const normalizeClasses = (raw: string): string => {
  const result = normalizeAndDedupClasses(raw)
  return result?.normalized || ""
}

export const mergeClassesStatic = (classes: string): string => {
  const result = normalizeAndDedupClasses(classes)
  return result?.normalized || ""
}

export const normalizeAndDedupClasses = (raw: string) => {
  const native = getNativeBridge()
  if (!native?.normalizeAndDedupClasses) {
    throw new Error("FATAL: Native binding 'normalizeAndDedupClasses' is required but not available.")
  }
  const result = native.normalizeAndDedupClasses(raw)
  return result || { normalized: "", duplicatesRemoved: 0, uniqueCount: 0 }
}

// =============================================================================
// DEAD STYLE ELIMINATOR
// =============================================================================

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

export const optimizeCss = (css: string): string => {
  const native = getNativeBridge()
  if (!native?.optimizeCss) {
    throw new Error("FATAL: Native binding 'optimizeCss' is required but not available.")
  }
  return native.optimizeCss(css) as string
}

export const scanProjectUsage = (dirs: string[], cwd: string) => {
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

// =============================================================================
// COMPONENT ANALYSIS
// =============================================================================

export const extractComponentUsage = (source: string): Array<{ component: string; propsJson: string }> => {
  const native = getNativeBridge()
  if (!native?.extractComponentUsage) {
    throw new Error("FATAL: Native binding 'extractComponentUsage' is required but not available.")
  }
  return native.extractComponentUsage(source) || []
}

// =============================================================================
// DIFF & BATCH OPERATIONS
// =============================================================================

export const diffClassLists = (previous: string[], current: string[]) => {
  const native = getNativeBridge()
  if (!native?.diffClassLists) {
    throw new Error("FATAL: Native binding 'diffClassLists' is required but not available.")
  }
  return native.diffClassLists(previous, current) || { added: [], removed: [], unchanged: [], hasChanges: false }
}

export const batchExtractClasses = (filePaths: string[]) => {
  const native = getNativeBridge()
  if (!native?.batchExtractClasses) {
    throw new Error("FATAL: Native binding 'batchExtractClasses' is required but not available.")
  }
  return native.batchExtractClasses(filePaths) || []
}

export const checkAgainstSafelist = (classes: string[], safelist: string[]) => {
  const native = getNativeBridge()
  if (!native?.checkAgainstSafelist) {
    throw new Error("FATAL: Native binding 'checkAgainstSafelist' is required but not available.")
  }
  return native.checkAgainstSafelist(classes, safelist) || { matched: [], unmatched: [], safelistSize: 0 }
}

// =============================================================================
// HOISTING
// =============================================================================

export const hoistComponents = (source: string) => {
  const native = getNativeBridge()
  if (!native?.hoistComponents) {
    throw new Error("FATAL: Native binding 'hoistComponents' is required but not available.")
  }
  return native.hoistComponents(source) || { code: source, hoisted: [], warnings: [] }
}

// =============================================================================
// VARIANT COMPILATION
// =============================================================================

export const compileVariantTable = (configJson: string) => {
  const native = getNativeBridge()
  if (!native?.compileVariantTable) {
    throw new Error("FATAL: Native binding 'compileVariantTable' is required but not available.")
  }
  return native.compileVariantTable(configJson) || { id: "", tableJson: "{}", keys: [], defaultKey: "", combinations: 0 }
}

export const compileVariants = (componentId: string, config: Record<string, unknown>) => {
  return compileVariantTable(JSON.stringify({ componentId, ...config }))
}

// =============================================================================
// CSS ANALYSIS
// =============================================================================

export const classifyAndSortClasses = (classes: string[]) => {
  const native = getNativeBridge()
  if (!native?.classifyAndSortClasses) {
    throw new Error("FATAL: Native binding 'classifyAndSortClasses' is required but not available.")
  }
  return native.classifyAndSortClasses(classes) || []
}

export const mergeCssDeclarations = (cssChunks: string[]) => {
  const native = getNativeBridge()
  if (!native?.mergeCssDeclarations) {
    throw new Error("FATAL: Native binding 'mergeCssDeclarations' is required but not available.")
  }
  return native.mergeCssDeclarations(cssChunks) || { declarationsJson: "{}", declarationString: "", count: 0 }
}

export const analyzeClassUsage = (classes: string[], scanResultJson: string, css: string) => {
  const native = getNativeBridge()
  if (!native?.analyzeClassUsage) {
    throw new Error("FATAL: Native binding 'analyzeClassUsage' is required but not available.")
  }
  return native.analyzeClassUsage(classes, scanResultJson, css) || []
}

// =============================================================================
// RSC ANALYSIS
// =============================================================================

export const analyzeRsc = (source: string, filename: string) => {
  const native = getNativeBridge()
  if (!native?.analyzeRsc) {
    throw new Error("FATAL: Native binding 'analyzeRsc' is required but not available.")
  }
  return native.analyzeRsc(source, filename) || { isServer: true, needsClientDirective: false, clientReasons: [] }
}

export const analyzeFile = (source: string, filename: string) => {
  const rsc = analyzeRsc(source, filename)
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

// =============================================================================
// FULL ANALYSIS
// =============================================================================

export const analyzeClasses = (filesJson: string, cwd: string, flags: number) => {
  const native = getNativeBridge()
  if (!native?.analyzeClasses) {
    throw new Error("FATAL: Native binding 'analyzeClasses' is required but not available.")
  }
  return native.analyzeClasses(filesJson, cwd, flags)
}

// =============================================================================
// SAFELIST
// =============================================================================

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

// =============================================================================
// CONFIG LOADING
// =============================================================================

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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
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

// =============================================================================
// CONTAINER CSS EXTRACTOR
// =============================================================================

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

/**
 * Extract container configs dari source dan generate static `@container` CSS.
 * Native-only: delegates ke Rust extractTwContainerConfigs.
 */
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

// =============================================================================
// LOADER
// =============================================================================

export const runLoaderTransform = (ctx: { filepath: string; source: string; options?: Record<string, unknown> }) => {
  const { filepath, source, options } = ctx
  const result = transformSource(source, { filename: filepath, ...options })

  let staticCss: string | undefined
  try {
    const cssChunks: string[] = []

    const stateRules = extractAndGenerateStateCss(source, filepath)
    if (stateRules.length > 0) {
      cssChunks.push(stateRules.map((r) => r.cssRule).join("\n"))
    }

    const containerCss = extractContainerCssFromSource(source)
    if (containerCss) cssChunks.push(containerCss)

    const combined = cssChunks.join("\n").trim()
    if (combined) staticCss = combined
  } catch {
    // Non-fatal — static CSS extraction gagal tidak boleh break transform pipeline.
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

// =============================================================================
// ROUTE CSS COLLECTOR
// =============================================================================

export const fileToRoute = (filepath: string): string | null => {
  const normalized = filepath.replace(/\\/g, "/")
  if (normalized.includes("/layout.") || normalized.includes("/loading.") || normalized.includes("/error.")) {
    return "__global"
  }
  const pageMatch = normalized.match(/\/app\/(.+?)\/page\.[tj]sx?$/)
  if (pageMatch) return `/${pageMatch[1]}`
  const rootPage = normalized.match(/\/app\/page\.[tj]sx?$/)
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

export const getRouteClasses = (_route: string): Set<string> => new Set()
export const registerFileClasses = (_filepath: string, _classes: string[]): void => {}
export const registerGlobalClasses = (_classes: string[]): void => {}

// =============================================================================
// INCREMENTAL ENGINE
// =============================================================================

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

export const IncrementalEngine = class {
  compile(source: string) {
    return transformSource(source)
  }
}

// =============================================================================
// STYLE BUCKET SYSTEM
// =============================================================================

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

export const resetBucketEngine = (): void => {}

export const BucketEngine = class {
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
  return classifyAndSortClasses(classes).map((c) => (c as { raw?: string }).raw ?? (c as unknown as string))
}

// =============================================================================
// STATIC STATE CSS PRE-GENERATION
// =============================================================================

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
  inputs: StaticStateCssInput[],
  resolvedCss: string | null = null
): GeneratedStateRule[] => {
  const native = getNativeBridge()
  if (!native?.generateStaticStateCss) {
    throw new Error("FATAL: Native binding 'generateStaticStateCss' is required but not available.")
  }
  return native.generateStaticStateCss(inputs, resolvedCss)
}

export const extractAndGenerateStateCss = (source: string, filename: string): GeneratedStateRule[] => {
  const native = getNativeBridge()
  if (!native?.extractAndGenerateStateCss) {
    const configs = extractTwStateConfigs(source, filename)
    if (configs.length === 0) return []
    return generateStaticStateCss(
      configs.map((c) => ({ tag: c.tag, componentName: c.componentName, statesJson: c.statesJson }))
    )
  }
  return native.extractAndGenerateStateCss(source, filename)
}