/**
 * FeaturesConfig - Configuration schema and validation for all 63 Rust functions
 *
 * Provides configuration schemas for:
 * - Redis distributed caching (40 functions)
 * - Watch system (20 functions)
 * - ID Registry (16 functions)
 * - Incremental compilation (8 functions)
 * - Theme resolution (7 functions)
 * - CSS optimization (12 functions)
 * - Atomic CSS generation (6 functions)
 * - Component analysis (8 functions)
 *
 * All features are disabled by default (opt-in model).
 */

/**
 * Redis Configuration Schema
 */
export interface RedisConfig {
  /**
   * Enable Redis distributed caching
   * @default false
   */
  enabled?: boolean

  /**
   * Redis server host
   * @default 'localhost'
   */
  host?: string

  /**
   * Redis server port
   * @default 6379
   */
  port?: number

  /**
   * Connection pool size
   * @default 10
   */
  poolSize?: number

  /**
   * Redis password for authentication
   * @default undefined
   */
  password?: string

  /**
   * Use SSL/TLS for connection
   * @default false
   */
  ssl?: boolean

  /**
   * Cache entry TTL in seconds
   * @default 604800 (7 days)
   */
  ttlSeconds?: number

  /**
   * Enable cluster mode for redundancy
   * @default false
   */
  clusterMode?: boolean

  /**
   * Initial cluster nodes (host:port format)
   * @default []
   */
  clusterNodes?: string[]

  /**
   * Enable replication for high availability
   * @default false
   */
  replicationEnabled?: boolean

  /**
   * Replica target host for replication
   * @default undefined
   */
  replicaHost?: string

  /**
   * Replica target port for replication
   * @default 6380
   */
  replicaPort?: number

  /**
   * Enable persistence (AOF or RDB)
   * @default false
   */
  persistenceEnabled?: boolean

  /**
   * Persistence mode: AOF or RDB
   * @default 'AOF'
   */
  persistenceMode?: 'AOF' | 'RDB'

  /**
   * Enable cache warming on startup
   * @default false
   */
  cacheWarmingEnabled?: boolean

  /**
   * Cache key pattern for warming (glob pattern)
   * @default 'css-compiler:*'
   */
  cacheWarmingPattern?: string

  /**
   * Eviction policy when cache is full
   * @default 'LRU'
   */
  evictionPolicy?: 'LRU' | 'LFU' | 'FIFO' | 'RANDOM'

  /**
   * Maximum cache size in bytes before eviction
   * @default 1073741824 (1GB)
   */
  maxCacheBytes?: number
}

/**
 * Watch System Configuration Schema
 */
export interface WatchConfig {
  /**
   * Enable file system watching for auto-recompile
   * @default false
   */
  enabled?: boolean

  /**
   * Root directory to watch
   * @default process.cwd()
   */
  rootPath?: string

  /**
   * File patterns to watch (glob patterns)
   * @default ['**\/*.tsx', '**\/*.ts', 'tailwind.config.js']
   */
  patterns?: string[]

  /**
   * Debounce time for rapid file changes (milliseconds)
   * @default 100
   */
  debounceMs?: number

  /**
   * Respect .gitignore when watching files
   * @default true
   */
  gitignoreAware?: boolean

  /**
   * Maximum files to watch before warning
   * @default 10000
   */
  maxFilesWarning?: number

  /**
   * Enable verbose logging for watch events
   * @default false
   */
  verbose?: boolean
}

/**
 * ID Registry Configuration Schema
 */
export interface IDRegistryConfig {
  /**
   * Enable component ID registry for reproducible builds
   * @default false
   */
  enabled?: boolean

  /**
   * Enable automatic snapshots of registry state
   * @default false
   */
  snapshotsEnabled?: boolean

  /**
   * Snapshot interval in milliseconds
   * @default 300000 (5 minutes)
   */
  snapshotIntervalMs?: number

  /**
   * Directory to store registry snapshots
   * @default './.cache/registry-snapshots'
   */
  snapshotDir?: string

  /**
   * Enable registry export for CI/CD reproducibility
   * @default false
   */
  exportEnabled?: boolean

  /**
   * Path to export registry state for sharing
   * @default './.cache/registry-export.json'
   */
  exportPath?: string

  /**
   * Enable registry import on startup
   * @default false
   */
  importEnabled?: boolean

  /**
   * Path to import registry state from
   * @default './.cache/registry-export.json'
   */
  importPath?: string
}

/**
 * Incremental Compilation Configuration Schema
 */
export interface IncrementalConfig {
  /**
   * Enable incremental compilation for faster rebuilds
   * @default false
   */
  enabled?: boolean

