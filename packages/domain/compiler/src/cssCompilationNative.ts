/**
 * cssCompilationNative.ts
 *
 * Phase 5.2: Advanced CSS Compilation - Complex CSS generation and transformations
 * Exposes 12 CSS compilation functions for animations, themes, and merging
 */

import { getNativeBridge } from "./nativeBridge"

/**
 * Compiled CSS rule result
 */
export interface CompiledCssRule {
  selector: string
  declarations: string
  properties: Array<{ key: string; value: string }>
  specificity: number
  source?: { file: string; line: number; column: number }
}

/**
 * Compiled animation result
 */
export interface CompiledAnimation {
  animation_id: string
  keyframes_css: string
  animation_rule: string
  duration_ms: number
}

/**
 * Compiled theme result
 */
export interface CompiledTheme {
  selector: string
  variables: Array<{ name: string; value: string }>
  variables_css: string
  theme_name: string
}

/**
 * CSS compile result with metadata
 */
export interface CssCompileResult {
  css: string
  resolved_classes: string[]
  unknown_classes: string[]
  size_bytes: number
  duration_ms: number
}

/**
 * tw_merge options
 */
export interface TwMergeOptions {
  separator?: string
  debug?: boolean
}

/**
 * Compile a single Tailwind class to CSS rule
 * Full compilation pipeline: parse → resolve → generate
 *
 * @param input - Single Tailwind class (e.g., "md:hover:bg-blue-600/50")
 * @returns Compiled CSS rule as JSON
 *
 * @example
 * ```ts
 * const rule = compileClass('md:hover:bg-blue-600')
 * // Returns: {
 * //   selector: '.md\\:hover\\:bg-blue-600',
 * //   declarations: 'background-color: #2563eb;',
 * //   ...
 * // }
 * ```
 */
export function compileClass(input: string): CompiledCssRule {
  const native = getNativeBridge()
  if (!native?.compile_class) throw new Error("compile_class not available")
  const resultJson = native.compile_class(input)
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      selector: "",
      declarations: "",
      properties: [],
      specificity: 0,
    }
  }
}

/**
 * Compile multiple Tailwind classes to CSS rules
 * Batch processing with parallel compilation
 *
 * @param inputs - Array of Tailwind classes
 * @returns JSON string of compiled rules
 *
 * @example
 * ```ts
 * const rules = compileClasses(['px-4', 'bg-blue-600', 'hover:opacity-80'])
 * ```
 */
export function compileClasses(inputs: string[]): CssCompileResult {
  const native = getNativeBridge()
  if (!native?.compile_classes) throw new Error("compile_classes not available")
  const resultJson = native.compile_classes(inputs)
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      css: "",
      resolved_classes: [],
      unknown_classes: [],
      size_bytes: 0,
      duration_ms: 0,
    }
  }
}

/**
 * One-step: class → CSS string
 * Compiles and generates in single call
 *
 * @param input - Single Tailwind class
 * @param minify - Whether to minify output (default: false)
 * @returns Generated CSS string
 *
 * @example
 * ```ts
 * const css = compileToCss('bg-blue-600')
 * // Returns: ".bg-blue-600 { background-color: #2563eb; }"
 *
 * const minified = compileToCss('bg-blue-600', true)
 * // Returns: ".bg-blue-600{background-color:#2563eb}"
 * ```
 */
export function compileToCss(input: string, minify?: boolean): string {
  const native = getNativeBridge()
  if (!native?.compile_to_css) throw new Error("compile_to_css not available")
  return native.compile_to_css(input, minify ?? false)
}

/**
 * Batch compile to CSS
 * Compiles multiple classes and generates combined CSS
 *
 * @param inputs - Array of Tailwind classes
 * @param minify - Whether to minify output
 * @returns Combined CSS string
 *
 * @example
 * ```ts
 * const css = compileToCssBatch(['px-4', 'bg-blue-600'], true)
 * ```
 */
export function compileToCssBatch(inputs: string[], minify?: boolean): string {
  const native = getNativeBridge()
  if (!native?.compile_to_css_batch) throw new Error("compile_to_css_batch not available")
  return native.compile_to_css_batch(inputs, minify ?? false)
}

/**
 * Minify CSS string
 * Removes unnecessary whitespace and formatting
 *
 * @param css - Raw CSS string
 * @returns Minified CSS (40-60% size reduction)
 *
 * @example
 * ```ts
 * const css = ".px-4 { padding-left: 1rem; padding-right: 1rem; }"
 * const minified = minifyCss(css)
 * // Returns: ".px-4{padding-left:1rem;padding-right:1rem}"
 * ```
 */
export function minifyCss(css: string): string {
  const native = getNativeBridge()
  if (!native?.minify_css) throw new Error("minify_css not available")
  return native.minify_css(css)
}

/**
 * Compile animation from from/to states
 * Generates @keyframes and animation rule
 *
 * @param animationName - Animation name
 * @param from - From state classes (e.g., "opacity-0 scale-95")
 * @param to - To state classes (e.g., "opacity-100 scale-100")
 * @returns Compiled animation with keyframes
 *
 * @example
 * ```ts
 * const anim = compileAnimation('fade-in', 'opacity-0', 'opacity-100')
 * console.log(anim.keyframes_css)  // @keyframes fade-in { ... }
 * console.log(anim.animation_rule) // animation: fade-in 300ms;
 * ```
 */
