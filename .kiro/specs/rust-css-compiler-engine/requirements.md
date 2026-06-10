# Requirements Document: Rust CSS Compiler Engine

## Introduction

This specification defines requirements for implementing a high-performance Rust-based CSS compiler to replace the Tailwind CSS v4 JavaScript engine. The current implementation compiles CSS from Tailwind class lists in ~150ms per pipeline execution. The Rust compiler aims to achieve 40-60% performance improvement while maintaining 99% feature parity with Tailwind v4 CSS output. This engine will be exposed via NAPI bindings to enable seamless integration with the existing Node.js/TypeScript ecosystem.

## Glossary

- **CSS_Compiler**: The Rust module responsible for transforming Tailwind class lists into valid CSS rules
- **Class_Parser**: Component that tokenizes and normalizes Tailwind class syntax (e.g., `hover:bg-blue-600/50`)
- **Theme_Resolver**: Component that resolves class values from the Tailwind theme configuration
- **CSS_Generator**: Component that builds CSS rules with proper selectors, properties, and media queries
- **Variant_System**: Component that handles responsive prefixes, state modifiers (`:hover`, `:focus`), etc.
- **Arbitrary_Value**: Custom inline values specified using bracket notation (e.g., `[width:123px]`)
- **NAPI_Binding**: Node API bridge exposing Rust functions to JavaScript/TypeScript
- **CSS_Parity**: Output CSS that exactly matches Tailwind v4 CSS generation for the same class inputs
- **Theme_Config**: JSON object containing Tailwind theme values (colors, spacing, sizes, etc.)
- **Modifier**: A suffix that modifies a class value (e.g., `/50` in `bg-blue-600/50` means 50% opacity)
- **Responsive_Prefix**: A prefix triggering media queries (e.g., `md:`, `lg:`)
- **State_Variant**: A selector modifier for user interactions (e.g., `hover:`, `focus:`, `active:`)

---

## Requirements

### Requirement 1: Parse Tailwind Class Syntax

**User Story:** As a developer, I want the CSS compiler to accurately parse all Tailwind v4 class syntax variations, so that diverse class specifications can be compiled into correct CSS.

#### Acceptance Criteria

1. WHEN a class string like `px-4` is provided, THE Class_Parser SHALL tokenize it into prefix `px` and value `4`
2. WHEN a class with variant like `hover:bg-blue-600` is provided, THE Class_Parser SHALL extract variant `hover`, prefix `bg`, value `blue-600`
3. WHEN a class with opacity modifier like `bg-blue-600/50` is provided, THE Class_Parser SHALL parse it into prefix `bg`, value `blue-600`, modifier `50`
4. WHEN a class with multiple variants like `md:hover:bg-red-500` is provided, THE Class_Parser SHALL extract all variants in order: `md`, `hover` and properties `bg`, `red-500`
5. WHEN an arbitrary value like `[width:123px]` is provided, THE Class_Parser SHALL recognize it as an arbitrary value and extract the CSS declaration `width: 123px`
6. WHEN a complex class like `dark:md:hover:ring-2/75` is provided, THE Class_Parser SHALL parse all variants (`dark`, `md`, `hover`), prefix (`ring`), value (`2`), and modifier (`75`)
7. WHEN an invalid class syntax is provided, THE Class_Parser SHALL return an error indicating the malformed class

#### Correctness Properties

1. **Round-trip parsing**: For any valid Tailwind class, parsing then reconstructing SHALL produce the original class structure
2. **Variant order preservation**: The order of variants in the input SHALL be preserved in the parsed output
3. **No data loss**: All components (prefix, value, variant, modifier) SHALL be extractable from parsed output

---

### Requirement 2: Resolve Class Values from Theme Configuration

**User Story:** As a developer, I want the CSS compiler to resolve class values using the Tailwind theme configuration, so that custom theme colors and values are correctly applied.

#### Acceptance Criteria

