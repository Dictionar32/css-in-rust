/**
 * idRegistryNative.ts
 *
 * Phase 5.2: ID Registry Management - Efficient ID generation and lookup
 * Exposes 16 ID registry functions for deterministic class/component identification
 */

import { getNativeBridge } from "../nativeBridge"

/**
 * Registry snapshot data
 */
export interface RegistrySnapshot {
  handle: number
  next_id: number
  entries: Array<{ name: string; id: number }>
  total_entries: number
}

/**
 * Create a new ID generator
 * Returns a handle to be used in subsequent operations
 *
 * @returns Generator handle (u32)
 *
 * @example
 * ```ts
 * const handle = idRegistryCreate()
 * // Use handle for all subsequent operations
 * try {
 *   const id = idRegistryGenerate(handle, 'MyComponent')
 *   // ... use id ...
 * } finally {
 *   idRegistryDestroy(handle)  // Clean up
 * }
 * ```
 */
export function idRegistryCreate(): number {
  const native = getNativeBridge()
  if (!native?.id_registry_create) throw new Error("id_registry_create not available")
  return native.id_registry_create()
}

/**
 * Generate a new ID for a name
 * Same name always returns same ID (deterministic)
 *
 * @param handle - Generator handle from idRegistryCreate()
 * @param name - Identifier name (e.g., component name, class name)
 * @returns Generated ID
 *
 * @example
 * ```ts
 * const handle = idRegistryCreate()
 * const id1 = idRegistryGenerate(handle, 'Button')  // Returns 1
 * const id2 = idRegistryGenerate(handle, 'Button')  // Returns 1 (same)
 * const id3 = idRegistryGenerate(handle, 'Card')    // Returns 2 (different)
 * ```
 */
export function idRegistryGenerate(handle: number, name: string): number {
  const native = getNativeBridge()
  if (!native?.id_registry_generate) throw new Error("id_registry_generate not available")
  return native.id_registry_generate(handle, name)
}

/**
 * Lookup existing ID for a name
 * Returns -1 if not found
 *
 * @param handle - Generator handle
 * @param name - Name to look up
 * @returns ID if found, -1 if not found
 *
 * @example
 * ```ts
 * const id = idRegistryLookup(handle, 'Button')
 * if (id !== -1) {
 *   console.log(`Button has ID: ${id}`)
 * } else {
 *   console.log('Button not in registry yet')
 * }
 * ```
 */
export function idRegistryLookup(handle: number, name: string): number {
  const native = getNativeBridge()
  if (!native?.id_registry_lookup) throw new Error("id_registry_lookup not available")
  return native.id_registry_lookup(handle, name)
}

/**
 * Get the next ID that would be assigned
 * Useful for knowing how many unique IDs exist
 *
 * @param handle - Generator handle
 * @returns Next available ID
 *
 * @example
 * ```ts
 * const handle = idRegistryCreate()
 * idRegistryGenerate(handle, 'Button')
 * idRegistryGenerate(handle, 'Card')
 * const nextId = idRegistryNext(handle)  // Returns 2 (next available)
 * ```
 */
export function idRegistryNext(handle: number): number {
  const native = getNativeBridge()
  if (!native?.id_registry_next) throw new Error("id_registry_next not available")
  return native.id_registry_next(handle)
}

/**
 * Destroy a registry (clean up resources)
 * Must be called when done with registry
 *
 * @param handle - Generator handle
 *
 * @example
 * ```ts
 * const handle = idRegistryCreate()
 * try {
 *   // Use registry
 * } finally {
 *   idRegistryDestroy(handle)
 * }
 * ```
 */
export function idRegistryDestroy(handle: number): void {
  const native = getNativeBridge()
  if (!native?.id_registry_destroy) return
  native.id_registry_destroy(handle)
}

/**
 * Reset registry to initial state
 * Clears all entries but reuses handle
 *
 * @param handle - Generator handle
 *
 * @example
 * ```ts
 * const handle = idRegistryCreate()
 * idRegistryGenerate(handle, 'Component1')
 * idRegistryGenerate(handle, 'Component2')
 * idRegistryReset(handle)  // Clear all
 * const id = idRegistryNext(handle)  // Back to 0
 * ```
 */
export function idRegistryReset(handle: number): void {
  const native = getNativeBridge()
  if (!native?.id_registry_reset) return
  native.id_registry_reset(handle)
}

/**
 * Get snapshot of current registry state
 * Useful for serialization/debugging
 *
 * @param handle - Generator handle
 * @returns Snapshot with all entries
 *
 * @example
 * ```ts
 * const handle = idRegistryCreate()
 * idRegistryGenerate(handle, 'Button')
 * idRegistryGenerate(handle, 'Card')
 * const snapshot = idRegistrySnapshot(handle)
 * console.log(JSON.stringify(snapshot, null, 2))
 * ```
 */
