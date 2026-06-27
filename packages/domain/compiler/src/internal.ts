/**
 * tailwind-styled-v5 — Internal API
 * 
 * Re-exports functions needed by other package consumers.
 * All functions require native Rust bindings.
 */

import {
  type NativeBridge,
  type NativeTransformResult,
  type ComponentMetadata,
  type NativeRscResult,
  type LoaderOutput,
  getNativeBridge,
  adaptNativeResult,
  transformSource,
  hasTwUsage,
  isAlreadyTransformed,
  shouldProcess,
  compileCssFromClasses,
  buildStyleTag,
  extractAllClasses,
  extractClassesFromSource,
  astExtractClasses,
  parseClasses,
  parseClass,
  normalizeClasses,
  mergeClassesStatic,
  normalizeAndDedupClasses,
  eliminateDeadCss,
  findDeadVariants,
  runElimination,
  scanProjectUsage,
  extractComponentUsage,
  diffClassLists,
  batchExtractClasses,
  checkAgainstSafelist,
  generateSafelist,
  loadSafelist,
  loadTailwindConfig,
  getContentPaths,
  runLoaderTransform,
  shouldSkipFile,
  fileToRoute,
  getAllRoutes,
  getRouteClasses,
  registerFileClasses,
  registerGlobalClasses,
  getAllRegisteredClasses,
  resetRouteClassRegistry,
  getIncrementalEngine,
  resetIncrementalEngine,
  getBucketEngine,
  resetBucketEngine,
  classifyNode,
  detectConflicts,
  bucketSort,
  generateCssForClasses,
  analyzeFile,
  analyzeVariantUsage,
  injectClientDirective,
  injectServerOnlyComment,
  analyzeClasses,
  // Static state CSS pre-generation
  extractTwStateConfigs,
  generateStaticStateCss,
  extractAndGenerateStateCss,
  extractContainerCssFromSource,
} from "./index"

export {
  getNativeBridge,
  adaptNativeResult,
  transformSource,
  hasTwUsage,
  isAlreadyTransformed,
  shouldProcess,
  compileCssFromClasses,
  buildStyleTag,
  extractAllClasses,
  extractClassesFromSource,
  astExtractClasses,
  parseClasses,
  parseClass,
  normalizeClasses,
  mergeClassesStatic,
  normalizeAndDedupClasses,
  eliminateDeadCss,
  findDeadVariants,
  runElimination,
  scanProjectUsage,
  extractComponentUsage,
  diffClassLists,
  batchExtractClasses,
  checkAgainstSafelist,
  generateSafelist,
  loadSafelist,
  loadTailwindConfig,
  getContentPaths,
  runLoaderTransform,
  shouldSkipFile,
  fileToRoute,
  getAllRoutes,
  getRouteClasses,
  registerFileClasses,
  registerGlobalClasses,
  getAllRegisteredClasses,
  resetRouteClassRegistry,
  getIncrementalEngine,
  resetIncrementalEngine,
  getBucketEngine,
  resetBucketEngine,
  classifyNode,
  detectConflicts,
  bucketSort,
  generateCssForClasses,
  analyzeFile,
  analyzeVariantUsage,
  injectClientDirective,
  injectServerOnlyComment,
  analyzeClasses,
  // Static state + container CSS pre-generation
  extractTwStateConfigs,
  generateStaticStateCss,
  extractAndGenerateStateCss,
  extractContainerCssFromSource,
}

export { type NativeBridge, type NativeTransformResult, type ComponentMetadata, type NativeRscResult, type LoaderOutput }

export type CssCompileResult = NativeTransformResult

// CSS pipeline — Tailwind → LightningCSS
// PHASE 0: Includes LRU caching for 30-40% performance improvement
export { runCssPipeline, runCssPipelineSync, getCacheStats, clearCache, type CssPipelineResult } from "./compiler/tailwindEngine"

// Re-export all sub-entries directly for convenience
export * from "./compiler"
export * from "./parser"
export * from "./analyzer"
export * from "./cache"
export * from "./redis"
export * from "./watch"