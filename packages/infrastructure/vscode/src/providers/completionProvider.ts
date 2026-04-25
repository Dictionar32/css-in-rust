import * as vscode from "vscode"
import type { EngineService } from "../services/engineService"

const TAILWIND_PREFIXES = [
  "bg-",
  "text-",
  "flex-",
  "grid-",
  "block-",
  "inline-",
  "hidden-",
  "p-",
  "px-",
  "py-",
  "pt-",
  "pr-",
  "pb-",
  "pl-",
  "m-",
  "mx-",
  "my-",
  "mt-",
  "mr-",
  "mb-",
  "ml-",
  "w-",
  "h-",
  "min-w-",
  "min-h-",
  "max-w-",
  "max-h-",
  "font-",
  "text-",
  "leading-",
  "tracking-",
  "font-",
  "border-",
  "rounded-",
  "shadow-",
  "opacity-",
  "z-",
  "top-",
  "right-",
  "bottom-",
  "left-",
  "absolute",
  "relative",
  "fixed",
  "space-x-",
  "space-y-",
  "divide-",
  "gap-",
  "hover:",
  "focus:",
  "active:",
  "disabled:",
  "group-",
  "sm-",
  "md-",
  "lg-",
  "xl-",
  "2xl-",
  "dark:",
  "container",
  "mx-auto",
  "justify-",
  "items-",
  "self-",
  "aspect-",
  "object-",
  "overflow-",
  "cursor-",
  "select-",
  "transition-",
  "duration-",
  "ease-",
  "transform",
  "translate-",
  "rotate-",
  "scale-",
  "btn-",
  "badge-",
  "card-",
  "input-",
  "modal-",
  "dropdown-",
  "navbar-",
]

const CLASS_ATTRIBUTE_TRIGGERS = ["className=", "class=", "class={"]

/**
 * Regex patterns untuk mendeteksi konteks tagged template literal dari tailwind-styled-v4.
 * Matches:
 *   tw`...`
 *   tw.button`...`
 *   tw.div`...`
 * dan semua variasi tw.<element>`...`
 */
const TW_TEMPLATE_LITERAL_RE = /tw(?:\.[a-zA-Z][a-zA-Z0-9]*)?\s*`/

/**
 * Regex untuk mendeteksi sub-component block: `[name] { ... }` atau `[name]{ ... }`
 */
const SUB_BLOCK_OPEN_RE = /\[\w+\]\s*\{/g

/**
 * Cek apakah cursor saat ini berada di dalam tagged template literal tw`...` / tw.el`...`.
 * Juga mendeteksi cursor di dalam nested [name] { ... } block.
 */
function isInsideTwTemplateLiteral(
  document: vscode.TextDocument,
  position: vscode.Position
): { inside: boolean; prefix: string } {
  const fullTextUntilCursor = document.getText(
    new vscode.Range(new vscode.Position(0, 0), position)
  )

  const twOpenMatch = [...fullTextUntilCursor.matchAll(/tw(?:\.[a-zA-Z][a-zA-Z0-9]*)?\s*`/g)]
  if (twOpenMatch.length === 0) return { inside: false, prefix: "" }

  const lastOpen = twOpenMatch[twOpenMatch.length - 1]
  const openIndex = (lastOpen.index ?? 0) + lastOpen[0].length

  const textInsideTemplate = fullTextUntilCursor.slice(openIndex)
  if (textInsideTemplate.includes("`")) return { inside: false, prefix: "" }

  // Cek apakah cursor di dalam sub-component block: [name] { ... }
  // Reset lastIndex karena SUB_BLOCK_OPEN_RE punya flag /g
  SUB_BLOCK_OPEN_RE.lastIndex = 0
  const subBlockMatches = [...textInsideTemplate.matchAll(SUB_BLOCK_OPEN_RE)]
  if (subBlockMatches.length > 0) {
    const lastBlock = subBlockMatches[subBlockMatches.length - 1]
    const blockOpenIndex = (lastBlock.index ?? 0) + lastBlock[0].length
    const textAfterBlockOpen = textInsideTemplate.slice(blockOpenIndex)
    if (!textAfterBlockOpen.includes("}")) {
      // Cursor di dalam [name] { ... } — ini juga area class Tailwind
      const lastWord = textAfterBlockOpen.match(/\S+$/)
      return { inside: true, prefix: lastWord ? lastWord[0] : "" }
    }
  }

  // Base class area — ambil word terakhir, skip jika itu [name] / { / }
  const lastWordMatch = textInsideTemplate.match(/\S+$/)
  const prefix = lastWordMatch ? lastWordMatch[0] : ""
  if (/^\[|^\{|^\}$/.test(prefix)) return { inside: true, prefix: "" }

  return { inside: true, prefix: prefix.trim() }
}

export function createCompletionProvider(
  engineService: EngineService
): vscode.CompletionItemProvider {
  return {
    provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CompletionItem[]> {
      return (async () => {
        try {
          const lineText = document.lineAt(position.line).text
          const textUntilCursor = lineText.substring(0, position.character)

          // --- Cek konteks tagged template literal tw`...` / tw.el`...` ---
          const templateCtx = isInsideTwTemplateLiteral(document, position)
          if (templateCtx.inside) {
            const prefix = templateCtx.prefix
            const completions = await engineService.getCompletions(prefix)
            if (completions.length > 0) {
              return completions.map((className) => {
                const item = new vscode.CompletionItem(className, vscode.CompletionItemKind.Property)
                item.detail = `tw: ${className}`
                item.insertText = className
                return item
              })
            }
            return getFallbackCompletions(prefix)
          }

          // --- Cek konteks className= / class= / class={ ---
          const triggerMatch = CLASS_ATTRIBUTE_TRIGGERS.find((trigger) =>
            textUntilCursor.includes(trigger)
          )

          if (!triggerMatch) {
            return []
          }

          const triggerIndex = textUntilCursor.lastIndexOf(triggerMatch)
          const prefixStart = triggerIndex + triggerMatch.length
          const prefix = textUntilCursor.substring(prefixStart)

          if (prefix.length === 0) {
            return getFallbackCompletions()
          }

          const completions = await engineService.getCompletions(prefix)

          if (completions.length === 0) {
            return getFallbackCompletions(prefix)
          }

          return completions.map((className) => {
            const item = new vscode.CompletionItem(className, vscode.CompletionItemKind.Property)
            item.detail = `class: ${className}`
            item.insertText = className
            return item
          })
        } catch (error) {
          console.error("[CompletionProvider] Error providing completions:", error)
          return getFallbackCompletions()
        }
      })()
    },
  }
}

function getFallbackCompletions(prefix?: string): vscode.CompletionItem[] {
  const items: vscode.CompletionItem[] = []
  const matchingPrefixes = prefix
    ? TAILWIND_PREFIXES.filter((p) => p.startsWith(prefix))
    : TAILWIND_PREFIXES

  for (const p of matchingPrefixes) {
    const item = new vscode.CompletionItem(p, vscode.CompletionItemKind.Property)
    item.detail = `prefix: ${p}`
    item.insertText = p
    items.push(item)
  }

  return items
}
