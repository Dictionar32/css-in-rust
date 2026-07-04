import { defineConfig } from "tsup"

export default defineConfig({
  // Multi-entry support: each entry gets its own .d.ts file
  entry: {
    index: "src/index.ts",
    // Add more entries below as needed for your package
  },
  format: ["esm", "cjs"],
  dts: true,  // ✨ Modern: native tsup dts generation (works with multi-entry!)
  clean: true,
  target: "node20",
  platform: "node",
  // External dependencies to prevent bundling and circular dependencies
  external: [
    "@tailwind-styled/compiler",  // Prevents circular dependency
  ],
})
