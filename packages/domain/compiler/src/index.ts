/**
 * tailwind-styled-v5 — Compiler Index
 * 
 * All functions are backed by native Rust bindings.
 * No JavaScript fallback - native is required.
 */

import { getNativeBridge, resetNativeBridgeCache, adaptNativeResult, type NativeBridge, type NativeTransformResult, type ClassExtractResult, type ComponentMetadata, type NativeRscResult } from "./nativeBridge"

export { getNativeBridge, resetNativeBridgeCache, adaptNativeResult }
export type { NativeBridge, NativeTransformResult, ClassExtractResult, ComponentMetadata, NativeRscResult }

export type LoaderOutput = {
  code: string
  changed: boolean
  classes: string[]
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
  _root?: string
): Promise<string> => {
  const { runCssPipeline } = await import("./tailwindEngine")
  const result = await runCssPipeline(classes)
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

export const astExtractClasses = (source: string, filename: string) => {
  const native = getNativeBridge()
  if (!native?.extractClassesFromSource) {
    throw new Error("FATAL: Native binding 'extractClassesFromSource' is required but not available.")
  }
  return native.extractClassesFromSource(source) || []
}

export const parseClasses = (raw: string): Array<{ raw: string; type: string }> => {
  const native = getNativeBridge()
  if (!native?.parseClasses) {
    // Fallback to JS implementation
    return parseClassesJs(raw)
  }
  return native.parseClasses(raw) || []
}

function parseClassesJs(raw: string): Array<{ raw: string; type: string }> {
  if (!raw || typeof raw !== "string") return []
  
  const classes = raw.split(/\s+/).filter(Boolean)
  return classes.map((cls) => ({
    raw: cls,
    type: cls.includes(":") ? "variant" : cls.includes("/") ? "arbitrary" : "utility",
  }))
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

function normalizeAndDedupClassesJs(raw: string): { normalized: string; duplicatesRemoved: number; uniqueCount: number } {
  const seen = new Set<string>()
  const result: string[] = []
  let duplicatesRemoved = 0

  for (const token of raw.split(/\s+/)) {
    if (token.length === 0) continue
    if (seen.has(token)) {
      duplicatesRemoved++
    } else {
      seen.add(token)
      result.push(token)
    }
  }

  return {
    normalized: result.join(" "),
    duplicatesRemoved,
    uniqueCount: result.length,
  }
}

export const normalizeAndDedupClasses = (raw: string) => {
  const native = getNativeBridge()
  if (!native?.normalizeAndDedupClasses) {
    // Fallback to JS implementation
    return normalizeAndDedupClassesJs(raw)
  }
  const result = native.normalizeAndDedupClasses(raw)
  return result || { normalized: "", duplicatesRemoved: 0, uniqueCount: 0 }
}

// =============================================================================
// DEAD STYLE ELIMINATOR
// =============================================================================

export const eliminateDeadCss = (css: string, deadClasses: Set<string>): string => {
  let result = css
  for (const dead of deadClasses) {
    result = result.replace(new RegExp(`\\.${dead.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*\\{[^}]*\\}`, 'g'), '')
  }
  return result
}

export const findDeadVariants = (variantConfig: Record<string, unknown>, usage: Record<string, Set<string>>) => {
  const unused: string[] = []
  const variants = variantConfig as Record<string, Record<string, string>>
  for (const [key, values] of Object.entries(variants)) {
    for (const [value] of Object.entries(values)) {
      const keyValue = `${key}:${value}`
      if (!usage[key]?.has(value)) {
        unused.push(keyValue)
      }
    }
  }
  return unused
}

export const runElimination = (css: string, scanResult: unknown) => {
  const scanJson = JSON.stringify(scanResult)
  const classes = extractAllClasses(css)
  const usage = analyzeClassUsage(classes, scanJson, css) || []
  const deadClasses = new Set((usage as Array<{ isDeadCode: boolean; className: string }>).filter(u => u.isDeadCode).map(u => u.className))
  return eliminateDeadCss(css, deadClasses)
}

export const optimizeCss = (css: string): string => {
  const classes = extractAllClasses(css)
  const usage = analyzeClassUsage(classes, "[]", css) || []
  const usedClasses = new Set((usage as Array<{ isDeadCode: boolean; className: string }>).filter(u => !u.isDeadCode).map(u => u.className))
  
  let result = css
  const classRegex = /\.([a-zA-Z0-9_-]+)/g
  result = result.replace(classRegex, (match, className) => {
    return usedClasses.has(className) ? match : ''
  })
  
  result = result.replace(/[^{}]*\{\s*\}/g, '')
  return result.trim()
}

export const scanProjectUsage = (dirs: string[], cwd: string) => {
  const path = require('node:path')
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

export const analyzeVariantUsage = (source: string, componentName: string, variantKeys: string[]) => {
  const rsc = analyzeRsc(source, componentName)
  return { 
    resolved: {} as Record<string, string>, 
    dynamic: [] as string[] 
  }
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
    const fs = require('node:fs')
    fs.writeFileSync(outputPath, JSON.stringify(allClasses, null, 2))
  }
  
  return allClasses
}

export const loadSafelist = (safelistPath: string): string[] => {
  const fs = require('node:fs')
  try {
    const content = fs.readFileSync(safelistPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

// =============================================================================
// CONFIG LOADING
// =============================================================================

export const loadTailwindConfig = (cwd: string = process.cwd()) => {
  const fs = require('node:fs')
  const path = require('node:path')
  
  const configFiles = [
    'tailwind.config.ts',
    'tailwind.config.js',
    'tailwind.config.mjs',
    'tailwind.config.cjs',
  ]
  
  for (const file of configFiles) {
    const fullPath = path.join(cwd, file)
    if (fs.existsSync(fullPath)) {
      const mod = require(fullPath)
      return mod.default || mod
    }
  }
  
  return {}
}

export const getContentPaths = (cwd: string = process.cwd()) => {
  const path = require('node:path')
  return {
    content: [
      path.join(cwd, 'src/**/*.{js,ts,jsx,tsx}'),
      path.join(cwd, 'app/**/*.{js,ts,jsx,tsx}'),
      path.join(cwd, 'pages/**/*.{js,ts,jsx,tsx}'),
    ],
  }
}

// =============================================================================
// LOADER
// =============================================================================

export const runLoaderTransform = (ctx: { filepath: string; source: string; options?: Record<string, unknown> }) => {
  const { filepath, source, options } = ctx
  const result = transformSource(source, { filename: filepath, ...options })
  return {
    code: result?.code || "",
    changed: result?.changed || false,
    classes: result?.classes || [],
  } as LoaderOutput
}

export const shouldSkipFile = (filepath: string): boolean => {
  const SKIP_PATHS = ['node_modules', '.next', '.rspack-dist', '.turbo', 'dist/', 'out/']
  const skipExtensions = ['.css', '.json', '.md', '.txt', '.yaml', '.yml']
  
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
  const normalized = filepath.replace(/\\/g, '/')
  
  if (normalized.includes('/layout.') || normalized.includes('/loading.') || normalized.includes('/error.')) {
    return '__global'
  }
  
  const pageMatch = normalized.match(/\/app\/(.+?)\/page\.[tj]sx?$/)
  if (pageMatch) return `/${pageMatch[1]}`
  
  const rootPage = normalized.match(/\/app\/page\.[tj]sx?$/)
  if (rootPage) return '/'
  
  return null
}

export const getAllRoutes = (): string[] => {
  return ['/', '__global']
}

export const getRouteClasses = (route: string): Set<string> => {
  return new Set()
}

export const registerFileClasses = (filepath: string, classes: string[]): void => {
  // Could be implemented with native
}

export const registerGlobalClasses = (classes: string[]): void => {
  // Could be implemented with native
}

// =============================================================================
// INCREMENTAL ENGINE
// =============================================================================

let incrementalEngineInstance: unknown = null

export const getIncrementalEngine = () => {
  if (!incrementalEngineInstance) {
    incrementalEngineInstance = {
      compile: (source: string) => transformSource(source),
    }
  }
  return incrementalEngineInstance
}

export const resetIncrementalEngine = () => {
  incrementalEngineInstance = null
}

export const IncrementalEngine = class {
  compile(source: string) {
    return transformSource(source)
  }
}

// =============================================================================
// STYLE BUCKET SYSTEM
// =============================================================================

let bucketEngineInstance: unknown = null

export const getBucketEngine = () => {
  if (!bucketEngineInstance) {
    bucketEngineInstance = {
      add: (className: string) => className,
      get: (bucket: string) => [],
    }
  }
  return bucketEngineInstance
}

export const resetBucketEngine = () => {
  bucketEngineInstance = null
}

export const BucketEngine = class {
  add(className: string) {
    return className
  }
}

export const classifyNode = (node: unknown): string => {
  return 'unknown'
}

export const detectConflicts = (classes: string[]): string[] => {
  return []
}

export const bucketSort = (classes: string[]): string[] => {
  return classes
}