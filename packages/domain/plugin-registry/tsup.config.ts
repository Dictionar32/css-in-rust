import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  target: "node20",
  platform: "node",
  external: ["typescript", "inversify", "reflect-metadata", "zod"],
})