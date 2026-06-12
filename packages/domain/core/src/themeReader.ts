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

// ─── resolveThemeValue — dipertahankan untuk backward-compat ─────────────────
// Masih bisa dipanggil dari kode lain yang butuh resolve satu token secara
// on-demand (misalnya dari styledSystem.ts atau plugin consumer).
// Di hot path extractThemeFromCSS(), fungsi ini sudah TIDAK dipanggil lagi.

export function resolveThemeValue(
  key: string,
  theme: ThemeConfig,
  _visited?: Set<string>
): string {
  const binding = getNativeBinding()
  if (!binding?.resolveThemeValue) {
    throw new Error("FATAL: Native binding 'resolveThemeValue' is required but not available.")
  }
  return binding.resolveThemeValue(key, JSON.stringify(theme.raw))
}

// ─── extractThemeFromCSS — hot path ──────────────────────────────────────────

export function extractThemeFromCSS(cssContent: string): ThemeConfig {
  const hit = cache.get(cssContent)
  if (hit) return hit

  const binding = getNativeBinding()
  if (!binding?.extractThemeFromCssClassified) {
    throw new Error(
      "FATAL: Native binding 'extractThemeFromCssClassified' is required but not available.\n" +
      "Run 'npm run build:rust' to build the native module."
    )
  }

  const result = binding.extractThemeFromCssClassified(cssContent) as ThemeConfig
  cache.set(cssContent, result)
  return result
}

// ─── parseThemeColors — Native Rust color parsing ────────────────────────────

export function parseThemeColors(colorsObj: Record<string, string>): Record<string, string> {
  const binding = getNativeBinding()
  if (!binding?.parseColorsNapi) {
    // Fallback: return as-is if native parsing unavailable
    return colorsObj
  }
  try {
    const parsed = binding.parseColorsNapi(JSON.stringify(colorsObj))
    return typeof parsed === "string" ? JSON.parse(parsed) : parsed
  } catch {
    return colorsObj // Fallback on error
  }
}

// ─── parseThemeSpacing — Native Rust spacing parsing ────────────────────────────

export function parseThemeSpacing(spacingObj: Record<string, string>): Record<string, string> {
  const binding = getNativeBinding()
  if (!binding?.parseSpacingNapi) {
    return spacingObj
  }
  try {
    const parsed = binding.parseSpacingNapi(JSON.stringify(spacingObj))
    return typeof parsed === "string" ? JSON.parse(parsed) : parsed
  } catch {
    return spacingObj
  }
}

// ─── parseThemeTransform — Native Rust transform parsing ────────────────────────

export function parseThemeTransform(transformObj: Record<string, string>): Record<string, string> {
  const binding = getNativeBinding()
  if (!binding?.parseTransformNapi) {
    return transformObj
  }
  try {
    const parsed = binding.parseTransformNapi(JSON.stringify(transformObj))
    return typeof parsed === "string" ? JSON.parse(parsed) : parsed
  } catch {
    return transformObj
  }
}

// ─── normalizeThemeColor — Native color normalization ──────────────────────────

export function normalizeThemeColor(color: string, opacity?: number): string {
  const binding = getNativeBinding()
  if (!binding?.normalizeColorNapi) {
    return color
  }
  try {
    return binding.normalizeColorNapi(color, opacity?.toString() ?? "100") || color
  } catch {
    return color
  }
}

// ─── sanitizeThemeColor — Native color sanitization ────────────────────────────

export function sanitizeThemeColor(color: string): string {
  const binding = getNativeBinding()
  if (!binding?.sanitizeColorNapi) {
    return color
  }
  try {
    return binding.sanitizeColorNapi(color) || color
  } catch {
    return color
  }
}

// ─── splitRgba — Native RGBA splitting ────────────────────────────────────────

export function splitRgbaColor(color: string): { r: number; g: number; b: number; a: number } | null {
  const binding = getNativeBinding()
  if (!binding?.splitRgbaNapi) {
    return null
  }
  try {
    const result = binding.splitRgbaNapi(color)
    return typeof result === "string" ? JSON.parse(result) : result
  } catch {
    return null
  }
}

export function generateTypeDefinitions(theme: ThemeConfig): string {
  const binding = getNativeBinding()
  if (!binding?.generateTypeDefinitions) {
    throw new Error("FATAL: Native binding 'generateTypeDefinitions' is required but not available.")
  }
  const { raw: _raw, ...rest } = theme
  return binding.generateTypeDefinitions(JSON.stringify(rest)) as string
}

export function clearThemeReaderCache(): void {
  cache.clear()
}