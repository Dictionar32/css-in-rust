/**
 * Compiler Sub-entry Point
 * 
 * Exports CSS generation and compilation functionality.
 * - CSS generation with caching
 * - Compilation of classes to CSS
 * - ID registry management
 * - Streaming and incremental processing
 */

export {
  generateCssNative,
  getCacheStats,
  clearThemeCache,
  resetCacheStats,
} from './cssGeneratorNative'

export {
  compileCssNative2,
  compileCssLightning,
  extractTwStateConfigsNative,
  generateStaticStateCssNative,
  extractAndGenerateStateCssNative,
  layoutClassesToCss,
  hashContent,
  extractTwContainerConfigs,
  parseAtomicClass,
  generateAtomicCss,
  toAtomicClasses,
  clearAtomicRegistry,
  atomicRegistrySize,
  type ContainerConfig,
  type StateCssConfig,
  type GeneratedStateCss,
} from './compilationNative'

export {
  generateCss,
  generateCssBatch,
  compileClass,
  compileClasses,
  compileToCss,
  compileToCssBatch,
  minifyCss,
  compileAnimation,
  compileKeyframes,
  compileTheme,
  twMerge,
  twMergeMany,
  twMergeWithSeparator,
  twMergeManyWithSeparator,
  twMergeRaw,
  type CompiledCssRule,
  type CompiledAnimation,
  type CompiledTheme,
  type CssCompileResult,
  type TwMergeOptions,
} from './cssCompilationNative'

export {
  idRegistryCreate,
  idRegistryGenerate,
  idRegistryLookup,
  idRegistryNext,
  idRegistryDestroy,
  idRegistryReset,
  idRegistrySnapshot,
  idRegistryActiveCount,
  registerPropertyName,
  registerValueName,
  propertyIdToString,
  valueIdToString,
  reverseLookupProperty,
  reverseLookupValue,
  idRegistryExport,
  idRegistryImport,
  type RegistrySnapshot,
} from './idRegistryNative'

export {
  processFileChange,
  computeIncrementalDiff,
  createFingerprint,
  injectStateHash,
  pruneStaleCacheEntries,
  rebuildWorkspaceResult,
  scanFileNative,
  scanFilesBatchNative,
  type FileChangeEvent,
  type ProcessedFileChange,
  type FileDiff,
  type FileFingerprint,
  type IncrementalDiffResult,
  type StateInjectionResult,
  type PruneResult,
  type RebuildWorkspaceResult,
} from './streamingNative'

export { runCssPipeline } from './tailwindEngine'
