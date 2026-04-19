import { defineConfig } from "tsup"

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

export default defineConfig({
  entry: entries,
  target: "node20",
  platform: "node",
  format: ["esm", "cjs"],
  // clean ditangani oleh "rm -rf dist" di build script (lihat package.json)
  // supaya tidak race condition dengan tsup.dts.config.ts yang jalan sesudah ini
  clean: false,
  dts: false,
  tsconfig: "./tsconfig.json",
  outDir: "dist",
  splitting: false,
  noExternal: [
    // Force-bundle semua workspace packages ke dalam dist
    // Tanpa ini, tsup treat @tailwind-styled/* sebagai external karena ada di node_modules via symlink
    /^@tailwind-styled\//,
  ],
  sourcemap: true,
  treeshake: true,
  minify: false,
  external: [
    // Frameworks
    "react", "react-dom", "react/jsx-runtime",
    "next", "vite", "webpack", "@rspack/core",
    "vue", "svelte",
    // Dependencies
    "zod",
    "tailwind-merge",
    "tailwindcss",
    "postcss",
    "inversify",
    "reflect-metadata",
    "@clack/prompts",
    "ts-pattern",
    "@storybook/types",
    "@storybook/core-events",
    // Node.js built-ins — tidak boleh masuk browser bundle
    "fs", "path", "os", "url", "crypto", "module",
    "child_process", "worker_threads", "stream", "events", "util",
    "node:fs", "node:path", "node:os", "node:url", "node:crypto",
    "node:module", "node:child_process", "node:worker_threads",
    "node:stream", "node:events", "node:util",
  ],
  banner: {
    js: "/* tailwind-styled-v4 v5.0.4 | MIT | https://github.com/dictionar32/tailwind-styled-v4 */",
  },
})