export function idRegistrySnapshot(handle: number): RegistrySnapshot {
  const native = getNativeBridge()
  if (!native?.id_registry_snapshot) throw new Error("id_registry_snapshot not available")
  const snapshotJson = native.id_registry_snapshot(handle)
  try {
    return JSON.parse(snapshotJson)
  } catch {
    return {
      handle,
      next_id: 0,
      entries: [],
      total_entries: 0,
    }
  }
}

/**
 * Get count of active registries
 * Useful for monitoring resource usage
 *
 * @returns Number of active generator handles
 *
 * @example
 * ```ts
 * console.log(`Active registries: ${idRegistryActiveCount()}`)
 * ```
 */
export function idRegistryActiveCount(): number {
  const native = getNativeBridge()
  if (!native?.id_registry_active_count) throw new Error("id_registry_active_count not available")
  return native.id_registry_active_count()
}

/**
 * Register a property name with global registry
 * Maps property names to consistent IDs
 *
 * @param propertyName - Property name (e.g., "background-color")
 * @returns Assigned property ID
 *
 * @example
 * ```ts
 * const bgColorId = registerPropertyName('background-color')
 * const paddingId = registerPropertyName('padding')
 * ```
 */
export function registerPropertyName(propertyName: string): number {
  const native = getNativeBridge()
  if (!native?.register_property_name)
    throw new Error("register_property_name not available")
  return native.register_property_name(propertyName)
}

/**
 * Register a value name with global registry
 * Maps values to consistent IDs
 *
 * @param valueName - Value name (e.g., "blue-600")
 * @returns Assigned value ID
 *
 * @example
 * ```ts
 * const blueId = registerValueName('blue-600')
 * const redId = registerValueName('red-500')
 * ```
 */
export function registerValueName(valueName: string): number {
  const native = getNativeBridge()
  if (!native?.register_value_name) throw new Error("register_value_name not available")
  return native.register_value_name(valueName)
}

/**
 * Convert property ID back to name
 * Reverse lookup for serialized data
 *
 * @param propertyId - Property ID
 * @returns Property name or empty string if not found
 *
 * @example
 * ```ts
 * const bgColorId = registerPropertyName('background-color')
 * const name = propertyIdToString(bgColorId)
 * console.log(name)  // "background-color"
 * ```
 */
export function propertyIdToString(propertyId: number): string {
  const native = getNativeBridge()
  if (!native?.property_id_to_string) throw new Error("property_id_to_string not available")
  return native.property_id_to_string(propertyId)
}

/**
 * Convert value ID back to name
 * Reverse lookup for serialized data
 *
 * @param valueId - Value ID
 * @returns Value name or empty string if not found
 *
 * @example
 * ```ts
 * const blueId = registerValueName('blue-600')
 * const value = valueIdToString(blueId)
 * console.log(value)  // "blue-600"
 * ```
 */
export function valueIdToString(valueId: number): string {
  const native = getNativeBridge()
  if (!native?.value_id_to_string) throw new Error("value_id_to_string not available")
  return native.value_id_to_string(valueId)
}

/**
 * Reverse lookup: find property by ID
 * Alternative way to look up property names
 *
 * @param propertyId - Property ID to look up
 * @returns Property name
 */
export function reverseLookupProperty(propertyId: number): string {
  const native = getNativeBridge()
  if (!native?.reverse_lookup_property)
    throw new Error("reverse_lookup_property not available")
  return native.reverse_lookup_property(propertyId)
}

/**
 * Reverse lookup: find value by ID
 * Alternative way to look up value names
 *
 * @param valueId - Value ID to look up
 * @returns Value name
 */
export function reverseLookupValue(valueId: number): string {
  const native = getNativeBridge()
  if (!native?.reverse_lookup_value) throw new Error("reverse_lookup_value not available")
  return native.reverse_lookup_value(valueId)
}

/**
 * Export registry state for persistence
 * Useful for saving/restoring registry data
 *
 * @param handle - Generator handle
 * @returns Serialized registry state
 *
 * @example
 * ```ts
 * const exported = idRegistryExport(handle)
 * // Save to file/database
 * ```
 */
export function idRegistryExport(handle: number): string {
  const native = getNativeBridge()
  if (!native?.id_registry_export) throw new Error("id_registry_export not available")
  return native.id_registry_export(handle)
}

/**
 * Import registry state
 * Restore registry from saved state
 *
 * @param importedData - Serialized registry data
 * @returns New handle with imported data
 *
 * @example
 * ```ts
 * const handle = idRegistryImport(savedData)
 * // Registry restored with same IDs
 * ```
 */
export function idRegistryImport(importedData: string): number {
  const native = getNativeBridge()
  if (!native?.id_registry_import) throw new Error("id_registry_import not available")
  return native.id_registry_import(importedData)
}

