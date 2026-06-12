/**
 * Theme Resolution & Advanced Composition Type Definitions
 * 
 * Comprehensive type definitions for multi-layer theme composition, variant resolution,
 * and theme value lookups with caching.
 * 
 * Requirement 5: Theme Resolution & Advanced Composition
 * 7 Rust functions exposed via NativeBridge
 */

// =============================================================================
// VARIANT DEFINITIONS & PRECEDENCE
// =============================================================================

export enum VariantPrecedence {
  Interaction = 0,      // group:, peer:
  ColorScheme = 1,      // dark:, light:
  Responsive = 2,       // sm:, md:, lg:, xl:
  State = 3,            // hover:, focus:, active:, disabled:
  Custom = 4            // User-defined variants
}

export interface Variant {
  readonly name: string
  readonly precedence: VariantPrecedence
  readonly selector_pattern: string
  readonly media_query?: string
  readonly supports_query?: string
  readonly container_query?: string
}

export interface VariantConfig {
  readonly responsive?: Record<string, string>
  readonly dark?: Record<string, string>
  readonly light?: Record<string, string>
  readonly state?: Record<string, Record<string, string>>
  readonly interaction?: Record<string, string>
  readonly custom?: Record<string, string>
}

export interface SimpleVariantConfig {
  readonly variants: Record<string, string>
  readonly skipNesting?: boolean
  readonly separator?: string
}

export interface ResolvedVariants {
  readonly variants: Variant[]
  readonly precedenceInfo: {
    readonly interaction: number
    readonly colorScheme: number
    readonly responsive: number
    readonly state: number
    readonly custom: number
  }
  readonly resolved_at: number
}

export interface VariantResolutionResult {
  readonly success: boolean
  readonly variants: ResolvedVariants
  readonly resolution_time_ms: number
  readonly errors?: string[]
  readonly warnings?: string[]
}

// =============================================================================
// VARIANT VALIDATION
// =============================================================================

export interface ValidationError {
  readonly path: string
  readonly message: string
  readonly severity: 'error' | 'warning'
}

export interface ValidationResult {
  readonly valid: boolean
  readonly errors: ValidationError[]
  readonly warnings: ValidationError[]
  readonly validated_at: number
}

// =============================================================================
// THEME CONFIGURATION
// =============================================================================

export interface ThemeTokens {
  readonly colors?: Record<string, string | Record<string, string>>
  readonly spacing?: Record<string, string>
  readonly fontSize?: Record<string, string | [string, string]>
  readonly fontFamily?: Record<string, string>
  readonly fontWeight?: Record<string, number | string>
  readonly borderRadius?: Record<string, string>
  readonly boxShadow?: Record<string, string>
  readonly zIndex?: Record<string, string | number>
  readonly opacity?: Record<string, string>
  readonly transition?: Record<string, string>
  readonly animation?: Record<string, string>
  readonly custom?: Record<string, unknown>
}

export interface ThemeConfig {
  readonly tokens: ThemeTokens
  readonly extend?: ThemeTokens
  readonly variants?: VariantConfig
  readonly corePlugins?: Record<string, boolean>
}

// =============================================================================
// THEME RESOLUTION
// =============================================================================

export interface MergedTheme {
  readonly tokens: ThemeTokens
  readonly variants: VariantConfig
  readonly precedenceOrder: VariantPrecedence[]
  readonly sources: string[]  // Which layers contributed
  readonly merged_at: number
}

export interface ThemeCascadeResult {
  readonly success: boolean
  readonly merged_theme: MergedTheme
  readonly base_source: string
  readonly override_sources: string[]
  readonly cascade_time_ms: number
  readonly conflicts_resolved: number
}

export interface ThemeLookupResult {
  readonly key_path: string
  readonly value: string | null
  readonly found: boolean
  readonly resolved_from: string  // Which layer provided the value
  readonly type: 'color' | 'spacing' | 'typography' | 'other'
}

export interface ThemeLookupBatch {
  readonly lookups: ThemeLookupResult[]
  readonly total_lookups: number
  readonly successful_lookups: number
  readonly batch_time_ms: number
  readonly cache_hits: number
}

// =============================================================================
// CLASS NAME RESOLUTION
// =============================================================================

export interface ClassNameResolution {
  readonly class_name: string
  readonly resolved_value: string | null
  readonly found: boolean
  readonly matches: Array<{
    readonly property: string
    readonly value: string
    readonly from_theme: string
  }>
}

export interface ClassNameResolutionResult {
  readonly class_names: ClassNameResolution[]
  readonly total_classes: number
  readonly resolved_classes: number
  readonly unresolved_classes: string[]
  readonly resolution_time_ms: number
}

// =============================================================================
// CONFLICT GROUPS
// =============================================================================

export interface ConflictGroup {
  readonly name: string
  readonly description: string
  readonly classes: string[]
  readonly class_count: number
}

export interface ConflictGroupResolution {
  readonly success: boolean
  readonly group_name: string
  readonly group: ConflictGroup
  readonly resolution_time_ms: number
}

// =============================================================================
// THEME CACHING
// =============================================================================

export interface ThemeCacheEntry {
  readonly key: string
  readonly resolved_value: string | null
  readonly created_at: number
  readonly last_accessed: number
  readonly hit_count: number
  readonly ttl_seconds: number
}

export interface ThemeCacheStats {
  readonly entries: number
  readonly total_memory_kb: number
  readonly hit_count: number
  readonly miss_count: number
  readonly hit_rate_percent: number
  readonly evicted_entries: number
  readonly oldest_entry_age_ms: number
}

export interface ThemeCacheInvalidation {
  readonly reason: 'config_change' | 'theme_change' | 'manual' | 'ttl_expired'
  readonly keys_invalidated: number
  readonly invalidated_at: number
}