export function compileAnimation(
  animationName: string,
  from: string,
  to: string
): CompiledAnimation {
  const native = getNativeBridge()
  if (!native?.compile_animation) throw new Error("compile_animation not available")
  const resultJson = native.compile_animation(animationName, from, to)
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      animation_id: "",
      keyframes_css: "",
      animation_rule: "",
      duration_ms: 0,
    }
  }
}

/**
 * Compile keyframes from stop definitions
 * Creates @keyframes from percentage stops
 *
 * @param name - Keyframes name
 * @param stopsJson - JSON array of stops: `[{"stop":"0%","classes":"opacity-0"}...]`
 * @returns Compiled @keyframes rule
 *
 * @example
 * ```ts
 * const kf = compileKeyframes('slide-in', JSON.stringify([
 *   { stop: '0%', classes: 'translate-x-full' },
 *   { stop: '100%', classes: 'translate-x-0' }
 * ]))
 * ```
 */
export function compileKeyframes(name: string, stopsJson: string): CompiledAnimation {
  const native = getNativeBridge()
  if (!native?.compile_keyframes) throw new Error("compile_keyframes not available")
  const resultJson = native.compile_keyframes(name, stopsJson)
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      animation_id: "",
      keyframes_css: "",
      animation_rule: "",
      duration_ms: 0,
    }
  }
}

/**
 * Compile theme to CSS variables
 * Converts token map to CSS custom properties
 *
 * @param tokensJson - Theme tokens as JSON
 * @param themeName - Theme name ("light", "dark", etc.)
 * @param prefix - CSS variable prefix (e.g., "tw" → "--tw-color-primary")
 * @returns Compiled theme with variables CSS
 *
 * @example
 * ```ts
 * const theme = compileTheme(
 *   JSON.stringify({ colors: { blue: { 600: '#2563eb' } } }),
 *   'light',
 *   'tw'
 * )
 * // Returns CSS: :root { --tw-color-blue-600: #2563eb; }
 * ```
 */
export function compileTheme(
  tokensJson: string,
  themeName: string,
  prefix: string
): CompiledTheme {
  const native = getNativeBridge()
  if (!native?.compile_theme) throw new Error("compile_theme not available")
  const resultJson = native.compile_theme(tokensJson, themeName, prefix)
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      selector: ":root",
      variables: [],
      variables_css: "",
      theme_name: themeName,
    }
  }
}

/**
 * Merge conflicting Tailwind classes
 * Resolves conflicts intelligently (last-one-wins by default)
 *
 * @param classString - Space-separated class string (e.g., "px-4 px-8 bg-red-500 bg-blue-600")
 * @returns Merged classes with conflicts resolved
 *
 * @example
 * ```ts
 * const merged = twMerge('px-4 px-8 bg-red-500 bg-blue-600')
 * // Returns: "px-8 bg-blue-600"
 * ```
 */
export function twMerge(classString: string): string {
  const native = getNativeBridge()
  if (!native?.tw_merge) throw new Error("tw_merge not available")
  return native.tw_merge(classString)
}

/**
 * Merge multiple class strings
 * Combines and resolves conflicts across multiple strings
 *
 * @param classStrings - Array of class strings
 * @returns Merged result
 *
 * @example
 * ```ts
 * const merged = twMergeMany([
 *   'px-4 hover:bg-blue-600',
 *   'px-8 hover:opacity-80'
 * ])
 * // Returns: "px-8 hover:bg-blue-600 hover:opacity-80"
 * ```
 */
export function twMergeMany(classStrings: string[]): string {
  const native = getNativeBridge()
  if (!native?.tw_merge_many) throw new Error("tw_merge_many not available")
  return native.tw_merge_many(classStrings)
}

/**
 * Merge with custom separator
 * Useful for non-standard class separators
 *
 * @param classString - Classes to merge
 * @param options - Merge options (separator, debug)
 * @returns Merged classes
 *
 * @example
 * ```ts
 * const merged = twMergeWithSeparator(
 *   'px-4,px-8,bg-red-500,bg-blue-600',
 *   { separator: ',' }
 * )
 * ```
 */
export function twMergeWithSeparator(
  classString: string,
  options: TwMergeOptions
): string {
  const native = getNativeBridge()
  if (!native?.tw_merge_with_separator)
    throw new Error("tw_merge_with_separator not available")
  const opts = {
    separator: options.separator,
    debug: options.debug,
  }
  return native.tw_merge_with_separator(classString, opts)
}

/**
 * Merge many with custom separator
 * Batch merge with custom separator
 *
 * @param classStrings - Array of class strings
 * @param options - Merge options
 * @returns Merged result
 */
export function twMergeManyWithSeparator(
  classStrings: string[],
  options: TwMergeOptions
): string {
  const native = getNativeBridge()
  if (!native?.tw_merge_many_with_separator)
    throw new Error("tw_merge_many_with_separator not available")
  const opts = {
    separator: options.separator,
    debug: options.debug,
  }
  return native.tw_merge_many_with_separator(classStrings, opts)
}

/**
 * Raw merge from class lists
 * Direct merge without preprocessing
 *
 * @param classLists - Array of class lists
 * @returns Merged classes
 *
 * @example
 * ```ts
 * const merged = twMergeRaw(['px-4 px-8', 'bg-red bg-blue'])
 * ```
 */
export function twMergeRaw(classLists: string[]): string {
  const native = getNativeBridge()
  if (!native?.tw_merge_raw) throw new Error("tw_merge_raw not available")
  return native.tw_merge_raw(classLists)
}
