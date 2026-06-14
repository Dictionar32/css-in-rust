/**
 * AnalysisManager - Component analysis and usage tracking
 *
 * Manages component usage analytics, dependency tracking, and impact analysis
 * for optimization decisions and bundle impact tracking.
 *
 * Integrates Rust functions from multiple NAPI bridges:
 * - napi_bridge_analysis.rs: memory stats, recommendations, feature status
 * - napi_bridge_cache.rs: cache stats, config, optimization hints, batch sizing
 * - napi_bridge_parsing.rs: parse stats, class analysis
 * - week6_api.rs: optimization recommendations, memory prediction, caching strategy
 */

import { BaseManager, ManagerConfig } from './BaseManager'
import {
  analyze_class_usage,
  calculate_impact,
  calculate_risk,
  calculate_savings,
  analyze_classes,
  get_parse_stats,
  clear_parse_cache_napi,
  get_cache_stats,
  get_recommended_cache_config,
  get_cache_optimization_hints,
  configure_cache_backend,
  clear_all_caches_napi,
  clear_resolver_pool,
  estimate_streaming_batch_size,
  get_optimization_recommendations,
  estimate_optimal_batch_size,
  predict_memory_usage,
  recommend_caching_strategy,
  get_week6_optimization_status,
  get_week6_features_status,
  get_memory_stats_native,
  get_memory_recommendations_native,
  estimate_optimal_cache_config_native,
  reset_memory_stats,
  type ClassAnalysisResult,
  type ParseStatsResult,
  type CacheStatsResult,
  type RecommendedCacheConfig,
  type CacheOptimizationHintsResult,
  type StreamingBatchSizeResult,
  type OptimizationRecommendationsResult,
  type CachingStrategyResult,
  type Week6StatusResult,
  type Week6FeaturesStatusResult,
  type MemoryStatsResult,
  type MemoryRecommendationsResult,
  type OptimalCacheConfigResult,
} from '../nativeBridgeWrappers'

export interface AnalysisManagerConfig extends ManagerConfig {
  enabled?: boolean
}

export interface ComponentUsage {
  component: string
  occurrence_count: number
  file_locations: string[]
  bundle_impact_bytes: number
}

export interface ComponentDependency {
  component: string
  dependencies: string[]
  dependents: string[]
}

export interface ComponentImpact {
  component: string
  css_bytes: number
  gzip_bytes: number
  usage_count: number
  risk_level: 'low' | 'medium' | 'high'
}

export interface AnalysisReport {
  total_components: number
  used_components: number
  unused_components: number
  total_css_bytes: number
  total_gzip_bytes: number
  components: ComponentUsage[]
  dependencies: ComponentDependency[]
  impact: ComponentImpact[]
}

export class AnalysisManager extends BaseManager {
  private usageMap: Map<string, ComponentUsage> = new Map()
  private dependencyGraph: Map<string, ComponentDependency> = new Map()
  private impactMap: Map<string, ComponentImpact> = new Map()

  constructor(config: AnalysisManagerConfig = {}) {
    super({
      enabled: false,
      ...config,
    })
  }

