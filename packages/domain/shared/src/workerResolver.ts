/**
 * Worker/bootstrap path resolution untuk artifact release safety.
 * Dari monorepo checklist: "Perkuat worker/bootstrap path agar artifact release aman"
 *
 * Masalah: path ke worker/loader script bisa berbeda antara:
 * - Development (src/*.ts)
 * - Built dist (dist/*.js / dist/*.cjs)
 * - Packed npm artifact (dist/ saja, tanpa src/)
 *
 * Solusi: resolve path secara hierarchical dengan fallback yang eksplisit.
 */

const isBrowser = typeof window !== "undefined" || typeof document !== "undefined"

const NODE_URL = typeof window === "undefined" || typeof document === "undefined" ? "node:url" : null
const NODE_FS = typeof window === "undefined" || typeof document === "undefined" ? "node:fs" : null
const NODE_PATH = typeof window === "undefined" || typeof document === "undefined" ? "node:path" : null

function getDirnameFromUrl(importMetaUrl: string): string {
  if (!importMetaUrl) return ""
  if (isBrowser) return ""

  try {
    const nodeUrl = require(NODE_URL!)
    return nodeUrl.fileURLToPath(importMetaUrl)
  } catch {
    if (importMetaUrl.startsWith("file://")) {
      return importMetaUrl.slice(7)
    }
    return ""
  }
}

function resolvePath(...segments: string[]): string {
  if (isBrowser) return segments.join("/").replace(/\/+/g, "/")
  try {
    const nodePath = require(NODE_PATH!)
    return nodePath.resolve(...segments)
  } catch {
    return segments.join("/").replace(/\/+/g, "/")
  }
}

function existsSync(path: string): boolean {
  if (isBrowser) return false
  try {
    const nodeFs = require(NODE_FS!)
    return nodeFs.existsSync(path)
  } catch {
    return false
  }
}

export interface WorkerPathOptions {
  /** Nama file worker tanpa extension */
  basename: string
  /** Import meta URL dari caller module */
  importMetaUrl: string
  /** Extensions yang dicoba secara urutan (default: [".cjs", ".js", ".mjs"]) */
  extensions?: string[]
  /** Sub-directories relatif dari runtimeDir yang dicoba */
  subdirs?: string[]
  /** Throw jika tidak ditemukan (default: true) */
  required?: boolean
}

export interface WorkerPathResult {
  /** Absolute path ke worker file */
  path: string
  /** Extension yang ditemukan */
  extension: string
  /** Apakah ini dari CJS atau ESM artifact */
  format: "cjs" | "esm"
}

/**
 * Resolve worker/loader script path yang aman untuk release artifacts.
 *
 * Prioritas:
 * 1. CJS (.cjs) — untuk Node.js workers yang butuh require()
 * 2. JS (.js) — bundled output
 * 3. MJS (.mjs) — explicit ESM
 *
 * @example
 * const workerPath = resolveWorkerPath({
 *   basename: "scanner-worker",
 *   importMetaUrl: import.meta.url,
 * })
 * // → "/path/to/dist/scanner-worker.cjs"
 */
export function resolveWorkerPath(opts: WorkerPathOptions): WorkerPathResult {
  if (isBrowser) {
    throw new Error("Worker resolution not available in browser")
  }

  const {
    basename,
    importMetaUrl,
    extensions = [".cjs", ".js", ".mjs"],
    subdirs = [".", "workers", "lib"],
    required = true,
  } = opts

  const runtimeDir = getDirnameFromUrl(importMetaUrl)

  // Try each subdir + extension combination
  for (const subdir of subdirs) {
    for (const ext of extensions) {
      const candidate = resolvePath(runtimeDir, subdir, `${basename}${ext}`)
      if (existsSync(candidate)) {
        return {
          path: candidate,
          extension: ext,
          format: ext === ".cjs" ? "cjs" : "esm",
        }
      }
    }
  }

  if (required) {
    const tried = subdirs.flatMap(d =>
      extensions.map(e => resolvePath(runtimeDir, d, `${basename}${e}`))
    )
    throw new Error(
      `[worker-resolver] Could not find worker script "${basename}".\n` +
      `Tried:\n${tried.map(p => `  - ${p}`).join("\n")}\n` +
      `Ensure the package is built: npm run build`
    )
  }

  return { path: "", extension: "", format: "cjs" }
}

/**
 * Resolve loader path (untuk webpack/rspack/vite loaders).
 * Same as resolveWorkerPath but dengan nama yang lebih eksplisit.
 */
export function resolveLoaderPath(
  loaderBasename: string,
  importMetaUrl: string
): string {
  return resolveWorkerPath({
    basename: loaderBasename,
    importMetaUrl,
    extensions: [".cjs", ".js", ".mjs"],
    subdirs: [".", "loaders", "lib"],
  }).path
}