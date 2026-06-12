/**
 * CSS Optimization & Dead Code Elimination Type Definitions
 * 
 * Comprehensive type definitions for dead code detection, CSS elimination,
 * minification, atomic CSS generation, and optimization analysis.
 * 
 * Requirements 6 & 7: CSS Optimization & Atomic CSS Generation
 * 12 + 6 = 18 Rust functions exposed via NativeBridge
 */

// =============================================================================
// DEAD CODE DETECTION
// =============================================================================

export interface DeadCodeAnalysis {
  readonly dead_in_css: string[]
  readonly dead_in_source: string[]
  readonly live_classes: string[]
  readonly total_css_classes: number
  readonly total_source_classes: number
  readonly dead_code_percentage: number
  readonly analysis_time_ms: number
}

export interface DeadClassMetadata {
  readonly class_name: string
  readonly where_defined: string[]  // Selectors containing this class
  readonly css_size_bytes: number
  readonly frequency: number        // How many times in CSS
}

export interface DeadCodeReport {
  readonly success: boolean
  readonly dead_classes: DeadClassMetadata[]
  readonly total_dead_css_bytes: number
  readonly percent_of_total: number
  readonly confidence_percent: number
  readonly false_positive_warning?: string
}

// =============================================================================
// CSS ELIMINATION
// =============================================================================

export interface EliminationResult {
  readonly success: boolean
  readonly original_css: string
  readonly eliminated_css: string
  readonly eliminated_classes: number
  readonly original_size_bytes: number
  readonly final_size_bytes: number
  readonly reduction_percent: number
  readonly elimination_time_ms: number
}

export interface EliminationStats {
  readonly classes_removed: number
  readonly rules_removed: number
  readonly selectors_simplified: number
  readonly media_queries_removed: number
  readonly keyframes_removed: number
}

// =============================================================================
// CSS MINIFICATION & OPTIMIZATION
// =============================================================================

export interface MinificationResult {
  readonly success: boolean
  readonly original_css: string
  readonly minified_css: string
  readonly original_size_bytes: number
  readonly minified_size_bytes: number
  readonly savings_percent: number
  readonly minification_time_ms: number
  readonly method: 'lightning_css' | 'csso' | 'other'
}

export interface OptimizationResult {
  readonly success: boolean
  readonly original_size_bytes: number
  readonly optimized_size_bytes: number
  readonly reduction_percent: number
  readonly dead_classes_removed: number
  readonly rules_removed: number
  readonly minification_savings_percent: number
  readonly optimization_methods: string[]
  readonly total_time_ms: number
}

export interface FullOptimizationPipeline {
  readonly dead_code_analysis: DeadCodeAnalysis
  readonly elimination: EliminationStats
  readonly minification: MinificationResult
  readonly final_optimization: OptimizationResult
  readonly stages_completed: number
  readonly total_pipeline_time_ms: number
}

// =============================================================================
// LIGHTNING CSS INTEGRATION
// =============================================================================

export interface LightningCssConfig {
  readonly targets?: string          // Browser targets (e.g., "last 2 versions")
  readonly minify?: boolean
  readonly sourceMap?: boolean
  readonly drafts?: {
    readonly nesting?: boolean
    readonly customMedia?: boolean
    readonly mediaQueries?: boolean
  }
}

export interface ProcessedCssResult {
  readonly css: string
  readonly size_bytes: number
  readonly resolved_classes: string[]
  readonly unknown_classes: string[]
  readonly warnings: string[]
  readonly source_map?: string
}

export interface CssValidationResult {
  readonly valid: boolean
  readonly errors: string[]
  readonly warnings: string[]
  readonly vendorPrefixesNeeded: string[]
}

// =============================================================================
// ATOMIC CSS GENERATION
// =============================================================================

export interface AtomicClass {
  readonly class_name: string
  readonly property: string
  readonly value: string
  readonly selector: string
  readonly css_rule: string
}

export interface AtomicConversionResult {
  readonly success: boolean
  readonly atomic_classes: AtomicClass[]
  readonly original_class: string
  readonly atomic_class_count: number
  readonly conversion_time_ms: number
}

