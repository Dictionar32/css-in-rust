/**
 * Analyzer Sub-entry Point
 * 
 * Exports analysis and optimization functionality.
 * - CSS and class analysis
 * - Dead code detection
 * - Theme resolution and validation
 * - Code classification and optimization
 */

export {
  detectDeadCode,
  analyzeClassUsageNative,
  analyzeClassesNative,
  analyzeRscNative,
  optimizeCssNative,
  processTailwindCssLightning,
  eliminateDeadCssNative,
  hoistComponentsNative,
  compileVariantTableNative,
  classifyAndSortClassesNative,
  mergeCssDeclarationsNative,
  getWeek6FeaturesStatus,
  getMemoryStatsNative,
  getMemoryRecommendationsNative,
  estimateOptimalCacheConfigNative,
  resetMemoryStats,
  type DeadCodeResult,
  type ClassUsageItem,
  type ProcessedCssResult,
  type HoistResult,
  type VariantTableResult,
  type ClassifyResult,
  type MergeResult,
  type MemoryStats,
  type MemoryRecommendations,
  type OptimalCacheConfigAnalysis,
  type Week6FeaturesStatus,
} from './analyzerNative'

export {
  resolveVariants,
  validateThemeConfig,
  resolveCascade,
  resolveClassNames,
  resolveConflictGroup,
  resolveThemeValue,
  resolveSimpleVariants,
  type ThemeValidationResult,
  type ResolvedVariantConfig,
  type ThemeCascadeResult,
  type ResolvedClassName,
  type ConflictGroupInfo,
} from './themeResolutionNative'

export {
  scanWorkspace,
  extractClassesFromSourceNative,
  batchExtractClassesNative,
  checkAgainstSafelistNative,
  scanFile,
  collectFiles,
  walkAndPrefilterSourceFiles,
  generateSubComponentTypes,
  type ScanWorkspaceResult,
  type ScanFileResult,
  type BatchExtractResult,
  type SafelistCheckResult,
  type PrefilterFileResult,
} from './scannerNative'
