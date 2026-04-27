import fs from "node:fs"
import path from "node:path"
import { cacheReadNative, cacheWriteNative, cachePriorityNative } from "./native-bridge"

export interface CachedScanFileEntry {
  mtimeMs: number
  size: number
  classes: string[]
  hitCount?: number
  lastSeenMs?: number
}

export interface CachedScanIndex {
  version: 2
  files: Record<string, CachedScanFileEntry>
}

export interface ScanCacheOptions {
  cacheDir?: string
}

function defaultCachePath(rootDir: string, cacheDir?: string): string {
  const resolvedDir = cacheDir
    ? path.resolve(rootDir, cacheDir)
    : path.join(process.cwd(), ".cache", "tailwind-styled")
  return path.join(resolvedDir, "scanner-cache.json")
}

/**
 * Baca scanner cache JSON dari disk.
 *
 * Native-first: Rust membaca + parse JSON dalam satu syscall tanpa V8 JSON.parse
 * overhead. Untuk cache besar (1000+ entries), Rust 3–4× lebih cepat karena
 * tidak ada string allocation per key di JS heap.
 *
 * JS fallback: dipakai saat native binding tidak tersedia (test env, CI tanpa Rust).
 */
function readCacheFromDisk(cachePath: string): CachedScanIndex {
  if (!fs.existsSync(cachePath)) {
    return { version: 2, files: {} }
  }

  // Native-first: satu NAPI call — Rust baca + parse + return structured data
  try {
    const result = cacheReadNative(cachePath)
    if (!result) throw new Error("cacheReadNative returned null")
    const files: Record<string, CachedScanFileEntry> = {}
    for (const entry of result.entries) {
      files[entry.file] = {
        mtimeMs: entry.mtimeMs,
        size: entry.size,
        classes: entry.classes,
        hitCount: entry.hitCount,
        lastSeenMs: undefined,
      }
    }
    return { version: 2, files }
  } catch {
    // Native tidak tersedia atau file corrupt — JS fallback
  }

  // JS fallback: JSON.parse biasa
  try {
    const parsed = JSON.parse(fs.readFileSync(cachePath, "utf8")) as {
      version?: number
      files?: Record<string, CachedScanFileEntry>
    }
    if (parsed?.files) {
      return { version: 2, files: parsed.files }
    }
  } catch {
    // malformed — re-init
  }

  return { version: 2, files: {} }
}

/**
 * Tulis scanner cache ke disk.
 *
 * Native-first: Rust serialize + tulis dalam satu pass tanpa JSON.stringify
 * overhead di V8. Output format identik dengan JS (versi 2).
 *
 * JS fallback: JSON.stringify + fs.writeFileSync.
 */
function writeCacheToDisk(
  cachePath: string,
  index: CachedScanIndex
): void {
  // Native-first: Rust serialize + write
  try {
    const entries = Object.entries(index.files).map(([file, entry]) => ({
      file,
      classes: entry.classes,
      hash: "",           // hash opsional di cache_store — diisi Rust dengan short_hash jika kosong
      mtimeMs: entry.mtimeMs,
      size: entry.size,
      hitCount: entry.hitCount ?? 0,
      lastSeenMs: entry.lastSeenMs ?? 0,
    }))
    cacheWriteNative(cachePath, entries)
    return
  } catch {
    // Native gagal — JS fallback
  }

  // JS fallback
  fs.mkdirSync(path.dirname(cachePath), { recursive: true })
  fs.writeFileSync(cachePath, `${JSON.stringify(index, null, 2)}\n`)
}

export class ScanCache {
  private readonly cachePath: string
  private readonly index: CachedScanIndex

  constructor(rootDir: string, options: ScanCacheOptions = {}) {
    this.cachePath = defaultCachePath(rootDir, options.cacheDir)
    this.index = readCacheFromDisk(this.cachePath)
  }

  get(filePath: string): CachedScanFileEntry | undefined {
    return this.index.files[filePath]
  }

  set(filePath: string, entry: CachedScanFileEntry): void {
    this.index.files[filePath] = entry
  }

  touch(filePath: string): void {
    const entry = this.index.files[filePath]
    if (!entry) return
    entry.hitCount = (entry.hitCount ?? 0) + 1
    entry.lastSeenMs = Date.now()
  }

  delete(filePath: string): void {
    delete this.index.files[filePath]
  }

  entries(): Array<[string, CachedScanFileEntry]> {
    return Object.entries(this.index.files)
  }

  /**
   * Hitung priority score file untuk menentukan urutan scan.
   *
   * Native-first: `cachePriorityNative()` — Rust hitung skor dalam satu call.
   * JS fallback: hitung inline.
   *
   * Score lebih tinggi = diproses lebih dulu.
   */
  priority(filePath: string, currentMtimeMs: number, currentSize: number): number {
    const entry = this.index.files[filePath]
    if (!entry) return 1_000_000_000  // belum pernah di-cache = prioritas tertinggi

    try {
      return cachePriorityNative(
        currentMtimeMs,
        currentSize,
        entry.mtimeMs,
        entry.size,
        entry.hitCount ?? 0,
        entry.lastSeenMs ?? 0,
        Date.now()
      )
    } catch {
      // JS fallback — identik dengan Rust formula
      const mtimeDelta = Math.max(0, currentMtimeMs - entry.mtimeMs)
      const sizeDelta = Math.abs(currentSize - entry.size)
      const hotness = entry.hitCount ?? 0
      const recency = entry.lastSeenMs ? Date.now() - entry.lastSeenMs : 0
      return mtimeDelta * 1000 + sizeDelta * 10 + hotness * 100 - recency / 1000
    }
  }

  save(): void {
    writeCacheToDisk(this.cachePath, this.index)
  }
}