/**
 * tw generate-types
 *
 * Scan seluruh codebase menggunakan Rust AST scanner,
 * extract semua sub-component names dari:
 *   - registerSubComponent({ name: "..." })
 *   - .withSub<"icon" | "badge">()
 *
 * Lalu generate .d.ts augmentation otomatis ke src/types/tailwind-styled.d.ts
 * TypeScript langsung pick up — tanpa deklarasi manual.
 */

import fs from "node:fs"
import path from "node:path"
import pc from "picocolors"
import { createCliOutput } from "./utils/output"
import { createCliLogger } from "./utils/logger"

export async function runGenerateTypesCli(rawArgs: string[]): Promise<void> {
  const output = createCliOutput({ json: rawArgs.includes("--json") })
  const logger = createCliLogger({ output })
  const cwd = process.cwd()

  const outFile = rawArgs.find((a) => a.startsWith("--out="))?.slice(6)
    ?? "src/types/tailwind-styled.d.ts"
  const outPath = path.resolve(cwd, outFile)

  output.writeText("")
  output.writeText(pc.bold(pc.cyan("  ◆ tw generate-types")))
  output.writeText(pc.dim("  ─────────────────────────────────────"))
  output.writeText("")

  const spinner = output.spinner()
  spinner.start("Scanning sub-components (Rust)...")

  let result: { names: string[]; dtsContent: string; filesScanned: number } | null = null

  try {
    // Lazy load native binding
    const binding = await loadNativeBinding(cwd)
    if (!binding?.generateSubComponentTypes) {
      throw new Error("Native binding 'generateSubComponentTypes' tidak tersedia — pastikan build:rust sudah dijalankan")
    }

    result = binding.generateSubComponentTypes(cwd, outPath) as {
      names: string[]
      dtsContent: string
      filesScanned: number
    }
    if (!result) throw new Error("generateSubComponentTypes mengembalikan null")
    spinner.stop(`Scanned ${result.filesScanned} files`)
  } catch (err) {
    spinner.error("Scan gagal")
    throw err instanceof Error ? err : new Error(String(err))
  }

  if (!result) {
    logger.warn("Tidak ada hasil scan")
    return
  }

  output.writeText("")
  output.writeText(pc.bold("  [1/2]") + pc.cyan("  sub-components ditemukan"))

  if (result.names.length === 0) {
    logger.skip("Tidak ada sub-component terdeteksi")
    output.writeText(pc.dim("  Gunakan registerSubComponent({ name: '...' }) atau .withSub<'name'>()"))
  } else {
    for (const name of result.names) {
      logger.ok(name)
    }
  }

  output.writeText("")
  output.writeText(pc.bold("  [2/2]") + pc.cyan("  generate .d.ts"))

  // Buat directory jika belum ada
  const outDir = path.dirname(outPath)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  fs.writeFileSync(outPath, result.dtsContent, "utf-8")
  logger.ok(path.relative(cwd, outPath))

  output.writeText("")
  output.writeText(pc.dim("  ─────────────────────────────────────"))
  output.writeText(pc.bold(pc.green("  ✓ types generated")))
  output.writeText("")
  output.writeText(pc.dim("  TypeScript sekarang tahu semua sub-component names."))
  output.writeText(pc.dim("  Jalankan ulang jika ada sub-component baru."))
  output.writeText("")
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadNativeBinding(cwd: string): Promise<Record<string, (...args: unknown[]) => unknown> | null> {
  const candidates = [
    path.join(cwd, "native", "tailwind-styled-native.node"),
    path.join(cwd, "node_modules", "tailwind-styled-v4", "native", "tailwind-styled-native.node"),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        return require(candidate)
      } catch {}
    }
  }
  return null
}