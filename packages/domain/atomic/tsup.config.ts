import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "node20",
  platform: "node",
  external: [
    "@tailwind-styled/compiler",
    "@tailwind-styled/shared",
    "inversify",
    "reflect-metadata",
    "zod"
  ],
})