export interface AtomicBatchConversionResult {
  readonly success: boolean
  readonly conversions: AtomicConversionResult[]
  readonly total_classes_input: number
  readonly total_atomic_classes: number
  readonly deduplication_percent: number
  readonly total_conversion_time_ms: number
}

export interface AtomicRegistryStats {
  readonly registered_classes: number
  readonly unique_properties: number
  readonly unique_values: number
  readonly total_size_bytes: number
  readonly memory_kb: number
  readonly hit_rate_percent: number
}

// =============================================================================
// PROPERTY DEDUPLICATION
// =============================================================================

export interface PropertyDuplicateAnalysis {
  readonly duplicated_properties: Map<string, string[]>  // property -> selectors
  readonly total_duplicates: number
  readonly consolidation_potential: number
  readonly analysis_time_ms: number
}

export interface DeduplicationResult {
  readonly success: boolean
  readonly original_css: string
  readonly deduplicated_css: string
  readonly properties_consolidated: number
  readonly original_size_bytes: number
  readonly deduplicated_size_bytes: number
  readonly savings_percent: number
}

// =============================================================================
// CSS VALIDATION & CORRECTNESS
// =============================================================================

export interface CssValidation {
  readonly is_valid: boolean
  readonly syntax_errors: Array<{
    readonly line: number
    readonly column: number
    readonly message: string
  }>
  readonly semantic_issues: string[]
  readonly performance_issues: string[]
  readonly accessibility_issues: string[]
}

export interface CssCorrectness {
  readonly all_selectors_valid: boolean
  readonly all_properties_valid: boolean
  readonly all_values_valid: boolean
  readonly no_syntax_errors: boolean
  readonly renders_correctly: boolean
  readonly issues: CssValidation
}

// =============================================================================
// OPTIMIZATION ANALYZER INTERFACE
// =============================================================================

export interface OptimizationAnalyzer {
  // Dead Code Detection
  detectDeadCode(
    scanResult: unknown,  // ScanWorkspaceResult
    css: string
  ): Promise<DeadCodeAnalysis>
  
  generateDeadCodeReport(analysis: DeadCodeAnalysis): Promise<DeadCodeReport>
  
  // CSS Elimination
  eliminateDeadCss(css: string, deadClasses: string[]): Promise<EliminationResult>
  
  // Full Optimization Pipeline
  optimizeCss(css: string): Promise<OptimizationResult>
  runFullOptimizationPipeline(css: string): Promise<FullOptimizationPipeline>
  
  // LightningCSS Integration
  processTailwindCssLightning(css: string): Promise<ProcessedCssResult>
  processTailwindCssWithTargets(
    css: string,
    targets?: string
  ): Promise<ProcessedCssResult>
  
  validateCss(css: string): Promise<CssValidationResult>
  validateCorrectness(css: string): Promise<CssCorrectness>
  
  // Atomic CSS
  parseAtomicClass(twClass: string): Promise<AtomicConversionResult>
  
  generateAtomicCss(
    rules: Array<{
      selector: string
      properties: Record<string, string>
    }>
  ): Promise<string>
  
  toAtomicClasses(twClasses: string): Promise<AtomicBatchConversionResult>
  
  // Atomic Registry Management
  getAtomicRegistrySize(): Promise<number>
  getAtomicRegistryStats(): Promise<AtomicRegistryStats>
  clearAtomicRegistry(): Promise<void>
  
  // Analysis & Reporting
  analyzeForDeduplication(css: string): Promise<PropertyDuplicateAnalysis>
  deduplicateProperties(css: string): Promise<DeduplicationResult>
  
  // Performance Profiling
  profileOptimization(css: string): Promise<{
    stages: Array<{
      name: string
      time_ms: number
      size_before: number
      size_after: number
    }>
    total_time_ms: number
    total_savings_percent: number
  }>
}

// =============================================================================
// OPTIMIZATION MANAGER INTERFACE (Higher-level abstraction)
// =============================================================================

