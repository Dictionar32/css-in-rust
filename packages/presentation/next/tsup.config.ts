import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index:           "src/index.ts",
    turbopackLoader: "src/turbopackLoader.ts",
    webpackLoader:   "src/webpackLoader.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  platform: "node",
  external: [
    // All node built-ins must be external
    "fs",
    "path", 
    "crypto",
    "module", 
    "url",
    "os",
    "node:fs",
    "node:path", 
    "node:crypto",
    "node:module",
    "node:url",
    "node:os",
    // Framework
    "next",
    // Tailwind packages - use CJS require path
    "@tailwind-styled/compiler",
    "@tailwind-styled/plugin", 
    "@tailwind-styled/shared",
    "@tailwind-styled/engine",
    // Loaders
    "./turbopackLoader",
    "./webpackLoader",
    // Other deps
    "tailwindcss",
    "@tailwindcss/oxide",
    "@tailwindcss/postcss",
    "postcss",
    "tailwind-merge",
    "zod",
    "inversify",
    "reflect-metadata",
  ],
  noExternal: [],
  tsconfig: "tsconfig.json",
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".mjs" : ".cjs"
    }
  }
})
