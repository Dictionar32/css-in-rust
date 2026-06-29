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
})

const TopBar = tw.nav({
  base: `
    sticky top-0 z-50 h-12
    border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]
    bg-[color-mix(in_srgb,var(--surface)_85%,transparent)]
    backdrop-blur-md
  `,
})

const TopBarInner = tw.div({
  base: "max-w-5xl mx-auto px-4 h-full flex items-center gap-2 text-sm",
})

const Breadcrumb = tw.div({
  base: "flex items-center gap-1.5 text-xs text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]",
  sub: {
    "a:link":    "hover:text-[var(--foreground)] transition-colors",
    "span:sep":  "opacity-40",
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
      true:  "text-[var(--accent)] font-semibold",
      false: "text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] hover:text-[var(--foreground)]",
    },
    depth: {
      "2": "pl-0",
      "3": "pl-3",
    },
  },
  defaultVariants: { active: "false", depth: "2" },
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
      note:    "bg-blue-50 border-blue-200 text-blue-900",
      tip:     "bg-emerald-50 border-emerald-200 text-emerald-900",
      warning: "bg-amber-50 border-amber-200 text-amber-900",
      php:     "bg-violet-50 border-violet-200 text-violet-900",
      danger:  "bg-red-50 border-red-200 text-red-900",
    },
  },
  defaultVariants: { type: "note" },
  sub: {
    "span:icon":    "text-base shrink-0 mt-0.5",
    "div:content":  "flex-1",
    "strong:title": "block font-semibold mb-0.5",
  },
})

