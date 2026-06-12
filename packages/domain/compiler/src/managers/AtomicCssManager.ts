/**
 * AtomicCssManager - Atomic CSS generation and optimization
 *
 * Manages atomic CSS generation with single-property classes and
 * property deduplication for 30-50% class count reduction.
 */

import { BaseManager, ManagerConfig } from './BaseManager'

export interface AtomicCssManagerConfig extends ManagerConfig {
  enabled?: boolean
}

export interface AtomicCssRule {
  selector: string
  property: string
  value: string
}

export class AtomicCssManager extends BaseManager {
  private atomicRegistry: Map<string, AtomicCssRule> = new Map()
  private propertyRegistry: Map<string, Set<string>> = new Map()

  constructor(config: AtomicCssManagerConfig = {}) {
    super({
      enabled: false,
      ...config,
    })
  }

  /**
   * Parse Tailwind class into atomic form
   */
  async parseAtomicClass(twClass: string): Promise<string | null> {
    this.ensureReady()

    try {
      // Stub: Will call parseAtomicClass() Rust function
      // Simple parsing: split on - and map to property/value
      const parts = twClass.split('-')
      if (parts.length < 2) return null

      // Generate atomic class name
      const atomicClass = `_${this.hashString(twClass).substring(0, 8)}`
      return atomicClass
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'parseAtomicClass', { logOnly: true })
      return null
    }
  }

  /**
   * Generate atomic CSS from rules
   */
  async generateAtomicCss(rules: Array<{ selector: string; properties: Record<string, string> }>): Promise<string> {
    this.ensureReady()

    try {
      // Stub: Will call generateAtomicCss() Rust function
      const css: string[] = []

      for (const rule of rules) {
        for (const [property, value] of Object.entries(rule.properties)) {
          const atomicClass = `_${this.hashString(`${property}-${value}`).substring(0, 8)}`
          css.push(`.${atomicClass} { ${property}: ${value}; }`)

          // Track in registry
          if (!this.propertyRegistry.has(property)) {
            this.propertyRegistry.set(property, new Set())
          }
          this.propertyRegistry.get(property)!.add(value)
        }
      }

      return css.join('\n')
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'generateAtomicCss')
      throw error
    }
  }

  /**
   * Convert Tailwind classes to atomic form
   */
  async toAtomicClasses(twClasses: string): Promise<string> {
    this.ensureReady()

    try {
      // Stub: Will call toAtomicClasses() Rust function
      const classes = twClasses.split(/\s+/)
      const atomicClasses: string[] = []

      for (const twClass of classes) {
        if (twClass) {
          const atomic = await this.parseAtomicClass(twClass)
          if (atomic) {
            atomicClasses.push(atomic)
          }
        }
      }

      return atomicClasses.join(' ')
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'toAtomicClasses')
      throw error
    }
  }

  /**
   * Clear atomic registry
   */
  async clearAtomicRegistry(): Promise<void> {
    try {
      // Stub: Will call clearAtomicRegistry() Rust function
      this.atomicRegistry.clear()
      this.propertyRegistry.clear()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'clearAtomicRegistry', { logOnly: true })
    }
  }

  /**
   * Get atomic registry size
   */
  async getAtomicRegistrySize(): Promise<number> {
    try {
      // Stub: Will call getAtomicRegistrySize() Rust function
      return this.atomicRegistry.size
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getAtomicRegistrySize', { logOnly: true })
      return this.atomicRegistry.size
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
   * Simple hash function
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Reset internal state
   */
  async reset(): Promise<void> {
    this.atomicRegistry.clear()
    this.propertyRegistry.clear()
  }

  protected async onInitialize(): Promise<void> {
    // Atomic CSS-specific initialization
  }

  protected async onShutdown(): Promise<void> {
    // Cleanup
    this.atomicRegistry.clear()
    this.propertyRegistry.clear()
  }
}
