import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    animate: "src/animate.ts",
    compiler: "src/compiler.ts",
    css: "src/css.ts",
    devtools: "src/devtools.ts",
    next: "src/next.ts",
    plugins: "src/plugins.ts",
    preset: "src/preset.ts",
    theme: "src/theme.ts",
    vite: "src/vite.ts",
    native: "src/native.ts"
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    "@tailwind-styled/animate",
    "@tailwind-styled/compiler",
    "@tailwind-styled/devtools",
    "@tailwind-styled/next",
    "@tailwind-styled/plugin",
    "@tailwind-styled/preset",
    "@tailwind-styled/runtime-css",
    "@tailwind-styled/theme",
    "@tailwind-styled/vite",
    "@tailwind-styled/shared",
    "@tailwind-styled/scanner",
    "@tailwind-styled/analyzer",
    "@tailwind-styled/engine",
    "@tailwind-styled/syntax",
    "@tailwind-styled/atomic",
    "react",
    "react-dom",
    "tailwindcss",
    "@tailwindcss/postcss",
    "postcss",
    "next",
    "vite",
    "fs",
    "path",
    "module",
    "os",
    "url",
    "crypto",
    "child_process",
    "worker_threads",
    "stream",
    "events",
    "util",
    "node:fs",
    "node:path",
    "node:module",
    "node:os",
    "node:url",
    "node:crypto",
    "node:child_process",
    "node:worker_threads",
    "node:stream",
    "node:events",
    "node:util"
  ],
  treeshake: true,
  minify: false,
  banner: {
    js: "/* @tailwind-styled/core v5.0.4 | MIT | https://github.com/dictionar32/tailwind-styled-v4 */",
  },
  esbuildOptions(options, context) {
    // Inject a CJS-compatible require into ESM output so that native .node
    // addons can be loaded at runtime without bundler interference.
    // This is the standard approach used by vite, better-sqlite3, etc.
    if (context.format === "esm") {
      options.banner = {
        ...options.banner,
        js: [
          options.banner?.js ?? "",
          `import { createRequire as __createRequire } from "node:module";`,
          `const require = __createRequire(import.meta.url);`,
        ]
          .filter(Boolean)
          .join("\n"),
      }
    }
  },
})