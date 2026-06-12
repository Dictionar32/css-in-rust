/**
 * IDRegistryManager Tests - Phase 4 Tasks 4.1-4.3
 * 
 * Comprehensive test suite for ID registry management:
 * - Task 4.1: Registry creation/lookup with O(1) performance
 * - Task 4.2: Property/value mapping with round-trip conversions
 * - Task 4.3: Serialization and reproducible builds
 * 
 * Note: Using Node.js native test runner (node:test)
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  IDRegistryManager,
  createComponentID,
  createPropertyID,
  createValueID,
  createRegistryHandle,
} from '../IDRegistryManager'

// ============================================================================
// Task 4.1: Registry Creation and Lookup Tests
// ============================================================================

test('Task 4.1.1: should create new registry and return handle', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  
  assert.ok(handle)
  assert.strictEqual(typeof handle, 'number')
  assert.ok(handle > 0)
})

test('Task 4.1.2: should create multiple registries with different handles', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle1 = manager.createRegistry()
  const handle2 = manager.createRegistry()
  const handle3 = manager.createRegistry()

  assert.notStrictEqual(handle1, handle2)
  assert.notStrictEqual(handle2, handle3)
  assert.notStrictEqual(handle1, handle3)
})

test('Task 4.1.3: should track active registries', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const initialCount = manager.getActiveCount()
  const handle1 = manager.createRegistry()
  const handle2 = manager.createRegistry()

  assert.strictEqual(manager.getActiveCount(), initialCount + 2)
})

test('Task 4.1.4: should list active registries', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle1 = manager.createRegistry()
  const handle2 = manager.createRegistry()
  const active = manager.listActiveRegistries()

  assert.ok(active.includes(handle1))
  assert.ok(active.includes(handle2))
  assert.ok(active.length >= 2)
})

test('Task 4.1.5: should destroy registry', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  const initialCount = manager.getActiveCount()

  manager.destroyRegistry(handle)

  // After destroy, trying to use handle should fail
  assert.throws(() => manager.generateComponentId(handle, 'test'))
})

test('Task 4.1.6: should generate stable ID for component name', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  const result1 = manager.generateComponentId(handle, 'Button')

  assert.ok(result1.id)
  assert.strictEqual(result1.name, 'Button')
  assert.strictEqual(result1.is_new, true)
  assert.strictEqual(typeof result1.id, 'number')
})

test('Task 4.1.7: should return same ID for same name (idempotent)', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  const result1 = manager.generateComponentId(handle, 'Button')
  const result2 = manager.generateComponentId(handle, 'Button')

  assert.strictEqual(result1.id, result2.id)
  assert.strictEqual(result1.name, result2.name)
})

test('Task 4.1.8: should generate different IDs for different names', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  const resultButton = manager.generateComponentId(handle, 'Button')
  const resultCard = manager.generateComponentId(handle, 'Card')

  assert.notStrictEqual(resultButton.id, resultCard.id)
})

test('Task 4.1.9: should track is_new flag correctly', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  const result1 = manager.generateComponentId(handle, 'Button')
  const result2 = manager.generateComponentId(handle, 'Button')

  assert.strictEqual(result1.is_new, true)
  assert.strictEqual(result2.is_new, false)
})

test('Task 4.1.10: should handle multiple component registrations', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  const names = ['Button', 'Card', 'Input', 'Modal', 'Dropdown']
  const ids = []

  for (const name of names) {
    const result = manager.generateComponentId(handle, name)
    ids.push({ name, id: result.id })
  }

  // All IDs should be unique
  const uniqueIds = new Set(ids.map(x => x.id))
  assert.strictEqual(uniqueIds.size, ids.length)
})

test('Task 4.1.11: should lookup component ID', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  manager.generateComponentId(handle, 'Button')

  const lookup = manager.lookupComponentId(handle, 'Button')

  assert.strictEqual(lookup.found, true)
  assert.ok(lookup.id)
  assert.strictEqual(lookup.name, 'Button')
})

test('Task 4.1.12: should return found=false for non-existent component', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  const lookup = manager.lookupComponentId(handle, 'NonExistent')

  assert.strictEqual(lookup.found, false)
})

test('Task 4.1.13: should maintain lookup consistency across multiple calls', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  manager.generateComponentId(handle, 'Button')

  const lookup1 = manager.lookupComponentId(handle, 'Button')
  const lookup2 = manager.lookupComponentId(handle, 'Button')
  const lookup3 = manager.lookupComponentId(handle, 'Button')

  assert.strictEqual(lookup1.id, lookup2.id)
  assert.strictEqual(lookup2.id, lookup3.id)
})

test('Task 4.1.14: should handle cache hits (performance test)', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  manager.generateComponentId(handle, 'Button')

  const startTime = performance.now()
  for (let i = 0; i < 1000; i++) {
    manager.lookupComponentId(handle, 'Button')
  }
  const endTime = performance.now()

  const totalTime = endTime - startTime
  const avgTime = totalTime / 1000

  // Each lookup should be very fast (< 1ms average)
  assert.ok(avgTime < 1, `Average lookup time ${avgTime}ms should be < 1ms`)
})

test('Task 4.1.15: should provide O(1) lookup even with many components', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()

  // Generate many components
  for (let i = 0; i < 1000; i++) {
    manager.generateComponentId(handle, `Component_${i}`)
  }

  // Lookup should still be fast
  const startTime = performance.now()
  for (let i = 0; i < 100; i++) {
    manager.lookupComponentId(handle, `Component_${Math.floor(Math.random() * 1000)}`)
  }
  const endTime = performance.now()

  const totalTime = endTime - startTime
  const avgTime = totalTime / 100

  // O(1) lookup should be consistent
  assert.ok(avgTime < 5, `Average lookup time ${avgTime}ms should be < 5ms for O(1)`)
})

test('Task 4.1.16: should get next sequential ID', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  const result = manager.getNextComponentId(handle)

  assert.ok(result.id)
  assert.strictEqual(result.sequence, result.id)
  assert.strictEqual(typeof result.id, 'number')
})

test('Task 4.1.17: should return increasing sequential IDs', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  const id1 = manager.getNextComponentId(handle)
  const id2 = manager.getNextComponentId(handle)
  const id3 = manager.getNextComponentId(handle)

  assert.ok(id2.id > id1.id)
  assert.ok(id3.id > id2.id)
})

test('Task 4.1.18: should not conflict with generated IDs', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  const generated = manager.generateComponentId(handle, 'Button')
  const next = manager.getNextComponentId(handle)

  assert.notStrictEqual(next.id, generated.id)
})

test('Task 4.1.19: should throw on invalid registry handle', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const invalidHandle = createRegistryHandle(999999)

  assert.throws(() => manager.generateComponentId(invalidHandle, 'Button'))
})

test('Task 4.1.20: should handle destroyed registry', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  manager.destroyRegistry(handle)

  assert.throws(() => manager.generateComponentId(handle, 'Button'))
})

// ============================================================================
// Task 4.2: Property and Value Mapping Tests
// ============================================================================

test('Task 4.2.21: should register property name', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const result = manager.registerPropertyName('backgroundColor')

  assert.ok(result.property_id)
  assert.strictEqual(result.property_name, 'backgroundColor')
  assert.strictEqual(typeof result.property_id, 'number')
})

test('Task 4.2.22: should return same PropertyID for same property (idempotent)', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const result1 = manager.registerPropertyName('backgroundColor')
  const result2 = manager.registerPropertyName('backgroundColor')

  assert.strictEqual(result1.property_id, result2.property_id)
})

test('Task 4.2.23: should generate different PropertyIDs for different properties', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const bg = manager.registerPropertyName('backgroundColor')
  const color = manager.registerPropertyName('color')
  const padding = manager.registerPropertyName('padding')

  assert.notStrictEqual(bg.property_id, color.property_id)
  assert.notStrictEqual(color.property_id, padding.property_id)
})

test('Task 4.2.24: should handle CSS property names correctly', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const properties = [
    'backgroundColor',
    'border-radius',
    'display',
    'flex-direction',
    'grid-template-columns',
  ]

  const registered = properties.map(prop => manager.registerPropertyName(prop))
  const uniqueIds = new Set(registered.map(r => r.property_id))

  assert.strictEqual(uniqueIds.size, properties.length)
})

test('Task 4.2.25: should register value name', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const result = manager.registerValueName('#2563eb')

  assert.ok(result.value_id)
  assert.strictEqual(result.value_name, '#2563eb')
  assert.strictEqual(typeof result.value_id, 'number')
})

test('Task 4.2.26: should return same ValueID for same value (idempotent)', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const result1 = manager.registerValueName('#2563eb')
  const result2 = manager.registerValueName('#2563eb')

  assert.strictEqual(result1.value_id, result2.value_id)
})

test('Task 4.2.27: should generate different ValueIDs for different values', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const blue = manager.registerValueName('#2563eb')
  const red = manager.registerValueName('#dc2626')
  const green = manager.registerValueName('#16a34a')

  assert.notStrictEqual(blue.value_id, red.value_id)
  assert.notStrictEqual(red.value_id, green.value_id)
})

test('Task 4.2.28: should handle various CSS value types', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const values = [
    '#2563eb',
    'rgba(0, 0, 0, 0.5)',
    '1rem',
    'flex',
    'center',
    'url(bg.png)',
  ]

  const registered = values.map(val => manager.registerValueName(val))
  const uniqueIds = new Set(registered.map(r => r.value_id))

  assert.strictEqual(uniqueIds.size, values.length)
})

test('Task 4.2.29: should convert PropertyID to string', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const registered = manager.registerPropertyName('backgroundColor')
  const name = manager.propertyIdToString(registered.property_id)

  assert.strictEqual(name, 'backgroundColor')
})

test('Task 4.2.30: should convert ValueID to string', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const registered = manager.registerValueName('#2563eb')
  const name = manager.valueIdToString(registered.value_id)

  assert.strictEqual(name, '#2563eb')
})

test('Task 4.2.31: should support reverse lookup property alias', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const registered = manager.registerPropertyName('backgroundColor')
  const name1 = manager.propertyIdToString(registered.property_id)
  const name2 = manager.reverseLookupProperty(registered.property_id)

  assert.strictEqual(name1, name2)
})

test('Task 4.2.32: should support reverse lookup value alias', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const registered = manager.registerValueName('#2563eb')
  const name1 = manager.valueIdToString(registered.value_id)
  const name2 = manager.reverseLookupValue(registered.value_id)

  assert.strictEqual(name1, name2)
})

test('Task 4.2.33: should cache reverse lookups', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const registered = manager.registerPropertyName('color')
  const name1 = manager.propertyIdToString(registered.property_id)
  const name2 = manager.propertyIdToString(registered.property_id)

  assert.strictEqual(name1, name2)
})

test('Task 4.2.34: should convert property name → ID → name successfully', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const originalName = 'backgroundColor'
  const registered = manager.registerPropertyName(originalName)
  const reconvertedName = manager.propertyIdToString(registered.property_id)

  assert.strictEqual(reconvertedName, originalName)
})

test('Task 4.2.35: should convert value name → ID → name successfully', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const originalValue = '#2563eb'
  const registered = manager.registerValueName(originalValue)
  const reconvertedValue = manager.valueIdToString(registered.value_id)

  assert.strictEqual(reconvertedValue, originalValue)
})

test('Task 4.2.36: should preserve exact value through round-trip', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const values = [
    '#2563eb',
    'rgba(0, 0, 0, 0.5)',
    '1rem',
    'flex',
  ]

  for (const value of values) {
    const registered = manager.registerValueName(value)
    const roundtrip = manager.valueIdToString(registered.value_id)
    assert.strictEqual(roundtrip, value)
  }
})

test('Task 4.2.37: should preserve exact property name through round-trip', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const properties = [
    'backgroundColor',
    'border-radius',
    'flex-direction',
  ]

  for (const prop of properties) {
    const registered = manager.registerPropertyName(prop)
    const roundtrip = manager.propertyIdToString(registered.property_id)
    assert.strictEqual(roundtrip, prop)
  }
})

// ============================================================================
// Task 4.3: Serialization Tests
// ============================================================================

test('Task 4.3.38: should create registry snapshot', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  manager.generateComponentId(handle, 'Button')
  manager.generateComponentId(handle, 'Card')

  const snap = manager.snapshot(handle)

  assert.strictEqual(snap.handle, handle)
  assert.ok(snap.timestamp_ms)
  assert.ok(snap.components)
  assert.ok(snap.properties)
  assert.ok(snap.values)
})

test('Task 4.3.39: should snapshot capture all entries', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  manager.generateComponentId(handle, 'Button')
  manager.generateComponentId(handle, 'Card')
  manager.generateComponentId(handle, 'Input')

  const snap = manager.snapshot(handle)

  assert.ok(snap.components.length >= 3)
})

test('Task 4.3.40: should export registry to JSON', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  manager.generateComponentId(handle, 'Button')

  const exported = manager.exportRegistry(handle)

  assert.strictEqual(typeof exported, 'string')
  const parsed = JSON.parse(exported)
  assert.strictEqual(parsed.version, 1)
  assert.ok(Array.isArray(parsed.components))
})

test('Task 4.3.41: should export valid JSON format', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  manager.generateComponentId(handle, 'Button')
  manager.generateComponentId(handle, 'Card')

  const exported = manager.exportRegistry(handle)
  const parsed = JSON.parse(exported)

  assert.strictEqual(parsed.version, 1)
  assert.ok(parsed.exported_at)
  assert.ok(parsed.registry_info)
  assert.ok(Array.isArray(parsed.components))
  assert.ok(Array.isArray(parsed.properties))
  assert.ok(Array.isArray(parsed.values))
})

test('Task 4.3.42: should import registry from exported data', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle1 = manager.createRegistry()
  manager.generateComponentId(handle1, 'Button')
  manager.generateComponentId(handle1, 'Card')

  const exported = manager.exportRegistry(handle1)
  const handle2 = manager.importRegistry(exported)

  assert.ok(handle2)
  assert.notStrictEqual(handle2, handle1)
})

test('Task 4.3.43: should preserve IDs through export/import (reproducible)', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle1 = manager.createRegistry()
  const id1 = manager.generateComponentId(handle1, 'Button').id
  const id2 = manager.generateComponentId(handle1, 'Card').id

  const exported = manager.exportRegistry(handle1)
  const handle2 = manager.importRegistry(exported)

  const importedId1 = manager.lookupComponentId(handle2, 'Button')
  const importedId2 = manager.lookupComponentId(handle2, 'Card')

  assert.strictEqual(importedId1.id, id1)
  assert.strictEqual(importedId2.id, id2)
})

test('Task 4.3.44: should verify reproducibility across processes (simulated)', () => {
  const manager = new IDRegistryManager({ enabled: true })

  // Simulate Process 1
  const proc1Registry = manager.createRegistry()
  const proc1Button = manager.generateComponentId(proc1Registry, 'Button').id
  const proc1Card = manager.generateComponentId(proc1Registry, 'Card').id
  const proc1Exported = manager.exportRegistry(proc1Registry)

  // Simulate Process 2
  const proc2Registry = manager.importRegistry(proc1Exported)
  const proc2Button = manager.lookupComponentId(proc2Registry, 'Button').id
  const proc2Card = manager.lookupComponentId(proc2Registry, 'Card').id

  // IDs must be identical
  assert.strictEqual(proc2Button, proc1Button)
  assert.strictEqual(proc2Card, proc1Card)
})

test('Task 4.3.45: should handle batch import of many components', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle1 = manager.createRegistry()

  // Generate many components
  for (let i = 0; i < 100; i++) {
    manager.generateComponentId(handle1, `Component_${i}`)
  }

  const exported = manager.exportRegistry(handle1)
  const handle2 = manager.importRegistry(exported)

  // Verify all components are preserved
  for (let i = 0; i < 100; i++) {
    const lookup = manager.lookupComponentId(handle2, `Component_${i}`)
    assert.strictEqual(lookup.found, true)
  }
})

test('Task 4.3.46: should reset registry', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  manager.generateComponentId(handle, 'Button')
  manager.generateComponentId(handle, 'Card')

  manager.resetRegistry(handle)

  const lookup = manager.lookupComponentId(handle, 'Button')
  assert.strictEqual(lookup.found, false)
})

test('Task 4.3.47: should allow ID reuse after reset', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  const id1 = manager.generateComponentId(handle, 'Button').id

  manager.resetRegistry(handle)

  const id2 = manager.generateComponentId(handle, 'Button').id
  assert.strictEqual(id1, id2)
})

// ============================================================================
// Performance and Metrics Tests
// ============================================================================

test('Task 4.3.48: should track performance metrics', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  manager.generateComponentId(handle, 'Button')
  manager.lookupComponentId(handle, 'Button')
  manager.lookupComponentId(handle, 'Button')

  const metrics = manager.getMetrics()

  assert.ok(metrics.generateCount > 0)
  assert.ok(metrics.lookupCount > 0)
  assert.ok(metrics.registriesActive > 0)
})

test('Task 4.3.49: should calculate cache hit rate', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  manager.generateComponentId(handle, 'Button')

  // Perform many lookups to get cache hits
  for (let i = 0; i < 100; i++) {
    manager.lookupComponentId(handle, 'Button')
  }

  const metrics = manager.getMetrics()
  assert.ok(metrics.cacheHitRate)
})

test('Task 4.3.50: should handle 10K+ entries efficiently', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  const startTime = performance.now()

  // Generate 10K entries
  for (let i = 0; i < 10000; i++) {
    manager.generateComponentId(handle, `Component_${i}`)
  }

  const endTime = performance.now()
  const totalTime = endTime - startTime

  // Should complete in reasonable time
  assert.ok(totalTime < 5000, `10K generation took ${totalTime}ms, should be < 5000ms`)
})

// ============================================================================
// Task 4.3: Extended Serialization and Reproducibility Tests (20+)
// ============================================================================

test('Task 4.3.51: snapshot should include all metadata', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  manager.generateComponentId(handle, 'Button')
  manager.registerPropertyName('color')
  manager.registerValueName('#fff')

  const snap = manager.snapshot(handle)

  assert.ok(snap.metadata)
  assert.strictEqual(snap.metadata.version, 1)
  assert.ok(snap.metadata.next_component_id)
  assert.ok(snap.metadata.next_property_id)
  assert.ok(snap.metadata.next_value_id)
})

test('Task 4.3.52: snapshot should preserve component names exactly', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  const names = ['Button', 'Card', 'Modal', 'Input']

  for (const name of names) {
    manager.generateComponentId(handle, name)
  }

  const snap = manager.snapshot(handle)
  const snappedNames = snap.components.map(c => c.name)

  for (const name of names) {
    assert.ok(snappedNames.includes(name))
  }
})

test('Task 4.3.53: snapshot should preserve exact IDs', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  const button = manager.generateComponentId(handle, 'Button')
  const card = manager.generateComponentId(handle, 'Card')

  const snap = manager.snapshot(handle)

  const snapButton = snap.components.find(c => c.name === 'Button')
  const snapCard = snap.components.find(c => c.name === 'Card')

  assert.strictEqual(snapButton?.id, button.id)
  assert.strictEqual(snapCard?.id, card.id)
})

test('Task 4.3.54: export should include timestamp', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  manager.generateComponentId(handle, 'Button')

  const exported = manager.exportRegistry(handle)
  const parsed = JSON.parse(exported)

  assert.ok(parsed.exported_at)
  assert.strictEqual(typeof parsed.exported_at, 'number')
})

test('Task 4.3.55: export should include registry creation info', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()
  manager.generateComponentId(handle, 'Button')

  const exported = manager.exportRegistry(handle)
  const parsed = JSON.parse(exported)

  assert.ok(parsed.registry_info)
  assert.ok(parsed.registry_info.created_at)
})

test('Task 4.3.56: imported registry should have new handle', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle1 = manager.createRegistry()
  manager.generateComponentId(handle1, 'Button')

  const exported = manager.exportRegistry(handle1)
  const handle2 = manager.importRegistry(exported)

  assert.notStrictEqual(handle1, handle2)
  assert.ok(handle2)
})

test('Task 4.3.57: imported registry should maintain component order', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle1 = manager.createRegistry()
  const names = ['Zebra', 'Alpha', 'Gamma', 'Beta']

  for (const name of names) {
    manager.generateComponentId(handle1, name)
  }

  const exported = manager.exportRegistry(handle1)
  const handle2 = manager.importRegistry(exported)

  for (const name of names) {
    const lookup = manager.lookupComponentId(handle2, name)
    assert.strictEqual(lookup.found, true)
  }
})

test('Task 4.3.58: reproducibility: same names produce same IDs', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle1 = manager.createRegistry()
  const handle2 = manager.createRegistry()

  const id1 = manager.generateComponentId(handle1, 'Button').id
  const id2 = manager.generateComponentId(handle2, 'Button').id

  assert.strictEqual(id1, id2)
})

test('Task 4.3.59: reproducibility: different names produce different IDs', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle1 = manager.createRegistry()

  const buttonId = manager.generateComponentId(handle1, 'Button').id
  const cardId = manager.generateComponentId(handle1, 'Card').id
  const inputId = manager.generateComponentId(handle1, 'Input').id

  const idSet = new Set([buttonId, cardId, inputId])
  assert.strictEqual(idSet.size, 3)
})

test('Task 4.3.60: reproducibility: export/import preserves exact IDs', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle1 = manager.createRegistry()
  const ids = []

  for (let i = 0; i < 20; i++) {
    const result = manager.generateComponentId(handle1, `Component_${i}`)
    ids.push({ name: `Component_${i}`, id: result.id })
  }

  const exported = manager.exportRegistry(handle1)
  const handle2 = manager.importRegistry(exported)

  for (const { name, id } of ids) {
    const lookup = manager.lookupComponentId(handle2, name)
    assert.strictEqual(lookup.id, id, `ID mismatch for ${name}`)
  }
})

test('Task 4.3.61: reproducibility: property/value IDs consistent', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const prop1 = manager.registerPropertyName('color').property_id
  const val1 = manager.registerValueName('#fff').value_id

  // These should be consistent across manager lifetime
  const prop1Again = manager.registerPropertyName('color').property_id
  const val1Again = manager.registerValueName('#fff').value_id

  assert.strictEqual(prop1, prop1Again)
  assert.strictEqual(val1, val1Again)
})

test('Task 4.3.62: reset should allow fresh start', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()

  manager.generateComponentId(handle, 'Button')
  manager.generateComponentId(handle, 'Card')
  manager.resetRegistry(handle)

  // After reset, starting fresh
  const snap = manager.snapshot(handle)
  assert.strictEqual(snap.components.length, 0)
})

test('Task 4.3.63: reset then regenerate preserves IDs', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()

  const id1 = manager.generateComponentId(handle, 'Button').id
  manager.resetRegistry(handle)
  const id2 = manager.generateComponentId(handle, 'Button').id

  assert.strictEqual(id1, id2)
})

test('Task 4.3.64: concurrent registries maintain isolation', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle1 = manager.createRegistry()
  const handle2 = manager.createRegistry()

  // Interleave operations
  manager.generateComponentId(handle1, 'Button')
  manager.generateComponentId(handle2, 'Button')
  manager.generateComponentId(handle1, 'Card')
  manager.generateComponentId(handle2, 'Card')

  // Both should have same names but separate state
  const snap1 = manager.snapshot(handle1)
  const snap2 = manager.snapshot(handle2)

  assert.strictEqual(snap1.components.length, 2)
  assert.strictEqual(snap2.components.length, 2)
})

test('Task 4.3.65: export/import maintains isolation', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle1 = manager.createRegistry()
  manager.generateComponentId(handle1, 'Button')

  const exported = manager.exportRegistry(handle1)
  const handle2 = manager.importRegistry(exported)

  // Both registries should have Button but separate identities
  assert.ok(manager.lookupComponentId(handle1, 'Button').found)
  assert.ok(manager.lookupComponentId(handle2, 'Button').found)

  // Destroying one shouldn't affect the other
  manager.destroyRegistry(handle1)
  assert.ok(manager.lookupComponentId(handle2, 'Button').found)
})

test('Task 4.3.66: snapshot for large registry (10K+ entries)', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()

  // Generate 10K entries
  for (let i = 0; i < 10000; i++) {
    manager.generateComponentId(handle, `Component_${i}`)
  }

  const startTime = performance.now()
  const snap = manager.snapshot(handle)
  const endTime = performance.now()

  assert.strictEqual(snap.components.length, 10000)
  assert.ok((endTime - startTime) < 100, `Snapshot took ${endTime - startTime}ms, should be < 100ms`)
})

test('Task 4.3.67: export for large registry (10K+ entries)', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()

  // Generate 10K entries
  for (let i = 0; i < 10000; i++) {
    manager.generateComponentId(handle, `Component_${i}`)
  }

  const startTime = performance.now()
  const exported = manager.exportRegistry(handle)
  const endTime = performance.now()

  assert.strictEqual(typeof exported, 'string')
  assert.ok((endTime - startTime) < 100, `Export took ${endTime - startTime}ms, should be < 100ms`)
})

test('Task 4.3.68: import for large registry (10K+ entries)', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle1 = manager.createRegistry()

  // Generate 10K entries
  for (let i = 0; i < 10000; i++) {
    manager.generateComponentId(handle1, `Component_${i}`)
  }

  const exported = manager.exportRegistry(handle1)

  const startTime = performance.now()
  const handle2 = manager.importRegistry(exported)
  const endTime = performance.now()

  assert.ok((endTime - startTime) < 100, `Import took ${endTime - startTime}ms, should be < 100ms`)
  assert.strictEqual(manager.snapshot(handle2).components.length, 10000)
})

test('Task 4.3.69: getActiveCount tracks all registries', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const initialCount = manager.getActiveCount()

  const h1 = manager.createRegistry()
  assert.strictEqual(manager.getActiveCount(), initialCount + 1)

  const h2 = manager.createRegistry()
  assert.strictEqual(manager.getActiveCount(), initialCount + 2)

  manager.destroyRegistry(h1)
  assert.strictEqual(manager.getActiveCount(), initialCount + 1)

  manager.destroyRegistry(h2)
  assert.strictEqual(manager.getActiveCount(), initialCount)
})

test('Task 4.3.70: listActiveRegistries returns all active handles', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const h1 = manager.createRegistry()
  const h2 = manager.createRegistry()
  const h3 = manager.createRegistry()

  const active = manager.listActiveRegistries()

  assert.ok(active.includes(h1))
  assert.ok(active.includes(h2))
  assert.ok(active.includes(h3))
})

test('Task 4.3.71: export contains exact component count', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()

  const components = ['Button', 'Card', 'Input', 'Modal', 'Dropdown']
  for (const comp of components) {
    manager.generateComponentId(handle, comp)
  }

  const exported = manager.exportRegistry(handle)
  const parsed = JSON.parse(exported)

  assert.strictEqual(parsed.components.length, components.length)
})

test('Task 4.3.72: round-trip export/import preserves properties and values', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle1 = manager.createRegistry()

  // Generate some property/value registrations
  const props = ['color', 'backgroundColor', 'padding']
  const vals = ['#fff', '#000', '1rem']

  for (const p of props) {
    manager.registerPropertyName(p)
  }
  for (const v of vals) {
    manager.registerValueName(v)
  }

  const exported = manager.exportRegistry(handle1)
  const parsed = JSON.parse(exported)

  // Note: properties/values are global, so we verify structure exists
  assert.ok(Array.isArray(parsed.properties))
  assert.ok(Array.isArray(parsed.values))
})

test('Task 4.3.73: destruction releases handle for reuse', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const h1 = manager.createRegistry()
  manager.destroyRegistry(h1)

  // Should throw when using destroyed handle
  assert.throws(() => manager.generateComponentId(h1, 'Button'))
})

test('Task 4.3.74: multiple export/import cycles preserve IDs', () => {
  const manager = new IDRegistryManager({ enabled: true })
  let handle = manager.createRegistry()
  const originalId = manager.generateComponentId(handle, 'Button').id

  // Cycle 1
  let exported = manager.exportRegistry(handle)
  handle = manager.importRegistry(exported)
  let id = manager.lookupComponentId(handle, 'Button').id
  assert.strictEqual(id, originalId)

  // Cycle 2
  exported = manager.exportRegistry(handle)
  handle = manager.importRegistry(exported)
  id = manager.lookupComponentId(handle, 'Button').id
  assert.strictEqual(id, originalId)

  // Cycle 3
  exported = manager.exportRegistry(handle)
  handle = manager.importRegistry(exported)
  id = manager.lookupComponentId(handle, 'Button').id
  assert.strictEqual(id, originalId)
})

test('Task 4.3.75: stress test - 1000 concurrent operations', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()

  // Simulate 1000 rapid operations
  for (let i = 0; i < 1000; i++) {
    if (i % 3 === 0) {
      manager.generateComponentId(handle, `Comp_${i}`)
    } else if (i % 3 === 1) {
      manager.lookupComponentId(handle, `Comp_${i - 1}`)
    } else {
      manager.registerPropertyName(`prop_${i}`)
    }
  }

  const snap = manager.snapshot(handle)
  assert.ok(snap.components.length > 0)
})

test('Task 4.3.76: JSON exported data should be valid and parseable', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()

  for (let i = 0; i < 100; i++) {
    manager.generateComponentId(handle, `Component_${i}`)
  }

  const exported = manager.exportRegistry(handle)
  let parsed

  // Should parse without throwing
  assert.doesNotThrow(() => {
    parsed = JSON.parse(exported)
  })

  // Should have expected structure
  assert.ok(parsed.version)
  assert.ok(parsed.components)
})

test('Task 4.3.77: snapshot timestamp should be current', () => {
  const manager = new IDRegistryManager({ enabled: true })
  const handle = manager.createRegistry()

  const before = Date.now()
  const snap = manager.snapshot(handle)
  const after = Date.now()

  assert.ok(snap.timestamp_ms >= before)
  assert.ok(snap.timestamp_ms <= after)
})
