/**
 * CSS Layout — Normal Flow (Complete)
 * tailwind-styled-v4
 *
 * Drop ke: examples/next-js-app/src/app/docs/learn/normal-flow/page.tsx
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
// TOC
// ─────────────────────────────────────────────────────────────────────────────

const Toc = tw.aside({
  base: "hidden xl:block w-52 shrink-0 sticky top-16 h-fit space-y-1",
})

const TocLabel = tw.p({
  base: "text-[10px] font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--foreground)_35%,transparent)] mb-3",
})

const TocItem = tw.a({
  base: "block text-xs py-1 leading-snug transition-colors",
  variants: {
    active: {
      true: "text-[var(--accent)] font-semibold",
      false: "text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] hover:text-[var(--foreground)]",
    },
  },
  defaultVariants: { active: false },
})

// ─────────────────────────────────────────────────────────────────────────────
// Content shell
// ─────────────────────────────────────────────────────────────────────────────

const Content = tw.main({ base: "flex-1 min-w-0" })

const PageTitle = tw.h1({ base: "text-3xl font-bold tracking-tight mb-2" })

const PageDesc = tw.p({
  base: "text-base text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] mb-10 leading-relaxed",
})

const Divider = tw.hr({
  base: "border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] my-10",
})

const Section = tw.section({ base: "scroll-mt-20 mb-10" })

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
    },
  },
  defaultVariants: { type: "note" },
  sub: {
    "span:icon": "text-base shrink-0 mt-0.5",
    "div:content": "flex-1",
    "strong:title": "block font-semibold mb-0.5",
  },
})

// Code
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
  states: { copied: "bg-emerald-500 text-white border-emerald-500" },
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

// Prev/Next
const PageNav = tw.div({
  base: "flex items-center justify-between mt-16 pt-6 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]",
})

const NavBtn = tw.a({
  base: "flex flex-col gap-0.5 px-4 py-3 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)] hover:border-[var(--accent)] transition-all text-sm",
  variants: { dir: { prev: "items-start", next: "items-end" } },
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
    canvas: "p-6 bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]",
    codeline: "px-4 py-3 border-t border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] bg-[var(--surface)] font-mono text-[11px] text-[var(--accent)]",
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

const ChipRow = tw.div({ base: "flex flex-wrap gap-1.5" })

// ─────────────────────────────────────────────────────────────────────────────
// display playground — variants per nilai display
// ─────────────────────────────────────────────────────────────────────────────

const DisplayBox = tw.div({
  base: "bg-blue-100 border-2 border-blue-400 rounded text-blue-800 text-xs font-mono px-3 py-2 transition-all duration-200",
  variants: {
    type: {
      block: "block w-full",
      inline: "inline",
      "inline-block": "inline-block w-32",
      "none": "hidden",
    },
  },
  defaultVariants: { type: "block" },
})

// ─────────────────────────────────────────────────────────────────────────────
// position playground
// ─────────────────────────────────────────────────────────────────────────────

const PositionParent = tw.div({
  base: "relative bg-white border border-gray-200 rounded-lg p-4 min-h-28",
})

const PositionGhost = tw.div({
  base: "h-10 w-28 rounded border-2 border-dashed transition-opacity duration-200",
  variants: {
    show: {
      true: "opacity-100 border-gray-300 bg-gray-50",
      false: "opacity-0",
    },
  },
  defaultVariants: { show: false },
})

const PositionBox = tw.div({
  base: "h-10 w-28 rounded border-2 bg-rose-100 border-rose-400 text-rose-800 flex items-center justify-center text-[11px] font-mono transition-all duration-200",
  variants: {
    mode: {
      static: "static",
      relative: "relative top-2 left-2",
      absolute: "absolute top-3 right-3",
    },
  },
  defaultVariants: { mode: "static" },
})

// ─────────────────────────────────────────────────────────────────────────────
// vertical-align playground
// ─────────────────────────────────────────────────────────────────────────────

const VAlignBox = tw.span({
  base: "inline-block bg-violet-100 border-2 border-violet-400 rounded text-violet-800 text-[11px] font-mono px-2",
  variants: {
    valign: {
      baseline: "align-baseline h-12",
      top: "align-top h-12",
      middle: "align-middle h-12",
      bottom: "align-bottom h-12",
      "text-top": "align-text-top h-12",
      "text-bottom": "align-text-bottom h-12",
    },
  },
  defaultVariants: { valign: "baseline" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Float playground (legacy, but still relevant)
// ─────────────────────────────────────────────────────────────────────────────

const FloatBox = tw.div({
  base: "w-20 h-20 bg-amber-200 border-2 border-amber-500 rounded flex items-center justify-center text-[10px] font-mono text-amber-800",
  variants: {
    float: {
      none: "",
      left: "float-left mr-3 mb-2",
      right: "float-right ml-3 mb-2",
    },
  },
  defaultVariants: { float: "none" },
})

const ClearBox = tw.div({
  base: "bg-gray-100 border border-gray-300 rounded text-[10px] font-mono text-gray-500 px-3 py-1 text-center",
  variants: {
    clear: {
      none: "",
      both: "clear-both",
    },
  },
  defaultVariants: { clear: "none" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Whitespace collapse demo
// ─────────────────────────────────────────────────────────────────────────────

const WhitespaceBox = tw.div({
  base: "bg-white border border-gray-200 rounded p-3 text-xs font-mono text-gray-700",
  variants: {
    mode: {
      normal: "whitespace-normal",
      pre: "whitespace-pre",
      "pre-wrap": "whitespace-pre-wrap",
      nowrap: "whitespace-nowrap overflow-x-auto",
    },
  },
  defaultVariants: { mode: "normal" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Block Formatting Context (BFC) playground
// ─────────────────────────────────────────────────────────────────────────────

const BfcContainer = tw.div({
  base: "bg-gray-50 border-2 border-gray-300 rounded-lg p-3 transition-all duration-200",
  variants: {
    bfc: {
      none: "",
      flowRoot: "flow-root",
      overflow: "overflow-hidden",
      flex: "flex flex-col",
    },
  },
  defaultVariants: { bfc: "none" },
})

const BfcFloatChild = tw.div({
  base: "float-left w-16 h-16 bg-amber-300 border-2 border-amber-500 rounded flex items-center justify-center text-[10px] font-mono text-amber-900 mr-2",
})

const BfcMarginChild = tw.div({
  base: "bg-blue-100 border border-blue-300 rounded px-3 py-2 text-[10px] font-mono text-blue-800 my-6",
})

// ─────────────────────────────────────────────────────────────────────────────
// Inline Formatting Context (IFC) — line-height & baseline playground
// ─────────────────────────────────────────────────────────────────────────────

const IfcLine = tw.p({
  base: "bg-white border border-gray-200 rounded p-3 transition-all duration-200",
  variants: {
    lh: {
      tight: "leading-tight",
      normal: "leading-normal",
      relaxed: "leading-relaxed",
      loose: "leading-loose",
    },
  },
  defaultVariants: { lh: "normal" },
})

const IfcInlineEl = tw.span({
  base: "inline-block bg-violet-200 border-2 border-violet-400 rounded px-2 text-[11px] font-mono text-violet-900",
  variants: {
    size: {
      sm: "text-xs",
      lg: "text-2xl",
    },
  },
  defaultVariants: { size: "lg" },
})

// ─────────────────────────────────────────────────────────────────────────────
// inline-block whitespace gap playground
// ─────────────────────────────────────────────────────────────────────────────

const GapDemoBox = tw.div({
  base: "inline-block w-16 h-16 bg-teal-300 border-2 border-teal-500 rounded text-[10px] font-mono text-teal-900 flex items-center justify-center",
})

const GapDemoRow = tw.div({
  base: "bg-white border border-gray-200 rounded p-3",
  variants: {
    fix: {
      none: "",
      fontZero: "text-[0px]",
      flexFix: "flex gap-0",
      commentFix: "",
    },
  },
  defaultVariants: { fix: "none" },
})

// ─────────────────────────────────────────────────────────────────────────────
// direction: rtl playground
// ─────────────────────────────────────────────────────────────────────────────

const DirectionRow = tw.div({
  base: "bg-white border border-gray-200 rounded-lg p-4 flex gap-3 transition-all duration-200",
})

const DirectionItem = tw.div({
  base: "px-3 py-2 rounded text-[11px] font-mono",
  variants: {
    n: {
      1: "bg-rose-100 border border-rose-300 text-rose-800",
      2: "bg-amber-100 border border-amber-300 text-amber-800",
      3: "bg-emerald-100 border border-emerald-300 text-emerald-800",
    },
  },
  defaultVariants: { n: 1 },
})

// ─────────────────────────────────────────────────────────────────────────────
// Replaced elements playground
// ─────────────────────────────────────────────────────────────────────────────

const ReplacedBox = tw.span({
  base: "inline-block bg-gradient-to-br from-sky-200 to-blue-300 border-2 border-blue-400 rounded text-[10px] font-mono text-blue-900 flex items-center justify-center text-center p-1",
  variants: {
    type: {
      img: "w-24 h-16",
      div: "w-24 h-16",
    },
  },
  defaultVariants: { type: "img" },
})

// ─────────────────────────────────────────────────────────────────────────────
// writing-mode & axis playground (Normal Flow perspective)
// ─────────────────────────────────────────────────────────────────────────────

const AxisBox = tw.div({
  base: "bg-fuchsia-100 border-2 border-fuchsia-400 rounded-lg flex gap-2 p-3 transition-all duration-200",
  variants: {
    mode: {
      horizontal: "flex-row h-24",
      vertical: "[writing-mode:vertical-rl] h-56 w-32 flex-col",
    },
  },
  defaultVariants: { mode: "horizontal" },
})

const AxisChild = tw.div({
  base: "bg-fuchsia-300 border border-fuchsia-500 rounded px-2 py-1 text-[10px] font-mono text-fuchsia-900 flex items-center justify-center",
})

// ─────────────────────────────────────────────────────────────────────────────
// Anonymous block box playground
// ─────────────────────────────────────────────────────────────────────────────

const AnonParent = tw.div({
  base: "bg-white border-2 border-orange-300 rounded-lg p-3 transition-all duration-200",
})

const AnonChildBlock = tw.p({
  base: "bg-orange-100 border border-orange-400 rounded px-3 py-1.5 text-[11px] font-mono text-orange-800 my-1",
})

// ─────────────────────────────────────────────────────────────────────────────
// List markers playground
// ─────────────────────────────────────────────────────────────────────────────

const DemoList = tw.ul({
  base: "bg-white border border-gray-200 rounded-lg p-4 text-sm space-y-1",
  variants: {
    style: {
      disc: "list-disc list-inside",
      decimal: "list-decimal list-inside",
      none: "list-none",
      square: "[list-style-type:square] list-inside",
    },
    position: {
      inside: "list-inside",
      outside: "list-outside pl-5",
    },
  },
  defaultVariants: { style: "disc", position: "inside" },
})

const DemoListItem = tw.li({
  base: "text-gray-700",
})

// ─────────────────────────────────────────────────────────────────────────────
// text-indent & initial-letter playground
// ─────────────────────────────────────────────────────────────────────────────

const IndentPara = tw.p({
  base: "bg-white border border-gray-200 rounded-lg p-4 text-sm leading-relaxed text-gray-700 transition-all duration-200",
  variants: {
    indent: {
      none: "indent-0",
      sm: "indent-4",
      lg: "indent-8",
    },
  },
  defaultVariants: { indent: "none" },
})

const DropCapPara = tw.p({
  base: "bg-white border border-gray-200 rounded-lg p-4 text-sm leading-relaxed text-gray-700",
  sub: {
    "span:cap": "[initial-letter:3] float-left text-6xl font-bold leading-none pr-2 text-amber-600",
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Playground: position
// ─────────────────────────────────────────────────────────────────────────────

type PositionMode = "static" | "relative" | "absolute"

function PositionPlayground() {
  const [mode, setMode] = useState<PositionMode>("static")

  const descriptions: Record<PositionMode, string> = {
    static: "Default — di Normal Flow sepenuhnya. top/right/bottom/left tidak punya efek apapun.",
    relative: "Tetap di Normal Flow — ruang aslinya tetap reserved (lihat kotak putus-putus tetap kosong/invisible). Cuma digeser VISUAL pakai top/left.",
    absolute: "KELUAR dari Normal Flow — ruang aslinya hilang (kotak putus-putus jadi terlihat, itu bekas slotnya). Posisi dihitung relatif ke PositionParent di bawah karena dia punya position: relative — itulah containing block-nya.",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 position — static / relative / absolute</PlaygroundWrap.label>
        <ChipRow>
          {(["static", "relative", "absolute"] as PositionMode[]).map(v => (
            <Chip key={v} active={mode === v} onClick={() => setMode(v)}>{v}</Chip>
          ))}
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{descriptions[mode]}</p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <PositionParent>
          <PositionGhost show={mode === "absolute"} />
          <PositionBox mode={mode}>box ({mode})</PositionBox>
        </PositionParent>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {mode === "static"
          ? "/* position: static (default) */"
          : mode === "relative"
            ? "position: relative; top: 0.5rem; left: 0.5rem;"
            : "position: absolute; top: 0.75rem; right: 0.75rem; /* relatif ke .parent */"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOC data
