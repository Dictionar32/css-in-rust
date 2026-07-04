import { defineConfig } from "tsup"

export default defineConfig({
  // Multi-entry support: each entry gets its own .d.ts file
  entry: {
    index: "src/index.tsx",  // Changed from .ts to .tsx
    // Add more entries below as needed for your package
  },
  format: ["esm", "cjs"],  // ✨ Dual format: ESM + CJS (import.meta warnings are normal)
  dts: true,  // ✨ Modern: native tsup dts generation (works with multi-entry!)
  clean: true,
  target: "node20",
  platform: "node",
  // Configure external dependencies in your package.json
})