1. WHEN a class `bg-blue-600` is provided with theme config containing colors, THE Theme_Resolver SHALL look up `blue.600` and return its hex value
2. WHEN a class `px-4` is provided with theme config containing spacing, THE Theme_Resolver SHALL look up `spacing.4` and return its size value (e.g., `1rem`)
3. WHEN a class references a custom theme value like `bg-brand-primary`, THE Theme_Resolver SHALL resolve it from theme config if defined, otherwise return error
4. WHEN a theme value is nested like `colors.gray.50`, THE Theme_Resolver SHALL traverse the nested structure and return the leaf value
5. WHEN an arbitrary value `[width:100px]` is provided, THE Theme_Resolver SHALL bypass theme lookup and use the literal value
6. WHERE custom theme values are defined in project config, THE Theme_Resolver SHALL use project values over Tailwind defaults
7. WHEN a theme value cannot be resolved, THE Theme_Resolver SHALL return a descriptive error with the missing key

#### Correctness Properties

1. **Theme lookup accuracy**: For every standard Tailwind class, Theme_Resolver output SHALL match Tailwind CSS's internal theme resolution
2. **Nested path traversal**: Nested theme objects SHALL be correctly traversed using dot notation
3. **Arbitrary value bypass**: Arbitrary values SHALL never trigger theme lookups and SHALL use literal values

---

### Requirement 3: Generate CSS Rules from Parsed Classes

**User Story:** As a developer, I want the CSS compiler to generate valid CSS rules that match Tailwind v4 output exactly, so that styling behavior is consistent.

#### Acceptance Criteria

1. WHEN a parsed class `px-4` is processed, THE CSS_Generator SHALL generate `.px-4 { padding-left: 1rem; padding-right: 1rem; }`
2. WHEN a class with state variant `hover:bg-red-500` is processed, THE CSS_Generator SHALL generate `.hover\:bg-red-500:hover { background-color: #ef4444; }`
3. WHEN a class with responsive variant `md:text-lg` is processed, THE CSS_Generator SHALL generate a media query `@media (min-width: 768px) { .md\:text-lg { font-size: 1.125rem; } }`
4. WHEN a class with opacity `bg-blue-600/50` is processed, THE CSS_Generator SHALL apply opacity modification to the generated color
5. WHEN multiple variants are present like `dark:md:hover:bg-white`, THE CSS_Generator SHALL generate nested selectors combining all variants
6. WHEN an arbitrary value `[border:2px_solid]` is processed, THE CSS_Generator SHALL generate `.\\[border\\:2px_solid\\] { border: 2px solid; }`
7. WHEN a class list is provided, THE CSS_Generator SHALL avoid duplicate rules and group related rules efficiently

#### Correctness Properties

1. **CSS spec compliance**: Generated CSS SHALL be valid according to CSS 2.1+ specifications
2. **Selector escaping**: Special characters in class names SHALL be properly escaped in CSS selectors
3. **Property generation**: CSS property names and values SHALL match standard Tailwind v4 output exactly
4. **Media query correctness**: Breakpoint values and media query conditions SHALL match Tailwind configuration
5. **Specificity parity**: Generated selector specificity SHALL match Tailwind v4 output for same class inputs

---

### Requirement 4: Handle All Tailwind Responsive Variants

**User Story:** As a developer, I want all responsive breakpoints (sm, md, lg, xl, 2xl) to generate correct media queries, so that responsive designs work as expected.

#### Acceptance Criteria

1. WHEN a class `sm:px-2` is processed, THE Variant_System SHALL generate media query `@media (min-width: 640px)`
2. WHEN a class `md:py-4` is processed, THE Variant_System SHALL generate media query `@media (min-width: 768px)`
3. WHEN a class `lg:text-xl` is processed, THE Variant_System SHALL generate media query `@media (min-width: 1024px)`
4. WHEN a class `xl:gap-6` is processed, THE Variant_System SHALL generate media query `@media (min-width: 1280px)`
5. WHEN a class `2xl:rounded-lg` is processed, THE Variant_System SHALL generate media query `@media (min-width: 1536px)`
6. WHERE custom breakpoints are defined in config, THE Variant_System SHALL use custom breakpoint values
7. WHEN a responsive prefix is unknown or invalid, THE Variant_System SHALL return error

