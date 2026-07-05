/**
 * CSS Layout — Box Model (Complete)
 * tailwind-styled-v4
 *
 * Drop ke: examples/next-js-app/src/app/docs/learn/box-model/page.tsx
 */

"use client"

import { useState } from "react"
import { tw } from "tailwind-styled-v4"

// ─────────────────────────────────────────────────────────────────────────────
// Shell
// ─────────────────────────────────────────────────────────────────────────────

const Page = tw.div({
  base: "min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans",
  attrs: { "data-learn-page": "" },
})

const TopBar = tw.nav({
  base: `
    sticky top-0 z-50 h-12
    border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]
    bg-[color-mix(in_srgb,var(--surface)_85%,transparent)]
    backdrop-blur-md
  `,
  attrs: { "data-learn-topbar": "" },
})

const TopBarInner = tw.div({
  base: "max-w-5xl mx-auto px-4 h-full flex items-center gap-2 text-sm",
})

const Breadcrumb = tw.div({
  base: "flex items-center gap-1.5 text-xs text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]",
  sub: {
    "a:link": "hover:text-[var(--foreground)] transition-colors",
    "span:sep": "opacity-40",
    "span:curr": "text-[var(--foreground)] font-medium",
  },
})

const Body = tw.div({
  base: "max-w-5xl mx-auto px-4 py-10 flex gap-10",
})

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar TOC
// ─────────────────────────────────────────────────────────────────────────────

const Toc = tw.aside({
  base: "hidden xl:block w-52 shrink-0 sticky top-16 h-fit space-y-1",
})

const TocLabel = tw.p({
  base: "text-[10px] font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--foreground)_35%,transparent)] mb-3",
})

const TocItem = tw.a({
  base: "block text-xs py-1 leading-snug transition-colors pl-0",
  variants: {
    active: {
      true: "text-[var(--accent)] font-semibold",
      false: "text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] hover:text-[var(--foreground)]",
    },
    depth: {
      2: "pl-0",
      3: "pl-3",
    },
  },
  defaultVariants: { active: false, depth: 2 },
})

// ─────────────────────────────────────────────────────────────────────────────
// Content
// ─────────────────────────────────────────────────────────────────────────────

const Content = tw.main({
  base: "flex-1 min-w-0",
})

const PageTitle = tw.h1({
  base: "text-3xl font-bold tracking-tight mb-2",
})

const PageDesc = tw.p({
  base: "text-base text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] mb-10 leading-relaxed",
})

const Divider = tw.hr({
  base: "border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] my-10",
})

// Section
const Section = tw.section({
  base: "scroll-mt-20 mb-10",
})

const H2 = tw.h2({
  base: "text-xl font-bold mb-4 scroll-mt-20 flex items-center gap-2 group",
  sub: {
    "a:anchor": "opacity-0 group-hover:opacity-100 text-[var(--accent)] text-base no-underline",
  },
})

const H3 = tw.h3({
  base: "text-base font-semibold mb-3 mt-6 scroll-mt-20",
})

const P = tw.p({
  base: "text-sm leading-7 text-[color-mix(in_srgb,var(--foreground)_80%,transparent)] mb-4",
})

const IC = tw.code({
  base: "px-1.5 py-0.5 rounded text-[11px] font-mono bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)]",
})

// Callout
const Callout = tw.div({
  base: "rounded-xl border px-4 py-3 my-5 text-sm leading-relaxed flex gap-3",
  variants: {
    type: {
      note: "bg-blue-50 border-blue-200 text-blue-900",
      tip: "bg-emerald-50 border-emerald-200 text-emerald-900",
      warning: "bg-amber-50 border-amber-200 text-amber-900",
      php: "bg-violet-50 border-violet-200 text-violet-900",
      danger: "bg-red-50 border-red-200 text-red-900",
    },
  },
  defaultVariants: { type: "note" },
  sub: {
    "span:icon": "text-base shrink-0 mt-0.5",
    "div:content": "flex-1",
    "strong:title": "block font-semibold mb-0.5",
  },
})

// Code block
const CodeWrap = tw.div({
  base: "rounded-xl overflow-hidden border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] my-5",
  sub: {
    header: "flex items-center justify-between px-4 py-2.5 bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]",
    filename: "text-[11px] font-mono text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]",
    "pre:body": "p-4 overflow-x-auto text-xs font-mono leading-6 bg-[var(--surface)] text-[var(--foreground)] m-0",
  },
})

const CopyBtn = tw.button({
  base: "text-[10px] font-medium px-2.5 py-1 rounded-md border transition-all border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] hover:text-[var(--foreground)]",
  states: {
    copied: "bg-emerald-500 text-white border-emerald-500",
  },
})

// Exercise
const ExerciseCard = tw.div({
  base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)] overflow-hidden my-5",
  sub: {
    header: "flex items-center gap-2 px-4 py-3 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]",
    title: "text-xs font-semibold",
    body: "p-4 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)] leading-relaxed space-y-1",
  },
})

// Prev/Next footer nav
const PageNav = tw.div({
  base: "flex items-center justify-between mt-16 pt-6 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]",
})

