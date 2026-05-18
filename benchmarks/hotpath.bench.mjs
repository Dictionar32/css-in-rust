/**
 * tailwind-styled-v4 — Hot Path Benchmark Suite
 *
 * Mengukur semua fungsi yang berada di render/import hot path:
 *   - normalizeClassInput    (merge.ts)
 *   - flattenInputs          (cx.ts)
 *   - parseTemplateFallback  (twProxy.ts)
 *   - hashState / hashContainer (stateEngine, containerQuery)
 *   - resolveVariants        (createComponent.ts)
 *   - lookupGenerated key    (cv.ts)
 *   - _templateParseCache hit vs miss
 *
 * Cara pakai:
 *   node benchmarks/hotpath.bench.mjs
 *
 * Tidak perlu build atau native binary — semua diimplementasikan ulang
 * inline untuk bisa dibandingkan before vs after tanpa dependency.
 *
 * Output: tabel µs/op dengan kolom BEFORE | AFTER | SPEEDUP
 */

import { performance } from "node:perf_hooks"

// ─────────────────────────────────────────────────────────────────────────────
// Bench runner
// ─────────────────────────────────────────────────────────────────────────────

const WARMUP = 2_000
const RUNS   = 50_000

/**
 * Jalankan fn sebanyak WARMUP kali (JIT warmup), lalu ukur RUNS kali.
 * Kembalikan { ops, µsPerOp }.
 */
function bench(fn) {
  // Warmup — biarkan V8 JIT compile fn sebelum diukur
  for (let i = 0; i < WARMUP; i++) fn()

  const start = performance.now()
  for (let i = 0; i < RUNS; i++) fn()
  const ms = performance.now() - start

  const µsPerOp = (ms / RUNS) * 1000
  const ops     = Math.round(RUNS / ms * 1000)
  return { ms: ms.toFixed(1), µsPerOp: µsPerOp.toFixed(4), ops }
}

const rows = []

function record(name, before, after) {
  const speedup = (parseFloat(before.µsPerOp) / parseFloat(after.µsPerOp)).toFixed(2)
  rows.push({ name, before: before.µsPerOp, after: after.µsPerOp, speedup, ops: after.ops })
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. normalizeClassInput — merge.ts
// ─────────────────────────────────────────────────────────────────────────────

const INPUT_LIST = ["p-4", undefined, "  flex  ", null, false, "items-center", "", "gap-2"]

function normalizeClassInput_BEFORE(classLists) {
  return classLists
    .filter(Boolean)
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0)
}

function normalizeClassInput_AFTER(classLists) {
  const result = []
  for (let i = 0; i < classLists.length; i++) {
    const v = classLists[i]
    if (!v) continue
    const s = String(v).trim()
    if (s.length > 0) result.push(s)
  }
  return result
}

record(
  "normalizeClassInput",
  bench(() => normalizeClassInput_BEFORE(INPUT_LIST)),
  bench(() => normalizeClassInput_AFTER(INPUT_LIST))
)

// ─────────────────────────────────────────────────────────────────────────────
// 2. flattenInputs — cx.ts / cxn()
// ─────────────────────────────────────────────────────────────────────────────

const NESTED_INPUT = ["flex", ["items-center", ["gap-2", false, null], "p-4"], "text-sm"]

function flattenInputs_BEFORE(inputs) {
  const result = []
  for (const item of inputs) {
    if (typeof item === "string" && item) result.push(item)
    else if (Array.isArray(item)) result.push(...flattenInputs_BEFORE(item))
  }
  return result
}

function flattenInputs_AFTER(inputs) {
  const result = []
  const stack  = [...inputs]
  while (stack.length > 0) {
    const item = stack.pop()
    if (typeof item === "string" && item) result.push(item)
    else if (Array.isArray(item)) {
      for (let i = item.length - 1; i >= 0; i--) stack.push(item[i])
    }
  }
  return result
}

record(
  "flattenInputs (cxn)",
  bench(() => flattenInputs_BEFORE(NESTED_INPUT)),
  bench(() => flattenInputs_AFTER(NESTED_INPUT))
)

// ─────────────────────────────────────────────────────────────────────────────
// 3. parseTemplateFallback — twProxy.ts
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATE_RAW = "p-4 flex items-center gap-2\n  // comment\n  text-sm font-medium\n  [icon] { h-4 w-4 mr-2 }\n  [badge] { px-2 py-0.5 rounded-full text-xs }"

