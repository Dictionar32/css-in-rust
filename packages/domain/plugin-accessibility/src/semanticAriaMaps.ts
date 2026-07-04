/**
 * Semantic ARIA Mappings
 * 
 * Build-time static mappings dari semantic HTML tags + component intents
 * ke ARIA roles dan properties. Used by ARIA injection plugin.
 */

/**
 * Map semantic tag → ARIA role
 * W3C ARIA spec compliant
 */
export const SEMANTIC_TO_ARIA_ROLE: Record<string, string | undefined> = {
    'button': 'button',
    'a': 'link',
    'nav': 'navigation',
    'h1': 'heading',
    'h2': 'heading',
    'h3': 'heading',
    'h4': 'heading',
    'h5': 'heading',
    'h6': 'heading',
    'p': undefined, // paragraph tidak perlu explicit role
    'ul': 'list',
    'ol': 'list',
    'li': 'listitem',
    'input': 'textbox',
    'textarea': 'textbox',
    'form': 'form',
    'dialog': 'dialog',
    'select': 'listbox',
    'header': 'banner',
    'footer': 'contentinfo',
    'main': 'main',
    'section': 'region',
    'article': 'article',
    'aside': 'complementary',
}

/**
 * Map HTML input types → ARIA roles
 */
export const INPUT_TYPE_TO_ARIA_ROLE: Record<string, string> = {
    'button': 'button',
    'checkbox': 'checkbox',
    'color': 'textbox',
    'date': 'textbox',
    'datetime-local': 'textbox',
    'email': 'textbox',
    'file': 'textbox',
    'hidden': 'textbox',
    'month': 'textbox',
    'number': 'textbox',
    'password': 'textbox',
    'radio': 'radio',
    'range': 'slider',
    'search': 'textbox',
    'tel': 'textbox',
    'text': 'textbox',
    'time': 'textbox',
    'url': 'textbox',
    'week': 'textbox',
    'submit': 'button',
    'reset': 'button',
    'image': 'button',
}

/**
 * State properties → ARIA attribute mappings
 * Maps component state properties to corresponding ARIA attributes
 */
export const STATE_TO_ARIA_PROPERTY: Record<string, string> = {
    'disabled': 'aria-disabled',
    'required': 'aria-required',
    'readonly': 'aria-readonly',
    'checked': 'aria-checked',
    'selected': 'aria-selected',
    'pressed': 'aria-pressed',
    'expanded': 'aria-expanded',
    'hidden': 'aria-hidden',
    'invalid': 'aria-invalid',
    'busy': 'aria-busy',
    'live': 'aria-live',
    'atomic': 'aria-atomic',
    'relevant': 'aria-relevant',
    'grabbed': 'aria-grabbed',
    'dropeffect': 'aria-dropeffect',
    'describedby': 'aria-describedby',
    'labelledby': 'aria-labelledby',
    'controls': 'aria-controls',
    'flowto': 'aria-flowto',
    'owns': 'aria-owns',
    'posinset': 'aria-posinset',
    'setsize': 'aria-setsize',
    'level': 'aria-level',
    'valuemin': 'aria-valuemin',
    'valuemax': 'aria-valuemax',
    'valuenow': 'aria-valuenow',
    'valuetext': 'aria-valuetext',
    'autocomplete': 'aria-autocomplete',
    'haspopup': 'aria-haspopup',
    'placeholder': 'aria-placeholder',
    'current': 'aria-current',
}

/**
 * Default ARIA attributes untuk common component types
 */
export const DEFAULT_ARIA_ATTRIBUTES: Record<string, Record<string, string>> = {
    'button': {
        'role': 'button',
        'aria-pressed': 'false',
    },
    'link': {
        'role': 'link',
    },
    'checkbox': {
        'role': 'checkbox',
        'aria-checked': 'false',
    },
    'radio': {
        'role': 'radio',
        'aria-checked': 'false',
    },
    'textbox': {
        'role': 'textbox',
    },
    'dialog': {
        'role': 'dialog',
        'aria-modal': 'true',
    },
    'navigation': {
        'role': 'navigation',
    },
    'heading': {
        'role': 'heading',
    },
    'tab': {
        'role': 'tab',
        'aria-selected': 'false',
    },
    'tablist': {
        'role': 'tablist',
    },
    'tabpanel': {
        'role': 'tabpanel',
    },
    'alert': {
        'role': 'alert',
        'aria-live': 'assertive',
        'aria-atomic': 'true',
    },
}

