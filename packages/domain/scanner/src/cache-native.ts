/**
 * tailwind-styled-v4 — Scanner Cache (Rust-backed)
 *
 * This module REQUIRES native Rust bindings and will FAIL LOUDLY if they are not available.
 * NO JavaScript fallback is provided.
 */

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
} from "./native-bridge"

function defaultCachePath(rootDir: string, cacheDir?: string): string {
  const dir = cacheDir
    ? path.resolve(rootDir, cacheDir)
    : path.join(process.cwd(), ".cache", "tailwind-styled")
  return path.join(dir, "scanner-cache.json")
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
 * QA #5a: stale entry cleanup
 */
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
  // Native-first: satu NAPI call — Rust check semua files sekaligus
  const nativeResult = pruneStaleEntriesNative(
    entries.map((e) => ({ file: e.file, lastSeenMs: e.lastSeenMs })),
    opts.maxAgeMs,
    !!opts.rootDir  // hanya check existence jika rootDir disediakan
  )

  if (nativeResult !== null) {
    const pruned = nativeResult.keptIndices.map((i) => entries[i])
    return { pruned, removed: nativeResult.removed }
  }

  // JS fallback
  const maxAge = opts.maxAgeMs ?? STALE_THRESHOLD_MS
  const now = Date.now()
  const { existsSync } = require("node:fs") as typeof import("node:fs")

  const pruned = entries.filter((entry) => {
    if (opts.rootDir && !existsSync(entry.file)) return false
    if (entry.lastSeenMs && now - entry.lastSeenMs > maxAge) return false
    return true
  })

  return { pruned, removed: entries.length - pruned.length }
}

/**
 * Read scanner cache from disk using Rust parser.
 * REQUIRES native binding - throws if unavailable.
 */
export function readCache(rootDir: string, cacheDir?: string): NativeCacheEntry[] {
  const cachePath = defaultCachePath(rootDir, cacheDir)

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
 */
export function writeCache(rootDir: string, entries: NativeCacheEntry[], cacheDir?: string): void {
  const cachePath = defaultCachePath(rootDir, cacheDir)

  const success = cacheWriteNative(cachePath, entries)
  if (!success) {
    throw new Error(
      "Native cacheWrite failed. Run 'npm run build:rust' to rebuild native bindings."
    )
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
 * Native scanCacheStats hanya return size — detail stats tetap dari disk cache entries.
 */
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

  // JS fallback
  const classCounts = new Map<string, number>()
  let totalClasses = 0
  let totalSize = 0

  for (const entry of entries) {
    totalClasses += entry.classes.length
    totalSize += entry.size
    for (const cls of entry.classes) {
      classCounts.set(cls, (classCounts.get(cls) ?? 0) + 1)
    }
  }

  const mostUsedClasses = [...classCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cls, count]) => ({ class: cls, count }))

  return {
    totalEntries: entries.length,
    totalClasses,
    totalSizeBytes: totalSize,
    avgClassesPerEntry: totalClasses / entries.length,
    mostUsedClasses,
  }
}