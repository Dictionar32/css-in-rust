import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    liveTokens: "src/liveTokens.ts",  // Changed from "live-tokens" to match package.json exports
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "node20",
  platform: "node",
})