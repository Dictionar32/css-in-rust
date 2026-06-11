/**
 * themeResolutionNative.ts
 *
 * Phase 5.1: Theme Resolution Extended - Advanced theme configuration handling
 * Exposes 7 theme resolution functions for complex Tailwind configurations
 */

import { getNativeBridge } from "./nativeBridge"

/**
 * Validation result for theme config
 */
export interface ThemeValidationResult {
  is_valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

/**
 * Resolved variant configuration
 */
export interface ResolvedVariantConfig {
  variants: string[]
  supported: string[]
  deprecated: string[]
  conflicting: string[]
}

/**
 * Theme cascade resolution result
 */
export interface ThemeCascadeResult {
  base_theme: Record<string, unknown>
  user_overrides: Record<string, unknown>
  merged_theme: Record<string, unknown>
  conflict_resolutions: Array<{
    key: string
    base_value: unknown
    override_value: unknown
    resolution: "override" | "merge" | "error"
  }>
}

/**
 * Class name resolution from theme
 */
export interface ResolvedClassName {
  class_name: string
  property: string
  value: string
  from_theme_path: string
  is_responsive: boolean
  variants: string[]
}

/**
 * Conflict group information
 */
export interface ConflictGroupInfo {
  group_name: string
  conflicting_classes: string[]
  description: string
  resolution_strategy: string
}

/**
 * Get all resolved variants from theme configuration
 * Parses theme config and returns all variant prefixes
 *
 * @param configJson - JSON string of theme configuration
 * @returns Resolved variants with metadata
 *
 * @example
 * ```ts
 * const config = {
 *   screens: { md: '768px', lg: '1024px' },
 *   state: { hover: '&:hover', focus: '&:focus' }
 * }
 * const variants = resolveVariants(JSON.stringify(config))
 * console.log(variants.variants)  // ['md', 'lg', 'hover', 'focus', ...]
 * ```
 */
export function resolveVariants(configJson: string): ResolvedVariantConfig {
  const native = getNativeBridge()
  if (!native?.resolve_variants) throw new Error("resolve_variants not available")
  const resultJson = native.resolve_variants(configJson)
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      variants: [],
      supported: [],
      deprecated: [],
      conflicting: [],
    }
  }
}

/**
 * Validate theme configuration for correctness
 * Checks for common issues and provides warnings
 *
 * @param configJson - JSON string of theme configuration
 * @returns Validation result with errors and suggestions
 *
 * @example
 * ```ts
 * const result = validateThemeConfig(JSON.stringify(myTheme))
 * if (!result.is_valid) {
 *   console.error('Errors:', result.errors)
 *   console.warn('Warnings:', result.warnings)
 * }
 * ```
 */
export function validateThemeConfig(configJson: string): ThemeValidationResult {
  const native = getNativeBridge()
  if (!native?.validate_variant_config) throw new Error("validate_variant_config not available")
  const resultJson = native.validate_variant_config(configJson)
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      is_valid: false,
      errors: ["Unable to parse configuration"],
      warnings: [],
      suggestions: [],
    }
  }
}

/**
 * Resolve theme cascade (base + overrides)
 * Merges base theme with user overrides intelligently
 *
 * @param baseThemeJson - Base theme configuration
 * @param overridesJson - User overrides configuration
 * @returns Merged theme with conflict information
 *
 * @example
 * ```ts
 * const cascade = resolveCascade(
 *   JSON.stringify(baseTheme),
 *   JSON.stringify(userOverrides)
 * )
 * console.log(cascade.merged_theme)
 * console.log('Conflicts resolved:', cascade.conflict_resolutions.length)
 * ```
 */
export function resolveCascade(
  baseThemeJson: string,
  overridesJson: string
): ThemeCascadeResult {
  const native = getNativeBridge()
  if (!native?.resolve_cascade) throw new Error("resolve_cascade not available")
  const resultJson = native.resolve_cascade(baseThemeJson, overridesJson)
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      base_theme: {},
      user_overrides: {},
      merged_theme: {},
      conflict_resolutions: [],
    }
  }
}

/**
 * Resolve class names from theme
 * Maps Tailwind class names to theme values
 *
 * @param classNames - Array of Tailwind class names (e.g., ["text-lg", "bg-blue-600"])
 * @param themeJson - Theme configuration
 * @returns Resolved class name information
 *
 * @example
 * ```ts
 * const resolved = resolveClassNames(
 *   ['text-lg', 'bg-blue-600', 'md:p-4'],
 *   JSON.stringify(theme)
 * )
 * resolved.forEach(item => {
 *   console.log(`${item.class_name} -> ${item.property}: ${item.value}`)
 * })
 * ```
 */
export function resolveClassNames(
  classNames: string[],
  themeJson: string
): ResolvedClassName[] {
  const native = getNativeBridge()
  if (!native?.resolve_class_names) throw new Error("resolve_class_names not available")
  const resultJson = native.resolve_class_names(classNames, themeJson)
  try {
    return JSON.parse(resultJson)
  } catch {
    return []
  }
}

/**
 * Get conflict group information
 * Identifies classes that conflict with each other
 *
 * @param groupName - Conflict group name (e.g., "display", "position", "flex-direction")
 * @param themeJson - Theme configuration
 * @returns Information about the conflict group
 *
 * @example
 * ```ts
 * const info = resolveConflictGroup('display', JSON.stringify(theme))
 * console.log('Conflicting classes:', info.conflicting_classes)
 * console.log('Strategy:', info.resolution_strategy)
 * ```
 */
export function resolveConflictGroup(groupName: string, themeJson: string): ConflictGroupInfo {
  const native = getNativeBridge()
  if (!native?.resolve_conflict_group)
    throw new Error("resolve_conflict_group not available")
  const resultJson = native.resolve_conflict_group(groupName, themeJson)
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      group_name: groupName,
      conflicting_classes: [],
      description: "",
      resolution_strategy: "last-wins",
    }
  }
}

/**
 * Resolve theme value from key path
 * Navigates nested theme config to find values
 *
 * @param keyPath - Dot-separated path (e.g., "colors.blue.600")
 * @param themeJson - Theme configuration
 * @returns Resolved value or null if not found
 *
 * @example
 * ```ts
 * const color = resolveThemeValue('colors.blue.600', JSON.stringify(theme))
 * console.log(color)  // "#2563eb" or similar
 * ```
 */
export function resolveThemeValue(keyPath: string, themeJson: string): string | null {
  const native = getNativeBridge()
  if (!native?.resolve_theme_value) throw new Error("resolve_theme_value not available")
  return native.resolve_theme_value(keyPath, themeJson)
}

/**
 * Get all simple variants from configuration
 * Returns variants that don't require complex selector nesting
 *
 * @param configJson - Theme/variant configuration
 * @returns Array of simple variant names
 *
 * @example
 * ```ts
 * const simpleVariants = resolveSimpleVariants(JSON.stringify(config))
 * console.log(simpleVariants)
 * // ["hover", "focus", "active", "group-hover", ...]
 * ```
 */
export function resolveSimpleVariants(configJson: string): string[] {
  const native = getNativeBridge()
  if (!native?.resolve_simple_variants) throw new Error("resolve_simple_variants not available")
  const resultJson = native.resolve_simple_variants(configJson)
  try {
    return JSON.parse(resultJson)
  } catch {
    return []
  }
}
