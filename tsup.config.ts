import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
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
    vue: "src/umbrella/vue.ts"
  },
  target: "node20",
  platform: "node",
  format: ["esm", "cjs"],
  dts: true,
  outDir: "dist",
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
  minify: false,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "next",
    "vite",
    "webpack",
    "@rspack/core"
  ],
  banner: {
    js: "/* tailwind-styled-v4 v5.0.4 | MIT | https://github.com/dictionar32/tailwind-styled-v4 */"
  }
})