export interface OptimizationManager extends OptimizationAnalyzer {
  // Configuration
  setConfiguration(config: LightningCssConfig): Promise<void>
  getConfiguration(): Promise<LightningCssConfig>
  
  // Batch Operations
  optimizeBatch(cssArray: string[]): Promise<OptimizationResult[]>
  
  // Caching & Memoization
  enableCaching(): Promise<void>
  disableCaching(): Promise<void>
  getCachingStats(): Promise<{
    cached_items: number
    cache_hits: number
    cache_misses: number
    hit_rate_percent: number
  }>
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export const isDeadCodeAnalysis = (value: unknown): value is DeadCodeAnalysis => {
  const v = value as Partial<DeadCodeAnalysis>
  return (
    Array.isArray(v.dead_in_css) &&
    Array.isArray(v.dead_in_source) &&
    Array.isArray(v.live_classes) &&
    typeof v.total_css_classes === 'number' &&
    typeof v.total_source_classes === 'number' &&
    typeof v.dead_code_percentage === 'number'
  )
}

export const isEliminationResult = (value: unknown): value is EliminationResult => {
  const v = value as Partial<EliminationResult>
  return (
    typeof v.success === 'boolean' &&
    typeof v.original_css === 'string' &&
    typeof v.eliminated_css === 'string' &&
    typeof v.reduction_percent === 'number'
  )
}

export const isMinificationResult = (value: unknown): value is MinificationResult => {
  const v = value as Partial<MinificationResult>
  return (
    typeof v.success === 'boolean' &&
    typeof v.original_css === 'string' &&
    typeof v.minified_css === 'string' &&
    typeof v.savings_percent === 'number'
  )
}

export const isOptimizationResult = (value: unknown): value is OptimizationResult => {
  const v = value as Partial<OptimizationResult>
  return (
    typeof v.success === 'boolean' &&
    typeof v.original_size_bytes === 'number' &&
    typeof v.optimized_size_bytes === 'number' &&
    typeof v.reduction_percent === 'number'
  )
}

export const isAtomicClass = (value: unknown): value is AtomicClass => {
  const v = value as Partial<AtomicClass>
  return (
    typeof v.class_name === 'string' &&
    typeof v.property === 'string' &&
    typeof v.value === 'string' &&
    typeof v.selector === 'string' &&
    typeof v.css_rule === 'string'
  )
}

export const isProcessedCssResult = (value: unknown): value is ProcessedCssResult => {
  const v = value as Partial<ProcessedCssResult>
  return (
    typeof v.css === 'string' &&
    typeof v.size_bytes === 'number' &&
    Array.isArray(v.resolved_classes) &&
    Array.isArray(v.unknown_classes) &&
    Array.isArray(v.warnings)
  )
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculates the potential savings from optimization
 */
export const calculateOptimizationPotential = (
  originalSize: number,
  deadCodePercent: number,
  minificationPercent = 0.2  // Typical 20% minification
): number => {
  const deadCodeSavings = (originalSize * deadCodePercent) / 100
  const minificationSavings = (deadCodeSavings * minificationPercent)
  return deadCodeSavings + minificationSavings
}

/**
 * Determines if dead code analysis is worthwhile
 */
export const isDeadCodeAnalysisWorthwhile = (
  cssSize: number,
  minAnalysisSize = 50 * 1024  // 50KB minimum
): boolean => {
  return cssSize > minAnalysisSize
}

/**
 * Formats optimization result for display
 */
export const formatOptimizationResult = (result: OptimizationResult): string => {
  return `CSS reduced by ${result.reduction_percent.toFixed(1)}% ` +
    `(${(result.original_size_bytes / 1024).toFixed(1)}KB → ${(result.optimized_size_bytes / 1024).toFixed(1)}KB)`
}

/**
 * Estimates time for CSS optimization based on size
 */
export const estimateOptimizationTime = (cssSizeBytes: number): number => {
  // Rough estimate: 0.1ms per KB
  return cssSizeBytes / 10240
}