function parseTemplateFallback_BEFORE(raw) {
  const SUB_RE    = /(?:\[([a-zA-Z][a-zA-Z0-9_-]*)\]|([a-zA-Z][a-zA-Z0-9_-]*))\s*\{([^}]*)\}/g
  const COMMENT_RE = /\/\/[^\n]*/g
  const subs = {}
  let base = raw
  let match
  SUB_RE.lastIndex = 0
  while ((match = SUB_RE.exec(raw)) !== null) {
    const name  = match[1] ?? match[2]
    const inner = match[3]
      .replace(COMMENT_RE, "")
      .split("\n").map((l) => l.trim()).filter(Boolean).join(" ")
      .replace(/\s+/g, " ").trim()
    subs[name] = inner
    base = base.replace(match[0], "")
  }
  const cleanBase = base
    .replace(COMMENT_RE, "")
    .split("\n").map((l) => l.trim()).filter(Boolean).join(" ")
    .replace(/\s+/g, " ").trim()
  return { base: cleanBase, subs, hasSubs: Object.keys(subs).length > 0 }
}

function parseTemplateFallback_AFTER(raw) {
  const SUB_RE    = /(?:\[([a-zA-Z][a-zA-Z0-9_-]*)\]|([a-zA-Z][a-zA-Z0-9_-]*))\s*\{([^}]*)\}/g
  const COMMENT_RE = /\/\/[^\n]*/g
  const subs = {}
  let base = raw
  let match
  SUB_RE.lastIndex = 0
  while ((match = SUB_RE.exec(raw)) !== null) {
    const name    = match[1] ?? match[2]
    const rawInner = match[3].replace(COMMENT_RE, "")
    let inner = ""
    for (const line of rawInner.split("\n")) {
      const t = line.trim()
      if (t) inner += (inner ? " " : "") + t
    }
    inner = inner.replace(/\s+/g, " ").trim()
    subs[name] = inner
    base = base.replace(match[0], "")
  }
  const rawBase = base.replace(COMMENT_RE, "")
  let cleanBase = ""
  for (const line of rawBase.split("\n")) {
    const t = line.trim()
    if (t) cleanBase += (cleanBase ? " " : "") + t
  }
  cleanBase = cleanBase.replace(/\s+/g, " ").trim()
  return { base: cleanBase, subs, hasSubs: Object.keys(subs).length > 0 }
}

record(
  "parseTemplateFallback",
  bench(() => parseTemplateFallback_BEFORE(TEMPLATE_RAW)),
  bench(() => parseTemplateFallback_AFTER(TEMPLATE_RAW))
)

// ─────────────────────────────────────────────────────────────────────────────
// 3b. parseTemplate dengan cache — twProxy.ts
// ─────────────────────────────────────────────────────────────────────────────

// Simulasi cache miss (cold) vs cache hit (warm)
const _parseCache = new Map()

function parseTemplate_BEFORE_cold(raw) {
  // Setiap call: parse ulang (tidak ada cache)
  return parseTemplateFallback_AFTER(raw)
}

function parseTemplate_AFTER_cached(raw) {
  const c = _parseCache.get(raw)
  if (c) return c
  const r = parseTemplateFallback_AFTER(raw)
  _parseCache.set(raw, r)
  return r
}

// Warm up cache
parseTemplate_AFTER_cached(TEMPLATE_RAW)

record(
  "parseTemplate cache HIT",
  bench(() => parseTemplate_BEFORE_cold(TEMPLATE_RAW)),   // always parse
  bench(() => parseTemplate_AFTER_cached(TEMPLATE_RAW))   // always cache hit
)

// ─────────────────────────────────────────────────────────────────────────────
// 4. hashState — stateEngine.ts
// ─────────────────────────────────────────────────────────────────────────────

const STATE_CONFIG = {
  loading : "opacity-60 cursor-wait",
  selected: "ring-2 ring-blue-500",
  disabled: "opacity-50 pointer-events-none",
  error   : "border-red-500 text-red-600",
}

function hashState_BEFORE(tag, state) {
  const key  = tag + JSON.stringify(Object.entries(state).sort())
  const hash = key.split("").reduce((h, char) => ((h << 5) + h) ^ char.charCodeAt(0), 5381)
  return `tw-s-${Math.abs(hash).toString(36).slice(0, 6)}`
}

// After: dengan cache
const _hashStateCache = new Map()
function hashState_AFTER(tag, state) {
  const sortedKey = tag + JSON.stringify(Object.entries(state).sort())
  const cached = _hashStateCache.get(sortedKey)
  if (cached) return cached
  const hash = sortedKey.split("").reduce((h, char) => ((h << 5) + h) ^ char.charCodeAt(0), 5381)
  const id = `tw-s-${Math.abs(hash).toString(36).slice(0, 6)}`
  _hashStateCache.set(sortedKey, id)
  return id
}

