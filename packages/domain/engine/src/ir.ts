export class RuleId {
  constructor(public readonly value: number) {}
  toString() {
    return `R${this.value}`
  }
}

import { getNativeEngineBinding } from "./native-bridge"

export class SelectorId {
  constructor(public readonly value: number) {}
  toString() {
    return `S${this.value}`
  }
}

export class VariantChainId {
  constructor(public readonly value: number) {}
  toString() {
    return `V${this.value}`
  }
}

export class PropertyId {
  constructor(
    public readonly value: number,
    public readonly name?: string,
  ) {}
  toString() {
    const name = this.name
    if (typeof name === "string" && name.length > 0) {
      return name
    }
    return propertyIdToString(this)
  }
}

export class ValueId {
  constructor(
    public readonly value: number,
    public readonly name?: string,
  ) {}
  toString() {
    const name = this.name
    if (typeof name === "string" && name.length > 0) {
      return name
    }
    return valueIdToString(this)
  }
}

export class LayerId {
  constructor(public readonly value: number) {}
  toString() {
    return `L${this.value}`
  }
}

export class ConditionId {
  constructor(public readonly value: number) {}
  toString() {
    return `C${this.value}`
  }
}

export class CascadeResolutionId {
  constructor(public readonly value: number) {}
  toString() {
    return `R${this.value}`
  }
}

// Registry for property and value names — native Rust DashMap required.

export function registerPropertyName(id: PropertyId, name: string): void {
  const native = getNativeEngineBinding()
  if (!native?.registerPropertyName) {
    throw new Error("FATAL: Native binding 'registerPropertyName' is required but not available.")
  }
  native.registerPropertyName(id.value, name)
}

export function registerValueName(id: ValueId, name: string): void {
  const native = getNativeEngineBinding()
  if (!native?.registerValueName) {
    throw new Error("FATAL: Native binding 'registerValueName' is required but not available.")
  }
  native.registerValueName(id.value, name)
}

export function propertyIdToString(id: PropertyId): string {
  const native = getNativeEngineBinding()
  if (!native?.propertyIdToString) {
    throw new Error("FATAL: Native binding 'propertyIdToString' is required but not available.")
  }
  return native.propertyIdToString(id.value)
}

export function valueIdToString(id: ValueId): string {
  const native = getNativeEngineBinding()
  if (!native?.valueIdToString) {
    throw new Error("FATAL: Native binding 'valueIdToString' is required but not available.")
  }
  return native.valueIdToString(id.value)
}

export enum Origin {
  UserAgent = 0,
  UserNormal = 1,
  AuthorNormal = 2,
  AuthorImportant = 3,
  UserImportant = 4,
}

export enum Importance {
  Normal = 0,
  Important = 1,
}

export enum ConditionResult {
  Active = 0,
  Inactive = 1,
  Unknown = 2,
}

export enum CascadeStage {
  Origin = 0,
  Layer = 1,
  Importance = 2,
  Specificity = 3,
  Order = 4,
}

export type ResolutionCause =
  | { type: "LowerOrigin"; winnerOrigin: Origin; loserOrigin: Origin }
  | { type: "LowerLayer"; winnerLayer: string; loserLayer: string }
  | { type: "LowerImportance" }
  | { type: "LowerSpecificity"; delta: number }
  | { type: "EarlierOrder"; delta: number }
  | { type: "InactiveCondition"; condition: string }

export interface ResolutionReason {
  causes: readonly ResolutionCause[]
  finalDecision: string
}

export interface SelectorIR {
  id: SelectorId
  normalized: string
  specificity: number
  parts: readonly string[]
}

export interface VariantChainIR {
  id: VariantChainId
  chain: readonly VariantChainId[]
  conditionGraphId: number | null
}

export interface ConditionIR {
  id: ConditionId
  conditionType: string
  expression: string
}

export interface RuleIR {
  id: RuleId
  selector: SelectorId
  variantChain: VariantChainId
  property: PropertyId
  value: ValueId
  origin: Origin
  importance: Importance
  layer: LayerId | null
  layerOrder: number
  specificity: number
  condition: ConditionId | null
  conditionResult: ConditionResult
  insertionOrder: number
  fingerprint: string
  source: SourceLocation
}

export interface PropertyBucketIR {
  property: PropertyId
  rules: readonly RuleId[]
}

export interface CascadeResolutionIR {
  id: CascadeResolutionId
  property: PropertyId
  winner: RuleId
  losers: readonly RuleId[]
  reason: ResolutionReason
  stage: CascadeStage
}

export interface StyleGraphIR {
  ruleConflicts: Map<RuleId, readonly RuleId[]>
}

export interface FinalComputedStyleIR {
  className: string
  resolvedProperties: Map<PropertyId, CascadeResolutionId>
}

export interface SourceLocation {
  file: string
  line: number
  column: number
}

/**
 * Generate a short fingerprint string from a list of ordered parts.
 * Native-only: delegates to Rust `create_fingerprint()` (FNV-1a, base-36 output).
 */
export function createFingerprint(parts: string[]): string {
  const native = getNativeEngineBinding()
  if (!native?.createFingerprint) {
    throw new Error("FATAL: Native binding 'createFingerprint' is required but not available.")
  }
  return native.createFingerprint(parts)
}

// compareCascadeOrder removed — cascade sort is now handled by Rust resolve_cascade().

export function createResolutionReason(
  causes: ResolutionCause[],
  finalDecision: string
): ResolutionReason {
  return {
    causes: [...causes],
    finalDecision,
  }
}

/*
/**
 * Jumlah ID generator registry yang aktif di native layer.
 * Dipakai untuk debugging memory leak atau registry leak di dev mode.
 *
 * Returns 0 jika native tidak tersedia.
 *\/
export function getActiveIdRegistryCount(): number {
  const native = getNativeEngineBinding()
  return native?.idRegistryActiveCount?.() ?? 0
}
*/

export function getActiveIdRegistryCount(): number {
  const native = getNativeEngineBinding()
  return native?.idRegistryActiveCount?.() ?? 0
}