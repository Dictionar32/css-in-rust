declare module "@tailwind-styled/compiler/internal" {
  // Re-exports identik dengan "@tailwind-styled/compiler" — subpath ini
  // expose internal API yang sama via internal.ts barrel.
  // Declaration ini diperlukan karena dist/internal.d.ts hanya tersedia
  // setelah package di-build; di monorepo dev (source references), TypeScript
  // resolve subpath exports tapi tidak menemukan .d.ts → error TS7016.
  export function runLoaderTransform(ctx: {
    filepath: string
    source: string
    options?: Record<string, unknown>
    isDev?: boolean
  }): { code: string; changed: boolean; classes: string[] }

  export function shouldSkipFile(filepath: string): boolean

  export function registerFileClasses(filepath: string, classes: string[]): void
  export function registerGlobalClasses(classes: string[]): void

  export function generateCssForClasses(
    classes: string[],
    config?: Record<string, unknown>,
    root?: string,
    cssEntryContent?: string,
    minify?: boolean
  ): Promise<string>

  export function transformSource(
    source: string,
    opts?: Record<string, unknown>
  ): { code: string; changed: boolean; classes: string[] }

  export function hasTwUsage(source: string): boolean
  export function isAlreadyTransformed(source: string): boolean
  export function extractAllClasses(source: string): string[]
  export function extractClassesFromSource(source: string): string[]
  export function hoistComponents(source: string): { code: string; hoisted: string[]; warnings: string[] }
  export function normalizeAndDedupClasses(raw: string): { normalized: string; duplicatesRemoved: number; uniqueCount: number }

  // ── Fungsi yang dipakai di engine/src/index.ts ──────────────────────────────

  /**
   * Normalize, deduplicate, dan merge class string.
   * Menggantikan normalizeAndDedupClasses() wrapper — mengembalikan hanya string.
   * Dipakai di engine/src/index.ts line 189.
   */
  export function mergeClassesStatic(classes: string): string

  /**
   * Compile classes ke CSS via native transformSource.
   * Dipakai di CLI trace, why, dan devtools.
   */
  export function compileCssFromClasses(
    classes: string[],
    prefix?: string | null
  ): NativeTransformResult

  // ── Fungsi yang dipakai di CLI (compileVariants, traceService, whyService) ──

  /**
   * Get the native Rust bridge singleton.
   * Dipakai di CLI compileVariants.ts.
   */
  export function getNativeBridge(): NativeBridge

  // ── Fungsi yang dipakai di webpackLoader.ts + rspack loader ─────────────────

  /**
   * Check apakah file harus di-skip dari transformasi.
   * Dipakai di webpackLoader.ts dan rspack/loader.ts.
   */
  export function shouldSkipFile(filepath: string): boolean

  /**
   * Register classes dari satu file ke scan cache.
   * Dipakai di webpackLoader.ts.
   */
  export function registerFileClasses(filepath: string, classes: string[]): void

  /**
   * Register global classes (tidak terikat ke satu file).
   */
  export function registerGlobalClasses(classes: string[]): void

  export interface LoaderOutput {
    code: string
    changed: boolean
    classes: string[]
    rsc?: { isServer: boolean; needsClientDirective: boolean }
    engine?: string
  }

  export interface NativeBridge {
    [key: string]: unknown
  }

  export interface NativeTransformResult {
    code: string
    changed: boolean
    classes: string[]
  }

  export interface ComponentMetadata {
    name: string
    filepath: string
    classes: string[]
  }

  export interface NativeRscResult {
    isServer: boolean
    needsClientDirective: boolean
    clientReasons: string[]
  }
}

declare module "@tailwind-styled/compiler" {
  import type { NativeResolutionResult } from "@tailwind-styled/shared"

  export interface NativeBridge {
    transformSource?: (source: string, opts?: Record<string, string>) => {
      code: string; classes: string[]; changed: boolean; rscJson?: string; metadataJson?: string
    } | null
    extractAllClasses?: (source: string) => string[]
    hasTwUsage?: (source: string) => boolean
    isAlreadyTransformed?: (source: string) => boolean
    extractClassesFromSource?: (source: string) => string[]
    parseClasses?: (raw: string) => Array<{ raw: string; type: string }>
    normalizeAndDedupClasses?: (raw: string) => { normalized: string; duplicatesRemoved: number; uniqueCount: number }
    classifyAndSortClasses?: (classes: string[]) => unknown[]
    analyzeClassUsage?: (classes: string[], scanResultJson: string, css: string) => unknown[]
    detectDeadCode?: (scanResultJson: string, css: string) => { deadInCss: string[]; deadInSource: string[]; liveClasses: string[] }
    processTailwindCssLightning?: (css: string) => { css: string }
    analyzeRsc?: (source: string, filename: string) => { isServer: boolean; needsClientDirective: boolean; clientReasons: string[] }
    batchExtractClasses?: (filePaths: string[]) => unknown[]
    diffClassLists?: (previous: string[], current: string[]) => { added: string[]; removed: string[]; unchanged: string[]; hasChanges: boolean }
    hoistComponents?: (source: string) => { code: string; hoisted: string[]; warnings: string[] }
    compileVariantTable?: (configJson: string) => { id: string; tableJson: string; keys: string[]; defaultKey: string; combinations: number }
    mergeCssDeclarations?: (cssChunks: string[]) => { declarationsJson: string; declarationString: string; count: number }
    checkAgainstSafelist?: (classes: string[], safelist: string[]) => { matched: string[]; unmatched: string[]; safelistSize: number }
    extractComponentUsage?: (source: string) => Array<{ component: string; propsJson: string }>
    parseAtomicClass?: (twClass: string) => string | null
    generateAtomicCss?: (rulesJson: string) => string
    toAtomicClasses?: (twClasses: string) => string
    clearAtomicRegistry?: () => void
    atomicRegistrySize?: () => number
    analyzeClasses?: (filesJson: string, cwd: string, flags: number) => unknown
    [key: string]: unknown
  }

  export function getNativeBridge(): NativeBridge
  export function resetNativeBridgeCache(): void
  export function adaptNativeResult(result: unknown): unknown
  export function shouldSkipFile(filepath: string): boolean
  export function runLoaderTransform(ctx: {
    filepath: string
    source: string
    options?: Record<string, unknown>
    isDev?: boolean
  }): { code: string; changed: boolean; classes: string[] }
  export function transformSource(source: string, opts?: Record<string, unknown>): { code: string; changed: boolean; classes: string[] }
  export function hasTwUsage(source: string): boolean
  export function isAlreadyTransformed(source: string): boolean
  export function extractAllClasses(source: string): string[]
  export function compileCssFromClasses(classes: string[], prefix?: string | null): unknown
  export function normalizeAndDedupClasses(raw: string): { normalized: string; duplicatesRemoved: number; uniqueCount: number }
  export function classifyAndSortClasses(classes: string[]): unknown[]
  export function analyzeClassUsage(classes: string[], scanResultJson: string, css: string): unknown[]
  export function batchExtractClasses(filePaths: string[]): unknown[]
  export function extractComponentUsage(source: string): Array<{ component: string; propsJson: string }>
  export function hoistComponents(source: string): { code: string; hoisted: string[]; warnings: string[] }
}