// =============================================================================
// CIRCULAR DEPENDENCY DETECTION
// =============================================================================

export interface CircularDependency {
  readonly cycle_path: string[]
  readonly involved_themes: string[]
  readonly detected_at: number
}

export interface CircularDependencyCheck {
  readonly has_cycles: boolean
  readonly cycles: CircularDependency[]
  readonly check_time_ms: number
}

// =============================================================================
// THEME EXTENSION & COMPOSITION
// =============================================================================

export interface ExtensionResult {
  readonly success: boolean
  readonly extended_theme: ThemeConfig
  readonly base_tokens: number
  readonly added_tokens: number
  readonly overridden_tokens: number
}

export interface CompositionResult {
  readonly success: boolean
  readonly final_theme: MergedTheme
  readonly layer_count: number
  readonly resolution_order: string[]
  readonly composition_time_ms: number
}

// =============================================================================
// THEME DIAGNOSTICS
// =============================================================================

export interface ThemeDiagnostics {
  readonly has_errors: boolean
  readonly errors: string[]
  readonly warnings: string[]
  readonly unused_tokens: string[]
  readonly duplicate_keys: string[]
  readonly total_tokens: number
  readonly token_coverage_percent: number
  readonly recommendations: string[]
}

// =============================================================================
// THEME MANAGER INTERFACE
// =============================================================================

export interface ThemeManager {
  // Variant Resolution
  resolveVariants(config: VariantConfig): Promise<VariantResolutionResult>
  resolveSimpleVariants(config: SimpleVariantConfig): Promise<VariantResolutionResult>
  validateVariantConfig(config: VariantConfig): Promise<ValidationResult>
  
  // Theme Cascade & Merging
  resolveCascade(
    baseTheme: ThemeConfig,
    overrides: ThemeConfig
  ): Promise<ThemeCascadeResult>
  
  extendTheme(
    baseTheme: ThemeConfig,
    extension: ThemeConfig
  ): Promise<ExtensionResult>
  
  // Value Resolution
  resolveThemeValue(
    keyPath: string,
    theme: ThemeConfig
  ): Promise<ThemeLookupResult>
  
  resolveClassNames(
    classNames: string[],
    theme: ThemeConfig
  ): Promise<ClassNameResolutionResult>
  
  // Conflict Resolution
  resolveConflictGroup(
    groupName: string,
    theme: ThemeConfig
  ): Promise<ConflictGroupResolution>
  
  // Cache Management
  getCacheStats(): Promise<ThemeCacheStats>
  invalidateCache(reason?: string): Promise<ThemeCacheInvalidation>
  clearCache(): Promise<void>
  
  // Diagnostics
  getDiagnostics(theme: ThemeConfig): Promise<ThemeDiagnostics>
  
  // Circular Dependency Detection
  checkCircularDependencies(theme: ThemeConfig): Promise<CircularDependencyCheck>
  
  // Batch Operations
  resolveMultiple(themes: ThemeConfig[]): Promise<CompositionResult[]>
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export const isVariantPrecedence = (value: unknown): value is VariantPrecedence => {
  return Object.values(VariantPrecedence).includes(value as VariantPrecedence)
}

export const isThemeConfig = (value: unknown): value is ThemeConfig => {
  const v = value as Partial<ThemeConfig>
  return (
    (v.tokens === undefined || typeof v.tokens === 'object') &&
    (v.extend === undefined || typeof v.extend === 'object') &&
    (v.variants === undefined || typeof v.variants === 'object')
  )
}

export const isMergedTheme = (value: unknown): value is MergedTheme => {
  const v = value as Partial<MergedTheme>
  return (
    typeof v.tokens === 'object' &&
    Array.isArray(v.precedenceOrder) &&
    Array.isArray(v.sources) &&
    typeof v.merged_at === 'number'
  )
}

export const isThemeLookupResult = (value: unknown): value is ThemeLookupResult => {
  const v = value as Partial<ThemeLookupResult>
  return (
    typeof v.key_path === 'string' &&
    (v.value === null || typeof v.value === 'string') &&
    typeof v.found === 'boolean'
  )
}

export const isClassNameResolution = (value: unknown): value is ClassNameResolution => {
  const v = value as Partial<ClassNameResolution>
  return (
    typeof v.class_name === 'string' &&
    (v.resolved_value === null || typeof v.resolved_value === 'string') &&
    typeof v.found === 'boolean' &&
    Array.isArray(v.matches)
  )
}

export const isValidationResult = (value: unknown): value is ValidationResult => {
  const v = value as Partial<ValidationResult>
  return (
    typeof v.valid === 'boolean' &&
    Array.isArray(v.errors) &&
    Array.isArray(v.warnings)
  )
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates a key path for nested theme lookups
 * @example
 * createKeyPath('colors', 'blue', '600')
 * // Returns: 'colors.blue.600'
 */
export const createKeyPath = (...parts: string[]): string => {
  return parts.join('.')
}

/**
 * Extracts variant name from class (e.g., 'hover:bg-blue-500' → 'hover')
 */
export const extractVariantName = (className: string, separator = ':'): string | null => {
  const index = className.indexOf(separator)
  return index > -1 ? className.substring(0, index) : null
}

/**
 * Gets base class without variant prefix (e.g., 'hover:bg-blue-500' → 'bg-blue-500')
 */
export const getBaseClass = (className: string, separator = ':'): string => {
  const index = className.indexOf(separator)
  return index > -1 ? className.substring(index + separator.length) : className
}

/**
 * Determines cascade precedence between two variants
 */
export const compareVariantPrecedence = (
  v1: VariantPrecedence,
  v2: VariantPrecedence
): number => {
  return v1 - v2  // Lower number = higher precedence
}
