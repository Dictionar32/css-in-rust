/**
 * tailwind-styled-v4 — Scanner Cache (Rust-backed)
 *
 * This module REQUIRES native Rust bindings and will FAIL LOUDLY if they are not available.
 * NO JavaScript fallback is provided.
 */

import fs from "node:fs"
import path from "node:path"
import {
  cachePriorityNative,
  cacheReadNative,
  cacheWriteNative,
  scanCacheGet,
  scanCachePut,
  scanCacheInvalidate,
  scanCacheStats,
  pruneStaleEntriesNative,
  computeCacheStatsNative,
  getLoadedScannerBindingPath,
} from "./native-bridge"

function defaultCachePath(rootDir: string, cacheDir?: string): string {
  const dir = cacheDir
    ? path.resolve(rootDir, cacheDir)
    : path.join(process.cwd(), ".cache", "tailwind-styled")
  return path.join(dir, "scanner-cache.json")
}

function metaPathFor(cachePath: string): string {
  return cachePath.replace(/\.json$/, ".meta.json")
}

/**
 * Fingerprint binary native yang lagi dipakai (mtime + size dari file .node).
 *
 * Root cause fix: cache_read() Rust selama ini hardcode `version: 2` tanpa
 * pernah benar-benar baca field version dari file (lihat cache_store.rs).
 * Jadi cache lama (hasil compiler/transform versi sebelumnya, misal sebelum
 * is_chained guard ditambahkan) gak pernah ke-invalidate otomatis walau
 * binary native-nya udah di-rebuild — selama isi file SOURCE-nya gak berubah.
 *
 * Fix ini independen dari versioning di Rust (yang masih non-functional
 * sampai di-rebuild) — fingerprint dihitung di sisi TS dari mtime+size file
 * .node itu sendiri, jadi setiap kali binary native di-rebuild ulang,
 * fingerprint otomatis berubah dan cache lama langsung dianggap stale,
 * TANPA perlu compiler/binary mana pun "mengingat" versi berapa dia.
 *
 * Kalau path binary gak diketahui (binding belum/gagal load), return null —
 * caller harus treat ini sebagai "gak bisa diverifikasi" dan skip optimisasi
 * cache (aman, cuma ngurangin cache-hit rate, gak bikin behavior salah).
 */
