/**
 * ID Registry Type Definitions
 * 
 * Comprehensive type definitions for component ID tracking and registry management.
 * Supports: stable ID generation, property/value mapping, serialization, and reproducible builds.
 * 
 * Requirement 3: ID Registry for Component Tracking
 * 16 Rust functions exposed via NativeBridge
 */

// =============================================================================
// BRANDED TYPES FOR TYPE SAFETY
// =============================================================================

export type ComponentID = number & { readonly __brand: 'ComponentID' }
export type PropertyID = number & { readonly __brand: 'PropertyID' }
export type ValueID = number & { readonly __brand: 'ValueID' }
export type RegistryHandle = number & { readonly __brand: 'RegistryHandle' }

export const createComponentID = (id: number): ComponentID => id as ComponentID
export const createPropertyID = (id: number): PropertyID => id as PropertyID
export const createValueID = (id: number): ValueID => id as ValueID
export const createRegistryHandle = (id: number): RegistryHandle => id as RegistryHandle

// =============================================================================
// REGISTRY CREATION & LIFECYCLE
// =============================================================================

export interface RegistryCreationResult {
  readonly handle: RegistryHandle
  readonly created_at: number
  readonly initial_capacity?: number
}

export interface RegistryDestructionResult {
  readonly success: boolean
  readonly handle: RegistryHandle
  readonly entries_cleared: number
}

export interface RegistryResetResult {
  readonly success: boolean
  readonly handle: RegistryHandle
  readonly entries_cleared: number
  readonly next_id: ComponentID
}

// =============================================================================
// ID GENERATION & LOOKUP
// =============================================================================

export interface IDGenerationResult {
  readonly id: ComponentID
  readonly name: string
  readonly is_new: boolean  // true if first time generating for this name
  readonly generated_at: number
}

export interface IDLookupResult {
  readonly id: ComponentID
  readonly name: string
  readonly found: boolean
  readonly created_if_missing?: boolean
}

export interface NextIDResult {
  readonly id: ComponentID
  readonly sequence: number
  readonly timestamp: number
}

// =============================================================================
// PROPERTY & VALUE MAPPING
// =============================================================================

export interface PropertyRegistration {
  readonly property_id: PropertyID
  readonly property_name: string
  readonly registered_at: number
  readonly usage_count: number
}

export interface ValueRegistration {
  readonly value_id: ValueID
  readonly value_name: string
  readonly registered_at: number
  readonly usage_count: number
}

export interface PropertyLookupResult {
  readonly property_id: PropertyID
  readonly property_name: string
  readonly existing: boolean  // true if already registered
}

export interface ValueLookupResult {
  readonly value_id: ValueID
  readonly value_name: string
  readonly existing: boolean  // true if already registered
}

// =============================================================================
// REVERSE LOOKUPS
// =============================================================================

export interface ReverseLookupResult {
  readonly id: PropertyID | ValueID
  readonly name: string
  readonly type: 'property' | 'value'
  readonly found: boolean
}

// =============================================================================
// REGISTRY SNAPSHOTS
// =============================================================================

export interface RegistryEntry<T extends PropertyID | ValueID | ComponentID> {
  readonly id: T
  readonly name: string
  readonly created_at: number
  readonly usage_count?: number
}

export interface RegistrySnapshot {
  readonly handle: RegistryHandle
  readonly timestamp_ms: number
  readonly components: RegistryEntry<ComponentID>[]
  readonly properties: RegistryEntry<PropertyID>[]
  readonly values: RegistryEntry<ValueID>[]
  readonly total_entries: number
  readonly metadata: {
    readonly version: 1
    readonly next_component_id: ComponentID
    readonly next_property_id: PropertyID
    readonly next_value_id: ValueID
  }
}

// =============================================================================
// SERIALIZATION & EXPORT/IMPORT
// =============================================================================

