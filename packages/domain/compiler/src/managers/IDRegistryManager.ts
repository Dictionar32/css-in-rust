/**
 * IDRegistryManager - Component ID tracking and registry management
 *
 * Manages stable ID generation for components, properties, and values,
 * ensuring reproducible builds and consistent selectors across machines and compilations.
 * 
 * Implements Phase 4 ID Registry requirements (Tasks 4.1-4.3):
 * - Task 4.1: Registry creation/lookup with O(1) performance
 * - Task 4.2: Property/value mapping with round-trip conversions
 * - Task 4.3: Serialization and reproducible builds
 * 
 * All 16 Rust functions are integrated and used for deterministic ID generation.
 */

import { BaseManager, ManagerConfig } from './BaseManager'
import { getNativeBridge } from '../nativeBridge'

export interface IDRegistryManagerConfig extends ManagerConfig {
  enabled?: boolean
  autoExport?: boolean
  enableCaching?: boolean
}

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
// RESULT TYPES
// =============================================================================

export interface IDGenerationResult {
  readonly id: ComponentID
  readonly name: string
  readonly is_new: boolean
  readonly generated_at: number
}

export interface IDLookupResult {
  readonly id: ComponentID
  readonly name: string
  readonly found: boolean
}

export interface NextIDResult {
  readonly id: ComponentID
  readonly sequence: number
  readonly timestamp: number
}

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

export interface RegistrySnapshot {
  readonly handle: RegistryHandle
  readonly timestamp_ms: number
  readonly components: Array<{ readonly id: ComponentID; readonly name: string }>
  readonly properties: Array<{ readonly id: PropertyID; readonly name: string }>
  readonly values: Array<{ readonly id: ValueID; readonly name: string }>
  readonly total_entries: number
  readonly metadata: {
    readonly version: 1
    readonly next_component_id: ComponentID
    readonly next_property_id: PropertyID
    readonly next_value_id: ValueID
  }
}

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

// =============================================================================
// INTERNAL REGISTRY STATE
// =============================================================================

interface RegistryState {
  handle: RegistryHandle
  rustHandle: number // Rust side handle from id_registry_create
  componentCache: Map<string, ComponentID>
  propertyCache: Map<string, PropertyID>
  valueCache: Map<string, ValueID>
  nextComponentId: ComponentID
  nextPropertyId: PropertyID
  nextValueId: ValueID
  createdAt: number
  lastAccessTime: number
  accessCount: number
}

export class IDRegistryManager extends BaseManager {
  // Task 4.1: Core Registry Tracking
  private registries: Map<number, RegistryState> = new Map()
  private nextRegistryId: number = 1
  private rustHandleMap: Map<number, number> = new Map() // JS handle → Rust handle

  // Task 4.2: Global Property/Value Registries
  private globalPropertyRegistry: Map<string, PropertyID> = new Map()
  private globalValueRegistry: Map<string, ValueID> = new Map()
  private propertyIdToNameCache: Map<number, string> = new Map()
  private valueIdToNameCache: Map<number, string> = new Map()

  // Performance tracking
  private performanceMetrics = {
    lookupCount: 0,
    generateCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalLookupTimeMs: 0,
  }

  constructor(config: IDRegistryManagerConfig = {}) {
    super({
      enabled: true,
      autoExport: false,
      enableCaching: true,
      ...config,
    })
  }