let _cachedFingerprint: string | null | undefined
function getBinaryFingerprint(): string | null {
  if (_cachedFingerprint !== undefined) return _cachedFingerprint
  try {
    const loadedPath = getLoadedScannerBindingPath()
    if (!loadedPath) {
      _cachedFingerprint = null
      return null
    }
    const stat = fs.statSync(loadedPath)
    _cachedFingerprint = `${stat.mtimeMs}:${stat.size}`
  } catch {
    _cachedFingerprint = null
  }
  return _cachedFingerprint
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface NativeCacheEntry {
  file: string
  classes: string[]
  hash: string
  mtimeMs: number
  size: number
  hitCount: number
  /** Terakhir file ditemukan di filesystem (ms epoch). Digunakan untuk stale cleanup. */
  lastSeenMs?: number
}

/** Default stale threshold — 7 hari */
const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Hapus entri cache yang sudah stale (file sudah tidak ada atau lastSeenMs terlalu lama).
 *
 * Native-first: Rust batch-check semua file dalam satu pass tanpa
 * event loop overhead. JS fallback: existsSync loop per file.
 */
export function pruneStaleEntries(
  entries: NativeCacheEntry[],
  opts: { maxAgeMs?: number; rootDir?: string } = {}
): { pruned: NativeCacheEntry[]; removed: number } {
  const nativeResult = pruneStaleEntriesNative(
    entries.map((e) => ({ file: e.file, lastSeenMs: e.lastSeenMs })),
    opts.maxAgeMs,
    !!opts.rootDir
  )

  if (nativeResult !== null) {
    const pruned = nativeResult.keptIndices.map((i) => entries[i])
    return { pruned, removed: nativeResult.removed }
  }

  throw new Error("FATAL: Native binding 'pruneStaleEntries' is required but not available.")
}

/**
 * Read scanner cache from disk using Rust parser.
 * REQUIRES native binding - throws if unavailable.
 *
 * FIX: Pastikan folder cache ada sebelum Rust coba baca file,
 * supaya tidak error "os error 3 (path not found)" pada first run.
 */
export function readCache(rootDir: string, cacheDir?: string): NativeCacheEntry[] {
  const cachePath = defaultCachePath(rootDir, cacheDir)

  // Buat folder cache jika belum ada — cegah "os error 3" pada first run
  fs.mkdirSync(path.dirname(cachePath), { recursive: true })

  // Cek fingerprint binary native dulu. Kalau beda dari pas cache ini ditulis
  // (atau meta belum ada sama sekali) → binary udah di-rebuild sejak itu,
  // seluruh cache gak bisa dipercaya lagi. Lihat getBinaryFingerprint() di atas.
  const currentFingerprint = getBinaryFingerprint()
  if (currentFingerprint !== null) {
    const metaPath = metaPathFor(cachePath)
    let storedFingerprint: string | null = null
    try {
      storedFingerprint = JSON.parse(fs.readFileSync(metaPath, "utf8")).binaryFingerprint ?? null
    } catch {
      // Meta belum ada (first run) atau corrupt — treat sebagai mismatch
    }
    if (storedFingerprint !== currentFingerprint) {
      console.warn(
        "[scanner] cache invalidated: native binary berubah sejak cache terakhir ditulis"
      )
      return []
    }
  }

  const result = cacheReadNative(cachePath)
  if (!result) return []

  return result.entries.map((e) => ({
    file: e.file,
    classes: e.classes,
    hash: e.hash,
    mtimeMs: e.mtimeMs,
    size: e.size,
    hitCount: e.hitCount,
    lastSeenMs: e.lastSeenMs,
  }))
}

/**
 * Write scanner cache to disk using Rust serialiser.
 * REQUIRES native binding - throws if unavailable.
 *
 * FIX: Pastikan folder cache ada sebelum Rust coba tulis file.
 */
export function writeCache(rootDir: string, entries: NativeCacheEntry[], cacheDir?: string): void {
  const cachePath = defaultCachePath(rootDir, cacheDir)

  // Buat folder cache jika belum ada — cegah write gagal pada first run
  fs.mkdirSync(path.dirname(cachePath), { recursive: true })

  const success = cacheWriteNative(cachePath, entries)
  if (!success) {
    throw new Error(
      "Native cacheWrite failed. Run 'npm run build:rust' to rebuild native bindings."
    )
  }

  // Catat fingerprint binary native saat ini, biar readCache() berikutnya
  // bisa deteksi kalau binary udah di-rebuild sejak cache ini ditulis.
  const currentFingerprint = getBinaryFingerprint()
  if (currentFingerprint !== null) {
    try {
      fs.writeFileSync(
        metaPathFor(cachePath),
        JSON.stringify({ binaryFingerprint: currentFingerprint }),
        "utf8"
      )
    } catch {
      // Gagal nulis meta gak fatal — efeknya cuma cache di-treat stale di run berikutnya
    }
  }
}

/**
 * Compute priority score for a file using the Rust SmartCache algorithm.
 * Higher = process first.
 * REQUIRES native binding - throws if unavailable.
 */
export function filePriority(
  mtimeMs: number,
  size: number,
  cached: { mtimeMs: number; size: number; hitCount: number; lastSeenMs?: number } | undefined,
  nowMs = Date.now()
): number {
  return cachePriorityNative(
    mtimeMs,
    size,
    cached?.mtimeMs ?? 0,
    cached?.size ?? 0,
    cached?.hitCount ?? 0,
    cached?.lastSeenMs ?? 0,
    nowMs
  )
}

export interface CacheStats {
  totalEntries: number
  totalClasses: number
  totalSizeBytes: number
  avgClassesPerEntry: number
  mostUsedClasses: Array<{ class: string; count: number }>
}

/**
 * Rust in-memory cache — hot path untuk per-file lookup saat scan.
 * Jauh lebih cepat dari disk JSON cache untuk file yang baru saja di-scan.
 */
export const hotCache = {
  get: scanCacheGet,
  put: scanCachePut,
  invalidate: scanCacheInvalidate,
} as const

/**
 * Stats dari Rust in-memory cache (DashMap).
 * `size` = jumlah entry saat ini di cache.
 */
export function getHotCacheStats(): { size: number } {
  return scanCacheStats()
}

/**
 * Compute disk cache stats dari entries (diperlukan untuk mostUsedClasses).
 *
 * Native-first: Rust HashMap count + partial sort — ~3× lebih cepat
 * dari JS Map untuk workspace besar (5000+ entries).
 * JS fallback: manual Map count + .sort().
 */
export function computeCacheStats(entries: NativeCacheEntry[]): CacheStats {
  if (entries.length === 0) {
    return { totalEntries: 0, totalClasses: 0, totalSizeBytes: 0, avgClassesPerEntry: 0, mostUsedClasses: [] }
  }

  // Native-first
  const nativeResult = computeCacheStatsNative(
    entries.map((e) => e.classes),
    entries.map((e) => e.size),
    10
  )

  if (nativeResult !== null) {
    return {
      totalEntries: nativeResult.totalEntries,
      totalClasses: nativeResult.totalClasses,
      totalSizeBytes: nativeResult.totalSizeBytes,
      avgClassesPerEntry: nativeResult.avgClassesPerEntryX100 / 100,
      mostUsedClasses: nativeResult.mostUsedClasses,
    }
  }

  throw new Error("FATAL: Native binding 'computeCacheStats' is required but not available.")
}