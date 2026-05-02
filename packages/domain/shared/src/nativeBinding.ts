const isBrowser = typeof window !== "undefined" || typeof document !== "undefined"

const nodeRequire = typeof require !== "undefined" ? require : (typeof globalThis !== "undefined" ? (globalThis as any).require : null)

let _nodeFs: any = null
let _nodeModule: any = null
let _nodeOs: any = null
let _nodePath: any = null
let _nodeUrl: any = null

function getNodeFs() {
  if (isBrowser) throw new Error("node:fs not available in browser")
  if (!_nodeFs) _nodeFs = nodeRequire("node:fs")
  return _nodeFs!
}
function getNodeModule() {
  if (isBrowser) throw new Error("node:module not available in browser")
  if (!_nodeModule) _nodeModule = nodeRequire("node:module")
  return _nodeModule!
}
function getNodeOs() {
  if (isBrowser) throw new Error("node:os not available in browser")
  if (!_nodeOs) _nodeOs = nodeRequire("node:os")
  return _nodeOs!
}
function getNodePath() {
  if (isBrowser) throw new Error("node:path not available in browser")
  if (!_nodePath) _nodePath = nodeRequire("node:path")
  return _nodePath!
}
function getNodeUrl() {
  if (isBrowser) throw new Error("node:url not available in browser")
  if (!_nodeUrl) _nodeUrl = nodeRequire("node:url")
  return _nodeUrl!
}

export type PlatformExtension = ".node" | ".dll" | ".dylib" | ".so"

export function getPlatformExtension(): PlatformExtension {
  // napi-rs always produces .node files regardless of platform
  return ".node"
}

export interface NativeBindingLoadError {
  path: string
  message: string
}

export interface ResolveNativeBindingCandidatesOptions {
  runtimeDir: string
  envVarNames?: string[]
  enforceNodeExtensionForEnvPath?: boolean
  includeDefaultCandidates?: boolean
  platformExtension?: PlatformExtension
}

export interface LoadNativeBindingOptions<T> {
  runtimeDir: string
  candidates: string[]
  isValid: (module: unknown) => module is T
  invalidExportMessage: string
}

export interface LoadNativeBindingResult<T> {
  binding: T | null
  loadedPath: string | null
  loadErrors: NativeBindingLoadError[]
}

export function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function resolveRuntimeDir(
  dirnameValue: string | undefined,
  moduleImportUrl: string
): string {
  if (typeof dirnameValue === "string" && dirnameValue.length > 0) return dirnameValue
  if (isBrowser) return ""
  const nodePath = getNodePath()
  const nodeUrl = getNodeUrl()
  return nodePath.dirname(nodeUrl.fileURLToPath(moduleImportUrl))
}

export function resolveNativeBindingCandidates(
  options: ResolveNativeBindingCandidatesOptions
): string[] {
  if (isBrowser) return []

  const out: string[] = []
  const nodePath = getNodePath()
  const envVarNames = options.envVarNames ?? ["TWS_NATIVE_PATH"]
  // Default runtimeDir ke cwd jika tidak disediakan
  const runtimeDir = options.runtimeDir || process.cwd()

  for (const envVarName of envVarNames) {
    const raw = process.env[envVarName]?.trim()
    if (!raw) continue
    const resolved = nodePath.resolve(raw)

    if (options.enforceNodeExtensionForEnvPath) {
      if (nodePath.extname(resolved).toLowerCase() !== ".node") {
        throw new Error(
          `Invalid native binding path from ${envVarName}="${raw}". Expected a .node file.`
        )
      }
    }

    out.push(resolved)
  }

  if (options.includeDefaultCandidates !== false) {
    const ext = options.platformExtension ?? getPlatformExtension()
    const platform = `${process.platform}-${process.arch}`
    const platformGnu = platform === "linux-x64" ? "linux-x64-gnu"
      : platform === "linux-arm64" ? "linux-arm64-gnu"
      : platform

    // binaryName baru: tailwind-styled-native
    out.push(nodePath.resolve(process.cwd(), "native", `tailwind-styled-native${ext}`))
    out.push(nodePath.resolve(process.cwd(), "native", `tailwind-styled-native.${platform}${ext}`))
    out.push(nodePath.resolve(process.cwd(), "native", `tailwind-styled-native.${platformGnu}${ext}`))
    out.push(nodePath.resolve(runtimeDir, "..", "..", "..", "native", `tailwind-styled-native${ext}`))
    out.push(nodePath.resolve(runtimeDir, "..", "..", "..", "native", `tailwind-styled-native.${platformGnu}${ext}`))

    // binaryName lama: tailwind_styled_parser (backward compat)
    const defaultBindingName = `tailwind_styled_parser${ext}`
    out.push(nodePath.resolve(process.cwd(), "native", defaultBindingName))
    out.push(nodePath.resolve(runtimeDir, "..", "..", "..", "native", defaultBindingName))
    out.push(nodePath.resolve(runtimeDir, "..", "..", "..", "..", "native", defaultBindingName))
  }

  return Array.from(new Set(out))
}

