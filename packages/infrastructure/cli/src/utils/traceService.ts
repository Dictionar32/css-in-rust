/**
 * tailwind-styled-v4 — CLI Trace Service
 *
 * Removed: local CascadeResolver duplicate (JS cascade sort).
 * Now uses CascadeResolver from @tailwind-styled/engine (Rust-backed).
 * Also removed: local parseSelector, calculateSpecificity, parseCssToIr.
 * These are handled by native parseCssRules + resolve_cascade.
 */

import { type CssCompileResult, compileCssFromClasses } from "@tailwind-styled/compiler/internal"
import {
  CascadeResolver,
  parseCssToIr,
  trace,
  type VariantTrace,
  type RuleTrace,
  type ConflictTrace,
  type FinalStyleProperty,
} from "@tailwind-styled/engine/internal"
import { scanWorkspace } from "@tailwind-styled/scanner"
import { TwError, wrapUnknownError } from "@tailwind-styled/shared"
import type { TraceResult as EngineTraceResult } from "@tailwind-styled/engine/internal"

export interface TraceResult {
  class: string
  definedAt: { file: string; line: number; column: number }
  variants: Array<{ name: string; value: string; source: { file: string; line: number } }>
  rules: Array<{
    property: string
    value: string
    applied: boolean
    reason: string | null
    source: { file: string; line: number }
    specificity: number
  }>
  conflicts: Array<{
    property: string
    winner: string
    loser: string
    stage: string
    causes: string[]
  }>
  finalStyle: Array<{ property: string; value: string }>
}

export interface TraceOptions {
  root?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Safe toString helper for engine IR objects (PropertyId, ValueId, etc.)
// ─────────────────────────────────────────────────────────────────────────────

function safeToString(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    if (typeof obj.name === "string" && obj.name.length > 0) return obj.name
    if (obj.value !== undefined) return String(obj.value)
    const toStr = obj.toString
    if (typeof toStr === "function") {
      try {
        const result = toStr.call(value)
        if (typeof result === "string" && result !== "[object Object]") return result
      } catch {}
    }
    return "?"
  }
  return String(value)
}

// ─────────────────────────────────────────────────────────────────────────────
// traceClass — delegates to engine's native-backed resolver
// ─────────────────────────────────────────────────────────────────────────────

export async function traceClass(className: string, options?: TraceOptions): Promise<TraceResult> {
  const root = options?.root ?? process.cwd()

  const scanResult = await scanWorkspace(root, {
    includeExtensions: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"],
    ignoreDirectories: ["node_modules", ".git", ".next", "dist", "out", ".turbo", ".cache"],
    useCache: false,
  })

  if (!scanResult.uniqueClasses.includes(className)) {
    throw TwError.fromCompile(
      "TRACE_CLASS_NOT_FOUND",
      `Class "${className}" not found in workspace scan. Make sure the class is used in your source files.`
    )
  }

  const cssResult: CssCompileResult = (() => {
    try {
      return compileCssFromClasses([className], "")
    } catch (error) {
      throw wrapUnknownError(
        "compile",
        "TRACE_COMPILE_FAILED",
        `Failed to compile CSS for class "${className}": ${error instanceof Error ? error.message : String(error)}`
      )
    }
  })()

  if (!cssResult.code || cssResult.code.trim() === "") {
    throw TwError.fromCompile(
      "TRACE_NO_CSS_RULES",
      `Class "${className}" has no CSS rules. The class may not be a valid Tailwind class.`
    )
  }

  // Native-backed: parseCssToIr uses native parseCssRules
  const { rules, classToRuleIds } = parseCssToIr(cssResult.code)

  const ruleIds = classToRuleIds.get(className)
  if (!ruleIds || ruleIds.length === 0) {
    throw TwError.fromCompile(
      "TRACE_NO_RULES_FOUND",
      `No rules found for class "${className}" after parsing CSS.`
    )
  }

  // Native-backed: CascadeResolver uses Rust resolve_cascade
  const resolver = new CascadeResolver()
  resolver.addRules(rules)
  resolver.registerClass(className, ruleIds)

  // trace() delegates to resolver.resolveByClassName() → Rust
  const engineResult = trace(className, resolver)

  // Convert engine types to plain TraceResult
  const result: EngineTraceResult = {
    class: safeToString(engineResult.class),
    definedAt: {
      file: safeToString(engineResult.definedAt.file),
      line: Number(engineResult.definedAt.line) || 0,
      column: Number(engineResult.definedAt.column) || 0,
    },
    variants: engineResult.variants.map((v: VariantTrace) => ({
      name: safeToString(v.name),
      value: safeToString(v.value),
      source: {
        file: safeToString(v.source?.file ?? ""),
        line: Number(v.source?.line ?? 0),
        column: Number(v.source?.column ?? 0),
      },
    })),
    rules: engineResult.rules.map((r: RuleTrace) => ({
      property: safeToString(r.property),
      value: safeToString(r.value),
      applied: Boolean(r.applied),
      reason: r.reason ? safeToString(r.reason) : null,
      source: {
        file: safeToString(r.source?.file ?? ""),
        line: Number(r.source?.line ?? 0),
        column: Number(r.source?.column ?? 0),
      },
      specificity: Number(r.specificity ?? 0),
    })),
    conflicts: engineResult.conflicts.map((c: ConflictTrace) => ({
      property: safeToString(c.property),
      winner: safeToString(c.winner),
      loser: safeToString(c.loser),
      stage: safeToString(c.stage),
      causes: (c.causes ?? []).map(safeToString),
    })),
    finalStyle: engineResult.finalStyle.map((f: FinalStyleProperty) => ({
      property: safeToString(f.property),
      value: safeToString(f.value),
    })),
  }
  return result as unknown as TraceResult
}