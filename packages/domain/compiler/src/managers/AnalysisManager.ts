/**
 * AnalysisManager - Component analysis and usage tracking
 *
 * Manages component usage analytics, dependency tracking, and impact analysis
 * for optimization decisions and bundle impact tracking.
 */

import { BaseManager, ManagerConfig } from './BaseManager'
import {
  analyze_class_usage,
  calculate_impact,
  calculate_risk,
  calculate_savings,
  analyze_classes,
  get_parse_stats,
  get_cache_stats,
  get_recommended_cache_config,
  get_cache_optimization_hints,
  type ClassAnalysisResult,
  type ParseStatsResult,
  type CacheStatsResult,
  type RecommendedCacheConfig,
  type CacheOptimizationHintsResult,
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
