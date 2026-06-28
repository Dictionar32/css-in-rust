import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/liveTokens.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  target: "node20",
  platform: "node",
  external: [
    "@tailwind-styled/shared",
    "react",
    "inversify",
    "reflect-metadata",
    "zod",
  ],
})