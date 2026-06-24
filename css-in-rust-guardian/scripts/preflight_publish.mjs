#!/usr/bin/env node
/**
 * preflight_publish.mjs — Release / Publish Guardian
 *
 * Bukan pengganti scripts yang sudah ada di project ini (version:sync,
 * pack:check, validate:drift, check:binary-size:strict) — script ini cuma
 * MENJALANKAN semuanya secara berurutan dengan ringkasan pass/fail di akhir,
 * supaya tidak ada langkah yang lupa dijalankan sebelum tag release. Tambahan
 * satu check yang BELUM ada di tooling project: optionalDependencies native
 * binary version drift (lihat bagian 2 di bawah).
 *
 * Kenapa ini penting buat project ini secara spesifik: dev environment
 * cuma Arch Linux (satu platform), tapi package ini didistribusikan untuk
 * 5 target (darwin-arm64, darwin-x64, linux-arm64-gnu, linux-x64-gnu,
 * win32-x64-msvc). Sebagian besar dari proses release ini SECARA STRUKTURAL
 * tidak bisa diverifikasi di mesin sendiri — harus dipercayakan ke matrix
 * build di GitHub Actions. Script ini menegaskan itu secara eksplisit di
 * akhir output, bukan diam-diam dilewati.
 *
 * ── 1. Yang dijalankan otomatis (read-only / idempoten, aman diulang) ──────
 *   - check_signature_drift.mjs   (bundled — NAPI export sanity)
 *   - scan_unsafe_css_writes.mjs  (bundled — CSS write sanity)
 *   - npm run validate:drift:check
 *   - npm run pack:check
 *   - npm run check:binary-size:strict   (skip kalau dist/ belum di-build)
 *
 * ── 2. optionalDependencies native binary check ────────────────────────────
 *   package.json `optionalDependencies` mendeklarasikan 5 paket
 *   @tailwind-styled/native-* sebagai cara distribusi per-platform.
 *   `npm run version:sync` TIDAK menyentuh entry ini — version-sync.ts cuma
 *   sync versi untuk dependency yang namanya match salah satu package di
 *   setiap package.json di dalam folder packages/ (workspace lokal). Paket
 *   native-* bukan workspace package, jadi lolos dari sync tanpa ada yang sadar.
 *
 *   Pakai --check-registry untuk verifikasi nyata ke npm registry apakah
 *   paket-paket itu ada & versinya masuk akal. Kalau TIDAK pernah dipublish
 *   sama sekali (404), itu tanda paket-paket ini kemungkinan peninggalan
 *   strategi distribusi lama yang sudah tidak dipakai (cek `files` field —
 *   kalau "native/tailwind-styled-native*.node" ada di sana, berarti binary
 *   sudah dibundle langsung di tarball utama, dan optionalDependencies ini
 *   redundant/dead).
 *
 * ── 3. Yang TIDAK BISA diverifikasi dari sini (diingatkan, bukan dicek) ────
 *   - Apakah build-native matrix job di publish.yml benar-benar berhasil
 *     untuk SEMUA 5 target untuk tag yang mau di-publish.
 *   - Apakah binary macOS/Windows benar-benar berjalan (tidak bisa dites
 *     dari Arch Linux).
 *
 * Usage:
 *   node preflight_publish.mjs [--root <path>] [--check-registry] [--json]
 */

import fs from "node:fs"
import path from "node:path"
import https from "node:https"
import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const isJson = args.includes("--json")
const checkRegistry = args.includes("--check-registry")
const rootIdx = args.indexOf("--root")
const root = rootIdx !== -1 && args[rootIdx + 1] ? path.resolve(args[rootIdx + 1]) : process.cwd()

const pkgPath = path.join(root, "package.json")
if (!fs.existsSync(pkgPath)) {
  console.error(`[preflight] package.json tidak ditemukan di ${root} — pass --root <path-ke-repo>`)
  process.exit(1)
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))

/** @type {{ name: string, status: "pass"|"fail"|"skip", detail: string }[]} */
const results = []

function runStep(name, fn) {
  try {
    const detail = fn()
    results.push({ name, status: "pass", detail: detail ?? "" })
  } catch (err) {
    if (err?.__skip) {
      results.push({ name, status: "skip", detail: err.message })
    } else {
      results.push({ name, status: "fail", detail: (err.stdout?.toString?.() || err.message || String(err)).slice(0, 800) })
    }
  }
}

function skip(message) {
  const e = new Error(message)
  e.__skip = true
  throw e
}

// ── 1. Bundled checks ────────────────────────────────────────────────────

runStep("check_signature_drift.mjs", () => {
  execSync(`node "${path.join(__dirname, "check_signature_drift.mjs")}" --root "${root}"`, { stdio: "pipe" })
  return "tidak ada duplicate NAPI export"
})

runStep("scan_unsafe_css_writes.mjs", () => {
  execSync(`node "${path.join(__dirname, "scan_unsafe_css_writes.mjs")}" --root "${root}"`, { stdio: "pipe" })
  return "tidak ada kandidat unguarded CSS write"
})

// ── 2. Existing project scripts ─────────────────────────────────────────

function hasNpmScript(name) {
  return Boolean(pkg.scripts?.[name])
}

