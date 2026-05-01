import { defineConfig } from "tsup"

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  external: [
    "@tailwind-styled/core",
    "@tailwind-styled/shared",
    "vue",
    "inversify",
    "reflect-metadata",
    "zod",
    "node:module",
    "node:path",
    "node:url",
    "node:fs",
  ],
  esbuildOptions(options, context) {
    if (context.format === "esm") {
      options.banner = {
        ...options.banner,
        js: [
          options.banner?.js ?? "",
          `import { createRequire as __createRequire } from "node:module";`,
          `const require = __createRequire(import.meta.url);`,
        ]
          .filter(Boolean)
          .join("\n"),
      }
    }
  },
})