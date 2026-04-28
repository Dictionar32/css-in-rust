import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import type {
  AnalyzerSemanticReport,
  ClassConflict,
  ClassUsage,
  LoadedTailwindConfig,
  TailwindConfigCacheEntry,
} from "./types"
import { getNativeBinding } from "./binding"
import { debugLog, formatErrorMessage, isRecord, pathExists } from "./utils"


const SUPPORTED_TAILWIND_CONFIG_EXTENSIONS = new Set([".ts", ".js", ".cjs", ".mjs"])

const tailwindConfigCache = new Map<string, TailwindConfigCacheEntry>()

export const splitVariantAndBase = (className: string): { variantKey: string; base: string } => {
  const parts = className.split(":")
  if (parts.length <= 1) return { variantKey: "", base: className }
  const base = parts.pop() ?? className
  return { variantKey: parts.join(":"), base }
}

const isArbitraryUtility = (baseClass: string): boolean => {
  return baseClass.includes("[") && baseClass.includes("]")
}

export const resolveConflictGroup = (base: string): string | null => {
  if (isArbitraryUtility(base)) return null
  if (["block", "inline", "inline-block", "inline-flex", "flex", "grid", "hidden"].includes(base))
    return "display"
  if (base.startsWith("bg-")) return "bg"
  if (base.startsWith("text-")) return "text"
  if (base.startsWith("font-")) return "font"
  if (base.startsWith("rounded")) return "rounded"
  if (base.startsWith("shadow")) return "shadow"
  if (base.startsWith("border-")) return "border"
  if (base.startsWith("opacity-")) return "opacity"
  if (base.startsWith("w-") || base.startsWith("min-w-") || base.startsWith("max-w-"))
    return "width"
  if (base.startsWith("h-") || base.startsWith("min-h-") || base.startsWith("max-h-"))
    return "height"
  if (base.startsWith("p-") || base.startsWith("px-") || base.startsWith("py-")) return "padding"
  if (base.startsWith("m-") || base.startsWith("mx-") || base.startsWith("my-")) return "margin"
  return null
}

const detectConflicts = async (
  usages: ClassUsage[]
): Promise<{
  conflicts: ClassConflict[]
  conflictedClassNames: Set<string>
}> => {
  // Native-first: Rust HashSet conflict detection (required)
  const native = await getNativeBinding()
  if (!native?.detectClassConflicts) {
    throw new Error("FATAL: Native binding 'detectClassConflicts' is required but not available.")
  }
  const result = native.detectClassConflicts(JSON.stringify(usages.map((u) => ({ name: u.name, count: u.count }))))
  return {
    conflicts: result.conflicts.map((c) => ({
      className: c.group,
      variants: c.variantKey.length > 0 ? c.variantKey.split(":") : [],
      classes: c.classes,
      message: c.message,
    })),
    conflictedClassNames: new Set(result.conflictedClassNames),
  }
}

const isSupportedTailwindConfigPath = (configPath: string): boolean => {
  return SUPPORTED_TAILWIND_CONFIG_EXTENSIONS.has(path.extname(configPath).toLowerCase())
}

const resolveTailwindConfigPath = async (
  root: string,
  explicitPath?: string
): Promise<string | null> => {
  if (explicitPath) {
    const resolved = path.resolve(root, explicitPath)
    if (!(await pathExists(resolved))) return null
    return resolved
  }

  const candidates = [
    "tailwind.config.ts",
    "tailwind.config.js",
    "tailwind.config.cjs",
    "tailwind.config.mjs",
  ]

  for (const candidate of candidates) {
    const fullPath = path.resolve(root, candidate)
    if (await pathExists(fullPath)) return fullPath
  }

  return null
}

const collectSafelistFromConfig = (config: Record<string, unknown>): string[] => {
  const raw = config.safelist
  if (!Array.isArray(raw)) return []

  const out = new Set<string>()
  for (const entry of raw) {
    if (typeof entry === "string" && entry.length > 0) {
      out.add(entry)
      continue
    }
    if (!entry || typeof entry !== "object") continue
    const pattern = (entry as Record<string, unknown>).pattern
    if (typeof pattern === "string" && pattern.length > 0) {
      out.add(pattern)
    }
  }

  return Array.from(out)
}

const collectCustomUtilities = (config: Record<string, unknown>): Set<string> => {
  const out = new Set<string>()
  const theme = config.theme
  if (!theme || typeof theme !== "object") return out

  const extend = (theme as Record<string, unknown>).extend
  if (!extend || typeof extend !== "object") return out

  for (const [section, value] of Object.entries(extend as Record<string, unknown>)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue
    for (const key of Object.keys(value as Record<string, unknown>)) {
      out.add(`${section}-${key}`)
      if (section === "colors") {
        out.add(`bg-${key}`)
        out.add(`text-${key}`)
        out.add(`border-${key}`)
      } else if (section === "spacing") {
        out.add(`p-${key}`)
        out.add(`m-${key}`)
        out.add(`gap-${key}`)
        out.add(`w-${key}`)
        out.add(`h-${key}`)
      } else if (section === "fontSize") {
        out.add(`text-${key}`)
      } else if (section === "borderRadius") {
        out.add(`rounded-${key}`)
      } else if (section === "boxShadow") {
        out.add(`shadow-${key}`)
      }
    }
  }

  return out
}