// Warm up cache
hashState_AFTER("button", STATE_CONFIG)

record(
  "hashState (cached)",
  bench(() => hashState_BEFORE("button", STATE_CONFIG)),
  bench(() => hashState_AFTER("button", STATE_CONFIG))
)

// ─────────────────────────────────────────────────────────────────────────────
// 5. lookupGenerated key — cv.ts
// ─────────────────────────────────────────────────────────────────────────────

const VARIANT_KEYS  = ["color", "size", "variant", "rounded"]
const DEFAULT_VARS  = { color: "blue", size: "md", variant: "solid", rounded: "lg" }
const PROPS         = { color: "red", size: "lg" }
const COMPONENT_ID  = "Button_v2"

function lookupKey_BEFORE(componentId, props, defaultVariants, variantKeys) {
  const merged = { ...defaultVariants, ...props }
  const keysToUse = variantKeys ?? Object.keys(merged).filter(k => k !== "className")
  const key = keysToUse
    .sort()
    .map(k => `${k}:${String(merged[k])}`)
    .join("|")
  return key
}

// After: cached sorted keys + string concat (no array intermediate)
const _sortedKeysCache = new Map()
function lookupKey_AFTER(componentId, props, defaultVariants, variantKeys) {
  const merged = { ...defaultVariants, ...props }
  let sortedKeys = _sortedKeysCache.get(componentId)
  if (!sortedKeys) {
    sortedKeys = [...(variantKeys ?? Object.keys(merged).filter(k => k !== "className"))].sort()
    _sortedKeysCache.set(componentId, sortedKeys)
  }
  let key = ""
  for (let i = 0; i < sortedKeys.length; i++) {
    if (i > 0) key += "|"
    key += sortedKeys[i] + ":" + String(merged[sortedKeys[i]])
  }
  return key
}

// Warm up cache
lookupKey_AFTER(COMPONENT_ID, PROPS, DEFAULT_VARS, VARIANT_KEYS)

record(
  "lookupGenerated key (cv)",
  bench(() => lookupKey_BEFORE(COMPONENT_ID, PROPS, DEFAULT_VARS, VARIANT_KEYS)),
  bench(() => lookupKey_AFTER(COMPONENT_ID, PROPS, DEFAULT_VARS, VARIANT_KEYS))
)

// ─────────────────────────────────────────────────────────────────────────────
// 6. statesLookup — createComponent.ts (bitmask vs runtime cx)
// ─────────────────────────────────────────────────────────────────────────────

// Simulasi: sebelum = JS cx() loop, setelah = O(1) bitmask lookup
const STATES_CONFIG = {
  loading : "opacity-60 cursor-wait",
  selected: "ring-2 ring-blue-500",
  disabled: "opacity-50 pointer-events-none",
}
const STATE_KEYS = ["loading", "selected", "disabled"]

// Pre-generate lookup table (simulasi Rust pregenerateStatesNapi)
const _statesLookup = {}
for (let mask = 0; mask < (1 << STATE_KEYS.length); mask++) {
  const active = STATE_KEYS.filter((_, i) => mask & (1 << i))
  _statesLookup[mask] = active.map(k => STATES_CONFIG[k]).filter(Boolean).join(" ")
}

const RENDER_PROPS = { loading: false, selected: true, disabled: false }

function resolveStates_BEFORE(statesConfig, stateKeys, props) {
  return stateKeys
    .filter(k => props[k])
    .map(k => statesConfig[k])
    .filter(Boolean)
    .join(" ")
}

function resolveStates_AFTER(stateKeys, statesLookup, props) {
  let mask = 0
  for (let i = 0; i < stateKeys.length; i++) {
    if (props[stateKeys[i]]) mask |= (1 << i)
  }
  return statesLookup[mask] ?? ""
}

record(
  "resolveStates (bitmask vs loop)",
  bench(() => resolveStates_BEFORE(STATES_CONFIG, STATE_KEYS, RENDER_PROPS)),
  bench(() => resolveStates_AFTER(STATE_KEYS, _statesLookup, RENDER_PROPS))
)

// ─────────────────────────────────────────────────────────────────────────────
// 7. JSON.parse overhead — statesLookup cache
// ─────────────────────────────────────────────────────────────────────────────

const LOOKUP_JSON = JSON.stringify(_statesLookup)