export interface ExportedRegistry {
  readonly version: 1
  readonly exported_at: number
  readonly registry_info: {
    readonly created_at: number
    readonly export_count: number
  }
  readonly components: Array<{
    readonly id: ComponentID
    readonly name: string
    readonly created_at: number
  }>
  readonly properties: Array<{
    readonly id: PropertyID
    readonly name: string
    readonly created_at: number
  }>
  readonly values: Array<{
    readonly id: ValueID
    readonly name: string
    readonly created_at: number
  }>
}

export interface ImportResult {
  readonly success: boolean
  readonly handle: RegistryHandle
  readonly imported_components: number
  readonly imported_properties: number
  readonly imported_values: number
  readonly imported_at: number
  readonly validation_warnings?: string[]
}

export interface ExportResult {
  readonly success: boolean
  readonly handle: RegistryHandle
  readonly data: ExportedRegistry
  readonly serialized_json: string
  readonly json_size_bytes: number
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

export interface BatchComponentRegistration {
  readonly name: string
  readonly create_if_missing?: boolean
}

export interface BatchRegistrationResult {
  readonly registrations: Array<{
    readonly name: string
    readonly id: ComponentID
    readonly created: boolean
  }>
  readonly total_count: number
  readonly new_count: number
}

// =============================================================================
// REGISTRY STATISTICS & MONITORING
// =============================================================================

export interface RegistryStats {
  readonly handle: RegistryHandle
  readonly component_count: number
  readonly property_count: number
  readonly value_count: number
  readonly total_entries: number
  readonly memory_kb: number
  readonly created_at: number
  readonly last_access: number
}

export interface GlobalRegistryStats {
  readonly active_handles: number
  readonly total_components: number
  readonly total_properties: number
  readonly total_values: number
  readonly total_memory_kb: number
}

export interface RegistryUsageStats {
  readonly handle: RegistryHandle
  readonly lookups_performed: number
  readonly cache_hits: number
  readonly cache_misses: number
  readonly hit_rate_percent: number
}

// =============================================================================
// REGISTRY VALIDATION
// =============================================================================

export interface RegistryValidationResult {
  readonly valid: boolean
  readonly handle: RegistryHandle
  readonly errors: string[]
  readonly warnings: string[]
  readonly stats: {
    readonly entries_checked: number
    readonly orphaned_entries: number
    readonly duplicate_entries: number
  }
}

// =============================================================================
// REPRODUCIBILITY GUARANTEE
// =============================================================================

/**
 * Reproducibility contract: ensures that IDs generated for the same names
 * are identical across different processes and builds.
 * 
 * Guarantees:
 * - Same name → same ID (idempotent)
 * - Export → Import → Lookup returns same IDs (deterministic serialization)
 * - Across processes → same IDs (no randomization)
 */
export interface ReproducibilityContract {
  readonly guaranteed: true
  readonly contract_type: 'idempotent' | 'deterministic' | 'portable'
  readonly tested_with_workload: string
  readonly sample_size: number
  readonly all_samples_passed: boolean
}

// =============================================================================
// CONFLICT DETECTION & RESOLUTION
// =============================================================================

export interface IDConflict {
  readonly type: 'duplicate_id' | 'missing_mapping' | 'orphaned_entry'
  readonly details: string
  readonly entity_id: PropertyID | ValueID | ComponentID
  readonly severity: 'warning' | 'error'
}

export interface ConflictResolution {
  readonly conflict_type: string
  readonly resolution_strategy: 'merge' | 'rename' | 'reassign'
  readonly resolved_at: number
  readonly new_id?: PropertyID | ValueID | ComponentID
}

// =============================================================================
// ID REGISTRY MANAGER INTERFACE
// =============================================================================

export interface IDRegistryManager {
  // Registry Lifecycle
  createRegistry(): Promise<RegistryCreationResult>
  destroyRegistry(handle: RegistryHandle): Promise<RegistryDestructionResult>
  resetRegistry(handle: RegistryHandle): Promise<RegistryResetResult>
  
  // ID Generation & Lookup
  generateComponentID(handle: RegistryHandle, name: string): Promise<IDGenerationResult>
  lookupComponentID(handle: RegistryHandle, name: string): Promise<IDLookupResult>
  getNextComponentID(handle: RegistryHandle): Promise<NextIDResult>
  
