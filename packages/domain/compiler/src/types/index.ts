/**
 * TypeScript Type Definitions for All 63 Rust Functions
 * 
 * This module provides comprehensive, type-safe interfaces for integrating
 * all 63 Rust functions exposed via NativeBridge.
 * 
 * Organized by functional domain:
 * - Redis: Distributed caching (40 functions)
 * - Watch: File monitoring (20 functions)
 * - ID Registry: Component tracking (16 functions)
 * - Incremental: Progressive compilation (8 functions)
 * - Theme: Advanced composition (7 functions)
 * - Optimization: Dead code elimination & CSS optimization (12+6 functions)
 * - Analysis: Component usage & impact (8 functions)
 */

// ============================================================================
// REDIS DISTRIBUTED CACHING
// ============================================================================

export type {
  RedisConnectionConfig,
  PoolStats,
  CacheEntry,
  CacheGetResult,
  CacheSetResult,
  CacheDeleteResult,
  BatchGetResult,
  BatchSetEntry,
  BatchSetResult,
  CacheStatistics,
  EvictionStats,
  MonitorEntry,
  ClusterNode,
  ClusterStatus,
  ClusterHealthCheck,
  ReplicationStatus,
  ReplicationConfig,
  PubSubMessage,
  PubSubStats,
  PersistenceConfig,
  PersistenceStatus,
  CacheWarmingConfig,
  CacheWarmingResult,
  MemoryStats,
  MemoryOptimization,
  DiagnosticsReport,
  LatencyProfile,
  ExpirationInfo,
  ExpirationStats,
  CacheSyncConfig,
  CacheSyncResult,
  CompilerCacheKey,
  CSSCompilerCacheEntry,
  RedisManager,
} from './redis'

export {
  EvictionPolicy,
  PersistenceMode,
  isEvictionPolicy,
  isPersistenceMode,
  isClusterStatus,
  isDiagnosticsReport,
} from './redis'

// ============================================================================
// WATCH SYSTEM & FILE MONITORING
// ============================================================================

export type {
  WatchConfig,
  WatchHandle,
  WatchEvent,
  WatchEventBatch,
  PatternAddResult,
  PatternRemoveResult,
  PatternInfo,
  ActivePattern,
  WatchControlResult,
  WatchStateInfo,
  WatchStats,
  PerHandleStats,
  EventMetrics,
  FileChangeHookData,
  BeforeRecompileHookData,
  AfterCompileHookData,
  PluginHookData,
  PluginHookHandler,
  PluginHookRegistration,
  PluginHookEmitResult,
  PluginHooksInfo,
  DebouncerConfig,
  DebounceState,
  WatchError,
  LatencyHistogram,
  PerformanceProfile,
  WatchManager,
} from './watch'

export type {
  PluginHookName,
  WatchEventType,
} from './watch'

export {
  WatchErrorType,
  isWatchEventType,
  isPluginHookName,
  isWatchEvent,
  isWatchHandle,
  isWatchStats,
  isWatchError,
} from './watch'

// ============================================================================
// ID REGISTRY & COMPONENT TRACKING
// ============================================================================

export type {
  ComponentID,
  PropertyID,
  ValueID,
  RegistryHandle,
  RegistryCreationResult,
  RegistryDestructionResult,
  RegistryResetResult,
  IDGenerationResult,
  IDLookupResult,
  NextIDResult,
  PropertyRegistration,
  ValueRegistration,
  PropertyLookupResult,
  ValueLookupResult,
  ReverseLookupResult,
  RegistryEntry,
  RegistrySnapshot,
  ExportedRegistry,
  ImportResult,
  ExportResult,
  BatchComponentRegistration,
  BatchRegistrationResult,
  RegistryStats,
  GlobalRegistryStats,
  RegistryUsageStats,
  RegistryValidationResult,
  ReproducibilityContract,
  IDConflict,
  ConflictResolution,
  IDRegistryManager,
} from './id-registry'

export {
  createComponentID,
  createPropertyID,
  createValueID,
  createRegistryHandle,
  isComponentID,
  isPropertyID,
  isValueID,
  isRegistryHandle,
  isExportedRegistry,
  isRegistrySnapshot,
  isRegistryValidationResult,
  createComponentName,
  createPropertyKey,
  createValueKey,
} from './id-registry'

// ============================================================================
// INCREMENTAL COMPILATION & STREAMING
// ============================================================================

export type {
  FileFingerprint,
  FingerprintComparison,
  FileChange,
  FileChangeDiff,
  ScanDifference,
  ClassDifference,
  IncrementalDiff,
  DiffMetrics,
  WorkspaceScanResult,
  FileScanResult,
  BatchScanResult,
  IncrementalBuildConfig,
  IncrementalBuildResult,
  BuildArtifact,
  WorkspaceRebuildConfig,
  WorkspaceRebuildResult,
  PruneConfig,
  PruneResult,
  CacheMaintenanceResult,
  StateHashConfig,
  StateHash,
  StateInjectionResult,
  StreamingChunk,
  StreamingConfig,
  StreamingResult,
  IncrementalCacheEntry,
  IncrementalCache,
  IncrementalMetrics,
  StreamingMetrics,
  IncrementalManager,
} from './incremental'

export type {
  FileChangeType,
} from './incremental'

export {
  isFileChangeType,
  isFileFingerprint,
  isFileChangeDiff,
  isIncrementalDiff,
  isWorkspaceScanResult,
  isIncrementalBuildResult,
  estimateImpactLevel,
  calculateSpeedup,
  shouldUseIncremental,
} from './incremental'

