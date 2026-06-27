# Bugfix Requirements Document

## Introduction

The `examples/next-js-app` Next.js example application crashes and shows multiple errors when running `npm run dev`. There are five distinct but related bugs:

1. **React hook rule violation** caused by a duplicate React instance — `tailwind-styled-v4`'s internal `index.mjs` imports React, and because the package is externalized via `serverExternalPackages`, the RSC (react-server) condition resolves React to a server-only build whose hooks are null-stubs.
2. **`tw.server.*` rendered in browser** — `server.div(...)` components appear in browser context because the Next.js/Turbopack plugin is not correctly intercepting them at build time.
3. **Hard crash: `resolveClassNames` native binding required but not available** — `cn()` in `cx.ts` unconditionally calls the native Rust binding at runtime inside `Avatar.tsx`, even when executing in the browser where `.node` N-API addons cannot load.
4. **Informational native binding warnings** — `twMergeRaw` and `parseTemplate` log console warnings in the browser, which, while non-fatal, indicate the browser bundle condition is not being correctly applied.
5. **Unrecognized HTML custom element names** — Sub-component names like `<icon>`, `<text>`, and `<badge>` are rendered as unknown HTML tags in the browser because they are passed as raw tag strings instead of being mapped to valid HTML elements.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a client component that uses React hooks (e.g. `useState`) from `tailwind-styled-v4` is rendered AND `tailwind-styled-v4` is listed in `serverExternalPackages` in `next.config.ts` THEN the system throws `TypeError: Cannot read properties of null (reading 'useState')` and crashes with `Invalid hook call`

1.2 WHEN `Avatar.tsx` renders `AvatarRoot` (created via `server.div({...})`) inside a page that is executed in the browser THEN the system throws `Uncaught Error: Native binding 'resolveClassNames' is required but not available` and the page hard-crashes

1.3 WHEN `cn()` is called at browser runtime (e.g. inside `Avatar.tsx` at line 90: `cn(!src && color, className)`) THEN the system unconditionally attempts to call `native.resolveClassNames(strings)` and throws because the native binding is `null` in the browser

1.4 WHEN `tw.server.*` components such as `server.div({...})` in `Avatar.tsx` are rendered client-side (because `page.tsx` is a `"use client"` file and imports `Avatar`) THEN the system logs `[tailwind-styled-v4] tw.server.div rendered in browser. Ensure withTailwindStyled or Vite plugin is configured.` — indicating the loader transform did not execute

1.5 WHEN the app builds with Turbopack in dev mode (`next dev`) THEN the system skips the webpack transform entirely (by design in `withTailwindStyled.ts`), so `tw.server.*` components are never replaced by their statically-resolved className output — they pass through as proxy objects and render at runtime

1.6 WHEN sub-components of `Button`, `Alert`, and `Card` render their inner `icon`, `text`, `badge`, `content`, `title`, `message`, `header`, `body`, `footer` sub-component slots THEN the system renders raw lowercase tag names (e.g. `<icon>`, `<text>`, `<badge>`) as unrecognized HTML elements in the browser

---

### Expected Behavior (Correct)