const NavBtn = tw.a({
  base: "flex flex-col gap-0.5 px-4 py-3 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)] hover:border-[var(--accent)] transition-all text-sm",
  variants: {
    dir: {
      prev: "items-start",
      next: "items-end",
    },
  },
  defaultVariants: { dir: "next" },
  sub: {
    "span:hint": "text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] uppercase tracking-wider",
    "span:label": "font-semibold",
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Playground primitives
// ─────────────────────────────────────────────────────────────────────────────

const PlaygroundWrap = tw.div({
  base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5",
  sub: {
    controls: "p-4 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] space-y-3",
    "p:label": "text-[10px] font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--foreground)_35%,transparent)]",
    canvas: {
      base: "p-6 bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] flex items-center justify-center min-h-52",
      variants: {
        layout: {
          "wrap": "gap-12 flex-wrap",
          "wrap-sm": "gap-4 flex-wrap",
          "column": "flex-col gap-0",
          "column-center": "flex-col gap-0 items-center",
          "column-stretch": "flex-col items-stretch",
          "gap-flex": "gap-3 flex-col items-center",
        },
      },
      defaultVariants: { layout: "wrap" },
    },
    codeline: "px-4 py-3 border-t border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] bg-[var(--surface)] font-mono text-[11px] text-[var(--accent)]",
  },
})

const SliderRow = tw.div({
  base: "space-y-1",
  sub: {
    header: "flex justify-between items-center text-xs",
    "span:lbl": "font-semibold",
    "span:val": "font-mono text-[color-mix(in_srgb,var(--foreground)_50%,transparent)]",
  },
})

// Label warna untuk slider
const SliderLabel = tw.span({
  base: "font-semibold text-xs",
  variants: {
    color: {
      blue: "text-blue-600",
      green: "text-green-600",
      orange: "text-orange-600",
    },
  },
  defaultVariants: { color: "blue" },
})

// Control group dengan label dan content
const ControlGroup = tw.div({
  base: "space-y-1.5",
  sub: {
    "p:label": "text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] font-semibold uppercase tracking-wider",
  },
})

// Row untuk multiple control groups
const ControlsRow = tw.div({ base: "flex items-center gap-4" })

// Wrapper compare columns (box-sizing, dll)
const CompareCol = tw.div({
  base: "flex flex-col items-center gap-2",
})

// ─────────────────────────────────────────────────────────────────────────────
// MarginAuto playground components
// ─────────────────────────────────────────────────────────────────────────────

const MarginAutoContainer = tw.div({ base: "flex items-center" })
const MarginAutoItem = tw.div({ base: "px-3 py-2 rounded-lg text-white text-[11px] font-mono" })
const MarginAutoLogo = tw.div({
  base: "px-3 py-2 rounded-lg bg-[var(--accent)] text-white text-[11px] font-mono",
})
const MarginAutoButton = tw.div({
  base: "px-3 py-2 rounded-lg bg-blue-400 text-white text-[11px] font-mono ml-auto",
})

// Label untuk compare header
const CompareLabel = tw.p({
  base: "text-[10px] font-bold uppercase tracking-wider",
  variants: {
    color: {
      blue: "text-blue-600",
      emerald: "text-emerald-600",
    },
  },
  defaultVariants: { color: "blue" },
})

// Mono caption di bawah demo
const MonoCaption = tw.p({
  base: "text-[10px] font-mono",
  variants: {
    color: {
      gray: "text-gray-400",
      amber: "text-amber-600",
      emerald: "text-emerald-600",
    },
  },
  defaultVariants: { color: "gray" },
})

// Info text untuk status hint
const StatusHint = tw.p({
  base: "text-[10px] text-center font-semibold mt-2",
  variants: {
    status: {
      warning: "text-amber-600",
      ok: "text-emerald-600",
    },
  },
  defaultVariants: { status: "ok" },
})

// Container untuk outline/border demo
const OutlineContainer = tw.div({
  base: "bg-amber-50 border border-dashed border-amber-300 rounded p-4 flex gap-4 items-center",
})

// Label text untuk OutlineBorderBox
const OutlineItemLabel = tw.span({ base: "text-gray-600 text-[11px] font-mono" })

// Content overflow demo wrapper
const OverflowContent = tw.div({ base: "p-3" })

// Width playground parent container
const WidthParent = tw.div({
  base: "w-full bg-gray-100 rounded-lg p-3 relative",
  sub: {
    "p:label": "text-[9px] text-gray-400 mb-2 uppercase tracking-wider font-bold",
  },
})

// Negative margin parent element A
const NegMarginParent = tw.div({
  base: "bg-blue-100 border-2 border-blue-300 rounded px-6 py-4 text-xs font-mono text-blue-800 text-center w-48",
})

// Calc demo group
const CalcGroup = tw.div({
  base: "flex gap-2 items-center",
})

// shadow demo container
const ShadowContainer = tw.div({
  base: "flex gap-8 items-end flex-wrap",
  sub: {
    "div:group": "flex flex-col items-center gap-3",
    "p:caption": "text-[10px] font-mono text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] text-center",
  },
})

const Chip = tw.button({
  base: "px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border transition-all",
  variants: {
    active: {
      true: "bg-[var(--accent)] text-white border-[var(--accent)]",
      false: "border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
    },
  },
  defaultVariants: { active: false },
})

const ChipRow = tw.div({
  base: "flex flex-wrap gap-1.5",
})

// ─────────────────────────────────────────────────────────────────────────────
// Box Model playground — BoxSizing + Margin/Padding/Border
// ─────────────────────────────────────────────────────────────────────────────

// Margin layer — variants per Tailwind spacing scale
const BoxMarginLayer = tw.div({
  base: "bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl flex items-center justify-center relative transition-all duration-200",
  variants: {
    size: {
      0: "p-0", 1: "p-1", 2: "p-2", 3: "p-3", 4: "p-4",
      5: "p-5", 6: "p-6", 8: "p-8", 10: "p-10", 12: "p-12",
    },
  },
  defaultVariants: { size: 6 },
  sub: {
    "span:label": "absolute top-1 left-2 text-[9px] font-bold text-blue-400 uppercase tracking-wider select-none",
  },
})

// Border layer
const BoxBorderLayer = tw.div({
  base: "bg-orange-100 rounded-lg flex items-center justify-center border-orange-400 border-solid transition-all duration-200",
  variants: {
    size: {
      0: "border-0", 1: "border", 2: "border-2", 4: "border-4", 8: "border-8",
    },
  },
  defaultVariants: { size: 4 },
})

// Padding layer
const BoxPaddingLayer = tw.div({
  base: "bg-green-50 rounded flex items-center justify-center relative transition-all duration-200",
  variants: {
    size: {
      0: "p-0", 1: "p-1", 2: "p-2", 3: "p-3", 4: "p-4",
      5: "p-5", 6: "p-6", 8: "p-8", 10: "p-10", 12: "p-12",
    },
  },
  defaultVariants: { size: 4 },
  sub: {
    "span:label": "absolute top-0.5 left-1 text-[8px] font-bold text-green-500 uppercase select-none",
  },
})

const BoxContent = tw.div({
  base: "bg-white border border-gray-200 rounded px-4 py-3 text-xs font-mono text-gray-600 whitespace-nowrap shadow-sm text-center",
  sub: {
    "span:meta": "block text-[10px] text-gray-400 mt-0.5",
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// box-sizing playground
// ─────────────────────────────────────────────────────────────────────────────

// content-box — width TIDAK include padding/border
const ContentBoxEl = tw.div({
  base: "bg-blue-100 border-4 border-blue-400 text-[11px] font-mono text-blue-800 flex flex-col items-center justify-center gap-1 transition-all duration-200",
  variants: {
    padding: {
      none: "p-0  w-40 h-16",
      md: "p-4  w-40 h-16",
      lg: "p-8  w-40 h-16",
    },
  },
  defaultVariants: { padding: "md" },
})

// border-box — width INCLUDE padding/border
const BorderBoxEl = tw.div({
  base: "bg-emerald-100 border-4 border-emerald-400 text-[11px] font-mono text-emerald-800 flex flex-col items-center justify-center gap-1 transition-all duration-200 w-40",
  variants: {
    padding: {
      none: "p-0  h-16",
      md: "p-4  h-16",
      lg: "p-8  h-16",
    },
  },
  defaultVariants: { padding: "md" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Margin collapse playground
// ─────────────────────────────────────────────────────────────────────────────

const CollapseBox = tw.div({
  base: "bg-[var(--surface)] border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] rounded-xl p-4 text-xs font-mono",
})

const CollapseBlock = tw.div({
  base: "bg-blue-100 border border-blue-300 rounded px-4 py-2 text-blue-800 text-xs font-mono text-center",
  variants: {
    margin: {
      2: "my-2",
      4: "my-4",
      8: "my-8",
      12: "my-12",
    },
  },
  defaultVariants: { margin: 8 },
})

// ─────────────────────────────────────────────────────────────────────────────
// Overflow playground
// ─────────────────────────────────────────────────────────────────────────────

const OverflowBox = tw.div({
  base: "w-48 h-24 bg-blue-50 border-2 border-blue-300 rounded-lg text-xs font-mono text-blue-800 transition-all duration-200",
  variants: {
    overflow: {
      visible: "overflow-visible",
      hidden: "overflow-hidden",
      scroll: "overflow-scroll",
      auto: "overflow-auto",
      clip: "overflow-clip",
    },
  },
  defaultVariants: { overflow: "visible" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Width playground
// ─────────────────────────────────────────────────────────────────────────────

const WidthBox = tw.div({
  base: "bg-indigo-100 border-2 border-indigo-400 rounded-lg px-3 py-4 text-[11px] font-mono text-indigo-800 text-center transition-all duration-200",
  variants: {
    type: {
      width: "w-48",
      minWidth: "min-w-48 w-0",
      maxWidth: "max-w-48 w-full",
      minContent: "w-min",
      maxContent: "w-max",
      fitContent: "w-fit",
    },
  },
  defaultVariants: { type: "width" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Outline vs Border playground
// ─────────────────────────────────────────────────────────────────────────────

const OutlineBorderBox = tw.div({
  base: "w-32 h-16 rounded-lg flex items-center justify-center text-[11px] font-mono transition-all duration-200",
  variants: {
    type: {
      none: "bg-gray-100",
      border: "bg-blue-50 border-4 border-blue-500",
      outline: "bg-blue-50 outline outline-4 outline-blue-500",
      "border+m": "bg-blue-50 border-4 border-blue-500 m-2",
      "outline+m": "bg-blue-50 outline outline-4 outline-blue-500 m-2",
    },
  },
  defaultVariants: { type: "border" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Negative margin playground
// ─────────────────────────────────────────────────────────────────────────────

const NegMarginBox = tw.div({
  base: "bg-pink-100 border-2 border-pink-400 rounded-lg px-4 py-3 text-[11px] font-mono text-pink-800 text-center transition-all duration-200 relative",
  variants: {
    neg: {
      0: "",
      "-2": "-mt-2",
      "-4": "-mt-4",
      "-8": "-mt-8",
      "-12": "-mt-12",
    },
  },
  defaultVariants: { neg: 0 },
})

// ─────────────────────────────────────────────────────────────────────────────
// calc() playground
// ─────────────────────────────────────────────────────────────────────────────

const CalcParent = tw.div({
  base: "bg-gray-100 border border-gray-300 rounded-lg p-3 relative",
})

const CalcChild = tw.div({
  base: "bg-purple-100 border-2 border-purple-400 rounded-lg flex items-center justify-center text-[11px] font-mono text-purple-800 h-16 transition-all duration-200",
  variants: {
    mode: {
      full: "w-full",
      "minus": "w-[calc(100%-80px)]",
      "minus2": "w-[calc(100%-160px)]",
      half: "w-[calc(50%-8px)]",
      third: "w-[calc(33.333%-11px)]",
    },
  },
  defaultVariants: { mode: "full" },
})

const CalcSidebar = tw.div({
  base: "bg-purple-300 border-2 border-purple-500 rounded-lg flex items-center justify-center text-[10px] font-mono text-purple-900 h-16 w-20 shrink-0",
})

// ─────────────────────────────────────────────────────────────────────────────
// aspect-ratio playground
// ─────────────────────────────────────────────────────────────────────────────

const AspectBox = tw.div({
  base: "bg-gradient-to-br from-cyan-200 to-blue-300 border-2 border-blue-400 rounded-lg flex items-center justify-center text-[11px] font-mono text-blue-900 transition-all duration-200 w-full",
  variants: {
    ratio: {
      square: "aspect-square",
      video: "aspect-video",
      "4-3": "aspect-[4/3]",
      "21-9": "aspect-[21/9]",
      "9-16": "aspect-[9/16]",
    },
  },
  defaultVariants: { ratio: "video" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Logical properties playground
// ─────────────────────────────────────────────────────────────────────────────

const LogicalBox = tw.div({
  base: "bg-teal-50 border-2 border-dashed border-teal-300 rounded-lg flex items-center justify-center text-[11px] font-mono text-teal-800 transition-all duration-200",
  variants: {
    dir: {
      ltr: "",
      rtl: "",
    },
    size: {
      4: "ps-4 pe-2 py-3",
      8: "ps-8 pe-2 py-3",
    },
  },
  defaultVariants: { dir: "ltr", size: 4 },
})

// ─────────────────────────────────────────────────────────────────────────────
// box-decoration-break playground
// ─────────────────────────────────────────────────────────────────────────────

const DecorationText = tw.span({
  base: "bg-amber-200 text-amber-900 px-2 py-1 rounded box-decoration-slice leading-loose",
  variants: {
    mode: {
      slice: "box-decoration-slice",
      clone: "box-decoration-clone",
    },
  },
  defaultVariants: { mode: "slice" },
})

// ─────────────────────────────────────────────────────────────────────────────
// min-width: 0 flex playground
// ─────────────────────────────────────────────────────────────────────────────

const FlexRow = tw.div({
  base: "flex gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3",
})

const FlexSidebarFixed = tw.div({
  base: "w-20 h-16 bg-indigo-200 border-2 border-indigo-400 rounded flex items-center justify-center text-[10px] font-mono text-indigo-800 shrink-0",
})

const FlexTextItem = tw.div({
  base: "flex-1 bg-red-100 border-2 border-red-400 rounded p-2 text-[11px] font-mono text-red-800 transition-all duration-200",
  variants: {
    fix: {
      broken: "min-w-0",
      ok: "min-w-0",
    },
  },
  defaultVariants: { fix: "broken" },
})

const FlexTextContent = tw.p({
  base: "transition-all duration-200",
  variants: {
    fix: {
      broken: "whitespace-nowrap overflow-visible",
      ok: "truncate",
    },
  },
  defaultVariants: { fix: "broken" },
})

// ─────────────────────────────────────────────────────────────────────────────
// writing-mode playground
// ─────────────────────────────────────────────────────────────────────────────

const WritingModeBox = tw.div({
  base: "bg-rose-100 border-2 border-rose-400 rounded-lg flex items-center justify-center text-[11px] font-mono text-rose-900 p-4 transition-all duration-200",
  variants: {
    mode: {
      horizontal: "writing-mode-horizontal-tb h-24 w-full",
      vertical: "[writing-mode:vertical-rl] h-48 w-24",
      verticalLr: "[writing-mode:vertical-lr] h-48 w-24",
    },
  },
  defaultVariants: { mode: "horizontal" },
})

// ─────────────────────────────────────────────────────────────────────────────
// resize playground
// ─────────────────────────────────────────────────────────────────────────────

const ResizeBox = tw.textarea({
  base: "bg-white border-2 border-indigo-300 rounded-lg p-3 text-xs font-mono text-gray-700 w-full",
  variants: {
    mode: {
      none: "resize-none",
      both: "resize",
      horizontal: "resize-x",
      vertical: "resize-y",
    },
  },
  defaultVariants: { mode: "both" },
})

// ─────────────────────────────────────────────────────────────────────────────
// table box model playground
// ─────────────────────────────────────────────────────────────────────────────

const DemoTable = tw.table({
  base: "w-full text-xs font-mono",
  variants: {
    mode: {
      collapse: "border-collapse",
      separate: "border-separate",
    },
  },
  defaultVariants: { mode: "collapse" },
})

const DemoTh = tw.th({
  base: "border-2 border-purple-400 bg-purple-100 text-purple-800 px-3 py-2",
})

const DemoTd = tw.td({
  base: "border-2 border-purple-300 px-3 py-2 text-purple-700",
})

// ─────────────────────────────────────────────────────────────────────────────
// contain playground
// ─────────────────────────────────────────────────────────────────────────────

const ContainBox = tw.div({
  base: "bg-cyan-50 border-2 border-cyan-400 rounded-lg p-3 overflow-hidden transition-all duration-200",
  variants: {
    contain: {
      none: "",
      layout: "[contain:layout]",
      paint: "[contain:paint]",
      content: "[contain:content]",
      strict: "[contain:strict]",
    },
  },
  defaultVariants: { contain: "none" },
})

// ─────────────────────────────────────────────────────────────────────────────
// scrollbar-gutter playground
// ─────────────────────────────────────────────────────────────────────────────

const ScrollGutterBox = tw.div({
  base: "bg-white border-2 border-emerald-400 rounded-lg h-32 overflow-y-scroll p-3 text-xs font-mono text-gray-600 transition-all duration-200",
  variants: {
    gutter: {
      auto: "",
      stable: "[scrollbar-gutter:stable]",
    },
  },
  defaultVariants: { gutter: "auto" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Spacing scale lookup
// ─────────────────────────────────────────────────────────────────────────────

const SPACING_PX: Record<string, string> = {
  0: "0px", 1: "4px", 2: "8px", 3: "12px", 4: "16px",
  5: "20px", 6: "24px", 8: "32px", 10: "40px", 12: "48px",
}
const BORDER_PX: Record<string, string> = {
  0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px",
}
const MARGIN_STEPS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12] as const
const PADDING_STEPS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12] as const
const BORDER_STEPS = [0, 1, 2, 4, 8] as const

type MarginSize = typeof MARGIN_STEPS[number]
type PaddingSize = typeof PADDING_STEPS[number]
type BorderSize = typeof BORDER_STEPS[number]

// ─────────────────────────────────────────────────────────────────────────────
// TOC data
// ─────────────────────────────────────────────────────────────────────────────

const TOC = [
  { id: "anatomy", label: "Anatomi Box Model", depth: 2 as const },
  { id: "playground", label: "Interactive Playground", depth: 2 as const },
  { id: "box-sizing", label: "box-sizing", depth: 2 as const },
  { id: "outline", label: "outline vs border", depth: 2 as const },
  { id: "margin-collapse", label: "Margin Collapse", depth: 2 as const },
  { id: "negative-margin", label: "Negative Margin", depth: 2 as const },
  { id: "overflow", label: "overflow", depth: 2 as const },
  { id: "width-variants", label: "width / min / max", depth: 2 as const },
  { id: "height", label: "height: 100%", depth: 2 as const },
  { id: "inline-box", label: "Inline & Box Model", depth: 2 as const },
  { id: "calc", label: "calc()", depth: 2 as const },
  { id: "aspect-ratio", label: "aspect-ratio", depth: 2 as const },
  { id: "logical-props", label: "Logical Properties", depth: 2 as const },
  { id: "box-decoration", label: "box-decoration-break", depth: 2 as const },
  { id: "min-width-flex", label: "min-width: 0 di Flex", depth: 2 as const },
  { id: "writing-mode", label: "writing-mode", depth: 2 as const },
  { id: "resize", label: "resize", depth: 2 as const },
  { id: "table-box", label: "Box Model di Tabel", depth: 2 as const },
  { id: "contain", label: "contain", depth: 2 as const },
  { id: "scrollbar-gutter", label: "scrollbar-gutter", depth: 2 as const },
  { id: "visibility", label: "visibility vs display vs opacity", depth: 2 as const },
  { id: "margin-auto", label: "margin: auto centering", depth: 2 as const },
  { id: "box-shadow", label: "box-shadow vs drop-shadow", depth: 2 as const },
  { id: "border-radius", label: "border-radius", depth: 2 as const },
  { id: "border-style", label: "border-style lengkap", depth: 2 as const },
  { id: "clamp", label: "clamp() sizing", depth: 2 as const },
  { id: "tw-usage", label: "Pakai di tw", depth: 2 as const },
  { id: "exercise", label: "Latihan", depth: 2 as const },
]

// ─────────────────────────────────────────────────────────────────────────────
// border-radius playground primitives
// ─────────────────────────────────────────────────────────────────────────────

const RadiusBox = tw.div({
  base: "w-32 h-32 bg-[var(--accent)] flex items-center justify-center text-white text-[10px] font-mono transition-all duration-300",
  variants: {
    radius: {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      full: "rounded-full",
      "tl-only": "rounded-tl-3xl",
      "t-only": "rounded-t-3xl",
      pill: "rounded-full w-48 h-16",
      ellipse: "[border-radius:50%] w-48",
      custom: "[border-radius:30%_70%_70%_30%/30%_30%_70%_70%]",
    },
  },
  defaultVariants: { radius: "lg" },
})

// ─────────────────────────────────────────────────────────────────────────────
// border-style playground primitives
// ─────────────────────────────────────────────────────────────────────────────

const BorderStyleBox = tw.div({
  base: "w-40 h-16 flex items-center justify-center text-[11px] font-mono text-gray-700 bg-white transition-all duration-200",
  variants: {
    style: {
      solid: "border-4 border-solid border-blue-500",
      dashed: "border-4 border-dashed border-blue-500",
      dotted: "border-4 border-dotted border-blue-500",
      double: "border-8 border-double border-blue-500",
      groove: "border-8 [border-style:groove] [border-color:theme(colors.blue.500)]",
      ridge: "border-8 [border-style:ridge]  [border-color:theme(colors.blue.500)]",
      inset: "border-8 [border-style:inset]  [border-color:theme(colors.blue.500)]",
      outset: "border-8 [border-style:outset] [border-color:theme(colors.blue.500)]",
      none: "border-4 border-none",
      hidden: "border-4 border-hidden",
    },
  },
  defaultVariants: { style: "solid" },
})

// ─────────────────────────────────────────────────────────────────────────────
// clamp() playground primitives
// ─────────────────────────────────────────────────────────────────────────────

const ClampBox = tw.div({
  base: "bg-[var(--accent)] text-white flex items-center justify-center text-[11px] font-mono rounded-lg py-3 transition-all duration-200",
  variants: {
    mode: {
      fixed: "w-48",
      "min-w": "min-w-[8rem] w-full max-w-xs",
      clamp: "w-[clamp(8rem,50%,24rem)]",
      clamp2: "text-[clamp(0.75rem,2vw,1.25rem)] w-full",
    },
  },
  defaultVariants: { mode: "clamp" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Visibility playground primitives
// ─────────────────────────────────────────────────────────────────────────────

const VisibilityBox = tw.div({
  base: "w-32 h-16 rounded-lg flex items-center justify-center text-[11px] font-bold text-white transition-all duration-200 bg-[var(--accent)]",
  variants: {
    mode: {
      visible: "",
      "display-none": "hidden",
      "visibility-hid": "invisible",
      "opacity-0": "opacity-0",
    },
  },
  defaultVariants: { mode: "visible" },
})

// ─────────────────────────────────────────────────────────────────────────────
// margin:auto playground primitives
// ─────────────────────────────────────────────────────────────────────────────

const AutoMarginChild = tw.div({
  base: "bg-[var(--accent)] text-white rounded-lg flex items-center justify-center text-[11px] font-mono py-3 transition-all duration-200",
  variants: {
    mode: {
      "none": "w-48",
      "center": "w-48 mx-auto",
      "left": "w-48 mr-auto",
      "right": "w-48 ml-auto",
      "flex-center": "w-48",
    },
  },
  defaultVariants: { mode: "none" },
})

// ─────────────────────────────────────────────────────────────────────────────
// box-shadow vs drop-shadow playground primitives
// ─────────────────────────────────────────────────────────────────────────────

const ShadowBox = tw.div({
  base: "w-24 h-24 bg-white rounded-xl flex items-center justify-center text-[10px] font-mono text-gray-600 transition-all duration-200",
  variants: {
    type: {
      none: "",
      "box-sm": "shadow-sm",
      "box-md": "shadow-md",
      "box-lg": "shadow-lg",
      "box-xl": "shadow-xl",
      "box-inset": "shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)]",
      "drop-sm": "[filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.1))]",
      "drop-lg": "[filter:drop-shadow(0_4px_16px_rgba(0,0,0,0.25))]",
    },
  },
  defaultVariants: { type: "box-md" },
})

// PNG-shaped shadow demo — hanya drop-shadow yang ikut shape non-rectangular
const ShadowShape = tw.div({
  base: "transition-all duration-200 text-4xl",
  variants: {
    type: {
      "box-shadow": "shadow-xl rounded-full bg-white p-2",
      "drop-shadow": "[filter:drop-shadow(0_4px_12px_rgba(99,102,241,0.5))]",
    },
  },
  defaultVariants: { type: "box-shadow" },
})

// Slider range input
const RangeInput = tw.input({
  base: "w-full accent-[var(--accent)]",
})

// Teks deskripsi playground (berulang ~15x)
const DescText = tw.p({
  base: "text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]",
})

// Teks hint/caption mono kecil
const HintText = tw.p({
  base: "text-[10px] font-mono text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]",
})

// Teks caption clamp (text-center)
const CenterCaption = tw.p({
  base: "text-[10px] text-center mt-2 font-mono text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]",
})

// Span kecil dim (opacity-60) dalam box demo
const DimSpan = tw.span({
  base: "text-[10px] opacity-60",
})

// Flex column wrapper
const FlexColWrap = tw.div({ base: "flex flex-col" })

// Centering wrapper narrow
const CenteredNarrow = tw.div({ base: "w-full max-w-xs mx-auto" })

// Centering wrapper medium
const CenteredMedium = tw.div({ base: "w-full max-w-sm mx-auto" })

// Wrapper dengan min-height untuk writing-mode demo
const CenteredMinH = tw.div({ base: "flex items-center justify-center min-h-48" })

// Neighbor box untuk visibility demo
const NeighborBox = tw.div({
  base: "w-24 h-16 rounded-lg bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center text-[10px] font-mono text-emerald-800",
})

// Row untuk visibility demo
const VisibilityRow = tw.div({ base: "flex gap-3 items-start" })

// Background container untuk demo (dua kali pakai)
const DemoBackground = tw.div({
  base: "w-full bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] rounded-lg p-3 border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)]",
})

// Teks dalam ContainBox
const ContainText = tw.p({ base: "text-xs font-mono text-cyan-800" })

// Teks paragraf leading-loose untuk decoration demo
const DecorationPara = tw.p({ base: "text-sm leading-loose max-w-xs" })

// Row info box untuk anatomy table
const AnatomyRow = tw.div({
  base: "flex items-start gap-4 p-4 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0 border-l-4",
  variants: {
    layer: {
      content: "bg-white border-gray-300",
      padding: "bg-green-50 border-green-300",
      border: "bg-orange-50 border-orange-300",
      margin: "bg-blue-50 border-blue-300",
    },
  },
  defaultVariants: { layer: "content" },
  sub: {
    "p:desc": "text-sm text-[color-mix(in_srgb,var(--foreground)_75%,transparent)] leading-relaxed",
  },
})

// Wrapper anatomy table
const AnatomyTable = tw.div({
  base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)] overflow-hidden my-5",
})

// Visibility comparison table
const CompareTable = tw.div({
  base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5",
})

const CompareRow = tw.div({
  base: "grid grid-cols-5 gap-2 p-3 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0 text-xs",
})

const CompareCell = tw.span({
  base: "text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]",
  variants: {
    span: {
      1: "",
      2: "col-span-2",
    },
  },
  defaultVariants: { span: 1 },
})

const TocFooter = tw.div({ base: "mt-6 pt-4 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" })
const TocGithubLink = tw.a({ base: "text-xs text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1" })

// ─────────────────────────────────────────────────────────────────────────────
// Code block
// ─────────────────────────────────────────────────────────────────────────────

function Code({ file, children }: { file?: string; children: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <CodeWrap>
      <CodeWrap.header>
        <CodeWrap.filename>{file ?? "tsx"}</CodeWrap.filename>
        <CopyBtn
          copied={copied}
          onClick={() => {
            navigator.clipboard.writeText(children.trim())
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? "✓ Copied" : "Copy"}
        </CopyBtn>
      </CodeWrap.header>
      <CodeWrap.body>{children.trim()}</CodeWrap.body>
    </CodeWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: Box Model
// ─────────────────────────────────────────────────────────────────────────────

function BoxModelPlayground() {
  const [margin, setMargin] = useState<MarginSize>(6)
  const [padding, setPadding] = useState<PaddingSize>(4)
  const [border, setBorder] = useState<BorderSize>(4)

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Geser slider — lihat box model berubah</PlaygroundWrap.label>

        <SliderRow>
          <SliderRow.header>
            <SliderLabel color="blue">margin</SliderLabel>
            <SliderRow.val>{SPACING_PX[margin]}</SliderRow.val>
          </SliderRow.header>
          <RangeInput type="range" min={0} max={MARGIN_STEPS.length - 1}
            value={MARGIN_STEPS.indexOf(margin)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMargin(MARGIN_STEPS[+e.target.value])} />
        </SliderRow>

        <SliderRow>
          <SliderRow.header>
            <SliderLabel color="green">padding</SliderLabel>
            <SliderRow.val>{SPACING_PX[padding]}</SliderRow.val>
          </SliderRow.header>
          <RangeInput type="range" min={0} max={PADDING_STEPS.length - 1}
            value={PADDING_STEPS.indexOf(padding)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPadding(PADDING_STEPS[+e.target.value])} />
        </SliderRow>

        <SliderRow>
          <SliderRow.header>
            <SliderLabel color="orange">border</SliderLabel>
            <SliderRow.val>{BORDER_PX[border]}</SliderRow.val>
          </SliderRow.header>
          <RangeInput type="range" min={0} max={BORDER_STEPS.length - 1}
            value={BORDER_STEPS.indexOf(border)}
            onChange={(e: { target: { value: string | number } }) => setBorder(BORDER_STEPS[+e.target.value])} />
        </SliderRow>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <BoxMarginLayer size={margin}>
          <BoxMarginLayer.label>margin {SPACING_PX[margin]}</BoxMarginLayer.label>
          <BoxBorderLayer size={border}>
            <BoxPaddingLayer size={padding}>
              <BoxPaddingLayer.label>padding {SPACING_PX[padding]}</BoxPaddingLayer.label>
              <BoxContent>
                Content
                <BoxContent.meta>
                  m:{SPACING_PX[margin]} · p:{SPACING_PX[padding]} · b:{BORDER_PX[border]}
                </BoxContent.meta>
              </BoxContent>
            </BoxPaddingLayer>
          </BoxBorderLayer>
        </BoxMarginLayer>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {`.box { margin: ${SPACING_PX[margin]}; padding: ${SPACING_PX[padding]}; border: ${BORDER_PX[border]} solid orange; }`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: box-sizing
// ─────────────────────────────────────────────────────────────────────────────

type PaddingLevel = "none" | "md" | "lg"
const PADDING_LEVEL_MAP: Record<PaddingLevel, string> = { none: "0px", md: "16px", lg: "32px" }

function BoxSizingPlayground() {
  const [padding, setPadding] = useState<PaddingLevel>("md")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 box-sizing — content-box vs border-box</PlaygroundWrap.label>
        <ControlGroup>
          <ControlGroup.label>padding</ControlGroup.label>
          <ChipRow>
            {(["none", "md", "lg"] as PaddingLevel[]).map(v => (
              <Chip key={v} active={padding === v} onClick={() => setPadding(v)}>
                {PADDING_LEVEL_MAP[v]}
              </Chip>
            ))}
          </ChipRow>
        </ControlGroup>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas layout="wrap">
        <CompareCol>
          <CompareLabel color="blue">content-box</CompareLabel>
          <ContentBoxEl padding={padding}>
            <span>content-box</span>
            <DimSpan>
              width expands → {padding === "none" ? "160px" : padding === "md" ? "192px" : "224px"}
            </DimSpan>
          </ContentBoxEl>
          <MonoCaption>
            w-40 + p-{padding === "none" ? "0" : padding === "md" ? "4" : "8"} = {padding === "none" ? "160" : padding === "md" ? "192" : "224"}px
          </MonoCaption>
        </CompareCol>

        <CompareCol>
          <CompareLabel color="emerald">border-box</CompareLabel>
          <BorderBoxEl padding={padding}>
            <span>border-box</span>
            <DimSpan>width stays → 160px</DimSpan>
          </BorderBoxEl>
          <MonoCaption>
            w-40 tetap 160px ✓
          </MonoCaption>
        </CompareCol>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {`/* content-box default: width = content only → padding added outside */
/* border-box: width = content + padding + border → stays 160px */
*, *::before, *::after { box-sizing: border-box; } /* Tailwind default */`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: outline vs border
// ─────────────────────────────────────────────────────────────────────────────

type OutlineBorderType = "border" | "outline" | "border+m" | "outline+m"

function OutlineBorderPlayground() {
  const [type, setType] = useState<OutlineBorderType>("border")

  const descriptions: Record<OutlineBorderType, string> = {
    "border": "border — part of box model, takes up space, pushes content",
    "outline": "outline — outside box model, takes NO space, doesn't affect layout",
    "border+m": "border dengan margin — total space: border + margin",
    "outline+m": "outline dengan margin — margin normal, outline tidak tambah space",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 outline vs border</PlaygroundWrap.label>
        <ChipRow>
          {(["border", "outline", "border+m", "outline+m"] as OutlineBorderType[]).map(v => (
            <Chip key={v} active={type === v} onClick={() => setType(v)}>{v}</Chip>
          ))}
        </ChipRow>
        <DescText>
          {descriptions[type]}
        </DescText>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas layout="wrap-sm">
        <OutlineContainer>
          <OutlineBorderBox type={type}>
            <OutlineItemLabel>{type}</OutlineItemLabel>
          </OutlineBorderBox>
          <OutlineBorderBox type={type}>
            <OutlineItemLabel>sibling</OutlineItemLabel>
          </OutlineBorderBox>
        </OutlineContainer>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {type.startsWith("border")
          ? `border: 4px solid blue; /* bagian dari box model — menambah lebar elemen */`
          : `outline: 4px solid blue; /* di luar box model — tidak mempengaruhi layout */`
        }
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: margin collapse
// ─────────────────────────────────────────────────────────────────────────────

type CollapseMargin = 2 | 4 | 8 | 12

function MarginCollapsePlayground() {
  const [margin, setMargin] = useState<CollapseMargin>(8)
  const [showCollapse, setShowCollapse] = useState(true)

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Margin Collapse — vertical margin "merge"</PlaygroundWrap.label>
        <ControlsRow>
          <ControlGroup>
            <ControlGroup.label>margin-top/bottom</ControlGroup.label>
            <ChipRow>
              {([2, 4, 8, 12] as CollapseMargin[]).map(v => (
                <Chip key={v} active={margin === v} onClick={() => setMargin(v)}>
                  {SPACING_PX[v]}
                </Chip>
              ))}
            </ChipRow>
          </ControlGroup>
          <ControlGroup>
            <ControlGroup.label>mode</ControlGroup.label>
            <ChipRow>
              <Chip active={showCollapse} onClick={() => setShowCollapse(true)}>collapse (block)</Chip>
              <Chip active={!showCollapse} onClick={() => setShowCollapse(false)}>no collapse (flex)</Chip>
            </ChipRow>
          </ControlGroup>
        </ControlsRow>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas layout="column">
        <CollapseBox>
          {showCollapse ? (
            /* Block context — margin collapse terjadi */
            <div>
              <CollapseBlock margin={margin}>Block A (margin: {SPACING_PX[margin]})</CollapseBlock>
              <CollapseBlock margin={margin}>Block B (margin: {SPACING_PX[margin]})</CollapseBlock>
              <StatusHint status="warning">
                ⚠️ Gap antara A dan B = {SPACING_PX[margin]} (bukan {parseInt(SPACING_PX[margin]) * 2}px) — collapsed!
              </StatusHint>
            </div>
          ) : (
            /* Flex context — margin collapse TIDAK terjadi */
            <FlexColWrap>
              <CollapseBlock margin={margin}>Block A (margin: {SPACING_PX[margin]})</CollapseBlock>
              <CollapseBlock margin={margin}>Block B (margin: {SPACING_PX[margin]})</CollapseBlock>
              <StatusHint status="ok">
                ✅ Gap antara A dan B = {parseInt(SPACING_PX[margin]) * 2}px — tidak collapse di flex!
              </StatusHint>
            </FlexColWrap>
          )}
        </CollapseBox>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {showCollapse
          ? `/* Block context: margin-bottom A + margin-top B = collapse → hanya ${SPACING_PX[margin]} */`
          : `/* Flex context: margin tidak collapse → ${parseInt(SPACING_PX[margin]) * 2}px total */`
        }
      </PlaygroundWrap.codeline>
    </PlaygroundWrap >
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: overflow
// ─────────────────────────────────────────────────────────────────────────────

type OverflowValue = "visible" | "hidden" | "scroll" | "auto" | "clip"

function OverflowPlayground() {
  const [overflow, setOverflow] = useState<OverflowValue>("visible")

  const descriptions: Record<OverflowValue, string> = {
    visible: "Default. Konten yang melebihi box tetap terlihat di luar.",
    hidden: "Konten yang melebihi box dipotong. Tidak ada scrollbar.",
    scroll: "Selalu tampilkan scrollbar, meski konten tidak overflow.",
    auto: "Scrollbar hanya muncul kalau konten benar-benar overflow.",
    clip: "Dipotong seperti hidden, tapi tidak bisa di-scroll secara programmatic.",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 overflow — apa yang terjadi kalau konten melebihi box</PlaygroundWrap.label>
        <ChipRow>
          {(["visible", "hidden", "scroll", "auto", "clip"] as OverflowValue[]).map(v => (
            <Chip key={v} active={overflow === v} onClick={() => setOverflow(v)}>{v}</Chip>
          ))}
        </ChipRow>
        <DescText>
          {descriptions[overflow]}
        </DescText>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <OverflowBox overflow={overflow}>
          <OverflowContent>
            Ini konten yang sangat panjang dan akan melebihi batas box yang sudah ditentukan. Lihat apa yang terjadi!
          </OverflowContent>
        </OverflowBox>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`overflow: ${overflow};`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: width variants
// ─────────────────────────────────────────────────────────────────────────────

type WidthType = "width" | "minWidth" | "maxWidth" | "minContent" | "maxContent" | "fitContent"

function WidthPlayground() {
  const [type, setType] = useState<WidthType>("width")

  const descriptions: Record<WidthType, string> = {
    width: "width: 192px — lebar eksplisit, tidak peduli konten",
    minWidth: "min-width: 192px — minimal selebar ini, bisa lebih lebar",
    maxWidth: "max-width: 192px — maksimal selebar ini, bisa lebih sempit",
    minContent: "width: min-content — sesempit mungkin, cukup untuk kata terpanjang",
    maxContent: "width: max-content — selebar konten penuh, tidak wrap",
    fitContent: "width: fit-content — seperti max-content tapi tidak melebihi parent",
  }

  const textOptions: Record<WidthType, string> = {
    width: "Fixed width",
    minWidth: "Min width — expands if content is wider",
    maxWidth: "Max width — shrinks if content is narrower",
    minContent: "Min",
    maxContent: "Max content — full width no wrap",
    fitContent: "Fit content",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 width / min-width / max-width / intrinsic sizing</PlaygroundWrap.label>
        <ChipRow>
          {(["width", "minWidth", "maxWidth", "minContent", "maxContent", "fitContent"] as WidthType[]).map(v => (
            <Chip key={v} active={type === v} onClick={() => setType(v)}>
              {v === "width" ? "width" : v === "minWidth" ? "min-w" : v === "maxWidth" ? "max-w" : v === "minContent" ? "min-content" : v === "maxContent" ? "max-content" : "fit-content"}
            </Chip>
          ))}
        </ChipRow>
        <DescText>
          {descriptions[type]}
        </DescText>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <WidthParent>
          <WidthParent.label>parent container (full width)</WidthParent.label>
          <WidthBox type={type}>
            {textOptions[type]}
          </WidthBox>
        </WidthParent>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {type === "width" ? "width: 192px;"
          : type === "minWidth" ? "min-width: 192px; width: 0;"
            : type === "maxWidth" ? "max-width: 192px; width: 100%;"
              : type === "minContent" ? "width: min-content;"
                : type === "maxContent" ? "width: max-content;"
                  : "width: fit-content;"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: negative margin
// ─────────────────────────────────────────────────────────────────────────────

type NegMarginVal = 0 | -2 | -4 | -8 | -12

function NegativeMarginPlayground() {
  const [neg, setNeg] = useState<NegMarginVal>(0)

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Negative margin — tarik elemen ke arah sebaliknya</PlaygroundWrap.label>
        <ChipRow>
          {([0, -2, -4, -8, -12] as NegMarginVal[]).map(v => (
            <Chip key={v} active={neg === v} onClick={() => setNeg(v)}>
              margin-top: {v === 0 ? "0" : v + " (" + Math.abs(v) * 4 + "px)"}
            </Chip>
          ))}
        </ChipRow>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas layout="column-center">
        <NegMarginParent>
          Element A
        </NegMarginParent>
        <NegMarginBox neg={neg}>
          Element B {neg !== 0 && `(mt: ${neg})`}
        </NegMarginBox>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {neg === 0
          ? ".b { margin-top: 0; } /* normal */"
          : `.b { margin-top: ${neg * 4}px; } /* negative — tarik ke atas */`
        }
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: calc()
// ─────────────────────────────────────────────────────────────────────────────

type CalcMode = "full" | "minus" | "minus2" | "half" | "third"

function CalcPlayground() {
  const [mode, setMode] = useState<CalcMode>("minus")

  const descriptions: Record<CalcMode, string> = {
    full: "width: 100% — full lebar parent, tidak ada sidebar.",
    minus: "width: calc(100% - 80px) — sisakan ruang 80px untuk sidebar.",
    minus2: "width: calc(100% - 160px) — sisakan ruang 160px (dua sidebar).",
    half: "width: calc(50% - 8px) — dua kolom dengan gap 16px di antaranya.",
    third: "width: calc(33.333% - 11px) — tiga kolom dengan gap.",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 calc() — kombinasi unit berbeda dalam satu nilai</PlaygroundWrap.label>
        <ChipRow>
          {(["full", "minus", "minus2", "half", "third"] as CalcMode[]).map(v => (
            <Chip key={v} active={mode === v} onClick={() => setMode(v)}>{v}</Chip>
          ))}
        </ChipRow>
        <DescText>{descriptions[mode]}</DescText>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <CalcParent>
          <CalcGroup>
            {(mode === "minus" || mode === "minus2") && <CalcSidebar>sidebar</CalcSidebar>}
            {mode === "minus2" && <CalcSidebar>sidebar 2</CalcSidebar>}
            <CalcChild mode={mode}>
              {mode === "half" ? "kolom 1 (50%)" : mode === "third" ? "kolom 1/3" : "main content"}
            </CalcChild>
            {mode === "half" && <CalcChild mode={mode}>kolom 2 (50%)</CalcChild>}
            {mode === "third" && (
              <>
                <CalcChild mode={mode}>kolom 2/3</CalcChild>
                <CalcChild mode={mode}>kolom 3/3</CalcChild>
              </>
            )}
          </CalcGroup>
        </CalcParent>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {mode === "full" ? "width: 100%;"
          : mode === "minus" ? "width: calc(100% - 80px);"
            : mode === "minus2" ? "width: calc(100% - 160px);"
              : mode === "half" ? "width: calc(50% - 8px); /* gap: 16px */"
                : "width: calc(33.333% - 11px); /* gap: 16px */"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: aspect-ratio
// ─────────────────────────────────────────────────────────────────────────────

type AspectMode = "square" | "video" | "4-3" | "21-9" | "9-16"

function AspectRatioPlayground() {
  const [ratio, setRatio] = useState<AspectMode>("video")

  const ratioLabel: Record<AspectMode, string> = {
    square: "1:1",
    video: "16:9",
    "4-3": "4:3",
    "21-9": "21:9 (cinematic)",
    "9-16": "9:16 (portrait/stories)",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 aspect-ratio — jaga proporsi tanpa height eksplisit</PlaygroundWrap.label>
        <ChipRow>
          {(["square", "video", "4-3", "21-9", "9-16"] as AspectMode[]).map(v => (
            <Chip key={v} active={ratio === v} onClick={() => setRatio(v)}>{ratioLabel[v]}</Chip>
          ))}
        </ChipRow>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <CenteredNarrow>
          <AspectBox ratio={ratio}>{ratioLabel[ratio]}</AspectBox>
        </CenteredNarrow>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {`aspect-ratio: ${ratio === "square" ? "1 / 1" : ratio === "video" ? "16 / 9" : ratio === "4-3" ? "4 / 3" : ratio === "21-9" ? "21 / 9" : "9 / 16"};`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: logical properties
// ─────────────────────────────────────────────────────────────────────────────

type DirMode = "ltr" | "rtl"

function LogicalPropsPlayground() {
  const [dir, setDir] = useState<DirMode>("ltr")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Logical Properties — padding-inline-start vs padding-left</PlaygroundWrap.label>
        <ChipRow>
          <Chip active={dir === "ltr"} onClick={() => setDir("ltr")}>ltr (kiri ke kanan)</Chip>
          <Chip active={dir === "rtl"} onClick={() => setDir("rtl")}>rtl (kanan ke kiri)</Chip>
        </ChipRow>
        <DescText>
          <IC>ps-4</IC> (padding-inline-start) otomatis mengikuti arah teks — di RTL dia jadi padding kanan, bukan kiri.
        </DescText>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <CenteredMedium dir={dir}>
          <LogicalBox size={4} dir={dir}>
            ps-4 pe-2 → {dir === "ltr" ? "padding kiri lebih besar" : "padding kanan lebih besar"}
          </LogicalBox>
        </CenteredMedium>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {dir === "ltr"
          ? "padding-inline-start: 16px; /* = padding-left di LTR */"
          : "padding-inline-start: 16px; /* = padding-right di RTL! */"
        }
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: box-decoration-break
// ─────────────────────────────────────────────────────────────────────────────

type DecorationMode = "slice" | "clone"

function BoxDecorationPlayground() {
  const [mode, setMode] = useState<DecorationMode>("slice")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 box-decoration-break — styling elemen inline yang wrap ke baris baru</PlaygroundWrap.label>
        <ChipRow>
          <Chip active={mode === "slice"} onClick={() => setMode("slice")}>slice (default)</Chip>
          <Chip active={mode === "clone"} onClick={() => setMode("clone")}>clone</Chip>
        </ChipRow>
        <DescText>
          {mode === "slice"
            ? "Default — box diperlakukan sebagai satu kesatuan yang 'dipotong' di line break, border kiri/kanan hanya muncul di ujung."
            : "Setiap baris diperlakukan sebagai box terpisah — border dan padding muncul utuh di setiap baris."}
        </DescText>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <DecorationPara>
          Teks biasa dengan{" "}
          <DecorationText mode={mode}>
            highlight yang sangat panjang sehingga akan wrap ke baris berikutnya
          </DecorationText>
          {" "}lalu lanjut teks normal lagi.
        </DecorationPara>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`box-decoration-break: ${mode};`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: min-width: 0 di Flex
// ─────────────────────────────────────────────────────────────────────────────

type FixMode = "broken" | "ok"

function MinWidthFlexPlayground() {
  const [fix, setFix] = useState<FixMode>("broken")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 min-width: 0 — kenapa teks panjang bikin flex item overflow</PlaygroundWrap.label>
        <ChipRow>
          <Chip active={fix === "broken"} onClick={() => setFix("broken")}>❌ tanpa min-w-0</Chip>
          <Chip active={fix === "ok"} onClick={() => setFix("ok")}>✅ dengan min-w-0 + truncate</Chip>
        </ChipRow>
        <DescText>
          {fix === "broken"
            ? "min-width default flex item adalah 'auto' — artinya tidak akan pernah lebih kecil dari konten terpanjangnya, walau itu bikin overflow."
            : "min-w-0 mengizinkan flex item menyusut di bawah ukuran kontennya, dikombinasikan truncate untuk ellipsis."}
        </DescText>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <CenteredNarrow>
          <FlexRow>
            <FlexSidebarFixed>icon</FlexSidebarFixed>
            <FlexTextItem fix={fix}>
              <FlexTextContent fix={fix}>
                Ini adalah judul yang sangat sangat panjang dan akan overflow kalau tidak di-handle dengan benar
              </FlexTextContent>
            </FlexTextItem>
          </FlexRow>
        </CenteredNarrow>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {fix === "broken"
          ? "/* flex item: min-width: auto (default) → overflow! */"
          : "/* flex item: min-width: 0; + text: truncate; → ellipsis ✓ */"
        }
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: writing-mode
// ─────────────────────────────────────────────────────────────────────────────

type WritingMode = "horizontal" | "vertical" | "verticalLr"

function WritingModePlayground() {
  const [mode, setMode] = useState<WritingMode>("horizontal")

  const descriptions: Record<WritingMode, string> = {
    horizontal: "Default — block axis vertikal (top-to-bottom), inline axis horizontal (left-to-right).",
    vertical: "vertical-rl — block axis horizontal (right-to-left), inline axis vertikal. Umum untuk teks Jepang/Cina tradisional.",
    verticalLr: "vertical-lr — sama seperti vertical-rl tapi block axis dari kiri ke kanan. Jarang dipakai, tapi ada di Mongolian.",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 writing-mode — block & inline axis bisa diputar</PlaygroundWrap.label>
        <ChipRow>
          {(["horizontal", "vertical", "verticalLr"] as WritingMode[]).map(v => (
            <Chip key={v} active={mode === v} onClick={() => setMode(v)}>
              {v === "horizontal" ? "horizontal-tb (default)" : v === "vertical" ? "vertical-rl" : "vertical-lr"}
            </Chip>
          ))}
        </ChipRow>
        <DescText>{descriptions[mode]}</DescText>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <CenteredMinH>
          <WritingModeBox mode={mode}>
            ぼ Sample テキスト Text
          </WritingModeBox>
        </CenteredMinH>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {mode === "horizontal" ? "writing-mode: horizontal-tb;" : mode === "vertical" ? "writing-mode: vertical-rl;" : "writing-mode: vertical-lr;"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: resize
// ─────────────────────────────────────────────────────────────────────────────

type ResizeMode = "none" | "both" | "horizontal" | "vertical"

function ResizePlayground() {
  const [mode, setMode] = useState<ResizeMode>("both")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 resize — biarkan user resize elemen manual (drag pojok kanan bawah)</PlaygroundWrap.label>
        <ChipRow>
          {(["none", "both", "horizontal", "vertical"] as ResizeMode[]).map(v => (
            <Chip key={v} active={mode === v} onClick={() => setMode(v)}>{v}</Chip>
          ))}
        </ChipRow>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <ResizeBox mode={mode} defaultValue="Coba drag pojok kanan-bawah box ini (kalau mode bukan 'none')..." rows={4} />
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`resize: ${mode}; overflow: auto; /* resize butuh overflow bukan visible */`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: table box model
// ─────────────────────────────────────────────────────────────────────────────

type TableMode = "collapse" | "separate"

function TableBoxPlayground() {
  const [mode, setMode] = useState<TableMode>("collapse")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 border-collapse — box model tabel berbeda dari elemen biasa</PlaygroundWrap.label>
        <ChipRow>
          <Chip active={mode === "collapse"} onClick={() => setMode("collapse")}>border-collapse</Chip>
          <Chip active={mode === "separate"} onClick={() => setMode("separate")}>border-separate</Chip>
        </ChipRow>
        <DescText>
          {mode === "collapse"
            ? "Border antar cell yang bersebelahan 'digabung' jadi satu garis — tidak ada double border."
            : "Setiap cell punya border sendiri yang terpisah — terlihat double border di antara cell."}
        </DescText>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <DemoTable mode={mode}>
          <thead>
            <tr>
              <DemoTh>Header A</DemoTh>
              <DemoTh>Header B</DemoTh>
            </tr>
          </thead>
          <tbody>
            <tr>
              <DemoTd>Cell 1</DemoTd>
              <DemoTd>Cell 2</DemoTd>
            </tr>
            <tr>
              <DemoTd>Cell 3</DemoTd>
              <DemoTd>Cell 4</DemoTd>
            </tr>
          </tbody>
        </DemoTable>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`border-collapse: ${mode};`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: contain
// ─────────────────────────────────────────────────────────────────────────────

type ContainMode = "none" | "layout" | "paint" | "content" | "strict"

function ContainPlayground() {
  const [contain, setContain] = useState<ContainMode>("none")

  const descriptions: Record<ContainMode, string> = {
    none: "Tanpa containment — browser harus selalu cek seluruh dokumen saat elemen ini berubah.",
    layout: "contain: layout — perubahan internal elemen ini tidak mempengaruhi layout di luar. Bagus untuk performa.",
    paint: "contain: paint — konten yang overflow di-clip, dan elemen ini jadi containing block untuk painting.",
    content: "contain: content — shorthand untuk layout + paint + style (TANPA size). Aman dipakai luas karena tidak berisiko box jadi 0px.",
    strict: "contain: strict — shorthand untuk size + layout + paint + style. Maksimal isolasi performa, tapi berisiko box collapse kalau lupa set ukuran eksplisit.",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 contain — CSS Containment untuk optimasi performa rendering</PlaygroundWrap.label>
        <ChipRow>
          {(["none", "layout", "paint", "content", "strict"] as ContainMode[]).map(v => (
            <Chip key={v} active={contain === v} onClick={() => setContain(v)}>{v}</Chip>
          ))}
        </ChipRow>
        <DescText>{descriptions[contain]}</DescText>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <ContainBox contain={contain}>
          <ContainText>
            Widget independen dengan <IC>contain: {contain}</IC> — browser tahu perubahan
            di dalam box ini tidak perlu re-layout/re-paint elemen di luar.
          </ContainText>
        </ContainBox>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`contain: ${contain};`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: scrollbar-gutter
// ─────────────────────────────────────────────────────────────────────────────

type GutterMode = "auto" | "stable"

function ScrollbarGutterPlayground() {
  const [gutter, setGutter] = useState<GutterMode>("auto")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 scrollbar-gutter — cegah layout shift saat scrollbar muncul/hilang</PlaygroundWrap.label>
        <ChipRow>
          <Chip active={gutter === "auto"} onClick={() => setGutter("auto")}>auto (default)</Chip>
          <Chip active={gutter === "stable"} onClick={() => setGutter("stable")}>stable</Chip>
        </ChipRow>
        <DescText>
          {gutter === "auto"
            ? "Space untuk scrollbar hanya muncul kalau konten benar-benar overflow — konten 'loncat' saat scrollbar muncul/hilang."
            : "Space untuk scrollbar selalu di-reserve, walau scrollbar belum muncul — tidak ada layout shift."}
        </DescText>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <ScrollGutterBox gutter={gutter}>
          Konten panjang yang akan menyebabkan scroll vertikal muncul.
          <br /><br />
          Baris tambahan untuk memastikan overflow benar-benar terjadi dan scrollbar muncul di kanan box ini.
        </ScrollGutterBox>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`scrollbar-gutter: ${gutter};`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Playground: visibility vs display:none vs opacity:0
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Playground: border-radius
// ─────────────────────────────────────────────────────────────────────────────

type RadiusMode = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "tl-only" | "t-only" | "pill" | "ellipse" | "custom"

function BorderRadiusPlayground() {
  const [radius, setRadius] = useState<RadiusMode>("lg")

  const descriptions: Record<RadiusMode, string> = {
    none: "rounded-none — sudut tajam 0px",
    sm: "rounded-sm — 2px",
    md: "rounded-md — 6px",
    lg: "rounded-lg — 8px",
    xl: "rounded-xl — 12px",
    "2xl": "rounded-2xl — 16px",
    full: "rounded-full — 9999px — lingkaran sempurna kalau width=height",
    "tl-only": "rounded-tl-3xl — hanya sudut kiri atas (rounded-{corner}-{size})",
    "t-only": "rounded-t-3xl — hanya sudut atas (kiri + kanan sekaligus)",
    pill: "rounded-full pada elemen lebar — menghasilkan bentuk pill/capsule",
    ellipse: "border-radius: 50% — elips, mengikuti ukuran elemen",
    custom: "border-radius: 30% 70% 70% 30% / 30% 30% 70% 70% — nilai berbeda per sumbu X dan Y (blob shape)",
  }

  const radii: RadiusMode[] = ["none", "sm", "md", "lg", "xl", "2xl", "full", "tl-only", "t-only", "pill", "ellipse", "custom"]

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 border-radius — dari kotak ke lingkaran ke blob</PlaygroundWrap.label>
        <ChipRow>
          {radii.map(v => (
            <Chip key={v} active={radius === v} onClick={() => setRadius(v)}>{v}</Chip>
          ))}
        </ChipRow>
        <DescText>{descriptions[radius]}</DescText>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas>
        <RadiusBox radius={radius}>{radius}</RadiusBox>
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>
        {radius === "custom"
          ? "border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; /* X-axis / Y-axis */"
          : radius === "ellipse"
            ? "border-radius: 50%; /* elips — mengikuti aspect ratio elemen */"
            : radius === "tl-only"
              ? "border-top-left-radius: 1.5rem; /* individual corner */"
              : radius === "t-only"
                ? "border-top-left-radius: 1.5rem; border-top-right-radius: 1.5rem; /* shorthand: rounded-t-3xl */"
                : `border-radius: Tailwind rounded-${radius};`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: border-style
// ─────────────────────────────────────────────────────────────────────────────

type BorderStyleMode = "solid" | "dashed" | "dotted" | "double" | "groove" | "ridge" | "inset" | "outset" | "none" | "hidden"

function BorderStylePlayground() {
  const [style, setStyle] = useState<BorderStyleMode>("solid")

  const descriptions: Record<BorderStyleMode, string> = {
    solid: "solid — garis penuh biasa. Paling sering dipakai.",
    dashed: "dashed — garis putus-putus. Cocok untuk border 'dropzone' atau 'placeholder'.",
    dotted: "dotted — titik-titik. Cocok untuk efek vintage atau dekoratif.",
    double: "double — dua garis paralel. Total ketebalan = nilai border-width (butuh minimal 3px agar terlihat).",
    groove: "groove — ilusi 3D seperti 'terukir'. Warna terang/gelap dihitung dari border-color.",
    ridge: "ridge — kebalikan groove — ilusi 3D seperti 'menonjol'.",
    inset: "inset — seluruh box tampak 'terbenam'. Warna tepi kiri-atas lebih gelap.",
    outset: "outset — kebalikan inset — seluruh box tampak 'menonjol'. Tampak 3D keluar.",
    none: "none — tidak ada border, tidak ada space. Berbeda dengan hidden.",
    hidden: "hidden — tidak tampak, tapi dalam konteks tabel border-collapse, hidden menang atas border lain.",
  }

  const styles: BorderStyleMode[] = ["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset", "none", "hidden"]

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 border-style — semua 10 nilai</PlaygroundWrap.label>
        <ChipRow>
          {styles.map(v => (
            <Chip key={v} active={style === v} onClick={() => setStyle(v)}>{v}</Chip>
          ))}
        </ChipRow>
        <DescText>{descriptions[style]}</DescText>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas>
        <BorderStyleBox style={style}>{style}</BorderStyleBox>
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>
        {`border-style: ${style}; /* Tailwind: border-${style === "solid" ? "solid" : style === "dashed" ? "dashed" : style === "dotted" ? "dotted" : style === "double" ? "double" : style === "none" ? "0" : `[border-style:${style}]`} */`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: clamp()
// ─────────────────────────────────────────────────────────────────────────────

type ClampMode = "fixed" | "min-w" | "clamp" | "clamp2"

function ClampPlayground() {
  const [mode, setMode] = useState<ClampMode>("clamp")

  const descriptions: Record<ClampMode, string> = {
    fixed: "w-48 — lebar tetap 192px. Tidak responsif sama sekali.",
    "min-w": "min-w + w-full + max-w — tiga property terpisah. Efektif tapi verbose.",
    clamp: "clamp(8rem, 50%, 24rem) — MIN 128px, PREFERRED 50% container, MAX 384px. Satu property, responsif otomatis.",
    clamp2: "clamp() untuk font-size — font mengecil di layar kecil (min 12px), membesar di layar besar (max 20px), mengikuti viewport di tengah.",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 clamp(MIN, PREFERRED, MAX) — fluid sizing dalam satu fungsi</PlaygroundWrap.label>
        <ChipRow>
          {(["fixed", "min-w", "clamp", "clamp2"] as ClampMode[]).map(v => (
            <Chip key={v} active={mode === v} onClick={() => setMode(v)}>{v}</Chip>
          ))}
        </ChipRow>
        <DescText>{descriptions[mode]}</DescText>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas layout="column-stretch">
        <DemoBackground>
          <ClampBox mode={mode}>
            {mode === "clamp2" ? "Fluid text" : `width: ${mode}`}
          </ClampBox>
        </DemoBackground>
        <CenterCaption>
          {mode === "clamp" && "Resize jendela browser — lebar berubah antara 128px–384px"}
          {mode === "clamp2" && "Resize jendela browser — font size berubah antara 12px–20px"}
          {mode === "fixed" && "Lebar selalu 192px — overflow di layar kecil"}
          {mode === "min-w" && "Tiga property terpisah — hasil sama tapi lebih verbose"}
        </CenterCaption>
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>
        {mode === "clamp" && "width: clamp(8rem, 50%, 24rem); /* Tailwind: w-[clamp(8rem,50%,24rem)] */"}
        {mode === "clamp2" && "font-size: clamp(0.75rem, 2vw, 1.25rem); /* Tailwind: text-[clamp(0.75rem,2vw,1.25rem)] */"}
        {mode === "fixed" && "width: 12rem; /* w-48 — tidak responsif */"}
        {mode === "min-w" && "min-width: 8rem; width: 100%; max-width: 24rem; /* verbose tapi setara clamp */"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

type VisMode = "visible" | "display-none" | "visibility-hid" | "opacity-0"

function VisibilityPlayground() {
  const [mode, setMode] = useState<VisMode>("visible")

  const descriptions: Record<VisMode, string> = {
    "visible": "Normal — elemen tampak, occupy space, bisa diklik.",
    "display-none": "display: none — elemen TIDAK ada di layout sama sekali. Tidak occupy space, tidak bisa diklik, tidak muncul di accessibility tree.",
    "visibility-hid": "visibility: hidden — elemen TIDAK tampak, tapi TETAP occupy space-nya. Elemen kedua tidak bergeser. Tidak bisa diklik. Masih bisa di-inherit oleh child (bisa di-override dengan visibility: visible di child).",
    "opacity-0": "opacity: 0 — elemen TIDAK tampak, tapi TETAP occupy space dan TETAP BISA DIKLIK (pointer events masih aktif). Beda dengan visibility: hidden!",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 visibility vs display:none vs opacity:0</PlaygroundWrap.label>
        <ChipRow>
          {(["visible", "display-none", "visibility-hid", "opacity-0"] as VisMode[]).map(v => (
            <Chip key={v} active={mode === v} onClick={() => setMode(v)}>
              {v}
            </Chip>
          ))}
        </ChipRow>
        <DescText>{descriptions[mode]}</DescText>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas layout="gap-flex">
        <VisibilityRow>
          <VisibilityBox mode={mode}>Target Box</VisibilityBox>
          <NeighborBox>
            Neighbor Box
          </NeighborBox>
        </VisibilityRow>
        <HintText>
          {mode === "display-none" && "← Neighbor langsung geser kiri — space hilang"}
          {mode === "visibility-hid" && "← Neighbor tetap di posisi — space masih ada"}
          {mode === "opacity-0" && "← Neighbor tetap di posisi — tapi area klik masih aktif!"}
          {mode === "visible" && "Kedua box tampak normal"}
        </HintText>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {mode === "display-none" && "display: none; /* hilang dari layout sepenuhnya */"}
        {mode === "visibility-hid" && "visibility: hidden; /* tak terlihat, space tetap ada */"}
        {mode === "opacity-0" && "opacity: 0; /* tak terlihat, TAPI masih bisa diklik! */"}
        {mode === "visible" && "/* tampak normal */"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: margin: auto centering
// ─────────────────────────────────────────────────────────────────────────────

type AutoMode = "none" | "center" | "left" | "right" | "flex-center"

function MarginAutoPlayground() {
  const [mode, setMode] = useState<AutoMode>("center")

  const descriptions: Record<AutoMode, string> = {
    "none": "Tanpa margin auto — elemen align kiri (default block).",
    "center": "mx-auto — margin-left dan margin-right keduanya auto → sisa space dibagi rata → center.",
    "left": "mr-auto — hanya margin-right yang auto → elemen terdesak ke kiri.",
    "right": "ml-auto — hanya margin-left yang auto → elemen terdesak ke kanan.",
    "flex-center": "Di flex container: ml-auto/mr-auto push elemen ke sisi. Trick populer untuk navbar: logo kiri, tombol kanan dengan ml-auto di tombol.",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 margin: auto — cara kerja centering klasik</PlaygroundWrap.label>
        <ChipRow>
          {(["none", "center", "left", "right", "flex-center"] as AutoMode[]).map(v => (
            <Chip key={v} active={mode === v} onClick={() => setMode(v)}>{v}</Chip>
          ))}
        </ChipRow>
        <DescText>{descriptions[mode]}</DescText>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas layout="column-stretch">
        <DemoBackground>
          {mode === "flex-center" ? (
            <MarginAutoContainer>
              <MarginAutoLogo>Logo</MarginAutoLogo>
              <MarginAutoButton>Button</MarginAutoButton>
            </MarginAutoContainer>
          ) : (
            <AutoMarginChild mode={mode}>
              {mode === "none" ? "w-48 (no auto)" : `w-48 · ${mode === "center" ? "mx-auto" : mode === "left" ? "mr-auto" : "ml-auto"}`}
            </AutoMarginChild>
          )}
        </DemoBackground>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {mode === "none" && "/* no margin auto — align kiri */"}
        {mode === "center" && "margin-left: auto; margin-right: auto; /* atau margin: 0 auto */"}
        {mode === "left" && "margin-right: auto; /* push ke kiri */"}
        {mode === "right" && "margin-left: auto; /* push ke kanan */"}
        {mode === "flex-center" && ".nav { display: flex; } .button { margin-left: auto; } /* push ke kanan */"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: box-shadow vs filter: drop-shadow
// ─────────────────────────────────────────────────────────────────────────────

type ShadowMode = "none" | "box-sm" | "box-md" | "box-lg" | "box-xl" | "box-inset" | "drop-sm" | "drop-lg"
type ShapeMode = "box-shadow" | "drop-shadow"

function BoxShadowPlayground() {
  const [shadow, setShadow] = useState<ShadowMode>("box-md")
  const [shape, setShape] = useState<ShapeMode>("box-shadow")

  const shadowDescriptions: Record<ShadowMode, string> = {
    "none": "Tanpa shadow",
    "box-sm": "box-shadow kecil — shadow-sm",
    "box-md": "box-shadow medium — shadow-md",
    "box-lg": "box-shadow besar — shadow-lg",
    "box-xl": "box-shadow ekstra besar — shadow-xl",
    "box-inset": "box-shadow inset — shadow di dalam elemen, bukan di luar",
    "drop-sm": "filter: drop-shadow kecil",
    "drop-lg": "filter: drop-shadow besar",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 box-shadow vs filter: drop-shadow</PlaygroundWrap.label>
        <ControlGroup>
          <ControlGroup.label>Pilih shadow type</ControlGroup.label>
          <ChipRow>
            {(["none", "box-sm", "box-md", "box-lg", "box-xl", "box-inset", "drop-sm", "drop-lg"] as ShadowMode[]).map(v => (
              <Chip key={v} active={shadow === v} onClick={() => setShadow(v)}>{v}</Chip>
            ))}
          </ChipRow>
          <DescText>{shadowDescriptions[shadow]}</DescText>
        </ControlGroup>
        <ControlGroup>
          <ControlGroup.label>Shape test (lihat perbedaan pada icon/clip-path)</ControlGroup.label>
          <ChipRow>
            <Chip active={shape === "box-shadow"} onClick={() => setShape("box-shadow")}>box-shadow</Chip>
            <Chip active={shape === "drop-shadow"} onClick={() => setShape("drop-shadow")}>drop-shadow</Chip>
          </ChipRow>
          <DescText>
            {shape === "box-shadow"
              ? "box-shadow selalu mengikuti BENTUK BOX (rectangular bounding box) — tidak peduli transparent area di dalam."
              : "filter: drop-shadow mengikuti ALPHA CHANNEL aktual — shadow menyesuaikan bentuk transparan PNG/SVG."}
          </DescText>
        </ControlGroup>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas layout="wrap">
        <ShadowContainer>
          <ShadowContainer.group>
            <ShadowContainer.caption>Box (rectangular)</ShadowContainer.caption>
            <ShadowBox type={shadow}>box</ShadowBox>
          </ShadowContainer.group>
          <ShadowContainer.group>
            <ShadowContainer.caption>Non-rectangular shape</ShadowContainer.caption>
            <ShadowShape type={shape}>⭐</ShadowShape>
            <ShadowContainer.caption>
              {shape === "box-shadow" ? "shadow = kotak ⭐'s bounding box" : "shadow = ikut bentuk ⭐"}
            </ShadowContainer.caption>
          </ShadowContainer.group>
        </ShadowContainer>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {shadow.startsWith("drop")
          ? `filter: drop-shadow(0 4px 16px rgba(0,0,0,0.25)); /* mengikuti shape alpha */`
          : shadow === "box-inset"
            ? `box-shadow: inset 0 2px 8px rgba(0,0,0,0.15); /* shadow di DALAM */`
            : `box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); /* selalu rectangular bounding box */`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function BoxModelPage() {
  const [activeSection, setActiveSection] = useState("anatomy")

  return (
    <Page>
      <TopBar>
        <TopBarInner>
          <Breadcrumb>
            <Breadcrumb.link href="/learn">Learn</Breadcrumb.link>
            <Breadcrumb.sep>/</Breadcrumb.sep>
            <Breadcrumb.link href="/learn/dasar-css">Dasar CSS</Breadcrumb.link>
            <Breadcrumb.curr>Box Model</Breadcrumb.curr>
          </Breadcrumb>
        </TopBarInner>
      </TopBar>

      <Body>
        <Content>
          <PageTitle>Box Model</PageTitle>
          <PageDesc>
            Fondasi semua layout CSS — setiap elemen HTML adalah sebuah kotak rectangular.
            Sebelum belajar Flexbox, Grid, atau Positioning, kamu harus benar-benar paham ini.
          </PageDesc>

          {/* ══════════════════════════════════════════════════════════════
              01 ANATOMY
          ══════════════════════════════════════════════════════════════ */}
          <Section id="anatomy" onClick={() => setActiveSection("anatomy")}>
            <H2>
              Anatomi Box Model
              <H2.anchor href="#anatomy">#</H2.anchor>
            </H2>

            <Callout type="php">
              <Callout.icon>🐘</Callout.icon>
              <Callout.content>
                <Callout.title>Analogi PHP</Callout.title>
                Di PHP, sebelum pakai array atau OOP, kamu harus ngerti tipe data dasar — string, int, bool.
                Di CSS, Box Model adalah "tipe data dasar"-nya layout. Setiap elemen, tanpa terkecuali, adalah kotak rectangular.
              </Callout.content>
            </Callout>

            <P>
              Setiap elemen HTML punya 4 lapisan dari dalam ke luar:
            </P>

            <AnatomyTable>
              {[
                { layer: "content" as const, label: "Content", desc: "Isi sebenarnya — teks, gambar, child elements. Dikontrol lewat width dan height." },
                { layer: "padding" as const, label: "Padding", desc: "Jarak antara content dan border. Masih kena background color. Tidak transparan." },
                { layer: "border" as const, label: "Border", desc: "Garis tepi elemen. Punya width, style (solid, dashed, dotted), dan color." },
                { layer: "margin" as const, label: "Margin", desc: "Jarak ke elemen lain di luar. Selalu transparan — tidak kena background." },
              ].map(({ layer, label, desc }) => (
                <AnatomyRow key={layer} layer={layer}>
                  <IC>{label.toLowerCase()}</IC>
                  <AnatomyRow.desc>{desc}</AnatomyRow.desc>
                </AnatomyRow>
              ))}
            </AnatomyTable>
          </Section>

          {/* ══════════════════════════════════════════════════════════════
              02 PLAYGROUND
          ══════════════════════════════════════════════════════════════ */}
          <Section id="playground" onClick={() => setActiveSection("playground")}>
            <H2>
              Interactive Playground
              <H2.anchor href="#playground">#</H2.anchor>
            </H2>
            <BoxModelPlayground />

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                Buka DevTools (F12) → inspect elemen → lihat diagram box model di panel kanan.
                Cara paling cepat memahami margin/padding/border dari elemen yang sudah ada.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              03 BOX-SIZING
          ══════════════════════════════════════════════════════════════ */}
          <Section id="box-sizing" onClick={() => setActiveSection("box-sizing")}>
            <H2>
              box-sizing: content-box vs border-box
              <H2.anchor href="#box-sizing">#</H2.anchor>
            </H2>

            <P>
              Ini salah satu sumber kebingungan terbesar di CSS. By default, <IC>width</IC> hanya
              menghitung <IC>content</IC> — padding dan border ditambahkan ke luar, bikin elemen
              jadi lebih besar dari yang diharapkan.
            </P>

            <BoxSizingPlayground />

            <Code file="globals.css">{`
/* Tailwind sudah set ini secara global — kamu tidak perlu khawatir */
*, *::before, *::after {
  box-sizing: border-box;
}

/* Artinya: width: 200px → actual width di browser tetap 200px
   meski ada padding: 20px dan border: 4px di dalamnya */
            `}</Code>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>Jangan lupa kalau tidak pakai Tailwind</Callout.title>
                Kalau kamu nulis CSS vanilla, pastikan set <IC>box-sizing: border-box</IC> di
                global reset. Tanpa ini, kalkulasi width/height bisa mengejutkan.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              04 OUTLINE VS BORDER
          ══════════════════════════════════════════════════════════════ */}
          <Section id="outline" onClick={() => setActiveSection("outline")}>
            <H2>
              outline vs border
              <H2.anchor href="#outline">#</H2.anchor>
            </H2>

            <P>
              <IC>border</IC> adalah bagian dari box model — dia mengambil space dan mempengaruhi layout.
              <IC>outline</IC> digambar di luar box model — tidak mengambil space, tidak mempengaruhi posisi elemen lain.
            </P>

            <OutlineBorderPlayground />

            <Code file="outline-vs-border.css">{`
/* border — mengambil space, bagian dari box model */
.border-example {
  border: 4px solid blue;
  /* Menambah 8px ke total width/height elemen */
}

/* outline — TIDAK mengambil space, di luar box model */
.outline-example {
  outline: 4px solid blue;
  /* Tidak mempengaruhi layout sama sekali */
  outline-offset: 2px; /* Jarak outline dari border */
}

/* Kapan pakai outline:
   - Focus indicator (accessibility) — default browser pakai outline
   - Debugging layout tanpa mengubah posisi elemen
   - Efek visual yang tidak boleh geser layout */
            `}</Code>

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                Browser secara default pakai <IC>outline</IC> untuk focus state tombol dan input —
                itulah kenapa menghapus <IC>outline: none</IC> tanpa replacement berbahaya untuk accessibility.
                Selalu sediakan focus indicator alternatif.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              05 MARGIN COLLAPSE
          ══════════════════════════════════════════════════════════════ */}
          <Section id="margin-collapse" onClick={() => setActiveSection("margin-collapse")}>
            <H2>
              Margin Collapse
              <H2.anchor href="#margin-collapse">#</H2.anchor>
            </H2>

            <P>
              Ini salah satu behaviour CSS yang paling sering bikin bingung. Ketika dua elemen block
              bersentuhan secara vertikal, margin mereka tidak dijumlahkan — melainkan "collapse"
              menjadi yang terbesar di antara keduanya.
            </P>

            <MarginCollapsePlayground />

            <Code file="margin-collapse.css">{`
/* ❌ Mungkin kamu harap gap = 32px (16 + 16) */
.block-a { margin-bottom: 16px; }
.block-b { margin-top: 16px; }
/* Actual gap = 16px — collapsed! */

/* ✅ Cara menghindari margin collapse: */

/* 1. Pakai flexbox/grid pada parent */
.parent { display: flex; flex-direction: column; }

/* 2. Pakai gap sebagai ganti margin */
.parent { display: flex; flex-direction: column; gap: 16px; }

/* 3. Pakai padding pada parent (bukan margin pada child) */
.parent { padding: 16px 0; }

/* 4. Tambahkan border/padding pada parent */
.parent { border: 1px solid transparent; }
            `}</Code>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>Margin collapse hanya terjadi secara vertikal (block axis)</Callout.title>
                Margin horizontal (kiri/kanan) tidak pernah collapse. Dan margin collapse
                tidak terjadi di flex container atau grid container.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              06 NEGATIVE MARGIN
          ══════════════════════════════════════════════════════════════ */}
          <Section id="negative-margin" onClick={() => setActiveSection("negative-margin")}>
            <H2>
              Negative Margin
              <H2.anchor href="#negative-margin">#</H2.anchor>
            </H2>

            <P>
              Berbeda dengan padding yang tidak bisa negatif, margin bisa negatif.
              Negative margin menarik elemen ke arah berlawanan — berguna untuk
              overlap, alignment, dan beberapa layout trick.
            </P>

            <NegativeMarginPlayground />

            <Code file="negative-margin.css">{`
/* Negative margin — menarik elemen ke arah berlawanan */
.overlap {
  margin-top: -16px;    /* tarik ke atas */
  margin-left: -8px;    /* tarik ke kiri */
}

/* Use case umum: */

/* 1. Pull quote / overlap image */
.pull-quote {
  margin-top: -2rem;
  position: relative;
}

/* 2. Kompensasi padding parent */
.full-bleed {
  margin-left: -1rem;   /* kompensasi padding parent */
  margin-right: -1rem;
  width: calc(100% + 2rem);
}

/* 3. Grid dengan gap yang tidak seragam */
.grid-item {
  margin-bottom: -1px; /* collapse border overlap */
}
            `}</Code>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                Di Tailwind, negative margin ditulis dengan prefix <IC>-</IC>:
                <IC>-mt-4</IC>, <IC>-ml-2</IC>, <IC>-mx-6</IC> dll.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              07 OVERFLOW
          ══════════════════════════════════════════════════════════════ */}
          <Section id="overflow" onClick={() => setActiveSection("overflow")}>
            <H2>
              overflow
              <H2.anchor href="#overflow">#</H2.anchor>
            </H2>

            <P>
              Ketika konten lebih besar dari box-nya, <IC>overflow</IC> menentukan apa yang terjadi.
              Ini mempengaruhi scrollbar, clipping, dan behaviour layout.
            </P>

            <OverflowPlayground />

            <Code file="overflow.css">{`
.box {
  width: 200px;
  height: 100px;
}

/* visible  — default, konten keluar dari box */
.box { overflow: visible; }

/* hidden   — konten dipotong, tidak ada scroll */
.box { overflow: hidden; }

/* scroll   — selalu ada scrollbar */
.box { overflow: scroll; }

/* auto     — scrollbar hanya kalau perlu */
.box { overflow: auto; }

/* clip     — seperti hidden, tapi tidak bisa di-scroll programmatic */
.box { overflow: clip; }

/* Bisa set per-axis: */
.box {
  overflow-x: hidden;   /* horizontal dipotong */
  overflow-y: auto;     /* vertical scroll kalau perlu */
}
            `}</Code>

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                <Callout.title>overflow: hidden bikin stacking context baru</Callout.title>
                Ini efek samping yang sering tidak disadari. Elemen dengan <IC>overflow: hidden</IC>
                jadi stacking context — artinya <IC>z-index</IC> dari child elements tidak bisa
                "keluar" dari parent ini.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              08 WIDTH VARIANTS
          ══════════════════════════════════════════════════════════════ */}
          <Section id="width-variants" onClick={() => setActiveSection("width-variants")}>
            <H2>
              width / min-width / max-width
              <H2.anchor href="#width-variants">#</H2.anchor>
            </H2>

            <P>
              Tiga property ini bekerja bersama. <IC>width</IC> set lebar eksplisit,
              <IC>min-width</IC> set batas minimum, <IC>max-width</IC> set batas maksimum.
              Plus ada intrinsic sizing: <IC>min-content</IC>, <IC>max-content</IC>, <IC>fit-content</IC>.
            </P>

            <WidthPlayground />

            <Code file="width.css">{`
/* Eksplisit */
.box { width: 200px; }

/* Responsif dengan constraint */
.container {
  width: 100%;         /* full lebar parent */
  max-width: 1200px;   /* tapi tidak lebih dari 1200px */
  margin: 0 auto;      /* center */
}

/* Intrinsic sizing */
.tag { width: min-content; }  /* sesempit mungkin */
.card { width: max-content; } /* selebar konten penuh */
.chip { width: fit-content; } /* fit ke konten, max parent */

/* Tailwind */
/* w-full, w-auto, max-w-xs, max-w-screen-lg, min-w-0, min-w-full */
/* w-min, w-max, w-fit */
            `}</Code>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                <IC>min-w-0</IC> adalah class Tailwind yang paling sering lupa dipakai.
                Dalam flex container, item bisa overflow melebihi flex container karena
                <IC>min-width</IC> default-nya <IC>auto</IC>. Tambahkan <IC>min-w-0</IC>
                ke flex item yang berisi teks panjang untuk fix ini.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              09 HEIGHT 100%
          ══════════════════════════════════════════════════════════════ */}
          <Section id="height" onClick={() => setActiveSection("height")}>
            <H2>
              Kenapa height: 100% sering tidak jalan?
              <H2.anchor href="#height">#</H2.anchor>
            </H2>

            <P>
              Ini pertanyaan klasik. <IC>height: 100%</IC> berarti "100% dari tinggi parent".
              Tapi kalau parent tidak punya tinggi yang terdefinisi, browser tidak tahu 100% dari apa.
            </P>

            <Code file="height-100.css">{`
/* ❌ Tidak jalan — parent tidak punya height eksplisit */
.parent { }
.child  { height: 100%; } /* 100% dari... apa? */

/* ✅ Cara 1: Set height eksplisit di parent */
.parent { height: 400px; }
.child  { height: 100%; } /* 100% dari 400px = 400px ✓ */

/* ✅ Cara 2: Rantai ke root */
html, body { height: 100%; }
.parent    { height: 100%; }
.child     { height: 100%; }

/* ✅ Cara 3: Pakai vh */
.child { height: 100vh; } /* 100% tinggi viewport */

/* ✅ Cara 4: Pakai flexbox (paling modern) */
.parent {
  display: flex;
  flex-direction: column;
}
.child {
  flex: 1; /* mengisi sisa tinggi parent */
}

/* ✅ Cara 5: Pakai grid */
.parent { display: grid; grid-template-rows: auto 1fr auto; }
.child  { } /* row dengan 1fr otomatis mengisi sisa */
            `}</Code>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>min-height: 100vh vs height: 100vh</Callout.title>
                Untuk page shell, pakai <IC>min-h-screen</IC> (<IC>min-height: 100vh</IC>)
                bukan <IC>h-screen</IC> (<IC>height: 100vh</IC>). Kalau konten lebih panjang
                dari viewport, <IC>h-screen</IC> akan clip konten. <IC>min-h-screen</IC>
                bisa grow sesuai konten.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              10 INLINE & BOX MODEL
          ══════════════════════════════════════════════════════════════ */}
          <Section id="inline-box" onClick={() => setActiveSection("inline-box")}>
            <H2>
              Inline Elements & Box Model
              <H2.anchor href="#inline-box">#</H2.anchor>
            </H2>

            <P>
              Inline elements (<IC>span</IC>, <IC>a</IC>, <IC>strong</IC>) punya perilaku box model
              yang berbeda dari block elements. Ini sering jadi sumber confusion.
            </P>

            <Code file="inline-box-model.css">{`
/* BLOCK elements — full box model berlaku */
div, p, h1 {
  width: 200px;       ✓ berlaku
  height: 100px;      ✓ berlaku
  padding: 20px;      ✓ berlaku (semua sisi)
  margin: 20px;       ✓ berlaku (semua sisi)
  border: 2px solid;  ✓ berlaku
}

/* INLINE elements — box model terbatas */
span, a, strong {
  width: 200px;       ✗ TIDAK berlaku
  height: 100px;      ✗ TIDAK berlaku
  padding: 20px;      ⚠️ berlaku kiri/kanan, tapi atas/bawah tidak geser element lain
  margin: 20px;       ⚠️ berlaku kiri/kanan SAJA, atas/bawah diabaikan
  border: 2px solid;  ⚠️ muncul, tapi tidak geser element lain secara vertikal
}

/* Solusi: ganti ke inline-block atau block */
.button-like-span {
  display: inline-block;
  /* sekarang width, height, margin semua berlaku */
}
            `}</Code>

            <Callout type="php">
              <Callout.icon>🐘</Callout.icon>
              <Callout.content>
                <Callout.title>Analogi PHP</Callout.title>
                Inline element itu seperti string di PHP — kamu bisa concatenate (flow bersama),
                tapi tidak bisa set "tinggi" atau "lebar" layaknya array.
                Block element itu seperti array — punya dimensi yang bisa dikontrol.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              CALC()
          ══════════════════════════════════════════════════════════════ */}
          <Section id="calc" onClick={() => setActiveSection("calc")}>
            <H2>
              calc() — kombinasi unit berbeda
              <H2.anchor href="#calc">#</H2.anchor>
            </H2>

            <P>
              <IC>calc()</IC> memungkinkan kombinasi unit berbeda (px, %, rem, vh) dalam satu
              ekspresi matematika. Sangat berguna untuk layout dengan sidebar fixed-width
              dan konten yang harus mengisi sisa space.
            </P>

            <CalcPlayground />

            <Code file="calc.css">{`
/* Sidebar fixed 80px, konten mengisi sisa */
.content {
  width: calc(100% - 80px);
}

/* Dua kolom dengan gap 16px */
.col {
  width: calc(50% - 8px); /* setengah lebar, kurangi setengah gap */
}

/* Full-height minus header dan footer */
.main {
  min-height: calc(100vh - 64px - 48px);
}

/* Bisa nested dan kombinasi operator: + - * / */
.box {
  padding: calc(1rem + 2vw);
}
            `}</Code>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                Untuk kasus dua/tiga kolom dengan gap, Flexbox/Grid dengan <IC>gap</IC> biasanya
                lebih simpel daripada <IC>calc()</IC> manual. <IC>calc()</IC> paling berguna saat
                kamu butuh kombinasi unit yang tidak didukung Flexbox/Grid secara native,
                seperti <IC>calc(100vh - 64px)</IC>.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              ASPECT-RATIO
          ══════════════════════════════════════════════════════════════ */}
          <Section id="aspect-ratio" onClick={() => setActiveSection("aspect-ratio")}>
            <H2>
              aspect-ratio
              <H2.anchor href="#aspect-ratio">#</H2.anchor>
            </H2>

            <P>
              Sebelum <IC>aspect-ratio</IC> ada, menjaga proporsi gambar/video butuh trik
              "padding-bottom hack". Sekarang cukup satu baris CSS — height otomatis
              dihitung dari width berdasarkan rasio yang ditentukan.
            </P>

            <AspectRatioPlayground />

            <Code file="aspect-ratio.css">{`
/* Cara modern */
.video-embed {
  width: 100%;
  aspect-ratio: 16 / 9;
}

/* Cara lama (padding-bottom hack) — masih kadang dipakai untuk browser lama */
.video-embed-legacy {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 9/16 = 0.5625 */
}
.video-embed-legacy iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* Tailwind: aspect-square, aspect-video, aspect-[4/3] */
            `}</Code>

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                <Callout.title>Default browser untuk img dan video</Callout.title>
                Browser modern otomatis menghitung <IC>aspect-ratio</IC> dari atribut
                <IC>width</IC> dan <IC>height</IC> di tag <IC>{"<img>"}</IC> — ini mencegah
                layout shift sebelum gambar selesai dimuat (penting untuk Core Web Vitals).
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              LOGICAL PROPERTIES
          ══════════════════════════════════════════════════════════════ */}
          <Section id="logical-props" onClick={() => setActiveSection("logical-props")}>
            <H2>
              Logical Properties
              <H2.anchor href="#logical-props">#</H2.anchor>
            </H2>

            <P>
              Property fisik seperti <IC>margin-left</IC> dan <IC>padding-right</IC> selalu
              merujuk ke arah yang sama secara visual. Logical properties seperti
              <IC>margin-inline-start</IC> mengikuti arah penulisan teks (LTR/RTL) —
              penting untuk dukungan internasionalisasi (Arab, Ibrani, dll).
            </P>

            <LogicalPropsPlayground />

            <Code file="logical-properties.css">{`
/* Physical — selalu kiri, apapun arah bahasanya */
.box-physical {
  margin-left: 16px;
  padding-right: 8px;
}

/* Logical — otomatis ikut arah teks */
.box-logical {
  margin-inline-start: 16px;  /* kiri di LTR, kanan di RTL */
  padding-inline-end: 8px;    /* kanan di LTR, kiri di RTL */
}

/* Block axis (vertikal, tidak berubah dengan RTL tapi berubah dengan writing-mode) */
.box-block {
  margin-block-start: 16px;  /* setara margin-top di mode horizontal */
  margin-block-end: 8px;     /* setara margin-bottom */
}

/* Tailwind: ps-4 (padding-inline-start), pe-2 (padding-inline-end),
   ms-4 (margin-inline-start), me-2 (margin-inline-end) */
            `}</Code>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                Kalau project kamu tidak butuh dukungan RTL, physical properties
                (<IC>ml-4</IC>, <IC>pr-2</IC>) tetap sepenuhnya valid dan lebih familiar.
                Logical properties jadi penting begitu kamu butuh dukungan multi-bahasa
                dengan arah teks berbeda.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              BOX-DECORATION-BREAK
          ══════════════════════════════════════════════════════════════ */}
          <Section id="box-decoration" onClick={() => setActiveSection("box-decoration")}>
            <H2>
              box-decoration-break
              <H2.anchor href="#box-decoration">#</H2.anchor>
            </H2>

            <P>
              Ketika elemen <IC>inline</IC> dengan background/border/padding wrap ke baris
              baru, browser harus memutuskan apakah box-nya diperlakukan sebagai satu
              kesatuan yang "dipotong" (<IC>slice</IC>, default) atau setiap baris jadi
              box terpisah (<IC>clone</IC>).
            </P>

            <BoxDecorationPlayground />

            <Code file="box-decoration-break.css">{`
/* slice (default) — box dipotong di line break,
   border kiri hanya di awal, border kanan hanya di akhir */
.highlight-slice {
  background: yellow;
  padding: 4px 8px;
  box-decoration-break: slice;
}

/* clone — setiap baris dapat padding/border penuh,
   seperti highlight di banyak editor teks */
.highlight-clone {
  background: yellow;
  padding: 4px 8px;
  border-radius: 4px;
  box-decoration-break: clone;
}
            `}</Code>

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                Ini niche tapi berguna untuk styling teks ber-highlight yang panjang
                (seperti hasil pencarian) atau efek "marker" yang konsisten di setiap baris.
              </Callout.content>
            </Callout>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>Belum termasuk Baseline</Callout.title>
                Per dokumentasi MDN, <IC>box-decoration-break</IC> belum termasuk fitur
                Baseline karena belum didukung di sebagian browser populer. Tambahkan
                prefix <IC>-webkit-box-decoration-break</IC> untuk cakupan lebih luas,
                dan uji di browser target sebelum production.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              MIN-WIDTH 0 DI FLEX
          ══════════════════════════════════════════════════════════════ */}
          <Section id="min-width-flex" onClick={() => setActiveSection("min-width-flex")}>
            <H2>
              min-width: 0 — flex item overflow trap
              <H2.anchor href="#min-width-flex">#</H2.anchor>
            </H2>

            <P>
              Ini bug yang hampir semua developer pernah alami: flex item berisi teks panjang
              malah overflow keluar container, padahal sudah pakai <IC>flex-1</IC>. Penyebabnya:
              <IC>min-width</IC> default flex item adalah <IC>auto</IC>, bukan <IC>0</IC>.
            </P>

            <MinWidthFlexPlayground />

            <Code file="min-width-flex.css">{`
/* ❌ Bug klasik — flex item tidak mau menyusut di bawah ukuran kontennya */
.flex-item {
  flex: 1;
  /* min-width: auto (default) — tidak bisa lebih kecil dari konten! */
}

/* ✅ Fix — izinkan flex item menyusut */
.flex-item {
  flex: 1;
  min-width: 0; /* sekarang bisa menyusut, kombinasikan dengan truncate */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Tailwind: min-w-0 truncate */
            `}</Code>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>Sama berlaku untuk Grid</Callout.title>
                Grid item juga punya <IC>min-width: auto</IC> dan <IC>min-height: auto</IC>
                sebagai default. Kalau grid item dengan teks panjang overflow, fix-nya sama:
                tambahkan <IC>min-w-0</IC>.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              WRITING MODE
          ══════════════════════════════════════════════════════════════ */}
          <Section id="writing-mode" onClick={() => setActiveSection("writing-mode")}>
            <H2>
              writing-mode
              <H2.anchor href="#writing-mode">#</H2.anchor>
            </H2>

            <P>
              <IC>writing-mode</IC> bisa memutar arah block dan inline axis sepenuhnya.
              Ini terkait erat dengan Logical Properties — di <IC>vertical-rl</IC>,
              "block axis" jadi horizontal dan "inline axis" jadi vertikal, jadi
              <IC>padding-inline-start</IC> sekarang berarti padding atas, bukan kiri.
            </P>

            <WritingModePlayground />

            <Code file="writing-mode.css">{`
/* Default */
.text { writing-mode: horizontal-tb; }

/* Vertikal — teks mengalir top-to-bottom, kolom kanan ke kiri */
.vertical-text {
  writing-mode: vertical-rl;
}

/* Kombinasi umum untuk teks CJK (Chinese/Japanese/Korean) tradisional */
.cjk-vertical {
  writing-mode: vertical-rl;
  text-orientation: mixed; /* karakter latin tetap horizontal, CJK vertikal */
}
            `}</Code>

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                <Callout.title>Kapan ini relevan?</Callout.title>
                Selain untuk teks CJK tradisional, <IC>writing-mode</IC> kadang dipakai untuk
                efek desain seperti label vertikal di sidebar, judul artikel majalah,
                atau tab vertikal dengan teks miring.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              RESIZE
          ══════════════════════════════════════════════════════════════ */}
          <Section id="resize" onClick={() => setActiveSection("resize")}>
            <H2>
              resize
              <H2.anchor href="#resize">#</H2.anchor>
            </H2>

            <P>
              <IC>resize</IC> mengizinkan user mengubah ukuran elemen secara manual dengan
              drag handle di pojok. Browser otomatis menambahkannya untuk <IC>{"<textarea>"}</IC>,
              tapi bisa diaktifkan untuk elemen block lain juga.
            </P>

            <ResizePlayground />

            <Code file="resize.css">{`
textarea {
  resize: both;       /* default browser untuk textarea */
  resize: vertical;   /* hanya tinggi — lebih umum di form modern */
  resize: horizontal; /* hanya lebar — jarang dipakai */
  resize: none;       /* matikan resize handle sepenuhnya */
  overflow: auto;     /* wajib — resize butuh overflow bukan visible */
}

/* Bisa juga di div biasa, bukan cuma textarea */
.resizable-panel {
  resize: horizontal;
  overflow: auto;
  min-width: 200px;
  max-width: 600px;
}
            `}</Code>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              TABLE BOX MODEL
          ══════════════════════════════════════════════════════════════ */}
          <Section id="table-box" onClick={() => setActiveSection("table-box")}>
            <H2>
              Box Model di Tabel
              <H2.anchor href="#table-box">#</H2.anchor>
            </H2>

            <P>
              Elemen tabel (<IC>table</IC>, <IC>tr</IC>, <IC>td</IC>, <IC>th</IC>) punya
              aturan box model sendiri yang berbeda dari elemen biasa — terutama soal
              bagaimana border antar cell diperlakukan.
            </P>

            <TableBoxPlayground />

            <Code file="table-box-model.css">{`
table {
  border-collapse: collapse; /* border antar cell jadi satu garis (umum dipakai) */
  border-collapse: separate; /* setiap cell border sendiri-sendiri (default browser) */
  border-spacing: 8px;       /* hanya berlaku di border-collapse: separate */
}

/* Tailwind: border-collapse, border-separate, border-spacing-2 */
            `}</Code>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                Hampir selalu, kamu ingin <IC>border-collapse: collapse</IC> untuk tabel data —
                ini yang terlihat "normal" seperti tabel pada umumnya. <IC>border-separate</IC>
                lebih jarang dipakai kecuali kamu sengaja ingin efek visual cell terpisah.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              CONTAIN
          ══════════════════════════════════════════════════════════════ */}
          <Section id="contain" onClick={() => setActiveSection("contain")}>
            <H2>
              contain
              <H2.anchor href="#contain">#</H2.anchor>
            </H2>

            <P>
              CSS Containment memberitahu browser bahwa perubahan di dalam elemen ini
              tidak akan mempengaruhi elemen di luar — sehingga browser bisa skip
              re-layout/re-paint elemen lain saat elemen ini berubah. Berguna untuk
              performa di komponen yang sering update (widget, kartu interaktif, dll).
            </P>

            <ContainPlayground />

            <Code file="contain.css">{`
.widget {
  contain: layout;   /* internal layout tidak mempengaruhi elemen di luar */
  contain: paint;    /* overflow di-clip, jadi containing block untuk paint */
  contain: size;     /* ukuran elemen tidak dipengaruhi oleh konten anaknya */

  /* Shorthand value */
  contain: content;  /* = layout + paint + style (TANPA size) — paling aman */
  contain: strict;   /* = size + layout + paint + style — maksimal isolasi */

  /* Shortcut modern yang sering dipakai bareng contain */
  content-visibility: auto; /* skip rendering elemen yang di luar viewport */
}
            `}</Code>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>contain: size / strict butuh ukuran eksplisit</Callout.title>
                Kalau pakai <IC>contain: size</IC> atau <IC>strict</IC>, elemen perlu
                <IC>width</IC>/<IC>height</IC> eksplisit — karena browser "mengabaikan"
                ukuran dari konten anaknya, elemen bisa collapse jadi 0px kalau tidak diset.
                Untuk penggunaan luas yang lebih aman, <IC>contain: content</IC> lebih
                direkomendasikan karena tidak menyertakan <IC>size</IC>.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              SCROLLBAR GUTTER
          ══════════════════════════════════════════════════════════════ */}
          <Section id="scrollbar-gutter" onClick={() => setActiveSection("scrollbar-gutter")}>
            <H2>
              scrollbar-gutter
              <H2.anchor href="#scrollbar-gutter">#</H2.anchor>
            </H2>

            <P>
              Bug visual klasik: konten "loncat" sedikit ke kiri saat scrollbar muncul
              (karena scrollbar mengambil space dari content area). <IC>scrollbar-gutter</IC>
              memberitahu browser untuk selalu reserve space scrollbar, walau belum muncul.
            </P>

            <ScrollbarGutterPlayground />

            <Code file="scrollbar-gutter.css">{`
/* Reserve space untuk scrollbar walau belum overflow — cegah layout shift */
.scrollable-content {
  scrollbar-gutter: stable;
  overflow-y: auto;
}

/* Reserve di kedua sisi — berguna untuk centered content */
.scrollable-content {
  scrollbar-gutter: stable both-edges;
}
            `}</Code>

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                Ini paling terasa manfaatnya di halaman dengan konten dinamis (misal modal yang
                buka/tutup, atau filter yang mengubah jumlah hasil) — tanpa <IC>scrollbar-gutter</IC>,
                seluruh layout "bergeser" setiap kali scrollbar muncul/hilang.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              VISIBILITY VS DISPLAY VS OPACITY
          ══════════════════════════════════════════════════════════════ */}
          <Section id="visibility" onClick={() => setActiveSection("visibility")}>
            <H2>
              visibility vs display:none vs opacity:0
              <H2.anchor href="#visibility">#</H2.anchor>
            </H2>

            <P>
              Tiga cara "menyembunyikan" elemen — tapi ketiganya berbeda drastis dari
              sisi box model, aksesibilitas, dan interaktivitas.
            </P>

            <VisibilityPlayground />

            <CompareTable>
              {[
                { prop: "display: none", space: "❌ Tidak ada", click: "❌ Tidak", a11y: "❌ Hilang dari a11y tree" },
                { prop: "visibility: hidden", space: "✅ Ada", click: "❌ Tidak", a11y: "❌ Hidden (tapi masih di DOM)" },
                { prop: "opacity: 0", space: "✅ Ada", click: "✅ Ya!", a11y: "⚠️ Masih readable screen reader" },
              ].map(row => (
                <CompareRow key={row.prop}>
                  <IC>{row.prop}</IC>
                  <CompareCell>{row.space}</CompareCell>
                  <CompareCell>{row.click}</CompareCell>
                  <CompareCell span={2}>{row.a11y}</CompareCell>
                </CompareRow>
              ))}
            </CompareTable>

            <Code file="visibility.css">{`
/* display: none — hilang total dari layout dan accessibility tree */
.hidden { display: none; }

/* visibility: hidden — space tetap ada, tidak bisa diklik,
   child bisa override dengan visibility: visible */
.invisible { visibility: hidden; }
.invisible .child-visible { visibility: visible; } /* child bisa "muncul kembali" */

/* opacity: 0 — tak terlihat, space ada, MASIH BISA DIKLIK
   Gunakan pointer-events: none kalau tidak mau bisa diklik */
.transparent {
  opacity: 0;
  pointer-events: none; /* matikan interaksi */
}

/* Tailwind: hidden | invisible | opacity-0 | pointer-events-none */
            `}</Code>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>opacity:0 masih bisa diklik!</Callout.title>
                Bug klasik yang susah di-debug: tombol di-<IC>opacity-0</IC> tapi masih
                merespons klik karena area pointer events masih aktif.
                Kalau mau benar-benar tidak interaktif, tambahkan <IC>pointer-events-none</IC>.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              MARGIN AUTO
          ══════════════════════════════════════════════════════════════ */}
          <Section id="margin-auto" onClick={() => setActiveSection("margin-auto")}>
            <H2>
              margin: auto — cara kerja centering
              <H2.anchor href="#margin-auto">#</H2.anchor>
            </H2>

            <P>
              <IC>margin: auto</IC> membagi sisa ruang yang tersedia secara merata.
              Untuk centering horizontal, <IC>mx-auto</IC> adalah solusi klasik yang
              bekerja di block context. Di flex/grid context, <IC>margin: auto</IC>
              punya superpower tambahan — bisa mendorong elemen ke sisi berlawanan.
            </P>

            <MarginAutoPlayground />

            <Code file="margin-auto.css">{`
/* Centering horizontal klasik — hanya bekerja di block context
   dengan width eksplisit (atau max-width) */
.container {
  width: 800px;      /* atau max-width */
  margin-left: auto;
  margin-right: auto;
  /* shorthand: margin: 0 auto; */
}

/* Di flex context — auto margin "memakan" sisa space */
.navbar {
  display: flex;
  align-items: center;
}
.navbar .logo   { /* normal, di kiri */ }
.navbar .button { margin-left: auto; } /* push ke kanan, ambil semua sisa space */

/* Tailwind: mx-auto | ml-auto | mr-auto | my-auto | m-auto */
            `}</Code>

            <Callout type="php">
              <Callout.icon>🐘</Callout.icon>
              <Callout.content>
                <Callout.title>Analogi PHP</Callout.title>
                <IC>margin: auto</IC> seperti <IC>str_pad($str, $total, ' ', STR_PAD_BOTH)</IC> —
                sisa space dibagi rata ke dua sisi. <IC>ml-auto</IC> lebih seperti
                <IC>str_pad($str, $total, ' ', STR_PAD_LEFT)</IC> — semua sisa ke satu sisi.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              BOX-SHADOW VS DROP-SHADOW
          ══════════════════════════════════════════════════════════════ */}
          <Section id="box-shadow" onClick={() => setActiveSection("box-shadow")}>
            <H2>
              box-shadow vs filter: drop-shadow
              <H2.anchor href="#box-shadow">#</H2.anchor>
            </H2>

            <P>
              Dua cara membuat bayangan di CSS — terlihat mirip tapi berperilaku sangat
              berbeda. <IC>box-shadow</IC> selalu mengikuti bounding box rectangular element.
              <IC>filter: drop-shadow</IC> mengikuti alpha channel aktual — cocok untuk
              PNG transparan, SVG, atau elemen dengan <IC>clip-path</IC>.
            </P>

            <BoxShadowPlayground />

            <Code file="shadows.css">{`
/* box-shadow — selalu rectangular bounding box */
.card {
  box-shadow:
    0 1px 3px rgba(0,0,0,0.1),   /* layer 1 — dekat, lembut */
    0 4px 6px rgba(0,0,0,0.07);  /* layer 2 — jauh, transparan */
}

/* box-shadow inset — shadow di DALAM element */
.input:focus {
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

/* Multiple shadows — dirender kiri ke kanan (pertama = paling atas) */
.button {
  box-shadow:
    0 1px 0 rgba(255,255,255,0.2) inset,  /* highlight atas */
    0 2px 4px rgba(0,0,0,0.2);            /* shadow bawah */
}

/* filter: drop-shadow — mengikuti alpha channel / clip-path */
.icon-png {
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
}

/* Perbedaan penting:
   - box-shadow: bisa multiple, bisa inset, performa lebih baik, selalu rectangular
   - drop-shadow: mengikuti bentuk, tidak bisa inset, tidak bisa multiple filter mudah */

/* Tailwind: shadow-sm/md/lg/xl/2xl, shadow-inner, [filter:drop-shadow(...)] */
            `}</Code>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                <Callout.title>Kapan pakai mana?</Callout.title>
                <strong>box-shadow</strong> untuk card, button, modal — elemen rectangular.
                <strong> filter: drop-shadow</strong> untuk icon PNG, SVG logo, atau element
                dengan <IC>clip-path</IC> di mana shadow harusnya mengikuti bentuk visual,
                bukan bounding box kotak.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              BORDER-RADIUS
          ══════════════════════════════════════════════════════════════ */}
          <Section id="border-radius" onClick={() => setActiveSection("border-radius")}>
            <H2>
              border-radius
              <H2.anchor href="#border-radius">#</H2.anchor>
            </H2>

            <P>
              <IC>border-radius</IC> membulatkan sudut elemen. Bisa diatur per-sudut,
              per-sisi, atau bahkan secara berbeda untuk sumbu horizontal dan vertikal —
              yang memungkinkan bentuk elips, pill, hingga blob organik.
            </P>

            <BorderRadiusPlayground />

            <Code file="border-radius.css">{`
/* Semua sudut sama */
.card { border-radius: 8px; }

/* Shorthand 4 nilai — searah jarum jam: TL, TR, BR, BL */
.card { border-radius: 4px 8px 16px 4px; }

/* Shorthand 2 nilai — TL+BR, TR+BL */
.card { border-radius: 4px 16px; }

/* Individual corners */
.card {
  border-top-left-radius:     12px;
  border-top-right-radius:    12px;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius:  4px;
}

/* Logical properties equivalents */
.card {
  border-start-start-radius: 12px; /* TL di LTR, TR di RTL */
  border-start-end-radius:   12px;
  border-end-start-radius:   4px;
  border-end-end-radius:     4px;
}

/* Elips — nilai berbeda per sumbu X dan Y (dipisah /) */
.blob { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
/* Format: TL-x TR-x BR-x BL-x / TL-y TR-y BR-y BL-y */

/* Tailwind: rounded-{none|sm|md|lg|xl|2xl|3xl|full} */
/* Per-sisi: rounded-t-lg (top), rounded-b-lg (bottom), rounded-l, rounded-r */
/* Per-sudut: rounded-tl-lg, rounded-tr-lg, rounded-bl-lg, rounded-br-lg */
            `}</Code>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                <IC>rounded-full</IC> menghasilkan lingkaran hanya kalau <IC>width === height</IC>.
                Untuk elemen dengan rasio berbeda, hasilnya adalah pill/capsule.
                Untuk lingkaran yang guarantee bundar, pakai <IC>aspect-square rounded-full</IC>.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              BORDER-STYLE
          ══════════════════════════════════════════════════════════════ */}
          <Section id="border-style" onClick={() => setActiveSection("border-style")}>
            <H2>
              border-style — semua 10 nilai
              <H2.anchor href="#border-style">#</H2.anchor>
            </H2>

            <P>
              CSS mendefinisikan 10 nilai <IC>border-style</IC>. Di production kebanyakan
              hanya pakai <IC>solid</IC> dan <IC>dashed</IC>, tapi nilai 3D seperti
              <IC>groove</IC>, <IC>ridge</IC>, <IC>inset</IC>, <IC>outset</IC> masih valid
              dan kadang berguna untuk efek visual tanpa perlu box-shadow tambahan.
            </P>

            <BorderStylePlayground />

            <Code file="border-style.css">{`
/* Shorthand — width style color sekaligus */
.box { border: 2px solid #6366f1; }

/* Individual sides */
.box {
  border-top:    2px dashed blue;
  border-right:  4px double green;
  border-bottom: 2px solid red;
  border-left:   0; /* none */
}

/* border-style saja (tanpa shorthand) */
.box {
  border-width: 4px;
  border-color: #6366f1;
  border-style: groove; /* atau ridge, inset, outset, dashed, dotted, double */
}

/* Per-sisi style */
.box { border-style: solid dashed; } /* top/bottom solid, left/right dashed */
.box { border-style: solid dashed dotted double; } /* TL, TR, BR, BL */

/* double butuh minimum 3px untuk terlihat dua garisnya */
.double { border: 6px double #6366f1; }

/* hidden vs none — sama secara visual, beda di tabel border-collapse:
   hidden "menang" atas border lain yang berbenturan */
.table-cell { border-style: hidden; }
            `}</Code>

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                <Callout.title>groove, ridge, inset, outset</Callout.title>
                Keempat nilai ini menghasilkan efek 3D berdasarkan <IC>border-color</IC> —
                browser menghitung warna terang dan gelap secara otomatis.
                Hasilnya sangat bergantung pada warna yang dipilih; warna abu-abu
                biasanya menghasilkan efek paling natural.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              CLAMP()
          ══════════════════════════════════════════════════════════════ */}
          <Section id="clamp" onClick={() => setActiveSection("clamp")}>
            <H2>
              clamp() — fluid sizing dalam satu fungsi
              <H2.anchor href="#clamp">#</H2.anchor>
            </H2>

            <P>
              <IC>clamp(MIN, PREFERRED, MAX)</IC> menggantikan kombinasi verbose
              <IC>min-width</IC> + <IC>width</IC> + <IC>max-width</IC> dengan satu
              fungsi. Nilai preferred biasanya relatif (<IC>%</IC>, <IC>vw</IC>, <IC>vmin</IC>)
              sehingga elemen berubah ukuran secara fluid antara batas MIN dan MAX.
            </P>

            <ClampPlayground />

            <Code file="clamp.css">{`
/* clamp(MIN, PREFERRED, MAX) */

/* Fluid width — tidak pernah di bawah 8rem atau di atas 24rem */
.container {
  width: clamp(8rem, 50%, 24rem);
  /* Setara dengan: min-width: 8rem; width: 50%; max-width: 24rem; */
}

/* Fluid font-size — tidak perlu @media queries! */
h1 {
  font-size: clamp(1.5rem, 4vw, 3rem);
  /* Di layar 400px: 4vw = 16px → pakai min 1.5rem = 24px */
  /* Di layar 768px: 4vw = 30.7px → pakai 30.7px */
  /* Di layar 1400px: 4vw = 56px → pakai max 3rem = 48px */
}

/* Fluid spacing */
.section {
  padding: clamp(1rem, 5vw, 4rem);
}

/* min() dan max() — fungsi terkait */
.box {
  width: min(100%, 800px);  /* ambil nilai TERKECIL */
  width: max(300px, 50%);   /* ambil nilai TERBESAR */
}

/* Tailwind: pakai arbitrary values */
/* w-[clamp(8rem,50%,24rem)] */
/* text-[clamp(1rem,4vw,2rem)] */
/* p-[clamp(1rem,5vw,4rem)] */
            `}</Code>

            <Callout type="php">
              <Callout.icon>🐘</Callout.icon>
              <Callout.content>
                <Callout.title>Analogi PHP</Callout.title>
                <IC>clamp(min, preferred, max)</IC> persis seperti
                <IC>max($min, min($preferred, $max))</IC> di PHP —
                atau lebih mudah: <IC>min(max($min, $preferred), $max)</IC>.
                Ini memang implementasi internalnya di CSS.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              11 PAKAI DI TW
          ══════════════════════════════════════════════════════════════ */}
          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>
              Box Model di tailwind-styled-v4
              <H2.anchor href="#tw-usage">#</H2.anchor>
            </H2>


            <P>
              Semua konsep Box Model di atas langsung bisa dipakai di <IC>tw</IC> API
              menggunakan Tailwind utility classes. Rust scanner baca semua class di
              <IC>base</IC>, <IC>variants</IC>, dan <IC>sub</IC> — compile semuanya
              via Tailwind + LightningCSS di build time.
            </P>

            <Code file="components.tsx">{`
import { tw } from "tailwind-styled-v4"

// Card dengan box model lengkap
const Card = tw.article({
  base: \`
    bg-white
    rounded-xl        /* border-radius */
    border border-gray-200  /* border */
    p-6               /* padding dalam */
    shadow-sm         /* box-shadow — di luar border, tidak ambil space */
    overflow-hidden   /* clip konten yang melebihi */
  \`,
  sub: {
    header: "px-0 pt-0 pb-4 border-b border-gray-100",
    body:   "py-4",
    footer: "pt-4 pb-0 border-t border-gray-100",
  },
})

// Variants untuk spacing
const Section = tw.section({
  base: "max-w-4xl mx-auto",
  variants: {
    padding: {
      none: "p-0",
      sm:   "p-4",
      md:   "p-6",
      lg:   "p-8 sm:p-12",
      xl:   "p-12 sm:p-20",
    },
    gap: {
      sm: "space-y-4",
      md: "space-y-8",
      lg: "space-y-12",
    },
  },
  defaultVariants: { padding: "md", gap: "md" },
})

// Inline block — badge
const Badge = tw.span({
  base: \`
    inline-flex items-center  /* inline-block dengan flex */
    px-2.5 py-0.5             /* padding */
    rounded-full              /* border-radius */
    text-xs font-medium
  \`,
  variants: {
    color: {
      blue:  "bg-blue-100 text-blue-700",
      green: "bg-green-100 text-green-700",
      red:   "bg-red-100 text-red-700",
    },
  },
  defaultVariants: { color: "blue" },
})

// Overflow usage
const ScrollArea = tw.div({
  base: "overflow-y-auto overflow-x-hidden",
  variants: {
    height: {
      sm:   "max-h-48",
      md:   "max-h-64",
      lg:   "max-h-96",
      full: "h-full",
    },
  },
  defaultVariants: { height: "md" },
})
            `}</Code>
          </Section>

          <Divider />

          {/* ══════════════════════════════════════════════════════════════
              12 EXERCISE
          ══════════════════════════════════════════════════════════════ */}
          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>
              Latihan
              <H2.anchor href="#exercise">#</H2.anchor>
            </H2>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 1 — Card dengan Box Model lengkap</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat komponen Card dengan <IC>tw.article</IC> yang punya:</p>
                <p>1. Padding 24px di semua sisi</p>
                <p>2. Border 1px solid abu-abu dengan border-radius 12px</p>
                <p>3. Box-shadow kecil</p>
                <p>4. <IC>overflow: hidden</IC> agar image child tidak keluar border-radius</p>
                <p>5. Sub-component: header, body, footer masing-masing dengan padding yang berbeda</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 2 — Responsive container</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat layout container dengan <IC>tw.div</IC> yang:</p>
                <p>1. Full lebar di mobile, max-width 1200px di desktop</p>
                <p>2. Padding horizontal 16px di mobile, 32px di tablet, 48px di desktop</p>
                <p>3. Auto center dengan <IC>mx-auto</IC></p>
                <p>4. Gunakan <IC>variants</IC> untuk size: sm/md/lg/xl/full</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 3 — Debug margin collapse</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat dua buah <IC>tw.div</IC> block dengan margin-bottom dan margin-top masing-masing 32px.</p>
                <p>Inspect di DevTools dan perhatikan gap-nya hanya 32px, bukan 64px.</p>
                <p>Kemudian fix dengan tiga cara berbeda:</p>
                <p>1. Wrap dengan flex container</p>
                <p>2. Ganti margin dengan gap</p>
                <p>3. Tambahkan border 1px pada wrapper</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 4 — Video card dengan aspect-ratio dan calc()</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat komponen <IC>VideoCard</IC> dengan <IC>tw.div</IC> yang punya:</p>
                <p>1. Thumbnail dengan <IC>aspect-video</IC> (16:9)</p>
                <p>2. Layout sidebar 240px + konten <IC>calc(100% - 240px)</IC> untuk halaman watch</p>
                <p>3. Title yang truncate dengan <IC>min-w-0</IC> kalau diletakkan di flex row bersama durasi video</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 5 — Komponen siap RTL</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Ambil komponen Card dari Latihan 1, ganti semua physical properties (<IC>pl-</IC>, <IC>pr-</IC>, <IC>ml-</IC>, <IC>mr-</IC>) jadi logical properties (<IC>ps-</IC>, <IC>pe-</IC>, <IC>ms-</IC>, <IC>me-</IC>).</p>
                <p>Test dengan menambahkan <IC>dir="rtl"</IC> di parent dan pastikan layout tetap benar tanpa ubah CSS apapun.</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 6 — Tabel data dengan border-collapse</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat komponen <IC>DataTable</IC> dengan <IC>tw.table</IC> menggunakan <IC>border-collapse</IC>, header sticky, dan zebra striping pada baris (warna selang-seling).</p>
                <p>Bandingkan visual dengan <IC>border-separate</IC> + <IC>border-spacing</IC> untuk lihat perbedaannya.</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 7 — Widget performant dengan contain</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat komponen <IC>StatCard</IC> dengan <IC>tw.div</IC> yang menampilkan angka yang berubah-ubah (simulasikan dengan <IC>setInterval</IC>).</p>
                <p>Tambahkan <IC>contain: layout</IC> di variants dan jelaskan kenapa ini membantu performa kalau ada banyak <IC>StatCard</IC> di satu halaman.</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          {/* Prev/Next */}
          <PageNav>
            <NavBtn href="/learn/dasar-css" dir="prev">
              <NavBtn.hint>← Back</NavBtn.hint>
              <NavBtn.label>Dasar CSS</NavBtn.label>
            </NavBtn>
            <NavBtn href="/learn/dasar-css/normal-flow" dir="next">
              <NavBtn.hint>Next →</NavBtn.hint>
              <NavBtn.label>Normal Flow</NavBtn.label>
            </NavBtn>
          </PageNav>

        </Content>

        {/* TOC */}
        <Toc>
          <TocLabel>On this page</TocLabel>
          {TOC.map(item => (
            <TocItem
              key={item.id}
              href={`#${item.id}`}
              depth={item.depth}
              active={activeSection === item.id}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </TocItem>
          ))}
          <TocFooter>
            <TocGithubLink
              href="https://github.com/Dictionar32/tailwind-styled-v4"
              target="_blank"
            >
              Edit on GitHub ↗
            </TocGithubLink>
          </TocFooter>
        </Toc>

      </Body>
    </Page>
  )
}