// Code block
const CodeWrap = tw.div({
  base: "rounded-xl overflow-hidden border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] my-5",
  sub: {
    header:     "flex items-center justify-between px-4 py-2.5 bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]",
    filename:   "text-[11px] font-mono text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]",
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
    title:  "text-xs font-semibold",
    body:   "p-4 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)] leading-relaxed space-y-1",
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
    "span:hint":  "text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] uppercase tracking-wider",
    "span:label": "font-semibold",
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Playground primitives
// ─────────────────────────────────────────────────────────────────────────────

const PlaygroundWrap = tw.div({
  base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5",
  sub: {
    controls:  "p-4 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] space-y-3",
    "p:label": "text-[10px] font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--foreground)_35%,transparent)]",
    canvas:    "p-6 bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] flex items-center justify-center min-h-52",
    codeline:  "px-4 py-3 border-t border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] bg-[var(--surface)] font-mono text-[11px] text-[var(--accent)]",
  },
})

const SliderRow = tw.div({
  base: "space-y-1",
  sub: {
    header:      "flex justify-between items-center text-xs",
    "span:lbl":  "font-semibold",
    "span:val":  "font-mono text-[color-mix(in_srgb,var(--foreground)_50%,transparent)]",
  },
})

const Chip = tw.button({
  base: "px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border transition-all",
  variants: {
    active: {
      true:  "bg-[var(--accent)] text-white border-[var(--accent)]",
      false: "border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
    },
  },
  defaultVariants: { active: "false" },
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
      "0": "p-0", "1": "p-1", "2": "p-2", "3": "p-3", "4": "p-4",
      "5": "p-5", "6": "p-6", "8": "p-8", "10": "p-10", "12": "p-12",
    },
  },
  defaultVariants: { size: "6" },
  sub: {
    "span:label": "absolute top-1 left-2 text-[9px] font-bold text-blue-400 uppercase tracking-wider select-none",
  },
})

// Border layer
const BoxBorderLayer = tw.div({
  base: "bg-orange-100 rounded-lg flex items-center justify-center border-orange-400 border-solid transition-all duration-200",
  variants: {
    size: {
      "0": "border-0", "1": "border", "2": "border-2", "4": "border-4", "8": "border-8",
    },
  },
  defaultVariants: { size: "4" },
})

// Padding layer
const BoxPaddingLayer = tw.div({
  base: "bg-green-50 rounded flex items-center justify-center relative transition-all duration-200",
  variants: {
    size: {
      "0": "p-0", "1": "p-1", "2": "p-2", "3": "p-3", "4": "p-4",
      "5": "p-5", "6": "p-6", "8": "p-8", "10": "p-10", "12": "p-12",
    },
  },
  defaultVariants: { size: "4" },
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
      md:   "p-4  w-40 h-16",
      lg:   "p-8  w-40 h-16",
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
      md:   "p-4  h-16",
      lg:   "p-8  h-16",
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
      "2":  "my-2",
      "4":  "my-4",
      "8":  "my-8",
      "12": "my-12",
    },
  },
  defaultVariants: { margin: "8" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Overflow playground
// ─────────────────────────────────────────────────────────────────────────────

const OverflowBox = tw.div({
  base: "w-48 h-24 bg-blue-50 border-2 border-blue-300 rounded-lg text-xs font-mono text-blue-800 transition-all duration-200",
  variants: {
    overflow: {
      visible: "overflow-visible",
      hidden:  "overflow-hidden",
      scroll:  "overflow-scroll",
      auto:    "overflow-auto",
      clip:    "overflow-clip",
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
      width:     "w-48",
      minWidth:  "min-w-48 w-0",
      maxWidth:  "max-w-48 w-full",
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
      none:         "bg-gray-100",
      border:       "bg-blue-50 border-4 border-blue-500",
      outline:      "bg-blue-50 outline outline-4 outline-blue-500",
      "border+m":   "bg-blue-50 border-4 border-blue-500 m-2",
      "outline+m":  "bg-blue-50 outline outline-4 outline-blue-500 m-2",
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
      "0":   "",
      "-2":  "-mt-2",
      "-4":  "-mt-4",
      "-8":  "-mt-8",
      "-12": "-mt-12",
    },
  },
  defaultVariants: { neg: "0" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Spacing scale lookup
// ─────────────────────────────────────────────────────────────────────────────

const SPACING_PX: Record<string, string> = {
  "0": "0px", "1": "4px", "2": "8px", "3": "12px", "4": "16px",
  "5": "20px", "6": "24px", "8": "32px", "10": "40px", "12": "48px",
}
const BORDER_PX: Record<string, string> = {
  "0": "0px", "1": "1px", "2": "2px", "4": "4px", "8": "8px",
}
const MARGIN_STEPS  = ["0","1","2","3","4","5","6","8","10","12"] as const
const PADDING_STEPS = ["0","1","2","3","4","5","6","8","10","12"] as const
const BORDER_STEPS  = ["0","1","2","4","8"] as const

type MarginSize  = typeof MARGIN_STEPS[number]
type PaddingSize = typeof PADDING_STEPS[number]
type BorderSize  = typeof BORDER_STEPS[number]

// ─────────────────────────────────────────────────────────────────────────────
// TOC data
// ─────────────────────────────────────────────────────────────────────────────

const TOC = [
  { id: "anatomy",        label: "Anatomi Box Model",     depth: "2" as const },
  { id: "playground",     label: "Interactive Playground", depth: "2" as const },
  { id: "box-sizing",     label: "box-sizing",             depth: "2" as const },
  { id: "outline",        label: "outline vs border",      depth: "2" as const },
  { id: "margin-collapse",label: "Margin Collapse",        depth: "2" as const },
  { id: "negative-margin",label: "Negative Margin",        depth: "2" as const },
  { id: "overflow",       label: "overflow",               depth: "2" as const },
  { id: "width-variants", label: "width / min / max",      depth: "2" as const },
  { id: "height",         label: "height: 100%",           depth: "2" as const },
  { id: "inline-box",     label: "Inline & Box Model",     depth: "2" as const },
  { id: "tw-usage",       label: "Pakai di tw",            depth: "2" as const },
  { id: "exercise",       label: "Latihan",                depth: "2" as const },
]

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
  const [margin,  setMargin]  = useState<MarginSize>("6")
  const [padding, setPadding] = useState<PaddingSize>("4")
  const [border,  setBorder]  = useState<BorderSize>("4")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Geser slider — lihat box model berubah</PlaygroundWrap.label>

        <SliderRow>
          <SliderRow.header>
            <SliderRow.lbl className="text-blue-600">margin</SliderRow.lbl>
            <SliderRow.val>{SPACING_PX[margin]}</SliderRow.val>
          </SliderRow.header>
          <input type="range" min={0} max={MARGIN_STEPS.length - 1}
            value={MARGIN_STEPS.indexOf(margin)}
            onChange={e => setMargin(MARGIN_STEPS[+e.target.value])}
            className="w-full accent-[var(--accent)]" />
        </SliderRow>

        <SliderRow>
          <SliderRow.header>
            <SliderRow.lbl className="text-green-600">padding</SliderRow.lbl>
            <SliderRow.val>{SPACING_PX[padding]}</SliderRow.val>
          </SliderRow.header>
          <input type="range" min={0} max={PADDING_STEPS.length - 1}
            value={PADDING_STEPS.indexOf(padding)}
            onChange={e => setPadding(PADDING_STEPS[+e.target.value])}
            className="w-full accent-[var(--accent)]" />
        </SliderRow>

        <SliderRow>
          <SliderRow.header>
            <SliderRow.lbl className="text-orange-600">border</SliderRow.lbl>
            <SliderRow.val>{BORDER_PX[border]}</SliderRow.val>
          </SliderRow.header>
          <input type="range" min={0} max={BORDER_STEPS.length - 1}
            value={BORDER_STEPS.indexOf(border)}
            onChange={e => setBorder(BORDER_STEPS[+e.target.value])}
            className="w-full accent-[var(--accent)]" />
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
        <div className="space-y-1.5">
          <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] font-semibold uppercase tracking-wider">padding</p>
          <ChipRow>
            {(["none","md","lg"] as PaddingLevel[]).map(v => (
              <Chip key={v} active={padding === v ? "true" : "false"} onClick={() => setPadding(v)}>
                {PADDING_LEVEL_MAP[v]}
              </Chip>
            ))}
          </ChipRow>
        </div>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas className="gap-12 flex-wrap">
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">content-box</p>
          <ContentBoxEl padding={padding}>
            <span>content-box</span>
            <span className="text-[10px] opacity-60">
              width expands → {padding === "none" ? "160px" : padding === "md" ? "192px" : "224px"}
            </span>
          </ContentBoxEl>
          <p className="text-[10px] text-gray-400 font-mono">
            w-40 + p-{padding === "none" ? "0" : padding === "md" ? "4" : "8"} = {padding === "none" ? "160" : padding === "md" ? "192" : "224"}px
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">border-box</p>
          <BorderBoxEl padding={padding}>
            <span>border-box</span>
            <span className="text-[10px] opacity-60">width stays → 160px</span>
          </BorderBoxEl>
          <p className="text-[10px] text-gray-400 font-mono">
            w-40 tetap 160px ✓
          </p>
        </div>
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
    "border":    "border — part of box model, takes up space, pushes content",
    "outline":   "outline — outside box model, takes NO space, doesn't affect layout",
    "border+m":  "border dengan margin — total space: border + margin",
    "outline+m": "outline dengan margin — margin normal, outline tidak tambah space",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 outline vs border</PlaygroundWrap.label>
        <ChipRow>
          {(["border","outline","border+m","outline+m"] as OutlineBorderType[]).map(v => (
            <Chip key={v} active={type === v ? "true" : "false"} onClick={() => setType(v)}>{v}</Chip>
          ))}
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          {descriptions[type]}
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas className="gap-4 flex-wrap">
        <div className="bg-amber-50 border border-dashed border-amber-300 rounded p-4 flex gap-4 items-center">
          <OutlineBorderBox type={type}>
            <span className="text-gray-600">{type}</span>
          </OutlineBorderBox>
          <OutlineBorderBox type={type}>
            <span className="text-gray-600">sibling</span>
          </OutlineBorderBox>
        </div>
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

type CollapseMargin = "2" | "4" | "8" | "12"

function MarginCollapsePlayground() {
  const [margin, setMargin] = useState<CollapseMargin>("8")
  const [showCollapse, setShowCollapse] = useState(true)

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Margin Collapse — vertical margin "merge"</PlaygroundWrap.label>
        <div className="flex items-center gap-4">
          <div className="space-y-1.5">
            <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] font-semibold uppercase tracking-wider">margin-top/bottom</p>
            <ChipRow>
              {(["2","4","8","12"] as CollapseMargin[]).map(v => (
                <Chip key={v} active={margin === v ? "true" : "false"} onClick={() => setMargin(v)}>
                  {SPACING_PX[v]}
                </Chip>
              ))}
            </ChipRow>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] font-semibold uppercase tracking-wider">mode</p>
            <ChipRow>
              <Chip active={showCollapse ? "true" : "false"} onClick={() => setShowCollapse(true)}>collapse (block)</Chip>
              <Chip active={!showCollapse ? "true" : "false"} onClick={() => setShowCollapse(false)}>no collapse (flex)</Chip>
            </ChipRow>
          </div>
        </div>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas className="flex-col gap-0">
        <CollapseBox>
          {showCollapse ? (
            /* Block context — margin collapse terjadi */
            <div>
              <CollapseBlock margin={margin}>Block A (margin: {SPACING_PX[margin]})</CollapseBlock>
              <CollapseBlock margin={margin}>Block B (margin: {SPACING_PX[margin]})</CollapseBlock>
              <p className="text-[10px] text-center text-amber-600 mt-2 font-semibold">
                ⚠️ Gap antara A dan B = {SPACING_PX[margin]} (bukan {parseInt(SPACING_PX[margin]) * 2}px) — collapsed!
              </p>
            </div>
          ) : (
            /* Flex context — margin collapse TIDAK terjadi */
            <div className="flex flex-col">
              <CollapseBlock margin={margin}>Block A (margin: {SPACING_PX[margin]})</CollapseBlock>
              <CollapseBlock margin={margin}>Block B (margin: {SPACING_PX[margin]})</CollapseBlock>
              <p className="text-[10px] text-center text-emerald-600 mt-2 font-semibold">
                ✅ Gap antara A dan B = {parseInt(SPACING_PX[margin]) * 2}px — tidak collapse di flex!
              </p>
            </div>
          )}
        </CollapseBox>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {showCollapse
          ? `/* Block context: margin-bottom A + margin-top B = collapse → hanya ${SPACING_PX[margin]} */`
          : `/* Flex context: margin tidak collapse → ${parseInt(SPACING_PX[margin]) * 2}px total */`
        }
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
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
    hidden:  "Konten yang melebihi box dipotong. Tidak ada scrollbar.",
    scroll:  "Selalu tampilkan scrollbar, meski konten tidak overflow.",
    auto:    "Scrollbar hanya muncul kalau konten benar-benar overflow.",
    clip:    "Dipotong seperti hidden, tapi tidak bisa di-scroll secara programmatic.",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 overflow — apa yang terjadi kalau konten melebihi box</PlaygroundWrap.label>
        <ChipRow>
          {(["visible","hidden","scroll","auto","clip"] as OverflowValue[]).map(v => (
            <Chip key={v} active={overflow === v ? "true" : "false"} onClick={() => setOverflow(v)}>{v}</Chip>
          ))}
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          {descriptions[overflow]}
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <OverflowBox overflow={overflow}>
          <div className="p-3">
            Ini konten yang sangat panjang dan akan melebihi batas box yang sudah ditentukan. Lihat apa yang terjadi!
          </div>
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
    width:      "width: 192px — lebar eksplisit, tidak peduli konten",
    minWidth:   "min-width: 192px — minimal selebar ini, bisa lebih lebar",
    maxWidth:   "max-width: 192px — maksimal selebar ini, bisa lebih sempit",
    minContent: "width: min-content — sesempit mungkin, cukup untuk kata terpanjang",
    maxContent: "width: max-content — selebar konten penuh, tidak wrap",
    fitContent: "width: fit-content — seperti max-content tapi tidak melebihi parent",
  }

  const textOptions: Record<WidthType, string> = {
    width:      "Fixed width",
    minWidth:   "Min width — expands if content is wider",
    maxWidth:   "Max width — shrinks if content is narrower",
    minContent: "Min",
    maxContent: "Max content — full width no wrap",
    fitContent: "Fit content",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 width / min-width / max-width / intrinsic sizing</PlaygroundWrap.label>
        <ChipRow>
          {(["width","minWidth","maxWidth","minContent","maxContent","fitContent"] as WidthType[]).map(v => (
            <Chip key={v} active={type === v ? "true" : "false"} onClick={() => setType(v)}>
              {v === "width" ? "width" : v === "minWidth" ? "min-w" : v === "maxWidth" ? "max-w" : v === "minContent" ? "min-content" : v === "maxContent" ? "max-content" : "fit-content"}
            </Chip>
          ))}
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          {descriptions[type]}
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <div className="w-full bg-gray-100 rounded-lg p-3 relative">
          <p className="text-[9px] text-gray-400 mb-2 uppercase tracking-wider font-bold">parent container (full width)</p>
          <WidthBox type={type}>
            {textOptions[type]}
          </WidthBox>
        </div>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {type === "width"      ? "width: 192px;"
        : type === "minWidth"  ? "min-width: 192px; width: 0;"
        : type === "maxWidth"  ? "max-width: 192px; width: 100%;"
        : type === "minContent"? "width: min-content;"
        : type === "maxContent"? "width: max-content;"
        :                        "width: fit-content;"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: negative margin
// ─────────────────────────────────────────────────────────────────────────────

type NegMarginVal = "0" | "-2" | "-4" | "-8" | "-12"

function NegativeMarginPlayground() {
  const [neg, setNeg] = useState<NegMarginVal>("0")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Negative margin — tarik elemen ke arah sebaliknya</PlaygroundWrap.label>
        <ChipRow>
          {(["0","-2","-4","-8","-12"] as NegMarginVal[]).map(v => (
            <Chip key={v} active={neg === v ? "true" : "false"} onClick={() => setNeg(v)}>
              margin-top: {v === "0" ? "0" : v + " (" + Math.abs(parseInt(v)) * 4 + "px)"}
            </Chip>
          ))}
        </ChipRow>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas className="flex-col gap-0 items-center">
        <div className="bg-blue-100 border-2 border-blue-300 rounded px-6 py-4 text-xs font-mono text-blue-800 text-center w-48">
          Element A
        </div>
        <NegMarginBox neg={neg}>
          Element B {neg !== "0" && `(mt: ${neg})`}
        </NegMarginBox>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {neg === "0"
          ? ".b { margin-top: 0; } /* normal */"
          : `.b { margin-top: ${parseInt(neg) * 4}px; } /* negative — tarik ke atas */`
        }
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function BoxModelPage() {
  const [activeSection, setActiveSection] = useState("anatomy")

  return (
    <Page>
      <TopBar>
        <TopBarInner>
          <Breadcrumb>
            <Breadcrumb.link href="/docs">Docs</Breadcrumb.link>
            <Breadcrumb.sep>/</Breadcrumb.sep>
            <Breadcrumb.link href="/docs/learn">Learn</Breadcrumb.link>
            <Breadcrumb.sep>/</Breadcrumb.sep>
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

            <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)] overflow-hidden my-5">
              {[
                { layer: "content",  color: "bg-white border-gray-300",        label: "Content",  desc: "Isi sebenarnya — teks, gambar, child elements. Dikontrol lewat width dan height." },
                { layer: "padding",  color: "bg-green-50 border-green-300",    label: "Padding",  desc: "Jarak antara content dan border. Masih kena background color. Tidak transparan." },
                { layer: "border",   color: "bg-orange-50 border-orange-300",  label: "Border",   desc: "Garis tepi elemen. Punya width, style (solid, dashed, dotted), dan color." },
                { layer: "margin",   color: "bg-blue-50 border-blue-300",      label: "Margin",   desc: "Jarak ke elemen lain di luar. Selalu transparan — tidak kena background." },
              ].map(({ layer, color, label, desc }) => (
                <div key={layer} className={`flex items-start gap-4 p-4 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0 ${color} border-l-4`}>
                  <IC>{label.toLowerCase()}</IC>
                  <p className="text-sm text-[color-mix(in_srgb,var(--foreground)_75%,transparent)] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
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
          </Section>

          {/* Prev/Next */}
          <PageNav>
            <NavBtn href="/docs/learn" dir="prev">
              <NavBtn.hint>← Previous</NavBtn.hint>
              <NavBtn.label>CSS Layout Overview</NavBtn.label>
            </NavBtn>
            <NavBtn href="/docs/learn/normal-flow" dir="next">
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
              active={activeSection === item.id ? "true" : "false"}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </TocItem>
          ))}
          <div className="mt-6 pt-4 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
            <a
              href="https://github.com/Dictionar32/tailwind-styled-v4"
              target="_blank"
              className="text-xs text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
            >
              Edit on GitHub ↗
            </a>
          </div>
        </Toc>

      </Body>
    </Page>
  )
}