// ─────────────────────────────────────────────────────────────────────────────

const TOC = [
  { id: "intro", label: "Apa itu Normal Flow" },
  { id: "display", label: "display: block/inline" },
  { id: "playground", label: "Display Playground" },
  { id: "bfc", label: "Block Formatting Context" },
  { id: "ifc", label: "Inline Formatting Context" },
  { id: "vertical-align", label: "vertical-align" },
  { id: "whitespace", label: "Whitespace Collapsing" },
  { id: "inline-gap", label: "Gap Misterius inline-block" },
  { id: "float", label: "float & clear (legacy)" },
  { id: "direction", label: "direction: rtl" },
  { id: "writing-mode-nf", label: "writing-mode & axis" },
  { id: "replaced", label: "Replaced Elements" },
  { id: "anonymous-box", label: "Anonymous Block Boxes" },
  { id: "list-markers", label: "List Markers" },
  { id: "text-indent", label: "text-indent & initial-letter" },
  { id: "stacking", label: "Document Order & Stacking" },
  { id: "display-contents", label: "display: contents" },
  { id: "lh-strut", label: "line-height & Strut" },
  { id: "display-two-value", label: "Two-value display syntax" },
  { id: "tw-usage", label: "Pakai di tw" },
  { id: "exercise", label: "Latihan" },
]

// ─────────────────────────────────────────────────────────────────────────────
// display:contents playground primitive
// ─────────────────────────────────────────────────────────────────────────────

const ContentsWrapper = tw.div({
  base: "transition-all duration-200 rounded-xl p-3",
  variants: {
    mode: {
      block: "bg-violet-100 border-2 border-violet-400",
      contents: "contents",
    },
  },
  defaultVariants: { mode: "block" },
})

const ContentsChild = tw.div({
  base: "px-3 py-2 rounded-lg text-[11px] font-mono text-white flex items-center justify-center",
  variants: {
    n: {
      1: "bg-rose-400",
      2: "bg-blue-400",
      3: "bg-emerald-400",
    },
  },
  defaultVariants: { n: 1 },
})

// ─────────────────────────────────────────────────────────────────────────────
// line-height strut playground primitive
// ─────────────────────────────────────────────────────────────────────────────

const StrutLine = tw.div({
  base: "bg-white border border-gray-200 rounded-lg p-3 relative flex items-baseline gap-1 transition-all duration-200",
  variants: {
    lh: {
      1: "leading-none",
      1.5: "leading-normal",
      2: "leading-loose",
    },
  },
  defaultVariants: { lh: 1.5 },
})

