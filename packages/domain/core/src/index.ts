/**
 * tailwind-styled-v4 v3 — Public API
 *
 * New in v3:
 *   - Reactive State Engine: tw.button({ state: { active: "..." } })
 *   - Container Query Engine: tw.div({ container: { md: "flex-row" } })
 *   - Live Token Engine: liveToken({ primary: "#3b82f6" })
 */

export type { ContainerEntry } from "./containerQuery"
// ── Container Query Engine ────────────────────────────────────────────────────
export {
  generateContainerCss,
  getContainerRegistry,
  processContainer,
} from "./containerQuery"
export { createComponent } from "./createComponent"
export { cv } from "./cv"
export { cn, cx, cxm } from "./cx"
export type { LiveTokenSet, TokenMap, TokenSubscriber } from "./liveTokenEngine"
// ── Live Token Engine ─────────────────────────────────────────────────────────
export {
  applyTokenSet,
  createUseTokens,
  generateTokenCssString,
  getToken,
  getTokens,
  liveToken,
  setToken,
  setTokens,
  subscribeTokens,
  tokenRef,
  tokenRef as containerRef,
  tokenVar,
} from "./liveTokenEngine"
export type { MergeOptions } from "./merge"
export { createTwMerge, mergeWithRules, twMerge } from "./merge"
// ── Native Rust Bindings ─────────────────────────────────────────────────────
// NOTE: Native functions are Node.js-only (require Rust .node binding).
// Import from "tailwind-styled-v4/native" instead of the main bundle.
// This prevents fs/node built-ins from leaking into browser bundles.
export type { ParsedClass, ParsedClassModifier, ThemeConfig } from "./native"
export type { SubComponentEntry, SubComponentProps } from "./registry"
// ── Sub-Component Registry ───────────────────────────────────────────────────
export {
  getAllSubComponents,
  getSubComponent,
  registerSubComponent,
  withSubComponents,
} from "./registry"
export type { StateComponentEntry } from "./stateEngine"
// ── Reactive State Engine ─────────────────────────────────────────────────────
export {
  generateStateCss,
  getStateRegistry,
  processState,
} from "./stateEngine"
export type { StyledOptions, StyledProps } from "./styled"
export { resolveStyledClassName, styled } from "./styled"
export type {
  StyledSystemConfig,
  StyledSystemInstance,
  SystemComponentConfig,
  SystemComponentFactory,
  SystemTokenMap,
} from "./styledSystem"
// ── Design System Factory ─────────────────────────────────────────────────────
export { createStyledSystem } from "./styledSystem"
// ── Core ──────────────────────────────────────────────────────────────────────
export { server, tw } from "./twProxy"
export type { ResolvedThemeTokens, ThemeTokenMap } from "./twTheme"
// ── Tailwind v4 CSS Variables ─────────────────────────────────────────────────
export { createTheme, cssVar, t, twVar, v4Tokens } from "./twTheme"
// ── Types ─────────────────────────────────────────────────────────────────────
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
} from "./types"