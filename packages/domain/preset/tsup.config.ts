import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/defaultPreset.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  target: "node20",
  platform: "node",
  external: ["inversify", "reflect-metadata", "zod"],
})