  /**
   * Enable fingerprinting for change detection
   * @default false
   */
  fingerprintingEnabled?: boolean

  /**
   * Cache directory for incremental state
   * @default './.cache/incremental'
   */
  cacheDir?: string

  /**
   * Maximum age in seconds before pruning cache entries
   * @default 604800 (7 days)
   */
  maxAgeSeconds?: number

  /**
   * Maximum number of cached entries before pruning
   * @default 10000
   */
  maxCacheEntries?: number

  /**
   * Enable streaming CSS output
   * @default false
   */
  streamingEnabled?: boolean

  /**
   * Chunk size for streamed CSS (bytes)
   * @default 65536 (64KB)
   */
  streamChunkSizeBytes?: number

  /**
   * Enable baseline snapshots for comparison
   * @default false
   */
  baselineSnapshotsEnabled?: boolean
}

/**
 * Theme Resolution Configuration Schema
 */
export interface ThemeConfig {
  /**
   * Enable advanced theme resolution
   * @default false
   */
  enabled?: boolean

  /**
   * Cache resolved themes for performance
   * @default true
   */
  cacheEnabled?: boolean

  /**
   * Theme cache size in entries
   * @default 1000
   */
  cacheSize?: number

  /**
   * Enable multi-layer theme composition
   * @default false
   */
  compositionEnabled?: boolean

  /**
   * Enable variant precedence tracking
   * @default false
   */
  variantPrecedenceEnabled?: boolean

  /**
   * Enable conflict group resolution
   * @default false
   */
  conflictGroupsEnabled?: boolean

  /**
   * Enable theme validation on startup
   * @default true
   */
  validationEnabled?: boolean

  /**
   * Enable theme caching across compilations
   * @default false
   */
  persistentCacheEnabled?: boolean

  /**
   * Persistent cache directory
   * @default './.cache/themes'
   */
  persistentCacheDir?: string
}

/**
 * CSS Optimization Configuration Schema
 */
export interface OptimizationConfig {
  /**
   * Enable CSS optimization (dead code elimination, minification)
   * @default false
   */
  enabled?: boolean

  /**
   * Enable dead code detection
   * @default false
   */
  deadCodeDetectionEnabled?: boolean

  /**
   * Enable dead code elimination
   * @default false
   */
  deadCodeEliminationEnabled?: boolean

  /**
   * Enable LightningCSS minification
   * @default false
   */
  minificationEnabled?: boolean

  /**
   * Minimum file size reduction percentage to report
   * @default 5
   */
  minReductionPercent?: number

  /**
   * Enable optimization analytics/reporting
   * @default false
   */
  analyticsEnabled?: boolean

  /**
   * Report file path for optimization analytics
   * @default './.cache/optimization-report.json'
   */
  analyticsReportPath?: string

  /**
   * Enable target-specific CSS optimization
   * @default false
   */
  targetOptimizationEnabled?: boolean

  /**
   * Browser targets for optimization (browserslist format)
   * @default 'defaults'
   */
  targets?: string
}

/**
 * Atomic CSS Configuration Schema
 */
export interface AtomicCssConfig {
  /**
   * Enable atomic CSS mode (single-property classes)
   * @default false
   */
  enabled?: boolean

  /**
   * Cache atomic class registry for performance
   * @default true
   */
  cacheEnabled?: boolean

  /**
   * Registry cache size in entries
   * @default 5000
   */
  registryCacheSize?: number

  /**
   * Enable atomic class deduplication
   * @default true
   */
  deduplicationEnabled?: boolean

  /**
   * Preserve original Tailwind classes alongside atomic
   * @default true
   */
  preserveOriginalClasses?: boolean

  /**
   * Atomic class prefix
   * @default '_'
   */
  classPrefix?: string
}

/**
 * Component Analysis Configuration Schema
 */
export interface AnalysisConfig {
  /**
   * Enable component usage analysis
   * @default false
   */
  enabled?: boolean

  /**
   * Enable unused component detection
   * @default false
   */
  unusedDetectionEnabled?: boolean

  /**
   * Enable component dependency tracking
   * @default false
   */
  dependencyTrackingEnabled?: boolean

  /**
   * Enable bundle impact calculation
   * @default false
   */
  bundleImpactEnabled?: boolean

  /**
   * Enable risk assessment for changes
   * @default false
   */
  riskAssessmentEnabled?: boolean

  /**
   * Analysis report output path
   * @default './.cache/component-analysis.json'
   */
  reportPath?: string

