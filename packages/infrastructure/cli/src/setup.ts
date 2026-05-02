/**
 * tw setup - inject required config into an existing project.
 *
 * Usage:
 *   npx tw setup
 *   npx tw setup --dry-run
 *   npx tw setup --skip-install
 *   npx tw setup --yes --next|--vite|--rspack|--react
 */

import path from "node:path"
import pc from "picocolors"
import {
  patchNextConfigImpl,
  patchRspackConfigImpl,
  patchTailwindCssImpl,
  patchTsConfigImpl,
  patchViteConfigImpl,
} from "./commands/setup/patchers"
import { pickProjectTypeInteractive } from "./commands/setup/prompt"
import {
  alreadyInstalled,
  configureSetupFlags,
  detectBundler,
  detectPm,
  findExisting,
  installPackages,
  type ProjectType,
  patchFileWithDryRun,
  type SetupFlags,
  type SetupProjectOption,
  writeFileWithDryRun,
} from "./commands/setup/workspace"
import { type CliLogEvent, createCliLogger } from "./utils/logger"
import { createCliOutput } from "./utils/output"

const cwd = process.cwd()

// Keep these literals in this file for test compatibility:
// "--dry-run", "--skip-install", "--yes", "--next", "--vite", "--rspack", "--react"
const PROJECT_OPTIONS: SetupProjectOption[] = [
  { label: "Next.js", value: "next", adapter: "tailwind-styled-v4" },
  { label: "Vite", value: "vite", adapter: "tailwind-styled-v4" },
  { label: "Rspack", value: "rspack", adapter: "tailwind-styled-v4" },
  { label: "React (other)", value: "react", adapter: "tailwind-styled-v4" },
]

interface SetupReport {
  generatedAt: string
  cwd: string
  detected: ProjectType | null
  selected: ProjectType
  packageManager: string
  dryRun: boolean
  skipInstall: boolean
  events: CliLogEvent[]
  warnings: number
}

const configureFlags = (rawArgs: string[]): SetupFlags => {
  return configureSetupFlags(rawArgs)
}

const pickProjectType = async (
  detected: ProjectType | null,
  flags: SetupFlags,
  options: SetupProjectOption[]
): Promise<ProjectType> => {
  const log = flags.isJson ? console.error : console.log
  return pickProjectTypeInteractive(detected, flags, options, {
    log,
    output: flags.isJson ? process.stderr : process.stdout,
  })
}

// Keep function names in this file for source-verification tests.
// Keep "withTailwindStyled()(" reference in this file.
const patchNextConfig = (src: string): string | null => patchNextConfigImpl(src)

// Keep "tailwind-styled-v4/vite" and "tailwindStyledPlugin" references in this file.
const patchViteConfig = (src: string): string | null => patchViteConfigImpl(src)

// Keep "tailwind-styled-v4/rspack" and "tailwindStyledRspackPlugin" references in this file.
const patchRspackConfig = (src: string): string | null => patchRspackConfigImpl(src)

const patchTailwindCss = (src: string, bundler?: "next" | "vite" | "rspack", cssFilePath?: string, cwd?: string): string | null => patchTailwindCssImpl(src, bundler, cssFilePath, cwd)

const patchTsConfig = (src: string): string | null => patchTsConfigImpl(src)