2.1 WHEN a client component using React hooks from `tailwind-styled-v4` is rendered THEN the system SHALL resolve a single React instance (the app's own React copy in `examples/next-js-app/node_modules/react`) and hooks SHALL work without error

2.2 WHEN `Avatar.tsx` renders `AvatarRoot` (a `server.div` component) inside any page or component THEN the system SHALL NOT crash — the browser bundle path SHALL call `cn()` with a safe pure-TS fallback that does not require the native `.node` binding

2.3 WHEN `cn()` is called at browser runtime THEN the system SHALL return the correctly filtered and joined class string using a pure-TypeScript fallback (equivalent to filtering falsy values and joining with a space), without throwing

2.4 WHEN the Next.js app starts with Turbopack (`next dev`) THEN the system SHALL correctly apply the `withTailwindStyled` plugin so that `tw.server.*` components either render without the browser warning or are converted to static `<div>` wrappers at build/server-render time

2.5 WHEN `tailwind-styled-v4` is imported from a `"use client"` component in Next.js THEN the system SHALL resolve the `browser` export condition (`dist/index.browser.mjs`) instead of the `node` or `react-server` condition, ensuring hooks-capable React is used

2.6 WHEN a `tw.*` sub-component named `icon`, `text`, `badge`, `content`, `title`, `message`, `header`, `body`, or `footer` is rendered THEN the system SHALL render a valid semantic HTML element (`<span>` or the tag specified in the `sub` key via `"tag:name"` syntax) — not a raw lowercase custom element name

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `tw.div(...)`, `tw.button(...)`, or any `tw.*` component is used in a purely server-side rendered page (RSC, no `"use client"`) THEN the system SHALL CONTINUE TO resolve classes using the native Rust binding on the server side

3.2 WHEN the Next.js app is built for production (`next build`) THEN the system SHALL CONTINUE TO run the webpack transform for static CSS extraction via the `withTailwindStyled` webpack loader

3.3 WHEN `twMerge` or `cx` is called in a Node.js / SSR context THEN the system SHALL CONTINUE TO use the Rust native binding for class merging and conflict resolution

3.4 WHEN `liveToken()` and `createUseTokens()` are used in a `"use client"` component THEN the system SHALL CONTINUE TO provide reactive token updates without requiring native bindings in the browser

3.5 WHEN `Avatar`, `Badge`, `Button`, `Card`, `Alert`, and other example components are rendered with their variant props THEN the system SHALL CONTINUE TO apply the correct variant classes (size, color, intent, etc.)

3.6 WHEN `withTailwindStyled` runs its initial scan at server startup THEN the system SHALL CONTINUE TO invoke `scanWorkspace` via the Rust native scanner to generate `_initial-scan.css` at build time

3.7 WHEN `server.div(...)` components are rendered server-side (in RSC or `getServerSideProps` context) THEN the system SHALL CONTINUE TO render without warnings and without calling the native binding at browser runtime

3.8 WHEN `npm run build` (production build) is run THEN the system SHALL CONTINUE TO succeed and produce a correct static CSS output without runtime native binding errors

---

## Bug Condition Pseudocode

**Bug Condition Function — `resolveClassNames` crash (Bug 1.2 / 1.3)**:

```pascal
FUNCTION isBugCondition_resolveClassNames(X)
  INPUT: X of type CnCallContext
  OUTPUT: boolean

  RETURN X.isBrowserEnvironment = true
    AND X.nativeBinding = null
    AND X.caller = "cn()"
    AND cn() does NOT have a pure-TS fallback path
END FUNCTION
```

```pascal
// Property: Fix Checking — cn() must not throw in browser
FOR ALL X WHERE isBugCondition_resolveClassNames(X) DO
  result ← cn'(X.inputs)   // cn' = fixed cn()
  ASSERT no_throw(result)
  ASSERT result = filtered_join(X.inputs)
END FOR
```

**Bug Condition Function — React duplicate instance (Bug 1.1)**:

```pascal
FUNCTION isBugCondition_reactDuplicate(X)
  INPUT: X of type ImportContext
  OUTPUT: boolean

  RETURN X.package = "tailwind-styled-v4"
    AND X.nextConfig.serverExternalPackages contains "tailwind-styled-v4"
    AND X.resolvedCondition IN ["react-server", "node"]
    AND X.component uses React hooks
END FUNCTION
```

```pascal
// Property: Fix Checking — hooks must resolve against app React, not server-stub React
FOR ALL X WHERE isBugCondition_reactDuplicate(X) DO
  result ← render'(X.component)
  ASSERT no_throw(result)
  ASSERT result.usedReactInstance = X.appReactInstance
END FOR
```

**Preservation Goal**:

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_resolveClassNames(X) DO
  ASSERT cn(X) = cn'(X)   // Node/SSR path unchanged
END FOR

FOR ALL X WHERE NOT isBugCondition_reactDuplicate(X) DO
  ASSERT render(X.component) = render'(X.component)   // SSR/RSC path unchanged
END FOR
```