  /**
   * Minimum usage threshold to not report as unused
   * @default 0
   */
  minUsageThreshold?: number

  /**
   * Enable detailed impact calculation
   * @default false
   */
  detailedImpactEnabled?: boolean

  /**
   * Impact calculation includes transitive dependencies
   * @default true
   */
  includeTransitiveDependencies?: boolean
}

/**
 * Unified Features Configuration
 * This is the main configuration object that combines all feature configs
 */
export interface FeaturesConfigSchema {
  /**
   * Redis distributed caching configuration
   */
  redis?: RedisConfig

  /**
   * File system watch configuration
   */
  watch?: WatchConfig

  /**
   * Component ID registry configuration
   */
  idRegistry?: IDRegistryConfig

  /**
   * Incremental compilation configuration
   */
  incremental?: IncrementalConfig

  /**
   * Theme resolution configuration
   */
  theme?: ThemeConfig

  /**
   * CSS optimization configuration
   */
  optimization?: OptimizationConfig

  /**
   * Atomic CSS generation configuration
   */
  atomicCss?: AtomicCssConfig

  /**
   * Component analysis configuration
   */
  analysis?: AnalysisConfig
}

/**
 * Validation Result type
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Default configuration with all features disabled by default (opt-in model)
 */
export const DEFAULT_FEATURES_CONFIG: FeaturesConfigSchema = {
  redis: {
    enabled: false,
    host: 'localhost',
    port: 6379,
    poolSize: 10,
    password: undefined,
    ssl: false,
    ttlSeconds: 604800, // 7 days
    clusterMode: false,
    clusterNodes: [],
    replicationEnabled: false,
    replicaHost: undefined,
    replicaPort: 6380,
    persistenceEnabled: false,
    persistenceMode: 'AOF',
    cacheWarmingEnabled: false,
    cacheWarmingPattern: 'css-compiler:*',
    evictionPolicy: 'LRU',
    maxCacheBytes: 1073741824, // 1GB
  },
  watch: {
    enabled: false,
    rootPath: process.cwd(),
    patterns: ['**/*.tsx', '**/*.ts', 'tailwind.config.js'],
    debounceMs: 100,
    gitignoreAware: true,
    maxFilesWarning: 10000,
    verbose: false,
  },
  idRegistry: {
    enabled: false,
    snapshotsEnabled: false,
    snapshotIntervalMs: 300000, // 5 minutes
    snapshotDir: './.cache/registry-snapshots',
    exportEnabled: false,
    exportPath: './.cache/registry-export.json',
    importEnabled: false,
    importPath: './.cache/registry-export.json',
  },
  incremental: {
    enabled: false,
    fingerprintingEnabled: false,
    cacheDir: './.cache/incremental',
    maxAgeSeconds: 604800, // 7 days
    maxCacheEntries: 10000,
    streamingEnabled: false,
    streamChunkSizeBytes: 65536, // 64KB
    baselineSnapshotsEnabled: false,
  },
  theme: {
    enabled: false,
    cacheEnabled: true,
    cacheSize: 1000,
    compositionEnabled: false,
    variantPrecedenceEnabled: false,
    conflictGroupsEnabled: false,
    validationEnabled: true,
    persistentCacheEnabled: false,
    persistentCacheDir: './.cache/themes',
  },
  optimization: {
    enabled: false,
    deadCodeDetectionEnabled: false,
    deadCodeEliminationEnabled: false,
    minificationEnabled: false,
    minReductionPercent: 5,
    analyticsEnabled: false,
    analyticsReportPath: './.cache/optimization-report.json',
    targetOptimizationEnabled: false,
    targets: 'defaults',
  },
  atomicCss: {
    enabled: false,
    cacheEnabled: true,
    registryCacheSize: 5000,
    deduplicationEnabled: true,
    preserveOriginalClasses: true,
    classPrefix: '_',
  },
  analysis: {
    enabled: false,
    unusedDetectionEnabled: false,
    dependencyTrackingEnabled: false,
    bundleImpactEnabled: false,
    riskAssessmentEnabled: false,
    reportPath: './.cache/component-analysis.json',
    minUsageThreshold: 0,
    detailedImpactEnabled: false,
    includeTransitiveDependencies: true,
  },
}

/**
 * Validate Redis configuration
 */
