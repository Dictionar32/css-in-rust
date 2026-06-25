#!/usr/bin/env node

import { fileURLToPath } from "node:url"
import { buildMainProgram } from "./commands/program"
import { runCliMain } from "./utils/runtime"

export { runScanCli } from "./scan"
export { parseCliInput as parseCliArgs } from "./utils/args"
export { ensureFlag } from "./utils/args"
export { createCliOutput } from "./utils/output"

async function main() {
  await runCliMain({
    importMetaUrl: typeof import.meta !== "undefined" && import.meta.url
      ? import.meta.url
      : `file://${process.argv[1] ?? "unknown"}`,
    buildProgram: buildMainProgram,
  })
}

// Only run main() when executed directly, not when imported/required
const __filename = typeof import.meta !== "undefined" && import.meta.url
  ? fileURLToPath(import.meta.url)
  : (typeof __filename !== "undefined" ? __filename : process.argv[1] ?? "unknown")
if (process.argv[1] === __filename) {
  main()
}