/**
 * CSS Layout — Positioning (Complete)
 * tailwind-styled-v4
 *
 * Drop ke: examples/next-js-app/src/app/docs/learn/positioning/page.tsx
 */

"use client"

import { useState } from "react"
import { tw } from "tailwind-styled-v4"
import {
  RelativeContainer
} from "../shared-styles"

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
// Position basics playground
// ─────────────────────────────────────────────────────────────────────────────

const PosCanvas = tw.div({
  base: `
    rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)]
    bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)]
    p-4 overflow-hidden relative h-44
  `,
  sub: {
    inner: "flex gap-3 items-start h-full relative",
  },
})

const PosSibling = tw.div({
  base: "w-16 h-14 rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-mono shrink-0",
})

const PosElement = tw.div({
  base: "w-20 h-14 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 transition-all duration-300 bg-[var(--accent)]",
  variants: {
    pos: {
      static: "",
      relative: "relative top-4 left-4",
      absolute: "absolute top-2 right-2",
      fixed: "fixed top-16 right-4 z-50 shadow-xl",
      sticky: "sticky top-2",
    },
  },
  defaultVariants: { pos: "static" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Containing block playground
// ─────────────────────────────────────────────────────────────────────────────

const CbParent = tw.div({
  base: "rounded-xl bg-white border-2 p-6 relative h-40 transition-all duration-200",
  variants: {
    pos: {
      static: "border-gray-300",
      relative: "border-emerald-400",
    },
  },
  defaultVariants: { pos: "static" },
})

const CbChild = tw.div({
  base: "absolute w-24 h-12 rounded-lg flex items-center justify-center text-[10px] font-mono text-white bg-rose-500 shadow-md",
  variants: {
    corner: {
      tr: "top-2 right-2",
      br: "bottom-2 right-2",
    },
  },
  defaultVariants: { corner: "tr" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Sticky playground
// ─────────────────────────────────────────────────────────────────────────────

const StickyScrollArea = tw.div({
  base: "h-56 overflow-y-auto rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-white relative",
})

const StickyHeader = tw.div({
  base: "sticky top-0 z-10 bg-[var(--accent)] text-white text-xs font-bold px-4 py-2",
})

const StickyContentBlock = tw.div({
  base: "px-4 py-3 text-xs text-gray-600 border-b border-gray-100",
})

// ─────────────────────────────────────────────────────────────────────────────
// z-index / stacking context playground
// ─────────────────────────────────────────────────────────────────────────────

const StackCanvas = tw.div({
  base: "relative h-48 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-white overflow-hidden",
})

const StackBox = tw.div({
  base: "absolute w-28 h-28 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg",
  variants: {
    layer: {
      a: "bg-rose-400  top-4  left-4",
      b: "bg-blue-400  top-12 left-16",
      c: "bg-amber-400 top-20 left-28",
    },
    z: {
      0: "z-0",
      10: "z-10",
      20: "z-20",
      30: "z-30",
    },
  },
  defaultVariants: { layer: "a", z: 0 },
})

// Opacity-context demo — z-index trap
const OpacityParent = tw.div({
  base: "relative h-40 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-white p-4 transition-all duration-200",
  variants: {
    opacity: {
      full: "opacity-100",
      reduced: "opacity-90",
    },
  },
  defaultVariants: { opacity: "full" },
})

const OpacityChild = tw.div({
  base: "absolute w-20 h-12 rounded-lg flex items-center justify-center text-[10px] font-bold text-white",
  variants: {
    layer: {
      low: "bg-blue-400 z-10 top-6 left-6",
      high: "bg-rose-500 z-50 top-12 left-16",
    },
  },
  defaultVariants: { layer: "low" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Inset shorthand playground
// ─────────────────────────────────────────────────────────────────────────────

const InsetParent = tw.div({
  base: "relative h-40 rounded-xl border-2 border-dashed border-gray-300 bg-white",
})

const InsetChild = tw.div({
  base: "absolute bg-[var(--accent)] text-white text-[10px] font-mono flex items-center justify-center rounded-lg transition-all duration-200",
  variants: {
    mode: {
      full: "inset-0",
      partial: "inset-4",
      mixed: "top-2 right-2 bottom-8 left-8",
    },
  },
  defaultVariants: { mode: "full" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Modal/overlay pattern playground
// ─────────────────────────────────────────────────────────────────────────────

const FakeViewport = tw.div({
  base: "relative h-48 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-gray-100 overflow-hidden",
})

const FakeOverlay = tw.div({
  base: "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200",
  variants: {
    show: {
      true: "opacity-100 pointer-events-auto",
      false: "opacity-0 pointer-events-none",
    },
  },
  defaultVariants: { show: false },
})

const FakeModal = tw.div({
  base: "bg-white rounded-xl p-4 w-40 text-center shadow-2xl",
  sub: {
    "p:title": "text-xs font-bold mb-1",
    "p:desc": "text-[10px] text-gray-500",
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Scroll snap playground
// ─────────────────────────────────────────────────────────────────────────────

const SnapContainer = tw.div({
  base: "flex gap-3 overflow-x-auto h-32 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] p-3 snap-x snap-mandatory",
})

const SnapItem = tw.div({
  base: "shrink-0 w-32 h-full rounded-lg flex items-center justify-center text-white font-bold snap-center",
  variants: {
    color: {
      0: "bg-rose-400",
      1: "bg-blue-400",
      2: "bg-emerald-400",
      3: "bg-amber-400",
      4: "bg-violet-400",
    },
  },
  defaultVariants: { color: 0 },
})

// ─────────────────────────────────────────────────────────────────────────────
// position: anchor (CSS Anchor Positioning) — illustration only, no live polyfill
// ─────────────────────────────────────────────────────────────────────────────

const AnchorDemoBox = tw.div({
  base: "relative h-40 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-white flex items-center justify-center",
})

const AnchorButton = tw.button({
  base: "px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold",
})

const AnchorTooltip = tw.div({
  base: "absolute bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg transition-all duration-200",
  variants: {
    show: {
      true: "opacity-100 -translate-y-2",
      false: "opacity-0 translate-y-0 pointer-events-none",
    },
  },
  defaultVariants: { show: false },
})

// ─────────────────────────────────────────────────────────────────────────────
// TOC data
// ─────────────────────────────────────────────────────────────────────────────

const TOC = [
  { id: "intro", label: "Apa itu Positioning" },
  { id: "five-values", label: "5 Nilai position" },
  { id: "playground", label: "Position Playground" },
  { id: "containing-block", label: "Containing Block" },
  { id: "inset", label: "Shorthand inset" },
  { id: "sticky", label: "position: sticky" },
  { id: "z-index", label: "z-index & Stacking Context" },
  { id: "stacking-traps", label: "Stacking Context Traps" },
  { id: "fixed-modal", label: "Pattern: Modal/Overlay" },
  { id: "scroll-snap", label: "Scroll Snap" },
  { id: "anchor-pos", label: "CSS Anchor Positioning" },
  { id: "sticky-trap", label: "Sticky Overflow Trap" },
  { id: "isolation", label: "isolation: isolate & Stacking Triggers" },
  { id: "offset-path", label: "CSS Motion Path (offset-*)" },
  { id: "inset-logical", label: "inset-block & inset-inline" },
  { id: "position-area", label: "position-area (Anchor L2)" },
  { id: "tw-usage", label: "Pakai di tw" },
  { id: "exercise", label: "Latihan" },
]

type PosType = "static" | "relative" | "absolute" | "fixed" | "sticky"

const POS_INFO: Record<PosType, { desc: string; analogy: string }> = {
  static: { desc: "Default. Mengikuti Normal Flow. top/left/right/bottom tidak berpengaruh.", analogy: "Seperti variabel PHP biasa — ikut urutan eksekusi." },
  relative: { desc: "Masih di Normal Flow, bisa digeser dari posisi normalnya. Jadi anchor untuk absolute child.", analogy: "Seperti function — masih akses scope luar tapi punya ruang sendiri." },
  absolute: { desc: "Keluar dari Normal Flow. Relatif ke containing block — ancestor terdekat yang bukan static.", analogy: "Seperti static property dalam class — tidak terikat instance." },
  fixed: { desc: "Relatif ke viewport — KECUALI ancestor punya transform, filter, backdrop-filter, perspective, contain, atau will-change tertentu yang akan jadi containing block-nya. Tidak ikut scroll dokumen.", analogy: "Seperti global variable — selalu ada di mana-mana, kecuali ada scope yang mengurungnya." },
  sticky: { desc: "Hybrid relative+fixed. Ikut scroll sampai threshold tertentu, lalu menempel di dalam containing block-nya.", analogy: "Seperti singleton — ada di tempatnya sampai kondisi terpenuhi." },
}

// ─────────────────────────────────────────────────────────────────────────────
// Sticky overflow trap playground primitives
// ─────────────────────────────────────────────────────────────────────────────

const StickyTrapScroll = tw.div({
  base: "h-64 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-white relative",
  variants: {
    overflow: {
      visible: "overflow-visible",
      hidden: "overflow-hidden",
      auto: "overflow-auto",
      scroll: "overflow-scroll",
    },
  },
  defaultVariants: { overflow: "visible" },
})

const StickyTrapInner = tw.div({
  base: "overflow-y-auto h-full",
})

// ─────────────────────────────────────────────────────────────────────────────
// offset-path playground primitives
// ─────────────────────────────────────────────────────────────────────────────

const OffsetDot = tw.div({
  base: "w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-[10px] font-bold",
})

// ─────────────────────────────────────────────────────────────────────────────
// Additional Components
// ─────────────────────────────────────────────────────────────────────────────

const ErrorText = tw.p({
  base: "text-xs",
  variants: {
    error: {
      true: "text-red-600 font-semibold",
      false: "text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]",
    },
  },
  defaultVariants: { error: false },
})

const StickyStatusText = tw.span({
  base: "font-semibold",
  variants: {
    broken: {
      true: "text-red-600",
      false: "text-emerald-600",
    },
  },
  defaultVariants: { broken: false },
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
// Playground: Position basics
// ─────────────────────────────────────────────────────────────────────────────

function PositionBasicsPlayground() {
  const [active, setActive] = useState<PosType>("static")
  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 5 Nilai position — klik untuk bandingkan</PlaygroundWrap.label>
        <ChipRow>
          {(["static", "relative", "absolute", "fixed", "sticky"] as PosType[]).map(p => (
            <Chip key={p} active={active === p} onClick={() => setActive(p)}>
              position: {p}
            </Chip>
          ))}
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{POS_INFO[active].desc}</p>
        <p className="text-xs text-violet-600 bg-violet-50 rounded-lg px-3 py-2 border border-violet-100 flex gap-2">
          <span>🐘</span>{POS_INFO[active].analogy}
        </p>
      </PlaygroundWrap.controls>

      <PosCanvas>
        <PosCanvas.inner>
          <PosSibling>div 1</PosSibling>
          <PosElement pos={active}>{active}</PosElement>
          <PosSibling>div 3</PosSibling>
        </PosCanvas.inner>
      </PosCanvas>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: Containing block
// ─────────────────────────────────────────────────────────────────────────────

type CbMode = "static" | "relative"

function ContainingBlockPlayground() {
  const [parentPos, setParentPos] = useState<CbMode>("static")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Containing Block — siapa "acuan" untuk absolute child?</PlaygroundWrap.label>
        <ChipRow>
          <Chip active={parentPos === "static"} onClick={() => setParentPos("static")}>
            parent: position static (default)
          </Chip>
          <Chip active={parentPos === "relative"} onClick={() => setParentPos("relative")}>
            parent: position relative
          </Chip>
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          {parentPos === "static"
            ? "Parent static (default) BUKAN containing block untuk absolute child — child 'lompat' ke ancestor lain yang punya position, atau ke viewport/initial containing block kalau tidak ada."
            : "Parent relative JADI containing block — absolute child terikat ke pojok parent ini, bukan ke elemen lain di luar."}
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <CbParent pos={parentPos}>
          <p className="text-[10px] text-gray-400 font-mono mb-2">
            .parent {`{ position: ${parentPos}; }`}
          </p>
          <CbChild corner="tr">absolute child</CbChild>
        </CbParent>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {parentPos === "static"
          ? "/* .parent TIDAK jadi containing block — child cari ancestor relative/absolute lain */"
          : "/* .parent JADI containing block karena position: relative */"
        }
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: Inset shorthand
// ─────────────────────────────────────────────────────────────────────────────

type InsetMode = "full" | "partial" | "mixed"

function InsetPlayground() {
  const [mode, setMode] = useState<InsetMode>("full")

  const descriptions: Record<InsetMode, string> = {
    full: "inset-0 — shorthand untuk top:0; right:0; bottom:0; left:0. Child memenuhi seluruh parent.",
    partial: "inset-4 — shorthand untuk semua sisi dengan nilai sama (16px setiap sisi).",
    mixed: "Kombinasi individual: top, right, bottom, left punya nilai berbeda-beda.",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 inset — shorthand modern untuk top/right/bottom/left</PlaygroundWrap.label>
        <ChipRow>
          <Chip active={mode === "full"} onClick={() => setMode("full")}>inset-0</Chip>
          <Chip active={mode === "partial"} onClick={() => setMode("partial")}>inset-4</Chip>
          <Chip active={mode === "mixed"} onClick={() => setMode("mixed")}>individual sides</Chip>
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{descriptions[mode]}</p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <InsetParent>
          <InsetChild mode={mode}>{mode}</InsetChild>
        </InsetParent>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {mode === "full" ? "inset: 0; /* = top:0 right:0 bottom:0 left:0 */"
          : mode === "partial" ? "inset: 16px; /* = top/right/bottom/left: 16px */"
            : "top: 8px; right: 8px; bottom: 32px; left: 32px;"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: Sticky
// ─────────────────────────────────────────────────────────────────────────────

function StickyPlayground() {
  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Scroll area di bawah — perhatikan header "menempel" di atas</PlaygroundWrap.label>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          Header punya <IC>position: sticky; top: 0;</IC>. Selama parent (scroll container) masih
          punya ruang scroll, header ini akan tetap di tempatnya begitu mencapai <IC>top: 0</IC>.
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <StickyScrollArea>
          <StickyHeader>📌 Header sticky — scroll ke bawah</StickyHeader>
          {Array.from({ length: 10 }, (_, i) => (
            <StickyContentBlock key={i}>
              Baris konten ke-{i + 1} — terus scroll untuk lihat header tetap menempel di atas.
            </StickyContentBlock>
          ))}
        </StickyScrollArea>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`position: sticky; top: 0; z-index: 10;`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: z-index & stacking context
// ─────────────────────────────────────────────────────────────────────────────

type ZMode = "0" | "10" | "20" | "30"

function ZIndexPlayground() {
  const [zA, setZA] = useState<ZMode>("0")
  const [zB, setZB] = useState<ZMode>("10")
  const [zC, setZC] = useState<ZMode>("20")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 z-index — atur urutan tumpukan 3 box yang saling overlap</PlaygroundWrap.label>
        <div className="grid sm:grid-cols-3 gap-4">
          {([
            { label: "Box A (merah)", val: zA, set: setZA },
            { label: "Box B (biru)", val: zB, set: setZB },
            { label: "Box C (kuning)", val: zC, set: setZC },
          ] as const).map(({ label, val, set }) => (
            <div key={label} className="space-y-1.5">
              <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] font-semibold uppercase tracking-wider">{label}</p>
              <ChipRow>
                {(["0", "10", "20", "30"] as ZMode[]).map(z => (
                  <Chip key={z} active={val === z} onClick={() => set(z)}>z:{z}</Chip>
                ))}
              </ChipRow>
            </div>
          ))}
        </div>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <StackCanvas>
          <StackBox layer="a" z={0}>A</StackBox>
          <StackBox layer="b" z={10}>B</StackBox>
          <StackBox layer="c" z={20}>C</StackBox>
        </StackCanvas>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {`.a { z-index: ${zA}; } .b { z-index: ${zB}; } .c { z-index: ${zC}; } /* angka lebih besar = di atas */`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: stacking context trap (opacity)
// ─────────────────────────────────────────────────────────────────────────────

type OpacityMode = "full" | "reduced"

function StackingTrapPlayground() {
  const [opacity, setOpacity] = useState<OpacityMode>("full")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Jebakan stacking context — opacity {"<"} 1 bikin z-index "terkunci"</PlaygroundWrap.label>
        <ChipRow>
          <Chip active={opacity === "full"} onClick={() => setOpacity("full")}>parent: opacity 1 (normal)</Chip>
          <Chip active={opacity === "reduced"} onClick={() => setOpacity("reduced")}>parent: opacity 0.9</Chip>
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          {opacity === "full"
            ? "Box biru (z-10) ada di dalam parent tanpa stacking context baru — box merah (z-50) di luar tetap bisa menang karena z-index dibanding secara global."
            : "Setelah parent dapat opacity < 1, parent membentuk stacking context baru sendiri. Box biru di dalamnya 'terkunci' — z-index tertingginya pun tidak akan pernah mengalahkan elemen lain di LUAR stacking context parent."}
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <div className="relative">
          <OpacityParent opacity={opacity}>
            <p className="text-[10px] text-gray-400 font-mono">.parent {`{ opacity: ${opacity === "full" ? "1" : "0.9"}; }`}</p>
            <OpacityChild layer="low">child z:10</OpacityChild>
          </OpacityParent>
          <OpacityChild layer="high">sibling z:50</OpacityChild>
        </div>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {opacity === "full"
          ? "/* parent tidak membentuk stacking context — z-index child dibanding global */"
          : "/* opacity < 1 → parent jadi stacking context baru → child ter-isolasi */"
        }
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: Modal/overlay pattern
// ─────────────────────────────────────────────────────────────────────────────

function ModalPatternPlayground() {
  const [show, setShow] = useState(false)
  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Pattern: Modal/Overlay — kombinasi fixed + inset-0 + z-index</PlaygroundWrap.label>
        <ChipRow>
          <Chip active={show} onClick={() => setShow(true)}>Buka modal</Chip>
          <Chip active={show} onClick={() => setShow(false)}>Tutup modal</Chip>
        </ChipRow>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <FakeViewport>
          <div className="p-3 text-[10px] text-gray-400">simulasi "viewport" halaman</div>
          <FakeOverlay show={show}>
            <FakeModal>
              <FakeModal.title>Modal Dialog</FakeModal.title>
              <FakeModal.desc>fixed inset-0 + flex center + overlay</FakeModal.desc>
            </FakeModal>
          </FakeOverlay>
        </FakeViewport>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {`.overlay { position: fixed; inset: 0; background: rgb(0 0 0 / 0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: Scroll Snap
// ─────────────────────────────────────────────────────────────────────────────

function ScrollSnapPlayground() {
  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Scroll snap — geser horizontal, perhatikan item "snap" ke tengah</PlaygroundWrap.label>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          Bukan positioning langsung, tapi sering dipakai bareng <IC>sticky</IC>/<IC>fixed</IC>
          untuk carousel dan gallery. <IC>scroll-snap-type</IC> di parent, <IC>scroll-snap-align</IC> di child.
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <SnapContainer>
          {([0, 1, 2, 3, 4]).map((c, i) => (
            <SnapItem key={c} color={0}>Slide {i + 1}</SnapItem>
          ))}
        </SnapContainer>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>{`.container { scroll-snap-type: x mandatory; } .item { scroll-snap-align: center; }`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: CSS Anchor Positioning (illustrative)
// ─────────────────────────────────────────────────────────────────────────────

function AnchorPositioningPlayground() {
  const [show, setShow] = useState(false)
  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Ilustrasi CSS Anchor Positioning (fitur baru, dukungan browser terbatas)</PlaygroundWrap.label>
        <ChipRow>
          <Chip active={show } onClick={() => setShow(true)}>Tampilkan tooltip</Chip>
          <Chip active={show} onClick={() => setShow(false)}>Sembunyikan</Chip>
        </ChipRow>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          Demo ini disimulasikan dengan <IC>absolute</IC> biasa untuk ilustrasi visual.
          CSS Anchor Positioning API yang sesungguhnya (<IC>anchor-name</IC>, <IC>position-anchor</IC>)
          memungkinkan elemen "menempel" ke elemen lain manapun di DOM tanpa perlu jadi ancestor/descendant.
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas>
        <AnchorDemoBox>
          <RelativeContainer>
            <AnchorButton onClick={() => setShow(s => !s)}>Hover me (anchor)</AnchorButton>
            {/* ✅ EXCEPTION: style={{}} used here for educational demo of CSS Anchor Positioning layout
                These dynamic positioning properties (bottom, left, transform, marginBottom) are specific
                to demonstrating the CSS Anchor Positioning API and cannot be abstracted to tw() variants
                without losing clarity about what CSS properties are being illustrated. */}
            <AnchorTooltip show={show} style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 8 }}>
              Tooltip "ter-anchor"
            </AnchorTooltip>
          </RelativeContainer>
        </AnchorDemoBox>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {`/* Real CSS Anchor Positioning (dukungan browser belum universal): */
.button { anchor-name: --my-anchor; }
.tooltip { position: absolute; position-anchor: --my-anchor; top: anchor(top); }`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: Sticky overflow trap
// ─────────────────────────────────────────────────────────────────────────────

type StickyTrapOverflow = "visible" | "hidden" | "auto" | "scroll"

function StickyOverflowTrapPlayground() {
  const [overflow, setOverflow] = useState<StickyTrapOverflow>("auto")

  const descriptions: Record<StickyTrapOverflow, string> = {
    visible: "overflow: visible (default) — sticky bekerja normal. Scroll area di bawah.",
    hidden: "overflow: hidden di ANCESTOR — STICKY TIDAK BEKERJA sama sekali! Ini bug paling umum. Browser dianggap tidak punya scroll container, jadi sticky tidak punya 'titik menempel'.",
    auto: "overflow: auto — sticky bekerja karena ancestor ADALAH scroll container yang valid.",
    scroll: "overflow: scroll — sama seperti auto, sticky bekerja karena ancestor jadi scroll container.",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Jebakan sticky — overflow di ancestor yang salah</PlaygroundWrap.label>
        <ChipRow>
          {(["visible", "hidden", "auto", "scroll"] as StickyTrapOverflow[]).map(v => (
            <Chip key={v} active={overflow === v} onClick={() => setOverflow(v)}>
              ancestor: overflow-{v}
            </Chip>
          ))}
        </ChipRow>
        {/* ✅ EXCEPTION: ternary className used here to show error state (text-red when overflow:hidden breaks sticky)
            This demonstrates the broken behavior vs working behavior and needs conditional styling based on
            the playground state. StatusText component doesn't support this specific use case with template literal. */}
        <ErrorText error={overflow === "hidden"}>
          {descriptions[overflow]}
        </ErrorText>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas className="flex-col items-stretch">
        <StickyTrapScroll overflow={overflow}>
          <StickyTrapInner>
            <div className="sticky top-0 z-10 bg-[var(--accent)] text-white text-xs font-bold px-4 py-2 flex items-center gap-2">
              {overflow === "hidden" ? "❌ Sticky TIDAK bekerja" : "✅ Sticky Header"}
              <span className="font-normal opacity-70">(scroll ke bawah)</span>
            </div>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="px-4 py-2.5 text-xs text-gray-600 border-b border-gray-100">
                Row {i + 1} — scroll untuk lihat sticky header behavior
              </div>
            ))}
          </StickyTrapInner>
        </StickyTrapScroll>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {overflow === "hidden"
          ? "/* ❌ overflow: hidden di ancestor membunuh sticky! */"
          : `overflow-y: ${overflow}; /* ✅ ancestor jadi scroll container — sticky bekerja */`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: isolation:isolate & stacking triggers
// ─────────────────────────────────────────────────────────────────────────────

const STACKING_TRIGGERS = [
  { trigger: "opacity < 1", css: "opacity: 0.99", tw: "opacity-[0.99]" },
  { trigger: "transform (any value)", css: "transform: translateZ(0)", tw: "[transform:translateZ(0)]" },
  { trigger: "filter (any value)", css: "filter: blur(0)", tw: "[filter:blur(0)]" },
  { trigger: "will-change: transform", css: "will-change: transform", tw: "[will-change:transform]" },
  { trigger: "isolation: isolate", css: "isolation: isolate", tw: "isolate" },
  { trigger: "z-index + position", css: "position: relative; z-index: 0", tw: "relative z-0" },
  { trigger: "clip-path (any value)", css: "clip-path: inset(0)", tw: "[clip-path:inset(0)]" },
  { trigger: "mix-blend-mode", css: "mix-blend-mode: normal", tw: "mix-blend-normal" },
  { trigger: "backdrop-filter", css: "backdrop-filter: blur(0)", tw: "[backdrop-filter:blur(0)]" },
  { trigger: "contain: layout/paint", css: "contain: layout", tw: "[contain:layout]" },
]

function IsolationStackingPlayground() {
  const [selected, setSelected] = useState(4) // isolation: isolate default

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Semua properti yang membuat Stacking Context baru</PlaygroundWrap.label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {STACKING_TRIGGERS.map((t, i) => (
            <Chip key={t.trigger} active={selected === i} onClick={() => setSelected(i)}>
              {t.trigger}
            </Chip>
          ))}
        </div>
        {selected === 4 && (
          <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
            <strong>isolation: isolate</strong> — cara paling "bersih" membuat stacking context baru.
            Tidak ada efek visual, tidak ada performance overhead, tidak ada side effect.
            Ini cara yang direkomendasikan untuk design system komponen yang perlu z-index isolation.
          </p>
        )}
        {selected !== 4 && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
            ⚠️ Properti ini membuat stacking context sebagai <em>efek samping</em> — bukan tujuan utamanya.
            Gunakan <code>isolation: isolate</code> kalau tujuannya memang isolasi z-index saja.
          </p>
        )}
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas className="flex-col items-stretch gap-3">
        <div className="relative h-32 rounded-xl border border-gray-200 bg-gray-50">
          {/* External high z-index */}
          <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-3 py-2 rounded-lg z-50 shadow-lg">
            External z-50
          </div>
          {/* Isolated container */}
          <div
            className="absolute top-6 left-16 bg-blue-100 border-2 border-blue-400 rounded-lg p-2"
            style={selected === 0 ? { opacity: 0.99 } : selected === 1 ? { transform: "translateZ(0)" } : selected === 2 ? { filter: "blur(0px)" } : selected === 3 ? { willChange: "transform" } : selected === 4 ? { isolation: "isolate" } : selected === 5 ? { position: "relative", zIndex: 0 } : selected === 6 ? { clipPath: "inset(0)" } : selected === 7 ? { mixBlendMode: "normal" } : selected === 8 ? { backdropFilter: "blur(0px)" } : { contain: "layout" }}
          >
            <p className="text-[9px] font-mono text-blue-800 mb-1">Stacking context parent</p>
            <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded z-[9999] relative">
              Child z-9999 (terkunci di sini)
            </div>
          </div>
        </div>
        <p className="text-[10px] font-mono text-center text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">
          Child z-9999 tidak bisa mengalahkan External z-50 — karena terkunci dalam stacking context parent
        </p>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {`/* ${STACKING_TRIGGERS[selected].trigger} */\n.parent { ${STACKING_TRIGGERS[selected].css}; } /* Tailwind: ${STACKING_TRIGGERS[selected].tw} */`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Playground: CSS Motion Path (offset-*)
// ─────────────────────────────────────────────────────────────────────────────

function OffsetPathPlayground() {
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 CSS Motion Path — gerakkan elemen mengikuti path SVG</PlaygroundWrap.label>
        <div className="flex gap-3 items-center">
          <Chip active={playing} onClick={() => setPlaying(p => !p)}>
            {playing ? "⏸ Pause" : "▶ Play"}
          </Chip>
          <input
            type="range" min={0} max={100}
            value={progress}
            onChange={e => setProgress(+e.target.value)}
            className="flex-1 accent-[var(--accent)]"
          />
          <span className="text-[11px] font-mono text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] w-10">{progress}%</span>
        </div>
        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
          <IC>offset-path</IC> mendefinisikan jalur gerak. <IC>offset-distance</IC> menentukan
          posisi di jalur (0%–100%). <IC>offset-rotate</IC> mengatur rotasi elemen mengikuti arah jalur.
          Berbeda dengan positioning biasa — elemen bergerak mengikuti bentuk path, bukan koordinat x/y.
        </p>
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas className="relative overflow-hidden" style={{ minHeight: "180px" }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 160" fill="none">
          <path
            d="M 40 80 C 120 20, 280 20, 360 80 C 280 140, 120 140, 40 80 Z"
            stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4"
            fill="none" opacity={0.4}
          />
        </svg>
        {/* ✅ EXCEPTION: style={{}} used here for CSS Motion Path educational demo
            The offset-path, offset-distance, and offset-rotate properties are specific to demonstrating
            CSS Motion Path API behavior and require dynamic values based on the progress slider.
            These cannot be abstracted to tw() variants without losing clarity about the CSS properties being illustrated. */}
        <div
          style={{
            position: "absolute",
            offsetPath: "path('M 40 80 C 120 20, 280 20, 360 80 C 280 140, 120 140, 40 80 Z')",
            offsetDistance: `${progress}%`,
            offsetRotate: "auto",
            left: 0, top: 0,
          } as React.CSSProperties}
        >
          <OffsetDot>→</OffsetDot>
        </div>
      </PlaygroundWrap.canvas>

      <PlaygroundWrap.codeline>
        {`.dot {
  offset-path: path('M 40 80 C 120 20, 280 20, 360 80...');
  offset-distance: ${progress}%;
  offset-rotate: auto; /* ikuti arah path otomatis */
}`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function PositioningPage() {
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
            <Breadcrumb.curr>Positioning</Breadcrumb.curr>
          </Breadcrumb>
        </TopBarInner>
      </TopBar>

      <Body>
        <Content>
          <PageTitle>Positioning</PageTitle>
          <PageDesc>
            Keluar dari Normal Flow dan kontrol posisi elemen secara eksplisit — fondasi untuk
            navbar sticky, modal, tooltip, badge, dan hampir semua UI pattern modern.
          </PageDesc>

          {/* ══════════════ 01 INTRO ═════════════════════════════════════ */}
          <Section id="intro" onClick={() => setActiveSection("intro")}>
            <H2>
              Apa itu Positioning
              <H2.anchor href="#intro">#</H2.anchor>
            </H2>

            <Callout type="php">
              <Callout.icon>🐘</Callout.icon>
              <Callout.content>
                <Callout.title>Analogi PHP</Callout.title>
                Seperti PHP punya scope variabel — local, global, static — CSS punya "context"
                untuk positioning. Elemen <IC>absolute</IC> mencari ancestor <IC>relative</IC>
                terdekat, mirip cara PHP mencari variabel di scope terdekat sebelum naik ke scope luar.
              </Callout.content>
            </Callout>

            <P>
              Positioning adalah cara mengeluarkan elemen dari aturan Normal Flow dan menempatkannya
              secara eksplisit menggunakan <IC>top</IC>, <IC>right</IC>, <IC>bottom</IC>, <IC>left</IC>.
              Properti <IC>position</IC> punya 5 nilai utama, masing-masing dengan aturan berbeda
              tentang "relatif terhadap apa" elemen itu diposisikan.
            </P>
          </Section>

          {/* ══════════════ 02 FIVE VALUES ══════════════════════════════ */}
          <Section id="five-values" onClick={() => setActiveSection("five-values")}>
            <H2>
              5 Nilai position
              <H2.anchor href="#five-values">#</H2.anchor>
            </H2>

            <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)] overflow-hidden my-5">
              {(Object.entries(POS_INFO) as [PosType, typeof POS_INFO[PosType]][]).map(([key, info]) => (
                <div key={key} className="p-4 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0">
                  <IC>{key}</IC>
                  <p className="text-sm text-[color-mix(in_srgb,var(--foreground)_75%,transparent)] leading-relaxed mt-1.5">{info.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Divider />

          {/* ══════════════ 03 PLAYGROUND ═══════════════════════════════ */}
          <Section id="playground" onClick={() => setActiveSection("playground")}>
            <H2>
              Position Playground
              <H2.anchor href="#playground">#</H2.anchor>
            </H2>
            <PositionBasicsPlayground />

            <Code file="positioning-basics.tsx">{`
// Badge notification di pojok button
const Button = tw.button({
  base: "relative inline-flex items-center ...", // ← relative! jadi anchor
  sub: {
    badge: "absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs",
  },
})

// Navbar sticky
const Navbar = tw.nav({
  base: "sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md",
})
            `}</Code>
          </Section>

          <Divider />

          {/* ══════════════ 04 CONTAINING BLOCK ═════════════════════════ */}
          <Section id="containing-block" onClick={() => setActiveSection("containing-block")}>
            <H2>
              Containing Block
              <H2.anchor href="#containing-block">#</H2.anchor>
            </H2>

            <P>
              Ini konsep yang paling sering bikin bingung: elemen <IC>absolute</IC> tidak otomatis
              relatif ke parent langsungnya. Dia mencari ancestor terdekat yang punya <IC>position</IC>
              selain <IC>static</IC>. Kalau tidak ketemu sama sekali, dia jatuh ke <em>initial containing block</em>
              — yaitu viewport.
            </P>

            <ContainingBlockPlayground />

            <Code file="containing-block.css">{`
/* ❌ Tanpa position di parent, absolute child "lompat" ke viewport */
.parent { /* position: static (default) */ }
.child  { position: absolute; top: 0; right: 0; }
/* .child nempel ke pojok viewport, BUKAN pojok .parent! */

/* ✅ Beri position: relative di parent agar jadi containing block */
.parent { position: relative; }
.child  { position: absolute; top: 0; right: 0; }
/* .child sekarang nempel ke pojok .parent */
            `}</Code>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>Containing block lebih dari sekadar position</Callout.title>
                Ancestor yang membuat containing block baru untuk <IC>absolute</IC>/<IC>fixed</IC> child
                tidak hanya yang punya <IC>position</IC> bukan static. Berikut daftar lengkap dari MDN:
                <IC>transform</IC>, <IC>filter</IC>, <IC>backdrop-filter</IC>, <IC>perspective</IC>,
                <IC>rotate</IC>, <IC>scale</IC>, <IC>translate</IC> (nilai bukan none) —
                <IC>contain: layout/paint/strict/content</IC> —
                <IC>will-change</IC> (yang value non-initialnya membuat containing block) —
                <IC>content-visibility: auto</IC>.
                Semua ini sering jadi sumber bug tak terduga, terutama <IC>transform</IC> pada
                card/wrapper yang membuat <IC>position: fixed</IC> child tidak lagi relatif ke viewport.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════ 05 INSET ════════════════════════════════════ */}
          <Section id="inset" onClick={() => setActiveSection("inset")}>
            <H2>
              Shorthand inset
              <H2.anchor href="#inset">#</H2.anchor>
            </H2>

            <P>
              <IC>inset</IC> adalah shorthand modern untuk <IC>top</IC>, <IC>right</IC>, <IC>bottom</IC>,
              <IC>left</IC> sekaligus — mirip <IC>margin</IC>/<IC>padding</IC> shorthand. Sangat berguna
              untuk pattern overlay full-screen.
            </P>

            <InsetPlayground />

            <Code file="inset.css">{`
/* Shorthand sama nilai semua sisi */
.overlay { position: fixed; inset: 0; }
/* = top: 0; right: 0; bottom: 0; left: 0; */

/* Shorthand dengan nilai berbeda — mirip margin */
.box { position: absolute; inset: 8px 16px; }
/* = top/bottom: 8px; left/right: 16px; */

/* Tailwind: inset-0, inset-4, inset-x-0, inset-y-4 */
            `}</Code>
          </Section>

          <Divider />

          {/* ══════════════ 06 STICKY ═══════════════════════════════════ */}
          <Section id="sticky" onClick={() => setActiveSection("sticky")}>
            <H2>
              position: sticky
              <H2.anchor href="#sticky">#</H2.anchor>
            </H2>

            <P>
              <IC>sticky</IC> adalah hybrid — elemen berperilaku seperti <IC>relative</IC> sampai
              scroll position mencapai threshold (<IC>top: 0</IC> misalnya), lalu "menempel" seperti
              <IC>fixed</IC>, tapi hanya dalam batas containing block-nya.
            </P>

            <StickyPlayground />

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>Dua jebakan utama sticky yang sering dilupakan</Callout.title>
                <strong>1. Wajib threshold:</strong> <IC>position: sticky</IC> tanpa <IC>top</IC>/<IC>bottom</IC>/dll
                tidak akan menempel — wajib beri minimal satu nilai threshold non-auto.<br /><br />
                <strong>2. Ancestor dengan overflow:</strong> Kalau ancestor punya <IC>overflow: hidden</IC>,
                <IC>overflow: auto</IC>, atau <IC>overflow: scroll</IC>, sticky tidak bekerja karena
                ancestor itu jadi scroll container. Solusi modern: ganti <IC>overflow: hidden</IC>
                dengan <IC>overflow: clip</IC> — efek visual sama (konten terpotong) tapi TIDAK
                membuat scroll container, sehingga sticky tetap bekerja.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════ 07 Z-INDEX ═══════════════════════════════════ */}
          <Section id="z-index" onClick={() => setActiveSection("z-index")}>
            <H2>
              z-index & Stacking Context
              <H2.anchor href="#z-index">#</H2.anchor>
            </H2>

            <P>
              <IC>z-index</IC> hanya berlaku untuk elemen yang punya <IC>position</IC> selain
              <IC>static</IC>. Angka lebih besar tampil di atas angka lebih kecil — tapi
              perbandingannya hanya berlaku di dalam <em>stacking context</em> yang sama.
            </P>

            <ZIndexPlayground />

            <Code file="z-index.css">{`
.a { position: absolute; z-index: 10; }
.b { position: absolute; z-index: 20; } /* di atas .a */
.c { position: absolute; z-index: 5;  } /* di bawah keduanya */

/* z-index TIDAK berlaku tanpa position */
.d { z-index: 999; } /* ❌ tidak ada efek — position masih static */
            `}</Code>
          </Section>

          <Divider />

          {/* ══════════════ 08 STACKING TRAPS ════════════════════════════ */}
          <Section id="stacking-traps" onClick={() => setActiveSection("stacking-traps")}>
            <H2>
              Stacking Context Traps
              <H2.anchor href="#stacking-traps">#</H2.anchor>
            </H2>

            <P>
              Ini sumber bug z-index paling membingungkan: banyak properti CSS selain <IC>position</IC>
              + <IC>z-index</IC> juga bisa membuat stacking context baru — dan begitu itu terjadi,
              z-index child "terkunci" di dalam stacking context parent-nya, tidak bisa "kabur" keluar.
            </P>

            <StackingTrapPlayground />

            <Code file="stacking-context-triggers.css">{`
/* Properti-properti ini MEMBUAT stacking context baru (daftar lengkap MDN): */

/* Position + z-index */
.el { position: relative; z-index: 1; }  /* position + z-index ≠ auto */
.el { position: fixed; }                 /* fixed — SELALU buat SC, tanpa z-index sekalipun */
.el { position: sticky; }               /* sticky — SELALU buat SC, tanpa z-index sekalipun */

/* Visual effects */
.el { opacity: 0.99; }                  /* opacity < 1 */
.el { mix-blend-mode: multiply; }       /* mix-blend-mode ≠ normal */
.el { transform: translateZ(0); }       /* transform ≠ none */
.el { filter: blur(0); }               /* filter ≠ none */
.el { backdrop-filter: blur(10px); }    /* backdrop-filter ≠ none */
.el { perspective: 1000px; }           /* perspective ≠ none */
.el { clip-path: circle(50%); }        /* clip-path ≠ none */
.el { mask: url(mask.svg); }           /* mask/mask-image/mask-border */

/* Performance & containment */
.el { will-change: transform; }        /* will-change yang trigger containing block */
.el { contain: layout; }              /* contain: layout/paint/strict/content */
.el { container-type: inline-size; }  /* container-type ≠ normal */

/* Intentional — tanpa efek visual samping */
.el { isolation: isolate; }           /* ← paling "bersih" untuk debug stacking */
            `}</Code>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                <Callout.title>Debug z-index: cari stacking context trap dulu</Callout.title>
                Kalau <IC>z-index</IC> tinggi tetap "kalah", jangan langsung naikkan angkanya.
                Cek ancestor dengan <IC>opacity {"<"} 1</IC>, <IC>transform</IC>, <IC>filter</IC>,
                atau <IC>will-change</IC> yang diam-diam membuat stacking context baru.
                Gunakan <IC>isolation: isolate</IC> untuk membuat stacking context baru yang
                bersih tanpa efek visual — ini cara paling predictable untuk mengisolasi komponen.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════ 09 MODAL PATTERN ═════════════════════════════ */}
          <Section id="fixed-modal" onClick={() => setActiveSection("fixed-modal")}>
            <H2>
              Pattern: Modal / Overlay
              <H2.anchor href="#fixed-modal">#</H2.anchor>
            </H2>

            <P>
              Kombinasi paling umum di UI modern: <IC>fixed</IC> + <IC>inset-0</IC> + Flexbox center
              + <IC>z-index</IC> tinggi. Pattern ini dipakai di hampir semua modal, drawer, dan toast.
            </P>

            <ModalPatternPlayground />
          </Section>

          <Divider />

          {/* ══════════════ 10 SCROLL SNAP ═══════════════════════════════ */}
          <Section id="scroll-snap" onClick={() => setActiveSection("scroll-snap")}>
            <H2>
              Scroll Snap
              <H2.anchor href="#scroll-snap">#</H2.anchor>
            </H2>

            <ScrollSnapPlayground />

            <Code file="scroll-snap.tsx">{`
const Carousel = tw.div({
  base: "flex gap-3 overflow-x-auto snap-x snap-mandatory",
})

const Slide = tw.div({
  base: "shrink-0 w-full snap-center",
})
            `}</Code>
          </Section>

          <Divider />

          {/* ══════════════ 11 ANCHOR POSITIONING ════════════════════════ */}
          <Section id="anchor-pos" onClick={() => setActiveSection("anchor-pos")}>
            <H2>
              CSS Anchor Positioning
              <H2.anchor href="#anchor-pos">#</H2.anchor>
            </H2>

            <P>
              Fitur CSS yang relatif baru — memungkinkan elemen "menempel" ke elemen lain
              manapun di DOM (bukan harus ancestor) tanpa JavaScript. Berguna untuk tooltip,
              popover, dan dropdown yang sebelumnya butuh library JS seperti Popper.js.
            </P>

            <AnchorPositioningPlayground />

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                <Callout.title>Baseline sejak Januari 2026 — tapi cek Firefox</Callout.title>
                CSS Anchor Positioning sudah <strong>Baseline sejak Januari 2026</strong> dan
                bekerja di Chrome, Edge, dan Safari terbaru. Firefox masih ada beberapa sub-fitur
                yang partial support (seperti <IC>anchor()</IC> di beberapa konteks tertentu —
                lihat MDN bug 1993699). Untuk penggunaan dasar tooltip/popover, sudah aman di
                sebagian besar browser modern. Untuk fallback lintas browser yang lebih luas,
                Floating UI masih relevan.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          <Divider />

          {/* ══════════════ STICKY OVERFLOW TRAP ══════════════════════════ */}
          <Section id="sticky-trap" onClick={() => setActiveSection("sticky-trap")}>
            <H2>
              Jebakan: sticky + overflow di ancestor
              <H2.anchor href="#sticky-trap">#</H2.anchor>
            </H2>

            <P>
              <IC>position: sticky</IC> adalah salah satu yang paling sering tidak bekerja
              tanpa tahu kenapa. Penyebab paling umum: ada ancestor yang punya
              <IC>overflow: hidden</IC>, <IC>overflow: auto</IC>, atau <IC>overflow: scroll</IC>
              di antara elemen sticky dan scroll container sebenarnya.
              Khusus <IC>overflow: hidden</IC> — ini selalu mematikan sticky.
            </P>

            <StickyOverflowTrapPlayground />

            <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
              {[
                { overflow: "overflow: hidden", sticky: "❌ Mati total", note: "Ancestor bukan scroll container yang valid" },
                { overflow: "overflow: auto", sticky: "✅ Bekerja", note: "Ancestor ADALAH scroll container" },
                { overflow: "overflow: scroll", sticky: "✅ Bekerja", note: "Ancestor ADALAH scroll container" },
                { overflow: "overflow: visible", sticky: "✅ Bekerja", note: "Tidak ada restriction — sticky menggunakan viewport" },
                { overflow: "overflow: clip", sticky: "❌ Mati total", note: "Sama seperti hidden untuk sticky" },
              ].map(row => (
                <div key={row.overflow} className="grid grid-cols-3 gap-2 p-3 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0 text-xs items-center">
                  <IC>{row.overflow}</IC>
                  <StickyStatusText broken={row.sticky.startsWith("❌")}>{row.sticky}</StickyStatusText>
                  <span className="text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{row.note}</span>
                </div>
              ))}
            </div>

            <Code file="sticky-fix.tsx">{`
// ❌ Bug — sticky tidak bekerja
const Layout = tw.div({ base: "overflow-hidden" })  // ancestor dengan overflow:hidden
const StickyHeader = tw.div({ base: "sticky top-0" }) // ini tidak akan sticky!

// ✅ Fix 1 — hilangkan overflow:hidden di ancestor
const Layout = tw.div({ base: "overflow-visible" })  // atau hilangkan overflow sama sekali

// ✅ Fix 2 — kalau butuh clip konten, pakai overflow:clip pada parent LANGSUNG
//    dan biarkan ancestor yang lebih atas tidak punya overflow restriction
const Container = tw.div({ base: "overflow-clip" })  // clip tapi bukan scroll container

// ✅ Fix 3 — debug dengan cara ini:
// Inspect semua ancestor di DevTools, cari yang punya overflow: hidden
// Ganti jadi overflow: visible atau hapus property-nya
            `}</Code>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>overflow: hidden ≠ clip-path untuk sticky</Callout.title>
                Kalau butuh "clip visual" tanpa mematikan sticky, pakai
                <IC>clip-path</IC> daripada <IC>overflow: hidden</IC>.
                <IC>clip-path</IC> tidak membentuk scroll container, jadi sticky tetap bekerja.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════ ISOLATION & STACKING TRIGGERS ═════════════════ */}
          <Section id="isolation" onClick={() => setActiveSection("isolation")}>
            <H2>
              isolation: isolate & Semua Stacking Context Triggers
              <H2.anchor href="#isolation">#</H2.anchor>
            </H2>

            <P>
              Banyak properti CSS membuat stacking context baru sebagai efek samping —
              bukan hanya <IC>z-index</IC> dan <IC>opacity</IC>. Memahami daftar
              lengkapnya krusial untuk menghindari "z-index war" dan debug layering
              yang tidak terduga. <IC>isolation: isolate</IC> adalah satu-satunya
              cara membuat stacking context tanpa efek samping visual apapun.
            </P>

            <IsolationStackingPlayground />

            <Code file="isolation.tsx">{`
import { tw } from "tailwind-styled-v4"

// ❌ Cara lama — pakai opacity sebagai "hack" isolasi z-index
const ModalWrapper = tw.div({ base: "opacity-[0.999]" }) // side effect: bikin semi-transparent?!

// ✅ Cara bersih — isolation: isolate (Tailwind: isolate)
const ModalWrapper = tw.div({ base: "isolate" })
// Tidak ada efek visual, tidak ada opacity change, hanya membuat stacking context baru

// Kapan butuh isolation:
// 1. Dialog/modal yang z-index-nya tidak boleh "bocor" ke komponen lain
// 2. Card dengan hover effects yang punya positioned children
// 3. Komponen design system yang seharusnya self-contained z-index-nya
const Dialog = tw.div({
  base: "isolate fixed inset-0 z-50 flex items-center justify-center",
})

// Semua child Dialog yang punya z-index akan dibandingkan sesama child Dialog,
// tidak akan berinterferensi dengan elemen lain di luar Dialog
            `}</Code>

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                <Callout.title>Daftar lengkap stacking context triggers (MDN)</Callout.title>
                Selain yang ada di playground: <IC>position: fixed/sticky</IC> selalu membuat
                stacking context, <IC>perspective</IC>, <IC>mask/mask-image/mask-border</IC>,
                <IC>content-visibility</IC>, dan <IC>@keyframes</IC> animation dengan opacity/transform
                juga termasuk. Cek MDN "Stacking context" untuk daftar definitif terbaru.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════ CSS MOTION PATH ═══════════════════════════════ */}
          <Section id="offset-path" onClick={() => setActiveSection("offset-path")}>
            <H2>
              CSS Motion Path — offset-path, offset-distance, offset-rotate
              <H2.anchor href="#offset-path">#</H2.anchor>
            </H2>

            <P>
              CSS Motion Path bukan positioning biasa — ini tentang menggerakkan elemen
              mengikuti jalur (path). <IC>offset-path</IC> mendefinisikan jalur SVG atau
              shape geometris, <IC>offset-distance</IC> menentukan seberapa jauh elemen
              bergerak di jalur tersebut (0%–100%), dan <IC>offset-rotate</IC> mengatur
              rotasi otomatis mengikuti arah jalur.
            </P>

            <OffsetPathPlayground />

            <Code file="motion-path.css">{`
/* CSS Motion Path — animasi mengikuti jalur */
.dot {
  /* Tentukan jalur — bisa path SVG, circle, ellipse, dll */
  offset-path: path("M 0 0 C 100 -80, 300 -80, 400 0 C 300 80, 100 80, 0 0 Z");

  /* Posisi di jalur — dari 0% (awal) sampai 100% (akhir) */
  offset-distance: 0%;

  /* Rotasi: auto = ikuti arah jalur, 0deg = tidak rotasi, 45deg = offset 45 derajat */
  offset-rotate: auto;

  /* Animasikan offset-distance untuk gerak sepanjang jalur */
  animation: move-along-path 3s linear infinite;
}

@keyframes move-along-path {
  from { offset-distance: 0%; }
  to   { offset-distance: 100%; }
}

/* Path shapes lain yang didukung */
.circle-orbit {
  offset-path: circle(80px at 50% 50%);
  offset-distance: 0%;
  animation: orbit 2s linear infinite;
}

/* Tailwind tidak punya utility built-in untuk offset-*, pakai arbitrary values */
/* [offset-path:...] [offset-distance:50%] [offset-rotate:auto] */
            `}</Code>

            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                <Callout.title>Dukungan browser</Callout.title>
                CSS Motion Path sudah baseline di semua browser modern (Chrome, Firefox, Safari, Edge).
                Ini bukan eksperimental lagi — bisa dipakai di production untuk animasi loading
                indicator melingkar, particle effects, atau animasi yang mengikuti path kompleks.
                Jauh lebih performant dari JavaScript karena dijalankan di compositor thread.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════ INSET LOGICAL SHORTHANDS ══════════════════════ */}
          <Section id="inset-logical" onClick={() => setActiveSection("inset-logical")}>
            <H2>
              inset-block & inset-inline — logical offset shorthands
              <H2.anchor href="#inset-logical">#</H2.anchor>
            </H2>

            <P>
              Seperti logical properties untuk margin/padding, CSS Logical Properties
              juga menyediakan shorthand untuk offset positioned elements.
              <IC>inset-block</IC> menggantikan <IC>top</IC>/<IC>bottom</IC>,
              <IC>inset-inline</IC> menggantikan <IC>left</IC>/<IC>right</IC> —
              tapi mengikuti <IC>writing-mode</IC> dan <IC>direction</IC> aktif.
            </P>

            <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
              <div className="grid grid-cols-3 px-4 py-2 bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                {["Physical property", "Logical equivalent", "Shorthand"].map(h => (
                  <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">{h}</span>
                ))}
              </div>
              {[
                { physical: "top", logical: "inset-block-start", shorthand: "inset-block: X" },
                { physical: "bottom", logical: "inset-block-end", shorthand: "inset-block: X Y" },
                { physical: "left", logical: "inset-inline-start", shorthand: "inset-inline: X" },
                { physical: "right", logical: "inset-inline-end", shorthand: "inset-inline: X Y" },
                { physical: "top + bottom", logical: "inset-block", shorthand: "inset-block: top bottom" },
                { physical: "left + right", logical: "inset-inline", shorthand: "inset-inline: left right" },
                { physical: "all sides", logical: "inset (physical!)", shorthand: "inset: top right bottom left" },
              ].map(row => (
                <div key={row.physical} className="grid grid-cols-3 px-4 py-2.5 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0 items-center gap-2">
                  <IC>{row.physical}</IC>
                  <IC>{row.logical}</IC>
                  <span className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] font-mono">{row.shorthand}</span>
                </div>
              ))}
            </div>

            <Code file="inset-logical.css">{`
/* Physical — selalu top/right/bottom/left, tidak peduli writing-mode */
.tooltip {
  position: absolute;
  top: 0;
  left: 0;
}

/* Logical — mengikuti writing-mode dan direction */
.tooltip {
  position: absolute;
  inset-block-start:  0; /* top di horizontal-tb */
  inset-inline-start: 0; /* left di LTR, right di RTL */
}

/* Shorthand inset-block dan inset-inline */
.overlay {
  position: absolute;
  inset-block:  8px;      /* top: 8px; bottom: 8px; */
  inset-inline: 16px;     /* left: 16px; right: 16px; */
}

/* inset (tanpa -block/-inline) adalah PHYSICAL shorthand: top right bottom left */
.fill { inset: 0; } /* = top:0 right:0 bottom:0 left:0 — TIDAK logical */

/* Catatan: inset sendiri (physical) sudah ada di section sebelumnya.
   inset-block dan inset-inline adalah versi LOGICAL-nya. */

/* Tailwind: tidak ada built-in untuk inset-block/inset-inline,
   pakai arbitrary: [inset-block:8px] [inset-inline:16px] */
            `}</Code>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                Gunakan <IC>inset-inline-start</IC> dan <IC>inset-block-start</IC>
                daripada <IC>left</IC>/<IC>top</IC> kalau komponen perlu bekerja
                di RTL atau vertical writing mode — tooltip, dropdown, dan popover
                terutama diuntungkan karena mereka sering diposisikan relatif
                ke anchor element yang orientasinya bisa berbeda.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════ POSITION-AREA ══════════════════════════════════ */}
          <Section id="position-area" onClick={() => setActiveSection("position-area")}>
            <H2>
              position-area — CSS Anchor Positioning Level 2
              <H2.anchor href="#position-area">#</H2.anchor>
            </H2>

            <P>
              <IC>position-area</IC> adalah API baru dari CSS Anchor Positioning Level 2
              yang menyederhanakan positioning relatif ke anchor. Daripada menghitung
              offset manual dengan <IC>top: anchor(top)</IC>, cukup deklarasikan
              "elemen ini ada di sudut/sisi mana relatif ke anchor"-nya.
            </P>

            <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
              <div className="p-4 bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] mb-3">Grid 3×3 position-area values</p>
                <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
                  {[
                    "top left", "top center", "top right",
                    "center left", "center", "center right",
                    "bottom left", "bottom center", "bottom right",
                  ].map(pos => (
                    <div
                      key={pos}
                      className="px-2 py-1.5 rounded text-[10px] font-mono text-center bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)]"
                    >
                      {pos}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)] leading-relaxed">
                Nilai <IC>position-area</IC> menggunakan grid 3×3 relatif ke anchor.
                Ada juga nilai seperti <IC>span-all</IC>, <IC>span-inline</IC>,
                <IC>start</IC>, <IC>end</IC> untuk spanning multi-cell.
              </div>
            </div>

            <Code file="position-area.css">{`
/* CSS Anchor Positioning Level 2 — position-area */

/* Setup anchor */
.trigger {
  anchor-name: --tooltip-anchor;
}

/* Positioned element — cara LAMA (Level 1) */
.tooltip-old {
  position: absolute;
  position-anchor: --tooltip-anchor;
  top: anchor(bottom);      /* tepat di bawah anchor */
  left: anchor(left);       /* rata kiri dengan anchor */
  margin-top: 8px;          /* gap */
}

/* Positioned element — cara BARU dengan position-area (Level 2) */
.tooltip-new {
  position: absolute;
  position-anchor: --tooltip-anchor;
  position-area: bottom left;  /* langsung nyatakan posisi di grid 3x3 */
  margin-top: 8px;
}

/* position-area dengan span */
.dropdown {
  position: fixed;
  position-anchor: --button;
  position-area: bottom span-all; /* di bawah, span selebar anchor */
}

/* Fallback kalau tidak cukup ruang — position-try-fallbacks */
.tooltip {
  position: absolute;
  position-anchor: --anchor;
  position-area: top center;
  position-try-fallbacks:
    bottom center,   /* coba di bawah kalau tidak muat di atas */
    right center,    /* coba di kanan */
    left center;     /* coba di kiri */
}

/* Tailwind belum punya utility built-in — pakai arbitrary:
   [position-area:bottom_center]
   [position-try-fallbacks:flip-block,flip-inline] */
            `}</Code>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>Dukungan browser masih terbatas</Callout.title>
                CSS Anchor Positioning (termasuk <IC>position-area</IC>) masih dalam
                proses adopsi — Chrome/Edge sudah support sejak versi 125+,
                Firefox dan Safari masih dalam pengembangan (per 2025).
                Gunakan <IC>@supports (anchor-name: --a)</IC> untuk feature detection,
                dan sediakan fallback positioning manual untuk browser lama.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ══════════════ 12 TW USAGE ══════════════════════════════════ */}
          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>
              Positioning di tailwind-styled-v4
              <H2.anchor href="#tw-usage">#</H2.anchor>
            </H2>

            <Code file="components.tsx">{`
import { tw } from "tailwind-styled-v4"

// Card dengan badge — relative + absolute pattern
const ProductCard = tw.article({
  base: "relative rounded-xl border bg-white overflow-hidden",
  sub: {
    badge: "absolute top-2 right-2 z-10 px-2 py-1 rounded-full bg-rose-500 text-white text-xs font-bold",
    image: "w-full aspect-square object-cover",
  },
})

// Sticky navbar
const Navbar = tw.nav({
  base: "sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md",
})

// Modal overlay — variants untuk show/hide
const Overlay = tw.div({
  base: "fixed inset-0 z-50 bg-black/50 flex items-center justify-center transition-opacity",
  states: {
    hidden: "opacity-0 pointer-events-none",
  },
})

// Toast notification — fixed corner
const Toast = tw.div({
  base: "fixed bottom-4 right-4 z-50 rounded-xl bg-gray-900 text-white px-4 py-3 shadow-xl",
  variants: {
    type: {
      success: "border-l-4 border-emerald-400",
      error:   "border-l-4 border-red-400",
    },
  },
})

// Dropdown — absolute relatif ke trigger
const Dropdown = tw.div({
  base: "relative inline-block",
  sub: {
    menu: "absolute top-full left-0 mt-1 z-20 rounded-xl bg-white border shadow-lg min-w-48",
  },
})
            `}</Code>
          </Section>

          <Divider />

          {/* ══════════════ 13 EXERCISE ══════════════════════════════════ */}
          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>
              Latihan
              <H2.anchor href="#exercise">#</H2.anchor>
            </H2>

            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Badge notification</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat <IC>tw.button</IC> dengan ikon dan badge angka di pojok kanan atas.</p>
                <p>Parent harus <IC>relative</IC>, badge <IC>absolute</IC> dengan <IC>-top-2 -right-2</IC>.</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Navbar sticky dengan shadow saat scroll</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat <IC>tw.nav</IC> dengan <IC>sticky top-0</IC>. Tambahkan <IC>states</IC> untuk shadow yang muncul saat halaman discroll (gunakan scroll listener untuk toggle state).</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Modal dengan stacking context yang benar</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat modal dengan overlay <IC>fixed inset-0</IC> dan konten modal di tengah.</p>
                <p>Pastikan z-index modal selalu menang dari elemen lain — tambahkan <IC>isolation: isolate</IC> di body/root untuk debug kalau ada konflik stacking context.</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 4 — Debug containing block</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat <IC>tw.div</IC> parent TANPA <IC>position</IC>, lalu child <IC>absolute</IC> dengan <IC>top-0 right-0</IC>.</p>
                <p>Inspect di DevTools — perhatikan child "lompat" ke viewport. Fix dengan menambahkan <IC>relative</IC> ke parent.</p>
              </ExerciseCard.body>
            </ExerciseCard>

            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 5 — Image carousel dengan scroll snap</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat carousel horizontal dengan <IC>tw.div</IC> container <IC>snap-x snap-mandatory overflow-x-auto</IC> dan setiap slide <IC>snap-center</IC>.</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          {/* Prev/Next */}
          <PageNav>
            <NavBtn href="/learn/dasar-css/normal-flow" dir="prev">
              <NavBtn.hint>← Previous</NavBtn.hint>
              <NavBtn.label>Normal Flow</NavBtn.label>
            </NavBtn>
            <NavBtn href="/learn/dasar-css/flexbox" dir="next">
              <NavBtn.hint>Next →</NavBtn.hint>
              <NavBtn.label>Flexbox</NavBtn.label>
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
