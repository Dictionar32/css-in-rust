#!/usr/bin/env node

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

main()