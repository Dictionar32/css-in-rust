/**
 * tailwind-styled-vscode — Workspace Settings Provider
 *
 * Inject konfigurasi `tailwindCSS.experimental.classRegex` ke workspace settings
 * agar `tailwindcss-intellisense` mengenali sintaks tw.el`...` dengan subcomponent
 * blocks `[name] { ... }` sebagai scope kelas yang TERPISAH.
 *
 * Ini adalah fix yang benar-benar menyelesaikan false-positive cssConflict:
 * dengan classRegex yang tepat, tailwindcss-intellisense mengekstrak setiap block
 * sebagai "class string" yang independen → tidak ada cross-block conflict detection.
 *
 * Referensi:
 *   https://github.com/tailwindlabs/tailwindcss-intellisense#tailwindcssexperimentalclassregex
 *
 * Format `classRegex`:
 *   [ containerPattern, classPattern ]
 *   containerPattern — regex string untuk menemukan "container" kelas
 *   classPattern     — regex string untuk mengekstrak kelas individual dari container
 *
 * Strategy:
 *   1. Satu entry untuk BASE classes (luar sub-block)
 *   2. Satu entry untuk tiap SUB-BLOCK `[name] { classes }` — block body diekstrak
 *      sebagai container terpisah sehingga intellisense tahu ini scope berbeda.
 */

import * as vscode from "vscode"
import * as path from "node:path"
import * as fs from "node:fs"

// ─── classRegex entries ───────────────────────────────────────────────────────

/**
 * Pattern untuk mengekstrak kelas individual dari sebuah string class list.
 * Match non-whitespace tokens yang merupakan Tailwind class (bukan `{`, `}`, `[...]`).
 */
const CLASS_PATTERN = "(?:^|\\s)([\\w:!/-]+(?:\\[(?:[^\\[\\]]*|\\[[^\\[\\]]*\\])*\\])?[\\w:!/-]*)"

/**
 * Entry untuk BASE classes di dalam template literal tw.el`BASE [block] { ... }`.
 * Menggunakan negative lookahead untuk stop sebelum first `[name] {` block.
 */
const BASE_CONTAINER_PATTERN =
  "tw(?:\\.[a-zA-Z][a-zA-Z0-9]*)?\\s*`((?:(?!\\[[a-z][a-zA-Z0-9_-]*\\]\\s*\\{)[\\s\\S])*)"

/**
 * Entry untuk subcomponent block `[name] { classes }`.
 * Mengekstrak hanya isi di dalam `{ ... }` sebagai scope terpisah.
 */
const SUB_BLOCK_CONTAINER_PATTERN =
  "\\[[a-z][a-zA-Z0-9_-]*\\]\\s*\\{([^}]*)\\}"

/**
 * classRegex array yang akan di-inject ke tailwindCSS.experimental.classRegex.
 */
export const TW_STYLED_CLASS_REGEX: [string, string][] = [
  // Base scope: kelas sebelum block pertama
  [BASE_CONTAINER_PATTERN, CLASS_PATTERN],
  // Sub-block scope: kelas di dalam [name] { ... } — scope terpisah per block
  [SUB_BLOCK_CONTAINER_PATTERN, CLASS_PATTERN],
]

// ─── Settings injection ───────────────────────────────────────────────────────

const VSCODE_SETTINGS_DIR = ".vscode"
const SETTINGS_FILE = "settings.json"
const CLASS_REGEX_KEY = "tailwindCSS.experimental.classRegex"

/**
 * Baca .vscode/settings.json, return {} jika tidak ada atau parse error.
 */
function readSettings(settingsPath: string): Record<string, unknown> {
  try {
    if (!fs.existsSync(settingsPath)) return {}
    const raw = fs.readFileSync(settingsPath, "utf-8")
    // Strip JSON comments (// ...) untuk robustness
    const stripped = raw.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")
    return JSON.parse(stripped)
  } catch {
    return {}
  }
}

/**
 * Tulis settings ke .vscode/settings.json, pretty-printed.
 */
function writeSettings(settingsPath: string, settings: Record<string, unknown>): void {
  const dir = path.dirname(settingsPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8")
}

/**
 * Cek apakah classRegex yang sudah ada di settings sudah mencakup entries kita.
 * Menggunakan JSON string comparison untuk simplisitas.
 */
function alreadyInjected(existing: unknown[]): boolean {
  const existingStr = JSON.stringify(existing)
  return TW_STYLED_CLASS_REGEX.every(([cp]) => existingStr.includes(cp.slice(0, 20)))
}

/**
 * Inject `tailwindCSS.experimental.classRegex` ke .vscode/settings.json.
 * Non-destructive: merge dengan entries yang sudah ada.
 * Returns true jika settings berhasil di-update.
 */
function injectClassRegex(workspacePath: string): boolean {
  const settingsPath = path.join(workspacePath, VSCODE_SETTINGS_DIR, SETTINGS_FILE)
  const settings = readSettings(settingsPath)

  const existing = Array.isArray(settings[CLASS_REGEX_KEY])
    ? (settings[CLASS_REGEX_KEY] as unknown[])
    : []

  if (alreadyInjected(existing)) return false

  settings[CLASS_REGEX_KEY] = [...existing, ...TW_STYLED_CLASS_REGEX]

  try {
    writeSettings(settingsPath, settings)
    return true
  } catch {
    return false
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Daftarkan workspace settings provider.
 *
 * - Saat extension aktif: cek dan inject classRegex jika belum ada
 * - Tampilkan info notification agar user tahu apa yang berubah
 * - Sediakan command `tailwind-styled.injectClassRegex` untuk manual trigger
 */
export function registerWorkspaceSettingsProvider(
  context: vscode.ExtensionContext
): vscode.Disposable {
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  if (!workspacePath) return { dispose() {} }

  // Auto-inject saat extension aktif (silent)
  const injected = injectClassRegex(workspacePath)
  if (injected) {
    vscode.window
      .showInformationMessage(
        "[tailwind-styled] classRegex di-inject ke .vscode/settings.json agar " +
          "tailwindcss-intellisense mengenali subcomponent blocks [icon] { ... } " +
          "sebagai scope terpisah (fix cssConflict false positive).",
        "OK",
        "Lihat settings"
      )
      .then((action) => {
        if (action === "Lihat settings") {
          const settingsUri = vscode.Uri.file(
            path.join(workspacePath, VSCODE_SETTINGS_DIR, SETTINGS_FILE)
          )
          vscode.window.showTextDocument(settingsUri)
        }
      })
  }

  // Command untuk manual trigger / re-inject
  const command = vscode.commands.registerCommand(
    "tailwind-styled.injectClassRegex",
    () => {
      if (!workspacePath) {
        vscode.window.showWarningMessage("Tidak ada workspace yang terbuka.")
        return
      }
      const ok = injectClassRegex(workspacePath)
      if (ok) {
        vscode.window.showInformationMessage(
          "[tailwind-styled] classRegex berhasil di-inject ke .vscode/settings.json."
        )
      } else {
        vscode.window.showInformationMessage(
          "[tailwind-styled] classRegex sudah ada di .vscode/settings.json."
        )
      }
    }
  )

  context.subscriptions.push(command)

  return {
    dispose() {
      command.dispose()
    },
  }
}