// ============================================================================
// THEME RESOLUTION & COMPOSITION
// ============================================================================

export type {
  Variant,
  VariantConfig,
  SimpleVariantConfig,
  ResolvedVariants,
  VariantResolutionResult,
  ValidationError,
  ValidationResult,
  ThemeTokens,
  ThemeConfig,
  MergedTheme,
  ThemeCascadeResult,
  ThemeLookupResult,
  ThemeLookupBatch,
  ClassNameResolution,
  ClassNameResolutionResult,
  ConflictGroup,
  ConflictGroupResolution,
  ThemeCacheEntry,
  ThemeCacheStats,
  ThemeCacheInvalidation,
  CircularDependency,
  CircularDependencyCheck,
  ExtensionResult,
  CompositionResult,
  ThemeDiagnostics,
  ThemeManager,
} from './theme'

export {
  VariantPrecedence,
  isVariantPrecedence,
  isThemeConfig,
  isMergedTheme,
  isThemeLookupResult,
  isClassNameResolution,
  isValidationResult,
  createKeyPath,
  extractVariantName,
  getBaseClass,
  compareVariantPrecedence,
} from './theme'

// ============================================================================
// CSS OPTIMIZATION & DEAD CODE ELIMINATION
// ============================================================================

export type {
  DeadCodeAnalysis,
  DeadClassMetadata,
  DeadCodeReport,
  EliminationResult,
  EliminationStats,
  MinificationResult,
  OptimizationResult,
  FullOptimizationPipeline,
  LightningCssConfig,
  ProcessedCssResult,
  CssValidationResult,
  AtomicClass,
  AtomicConversionResult,
  AtomicBatchConversionResult,
  AtomicRegistryStats,
  PropertyDuplicateAnalysis,
  DeduplicationResult,
  CssValidation,
  CssCorrectness,
  OptimizationAnalyzer,
  OptimizationManager,
} from './optimization'

export {
  isDeadCodeAnalysis,
  isEliminationResult,
  isMinificationResult,
  isOptimizationResult,
  isAtomicClass,
  isProcessedCssResult,
  calculateOptimizationPotential,
  isDeadCodeAnalysisWorthwhile,
  formatOptimizationResult,
  estimateOptimizationTime,
} from './optimization'

// ============================================================================
// COMPONENT ANALYSIS & IMPACT TRACKING
// ============================================================================

export type {
  ComponentOccurrence,
  ComponentUsage,
  ComponentUsageStats,
  ExtendedComponentUsage,
  BundleImpact,
  BundleImpactAnalysis,
  BundleMetrics,
  ComponentDependency,
  DependencyGraph,
  DependencyMetrics,
  UnusedComponent,
  UnusedComponentAnalysis,
  RiskFactors,
  RiskAssessment,
  ImpactMetrics,
  ChangeImpact,
  OptimizationOpportunity,
  OptimizationReport,
  SavingsCalculation,
  SavingsAnalysis,
  ComponentMetrics,
  ComponentHealth,
  ComponentAnalysisManager,
} from './analysis'

export {
  isComponentUsage,
  isExtendedComponentUsage,
  isBundleImpact,
  isDependencyGraph,
  isUnusedComponent,
  isRiskAssessment,
  isOptimizationOpportunity,
  calculateRiskScore,
  getRiskLevel,
  formatBundleImpact,
  shouldFlagForAnalysis,
} from './analysis'

// ============================================================================
// RE-EXPORT NATIVE OPERATIONS FOR COMPATIBILITY
// ============================================================================

export type {
  TransformOptions,
  TransformResult,
  ExtractClassesOptions,
  ParsedClass,
  CompileCssOptions,
  CssCompileResult,
  NormalizeResult,
  DiffResult,
  BatchExtractResult,
  SafelistResult,
  ComponentUsage as ComponentUsageMetadata,
  RscAnalysisResult,
  ClassUsageResult,
  VariantTableResult,
  ClassifyResult,
  MergeDeclarationsResult,
  HoistResult,
  FullAnalyzeResult,
  HealthStatus,
  TypedNativeBridge,
} from './native-operations'

// ============================================================================
// AGGREGATED EXPORTS FOR CONVENIENCE
// ============================================================================

export type Managers = {
  RedisManager: import('./redis').RedisManager
  WatchManager: import('./watch').WatchManager
  IDRegistryManager: import('./id-registry').IDRegistryManager
  IncrementalManager: import('./incremental').IncrementalManager
  ThemeManager: import('./theme').ThemeManager
  OptimizationManager: import('./optimization').OptimizationManager
  ComponentAnalysisManager: import('./analysis').ComponentAnalysisManager
}

export type Requirements = {
  Redis: {
    Config: import('./redis').RedisConfig
    Manager: import('./redis').RedisManager
    ClusterStatus: import('./redis').ClusterStatus
  }
  Watch: {
    Config: import('./watch').WatchConfig
    Manager: import('./watch').WatchManager
    Event: import('./watch').WatchEvent
  }
  IDRegistry: {
    Manager: import('./id-registry').IDRegistryManager
    RegistryHandle: import('./id-registry').RegistryHandle
  }
  Incremental: {
    Manager: import('./incremental').IncrementalManager
    BuildResult: import('./incremental').IncrementalBuildResult
  }
  Theme: {
    Config: import('./theme').ThemeConfig
    Manager: import('./theme').ThemeManager
  }
  Optimization: {
    Manager: import('./optimization').OptimizationManager
    Result: import('./optimization').OptimizationResult
  }
  Analysis: {
    Manager: import('./analysis').ComponentAnalysisManager
    Usage: import('./analysis').ComponentUsage
  }
}
