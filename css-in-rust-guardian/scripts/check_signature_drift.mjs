#!/usr/bin/env node
/**
 * check_signature_drift.mjs — NAPI Bridge Sync Guard
 *
 * Melengkapi scripts/validate/rust-ts-drift.mjs (yang sudah ada di project ini).
 * rust-ts-drift.mjs hanya mengecek APAKAH nama fungsi native disebut di
 * suatu interface TS — tidak mengecek dari mana fungsi itu didefinisikan
 * di sisi Rust, dan tidak mendeteksi dua implementasi Rust berbeda yang
 * kebetulan diekspor dengan nama JS yang sama.
 *
 * Script ini membaca LANGSUNG dari source Rust (semua file native/src/*.rs
 * secara rekursif), bukan
 * cuma dari native/index.d.ts, supaya bisa:
 *
 *   1. DUPLICATE EXPORT DETECTION (paling penting & paling akurat — bukan
 *      heuristik, ini collision nama yang pasti):
 *      Cari semua `#[napi] fn ...` di seluruh crate, hitung nama JS hasil
 *      konversinya (snake_case → camelCase, atau dari `js_name = "..."`
 *      kalau ada), lalu tandai nama JS apa pun yang punya >1 definisi Rust.
 *      Contoh nyata yang script ini temukan di project ini:
 *        atomicRegistrySize  ← native/src/application/atomic.rs:426
 *        atomicRegistrySize  ← native/src/application/atomic_parser.rs:501
 *      Dua registry Rust yang BERBEDA (REGISTRY vs ATOMIC_REGISTRY), tapi
 *      diekspor ke JS dengan nama yang sama. clearAtomicRegistry() dari JS
 *      cuma akan menyentuh SATU dari dua registry itu — registry yang lain
 *      jadi tidak bisa di-clear/di-inspect dari JS sama sekali.
 *
 *   2. STALE .d.ts DETECTION:
 *      Bandingkan nama fungsi di native/index.d.ts vs nama fungsi yang
 *      benar-benar ada di source Rust SEKARANG. Kalau berbeda, index.d.ts
 *      kemungkinan belum di-regenerate sejak source berubah — jangan
 *      percaya index.d.ts sebagai ground truth sampai ini bersih (selaras
 *      dengan rule project: "Jangan edit generated output. Regenerate
 *      output dari source yang benar.").
 *
 *   3. PARAM-COUNT MISMATCH (heuristik, bukan type-checker):
 *      Untuk fungsi yang juga muncul sebagai method di salah satu file
 *      bridge TS (nativeBridge.ts, nativeBridgeWrappers.ts, dst), bandingkan
 *      jumlah parameter Rust vs jumlah parameter di signature TS. Ini cuma
 *      sinyal awal "ada yang beda, cek manual" — bukan jaminan benar/salah,
 *      karena optional params / overload bisa bikin false positive.
 *
 * Usage:
 *   node check_signature_drift.mjs [--root <path-to-repo>] [--json]
 *
 * Default --root adalah cwd. Jalankan dari root repo css-in-rust, atau
 * pass --root /path/to/css-in-rust kalau dijalankan dari tempat lain.
 */

import fs from "node:fs"
import path from "node:path"

const args = process.argv.slice(2)
const isJson = args.includes("--json")
const rootIdx = args.indexOf("--root")
const root = rootIdx !== -1 && args[rootIdx + 1] ? path.resolve(args[rootIdx + 1]) : process.cwd()

const nativeSrcDir = path.join(root, "native", "src")
const nativeDts = path.join(root, "native", "index.d.ts")

if (!fs.existsSync(nativeSrcDir)) {
  console.error(`[signature-drift] native/src tidak ditemukan di ${root}`)
  console.error("  Jalankan dengan --root <path-ke-repo-css-in-rust>")
  process.exit(1)
}

// ── Helpers ──────────────────────────────────────────────────────────────

function snakeToCamel(name) {
  const parts = name.split("_").filter(Boolean)
  if (parts.length === 0) return name
  return parts[0] + parts.slice(1).map((p) => p[0].toUpperCase() + p.slice(1)).join("")
}

/** Walk a directory recursively and return all .rs file paths. */
function walkRustFiles(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walkRustFiles(full))
    } else if (entry.isFile() && entry.name.endsWith(".rs")) {
      out.push(full)
    }
  }
  return out
}

// ── 1. Scan Rust source for #[napi] fn exports ─────────────────────────────

/**
 * @typedef {{ jsName: string, rustFn: string, file: string, line: number,
 *   paramCount: number }} NapiExport
 */

/** @type {NapiExport[]} */
const exports_ = []

const rustFiles = walkRustFiles(nativeSrcDir)

