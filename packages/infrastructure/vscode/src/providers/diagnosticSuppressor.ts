/**
 * tailwind-styled-vscode — Diagnostic Suppressor
 *
 * Masalah:
 *   `tailwindcss-intellisense` (bradlc.vscode-tailwindcss) tidak memahami
 *   sintaks subcomponent block `[icon] { ... }` dari tailwind-styled-v4.
 *   Ia memperlakukan SEMUA kelas di dalam template literal sebagai satu scope,
 *   sehingga conflict detection cross-block memunculkan false positive seperti:
 *     - 'flex' conflicts with 'flex'   (button vs icon)
 *     - 'h-12' conflicts with 'h-4'    (button vs icon)
 *     - 'w-full' conflicts with 'w-4'  (button vs icon)
 *
 * Solusi:
 *   Pasang listener `onDidChangeDiagnostics` yang:
 *   1. Filter hanya diagnostic `cssConflict` dari owner `tailwindcss-intellisense`
 *   2. Untuk setiap pasangan conflict, cek apakah kedua kelas berada di
 *      subcomponent block yang berbeda (atau satu di base, satu di block)
 *   3. Jika cross-block → suppress dengan menghapus dari DiagnosticCollection kita
 *      (kita tidak bisa edit collection milik extension lain, jadi kita tambahkan
 *      "whitelist" via custom diagnostic collection yang override severity ke None,
 *      dan kita hide via `problems.decorations.enabled` workspace setting toggling —
 *      pendekatan yang benar adalah `vscode.languages.getDiagnostics` filter +
 *      re-emit ke custom collection)
 *
 * Pendekatan implementasi:
 *   VSCode tidak mengizinkan extension lain menghapus diagnostic dari extension lain.
 *   Workaround terbaik: kita emit diagnostic "info" level dengan tag `unnecessary`
 *   yang secara visual mengoverride warning — ATAU kita gunakan `workspace.onDidSave`
 *   untuk menyuntikkan komentar `// tailwind-styled-ignore` secara otomatis.
 *
 *   Pendekatan paling clean yang tersedia di VSCode API:
 *   → Gunakan `DiagnosticCollection` sendiri untuk markup false positive sebagai
 *     "hint" (severity 3) dengan message yang menjelaskan mengapa ini bukan conflict.
 *     User bisa filter berdasarkan severity di Problems panel.
 *
 *   → PLUS: konfigurasi `tailwindCSS.experimental.classRegex` via workspace settings
 *     agar `tailwindcss-intellisense` mengenali setiap subcomponent block sebagai
 *     scope terpisah — ini adalah fix yang benar-benar menyelesaikan masalah.
 */

import * as vscode from "vscode"

// ─── Regex untuk parse struktur template tw ──────────────────────────────────

/**
 * Match tagged template literal: tw`...` / tw.button`...` / tw.div`...`
 */
const TW_TEMPLATE_RE =
  /tw(?:\.[a-zA-Z][a-zA-Z0-9]*)?\s*`([\s\S]*?)`/g

/**
 * Match subcomponent block dengan bracket syntax: `[name] { classes... }`
 * Capture group 1 = block name, group 2 = full block content dengan braces,
 * group 3 = classes di dalam block.
 */
const SUB_BLOCK_RE =
  /\[([a-z][a-zA-Z0-9_-]*)\]\s*(\{([^}]*)\})/g

// ─── Block boundary map ───────────────────────────────────────────────────────

interface BlockRange {
  /** "base" untuk kelas di luar block, atau nama block seperti "icon" */
  name: string
  /** line number 0-based start */
  startLine: number
  /** line number 0-based end */
  endLine: number
}

/**
 * Parse semua template literal tw.* di file dan bangun peta block range per line.
 * Digunakan untuk menentukan apakah dua posisi berada di block yang berbeda.
 */
function buildBlockRanges(document: vscode.TextDocument): BlockRange[] {
  const text = document.getText()
  const ranges: BlockRange[] = []

  TW_TEMPLATE_RE.lastIndex = 0
  let templateMatch: RegExpExecArray | null

  while ((templateMatch = TW_TEMPLATE_RE.exec(text)) !== null) {
    const templateStart = templateMatch.index
    const templateContent = templateMatch[1]

    // Offset dalam full text di mana content template dimulai
    const contentOffset = templateStart + templateMatch[0].indexOf("`") + 1

    // Posisi akhir dari tiap sub-block dalam template content
    const subBlockPositions: Array<{ name: string; startOffset: number; endOffset: number }> = []

    SUB_BLOCK_RE.lastIndex = 0
    let blockMatch: RegExpExecArray | null

    while ((blockMatch = SUB_BLOCK_RE.exec(templateContent)) !== null) {
      const blockRelStart = blockMatch.index
      const blockRelEnd = blockMatch.index + blockMatch[0].length

      subBlockPositions.push({
        name: blockMatch[1],
        startOffset: contentOffset + blockRelStart,
        endOffset: contentOffset + blockRelEnd,
      })
    }

    // Base range = semua area template yang BUKAN di dalam sub-block
    // Untuk simplisitas: base = dari awal template sampai first block
    const templateEnd = templateStart + templateMatch[0].length
    const firstBlockStart =
      subBlockPositions.length > 0 ? subBlockPositions[0].startOffset : templateEnd

    // Base block
    ranges.push({
      name: "base",
      startLine: document.positionAt(contentOffset).line,
      endLine: document.positionAt(firstBlockStart).line,
    })

    // Sub-component blocks
    for (const block of subBlockPositions) {
      ranges.push({
        name: block.name,
        startLine: document.positionAt(block.startOffset).line,
        endLine: document.positionAt(block.endOffset).line,
      })
    }
  }

  return ranges
}

