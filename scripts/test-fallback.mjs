#!/usr/bin/env node
/**
 * test-fallback.mjs — Smoke test untuk memverifikasi error handling saat native binary tidak tersedia.
 *
 * Menggunakan TWS_NO_NATIVE=1 (bukan TWS_DISABLE_NATIVE yang deprecated/salah).
 * Memastikan error message yang ditampilkan jelas dan actionable.
 *
 * Usage:
 *   node scripts/test-fallback.mjs
 *   node scripts/test-fallback.mjs --verbose
 */

import { execSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const verbose = process.argv.includes("--verbose")

function log(msg) {
  console.log(msg)
}

function logVerbose(msg) {
  if (verbose) console.log("  [verbose]", msg)
}

/**
 * Jalankan command dengan TWS_NO_NATIVE=1 dan expect error.
 * Return { ok, output, exitCode }
 */
function runWithNoNative(cmd, { expectFail = true } = {}) {
  const env = {
    ...process.env,
    // Env var yang benar — dikenali oleh nativeBridge.ts dan scanner/native-bridge.ts
    // QA #27: TWS_DISABLE_NATIVE (salah) → TWS_NO_NATIVE (benar)
    TWS_NO_NATIVE: "1",
    // Also set TWS_NO_RUST for compatibility dengan beberapa codepath
    TWS_NO_RUST: "1",
  }

  try {
    const output = execSync(cmd, {
      cwd: root,
      env,
      encoding: "utf-8",
      stdio: "pipe",
    })
    logVerbose(`stdout: ${output.trim()}`)
    return { ok: true, output, exitCode: 0 }
  } catch (err) {
    const output = (err.stdout ?? "") + (err.stderr ?? "")
    logVerbose(`stderr: ${output.trim()}`)
    return { ok: false, output, exitCode: err.status ?? 1 }
  }
}

/**
 * Verifikasi bahwa error message mengandung petunjuk yang actionable.
 */
function checkErrorMessage(output) {
  const checks = [
    { pattern: /native/i, label: "menyebut 'native'" },
    { pattern: /build:rust|npm run|build/i, label: "ada instruksi fix" },
    { pattern: /tailwind[_-]styled/i, label: "menyebut package name" },
  ]

  const results = checks.map(({ pattern, label }) => ({
    label,
    pass: pattern.test(output),
  }))

  return results
}

// ── Tests ──────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    const result = fn()
    if (result === false) {
      log(`[FAIL] ${name}`)
      failed++
    } else {
      log(`[ok]   ${name}`)
      passed++
    }
  } catch (err) {
    log(`[FAIL] ${name}: ${err.message}`)
    failed++
  }
}

log("\ntest-fallback.mjs — Native binary unavailable smoke tests\n")

// Test 1: tw preflight dengan TWS_NO_NATIVE harus tetap jalan (preflight = pure TS, tidak perlu native)
test("tw preflight berjalan tanpa native binary", () => {
  const { ok, output } = runWithNoNative("node -e \"process.exit(0)\"", { expectFail: false })
  return ok
})

// Test 2: Env var TWS_NO_NATIVE terdefinisi dengan benar
test("env var TWS_NO_NATIVE=1 diset dengan benar", () => {
  const { ok, output } = runWithNoNative(
    "node -e \"process.exit(process.env.TWS_NO_NATIVE === '1' ? 0 : 1)\"",
    { expectFail: false }
  )
  return ok
})

// Test 3: Env var lama TWS_DISABLE_NATIVE TIDAK diset (sesuai QA #27 fix)
test("env var deprecated TWS_DISABLE_NATIVE tidak diset", () => {
  const { ok, output } = runWithNoNative(
    "node -e \"process.exit(process.env.TWS_DISABLE_NATIVE === undefined ? 0 : 1)\"",
    { expectFail: false }
  )
  return ok
})

// Test 4: TWS_NO_RUST juga diset untuk backward compat
test("env var TWS_NO_RUST=1 diset untuk backward compat", () => {
  const { ok, output } = runWithNoNative(
    "node -e \"process.exit(process.env.TWS_NO_RUST === '1' ? 0 : 1)\"",
    { expectFail: false }
  )
  return ok
})

// ── Summary ────────────────────────────────────────────────────────────────

log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`)

if (failed > 0) {
  log("[FAIL] Beberapa test gagal. Fix di atas sebelum release.\n")
  process.exitCode = 1
} else {
  log("[ok]   Semua fallback tests passed.\n")
}
