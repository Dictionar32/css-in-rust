/**
 * ESM-safe runtime helpers untuk monorepo.
 *
 * Menggantikan pola fragile seperti:
 *   - `createRequire(import.meta.url)` → gunakan `createEsmRequire()`
 *   - `__dirname` → gunakan `getDirname(import.meta.url)`
 *   - `__filename` → gunakan `getFilename(import.meta.url)`
 *
 * Semua helper ini bekerja di ESM dan CJS.
 *
 * @module @tailwind-styled/shared/esmHelpers
 */

const isBrowser = typeof window !== "undefined" || typeof document !== "undefined"

// Safe check for require availability - works in both CJS and ESM
let nodeModuleRef: typeof import("node:module") | null = null
function getNodeModuleRef(): typeof import("node:module") | null {
  if (isBrowser) return null
  if (nodeModuleRef !== null) return nodeModuleRef
  try {
    const test = typeof require === 'function' ? (require('node:module') as typeof import("node:module")) : null
    nodeModuleRef = test
    return test
  } catch {
    nodeModuleRef = null
    return null
  }
}

let _nodePath: typeof import("node:path") | null = null
let _nodeUrl: typeof import("node:url") | null = null
let _nodeFs: typeof import("node:fs") | null = null
let _nodeCrypto: typeof import("node:crypto") | null = null
let _nodeOs: typeof import("node:os") | null = null

/**
 * Get current file URL in a way that works in both ESM and CJS.
 * In ESM: uses import.meta.url
 * In CJS: uses __filename converted to file URL
 */
function getCurrentFileUrl(): string {
  // In CJS builds, import.meta.url is replaced by esbuild with __importMetaUrl
  // which is set via the banner polyfill. In ESM it's the real URL.
  if (import.meta.url) {
    return import.meta.url
  }
  // Fallback: __filename is available in bare CJS (not bundled)
  if (typeof __filename !== "undefined") {
    return `file://${__filename.replace(/\\/g, "/")}`
  }
  return "file://unknown"
}

function getNodePath(): typeof import("node:path") {
  if (isBrowser) throw new Error("node:path not available in browser")
  if (!_nodePath) {
    if (typeof require === "function") {
      _nodePath = require("node:path") as typeof import("node:path")
    } else {
      const nodeRequire = getNodeModuleRef()
      if (!nodeRequire) throw new Error("require not available")
      _nodePath = nodeRequire.createRequire(getCurrentFileUrl())("node:path") as typeof import("node:path")
    }
  }
  return _nodePath!
}
function getNodeUrl(): typeof import("node:url") {
  if (isBrowser) throw new Error("node:url not available in browser")
  if (!_nodeUrl) {
    if (typeof require === "function") {
      _nodeUrl = require("node:url") as typeof import("node:url")
    } else {
      const nodeRequire = getNodeModuleRef()
      if (!nodeRequire) throw new Error("require not available")
      _nodeUrl = nodeRequire.createRequire(getCurrentFileUrl())("node:url") as typeof import("node:url")
    }
  }
  return _nodeUrl!
}
function getNodeFs(): typeof import("node:fs") {
  if (isBrowser) throw new Error("node:fs not available in browser")
  if (!_nodeFs) {
    if (typeof require === "function") {
      _nodeFs = require("node:fs") as typeof import("node:fs")
    } else {
      const nodeRequire = getNodeModuleRef()
      if (!nodeRequire) throw new Error("require not available")
      _nodeFs = nodeRequire.createRequire(getCurrentFileUrl())("node:fs") as typeof import("node:fs")
    }
  }
  return _nodeFs!
}
function getNodeCrypto(): typeof import("node:crypto") {
  if (isBrowser) throw new Error("node:crypto not available in browser")
  if (!_nodeCrypto) {
    if (typeof require === "function") {
      _nodeCrypto = require("node:crypto") as typeof import("node:crypto")
    } else {
      const nodeRequire = getNodeModuleRef()
      if (!nodeRequire) throw new Error("require not available")
      _nodeCrypto = nodeRequire.createRequire(getCurrentFileUrl())("node:crypto") as typeof import("node:crypto")
    }
  }
  return _nodeCrypto!
}
function getNodeOs(): typeof import("node:os") {
  if (isBrowser) throw new Error("node:os not available in browser")
  if (!_nodeOs) {
    if (typeof require === "function") {
      _nodeOs = require("node:os") as typeof import("node:os")
    } else {
      const nodeRequire = getNodeModuleRef()
      if (!nodeRequire) throw new Error("require not available")
      _nodeOs = nodeRequire.createRequire(getCurrentFileUrl())("node:os") as typeof import("node:os")
    }
  }
  return _nodeOs!
}

/**
 * Buat `require()` function yang relative terhadap sebuah ESM module.
 *
 * @example
 * const req = createEsmRequire(import.meta.url)
 * const mod = req("some-pkg")
 */
export function createEsmRequire(importMetaUrl: string): NodeRequire {
  if (isBrowser) throw new Error("require not available in browser")
  // CJS: require is already available globally
  if (typeof require === "function") return require
  const nodeRequire = getNodeModuleRef()
  if (!nodeRequire) throw new Error("require not available")
  return nodeRequire.createRequire(importMetaUrl)
}

/**
 * Dapat `__dirname` dari `import.meta.url`.
 *
 * @example
 * const dir = getDirname(import.meta.url)
 */
export function getDirname(importMetaUrl: string): string {
  if (isBrowser) return ""
  // CJS: __dirname is directly available
  if (typeof __dirname !== "undefined") return __dirname
  const nodePath = getNodePath()
  const nodeUrl = getNodeUrl()
  return nodePath.dirname(nodeUrl.fileURLToPath(importMetaUrl))
}

/**
 * Dapat `__filename` dari `import.meta.url`.
 */
export function getFilename(importMetaUrl: string): string {
  if (isBrowser) return ""
  // CJS: __filename is directly available
  if (typeof __filename !== "undefined") return __filename
  return getNodeUrl().fileURLToPath(importMetaUrl)
}

/**
 * Resolve path dari root monorepo (bukan CWD).
 */
export function resolveFromRoot(...segments: string[]): string {
  if (isBrowser) return segments.join("/")

  const nodePath = getNodePath()
  const nodeFs = getNodeFs()

  // Use __dirname in CJS, or getDirname with current file URL in ESM
  let dir = typeof __dirname !== "undefined"
    ? __dirname
    : getDirname(getCurrentFileUrl())

  for (let i = 0; i < 10; i++) {
    const pkgPath = nodePath.join(dir, "package.json")
    try {
      const pkg = JSON.parse(nodeFs.readFileSync(pkgPath, "utf-8"))
      if (pkg.workspaces) {
        return nodePath.resolve(dir, ...segments)
      }
    } catch { /* intentionally silent */ }
    dir = nodePath.dirname(dir)
  }
  return nodePath.resolve(process.cwd(), ...segments)
}

/**
 * Require sebuah module dengan fallback ke null jika tidak tersedia.
 */
export function tryRequire<T = unknown>(
  moduleName: string,
  importMetaUrl: string
): T | null {
  if (isBrowser) return null
  try {
    return createEsmRequire(importMetaUrl)(moduleName) as T
  } catch { /* intentionally silent — optional dep */ }
  return null
}

/**
 * Resolve .node binary path yang cross-platform dan ESM-safe.
 */
export function resolveNativeNodePath(
  importMetaUrl: string,
  ...relativeSegments: string[]
): string {
  if (isBrowser) return relativeSegments.join("/")
  return getNodePath().resolve(getDirname(importMetaUrl), ...relativeSegments)
}
