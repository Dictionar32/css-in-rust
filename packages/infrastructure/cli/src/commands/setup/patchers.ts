export function patchNextConfigImpl(src: string): string | null {
  if (src.includes("withTailwindStyled")) return null

  const hasExport = src.includes("export default")
  const hasCjs = src.includes("module.exports")

  if (hasExport) {
    const withImport = `import { withTailwindStyled } from "tailwind-styled-v4/next"\n${src}`

    const patterns = [
      /export default\s+([\w]+);?\s*$/m,
      /export default\s+(defineConfig\([\s\S]*?\));?\s*$/m,
      /export default\s+(\{[\s\S]*?\});?\s*$/m,
    ]

    const result = patterns.reduce(
      (acc, pattern) =>
        acc.replace(pattern, (_match, expr) => `export default withTailwindStyled()(${expr})`),
      withImport
    )

    return result === src ? null : result
  }

  if (hasCjs) {
    const result =
      `const { withTailwindStyled } = require("tailwind-styled-v4/next")\n` +
      src.replace(
        /module\.exports\s*=\s*(.+)/s,
        (_match, expr) => `module.exports = withTailwindStyled()(${expr.trim()})`
      )
    return result === src ? null : result
  }

  return null
}

export function patchViteConfigImpl(src: string): string | null {
  const hasLegacyImport = src.includes("tailwind-styled-v4/vite")

  const patched = hasLegacyImport
    ? src
        .replace(/from\s+['"]tailwind-styled-v4\/vite['"]/g, 'from "tailwind-styled-v4/vite"')
        .replace(/\btailwindStyled\(/g, "tailwindStyledPlugin(")
    : src.replace(/\btailwindStyled\(/g, "tailwindStyledPlugin(")

  const alreadyConfigured =
    patched.includes("tailwind-styled-v4/vite") && patched.includes("tailwindStyledPlugin(")
  if (alreadyConfigured) return patched === src ? null : patched

  const viteImportMatch = patched.match(/(import .+ from ['"]vite['"][^\n]*\n)/)
  const reactImportMatch = patched.match(/(import .+ from ['"]@vitejs\/plugin-react['"][^\n]*\n)/)
  const insertAfter = (reactImportMatch ?? viteImportMatch)?.[1]

  const result = (() => {
    if (!patched.includes("tailwind-styled-v4/vite") && insertAfter) {
      return patched.replace(
        insertAfter,
        `${insertAfter}import { tailwindStyledPlugin } from "tailwind-styled-v4/vite"\n`
      )
    }
    if (!patched.includes("tailwind-styled-v4/vite")) {
      return `import { tailwindStyledPlugin } from "tailwind-styled-v4/vite"\n${patched}`
    }
    return patched
  })()

  return result === src ? null : result
}

export function patchRspackConfigImpl(src: string): string | null {
  const hasModernImport = src.includes("tailwind-styled-v4/rspack")
  const hasLegacyImport = src.includes("tailwind-styled-v4/rspack")

  const withLegacyFix = hasLegacyImport
    ? src.replace(/from\s+['"]tailwind-styled-v4\/rspack['"]/g, 'from "tailwind-styled-v4/rspack"')
    : src

  const patched = withLegacyFix.replace(/\btailwindStyled\(/g, "tailwindStyledRspackPlugin(")

  const alreadyConfigured =
    patched.includes("tailwind-styled-v4/rspack") && patched.includes("tailwindStyledRspackPlugin(")
  if (alreadyConfigured) return patched === src ? null : patched

  const result = (() => {
    if (!patched.includes("tailwind-styled-v4/rspack") && !hasModernImport) {
      const lines = patched.split("\n")
      const lastImportIdx = lines.reduce((maxIdx, line, idx) => {
        return line.trimStart().startsWith("import ") ? idx : maxIdx
      }, 0)
      lines.splice(
        lastImportIdx + 1,
        0,
        'import { tailwindStyledRspackPlugin } from "tailwind-styled-v4/rspack"'
      )
      return lines.join("\n")
    }
    return patched
  })()

  const finalResult = (() => {
    if (!result.includes("tailwindStyledRspackPlugin(")) {
      if (result.includes("plugins:")) {
        return result.replace(
          /plugins:\s*\[([^\]]*)\]/s,
          (_match, inner) => `plugins: [${inner.trimEnd()}\n    tailwindStyledRspackPlugin(),\n  ]`
        )
      }
      return result.replace(
        /(export default defineConfig\(\{[\s\S]*?)(\}\))/,
        (_match, body, close) => `${body}  plugins: [tailwindStyledRspackPlugin()],\n${close}`
      )
    }
    return result
  })()

  return finalResult === src ? null : finalResult
}

/**
 * Hitung path relatif dari cssFilePath ke `.next/tw-classes/[!_]*.css`.
 * Pattern `[!_]*.css` — micromatch/picomatch glob yang didukung Tailwind v4 —
 * match semua component CSS files (misal `component_button.css`) tapi
 * EXCLUDE file dengan underscore prefix (`_tw-state-static.css`,
 * `_initial-scan.css`, `_cycle.txt`, dll.) yang berisi raw CSS atau sentinels.
 *
 * Contoh:
 *   cssFile = "src/app/globals.css" → "../../.next/tw-classes/[!_]*.css"
 *   cssFile = "src/globals.css"     → "../.next/tw-classes/[!_]*.css"
 */
export function computeSafelistSourcePath(cssFilePath: string, cwd: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodePath = require("node:path") as typeof import("node:path")
    const cssAbs = nodePath.resolve(cwd, cssFilePath)
    const cssDir = nodePath.dirname(cssAbs)
    // Per-file safelist dir — Turbopack writes one CSS file per component here
    const safelistAbs = nodePath.resolve(cwd, ".next", "tw-classes")
    const rel = nodePath.relative(cssDir, safelistAbs).replace(/\\/g, "/")
    const relPath = rel.startsWith(".") ? rel : `./${rel}`
    // [!_]*.css — match component files only, exclude _sentinel files
    return `${relPath}/[!_]*.css`
  } catch {
    const depth = cssFilePath.split("/").length - 1
    const ups = Array(depth).fill("..").join("/")
    return `${ups}/.next/tw-classes/[!_]*.css`
  }
}

/**
 * Hitung path relatif dari cssFilePath ke `.next/_tw-state-static.css`.
 * Contoh:
 *   cssFile = "src/app/globals.css" → "../../.next/_tw-state-static.css"
 *   cssFile = "src/globals.css"     → "../.next/_tw-state-static.css"
 */
export function computeStateStaticImportPath(cssFilePath: string, cwd: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodePath = require("node:path") as typeof import("node:path")
    const cssAbs = nodePath.resolve(cwd, cssFilePath)
    const cssDir = nodePath.dirname(cssAbs)
    const stateStaticAbs = nodePath.resolve(cwd, ".next", "_tw-state-static.css")
    const rel = nodePath.relative(cssDir, stateStaticAbs).replace(/\\/g, "/")
    return rel.startsWith(".") ? rel : `./${rel}`
  } catch {
    const depth = cssFilePath.split("/").length - 1
    const ups = Array(depth).fill("..").join("/")
    return `${ups}/.next/_tw-state-static.css`
  }
}

export function patchTailwindCssImpl(
  src: string,
  bundler?: "next" | "vite" | "rspack",
  cssFilePath?: string,
  cwd?: string
): string | null {
  const hasTailwindImport =
    src.includes('@import "tailwindcss"') || src.includes("@import 'tailwindcss'")

  const hasSafelistSource = src.includes("tw-classes")
  const hasStateImport = src.includes("_tw-state-static.css")
  const needsSafelistSource = bundler === "next" && !hasSafelistSource
  const needsStateImport = bundler === "next" && !hasStateImport

  const safelistRelPath =
    needsSafelistSource && cssFilePath && cwd
      ? computeSafelistSourcePath(cssFilePath, cwd)
      : "../.next/tw-classes/**"

  const stateImportRelPath =
    needsStateImport && cssFilePath && cwd
      ? computeStateStaticImportPath(cssFilePath, cwd)
      : "../.next/_tw-state-static.css"

  const safelistSource = `@source "${safelistRelPath}";`
  // @import state CSS harus tanpa layer() — berisi raw CSS selector, bukan utilities
  const stateImport = `@import "${stateImportRelPath}";`

  if (hasTailwindImport) {
    if (!needsSafelistSource && !needsStateImport) return null

    let patched = src

    // Inject @source setelah @import "tailwindcss" jika belum ada
    if (needsSafelistSource) {
      patched = patched.replace(
        /(@import\s+['"]tailwindcss['"];?)/,
        `$1\n${safelistSource}`
      )
    }

    // Inject @import state CSS setelah @source (atau setelah @import tailwindcss jika tidak ada @source)
    if (needsStateImport) {
      if (patched.includes("tw-classes")) {
        // Tambah setelah baris @source
        patched = patched.replace(
          /(@source\s+["'][^"']+["'];?)/,
          `$1\n${stateImport}`
        )
      } else {
        // Fallback: tambah setelah @import "tailwindcss"
        patched = patched.replace(
          /(@import\s+['"]tailwindcss['"];?)/,
          `$1\n${stateImport}`
        )
      }
    }

    return patched === src ? null : patched
  }

  // Tidak ada @import "tailwindcss" sama sekali — tulis dari awal
  const lines: string[] = [`@import "tailwindcss";`]
  if (needsSafelistSource) lines.push(safelistSource)
  if (needsStateImport) lines.push(stateImport)
  lines.push("", src)

  return lines.join("\n")
}

export function patchTsConfigImpl(src: string): string | null {
  try {
    const json = JSON.parse(src) as { compilerOptions?: Record<string, unknown> }
    const compilerOptions = (json.compilerOptions ?? {}) as Record<string, unknown>

    const original = { ...compilerOptions }

    // Apply changes immutably
    const updatedCompilerOptions = {
      ...compilerOptions,
      paths: compilerOptions.paths ?? {},
      strict: compilerOptions.strict === undefined ? true : compilerOptions.strict,
      moduleResolution:
        compilerOptions.moduleResolution === "node16" ||
        compilerOptions.moduleResolution === "bundler"
          ? compilerOptions.moduleResolution
          : "bundler",
      jsx: compilerOptions.jsx ?? "react-jsx",
    }

    const hasChanges =
      updatedCompilerOptions.paths !== original.paths ||
      updatedCompilerOptions.strict !== original.strict ||
      updatedCompilerOptions.moduleResolution !== original.moduleResolution ||
      updatedCompilerOptions.jsx !== original.jsx

    if (!hasChanges) return null

    const updatedJson = {
      ...json,
      compilerOptions: updatedCompilerOptions,
    }

    return `${JSON.stringify(updatedJson, null, 2)}\n`
  } catch {
    return null
  }
}