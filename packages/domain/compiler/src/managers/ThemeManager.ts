/**
 * ThemeManager - Advanced theme resolution orchestration
 *
 * Manages multi-layer theme composition with deterministic variant precedence
 * and efficient theme lookups for < 1ms cached access.
 */

import { BaseManager, ManagerConfig } from './BaseManager'
import {
  resolve_variants,
  validate_variant_config,
  resolve_cascade,
  resolve_class_names,
  resolve_conflict_group,
  resolve_theme_value,
  resolve_simple_variants,
} from '../nativeBridgeWrappers'

export interface ThemeManagerConfig extends ManagerConfig {
  enabled?: boolean
  cacheSize?: number
}

export interface ThemeVariantConfig {
  responsive?: Record<string, string>
  dark?: Record<string, string>
  state?: Record<string, string>
  custom?: Record<string, string>
  [key: string]: unknown
}

export interface SimpleVariantConfig {
  variants: Record<string, string>
  skipNesting?: boolean
}

export enum VariantPrecedence {
  Interaction = 0,
  ColorScheme = 1,
  Responsive = 2,
  State = 3,
  Custom = 4,
}

export interface ResolvedVariant {
  name: string
  precedence: VariantPrecedence
  rules: string[]
}

export interface ResolvedVariants {
  variants: ResolvedVariant[]
  precedenceInfo: {
    interaction: number
    colorScheme: number
    responsive: number
    state: number
    custom: number
  }
}

export interface MergedTheme {
  colors?: Record<string, string>
  spacing?: Record<string, string>
  typography?: Record<string, unknown>
  custom?: Record<string, unknown>
  precedenceOrder: VariantPrecedence[]
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface ThemeConfig {
  colors?: Record<string, string>
  spacing?: Record<string, string>
  typography?: Record<string, unknown>
  [key: string]: unknown
}

export class ThemeManager extends BaseManager {
  private resolvedThemeCache: Map<string, MergedTheme> = new Map()
  private classNameCache: Map<string, string> = new Map()
  private cacheSize: number

  constructor(config: ThemeManagerConfig = {}) {
    super({
      enabled: false,
      cacheSize: 1000,
      ...config,
    })
    this.cacheSize = (config.cacheSize || 1000) as number
  }

  /**
   * Resolve variants from config
   * 
   * Calls Rust function: {@link resolve_variants}
   * Parses variant definitions with precedence information
   */
  async resolveVariants(config: ThemeVariantConfig): Promise<ResolvedVariants> {
    this.ensureReady()

    try {
      const result = resolve_variants(JSON.stringify(config))
      const parsed = JSON.parse(result)
      return parsed
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'resolveVariants')
      throw error
    }
  }

  /**
   * Validate variant config
   * 
   * Calls Rust function: {@link validate_variant_config}
   * Validates variant configuration for errors and warnings
   */
  async validateVariantConfig(config: ThemeVariantConfig): Promise<ValidationResult> {
    this.ensureReady()

    try {
      const result = validate_variant_config(JSON.stringify(config))
      const parsed = JSON.parse(result)
      return parsed
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'validateVariantConfig', { logOnly: true })
      return { valid: false, errors: ['Validation failed'], warnings: [] }
    }
  }

  /**
   * Resolve simple variants
   * 
   * Calls Rust function: {@link resolve_simple_variants}
   * Resolves simple variants (fast path without full config processing)
   */
  async resolveSimpleVariants(config: SimpleVariantConfig): Promise<ResolvedVariants> {
    this.ensureReady()

    try {
      const result = resolve_simple_variants(JSON.stringify(config))
      const parsed = JSON.parse(result)
      return parsed
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'resolveSimpleVariants')
      throw error
    }
  }

  /**
   * Resolve theme cascade
   * 
   * Calls Rust function: {@link resolve_cascade}
   * Resolves theme cascade: merges base with overrides using cascade rules
   */
  async resolveCascade(
    baseTheme: ThemeConfig,
    overrides: ThemeConfig
  ): Promise<MergedTheme> {
    this.ensureReady()

    try {
      const result = resolve_cascade(JSON.stringify(baseTheme), JSON.stringify(overrides))
      const parsed = JSON.parse(result)
      return parsed
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'resolveCascade')
      throw error
    }
  }

  /**
   * Resolve class names to theme values
   * 
   * Calls Rust function: {@link resolve_class_names}
   * Resolves class names to theme values: maps each class to its resolved value
   */
  async resolveClassNames(
    classNames: string[],
    theme: ThemeConfig
  ): Promise<Map<string, string>> {
    this.ensureReady()

    try {
      const result = resolve_class_names(classNames, JSON.stringify(theme))
      const parsed = JSON.parse(result)
      return new Map(Object.entries(parsed))
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'resolveClassNames')
      throw error
    }
  }

  /**
   * Resolve single theme value
   * 
   * Calls Rust function: {@link resolve_theme_value}
   * Resolves single theme value by key path (e.g., "colors.blue.600")
   */
  async resolveThemeValue(keyPath: string, theme: ThemeConfig): Promise<string | null> {
    this.ensureReady()

    try {
      const result = resolve_theme_value(keyPath, JSON.stringify(theme))
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'resolveThemeValue', { logOnly: true })
      return null
    }
  }

  /**
   * Resolve conflict group
   * 
   * Calls Rust function: {@link resolve_conflict_group}
   * Resolves conflict group: gets all classes in a conflict group (e.g., "colors")
   */
  async resolveConflictGroup(
    groupName: string,
    theme: ThemeConfig
  ): Promise<string[]> {
    this.ensureReady()

    try {
      const result = resolve_conflict_group(groupName, JSON.stringify(theme))
      const parsed = JSON.parse(result)
      return parsed
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'resolveConflictGroup', { logOnly: true })
      return []
    }
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    return Math.round(
      ((this.resolvedThemeCache.size + this.classNameCache.size) / (this.cacheSize * 2)) * 100
    )
  }

  /**
   * Clear caches
   */
  clearCaches(): void {
    this.resolvedThemeCache.clear()
    this.classNameCache.clear()
  }

  /**
   * Reset internal state
   */
  async reset(): Promise<void> {
    this.clearCaches()
  }

  protected async onInitialize(): Promise<void> {
    // Theme-specific initialization
  }

  protected async onShutdown(): Promise<void> {
    // Cleanup
    this.clearCaches()
  }
}