  /**
   * Analyze class usage in source code
   * 
   * Calls Rust function: {@link analyze_class_usage}
   * Analyzes component class usage from scan results
   */
  async analyzeClassUsage(sourceFiles: Array<{ path: string; content: string }>): Promise<Map<string, ComponentUsage>> {
    this.ensureReady()

    try {
      // Extract classes first
      const classes: string[] = []
      const classSet = new Set<string>()
      
      for (const file of sourceFiles) {
        const classMatches = file.content.match(/\b[\w-]+(?::\S+)?\b/g) || []
        for (const match of classMatches) {
          if (!classSet.has(match)) {
            classes.push(match)
            classSet.add(match)
          }
        }
      }

      // Call Rust function
      const scanResult = { files: sourceFiles.map(f => f.path), classes: Array.from(classSet) }
      const css = sourceFiles.map(f => f.content).join('\n')
      
      const result = analyze_class_usage(classes, JSON.stringify(scanResult), css)
      
      this.usageMap.clear()
      for (const usage of result) {
        // Map ClassUsageItem to ComponentUsage
        const componentUsage: ComponentUsage = {
          component: usage.className,
          occurrence_count: usage.usageCount,
          file_locations: [],
          bundle_impact_bytes: 0,
        }
        this.usageMap.set(usage.className, componentUsage)
      }

      return new Map(this.usageMap)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'analyzeClassUsage')
      throw error
    }
  }

  /**
   * Calculate bundle impact for component
   * 
   * Calls Rust function: {@link calculate_impact}
   * Calculates impact of class changes
   */
  async calculateImpact(component: string, cssRule: string): Promise<ComponentImpact> {
    this.ensureReady()

    try {
      const impactData = { component, cssRule }
      const result = calculate_impact(JSON.stringify(impactData))
      const parsed = JSON.parse(result)

      const impact: ComponentImpact = {
        component: parsed.component,
        css_bytes: parsed.css_bytes,
        gzip_bytes: parsed.gzip_bytes,
        usage_count: parsed.usage_count,
        risk_level: parsed.risk_level,
      }

      this.impactMap.set(component, impact)
      return impact
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'calculateImpact', { logOnly: true })
      return {
        component,
        css_bytes: 0,
        gzip_bytes: 0,
        usage_count: 0,
        risk_level: 'low',
      }
    }
  }

  /**
   * Calculate risk level for component
   * 
   * Calls Rust function: {@link calculate_risk}
   * Calculates risk of removing a class
   */
  async calculateRisk(component: string): Promise<'low' | 'medium' | 'high'> {
    this.ensureReady()

    try {
      const totalComponents = this.usageMap.size
      const result = calculate_risk(component, totalComponents)
      const parsed = JSON.parse(result)
      return parsed.risk_level || 'low'
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'calculateRisk', { logOnly: true })
      return 'low'
    }
  }

  /**
   * Calculate potential savings from removing component
   * 
   * Calls Rust function: {@link calculate_savings}
   * Calculates bundle savings from optimization
   */
  async calculateSavings(component: string): Promise<number> {
    this.ensureReady()

    try {
      const impact = this.impactMap.get(component)
      const bundleSize = Array.from(this.impactMap.values()).reduce((sum, i) => sum + i.css_bytes, 0)
      const componentCount = this.usageMap.size

      const result = calculate_savings(bundleSize, componentCount)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'calculateSavings', { logOnly: true })
      return 0
    }
  }

  /**
   * Identify unused components
   */
  async identifyUnused(): Promise<string[]> {
    this.ensureReady()

    try {
      // Stub: Will call identifyUnused() Rust function
      // For now, return empty list - in real implementation would check against all possible classes
      return []
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'identifyUnused', { logOnly: true })
      return []
    }
  }

  /**
   * Build component dependency graph
   */
  async buildDependencyGraph(
    sourceFiles: Array<{ path: string; content: string }>
  ): Promise<Map<string, ComponentDependency>> {
    this.ensureReady()

    try {
      // Stub: Will call buildDependencyGraph() Rust function
      this.dependencyGraph.clear()

      // Initialize nodes
      for (const [component] of this.usageMap) {
        if (!this.dependencyGraph.has(component)) {
          this.dependencyGraph.set(component, {
            component,
            dependencies: [],
            dependents: [],
          })
        }
      }

      return new Map(this.dependencyGraph)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'buildDependencyGraph')
      throw error
    }
  }

  /**
   * Generate analysis report
   */
  async generateReport(): Promise<AnalysisReport> {
    this.ensureReady()

    try {
      // Stub: Will generate full analysis report
      let totalCss = 0
      let totalGzip = 0

      for (const impact of this.impactMap.values()) {
        totalCss += impact.css_bytes
        totalGzip += impact.gzip_bytes
      }

      const unused = await this.identifyUnused()

      return {
        total_components: this.usageMap.size,
        used_components: this.usageMap.size - unused.length,
        unused_components: unused.length,
        total_css_bytes: totalCss,
        total_gzip_bytes: totalGzip,
        components: Array.from(this.usageMap.values()),
        dependencies: Array.from(this.dependencyGraph.values()),
        impact: Array.from(this.impactMap.values()),
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'generateReport', { logOnly: true })
      return {
        total_components: 0,
        used_components: 0,
        unused_components: 0,
        total_css_bytes: 0,
        total_gzip_bytes: 0,
        components: [],
        dependencies: [],
        impact: [],
      }
    }
  }

  /**
   * Analyze class usage patterns (Phase 1 - Analysis Function #1)
   *
   * Calls Rust function: {@link analyze_classes}
   * Returns structured analysis of class naming patterns, variants, and prefixes
   */
  async analyzeClasses(classes: string[]): Promise<ClassAnalysisResult> {
    this.ensureReady()

    try {
      return analyze_classes(classes)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'analyzeClasses', { logOnly: true })
      return {
        total: 0,
        unique_prefixes: 0,
        prefixes: [],
        variant_distribution: {},
        error_count: 1,
        errors: [error.message],
      }
    }
  }

  /**
   * Get parsing statistics (Phase 1 - Analysis Function #2)
   *
   * Calls Rust function: {@link get_parse_stats}
   * Returns cache hit/miss rates and parse performance metrics
   */
  async getParseStats(): Promise<ParseStatsResult> {
    this.ensureReady()

    try {
      return get_parse_stats()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getParseStats', { logOnly: true })
      return {
        hits: 0,
        misses: 0,
        total: 0,
        hit_rate: 0,
      }
    }
  }

  /**
   * Clear the parse cache and reset its statistics.
   *
   * Calls Rust function: {@link clear_parse_cache_napi}
   */
  async clearParseCache(): Promise<void> {
    this.ensureReady()

    try {
      clear_parse_cache_napi()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'clearParseCache')
      throw error
    }
  }

  /**
   * Get cache statistics (Phase 1 - Analysis Function #3)
   *
   * Calls Rust function: {@link get_cache_stats}
   * Returns detailed cache performance including resolver pool stats
   */
  async getCacheStats(): Promise<CacheStatsResult> {
    this.ensureReady()

    try {
      return get_cache_stats()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getCacheStats', { logOnly: true })
      return {
        status: 'ok',
        data: {
          total_hits: 0,
          total_misses: 0,
          hit_rate: 0,
          cache_backends: {},
          theme_resolver_pool: {
            hits: 0,
            misses: 0,
            total: 0,
            hit_rate: 0,
            cached_resolvers: 0,
          },
        },
      }
    }
  }

  /**
   * Get recommended cache configuration (Phase 1 - Analysis Function #4)
   *
   * Calls Rust function: {@link get_recommended_cache_config}
   * Returns optimal cache settings based on workload type (build|dev|test|production)
   */
  async getRecommendations(workloadType: 'build' | 'dev' | 'test' | 'production' = 'build'): Promise<RecommendedCacheConfig> {
    this.ensureReady()

    try {
      return get_recommended_cache_config(workloadType)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getRecommendations', { logOnly: true })
      return {
        parse_cache_size: 1000,
        resolve_cache_size: 500,
        compile_cache_size: 1000,
        css_gen_cache_size: 500,
        recommended_eviction_policy: 'lru',
        ttl_seconds: 3600,
        expected_hit_rate_percent: 75,
      }
    }
  }

  /**
   * Get cache optimization hints (Phase 1 - Analysis Function #5)
   *
   * Calls Rust function: {@link get_cache_optimization_hints}
   * Returns optimization recommendations and estimated improvements
   */
  async getOptimizationHints(): Promise<CacheOptimizationHintsResult> {
    this.ensureReady()

    try {
      return get_cache_optimization_hints()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getOptimizationHints', { logOnly: true })
      return {
        current_strategy: 'lru',
        recommended_strategy: 'adaptive',
        estimated_improvement_percent: 0,
        suggested_memory_mb: 256,
        notes: ['Unable to compute hints at this time'],
      }
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    total_tracked: number
    most_used: string | null
    least_used: string | null
  } {
    if (this.usageMap.size === 0) {
      return { total_tracked: 0, most_used: null, least_used: null }
    }

    let mostUsed = Array.from(this.usageMap.values())[0]
    let leastUsed = mostUsed

    for (const usage of this.usageMap.values()) {
      if (usage.occurrence_count > mostUsed.occurrence_count) {
        mostUsed = usage
      }
      if (usage.occurrence_count < leastUsed.occurrence_count) {
        leastUsed = usage
      }
    }

    return {
      total_tracked: this.usageMap.size,
      most_used: mostUsed.component,
      least_used: leastUsed.component,
    }
  }

  // ── NEW: Rust-integrated diagnostics functions ────────────────────────────

  /**
   * Get Week 6 feature status and memory pressure
   *
   * Calls Rust function: getWeek6OptimizationStatus (week6_api.rs)
   * Returns feature flags, optimization level, and memory pressure
   */
  async getFeatureStatus(): Promise<Week6StatusResult> {
    this.ensureReady()

    try {
      return get_week6_optimization_status()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getFeatureStatus', { logOnly: true })
      return {
        features_enabled: [],
        optimization_level: 'unknown',
        memory_pressure: 'low',
      }
    }
  }

  /**
   * Get memory usage statistics and predictions
   *
   * Calls Rust function: predictMemoryUsage (week6_api.rs)
   * Returns predicted memory usage for current class set
   */
  async getMemoryStats(): Promise<{
    predicted_bytes: number
    tracked_components: number
    estimated_overhead_bytes: number
  }> {
    this.ensureReady()

    try {
      const classCount = this.usageMap.size || 100
      const avgClassSize = 24 // approximate average class name bytes
      const predictedBytes = predict_memory_usage(classCount, avgClassSize)

      return {
        predicted_bytes: predictedBytes,
        tracked_components: this.usageMap.size,
        estimated_overhead_bytes: Math.round(predictedBytes * 0.15), // ~15% overhead
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getMemoryStats', { logOnly: true })
      return {
        predicted_bytes: 0,
        tracked_components: this.usageMap.size,
        estimated_overhead_bytes: 0,
      }
    }
  }

  /**
   * Get optimization recommendations based on current runtime metrics
   *
   * Calls Rust function: getOptimizationRecommendations (week6_api.rs)
   * Returns actionable recommendations for performance improvement
   */
  async getMemoryRecommendations(): Promise<OptimizationRecommendationsResult> {
    this.ensureReady()

    try {
      const memoryMb = process.memoryUsage().heapUsed / (1024 * 1024)
      const classCount = this.usageMap.size || 100

      // Get cache hit rate from parse stats
      let hitRate = 75
      try {
        const parseStats = get_parse_stats()
        hitRate = parseStats.hit_rate || 75
      } catch {
        // Use default hit rate
      }

      return get_optimization_recommendations(hitRate, Math.round(memoryMb), classCount)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getMemoryRecommendations', { logOnly: true })
      return {
        recommendations: ['Unable to compute recommendations at this time'],
        priority: 'low',
        estimated_improvement_percent: 0,
      }
    }
  }

  /**
   * Estimate optimal cache configuration for a workload
   *
   * Calls Rust function: estimateOptimalBatchSize (week6_api.rs)
   * Returns optimal batch size and cache settings based on constraints
   */
  async estimateOptimalCacheConfig(workloadType: 'build' | 'dev' | 'test' | 'production' = 'build'): Promise<{
    recommended_config: RecommendedCacheConfig
    optimal_batch_size: number
    streaming_batch_size: StreamingBatchSizeResult | null
    caching_strategy: CachingStrategyResult | null
  }> {
    this.ensureReady()

    try {
      const recommendedConfig = get_recommended_cache_config(workloadType)

      const memoryMb = process.memoryUsage().heapUsed / (1024 * 1024)
      const availableMemory = Math.max(256, Math.round(2048 - memoryMb))
      const classCount = this.usageMap.size || 1000
      const optimalBatchSize = estimate_optimal_batch_size(classCount, availableMemory)

      let streamingBatchSize: StreamingBatchSizeResult | null = null
      try {
        streamingBatchSize = estimate_streaming_batch_size(availableMemory)
      } catch {
        // Not available
      }

      let cachingStrategy: CachingStrategyResult | null = null
      try {
        const isSsr = workloadType === 'production'
        cachingStrategy = recommend_caching_strategy(isSsr, availableMemory)
      } catch {
        // Not available
      }

      return {
        recommended_config: recommendedConfig,
        optimal_batch_size: optimalBatchSize,
        streaming_batch_size: streamingBatchSize,
        caching_strategy: cachingStrategy,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'estimateOptimalCacheConfig', { logOnly: true })
      return {
        recommended_config: await this.getRecommendations(workloadType),
        optimal_batch_size: 100,
        streaming_batch_size: null,
        caching_strategy: null,
      }
    }
  }

  /**
   * Configure cache backend strategy
   *
   * Calls Rust function: configureCacheBackend (napi_bridge_cache.rs)
   * Sets the active cache strategy (lru, redis, persistent, adaptive)
   */
  configureCacheBackend(config: {
    backend: 'lru' | 'redis' | 'persistent' | 'adaptive'
    max_capacity?: number
    redis_url?: string
    persist_dir?: string
  }): { status: string; backend: string } {
    try {
      return configure_cache_backend(config)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'configureCacheBackend', { logOnly: true })
      return { status: 'error', backend: config.backend }
    }
  }

  /**
   * Clear all native Rust caches
   *
   * Calls Rust function: clearAllCachesNapi (napi_bridge_cache.rs)
   * Clears: parse cache, resolve cache, compile cache, css-gen cache
   */
  clearAllNativeCaches(): void {
    try {
      clear_all_caches_napi()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'clearAllNativeCaches', { logOnly: true })
    }
  }

  /**
   * Clear and reset the Rust resolver pool
   *
   * Calls Rust function: clearResolverPool (napi_bridge_cache.rs)
   * Frees memory used by cached theme resolvers
   */
  clearResolverPool(): { status: string } {
    try {
      return clear_resolver_pool()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'clearResolverPool', { logOnly: true })
      return { status: 'error' }
    }
  }

  /**
   * Get Week 6 features status
   *
   * Calls Rust function: getWeek6FeaturesStatus (napi_bridge_analysis.rs)
   */
  async getWeek6FeaturesStatus(): Promise<Week6FeaturesStatusResult> {
    this.ensureReady()
    try {
      return get_week6_features_status()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getWeek6FeaturesStatus')
      throw error
    }
  }

  /**
   * Get current memory statistics from Rust memory profiler
   *
   * Calls Rust function: getMemoryStatsNative (napi_bridge_analysis.rs)
   */
  async getMemoryStatsNative(): Promise<MemoryStatsResult> {
    this.ensureReady()
    try {
      return get_memory_stats_native()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getMemoryStatsNative')
      throw error
    }
  }

  /**
   * Get memory optimization recommendations
   *
   * Calls Rust function: getMemoryRecommendationsNative (napi_bridge_analysis.rs)
   */
  async getMemoryRecommendationsNative(): Promise<MemoryRecommendationsResult> {
    this.ensureReady()
    try {
      return get_memory_recommendations_native()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getMemoryRecommendationsNative')
      throw error
    }
  }

  /**
   * Estimate optimal cache configuration from the analysis perspective
   *
   * Calls Rust function: estimateOptimalCacheConfigNative (napi_bridge_analysis.rs)
   */
  async estimateOptimalCacheConfigNative(workloadType: string, expectedEntries: number): Promise<OptimalCacheConfigResult> {
    this.ensureReady()
    try {
      return estimate_optimal_cache_config_native(workloadType, expectedEntries)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'estimateOptimalCacheConfigNative')
      throw error
    }
  }

  /**
   * Reset native memory statistics counters
   *
   * Calls Rust function: resetMemoryStats (napi_bridge_analysis.rs)
   */
  async resetMemoryStats(): Promise<void> {
    this.ensureReady()
    try {
      reset_memory_stats()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'resetMemoryStats')
      throw error
    }
  }

  /**
   * Reset internal state
   */
  async reset(): Promise<void> {
    this.usageMap.clear()
    this.dependencyGraph.clear()
    this.impactMap.clear()
  }

  protected async onInitialize(): Promise<void> {
    // Analysis-specific initialization
  }

  protected async onShutdown(): Promise<void> {
    // Cleanup
    this.usageMap.clear()
    this.dependencyGraph.clear()
    this.impactMap.clear()
  }
}
