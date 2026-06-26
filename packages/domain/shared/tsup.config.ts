import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  // Fix: gunakan shims:true (tsup built-in) untuk polyfill import.meta.url di CJS
  // dan __dirname/__filename di ESM. Lebih robust dari manual banner dan handle
  // browser context juga. Ref: https://tsup.egoist.dev/#inject-cjs-and-esm-shims
  shims: true,
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
    "@tailwind-styled/compiler",
    "@tailwind-styled/compiler/internal",
  ],
})