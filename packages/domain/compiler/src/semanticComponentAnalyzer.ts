/**
 * Semantic Component Analyzer
 * 
 * Build-time analyzer untuk extract component metadata (@semantic, @aria, @state)
 * dari component config dan determine semantic intent.
 */

/**
 * Semantic intent type - represents semantic meaning ng component
 */
export type SemanticIntent =
    | 'button'
    | 'link'
    | 'navigation'
    | 'heading'
    | 'paragraph'
    | 'list'
    | 'input'
    | 'form'
    | 'dialog'
    | 'alert'
    | 'tab'
    | 'checkbox'
    | 'radio'
    | 'select'
    | 'custom'

/**
 * Semantic metadata annotations
 */
export interface SemanticMetadata {
    /**
     * Semantic intent ng component (e.g., "button", "link")
     * Guides ARIA role assignment at build-time
     */
    '@semantic'?: SemanticIntent

    /**
     * Explicit ARIA attributes to inject
     */
    '@aria'?: Record<string, string>

    /**
     * State-to-ARIA property mappings
     * e.g., { checked: "aria-checked", disabled: "aria-disabled" }
     */
    '@state'?: Record<string, string>

    /**
     * Custom semantic mappings
     */
    [key: string]: unknown
}

/**
 * Component config type - basic shape
 */
export interface ComponentConfig {
    tag?: string
    variants?: Record<string, unknown>
    defaultVariants?: Record<string, unknown>
    [key: string]: unknown
}

/**
 * Analysis result from semantic analyzer
 */
export interface SemanticAnalysisResult {
    componentName: string
    tag: string
    semantic: SemanticIntent
    metadata: SemanticMetadata
    ariaRole?: string
    stateProperties: Map<string, string>
}

/**
 * Infer semantic intent from HTML tag
 */
function inferSemanticFromTag(tag: string): SemanticIntent {
    const tagLower = tag.toLowerCase()

    const semanticMap: Record<string, SemanticIntent> = {
        'button': 'button',
        'a': 'link',
        'nav': 'navigation',
        'h1': 'heading',
        'h2': 'heading',
        'h3': 'heading',
        'h4': 'heading',
        'h5': 'heading',
        'h6': 'heading',
        'p': 'paragraph',
        'ul': 'list',
        'ol': 'list',
        'input': 'input',
        'form': 'form',
        'dialog': 'dialog',
        'select': 'select',
        'textarea': 'input',
    }

    return semanticMap[tagLower] ?? 'custom'
}

/**
 * Extract semantic metadata from component config
 * Looks for @semantic, @aria, @state annotations
 */
export function extractSemanticMetadata(config: ComponentConfig): SemanticMetadata {
    const metadata: SemanticMetadata = {}

    // Extract prefixed fields (@semantic, @aria, @state)
    for (const [key, value] of Object.entries(config)) {
        if (key.startsWith('@')) {
            metadata[key] = value
        }
    }

    return metadata
}

/**
 * Analyze component config untuk determine semantic intent
 * Priority: explicit @semantic > tag-based inference
 */
export function analyzeComponentSemantics(
    componentName: string,
    config: ComponentConfig
): SemanticAnalysisResult {
    // Extract metadata
    const metadata = extractSemanticMetadata(config)

    // Get HTML tag (default: div)
    const tag = config.tag ?? 'div'

    // Determine semantic intent
    let semantic = inferSemanticFromTag(tag)
    if (metadata['@semantic']) {
        semantic = metadata['@semantic'] as SemanticIntent
    }

    // Convert state mappings to Map
    const stateProperties = new Map<string, string>()
    if (metadata['@state']) {
        for (const [key, value] of Object.entries(metadata['@state'])) {
            if (typeof value === 'string') {
                stateProperties.set(key, value)
            }
        }
    }

    return {
        componentName,
        tag,
        semantic,
        metadata,
        stateProperties,
    }
}

/**
 * Get ARIA role from semantic intent
 * Used by ARIA injection plugin at build-time
 */
export function getAriaRoleForSemantic(semantic: SemanticIntent): string | undefined {
    const roleMap: Record<SemanticIntent, string | undefined> = {
        'button': 'button',
        'link': 'link',
        'navigation': 'navigation',
        'heading': 'heading',
        'paragraph': undefined, // paragraph tidak perlu explicit role
        'list': 'list',
        'input': 'textbox',
        'form': 'form',
        'dialog': 'dialog',
        'alert': 'alert',
        'tab': 'tab',
        'checkbox': 'checkbox',
        'radio': 'radio',
        'select': 'listbox',
        'custom': undefined,
    }

    return roleMap[semantic]
}

/**
 * Batch analyze multiple components
 * Returns map of componentName → SemanticAnalysisResult
 */
export function analyzeComponentBatch(
    components: Map<string, ComponentConfig>
): Map<string, SemanticAnalysisResult> {
    const results = new Map<string, SemanticAnalysisResult>()

    for (const [name, config] of components) {
        const analysis = analyzeComponentSemantics(name, config)
        results.set(name, analysis)
    }

    return results
}

/**
 * Validate semantic metadata untuk consistency
 * Returns array of validation issues (empty = valid)
 */
export function validateSemanticMetadata(metadata: SemanticMetadata): string[] {
    const issues: string[] = []

    // Validate @semantic value
    const validSemantics: SemanticIntent[] = [
        'button', 'link', 'navigation', 'heading', 'paragraph', 'list',
        'input', 'form', 'dialog', 'alert', 'tab', 'checkbox', 'radio', 'select', 'custom'
    ]

    if (metadata['@semantic'] && !validSemantics.includes(metadata['@semantic'] as SemanticIntent)) {
        issues.push(`Invalid @semantic value: ${metadata['@semantic']}`)
    }

    // Validate @aria object
    if (metadata['@aria']) {
        if (typeof metadata['@aria'] !== 'object' || Array.isArray(metadata['@aria'])) {
            issues.push('@aria must be object')
        }
    }

    // Validate @state object
    if (metadata['@state']) {
        if (typeof metadata['@state'] !== 'object' || Array.isArray(metadata['@state'])) {
            issues.push('@state must be object')
        }

        // Validate that values are string (ARIA property names)
        for (const [key, value] of Object.entries(metadata['@state'] as Record<string, unknown>)) {
            if (typeof value !== 'string') {
                issues.push(`@state.${key} must be string (ARIA property name)`)
            }
        }
    }

    return issues
}
