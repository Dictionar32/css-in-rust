import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    next: "src/next.ts",
    vite: "src/vite.ts",
    compiler: "src/compiler.ts",
    preset: "src/preset.ts",
    css: "src/css.ts",
    plugins: "src/plugins.ts",
    devtools: "src/devtools.ts",
    animate: "src/animate.ts",
    theme: "src/theme.ts",
    browser: "src/index.browser.ts"
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "node20",
  platform: "node",
})