export const runSetupCli = async (rawArgs: string[]): Promise<void> => {
  const setupFlags = configureFlags(rawArgs)
  const output = createCliOutput({
    json: setupFlags.isJson,
    debug: process.env.TWS_DEBUG === "1" || process.env.DEBUG === "1",
    verbose: process.env.TWS_VERBOSE === "1" || process.env.VERBOSE === "1",
  })
  const events: CliLogEvent[] = []
  const logger = createCliLogger({
    useStderr: setupFlags.isJson,
    output,
    onEvent(event) {
      events.push(event)
    },
  })

  output.writeText("")
  output.writeText(pc.bold(pc.cyan("  ◆ tailwind-styled-v4")) + pc.dim("  setup wizard"))
  output.writeText(pc.dim("  ─────────────────────────────────────"))
  output.writeText("")

  const bootSpinner = output.spinner()
  bootSpinner.start("Inspecting workspace")
  const [detected, pm] = await Promise.all([detectBundler(cwd), detectPm(cwd)])
  bootSpinner.stop("Workspace inspected")

  if (detected) {
    const label = PROJECT_OPTIONS.find((option) => option.value === detected)?.label ?? detected
    output.writeText("  " + pc.dim("framework  ") + pc.cyan(label))
  } else {
    output.writeText("  " + pc.dim("framework  ") + pc.yellow("tidak terdeteksi"))
  }

  const bundler = await pickProjectType(detected, setupFlags, PROJECT_OPTIONS)

  output.writeText("  " + pc.dim("package mg ") + pc.white(pm))
  if (setupFlags.isDryRun) output.writeText("  " + pc.dim("mode       ") + pc.yellow("dry-run"))
  output.writeText("")
  output.writeText(pc.dim("  ─────────────────────────────────────"))
  output.writeText("")

   output.writeText(pc.bold("  [1/4]") + pc.cyan("  packages"))
   const hasCorePkg = await alreadyInstalled(cwd, "tailwind-styled-v4")

   const toInstall = hasCorePkg ? [] : ["tailwind-styled-v4"]

   if (toInstall.length > 0) await installPackages(cwd, pm, toInstall, false, setupFlags, logger)
   else logger.skip("tailwind-styled-v4 sudah terpasang")

  output.writeText("\n" + pc.bold("  [2/4]") + pc.cyan("  bundler config"))

  const bundlerConfigMap: Record<
    string,
    { files: string[]; patcher: (src: string) => string | null; warnMsg: string }
  > = {
    next: {
      files: ["next.config.ts", "next.config.mjs", "next.config.js"],
      patcher: patchNextConfig,
      warnMsg: "next.config.ts tidak ditemukan - jalankan npx create-next-app terlebih dahulu",
    },
    vite: {
      files: ["vite.config.ts", "vite.config.mjs", "vite.config.js"],
      patcher: patchViteConfig,
      warnMsg: "vite.config.ts tidak ditemukan - jalankan npm create vite terlebih dahulu",
    },
    rspack: {
      files: ["rspack.config.ts", "rspack.config.mjs", "rspack.config.js"],
      patcher: patchRspackConfig,
      warnMsg: "rspack.config.ts tidak ditemukan - tambahkan manual",
    },
  }

  const bundlerConfig = bundlerConfigMap[bundler]

  if (bundlerConfig) {
    const cfg = await findExisting(cwd, bundlerConfig.files)
    if (cfg)
      await patchFileWithDryRun(cfg, bundlerConfig.patcher, path.basename(cfg), setupFlags, logger)
    else logger.warn(bundlerConfig.warnMsg)
  } else {
    logger.skip("React tanpa bundler - tidak ada bundler config yang di-patch")
    logger.info("Tambahkan tailwind-styled-v4 langsung ke komponen React kamu")
  }

  output.writeText("\n" + pc.bold("  [3/4]") + pc.cyan("  globals.css"))
  const cssCandidates = [
    "src/app/globals.css",
    "src/globals.css",
    "src/styles/globals.css",
    "src/tailwind.css",
    "src/index.css",
    "styles/globals.css",
  ]
  const cssFile = await findExisting(cwd, cssCandidates)

  if (cssFile) {
    await patchFileWithDryRun(
      cssFile,
      (src) => patchTailwindCss(src, bundler as "next" | "vite" | "rspack" | undefined, path.relative(cwd, cssFile), cwd),
      path.relative(cwd, cssFile),
      setupFlags,
      logger
    )
  } else {
    logger.warn("CSS entry tidak ditemukan — tambahkan @import \"tailwindcss\" manual ke globals.css")
  }

  output.writeText("\n" + pc.bold("  [4/4]") + pc.cyan("  tsconfig.json"))
  const tsCfg = path.join(cwd, "tsconfig.json")
  const hasTsConfig = await findExisting(cwd, ["tsconfig.json"])

  if (hasTsConfig) {
    await patchFileWithDryRun(tsCfg, patchTsConfig, "tsconfig.json", setupFlags, logger)
  } else {
    logger.skip("tsconfig.json tidak ditemukan — skip")
  }

  output.writeText("")
  output.writeText(pc.dim("  ─────────────────────────────────────"))
  output.writeText(pc.bold(pc.green("  ✓ setup selesai")))
  output.writeText("")
  output.writeText(pc.dim("  selanjutnya"))
  output.writeText("    " + pc.cyan("npx tw preflight") + pc.dim("   — verifikasi config"))
  output.writeText("    " + pc.cyan("npm run dev") + pc.dim("        — mulai development"))
  output.writeText("")

  if (setupFlags.isJson) {
    const report: SetupReport = {
      generatedAt: new Date().toISOString(),
      cwd,
      detected,
      selected: bundler,
      packageManager: pm,
      dryRun: setupFlags.isDryRun,
      skipInstall: setupFlags.skipInstall,
      events,
      warnings: events.filter((event) => event.level === "warn").length,
    }
    output.jsonSuccess("setup", report)
  }
}
