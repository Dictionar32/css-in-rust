#!/usr/bin/env node
/**
 * fix-boolean-default-variants.mjs
 * ---------------------------------
 * TS2769 fix: cari semua `tw.xxx({...})` / `cv({...})` call yang punya
 * variant boolean-shaped (key literal `true`/`false`) tapi `defaultVariants`-nya
 * masih ditulis pakai string quote (`active: "false"`), lalu ganti jadi
 * boolean literal (`active: false`).
 *
 * Kenapa perlu: InferVariantPropsFromVariantsMap (packages/domain/core/src/types.ts)
 * infer key `true`/`false` jadi tipe `boolean`. Kalau defaultVariants masih
 * nulis string literal `"false"`, TS overload resolution nabrak intersection
 * `"false" & boolean = never` → TS2769 "No overload matches this call".
 *
 * Pattern-based (BUKAN line-number based) — jadi aman dijalanin walau file
 * lo udah beda dikit dari snapshot manapun. Idempotent — aman dijalanin ulang.
 *
 * USAGE:
 *   node scripts/fix/fix-boolean-default-variants.mjs [--dry-run] [dir]
 *
 *   --dry-run   cuma nampilin apa yang BAKAL diubah, gak nulis ke file
 *   [dir]       default: examples/next-js-app/src (relatif ke cwd saat run)
 */

import fs from "node:fs"
import path from "node:path"

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const targetDir = args.find((a) => !a.startsWith("--")) ?? "examples/next-js-app/src"

const EXTENSIONS = new Set([".ts", ".tsx"])

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full)
  }
  return out
}

// Cari semua `tw.xxx({` atau `cv({` call, ambil block-nya lewat brace matching.
function findCalls(text) {
  const calls = []
  const callStartRe = /\b(?:tw\.\w+|cv)\(\{/g
  let m
  while ((m = callStartRe.exec(text))) {
    const braceStart = m.index + m[0].length - 1
    let depth = 0
    let i = braceStart
    for (; i < text.length; i++) {
      if (text[i] === "{") depth++
      else if (text[i] === "}") {
        depth--
        if (depth === 0) break
      }
    }
    if (depth === 0) {
      calls.push({ start: m.index, braceStart, braceEnd: i + 1 })
    }
  }
  return calls
}

function findMatchingBrace(text, openIndex) {
  let depth = 0
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === "{") depth++
    else if (text[i] === "}") {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function fixFile(filePath) {
  const original = fs.readFileSync(filePath, "utf8")
  let text = original
  let changed = false
  const changesLog = []

  // Proses dari call PALING BELAKANG dulu supaya offset string replacement
  // di call sebelumnya nggak nge-invalidate index call berikutnya.
  const calls = findCalls(text).sort((a, b) => b.start - a.start)

  for (const call of calls) {
    const block = text.slice(call.start, call.braceEnd)

    // Boolean-shaped variants: variantName: { true: ...
    const boolVariants = new Set(
      [...block.matchAll(/(\w+)\s*:\s*\{\s*\n?\s*true\s*:/g)].map((mm) => mm[1])
    )
    if (boolVariants.size === 0) continue

    const dvMatch = block.match(/defaultVariants\s*:\s*\{/)
    if (!dvMatch) continue

    const dvOpenAbs = call.start + dvMatch.index + dvMatch[0].length - 1
    const dvCloseAbs = findMatchingBrace(text, dvOpenAbs)
    if (dvCloseAbs === -1) continue

    let dvBlock = text.slice(dvOpenAbs, dvCloseAbs + 1)
    const before = dvBlock

    dvBlock = dvBlock.replace(/(\b\w+\b)\s*:\s*"(true|false)"/g, (full, key, val) => {
      if (boolVariants.has(key)) {
        changesLog.push(`  ${key}: "${val}"  ->  ${key}: ${val}`)
        return `${key}: ${val}`
      }
      return full
    })

    if (dvBlock !== before) {
      text = text.slice(0, dvOpenAbs) + dvBlock + text.slice(dvCloseAbs + 1)
      changed = true
    }
  }

  if (changed) {
    const lineOf = (str, idx) => str.slice(0, idx).split("\n").length
    console.log(`\n${filePath}`)
    for (const line of changesLog) console.log(line)
    if (!dryRun) fs.writeFileSync(filePath, text, "utf8")
  }

  return changed
}

const absTarget = path.resolve(process.cwd(), targetDir)
if (!fs.existsSync(absTarget)) {
  console.error(`Directory not found: ${absTarget}`)
  process.exit(1)
}

const files = walk(absTarget)
let touched = 0
for (const f of files) {
  if (fixFile(f)) touched++
}

console.log(`\n${dryRun ? "[dry-run] would fix" : "Fixed"} ${touched} file(s).`)
if (dryRun && touched > 0) {
  console.log("Jalanin lagi tanpa --dry-run buat beneran nulis perubahannya.")
}
