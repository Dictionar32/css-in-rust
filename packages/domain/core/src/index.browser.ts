/**
 * Browser-safe entry point untuk @tailwind-styled/core.
 * Tidak mengandung node built-ins (fs, module, crypto, path, url).
 * Semua export sama dengan index.ts kecuali native-only exports.
 */

export type { ContainerEntry } from "./containerQuery"
export {
  generateContainerCss,
  getContainerRegistry,
  processContainer,
} from "./containerQuery"
export { createComponent } from "./createComponent"
export { cv } from "./cv"
export { cn, cx, cxm } from "./cx"
export type { LiveTokenSet, TokenMap, TokenSubscriber } from "./liveTokenEngine"
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
// Native types only — no runtime native binding
export type { ParsedClass, ParsedClassModifier, ThemeConfig } from "./native"
export type { SubComponentEntry, SubComponentProps } from "./registry"
export {
  getAllSubComponents,
  getSubComponent,
  registerSubComponent,
  withSubComponents,
} from "./registry"
export type { StateComponentEntry } from "./stateEngine"
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
export { createStyledSystem } from "./styledSystem"
export { server, tw } from "./twProxy"
export type { ResolvedThemeTokens, ThemeTokenMap } from "./twTheme"
export { createTheme, cssVar, t, twVar, v4Tokens } from "./twTheme"
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