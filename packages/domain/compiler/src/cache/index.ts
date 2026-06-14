/**
 * Cache Sub-entry Point
 * 
 * Exports cache management functionality.
 * - Cache statistics retrieval
 * - Cache clearing operations
 * - Cache optimization
 * - Cache configuration
 */

export {
  getCacheStatistics,
  clearAllCaches,
  clearParseCache,
  clearResolveCache,
  clearCompileCache,
  clearCssGenCache,
  getCacheOptimizationHints,
  estimateOptimalCacheConfig,
  cacheRead,
  cacheWrite,
  cachePriority,
  getResolverPoolStats,
  clearResolverPool,
  resolveColorCached,
  resolveSpacingCached,
  resolveFontSizeCached,
  resetResolverPoolStats,
  type CacheOptimizationHints,
  type OptimalCacheConfig,
  type CacheStatistics,
  type ResolverPoolStatsResult,
} from './cacheNative'
