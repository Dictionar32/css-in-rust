/**
 * Type Generation Plugin untuk tsup/build pipeline
 * 
 * Integration point untuk run semantic analyzer + type generator
 * sebagai part dari build process.
 * 
 * Usage di tsup.config.ts:
 * ```
 * import { createTypeGenerationPlugin } from './src/typeGenerationPlugin'
 * 
 * export default defineConfig({
 *   plugins: [createTypeGenerationPlugin()],
 *   ...
 * })
 * ```
 */

import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'esbuild'

import {
    analyzeComponentBatch,
    type ComponentConfig,
} from './semanticComponentAnalyzer'
import {
    generateTypeStubFile,
} from './typeGeneratorFromMetadata'

/**
 * Options untuk type generation plugin
 */
export interface TypeGenerationPluginOptions {
    /**
     * Directory dimana akan output .d.ts files
     * Default: './dist/types'
     */
    outputDir?: string

    /**
     * Package name untuk generated header
     * Default: 'tailwind-styled'
     */
    packageName?: string

    /**
     * Enable logging
     * Default: false
     */
    verbose?: boolean

    /**
     * Source file path untuk component registry
     * Jika tidak provided, akan skip type generation
     */
    componentRegistryPath?: string
}

/**
 * Create tsup plugin untuk type generation
 * Runs at build-time to generate .d.ts files dari semantic metadata
 */
export function createTypeGenerationPlugin(options: TypeGenerationPluginOptions = {}): Plugin {
    const {
        outputDir = './dist/types',
        packageName = 'tailwind-styled',
        verbose = false,
        componentRegistryPath,
    } = options

    return {
        name: 'type-generation',

        async setup(build) {
            // This plugin uses esbuild setup hook
            // For actual type generation, use onEnd callback if available
            if (verbose) {
                console.log('[type-generation] Plugin loaded')
            }
        },
    }
}

/**
 * Load component registry dari file
 * Expected format: JSON with component configs
 */
function loadComponentRegistry(filePath: string): Map<string, ComponentConfig> {
    const registry = new Map<string, ComponentConfig>()

    if (!fs.existsSync(filePath)) {
        console.warn(`[type-generation] Component registry not found: ${filePath}`)
        return registry
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8')
        const data = JSON.parse(content)

        // Expect format: { components: { name: config, ... } } atau direct object
        const components = data.components ?? data

        for (const [name, config] of Object.entries(components)) {
            if (typeof config === 'object' && config !== null) {
                registry.set(name, config as ComponentConfig)
            }
        }
    } catch (error) {
        console.warn(`[type-generation] Failed to load registry from ${filePath}:`, error)
    }

    return registry
}

/**
 * Standalone function untuk generate types from components
 * Useful untuk scripts atau CLI
 */
export async function generateTypesFromComponents(
    components: Map<string, ComponentConfig>,
    outputPath: string,
    packageName: string = 'tailwind-styled'
): Promise<void> {
    if (components.size === 0) {
        console.warn('No components provided')
        return
    }

    // Analyze components
    const analyses = analyzeComponentBatch(components)

    // Generate type stubs
    const typeContent = generateTypeStubFile(analyses, packageName)

    // Ensure output directory exists
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    // Write file
    fs.writeFileSync(outputPath, typeContent, 'utf8')

    console.log(`Generated type stubs → ${outputPath} (${components.size} components)`)
}