for (const scriptName of ["validate:drift:check", "pack:check"]) {
  runStep(`npm run ${scriptName}`, () => {
    if (!hasNpmScript(scriptName)) skip("script tidak ada di package.json — lewati")
    execSync(`npm run ${scriptName}`, { cwd: root, stdio: "pipe" })
    return "OK"
  })
}

runStep("npm run check:binary-size:strict", () => {
  if (!hasNpmScript("check:binary-size:strict")) skip("script tidak ada di package.json — lewati")
  if (!fs.existsSync(path.join(root, "dist"))) skip("dist/ belum ada — jalankan npm run build:release dulu")
  execSync("npm run check:binary-size:strict", { cwd: root, stdio: "pipe" })
  return "OK"
})

// ── 3. optionalDependencies native binary version check ────────────────

const optDeps = pkg.optionalDependencies ?? {}
const nativeDeps = Object.entries(optDeps).filter(([name]) => /\/native-/.test(name))
const rootVersion = pkg.version

const nativeDepFindings = nativeDeps.map(([name, pinnedVersion]) => ({
  name,
  pinnedVersion,
  matchesRootVersion: pinnedVersion === rootVersion,
}))

const staleNativeDeps = nativeDepFindings.filter((d) => !d.matchesRootVersion)

function checkRegistryExists(name) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(name)
    https
      .get(`https://registry.npmjs.org/${encoded}`, { timeout: 5000 }, (res) => {
        resolve(res.statusCode)
        res.resume()
      })
      .on("error", () => resolve(null))
      .on("timeout", () => resolve(null))
  })
}

// ── Output ───────────────────────────────────────────────────────────────

async function main() {
  let registryFindings = null
  if (checkRegistry && nativeDeps.length > 0) {
    registryFindings = []
    for (const [name, pinnedVersion] of nativeDeps) {
      const status = await checkRegistryExists(name)
      registryFindings.push({ name, pinnedVersion, registryStatus: status })
    }
  }

  if (isJson) {
    console.log(JSON.stringify({ rootVersion, results, nativeDepFindings, registryFindings }, null, 2))
    process.exit(results.some((r) => r.status === "fail") ? 1 : 0)
  }

  console.log("\nRelease / Publish Guardian — Preflight Report\n")
  console.log(`Root package version: ${rootVersion}\n`)

  for (const r of results) {
    const mark = r.status === "pass" ? "✓" : r.status === "skip" ? "○" : "✗"
    console.log(`${mark} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`)
  }

  console.log("\noptionalDependencies native binary pins:")
  if (nativeDeps.length === 0) {
    console.log("  (tidak ada — mungkin distribusi binary 100% via files: bundle, ini OK)")
  } else {
    for (const d of nativeDepFindings) {
      const mark = d.matchesRootVersion ? "✓" : "⚠"
      console.log(`  ${mark} ${d.name}: pinned ${d.pinnedVersion}${d.matchesRootVersion ? "" : `  (root version: ${rootVersion} — TIDAK SAMA)`}`)
    }
    if (staleNativeDeps.length > 0) {
      console.log("\n  ⚠ Pin di atas TIDAK disentuh oleh `npm run version:sync` — version-sync.ts")
      console.log("    cuma sync dependency yang namanya match package di packages/*/package.json")
      console.log("    (workspace lokal). Paket native-* bukan workspace package, jadi terlewat.")
      console.log("    Tentukan kebijakan: (a) bikin native-* selalu ikut root version setiap")
      console.log("    release, (b) ganti ke caret range, atau (c) kalau memang sudah tidak")
      console.log("    dipakai (cek `files` field — kalau native/*.node sudah dibundle langsung")
      console.log("    di tarball utama, paket terpisah ini redundant), hapus dari optionalDependencies.")
    }
  }

  if (registryFindings) {
    console.log("\nRegistry check (--check-registry):")
    for (const f of registryFindings) {
      if (f.registryStatus === 404) {
        console.log(`  ✗ ${f.name} — TIDAK ADA di npm registry (404). Pin ${f.pinnedVersion} menunjuk ke paket yang tidak pernah dipublish.`)
      } else if (f.registryStatus === 200) {
        console.log(`  ✓ ${f.name} — ada di registry.`)
      } else {
        console.log(`  ? ${f.name} — tidak bisa dicek (status: ${f.registryStatus ?? "network error"}).`)
      }
    }
  }

  console.log("\nTidak bisa diverifikasi dari mesin ini (Arch Linux, satu platform):")
  console.log("  - Apakah build-native matrix di .github/workflows/publish.yml berhasil")
  console.log("    untuk SEMUA 5 target (darwin-arm64, darwin-x64, linux-arm64-gnu,")
  console.log("    linux-x64-gnu, win32-x64-msvc) untuk tag yang mau di-publish.")
  console.log("  - Perilaku binary macOS/Windows secara langsung.")
  console.log("  → Cek tab Actions di GitHub setelah push tag, SEBELUM menganggap release selesai.\n")

  const hasFail = results.some((r) => r.status === "fail") || staleNativeDeps.length > 0
  process.exit(hasFail ? 1 : 0)
}

main()