#### Correctness Properties

1. **Breakpoint mapping accuracy**: All responsive prefixes SHALL map to their exact configured breakpoint values
2. **Media query format**: Generated media queries SHALL follow standard CSS syntax
3. **Custom breakpoint support**: Custom breakpoint configuration SHALL override Tailwind defaults
4. **Breakpoint precedence**: When multiple responsive classes conflict, later breakpoints SHALL take precedence

---

### Requirement 5: Handle All State Variants

**User Story:** As a developer, I want state variants (hover, focus, active, disabled, etc.) to generate correct CSS pseudo-classes, so that interactive styling works correctly.

#### Acceptance Criteria

1. WHEN a class `hover:bg-blue-500` is processed, THE Variant_System SHALL generate `:hover` pseudo-class
2. WHEN a class `focus:ring-2` is processed, THE Variant_System SHALL generate `:focus` pseudo-class
3. WHEN a class `active:scale-95` is processed, THE Variant_System SHALL generate `:active` pseudo-class
4. WHEN a class `disabled:opacity-50` is processed, THE Variant_System SHALL generate `:disabled` pseudo-class
5. WHEN a class `group-hover:text-white` is processed, THE Variant_System SHALL generate `.group:hover &` selector context
6. WHEN a class `peer-focus:border-blue-500` is processed, THE Variant_System SHALL generate `.peer:focus ~ &` selector context
7. WHEN an unknown state variant is provided, THE Variant_System SHALL return error

#### Correctness Properties

1. **Pseudo-class accuracy**: All state variants SHALL map to correct CSS pseudo-classes
2. **Selector nesting**: Group and peer variants SHALL generate correct sibling/parent-child selectors
3. **Variant combination**: Multiple state variants in one class SHALL combine correctly
4. **Standard compliance**: Generated pseudo-classes SHALL be valid CSS 2.1+ selectors

---

### Requirement 6: Handle Dark Mode and Other Color Scheme Variants

**User Story:** As a developer, I want dark mode and color scheme variants to generate correct media queries and selectors, so that theme switching works properly.

#### Acceptance Criteria

1. WHEN a class `dark:bg-gray-900` is processed, THE Variant_System SHALL generate selector using `prefers-color-scheme: dark` or class-based approach matching config
2. WHEN theme uses class-based dark mode (e.g., `.dark`), THE Variant_System SHALL prepend `.dark` to selector
3. WHEN theme uses media-based dark mode, THE Variant_System SHALL generate `@media (prefers-color-scheme: dark)`
4. WHEN a class combines responsive and dark `md:dark:bg-black`, THE Variant_System SHALL nest media queries correctly
5. WHEN a class uses `light:text-gray-900`, THE Variant_System SHALL generate appropriate light mode selector
6. WHERE dark mode is disabled in config, THE Variant_System SHALL skip dark variant processing

#### Correctness Properties

1. **Dark mode strategy**: Generated selectors SHALL respect the configured dark mode strategy (class vs media)
2. **Media query nesting**: When combining responsive and color scheme variants, media queries SHALL nest correctly
3. **Config consistency**: Dark mode behavior SHALL match project's tailwind.config settings

---

### Requirement 7: Support Opacity/Color Modifiers

**User Story:** As a developer, I want opacity modifiers (e.g., `/50`, `/75`) to correctly adjust color opacity, so that transparency effects work as specified.

#### Acceptance Criteria

1. WHEN a class `bg-blue-600/50` is processed, THE CSS_Generator SHALL apply 50% opacity to the background color
2. WHEN a class `text-red-500/75` is processed, THE CSS_Generator SHALL apply 75% opacity to the text color
3. WHEN a class `border-green-400/25` is processed, THE CSS_Generator SHALL apply 25% opacity to the border color
4. WHEN an opacity value is invalid (e.g., `bg-blue-600/150`), THE CSS_Generator SHALL return error
5. WHERE opacity values are defined in theme config, THE CSS_Generator SHALL use configured opacity scale
6. WHEN an arbitrary opacity modifier is used `[opacity:0.33]`, THE CSS_Generator SHALL parse and apply the custom value

