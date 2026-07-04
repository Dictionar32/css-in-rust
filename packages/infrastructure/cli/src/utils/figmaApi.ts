/**
 * Figma REST API client helpers
 * Used by figma CLI commands for pull/push/diff operations
 */

export interface FigmaRequestOptions {
    token: string
    fileKey: string
}

/**
 * Make authenticated request to Figma API
 * @param endpoint API endpoint (e.g. '/files/:fileKey/variables/local')
 * @param options Token and file key for authentication
 * @returns Parsed JSON response
 * @throws Error if response is not ok or token/fileKey missing
 */
export async function figmaRequest(
    endpoint: string,
    options: FigmaRequestOptions
): Promise<FigmaVariablesResponse> {
    const { token, fileKey } = options

    if (!token) {
        throw new Error('FIGMA_TOKEN environment variable not set')
    }
    if (!fileKey) {
        throw new Error('FIGMA_FILE_KEY environment variable not set')
    }

    const url = `https://api.figma.com/v1${endpoint.replace(':fileKey', fileKey)}`
    const res = await fetch(url, {
        headers: { 'X-Figma-Token': token },
    })

    if (!res.ok) {
        const body = await res.text()
        throw new Error(`Figma API ${res.status}: ${body.slice(0, 200)}`)
    }

    return res.json()
}

/**
 * Figma color object to hex string
 * @param color Figma color with r, g, b, a components
 * @returns Hex string (e.g. '#FF0000' or '#FF0000FF' with alpha)
 */
export function figmaColorToHex(color: {
    r: number
    g: number
    b: number
    a?: number
}): string {
    const { r, g, b, a = 1 } = color
    const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`
    return a < 1 ? `${hex}${toHex(a)}` : hex
}

/**
 * Figma Variable type from API
 */
interface FigmaVariable {
    variableCollectionId: string
    name: string
    resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | string
    valuesByMode: Record<string, unknown>
    description?: string
}

/**
 * Figma Variables response type
 */
interface FigmaVariablesResponse {
    variables?: Record<string, FigmaVariable>
    variableCollections?: Record<string, { id: string; name: string }>
}

/**
 * W3C DTCG Token type
 */
interface DtcgToken {
    $value: string
    $type: string
    $description?: string
    _figmaId?: string
}

/**
 * Convert Figma Variables API response to W3C DTCG token format
 * @param variablesData Response from Figma /files/:fileKey/variables/local endpoint
 * @returns Nested token object in W3C format
 */
export function figmaVariablesToTokens(variablesData: FigmaVariablesResponse): Record<string, Record<string, DtcgToken> | string> {
    const tokens: Record<string, Record<string, DtcgToken> | string> = {}
    const { variables = {}, variableCollections = {} } = variablesData

    for (const [id, variable] of Object.entries(variables as Record<string, FigmaVariable>)) {
        const collection = variableCollections?.[variable.variableCollectionId]
        if (!collection) continue

        // Use first mode value
        const modeId = Object.keys(variable.valuesByMode)[0]
        const rawValue = variable.valuesByMode[modeId]
        if (rawValue === undefined) continue

        // Normalize name: "Color/Primary/500" → tokens.color.primary['500']
        const parts = variable.name.split('/').map((p: string) =>
            p.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        )

        let cursor: Record<string, unknown> = tokens
        for (let i = 0; i < parts.length - 1; i++) {
            cursor[parts[i]] ??= {}
            cursor = cursor[parts[i]] as Record<string, unknown>
        }

        const leafKey = parts[parts.length - 1]

        if (variable.resolvedType === 'COLOR') {
            const token: DtcgToken = {
                $value:
                    typeof rawValue === 'object' && rawValue !== null && 'r' in rawValue
                        ? figmaColorToHex(rawValue as Parameters<typeof figmaColorToHex>[0])
                        : String(rawValue),
                $type: 'color',
            }
            if (variable.description) token.$description = variable.description
            token._figmaId = id
            cursor[leafKey] = token
        } else if (variable.resolvedType === 'FLOAT') {
            cursor[leafKey] = {
                $value: typeof rawValue === 'number' ? `${rawValue}px` : String(rawValue),
                $type: 'dimension',
                _figmaId: id,
            }
        } else if (variable.resolvedType === 'STRING') {
            cursor[leafKey] = {
                $value: String(rawValue),
                $type: 'other',
                _figmaId: id,
            }
        }
    }

    return tokens
}
