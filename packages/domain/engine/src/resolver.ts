/**
 * tailwind-styled-v4 — Cascade Resolver
 *
 * JS layer: state management (rule collection, class registration).
 * Rust layer: cascade algorithm (sort, compare, resolve winner/loser).
 *
 * Moved to native: compareCascade, resolveProperty, buildResolutionReason,
 * determineCascadeStage — all pure computation, zero browser API.
 *
 * Rust #[napi] fn: resolve_cascade(rules_json: String) -> String
 */

import {
  CascadeResolutionId,
  type CascadeResolutionIR,
  type PropertyBucketIR,
  type PropertyId,
  type ResolutionCause,
  type RuleId,
  type RuleIR,
  type StyleGraphIR,
} from "./ir"
import { getNativeEngineBinding } from "./native-bridge"

// ─────────────────────────────────────────────────────────────────────────────
// Types for native resolve_cascade I/O
// ─────────────────────────────────────────────────────────────────────────────

interface NativeRuleInput {
  id: number
  property: number
  origin: number
  importance: number
  layerOrder: number
  specificity: number
  conditionResult: number
  insertionOrder: number
}

interface NativeCascadeResolution {
  id: number
  propertyId: number
  winnerId: number
  loserIds: number[]
  stage: number
  finalDecision: string
  causes: ResolutionCause[]
}