#### Correctness Properties

1. **Opacity calculation**: The opacity value SHALL be applied using CSS `rgba()` or equivalent notation
2. **Modifier precision**: Opacity percentages SHALL be converted to decimal values (0-1) accurately
3. **Theme opacity integration**: Custom opacity scales in theme config SHALL be respected
4. **Alpha channel handling**: Generated color values with opacity SHALL preserve all color information

---

### Requirement 8: Support Arbitrary Values

**User Story:** As a developer, I want to specify arbitrary CSS values using bracket notation, so that non-standard values can be applied without defining them in theme.

#### Acceptance Criteria

1. WHEN a class `[width:200px]` is provided, THE Class_Parser SHALL extract the arbitrary declaration
2. WHEN a class `[color:rgb(255,0,0)]` is provided, THE Class_Parser SHALL preserve the full value including special characters
3. WHEN a class `[margin:1rem_2rem]` is provided (underscores as spaces), THE Class_Parser SHALL convert underscores to spaces in output
4. WHEN a class combines arbitrary with variants `hover:[text-shadow:0_0_10px]`, THE Variant_System SHALL apply variant to arbitrary rule
5. WHEN an arbitrary value syntax is malformed `[invalid`, THE Class_Parser SHALL return error
6. WHEN an arbitrary value contains CSS declarations `[content:'Hello']`, THE CSS_Generator SHALL escape quotes properly

#### Correctness Properties

1. **Arbitrary value preservation**: Custom CSS values SHALL be preserved exactly as specified (except underscore conversion)
2. **Selector generation**: Arbitrary values SHALL generate valid, escaped selectors in CSS output
3. **Property validation**: Generated CSS from arbitrary values SHALL be syntactically valid
4. **Variant compatibility**: Arbitrary values SHALL work with all variant types

---

### Requirement 9: Maintain CSS Output Parity with Tailwind v4

**User Story:** As a developer, I want the Rust compiler CSS output to match Tailwind v4 output exactly, so that styling behavior is identical.

#### Acceptance Criteria

1. FOR a set of 200+ representative Tailwind classes, THE CSS_Compiler output SHALL match Tailwind v4 output byte-for-byte (excluding whitespace)
2. WHEN the same class list is compiled multiple times, THE CSS_Compiler SHALL produce identical output
3. WHEN output is compared with Tailwind v4 for all utility classes (spacing, colors, typography, etc.), THE CSS_Compiler SHALL have 99% coverage
4. WHEN edge cases like stacked variants or unusual opacity values are tested, THE CSS_Compiler output SHALL align with Tailwind v4
5. WHERE documented Tailwind v4 behavior exists, THE CSS_Compiler SHALL implement identical behavior

#### Correctness Properties

1. **Deterministic output**: The same input SHALL always produce identical output
2. **Complete coverage**: All Tailwind v4 utility classes SHALL produce CSS matching Tailwind's output
3. **Variant ordering**: Variant application order SHALL match Tailwind's precedence rules
4. **Specificity equivalence**: Generated selector specificity SHALL be equivalent to Tailwind's

---

### Requirement 10: Provide NAPI Bindings for Node.js Integration

**User Story:** As a TypeScript developer, I want to call the Rust CSS compiler via NAPI bindings, so that the compilation runs at native speed while integrated with JavaScript.

#### Acceptance Criteria

