import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  target: "node20",
  platform: "node",
  external: [
    "@tailwind-styled/analyzer",
    "@tailwind-styled/shared",
    "inversify",
    "reflect-metadata",
    "zod",
  ],
})