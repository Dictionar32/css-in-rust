import { defineConfig } from "tsup"

/**
 * DTS-only build pass — dijalankan SETELAH tsup.config.ts selesai.
 * Dipisah agar tidak OOM ketika ESM + CJS + DTS jalan paralel (27 entries).
 *
 * Build sequence (lihat package.json):
 *   1. rm -rf dist
 *   2. tsup --config tsup.config.ts          → ESM + CJS
 *   3. tsup --config tsup.dts.config.ts      → .d.ts + .d.mts
 */
const entries = {
  index: "src/umbrella/index.ts",
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

// Hanya inline workspace packages ke dalam .d.ts
// Semua lainnya (node:*, zod, react, dll) tetap external secara otomatis
const workspacePackages = [
  "@tailwind-styled/analyzer",
  "@tailwind-styled/animate",
  "@tailwind-styled/atomic",
  "@tailwind-styled/compiler",
  "@tailwind-styled/core",
  "@tailwind-styled/dashboard",
  "@tailwind-styled/devtools",
  "@tailwind-styled/engine",
  "@tailwind-styled/next",
  "@tailwind-styled/plugin",
  "@tailwind-styled/plugin-api",
  "@tailwind-styled/plugin-registry",
  "@tailwind-styled/preset",
  "@tailwind-styled/rspack",
  "@tailwind-styled/runtime",
  "@tailwind-styled/runtime-css",
  "@tailwind-styled/scanner",
  "@tailwind-styled/shared",
  "@tailwind-styled/storybook-addon",
  "@tailwind-styled/svelte",
  "@tailwind-styled/syntax",
  "@tailwind-styled/testing",
  "@tailwind-styled/theme",
  "@tailwind-styled/vite",
  "@tailwind-styled/vue",
  "create-tailwind-styled",
  "create-tailwind-styled/bin",
]

export default defineConfig({
  entry: entries,
  format: ["esm", "cjs"],
  dts: {
    // resolve sebagai array = hanya inline workspace packages
    // node:*, zod, react, dll otomatis external — tidak perlu listing manual
    resolve: workspacePackages,
    only: true,
    tsconfig: "./tsconfig.dts.json",
  },
  clean: false,
  outDir: "dist",
})
