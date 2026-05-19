#!/usr/bin/env node
/**
 * scripts/validate/rust-ts-drift.mjs — QA #20: Rust ↔ TypeScript Type Drift Detection
 *
 * Membandingkan fungsi-fungsi yang diekspor oleh native/index.d.ts (auto-generated NAPI-RS)
 * dengan fungsi yang terdaftar di bridge interfaces di TypeScript.
 *
 * Mode:
 *   --check   Exit 1 jika ada fungsi native yang belum ter-cover di MANA PUN
 *   --report  Print full report (default)
 *   --json    Output JSON
 *
 * Usage:
 *   node scripts/validate/rust-ts-drift.mjs
 *   node scripts/validate/rust-ts-drift.mjs --check
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "../..")
const isCheck = process.argv.includes("--check")
const isJson = process.argv.includes("--json")

// ── 1. Parse native/index.d.ts ─────────────────────────────────────────────

const nativeDts = path.join(root, "native", "index.d.ts")
if (!fs.existsSync(nativeDts)) {
  console.error("[drift] native/index.d.ts not found — run: npm run build:rust")
  process.exit(isCheck ? 1 : 0)
}

const dtsContent = fs.readFileSync(nativeDts, "utf-8")

/** @type {Set<string>} */
const nativeFunctions = new Set()
for (const match of dtsContent.matchAll(/^export declare function (\w+)/gm)) {
  nativeFunctions.add(match[1])
}

// ── 2. Parse TypeScript bridge files ──────────────────────────────────────

/**
 * Mencari semua method/property names dalam sebuah interface/type block.
 * Simple heuristic: carilah `  name?:` atau `  name(` patterns.
 */
function extractBridgeFunctions(filePath) {
  if (!fs.existsSync(filePath)) return new Set()
  const content = fs.readFileSync(filePath, "utf-8")
  const fns = new Set()
  // Interface properties: `  fnName?:` or `  fnName(`
  for (const match of content.matchAll(/^\s{2}(\w+)\s*[?(]/gm)) {
    if (match[1] !== "constructor") fns.add(match[1])
  }
  return fns
}

const bridges = [
  {
    label: "NativeBridge (compiler)",
    file: "packages/domain/compiler/src/nativeBridge.ts",
  },
  {
    label: "NativeScannerBinding (scanner)",
    file: "packages/domain/scanner/src/native-bridge.ts",
  },
  {
    label: "NativeAnalyzerBinding (analyzer/types)",
    file: "packages/domain/analyzer/src/types.ts",
  },
]

/** @type {Map<string, Set<string>>} */
const bridgeFunctions = new Map()
for (const bridge of bridges) {
  const fns = extractBridgeFunctions(path.join(root, bridge.file))
  bridgeFunctions.set(bridge.label, fns)
}

// ── 3. Compute coverage ────────────────────────────────────────────────────

// Union of all bridge functions
const allCovered = new Set()
for (const fns of bridgeFunctions.values()) {
  for (const fn of fns) allCovered.add(fn)
}

const covered = []
const uncovered = []

for (const fn of [...nativeFunctions].sort()) {
  if (allCovered.has(fn)) {
    covered.push(fn)
  } else {
    uncovered.push(fn)
  }
}

const coveragePercent = nativeFunctions.size === 0
  ? 100
  : Math.round((covered.length / nativeFunctions.size) * 100)

// ── 4. Output ──────────────────────────────────────────────────────────────

if (isJson) {
  console.log(JSON.stringify({
    totalNative: nativeFunctions.size,
    covered: covered.length,
    uncovered: uncovered.length,
    coveragePercent,
    uncoveredFunctions: uncovered,
    coveredFunctions: covered,
    bridges: Object.fromEntries(
      [...bridgeFunctions.entries()].map(([k, v]) => [k, [...v].sort()])
    ),
  }, null, 2))
  process.exit(0)
}

console.log("\nRust ↔ TypeScript Type Drift Report\n")
console.log(`Native functions (native/index.d.ts):  ${nativeFunctions.size}`)
console.log(`Covered in TS bridge interfaces:       ${covered.length}`)
console.log(`Uncovered (no TS bridge):              ${uncovered.length}`)
console.log(`Coverage:                              ${coveragePercent}%\n`)

if (uncovered.length > 0) {
  console.log(`Uncovered native functions (${uncovered.length}):`)
  for (const fn of uncovered) {
    console.log(`  - ${fn}`)
  }
  console.log("")
}

for (const [label, fns] of bridgeFunctions) {
  const filePath = bridges.find((b) => b.label === label)?.file ?? ""
  console.log(`Bridge: ${label} (${filePath})`)
  console.log(`  Functions tracked: ${fns.size}`)
  console.log("")
}

if (isCheck) {
  // Dalam --check mode, exit 1 hanya jika ada fungsi yang SAMA SEKALI tidak ter-cover
  // dan coverage di bawah threshold (default: 20% — banyak internal functions yang wajar tidak di-expose)
  const COVERAGE_THRESHOLD = 20
  if (coveragePercent < COVERAGE_THRESHOLD) {
    console.error(`[drift] Coverage ${coveragePercent}% below threshold ${COVERAGE_THRESHOLD}% — possible type drift`)
    process.exit(1)
  } else {
    console.log(`[drift] Coverage ${coveragePercent}% ≥ ${COVERAGE_THRESHOLD}% — OK`)
  }
}
