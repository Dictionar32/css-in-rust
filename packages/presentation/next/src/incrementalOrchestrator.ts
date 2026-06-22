/**
 * IncrementalOrchestrator - Sambungkan IncrementalManager ke pipeline CSS
 *
 * Membaca fingerprint file-file source, mendeteksi perubahan,
 * dan skip regenerasi CSS kalau tidak ada yang berubah.
 */

import fs from "node:fs"
import path from "node:path"
import { getNativeBridge } from "@tailwind-styled/compiler"

interface FileFingerprint {
  hash: string
  mtime: number
}

const _fingerprintCache = new Map<string, FileFingerprint>()

function getNative() {
  try {
    return getNativeBridge()
  } catch {
    return null
  }
}

/**
 * Buat fingerprint file menggunakan Rust `create_fingerprint`.
 * Fallback ke mtime jika native tidak tersedia.
 */
function fingerprintFile(filePath: string): FileFingerprint | null {
  try {
    const stat = fs.statSync(filePath)
    const native = getNative()
    if (native?.create_fingerprint) {
      const content = fs.readFileSync(filePath, "utf-8")
      const hash = native.create_fingerprint(filePath, content)
      return { hash, mtime: stat.mtimeMs }
    }
    // Fallback: pakai mtime + size sebagai fingerprint
    return { hash: `${stat.mtimeMs}-${stat.size}`, mtime: stat.mtimeMs }
  } catch {
    return null
  }
}

/**
 * Cek apakah ada file dalam daftar yang berubah sejak scan terakhir.
 * Return true kalau ada perubahan (perlu regenerate CSS).
 * Return false kalau semua sama (skip regenerate).
 */
export function hasSourceChanged(sourceFiles: string[]): boolean {
  if (_fingerprintCache.size === 0) {
    // Pertama kali — inisialisasi cache, anggap berubah
    for (const f of sourceFiles) {
      const fp = fingerprintFile(f)
      if (fp) _fingerprintCache.set(f, fp)
    }
    return true
  }

  let changed = false
  for (const f of sourceFiles) {
    const prev = _fingerprintCache.get(f)
    const curr = fingerprintFile(f)
    if (!curr) continue
    if (!prev || prev.hash !== curr.hash) {
      changed = true
      _fingerprintCache.set(f, curr)
    }
  }

  // File baru yang belum ada di cache
  for (const f of sourceFiles) {
    if (!_fingerprintCache.has(f)) {
      const fp = fingerprintFile(f)
      if (fp) {
        _fingerprintCache.set(f, fp)
        changed = true
      }
    }
  }

  return changed
}

/**
 * Reset fingerprint cache — dipakai saat full rebuild diminta.
 */
export function resetFingerprintCache(): void {
  _fingerprintCache.clear()
}

/**
 * Baca konfigurasi incremental dari tailwind-styled.config.json.
 */
export function isIncrementalEnabled(cwd: string): boolean {
  try {
    const configPath = path.join(cwd, "tailwind-styled.config.json")
    if (!fs.existsSync(configPath)) return false
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as {
      compiler?: { incremental?: boolean }
    }
    return config.compiler?.incremental === true
  } catch {
    return false
  }
}
