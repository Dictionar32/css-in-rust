/**
 * Native parallel scanner menggunakan worker threads + Rust batchExtractClasses.
 *
 * Untuk workspaces besar (200+ files), file-list dibagi ke beberapa worker.
 * Setiap worker memanggil native `batchExtractClasses` yang sudah memakai
 * rayon par_iter di sisi Rust — sehingga parallelism terjadi di dua level:
 *   1. Multiple worker threads (TS/Node level)
 *   2. rayon par_iter di dalam setiap worker (Rust level)
 *
 * Untuk workspace kecil (< PARALLEL_THRESHOLD), langsung panggil batchExtractClasses
 * di main thread — overhead spawn worker tidak worth it.
 */

import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads"
import fs from "node:fs"
import path from "node:path"
import { availableParallelism } from "node:os"
import { fileURLToPath } from "node:url"

import { isScannableFile, DEFAULT_EXTENSIONS, DEFAULT_IGNORES } from "./index"
import { batchExtractClassesNative, collectFilesNative, rebuildWorkspaceResultNative } from "./native-bridge"
import type { ScanWorkspaceResult, ScanFileResult } from "./types"

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PARALLEL_THRESHOLD = 50
const DEFAULT_CHUNK_SIZE = 150

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ParallelScanOptions {
  extensions?: string[]
  ignoreDirs?: string[]
  maxWorkers?: number
  chunkSize?: number
}

interface NativeBatchResult {
  file: string
  classes: string[]
  content_hash: string
  ok: boolean
  error?: string | null
}

interface WorkerInput {
  filePaths: string[]
}

type WorkerOutput =
  | { ok: true; results: NativeBatchResult[] }
  | { ok: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// File collection
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// File collection — native-first, JS fallback
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kumpulkan semua file yang cocok secara rekursif dari rootDir.
 *
 * Native: satu Rust walk tanpa JS event loop overhead — 2–5× lebih cepat
 * untuk workspace besar. Tidak membaca konten file, hanya paths.
 *
 * JS fallback: dipakai jika native binding tidak tersedia (mis. test env).
 */
function collectFiles(rootDir: string, extensions: string[], ignoreDirs: string[]): string[] {
  // Native-first: satu NAPI call menggantikan seluruh rekursi JS
  const native = collectFilesNative(rootDir, extensions, ignoreDirs)
  if (native !== null) return native

  // JS fallback
  const files: string[] = []

  function walk(dir: string): void {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const rel = path.relative(rootDir, fullPath)
      if (entry.isDirectory()) {
        const ignored = ignoreDirs.some((d) => entry.name === d || rel.startsWith(d + path.sep))
        if (!ignored) walk(fullPath)
      } else if (isScannableFile(entry.name, extensions)) {
        files.push(fullPath)
      }
    }
  }

  walk(rootDir)
  return files
}

// ─────────────────────────────────────────────────────────────────────────────
// Merge results
// ─────────────────────────────────────────────────────────────────────────────

function mergeResults(batchResults: NativeBatchResult[]): ScanWorkspaceResult {
  const files: ScanFileResult[] = batchResults.map((r) => ({
    file: r.file,
    classes: r.classes,
    hash: r.content_hash,
  }))
  // Native-first: Rust HashSet dedup + sort_unstable (satu pass, zero GC)
  const native = rebuildWorkspaceResultNative(files)
  if (native) return native
  // Fallback — hanya aktif jika binding belum loaded (e.g. test env)
  const unique = new Set(files.flatMap((f) => f.classes))
  return { files, totalFiles: files.length, uniqueClasses: Array.from(unique).sort() }
}

// ─────────────────────────────────────────────────────────────────────────────
// Worker thread entry point
// ─────────────────────────────────────────────────────────────────────────────

if (!isMainThread && parentPort) {
  const { filePaths } = workerData as WorkerInput
  try {
    const results = batchExtractClassesNative(filePaths)
    const msg: WorkerOutput = { ok: true, results }
    parentPort.postMessage(msg)
  } catch (error) {
    const msg: WorkerOutput = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
    parentPort.postMessage(msg)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// __filename compat CJS + ESM
// ─────────────────────────────────────────────────────────────────────────────

declare const __filename: string | undefined
const _workerFilename =
  typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url)

// ─────────────────────────────────────────────────────────────────────────────
// Spawn worker for one chunk
// ─────────────────────────────────────────────────────────────────────────────

function runChunkInWorker(filePaths: string[]): Promise<NativeBatchResult[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(_workerFilename, {
      workerData: { filePaths } satisfies WorkerInput,
    })
    worker.once("message", (payload: WorkerOutput) => {
      if (payload.ok) {
        resolve(payload.results)
      } else {
        reject(new Error(payload.error ?? "parallel-scanner worker failed"))
      }
    })
    worker.once("error", reject)
    worker.once("exit", (code) => {
      if (code !== 0) reject(new Error(`parallel-scanner worker exited with code ${code}`))
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export async function scanWorkspaceParallel(
  rootDir: string,
  options: ParallelScanOptions = {}
): Promise<ScanWorkspaceResult> {
  const {
    extensions = DEFAULT_EXTENSIONS,
    ignoreDirs = DEFAULT_IGNORES,
    maxWorkers = Math.max(1, availableParallelism() - 1),
    chunkSize = DEFAULT_CHUNK_SIZE,
  } = options

  const files = collectFiles(path.resolve(rootDir), extensions, ignoreDirs)

  if (files.length < PARALLEL_THRESHOLD) {
    return mergeResults(batchExtractClassesNative(files))
  }

  const chunks: string[][] = []
  for (let i = 0; i < files.length; i += chunkSize) {
    chunks.push(files.slice(i, i + chunkSize))
  }

  const allResults: NativeBatchResult[] = []
  for (let i = 0; i < chunks.length; i += maxWorkers) {
    const batch = chunks.slice(i, i + maxWorkers)
    const batchResults = await Promise.all(batch.map(runChunkInWorker))
    allResults.push(...batchResults.flat())
  }

  return mergeResults(allResults)
}