/**
 * ARIA level untuk heading tags
 */
export const HEADING_LEVELS: Record<string, number> = {
    'h1': 1,
    'h2': 2,
    'h3': 3,
    'h4': 4,
    'h5': 5,
    'h6': 6,
}

/**
 * Get ARIA role untuk semantic tag
 */
export function getAriaRoleForTag(tag: string): string | undefined {
    const normalized = tag.toLowerCase()
    return SEMANTIC_TO_ARIA_ROLE[normalized]
}

/**
 * Get ARIA role untuk input type
 */
export function getAriaRoleForInputType(type: string): string | undefined {
    const normalized = type.toLowerCase()
    return INPUT_TYPE_TO_ARIA_ROLE[normalized]
}

/**
 * Get ARIA property name dari state key
 */
export function getAriaPropertyForState(state: string): string | undefined {
    const normalized = state.toLowerCase()
    return STATE_TO_ARIA_PROPERTY[normalized]
}

/**
 * Get default ARIA attributes para component type
 */
export function getDefaultAriaAttributes(componentType: string): Record<string, string> {
    const normalized = componentType.toLowerCase()
    return DEFAULT_ARIA_ATTRIBUTES[normalized] ?? {}
}

/**
 * Get heading level dari tag (returns undefined if not heading)
 */
export function getHeadingLevel(tag: string): number | undefined {
    const normalized = tag.toLowerCase()
    return HEADING_LEVELS[normalized]
}

/**
 * Build ARIA attributes object from semantic intent + state
 */
export function buildAriaAttributes(
    semanticType: string,
    stateMap?: Record<string, string | boolean>
): Record<string, string> {
    const attributes: Record<string, string> = {}

    // Start with defaults
    const defaults = getDefaultAriaAttributes(semanticType)
    for (const [key, value] of Object.entries(defaults)) {
        attributes[key] = value
    }

    // Apply state overrides
    if (stateMap) {
        for (const [state, value] of Object.entries(stateMap)) {
            const ariaProp = getAriaPropertyForState(state)
            if (ariaProp) {
                attributes[ariaProp] = String(value)
            }
        }
    }

    return attributes
}

/**
 * Validate ARIA attribute name
 */
export function isValidAriaAttribute(attr: string): boolean {
    // Must start with "aria-" or be standard HTML attribute
    if (attr.startsWith('aria-')) {
        return true
    }

    // Check standard attributes
    const standardAttrs = ['role', 'id', 'class', 'style', 'data-*']
    return standardAttrs.some(std =>
        std === '*' ? attr.startsWith('data-') : attr === std
    )
}

/**
 * Type-safe ARIA property values
 */
export const ARIA_BOOLEAN_PROPERTIES = new Set([
    'aria-pressed',
    'aria-checked',
    'aria-selected',
    'aria-expanded',
    'aria-hidden',
    'aria-readonly',
    'aria-required',
    'aria-disabled',
    'aria-invalid',
    'aria-busy',
    'aria-grabbed',
    'aria-modal',
    'aria-atomic',
])

export const ARIA_PROPERTY_TYPES: Record<string, 'boolean' | 'string' | 'number'> = {
    'aria-pressed': 'boolean',
    'aria-checked': 'boolean',
    'aria-selected': 'boolean',
    'aria-expanded': 'boolean',
    'aria-hidden': 'boolean',
    'aria-readonly': 'boolean',
    'aria-required': 'boolean',
    'aria-disabled': 'boolean',
    'aria-invalid': 'boolean',
    'aria-busy': 'boolean',
    'aria-grabbed': 'boolean',
    'aria-modal': 'boolean',
    'aria-atomic': 'boolean',
    'aria-label': 'string',
    'aria-labelledby': 'string',
    'aria-describedby': 'string',
    'aria-live': 'string',
    'aria-level': 'number',
    'aria-posinset': 'number',
    'aria-setsize': 'number',
    'aria-valuemin': 'number',
    'aria-valuemax': 'number',
    'aria-valuenow': 'number',
    'aria-valuetext': 'string',
}

/**
 * Normalize ARIA property value based on type
 */
export function normalizeAriaValue(
    property: string,
    value: string | number | boolean | undefined
): string | undefined {
    if (value === undefined) {
        return undefined
    }

    const propType = ARIA_PROPERTY_TYPES[property]

    if (propType === 'boolean') {
        return value === true || value === 'true' ? 'true' : 'false'
    }

    if (propType === 'number') {
        return String(Number(value))
    }

    return String(value)
}
