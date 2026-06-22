/**
 * Configuration exports for all 63 Rust functions
 *
 * This module provides configuration schema, validation, and utilities
 * for managing feature configurations across all 8 domains.
 */

export type {
  FeaturesConfigSchema,
  RedisConfig,
  WatchConfig,
  IDRegistryConfig,
  IncrementalConfig,
  ThemeConfig,
  OptimizationConfig,
  AtomicCssConfig,
  AnalysisConfig,
  ValidationResult,
} from './FeaturesConfig'

export {
  // Default configuration
  DEFAULT_FEATURES_CONFIG,
  // Validation functions
  validateRedisConfig,
  validateWatchConfig,
  validateIDRegistryConfig,
  validateIncrementalConfig,
  validateThemeConfig,
  validateOptimizationConfig,
  validateAtomicCssConfig,
  validateAnalysisConfig,
  validateFeaturesConfig,
  // Utilities
  mergeWithDefaults,
  loadFromTailwindConfig,
  createFeaturesConfig,
} from './FeaturesConfig'
