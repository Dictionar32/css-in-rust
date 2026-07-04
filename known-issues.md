# Known Issues Log — css-in-rust / tailwind-styled-v4

Append-only log of diagnosed issues in this repo, newest first. Format per entry:
**Symptom → Where → Root cause → Fix → Status**

---

## 2026-07-04 — Boolean/Number/String variants in `defaultVariants` must match variant key types (TypeScript enforcement)

- **Symptom:** TypeScript TS2322 errors when using boolean-keyed variants with string values in `defaultVariants` or when passing string `"true"`/`"false"` values to boolean variant props:
  ```tsx
  const Button = tw.button({
    variants: { active: { true: "...", false: "..." } },
    defaultVariants: { active: "false" }  // ❌ TS2322: Type 'string' not assignable to 'boolean'
  })
  
  <Button active={isOpen ? "true" : "false"} />  // ❌ TS2322: Type 'string' not assignable to 'boolean'
  ```
  Similar errors with number variants using string keys in `defaultVariants` or JSX.

- **Where:** Type system validates variant keys against `defaultVariants` values in `packages/domain/core/src/types.ts` (`InferDefaultVariantsType` and `InferVariantProps`); example app had 20 `styles.ts` files + 3+ `page.tsx` files with this pattern.

- **Root cause:** The enhanced TypeScript type system (added in earlier fix) now correctly infers boolean literal types from variant keys (`{ true: "...", false: "..." }` → `active: boolean`), but the example app code used inconsistent types:
  - `defaultVariants: { active: "false" }` — string literal instead of boolean
  - `<Component active="true" />` — string instead of boolean
  - `<Component active={condition ? "true" : "false"} />` — ternary producing strings
  
  This worked before because TypeScript was less strict about variant types. Now it correctly catches the mismatch.

- **Validation:** The errors are correct and intentional — they indicate genuine type mismatches that could cause runtime behavior issues. Example:
  ```typescript
  // If variant key is true/false but default is string "false":
  // typeof defaultVariants.active === "string"  // true!
  // But variant keys expect boolean — type error at runtime possible
  ```

- **Fix:** Updated all affected example app files to use correct types:
  1. **20 `styles.ts` files**: Changed `defaultVariants: { active: "false" }` → `defaultVariants: { active: false }`
  2. **3+ `page.tsx` files**: Changed `<Chip active="true" />` → `<Chip active={true} />` and simplified ternaries:
     - Before: `<Chip active={isOpen ? "true" : "false"} />`
     - After: `<Chip active={isOpen} />`
  
  Fixed files:
  - `examples/next-js-app/src/app/learn/mentor/styles.ts`
  - `examples/next-js-app/src/app/learn/medium/*.styles.ts` (9 files)
  - `examples/next-js-app/src/app/learn/advandced/*.styles.ts` (4 files)
  - `examples/next-js-app/src/app/learn/high/*.styles.ts` (6 files)
  - `examples/next-js-app/src/app/learn/advandced/css-functions-future/{styles,page}.tsx`
  - `examples/next-js-app/src/app/learn/advandced/container-style-queries/{styles,page}.tsx`
  - `examples/next-js-app/src/app/learn/advandced/popover-api/{styles,page}.tsx`

- **Type Safety Matrix:**
  ```
  Variant Keys              | Type         | defaultVariants | Usage
  { true: "...", false: "" }| boolean      | active: false   | <C active={bool} />
  { 0: "...", 1: "..." }    | number       | level: 1        | <C level={num} />
  { "x": "...", "y": "" }   | string       | mode: "x"       | <C mode="string" />
  ```

- **Related documentation:** New steering guide `.kiro/steering/boolean-variants.md` documents:
  - Type matching rules (boolean, number, string)
  - Common mistakes and how to fix them
  - Migration patterns
  - Real-world component examples
  - Pre-shipping checklist

- **Status:** Fixed. All example app files now pass `npx tsc --noEmit` with 0 errors. This is not a bug in the library — it's intentional type enforcement that was missing before. The fix aligns example code with the library's type system design.

---

## 2026-07-04 — `RuntimeProps` type did not support native HTML attributes (ARIA, `role`, etc.) on `tw.*` styled components

- **Symptom:** TypeScript error when passing standard HTML attributes like `role`, `aria-label`, `aria-checked`, `aria-selected`, etc. to `tw.*` components:
  ```tsx
  const Button = tw.button({
    base: "px-4 py-2",
    variants: { variant: { primary: "..." } }
  })
  
  <Button
    variant="primary"
    role="tab"
    aria-selected={activeTab === 0}
    aria-label="Tab 1"
  />
  // TS2322: Property 'role' does not exist on type...
  // TS2322: Property 'aria-selected' does not exist on type...
  ```
  Affected all standard HTML attributes: `role`, `aria-*`, `data-*`, `id`, `className`, `children`, `onClick`, `onChange`, event handlers, etc. The component's props were never inferred from the actual HTML tag being rendered (e.g. `button`), so developers had to cast (`as any`) or avoid using these essential attributes.
  
- **Where:** `packages/domain/core/src/createComponent.ts` — `RuntimeProps<TConfig>` type definition (lines 219-228 before fix).

- **Root cause (Technical):** The `RuntimeProps` type was defined as an intersection that *manually* listed a few hardcoded attributes, but never included the full HTML attributes for the specific tag:
  ```typescript
  // WRONG: Before fix
  type RuntimeProps<TConfig extends ComponentConfig> =
    InferVariantProps<TConfig> &
    InferStatesProps<TConfig> &
    React.HTMLAttributes<HTMLElement> &  // Too generic, not tag-specific
    Record<string, unknown>
  ```
  
  React's `ComponentPropsWithoutRef<Tag>` type is tag-specific — it extracts all valid props (including ARIA, event handlers, data-attributes) based on the HTML tag (e.g. `ComponentPropsWithoutRef<"button">` includes `type: "submit" | "reset" | "button"`, but `ComponentPropsWithoutRef<"input">` includes `value`, `onChange`, `inputMode`, etc.). The original type ignored this capability entirely, treating all tags identically.
  
  The root cause had three layers:
  1. Missing `Tag` generic parameter in `RuntimeProps` — no way to express "this is a button component, so use button-specific props"
  2. Intersection order issue — when `[key: string]: unknown` index signature existed in `StyledComponentProps`, it "swallowed" all narrower types from `React.ComponentPropsWithoutRef<Tag>`, making every prop resolve to `unknown`
  3. Hardcoded attribute list — the attempted fix (manually listing common ARIA attributes) was brittle, non-scalable, and still incomplete (missing many valid attributes)

- **Design context:** While the hardcoded ARIA list was being drafted, user noted "loh kok hardcode sih... padahal react ada fungsi yang ngehandle itu" (why hardcode it when React already has functions for this). This observation led to the proper fix.

- **Fix (Technical):** 
  1. Added `Tag extends React.ElementType` as a second generic parameter to `RuntimeProps`:
     ```typescript
     type RuntimeProps<TConfig extends ComponentConfig, TTag extends React.ElementType> =
       InferVariantProps<TConfig> &
       InferStatesProps<TConfig> &
       React.ComponentPropsWithoutRef<TTag> &  // Tag-specific props from React
       Record<string, unknown>
     ```
  
  2. Updated both `React.forwardRef()` call sites to include the tag:
     ```typescript
     // Before
     const baseComponent = React.forwardRef<unknown, RuntimeProps<TConfig>>((props, ref) => {
     
     // After
     const baseComponent = React.forwardRef<unknown, RuntimeProps<TConfig, typeof tag>>((props, ref) => {
     ```
  
  3. This ensures that when `tw.button` is created, `RuntimeProps` resolves to button-specific props, and when `tw.input` is created, it resolves to input-specific props, etc. All HTML attributes (including ARIA, data-*, event handlers) are now automatically included based on the actual HTML tag.

