#!/usr/bin/env node
/**
 * scan_unsafe_css_writes.mjs — CSS Pipeline Guard
 *
 * Konteks bug yang jadi alasan script ini ada:
 *
 *   packages/domain/shared/src/staticStateExtractor.ts punya bug class
 *   yang sudah pernah terjadi: Rust (generateStaticStateCss) kadang
 *   mengembalikan "declarations" yang sebenarnya cuma nama class Tailwind
 *   mentah (misal "w-full") karena gagal resolve — bukan CSS declaration
 *   asli (misal "width: 100%"). Kalau string itu ditulis langsung ke file
 *   .css, Tailwind v4 PostCSS akan throw:
 *
 *       CssSyntaxError: Invalid declaration: 'w-full'
 *
 *   staticStateExtractor.ts SUDAH punya guard untuk ini (cari
 *   `isFullyUnresolved` dan `sanitizeCssRule` di file itu — intinya:
 *   setiap declaration di-cek harus mengandung ":" sebelum ditulis).
 *   TAPI guard itu cuma ada di SATU file. Tidak ada utility bersama yang
 *   dipakai ulang di tempat lain yang juga menulis CSS hasil resolusi Rust
 *   ke disk. Kalau Rust mengembalikan unresolved declaration lewat jalur
 *   lain, error yang sama bisa muncul lagi di tempat berbeda — root cause-nya
 *   belum benar-benar diperbaiki di level sistem, cuma di satu titik gejala.
 *
 * Script ini scan heuristik: cari titik-titik yang (a) menulis file lewat
 * fs.writeFileSync / writeFileSync / atomicWriteFile, DAN (b) isi yang
 * ditulis berasal dari pemanggilan fungsi CSS-generation native/Rust
 * (generateCss*, compileToCss*, generateStaticStateCss, generateAtomicCss,
 * processTailwindCss*, generateCssForClasses, dst) dalam jendela baris yang
 * sama — lalu cek apakah ada bukti guard (`includes(":")`, `isFullyUnresolved`,
 * `isUnresolved`, `sanitizeCssRule`) di jendela yang sama. Kalau TIDAK ada
 * bukti guard, titik itu ditandai sebagai "kandidat unguarded write".
 *
 * PENTING: ini heuristik berbasis jarak baris, BUKAN analisis data-flow
 * sungguhan. False positive & false negative mungkin terjadi (misalnya kalau
 * guard ada di fungsi helper terpisah yang dipanggil dari sini). Tujuannya
 * cuma mempersempit area yang perlu dibaca manual — bukan menggantikan baca
 * manual.
 *
 * Usage:
 *   node scan_unsafe_css_writes.mjs [--root <path>] [--json] [--window 60]
 */

import fs from "node:fs"
import path from "node:path"

const args = process.argv.slice(2)
const isJson = args.includes("--json")
const rootIdx = args.indexOf("--root")
const root = rootIdx !== -1 && args[rootIdx + 1] ? path.resolve(args[rootIdx + 1]) : process.cwd()
const windowIdx = args.indexOf("--window")
const WINDOW = windowIdx !== -1 && args[windowIdx + 1] ? Number.parseInt(args[windowIdx + 1], 10) : 200

const packagesDir = path.join(root, "packages")
if (!fs.existsSync(packagesDir)) {
  console.error(`[css-guard] packages/ tidak ditemukan di ${root} — pass --root <path-ke-repo>`)
  process.exit(1)
}

const WRITE_RE = /\b(fs\.writeFileSync|writeFileSync|atomicWriteFile)\s*\(/
const CSS_GEN_RE = /\b(generateCss\w*|compileToCss\w*|generateStaticStateCss|generateAtomicCss|processTailwindCss\w*|generateCssForClasses|compile_to_css\w*)\s*\(/
const GUARD_RE = /(includes\(["']:["']\)|isFullyUnresolved|isUnresolved|sanitizeCssRule)/

const SKIP_DIRS = new Set(["node_modules", "dist", "__tests__", ".turbo"])

function walkTsFiles(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walkTsFiles(full))
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".d.ts")) {
      out.push(full)
    }
  }
  return out
}

const findings = []
const safeWrites = []

for (const file of walkTsFiles(packagesDir)) {
  const relFile = path.relative(root, file)
  const lines = fs.readFileSync(file, "utf-8").split("\n")

  // Cari semua baris yang match CSS_GEN_RE di file ini sekali saja (dipakai
  // ulang untuk tiap write line di bawah).
  const cssGenLines = []
  for (let k = 0; k < lines.length; k++) {
    if (CSS_GEN_RE.test(lines[k])) cssGenLines.push(k)
  }

  for (let i = 0; i < lines.length; i++) {
    if (!WRITE_RE.test(lines[i])) continue

    // Cari panggilan CSS-gen TERDEKAT SEBELUM baris write ini — tidak dibatasi
    // jarak baris ketat, karena fungsi di codebase ini bisa >100 baris (lihat
    // staticStateExtractor.ts: generate di baris ~318, write di baris ~468/482).
    // --window membatasi seberapa jauh ke belakang kita masih anggap relevan.
    const nearestGenLine = [...cssGenLines].reverse().find((g) => g <= i + 5 && i - g <= WINDOW)
    if (nearestGenLine === undefined) continue // bukan CSS dari Rust — di luar scope script ini

    const between = lines.slice(nearestGenLine, i + 1).join("\n")
    const hasGuard = GUARD_RE.test(between)

    const entry = {
      file: relFile,
      writeLine: i + 1,
      cssGenLine: nearestGenLine + 1,
      cssGenCall: lines[nearestGenLine].match(CSS_GEN_RE)?.[1] ?? "?",
    }

    if (hasGuard) {
      safeWrites.push(entry)
    } else {
      findings.push(entry)
    }
  }
}

if (isJson) {
  console.log(JSON.stringify({ unguardedCandidates: findings, guardedWrites: safeWrites }, null, 2))
  process.exit(findings.length > 0 ? 1 : 0)
}

console.log("\nCSS Pipeline Guard — Unguarded CSS-Write Scan\n")
console.log(`Window: ±${WINDOW} baris di sekitar setiap panggilan write.\n`)

if (safeWrites.length > 0) {
  console.log(`✓ Write site dengan bukti guard (${safeWrites.length}):`)
  for (const s of safeWrites) console.log(`  - ${s.file}:${s.writeLine}  (gen di baris ${s.cssGenLine}: ${s.cssGenCall})`)
  console.log("")
}

if (findings.length > 0) {
  console.log(`⚠ Kandidat UNGUARDED write — CSS dari Rust ditulis tanpa bukti validasi declaration (${findings.length}):`)
  for (const f of findings) console.log(`  - ${f.file}:${f.writeLine}  (gen di baris ${f.cssGenLine}: ${f.cssGenCall})`)
  console.log("\n  Cek manual: apakah declaration di-validasi (harus ada ':') sebelum ditulis?")
  console.log("  Kalau belum, lihat pattern guard di packages/domain/shared/src/staticStateExtractor.ts")
  console.log("  (cari `isFullyUnresolved` & `sanitizeCssRule`) — pertimbangkan ekstrak ke utility bersama")
  console.log("  di packages/domain/shared agar semua write site pakai guard yang sama, bukan duplikat manual.\n")
} else {
  console.log("✓ Tidak ada kandidat unguarded write ditemukan.\n")
}

process.exit(findings.length > 0 ? 1 : 0)
