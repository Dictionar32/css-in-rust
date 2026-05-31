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

// ─── generateTypeDefinitions — build-time CLI codegen ────────────────────────

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