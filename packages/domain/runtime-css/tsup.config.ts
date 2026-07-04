import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    client: "src/batchedInjector.ts",
    server: "src/CssInjector.tsx",
    batched: "src/batchedInjector.ts"
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "node20",
  platform: "node",
})