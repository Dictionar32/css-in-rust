/**
 * Vitest Configuration
 */

import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", "dist", "build"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["compiler/src/**/*.ts", "shared/src/telemetry/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.d.ts"],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    globals: {
      vi: "vitest/globals",
    },
  },
  resolve: {
    alias: {
      "@tailwind-styled/compiler": "/packages/domain/compiler/src",
      "@tailwind-styled/shared": "/packages/domain/shared/src",
      "@tailwind-styled/testing": "/packages/domain/testing/src",
    },
  },
})