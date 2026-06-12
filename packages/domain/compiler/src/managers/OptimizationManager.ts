/**
 * OptimizationManager - CSS optimization and dead code elimination
 *
 * Manages dead code detection, CSS elimination, and minification via
 * LightningCSS. Currently provides stub implementations - actual Rust
 * function calls added in Task 21+.
 */

import { BaseManager, ManagerConfig } from './BaseManager'

export interface OptimizationManagerConfig extends ManagerConfig {
  enabled?: boolean
}

export interface DeadCodeAnalysis {
  dead_in_css: string[]
  dead_in_source: string[]
  live_classes: string[]
  total_css_classes: number
  total_source_classes: number
  dead_code_percentage: number
}

export interface OptimizationResult {
  success: boolean
  original_size_bytes: number
  optimized_size_bytes: number
  reduction_percent: number
  dead_classes_removed: number
  rules_removed: number
  minification_savings_percent: number
}

export interface ProcessedCssResult {
  css: string
  size_bytes: number
  resolved_classes: string[]
  unknown_classes: string[]
}

export interface ScanWorkspaceResult {
  files: string[]
  total_files: number
  classes: string[]
  unique_classes: number
  duration_ms: number
  errors: string[]
}

export class OptimizationManager extends BaseManager {
  private lastOptimizationResult: OptimizationResult | null = null

  constructor(config: OptimizationManagerConfig = {}) {
    super({
      enabled: false,
      ...config,
    })
  }

  /**
   * Detect dead code in CSS
   */
  async detectDeadCode(
    scanResult: ScanWorkspaceResult,
    css: string
  ): Promise<DeadCodeAnalysis> {
    this.ensureReady()

    try {
      // Stub: Will call detectDeadCode() in Task 21
      const sourceClasses = new Set(scanResult.classes)
      const cssClasses = this.extractCssClasses(css)
      const deadInCss = Array.from(cssClasses).filter(c => !sourceClasses.has(c))

      return {
        dead_in_css: deadInCss,
        dead_in_source: [],
        live_classes: Array.from(sourceClasses),
        total_css_classes: cssClasses.size,
        total_source_classes: sourceClasses.size,
        dead_code_percentage: Math.round(
          (deadInCss.length / cssClasses.size) * 100 || 0
        ),
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'detectDeadCode')
      throw error
    }
  }

  /**
   * Eliminate dead CSS from output
   */
  async eliminateDeadCss(
    css: string,
    deadClasses: string[]
  ): Promise<string> {
    this.ensureReady()

    try {
      // Stub: Will call eliminateDeadCss() in Task 21
      const deadSet = new Set(deadClasses)
      const lines = css.split('\n')
      const result: string[] = []
      let inDeadRule = false

      for (const line of lines) {
        let isDeadLine = false

        // Check if line contains any dead classes
        for (const deadClass of deadClasses) {
          if (line.includes(`.${deadClass}`) || line.includes(`\\${deadClass.replace(/\\/g, '\\\\')}`)) {
            isDeadLine = true
            break
          }
        }

        if (!isDeadLine) {
          result.push(line)
        }
      }

      return result.join('\n')
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'eliminateDeadCss')
      throw error
    }
  }

  /**
   * Full optimization pipeline
   */
  async optimizeCss(css: string): Promise<OptimizationResult> {
    this.ensureReady()

    try {
      // Stub: Will call optimizeCss() in Task 21
      const originalSize = Buffer.byteLength(css, 'utf-8')

      // Stub minification (just remove whitespace)
      const minified = css
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,])\s*/g, '$1')

      const optimizedSize = Buffer.byteLength(minified, 'utf-8')

      const result: OptimizationResult = {
        success: true,
        original_size_bytes: originalSize,
        optimized_size_bytes: optimizedSize,
        reduction_percent: Math.round(
          ((originalSize - optimizedSize) / originalSize) * 100 || 0
        ),
        dead_classes_removed: 0,
        rules_removed: 0,
        minification_savings_percent: Math.round(
          ((originalSize - optimizedSize) / originalSize) * 100 || 0
        ),
      }

      this.lastOptimizationResult = result
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'optimizeCss')
      throw error
    }
  }

  /**
   * Process Tailwind CSS with LightningCSS
   */
  async processTailwindCssLightning(css: string): Promise<ProcessedCssResult> {
    this.ensureReady()

    try {
      // Stub: Will call processTailwindCssLightning() in Task 21
      return {
        css,
        size_bytes: Buffer.byteLength(css, 'utf-8'),
        resolved_classes: [],
        unknown_classes: [],
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'processTailwindCssLightning')
      throw error
    }
  }

  /**
   * Process Tailwind CSS with targets
   */
  async processTailwindCssWithTargets(
    css: string,
    targets?: string
  ): Promise<ProcessedCssResult> {
    this.ensureReady()

    try {
      // Stub: Will call processTailwindCssWithTargets() in Task 21
      return {
        css,
        size_bytes: Buffer.byteLength(css, 'utf-8'),
        resolved_classes: [],
        unknown_classes: [],
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'processTailwindCssWithTargets')
      throw error
    }
  }

  /**
   * Get last optimization result
   */
  getLastResult(): OptimizationResult | null {
    return this.lastOptimizationResult
  }

  /**
   * Extract CSS class names from CSS string
   */
  private extractCssClasses(css: string): Set<string> {
    const classes = new Set<string>()
    // Simple regex to find class selectors
    const classRegex = /\.[\w-]+/g
    const matches = css.match(classRegex) || []

    for (const match of matches) {
      // Remove the leading dot
      classes.add(match.substring(1))
    }

    return classes
  }

  protected async onInitialize(): Promise<void> {
    // Optimization-specific initialization
  }

  protected async onShutdown(): Promise<void> {
    // Clean up
    this.lastOptimizationResult = null
  }
}
