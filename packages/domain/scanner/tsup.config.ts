import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/worker.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  target: "node20",
  platform: "node",
  external: [
    "typescript",
    "@tailwind-styled/shared",
    "@tailwind-styled/syntax",
    "inversify",
    "reflect-metadata",
    "zod",
  ],
})