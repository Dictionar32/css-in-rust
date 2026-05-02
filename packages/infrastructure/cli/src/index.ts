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
    importMetaUrl: import.meta.url,
    buildProgram: buildMainProgram,
  })
}

// Only run main() when executed directly, not when imported/required
const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  main()
}