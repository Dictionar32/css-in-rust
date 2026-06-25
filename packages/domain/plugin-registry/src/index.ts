import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

// ── Native bridge (lazy-loaded to avoid circular deps) ──────────────────────
type NativePluginRegistry = {
  pluginSearch: (pluginsJson: string, query: string) => string
  pluginValidateName: (name: string) => boolean
  pluginVerifyIntegrity: (content: string, expectedIntegrity: string) => boolean
  pluginSemverHasUpdate: (current: string, latest: string) => boolean
  pluginCheckAllUpdates: (installedJson: string, registryJson: string) => string
}
let _native: NativePluginRegistry | null | undefined = undefined
function getNative(): NativePluginRegistry | null {
  if (_native !== undefined) return _native
  try {
    const runtimeDir = typeof __dirname === "string" && __dirname.length > 0
      ? __dirname
      : typeof import.meta !== "undefined" && import.meta.url
        ? fileURLToPath(new URL(".", import.meta.url))
        : process.cwd()
    const req = createRequire(join(runtimeDir, "noop.cjs"))
    const _pa = `${process.platform}-${process.arch}`
    const _paGnu = _pa === "linux-x64" ? "linux-x64-gnu" : _pa === "linux-arm64" ? "linux-arm64-gnu" : _pa
    const candidates = [
      // npm install case: dist/../native/
      resolve(runtimeDir, "..", "native", "tailwind-styled-native.node"),
      resolve(runtimeDir, "..", "native", `tailwind-styled-native.${_pa}.node`),
      resolve(runtimeDir, "..", "native", `tailwind-styled-native.${_paGnu}.node`),
      resolve(runtimeDir, "..", "native", "tailwind_styled_parser.node"),
      // cwd fallback
      resolve(process.cwd(), "native", "tailwind-styled-native.node"),
      resolve(process.cwd(), "native", "tailwind_styled_parser.node"),
      // monorepo dev: 4-level up
      resolve(runtimeDir, "..", "..", "..", "..", "native", "tailwind-styled-native.node"),
      resolve(runtimeDir, "..", "..", "..", "..", "native", "tailwind_styled_parser.node"),
      // 3-level fallback
      resolve(runtimeDir, "..", "..", "..", "native", "tailwind-styled-native.node"),
      resolve(runtimeDir, "..", "..", "..", "native", "tailwind_styled_parser.node"),
    ]
    for (const c of candidates) {
      try {
        const mod = req(c) as Record<string, unknown>
        if (typeof mod?.pluginSearch === "function") {
          return (_native = mod as unknown as NativePluginRegistry)
        }
      } catch { /* continue */ }
    }
  } catch { /* ignore */ }
  return (_native = null)
}

const NATIVE_UNAVAILABLE_MESSAGE =
  "[tailwind-styled/plugin-registry] Native binding is required but not available.\n" +
  "Please ensure you have run: npm run build:rust"

/**
 * Native-only accessor. Throws if the Rust binding is missing.
 * The TS layer is a thin wrapper — no JS fallbacks (native-first philosophy).
 */
function requireNative(): NativePluginRegistry {
  const native = getNative()
  if (!native) throw new Error(NATIVE_UNAVAILABLE_MESSAGE)
  return native
}

const PLUGIN_NAME_REGEX = /^(@[a-z0-9-]+\/)?[a-z0-9-]+(@[0-9]+\.[0-9]+\.[0-9]+)?$/

export interface PluginInfo {
  name: string
  description: string
  version: string
  tags: string[]
  official?: boolean
  docs?: string
  install?: string
  integrity?: string
}

interface RegistryData {
  version: string
  official: PluginInfo[]
  community: PluginInfo[]
}

export interface InstallResult {
  plugin: string
  installed: boolean
  command: string
  exitCode: number
}

export type PluginRegistryErrorCode =
  | "INVALID_PLUGIN_NAME"
  | "PLUGIN_NOT_FOUND"
  | "EXTERNAL_CONFIRMATION_REQUIRED"
  | "INSTALL_COMMAND_FAILED"
  | "INSTALL_FAILED"
  | "NETWORK_ERROR"
  | "REGISTRY_LOAD_FAILED"

export interface PluginRegistryErrorPayload {
  code: PluginRegistryErrorCode
  message: string
  context?: Record<string, unknown>
}

export class PluginRegistryError extends Error {
  readonly code: PluginRegistryErrorCode
  readonly context?: Record<string, unknown>

  constructor(payload: PluginRegistryErrorPayload) {
    super(payload.message)
    this.name = "PluginRegistryError"
    this.code = payload.code
    this.context = payload.context
  }

