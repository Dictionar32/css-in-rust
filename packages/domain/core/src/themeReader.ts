import { getNativeBinding } from "./native"

export interface ThemeConfig {
  colors: Record<string, string>
  spacing: Record<string, string>
  fonts: Record<string, string>
  breakpoints: Record<string, string>
  animations: Record<string, string>
  raw: Record<string, string>
}

const cache = new Map<string, ThemeConfig>()

function createEmptyTheme(): ThemeConfig {
  return { colors: {}, spacing: {}, fonts: {}, breakpoints: {}, animations: {}, raw: {} }
}

function setToken(theme: ThemeConfig, key: string, value: string): void {
  theme.raw[key] = value
  if (key.startsWith("color-")) { theme.colors[key.slice(6)] = value; return }
  if (key.startsWith("spacing-")) { theme.spacing[key.slice(8)] = value; return }
  if (key.startsWith("font-")) { theme.fonts[key.slice(5)] = value; return }
  if (key.startsWith("breakpoint-")) { theme.breakpoints[key.slice(11)] = value; return }
  if (key.startsWith("animate-")) { theme.animations[key.slice(8)] = value }
}

export function resolveThemeValue(
  key: string,
  theme: ThemeConfig,
  visited: Set<string> = new Set()
): string {
  const token = key.replace(/^--/, "")
  const raw = theme.raw[token]
  if (!raw) return ""
  if (visited.has(token)) return raw
  const nested = raw.match(/^var\((--[a-zA-Z0-9_-]+)\)$/)
  if (!nested) return raw
  visited.add(token)
  return resolveThemeValue(nested[1], theme, visited)
}

export function extractThemeFromCSS(cssContent: string): ThemeConfig {
  const hit = cache.get(cssContent)
  if (hit) return hit

  const binding = getNativeBinding()
  if (!binding?.extractThemeFromCss) {
    throw new Error(
      "FATAL: Native binding 'extractThemeFromCss' is required but not available.\n" +
      "Run 'npm run build:rust' to build the native module."
    )
  }

  // Native Rust: parse @theme { --key: value; } blocks
  const vars = binding.extractThemeFromCss(cssContent) as Array<{ key: string; value: string }>

  const theme = createEmptyTheme()
  for (const { key, value } of vars) {
    setToken(theme, key, value)
  }

  // Resolve var() references
  for (const key of Object.keys(theme.raw)) {
    const resolved = resolveThemeValue(`--${key}`, theme)
    theme.raw[key] = resolved
    if (key.startsWith("color-")) theme.colors[key.slice(6)] = resolved
    else if (key.startsWith("spacing-")) theme.spacing[key.slice(8)] = resolved
    else if (key.startsWith("font-")) theme.fonts[key.slice(5)] = resolved
    else if (key.startsWith("breakpoint-")) theme.breakpoints[key.slice(11)] = resolved
    else if (key.startsWith("animate-")) theme.animations[key.slice(8)] = resolved
  }

  cache.set(cssContent, theme)
  return theme
}

export function generateTypeDefinitions(theme: ThemeConfig): string {
  const toRecordType = (name: string, obj: Record<string, string>) => {
    const keys = Object.keys(obj)
    if (keys.length === 0) return `  ${name}: Record<string, string>`
    const mapped = keys.map((k) => `    "${k}": string`).join("\n")
    return `  ${name}: {\n${mapped}\n  }`
  }

  return [
    "export interface TailwindStyledThemeTokens {",
    toRecordType("colors", theme.colors),
    toRecordType("spacing", theme.spacing),
    toRecordType("fonts", theme.fonts),
    toRecordType("breakpoints", theme.breakpoints),
    toRecordType("animations", theme.animations),
    "}",
    "",
  ].join("\n")
}

export function clearThemeReaderCache(): void {
  cache.clear()
}