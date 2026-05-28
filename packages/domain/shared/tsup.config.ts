import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: {
    resolve: false,
  },
  tsconfig: "tsconfig.dts.json",
  outDir: "dist",
  external: [
    "node:fs",
    "node:path",
    "node:crypto",
    "node:module",
    "node:url",
    "node:os",
  ],
})