export function validateRedisConfig(
  config: RedisConfig | undefined
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!config) {
    return { valid: true, errors, warnings }
  }

  if (config.port !== undefined) {
    if (config.port < 1 || config.port > 65535) {
      errors.push(
        `redis.port must be between 1 and 65535, got ${config.port}`
      )
    }
  }

  if (config.poolSize !== undefined) {
    if (config.poolSize < 1 || config.poolSize > 1000) {
      errors.push(
        `redis.poolSize must be between 1 and 1000, got ${config.poolSize}`
      )
    }
  }

  if (config.ttlSeconds !== undefined) {
    if (config.ttlSeconds < 1) {
      errors.push(
        `redis.ttlSeconds must be greater than 0, got ${config.ttlSeconds}`
      )
    }
  }

  if (config.clusterMode && (!config.clusterNodes || config.clusterNodes.length === 0)) {
    warnings.push('redis.clusterMode enabled but clusterNodes is empty')
  }

  if (config.replicationEnabled && !config.replicaHost) {
    warnings.push('redis.replicationEnabled enabled but replicaHost not specified')
  }

  if (
    config.persistenceMode &&
    !['AOF', 'RDB'].includes(config.persistenceMode)
  ) {
    errors.push(
      `redis.persistenceMode must be 'AOF' or 'RDB', got ${config.persistenceMode}`
    )
  }

  if (
    config.evictionPolicy &&
    !['LRU', 'LFU', 'FIFO', 'RANDOM'].includes(config.evictionPolicy)
  ) {
    errors.push(
      `redis.evictionPolicy must be one of: LRU, LFU, FIFO, RANDOM. Got: ${config.evictionPolicy}`
    )
  }

  if (config.maxCacheBytes !== undefined) {
    if (config.maxCacheBytes < 1048576) {
      warnings.push(
        `redis.maxCacheBytes is very small (${config.maxCacheBytes} bytes). Minimum recommended: 1MB`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate Watch configuration
 */
export function validateWatchConfig(
  config: WatchConfig | undefined
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!config) {
    return { valid: true, errors, warnings }
  }

  if (config.debounceMs !== undefined) {
    if (config.debounceMs < 0) {
      errors.push(
        `watch.debounceMs must be >= 0, got ${config.debounceMs}`
      )
    }
  }

  if (config.patterns && config.patterns.length === 0) {
    warnings.push('watch.patterns is empty - no files will be watched')
  }

  if (config.maxFilesWarning !== undefined) {
    if (config.maxFilesWarning < 1) {
      errors.push(
        `watch.maxFilesWarning must be >= 1, got ${config.maxFilesWarning}`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate ID Registry configuration
 */
export function validateIDRegistryConfig(
  config: IDRegistryConfig | undefined
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!config) {
    return { valid: true, errors, warnings }
  }

  if (config.snapshotIntervalMs !== undefined) {
    if (config.snapshotIntervalMs < 1000) {
      warnings.push(
        `idRegistry.snapshotIntervalMs is very small (${config.snapshotIntervalMs}ms). Minimum recommended: 1000ms`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate Incremental configuration
 */
export function validateIncrementalConfig(
  config: IncrementalConfig | undefined
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!config) {
    return { valid: true, errors, warnings }
  }

  if (config.maxAgeSeconds !== undefined) {
    if (config.maxAgeSeconds < 1) {
      errors.push(
        `incremental.maxAgeSeconds must be >= 1, got ${config.maxAgeSeconds}`
      )
    }
  }

  if (config.maxCacheEntries !== undefined) {
    if (config.maxCacheEntries < 1) {
      errors.push(
        `incremental.maxCacheEntries must be >= 1, got ${config.maxCacheEntries}`
      )
    }
  }

  if (config.streamChunkSizeBytes !== undefined) {
    if (config.streamChunkSizeBytes < 1024) {
      warnings.push(
        `incremental.streamChunkSizeBytes is very small (${config.streamChunkSizeBytes} bytes). Minimum recommended: 1024 bytes`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate Theme configuration
 */
export function validateThemeConfig(
  config: ThemeConfig | undefined
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!config) {
    return { valid: true, errors, warnings }
  }

  if (config.cacheSize !== undefined) {
    if (config.cacheSize < 1) {
      errors.push(
        `theme.cacheSize must be >= 1, got ${config.cacheSize}`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate Optimization configuration
 */
export function validateOptimizationConfig(
  config: OptimizationConfig | undefined
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!config) {
    return { valid: true, errors, warnings }
  }

  if (config.minReductionPercent !== undefined) {
    if (config.minReductionPercent < 0 || config.minReductionPercent > 100) {
      errors.push(
        `optimization.minReductionPercent must be between 0 and 100, got ${config.minReductionPercent}`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate Atomic CSS configuration
 */
export function validateAtomicCssConfig(
  config: AtomicCssConfig | undefined
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!config) {
    return { valid: true, errors, warnings }
  }

  if (config.registryCacheSize !== undefined) {
    if (config.registryCacheSize < 1) {
      errors.push(
        `atomicCss.registryCacheSize must be >= 1, got ${config.registryCacheSize}`
      )
    }
  }

  if (config.classPrefix === '') {
    warnings.push('atomicCss.classPrefix is empty string - atomic classes will have no prefix')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate Analysis configuration
 */
export function validateAnalysisConfig(
  config: AnalysisConfig | undefined
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!config) {
    return { valid: true, errors, warnings }
  }

  if (config.minUsageThreshold !== undefined) {
    if (config.minUsageThreshold < 0) {
      errors.push(
        `analysis.minUsageThreshold must be >= 0, got ${config.minUsageThreshold}`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate entire features configuration
 */
export function validateFeaturesConfig(
  config: FeaturesConfigSchema | undefined
): ValidationResult {
  const allErrors: string[] = []
  const allWarnings: string[] = []

  if (!config) {
    return {
      valid: true,
      errors: allErrors,
      warnings: allWarnings,
    }
  }

  // Validate each domain config
  const validators = [
    { name: 'redis', validate: validateRedisConfig, config: config.redis },
    { name: 'watch', validate: validateWatchConfig, config: config.watch },
    {
      name: 'idRegistry',
      validate: validateIDRegistryConfig,
      config: config.idRegistry,
    },
    {
      name: 'incremental',
      validate: validateIncrementalConfig,
      config: config.incremental,
    },
    { name: 'theme', validate: validateThemeConfig, config: config.theme },
    {
      name: 'optimization',
      validate: validateOptimizationConfig,
      config: config.optimization,
    },
    {
      name: 'atomicCss',
      validate: validateAtomicCssConfig,
      config: config.atomicCss,
    },
    {
      name: 'analysis',
      validate: validateAnalysisConfig,
      config: config.analysis,
    },
  ]

  for (const { name, validate, config: cfg } of validators) {
    const result = validate(cfg)
    allErrors.push(
      ...result.errors.map(err => `${name}: ${err}`)
    )
    allWarnings.push(
      ...result.warnings.map(warn => `${name}: ${warn}`)
    )
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  }
}

/**
 * Merge user configuration with defaults
 * User config takes precedence over defaults
 */
export function mergeWithDefaults(
  userConfig: FeaturesConfigSchema | undefined
): FeaturesConfigSchema {
  if (!userConfig) {
    return { ...DEFAULT_FEATURES_CONFIG }
  }

  return {
    redis: {
      ...DEFAULT_FEATURES_CONFIG.redis,
      ...userConfig.redis,
    },
    watch: {
      ...DEFAULT_FEATURES_CONFIG.watch,
      ...userConfig.watch,
    },
    idRegistry: {
      ...DEFAULT_FEATURES_CONFIG.idRegistry,
      ...userConfig.idRegistry,
    },
    incremental: {
      ...DEFAULT_FEATURES_CONFIG.incremental,
      ...userConfig.incremental,
    },
    theme: {
      ...DEFAULT_FEATURES_CONFIG.theme,
      ...userConfig.theme,
    },
    optimization: {
      ...DEFAULT_FEATURES_CONFIG.optimization,
      ...userConfig.optimization,
    },
    atomicCss: {
      ...DEFAULT_FEATURES_CONFIG.atomicCss,
      ...userConfig.atomicCss,
    },
    analysis: {
      ...DEFAULT_FEATURES_CONFIG.analysis,
      ...userConfig.analysis,
    },
  }
}

/**
 * Load configuration from tailwind.config.js
 * Looks for config.features object
 */
export function loadFromTailwindConfig(
  tailwindConfig: any
): FeaturesConfigSchema | undefined {
  if (!tailwindConfig || typeof tailwindConfig !== 'object') {
    return undefined
  }

  // Support both direct features object and nested in plugin config
  if (tailwindConfig.features) {
    return tailwindConfig.features as FeaturesConfigSchema
  }

  // Check if config is from a plugin's options
  if (tailwindConfig.config && tailwindConfig.config.features) {
    return tailwindConfig.config.features as FeaturesConfigSchema
  }

  return undefined
}

/**
 * Create a full configuration by merging user config with defaults and validating
 */
export function createFeaturesConfig(
  userConfig?: FeaturesConfigSchema | undefined
): {
  config: FeaturesConfigSchema
  validation: ValidationResult
} {
  const merged = mergeWithDefaults(userConfig)
  const validation = validateFeaturesConfig(merged)

  return {
    config: merged,
    validation,
  }
}