  // Batch ID Generation
  generateBatch(handle: RegistryHandle, names: string[]): Promise<BatchRegistrationResult>
  
  // Property & Value Mapping
  registerPropertyName(propertyName: string): Promise<PropertyLookupResult>
  registerValueName(valueName: string): Promise<ValueLookupResult>
  
  // String Conversion
  propertyIDToString(propertyID: PropertyID): Promise<string>
  valueIDToString(valueID: ValueID): Promise<string>
  
  // Reverse Lookups
  reverseLookupProperty(propertyID: PropertyID): Promise<string>
  reverseLookupValue(valueID: ValueID): Promise<string>
  
  // Snapshots & Serialization
  snapshot(handle: RegistryHandle): Promise<RegistrySnapshot>
  exportRegistry(handle: RegistryHandle): Promise<ExportResult>
  importRegistry(exportedData: string | ExportedRegistry): Promise<ImportResult>
  
  // Statistics & Monitoring
  getRegistryStats(handle: RegistryHandle): Promise<RegistryStats>
  getGlobalStats(): Promise<GlobalRegistryStats>
  getUsageStats(handle: RegistryHandle): Promise<RegistryUsageStats>
  
  // Validation
  validate(handle: RegistryHandle): Promise<RegistryValidationResult>
  validateAllRegistries(): Promise<RegistryValidationResult[]>
  
  // Metadata
  getActiveCount(): Promise<number>
  listActiveRegistries(): Promise<RegistryHandle[]>
  
  // Reproducibility
  verifyReproducibility(handle: RegistryHandle, testCases: string[]): Promise<ReproducibilityContract>
}

// =============================================================================
// TYPE GUARDS & VALIDATION
// =============================================================================

export const isComponentID = (value: unknown): value is ComponentID => {
  return typeof value === 'number' && value > 0
}

export const isPropertyID = (value: unknown): value is PropertyID => {
  return typeof value === 'number' && value > 0
}

export const isValueID = (value: unknown): value is ValueID => {
  return typeof value === 'number' && value > 0
}

export const isRegistryHandle = (value: unknown): value is RegistryHandle => {
  return typeof value === 'number' && value > 0
}

export const isExportedRegistry = (value: unknown): value is ExportedRegistry => {
  const v = value as Partial<ExportedRegistry>
  return (
    v.version === 1 &&
    typeof v.exported_at === 'number' &&
    Array.isArray(v.components) &&
    Array.isArray(v.properties) &&
    Array.isArray(v.values)
  )
}

export const isRegistrySnapshot = (value: unknown): value is RegistrySnapshot => {
  const v = value as Partial<RegistrySnapshot>
  return (
    isRegistryHandle(v.handle) &&
    typeof v.timestamp_ms === 'number' &&
    Array.isArray(v.components) &&
    Array.isArray(v.properties) &&
    Array.isArray(v.values)
  )
}

export const isRegistryValidationResult = (value: unknown): value is RegistryValidationResult => {
  const v = value as Partial<RegistryValidationResult>
  return (
    typeof v.valid === 'boolean' &&
    isRegistryHandle(v.handle) &&
    Array.isArray(v.errors) &&
    Array.isArray(v.warnings)
  )
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates a standard component name from module path and export
 * @example
 * createComponentName('Button.tsx', 'PrimaryButton')
 * // Returns: 'Button/PrimaryButton'
 */
export const createComponentName = (modulePath: string, exportName: string): string => {
  const cleanPath = modulePath.replace(/\.(tsx?|jsx?)$/, '').replace(/\\/g, '/')
  return `${cleanPath}/${exportName}`
}

/**
 * Creates a standard property/value key for CSS mapping
 * @example
 * createPropertyKey('backgroundColor')
 * // Returns: 'backgroundColor'
 */
export const createPropertyKey = (property: string): string => property

/**
 * Creates a standard value key for CSS value mapping
 * @example
 * createValueKey('#2563eb')
 * // Returns: '#2563eb'
 */
export const createValueKey = (value: string): string => value