1. THE CSS_Compiler SHALL expose a function `generate_css_native(classes: Vec<String>, theme_json: String) -> Result<String, String>`
2. WHEN called from TypeScript with class array and theme JSON, THE NAPI_Binding SHALL invoke Rust implementation and return CSS string
3. WHEN an error occurs in Rust, THE NAPI_Binding SHALL propagate error message to JavaScript with clear description
4. WHEN the CSS_Compiler processes 100 classes, THE NAPI_Binding overhead SHALL be < 5ms (measured on standard hardware)
5. THE NAPI_Binding SHALL accept theme configuration as JSON string for maximum compatibility
6. THE NAPI_Binding SHALL be compatible with Node.js 18+ and support both CommonJS and ESM

#### Correctness Properties

1. **Type safety**: Rust types SHALL be correctly marshalled to/from JavaScript
2. **Error propagation**: Rust errors SHALL be accessible as JavaScript errors
3. **Performance overhead**: NAPI marshalling SHALL not add > 10% overhead to total compilation time

---

### Requirement 11: Support Custom Theme Configuration

**User Story:** As a project maintainer, I want to use custom Tailwind theme values, so that brand colors and custom spacing scales are applied correctly.

#### Acceptance Criteria

1. WHEN a custom theme config is provided with colors, THE CSS_Compiler SHALL resolve custom color classes (e.g., `bg-brand-primary`)
2. WHEN a custom theme config extends Tailwind defaults, THE CSS_Compiler SHALL merge custom values with defaults
3. WHEN theme config specifies custom breakpoints, THE Variant_System SHALL use custom breakpoints instead of Tailwind defaults
4. WHEN theme config is invalid JSON, THE CSS_Compiler SHALL return error before attempting compilation
5. WHEN theme config is incomplete (missing standard properties), THE CSS_Compiler SHALL use Tailwind v4 defaults for unspecified values
6. WHERE theme config is large (> 1MB), THE CSS_Compiler SHALL handle it efficiently without memory issues

#### Correctness Properties

1. **Theme integration**: Custom theme values SHALL override Tailwind defaults in all contexts
2. **Default fallback**: Missing theme values SHALL fall back to Tailwind v4 defaults
3. **Config validation**: Invalid theme structures SHALL be rejected with clear error messages
4. **Merge behavior**: Custom and default theme values SHALL merge predictably without conflicts

---

### Requirement 12: Handle Complex Multi-Variant Class Combinations

**User Story:** As a developer, I want complex classes combining multiple variants (responsive + state + color scheme), so that complex styling scenarios work correctly.

#### Acceptance Criteria

1. WHEN a class `md:dark:hover:bg-slate-900` is provided, THE Variant_System SHALL apply all three variants in correct precedence
2. WHEN a class `group-hover:md:text-white` combines group-relative and responsive variants, THE Variant_System SHALL generate correct nested selectors
3. WHEN variants conflict (e.g., attempting `sm:lg:px-4`), THE Variant_System SHALL handle gracefully (apply highest specificity or return error per Tailwind behavior)
4. WHEN a class has maximum variant depth (4+ variants stacked), THE CSS_Generator SHALL generate valid CSS without selector length issues
5. WHERE variant combination is logically impossible per Tailwind rules, THE CSS_Compiler SHALL return error or skip invalid combination

#### Correctness Properties

1. **Variant composition**: Multiple variants SHALL be composable without breaking specificity or precedence rules
2. **Selector validity**: Generated selectors for complex combinations SHALL be valid CSS
3. **Precedence correctness**: When multiple variants are stacked, Tailwind's precedence rules SHALL be maintained

---

### Requirement 13: Performance: Compile 100 Classes in <100ms

**User Story:** As a developer using the CSS compiler, I want fast compilation performance, so that watch mode and build times remain responsive.

#### Acceptance Criteria

1. WHEN the CSS_Compiler processes a list of 100 distinct classes, THE compilation time SHALL be < 100ms on standard hardware
2. WHEN the same 100 classes are compiled a second time (warm cache), THE compilation time SHALL be < 50ms
3. WHEN memory usage is monitored during compilation of 1000 classes, THE peak memory usage SHALL be < 50MB
4. WHEN comparing Rust compiler speed vs Tailwind JS (150ms baseline), THE Rust compiler SHALL achieve 40-60% improvement (60ms-90ms target)
5. WHERE compilation is profiled, THE CSS_Generator logic SHALL consume > 50% of total time (not NAPI marshalling overhead)

