/**
 * Design token utility functions
 * Used for manipulating W3C DTCG tokens and syncing with Figma
 */

/**
 * W3C DTCG Token value type
 */
interface DtcgTokenValue {
    $value: string
    $type: string
    $description?: string
    [key: string]: unknown
}

/**
 * W3C DTCG Token structure (nested)
 */
type TokenObject = Record<string, DtcgTokenValue | Record<string, unknown>>

/**
 * Figma Variable type for updates
 */
interface FigmaVariable {
    id: string
    name: string
    variableCollectionId?: string
    [key: string]: unknown
}

/**
 * Convert W3C DTCG tokens to Figma Variables API update format
 * Matches existing variables by name and creates update payloads
 * @param tokens W3C DTCG token object (nested structure)
 * @param existingVariables Map of Figma variables (indexed by ID)
 * @returns Array of update payloads for Figma API
 */
export function tokensToFigmaUpdates(
    tokens: TokenObject,
    existingVariables: Record<string, FigmaVariable> = {}
): Array<{ id: string; name: string; value: string; type: string }> {
    const updates: Array<{ id: string; name: string; value: string; type: string }> = []

    function walk(obj: Record<string, unknown>, path: string[] = []): void {
        for (const [key, val] of Object.entries(obj)) {
            if (typeof val === 'object' && val !== null && '$value' in val) {
                const tokenVal = val as DtcgTokenValue
                // Find existing variable by name
                const name = path
                    .concat(key)
                    .map((p: string) =>
                        p.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
                    )
                    .join('/')

                const existing = Object.values(existingVariables).find(
                    (v: FigmaVariable) => v.name === name
                )
                if (existing) {
                    updates.push({
                        id: existing.id,
                        name,
                        value: tokenVal.$value,
                        type: tokenVal.$type,
                    })
                }
            } else if (typeof val === 'object' && val !== null && !('$type' in val)) {
                walk(val as Record<string, unknown>, path.concat(key))
            }
        }
    }

    walk(tokens)
    return updates
}

/**
 * Flatten nested token object to dot-notation for diffing/comparison
 * @param obj Token object to flatten
 * @param prefix Current prefix (used in recursion)
 * @param target Output object to populate
 */
export function flattenTokens(
    obj: Record<string, unknown>,
    prefix: string = '',
    target: Record<string, string> = {}
): Record<string, string> {
    for (const [k, v] of Object.entries(obj)) {
        const key = [prefix, k].filter(Boolean).join('.')
        if (typeof v === 'object' && v !== null && '$value' in v) {
            const tokenVal = v as DtcgTokenValue
            target[key] = tokenVal.$value
        } else if (typeof v === 'object' && v !== null && !('$type' in v)) {
            flattenTokens(v as Record<string, unknown>, key, target)
        }
    }
    return target
}

/**
 * Compare two flattened token sets and return differences
 * @param local Local token values (dot notation)
 * @param figma Figma token values (dot notation)
 * @returns Array of differences with key, local value, and figma value
 */
export function diffTokens(
    local: Record<string, string | undefined>,
    figma: Record<string, string | undefined>
): Array<{ key: string; local?: string; figma?: string }> {
    const allKeys = new Set([...Object.keys(local), ...Object.keys(figma)])
    const diffs: Array<{ key: string; local?: string; figma?: string }> = []

    for (const key of allKeys) {
        if (local[key] !== figma[key]) {
            diffs.push({
                key,
                local: local[key],
                figma: figma[key],
            })
        }
    }

    return diffs
}
