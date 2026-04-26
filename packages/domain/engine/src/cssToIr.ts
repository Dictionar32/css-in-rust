/**
 * tailwind-styled-v4 — CSS → IR converter
 *
 * Native handles: CSS parsing, class extraction, variant splitting, specificity.
 * JS handles: ID generation, layer detection, RuleIR assembly.
 *
 * Removed from JS: parseSelector, calculateSpecificity
 * (native parseCssRules already returns className/variants/specificity).
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
// ID Generator — Factory Pattern
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
// Layer detection (JS — simple string check, not hot path)
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
// parseCssToIr — native parse + JS IR assembly
// ─────────────────────────────────────────────────────────────────────────────

export function parseCssToIr(
  css: string,
  options: ParseCssToIrOptions = {}
): { rules: RuleIR[]; classToRuleIds: Map<string, RuleId[]> } {
  resetIdGenerator()
  layerMap.clear()
  layerOrderMap.clear()

  const native = getNativeEngineBinding()
  if (!native?.parseCssRules) {
    throw new Error("FATAL: Native binding 'parseCssRules' is required but not available.")
  }

  const prefix = options.prefix ?? ""
  const rules: RuleIR[] = []
  const classToRuleIds = new Map<string, RuleId[]>()

  // Native returns: { className, property, value, isImportant, variants, specificity }
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

    // Media query variants produce an unknown condition
    const hasMedia = r.variants.some((v) => v.startsWith("@") || v === "dark" || v === "print")
    const conditionId = hasMedia ? generateConditionId() : null
    const conditionResult = hasMedia ? ConditionResult.Unknown : ConditionResult.Unknown

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
      specificity: r.specificity, // from native — no JS recalculation
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