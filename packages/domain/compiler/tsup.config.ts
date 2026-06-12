import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    internal: "src/internal.ts",
    "compiler/index": "src/compiler/index.ts",
    "parser/index": "src/parser/index.ts",
    "analyzer/index": "src/analyzer/index.ts",
    "cache/index": "src/cache/index.ts",
    "redis/index": "src/redis/index.ts",
    "watch/index": "src/watch/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "node20",
  platform: "node",
  tsconfig: "tsconfig.dts.json",
  external: [
    "typescript",
    "tailwindcss",
    "@tailwindcss/postcss",
    "postcss",
    "oxc-parser"
  ],
  esbuildOptions(options, context) {
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