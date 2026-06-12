/**
 * OptimizationManager - CSS optimization and dead code elimination
 *
 * Manages dead code detection, CSS elimination, and minification via
 * LightningCSS. Integrates Rust functions for optimal performance.
 */

import { BaseManager, ManagerConfig } from './BaseManager'
import {
  detect_dead_code,
  eliminate_dead_css,
  optimize_css,
  process_tailwind_css_lightning,
  process_tailwind_css_with_targets,
  parse_atomic_class,
  generate_atomic_css,
  to_atomic_classes,
  clear_atomic_registry,
  get_atomic_registry_size,
} from '../nativeBridgeWrappers'

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
   * 
   * Calls Rust function: {@link detect_dead_code}
   * Identifies unused rules from generated CSS
   */
  async detectDeadCode(
    scanResult: ScanWorkspaceResult,
    css: string
  ): Promise<DeadCodeAnalysis> {
    this.ensureReady()

    try {
      const analysis = detect_dead_code(JSON.stringify(scanResult), css)
      
      // Map DeadCodeResult to DeadCodeAnalysis
      return {
        dead_in_css: analysis.deadInCss || [],
        dead_in_source: analysis.deadInSource || [],
        live_classes: scanResult.classes || [],
        total_css_classes: (analysis.deadInCss || []).length + (analysis.deadInSource || []).length,
        total_source_classes: scanResult.classes?.length || 0,
        dead_code_percentage: Math.round(
          (((analysis.deadInCss || []).length + (analysis.deadInSource || []).length) / 
            ((analysis.deadInCss || []).length + (analysis.deadInSource || []).length + (scanResult.classes?.length || 1))) * 100
        ) || 0,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'detectDeadCode')
      throw error
    }
  }

  /**
   * Eliminate dead CSS from output
   * 
   * Calls Rust function: {@link eliminate_dead_css}
   * Removes unused rules from CSS output
   */
  async eliminateDeadCss(
    css: string,
    deadClasses: string[]
  ): Promise<string> {
    this.ensureReady()

    try {
      const result = eliminate_dead_css(css, deadClasses)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'eliminateDeadCss')
      throw error
    }
  }

  /**
   * Full optimization pipeline
   * 
   * Calls Rust function: {@link optimize_css}
   * End-to-end optimization including dead code and minification
   */
  async optimizeCss(css: string): Promise<OptimizationResult> {
    this.ensureReady()

    try {
      const originalSize = Buffer.byteLength(css, 'utf-8')
      const optimized = optimize_css(css)
      const optimizedSize = Buffer.byteLength(optimized, 'utf-8')

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
   * 
   * Calls Rust function: {@link process_tailwind_css_lightning}
   * Processes Tailwind CSS with LightningCSS for minification
   */
  async processTailwindCssLightning(css: string): Promise<ProcessedCssResult> {
    this.ensureReady()

    try {
      const result = process_tailwind_css_lightning(css)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'processTailwindCssLightning')
      throw error
    }
  }

  /**
   * Process Tailwind CSS with targets
   * 
   * Calls Rust function: {@link process_tailwind_css_with_targets}
   * Processes Tailwind CSS with targets (for targeted minification)
   */
  async processTailwindCssWithTargets(
    css: string,
    targets?: string
  ): Promise<ProcessedCssResult> {
    this.ensureReady()

    try {
      const result = process_tailwind_css_with_targets(css, targets)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'processTailwindCssWithTargets')
      throw error
    }
  }

  /**
   * Parse Tailwind class into atomic form
   * 
   * Calls Rust function: {@link parse_atomic_class}
   * Parses Tailwind class into atomic form
   */
  parseAtomicClass(twClass: string): string | null {
    try {
      const result = parse_atomic_class(twClass)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'parseAtomicClass', { logOnly: true })
      return null
    }
  }

  /**
   * Generate atomic CSS from rules
   * 
   * Calls Rust function: {@link generate_atomic_css}
   * Generates atomic CSS from rules
   */
  generateAtomicCss(rules: any[]): string {
    try {
      const result = generate_atomic_css(JSON.stringify(rules))
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'generateAtomicCss', { logOnly: true })
      return ''
    }
  }

  /**
   * Convert Tailwind classes to atomic form
   * 
   * Calls Rust function: {@link to_atomic_classes}
   * Converts Tailwind classes to atomic form
   */
  toAtomicClasses(twClasses: string): string {
    try {
      const result = to_atomic_classes(twClasses)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'toAtomicClasses', { logOnly: true })
      return twClasses
    }
  }

  /**
   * Clear atomic CSS registry
   * 
   * Calls Rust function: {@link clear_atomic_registry}
   * Clears atomic CSS registry
   */
  clearAtomicRegistry(): void {
    try {
      clear_atomic_registry()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'clearAtomicRegistry', { logOnly: true })
    }
  }

  /**
   * Get atomic CSS registry size
   * 
   * Calls Rust function: {@link get_atomic_registry_size}
   * Gets atomic CSS registry size
   */
  getAtomicRegistrySize(): number {
    try {
      const result = get_atomic_registry_size()
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getAtomicRegistrySize', { logOnly: true })
      return 0
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
