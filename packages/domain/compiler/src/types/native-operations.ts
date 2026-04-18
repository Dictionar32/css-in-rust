/**
 * tailwind-styled-v5 — Type-safe Native Operation Interfaces
 * 
 * Typed interfaces untuk semua operasi native bridge.
 * Ini menggantikan Record<string, string> yang terlalu generic.
 */

import { z } from "zod"

// =============================================================================
// TRANSFORM OPERATIONS
// =============================================================================

export interface TransformOptions {
  readonly filename?: string
  readonly projectRoot?: string
  readonly isServerComponent?: boolean
  readonly sourceMap?: boolean
}

export const TransformOptionsSchema = z.object({
  filename: z.string().optional(),
  projectRoot: z.string().optional(),
  isServerComponent: z.boolean().optional(),
  sourceMap: z.boolean().optional(),
})

export interface TransformResult {
  readonly code: string
  readonly classes: readonly string[]
  readonly changed: boolean
  readonly rscJson?: string
  readonly metadataJson?: string
}

// =============================================================================
// CLASS EXTRACTION OPERATIONS
// =============================================================================

export interface ExtractClassesOptions {
  readonly filename?: string
  readonly projectRoot?: string
  readonly extractPatterns?: readonly string[]
}

export const ExtractClassesOptionsSchema = z.object({
  filename: z.string().optional(),
  projectRoot: z.string().optional(),
  extractPatterns: z.array(z.string()).optional(),
})

export interface ParsedClass {
  readonly raw: string
  readonly type: string
}

// =============================================================================
// CSS COMPILATION OPERATIONS
// =============================================================================

export interface CompileCssOptions {
  readonly prefix?: string | null
  readonly minify?: boolean
  readonly optimize?: boolean
}

export const CompileCssOptionsSchema = z.object({
  prefix: z.union([z.string(), z.null()]).optional(),
  minify: z.boolean().optional(),
  optimize: z.boolean().optional(),
})

export interface CssCompileResult {
  readonly css: string
  readonly resolvedClasses: readonly string[]
  readonly unknownClasses: readonly string[]
  readonly sizeBytes: number
}

// =============================================================================
// NORMALIZATION OPERATIONS
// =============================================================================

export interface NormalizeResult {
  readonly normalized: string
  readonly duplicatesRemoved: number
  readonly uniqueCount: number
}

// =============================================================================
// DIFF OPERATIONS
// =============================================================================

export interface DiffResult {
  readonly added: readonly string[]
  readonly removed: readonly string[]
  readonly unchanged: readonly string[]
  readonly hasChanges: boolean
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

export interface BatchExtractResult {
  readonly file: string
  readonly classes: readonly string[]
  readonly contentHash: string
  readonly ok: boolean
  readonly error?: string
}

export interface SafelistResult {
  readonly matched: readonly string[]
  readonly unmatched: readonly string[]
  readonly safelistSize: number
}

// =============================================================================
// COMPONENT ANALYSIS
// =============================================================================

export interface ComponentUsage {
  readonly component: string
  readonly propsJson: string
}

// =============================================================================
// RSC ANALYSIS
// =============================================================================

export interface RscAnalysisResult {
  readonly isServer: boolean
  readonly needsClientDirective: boolean
  readonly clientReasons: readonly string[]
}

// =============================================================================
// CLASS ANALYSIS
// =============================================================================

export interface ClassUsageResult {
  readonly className: string
  readonly usageCount: number
  readonly filesJson: string
  readonly bundleSizeBytes: number
  readonly isDeadCode: boolean
}

// =============================================================================
// VARIANT COMPILATION
// =============================================================================

export interface VariantTableResult {
  readonly id: string
  readonly tableJson: string
  readonly keys: readonly string[]
  readonly defaultKey: string
  readonly combinations: number
}

// =============================================================================
// CLASSIFY & SORT
// =============================================================================

export interface ClassifyResult {
  readonly className: string
  readonly bucket: string
  readonly sortOrder: number
}

// =============================================================================
// MERGE CSS DECLARATIONS
// =============================================================================

export interface MergeDeclarationsResult {
  readonly declarationsJson: string
  readonly declarationString: string
  readonly count: number
}

// =============================================================================
// HOIST COMPONENTS
// =============================================================================

export interface HoistResult {
  readonly code: string
  readonly hoisted: readonly string[]
  readonly warnings: readonly string[]
}

// =============================================================================
// ANALYZE CLASSES (Full Analysis)
// =============================================================================

export interface FullAnalyzeResult {
  readonly css?: string
  readonly code: string
  readonly classes: readonly string[]
  readonly changed: boolean
  readonly rscJson?: string
  readonly metadataJson?: string
  readonly safelist?: readonly string[]
}

// =============================================================================
// HEALTH CHECK (Area 2 - included here for type organization)
// =============================================================================

export interface HealthStatus {
  readonly status: "healthy" | "degraded" | "unhealthy"
  readonly version: string
  readonly uptime: number
  readonly memoryUsage: {
    readonly rust: number
    readonly js: number
  }
  readonly cacheStats: {
    readonly hitRate: number
    readonly size: number
    readonly maxSize: number
  }
  readonly lastError?: {
    readonly timestamp: number
    readonly message: string
    readonly stack?: string
  }
}

// =============================================================================
// TYPE-SAFE NATIVE BRIDGE
// =============================================================================

export interface TypedNativeBridge {
  // Transform
  transformSource(source: string, opts?: TransformOptions): TransformResult | null
  
  // Class Extraction
  extractClassesFromSource(source: string): readonly string[]
  extractAllClasses(source: string): readonly string[]
  parseClasses(raw: string): readonly ParsedClass[]
  
  // Check
  hasTwUsage(source: string): boolean
  isAlreadyTransformed(source: string): boolean
  
  // Component
  extractComponentUsage(source: string): readonly ComponentUsage[]
  
  // Normalization
  normalizeAndDedupClasses(raw: string): NormalizeResult
  
  // Diff
  diffClassLists(previous: readonly string[], current: readonly string[]): DiffResult
  
  // Batch
  batchExtractClasses(filePaths: readonly string[]): readonly BatchExtractResult[]
  checkAgainstSafelist(classes: readonly string[], safelist: readonly string[]): SafelistResult
  
  // Hoisting
  hoistComponents(source: string): HoistResult
  
  // Variant
  compileVariantTable(configJson: string): VariantTableResult
  
  // CSS Analysis
  classifyAndSortClasses(classes: readonly string[]): readonly ClassifyResult[]
  mergeCssDeclarations(cssChunks: readonly string[]): MergeDeclarationsResult
  analyzeClassUsage(classes: readonly string[], scanResultJson: string, css: string): readonly ClassUsageResult[]
  
  // RSC
  analyzeRsc(source: string, filename: string): RscAnalysisResult
  
  // Full
  analyzeClasses(filesJson: string, cwd: string, flags: number): FullAnalyzeResult | null
  
  // CSS Compile
  compileCss(classes: readonly string[], prefix?: string | null): CssCompileResult
  compileCssLightning(classes: readonly string[]): CssCompileResult
  
  // Health (Area 2)
  healthCheck?(): HealthStatus
}