function parseDebugToken(namespace: string, token: string): boolean {
  if (token === "*" || token === namespace || token === "tailwind-styled:*") return true
  return token.endsWith("*") && namespace.startsWith(token.slice(0, -1))
}

export function isDebugNamespaceEnabled(namespace: string): boolean {
  if (process.env.TWS_DEBUG === "1" || process.env.TAILWIND_STYLED_DEBUG === "1") return true
  const raw = process.env.DEBUG
  if (!raw) return false

  return raw
    .split(",")
    .map((token) => token.trim())
    .some((token) => parseDebugToken(namespace, token))
}

export function createDebugLogger(namespace: string, label = namespace): (message: string) => void {
  const debugEnabled = isDebugNamespaceEnabled(namespace)
  return (message: string) => {
    if (!debugEnabled) return
    console.debug(`[${label}] ${message}`)
  }
}

export function loadNativeBinding<T>(
  options: LoadNativeBindingOptions<T>
): LoadNativeBindingResult<T> {
  if (isBrowser) {
    return {
      binding: null as unknown as T,
      loadedPath: null,
      loadErrors: [{ path: "(browser)", message: "Native bindings not available in browser" }],
    }
  }

  const nodeModule = getNodeModule()
  const nodePath = getNodePath()
  const nodeFs = getNodeFs()
  const req = nodeModule.createRequire(nodePath.join(options.runtimeDir, "noop.cjs"))
  const loadErrors: NativeBindingLoadError[] = []

  for (const candidate of options.candidates) {
    if (!nodeFs.existsSync(candidate)) continue
    try {
      const mod = req(candidate)
      if (options.isValid(mod)) {
        return {
          binding: mod,
          loadedPath: candidate,
          loadErrors,
        }
      }
      loadErrors.push({
        path: candidate,
        message: options.invalidExportMessage,
      })
    } catch (error) {
      loadErrors.push({
        path: candidate,
        message: formatErrorMessage(error),
      })
    }
  }

  return {
    binding: null,
    loadedPath: null,
    loadErrors,
  }
}

export function loadNativeBindingOrThrow<T>(
  options: LoadNativeBindingOptions<T> & { bindingName: string }
): T {
  const { bindingName, ...loadOptions } = options
  const { binding, loadErrors } = loadNativeBinding<T>(loadOptions)

  if (binding) {
    return binding
  }

  const lines = [
    `FATAL: Native binding '${bindingName}' not found.`,
    "",
    "This package requires native Rust bindings. There is no JavaScript fallback.",
    "The binding was not found in any of these paths:",
    ...loadOptions.candidates.map((p) => `  - ${p}`),
    "",
  ]

  if (loadErrors.length > 0) {
    lines.push("Load errors:")
    for (const error of loadErrors) {
      lines.push(`  - ${error.path}: ${error.message}`)
    }
    lines.push("")
  }

  lines.push(
    "Resolution steps:",
    "",
    "1. Build the native Rust module:",
    "   npm run build:rust",
    "",
    "2. Or install pre-built binaries:",
    "   npm install",
    "",
    "3. Override with environment variable:",
    "   TWS_NATIVE_PATH=/path/to/tailwind_styled_parser.node",
    "",
    "For CI/CD environments, ensure Rust toolchain is installed and",
    "'npm run build:rust' is executed before running tests or building."
  )

  throw new Error(lines.join("\n"))
}