/**
 * Tentukan nama block untuk sebuah line number.
 * Returns "base" jika di luar semua sub-blocks, atau nama block-nya.
 * Returns null jika di luar template literal sama sekali.
 */
function getBlockForLine(ranges: BlockRange[], line: number): string | null {
  for (const r of ranges) {
    if (line >= r.startLine && line <= r.endLine) {
      return r.name
    }
  }
  return null
}

/**
 * Cek apakah dua diagnostic range berada di block yang BERBEDA.
 * Jika ya, ini adalah false-positive cross-block conflict.
 */
function isCrossBlockConflict(
  document: vscode.TextDocument,
  ranges: BlockRange[],
  diagLine: number,
  relatedLine: number
): boolean {
  const blockA = getBlockForLine(ranges, diagLine)
  const blockB = getBlockForLine(ranges, relatedLine)

  // Keduanya harus dalam template (bukan null) dan di block BERBEDA
  if (blockA === null || blockB === null) return false
  return blockA !== blockB
}

// ─── Main suppressor ──────────────────────────────────────────────────────────

const TAILWIND_INTELLISENSE_OWNER = "tailwindcss-intellisense"
const CSS_CONFLICT_CODE = "cssConflict"

/**
 * Buat dan daftarkan diagnostic suppressor untuk false-positive cssConflict.
 *
 * Karena VSCode tidak mengizinkan hapus diagnostic dari extension lain,
 * kita emit diagnostic `Hint` (severity 3) yang menandai false-positive
 * sebagai "known safe — different tw subcomponent block".
 *
 * Ini muncul di Problems panel sebagai hint (icon info biru) bukan warning,
 * dan di editor sebagai garis bawah putus-putus samar, bukan squiggle kuning.
 */
export function registerDiagnosticSuppressor(
  context: vscode.ExtensionContext
): vscode.Disposable {
  const suppressCollection = vscode.languages.createDiagnosticCollection(
    "tailwind-styled-conflict-info"
  )
  context.subscriptions.push(suppressCollection)

  const refresh = (uris: readonly vscode.Uri[]) => {
    for (const uri of uris) {
      const document = vscode.workspace.textDocuments.find(
        (d) => d.uri.toString() === uri.toString()
      )
      if (!document) continue

      // Hanya proses file yang relevan
      const lang = document.languageId
      if (!["typescript", "typescriptreact", "javascript", "javascriptreact"].includes(lang)) {
        continue
      }

      const allDiags = vscode.languages.getDiagnostics(uri)
      const twConflicts = allDiags.filter(
        (d) =>
          d.source === TAILWIND_INTELLISENSE_OWNER &&
          (d.code === CSS_CONFLICT_CODE || String(d.code) === CSS_CONFLICT_CODE)
      )

      if (twConflicts.length === 0) {
        suppressCollection.delete(uri)
        continue
      }

      const blockRanges = buildBlockRanges(document)
      if (blockRanges.length === 0) {
        suppressCollection.delete(uri)
        continue
      }

      const suppressDiags: vscode.Diagnostic[] = []

      for (const diag of twConflicts) {
        const diagLine = diag.range.start.line

        // relatedInformation berisi lokasi kelas yang conflict
        const relatedLines = (diag.relatedInformation ?? []).map(
          (r) => r.location.range.start.line
        )

        const isFalsePositive = relatedLines.some((relLine) =>
          isCrossBlockConflict(document, blockRanges, diagLine, relLine)
        )

        if (isFalsePositive) {
          // Emit hint-level diagnostic di range yang sama
          // Ini tidak menghapus warning dari tailwindcss-intellisense,
          // tapi memberi konteks visual bahwa ini adalah false positive.
          const hint = new vscode.Diagnostic(
            diag.range,
            `[tailwind-styled] False positive — kelas ini ada di subcomponent block yang berbeda (tidak conflict di runtime).`,
            vscode.DiagnosticSeverity.Hint
          )
          hint.code = "tw-subblock-safe"
          hint.source = "tailwind-styled"
          hint.tags = [vscode.DiagnosticTag.Unnecessary]
          suppressDiags.push(hint)
        }
      }

      if (suppressDiags.length > 0) {
        suppressCollection.set(uri, suppressDiags)
      } else {
        suppressCollection.delete(uri)
      }
    }
  }

  // Listen ke perubahan diagnostics dari tailwindcss-intellisense
  const listener = vscode.languages.onDidChangeDiagnostics((e) => {
    refresh(e.uris)
  })

  context.subscriptions.push(listener)

  return {
    dispose() {
      listener.dispose()
      suppressCollection.dispose()
    },
  }
}