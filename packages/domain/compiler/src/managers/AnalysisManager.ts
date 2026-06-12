/**
 * AnalysisManager - Component analysis and usage tracking
 *
 * Manages component usage analytics, dependency tracking, and impact analysis
 * for optimization decisions and bundle impact tracking.
 */

import { BaseManager, ManagerConfig } from './BaseManager'

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
   */
  async analyzeClassUsage(sourceFiles: Array<{ path: string; content: string }>): Promise<Map<string, ComponentUsage>> {
    this.ensureReady()

    try {
      // Stub: Will call analyzeClassUsage() Rust function
      this.usageMap.clear()

      for (const file of sourceFiles) {
        // Simple regex to extract Tailwind classes
        const classMatches = file.content.match(/\b[\w-]+(?::\S+)?\b/g) || []

        for (const className of classMatches) {
          if (this.usageMap.has(className)) {
            const usage = this.usageMap.get(className)!
            usage.occurrence_count++
            if (!usage.file_locations.includes(file.path)) {
              usage.file_locations.push(file.path)
            }
          } else {
            this.usageMap.set(className, {
              component: className,
              occurrence_count: 1,
              file_locations: [file.path],
              bundle_impact_bytes: 0,
            })
          }
        }
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
   */
  async calculateImpact(component: string, cssRule: string): Promise<ComponentImpact> {
    this.ensureReady()

    try {
      // Stub: Will call calculateImpact() Rust function
      const cssBytes = Buffer.byteLength(cssRule, 'utf-8')
      const gzipBytes = Math.ceil(cssBytes * 0.3) // Rough gzip estimate

      const usage = this.usageMap.get(component)
      const usageCount = usage?.occurrence_count || 0

      let riskLevel: 'low' | 'medium' | 'high' = 'low'
      if (usageCount > 100) {
        riskLevel = 'high'
      } else if (usageCount > 10) {
        riskLevel = 'medium'
      }

      const impact: ComponentImpact = {
        component,
        css_bytes: cssBytes,
        gzip_bytes: gzipBytes,
        usage_count: usageCount,
        risk_level: riskLevel,
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
   */
  async calculateRisk(component: string): Promise<'low' | 'medium' | 'high'> {
    this.ensureReady()

    try {
      // Stub: Will call calculateRisk() Rust function
      const usage = this.usageMap.get(component)
      if (!usage) return 'low'

      if (usage.occurrence_count > 100) return 'high'
      if (usage.occurrence_count > 10) return 'medium'
      return 'low'
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'calculateRisk', { logOnly: true })
      return 'low'
    }
  }

  /**
   * Calculate potential savings from removing component
   */
  async calculateSavings(component: string): Promise<number> {
    this.ensureReady()

    try {
      // Stub: Will call calculateSavings() Rust function
      const impact = this.impactMap.get(component)
      if (!impact) return 0

      return impact.css_bytes
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
