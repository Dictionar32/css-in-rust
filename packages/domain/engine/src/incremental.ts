import fs from "node:fs"
import path from "node:path"

import {
  isScannableFile,
  type ScanWorkspaceOptions,
  type ScanWorkspaceResult,
  scanFile,
} from "@tailwind-styled/scanner"
import { createLogger } from "@tailwind-styled/shared"

import { getNativeEngineBinding } from "./native-bridge"

const DEFAULT_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]
const log = createLogger("engine:incremental")

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers — native-first, JS fallback
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rebuild ScanWorkspaceResult dari Map file → entry.
 *
 * Native: satu pass Rust HashSet dedup + sort_unstable.
 * JS fallback: Array.from(new Set(...)) dengan multiple allocations.
 */
function rebuildWorkspaceResult(
  byFile: Map<string, ScanWorkspaceResult["files"][number]>
): ScanWorkspaceResult {
  const files = Array.from(byFile.values())
  const native = getNativeEngineBinding()

  if (native?.rebuildWorkspaceResult) {
    const result = native.rebuildWorkspaceResult(files)
    return {
      files: result.files,
      totalFiles: result.totalFiles,
      uniqueClasses: result.uniqueClasses,
    }
  }

  throw new Error("FATAL: Native binding 'rebuildWorkspaceResult' is required but not available.")
}

/**
 * Apply incremental class diff: (existing ∪ added) ∖ removed.
 *
 * Native: Rust HashSet O(n+m) tanpa GC pause.
 * JS fallback: JS Set dengan intermediate allocations.
 */
function applyClassDiff(existing: string[], added: string[], removed: string[]): string[] {
  const native = getNativeEngineBinding()

  if (native?.applyClassDiff) {
    return native.applyClassDiff(existing, added, removed)
  }

  throw new Error("FATAL: Native binding 'applyClassDiff' is required but not available.")
}

/**
 * Cek apakah dua class array berisi elemen identik (order-independent).
 *
 * Native: single-pass HashSet lookup O(n+m).
 * JS fallback: buat Set(b) lalu iterate a.
 */
function areClassSetsEqual(a: string[], b: string[]): boolean {
  const native = getNativeEngineBinding()

  if (native?.areClassSetsEqual) {
    return native.areClassSetsEqual(a, b)
  }

  throw new Error("FATAL: Native binding 'areClassSetsEqual' is required but not available.")
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API (tidak berubah dari sebelumnya)
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkspaceDiff {
  addedClasses: string[]
  removedClasses: string[]
  changedFiles: string[]
  unchangedFiles: number
}

/**
 * Diff dua ScanWorkspaceResult menggunakan Rust computeIncrementalDiff.
 */
export function diffWorkspaceResults(
  previous: ScanWorkspaceResult,
  current: ScanWorkspaceResult
): WorkspaceDiff {
  const native = getNativeEngineBinding()
  if (!native?.computeIncrementalDiff) {
    throw new Error("FATAL: Native binding 'computeIncrementalDiff' is required but not available.")
  }

  const result = native.computeIncrementalDiff(
    JSON.stringify(previous.files),
    JSON.stringify(current.files)
  ) as WorkspaceDiff | null

  if (!result) {
    return { addedClasses: [], removedClasses: [], changedFiles: [], unchangedFiles: 0 }
  }

  log.debug(
    `native diff workspace: +${result.addedClasses.length} classes, -${result.removedClasses.length} classes, ${result.changedFiles.length} files changed`
  )

  return result
}

/**
 * Apply an incremental file-change event to an existing scan result.
 *
 * Semua tiga helper internal sekarang native-first:
 *   rebuildWorkspaceResult → Rust rebuild_workspace_result
 *   applyClassDiff         → Rust apply_class_diff
 *   areClassSetsEqual      → Rust are_class_sets_equal
 */
export function applyIncrementalChange(
  previous: ScanWorkspaceResult,
  filePath: string,
  type: "change" | "unlink",
  scanner?: ScanWorkspaceOptions
): ScanWorkspaceResult {
  const includeExtensions = scanner?.includeExtensions ?? DEFAULT_EXTENSIONS
  if (!isScannableFile(filePath, includeExtensions)) return previous

  const byFile = new Map(previous.files.map((f) => [path.resolve(f.file), f]))
  const normalizedPath = path.resolve(filePath)

  const native = getNativeEngineBinding()
  if (!native?.processFileChange) {
    throw new Error(
      "FATAL: Native binding 'processFileChange' is required but not available.\n" +
      "This package requires native Rust bindings.\n\n" +
      "Resolution steps:\n" +
      "1. Build the native Rust module: npm run build:rust"
    )
  }

  if (type === "unlink") {
    const existing = byFile.get(normalizedPath)
    log.debug(`native unlink ${normalizedPath}`)
    native.processFileChange(normalizedPath, existing?.classes ?? [], null)
    byFile.delete(normalizedPath)
    return rebuildWorkspaceResult(byFile)
  }

  log.debug(`native change ${normalizedPath}`)
  const scanned = scanFile(normalizedPath)
  const content = fs.readFileSync(normalizedPath, "utf8")
  const diff = native.processFileChange(normalizedPath, scanned.classes, content)
  const existing = byFile.get(normalizedPath)

  if (diff && existing) {
    log.debug(`native diff ${normalizedPath} +${diff.added.length} -${diff.removed.length}`)
    const diffApplied = applyClassDiff(existing.classes, diff.added, diff.removed)
    const classes = areClassSetsEqual(diffApplied, scanned.classes)
      ? diffApplied
      : scanned.classes
    byFile.set(normalizedPath, { file: normalizedPath, classes })
  } else {
    log.debug(`native diff cold-sync ${normalizedPath}`)
    byFile.set(normalizedPath, { file: normalizedPath, classes: scanned.classes })
  }

  return rebuildWorkspaceResult(byFile)
}