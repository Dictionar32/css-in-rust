import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    loader: "src/loader.ts"
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "node20",
  platform: "node",
})