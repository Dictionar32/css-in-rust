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
    console.warn('[compiler/tests] dist not found, skipping semantic analyzer tests')
    process.exit(0)
}

const {
    analyzeComponentSemantics,
    extractSemanticMetadata,
    getAriaRoleForSemantic,
    analyzeComponentBatch,
    validateSemanticMetadata,
} = dist

test('Semantic Analyzer Tests', async (t) => {
    await t.test('extract metadata dari component config', () => {
        const config = {
            tag: 'button',
            '@semantic': 'button',
            '@aria': { role: 'button' },
            '@state': { active: 'aria-pressed' },
            variants: {},
        }

        const metadata = extractSemanticMetadata(config)

        assert.equal(metadata['@semantic'], 'button')
        assert.deepEqual(metadata['@aria'], { role: 'button' })
        assert.deepEqual(metadata['@state'], { active: 'aria-pressed' })
    })

    await t.test('analyze component semantics dengan explicit @semantic', () => {
        const config = {
            tag: 'button',
            '@semantic': 'button',
        }

        const result = analyzeComponentSemantics('MyButton', config)

        assert.equal(result.componentName, 'MyButton')
        assert.equal(result.tag, 'button')
        assert.equal(result.semantic, 'button')
        assert.equal(result.metadata['@semantic'], 'button')
    })

    await t.test('infer semantic dari HTML tag jika @semantic missing', () => {
        const config = {
            tag: 'a',
            // No @semantic provided
        }

        const result = analyzeComponentSemantics('MyLink', config)

        assert.equal(result.semantic, 'link', 'Should infer link dari tag: a')
    })

    await t.test('default ke div untuk unknown tags', () => {
        const config = {
            tag: 'custom-element',
        }

        const result = analyzeComponentSemantics('Custom', config)

        assert.equal(result.semantic, 'custom')
    })

    await t.test('extract state properties ke Map', () => {
        const config = {
            tag: 'input',
            '@semantic': 'input',
            '@state': {
                disabled: 'aria-disabled',
                required: 'aria-required',
            },
        }

        const result = analyzeComponentSemantics('Input', config)

        assert.equal(result.stateProperties.size, 2)
        assert.equal(result.stateProperties.get('disabled'), 'aria-disabled')
        assert.equal(result.stateProperties.get('required'), 'aria-required')
    })

    await t.test('get ARIA role untuk semantic intent', () => {
        assert.equal(getAriaRoleForSemantic('button'), 'button')
        assert.equal(getAriaRoleForSemantic('link'), 'link')
        assert.equal(getAriaRoleForSemantic('checkbox'), 'checkbox')
        assert.equal(getAriaRoleForSemantic('input'), 'textbox')
        assert.equal(getAriaRoleForSemantic('paragraph'), undefined, 'paragraph tidak perlu explicit role')
    })

    await t.test('validate semantic metadata', () => {
        // Valid metadata
        const validMeta = {
            '@semantic': 'button',
            '@aria': { role: 'button' },
            '@state': { active: 'aria-pressed' },
        }
        const validIssues = validateSemanticMetadata(validMeta)
        assert.equal(validIssues.length, 0, 'Valid metadata should have no issues')

        // Invalid @semantic value
        const invalidSemantic = {
            '@semantic': 'invalid-semantic',
        }
        const semanticIssues = validateSemanticMetadata(invalidSemantic)
        assert.ok(semanticIssues.length > 0, 'Invalid @semantic should have issues')
    })

    await t.test('batch analyze multiple components', () => {
        const components = new Map([
            ['Button', { tag: 'button', '@semantic': 'button' }],
            ['Link', { tag: 'a', '@semantic': 'link' }],
            ['Input', { tag: 'input' }],
        ])

        const results = analyzeComponentBatch(components)

        assert.equal(results.size, 3)
        assert.ok(results.has('Button'))
        assert.ok(results.has('Link'))
        assert.ok(results.has('Input'))

        assert.equal(results.get('Button').semantic, 'button')
        assert.equal(results.get('Link').semantic, 'link')
        assert.equal(results.get('Input').semantic, 'input')
    })

    await t.test('component dengan missing @semantic tetap analyzed', () => {
        const config = {
            tag: 'nav',
            // No @semantic
        }

        const result = analyzeComponentSemantics('Navigation', config)

        assert.equal(result.semantic, 'navigation', 'Should infer dari tag')
        assert.ok(!result.metadata['@semantic'], 'No explicit @semantic')
    })

    await t.test('empty component batch', () => {
        const components = new Map()
        const results = analyzeComponentBatch(components)

        assert.equal(results.size, 0)
    })
})
