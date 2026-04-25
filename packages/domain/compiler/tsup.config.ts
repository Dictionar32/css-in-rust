import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    internal: "src/internal.ts",
  },
<<<<<<< HEAD
  format: ["esm"],
=======
  format: ["esm", "cjs"],
>>>>>>> 0850e1de940113705fa7bf604b6d9a90b1bd3595
  dts: true,
  clean: true,
  target: "node20",
  platform: "node",
  external: [
    "typescript",
    "tailwindcss",
    "@tailwindcss/postcss",
    "postcss",
    "tailwind-merge",
    "oxc-parser"
  ]
})