for (const file of rustFiles) {
  const relFile = path.relative(root, file)
  const lines = fs.readFileSync(file, "utf-8").split("\n")

  for (let i = 0; i < lines.length; i++) {
    const attrMatch = lines[i].match(/^\s*#\[napi(\((.*)\))?\]\s*$/)
    if (!attrMatch) continue

    const attrBody = attrMatch[2] ?? ""
    // #[napi(object)] / #[napi(object, ...)] menandai struct, bukan fungsi — skip.
    if (/\bobject\b/.test(attrBody)) continue

    const explicitJsNameMatch = attrBody.match(/js_name\s*=\s*"([^"]+)"/)

    // Lihat beberapa baris ke depan (skip doc comments & atribut lain) untuk
    // menemukan `pub fn name(...)` atau `fn name(...)`.
    let j = i + 1
    let fnLine = -1
    while (j < lines.length && j < i + 6) {
      const trimmed = lines[j].trim()
      if (trimmed === "" || trimmed.startsWith("///") || trimmed.startsWith("//") || trimmed.startsWith("#[")) {
        j++
        continue
      }
      fnLine = j
      break
    }
    if (fnLine === -1) continue

    const fnMatch = lines[fnLine].match(/(?:pub\s+)?fn\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/)
    if (!fnMatch) continue // bukan fungsi (mungkin struct/enum/impl block)

    const rustFn = fnMatch[1]
    const paramsRaw = fnMatch[2].trim()
    const paramCount = paramsRaw === "" ? 0 : paramsRaw.split(",").filter((p) => p.trim() !== "").length

    const jsName = explicitJsNameMatch ? explicitJsNameMatch[1] : snakeToCamel(rustFn)

    exports_.push({ jsName, rustFn, file: relFile, line: fnLine + 1, paramCount })
  }
}

// ── 2. Group by jsName, find duplicates ─────────────────────────────────────

/** @type {Map<string, NapiExport[]>} */
const byJsName = new Map()
for (const exp of exports_) {
  const list = byJsName.get(exp.jsName) ?? []
  list.push(exp)
  byJsName.set(exp.jsName, list)
}

const duplicates = [...byJsName.entries()]
  .filter(([, list]) => list.length > 1)
  .map(([jsName, list]) => ({ jsName, definitions: list }))
  .sort((a, b) => a.jsName.localeCompare(b.jsName))

// ── 3. Compare against native/index.d.ts (stale-build check) ───────────────

let staleDtsReport = null
if (fs.existsSync(nativeDts)) {
  const dtsContent = fs.readFileSync(nativeDts, "utf-8")
  const dtsNames = new Set()
  for (const m of dtsContent.matchAll(/^export declare function (\w+)/gm)) {
    dtsNames.add(m[1])
  }
  const sourceNames = new Set(byJsName.keys())

  const inSourceNotInDts = [...sourceNames].filter((n) => !dtsNames.has(n)).sort()
  const inDtsNotInSource = [...dtsNames].filter((n) => !sourceNames.has(n)).sort()

  staleDtsReport = {
    dtsFunctionCount: dtsNames.size,
    sourceFunctionCount: sourceNames.size,
    inSourceNotInDts,
    inDtsNotInSource,
    isStale: inSourceNotInDts.length > 0 || inDtsNotInSource.length > 0,
  }
} else {
  staleDtsReport = { error: "native/index.d.ts tidak ditemukan — jalankan: npm run build:rust" }
}

// ── 4. Param-count heuristic vs TS bridge files ─────────────────────────────

const bridgeFiles = [
  "packages/domain/compiler/src/nativeBridge.ts",
  "packages/domain/compiler/src/nativeBridgeWrappers.ts",
  "packages/domain/scanner/src/native-bridge.ts",
  "packages/domain/analyzer/src/types.ts",
]

/**
 * Heuristik sederhana: cari `name(arg1, arg2, ...)` atau `name?(...)` di file
 * TS lalu hitung argumen top-level (split koma, tapi jangan kepecah di dalam
 * generic <...> atau objek {...}). Ini BUKAN parser TS sungguhan — kalau ragu,
 * baca manual. Tujuannya cuma kasih sinyal awal "cek baris ini", bukan verdict.
 */
function countTsParams(signatureArgs) {
  let depth = 0
  let count = signatureArgs.trim() === "" ? 0 : 1
  for (const ch of signatureArgs) {
    if (ch === "<" || ch === "(" || ch === "{" || ch === "[") depth++
    else if (ch === ">" || ch === ")" || ch === "}" || ch === "]") depth--
    else if (ch === "," && depth === 0) count++
  }
  return signatureArgs.trim() === "" ? 0 : count
}