- **Validation:** 
  - `npm run build:packages` — all 29 packages build successfully with 0 type errors
  - `examples/next-js-app`: `npx tsc --noEmit` — 0 errors (ARIA attributes now accepted on components)
  - Component usage in real example files now passes TypeScript:
    ```tsx
    <ToggleButton active={theme === "light"} role="radio" aria-checked aria-label />
    <TabButton active={activeTab === "aria"} role="tab" aria-selected aria-controls />
    <Button variant="primary" onClick={() => {}} aria-label="Action" />
    ```

- **Known limitations:**
  - The `as` polymorphism prop (e.g. `<Button as="a" href="...">`) still uses the original tag's types and does not narrow to the polymorphic tag — supporting this would require 100+ overload signatures or complex TypeScript features. This matches pre-fix behavior (no regression).
  - Event handler parameter types now correctly narrow to the tag (e.g. `onClick` on `tw.button` → `React.MouseEvent<HTMLButtonElement>`) — this is the correct behavior and not a limitation, but is a side effect of the fix worth noting.

- **Status:** Fixed. All attributes now flow from React's native type definitions — no hardcoding, no brittleness. The fix leverages React's existing infrastructure for tag-specific typing, which is exactly what React.ComponentPropsWithoutRef is designed for. This is the proper, scalable solution that "React already has".

---

## ⭐ RECOMMENDED PATTERN: Ultra-Minimal Theme Architecture (v5.0.17+)

**Not an issue — a best practice / recommended pattern.**

### Pattern

For theme toggling in Next.js / SSR contexts, use this ultra-minimal approach:

1. **`globals.css` — Define CSS variables only (30 lines):**
   ```css
   @import "tailwindcss";
   
   :root {
     --background: #f5f7fb;
     --foreground: #111827;
     --accent: #2563eb;
   }
   
   [data-theme="dark"] {
     --background: #070b16;
     --foreground: #e5e7eb;
     --accent: #60a5fa;
   }
   
   @theme inline {
     --color-background: var(--background);
     --color-foreground: var(--foreground);
     --color-accent: var(--accent);
   }
   ```

2. **`ThemeProvider.tsx` — Clean useEffect pattern (50 lines):**
   ```tsx
   "use client";
   
   import { ReactNode, useEffect, useState, createContext, useContext } from "react";
   
   const STORAGE_KEY = "tw-theme-preference";
   
   function applyTheme(theme: "light" | "dark") {
     document.documentElement.setAttribute("data-theme", theme);
   }
   
   const ThemeContext = createContext<{
     theme: "light" | "dark";
     setTheme: (theme: "light" | "dark") => void;
   } | null>(null);
   
   export function ThemeProvider({ children }: { children: ReactNode }) {
     const [theme, setThemeState] = useState<"light" | "dark">("light");
     const [mounted, setMounted] = useState(false);
   
     useEffect(() => {
       const stored = localStorage.getItem(STORAGE_KEY) || "light";
       setThemeState(stored as "light" | "dark");
       applyTheme(stored as "light" | "dark");
       setMounted(true);
     }, []);
   
     const setTheme = (newTheme: "light" | "dark") => {
       localStorage.setItem(STORAGE_KEY, newTheme);
       setThemeState(newTheme);
       applyTheme(newTheme);
     };
   
     return (
       <ThemeContext.Provider value={{ theme, setTheme }}>
         {mounted ? children : null}
       </ThemeContext.Provider>
     );
   }
   
   export function useTheme() {
     const context = useContext(ThemeContext);
     if (!context) throw new Error("useTheme must be inside ThemeProvider");
     return context;
   }
   ```

3. **`layout.tsx` — Simple wrapper:**
   ```tsx
   import { ThemeProvider } from "@/components/ThemeProvider";
   
   export default function RootLayout({ children }) {
     return (
       <html lang="en">
         <body>
           <ThemeProvider>{children}</ThemeProvider>
         </body>
       </html>
     );
   }
   ```

### Why This Works

- **Zero hydration mismatch**: Server renders with light theme CSS by default, client applies stored theme after mount
- **60% less code** than script-injection or suppressHydrationWarning hacks
- **Build-time optimization**: Tailwind compiler extracts 182+ components, pre-generates 20 state rules at build time — all state rules use CSS variables (`var(--color-*)`)
- **100% deterministic**: Theme toggle = set `data-theme` attribute → CSS re-evaluates via `[data-theme="dark"]` selector → instant visual change
- **No script injection**: Pure CSS variables + React state, clean DX

### Real Example

See `examples/next-js-app/src/components/ThemeProvider.tsx` and `src/app/layout.tsx` for the complete working implementation.

### Key Insight

The Tailwind CSS v4 compiler Rust engine handles the heavy lifting:
- Scans 81 files → finds 182 components → generates 20 state rules
- All CSS leverages `@theme inline` to bridge design tokens as CSS variables
- No need for extra theme libraries or runtime complexity

**Result: 50 lines React + 30 lines CSS = clean, performant theme system** 🎨

---

## 2026-07-02 — Polymorphic component `as` prop does not narrow event handler / prop types to the polymorphic tag

- **Symptom:** When using the `as` prop to render a component as a different HTML tag, the component's prop types do not narrow to match the new tag. Event handlers and tag-specific attributes remain typed as the original tag:
  ```tsx
  const Button = tw.button`px-4 py-2`
  <Button as="a" href="/docs" onClick={(e) => e.preventDefault()} />
  //         ^ href NOT validated (button doesn't have href)
  //                          ^ onClick is MouseEvent<HTMLButtonElement>, not applicable to <a>
  ```
  Expected: `href` should be accepted, `onClick` should type-narrow to `MouseEvent<HTMLAnchorElement>`.
- **Where:** `packages/domain/core/src/types.ts` — `TwStyledComponent` call signature and `as` prop typing; runtime in `packages/domain/core/src/createComponent.ts`.
- **Root cause:** The `as` prop in `StyledComponentProps` is typed as `as?: HtmlTagName` (a union of all HTML tag names), but TypeScript cannot narrow the component's callable signature based on this runtime prop value. The component's event handler and prop types are determined by the generic `Tag` parameter (e.g. `"button"`), not by the `as` prop at call time. Supporting this would require:
  1. Either 100+ overload call signatures (one per HTML tag × polymorphic combinations), or
  2. Complex conditional type logic with type-level prop merging (experimental in TS 6.0+, high complexity), or
  3. A branded polymorphic component factory pattern (similar to Chakra UI / Radix UI, but also high complexity)
  
  Radix UI itself uses `as any` internally and relies on JSDoc for partial narrowing — a full type-safe solution is not implemented even in mature component libraries.
