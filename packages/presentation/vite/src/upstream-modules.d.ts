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

declare module "@tailwind-styled/engine" {
  export function createEngine(options?: Record<string, unknown>): Promise<{
    scanWorkspace(): Promise<{
      files: Array<{ file: string; classes: string[] }>
      totalFiles: number
      uniqueClasses: string[]
    }>
    build(): Promise<unknown>
  }>
}