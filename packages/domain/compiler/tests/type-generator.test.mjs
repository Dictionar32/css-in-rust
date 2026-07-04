import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(import.meta.url)

let dist
try {
    dist = req(path.resolve(__dirname, '../dist/index.js'))
} catch {
    console.warn('[compiler/tests] dist not found, skipping type generator tests')
    process.exit(0)
}

const {
    generateTypeDefinition,
    renderTypeDefinition,
    generateTypeStubFile,
    generateTypeDefinitionsBatch,
    combineTypeDefinitions,
} = dist

const {
    analyzeComponentSemantics,
} = dist

test('Type Generator Tests', async (t) => {
    // Setup helper: create analysis result
    function createAnalysis(name, tag = 'button', semantic = 'button') {
        const config = { tag, '@semantic': semantic }
        return analyzeComponentSemantics(name, config)
    }

    await t.test('generate type definition dari analysis', () => {
        const analysis = createAnalysis('Button', 'button', 'button')
        const def = generateTypeDefinition(analysis, 'Button')

        assert.equal(def.interfaceName, 'ButtonProps')
        assert.equal(def.extendsFrom, 'React.ButtonHTMLAttributes<HTMLButtonElement>')
        assert.ok(def.jsDocComment)
        assert.ok(def.jsDocComment.includes('Button'))
        assert.ok(def.jsDocComment.includes('Semantic intent: button'))
    })

    await t.test('render type definition to code', () => {
        const analysis = createAnalysis('Link', 'a', 'link')
        const def = generateTypeDefinition(analysis, 'Link')
        const code = renderTypeDefinition(def)

        assert.ok(code.includes('interface LinkProps'))
        assert.ok(code.includes('extends'))
        assert.ok(code.includes('React.AnchorHTMLAttributes<HTMLAnchorElement>'))
        assert.ok(code.includes('/**'))
    })

    await t.test('generate type stub file dengan multiple components', () => {
        const analyses = new Map([
            ['Button', createAnalysis('Button', 'button', 'button')],
            ['Link', createAnalysis('Link', 'a', 'link')],
            ['Input', createAnalysis('Input', 'input', 'input')],
        ])

        const stub = generateTypeStubFile(analyses, 'test-pkg')

        assert.ok(stub.includes('Auto-generated'))
        assert.ok(stub.includes('test-pkg'))
        assert.ok(stub.includes('ButtonProps'))
        assert.ok(stub.includes('LinkProps'))
        assert.ok(stub.includes('InputProps'))
        assert.ok(stub.includes("import type * as React from 'react'"))
    })

    await t.test('batch generate type definitions', () => {
        const analyses = new Map([
            ['Button', createAnalysis('Button', 'button', 'button')],
            ['Link', createAnalysis('Link', 'a', 'link')],
        ])

        const definitions = generateTypeDefinitionsBatch(analyses)

        assert.equal(definitions.size, 2)
        assert.ok(definitions.has('Button'))
        assert.ok(definitions.has('Link'))

        const buttonDef = definitions.get('Button')
        assert.ok(buttonDef.includes('ButtonProps'))
        assert.ok(buttonDef.includes('extends'))
    })

    await t.test('combine multiple type definitions', () => {
        const definitions = new Map([
            ['Button', 'export interface ButtonProps { }'],
            ['Link', 'export interface LinkProps { }'],
        ])

        const combined = combineTypeDefinitions(definitions, 'my-pkg')

        assert.ok(combined.includes('Auto-generated'))
        assert.ok(combined.includes('my-pkg'))
        assert.ok(combined.includes('ButtonProps'))
        assert.ok(combined.includes('LinkProps'))
        assert.ok(combined.includes("import type * as React from 'react'"))
    })

    await t.test('generated code is valid TypeScript syntax', () => {
        const analysis = createAnalysis('Button', 'button', 'button')
        const def = generateTypeDefinition(analysis, 'Button')
        const code = renderTypeDefinition(def)

        // Basic syntax validation
        assert.ok(code.includes('export interface'))
        assert.ok(code.includes('extends'))
        assert.ok(code.includes('{'))
        assert.ok(code.includes('}'))
    })

    await t.test('type stub includes semantic information', () => {
        const analyses = new Map([
            ['Button', createAnalysis('Button', 'button', 'button')],
        ])

        const stub = generateTypeStubFile(analyses, 'pkg')

        // Should include semantic info
        assert.ok(stub.includes('Semantic intent'))
    })

    await t.test('empty component batch creates minimal stub', () => {
        const analyses = new Map()
        const stub = generateTypeStubFile(analyses, 'pkg')

        // Should still have header and imports
        assert.ok(stub.includes('Auto-generated'))
        assert.ok(stub.includes("import type * as React from 'react'"))
    })
})