interface NativeCascadeResult {
  resolutions: NativeCascadeResolution[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toNativeInput(rule: RuleIR): NativeRuleInput {
  return {
    id: rule.id.value,
    property: rule.property.value,
    origin: rule.origin,
    importance: rule.importance,
    layerOrder: rule.layerOrder,
    specificity: rule.specificity,
    conditionResult: rule.conditionResult,
    insertionOrder: rule.insertionOrder,
  }
}

function callResolveCascade(rules: RuleIR[]): NativeCascadeResult {
  const native = getNativeEngineBinding()
  if (!native.resolveCascade) {
    throw new Error(
      "FATAL: Native binding 'resolveCascade' is required but not available.\n" +
      "This function requires native Rust bindings.\n\n" +
      "Resolution steps:\n" +
      "1. Build the native Rust module: npm run build:rust"
    )
  }
  const json = JSON.stringify(rules.map(toNativeInput))
  return JSON.parse(native.resolveCascade(json)) as NativeCascadeResult
}

function buildResolutionsMap(
  nativeResult: NativeCascadeResult,
  rules: RuleIR[],
  styleGraph: StyleGraphIR
): Map<PropertyId, CascadeResolutionIR> {
  // Build propertyValue → PropertyId instance lookup
  const propertyIdMap = new Map<number, PropertyId>()
  for (const rule of rules) {
    if (!propertyIdMap.has(rule.property.value)) {
      propertyIdMap.set(rule.property.value, rule.property)
    }
  }

  const resolvedProperties = new Map<PropertyId, CascadeResolutionIR>()

  for (const res of nativeResult.resolutions) {
    const propertyId = propertyIdMap.get(res.propertyId)
    if (!propertyId) continue

    const winner: RuleId = { value: res.winnerId }
    const losers: RuleId[] = res.loserIds.map((v) => ({ value: v }))

    // Update style graph
    const existing = styleGraph.ruleConflicts.get(winner) ?? []
    styleGraph.ruleConflicts.set(winner, [...existing, ...losers.filter((l) => !existing.some((e) => e.value === l.value))])

    resolvedProperties.set(propertyId, {
      id: new CascadeResolutionId(res.id),
      property: propertyId,
      winner,
      losers,
      reason: { causes: res.causes, finalDecision: res.finalDecision },
      stage: res.stage,
    })
  }

  return resolvedProperties
}

// ─────────────────────────────────────────────────────────────────────────────
// CascadeResolver — JS state manager, Rust resolver
// ─────────────────────────────────────────────────────────────────────────────

export class CascadeResolver {
  private readonly rules: Map<RuleId, RuleIR> = new Map()
  private readonly classRules: Map<string, RuleId[]> = new Map()
  private readonly styleGraph: StyleGraphIR = { ruleConflicts: new Map() }

  addRule(rule: RuleIR): void {
    this.rules.set(rule.id, rule)
  }

  addRules(rules: RuleIR[]): void {
    for (const rule of rules) this.addRule(rule)
  }

  registerClass(className: string, ruleIds: RuleId[]): void {
    this.classRules.set(className, ruleIds)
  }

  getRule(ruleId: RuleId): RuleIR | undefined {
    return this.rules.get(ruleId)
  }

  getClassRules(className: string): RuleId[] | undefined {
    return this.classRules.get(className)
  }

  getStyleGraph(): StyleGraphIR {
    return this.styleGraph
  }

  /**
   * Resolve cascade for a specific class.
   * Delegates sort + winner selection to Rust.
   */
  resolveByClassName(
    className: string
  ): { resolvedProperties: Map<PropertyId, CascadeResolutionIR> } | null {
    const ruleIds = this.classRules.get(className)
    if (!ruleIds || ruleIds.length === 0) return null

    const classRules = ruleIds
      .map((id) => this.rules.get(id))
      .filter((r): r is RuleIR => r !== undefined)

    if (classRules.length === 0) return null

    const nativeResult = callResolveCascade(classRules)
    return { resolvedProperties: buildResolutionsMap(nativeResult, classRules, this.styleGraph) }
  }

  /**
   * Resolve cascade for all rules.
   * Delegates sort + winner selection to Rust.
   */
  resolveAllProperties(): Map<PropertyId, CascadeResolutionIR> {
    const allRules = Array.from(this.rules.values())
    if (allRules.length === 0) return new Map()

    const nativeResult = callResolveCascade(allRules)
    return buildResolutionsMap(nativeResult, allRules, this.styleGraph)
  }

  /**
   * Resolve cascade for a specific set of rule IDs.
   */
  resolveForClass(classRuleIds: RuleId[]): Map<PropertyId, CascadeResolutionIR> {
    const classRules = classRuleIds
      .map((id) => this.rules.get(id))
      .filter((r): r is RuleIR => r !== undefined)

    if (classRules.length === 0) return new Map()

    const nativeResult = callResolveCascade(classRules)
    return buildResolutionsMap(nativeResult, classRules, this.styleGraph)
  }

  /**
   * Resolve cascade for a single property bucket.
   */
  resolveProperty(property: PropertyId): CascadeResolutionIR | null {
    const bucketRuleIds = Array.from(this.rules.values())
      .filter((r) => r.property.value === property.value)

    if (bucketRuleIds.length === 0) return null

    const nativeResult = callResolveCascade(bucketRuleIds)
    const resolved = buildResolutionsMap(nativeResult, bucketRuleIds, this.styleGraph)
    return resolved.get(property) ?? null
  }

  // ── Legacy accessors (kept for API compatibility) ─────────────────────────

  getBucket(property: PropertyId): PropertyBucketIR | undefined {
    const rules = Array.from(this.rules.values())
      .filter((r) => r.property.value === property.value)
    if (rules.length === 0) return undefined
    return { property, rules: rules.map((r) => r.id) }
  }

  getAllBuckets(): Map<PropertyId, PropertyBucketIR> {
    const buckets = new Map<PropertyId, PropertyBucketIR>()
    const propertyIdMap = new Map<number, PropertyId>()

    for (const rule of this.rules.values()) {
      if (!propertyIdMap.has(rule.property.value)) {
        propertyIdMap.set(rule.property.value, rule.property)
      }
    }

    for (const [, propertyId] of propertyIdMap) {
      const rules = Array.from(this.rules.values())
        .filter((r) => r.property.value === propertyId.value)
      buckets.set(propertyId, { property: propertyId, rules: rules.map((r) => r.id) })
    }

    return buckets
  }

  getResolution(_id: CascadeResolutionId): CascadeResolutionIR | undefined {
    // Resolutions are not cached — re-resolve on demand
    return undefined
  }
}