const collectSafelistFromSource = async (configPath: string): Promise<string[]> => {
  const source = await fs.promises.readFile(configPath, "utf8")

  // Gunakan native AST parser untuk ekstrak string literals dari config
  // Lebih akurat dari regex — handle template literals, multiline, nested quotes
  const { extractClassesNative } = await import("@tailwind-styled/scanner")
  const allTokens = extractClassesNative(source)

  // Filter hanya token yang berasal dari safelist block
  // Native parse sudah return semua string value — kita cek apakah safelist array ada di source
  const hasSafelist = source.includes("safelist")
  if (!hasSafelist) return []

  // Ambil baris-baris safelist dari source untuk batasi scope
  const safelistMatch = source.match(/safelist\s*:\s*\[([\s\S]*?)\]/m)?.[1]
  if (!safelistMatch) return []

  // Cross-reference: hanya return token yang muncul di dalam safelist block
  const safelistSet = new Set<string>()
  for (const token of safelistMatch.matchAll(/["'`]([^"'`]+)["'`]/g)) {
    const value = token[1].trim()
    if (value.length > 0) safelistSet.add(value)
  }

  // Intersect dengan native extracted tokens untuk validasi
  return allTokens.filter((t: string) => safelistSet.has(t))
}

const loadTailwindConfig = async (
  root: string,
  semanticOption?: { tailwindConfigPath?: string }
): Promise<LoadedTailwindConfig | null> => {
  const startMs = Date.now()
  const configPath = await resolveTailwindConfigPath(root, semanticOption?.tailwindConfigPath)
  if (!configPath) return null

  if (!isSupportedTailwindConfigPath(configPath)) {
    return {
      path: configPath,
      loaded: false,
      warning: `Unsupported Tailwind config extension at "${configPath}". Supported extensions: .ts, .js, .cjs, .mjs.`,
      safelist: new Set<string>(),
      customUtilities: new Set<string>(),
    }
  }

  const configStat = await fs.promises.stat(configPath).catch(() => null)
  if (configStat) {
    const cached = tailwindConfigCache.get(configPath)
    if (cached && cached.mtimeMs === configStat.mtimeMs && cached.size === configStat.size) {
      debugLog(
        `tailwind config cache hit: ${configPath} (${cached.config.safelist.size} safelist entries)`
      )
      return cached.config
    }
  }

  const result = await (async (): Promise<{
    config: Record<string, unknown> | null
    warning: string | undefined
  }> => {
    try {
      const cacheBustToken = Math.trunc(configStat?.mtimeMs ?? Date.now())
      const imported = await import(`${pathToFileURL(configPath).href}?tws_mtime=${cacheBustToken}`)
      const candidate = (imported.default ?? imported) as unknown
      if (isRecord(candidate)) {
        return { config: candidate, warning: undefined }
      } else if (typeof candidate === "function") {
        const evaluated = candidate()
        if (isRecord(evaluated)) {
          return { config: evaluated, warning: undefined }
        }
        return { config: null, warning: "Tailwind config export function must return an object." }
      }
      return {
        config: null,
        warning: "Tailwind config export must be an object or a function returning an object.",
      }
    } catch (error) {
      return { config: null, warning: formatErrorMessage(error) }
    }
  })()

  const { config, warning } = result

  const safelist = new Set<string>()
  const customUtilities = new Set<string>()

  if (config) {
    for (const item of collectSafelistFromConfig(config)) safelist.add(item)
    for (const item of collectCustomUtilities(config)) customUtilities.add(item)
  }

  if (safelist.size === 0) {
    try {
      for (const item of await collectSafelistFromSource(configPath)) safelist.add(item)
    } catch (error) {
      debugLog(
        `failed to parse safelist from source at "${configPath}": ${formatErrorMessage(error)}`
      )
      // keep empty if source parsing fails
    }
  }

  const loaded = {
    path: configPath,
    loaded: config !== null,
    warning,
    safelist,
    customUtilities,
  }

  if (configStat) {
    tailwindConfigCache.set(configPath, {
      mtimeMs: configStat.mtimeMs,
      size: configStat.size,
      config: loaded,
    })
  }

  debugLog(
    `tailwind config loaded from "${configPath}" in ${Date.now() - startMs}ms ` +
      `(loaded=${loaded.loaded}, safelist=${loaded.safelist.size}, custom=${loaded.customUtilities.size})`
  )

   return loaded
 }

/**
 * Known Tailwind utility prefixes for fallback classification.
 * Used by isKnownTailwindClass for JS fallback (native path uses classify_known_classes).
 */
const KNOWN_UTILITY_PREFIXES = new Set([
  "absolute","align","animate","arbitrary","aspect","backdrop","basis","bg","block","border","bottom","col","container","contents","cursor","dark","display","divide","fill","fixed","flex","float","font","from","gap","grid","grow","h","hidden","inset","inline","isolate","items","justify","left","leading","line","list","m","max-h","max-w","mb","min-h","min-w","ml","mr","mt","mx","my","object","opacity","order","origin","outline","overflow","overscroll","p","pb","pe","perspective","place","pl","pointer","position","pr","ps","pt","px","py","relative","right","ring","rotate","rounded","row","scale","shadow","shrink","size","skew","snap","space-x","space-y","sr","start","static","sticky","stroke","table","text","to","top","touch","tracking","transform","transition","translate","truncate","underline","via","visible","w","whitespace","z",
])

/**
 * @internal JS fallback only — native path uses `classify_known_classes` in Rust.
 * Kept for external usage via __internal (API compatibility).
 */
export const utilityPrefix = (baseClass: string): string => {
  const normalized = baseClass.startsWith("-") ? baseClass.slice(1) : baseClass
  if (normalized.includes("[") && normalized.includes("]")) return "arbitrary"
  if (normalized.startsWith("min-w-")) return "min-w"
  if (normalized.startsWith("max-w-")) return "max-w"
  if (normalized.startsWith("min-h-")) return "min-h"
  if (normalized.startsWith("max-h-")) return "max-h"
  if (normalized.startsWith("space-x-")) return "space-x"
  if (normalized.startsWith("space-y-")) return "space-y"
  if (normalized.startsWith("inline-")) return "inline"
  if (normalized.startsWith("border-")) return "border"
  if (normalized.startsWith("text-")) return "text"
  if (normalized.startsWith("bg-")) return "bg"
  if (normalized.startsWith("rounded")) return "rounded"
  if (normalized.startsWith("shadow")) return "shadow"
  const hyphen = normalized.indexOf("-")
  if (hyphen < 0) return normalized
  return normalized.slice(0, hyphen)
}

/**
 * @internal JS fallback only — native path uses `classify_known_classes` in Rust.
 * Kept for external usage via __internal (API compatibility).
 */
const isKnownTailwindClass = (
  className: string,
  safelist: Set<string>,
  customUtilities: Set<string>
): boolean => {
  if (safelist.has(className) || customUtilities.has(className)) return true
  const { base } = splitVariantAndBase(className)
  if (customUtilities.has(base)) return true
  const prefix = utilityPrefix(base)
  return KNOWN_UTILITY_PREFIXES.has(prefix)
}

export const buildSemanticReport = async (
  usages: ClassUsage[],
  root: string,
  semanticOption?: { tailwindConfigPath?: string }
): Promise<AnalyzerSemanticReport> => {
  const loadedConfig = await loadTailwindConfig(root, semanticOption)
  const safelist = loadedConfig?.safelist ?? new Set<string>()
  const customUtilities = loadedConfig?.customUtilities ?? new Set<string>()
  const usageNames = new Set(usages.map((usage) => usage.name))

  const unusedClasses: ClassUsage[] = Array.from(safelist)
    .filter((className) => !usageNames.has(className))
    .sort()
    .map((className) => ({ name: className, count: 0, isUnused: true }))

   // ── Unknown classes — native-first (required) ─────────────────────────────
   const native = await getNativeBinding()
   if (!native?.classifyKnownClasses) {
     throw new Error("FATAL: Native binding 'classifyKnownClasses' is required but not available.")
   }
   const classNames = usages.map((u) => u.name)
   const results = native.classifyKnownClasses(
     classNames,
     Array.from(safelist),
     Array.from(customUtilities)
   )
    const unknownSet = new Set(
      results
        .filter((r: { className: string; isKnown: boolean }) => !r.isKnown)
        .map((r: { className: string; isKnown: boolean }) => r.className)
    )
    const unknownClasses = usages
      .filter((usage) => unknownSet.has(usage.name))
      .map((usage) => ({ ...usage, isUnused: true }))

  const { conflicts } = await detectConflicts(usages)

  return {
    unusedClasses,
    unknownClasses,
    conflicts,
    ...(loadedConfig
      ? {
          tailwindConfig: {
            path: loadedConfig.path,
            loaded: loadedConfig.loaded,
            safelistCount: loadedConfig.safelist.size,
            customUtilityCount: loadedConfig.customUtilities.size,
            ...(loadedConfig.warning ? { warning: loadedConfig.warning } : {}),
          },
        }
      : {}),
  }
}