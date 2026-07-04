/**
 * Node/SSR entry point untuk tailwind-styled-v4.
 * Import langsung dari source TS supaya tidak bergantung pada
 * @tailwind-styled/core dist yang harus di-build dulu.
 */

// Core API
export { tw, server } from "../../packages/domain/core/src/twProxy"
export { cv, registerVariantTable } from "../../packages/domain/core/src/cv"
export { cn, cx, cxm } from "../../packages/domain/core/src/cx"
export { createComponent } from "../../packages/domain/core/src/createComponent"
export { createTwMerge, twMerge, mergeWithRules } from "../../packages/domain/core/src/merge"

// Engines
export { processState, generateStateCss, getStateRegistry } from "../../packages/domain/core/src/stateEngine"
export { processContainer, generateContainerCss, getContainerRegistry } from "../../packages/domain/core/src/containerQuery"

// Design system
export { createStyledSystem } from "../../packages/domain/core/src/styledSystem"
export { resolveStyledClassName, styled } from "../../packages/domain/core/src/styled"

// Theme
export { createTheme, cssVar, twVar, t, v4Tokens } from "../../packages/domain/core/src/twTheme"

// Live tokens — SENGAJA TIDAK di-re-export dari sini (lihat known-issues
// 2026-06-28). liveTokenEngine.ts punya "use client" (createUseTokens pakai
// React.useState/useEffect — directive itu LEGIT, bukan bug). Tapi karena
// splitting:false, "use client" itu nge-tag SELURUH dist/index.mjs, bukan
// cuma bagian live-token-nya — dan React/Next RSC mengubah SEMUA export dari
// file "use client" jadi client reference begitu di-import dari Server
// Component, termasuk tw/cv/cx/createComponent yang sebenarnya aman dipakai
// di server. Akibatnya `tw.div` (dipakai di module scope Server Component,
// pattern yang sama dengan docs/page.tsx) jadi "is not a function" — bukan
// build-time error, baru muncul di runtime/static-generation. Dibuktikan
// empiris: strip "use client" dari dist/index.mjs → semua Server + Client
// Component lolos build. Live-token functions sudah tersedia lengkap (plus
// alias containerRef) lewat "tailwind-styled-v4/runtime" — subpath itu
// SUDAH benar terisolasi: "use client"-nya cuma nge-cover file itu sendiri,
// tidak ikut menaungi entry utama. Konsumen yang sebelumnya import
// liveToken/tokenVar/createUseTokens/containerRef dari "tailwind-styled-v4"
// (main entry) perlu pindah ke "tailwind-styled-v4/runtime" — lihat
// CHANGELOG.

// Registry
export {
  registerSubComponent,
  getSubComponent,
  getAllSubComponents,
  withSubComponents,
} from "../../packages/domain/core/src/registry"

// Types
export type { ParsedClass, ParsedClassModifier, ThemeConfig } from "../../packages/domain/core/src/native"
export type {
  ComponentConfig,
  ContainerConfig,
  CvFn,
  HtmlTagName,
  InferVariantProps,
  StateConfig,
  StyledComponentProps,
  SubComponentMap,
  TwComponentFactory,
  TwObject,
  TwStyledComponent,
  TwSubComponent,
  TwTagFactory,
  TwTagFactoryAny,
  VariantLiterals,
} from "../../packages/domain/core/src/types"
export type { ContainerEntry } from "../../packages/domain/core/src/containerQuery"
export type { MergeOptions } from "../../packages/domain/core/src/merge"
export type { ResolvedThemeTokens, ThemeTokenMap } from "../../packages/domain/core/src/twTheme"
export type { StateComponentEntry } from "../../packages/domain/core/src/stateEngine"
export type { StyledOptions, StyledProps } from "../../packages/domain/core/src/styled"
export type {
  StyledSystemConfig,
  StyledSystemInstance,
  SystemComponentConfig,
  SystemComponentFactory,
  SystemTokenMap,
} from "../../packages/domain/core/src/styledSystem"
export type { SubComponentEntry, SubComponentProps } from "../../packages/domain/core/src/registry"
// LiveTokenSet, TokenMap, TokenSubscriber types not re-exported — use "tailwind-styled-v4/runtime" instead
// (see known-issues 2026-06-28 for details on why liveTokenEngine is excluded from main entry)