const StrutSpan = tw.span({
  base: "inline-block bg-violet-200 border border-violet-400 rounded px-1 font-mono text-violet-900 transition-all duration-200",
  variants: {
    size: { sm: "text-xs", lg: "text-3xl" },
  },
  defaultVariants: { size: "sm" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Code component
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
// Playground: display
// ─────────────────────────────────────────────────────────────────────────────

type DisplayType = "block" | "inline" | "inline-block" | "none"

function DisplayPlayground() {
  const [type, setType] = useState<DisplayType>("block")

  const descriptions: Record<DisplayType, string> = {
    block: "Full lebar parent, selalu mulai baris baru. Width/height/margin penuh berlaku.",
    inline: "Selebar isinya, mengalir bersama teks. Width/height tidak berlaku, margin atas-bawah diabaikan.",
    "inline-block": "Mengalir inline seperti teks, tapi width/height/margin penuh berlaku seperti block.",
    none: "Elemen dihapus sepenuhnya dari layout — tidak ada space yang disisakan.",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 display playground</PlaygroundWrap.label>
        <ChipRow>
          {(["block", "inline", "inline-block", "none"] as DisplayType[]).map(v => (
            <Chip key={v} active={type === v} onClick={() => setType(v)}>{v}</Chip>
          ))}
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{descriptions[type]}</p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <div className="text-xs text-gray-500 mb-2">
          Teks sebelum{" "}
          <DisplayBox type={type}>div ({type})</DisplayBox>
          {" "}teks sesudah — perhatikan apakah div ikut baris atau pisah baris.
        </div>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`display: ${type};`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: vertical-align
// ─────────────────────────────────────────────────────────────────────────────

type VAlign = "baseline" | "top" | "middle" | "bottom" | "text-top" | "text-bottom"

function VerticalAlignPlayground() {
  const [valign, setValign] = useState<VAlign>("baseline")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 vertical-align — hanya berlaku untuk inline/inline-block</PlaygroundWrap.label>
        <ChipRow>
          {(["baseline", "top", "middle", "bottom", "text-top", "text-bottom"] as VAlign[]).map(v => (
            <Chip key={v} active={valign === v} onClick={() => setValign(v)}>{v}</Chip>
          ))}
        </ChipRow>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <div className="bg-white border border-gray-200 rounded p-4 text-base">
          Teks baseline{" "}
          <VAlignBox valign={valign}>box</VAlignBox>
          {" "}lanjut teks lagi di baris yang sama.
        </div>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`vertical-align: ${valign};`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: whitespace
// ─────────────────────────────────────────────────────────────────────────────

type WsMode = "normal" | "pre" | "pre-wrap" | "nowrap"

function WhitespacePlayground() {
  const [mode, setMode] = useState<WsMode>("normal")

  const descriptions: Record<WsMode, string> = {
    normal: "Default. Spasi dan newline berturut-turut di-collapse jadi satu spasi. Teks wrap normal.",
    pre: "Spasi dan newline dipertahankan persis seperti di source. Tidak wrap — overflow.",
    "pre-wrap": "Spasi dan newline dipertahankan, tapi teks tetap wrap kalau kepanjangan.",
    nowrap: "Spasi di-collapse seperti normal, tapi teks tidak pernah wrap ke baris baru.",
  }

  const sample = "Ini    teks   dengan     banyak   spasi\ndan newline di tengah."

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 white-space — Normal Flow juga mengatur collapsing whitespace di teks</PlaygroundWrap.label>
        <ChipRow>
          {(["normal", "pre", "pre-wrap", "nowrap"] as WsMode[]).map(v => (
            <Chip key={v} active={mode === v} onClick={() => setMode(v)}>{v}</Chip>
          ))}
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{descriptions[mode]}</p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <WhitespaceBox mode={mode}>{sample}</WhitespaceBox>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`white-space: ${mode};`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: float
// ─────────────────────────────────────────────────────────────────────────────

type FloatType = "none" | "left" | "right"

function FloatPlayground() {
  const [float, setFloat] = useState<FloatType>("left")
  const [clear, setClear] = useState<"none" | "both">("both")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 float & clear — legacy, tapi masih muncul di codebase lama</PlaygroundWrap.label>
        <div className="flex gap-6">
          <div className="space-y-1.5">
            <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] font-semibold uppercase tracking-wider">float</p>
            <ChipRow>
              {(["none", "left", "right"] as FloatType[]).map(v => (
                <Chip key={v} active={float === v} onClick={() => setFloat(v)}>{v}</Chip>
              ))}
            </ChipRow>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] font-semibold uppercase tracking-wider">clearfix di bawah</p>
            <ChipRow>
              <Chip active={clear === "none"} onClick={() => setClear("none")}>tanpa clear</Chip>
              <Chip active={clear === "both"} onClick={() => setClear("both")}>clear-both</Chip>
            </ChipRow>
          </div>
        </div>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <div className="bg-white border border-gray-200 rounded p-3">
          <FloatBox float={float}>floated</FloatBox>
          <p className="text-xs text-gray-500 leading-relaxed">
            Teks ini akan wrap mengelilingi elemen yang di-float, persis seperti majalah lama
            yang membungkus gambar dengan teks. Ini behaviour asli dari float sebelum Flexbox/Grid ada.
          </p>
          <ClearBox clear={clear}>clearfix area</ClearBox>
        </div>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {float === "none" ? "/* no float */" : `float: ${float}; /* clear: ${clear} di bawahnya */`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: Block Formatting Context (BFC)
// ─────────────────────────────────────────────────────────────────────────────

type BfcMode = "none" | "flowRoot" | "overflow" | "flex"

function BfcPlayground() {
  const [mode, setMode] = useState<BfcMode>("none")

  const descriptions: Record<BfcMode, string> = {
    none: "Tanpa BFC baru — height parent collapse karena child di-float, margin child bisa 'bocor' keluar parent.",
    flowRoot: "display: flow-root — cara modern membuat BFC baru, parent otomatis 'contain' float child.",
    overflow: "overflow: hidden — efek samping lama untuk membuat BFC, masih dipakai tapi clip konten yang overflow.",
    flex: "display: flex — flex container otomatis adalah BFC baru, float dan margin collapse tidak 'bocor' keluar.",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Block Formatting Context — kenapa parent "tidak tahu" tinggi float child-nya</PlaygroundWrap.label>
        <ChipRow>
          {(["none", "flowRoot", "overflow", "flex"] as BfcMode[]).map(v => (
            <Chip key={v} active={mode === v} onClick={() => setMode(v)}>
              {v === "none" ? "tanpa BFC" : v === "flowRoot" ? "flow-root" : v === "overflow" ? "overflow-hidden" : "display: flex"}
            </Chip>
          ))}
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{descriptions[mode]}</p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <div className="w-full max-w-sm mx-auto">
          <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-bold">parent container</p>
          <BfcContainer bfc={mode}>
            <BfcFloatChild>float</BfcFloatChild>
            <p className="text-xs text-gray-500">Teks ini membungkus elemen float di sebelahnya.</p>
          </BfcContainer>
          <p className="text-[10px] mt-2 font-semibold" style={{ color: mode === "none" ? "#dc2626" : "#16a34a" }}>
            {mode === "none"
              ? "⚠️ Border parent 'collapse' — tidak ikut tinggi float child!"
              : "✅ Parent sekarang 'contain' float child dengan benar."}
          </p>
        </div>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {mode === "none" ? "/* parent biasa — bukan BFC baru */"
          : mode === "flowRoot" ? "display: flow-root; /* cara modern, tanpa efek samping */"
            : mode === "overflow" ? "overflow: hidden; /* cara lama, side-effect: clip overflow */"
              : "display: flex; /* flex container = BFC otomatis */"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: Inline Formatting Context (IFC)
// ─────────────────────────────────────────────────────────────────────────────

type LineHeight = "tight" | "normal" | "relaxed" | "loose"

function IfcPlayground() {
  const [lh, setLh] = useState<LineHeight>("normal")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Inline Formatting Context — line-box dan baseline alignment</PlaygroundWrap.label>
        <ChipRow>
          {(["tight", "normal", "relaxed", "loose"] as LineHeight[]).map(v => (
            <Chip key={v} active={lh === v} onClick={() => setLh(v)}>{v}</Chip>
          ))}
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          Setiap baris teks adalah satu "line box". Elemen inline di dalamnya align ke <IC>baseline</IC> line box,
          dan tinggi line box ditentukan oleh <IC>line-height</IC> serta elemen inline tertinggi di dalamnya.
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <IfcLine lh={lh}>
          Baris pertama dengan elemen{" "}
          <IfcInlineEl size="lg">BESAR</IfcInlineEl>
          {" "}di tengah teks, lihat bagaimana line box menyesuaikan tingginya.
          Baris kedua teks normal tanpa elemen besar, line box lebih pendek.
        </IfcLine>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`line-height: ${lh === "tight" ? "1.25" : lh === "normal" ? "1.5" : lh === "relaxed" ? "1.625" : "2"};`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: inline-block whitespace gap
// ─────────────────────────────────────────────────────────────────────────────

type GapFix = "none" | "fontZero" | "flexFix" | "commentFix"

function InlineGapPlayground() {
  const [fix, setFix] = useState<GapFix>("none")

  const descriptions: Record<GapFix, string> = {
    none: "Default — ada gap ~4px misterius antar inline-block. Penyebab: whitespace/newline di HTML antar elemen dianggap sebagai 'karakter spasi'.",
    fontZero: "font-size: 0 di parent, lalu reset font-size di child. Trik lama, agak hacky.",
    flexFix: "display: flex di parent — solusi paling modern, gap hilang total karena flex tidak menghitung whitespace sebagai konten.",
    commentFix: "Hapus newline antar tag di HTML, atau gunakan komentar HTML di antaranya. Solusi paling 'manual'.",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Gap misterius ~4px antar inline-block — kenapa dan cara fix</PlaygroundWrap.label>
        <ChipRow>
          {(["none", "fontZero", "flexFix"] as GapFix[]).map(v => (
            <Chip key={v} active={fix === v} onClick={() => setFix(v)}>
              {v === "none" ? "default (ada gap)" : v === "fontZero" ? "font-size: 0" : "display: flex"}
            </Chip>
          ))}
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{descriptions[fix]}</p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <GapDemoRow fix={fix}>
          <GapDemoBox>1</GapDemoBox>
          <GapDemoBox>2</GapDemoBox>
          <GapDemoBox>3</GapDemoBox>
        </GapDemoRow>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {fix === "none" ? "/* whitespace antar tag dianggap karakter spasi → gap ~4px */"
          : fix === "fontZero" ? ".parent { font-size: 0; } .child { font-size: 14px; }"
            : ".parent { display: flex; } /* gap hilang total, lebih modern */"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: direction rtl
// ─────────────────────────────────────────────────────────────────────────────

type DirMode = "ltr" | "rtl"

function DirectionPlayground() {
  const [dir, setDir] = useState<DirMode>("ltr")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 direction: rtl — Normal Flow berubah arah untuk bahasa Arab/Ibrani</PlaygroundWrap.label>
        <ChipRow>
          <Chip active={dir === "ltr"} onClick={() => setDir("ltr")}>ltr (default)</Chip>
          <Chip active={dir === "rtl"} onClick={() => setDir("rtl")}>rtl</Chip>
        </ChipRow>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <div dir={dir} className="w-full max-w-sm mx-auto">
          <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-bold">
            {dir === "ltr" ? "urutan visual: 1 → 2 → 3 (kiri ke kanan)" : "urutan visual: 3 ← 2 ← 1 (kanan ke kiri)"}
          </p>
          <DirectionRow>
            <DirectionItem n={1}>Item 1</DirectionItem>
            <DirectionItem n={2}>Item 2</DirectionItem>
            <DirectionItem n={3}>Item 3</DirectionItem>
          </DirectionRow>
        </div>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`direction: ${dir}; /* urutan DOM sama, tapi render visual terbalik di rtl */`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: Replaced elements
// ─────────────────────────────────────────────────────────────────────────────

function ReplacedElementsPlayground() {
  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Replaced vs Non-replaced elements</PlaygroundWrap.label>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          <IC>img</IC>, <IC>video</IC>, <IC>iframe</IC>, <IC>canvas</IC> adalah "replaced elements" —
          punya intrinsic dimension dari konten eksternalnya sendiri, bukan dari CSS.
          Default <IC>display</IC>-nya adalah <IC>inline-block</IC>, bukan murni <IC>inline</IC>.
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <div className="space-y-3 text-xs">
          <p className="text-gray-500">
            Teks dengan{" "}
            <ReplacedBox type="img">[img 96×64]</ReplacedBox>
            {" "}di tengahnya — meski secara default <IC>display</IC>-nya seperti inline,
            elemen ini punya width/height intrinsik dari file aslinya.
          </p>
        </div>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`/* img, video, iframe punya intrinsic width/height dari sumbernya sendiri */`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: writing-mode & axis (Normal Flow perspective)
// ─────────────────────────────────────────────────────────────────────────────

type AxisMode = "horizontal" | "vertical"

function WritingModeAxisPlayground() {
  const [mode, setMode] = useState<AxisMode>("horizontal")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 writing-mode — block & inline axis bisa diputar 90°</PlaygroundWrap.label>
        <ChipRow>
          <Chip active={mode === "horizontal"} onClick={() => setMode("horizontal")}>
            horizontal-tb (default)
          </Chip>
          <Chip active={mode === "vertical"} onClick={() => setMode("vertical")}>
            vertical-rl
          </Chip>
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          {mode === "horizontal"
            ? "Normal Flow biasa: block axis = vertikal (atas-bawah), inline axis = horizontal (kiri-kanan)."
            : "Axis berputar 90°: block axis jadi horizontal, inline axis jadi vertikal. Elemen 'block' sekarang stack dari kanan ke kiri."}
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <div className="flex items-center justify-center min-h-48">
          <AxisBox mode={mode}>
            <AxisChild>block 1</AxisChild>
            <AxisChild>block 2</AxisChild>
            <AxisChild>block 3</AxisChild>
          </AxisBox>
        </div>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {mode === "horizontal" ? "writing-mode: horizontal-tb; /* block axis vertikal */" : "writing-mode: vertical-rl; /* block axis horizontal */"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: anonymous block boxes
// ─────────────────────────────────────────────────────────────────────────────

function AnonymousBoxPlayground() {
  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Anonymous Block Box — browser bikin box "tak terlihat" otomatis</PlaygroundWrap.label>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          Kalau ada teks lepas (tanpa wrapper tag) bercampur dengan elemen block di dalam
          parent yang sama, browser otomatis "membungkus" teks itu dengan box anonim
          yang berperilaku seperti elemen block — supaya Normal Flow tetap konsisten.
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-bold">HTML asli</p>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-3 text-[11px] font-mono leading-5">
              {`<div>`}<br />
              &nbsp;&nbsp;Teks lepas tanpa wrapper<br />
              &nbsp;&nbsp;{`<p>Paragraf block</p>`}<br />
              {`</div>`}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-bold">Bagaimana browser "melihatnya" (conceptual)</p>
            <AnonParent>
              <AnonChildBlock>[anonymous box] Teks lepas tanpa wrapper</AnonChildBlock>
              <AnonChildBlock>{`<p>`} Paragraf block</AnonChildBlock>
            </AnonParent>
          </div>
        </div>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`/* Anonymous box tidak bisa di-style langsung — tidak ada selector untuknya */`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: list markers
// ─────────────────────────────────────────────────────────────────────────────

type ListStyle = "disc" | "decimal" | "none" | "square"
type ListPosition = "inside" | "outside"

function ListMarkersPlayground() {
  const [style, setStyle] = useState<ListStyle>("disc")
  const [position, setPosition] = useState<ListPosition>("inside")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 List Markers — bagian dari Normal Flow khusus untuk li</PlaygroundWrap.label>
        <div className="flex gap-6">
          <div className="space-y-1.5">
            <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] font-semibold uppercase tracking-wider">list-style-type</p>
            <ChipRow>
              {(["disc", "decimal", "square", "none"] as ListStyle[]).map(v => (
                <Chip key={v} active={style === v} onClick={() => setStyle(v)}>{v}</Chip>
              ))}
            </ChipRow>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] font-semibold uppercase tracking-wider">list-style-position</p>
            <ChipRow>
              {(["inside", "outside"] as ListPosition[]).map(v => (
                <Chip key={v} active={position === v} onClick={() => setPosition(v)}>{v}</Chip>
              ))}
            </ChipRow>
          </div>
        </div>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          {position === "inside"
            ? "Marker dianggap bagian dari konten li — kalau teks wrap ke baris 2, baris itu align dengan marker."
            : "Marker di luar box li — kalau teks wrap, baris kedua tidak align dengan marker (indented)."}
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <DemoList style={style} position={position}>
          <DemoListItem>Item pertama yang pendek</DemoListItem>
          <DemoListItem>Item kedua dengan teks yang jauh lebih panjang sehingga akan wrap ke baris berikutnya, perhatikan alignment-nya</DemoListItem>
          <DemoListItem>Item ketiga</DemoListItem>
        </DemoList>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`list-style-type: ${style}; list-style-position: ${position};`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: text-indent & initial-letter
// ─────────────────────────────────────────────────────────────────────────────

type IndentSize = "none" | "sm" | "lg"

function TextIndentPlayground() {
  const [indent, setIndent] = useState<IndentSize>("sm")
  const [showDropCap, setShowDropCap] = useState(false)

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 text-indent — indentasi baris pertama paragraf (gaya buku cetak)</PlaygroundWrap.label>
        <ChipRow>
          {(["none", "sm", "lg"] as IndentSize[]).map(v => (
            <Chip key={v} active={indent === v && !showDropCap} onClick={() => { setIndent(v); setShowDropCap(false) }}>
              {v === "none" ? "tanpa indent" : v === "sm" ? "indent 16px" : "indent 32px"}
            </Chip>
          ))}
          <Chip active={showDropCap} onClick={() => setShowDropCap(true)}>drop cap (initial-letter)</Chip>
        </ChipRow>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        {!showDropCap ? (
          <IndentPara indent={indent}>
            Ini adalah paragraf contoh dengan text-indent di baris pertama, gaya yang umum
            dipakai di buku cetak atau koran untuk menandai awal paragraf baru tanpa
            perlu spasi kosong di antara paragraf.
          </IndentPara>
        ) : (
          <DropCapPara>
            <DropCapPara.cap>L</DropCapPara.cap>
            orem ipsum dolor sit amet — huruf pertama paragraf ini dibesarkan dengan
            initial-letter, efek "drop cap" klasik yang sering dipakai di majalah dan koran
            untuk menandai awal artikel atau bab baru.
          </DropCapPara>
        )}
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {showDropCap
          ? "initial-letter: 3; /* huruf pertama setinggi 3 baris */"
          : `text-indent: ${indent === "none" ? "0" : indent === "sm" ? "16px" : "32px"};`
        }
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Playground: display:contents
// ─────────────────────────────────────────────────────────────────────────────

type ContentsMode = "block" | "contents"

function DisplayContentsPlayground() {
  const [mode, setMode] = useState<ContentsMode>("block")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 display: contents — wrapper "menghilang" dari box tree</PlaygroundWrap.label>
        <ChipRow>
          <Chip active={mode === "block"} onClick={() => setMode("block")}>display: block (normal)</Chip>
          <Chip active={mode === "contents"} onClick={() => setMode("contents")}>display: contents</Chip>
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          {mode === "block"
            ? "Wrapper ungu tampak dan ikut mengatur layout — children berada di dalam flex wrapper tersendiri."
            : "Wrapper ungu HILANG dari box tree — children langsung 'ikut' flex container parent di atasnya, seolah-olah wrapper tidak ada."}
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas className="flex-col items-stretch">
        <div className="flex gap-2 items-stretch bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] rounded-lg p-3 border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)]">
          <ContentsChild n={1}>Item A</ContentsChild>
          <ContentsWrapper mode={mode}>
            <ContentsChild n={2}>Item B (dalam wrapper)</ContentsChild>
            <ContentsChild n={3}>Item C (dalam wrapper)</ContentsChild>
          </ContentsWrapper>
          <ContentsChild n={1}>Item D</ContentsChild>
        </div>
        <p className="text-[10px] font-mono text-center mt-2 text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">
          {mode === "block"
            ? "Wrapper ungu: border terlihat, B & C di dalam kolom terpisah"
            : "Wrapper hilang: A, B, C, D semua sejajar dalam satu flex row"}
        </p>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {mode === "block"
          ? "/* wrapper tampak, punya box sendiri */"
          : ".wrapper { display: contents; } /* hilang dari box tree, children naik ke parent */"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: line-height & strut
// ─────────────────────────────────────────────────────────────────────────────

type StrutLH = "1" | "1.5" | "2"

function LineHeightStrutPlayground() {
  const [lh, setLh] = useState<StrutLH>("1.5")

  const desc: Record<StrutLH, string> = {
    "1": "leading-none (1) — strut minimal, baris sangat rapat. Elemen inline besar tetap mendorong line box lebih tinggi.",
    "1.5": "leading-normal (1.5) — default yang nyaman. Strut punya ruang untuk ascender dan descender.",
    "2": "leading-loose (2) — baris sangat longgar. Strut menyumbang ruang besar meski teks kecil.",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Strut — invisible zero-width inline box yang set tinggi minimum line box</PlaygroundWrap.label>
        <ChipRow>
          {(["1", "1.5", "2"] as StrutLH[]).map(v => (
            <Chip key={v} active={lh === v} onClick={() => setLh(v)}>leading: {v}</Chip>
          ))}
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{desc[lh]}</p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas className="flex-col items-stretch gap-3">
        <div>
          <p className="text-[10px] text-gray-400 mb-1 font-mono">Teks kecil saja — tinggi line box = strut</p>
          <StrutLine lh={1}>
            <span className="text-xs text-gray-600">Teks normal xs</span>
            <StrutSpan size="sm">inline-sm</StrutSpan>
          </StrutLine>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1 font-mono">Elemen besar ikut → mendorong tinggi line box</p>
          <StrutLine lh={1}>
            <span className="text-xs text-gray-600">Teks xs</span>
            <StrutSpan size="lg">BIG</StrutSpan>
            <span className="text-xs text-gray-600">xs lagi</span>
          </StrutLine>
        </div>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {`/* Strut: browser tambahkan invisible zero-width box di awal setiap line box */
/* tinggi strut = line-height font-size elemen parent */
p { line-height: ${lh}; font-size: 16px; } /* strut tingginya ${parseFloat(lh) * 16}px */`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Two-value display syntax — tidak butuh playground, cukup tabel visual
// ─────────────────────────────────────────────────────────────────────────────

const TWO_VALUE_DISPLAY = [
  { oneValue: "block", twoValue: "block flow", outside: "block", inside: "flow" },
  { oneValue: "inline", twoValue: "inline flow", outside: "inline", inside: "flow" },
  { oneValue: "inline-block", twoValue: "inline flow-root", outside: "inline", inside: "flow-root" },
  { oneValue: "flex", twoValue: "block flex", outside: "block", inside: "flex" },
  { oneValue: "inline-flex", twoValue: "inline flex", outside: "inline", inside: "flex" },
  { oneValue: "grid", twoValue: "block grid", outside: "block", inside: "grid" },
  { oneValue: "inline-grid", twoValue: "inline grid", outside: "inline", inside: "grid" },
  { oneValue: "flow-root", twoValue: "block flow-root", outside: "block", inside: "flow-root" },
  { oneValue: "table", twoValue: "block table", outside: "block", inside: "table" },
  { oneValue: "list-item", twoValue: "block flow list-item", outside: "block", inside: "flow + list-item" },
]

export default function NormalFlowPage() {
  const [activeSection, setActiveSection] = useState("intro")

  return (
    <Page>
      <TopBar>
        <TopBarInner>
          <Breadcrumb>
            <Breadcrumb.link href="/docs">Docs</Breadcrumb.link>
            <Breadcrumb.sep>/</Breadcrumb.sep>
            <Breadcrumb.link href="/docs/learn">Learn</Breadcrumb.link>
            <Breadcrumb.sep>/</Breadcrumb.sep>
            <Breadcrumb.curr>Normal Flow</Breadcrumb.curr>
          </Breadcrumb>
        </TopBarInner>
      </TopBar>

      <Body>
        <Content>
          <PageTitle>Normal Flow</PageTitle>
          <PageDesc>
            Cara browser me-layout elemen secara default — sebelum kamu menulis satu baris
            Flexbox, Grid, atau Positioning pun. Memahami ini bikin teknik advanced jadi masuk akal.
          </PageDesc>

          {/* ══════════════════════ 01 INTRO ══════════════════════════════ */}
          <Section id="intro" onClick={() => setActiveSection("intro")}>
            <H2>
              Apa itu Normal Flow
              <H2.anchor href="#intro">#</H2.anchor>
            </H2>

            <Callout type="php">
              <Callout.icon>🐘</Callout.icon>
              <Callout.content>
                <Callout.title>Analogi PHP</Callout.title>
                Seperti PHP yang eksekusi kode dari atas ke bawah secara default — CSS punya
                Normal Flow. Kamu baru keluar dari Normal Flow kalau eksplisit pakai Flexbox,
                Grid, atau Positioning (selain static).
              </Callout.content>
            </Callout>

            <P>
              Normal Flow adalah algoritma default browser untuk menempatkan elemen di halaman
              tanpa CSS layout tambahan apapun. Ada dua mode utama: <IC>block formatting context</IC> dan
              <IC>inline formatting context</IC>.
            </P>
          </Section>

          {/* ══════════════════════ 02 DISPLAY ════════════════════════════ */}
          <Section id="display" onClick={() => setActiveSection("display")}>
            <H2>
              display: block / inline / inline-block
              <H2.anchor href="#display">#</H2.anchor>
            </H2>

            <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)] overflow-hidden my-5">
              {[
                { type: "block", tags: "div, p, h1-h6, section, article, ul, li", behavior: "Full lebar parent. Selalu mulai baris baru. Width, height, margin (semua sisi) berlaku." },
                { type: "inline", tags: "span, a, strong, em, b, i, code", behavior: "Selebar isinya. Mengalir bersama teks. Width/height tidak berlaku. Margin/padding atas-bawah tidak geser elemen lain." },
                { type: "inline-block", tags: "img, button, input (default browser)", behavior: "Mengalir inline, tapi width/height/margin penuh berlaku seperti block." },
              ].map(({ type, tags, behavior }) => (
                <div key={type} className="p-4 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0">
                  <IC>{type}</IC>
                  <p className="text-xs text-gray-400 font-mono mt-1.5 mb-1">{tags}</p>
                  <p className="text-sm text-[color-mix(in_srgb,var(--foreground)_75%,transparent)] leading-relaxed">{behavior}</p>
                </div>
              ))}
            </div>

            <Code file="display.css">{`
.block   { display: block; }
.inline  { display: inline; }
.i-block { display: inline-block; }
.hidden  { display: none; }      /* hapus dari layout sepenuhnya */

/* Tailwind: block | inline | inline-block | inline-flex | hidden */
            `}</Code>
          </Section>

          <Divider />

          {/* ══════════════════════ 03 PLAYGROUND ═════════════════════════ */}
          <Section id="playground" onClick={() => setActiveSection("playground")}>
            <H2>
              Display Playground
              <H2.anchor href="#playground">#</H2.anchor>
            </H2>
            <DisplayPlayground />
          </Section>

          <Divider />

          {/* ══════════════════════ BFC ═══════════════════════════════════ */}
          <Section id="bfc" onClick={() => setActiveSection("bfc")}>
            <H2>
              Block Formatting Context (BFC)
              <H2.anchor href="#bfc">#</H2.anchor>
            </H2>

            <P>
              Ini konsep yang menjelaskan <em>kenapa</em> margin collapse dan "parent height collapse
              saat child di-float" terjadi. Setiap elemen block membentuk area independen yang
              disebut Block Formatting Context — dan beberapa kondisi membuat elemen jadi
              "BFC baru" yang meng-contain anaknya dengan benar.
            </P>

            <Callout type="php">
              <Callout.icon>🐘</Callout.icon>
              <Callout.content>
                <Callout.title>Analogi PHP</Callout.title>
                BFC itu seperti function scope di PHP. Variabel di dalam function (BFC baru)
                tidak "bocor" ke luar kecuali eksplisit di-return atau pakai global. Begitu
                juga float dan margin di dalam BFC baru tidak "bocor" mempengaruhi elemen di luar.
              </Callout.content>
            </Callout>

            <BfcPlayground />

            <Code file="bfc.css">{`
/* Elemen MEMBUAT BFC baru jika salah satu dari ini benar: */

/* 1. display: flow-root — cara modern, tanpa side effect */
.container { display: flow-root; }

/* 2. float bukan none */
.container { float: left; }

/* 3. position: absolute atau fixed */
.container { position: absolute; }

/* 4. display: inline-block */
.container { display: inline-block; }

/* 5. overflow bukan visible (cara lama, ada side effect clipping) */
.container { overflow: hidden; }

/* 6. display: flex, grid, atau table-cell (parent-nya, bukan dirinya sendiri) */
.container { display: flex; }
            `}</Code>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                <IC>display: flow-root</IC> dibuat khusus untuk membuat BFC baru tanpa
                efek samping apapun — tidak meng-clip overflow, tidak mengubah layout
                internal. Ini cara paling "bersih" dibanding trik lama <IC>overflow: hidden</IC>.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════ IFC ═══════════════════════════════════ */}
          <Section id="ifc" onClick={() => setActiveSection("ifc")}>
            <H2>
              Inline Formatting Context (IFC)
              <H2.anchor href="#ifc">#</H2.anchor>
            </H2>

            <P>
              Kalau BFC mengatur elemen block, Inline Formatting Context mengatur bagaimana
              elemen inline disusun dalam satu baris ("line box"). Setiap baris teks adalah
              line box terpisah, dan tinggi line box ditentukan oleh kombinasi <IC>line-height</IC>
              dan elemen inline tertinggi di dalamnya.
            </P>

            <IfcPlayground />

            <Code file="ifc.css">{`
/* line-height menentukan tinggi line box */
p {
  line-height: 1.5; /* 1.5× font-size */
}

/* Elemen inline besar "mendorong" tinggi line box */
.large-inline {
  font-size: 2rem; /* line box di baris ini jadi lebih tinggi */
}

/* baseline adalah garis acuan default untuk align elemen inline */
img {
  vertical-align: baseline; /* default — kadang bikin gap aneh di bawah img */
  vertical-align: bottom;   /* fix umum untuk gap di bawah gambar inline */
}
            `}</Code>

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                <Callout.title>Kenapa ada gap di bawah img inline?</Callout.title>
                Default <IC>vertical-align</IC> untuk gambar adalah <IC>baseline</IC> —
                baseline itu bukan di bagian paling bawah karakter teks (ada ruang untuk
                "descender" seperti huruf g, y, p). Fix: <IC>display: block</IC> pada gambar,
                atau <IC>vertical-align: bottom/middle/top</IC>.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════ 04 VERTICAL ALIGN ═════════════════════ */}
          <Section id="vertical-align" onClick={() => setActiveSection("vertical-align")}>
            <H2>
              vertical-align
              <H2.anchor href="#vertical-align">#</H2.anchor>
            </H2>

            <P>
              <IC>vertical-align</IC> hanya berlaku pada elemen <IC>inline</IC> atau <IC>inline-block</IC>
              (dan cell tabel). Ini sering disalahpahami sebagai cara untuk vertical centering
              di layout modern — padahal itu tugas Flexbox/Grid.
            </P>

            <VerticalAlignPlayground />

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>vertical-align TIDAK berlaku di block element</Callout.title>
                Kesalahan umum: set <IC>vertical-align: middle</IC> di <IC>div</IC> dengan
                <IC>display: block</IC> dan bingung kenapa tidak jalan. Untuk centering block element,
                pakai Flexbox: <IC>flex items-center</IC>.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════ 05 WHITESPACE ══════════════════════════ */}
          <Section id="whitespace" onClick={() => setActiveSection("whitespace")}>
            <H2>
              Whitespace Collapsing
              <H2.anchor href="#whitespace">#</H2.anchor>
            </H2>

            <P>
              Bagian dari Normal Flow yang sering dilupakan: browser secara default
              "collapse" multiple spasi dan newline berturut-turut menjadi satu spasi.
              Ini juga kenapa indentasi HTML tidak terlihat di hasil render.
            </P>

            <WhitespacePlayground />

            <Code file="whitespace.css">{`
/* Default — newline dan spasi berlebih di-collapse */
.normal { white-space: normal; }

/* Preserve persis seperti source — seperti <pre> */
.pre { white-space: pre; }

/* Preserve newline, tapi tetap wrap kalau kepanjangan */
.pre-wrap { white-space: pre-wrap; }

/* Collapse spasi, tapi paksa satu baris (tidak wrap) */
.nowrap { white-space: nowrap; }
            `}</Code>
          </Section>

          <Divider />

          {/* ══════════════════════ INLINE GAP ═════════════════════════════ */}
          <Section id="inline-gap" onClick={() => setActiveSection("inline-gap")}>
            <H2>
              Gap Misterius antar inline-block
              <H2.anchor href="#inline-gap">#</H2.anchor>
            </H2>

            <P>
              Konsekuensi langsung dari whitespace collapsing: newline atau spasi di HTML
              antar elemen <IC>inline-block</IC> dianggap sebagai "karakter spasi" oleh
              Inline Formatting Context — menghasilkan gap ~4px yang sering bikin bingung
              karena tidak ada di CSS manapun.
            </P>

            <InlineGapPlayground />

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                <Callout.title>Solusi paling modern</Callout.title>
                Daripada trik <IC>font-size: 0</IC> atau menghapus newline manual,
                cukup ubah parent jadi <IC>display: flex</IC>. Flexbox tidak menghitung
                whitespace sebagai konten sama sekali — gap hilang tanpa hack apapun.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════ 06 FLOAT ═══════════════════════════════ */}
          <Section id="float" onClick={() => setActiveSection("float")}>
            <H2>
              float & clear (legacy)
              <H2.anchor href="#float">#</H2.anchor>
            </H2>

            <P>
              Sebelum Flexbox dan Grid ada, <IC>float</IC> adalah cara utama membuat layout
              multi-kolom. Sekarang jarang dipakai untuk layout besar, tapi masih relevan
              untuk efek "teks membungkus gambar" seperti di majalah/artikel.
            </P>

            <FloatPlayground />

            <Code file="float.css">{`
/* Float — keluarkan elemen dari Normal Flow, geser ke kiri/kanan */
.image { float: left; margin-right: 16px; }

/* Masalah: parent tidak tahu height float child — "collapse" */
.container::after {
  content: "";
  display: block;
  clear: both;  /* clearfix klasik */
}

/* Solusi modern: parent jadi flow-root */
.container { display: flow-root; }
            `}</Code>

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                <Callout.title>Kapan masih pakai float?</Callout.title>
                Untuk layout multi-kolom, sudah tidak pernah — pakai Flexbox/Grid.
                Float masih relevan untuk efek "wrap teks di sekitar gambar" — sesuatu
                yang Flexbox/Grid tidak bisa lakukan secara native.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════ DIRECTION RTL ═══════════════════════════ */}
          <Section id="direction" onClick={() => setActiveSection("direction")}>
            <H2>
              direction: rtl
              <H2.anchor href="#direction">#</H2.anchor>
            </H2>

            <P>
              Normal Flow tidak selalu kiri-ke-kanan. Untuk bahasa seperti Arab dan Ibrani,
              <IC>direction: rtl</IC> membalik arah inline flow — elemen yang "pertama" di
              DOM tetap pertama secara logis, tapi muncul di sisi kanan secara visual.
            </P>

            <DirectionPlayground />

            <Code file="direction.css">{`
/* Set di root untuk seluruh halaman RTL */
html[dir="rtl"] {
  direction: rtl;
}

/* Atau per-komponen */
.arabic-text {
  direction: rtl;
  text-align: right; /* biasanya ikut, tapi tidak otomatis */
}
            `}</Code>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                Kombinasikan dengan Logical Properties (<IC>ps-4</IC>, <IC>pe-2</IC> di Tailwind)
                supaya padding/margin otomatis ikut berbalik arah tanpa perlu CSS terpisah
                untuk versi RTL.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════ WRITING MODE & AXIS ═════════════════════ */}
          <Section id="writing-mode-nf" onClick={() => setActiveSection("writing-mode-nf")}>
            <H2>
              writing-mode & Axis di Normal Flow
              <H2.anchor href="#writing-mode-nf">#</H2.anchor>
            </H2>

            <P>
              Sejauh ini kita asumsikan block axis selalu vertikal dan inline axis selalu
              horizontal. Tapi itu cuma default — <IC>writing-mode</IC> bisa memutar
              keduanya. Ini relevan langsung dengan Normal Flow karena mengubah arah
              "stacking" elemen block sepenuhnya.
            </P>

            <WritingModeAxisPlayground />

            <Code file="writing-mode-axis.css">{`
/* Default — block stack top-to-bottom */
.container { writing-mode: horizontal-tb; }

/* Block axis jadi horizontal — elemen "block" stack kanan ke kiri */
.container { writing-mode: vertical-rl; }

/* Flexbox/Grid juga "sadar" akan writing-mode:
   flex-direction: row mengikuti inline axis, bukan selalu horizontal */
            `}</Code>

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                Inilah kenapa Logical Properties (<IC>margin-inline-start</IC>, bukan
                <IC>margin-left</IC>) lebih "benar" secara konseptual — mereka mengikuti
                writing-mode dan direction, bukan terpaku pada satu arah visual.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════ REPLACED ELEMENTS ═══════════════════════ */}
          <Section id="replaced" onClick={() => setActiveSection("replaced")}>
            <H2>
              Replaced Elements
              <H2.anchor href="#replaced">#</H2.anchor>
            </H2>

            <P>
              Sebagian besar elemen HTML adalah "non-replaced" — kontennya dirender langsung
              oleh browser dari teks/markup. Tapi <IC>img</IC>, <IC>video</IC>, <IC>iframe</IC>,
              <IC>canvas</IC>, dan <IC>input</IC> adalah "replaced elements" — kontennya datang
              dari sumber eksternal dengan ukuran intrinsiknya sendiri.
            </P>

            <ReplacedElementsPlayground />

            <Code file="replaced-elements.css">{`
/* Replaced elements punya default display: inline-block (sebagian browser
   memperlakukannya sebagai inline khusus) dan punya intrinsic size */

img {
  /* Tanpa width/height eksplisit, browser pakai ukuran asli file gambar */
  max-width: 100%;  /* responsif — jangan overflow parent */
  height: auto;     /* jaga aspect ratio otomatis */
}

/* Selalu set width & height (atau aspect-ratio) untuk cegah layout shift */
img {
  width: 800px;
  height: 600px;
  aspect-ratio: 4 / 3; /* browser modern reserve space sebelum gambar load */
}
            `}</Code>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>Cumulative Layout Shift (CLS)</Callout.title>
                Gambar tanpa <IC>width</IC>/<IC>height</IC> atau <IC>aspect-ratio</IC> menyebabkan
                konten "loncat" saat gambar selesai dimuat — ini salah satu metrik Core Web Vitals
                yang dinilai Google. Selalu reserve space untuk replaced elements.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════ ANONYMOUS BLOCK BOXES ═══════════════════ */}
          <Section id="anonymous-box" onClick={() => setActiveSection("anonymous-box")}>
            <H2>
              Anonymous Block Boxes
              <H2.anchor href="#anonymous-box">#</H2.anchor>
            </H2>

            <P>
              Hal yang jarang disadari: kalau teks lepas (tanpa tag wrapper) bercampur
              dengan elemen block dalam parent yang sama, browser otomatis membungkus
              teks itu dengan "anonymous block box" — box yang tidak punya selector,
              tidak bisa di-style, tapi tetap berperilaku seperti block element.
            </P>

            <AnonymousBoxPlayground />

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                <Callout.title>Kenapa ini penting diketahui?</Callout.title>
                Ini menjelaskan kenapa kadang teks lepas di antara elemen block "ikut"
                mendapat margin/line-height dari parent secara tidak terduga — karena
                browser memperlakukannya sebagai block box tersembunyi, bukan inline biasa.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════ LIST MARKERS ═════════════════════════════ */}
          <Section id="list-markers" onClick={() => setActiveSection("list-markers")}>
            <H2>
              List Markers
              <H2.anchor href="#list-markers">#</H2.anchor>
            </H2>

            <P>
              <IC>{"<li>"}</IC> punya behavior Normal Flow khusus: setiap item otomatis
              dapat "marker" (bullet/angka) yang posisinya diatur <IC>list-style-position</IC>.
              Marker secara teknis berada di luar box konten, kecuali diset <IC>inside</IC>.
            </P>

            <ListMarkersPlayground />

            <Code file="list-markers.css">{`
ul { list-style-type: disc; }      /* bullet bulat — default ul */
ol { list-style-type: decimal; }   /* angka — default ol */
ul { list-style-type: square; }    /* bullet kotak */
ul { list-style-type: none; }      /* hilangkan marker sepenuhnya */

ul {
  list-style-position: outside; /* default — marker di luar konten */
  list-style-position: inside;  /* marker jadi bagian dari konten, ikut indent saat wrap */
}

/* Modern: ::marker pseudo-element untuk styling marker secara terpisah */
li::marker {
  color: #6366f1;
  font-weight: bold;
}

/* Tailwind: list-disc, list-decimal, list-none, list-inside, list-outside */
            `}</Code>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                <IC>::marker</IC> pseudo-element (CSS modern) memungkinkan styling bullet/angka
                secara terpisah dari teks — sesuatu yang sebelumnya butuh trik
                <IC>list-style: none</IC> + custom pseudo-element manual.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════ TEXT-INDENT & INITIAL-LETTER ════════════ */}
          <Section id="text-indent" onClick={() => setActiveSection("text-indent")}>
            <H2>
              text-indent & initial-letter
              <H2.anchor href="#text-indent">#</H2.anchor>
            </H2>

            <P>
              <IC>text-indent</IC> menggeser baris pertama paragraf — gaya klasik buku cetak.
              <IC>initial-letter</IC> lebih ekstrem: membesarkan huruf pertama jadi "drop cap"
              seperti di majalah/koran, dengan baris berikutnya membungkus di sekitarnya.
            </P>

            <TextIndentPlayground />

            <Code file="text-indent.css">{`
/* text-indent — geser baris pertama saja */
p {
  text-indent: 2em; /* sekitar 32px untuk font 16px */
}

/* initial-letter — drop cap modern (Safari sudah support, Chrome masih partial) */
p::first-letter {
  initial-letter: 3;       /* tinggi 3 baris */
  font-weight: bold;
  color: #d97706;
  padding-right: 8px;
}

/* Fallback lama untuk browser tanpa initial-letter support */
p::first-letter {
  float: left;
  font-size: 3em;
  line-height: 1;
  padding-right: 8px;
}
            `}</Code>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>initial-letter masih belum Baseline</Callout.title>
                MDN secara eksplisit menandai <IC>initial-letter</IC> belum termasuk fitur
                Baseline karena dukungan browser belum merata — Safari adopter paling awal,
                sementara Firefox dan Chrome masih partial/belum support penuh.
                Pendekatan <IC>float: left</IC> + <IC>font-size</IC> besar di <IC>::first-letter</IC>
                tetap jadi fallback yang lebih reliable untuk production saat ini.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════ 07 DOCUMENT ORDER ══════════════════════ */}
          <Section id="stacking" onClick={() => setActiveSection("stacking")}>
            <H2>
              Document Order & Stacking
              <H2.anchor href="#stacking">#</H2.anchor>
            </H2>

            <P>
              Di Normal Flow, urutan elemen di DOM = urutan render di layar. Elemen yang
              ditulis lebih dulu di HTML, muncul lebih dulu (atau lebih kiri untuk inline).
              Ini berubah kalau kamu pakai <IC>position</IC>, <IC>flex-order</IC>, atau <IC>grid-order</IC>.
            </P>

            <Code file="document-order.tsx">{`
// Normal Flow — urutan HTML = urutan visual
<div>
  <p>Pertama</p>
  <p>Kedua</p>
  <p>Ketiga</p>
</div>
// Render: Pertama → Kedua → Ketiga (top to bottom)

// Flexbox bisa override urutan visual tanpa ubah HTML
const Item = tw.div({
  variants: {
    order: {
      first: "order-first", // tampil duluan meski HTML-nya terakhir
      last:  "order-last",
      "1": "order-1",
      "2": "order-2",
    },
  },
})
            `}</Code>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>Hati-hati dengan accessibility</Callout.title>
                Mengubah urutan visual dengan <IC>order</IC> tidak mengubah urutan di DOM —
                artinya screen reader tetap baca sesuai urutan HTML asli, bukan urutan visual.
                Jangan terlalu jauh memisahkan urutan visual dari urutan logis konten.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          <Divider />

          {/* ══════════════════════ DISPLAY CONTENTS ══════════════════════ */}
          <Section id="display-contents" onClick={() => setActiveSection("display-contents")}>
            <H2>
              display: contents
              <H2.anchor href="#display-contents">#</H2.anchor>
            </H2>

            <P>
              <IC>display: contents</IC> membuat elemen "menghilang" dari box tree —
              elemen tidak membentuk box-nya sendiri, tapi children-nya tetap ada dan
              langsung "naik" ke formatting context parent. Berguna untuk wrapper semantik
              (seperti <IC>{"<ul>"}</IC> atau <IC>{"<fieldset>"}</IC>) yang perlu ikut
              dalam flex/grid layout tanpa merusak struktur HTML.
            </P>

            <DisplayContentsPlayground />

            <Code file="display-contents.tsx">{`
// Kasus nyata: <ul> dalam flex nav
// Tanpa contents — ul punya box sendiri, li tidak langsung di flex row
<nav className="flex gap-4">
  <ul> {/* ul di sini punya block box — bikin layout jadi satu kolom */}
    <li>Home</li>
    <li>About</li>
  </ul>
</nav>

// Dengan contents — ul hilang dari box tree, li langsung jadi flex item
const NavList = tw.ul({ base: "contents" })
const NavItem = tw.li({ base: "px-3 py-2 rounded-lg hover:bg-gray-100 text-sm" })

// Hasilnya: Home dan About jadi flex items di baris nav, bukan di dalam ul yang terpisah
            `}</Code>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>Accessibility caveat</Callout.title>
                <IC>display: contents</IC> pada elemen semantik tertentu (button, a, input,
                select, fieldset, dll) bisa menghapus role aksesibilitas elemen tersebut di
                beberapa browser — screen reader mungkin tidak lagi mengenalinya sebagai
                elemen interaktif. Gunakan dengan hati-hati pada elemen yang punya semantik
                penting, lebih aman dipakai di wrapper non-semantik seperti <IC>div</IC> atau <IC>ul</IC>.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════ LINE-HEIGHT STRUT ═════════════════════ */}
          <Section id="lh-strut" onClick={() => setActiveSection("lh-strut")}>
            <H2>
              line-height & Strut
              <H2.anchor href="#lh-strut">#</H2.anchor>
            </H2>

            <P>
              Satu hal yang jarang dijelaskan tentang IFC: setiap line box punya
              "strut" — invisible zero-width inline box di awal baris yang punya
              font metrics dan <IC>line-height</IC> dari elemen parent. Strut ini
              yang menentukan tinggi <em>minimum</em> line box, bahkan kalau baris
              hanya berisi satu elemen kecil.
            </P>

            <LineHeightStrutPlayground />

            <Code file="strut-demo.css">{`
/* Strut muncul karena line-height parent */
p {
  font-size: 16px;
  line-height: 1.5; /* strut = 24px minimum per baris */
}

/* Ini kenapa ada gap misterius di bawah img dalam container */
.container {
  /* line-height di sini membuat strut di dalam container */
  /* img align ke baseline — strut butuh ruang di bawah baseline untuk descender */
}
img {
  vertical-align: bottom; /* fix — align ke bawah strut, hilangkan gap */
  display: block;          /* fix alternatif — keluar dari inline formatting context */
}

/* Tailwind line-height: leading-none(1) | leading-tight(1.25) |
   leading-snug(1.375) | leading-normal(1.5) | leading-relaxed(1.625) | leading-loose(2) */
            `}</Code>

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                <Callout.title>Gap misterius di bawah gambar?</Callout.title>
                Pernah lihat gap ~4px di bawah gambar yang tidak bisa dihapus dengan
                margin? Itu bukan margin — itu ruang untuk descender (bagian bawah huruf
                seperti g, y, p) yang direservasi oleh strut. Fix: <IC>display: block</IC>
                atau <IC>vertical-align: bottom</IC> pada gambar.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════ TWO-VALUE DISPLAY ════════════════════ */}
          <Section id="display-two-value" onClick={() => setActiveSection("display-two-value")}>
            <H2>
              Two-value display syntax
              <H2.anchor href="#display-two-value">#</H2.anchor>
            </H2>

            <P>
              CSS Display Level 3 memperkenalkan sintaks dua nilai untuk <IC>display</IC>:
              nilai pertama (<em>outer</em>) menentukan bagaimana elemen berpartisipasi
              di formatting context parent, nilai kedua (<em>inner</em>) menentukan
              formatting context yang dibuat untuk children-nya.
              Sintaks lama satu nilai tetap valid sebagai shorthand.
            </P>

            <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
              <div className="grid grid-cols-4 gap-0 px-4 py-2 bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">Satu nilai (lama)</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">Dua nilai (baru)</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">Outer (di parent)</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">Inner (untuk children)</span>
              </div>
              {TWO_VALUE_DISPLAY.map(row => (
                <div key={row.oneValue} className="grid grid-cols-4 gap-0 px-4 py-2.5 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0 items-center">
                  <IC>{row.oneValue}</IC>
                  <IC>{row.twoValue}</IC>
                  <span className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] font-mono">{row.outside}</span>
                  <span className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] font-mono">{row.inside}</span>
                </div>
              ))}
            </div>

            <Code file="two-value-display.css">{`
/* Sintaks lama — masih valid, ini shorthand */
.flex-container { display: flex; }

/* Sintaks baru — eksplisit outer + inner */
.flex-container { display: block flex; }
/* artinya: elemen ini berperilaku BLOCK di luar (ambil full lebar, baris baru)
            tapi membuat FLEX formatting context untuk children-nya */

/* Perbedaan yang tadinya implisit, sekarang eksplisit: */
.inline-flex { display: inline flex; }
/* outer: inline — mengalir seperti inline dalam parent */
/* inner: flex   — children diatur oleh flexbox */

/* Kenapa ini penting? */
/* display: inline-block = display: inline flow-root */
/* Ini yang menjelaskan KENAPA inline-block berperilaku seperti itu:
   - outer inline → mengalir bersama teks
   - inner flow-root → membentuk BFC baru (sizing block bekerja, margin tidak collapse ke luar) */

/* Browser modern sudah support, tapi backward compat: pakai single value di production */
            `}</Code>

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                <Callout.title>Kenapa ini penting secara konseptual?</Callout.title>
                Two-value syntax menjelaskan <em>mengapa</em> <IC>inline-block</IC> berperilaku
                berbeda dari <IC>inline</IC> biasa — karena inner display-nya adalah <IC>flow-root</IC>
                (BFC baru), bukan <IC>flow</IC> biasa. Ini juga menjelaskan kenapa <IC>display: flex</IC>
                otomatis menjadi block-level (outer = block), sementara <IC>inline-flex</IC>
                tidak mengambil full lebar parent.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════════════ 08 TW USAGE ════════════════════════════ */}
          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>
              Normal Flow di tailwind-styled-v4
              <H2.anchor href="#tw-usage">#</H2.anchor>
            </H2>

            <Code file="components.tsx">{`
import { tw } from "tailwind-styled-v4"

// Badge — inline-block, mengalir bersama teks
const Badge = tw.span({
  base: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
  variants: {
    color: {
      blue:  "bg-blue-100 text-blue-700",
      green: "bg-green-100 text-green-700",
    },
  },
})

// Paragraph dengan inline elements
const Text = tw.p({
  base: "text-sm leading-7 text-gray-700",
  sub: {
    highlight: "font-semibold text-indigo-600",  // <strong> inline
    link:      "text-blue-600 underline",         // <a> inline
  },
})

// Hidden state — display: none via variants
const Tooltip = tw.div({
  base: "absolute rounded-lg bg-gray-900 text-white text-xs px-2 py-1",
  states: {
    hidden: "hidden",
  },
})

// flow-root — modern clearfix
const ArticleBody = tw.div({
  base: "flow-root", // setara dengan clearfix tanpa pseudo-element
  sub: {
    image: "float-left mr-4 mb-2 rounded-lg",
  },
})
            `}</Code>
          </Section>

          <Divider />

          {/* ══════════════════════ 09 EXERCISE ════════════════════════════ */}
          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>
              Latihan
              <H2.anchor href="#exercise">#</H2.anchor>
            </H2>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 1 — Badge inline</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat komponen <IC>Badge</IC> dengan <IC>tw.span</IC> menggunakan <IC>inline-flex</IC>.</p>
                <p>Letakkan 3 badge berurutan dalam satu paragraf teks dan pastikan mereka mengalir natural bersama teks.</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 2 — Fix vertical-align yang salah</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat <IC>tw.div</IC> dengan <IC>vertical-align: middle</IC> dan amati kenapa tidak berfungsi.</p>
                <p>Lalu fix dengan dua cara: ganti ke <IC>inline-block</IC>, atau gunakan Flexbox <IC>items-center</IC> di parent.</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 3 — Article dengan float image</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat komponen artikel sederhana dengan gambar yang di-<IC>float-left</IC> dan teks yang membungkus di sekitarnya.</p>
                <p>Tambahkan <IC>flow-root</IC> di parent agar height container tidak collapse.</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 4 — Debug BFC</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat parent <IC>tw.div</IC> dengan child yang di-<IC>float-left</IC>. Inspect di DevTools dan perhatikan border parent "collapse" tidak ikut tinggi child.</p>
                <p>Fix dengan menambahkan <IC>flow-root</IC> di variants parent, bandingkan dengan trik lama <IC>overflow-hidden</IC>.</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 5 — Card list siap RTL</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat list horizontal 3 item dengan <IC>tw.div</IC> flex. Test dengan <IC>dir="rtl"</IC> di parent dan pastikan urutan visual berbalik secara otomatis tanpa ubah CSS.</p>
                <p>Tambahkan gambar dengan <IC>aspect-ratio</IC> di setiap item agar tidak ada layout shift saat loading.</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 6 — Tab vertikal dengan writing-mode</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat komponen <IC>VerticalTab</IC> dengan <IC>tw.button</IC> yang memakai <IC>[writing-mode:vertical-rl]</IC> untuk label tab di sidebar.</p>
                <p>Kombinasikan dengan <IC>variants</IC> untuk state active/inactive.</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 7 — FAQ list dengan custom marker</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat komponen <IC>FaqList</IC> dengan <IC>tw.ul</IC> menggunakan <IC>list-none</IC>, lalu styling marker custom dengan <IC>::before</IC> pseudo-element (nomor dalam lingkaran berwarna).</p>
                <p>Bandingkan dengan pendekatan native <IC>list-decimal</IC> + <IC>::marker</IC>.</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header>
                <span>🏋️</span>
                <ExerciseCard.title>Latihan 8 — Artikel dengan drop cap</ExerciseCard.title>
              </ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat komponen <IC>ArticleIntro</IC> dengan paragraf pembuka yang punya efek drop cap di huruf pertama.</p>
                <p>Implementasikan dengan dua cara: <IC>initial-letter</IC> modern, dan fallback <IC>float-left</IC> + <IC>text-6xl</IC> untuk browser yang belum support.</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          {/* Prev/Next — sesuai App Router path */}
          <PageNav>
            <NavBtn href="/learn/dasar-css/box-model" dir="prev">
              <NavBtn.hint>← Previous</NavBtn.hint>
              <NavBtn.label>Box Model</NavBtn.label>
            </NavBtn>
            <NavBtn href="/learn/dasar-css/positioning" dir="next">
              <NavBtn.hint>Next →</NavBtn.hint>
              <NavBtn.label>Positioning</NavBtn.label>
            </NavBtn>
          </PageNav>

        </Content>

        <Toc>
          <TocLabel>On this page</TocLabel>
          {TOC.map(item => (
            <TocItem
              key={item.id}
              href={`#${item.id}`}
              active={activeSection === item.id}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </TocItem>
          ))}
          <div className="mt-6 pt-4 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
            <a
              href="https://github.com/Dictionar32/tailwind-styled-v4"
              target="_blank"
              className="text-xs text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] hover:text-[var(--foreground)] tr  ansition-colors flex items-center gap-1"
            >
              Edit on GitHub ↗
            </a>
          </div>
        </Toc>
      </Body>
    </Page>
  )
}
