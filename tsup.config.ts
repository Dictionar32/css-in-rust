import { defineConfig } from "tsup"
import type { BuildOptions } from "esbuild"
import { existsSync } from "fs"
import path from "node:path"

// import.meta.url selalu tersedia di ESM — tidak butuh @types/node
const projectRoot = new URL(".", import.meta.url).pathname
  .replace(/^\/([A-Z]:)/, "$1") // fix Windows path: /C:/... → C:/...
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

const sharedConfig = {
  clean: false,
  dts: false,
  tsconfig: "./tsconfig.json",
  outDir: "dist",
  splitting: false,
  noExternal: [/^@tailwind-styled\//] as RegExp[],
  sourcemap: true,
  treeshake: true,
  minify: false,
  banner: {
    js: "/* tailwind-styled-v4 v5.0.4 | MIT | https://github.com/dictionar32/tailwind-styled-v4 */",
  },
}

// Fix #1: guard pakai existsSync, tidak tergantung nama folder.
const hasBrowserEntry = existsSync("src/umbrella/index.browser.ts")

// Path absolut ke native.browser.ts — target redirect untuk semua import native.
const nativeBrowserPath = root("packages/domain/core/src/native.browser.ts")
  .replace(/\\/g, "/")

// Fix #2: esbuild options.alias tidak bisa pakai absolute path sebagai key.
// Solusi: esbuild plugin onResolve.
//
// Fix #3: filter sebelumnya /(native|compatibility)\.ts$/ tidak match import
// tanpa ekstensi seperti `import { getNativeBinding } from "./native"`.
// Semua file di @tailwind-styled/core (cv.ts, createComponent.ts, merge.ts,
// cx.ts, containerQuery.ts, stateEngine.ts, twProxy.ts) mengimport "./native"
// tanpa ekstensi — harus di-redirect ke native.browser.ts agar tidak bundle
// fs/module/crypto ke browser output.
const nativeBrowserPlugin = {
  name: "native-to-browser-alias",
  setup(build: { onResolve: Function }) {
    // Filter match "./native" dan "./compatibility" dengan atau TANPA ekstensi .ts
    build.onResolve(
      { filter: /\/(native|compatibility)(\.ts)?$/ },
      (args: { path: string; resolveDir: string }) => {
        // Resolve ke path absolut dulu, baru compare — hindari false positive
        const abs = path.resolve(args.resolveDir, args.path).replace(/\\/g, "/")
        if (
          // Tanpa ekstensi (import "./native") — kasus paling umum di source
          abs.endsWith("packages/domain/core/src/native") ||
          abs.endsWith("packages/domain/core/src/compatibility") ||
          // Dengan ekstensi (import "./native.ts") — jaga-jaga
          abs.endsWith("packages/domain/core/src/native.ts") ||
          abs.endsWith("packages/domain/core/src/compatibility.ts")
        ) {
          return { path: nativeBrowserPath }
        }
      }
    )
  },
}

export default defineConfig([
  // ── Server / Node.js bundle ────────────────────────────────────────────────
  {
    ...sharedConfig,
    entry: entries,
    target: "node20" as const,
    platform: "node" as const,
    format: ["esm", "cjs"] as const,
    external: [...sharedExternal, ...nodeBuiltins],
  },

  // ── Browser bundle ─────────────────────────────────────────────────────────
  // Zero node built-ins — safe untuk Next.js Client Components.
  // native.ts / compatibility.ts → native.browser.ts via onResolve plugin.
  ...(hasBrowserEntry
    ? [{
        ...sharedConfig,
        entry: {
          "index.browser": "src/umbrella/index.browser.ts",
        },
        target: "es2020" as const,
        platform: "browser" as const,
        format: ["esm" as const],
        // Node built-ins tetap di-external agar esbuild tidak coba bundle-nya
        // kalau ada import yang luput dari redirect plugin
        external: [...sharedExternal, ...nodeBuiltins],
        esbuildOptions(options: BuildOptions) {
          options.plugins = [
            ...(options.plugins ?? []),
            nativeBrowserPlugin,
          ]
        },
      }]
    : []),
])