function statesJson_BEFORE() {
  // Sebelum: JSON.parse setiap createComponent call
  return JSON.parse(LOOKUP_JSON)
}

let _cachedLookup = null
function statesJson_AFTER() {
  // Setelah: cache hit (Map lookup)
  if (_cachedLookup) return _cachedLookup
  _cachedLookup = JSON.parse(LOOKUP_JSON)
  return _cachedLookup
}

// Warm up cache
statesJson_AFTER()

record(
  "statesLookup JSON.parse cache",
  bench(() => statesJson_BEFORE()),
  bench(() => statesJson_AFTER())
)

// ─────────────────────────────────────────────────────────────────────────────
// 8. twClassesToCss cache — stateEngine.ts
// ─────────────────────────────────────────────────────────────────────────────

// Simulasi twClassesToCss tanpa dan dengan cache
// Native call disimulasikan sebagai regex + Map lookup (overhead realistis)
const TW_MAP = {
  "opacity-60"           : "opacity:0.6",
  "cursor-wait"          : "cursor:wait",
  "ring-2"               : "--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-ring-shadow)",
  "ring-blue-500"        : "--tw-ring-color:var(--color-blue-500)",
  "opacity-50"           : "opacity:0.5",
  "pointer-events-none"  : "pointer-events:none",
}

function simulateNativeCall(classes) {
  // Simulasikan overhead Rust NAPI call: split + Map lookup + join
  return classes.split(" ")
    .map(c => TW_MAP[c] ?? "")
    .filter(Boolean)
    .join(";")
}

const _twCssCache = new Map()

function twClassesToCss_BEFORE(classes) {
  return simulateNativeCall(classes)  // always call "native"
}

function twClassesToCss_AFTER(classes) {
  const cached = _twCssCache.get(classes)
  if (cached !== undefined) return cached
  const result = simulateNativeCall(classes)
  _twCssCache.set(classes, result)
  return result
}

const CSS_CLASSES = "opacity-60 cursor-wait"
twClassesToCss_AFTER(CSS_CLASSES) // warm cache

record(
  "twClassesToCss cache",
  bench(() => twClassesToCss_BEFORE(CSS_CLASSES)),
  bench(() => twClassesToCss_AFTER(CSS_CLASSES))
)

// ─────────────────────────────────────────────────────────────────────────────
// Output
// ─────────────────────────────────────────────────────────────────────────────

const W_NAME    = 36
const W_NUM     = 12
const W_SPEEDUP = 10

function pad(s, w, right = false) {
  const str = String(s)
  return right ? str.padStart(w) : str.padEnd(w)
}

const DIV = "─".repeat(W_NAME + W_NUM * 2 + W_SPEEDUP + W_NUM + 6)

console.log("\n╔" + "═".repeat(DIV.length) + "╗")
console.log("║" + " 🏎  tailwind-styled-v4 — Hot Path Benchmark".padEnd(DIV.length) + "║")
console.log("║" + ` ${RUNS.toLocaleString()} iterations per case, Node ${process.version}`.padEnd(DIV.length) + "║")
console.log("╚" + "═".repeat(DIV.length) + "╝")
console.log()
console.log(
  pad("Benchmark", W_NAME) +
  pad("BEFORE µs/op", W_NUM, true) +
  pad("AFTER µs/op",  W_NUM, true) +
  pad("Speedup",      W_SPEEDUP, true) +
  pad("ops/sec",      W_NUM, true)
)
console.log(DIV)

for (const r of rows) {
  const speedupNum = parseFloat(r.speedup)
  const icon = speedupNum >= 10 ? "🚀" : speedupNum >= 3 ? "⚡" : speedupNum >= 1.5 ? "✅" : "➡️ "
  console.log(
    pad(r.name, W_NAME) +
    pad(r.before, W_NUM, true) +
    pad(r.after,  W_NUM, true) +
    pad(`${icon} ${r.speedup}x`, W_SPEEDUP + 2, true) +
    pad(r.ops.toLocaleString(), W_NUM, true)
  )
}

console.log(DIV)
console.log()

// Summary
const avg = rows.reduce((s, r) => s + parseFloat(r.speedup), 0) / rows.length
console.log(`Rata-rata speedup: ${avg.toFixed(2)}x`)
console.log()
console.log("Catatan:")
console.log("  BEFORE  = implementasi lama (sebelum optimasi)")
console.log("  AFTER   = implementasi baru (setelah optimasi)")
console.log("  Cache HIT = mengukur hot path setelah JIT + cache warm")
console.log("  Native binding tidak ditest di sini (perlu: npm run build:rust)")
console.log()
