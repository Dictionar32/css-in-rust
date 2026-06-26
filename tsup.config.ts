import { defineConfig } from "tsup"
import { existsSync } from "fs"
import { readFile, writeFile, rm } from "node:fs/promises"
import path from "node:path"

const projectRoot = new URL(".", import.meta.url).pathname
  .replace(/^\/([A-Z]:)/, "$1")
const root = (p: string) => `${projectRoot}${p}`

const entries = {
  index: "src/umbrella/index.ts",
  webpackLoader: "packages/presentation/next/src/webpackLoader.ts",
  turbopackLoader: "packages/presentation/next/src/turbopackLoader.ts",
  animate: "src/umbrella/animate.ts",
  analyzer: "src/umbrella/analyzer.ts",
  atomic: "src/umbrella/atomic.ts",
  cli: "src/umbrella/cli.ts",
  compiler: "src/umbrella/compiler.ts",
  dashboard: "src/umbrella/dashboard.ts",
  devtools: "src/umbrella/devtools.ts",
  engine: "src/umbrella/engine.ts",
  next: "src/umbrella/next.ts",
  plugin: "src/umbrella/plugin.ts",
  "plugin-api": "src/umbrella/plugin-api.ts",
  "plugin-registry": "src/umbrella/plugin-registry.ts",
  preset: "src/umbrella/preset.ts",
  rspack: "src/umbrella/rspack.ts",
  runtime: "src/umbrella/runtime.ts",
  "runtime-css": "src/umbrella/runtime-css.ts",
  scanner: "src/umbrella/scanner.ts",
  shared: "src/umbrella/shared.ts",
  "storybook-addon": "src/umbrella/storybook-addon.ts",
  svelte: "src/umbrella/svelte.ts",
  syntax: "src/umbrella/syntax.ts",
  testing: "src/umbrella/testing.ts",
  theme: "src/umbrella/theme.ts",
  tw: "src/umbrella/tw.ts",
  vite: "src/umbrella/vite.ts",
  vue: "src/umbrella/vue.ts",
}

const sharedExternal = [
  "react", "react-dom", "react/jsx-runtime",
  "next", "vite", "webpack", "@rspack/core",
  "vue", "svelte",
  "zod", "tailwindcss", "postcss", "inversify",
  "reflect-metadata", "@clack/prompts", "ts-pattern",
  "@storybook/types", "@storybook/core-events",
]

const nodeBuiltins = [
  "fs", "path", "os", "url", "crypto", "module",
  "child_process", "worker_threads", "stream", "events", "util",
  "node:fs", "node:path", "node:os", "node:url", "node:crypto",
  "node:module", "node:child_process", "node:worker_threads",
  "node:stream", "node:events", "node:util",
]