#### Correctness Properties

1. **Performance consistency**: Compilation time variance between runs SHALL be < 20%
2. **Scalability**: Compilation time SHALL scale linearly with class count (not exponentially)
3. **Memory efficiency**: Memory usage SHALL not grow unbounded with additional compilations

---

### Requirement 14: Provide Detailed Error Messages for Invalid Classes

**User Story:** As a developer, I want clear error messages when invalid classes are provided, so that issues can be quickly identified and fixed.

#### Acceptance Criteria

1. WHEN an invalid class syntax is parsed, THE Error_Handler SHALL return message indicating the syntax error and position
2. WHEN a theme value cannot be resolved, THE Error_Handler SHALL return message with the missing key name
3. WHEN an arbitrary value is malformed, THE Error_Handler SHALL suggest correct syntax
4. WHEN a variant is unknown, THE Error_Handler SHALL list valid variants similar to the provided input
5. WHEN multiple classes have errors, THE Error_Handler SHALL collect all errors and return them in a structured list

#### Correctness Properties

1. **Error clarity**: Error messages SHALL be understandable by developers
2. **Actionability**: Error messages SHALL suggest corrective actions when applicable
3. **Position info**: Error messages SHALL include location info (class index, character position) when possible

---

### Requirement 15: Support Caching and Incremental Compilation

**User Story:** As a developer using watch mode, I want compilation caching to avoid redundant work, so that incremental rebuilds are faster.

#### Acceptance Criteria

1. WHEN the same class list is compiled multiple times, THE CSS_Compiler SHALL cache results and return cached output without recompilation
2. WHEN a cache key is generated from class list, THE key generation SHALL be deterministic (same classes always produce same key)
3. WHERE cache entries are stored, THE cache SHALL support eviction (LRU or similar) to prevent unbounded memory growth
4. WHEN cache statistics are requested, THE CSS_Compiler SHALL provide hit/miss counts and cache size information
5. WHERE cache is cleared explicitly, THE CSS_Compiler SHALL discard all cached entries and return to compiling mode

#### Correctness Properties

1. **Cache correctness**: Cached results SHALL be identical to freshly compiled results
2. **Deterministic keys**: Cache keys based on same input SHALL always be identical
3. **Memory bounds**: Cache size SHALL never exceed configured maximum (e.g., 100 entries or 256KB)

---

### Requirement 16: Test Coverage for CSS Output Correctness

**User Story:** As a maintainer, I want comprehensive property-based tests ensuring CSS output correctness across all class variations, so that regressions are caught early.

#### Acceptance Criteria

1. THE Compiler module SHALL have a comprehensive property-based test suite validating CSS generation
2. WHEN random class lists are generated (using PBT), THE generated CSS SHALL be valid CSS and compile without syntax errors
3. WHEN properties like "round-trip" are tested (e.g., parse → generate → format), THE output SHALL preserve semantic meaning
4. WHERE class properties are tested (e.g., "response consistency"), THEN different orderings of same classes SHALL produce equivalent CSS (modulo specificity)
5. WHEN 1000+ generated test cases are run, THE test suite SHALL complete in < 10 seconds

#### Correctness Properties

1. **CSS validity**: All generated CSS SHALL be syntactically valid
2. **Round-trip invariants**: Parsing → generation → re-parsing SHALL preserve class semantics
3. **Determinism**: Same input SHALL produce identical CSS output
4. **Variant precedence**: Variant stacking order SHALL follow Tailwind's precedence rules

---

### Requirement 17: Provide TypeScript Integration Layer

**User Story:** As a TypeScript developer, I want a strongly-typed wrapper around the NAPI binding, so that compilation calls are type-safe and well-documented.

#### Acceptance Criteria