  toObject(): PluginRegistryErrorPayload {
    return {
      code: this.code,
      message: this.message,
      context: this.context,
    }
  }
}

export interface InstallOptions {
  dryRun?: boolean
  npmBin?: string
  allowExternal?: boolean
  confirmExternal?: boolean
}

export interface RegistryOptions {
  registryUrl?: string
}

export class PluginRegistry {
  private readonly plugins: PluginInfo[]
  private readonly registryVersion: string

  constructor(registryData?: RegistryData, options: RegistryOptions = {}) {
    if (options.registryUrl) {
      this.plugins = []
      this.registryVersion = "0.0.0"
    } else {
      const data = registryData
      const version = data?.version ?? "4.2.0"
      const official = (data?.official ?? []).map((item) => ({
        name: item.name,
        description: item.description,
        version: item.version,
        tags: [...item.tags],
        official: true,
        docs: item.docs,
        install: item.install,
        integrity: item.integrity,
      }))
      const community = (data?.community ?? []).map((item) => ({
        name: item.name,
        description: item.description,
        version: item.version,
        tags: [...item.tags],
        official: false,
      }))
      this.plugins = [...official, ...community]
      this.registryVersion = version
    }
  }

  static async loadFromUrl(url: string): Promise<PluginRegistry> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new PluginRegistryError({
          code: "NETWORK_ERROR",
          message: `Failed to fetch registry: ${response.status} ${response.statusText}`,
          context: { url, status: response.status },
        })
      }
      const data = (await response.json()) as RegistryData
      return new PluginRegistry(data, { registryUrl: url })
    } catch (error) {
      if (error instanceof PluginRegistryError) throw error
      throw new PluginRegistryError({
        code: "NETWORK_ERROR",
        message: `Failed to load registry: ${error instanceof Error ? error.message : String(error)}`,
        context: { url },
      })
    }
  }

  getVersion(): string {
    return this.registryVersion
  }

  search(query: string): PluginInfo[] {
    const native = requireNative()
    return JSON.parse(native.pluginSearch(JSON.stringify(this.plugins), query)) as PluginInfo[]
  }

  getAll(): PluginInfo[] {
    return [...this.plugins]
  }

  getByName(pluginName: string): PluginInfo | undefined {
    const nameWithoutVersion = pluginName.split("@").slice(0, 2).join("@")
    return this.plugins.find((plugin) => plugin.name === nameWithoutVersion)
  }

  install(pluginName: string, options: InstallOptions = {}): InstallResult {
    const npmBin = options.npmBin ?? process.env.TW_PLUGIN_NPM_BIN ?? "npm"

    const native = requireNative()
    const isValidName = native.pluginValidateName(pluginName)

    if (!isValidName) {
      throw new PluginRegistryError({
        code: "INVALID_PLUGIN_NAME",
        message: `Nama plugin tidak valid: '${pluginName}'.`,
        context: {
          pluginName,
          expectedPattern: String(PLUGIN_NAME_REGEX),
        },
      })
    }

    const knownPlugin = this.getByName(pluginName)
    const isExternal = !knownPlugin

    if (isExternal && !options.allowExternal) {
      throw new PluginRegistryError({
        code: "PLUGIN_NOT_FOUND",
        message: `Plugin '${pluginName}' tidak ditemukan di registry. Coba cari dengan 'tw-plugin search <keyword>'.`,
        context: {
          pluginName,
          allowExternal: false,
        },
      })
    }

    if (isExternal && options.allowExternal && !options.confirmExternal) {
      throw new PluginRegistryError({
        code: "EXTERNAL_CONFIRMATION_REQUIRED",
        message: `Plugin eksternal '${pluginName}' butuh konfirmasi. Jalankan ulang dengan --allow-external --yes.`,
        context: {
          pluginName,
          allowExternal: true,
        },
      })
    }

    const command = `${npmBin} install ${pluginName}`
    if (options.dryRun) {
      return { plugin: pluginName, installed: true, command, exitCode: 0 }
    }

    const child = spawnSync(npmBin, ["install", pluginName], { stdio: "inherit" })
    if (child.error) {
      throw new PluginRegistryError({
        code: "INSTALL_COMMAND_FAILED",
        message: `Gagal menjalankan perintah install: ${command}`,
        context: {
          pluginName,
          command,
          reason: child.error.message,
        },
      })
    }

    if (child.status !== 0) {
      throw new PluginRegistryError({
        code: "INSTALL_FAILED",
        message: `Install gagal (${child.status ?? 1}): ${command}`,
        context: {
          pluginName,
          command,
          exitCode: child.status ?? 1,
        },
      })
    }

    return {
      plugin: pluginName,
      installed: true,
      command,
      exitCode: 0,
    }
  }

  uninstall(
    pluginName: string,
    options: { dryRun?: boolean; npmBin?: string } = {}
  ): {
    plugin: string
    uninstalled: boolean
    command: string
    exitCode: number
  } {
    const npmBin = options.npmBin ?? process.env.TW_PLUGIN_NPM_BIN ?? "npm"
    const command = `${npmBin} uninstall ${pluginName}`

    if (options.dryRun) {
      return { plugin: pluginName, uninstalled: true, command, exitCode: 0 }
    }

    const child = spawnSync(npmBin, ["uninstall", pluginName], { stdio: "inherit" })
    if (child.status !== 0 && child.status !== null) {
      throw new PluginRegistryError({
        code: "INSTALL_FAILED",
        message: `Uninstall gagal (${child.status}): ${command}`,
        context: { pluginName, command, exitCode: child.status },
      })
    }

    return {
      plugin: pluginName,
      uninstalled: true,
      command,
      exitCode: child.status ?? 0,
    }
  }

  verifyIntegrity(pluginName: string): { ok: boolean; reason?: string } {
    const plugin = this.getByName(pluginName)
    if (!plugin) return { ok: false, reason: `Plugin '${pluginName}' not in registry` }
    if (!plugin.integrity) {
      return { ok: true, reason: "no checksum registered (skip)" }
    }
    try {
      const pkgPath = join(process.cwd(), "node_modules", pluginName, "package.json")
      if (!existsSync(pkgPath)) return { ok: false, reason: "plugin not installed" }
      const content = readFileSync(pkgPath, "utf8")
      const native = requireNative()
      const ok = native.pluginVerifyIntegrity(content, plugin.integrity!)
      return ok ? { ok: true } : { ok: false, reason: `Integrity mismatch: expected ${plugin.integrity}` }
    } catch (e: unknown) {
      return {
        ok: false,
        reason: `Integrity check failed: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
  }

  checkForUpdate(pluginName: string): {
    hasUpdate: boolean
    current?: string
    latest?: string
    error?: string
  } {
    const plugin = this.getByName(pluginName)
    if (!plugin) return { hasUpdate: false, error: `Plugin '${pluginName}' not in registry` }
    try {
      const pkgPath = join(process.cwd(), "node_modules", pluginName, "package.json")
      if (!existsSync(pkgPath)) return { hasUpdate: false, error: "plugin not installed" }
      const current = JSON.parse(readFileSync(pkgPath, "utf8")).version ?? "0.0.0"
      const latest = plugin.version
      const native = requireNative()
      const hasUpdate = native.pluginSemverHasUpdate(current as string, latest)
      return { hasUpdate, current: current as string, latest }
    } catch (e: unknown) {
      return {
        hasUpdate: false,
        error: `Update check failed: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
  }

  checkAllUpdates(): Array<{
    name: string
    hasUpdate: boolean
    current?: string
    latest?: string
    error?: string
  }> {
    type UpdateResult = {
      name: string
      hasUpdate: boolean
      current?: string
      latest?: string
      error?: string
    }
    const native = requireNative()

    // FS I/O stays in JS — gather installed versions for every registry plugin.
    const installed: Array<{ name: string; version: string }> = []
    const byName = new Map<string, UpdateResult>()
    for (const p of this.plugins) {
      try {
        const pkgPath = join(process.cwd(), "node_modules", p.name, "package.json")
        if (!existsSync(pkgPath)) {
          byName.set(p.name, { name: p.name, hasUpdate: false, error: "plugin not installed" })
          continue
        }
        const version = JSON.parse(readFileSync(pkgPath, "utf8")).version ?? "0.0.0"
        installed.push({ name: p.name, version: version as string })
      } catch (e: unknown) {
        byName.set(p.name, {
          name: p.name,
          hasUpdate: false,
          error: `Update check failed: ${e instanceof Error ? e.message : String(e)}`,
        })
      }
    }

    // Single native batch call does all semver comparisons (1 FFI crossing, not N).
    const results = JSON.parse(
      native.pluginCheckAllUpdates(JSON.stringify(installed), JSON.stringify(this.plugins))
    ) as UpdateResult[]
    for (const r of results) byName.set(r.name, r)

    // Preserve registry order.
    return this.plugins.map((p) => byName.get(p.name)).filter((r): r is UpdateResult => r !== undefined)
  }
}

const _state = { defaultRegistry: null as PluginRegistry | null }

export function getRegistry(): PluginRegistry {
  if (!_state.defaultRegistry) {
    const registryData = require("../registry.json") as RegistryData
    _state.defaultRegistry = new PluginRegistry(registryData)
  }
  return _state.defaultRegistry
}

export const registry = getRegistry()