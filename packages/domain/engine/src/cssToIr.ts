/**
 * tailwind-styled-v4 — CSS → IR converter
 *
 * Native handles: CSS parsing, class extraction, variant splitting, specificity,
 *                 ID assignment, fingerprinting, layer detection, IR assembly.
 * JS handles:     Typed ID wrapper construction, RuleIR object shape.
 *
 * ## Migration summary (Priority 1)
 * Sebelum: `parseCssRules()` + JS loop (N × NAPI calls untuk fingerprint + propertyId + valueId)
 * Sesudah: `assembleCssIr()` → satu NAPI call, JS hanya wrap angka ke typed objects
 */

import { getNativeEngineBinding } from "./native-bridge"
import {
  ConditionId,
  ConditionResult,
  createFingerprint,
  Importance,
  LayerId,
  Origin,
  PropertyId,
  RuleId,
  type RuleIR,
  registerPropertyName,
  registerValueName,
  SelectorId,
  ValueId,
  VariantChainId,
} from "./ir"

export interface ParseCssToIrOptions {
  prefix?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ID Generator — dipertahankan untuk fallback path saja
// Tidak dipakai di fast path (assembleCssIr sudah handle semua ID di Rust)
// ─────────────────────────────────────────────────────────────────────────────

function createIdGenerator() {
  const state = {
    ruleIdCounter: 0,
    selectorIdCounter: 0,
    propertyIdCounter: 0,
    valueIdCounter: 0,
    layerIdCounter: 0,
    conditionIdCounter: 0,
    insertionOrderCounter: 0,
  }
  return {
    generateRuleId: (): RuleId => new RuleId(state.ruleIdCounter++),
    generateSelectorId: (): SelectorId => new SelectorId(state.selectorIdCounter++),
    generatePropertyId: (name: string): PropertyId => {
      const id = new PropertyId(state.propertyIdCounter++)
      registerPropertyName(id, name)
      return id
    },
    generateValueId: (name: string): ValueId => {
      const id = new ValueId(state.valueIdCounter++)
      registerValueName(id, name)
      return id
    },
    generateLayerId: (): LayerId => new LayerId(state.layerIdCounter++),
    generateConditionId: (): ConditionId => new ConditionId(state.conditionIdCounter++),
    getNextInsertionOrder: (): number => state.insertionOrderCounter++,
    reset: (): void => {
      state.ruleIdCounter = 0
      state.selectorIdCounter = 0
      state.propertyIdCounter = 0
      state.valueIdCounter = 0
      state.layerIdCounter = 0
      state.conditionIdCounter = 0
      state.insertionOrderCounter = 0
    },
  }
}

const _defaultIdGen = createIdGenerator()
const generateRuleId = (): RuleId => _defaultIdGen.generateRuleId()
const generateSelectorId = (): SelectorId => _defaultIdGen.generateSelectorId()
const generatePropertyId = (name: string): PropertyId => _defaultIdGen.generatePropertyId(name)
const generateValueId = (name: string): ValueId => _defaultIdGen.generateValueId(name)
const generateLayerId = (): LayerId => _defaultIdGen.generateLayerId()
const generateConditionId = (): ConditionId => _defaultIdGen.generateConditionId()
const getNextInsertionOrder = (): number => _defaultIdGen.getNextInsertionOrder()
const resetIdGenerator = (): void => _defaultIdGen.reset()

// ─────────────────────────────────────────────────────────────────────────────
// Layer helpers — dipertahankan untuk fallback path saja
// ─────────────────────────────────────────────────────────────────────────────

const layerMap: Map<string, LayerId> = new Map()
const layerOrderMap: Map<string, number> = new Map()

const LAYER_ORDER: Record<string, number> = {
  base: 0,
  components: 1,
  utilities: 2,
  tailwind: 3,
}

function getOrCreateLayerId(layerName: string): LayerId {
  const existing = layerMap.get(layerName)
  if (existing) return existing

  const layerId = generateLayerId()
  layerMap.set(layerName, layerId)
  layerOrderMap.set(layerName, LAYER_ORDER[layerName] ?? 4)
  return layerId
}

function detectLayerFromClassName(className: string): string | null {
  if (className.startsWith("tw-") || className.startsWith("tailwind-")) return "tailwind"
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Type definitions untuk AssembledRuleIr dari Rust
// ─────────────────────────────────────────────────────────────────────────────

interface AssembledRuleIr {
  ruleId: number
  selectorId: number
  propertyId: number
  valueId: number
  layerId: number        // -1 jika tidak ada layer
  conditionId: number    // -1 jika tidak ada condition
  propertyName: string
  valueName: string
  layerName: string      // "" jika tidak ada layer
  origin: number
  importance: number
  layerOrder: number
  specificity: number
  conditionResult: number
  insertionOrder: number
  fingerprint: string
  className: string
}

interface ClassRuleMapping {
  className: string
  ruleIds: number[]
}

interface LayerEntry {
  name: string
  layerId: number
  order: number
}

interface AssembledIrResult {
  rules: AssembledRuleIr[]
  classToRuleIds: ClassRuleMapping[]
  layers: LayerEntry[]
}

// ─────────────────────────────────────────────────────────────────────────────
// parseCssToIr — fast path via assembleCssIr, fallback ke loop lama
// ─────────────────────────────────────────────────────────────────────────────

export function parseCssToIr(
  css: string,
  options: ParseCssToIrOptions = {}
): { rules: RuleIR[]; classToRuleIds: Map<string, RuleId[]> } {
  const native = getNativeEngineBinding()
  const prefix = options.prefix ?? ""

  // ── Fast path: satu NAPI call → semua IDs + fingerprint sudah di-assign Rust ──
  if (native?.assembleCssIr) {
    return _parseCssToIrFast(native.assembleCssIr(css, prefix || null) as AssembledIrResult)
  }

  // ── Fallback: pola lama (N × NAPI calls per rule) ────────────────────────
  // Dipertahankan untuk kompatibilitas binary lama sebelum rebuild.
  return _parseCssToIrFallback(css, prefix, native)
}

// ─────────────────────────────────────────────────────────────────────────────
// Fast path: wrap AssembledIrResult → typed RuleIR objects
// Zero computation — hanya wrap angka ke typed class instances
// ─────────────────────────────────────────────────────────────────────────────

function _parseCssToIrFast(
  assembled: AssembledIrResult
): { rules: RuleIR[]; classToRuleIds: Map<string, RuleId[]> } {
  const native = getNativeEngineBinding()

  // Rebuild layerMap dari data Rust (untuk konsistensi kalau caller butuh layerMap)
  layerMap.clear()
  layerOrderMap.clear()
  for (const le of assembled.layers) {
    const lid = new LayerId(le.layerId)
    layerMap.set(le.name, lid)
    layerOrderMap.set(le.name, le.order)
  }

  // Wrap tiap AssembledRuleIr → RuleIR
  const rules: RuleIR[] = assembled.rules.map((r) => {
    const propertyId = new PropertyId(r.propertyId)
    const valueId = new ValueId(r.valueId)

    // Register names ke native registry (untuk propertyIdToString / valueIdToString)
    if (native?.registerPropertyName) {
      native.registerPropertyName(r.propertyId, r.propertyName)
    } else {
      registerPropertyName(propertyId, r.propertyName)
    }
    if (native?.registerValueName) {
      native.registerValueName(r.valueId, r.valueName)
    } else {
      registerValueName(valueId, r.valueName)
    }

    return {
      id: new RuleId(r.ruleId),
      selector: new SelectorId(r.selectorId),
      variantChain: new VariantChainId(0),
      property: propertyId,
      value: valueId,
      origin: r.origin as Origin,
      importance: r.importance as Importance,
      layer: r.layerId >= 0 ? new LayerId(r.layerId) : null,
      layerOrder: r.layerOrder,
      specificity: r.specificity,
      condition: r.conditionId >= 0 ? new ConditionId(r.conditionId) : null,
      conditionResult: r.conditionResult as ConditionResult,
      insertionOrder: r.insertionOrder,
      fingerprint: r.fingerprint,
      source: { file: "", line: 1, column: 1 },
    } satisfies RuleIR
  })

  // Rebuild classToRuleIds Map
  const classToRuleIds = new Map<string, RuleId[]>(
    assembled.classToRuleIds.map((m) => [
      m.className,
      m.ruleIds.map((id) => new RuleId(id)),
    ])
  )

  return { rules, classToRuleIds }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback path: pola lama — N × NAPI calls
// Identik dengan implementasi sebelumnya, tidak dimodifikasi
// ─────────────────────────────────────────────────────────────────────────────

function _parseCssToIrFallback(
  css: string,
  prefix: string,
  native: ReturnType<typeof getNativeEngineBinding>
): { rules: RuleIR[]; classToRuleIds: Map<string, RuleId[]> } {
  if (!native?.parseCssRules) {
    throw new Error("FATAL: Native binding 'parseCssRules' is required but not available.")
  }

  resetIdGenerator()
  layerMap.clear()
  layerOrderMap.clear()

  const rules: RuleIR[] = []
  const classToRuleIds = new Map<string, RuleId[]>()

  const parsed = native.parseCssRules(css)

  for (const r of parsed) {
    const className = prefix + r.className
    const hasVariants = r.variants.length > 0

    const layerName = detectLayerFromClassName(className)
    const layer = layerName ? getOrCreateLayerId(layerName) : null
    const layerOrder = layerName ? (layerOrderMap.get(layerName) ?? 4) : 4

    const selectorId = generateSelectorId()
    const propertyId = generatePropertyId(r.property)
    const valueId = generateValueId(r.value)

    const hasMedia = r.variants.some((v) => v.startsWith("@") || v === "dark" || v === "print")
    const conditionId = hasMedia ? generateConditionId() : null
    const conditionResult = ConditionResult.Unknown

    const ruleId = generateRuleId()
    const fingerprint = createFingerprint([className, r.property, r.value])

    const rule: RuleIR = {
      id: ruleId,
      selector: selectorId,
      variantChain: new VariantChainId(0),
      property: propertyId,
      value: valueId,
      origin: Origin.AuthorNormal,
      importance: r.isImportant ? Importance.Important : Importance.Normal,
      layer,
      layerOrder,
      specificity: r.specificity,
      condition: conditionId,
      conditionResult,
      insertionOrder: getNextInsertionOrder(),
      fingerprint,
      source: { file: "", line: 1, column: 1 },
    }

    rules.push(rule)

    const existing = classToRuleIds.get(className) ?? []
    existing.push(ruleId)
    classToRuleIds.set(className, existing)
  }

  return { rules, classToRuleIds }
}