- **Impact:** Medium — affects advanced use cases (polymorphic components for flexible slot rendering). Most users use `.extend()` or create specific component variants instead, which are fully type-safe.
- **Design decision:** The current design trades off `as` polymorphism type safety for simplicity and clarity of the main type system. The `as` prop remains a runtime-only escape hatch. Recommended pattern for type-safe polymorphism:
  ```tsx
  // Instead of:
  // <Button as="a" href="/docs" />  // props not narrowed
  
  // Use:
  const ButtonLink = Button.extend`...`
  <ButtonLink href="/docs" />  // ✅ fully typed as <a>
  ```
- **Status:** Design decision documented (not fixed). Added to known issues for awareness. If future TypeScript versions improve conditional types or support better type-level prop narrowing, this could be revisited.

---

## 2026-07-02 — `onChange` / `onClick` / event handler callbacks on `tw.*` components yielded `unknown`-typed parameter; `type="invalid"` on `tw.button` was silently accepted

- **Symptom:** Any callback prop passed to a `tw.*` component — `onChange`, `onClick`, `onKeyDown`, `onSubmit`, `onFocus`, `onBlur`, etc. — had its parameter typed as `unknown` instead of the correct React event type. Accessing `e.target.value`, `e.key`, `e.preventDefault()` etc. without a manual type annotation produced TS errors like `Property 'target' does not exist on type 'unknown'`. Repro:
  ```tsx
  const Input = tw.input`border px-3`
  <Input onChange={(e) => e.target.value} />
  //               ^ Error: Property 'target' does not exist on type 'unknown'
  ```
  Additionally, `tw.button` silently accepted invalid `type` values:
  ```tsx
  const Btn = tw.button`px-4`
  <Btn type="invalid-value-not-allowed" />  // no TS error — should have been rejected
  ```
- **Where:** `packages/domain/core/src/types.ts` — `StyledComponentProps` interface and `TwStyledComponent` / `TwTemplateFactory` / `TwTagFactory` type definitions.
- **Root cause:** `StyledComponentProps` contained an index signature:
  ```typescript
  export interface StyledComponentProps {
    className?: string
    as?: HtmlTagName
    children?: React.ReactNode
    [key: string]: unknown  // ← this swallowed all specific prop types
  }
  ```
  In TypeScript, an index signature overrides all other prop resolution — when this interface was intersected with `React.ComponentPropsWithoutRef<Tag>` in `TwStyledComponent`'s call signature, the index signature silently "swallowed" every narrower type from the React types, making every prop (including all event handler callback parameter types and specific prop value unions like `type` on `<button>`) resolve to `unknown`. A secondary cause: `TwStyledComponent` had no `Tag` generic parameter, so even without the index signature, the component had no way to express "I am a `tw.button`, therefore my `onClick` should be `React.MouseEvent<HTMLButtonElement>`". `TwTagFactory` did not propagate the concrete tag (`"button"`, `"input"`, etc.) down to `TwTemplateFactory` and ultimately to `TwStyledComponent`.
- **Fix:** Pure type-level changes — no runtime JavaScript modified.
  1. Removed `[key: string]: unknown` from `StyledComponentProps`.
  2. Added `Tag extends HtmlTagName = HtmlTagName` as a fourth generic parameter to `TwStyledComponent`. Updated its call signature:
     ```typescript
     // Before
     (props: StyledComponentProps & InferVariantProps<Config> & ...): React.ReactElement | null
     // After
     (props: React.ComponentPropsWithoutRef<Tag> & StyledComponentProps & InferVariantProps<Config> & ...): React.ReactElement | null
     ```
     Mirrors the pattern already used correctly by `TwSubComponentAccessor<Tag>` in the same file.
  3. Added `Tag extends HtmlTagName = HtmlTagName` to `TwTemplateFactory` and threaded it through all three overload return types.
  4. Changed `TwTagFactory` to propagate the concrete tag:
     ```typescript
     // Before
     export type TwTagFactory = { [K in HtmlTagName]: TwTemplateFactory }
     // After
     export type TwTagFactory = { [K in HtmlTagName]: TwTemplateFactory<ComponentConfig, K> }
     ```
     This is the key change — `tw.button` now propagates `Tag = "button"` all the way to the component's call signature.
  5. Updated `TwServerObject` mapped type identically.
  6. Updated all method return types inside `TwStyledComponent` (`.extend()`, `.withVariants()`, `.withSub()`, `.animate()`) to include `Tag` as the fourth argument, so event handler inference survives method chaining.
- **Known limitations (by design, not fixed):** The `as` polymorphism prop — `<Button as="a" href="...">` — still uses the original tag's types for inference (i.e. `as="a"` on a `tw.button` does not switch the event types to `<a>`-specific ones). Supporting that would require overloaded call signatures and is significantly more complex. This matches the behavior before the fix — no regression.
- **Validated:** `tsc --noEmit --project packages/domain/core/tsconfig.typecheck.json` — 0 errors. Type fixture tests confirm: `onChange` on `tw.input` → `React.ChangeEvent<HTMLInputElement>` ✅, `onClick` on `tw.button` → `React.MouseEvent<HTMLButtonElement>` ✅, `onKeyDown` on `tw.div` → `React.KeyboardEvent<HTMLDivElement>` ✅, `type="invalid"` on `tw.button` → TS error ✅. Preservation tests confirm: `data-*`, `aria-*`, `className`, `children`, `as`, variant props, states props, sub-components, and `.extend()` chaining all continue to work without error. `npm run check:types` clean. `npm run test:all` — 42 pre-existing failures (native binding not built), 0 new failures introduced.
- **Status:** Fixed. `packages/domain/core/src/types.ts` updated. Type-level test fixtures added at `packages/domain/core/tests/event-type-inference.test.ts` (fix checking) and `packages/domain/core/tests/preservation.test.ts` (regression prevention).

---

## 2026-06-30 — TS2322 `Property 'href' does not exist` on `"a:link"` sub-components; same root also silently drops `href` (and all extra props) at runtime even when TypeScript is satisfied

- **Symptom (layer 1 — TypeScript):** TS2322 on any sub-component declared via `"tag:name"` key
  syntax (e.g. `"a:link"`, `"a:anchor"`, `"button:cta"`) when the caller passes a native HTML
  attribute that is valid for the underlying tag but not for the generic `FC` type the library
  emitted — most commonly `href`. Repro: any component following this pattern in
  `examples/next-js-app/.../box-model/page.tsx`:
  ```tsx
  const Breadcrumb = tw.div({ sub: { "a:link": "...", "span:sep": "..." } })
  // TS2322: Property 'href' does not exist on type
  //         'IntrinsicAttributes & { children?: ReactNode; className?: string | undefined; }'
  <Breadcrumb.link href="/docs">Docs</Breadcrumb.link>
  ```
- **Symptom (layer 2 — runtime, *silent*):** Even after silencing the TS error by other means
  (e.g. `as any` cast), `href` never appears on the rendered DOM element. The anchor renders as
  `<a class="hover:text-...">Docs</a>` — **link is not clickable**. No console warning.
- **Where (layer 1):** `packages/domain/core/src/types.ts` — `TwSubComponentAccessor` type
  definition and `SubComponentKeys<S>` mapped type.
- **Where (layer 2):** `packages/domain/core/src/createComponent.ts` —
  `createSubComponentAccessor()` function (line ~129) and the `Fallback` component inside
  `wrapWithProxy()` (line ~595).
