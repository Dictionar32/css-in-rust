/**
 * tailwind-styled-v4 — Cascade Tracer
 *
 * Delegates cascade resolution to CascadeResolver (Rust-backed).
 * JS layer: format trace output only.
 *
 * Removed from JS: resolvePropertyTraced, compareCascadeTraced,
 * buildResolutionReasonTraced, determineCascadeStageTraced.
 */

import {
  CascadeResolutionId,
  type CascadeResolutionIR,
  CascadeStage,
  type PropertyId,
  type ResolutionCause,
  type RuleIR,
  type SourceLocation,
} from "./ir"
import type { CascadeResolver } from "./resolver"

export interface VariantTrace {
  name: string
  value: string
  source: SourceLocation
}

export interface RuleTrace {
  property: string
  value: string
  applied: boolean
  reason: string | null
  source: SourceLocation
  specificity: number
}

export interface ConflictTrace {
  property: string
  winner: string
  loser: string
  stage: string
  causes: string[]
}

export interface FinalStyleProperty {
  property: string
  value: string
}

export interface TraceResult {
  class: string
  definedAt: SourceLocation
  variants: VariantTrace[]
  rules: RuleTrace[]
  conflicts: ConflictTrace[]
  finalStyle: FinalStyleProperty[]
}

export interface ProvenanceData {
  className: string
  source: SourceLocation
  variants: Map<string, VariantTrace>
  rules: Map<string, RuleIR[]>
}

export function buildProvenanceChain(className: string): ProvenanceData {
  return {
    className,
    source: { file: "", line: 0, column: 0 },
    variants: new Map(),
    rules: new Map(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatting helpers (JS-only, pure display logic)
// ─────────────────────────────────────────────────────────────────────────────

function formatCause(c: ResolutionCause): string {
  switch (c.type) {
    case "LowerOrigin":      return "lower origin"
    case "LowerLayer":       return "lower layer"
    case "LowerImportance":  return "lower importance"
    case "LowerSpecificity": return `specificity ${c.delta}`
    case "EarlierOrder":     return `earlier order ${c.delta}`
    case "InactiveCondition": return "inactive condition"
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// trace — delegates resolution to Rust via CascadeResolver
// ─────────────────────────────────────────────────────────────────────────────

export function trace(className: string, resolver: CascadeResolver): TraceResult {
  const provenance = buildProvenanceChain(className)

  // Collect all rules for this class
  const classRuleIds = resolver.getClassRules(className)
  const allRules: RuleIR[] = []

  if (classRuleIds) {
    for (const ruleId of classRuleIds) {
      const rule = resolver.getRule(ruleId)
      if (rule) allRules.push(rule)
    }
  }

  for (const rules of provenance.rules.values()) {
    allRules.push(...rules)
  }

  // Group rules by property (for trace display)
  const rulesByProperty = new Map<string, RuleIR[]>()
  for (const rule of allRules) {
    const propKey = rule.property.toString()
    const bucket = rulesByProperty.get(propKey) ?? []
    bucket.push(rule)
    rulesByProperty.set(propKey, bucket)
  }

  // Resolve via Rust (through CascadeResolver)
  const resolved = resolver.resolveByClassName(className)

  const ruleTraces: RuleTrace[] = []
  const conflictTraces: ConflictTrace[] = []

  if (resolved) {
    for (const [propId, resolution] of resolved.resolvedProperties) {
      const property = propId.toString()
      const rules = rulesByProperty.get(property) ?? []

      const winnerRule = rules.find((r) => r.id.value === resolution.winner.value)

      if (winnerRule) {
        ruleTraces.push({
          property,
          value: winnerRule.value.toString(),
          applied: true,
          reason: null,
          source: winnerRule.source,
          specificity: winnerRule.specificity,
        })
      }

      for (const loserId of resolution.losers) {
        const loserRule = rules.find((r) => r.id.value === loserId.value)
        if (!loserRule) continue

        ruleTraces.push({
          property,
          value: loserRule.value.toString(),
          applied: false,
          reason: resolution.reason.finalDecision,
          source: loserRule.source,
          specificity: loserRule.specificity,
        })

        conflictTraces.push({
          property,
          winner: winnerRule?.value.toString() ?? "",
          loser: loserRule.value.toString(),
          stage: CascadeStage[resolution.stage],
          causes: resolution.reason.causes.map(formatCause),
        })
      }
    }
  }

  // Build finalStyle from resolved properties
  const finalStyle: FinalStyleProperty[] = []
  if (resolved) {
    for (const [propId, resolution] of resolved.resolvedProperties) {
      const winnerRule = allRules.find((r) => r.id.value === resolution.winner.value)
      finalStyle.push({
        property: propId.toString(),
        value: winnerRule?.value.toString() ?? "",
      })
    }
  }

  return {
    class: className,
    definedAt: provenance.source,
    variants: Array.from(provenance.variants.values()),
    rules: ruleTraces,
    conflicts: conflictTraces,
    finalStyle,
  }
}