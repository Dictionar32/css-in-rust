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
  sourcemap: false,
  treeshake: true,
  minify: false,
  external: [
  // Sudah ada
  "react", "react-dom", "react/jsx-runtime",
  "next", "vite", "webpack", "@rspack/core",

  // Tambahkan ini
  "vue",
  "svelte",
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
  ],
  banner: {
    js: "/* tailwind-styled-v4 v5.0.4 | MIT | https://github.com/dictionar32/tailwind-styled-v4 */",
  },
})