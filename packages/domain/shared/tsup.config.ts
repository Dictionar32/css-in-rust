import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: {
    resolve: false,
  },
  tsconfig: "tsconfig.dts.json",
  outDir: "dist",
  external: [
    "node:fs",
    "node:path",
    "node:crypto",
    "node:module",
    "node:url",
    "node:os",
    "@tailwind-styled/compiler",
    "@tailwind-styled/compiler/internal",
  ],
  esbuildOptions(options, context) {
    if (context.format === "cjs") {
      options.define = {
        ...options.define,
        // Polyfill import.meta.url so CJS consumers get correct __filename-based URL
        "import.meta.url": "__importMetaUrl",
        // Define import.meta as an object so typeof/property checks don't warn
        "import.meta": '{"url":__importMetaUrl}',
      }
      options.banner = {
        js: `const __importMetaUrl = typeof __filename !== "undefined" ? require("node:url").pathToFileURL(__filename).href : "file://unknown";`,
      }
    }
  },
})