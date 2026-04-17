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

// Access native require through a Function constructor to bypass bundled wrapper
const getNativeRequire = (() => {
  try {
    // This creates a function that has direct access to the native require
    // without going through the bundled __require wrapper
    return new Function('return require')()
  } catch {
    return null
  }
})()

const nodeRequire = getNativeRequire || (typeof require !== "undefined" ? require : (globalThis as any).require)

function safeRequire(mod: string) {
  if (!nodeRequire) throw new Error(`require not available for ${mod}`)
  return nodeRequire(mod)
}

let _nodeModule: any = null
let _nodePath: any = null
let _nodeUrl: any = null
let _nodeFs: any = null

function getNodeModule() {
  if (isBrowser) throw new Error("node:module not available in browser")
  if (!_nodeModule) _nodeModule = safeRequire("node:module")
  return _nodeModule!
}
function getNodePath() {
  if (isBrowser) throw new Error("node:path not available in browser")
  if (!_nodePath) _nodePath = safeRequire("node:path")
  return _nodePath!
}
function getNodeUrl() {
  if (isBrowser) throw new Error("node:url not available in browser")
  if (!_nodeUrl) _nodeUrl = safeRequire("node:url")
  return _nodeUrl!
}
function getNodeFs() {
  if (isBrowser) throw new Error("node:fs not available in browser")
  if (!_nodeFs) _nodeFs = safeRequire("node:fs")
  return _nodeFs!
}

/**
 * Buat `require()` function yang relative terhadap sebuah ESM module.
 *
 * @example
 * // Ganti: createRequire(import.meta.url)("some-pkg")
 * const req = createEsmRequire(import.meta.url)
 * const mod = req("some-pkg")
 */
export function createEsmRequire(importMetaUrl: string): NodeRequire {
  if (isBrowser) throw new Error("require not available in browser")
  return getNodeModule().createRequire(importMetaUrl)
}

/**
 * Dapat `__dirname` dari `import.meta.url`.
 *
 * @example
 * // Ganti: const __dirname = ...
 * const dir = getDirname(import.meta.url)
 */
export function getDirname(importMetaUrl: string): string {
  if (isBrowser) return ""
  const nodePath = getNodePath()
  const nodeUrl = getNodeUrl()
  return nodePath.dirname(nodeUrl.fileURLToPath(importMetaUrl))
}

/**
 * Dapat `__filename` dari `import.meta.url`.
 */
export function getFilename(importMetaUrl: string): string {
  if (isBrowser) return ""
  return getNodeUrl().fileURLToPath(importMetaUrl)
}

/**
 * Resolve path dari root monorepo (bukan CWD).
 * Berguna untuk scripts dan tools yang dipanggil dari lokasi berbeda.
 *
 * @example
 * const root = resolveFromRoot("packages/domain/shared/src")
 */
export function resolveFromRoot(...segments: string[]): string {
  if (isBrowser) return segments.join("/")

  const nodePath = getNodePath()
  const nodeFs = getNodeFs()
  
  let dir = getDirname(import.meta.url)
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
 * Berguna untuk optional dependencies.
 *
 * @example
 * const oxc = tryRequire("oxc-parser", import.meta.url)
 * if (!oxc) console.warn("oxc-parser not installed")
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
 * Menggantikan pola `path.resolve(__dirname, "../native.node")`.
 */
export function resolveNativeNodePath(
  importMetaUrl: string,
  ...relativeSegments: string[]
): string {
  if (isBrowser) return relativeSegments.join("/")
  return getNodePath().resolve(getDirname(importMetaUrl), ...relativeSegments)
}
