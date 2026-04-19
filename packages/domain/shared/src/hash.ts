/**
 * Centralized hash utilities
 * Replaces duplicated crypto.createHash() calls across packages
 */

const isBrowser = typeof window !== "undefined" || typeof document !== "undefined"

const nodeRequire = typeof require !== "undefined" ? require : (typeof globalThis !== "undefined" ? (globalThis as any).require : null)

let _nodeCrypto: any = null
let _nodeFs: any = null

function getNodeCrypto() {
  if (isBrowser) throw new Error("node:crypto not available in browser")
  if (!_nodeCrypto) _nodeCrypto = nodeRequire("node:crypto")
  return _nodeCrypto!
}
function getNodeFs() {
  if (isBrowser) throw new Error("node:fs not available in browser")
  if (!_nodeFs) _nodeFs = nodeRequire("node:fs")
  return _nodeFs!
}

/** Hash a string content → short hex string */
export function hashContent(content: string, algorithm = "md5", length = 8): string {
  if (isBrowser) {
    // Simple hash fallback for browser
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).slice(0, length)
  }
  return getNodeCrypto().createHash(algorithm).update(content).digest("hex").slice(0, length)
}

/** Hash a file's content → short hex string */
export function hashFile(filePath: string, algorithm = "md5", length = 8): string {
  if (isBrowser) return "00000000"
  try {
    const content = getNodeFs().readFileSync(filePath, "utf8")
    return hashContent(content, algorithm, length)
  } catch {
    return "00000000"
  }
}