// ─── Preserve RSC directives via metafile ────────────────────────────────────
// esbuild strips leading directives ("use client", "use server") ketika
// directive ada di *imported* module, bukan di bundle entry point.
//
// Solusi: setelah tsup selesai tulis dist/, baca metafile-esm.json untuk tau
// input → output mapping, lalu trace balik: kalau ada input file yang mulai
// dengan directive → prepend directive ke output chunk tersebut.
//
// Pattern ini zero-dependency, granular (hanya inject ke chunk yang relevan),
// dan robust terhadap code splitting. Ref: github.com/azex-ai/ledger
// ─────────────────────────────────────────────────────────────────────────────
const DIRECTIVE_RE = /^\s*["'](use (?:client|server))["']\s*[;\n]/

interface Metafile {
  outputs: Record<string, { inputs: Record<string, unknown> }>
}

async function preserveDirectives(distDir: string): Promise<void> {
  const metaPath = path.resolve(distDir, "metafile-esm.json")

  let meta: Metafile
  try {
    meta = JSON.parse(await readFile(metaPath, "utf8")) as Metafile
  } catch {
    // metafile tidak ada (misal hanya CJS build) — skip
    return
  }

  const cwd = process.cwd()
  const cache = new Map<string, string | null>()

  const directiveOf = async (input: string): Promise<string | null> => {
    if (cache.has(input)) return cache.get(input)!
    try {
      const src = await readFile(path.resolve(cwd, input), "utf8")
      const directive = DIRECTIVE_RE.exec(src)?.[1] ?? null
      cache.set(input, directive)
      return directive
    } catch {
      cache.set(input, null)
      return null
    }
  }

  await Promise.all(
    Object.entries(meta.outputs).map(async ([outPath, output]) => {
      // Hanya proses .js files (skip .map, .d.ts, dll)
      if (!outPath.endsWith(".js")) return

      // Cari directive dari semua input files yang masuk ke chunk ini
      let directive: string | null = null
      for (const input of Object.keys(output.inputs)) {
        directive = await directiveOf(input)
        if (directive) break
      }
      if (!directive) return

      // Prepend directive ke output file jika belum ada
      const abs = path.resolve(cwd, outPath)
      const text = await readFile(abs, "utf8")
      if (text.startsWith(`"${directive}"`)) return
      await writeFile(abs, `"${directive}";\n${text}`)
    })
  )

  // Hapus metafile — build artifact only, jangan ikut ke-publish
  await rm(metaPath, { force: true })
}

const sharedConfig = {
  clean: false,
  dts: false,
  tsconfig: "./tsconfig.json",
  outDir: "dist",
  splitting: false,
  noExternal: [/^@tailwind-styled\//] as RegExp[],
  sourcemap: true,
  treeshake: false,
  minify: false,
  // Ref: tsup docs — shims:true otomatis polyfill import.meta.url di CJS
  // dan __dirname/__filename di ESM. Menggantikan manual banner "file://unknown"
  // yang crash di Next.js Turbopack ESM context.
  // https://tsup.egoist.dev/#inject-cjs-and-esm-shims
  shims: true,
  // footer bukan banner — supaya tidak push "use client" ke baris ke-2.
  // preserveDirectives() akan inject directive di baris 1 via onSuccess.
  footer: {
    js: "/* tailwind-styled-v4 v5.1.9 | MIT | https://github.com/dictionar32/tailwind-styled-v4 */",
  },
  esbuildOptions(options: import("esbuild").BuildOptions, _context: { format: string }) {
    // The compiler package's native-bridge chunk is split out as a shared
    // chunk and marked sideEffects:false. When other packages bundle it in
    // (via noExternal above) but only use a subset of its exports, esbuild
    // correctly drops the now-unused bare import — but still warns about it.
    // Confirmed harmless: that chunk only contains top-level declarations
    // (no code actually runs at import time), so silence just this warning
    // code instead of changing tree-shaking/sideEffects behaviour repo-wide.
    options.logOverride = {
      ...options.logOverride,
      "ignored-bare-import": "silent",
    }
  },
}

const hasBrowserEntry = existsSync("src/umbrella/index.browser.ts")

// Path ke native.browser.ts — stub tanpa Node built-ins.
const nativeBrowserPath = root("packages/domain/core/src/native.browser.ts")
  .replace(/\\/g, "/")

// Path ke shared.browser.ts — stub untuk @tailwind-styled/shared (Node-only).
const sharedBrowserStubPath = root("src/stubs/shared.browser.ts")
  .replace(/\\/g, "/")

// Plugin ini di-inject via esbuildPlugins (bukan esbuildOptions) supaya
// jalan SEBELUM tsup's internal noExternal resolver.
//
// Kenapa esbuildPlugins, bukan esbuildOptions?
// - esbuildOptions dipanggil setelah tsup sudah setup internal plugins-nya.
//   Append/prepend di sana tidak cukup karena tsup bisa override lagi.
// - esbuildPlugins adalah tsup top-level option yang inject plugin sebelum
//   tsup mendaftarkan internal resolver-nya.
//
// Fix #3: ./native -> native.browser.ts
//   cv.ts, twProxy.ts, createComponent.ts, stateEngine.ts semua import
//   "./native" tanpa ekstensi. Harus di-redirect ke stub agar fs/module
//   tidak ikut terbundle.
//
// Fix #5: @tailwind-styled/shared -> shared.browser.ts
//   Shared import fs/crypto/module di top-level. Kalau ikut terbundle
//   ke browser output, Next.js langsung error "Can't resolve 'fs'".
//   index.browser.ts sudah pakai relative import langsung ke TS source
//   (bukan package import), jadi shared tidak masuk lewat @tailwind-styled/core.
//   Tapi kalau ada file lain yang import shared, plugin ini menangkapnya.
const nativeBrowserPlugin = {
  name: "native-to-browser-alias",
  setup(build: { onResolve: Function }) {
    // Fix #5: @tailwind-styled/shared -> no-op browser stub.
    build.onResolve(
      { filter: /^@tailwind-styled\/shared$/ },
      (_args: { path: string }) => ({ path: sharedBrowserStubPath })
    )

    // Fix #3: ./native dan ./compatibility -> native.browser.ts.
    build.onResolve(
      { filter: /(?:^|\/)(?:native|compatibility)(?:\.ts)?$/ },
      (args: { path: string; resolveDir: string }) => {
        const abs = path.resolve(args.resolveDir, args.path).replace(/\\/g, "/")
        if (
          abs.includes("packages/domain/core/src/native") ||
          abs.includes("packages/domain/core/src/compatibility")
        ) {
          return { path: nativeBrowserPath }
        }
      }
    )
  },
}

export default defineConfig([
  // Server / Node.js bundle — untuk tools, CLI, compiler (bukan SSR Next.js)
  {
    ...sharedConfig,
    entry: entries,
    target: "node20" as const,
    platform: "node" as const,
    format: ["esm", "cjs"] as const,
    external: [...sharedExternal, ...nodeBuiltins],
    // metafile: true wajib untuk preserveDirectives() — tsup tulis
    // metafile-esm.json yang kita pakai buat trace input → output mapping.
    metafile: true,
    async onSuccess() {
      await preserveDirectives("dist")
    },
  },

  // Browser bundle — zero Node built-ins, safe untuk Next.js Client Components.
  // index.browser.ts pakai relative import langsung ke TS source core
  // (bukan "@tailwind-styled/core/browser") sehingga tidak lewat exports map
  // dan dist compiled. Plugin ./native lalu bisa redirect dengan benar.
  ...(hasBrowserEntry
    ? [{
        ...sharedConfig,
        entry: { "index.browser": "src/umbrella/index.browser.ts" },
        target: "es2020" as const,
        platform: "browser" as const,
        format: ["esm" as const],
        external: [...sharedExternal, ...nodeBuiltins],
        esbuildPlugins: [nativeBrowserPlugin],
        // treeshake false untuk browser — pastikan semua exports (cv, cn, dll)
        // tidak di-drop oleh esbuild tree-shaking agresif yang melihat
        // native binding calls sebagai dead code karena return null.
        treeshake: false,
        esbuildOptions(options: import("esbuild").BuildOptions) {
          // ignoreAnnotations: abaikan /*#__PURE__*/ dan sideEffects:false
          // supaya cv dan fungsi lain tidak di-drop di browser bundle
          options.ignoreAnnotations = true
        },
      }]
    : []),
])