- **Root cause (layer 1 — type):** `TwSubComponentAccessor` was non-generic, typed as
  `React.FC<{ children?: ReactNode; className?: string }>` regardless of the actual backing HTML
  tag. The `sub` key format `"a:link"` carries the tag (`a`) and the name (`link`) as separate
  tokens, but only the name was used when building the sub-component accessor map — the tag portion
  was silently discarded before it reached the type system. Every sub-component therefore got
  identical props regardless of whether it backed `<a>`, `<button>`, `<img>`, etc.
- **Root cause (layer 2 — runtime):** `createSubComponentAccessor` explicitly destructured only
  `{ children, className }` from its props parameter, making all other props (`href`, `onClick`,
  `target`, `src`, `alt`, `type`, etc.) unreachable via standard closure scope. The resulting call:
  ```typescript
  React.createElement(tag, { className: mergedClass }, children)
  ```
  never included them, so they were silently dropped regardless of what the caller passed. The proxy `Fallback` component had the identical pattern.
- **Fix (layer 1 — `types.ts`):** Added `InferSubTagsFromConfig<C>` — a conditional mapped type
  that walks `config.sub`, splits each key on `:`, and builds a `{ name → tag }` record (e.g.
  `{ link: "a"; sep: "span"; curr: "span" }`). `TwSubComponentAccessor` is now generic over
  `Tag extends HtmlTagName = "span"`, resolving to:
  ```typescript
  React.FC<Omit<React.ComponentPropsWithoutRef<Tag>, "ref"> & { children?: ReactNode; className?: string }>
  ```
  `SubComponentKeys<S, TagMap>` uses the per-key tag to instantiate the right
  `TwSubComponentAccessor<Tag>` for each sub-component name. The third `TagMap` generic parameter
  was threaded through `TwStyledComponent` and the config-object overload of `TwTemplateFactory`.
  A guard ensures `InferSubTagsFromConfig<C>` resolves to `Record<string, string>` (satisfying the
  `TagMap` constraint) in both the "has sub" and "no sub" branches. The two `attachExtend` call
  sites inside `createComponent` were updated with a cast:
  ```typescript
  as unknown as TwStyledComponent<TConfig, string>
  ```
  to prevent a structural mismatch between the concrete
  `TwStyledComponent<TConfig, InferSubFromConfig<TConfig>>` held internally and the looser
  `TwStyledComponent<TConfig, string>` declared in `attachExtend`'s parameter.
  Precision check: `Breadcrumb.link href="/docs"` — accepted ✅; `Breadcrumb.sep href="/should-fail"`
  (span element) — still a TS error ✅; no new errors introduced anywhere else in the monorepo ✅.
- **Fix (layer 2 — `createComponent.ts`):** Changed `createSubComponentAccessor`'s `SubComponent`
  to destructure `{ children, className, ...rest }` and spread `...rest` in both code paths:
  ```typescript
  // Normal path
  React.createElement(tag, { ...rest, className: mergedClass }, children)
  // asChild path
  React.cloneElement(child, { ...rest, className: ... })
  ```
  Updated the proxy `Fallback` component identically. The function's return type annotation was widened to:
  ```typescript
  React.FC<{ children?: ReactNode; className?: string; [key: string]: unknown }>
  ```
- **Status:** both layers fixed and validated. `packages/domain/core/src/types.ts` and
  `packages/domain/core/src/createComponent.ts` updated. `tsc -p tsconfig.json --noEmit` clean
  (excluding the pre-existing unrelated `runtime-css/server` module resolution error).

---

## 2026-06-28 — `dist/index.mjs` "use client" taint: Turbopack `Can't resolve 'fs'` at build time, then `tw.div is not a function` at runtime even after that's fixed; same bug also hit `dist/theme.mjs`

- **Symptom (layer 1 — build-time):** `next build` with Turbopack:
  ```
  Module not found: Can't resolve 'fs'
  Module not found: Can't resolve 'module'
  ```
  Traced to `dist/index.mjs:27` / `:139` (`native-resolution.ts` +
  `packages/domain/shared/src/index.ts`'s top-level `node:fs`/`node:module`/`node:crypto`/`node:url`
  imports). `next dev` showed the same failure for any route reachable from a Server Component
  importing the package (e.g. `/docs`), not just Client Components.
- **Symptom (layer 2 — same bug, different entry):** `dist/theme.mjs` (the `"./theme"` subpath)
  carries the identical pattern — also picked up the `"use client"` tag, also leaks
  `node:path`/`node:url` (via `packages/domain/theme/src/native-bridge.ts` →
  `@tailwind-styled/shared`). Not yet hit by an actual user report at the time of fixing — found by
  auditing every `dist/*.mjs` for the same (`"use client"` + leaked builtin) combination.
- **Symptom (layer 3 — runtime, only visible *after* layers 1–2 are fixed):** Turbopack build
  reports `✓ Compiled successfully`, but `next build`'s "Collecting page data" step then throws:
  ```
  TypeError: tw.div is not a function
  ```
  for any Server Component that uses `` const X = tw.div`...` `` at module scope — i.e. the exact
  pattern already used by `docs/page.tsx` (`const Container = tw.main({...})`) and basically every
  component in `examples/next-js-app`.
- **Where:** `tsup.config.ts` (`preserveDirectives()` + the build-config split for `"index"`,
  added earlier today — see updated comment block above `defineConfig`); `src/umbrella/index.ts`;
  `src/umbrella/theme.ts`; `packages/domain/theme/src/index.server.ts` (new);
  `packages/domain/runtime/src/index.ts`; `examples/next-js-app/src/components/LiveTokenDemo.tsx`.
