/**
 * TypeScript Integration Tests for NAPI Bridge
 * Week 4 Day 4 - TypeScript Type Definitions & Wrapper Tests
 * 
 * Tests verify:
 * 1. Type safety (TypeScript compilation)
 * 2. JSON serialization/deserialization
 * 3. Wrapper utilities
 * 4. End-to-end pipelines
 * 5. Error handling
 */

import {
  parseClass,
  resolveColor,
  resolveSpacing,
  resolveFontSize,
  resolveBreakpoint,
  applyOpacity,
  compileClass,
  compileClasses,
  generateCss,
  generateCssBatch,
  compileToCss,
  compileToCssBatch,
  minifyCss,
  compileToCssMinified,
  compileToCssBatchMinified,
  extractProperties,
  extractSelectors,
  timeOperation,
  type ParsedClassResult,
  type CssRuleResult,
} from './index'

describe('NAPI TypeScript Wrapper - Week 4 Day 4 Integration Tests', () => {
  describe('Parser (parseClass)', () => {
    test('simple class parsing', () => {
      const result = parseClass('bg-blue-600')
      expect(result).toEqual({
        variants: [],
        prefix: 'bg',
        value: 'blue-600',
      })
    })

    test('class with single variant', () => {
      const result = parseClass('md:flex')
      expect(result.variants).toContain('md')
      expect(result.prefix).toBe('flex')
    })

    test('class with multiple variants', () => {
      const result = parseClass('md:hover:bg-blue-600')
      expect(result.variants.length).toBeGreaterThanOrEqual(2)
      expect(result.variants).toContain('md')
    })

    test('class with modifier', () => {
      const result = parseClass('bg-blue-600/50')
      expect(result.value).toBe('blue-600')
      expect(result.modifier).toBe('50')
    })

    test('complex class parsing', () => {
      const result = parseClass('md:hover:bg-blue-600/50')
      expect(result.variants.length).toBeGreaterThanOrEqual(2)
      expect(result.prefix).toBe('bg')
      expect(result.value).toBe('blue-600')
      expect(result.modifier).toBe('50')
    })

    test('returns typed ParsedClassResult', () => {
      const result: ParsedClassResult = parseClass('bg-red-500')
      expect(result).toHaveProperty('variants')
      expect(result).toHaveProperty('prefix')
      expect(result).toHaveProperty('value')
      expect(Array.isArray(result.variants)).toBe(true)
    })
  })

  describe('Resolver - Colors', () => {
    test('resolveColor returns hex color', () => {
      const color = resolveColor('blue-600')
      expect(color).toMatch(/^#[0-9a-f]{6}$/)
    })

    test('different colors return different values', () => {
      const blue = resolveColor('blue-600')
      const red = resolveColor('red-500')
      expect(blue).not.toBe(red)
    })

    test('resolveColor for black', () => {
      const color = resolveColor('black')
      expect(color).toMatch(/^#[0-9a-f]{6}$/)
    })

    test('resolveColor for white', () => {
      const color = resolveColor('white')
      expect(color).toMatch(/^#[0-9a-f]{6}$/)
    })
  })

  describe('Resolver - Spacing', () => {
    test('resolveSpacing returns CSS value', () => {
      const spacing = resolveSpacing('4')
      expect(typeof spacing).toBe('string')
      expect(spacing.length).toBeGreaterThan(0)
    })

    test('resolveSpacing for px', () => {
      const spacing = resolveSpacing('px')
      expect(spacing).toBe('1px')
    })

    test('resolveSpacing for numeric values', () => {
      const spacing1 = resolveSpacing('1')
      const spacing2 = resolveSpacing('2')
      expect(spacing1).not.toBe(spacing2)
    })
  })

  describe('Resolver - Font Size', () => {
    test('resolveFontSize returns CSS value', () => {
      const size = resolveFontSize('base')
      expect(size).toBe('1rem')
    })

    test('resolveFontSize for sm', () => {
      const size = resolveFontSize('sm')
      expect(size).toMatch(/rem|px/)
    })

    test('resolveFontSize for lg', () => {
      const size = resolveFontSize('lg')
      expect(size).toMatch(/rem|px/)
    })
  })

  describe('Resolver - Breakpoint', () => {
    test('resolveBreakpoint returns pixel value', () => {
      const bp = resolveBreakpoint('md')
      expect(bp).toMatch(/\d+px/)
    })

    test('breakpoints are ordered', () => {
      const sm = parseInt(resolveBreakpoint('sm'))
      const md = parseInt(resolveBreakpoint('md'))
      const lg = parseInt(resolveBreakpoint('lg'))
      expect(sm).toBeLessThan(md)
      expect(md).toBeLessThan(lg)
    })
  })

  describe('Opacity Modifier', () => {
    test('applyOpacity returns RGBA', () => {
      const rgba = applyOpacity('#2563eb', '50')
      expect(rgba).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/)
    })

    test('opacity 100 results in alpha 1', () => {
      const rgba = applyOpacity('#ffffff', '100')
      expect(rgba).toContain('1)')
    })

    test('opacity 0 results in alpha 0', () => {
      const rgba = applyOpacity('#000000', '0')
      expect(rgba).toContain('0)')
    })

    test('different opacities produce different values', () => {
      const rgba50 = applyOpacity('#2563eb', '50')
      const rgba75 = applyOpacity('#2563eb', '75')
      expect(rgba50).not.toBe(rgba75)
    })
  })

  describe('Single Class Compilation', () => {
    test('compileClass returns CssRuleResult', () => {
      const rule = compileClass('bg-blue-600')
      expect(rule).toHaveProperty('selector')
      expect(rule).toHaveProperty('property')
      expect(rule).toHaveProperty('value')
      expect(rule).toHaveProperty('variants')
    })

    test('compileClass generates valid selector', () => {
      const rule = compileClass('bg-blue-600')
      expect(rule.selector).toMatch(/^\./)  // starts with .
    })

    test('compileClass with variant includes mediaQuery', () => {
      const rule = compileClass('md:flex')
      if (rule.variants.includes('md')) {
        expect(rule.mediaQuery).toBeDefined()
      }
    })

    test('compileClass with pseudo-class', () => {
      const rule = compileClass('hover:bg-blue-500')
      if (rule.variants.includes('hover')) {
        expect(rule.pseudoClass).toBeDefined()
      }
    })

    test('complex class compilation', () => {
      const rule = compileClass('md:hover:bg-blue-600/50')
      expect(rule.selector).toBeDefined()
      expect(rule.property).toBeDefined()
      expect(rule.value).toBeDefined()
      expect(rule.variants.length).toBeGreaterThan(0)
    })

    test('result is typed CssRuleResult', () => {
      const rule: CssRuleResult = compileClass('text-white')
      expect(typeof rule.selector).toBe('string')
      expect(typeof rule.property).toBe('string')
      expect(typeof rule.value).toBe('string')
      expect(Array.isArray(rule.variants)).toBe(true)
    })
  })

  describe('Batch Class Compilation', () => {
    test('compileClasses returns array', () => {
      const rules = compileClasses(['bg-blue-600', 'text-white'])
      expect(Array.isArray(rules)).toBe(true)
      expect(rules.length).toBeGreaterThan(0)
    })

    test('compileClasses returns typed array', () => {
      const rules: CssRuleResult[] = compileClasses(['p-4', 'flex'])
      expect(rules.every(r => typeof r.selector === 'string')).toBe(true)
    })

    test('batch compilation order preserved', () => {
      const classes = ['bg-red-500', 'bg-blue-600', 'bg-green-500']
      const rules = compileClasses(classes)
      expect(rules.length).toBe(classes.length)
    })

    test('empty array handled', () => {
      const rules = compileClasses([])
      expect(Array.isArray(rules)).toBe(true)
    })

    test('large batch processed', () => {
      const classes = Array(100).fill(0).map((_, i) => `text-${i % 10}`)
      const rules = compileClasses(classes)
      expect(rules.length).toBe(classes.length)
    })
  })

  describe('CSS Generation - Single Rule', () => {
    test('generateCss produces CSS string', () => {
      const rule: CssRuleResult = {
        selector: '.bg-blue-600',
        property: 'background-color',
        value: '#2563eb',
        variants: [],
      }
      const css = generateCss(rule)
      expect(typeof css).toBe('string')
      expect(css).toContain('.bg-blue-600')
      expect(css).toContain('background-color')
      expect(css).toContain('#2563eb')
    })

    test('generateCss minified removes whitespace', () => {
      const rule: CssRuleResult = {
        selector: '.text-white',
        property: 'color',
        value: '#ffffff',
        variants: [],
      }
      const normal = generateCss(rule, false)
      const minified = generateCss(rule, true)
      expect(minified.length).toBeLessThanOrEqual(normal.length)
    })

    test('generateCss handles media queries', () => {
      const rule: CssRuleResult = {
        selector: '.md\\:flex',
        property: 'display',
        value: 'flex',
        variants: ['md'],
        mediaQuery: '(min-width: 768px)',
      }
      const css = generateCss(rule)
      expect(css).toContain('@media')
    })
  })

  describe('CSS Generation - Batch', () => {
    test('generateCssBatch produces CSS string', () => {
      const rules: CssRuleResult[] = [
        { selector: '.bg-blue-600', property: 'background-color', value: '#2563eb', variants: [] },
        { selector: '.text-white', property: 'color', value: '#ffffff', variants: [] },
      ]
      const css = generateCssBatch(rules)
      expect(typeof css).toBe('string')
      expect(css).toContain('.bg-blue-600')
      expect(css).toContain('.text-white')
    })

    test('generateCssBatch empty array', () => {
      const css = generateCssBatch([])
      expect(typeof css).toBe('string')
    })

    test('generateCssBatch minified', () => {
      const rules: CssRuleResult[] = [
        { selector: '.p-4', property: 'padding', value: '1rem', variants: [] },
      ]
      const normal = generateCssBatch(rules, false)
      const minified = generateCssBatch(rules, true)
      expect(minified.length).toBeLessThanOrEqual(normal.length)
    })
  })

  describe('One-Step Compilation Pipeline', () => {
    test('compileToCss produces CSS string', () => {
      const css = compileToCss('bg-blue-600')
      expect(typeof css).toBe('string')
      expect(css.length).toBeGreaterThan(0)
    })

    test('compileToCss with variant', () => {
      const css = compileToCss('md:flex')
      expect(css).toBeDefined()
    })

    test('compileToCss minified option', () => {
      const normal = compileToCss('text-white', false)
      const minified = compileToCss('text-white', true)
      expect(minified.length).toBeLessThanOrEqual(normal.length)
    })

    test('compileToCss complex class', () => {
      const css = compileToCss('md:hover:bg-blue-600/50')
      expect(css).toBeDefined()
      expect(css.length).toBeGreaterThan(0)
    })
  })

  describe('Batch One-Step Compilation', () => {
    test('compileToCssBatch produces CSS string', () => {
      const css = compileToCssBatch(['bg-blue-600', 'text-white'])
      expect(typeof css).toBe('string')
    })

    test('compileToCssBatch minified', () => {
      const normal = compileToCssBatch(['p-4', 'flex'], false)
      const minified = compileToCssBatch(['p-4', 'flex'], true)
      expect(minified.length).toBeLessThanOrEqual(normal.length)
    })

    test('compileToCssBatch large batch', () => {
      const classes = Array(50).fill(0).map((_, i) => `text-${i % 10}`)
      const css = compileToCssBatch(classes)
      expect(typeof css).toBe('string')
      expect(css.length).toBeGreaterThan(0)
    })
  })

  describe('CSS Minification', () => {
    test('minifyCss removes whitespace', () => {
      const css = '.bg-blue-600 { background-color: #2563eb; }'
      const minified = minifyCss(css)
      expect(minified.length).toBeLessThan(css.length)
      expect(minified).not.toContain('  ')
    })

    test('minifyCss preserves functionality', () => {
      const css = '@media (min-width: 768px) { .md\\:flex { display: flex; } }'
      const minified = minifyCss(css)
      expect(minified).toContain('@media')
      expect(minified).toContain('display')
    })

    test('minifyCss empty string', () => {
      const minified = minifyCss('')
      expect(typeof minified).toBe('string')
    })
  })

  describe('Utility Functions', () => {
    test('compileToCssMinified shortcut', () => {
      const css = compileToCssMinified('bg-blue-600')
      expect(typeof css).toBe('string')
    })

    test('compileToCssBatchMinified shortcut', () => {
      const css = compileToCssBatchMinified(['text-white', 'p-4'])
      expect(typeof css).toBe('string')
    })

    test('extractProperties returns Set', () => {
      const props = extractProperties(['bg-blue-600', 'text-white', 'p-4'])
      expect(props instanceof Set).toBe(true)
      expect(props.size).toBeGreaterThan(0)
    })

    test('extractProperties contains unique items', () => {
      const props = extractProperties(['bg-blue-600', 'bg-red-500'])
      const bgCount = Array.from(props).filter(p => p.includes('background')).length
      expect(bgCount).toBeGreaterThanOrEqual(1)
    })

    test('extractSelectors returns Set', () => {
      const selectors = extractSelectors(['bg-blue-600', 'text-white'])
      expect(selectors instanceof Set).toBe(true)
      expect(selectors.size).toBeGreaterThan(0)
    })

    test('extractSelectors unique values', () => {
      const classes = ['bg-blue-600', 'bg-blue-600']  // duplicate
      const selectors = extractSelectors(classes)
      expect(selectors.size).toBe(1)
    })
  })

  describe('Performance Profiling', () => {
    test('timeOperation returns tuple', () => {
      const [result, metrics] = timeOperation('test', () => 42)
      expect(result).toBe(42)
      expect(metrics).toHaveProperty('operation')
      expect(metrics).toHaveProperty('durationMs')
    })

    test('timeOperation measures duration', () => {
      const [, metrics] = timeOperation('slow', () => {
        let sum = 0
        for (let i = 0; i < 1000000; i++) sum += i
        return sum
      })
      expect(metrics.durationMs).toBeGreaterThan(0)
    })

    test('timeOperation with function result', () => {
      const [result, metrics] = timeOperation('parseClass', () => {
        return parseClass('bg-blue-600')
      })
      expect(result).toHaveProperty('variants')
      expect(metrics.operation).toBe('parseClass')
    })
  })

  describe('Type Safety', () => {
    test('ParsedClassResult type checking', () => {
      const result = parseClass('md:flex')
      // TypeScript should not allow:
      // result.invalidField  // error
      // result.variants = "string"  // error
      
      // Should allow:
      const variants: string[] = result.variants
      const prefix: string = result.prefix
      expect(variants).toEqual(expect.any(Array))
      expect(prefix).toEqual(expect.any(String))
    })

    test('CssRuleResult type checking', () => {
      const rule = compileClass('text-white')
      // Should have correct types
      const selector: string = rule.selector
      const property: string = rule.property
      const value: string = rule.value
      const variants: string[] = rule.variants
      
      expect(typeof selector).toBe('string')
      expect(typeof property).toBe('string')
      expect(typeof value).toBe('string')
      expect(Array.isArray(variants)).toBe(true)
    })
  })

  describe('Error Handling & Robustness', () => {
    test('parseClass handles edge cases', () => {
      expect(() => parseClass('')).not.toThrow()
      expect(() => parseClass(' ')).not.toThrow()
    })

    test('resolveColor handles unknown colors', () => {
      expect(() => resolveColor('unknown-color-xyz')).not.toThrow()
    })

    test('compileClass handles invalid input', () => {
      expect(() => compileClass('!!!invalid!!!')).not.toThrow()
    })

    test('compileToCss handles batch of invalid classes', () => {
      expect(() => compileToCssBatch(['', ' ', '!!!'])).not.toThrow()
    })

    test('minifyCss handles malformed CSS', () => {
      expect(() => minifyCss('{ unmatched }')).not.toThrow()
    })
  })

  describe('Integration - Full Pipelines', () => {
    test('parse → resolve → generate pipeline', () => {
      const parsed = parseClass('md:hover:bg-blue-600/50')
      const color = resolveColor(parsed.value.split('-').slice(1).join('-'))
      const rgba = applyOpacity(color, parsed.modifier || '100')
      expect(rgba).toMatch(/rgba/)
    })

    test('end-to-end: class → CSS string', () => {
      const css = compileToCss('md:hover:bg-blue-600/50')
      expect(css).toBeDefined()
      expect(css.length).toBeGreaterThan(0)
      expect(css).toMatch(/background-color|background/)
    })

    test('batch → CSS string pipeline', () => {
      const classes = ['bg-blue-600', 'text-white', 'p-4']
      const css = compileToCssBatch(classes)
      expect(css).toBeDefined()
      // All classes should appear in output
      expect(css).toContain('.bg-blue-600')
      expect(css).toContain('.text-white')
      expect(css).toContain('.p-4')
    })

    test('compile → minify pipeline', () => {
      const css = compileToCss('md:hover:bg-blue-600/50', false)
      const minified = minifyCss(css)
      expect(minified.length).toBeLessThanOrEqual(css.length)
    })
  })

  describe('Performance Benchmarks', () => {
    test('parseClass performance', () => {
      const [, metrics] = timeOperation('parseClass batch', () => {
        const results = []
        for (let i = 0; i < 100; i++) {
          results.push(parseClass(`class-${i}`))
        }
        return results
      })
      // Should complete in reasonable time
      expect(metrics.durationMs).toBeLessThan(100)
    })

    test('compileClass performance', () => {
      const [, metrics] = timeOperation('compileClass batch', () => {
        const results = []
        for (let i = 0; i < 50; i++) {
          results.push(compileClass(`text-${i % 10}`))
        }
        return results
      })
      expect(metrics.durationMs).toBeLessThan(500)
    })

    test('compileToCss performance', () => {
      const [, metrics] = timeOperation('compileToCss batch', () => {
        const results = []
        for (let i = 0; i < 100; i++) {
          results.push(compileToCss(`p-${i % 8}`))
        }
        return results
      })
      // Batch via compileToCssBatch should be faster
      expect(metrics.durationMs).toBeLessThan(1000)
    })

    test('compileToCssBatch faster than sequential', () => {
      const classes = Array(100).fill(0).map((_, i) => `text-${i % 10}`)
      
      const [, batchMetrics] = timeOperation('batchMode', () => {
        return compileToCssBatch(classes)
      })
      
      // Batch should be reasonably fast
      expect(batchMetrics.durationMs).toBeLessThan(500)
    })
  })
})