const paramMismatches = []
for (const bridgeRel of bridgeFiles) {
  const full = path.join(root, bridgeRel)
  if (!fs.existsSync(full)) continue
  const content = fs.readFileSync(full, "utf-8")
  const lines = content.split("\n")
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s{2}(\w+)\s*\(([^)]*)\)\s*:/)
    if (!m) continue
    const [, name, argsRaw] = m
    const rustExports = byJsName.get(name)
    if (!rustExports || rustExports.length !== 1) continue // skip duplikat (sudah dilaporkan terpisah) & yang tak ada di Rust
    const tsParamCount = countTsParams(argsRaw)
    const rustParamCount = rustExports[0].paramCount
    if (tsParamCount !== rustParamCount) {
      paramMismatches.push({
        name,
        tsFile: bridgeRel,
        tsLine: i + 1,
        tsParamCount,
        rustFile: rustExports[0].file,
        rustLine: rustExports[0].line,
        rustParamCount,
      })
    }
  }
}

// ── 5. Output ────────────────────────────────────────────────────────────

const report = {
  totalNapiExports: exports_.length,
  uniqueJsNames: byJsName.size,
  duplicateCount: duplicates.length,
  duplicates,
  staleDtsReport,
  paramMismatchCount: paramMismatches.length,
  paramMismatches,
}

if (isJson) {
  console.log(JSON.stringify(report, null, 2))
  process.exit(duplicates.length > 0 ? 1 : 0)
}

console.log("\nNAPI Bridge Sync Guard — Signature Drift Report\n")
console.log(`Total #[napi] fn ditemukan di native/src:  ${exports_.length}`)
console.log(`Unique nama JS hasil konversi:              ${byJsName.size}`)
console.log(`Nama JS dengan >1 definisi Rust (BAHAYA):   ${duplicates.length}\n`)

if (duplicates.length > 0) {
  console.log("⚠ DUPLICATE EXPORTS — dua (atau lebih) fungsi Rust berbeda diekspor")
  console.log("  ke JS dengan nama yang sama. Salah satu kemungkinan tidak bisa")
  console.log("  dipanggil sama sekali, atau state-nya silently terpisah:\n")
  for (const dup of duplicates) {
    console.log(`  ${dup.jsName}`)
    for (const def of dup.definitions) {
      console.log(`    - ${def.file}:${def.line}  (rust fn: ${def.rustFn}, ${def.paramCount} params)`)
    }
    console.log("")
  }
}

if (staleDtsReport && !staleDtsReport.error) {
  console.log(`native/index.d.ts: ${staleDtsReport.dtsFunctionCount} fungsi terdeklarasi, ${staleDtsReport.sourceFunctionCount} unique nama di source Rust saat ini.`)
  if (staleDtsReport.isStale) {
    console.log("⚠ index.d.ts kemungkinan STALE relatif ke source Rust saat ini:")
    if (staleDtsReport.inSourceNotInDts.length > 0) {
      console.log(`  Ada di source, BELUM ada di index.d.ts (${staleDtsReport.inSourceNotInDts.length}):`)
      for (const n of staleDtsReport.inSourceNotInDts.slice(0, 15)) console.log(`    - ${n}`)
      if (staleDtsReport.inSourceNotInDts.length > 15) console.log(`    ... +${staleDtsReport.inSourceNotInDts.length - 15} lagi`)
    }
    if (staleDtsReport.inDtsNotInSource.length > 0) {
      console.log(`  Ada di index.d.ts, TIDAK ada lagi di source (${staleDtsReport.inDtsNotInSource.length}):`)
      for (const n of staleDtsReport.inDtsNotInSource.slice(0, 15)) console.log(`    - ${n}`)
      if (staleDtsReport.inDtsNotInSource.length > 15) console.log(`    ... +${staleDtsReport.inDtsNotInSource.length - 15} lagi`)
    }
    console.log("  → jalankan `npm run build:rust` dulu sebelum percaya index.d.ts.\n")
  } else {
    console.log("✓ index.d.ts selaras dengan source Rust saat ini.\n")
  }
} else if (staleDtsReport?.error) {
  console.log(`(${staleDtsReport.error})\n`)
}

console.log(`Param-count mismatch vs TS bridge files (heuristik, cek manual): ${paramMismatches.length}`)
if (paramMismatches.length > 0) {
  for (const mm of paramMismatches) {
    console.log(`  - ${mm.name}: Rust punya ${mm.rustParamCount} param (${mm.rustFile}:${mm.rustLine}), TS bridge punya ${mm.tsParamCount} param (${mm.tsFile}:${mm.tsLine})`)
  }
}

console.log("")
process.exit(duplicates.length > 0 ? 1 : 0)
