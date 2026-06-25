import { defineConfig } from "tsup"
import { existsSync } from "fs"
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
  banner: {
    js: "/* tailwind-styled-v4 v5.0.4 | MIT | https://github.com/dictionar32/tailwind-styled-v4 */",
  },
  esbuildOptions(options: import("esbuild").BuildOptions, context: { format: string }) {
    if (context.format === "cjs") {
      // Polyfill import.meta for CJS bundles.
      // This eliminates "import.meta not available in cjs" warnings from esbuild
      // while keeping correct behaviour: import.meta.url resolves to __filename URL.
      options.define = {
        ...options.define,
        "import.meta.url": "__importMetaUrl",
      }
      const existingBanner = typeof options.banner?.js === "string" ? options.banner.js : ""
      options.banner = {
        ...options.banner,
        js: `const __importMetaUrl = typeof __filename !== "undefined" ? require("node:url").pathToFileURL(__filename).href : "file://unknown";\n${existingBanner}`,
      }
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