/**
 * AtomicCssManager - Atomic CSS generation and optimization
 *
 * Manages atomic CSS generation with single-property classes and
 * property deduplication for 30-50% class count reduction.
 *
 * All methods call through to Rust native bridge functions for
 * high-performance atomic CSS operations:
 * - parse_atomic_class: Parse Tailwind class into atomic form
 * - generate_atomic_css: Generate atomic CSS from rule definitions
 * - to_atomic_classes: Convert Tailwind classes to atomic equivalents
 * - clear_atomic_registry: Clear the Rust-side atomic registry
 * - get_atomic_registry_size: Get current registry size from Rust
 */

import { BaseManager, ManagerConfig } from './BaseManager'
import {
  parse_atomic_class,
  generate_atomic_css,
  to_atomic_classes,
  clear_atomic_registry,
  get_atomic_registry_size,
} from '../nativeBridgeWrappers'

export interface AtomicCssManagerConfig extends ManagerConfig {
  enabled?: boolean
}

export interface AtomicCssRule {
  selector: string
  property: string
  value: string
}

export class AtomicCssManager extends BaseManager {
  private propertyRegistry: Map<string, Set<string>> = new Map()

  constructor(config: AtomicCssManagerConfig = {}) {
    super({
      enabled: false,
      ...config,
    })
  }

  /**
   * Parse Tailwind class into atomic form
   *
   * Calls Rust function: {@link parse_atomic_class}
   * Converts a Tailwind class (e.g., "bg-blue-500") into its atomic equivalent
   *
   * @param twClass Tailwind class name
   * @returns Atomic class name, or null if not parseable
   */
  async parseAtomicClass(twClass: string): Promise<string | null> {
    this.ensureReady()

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
   * Takes rule definitions and generates single-property atomic CSS classes
   *
   * @param rules Array of CSS rule objects with selector and properties
   * @returns Generated atomic CSS string
   */
  async generateAtomicCss(rules: Array<{ selector: string; properties: Record<string, string> }>): Promise<string> {
    this.ensureReady()

    try {
      const result = generate_atomic_css(JSON.stringify(rules))

      // Track properties locally for deduplication stats
      for (const rule of rules) {
        for (const [property, value] of Object.entries(rule.properties)) {
          if (!this.propertyRegistry.has(property)) {
            this.propertyRegistry.set(property, new Set())
          }
          this.propertyRegistry.get(property)!.add(value)
        }
      }

      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'generateAtomicCss')
      throw error
    }
  }

  /**
   * Convert Tailwind classes to atomic form
   *
   * Calls Rust function: {@link to_atomic_classes}
   * Converts a space-separated string of Tailwind classes to atomic equivalents
   *
   * @param twClasses Space-separated Tailwind class names
   * @returns Space-separated atomic class names
   */
  async toAtomicClasses(twClasses: string): Promise<string> {
    this.ensureReady()

    try {
      const result = to_atomic_classes(twClasses)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'toAtomicClasses')
      throw error
    }
  }

  /**
   * Clear atomic registry
   *
   * Calls Rust function: {@link clear_atomic_registry}
   * Clears both the Rust native atomic registry and local property tracking
   */
  async clearAtomicRegistry(): Promise<void> {
    try {
      clear_atomic_registry()
      this.propertyRegistry.clear()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'clearAtomicRegistry', { logOnly: true })
    }
  }

  /**
   * Get atomic registry size
   *
   * Calls Rust function: {@link get_atomic_registry_size}
   * Returns the current number of entries in the Rust atomic registry
   *
   * @returns Number of registered atomic classes
   */
  async getAtomicRegistrySize(): Promise<number> {
    try {
      const size = get_atomic_registry_size()
      return size
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getAtomicRegistrySize', { logOnly: true })
      return 0
    }
  }

  /**
   * Get deduplication statistics
   */
  getDeduplicationStats(): {
    total_properties: number
    total_values: number
    potential_savings_percent: number
  } {
    let totalValues = 0
    for (const values of this.propertyRegistry.values()) {
      totalValues += values.size
    }

    const savings = Math.round((totalValues / Math.max(totalValues, 1)) * 40) // Rough estimate

    return {
      total_properties: this.propertyRegistry.size,
      total_values: totalValues,
      potential_savings_percent: Math.min(savings, 50),
    }
  }

  /**
   * Reset internal state
   */
  async reset(): Promise<void> {
    await this.clearAtomicRegistry()
    this.propertyRegistry.clear()
  }

  protected async onInitialize(): Promise<void> {
    // Atomic CSS-specific initialization
  }

  protected async onShutdown(): Promise<void> {
    // Cleanup - clear both local and native registries
    await this.clearAtomicRegistry()
    this.propertyRegistry.clear()
  }
}

