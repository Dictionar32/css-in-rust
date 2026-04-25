/**
 * tailwind-styled-v5 — Native Rust Bindings
 * 
 * All functions require native Rust bindings.
 * Uses @tailwind-styled/shared for native resolution.
 */

const isBrowser = typeof window !== "undefined" || typeof document !== "undefined"
const NATIVE_UNAVAILABLE_MESSAGE =
  "[tailwind-styled/core] Native binding is required but not available.\n" +
  "Please ensure you have run: npm run build:rust"

const nodeRequire = typeof require !== "undefined" ? require : (typeof globalThis !== "undefined" ? (globalThis as any).require : null)

function getResolveRuntimeDir() {
  if (isBrowser) return () => ""
  const { dirname } = nodeRequire!("node:path")
  const { fileURLToPath } = nodeRequire!("node:url")
  return (dir: string | undefined, importMetaUrl: string) => dir ?? dirname(fileURLToPath(importMetaUrl))
}

function getResolveNativeBinary() {
  if (isBrowser) return () => ({ path: null, source: "not-found", platform: "browser", tried: [] })
  const { resolveNativeBinary: resolve } = nodeRequire!("@tailwind-styled/shared")
  return resolve
}

function getCreateRequire() {
  if (isBrowser) return () => { throw new Error("node:module is not available in browser") }
  return nodeRequire!("node:module").createRequire
}

let _resolveRuntimeDir: ReturnType<typeof getResolveRuntimeDir>
let _resolveNativeBinary: ReturnType<typeof getResolveNativeBinary>
let _createRequire: ReturnType<typeof getCreateRequire>

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedClassModifier {
  type: "opacity" | "arbitrary"
  value: string
}

export interface ParsedClass {
  raw: string
  base: string
  variants: string[]
  modifier?: ParsedClassModifier
}

export interface ThemeConfig {
  colors: Record<string, string>
  spacing: Record<string, string>
  fonts: Record<string, string>
  breakpoints: Record<string, string>
  animations: Record<string, string>
  raw: Record<string, string>
}

interface NativeBinding {
  batchSplitClasses?: (input: string[]) => Array<{
    variantKey: string
    base: string
    variants: string[]
    isArbitrary: boolean
    hasModifier: boolean
  }>
  compileTheme?: (themeConfig: string) => { css: string; variables: Record<string, string> }
  extractCssVars?: (css: string) => Record<string, string>
  extractThemeFromCss?: (css: string) => Array<{ key: string; value: string }>
  parseCssRules?: (css: string) => Array<{
    className: string
    property: string
    value: string
    isImportant: boolean
    variants: string[]
    specificity: number
  }>
  parseCssToRules?: (css: string) => string
  detectDeadCode?: (css: string, usedClasses: string[]) => string[]
  classifyKnownClasses?: (classes: string[]) => Array<{ className: string; category: string }>
  detectClassConflicts?: (classes: string) => { conflicts: Array<{ class1: string; class2: string; reason: string }>; conflictedClassNames: string[] }
  resolveVariants?: (configJson: string, propsJson: string) => { classes: string; resolvedCount: number }
  resolveSimpleVariants?: (base: string | null, variants: Record<string, Record<string, string>>, defaults: Record<string, string>, props: Record<string, string>) => string
}

// ─────────────────────────────────────────────────────────────────────────────
// Binding Loader
// ─────────────────────────────────────────────────────────────────────────────

let nativeBinding: NativeBinding | null = null
let bindingLoadAttempted = false

const getBinding = (): NativeBinding => {
  if (isBrowser) {
    throw new Error(NATIVE_UNAVAILABLE_MESSAGE + "\n\nNative bindings are not available in browser. Use the compiled CSS output instead.")
  }
  
  if (nativeBinding) return nativeBinding

  if (bindingLoadAttempted) {
    throw new Error(NATIVE_UNAVAILABLE_MESSAGE)
  }

  bindingLoadAttempted = true

  try {
    if (!_resolveRuntimeDir) _resolveRuntimeDir = getResolveRuntimeDir()
    if (!_resolveNativeBinary) _resolveNativeBinary = getResolveNativeBinary()
    if (!_createRequire) _createRequire = getCreateRequire()
    
    const runtimeDir = _resolveRuntimeDir(undefined, import.meta.url)
    const require = _createRequire(import.meta.url)
    const result = _resolveNativeBinary(runtimeDir)

    if (result.path && result.path.endsWith(".node")) {
      const mod = require(result.path) as NativeBinding
      if (mod?.batchSplitClasses) {
        nativeBinding = mod
        return nativeBinding
      }
    }

    throw new Error(`${NATIVE_UNAVAILABLE_MESSAGE}\n\nTried: ${result.tried.join("\n")}`)
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err))
  }
}

export const resetNativeBinding = (): void => {
  nativeBinding = null
  bindingLoadAttempted = false
}

export const getNativeBinding = getBinding

