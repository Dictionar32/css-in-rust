/**
 * ARIA Injection Plugin
 * 
 * Build-time plugin yang injects ARIA attributes ke component code
 * berdasarkan semantic metadata. Runs preComponent phase.
 */

import type { BuildTimePluginContext } from '../types/plugin'
import type { SemanticAnalysisResult } from '@tailwind-styled/compiler'
import {
    getAriaRoleForTag,
    getAriaRoleForInputType,
    buildAriaAttributes,
    getDefaultAriaAttributes,
} from './semanticAriaMaps'

/**
 * ARIA injection plugin configuration
 */
export interface AriaPluginOptions {
    /**
     * Only inject ARIA jika @semantic explicitly set
     * Default: false (inject untuk semua semantic components)
     */
    requireExplicitSemantic?: boolean

    /**
     * Don't override user-provided ARIA attributes
     * Default: true
     */
    respectUserAria?: boolean

    /**
     * Enable verbose logging
     * Default: false
     */
    verbose?: boolean
}

/**
 * Result dari ARIA injection
 */
export interface AriaInjectionResult {
    injected: boolean
    ariaRole: string | undefined
    ariaAttributes: Record<string, string>
    warnings: string[]
}

/**
 * Compute ARIA attributes dari semantic analysis result
 */
export function computeAriaFromSemantic(
    analysis: SemanticAnalysisResult,
    options: AriaPluginOptions = {}
): AriaInjectionResult {
    const {
        requireExplicitSemantic = false,
        respectUserAria = true,
        verbose = false,
    } = options

    const warnings: string[] = []
    const attributes: Record<string, string> = {}

    // Check jika harus require explicit semantic
    if (requireExplicitSemantic && !analysis.metadata['@semantic']) {
        if (verbose) {
            console.log(`[aria-plugin] Skipping ${analysis.componentName}: no explicit @semantic`)
        }
        return {
            injected: false,
            ariaRole: undefined,
            ariaAttributes: attributes,
            warnings,
        }
    }

    // Get ARIA role dari semantic intent
    const ariaRole = getAriaRoleForTag(analysis.tag)

    if (!ariaRole) {
        if (verbose) {
            console.log(
                `[aria-plugin] No ARIA role untuk ${analysis.tag} (${analysis.semantic})`
            )
        }
        return {
            injected: false,
            ariaRole: undefined,
            ariaAttributes: attributes,
            warnings,
        }
    }

    // Start with default ARIA attributes
    const defaults = getDefaultAriaAttributes(analysis.semantic)
    for (const [key, value] of Object.entries(defaults)) {
        attributes[key] = value
    }

    // Apply explicit @aria from metadata if present
    if (analysis.metadata['@aria']) {
        for (const [key, value] of Object.entries(analysis.metadata['@aria'])) {
            if (respectUserAria && key in attributes) {
                if (verbose) {
                    console.log(`[aria-plugin] Respecting user-provided ${key}`)
                }
                continue
            }
            attributes[key] = String(value)
        }
    }

    // Apply state mappings
    for (const [state, ariaProp] of analysis.stateProperties) {
        if (respectUserAria && ariaProp in attributes) {
            if (verbose) {
                console.log(`[aria-plugin] State ${state} respects existing ${ariaProp}`)
            }
            continue
        }
        // Mark as injectable - actual value will be determined at runtime
        attributes[ariaProp] = '__state_injectable__'
    }

    return {
        injected: true,
        ariaRole,
        ariaAttributes: attributes,
        warnings,
    }
}

/**
 * Create ARIA injection plugin untuk build-time plugin system
 */
export function createAriaPlugin(options: AriaPluginOptions = {}) {
    const {
        verbose = false,
    } = options

    return {
        name: 'aria-injection',
        phase: 'preComponent' as const,
        priority: 100, // High priority - run early

        async execute(context: BuildTimePluginContext): Promise<void> {
            if (verbose) {
                console.log(
                    `[aria-plugin] Processing component: ${context.component.name}`
                )
            }

            // Get analysis dari component metadata
            const analysis = context.component.metadata as unknown as SemanticAnalysisResult

            if (!analysis) {
                if (verbose) {
                    console.log(
                        `[aria-plugin] No semantic analysis untuk ${context.component.name}`
                    )
                }
                return
            }

            // Compute ARIA attributes
            const result = computeAriaFromSemantic(analysis, { verbose, ...options })

            if (!result.injected) {
                return
            }

            // Store dalam context untuk code generation
            context.codeGen.injectedAttributes = {
                ...context.codeGen.injectedAttributes,
                ...result.ariaAttributes,
            }

            // Add ARIA role ke computed props
            if (result.ariaRole) {
                context.codeGen.computedProps = {
                    ...context.codeGen.computedProps,
                    role: result.ariaRole,
                }
            }

            // Log warnings
            for (const warning of result.warnings) {
                console.warn(`[aria-plugin] ${warning}`)
            }

            if (verbose) {
                console.log(
                    `[aria-plugin] Injected ARIA untuk ${context.component.name}:`,
                    result.ariaAttributes
                )
            }
        },
    }
}

/**
 * Merge ARIA attributes with user-provided props
 * User-provided props ALWAYS take precedence
 */
export function mergeAriaAttributes(
    computedAria: Record<string, string>,
    userProps: Record<string, string | boolean | undefined>
): Record<string, string | boolean | undefined> {
    const merged: Record<string, string | boolean | undefined> = { ...computedAria }

    for (const [key, value] of Object.entries(userProps)) {
        if (value !== undefined) {
            // User-provided value takes precedence
            merged[key] = value
        }
    }

    return merged
}

/**
 * Generate component wrapper code dengan ARIA injection
 */
export function generateAriaComponentCode(
    componentName: string,
    baseCode: string,
    ariaAttributes: Record<string, string>
): string {
    // Generate ARIA attribute assignment
    const ariaLines = Object.entries(ariaAttributes)
        .map(([key, value]) => {
            if (value === '__state_injectable__') {
                // State will be injected at runtime
                return `  ${key}: props.${key},`
            }
            return `  ${key}: '${value}',`
        })
        .join('\n')

    // Insert ARIA injection into component
    const injectionCode = `
  const computedAria = {
${ariaLines}
  }
  
  const mergedProps = { ...computedAria, ...props }
`

    // Simple replacement - replace first return statement
    return baseCode.replace(
        /return\s+(<[^>]+>)/,
        `${injectionCode}\n  return \\1`
    )
}

/**
 * Validate ARIA injection result
 */
export function validateAriaInjection(result: AriaInjectionResult): string[] {
    const issues: string[] = []

    if (!result.injected) {
        return issues
    }

    // Check for required ARIA attributes
    if (!result.ariaRole) {
        issues.push('No ARIA role computed for component')
    }

    // Validate attribute names
    for (const key of Object.keys(result.ariaAttributes)) {
        if (!key.startsWith('aria-') && key !== 'role') {
            issues.push(`Invalid ARIA attribute name: ${key}`)
        }
    }

    return issues
}
