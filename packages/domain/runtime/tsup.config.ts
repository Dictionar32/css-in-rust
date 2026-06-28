import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  clean: true,
  target: "node20",
  platform: "node",
  external: ["@tailwind-styled/theme", "react", "inversify", "reflect-metadata", "zod"],
})