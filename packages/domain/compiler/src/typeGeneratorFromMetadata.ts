/**
 * Type Stub Generator
 * 
 * Build-time generator untuk create TypeScript .d.ts files dari semantic metadata.
 * Generates type stubs dengan semantic information untuk better IDE intellisense.
 */

import type { SemanticAnalysisResult, SemanticIntent } from './semanticComponentAnalyzer'

/**
 * TypeScript interface definition untuk generated type
 */
export interface GeneratedTypeDefinition {
    interfaceName: string
    extendsFrom: string
    properties: Map<string, TypeProperty>
    jsDocComment?: string
}

/**
 * Individual property definition
 */
export interface TypeProperty {
    name: string
    type: string
    description?: string
    optional?: boolean
}

/**
 * Generate JSDoc comment dari semantic analysis
 */
function generateJsDocFromSemantic(analysis: SemanticAnalysisResult): string {
    const lines: string[] = [
        '/**',
        ` * ${analysis.componentName}`,
        ` * `,
        ` * Semantic intent: ${analysis.semantic}`,
        ` * Tag: ${analysis.tag}`,
    ]

    if (analysis.metadata['@aria']) {
        lines.push(` * ARIA: auto-injected dari semantic metadata`)
    }

    if (analysis.stateProperties.size > 0) {
        const states = Array.from(analysis.stateProperties.entries())
            .map(([k, v]) => `${k} → ${v}`)
            .join(', ')
        lines.push(` * State mappings: ${states}`)
    }

    lines.push(' */')
    return lines.join('\n')
}

/**
 * Get base type untuk component props
 * Depends on semantic intent dan HTML tag
 */
function getBaseComponentType(analysis: SemanticAnalysisResult): string {
    const tag = analysis.tag.toLowerCase()

    // React.ComponentPropsWithoutRef untuk specific tags
    const tagMap: Record<string, string> = {
        'button': 'React.ButtonHTMLAttributes<HTMLButtonElement>',
        'a': 'React.AnchorHTMLAttributes<HTMLAnchorElement>',
        'input': 'React.InputHTMLAttributes<HTMLInputElement>',
        'textarea': 'React.TextareaHTMLAttributes<HTMLTextAreaElement>',
        'select': 'React.SelectHTMLAttributes<HTMLSelectElement>',
        'form': 'React.FormHTMLAttributes<HTMLFormElement>',
        'div': 'React.HTMLAttributes<HTMLDivElement>',
        'span': 'React.HTMLAttributes<HTMLSpanElement>',
        'nav': 'React.HTMLAttributes<HTMLElement>',
        'dialog': 'React.DialogHTMLAttributes<HTMLDialogElement>',
    }

    return tagMap[tag] ?? 'React.HTMLAttributes<HTMLElement>'
}

/**
 * Generate state properties dari semantic metadata
 */
function generateStateProperties(analysis: SemanticAnalysisResult): Map<string, TypeProperty> {
    const props = new Map<string, TypeProperty>()

    // Add state properties
    for (const [stateName, ariaProp] of analysis.stateProperties) {
        props.set(stateName, {
            name: stateName,
            type: 'boolean | undefined',
            description: `State mapped to ARIA property: ${ariaProp}`,
            optional: true,
        })
    }

    return props
}

/**
 * Generate .d.ts interface definition
 */
export function generateTypeDefinition(
    analysis: SemanticAnalysisResult,
    componentName: string
): GeneratedTypeDefinition {
    const interfaceName = `${componentName}Props`
    const baseType = getBaseComponentType(analysis)
    const stateProps = generateStateProperties(analysis)

    return {
        interfaceName,
        extendsFrom: baseType,
        properties: stateProps,
        jsDocComment: generateJsDocFromSemantic(analysis),
    }
}

/**
 * Render TypeScript interface code
 */
export function renderTypeDefinition(def: GeneratedTypeDefinition): string {
    const lines: string[] = []

    if (def.jsDocComment) {
        lines.push(def.jsDocComment)
    }

    lines.push(`export interface ${def.interfaceName} extends ${def.extendsFrom} {`)

    // Add documented state properties
    for (const prop of def.properties.values()) {
        const optional = prop.optional ? '?' : ''

        if (prop.description) {
            lines.push(`  /** ${prop.description} */`)
        }

        lines.push(`  ${prop.name}${optional}: ${prop.type}`)
    }

    lines.push('}')

    return lines.join('\n')
}

/**
 * Generate complete .d.ts file content
 * Includes imports, interfaces, exports
 */
export function generateTypeStubFile(
    analyses: Map<string, SemanticAnalysisResult>,
    packageName: string = 'tailwind-styled'
): string {
    const lines: string[] = [
        '/**',
        ` * Auto-generated type definitions dari semantic component metadata`,
        ` * Generated at build-time dari @semantic, @aria, @state annotations`,
        ` * Package: ${packageName}`,
        ` */`,
        '',
        "import type * as React from 'react'",
        '',
    ]

    // Generate interface untuk setiap component
    const interfaces: string[] = []

    for (const [name, analysis] of analyses) {
        const def = generateTypeDefinition(analysis, name)
        interfaces.push(renderTypeDefinition(def))
    }

    lines.push(interfaces.join('\n\n'))
    lines.push('')

    // Generate namespace export
    lines.push('export namespace Components {')
    for (const analysis of analyses.values()) {
        lines.push(`  export type ${analysis.componentName}Props = ${analysis.componentName}Props`)
    }
    lines.push('}')
    lines.push('')

    return lines.join('\n')
}

/**
 * Write type stub file ke disk
 * Handles both ESM dan CJS output paths
 */
export interface TypeStubOutput {
    filePath: string
    content: string
    format: 'esm' | 'cjs' | 'dts'
}

/**
 * Generate output paths untuk type stubs
 */
export function generateTypeStubOutputPaths(
    outputDir: string,
    packageName: string
): TypeStubOutput[] {
    return [
        {
            filePath: `${outputDir}/${packageName}.d.ts`,
            content: '', // Will be set by caller
            format: 'dts',
        },
    ]
}

/**
 * Batch generate type definitions dari multiple analyses
 */
export function generateTypeDefinitionsBatch(
    analyses: Map<string, SemanticAnalysisResult>
): Map<string, string> {
    const results = new Map<string, string>()

    for (const [name, analysis] of analyses) {
        const def = generateTypeDefinition(analysis, name)
        const code = renderTypeDefinition(def)
        results.set(name, code)
    }

    return results
}

/**
 * Combine multiple type definitions into single file
 */
export function combineTypeDefinitions(
    definitions: Map<string, string>,
    packageName: string = 'tailwind-styled'
): string {
    const lines: string[] = [
        '/**',
        ` * Auto-generated type definitions dari semantic component metadata`,
        ` * Generated at build-time dari @semantic, @aria, @state annotations`,
        ` * Package: ${packageName}`,
        ' */',
        '',
        "import type * as React from 'react'",
        '',
    ]

    // Add all type definitions
    const defs = Array.from(definitions.values())
    lines.push(defs.join('\n\n'))

    return lines.join('\n')
}
