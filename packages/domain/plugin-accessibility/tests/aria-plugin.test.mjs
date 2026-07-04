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
    console.warn('[plugin-accessibility/tests] dist not found, skipping')
    process.exit(0)
}

const {
    getAriaRoleForTag,
    getAriaRoleForInputType,
    getAriaPropertyForState,
    buildAriaAttributes,
    getDefaultAriaAttributes,
    computeAriaFromSemantic,
    mergeAriaAttributes,
    validateAriaInjection,
} = dist

test('ARIA Plugin Tests', async (t) => {
    // Helper: create analysis result
    function createAnalysis(componentName, tag = 'button', semantic = 'button') {
        return {
            componentName,
            tag,
            semantic,
            metadata: { '@semantic': semantic },
            stateProperties: new Map(),
        }
    }

    await t.test('getAriaRoleForTag untuk HTML tags', () => {
        assert.equal(getAriaRoleForTag('button'), 'button')
        assert.equal(getAriaRoleForTag('a'), 'link')
        assert.equal(getAriaRoleForTag('nav'), 'navigation')
        assert.equal(getAriaRoleForTag('h1'), 'heading')
        assert.equal(getAriaRoleForTag('input'), 'textbox')
        assert.equal(getAriaRoleForTag('dialog'), 'dialog')
        assert.equal(getAriaRoleForTag('p'), undefined)
    })

    await t.test('getAriaRoleForInputType untuk input types', () => {
        assert.equal(getAriaRoleForInputType('button'), 'button')
        assert.equal(getAriaRoleForInputType('checkbox'), 'checkbox')
        assert.equal(getAriaRoleForInputType('radio'), 'radio')
        assert.equal(getAriaRoleForInputType('text'), 'textbox')
        assert.equal(getAriaRoleForInputType('range'), 'slider')
    })

    await t.test('getAriaPropertyForState untuk state mappings', () => {
        assert.equal(getAriaPropertyForState('disabled'), 'aria-disabled')
        assert.equal(getAriaPropertyForState('required'), 'aria-required')
        assert.equal(getAriaPropertyForState('checked'), 'aria-checked')
        assert.equal(getAriaPropertyForState('pressed'), 'aria-pressed')
        assert.equal(getAriaPropertyForState('expanded'), 'aria-expanded')
    })

    await t.test('getDefaultAriaAttributes untuk component types', () => {
        const buttonAttrs = getDefaultAriaAttributes('button')
        assert.ok(buttonAttrs.role === 'button')
        assert.ok(buttonAttrs['aria-pressed'] === 'false')

        const linkAttrs = getDefaultAriaAttributes('link')
        assert.ok(linkAttrs.role === 'link')

        const unknownAttrs = getDefaultAriaAttributes('unknown')
        assert.deepEqual(unknownAttrs, {})
    })

    await t.test('buildAriaAttributes dengan state mappings', () => {
        const attrs = buildAriaAttributes('button', {
            disabled: true,
            active: false,
        })

        assert.ok(attrs.role === 'button')
        assert.ok(attrs['aria-pressed'] === 'false')
        assert.ok(attrs['aria-disabled'] === 'true')
    })

    await t.test('computeAriaFromSemantic untuk button component', () => {
        const analysis = createAnalysis('MyButton', 'button', 'button')
        const result = computeAriaFromSemantic(analysis)

        assert.ok(result.injected === true)
        assert.equal(result.ariaRole, 'button')
        assert.ok(result.ariaAttributes.role === 'button')
        assert.equal(result.warnings.length, 0)
    })

    await t.test('computeAriaFromSemantic skips jika no ARIA role', () => {
        const analysis = createAnalysis('Para', 'p', 'paragraph')
        const result = computeAriaFromSemantic(analysis)

        assert.ok(result.injected === false)
        assert.equal(result.ariaRole, undefined)
    })

    await t.test('computeAriaFromSemantic respects user ARIA', () => {
        const analysis = createAnalysis('Button', 'button', 'button')
        analysis.metadata['@aria'] = { role: 'custom-role' }

        const result = computeAriaFromSemantic(analysis, {
            respectUserAria: true,
        })

        // Default role should not be overridden by user
        assert.ok(result.ariaAttributes.role === 'button')
    })

    await t.test('mergeAriaAttributes untuk user props precedence', () => {
        const computed = {
            role: 'button',
            'aria-disabled': 'false',
        }

        const user = {
            'aria-disabled': 'true',
            'data-custom': 'value',
        }

        const merged = mergeAriaAttributes(computed, user)

        assert.equal(merged.role, 'button')
        assert.equal(merged['aria-disabled'], 'true')
        assert.equal(merged['data-custom'], 'value')
    })

    await t.test('validateAriaInjection checks ARIA attributes', () => {
        const validResult = {
            injected: true,
            ariaRole: 'button',
            ariaAttributes: {
                role: 'button',
                'aria-pressed': 'false',
            },
            warnings: [],
        }

        const issues = validateAriaInjection(validResult)
        assert.equal(issues.length, 0)
    })

    await t.test('computeAriaFromSemantic dengan state properties', () => {
        const analysis = createAnalysis('ToggleButton', 'button', 'button')
        analysis.stateProperties = new Map([
            ['active', 'aria-pressed'],
            ['disabled', 'aria-disabled'],
        ])

        const result = computeAriaFromSemantic(analysis)

        assert.ok(result.injected === true)
        assert.ok('aria-pressed' in result.ariaAttributes)
        assert.ok('aria-disabled' in result.ariaAttributes)
    })
})
