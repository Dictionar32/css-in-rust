import { defineConfig } from "tsup"
import type { BuildOptions } from "esbuild"

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
  // native.ts → native.browser.ts via esbuild alias
  // Zero node built-ins — safe untuk Next.js client components
  // Guard: hanya jalankan dari root project, bukan dari sub-package
  ...(projectRoot.replace(/\\/g, "/").endsWith("css-in-rust-tailwnd-js-css/")
    ? [{
        ...sharedConfig,
        entry: {
          "index.browser": "src/umbrella/index.browser.ts",
        },
        target: "es2020" as const,
        platform: "browser" as const,
        format: ["esm" as const],
        external: sharedExternal,
        esbuildOptions(options: BuildOptions) {
          options.alias = {
            ...options.alias,
            [root("packages/domain/core/src/native.ts")]:
              root("packages/domain/core/src/native.browser.ts"),
            [root("packages/domain/core/src/compatibility.ts")]:
              root("packages/domain/core/src/native.browser.ts"),
          }
        },
      }]
    : []),
])