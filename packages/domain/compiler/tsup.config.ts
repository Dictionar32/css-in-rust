import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    compiler: "src/compiler/index.ts",
    parser: "src/parser/index.ts",
    analyzer: "src/analyzer/index.ts",
    cache: "src/cache/index.ts",
    redis: "src/redis/index.ts",
    watch: "src/watch/index.ts",
    internal: "src/internal.ts"
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "node20",
  platform: "node",
  external: [
    "@tailwind-styled/shared",  // Prevent circular dependency during build
  ],
})