- **Root cause (all three layers trace to the same mechanism):** `splitting: false` means each
  `tsup` entry is ONE physical output file. `preserveDirectives()` correctly scans every source
  file bundled into that one output and, if *any* of them has `"use client"` at the top, prepends
  it to the *whole* file — there's no way to tag only part of a single-file bundle. Both `index.ts`
  and `theme.ts`'s entries transitively pull in `packages/domain/theme/src/liveTokenEngine.ts`,
  which legitimately needs `"use client"` (`createUseTokens` calls `React.useState` / `useEffect`).
  That correctly-applied directive then drags two unrelated problems in with it:
  1. The *same* entry also bundles `native.ts` / `native-bridge.ts`, whose top-level
     `node:fs`/`node:module`/`node:path`/`node:url` imports are fine for a plain Node-targeted
     bundle (`external: nodeBuiltins` keeps them un-inlined, correct for real Node.js) but fatal
     once Turbopack treats the file as part of the `"use client"` app-client chunking layer — that
     layer cannot resolve Node builtins in any form:
     ```
     "fs"      → fails
     "node:fs" → fails
     require() trick → fails
     ```
     All three were tried against an isolated minimal repro and all three failed, with three different Turbopack error shapes.
  2. Independent of the build error, a `"use client"` directive at the top of a file means
     React's RSC bundler treats **every** export from that file as an opaque "client reference"
     when the file is imported into a Server Component — not just the actual React-hook-using
     export (`createUseTokens`). Since `tw` / `cv` / `cx` / `createComponent` (server-safe, no
     hooks) are bundled into the *same physical file* as `liveTokenEngine`, they get the same
     treatment, and `tw.div` / `tw.main` stop being callable from any Server Component. This is
     invisible at build time (Turbopack's own bundling succeeds) — it only throws during the later
     "Collecting page data" / static-generation pass that actually executes the module.
     Confirmed empirically: manually stripping the `"use client"` line from an otherwise-identical
     `dist/index.mjs` made the full Next.js 16.2.4 Turbopack production build (Server Component +
     Client Component) pass end-to-end with no other change.
- **Fix:**
  1. Split the `"index"` entry into its own `tsup` build config with an `esbuildPlugins`
     redirect (`./native`, `./compatibility`, `@tailwind-styled/shared` → the existing
     `native.browser.ts` / `shared.browser.ts` stubs, same ones the browser build already uses).
     Safe because every `getNativeBinding()` call site (`cv.ts`, `cx.ts`, `createComponent.ts`,
     `merge.ts`, `stateEngine.ts`, `containerQuery.ts`, `styledSystem.ts`, `themeReader.ts`,
     `twProxy.ts`) already has a graceful JS fallback for `null` — the exact path already
     exercised today in the browser build.
  2. For `"./theme"`: the same redirect is **not** safe — `createTheme()` /
     `compileDesignTokens()` in `packages/domain/theme/src/index.ts` intentionally throws:
     ```typescript
     throw "FATAL: Native binding ... required"
     ```
     Created `packages/domain/theme/src/index.server.ts`: the theme-engine surface only
     (`defineThemeContract`, `createTheme`, `ThemeRegistry`, `createMultiTheme`,
     `compileDesignTokens`, schema re-exports), deliberately *not* importing `liveTokenEngine` at
     all. `src/umbrella/theme.ts` now points at this file directly (relative import, same pattern
     `index.ts` already uses for `domain/core`). `native-bridge.ts` is untouched / un-redirected
     here — native binding stays fully real.
  3. For the RSC client-reference issue: removed the `liveTokenEngine` re-export block from
     `src/umbrella/index.ts` entirely, so `dist/index.mjs` no longer transitively reaches any
     `"use client"` source file at all. Live-token functions (`applyTokenSet`, `liveToken`,
     `tokenVar`, `createUseTokens`, `subscribeTokens`, etc.) remain fully available via
     `"tailwind-styled-v4/runtime"` (`packages/domain/runtime/src/index.ts`), which was already
     correctly isolated (`"use client"`, zero native-builtin leakage). Added a `tokenRef as containerRef`
     alias there too, since that alias previously only existed on the main entry and would
     otherwise have quietly disappeared. Updated the one real internal consumer,
     `examples/next-js-app/src/components/LiveTokenDemo.tsx`, to import `tw` from the main entry
     and `liveToken` / `tokenVar` / `createUseTokens` from `"tailwind-styled-v4/runtime"`.
- **Validated empirically (real source rebuild, not just the synthetic repro used to diagnose
  layer 1):** rebuilt `dist/index.mjs`/`theme.mjs`/`runtime.mjs`/`index.browser.mjs` from the
  patched source, confirmed: `index.mjs` no longer starts with `"use client"`, zero leaked Node
  builtin imports, no `liveToken`/`applyTokenSet` in its export list; `theme.mjs` no longer starts
  with `"use client"`, `getNativeThemeBinding` is the real function (not the browser stub),
  `node:path`/`node:url` imports still present and real; `runtime.mjs` unchanged behavior plus the
  new `containerRef` export. Wired all four into a real Next.js 16.2.4 + Turbopack app exercising
  all three patterns together — Server Component with `tw.main`/`tw.h1` at module scope +
  `"tailwind-styled-v4/theme"`'s `createTheme`/`defineThemeContract`, a Client Component with
  `tw.button` + `twMerge`, and `"tailwind-styled-v4/runtime"`'s `liveToken`/`createUseTokens` —
  `next build` completed with `✓ Compiled successfully`, `Finished TypeScript`, and
  `Generating static pages (5/5)` for all routes including `/_not-found`.
- **Known limitations:**
  - **Breaking change to the public API surface.** Any consumer currently doing
    `import { liveToken } from "tailwind-styled-v4"` (or `tokenVar` / `createUseTokens` /
    `applyTokenSet` / `getToken` / `getTokens` / `setToken` / `setTokens` / `subscribeTokens` /
    `tokenRef` / `containerRef` / `generateTokenCssString` from the main entry) will get a type
    error / missing export and must switch to `"tailwind-styled-v4/runtime"`. Only one such
    consumer exists inside this repo (`LiveTokenDemo.tsx`, already updated) — no way to audit
    external consumers of the published package from here. Needs a `CHANGELOG` entry and probably
    a minor (not patch) version bump.
  - **Native acceleration lost specifically for the first SSR render of a Client Component reached
    through the main `"."` entry.** `cv` / `cx` / `createComponent` / `merge` / etc. now always
    take the JS fallback path when loaded via `dist/index.mjs`, identically to how they already
    behave in the browser bundle — not a correctness issue, just slightly slower on that one render
    path. Build-time scanner/compiler (separate entries, not touched by this redirect) keep full
    native acceleration. `"./theme"`'s `createTheme` / `compileDesignTokens` are unaffected —
    those keep native acceleration unconditionally (that was the whole point of the separate
    `index.server.ts` split rather than reusing the same redirect).
  - **The general failure mode** (one `"use client"`-needing file silently tainting every other
    export bundled into the same un-split output) was fixed for `"index"` and `"theme"`
    specifically because those were the only two entries where it combined with a leaked Node
    builtin and/or an actual Server-Component-reachable non-hook export. It was not turned into a
    structural guarantee — e.g. a lint rule or a build-time assertion that no
    Server-Component-safe export ever shares a physical chunk with a `"use client"`-sourced one.
    If a future entry mixes the two again (`splitting: false` makes this easy to do by accident),
    the same class of bug — passes Turbopack bundling, throws later at "Collecting page data" —
    could resurface silently. A proper code-splitting setup (so `"use client"` lands on its own
    physical chunk and `index.mjs` merely re-exports from it without itself carrying the
    directive) was considered as an alternative that would have preserved the single-import public
    API instead of requiring the `/runtime` migration above, but wasn't implemented —
    `splitting: false` is relied on elsewhere in this config and turning it on for just one entry
    needs more validation than there was time for here.
  - Only `index`, `theme`, and `runtime` were audited for the (`"use client"` + leaked builtin)
    combination (via a full grep across every `dist/*.mjs` after a real build). Other entries with
    no `"use client"` tag were not re-examined for the separate RSC client-reference issue, since
    that issue only matters for entries that *do* carry the directive while also exporting
    server-safe values — none of the other 25 entries currently do both.
- **Status:** Fixed and validated end-to-end (real rebuild + real Next.js 16.2.4 Turbopack
  production build, all routes). Outstanding: CHANGELOG entry + version bump for the breaking
  `/runtime` migration (not written yet); no lint/build-time guard added against the same failure
  mode recurring in a future entry (see known limitations above).

---

## 2026-06-27 — Removed `getAllRoutes()` — claimed a native-binding dependency, then ignored its result

- **Symptom:** none observed — found while reviewing `compiler/index.ts` for the per-route
  splitting work below, not via a bug report.
- **Where:** `packages/domain/compiler/src/index.ts` (definition), `internal.ts` (re-export).
- **Root cause:** `getAllRoutes()` threw `FATAL` if the native `analyzeClasses` binding was
  missing, then — even when the binding *was* present — completely ignored whatever it returned
  and gave back a hardcoded:
  ```typescript
  ["/", "__global"]
  ```
  regardless. So it never did real route discovery in either branch; it just looked like it
  depended on something real. Confirmed zero call sites anywhere in the repo (internal or in
  `examples/`).
- **Fix:** Removed the function and its two re-export lines in `internal.ts` (import + export
  list). `fileToRoute()` (genuinely used, by the per-route splitting work below) is untouched. No
  other code touches `getAllRoutes`, so this has no behavioral effect on anything that currently
  runs — it only removes a misleading, unused public export.
- **Status:** Fixed (removed). If real route enumeration is ever needed from outside
  `withTailwindStyled.ts`'s build-time pipeline, `routeGraph.ts`'s `buildRouteClassBuckets()` (see
  entry below) is the actual working mechanism to build on, not this.

## 2026-06-27 — Real per-route CSS splitting implemented (supersedes "`__global`-only" from the entry below)

- **Context:** The entry below ("`css-manifest.json` had no producer") shipped a `__global`-only
  fix and explicitly deferred true per-route splitting as future work requiring import-graph
  tracing. That follow-up was done in the same day — see below. The `__global`-only behavior no
  longer reflects what's in the repo; kept for history.
- **What was built:** `packages/domain/compiler/src/routeGraph.ts` —
  `buildRouteClassBuckets(root, srcDir, files)`. Pure TS, no native binding changes needed:
  `scanWorkspace()` already returns per-file classes (`ScannedFile { file, classes, hash }`),
  the only missing piece was the file-to-file import graph, which this module builds via a
  regex-based static import extractor:
  ```
  import ... from "..."
  import "..."               (side-effect)
  import("...")              (dynamic, literal string only)
  ```
  Plus tsconfig `paths`/`baseUrl` alias resolution. Entry points = files matching
  `app/.../page.{tsx,ts,jsx,js}`; BFS from each entry over the import graph gives the reachable
  file set per route; a file reachable by exactly one route gets its classes attributed
  exclusively to that route, anything reachable by 2+ routes (or 0, or a
  layout/loading/error/template/not-found/default file) falls back to `"__global"`. Wired into
  `withTailwindStyled.ts`'s existing config-eval IIFE (same place as the `__global`-only version),
  writing one CSS file per non-empty bucket + `css-manifest.json` mapping every populated route.
- **Bug found and fixed during validation (would have silently broken every consumer using
  tsconfig path aliases — i.e. most Next.js apps):** the first version of
  `loadTsconfigAliases()` stripped `//` and `/* */` comments from `tsconfig.json` with a naive
  regex before `JSON.parse`. That regex doesn't respect string literal boundaries: the alias
  `"@/*"` itself contains the literal substring `/*`, and `"include": ["**/*.ts", ...]` glob
  entries contain the literal substring `*/`. The naive stripper matched `/*` inside `"@/*"` as a
  comment open and ate everything up to the next `*/` it found — which landed inside one of the
  `**/*.ts` glob strings — corrupting the JSON and throwing on `JSON.parse`. Caught by an empirical
  smoke test against the real `examples/next-js-app` (expected components to attribute to `/`;
  instead everything fell through to `__global` because alias resolution silently failed).
  Replaced with a string-literal-aware tokenizer (`stripJsonComments()`) that tracks in-string
  state (incl. `\"` escapes) and only treats `//`/`/* */` as comments when outside a string.
- **Validated empirically (not just unit-shaped):**
  1. Real `examples/next-js-app`: 14 `src/components/*` files correctly attributed exclusively to
     `/` (root page imports them directly); `/docs` page (self-contained, no shared imports) got
     its own exclusive bucket; `layout.tsx` correctly fell to `__global`; `DevToolsClient.tsx` —
     discovered to be genuinely unused/orphaned (not imported anywhere in `src/`) — correctly fell
     to `__global` via the "unreachable by any route" safe-fallback path, not the shared-segment
     path. Good incidental catch: another small piece of dead code, not logged separately since
     it's harmless and the fallback already handles it correctly.
  2. Synthetic fixture: component imported by exactly one of two routes → attributed correctly to
     that route; component imported by both → correctly fell to `__global`; relative imports
     (`./circularA`) resolved correctly; a deliberate circular import pair (`circularA` ⇄
     `circularB`, both only reachable from `/`) terminated correctly (no infinite loop) and both
     landed in `/`'s bucket.
  3. Synthetic fixture: dynamic segment `app/blog/[slug]/page.tsx` → route `/blog/[slug]`
     (brackets preserved in the route key, slugified separately for the filename); route group
     `app/(marketing)/pricing/page.tsx` → route `/pricing` (group segment correctly stripped from
     the URL, per Next.js convention).
- **Known limitations (by design, documented in `routeGraph.ts`):** nested layouts always fall to
  `__global` rather than being scoped to their actual subtree (conservative — never mis-attributes,
  just over-shares to global for that case); a dynamic `import(someVariable)` with a non-literal
  path can't be statically resolved, so the imported file becomes unreachable and falls to
  `__global` (same safe-but-under-split behavior). Filename collisions between a slugified dynamic
  route and a literal one with the same slug (e.g. `/blog/[slug]` vs `/blog/slug`) are disambiguated
  with a numeric suffix at write time in `withTailwindStyled.ts` — `routeToCssFilename()` itself is
  not collision-proof on its own.
- **Status:** Fixed and validated against both a real example app and synthetic edge-case
  fixtures. `getAllRegisteredClasses()`/`getRouteClasses()`/`fileToRoute()` in
  `packages/domain/compiler/src/index.ts` remain unused by this pipeline (kept for other
  consumers, e.g. the `tw split` CLI) — doc comments there and in `upstream-modules.d.ts` updated
  to stop describing per-route splitting as nonexistent.

## 2026-06-27 — Next.js 16 default Turbopack build means `withTailwindStyled()`'s `webpack(config, options)` callback never runs at all

- **Symptom:** Nothing wired through the `webpack()` callback in `withTailwindStyled.ts` (dev-mode
  guard, `applyWebpackRule`, `StaticCssWebpackPlugin` registration, the `externals` patch, and any
  `compiler.hooks.done`-based plugin) ever executes — no error, no warning, build just succeeds
  without ever invoking that code path.
- **Where:** `packages/presentation/next/src/withTailwindStyled.ts`, the returned `webpack(config,
  webpackOptions)` function.
- **Root cause:** Confirmed empirically (minimal Next.js 16.2.4 probe app, App Router, custom
  webpack plugin tapping `compiler.hooks.done`) and against a known community report
  (vercel/next.js discussion #14330): Next.js 16 stable defaults **both** `next dev` and `next
  build` to Turbopack, not just dev as in 15.x. `process.env.TURBOPACK` is `"auto"` whenever
  Turbopack is active (default, or explicit `--turbopack`) and is unset only when `--webpack` is
  passed explicitly. When Turbopack is active, Next.js does **not call the `webpack()` config
  function at all** — confirmed by adding a top-level `console.log` / throw at the very start of
  the function body, which never fired. This is more fundamental than "the done-hook doesn't fire"
  — the entire function body is dead code under default settings, for both dev and prod.
  - Correction to an earlier theory: `withTailwindStyled()` already sets a non-empty
    `turbopack: {rules: ...}` key unconditionally in its returned config, so the separate Next.js
    "build is using Turbopack with a webpack config and no turbopack config" hard-error does
    **not** apply to this codebase's actual exported config (it only reproduces in an isolated
    probe that omits the `turbopack` key entirely).
  - Also confirmed: `_tw-state-static.css` (supposedly produced by `StaticCssWebpackPlugin` at
    `compiler.hooks.done`) is **not** actually orphaned under default Turbopack —
    `appendStaticStateCssToSafelist()` (`packages/domain/shared/src/staticStateExtractor.ts`)
    writes a real initial version directly from the fire-and-forget async IIFE in
    `withTailwindStyled.ts`'s outer body, which runs unconditionally at config-eval time
    regardless of bundler.
  - **Correction (same day, caught before acting on it):** initially classified
    `StaticCssWebpackPlugin` as pure vestigial dead weight safe to delete outright. That's wrong —
    it's only *unreachable* under default Turbopack; under explicit `--webpack` it still provides
    something the startup-only IIFE genuinely does not: incremental / HMR-aware updates to
    `_tw-state-static.css` as files change *during* an active dev session (via
    `setFileStaticCss()` called per-file from `webpackLoader.ts`, flushed on every
    `compiler.hooks.done`). The IIFE only runs once, at server startup — editing a component's
    `states` config mid-session and seeing it reflected without restarting `next dev` currently
    only works in `--webpack` mode, and only because of this plugin. Kept in place; added a
    status comment in the file itself instead of removing it.
- **Fix:** Any logic that must run regardless of which bundler ends up active (CSS generation,
  manifest writing, etc.) belongs in the config-eval-time IIFE in the outer body of `wrap()`, not
  in the `webpack()` callback. Applied for the CSS-manifest pipeline — see next entry.
  `StaticCssWebpackPlugin` left in place deliberately (not a cleanup candidate after all — see
  correction above), with a comment added explaining when it's actually reachable.
- **Status:** Root cause confirmed empirically; worked around for the CSS-manifest path (next
  entry). `StaticCssWebpackPlugin` kept as-is; no further action needed unless/until there's a
  Turbopack-compatible way to get incremental rebuild notifications (no such hook currently
  exposed via `next.config`).

## 2026-06-27 — `css-manifest.json` for `routeCss: true` had no producer at all; recovered draft fix had a mangled filename and a dead-on-arrival design

- **Symptom:** `TwCssInjector` (`packages/domain/runtime-css/src/CssInjector.tsx`) always warned
  manifest not found and rendered `<></>`, even with `routeCss: true` set in
  `withTailwindStyled({...})`.
- **Where:** `packages/domain/compiler/src/index.ts` (registry),
  `packages/presentation/next/src/withTailwindStyled.ts`.
- **Root cause (layered):**
  1. `registerFileClasses` / `registerGlobalClasses` / `getRouteClasses` were no-op stubs —
     already fixed to a real in-memory registry (`_fileClassesMap` / `_globalClasses` in
     `compiler/index.ts`) in a prior pass.
  2. No code anywhere ever wrote `css-manifest.json`. A draft fix (`RouteCssManifestPlugin`, a
     `compiler.hooks.done`-based webpack plugin) was written in a prior session but the file landed
     in this repo as `Routecssmanifestplugin .ts` — wrong case, trailing space before the
     extension — i.e. it never actually existed as an importable module under its intended name.
     Likely cause: manual copy of `create_file` output from a separate, ephemeral session
     environment into the real repo before re-zipping; nothing else in that session's edits (all
     `str_replace` on existing files) was affected, only this one `create_file`.
  3. Independent of the filename bug: that draft's `compiler.hooks.done` design would have been
     dead-on-arrival anyway per the entry above — it never executes under default Turbopack
     builds.
  4. The `routeCss` option itself was declared in both `NextAdapterOptionsSchema` and
     `withTailwindStyled.ts`'s option types but never actually **read** anywhere in
     `withTailwindStyled.ts` — so even with a working producer wired in, the feature had no gate.
  5. A second, more subtle issue: the validated fix location (the config-eval-time IIFE) runs
     **once, at startup, before the bundler has compiled a single file**.
     `getAllRegisteredClasses()` only gets populated progressively by `registerFileClasses()`
     calls from `webpackLoader.ts` / `turbopackLoader.ts` *during* compilation — which starts
     strictly after config-eval. Reading that registry from the startup IIFE would always observe
     an empty set. Separately, `getRouteClasses()`'s `fileToRoute()` only recognizes:
     ```
     page.tsx / layout.tsx / loading.tsx / error.tsx
     ```
     directly — classes from shared components fall through to `"__global"` anyway via the
     `fileToRoute(filepath) ?? "__global"` fallback. So even setting the timing issue aside,
     the registry doesn't currently buy real per-route splitting — true per-route splitting needs
     import-graph tracing that doesn't exist in this compiler yet. The separate native
     `analyze_route_class_distribution` (used by `tw split` CLI) is closer to this but is a
     disconnected pipeline with a different manifest shape.
- **Fix:** Removed the mangled `Routecssmanifestplugin .ts` file entirely (abandoning the
  webpack-hook design). Implemented the `__global`-only manifest write directly inside the
  existing config-eval-time IIFE in `withTailwindStyled.ts`, gated behind
  `normalizedOptions.routeCss`, sourced from `filteredClasses` / `utilitiesOnly` (the same
  `scanWorkspace()` result already used for `_initial-scan.css` — synchronously available, no
  registry-timing dependency). Writes via the existing `atomicWriteFile()` helper:
  ```
  .next/static/css/tw/_global.css
  .next/static/css/tw/css-manifest.json   →  { routes: { __global: "_global.css" } }
  ```
  Updated the stale `withTailwindStyled.ts` comment that claimed "production: webpack handles
  both" (contradicted by the entry above), and the doc comments in `upstream-modules.d.ts` /
  `compiler/index.ts` that referenced the now-removed `RouteCssManifestPlugin` class.
- **Status:** `__global`-bucket manifest generation fixed and wired end-to-end (dev + any build
  bundler) — **superseded same day**, see the newer entry above: real per-route splitting was
  implemented via `routeGraph.ts` (import-graph tracing), not deferred after all.
  `getAllRegisteredClasses()` / `fileToRoute()` registry was NOT used for that — kept for other
  consumers (e.g. `tw split` CLI). Also noted but not addressed: `getAllRoutes()` in
  `compiler/index.ts` throws if the native `analyzeClasses` binding is missing, but then ignores
  its result and returns a hardcoded `["/", "__global"]` regardless — unused anywhere currently,
  flagged as a minor code-hygiene item.


## 2026-06-27 — `preserveDirectives()` in `tsup.config.ts` never actually injects "use client" (silently no-op)

- **Symptom:** `withTailwindStyled.ts` carries a comment (lines ~688-718) claiming Bug A (SSR
  500, `"Cannot read properties of null (reading 'useState')"`) is fixed because `dist/index.mjs`
  is now correctly prefixed with `"use client"`. Direct inspection of the **published**
  `tailwind-styled-v4@5.1.11` tarball shows `dist/index.mjs`, `dist/theme.mjs`,
  `dist/runtime.mjs` (and their `.js` CJS counterparts) have **no** `"use client"` anywhere —
  only the `.map` files reference it (because sourcemaps embed original source).
- **Where:** `tsup.config.ts`, `preserveDirectives()` (~line 76) + its call site `onSuccess()`
  (~line 230).
- **Root cause:** Two compounding bugs in `preserveDirectives()`:
  1. It hardcodes reading only `metafile-esm.json`, never `metafile-cjs.json`. tsup (confirmed in
     `tsup@8.5.0` source, `dist/index.js:628`) writes one metafile per format:
     ```
     metafile-${format}.json
     ```
  2. Its output filter is:
     ```javascript
     if (!outPath.endsWith(".js")) return
     ```
     Since root `package.json` has no `"type": "module"`, tsup's ESM outputs are named `*.mjs`
     (confirmed against the published tarball, which ships matching `.js` / `.mjs` pairs per
     entry) — `"index.mjs".endsWith(".js")` is `false`, so **every** output listed in
     `metafile-esm.json` is skipped by this filter.
  Net effect: the function reads a metafile whose outputs are all filtered out, and never reads
  the one metafile whose outputs would pass the filter. It is currently a complete no-op for both
  formats — the directive is never written to any dist file, regardless of what the source-level
  `"use client"` in `packages/domain/theme/src/liveTokenEngine.ts` says.
- **Fix:** Not yet applied. Needs `preserveDirectives()` to loop over both `metafile-esm.json`
  and `metafile-cjs.json` and match each one's outputs against its own format's real extension
  (`.mjs` for esm, `.js` for cjs) — e.g. parameterize by `{ metaFile, matchExt }` per format
  instead of hardcoding `"metafile-esm.json"` + `".js"`.
- **Status:** Root cause fully identified (verified against actual tsup source + published tarball
  bytes). Bug A's `serverExternalPackages` fix (removing `tailwind-styled-v4` from that list) is
  confirmed already applied in both local source **and** the published `5.1.11` — but per the
  `withTailwindStyled.ts` comment's own reasoning, that fix depends on the directive actually
  being present in `dist/index.mjs`. Until this `preserveDirectives()` bug is fixed and a new
  version is published, Bug A should be assumed **not actually resolved** end-to-end, despite the
  confident comment in `withTailwindStyled.ts` claiming otherwise.

## 2026-06-27 — `FATAL: Native binding 'parseTemplate' is required but not available` thrown in browser at `ExtendDemo.tsx` module evaluation

- **Symptom:** Uncaught browser error at module evaluation, not just a console warning — crashes
  the page. Stack points at `ExtendDemo.tsx`, the declaration:
  ```typescript
  tw.nav`...`.withSub<...>()
  ```
  (template-literal call chained with `.withSub`, not object-config).
- **Where:** `examples/next-js-app/src/components/ExtendDemo.tsx`, the `NavBar` export.
- **Investigation:** Matches SKILL.md Pattern C: template-literal `tw.*` calls need the Rust AST
  transform to run at build time (rewriting them to static object-config) — if it doesn't, the raw
  template-literal call ships as-is and calls native `parseTemplate()` at runtime, which can never
  exist in a browser bundle by definition. The native binary itself is confirmed healthy on this
  machine (same log shows `[scanner] [native] using native parser from
  .../tailwind-styled-native.node` succeeding), so this isn't binary-load failure (Pattern B) —
  it's specifically the Turbopack loader not transforming this file/expression.
- **Root cause:** Not yet pinned down. Open questions for next reproduction:
  - Does the Turbopack rule actually run on `ExtendDemo.tsx` at all? Add temporary logging in
    `turbopackLoader.ts`'s `isSkippable()`.
  - Does `runLoaderTransform()`'s AST matcher handle a template-literal immediately chained with
    `.withSub<...>()` the same as a bare `tw.nav\`...\``?
  - Confirm `examples/next-js-app` is even resolving the Next adapter version that contains the
    current Turbopack rule logic — it installs `tailwind-styled-v4` from the registry, not local
    source, so version skew is possible (see `architecture.md`).
- **Fix:** Not yet applied — needs reproduction with the above narrowed before proposing one.
- **Status:** Open — pattern identified (Pattern C), exact trigger not yet isolated.

## 2026-06-26 — `FATAL: Native binding 'generateSystemTokenCss' is required but not available`

- **Symptom:** Uncaught error in browser console at module evaluation of a component calling
  `createStyledSystem({...})` (e.g. `DesignSystem.tsx`).
- **Where:** `packages/domain/core/src/native.ts` / `styledSystem.ts`, thrown when
  `getNativeBinding()?.generateSystemTokenCss` is `undefined`.
- **Root cause:** Confirmed version drift between the published `tailwind-styled-v4` main package
  and its native platform `optionalDependencies` — see `architecture.md` "Confirmed version drift"
  table (4 different version numbers found across `root` / `core` / `native` /
  `published-optionalDeps`). If `generateSystemTokenCss` was added to the JS after the pinned
  native version, the loaded binary simply doesn't export it.
- **Fix:** Re-sync / republish `@tailwind-styled/native-*` `optionalDependency` pins to match the
  native code actually shipped for the current main-package version. Not yet applied — flagged for
  the maintainer to fix in the release pipeline.
- **Status:** Root cause identified, fix not yet applied.

## 2026-06-26 — `TypeError: BaseCard.extend is not a function`

- **Symptom:** Build-time / SSR `TypeError` at module evaluation of `ExtendDemo.tsx`, calling
  `.extend()` on a `tw.div({...})`-created component.
- **Where:** `examples/next-js-app` (installs `tailwind-styled-v4` from the public npm registry —
  `examples/*` is not a workspace member, see `architecture.md`).
- **Investigation:** `createComponent.ts` always attaches `.extend` regardless of native binding
  state (object-config path doesn't touch native at all). Pulled the actual published
  `tailwind-styled-v4@5.1.4` tarball and called `tw.div({base:''}).extend(...)` directly in
  Node — `.extend` **was** present and callable there. So the published bundle itself is not
  obviously broken for this symbol.
- **Root cause:** Not fully pinned down for the user's exact machine/run. Leading suspects, in
  order:
  1. Stale / partial `node_modules/tailwind-styled-v4` from a previous install (the `npm i` log
     showed "changed 1 package" — consistent with a partial refresh).
  2. Dual module instance / stale Turbopack cache serving an older chunk for the SSR bundle
     specifically.
- **Fix:** Not yet applied. Verification steps to run before concluding:
  ```bash
  rm -rf .next node_modules/.cache
  node -e "console.log(typeof require('tailwind-styled-v4').tw.div({base:''}).extend)"
  ```
  Run from inside `examples/next-js-app` against the *exact* installed copy, before re-testing
  in the Next dev server.
- **Status:** Open — needs reproduction with a clean cache to narrow further.

## 2026-06-26 — `[tailwind-styled-v4] tw.server.div rendered in browser...` warning fires despite correct config

- **Symptom:** Console warning suggesting `withTailwindStyled` / Vite plugin isn't configured,
  even though `examples/next-js-app/next.config.ts` does wrap
  `withTailwindStyled({ routeCss: true })`.
- **Where:** `packages/domain/core/src/twProxy.ts`, `makeServerTag()`.
- **Root cause:** The warning condition is:
  ```typescript
  typeof window !== "undefined" && process.env.NODE_ENV !== "production"
  ```
  It fires on **every** client-side render of a `tw.server.*` component in dev,
  unconditionally. It does not actually check whether the compiler / plugin transformed the
  component or not, so it's not a reliable signal of misconfiguration.
- **Fix:** Not yet applied — the real fix belongs in `twProxy.ts`: the condition should check
  whether this specific component was actually compiler-transformed (e.g. via a marker the
  transform sets) rather than firing for every client render unconditionally.
- **Status:** Root cause identified (warning logic itself is the bug), fix not yet applied.