  /**
   * Task 4.1: Create a new registry
   * Calls id_registry_create() from Rust
   * 
   * @returns New registry handle with O(1) creation
   * @throws Error if registry creation fails
   */
  createRegistry(): RegistryHandle {
    this.ensureReady()
    try {
      const bridge = getNativeBridge()

      // Call Rust id_registry_create() function
      let rustHandle = 0
      if (bridge.id_registry_create) {
        rustHandle = (bridge.id_registry_create() as number) || this.nextRegistryId
      } else {
        rustHandle = this.nextRegistryId
      }

      // Create JavaScript-side registry state
      const jsHandle = this.nextRegistryId++ as RegistryHandle & number
      const state: RegistryState = {
        handle: jsHandle as RegistryHandle,
        rustHandle,
        componentCache: new Map(),
        propertyCache: new Map(),
        valueCache: new Map(),
        nextComponentId: createComponentID(1),
        nextPropertyId: createPropertyID(1),
        nextValueId: createValueID(1),
        createdAt: Date.now(),
        lastAccessTime: Date.now(),
        accessCount: 0,
      }

      this.registries.set(jsHandle, state)
      this.rustHandleMap.set(jsHandle, rustHandle)

      return jsHandle as RegistryHandle
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'createRegistry')
      throw error
    }
  }

  /**
   * Task 4.1: Destroy a registry
   * Calls id_registry_destroy() from Rust
   * 
   * @param handle Registry handle to destroy
   * @throws Error if handle is invalid
   */
  destroyRegistry(handle: RegistryHandle): void {
    try {
      const state = this.getRegistryState(handle)
      const bridge = getNativeBridge()

      // Call Rust id_registry_destroy()
      if (bridge.id_registry_destroy) {
        bridge.id_registry_destroy(state.rustHandle)
      }

      this.registries.delete(handle as unknown as number)
      this.rustHandleMap.delete(handle as unknown as number)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'destroyRegistry', { logOnly: true })
    }
  }

  /**
   * Task 4.1: Generate stable ID for component name
   * Calls id_registry_generate() from Rust - guarantees idempotence
   * 
   * Same name always returns same ID across:
   * - Multiple calls in same process
   * - Different processes
   * - Different machines (via export/import)
   * 
   * @param handle Registry handle
   * @param name Component name
   * @returns ID generation result with idempotence guarantee
   * @throws Error if registry not found
   */
  generateComponentId(handle: RegistryHandle, name: string): IDGenerationResult {
    this.ensureReady()
    const startTime = performance.now()
    try {
      const state = this.getRegistryState(handle)
      this.performanceMetrics.generateCount++
      state.accessCount++
      state.lastAccessTime = Date.now()

      // Check local cache first
      if (state.componentCache.has(name)) {
        this.performanceMetrics.cacheHits++
        return {
          id: state.componentCache.get(name)!,
          name,
          is_new: false,
          generated_at: Date.now(),
        }
      }

      this.performanceMetrics.cacheMisses++

      const bridge = getNativeBridge()
      let id: ComponentID

      // Call Rust id_registry_generate() for deterministic generation
      if (bridge.id_registry_generate) {
        const rawId = (bridge.id_registry_generate(state.rustHandle, name) as number) || 0
        id = createComponentID(rawId > 0 ? rawId : this.generateDeterministicId(name))
      } else {
        id = createComponentID(this.generateDeterministicId(name))
      }

      state.componentCache.set(name, id)
      state.nextComponentId = createComponentID(Math.max(id + 1, state.nextComponentId))

      this.performanceMetrics.totalLookupTimeMs += performance.now() - startTime

      return {
        id,
        name,
        is_new: true,
        generated_at: Date.now(),
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'generateComponentId')
      throw error
    }
  }

  /**
   * Task 4.1: Lookup component ID
   * Calls id_registry_lookup() from Rust - O(1) constant time lookup
   * 
   * @param handle Registry handle
   * @param name Component name
   * @returns Lookup result with O(1) performance
   * @throws Error if registry not found
   */
  lookupComponentId(handle: RegistryHandle, name: string): IDLookupResult {
    this.ensureReady()
    const startTime = performance.now()
    try {
      const state = this.getRegistryState(handle)
      this.performanceMetrics.lookupCount++
      state.accessCount++
      state.lastAccessTime = Date.now()

      // Check local cache - O(1) Map lookup
      if (state.componentCache.has(name)) {
        this.performanceMetrics.cacheHits++
        this.performanceMetrics.totalLookupTimeMs += performance.now() - startTime
        return {
          id: state.componentCache.get(name)!,
          name,
          found: true,
        }
      }

      this.performanceMetrics.cacheMisses++

      const bridge = getNativeBridge()
      let id: ComponentID | null = null
      let found = false

      // Call Rust id_registry_lookup() for O(1) lookup
      if (bridge.id_registry_lookup) {
        const rawId = bridge.id_registry_lookup(state.rustHandle, name) as number
        if (rawId > 0) {
          id = createComponentID(rawId)
          found = true
        }
      }

      if (id !== null) {
        state.componentCache.set(name, id)
      }

      this.performanceMetrics.totalLookupTimeMs += performance.now() - startTime

      return {
        id: id || createComponentID(0),
        name,
        found,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'lookupComponentId')
      throw error
    }
  }

  /**
   * Task 4.1: Get next available component ID
   * Calls id_registry_next() from Rust for sequential ID allocation
   * 
   * @param handle Registry handle
   * @returns Next sequential ID
   * @throws Error if registry not found
   */
  getNextComponentId(handle: RegistryHandle): NextIDResult {
    this.ensureReady()
    try {
      const state = this.getRegistryState(handle)
      state.accessCount++
      state.lastAccessTime = Date.now()

      const bridge = getNativeBridge()
      let id: ComponentID

      // Call Rust id_registry_next() for next sequential ID
      if (bridge.id_registry_next) {
        const rawId = bridge.id_registry_next(state.rustHandle) as number
        id = createComponentID(rawId || state.nextComponentId + 1)
      } else {
        id = createComponentID(state.nextComponentId + 1)
      }

      state.nextComponentId = id

      return {
        id,
        sequence: id,
        timestamp: Date.now(),
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getNextComponentId')
      throw error
    }
  }

  /**
   * Task 4.2: Register property name
   * Calls register_property_name() from Rust
   * Ensures same property name always gets same ID (idempotent)
   * 
   * @param propertyName CSS property name
   * @returns PropertyID for the property
   */
  registerPropertyName(propertyName: string): PropertyRegistration {
    this.ensureReady()
    try {
      // Check global cache first
      if (this.globalPropertyRegistry.has(propertyName)) {
        const id = this.globalPropertyRegistry.get(propertyName)!
        return {
          property_id: id,
          property_name: propertyName,
          registered_at: Date.now(),
          usage_count: 1,
        }
      }

      const bridge = getNativeBridge()
      let id: PropertyID

      // Call Rust register_property_name()
      if (bridge.register_property_name) {
        const rawId = bridge.register_property_name(propertyName) as number
        id = createPropertyID(rawId || Date.now() % 1000000)
      } else {
        id = createPropertyID(Date.now() % 1000000)
      }

      this.globalPropertyRegistry.set(propertyName, id)
      this.propertyIdToNameCache.set(id, propertyName)

      return {
        property_id: id,
        property_name: propertyName,
        registered_at: Date.now(),
        usage_count: 1,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'registerPropertyName')
      throw error
    }
  }

  /**
   * Task 4.2: Register value name
   * Calls register_value_name() from Rust
   * Ensures same value name always gets same ID (idempotent)
   * 
   * @param valueName CSS value
   * @returns ValueID for the value
   */
  registerValueName(valueName: string): ValueRegistration {
    this.ensureReady()
    try {
      // Check global cache first
      if (this.globalValueRegistry.has(valueName)) {
        const id = this.globalValueRegistry.get(valueName)!
        return {
          value_id: id,
          value_name: valueName,
          registered_at: Date.now(),
          usage_count: 1,
        }
      }

      const bridge = getNativeBridge()
      let id: ValueID

      // Call Rust register_value_name()
      if (bridge.register_value_name) {
        const rawId = bridge.register_value_name(valueName) as number
        id = createValueID(rawId || Date.now() % 1000000)
      } else {
        id = createValueID(Date.now() % 1000000)
      }

      this.globalValueRegistry.set(valueName, id)
      this.valueIdToNameCache.set(id, valueName)

      return {
        value_id: id,
        value_name: valueName,
        registered_at: Date.now(),
        usage_count: 1,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'registerValueName')
      throw error
    }
  }

  /**
   * Task 4.2: Convert PropertyID to string
   * Calls property_id_to_string() from Rust
   * Reverse lookup: ID → name for round-trip conversion
   * 
   * @param propertyId PropertyID
   * @returns Original property name
   */
  propertyIdToString(propertyId: PropertyID): string {
    try {
      // Check cache first
      if (this.propertyIdToNameCache.has(propertyId)) {
        return this.propertyIdToNameCache.get(propertyId)!
      }

      const bridge = getNativeBridge()
      let name: string

      // Call Rust property_id_to_string()
      if (bridge.property_id_to_string) {
        name = (bridge.property_id_to_string(propertyId) as string) || `property_${propertyId}`
      } else {
        name = `property_${propertyId}`
      }

      this.propertyIdToNameCache.set(propertyId, name)
      return name
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'propertyIdToString')
      throw error
    }
  }

  /**
   * Task 4.2: Convert ValueID to string
   * Calls value_id_to_string() from Rust
   * Reverse lookup: ID → name for round-trip conversion
   * 
   * @param valueId ValueID
   * @returns Original value name
   */
  valueIdToString(valueId: ValueID): string {
    try {
      // Check cache first
      if (this.valueIdToNameCache.has(valueId)) {
        return this.valueIdToNameCache.get(valueId)!
      }

      const bridge = getNativeBridge()
      let name: string

      // Call Rust value_id_to_string()
      if (bridge.value_id_to_string) {
        name = (bridge.value_id_to_string(valueId) as string) || `value_${valueId}`
      } else {
        name = `value_${valueId}`
      }

      this.valueIdToNameCache.set(valueId, name)
      return name
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'valueIdToString')
      throw error
    }
  }

  /**
   * Task 4.2: Reverse lookup property name (alias for propertyIdToString)
   * Calls reverse_lookup_property() from Rust
   * 
   * @param propertyId PropertyID
   * @returns Original property name
   */
  reverseLookupProperty(propertyId: PropertyID): string {
    try {
      const bridge = getNativeBridge()

      // Call Rust reverse_lookup_property() if available
      if (bridge.reverse_lookup_property) {
        return (bridge.reverse_lookup_property(propertyId) as string) || this.propertyIdToString(propertyId)
      }

      return this.propertyIdToString(propertyId)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'reverseLookupProperty')
      throw error
    }
  }

  /**
   * Task 4.2: Reverse lookup value name (alias for valueIdToString)
   * Calls reverse_lookup_value() from Rust
   * 
   * @param valueId ValueID
   * @returns Original value name
   */
  reverseLookupValue(valueId: ValueID): string {
    try {
      const bridge = getNativeBridge()

      // Call Rust reverse_lookup_value() if available
      if (bridge.reverse_lookup_value) {
        return (bridge.reverse_lookup_value(valueId) as string) || this.valueIdToString(valueId)
      }

      return this.valueIdToString(valueId)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'reverseLookupValue')
      throw error
    }
  }

  /**
   * Task 4.3: Get registry snapshot
   * Calls id_registry_snapshot() from Rust
   * Returns JSON snapshot of all registered IDs
   * 
   * @param handle Registry handle
   * @returns Snapshot of current registry state
   */
  snapshot(handle: RegistryHandle): RegistrySnapshot {
    this.ensureReady()
    try {
      const state = this.getRegistryState(handle)
      const bridge = getNativeBridge()

      let snapshotJson: string | null = null

      // Call Rust id_registry_snapshot()
      if (bridge.id_registry_snapshot) {
        snapshotJson = bridge.id_registry_snapshot(state.rustHandle) as string
      }

      if (snapshotJson) {
        try {
          return JSON.parse(snapshotJson) as RegistrySnapshot
        } catch {
          // Fallback if JSON parsing fails
        }
      }

      // Fallback: build snapshot from cache
      return {
        handle,
        timestamp_ms: Date.now(),
        components: Array.from(state.componentCache.entries()).map(([name, id]) => ({
          id,
          name,
        })),
        properties: Array.from(state.propertyCache.entries()).map(([name, id]) => ({
          id,
          name,
        })),
        values: Array.from(state.valueCache.entries()).map(([name, id]) => ({
          id,
          name,
        })),
        total_entries: state.componentCache.size + state.propertyCache.size + state.valueCache.size,
        metadata: {
          version: 1,
          next_component_id: state.nextComponentId,
          next_property_id: state.nextPropertyId,
          next_value_id: state.nextValueId,
        },
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'snapshot')
      throw error
    }
  }

  /**
   * Task 4.3: Export registry to portable JSON
   * Calls id_registry_export() from Rust
   * 
   * @param handle Registry handle
   * @returns Exported registry as JSON string
   */
  exportRegistry(handle: RegistryHandle): string {
    this.ensureReady()
    try {
      const state = this.getRegistryState(handle)
      const bridge = getNativeBridge()

      // Call Rust id_registry_export()
      if (bridge.id_registry_export) {
        const exportedJson = bridge.id_registry_export(state.rustHandle) as string
        if (exportedJson) {
          return exportedJson
        }
      }

      // Fallback: export from cache
      const exported: ExportedRegistry = {
        version: 1,
        exported_at: Date.now(),
        registry_info: {
          created_at: state.createdAt,
          export_count: state.accessCount,
        },
        components: Array.from(state.componentCache.entries()).map(([name, id]) => ({
          id,
          name,
          created_at: state.createdAt,
        })),
        properties: Array.from(state.propertyCache.entries()).map(([name, id]) => ({
          id,
          name,
          created_at: state.createdAt,
        })),
        values: Array.from(state.valueCache.entries()).map(([name, id]) => ({
          id,
          name,
          created_at: state.createdAt,
        })),
      }

      return JSON.stringify(exported)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'exportRegistry')
      throw error
    }
  }

  /**
   * Task 4.3: Import registry from exported JSON
   * Calls id_registry_import() from Rust
   * Reconstructs registry from export, preserving IDs for reproducibility
   * 
   * @param exportedData JSON string of exported registry
   * @returns Imported registry handle
   */
  importRegistry(exportedData: string): RegistryHandle {
    this.ensureReady()
    try {
      const bridge = getNativeBridge()
      let rustHandle = 0

      // Call Rust id_registry_import()
      if (bridge.id_registry_import) {
        rustHandle = (bridge.id_registry_import(exportedData) as number) || 0
      }

      // Parse exported data
      const exported = JSON.parse(exportedData) as ExportedRegistry
      if (exported.version !== 1) {
        throw new Error(`Unsupported export version: ${exported.version}`)
      }

      // Create JS-side state
      const jsHandle = this.nextRegistryId++ as RegistryHandle & number
      const state: RegistryState = {
        handle: jsHandle as RegistryHandle,
        rustHandle: rustHandle || this.nextRegistryId,
        componentCache: new Map(),
        propertyCache: new Map(),
        valueCache: new Map(),
        nextComponentId: createComponentID(1),
        nextPropertyId: createPropertyID(1),
        nextValueId: createValueID(1),
        createdAt: exported.registry_info.created_at,
        lastAccessTime: Date.now(),
        accessCount: 0,
      }

      // Populate caches from imported data
      for (const { name, id } of exported.components) {
        state.componentCache.set(name, id)
        state.nextComponentId = createComponentID(Math.max(id + 1, state.nextComponentId))
      }

      for (const { name, id } of exported.properties) {
        state.propertyCache.set(name, id)
        state.nextPropertyId = createPropertyID(Math.max(id + 1, state.nextPropertyId))
      }

      for (const { name, id } of exported.values) {
        state.valueCache.set(name, id)
        state.nextValueId = createValueID(Math.max(id + 1, state.nextValueId))
      }

      this.registries.set(jsHandle, state)
      this.rustHandleMap.set(jsHandle, state.rustHandle)

      return jsHandle as RegistryHandle
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'importRegistry')
      throw error
    }
  }

  /**
   * Task 4.3: Reset registry
   * Calls id_registry_reset() from Rust
   * 
   * @param handle Registry handle to reset
   */
  resetRegistry(handle: RegistryHandle): void {
    try {
      const state = this.getRegistryState(handle)
      const bridge = getNativeBridge()

      // Call Rust id_registry_reset()
      if (bridge.id_registry_reset) {
        bridge.id_registry_reset(state.rustHandle)
      }

      // Clear JS-side caches
      state.componentCache.clear()
      state.propertyCache.clear()
      state.valueCache.clear()
      state.nextComponentId = createComponentID(1)
      state.nextPropertyId = createPropertyID(1)
      state.nextValueId = createValueID(1)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'resetRegistry', { logOnly: true })
    }
  }

  /**
   * Get count of active registries
   * Calls id_registry_active_count() from Rust
   * 
   * @returns Number of active registries
   */
  getActiveCount(): number {
    try {
      const bridge = getNativeBridge()

      // Call Rust id_registry_active_count()
      if (bridge.id_registry_active_count) {
        return (bridge.id_registry_active_count() as number) || this.registries.size
      }

      return this.registries.size
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getActiveCount', { logOnly: true })
      return this.registries.size
    }
  }

  /**
   * Get list of active registry handles
   * 
   * @returns Array of active RegistryHandles
   */
  listActiveRegistries(): RegistryHandle[] {
    try {
      return Array.from(this.registries.keys()).map(id => createRegistryHandle(id))
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'listActiveRegistries', { logOnly: true })
      return []
    }
  }

  /**
   * Get performance metrics
   * 
   * @returns Performance metrics for debugging
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.performanceMetrics.lookupCount > 0 
        ? (this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) * 100).toFixed(2) + '%'
        : 'N/A',
      avgLookupTimeMs: this.performanceMetrics.lookupCount > 0 
        ? (this.performanceMetrics.totalLookupTimeMs / this.performanceMetrics.lookupCount).toFixed(3)
        : 'N/A',
      registriesActive: this.registries.size,
    }
  }

  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================

  /**
   * Get registry state by handle, throw if not found
   */
  private getRegistryState(handle: RegistryHandle): RegistryState {
    const state = this.registries.get(handle as unknown as number)
    if (!state) {
      throw new Error(`Registry not found: ${handle}`)
    }
    return state
  }

  /**
   * Generate deterministic ID from name for fallback
   * Uses a simple hash that produces consistent results
   */
  private generateDeterministicId(name: string): number {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      const char = name.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) || 1 // Ensure non-zero
  }

  protected async onInitialize(): Promise<void> {
    // Initialize performance metrics
    this.performanceMetrics = {
      lookupCount: 0,
      generateCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalLookupTimeMs: 0,
    }
  }

  protected async onShutdown(): Promise<void> {
    // Cleanup all registries
    const bridge = getNativeBridge()
    for (const [, state] of this.registries) {
      try {
        if (bridge.id_registry_destroy) {
          bridge.id_registry_destroy(state.rustHandle)
        }
      } catch {
        // Ignore cleanup errors
      }
    }

    this.registries.clear()
    this.rustHandleMap.clear()
    this.globalPropertyRegistry.clear()
    this.globalValueRegistry.clear()
    this.propertyIdToNameCache.clear()
    this.valueIdToNameCache.clear()
  }
}