// ─────────────────────────────────────────────────────────────────────────────
// Parser Functions
// ─────────────────────────────────────────────────────────────────────────────

function splitClassListNative(input: string): string[] {
  const binding = getBinding()
  if (!binding?.batchSplitClasses) {
    throw new Error(NATIVE_UNAVAILABLE_MESSAGE)
  }
  const result = binding.batchSplitClasses([input])
  if (result.length === 0) return []
  return result[0].base.split(" ").filter(Boolean)
}

function parseClassTokenNative(rawToken: string): ParsedClass {
  const binding = getBinding()
  if (!binding?.batchSplitClasses) {
    throw new Error(NATIVE_UNAVAILABLE_MESSAGE)
  }
  const result = binding.batchSplitClasses([rawToken])
  if (result.length === 0) {
    return { raw: rawToken, base: rawToken, variants: [] }
  }
  const r = result[0]
  const parsed: ParsedClass = {
    raw: r.base,
    base: r.base,
    variants: r.variants,
  }
  if (r.hasModifier) {
    const opacityMatch = r.base.match(/^(.*)\/(\d{1,3})$/)
    if (opacityMatch && opacityMatch[1].length > 0) {
      parsed.base = opacityMatch[1]
      parsed.modifier = { type: "opacity", value: opacityMatch[2] }
    } else {
      const arbitraryMatch = r.base.match(/\((--[a-zA-Z0-9_-]+)\)/)
      if (arbitraryMatch) {
        parsed.modifier = { type: "arbitrary", value: arbitraryMatch[1] }
      }
    }
  }
  return parsed
}

export function splitClassList(input: string): string[] {
  return splitClassListNative(input)
}

export function parseClassToken(rawToken: string): ParsedClass {
  return parseClassTokenNative(rawToken)
}

export function parseTailwindClasses(input: string): ParsedClass[] {
  const classes = splitClassListNative(input)
  return classes.map((c) => parseClassTokenNative(c))
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS/Theme Functions
// ─────────────────────────────────────────────────────────────────────────────

export function compileTheme(themeConfig: Record<string, unknown>) {
  const binding = getBinding()
  if (!binding?.compileTheme) {
    throw new Error(NATIVE_UNAVAILABLE_MESSAGE)
  }
  return binding.compileTheme(JSON.stringify(themeConfig))
}

export function extractCssVars(css: string): Record<string, string> {
  const binding = getBinding()
  if (!binding?.extractCssVars) {
    throw new Error(NATIVE_UNAVAILABLE_MESSAGE)
  }
  return binding.extractCssVars(css)
}

export function parseCssRules(css: string) {
  const binding = getBinding()
  if (!binding?.parseCssRules) {
    throw new Error(NATIVE_UNAVAILABLE_MESSAGE)
  }
  return binding.parseCssRules(css)
}

export function parseCssToRules(css: string): string {
  const binding = getBinding()
  if (!binding?.parseCssToRules) {
    throw new Error(NATIVE_UNAVAILABLE_MESSAGE)
  }
  return binding.parseCssToRules(css)
}

export function detectDeadCode(css: string, usedClasses: string[]): string[] {
  const binding = getBinding()
  if (!binding?.detectDeadCode) {
    throw new Error(NATIVE_UNAVAILABLE_MESSAGE)
  }
  return binding.detectDeadCode(css, usedClasses)
}

export function classifyKnownClasses(classes: string[]) {
  const binding = getBinding()
  if (!binding?.classifyKnownClasses) {
    throw new Error(NATIVE_UNAVAILABLE_MESSAGE)
  }
  return binding.classifyKnownClasses(classes)
}

export function detectClassConflicts(classes: string[]) {
  const binding = getBinding()
  if (!binding?.detectClassConflicts) {
    throw new Error(NATIVE_UNAVAILABLE_MESSAGE)
  }
  return binding.detectClassConflicts(classes.join(" "))
}

export function extractThemeFromCSS(cssContent: string): ThemeConfig {
  const binding = getBinding()
  if (!binding?.parseCssRules) {
    throw new Error(NATIVE_UNAVAILABLE_MESSAGE)
  }
  
  const properties = binding.parseCssRules(cssContent)
  const theme: ThemeConfig = {
    colors: {},
    spacing: {},
    fonts: {},
    breakpoints: {},
    animations: {},
    raw: {},
  }
  
  const prefixMap: Record<string, keyof ThemeConfig> = {
    "color-": "colors",
    "spacing-": "spacing",
    "font-": "fonts",
    "breakpoint-": "breakpoints",
    "animate-": "animations",
  }
  
  for (const prop of properties) {
    const cssVar = prop.property.replace(/^--/, "")
    theme.raw[cssVar] = prop.value
    
    for (const [prefix, category] of Object.entries(prefixMap)) {
      if (cssVar.startsWith(prefix)) {
        const name = cssVar.slice(prefix.length)
        if (name) theme[category][name] = prop.value
        break
      }
    }
  }
  
  return theme
}