1. THE TypeScript wrapper SHALL export a function `generateCssNative(classes: string[], theme: Record<string, unknown>): Promise<string>`
2. WHEN the function is called, THE wrapper SHALL marshal TypeScript types to Rust via NAPI and return result
3. WHERE TypeScript definitions are exported, THE function signatures SHALL include JSDoc comments explaining parameters and return types
4. WHEN theme config is invalid, THE wrapper SHALL validate it before calling Rust and return TypeScript errors
5. THE wrapper module SHALL be located in `packages/domain/compiler/src/` for easy integration

#### Correctness Properties

1. **Type safety**: TypeScript types SHALL accurately reflect Rust function signatures
2. **Error handling**: Rust errors SHALL map to TypeScript errors with preserved error messages
3. **Documentation**: JSDoc comments SHALL clearly explain parameter requirements and usage

---

### Requirement 18: Maintain Backward Compatibility with JavaScript Fallback

**User Story:** As a maintainer, I want the system to fall back to Tailwind JS gracefully when Rust binding is unavailable, so that the system is resilient.

#### Acceptance Criteria

1. WHEN the Rust NAPI binding is not available or fails, THE system SHALL fall back to Tailwind JS `generateRawCss()` function
2. WHEN fallback is triggered, THE system SHALL log or report the fallback event for debugging
3. WHERE fallback occurs, THE output SHALL be identical to direct Tailwind JS compilation (same CSS rules)
4. WHEN feature flag `ENABLE_RUST_CSS_GENERATOR` is disabled, THE system SHALL use Tailwind JS exclusively
5. WHERE performance monitoring is active, THE system SHALL track how often fallback occurs

#### Correctness Properties

1. **Equivalence**: Fallback output SHALL be functionally identical to Rust output for same input
2. **Transparency**: Fallback mechanism SHALL be invisible to end-users (same API, same results)
3. **Reliability**: Fallback SHALL never throw unhandled errors even if Rust binding fails

---

## Test Strategy

### Unit Tests
- Parse class syntax (40+ test cases covering all variant types)
- Theme resolution (custom and default values)
- CSS rule generation (all utility classes)
- Variant handling (responsive, state, color scheme, group/peer)
- Error handling (invalid classes, missing theme values)

### Property-Based Tests
- **CSS Validity**: All generated CSS parses as valid CSS
- **Round-trip Parsing**: Parse → Format → Parse preserves structure
- **Determinism**: Same input always produces same output
- **Equivalence**: Generated CSS semantically equivalent to Tailwind v4 for all 200+ test classes

### Integration Tests
- End-to-end compilation with real theme configs
- NAPI binding invocation from TypeScript
- Comparison with Tailwind JS output (byte-level parity)
- Performance benchmarks (100 classes < 100ms)

### Performance Tests
- Single class compilation time
- Batch compilation (100, 1000 classes)
- Cache hit rate in watch mode simulation
- Memory usage during sustained compilation

---

## Success Criteria

✅ **Implementation Complete**:
- [ ] All 18 requirements implemented and tested
- [ ] 99% CSS output parity with Tailwind v4
- [ ] NAPI bindings expose `generateCssNative()` function
- [ ] TypeScript wrapper in `packages/domain/compiler/src/`
- [ ] Comprehensive test suite with 90%+ coverage
- [ ] Performance: 100 classes compiled in < 100ms

✅ **Quality Assurance**:
- [ ] All existing tests pass (backward compatibility)
- [ ] Property-based tests run 1000+ iterations without failure
- [ ] Fallback to Tailwind JS works seamlessly
- [ ] Error messages are clear and actionable
- [ ] Performance benchmarks show 40-60% improvement

✅ **Documentation**:
- [ ] NAPI binding documented with examples
- [ ] TypeScript wrapper includes JSDoc comments
- [ ] Error handling documented
- [ ] Performance characteristics documented

✅ **Release Readiness**:
- [ ] Code review completed
- [ ] CI/CD tests passing on all platforms
- [ ] Native binaries built and tested
- [ ] Performance metrics collected and baseline established
