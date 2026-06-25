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

// Live tokens
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
} from "../../packages/domain/core/src/liveTokenEngine"

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
export type { LiveTokenSet, TokenMap, TokenSubscriber } from "../../packages/domain/core/src/liveTokenEngine"
