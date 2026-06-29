/**
 * Belajar CSS Layout — Gaya Laracasts
 * Menggunakan tailwind-styled-v4
 *
 * - Zero style={} untuk structural layout
 * - liveToken() + tokenRef() yang benar untuk dynamic values
 * - variants untuk nilai terbatas (flex-direction, justify, dll)
 * - style={} hanya untuk truly arbitrary values (hex color dari picker)
 *
 * Drop ke: examples/next-js-app/src/app/belajar/page.tsx
 */

"use client"

import { useState } from "react"
import { tw, cv } from "tailwind-styled-v4"
import { liveToken, tokenRef, createUseTokens } from "tailwind-styled-v4/runtime"

// ─────────────────────────────────────────────────────────────────────────────
// Live tokens — dynamic pixel values dari slider
// tokenRef("box-margin") → "var(--tw-token-box-margin)"
// ─────────────────────────────────────────────────────────────────────────────

const boxTokens = liveToken({
  "box-margin":  "24px",
  "box-padding": "16px",
  "box-border":  "4px",
})

const progressToken = liveToken({
  "progress-width": "0%",
})

// createUseTokens() dipanggil tanpa argumen — subscribe ke global engine
const useTokens = createUseTokens()

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
  base: "max-w-5xl mx-auto px-4 h-full flex items-center justify-between",
})

const Logo = tw.strong({
  base: "text-sm font-bold tracking-tight flex items-center gap-2",
})

const LogoBadge = tw.span({
  base: "text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)] text-white",
})

const ProgressTrack = tw.div({
  base: "h-0.5 bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]",
})

// tokenRef("progress-width") → "var(--tw-token-progress-width)"
// Tailwind arbitrary value: w-[var(--tw-token-progress-width)]
const ProgressFill = tw.div({
  base: `h-full bg-[var(--accent)] transition-all duration-500 ease-out w-[${tokenRef("progress-width")}]`,
})

const ProgressLabel = tw.span({
  base: "text-xs text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]",
})

const Body = tw.div({
  base: "max-w-5xl mx-auto px-4 py-10 flex gap-8",
})

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────

const Sidebar = tw.aside({
  base: "hidden lg:block w-56 shrink-0 sticky top-16 h-fit",
})

const SidebarLabel = tw.p({
  base: "text-[10px] font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--foreground)_35%,transparent)] px-3 mb-2",
})

const SidebarItem = tw.button({
  base: "w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 mb-0.5",
  variants: {
    active: {
      true:  "bg-[var(--accent)] text-white",
      false: "text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-[var(--foreground)]",
    },
  },
  defaultVariants: { active: "false" },
})

const SidebarBullet = tw.span({
  base: "w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold shrink-0 transition-all",
  variants: {
    state: {
      done:   "bg-emerald-500 border-emerald-500 text-white",
      active: "border-white text-white",
      idle:   "border-[color-mix(in_srgb,var(--foreground)_25%,transparent)] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]",
    },
  },
  defaultVariants: { state: "idle" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Content
// ─────────────────────────────────────────────────────────────────────────────

const Content = tw.main({
  base: "flex-1 min-w-0 space-y-16",
})

const Chapter = tw.section({
  base: "scroll-mt-20",
})

const ChapterHeader = tw.div({
  base: "flex items-start gap-4 mb-6",
  sub: {
    num:        "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold bg-[var(--accent)] text-white",
    meta:       "flex-1 min-w-0",
    "h2:title": "text-xl font-bold tracking-tight",
    "p:sub":    "text-sm text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] mt-0.5",
  },
})

const Divider = tw.hr({
  base: "border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]",
})

// ─────────────────────────────────────────────────────────────────────────────
// Content primitives
// ─────────────────────────────────────────────────────────────────────────────

const ConceptCard = tw.div({
  base: `
    rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]
    bg-[var(--surface)] p-5 mb-5 text-sm leading-7
    text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]
  `,
  sub: {
    "p:title": "font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2",
  },
})

const CodeWrap = tw.div({
  base: "rounded-xl overflow-hidden border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] my-4",
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

const Callout = tw.div({
  base: "rounded-xl border px-4 py-3 my-4 text-sm leading-relaxed flex gap-3",
  variants: {
    type: {
      note:    "bg-blue-50 border-blue-200 text-blue-900",
      tip:     "bg-emerald-50 border-emerald-200 text-emerald-900",
      warning: "bg-amber-50 border-amber-200 text-amber-900",
      php:     "bg-violet-50 border-violet-200 text-violet-900",
    },
  },
  defaultVariants: { type: "note" },
  sub: {
    icon:    "text-base shrink-0 mt-0.5",
    content: "flex-1",
  },
})

const PreviewBox = tw.div({
  base: `
    rounded-xl border-2 border-dashed
    border-[color-mix(in_srgb,var(--accent)_30%,transparent)]
    bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]
    p-6 my-5
  `,
  sub: {
    "p:label": "text-[10px] font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--accent)_60%,transparent)] mb-4",
  },
})

const ExerciseCard = tw.div({
  base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)] overflow-hidden my-5",
  sub: {
    header: "flex items-center gap-2 px-4 py-3 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]",
    title:  "text-xs font-semibold",
    body:   "p-4 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)] leading-relaxed",
  },
})

const IC = tw.code({
  base: "px-1.5 py-0.5 rounded text-[11px] font-mono bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]",
})

const DoneButton = tw.button({
  base: "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
  variants: {
    done: {
      true:  "bg-emerald-100 text-emerald-700 cursor-default",
      false: "bg-[var(--accent)] text-white hover:opacity-90",
    },
  },
  defaultVariants: { done: "false" },
})

const FootRow = tw.div({
  base: "flex justify-end mt-4",
})

// ─────────────────────────────────────────────────────────────────────────────
// Playground primitives
// ─────────────────────────────────────────────────────────────────────────────

const PlaygroundWrap = tw.div({
  base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5",
  sub: {
    controls:  "p-4 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] space-y-4",
    "p:label": "text-[10px] font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--foreground)_35%,transparent)]",
    codeline:  "rounded-lg bg-[var(--surface)] border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] px-3 py-2 font-mono text-xs text-[var(--accent)] block",
  },
})

const ControlsGrid = tw.div({
  base: "grid sm:grid-cols-2 gap-4",
})

const ChipRow = tw.div({
  base: "space-y-1.5",
  sub: {
    "p:label": "text-[10px] font-semibold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]",
    chips:     "flex flex-wrap gap-1",
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

const SliderRow = tw.div({
  base: "space-y-1",
  sub: {
    header:    "flex justify-between text-xs",
    "span:lbl": "font-semibold",
    "span:val": "font-mono text-[color-mix(in_srgb,var(--foreground)_50%,transparent)]",
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Box model — layers pakai tokenRef() yang benar
// tokenRef("box-margin") → "var(--tw-token-box-margin)"
// ─────────────────────────────────────────────────────────────────────────────

const BoxCanvas = tw.div({
  base: "p-6 flex items-center justify-center min-h-52 bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]",
})

// p-[var(--tw-token-box-margin)] — Tailwind arbitrary value + CSS var
const BoxMarginLayer = tw.div({
  base: `
    bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl
    flex items-center justify-center relative
    p-[${tokenRef("box-margin")}]
  `,
  sub: {
    "span:label": "absolute top-1 left-2 text-[9px] font-bold text-blue-400 uppercase tracking-wider",
  },
})

const BoxBorderLayer = tw.div({
  base: `
    bg-orange-100 rounded-lg flex items-center justify-center
    border-orange-400 border-solid
    border-[length:${tokenRef("box-border")}]
  `,
})

const BoxPaddingLayer = tw.div({
  base: `
    bg-green-50 rounded flex items-center justify-center relative
    p-[${tokenRef("box-padding")}]
  `,
  sub: {
    "span:label": "absolute top-0.5 left-1 text-[8px] font-bold text-green-500 uppercase",
  },
})

const BoxContent = tw.div({
  base: "bg-white border border-gray-200 rounded px-4 py-3 text-xs font-mono text-gray-600 whitespace-nowrap shadow-sm",
  sub: {
    "span:meta": "text-[10px] text-gray-400",
  },
})

const BoxCodeLine = tw.div({
  base: "px-4 pb-3 pt-2 border-t border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] bg-[var(--surface)]",
  sub: {
    "pre:code": "text-[11px] font-mono text-[var(--accent)] p-0 m-0",
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Flexbox playground — variants untuk nilai terbatas
// ─────────────────────────────────────────────────────────────────────────────

const FlexCanvas = tw.div({
  base: "p-6 min-h-40 bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] flex gap-3",
  variants: {
    dir: {
      row:         "flex-row",
      "row-reverse": "flex-row-reverse",
      col:         "flex-col",
      "col-reverse": "flex-col-reverse",
    },
    justify: {
      start:   "justify-start",
      center:  "justify-center",
      end:     "justify-end",
      between: "justify-between",
      around:  "justify-around",
      evenly:  "justify-evenly",
    },
    align: {
      start:   "items-start",
      center:  "items-center",
      end:     "items-end",
      stretch: "items-stretch",
    },
    wrap: {
      wrap:   "flex-wrap",
      nowrap: "flex-nowrap",
    },
  },
  defaultVariants: { dir: "row", justify: "start", align: "center", wrap: "nowrap" },
})

const DemoItem = tw.div({
  base: "flex items-center justify-center rounded-lg font-bold text-white text-sm w-14 h-14 select-none",
  variants: {
    color: {
      "0": "bg-blue-500",
      "1": "bg-violet-500",
      "2": "bg-pink-500",
      "3": "bg-amber-500",
      "4": "bg-teal-500",
    },
  },
  defaultVariants: { color: "0" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Grid playground — variants untuk jumlah kolom/baris terbatas
// gap pakai tokenRef karena nilainya dinamis dari slider
// ─────────────────────────────────────────────────────────────────────────────

const gridGapToken = liveToken({ "grid-gap": "16px" })

const GridCanvas = tw.div({
  base: `grid bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] p-6 gap-[${tokenRef("grid-gap")}]`,
  variants: {
    cols: {
      "1": "grid-cols-1",
      "2": "grid-cols-2",
      "3": "grid-cols-3",
      "4": "grid-cols-4",
      "5": "grid-cols-5",
      "6": "grid-cols-6",
    },
    rows: {
      "1": "grid-rows-1",
      "2": "grid-rows-2",
      "3": "grid-rows-3",
      "4": "grid-rows-4",
    },
  },
  defaultVariants: { cols: "3", rows: "2" },
})

const GridItem = tw.div({
  base: "h-14 rounded-lg flex items-center justify-center font-bold text-white text-sm",
  variants: {
    color: {
      "0": "bg-blue-400",
      "1": "bg-violet-400",
      "2": "bg-pink-400",
      "3": "bg-amber-400",
      "4": "bg-teal-400",
      "5": "bg-rose-400",
    },
  },
  defaultVariants: { color: "0" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Positioning
// ─────────────────────────────────────────────────────────────────────────────

const PosTabRow = tw.div({ base: "flex flex-wrap gap-1.5 mb-3" })

const PosTab = tw.button({
  base: "px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all",
  variants: {
    active: {
      true:  "bg-[var(--accent)] text-white border-[var(--accent)]",
      false: "border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
    },
  },
  defaultVariants: { active: "false" },
})

const PosInfo = tw.div({
  base: "rounded-xl bg-[var(--surface)] border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] p-4 space-y-2 mt-3",
  sub: {
    "p:title":   "text-sm font-semibold",
    "p:desc":    "text-sm text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]",
    "p:analogy": "text-xs text-violet-600 bg-violet-50 rounded-lg px-3 py-2 border border-violet-100 flex gap-2",
  },
})

const PosCanvas = tw.div({
  base: `
    rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)]
    bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)]
    p-4 overflow-hidden mt-3 relative h-44
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
      static:   "",
      relative: "relative top-4 left-4",
      absolute: "absolute top-2 right-2",
      fixed:    "fixed top-16 right-4 z-50 shadow-xl",
      sticky:   "sticky top-2",
    },
  },
  defaultVariants: { pos: "static" },
})

// ─────────────────────────────────────────────────────────────────────────────
// Misc
// ─────────────────────────────────────────────────────────────────────────────

const BpRow = tw.div({ base: "flex items-center gap-3 text-xs" })

const CompletionBanner = tw.div({
  base: "mt-8 rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-2",
  sub: {
    "p:emoji": "text-2xl",
    "p:title": "font-bold text-emerald-800",
    "p:desc":  "text-sm text-emerald-700",
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Chapter data
// ─────────────────────────────────────────────────────────────────────────────

const CHAPTERS = [
  { id: "box-model",   num: "01", title: "Box Model",   sub: "Fondasi semua layout" },
  { id: "normal-flow", num: "02", title: "Normal Flow", sub: "Block vs Inline" },
  { id: "positioning", num: "03", title: "Positioning", sub: "Static → sticky" },
  { id: "flexbox",     num: "04", title: "Flexbox",     sub: "Layout 1 dimensi" },
  { id: "grid",        num: "05", title: "CSS Grid",    sub: "Layout 2 dimensi" },
  { id: "responsive",  num: "06", title: "Responsive",  sub: "Media & container queries" },
]

type PosType = "static" | "relative" | "absolute" | "fixed" | "sticky"

const POS_INFO: Record<PosType, { desc: string; analogy: string }> = {
  static:   { desc: "Default. Mengikuti Normal Flow. top/left tidak berpengaruh.", analogy: "Seperti variabel PHP biasa — ikut urutan eksekusi." },
  relative: { desc: "Masih di Normal Flow, bisa digeser. Jadi anchor untuk absolute child.", analogy: "Seperti function — masih akses scope luar tapi punya ruang sendiri." },
  absolute: { desc: "Keluar dari Normal Flow. Relatif ke ancestor terdekat yang bukan static.", analogy: "Seperti static property dalam class — tidak terikat instance." },
  fixed:    { desc: "Relatif ke browser window. Tidak ikut scroll.", analogy: "Seperti global variable — selalu ada di mana-mana." },
  sticky:   { desc: "Ikut scroll sampai top tertentu, lalu nempel.", analogy: "Seperti singleton — ada di tempatnya sampai kondisi terpenuhi." },
}

const PX_STEPS = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48]
const GAP_STEPS = [0, 4, 8, 12, 16, 20, 24, 32]

// ─────────────────────────────────────────────────────────────────────────────
// Code block component
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
// Box Model Demo
// ─────────────────────────────────────────────────────────────────────────────

function BoxModelDemo() {
  const tokens = useTokens()
  const margin  = tokens["box-margin"]  ?? "24px"
  const padding = tokens["box-padding"] ?? "16px"
  const border  = tokens["box-border"]  ?? "4px"

  const mIdx = PX_STEPS.indexOf(parseInt(margin))
  const pIdx = PX_STEPS.indexOf(parseInt(padding))
  const bIdx = PX_STEPS.indexOf(parseInt(border))

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Geser slider — lihat box model berubah</PlaygroundWrap.label>
        {([
          { key: "box-margin",  label: "margin",  idx: mIdx,  color: "text-blue-600" },
          { key: "box-padding", label: "padding", idx: pIdx,  color: "text-green-600" },
          { key: "box-border",  label: "border",  idx: bIdx,  color: "text-orange-600" },
        ] as const).map(({ key, label, idx, color }) => (
          <SliderRow key={key}>
            <SliderRow.header>
              <SliderRow.lbl className={color}>{label}</SliderRow.lbl>
              <SliderRow.val>{PX_STEPS[idx < 0 ? 0 : idx]}px</SliderRow.val>
            </SliderRow.header>
            <input
              type="range" min={0} max={PX_STEPS.length - 1}
              value={idx < 0 ? 0 : idx}
              onChange={e => boxTokens.set(key, `${PX_STEPS[Number(e.target.value)]}px`)}
              className="w-full accent-[var(--accent)]"
            />
          </SliderRow>
        ))}
      </PlaygroundWrap.controls>

      <BoxCanvas>
        <BoxMarginLayer>
          <BoxMarginLayer.label>margin</BoxMarginLayer.label>
          <BoxBorderLayer>
            <BoxPaddingLayer>
              <BoxPaddingLayer.label>padding</BoxPaddingLayer.label>
              <BoxContent>
                Content
                <br />
                <BoxContent.meta>p:{padding} · b:{border} · m:{margin}</BoxContent.meta>
              </BoxContent>
            </BoxPaddingLayer>
          </BoxBorderLayer>
        </BoxMarginLayer>
      </BoxCanvas>

      <BoxCodeLine>
        <BoxCodeLine.code>{`.box { margin: ${margin}; padding: ${padding}; border: ${border} solid orange; }`}</BoxCodeLine.code>
      </BoxCodeLine>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Positioning Demo
// ─────────────────────────────────────────────────────────────────────────────

function PositioningDemo() {
  const [active, setActive] = useState<PosType>("static")
  return (
    <div>
      <PosTabRow>
        {(["static", "relative", "absolute", "fixed", "sticky"] as PosType[]).map(p => (
          <PosTab key={p} active={active === p ? "true" : "false"} onClick={() => setActive(p)}>
            position: {p}
          </PosTab>
        ))}
      </PosTabRow>
      <PosInfo>
        <PosInfo.title>position: {active}</PosInfo.title>
        <PosInfo.desc>{POS_INFO[active].desc}</PosInfo.desc>
        <PosInfo.analogy><span>🐘</span>{POS_INFO[active].analogy}</PosInfo.analogy>
      </PosInfo>
      <PosCanvas>
        <PosCanvas.inner>
          <PosSibling>div 1</PosSibling>
          <PosElement pos={active}>{active}</PosElement>
          <PosSibling>div 3</PosSibling>
        </PosCanvas.inner>
      </PosCanvas>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Flexbox Playground — semua pakai variants tw
// ─────────────────────────────────────────────────────────────────────────────

type FlexDir     = "row" | "row-reverse" | "col" | "col-reverse"
type FlexJustify = "start" | "center" | "end" | "between" | "around" | "evenly"
type FlexAlign   = "start" | "center" | "end" | "stretch"
type FlexWrap    = "wrap" | "nowrap"

const CSS_LABELS: Record<string, string> = {
  row: "row", "row-reverse": "row-reverse", col: "column", "col-reverse": "column-reverse",
  start: "flex-start", center: "center", end: "flex-end",
  between: "space-between", around: "space-around", evenly: "space-evenly",
  stretch: "stretch", wrap: "wrap", nowrap: "nowrap",
}

function FlexPlayground() {
  const [dir,     setDir]     = useState<FlexDir>("row")
  const [justify, setJustify] = useState<FlexJustify>("start")
  const [align,   setAlign]   = useState<FlexAlign>("center")
  const [wrap,    setWrap]    = useState<FlexWrap>("nowrap")

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Playground — ubah nilai, lihat hasilnya langsung</PlaygroundWrap.label>
        <ControlsGrid>
          <ChipRow>
            <ChipRow.label>flex-direction</ChipRow.label>
            <ChipRow.chips>
              {(["row", "row-reverse", "col", "col-reverse"] as FlexDir[]).map(v => (
                <Chip key={v} active={dir === v ? "true" : "false"} onClick={() => setDir(v)}>{v}</Chip>
              ))}
            </ChipRow.chips>
          </ChipRow>
          <ChipRow>
            <ChipRow.label>justify-content</ChipRow.label>
            <ChipRow.chips>
              {(["start", "center", "end", "between", "around", "evenly"] as FlexJustify[]).map(v => (
                <Chip key={v} active={justify === v ? "true" : "false"} onClick={() => setJustify(v)}>{v}</Chip>
              ))}
            </ChipRow.chips>
          </ChipRow>
          <ChipRow>
            <ChipRow.label>align-items</ChipRow.label>
            <ChipRow.chips>
              {(["start", "center", "end", "stretch"] as FlexAlign[]).map(v => (
                <Chip key={v} active={align === v ? "true" : "false"} onClick={() => setAlign(v)}>{v}</Chip>
              ))}
            </ChipRow.chips>
          </ChipRow>
          <ChipRow>
            <ChipRow.label>flex-wrap</ChipRow.label>
            <ChipRow.chips>
              {(["nowrap", "wrap"] as FlexWrap[]).map(v => (
                <Chip key={v} active={wrap === v ? "true" : "false"} onClick={() => setWrap(v)}>{v}</Chip>
              ))}
            </ChipRow.chips>
          </ChipRow>
        </ControlsGrid>
        <PlaygroundWrap.codeline>
          {`display: flex; flex-direction: ${CSS_LABELS[dir]}; justify-content: ${CSS_LABELS[justify]}; align-items: ${CSS_LABELS[align]}; flex-wrap: ${wrap};`}
        </PlaygroundWrap.codeline>
      </PlaygroundWrap.controls>

      {/* FlexCanvas variants — pure Tailwind utilities */}
      <FlexCanvas dir={dir} justify={justify} align={align} wrap={wrap}>
        {(["0","1","2","3","4"] as const).map((c, i) => (
          <DemoItem key={c} color={c}>{i + 1}</DemoItem>
        ))}
      </FlexCanvas>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Grid Playground
// ─────────────────────────────────────────────────────────────────────────────

function GridPlayground() {
  const tokens = useTokens()
  const [cols, setCols] = useState(3)
  const [rows, setRows] = useState(2)

  const gapPx  = parseInt(tokens["grid-gap"] ?? "16")
  const gapIdx = GAP_STEPS.indexOf(gapPx)
  const items  = Array.from({ length: cols * rows }, (_, i) => i)

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Grid Playground</PlaygroundWrap.label>
        <ControlsGrid>
          {([
            { label: "columns", val: cols, min: 1, max: 6, set: setCols },
            { label: "rows",    val: rows, min: 1, max: 4, set: setRows },
          ]).map(({ label, val, min, max, set }) => (
            <SliderRow key={label}>
              <SliderRow.header>
                <SliderRow.lbl className="font-mono text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{label}</SliderRow.lbl>
                <SliderRow.val className="font-bold text-[var(--accent)]">{val}</SliderRow.val>
              </SliderRow.header>
              <input type="range" min={min} max={max} value={val}
                onChange={e => set(Number(e.target.value))}
                className="w-full accent-[var(--accent)]" />
            </SliderRow>
          ))}
          <SliderRow>
            <SliderRow.header>
              <SliderRow.lbl className="font-mono text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">gap</SliderRow.lbl>
              <SliderRow.val className="font-bold text-[var(--accent)]">{gapPx}px</SliderRow.val>
            </SliderRow.header>
            <input type="range" min={0} max={GAP_STEPS.length - 1}
              value={gapIdx < 0 ? 0 : gapIdx}
              onChange={e => gridGapToken.set("grid-gap", `${GAP_STEPS[Number(e.target.value)]}px`)}
              className="w-full accent-[var(--accent)]" />
          </SliderRow>
        </ControlsGrid>
        <PlaygroundWrap.codeline>
          {`display: grid; grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr); gap: ${gapPx}px;`}
        </PlaygroundWrap.codeline>
      </PlaygroundWrap.controls>

      {/* GridCanvas: cols/rows via variants, gap via tokenRef */}
      <GridCanvas cols={String(cols) as any} rows={String(rows) as any}>
        {items.map(i => (
          <GridItem key={i} color={String(i % 6) as any}>{i + 1}</GridItem>
        ))}
      </GridCanvas>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function BelajarCSSLayout() {
  const [activeChapter, setActiveChapter] = useState("box-model")
  const [done, setDone] = useState<Set<string>>(new Set())

  function markDone(id: string) {
    const next = new Set([...done, id])
    setDone(next)
    progressToken.set("progress-width", `${Math.round((next.size / CHAPTERS.length) * 100)}%`)
  }

  function scrollTo(id: string) {
    setActiveChapter(id)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <Page>
      <TopBar>
        <TopBarInner>
          <Logo>CSS Layout <LogoBadge>Gaya Laracasts</LogoBadge></Logo>
          <ProgressLabel>{done.size}/{CHAPTERS.length} selesai</ProgressLabel>
        </TopBarInner>
        <ProgressTrack><ProgressFill /></ProgressTrack>
      </TopBar>

      <Body>
        <Sidebar>
          <SidebarLabel>Chapters</SidebarLabel>
          {CHAPTERS.map(ch => {
            const isDone   = done.has(ch.id)
            const isActive = activeChapter === ch.id
            return (
              <SidebarItem key={ch.id} active={isActive ? "true" : "false"} onClick={() => scrollTo(ch.id)}>
                <SidebarBullet state={isDone ? "done" : isActive ? "active" : "idle"}>
                  {isDone ? "✓" : ch.num}
                </SidebarBullet>
                {ch.title}
              </SidebarItem>
            )
          })}
        </Sidebar>

        <Content>

          {/* ══════════════════ 01 BOX MODEL ══════════════════════════════ */}
          <Chapter id="box-model" onClick={() => setActiveChapter("box-model")}>
            <ChapterHeader>
              <ChapterHeader.num>01</ChapterHeader.num>
              <ChapterHeader.meta>
                <ChapterHeader.title>Box Model</ChapterHeader.title>
                <ChapterHeader.sub>Fondasi semua layout CSS — setiap elemen adalah sebuah kotak</ChapterHeader.sub>
              </ChapterHeader.meta>
            </ChapterHeader>

            <Callout type="php">
              <Callout.icon>🐘</Callout.icon>
              <Callout.content>
                Di PHP, sebelum pakai array atau OOP, kamu harus ngerti tipe data dasar dulu.
                Di CSS, Box Model adalah "tipe data dasar"-nya — setiap elemen tanpa terkecuali adalah kotak rectangular.
              </Callout.content>
            </Callout>

            <ConceptCard>
              <ConceptCard.title>🎁 Anatomi sebuah Box</ConceptCard.title>
              <IC>content</IC> — isi sebenarnya (teks, gambar, child elements)<br />
              <IC>padding</IC> — jarak antara content dan border (masih kena background)<br />
              <IC>border</IC> — garis tepi elemen<br />
              <IC>margin</IC> — jarak ke elemen lain di luar (transparan)
            </ConceptCard>

            <BoxModelDemo />

            <Code file="box-model.css">{`
.card {
  padding: 16px;            /* space dalam border */
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  margin: 8px;              /* space luar border */
  box-sizing: border-box;   /* width include padding + border */
}
            `}</Code>

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                By default, <IC>width</IC> hanya menghitung content — padding dan border ditambahkan ke luar.
                Pakai <IC>box-sizing: border-box</IC>. Tailwind sudah set ini secara global.
              </Callout.content>
            </Callout>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                Buka DevTools (F12) → inspect elemen → lihat diagram box model di panel kanan.
                Cara paling cepat memahami margin/padding/border dari elemen yang sudah ada.
              </Callout.content>
            </Callout>

            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan — Box Model</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                Buat card dengan <IC>tw.div{"({ base: \"...\" })"}</IC>:<br /><br />
                1. Padding 24px · 2. Border 1px solid abu-abu · 3. Border radius 12px · 4. Margin bottom 16px<br />
                Inspect di DevTools dan lihat diagram box model-nya.
              </ExerciseCard.body>
            </ExerciseCard>

            <FootRow>
              <DoneButton done={done.has("box-model") ? "true" : "false"} onClick={() => markDone("box-model")}>
                {done.has("box-model") ? "✓ Selesai" : "Tandai Selesai →"}
              </DoneButton>
            </FootRow>
          </Chapter>

          <Divider />

          {/* ══════════════════ 02 NORMAL FLOW ════════════════════════════ */}
          <Chapter id="normal-flow" onClick={() => setActiveChapter("normal-flow")}>
            <ChapterHeader>
              <ChapterHeader.num>02</ChapterHeader.num>
              <ChapterHeader.meta>
                <ChapterHeader.title>Normal Flow</ChapterHeader.title>
                <ChapterHeader.sub>Cara browser me-layout elemen secara default</ChapterHeader.sub>
              </ChapterHeader.meta>
            </ChapterHeader>

            <Callout type="php">
              <Callout.icon>🐘</Callout.icon>
              <Callout.content>
                Seperti PHP eksekusi kode dari atas ke bawah secara default — CSS punya Normal Flow.
                Kamu baru keluar dari Normal Flow kalau pakai Flexbox, Grid, atau Positioning.
              </Callout.content>
            </Callout>

            <ConceptCard>
              <ConceptCard.title>📦 Block vs Inline vs Inline-block</ConceptCard.title>
              <strong>Block</strong> — full lebar parent, selalu mulai baris baru: <IC>div</IC>, <IC>p</IC>, <IC>h1</IC>, <IC>section</IC><br /><br />
              <strong>Inline</strong> — selebar isinya, mengalir bersama teks, tidak bisa set width/height: <IC>span</IC>, <IC>a</IC>, <IC>strong</IC><br /><br />
              <strong>Inline-block</strong> — mengalir inline tapi bisa set width/height seperti block.
            </ConceptCard>

            <PreviewBox>
              <PreviewBox.label>Live Preview — Block vs Inline</PreviewBox.label>
              <div className="space-y-1.5 text-xs">
                <div className="bg-blue-100 border border-blue-300 px-3 py-2 rounded font-mono text-blue-800">{"<div>"} — BLOCK: full lebar, baris baru</div>
                <div className="bg-blue-100 border border-blue-300 px-3 py-2 rounded font-mono text-blue-800">{"<div>"} — BLOCK: langsung di bawah</div>
                <p className="text-gray-500">
                  Teks dengan{" "}
                  <span className="bg-green-100 border border-green-300 px-1 rounded font-mono text-green-800">{"<span>"} inline</span>
                  {" "}mengalir{" "}
                  <span className="bg-green-100 border border-green-300 px-1 rounded font-mono text-green-800">bersama</span>
                  {" "}teks.
                </p>
                <div className="flex gap-2 flex-wrap">
                  {["A","B","C"].map(l => (
                    <div key={l} className="inline-block bg-amber-100 border border-amber-300 px-3 py-1.5 rounded font-mono text-amber-800">inline-block {l}</div>
                  ))}
                </div>
              </div>
            </PreviewBox>

            <Code file="display.css">{`
.block   { display: block; }        /* full lebar, baris baru */
.inline  { display: inline; }       /* ikut teks, tidak bisa set width/height */
.i-block { display: inline-block; } /* ikut teks, bisa set width/height */
.hidden  { display: none; }         /* hilang dari layout */
            `}</Code>

            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan — Normal Flow</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                Buat badge dengan <IC>tw.span</IC>. Letakkan 3 badge dalam satu paragraf dan perhatikan mereka mengalir bersama teks.
                Coba ganti ke <IC>block</IC> dan lihat perbedaannya.
              </ExerciseCard.body>
            </ExerciseCard>

            <FootRow>
              <DoneButton done={done.has("normal-flow") ? "true" : "false"} onClick={() => markDone("normal-flow")}>
                {done.has("normal-flow") ? "✓ Selesai" : "Tandai Selesai →"}
              </DoneButton>
            </FootRow>
          </Chapter>

          <Divider />

          {/* ══════════════════ 03 POSITIONING ════════════════════════════ */}
          <Chapter id="positioning" onClick={() => setActiveChapter("positioning")}>
            <ChapterHeader>
              <ChapterHeader.num>03</ChapterHeader.num>
              <ChapterHeader.meta>
                <ChapterHeader.title>Positioning</ChapterHeader.title>
                <ChapterHeader.sub>Keluar dari Normal Flow dan kontrol posisi secara eksplisit</ChapterHeader.sub>
              </ChapterHeader.meta>
            </ChapterHeader>

            <Callout type="php">
              <Callout.icon>🐘</Callout.icon>
              <Callout.content>
                Seperti PHP punya scope variabel — CSS punya "context" untuk positioning.
                Elemen <IC>absolute</IC> mencari ancestor <IC>relative</IC> terdekat, mirip cara PHP mencari variabel di scope terdekat.
              </Callout.content>
            </Callout>

            <PositioningDemo />

            <Code file="positioning.tsx">{`
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

            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <IC>z-index</IC> hanya berlaku untuk elemen yang punya <IC>position</IC> selain static.
                Kalau z-index tidak bekerja, pastikan elemen punya <IC>relative</IC>, <IC>absolute</IC>, <IC>fixed</IC>, atau <IC>sticky</IC>.
              </Callout.content>
            </Callout>

            <FootRow>
              <DoneButton done={done.has("positioning") ? "true" : "false"} onClick={() => markDone("positioning")}>
                {done.has("positioning") ? "✓ Selesai" : "Tandai Selesai →"}
              </DoneButton>
            </FootRow>
          </Chapter>

          <Divider />

          {/* ══════════════════ 04 FLEXBOX ════════════════════════════════ */}
          <Chapter id="flexbox" onClick={() => setActiveChapter("flexbox")}>
            <ChapterHeader>
              <ChapterHeader.num>04</ChapterHeader.num>
              <ChapterHeader.meta>
                <ChapterHeader.title>Flexbox</ChapterHeader.title>
                <ChapterHeader.sub>Layout 1 dimensi — row atau column</ChapterHeader.sub>
              </ChapterHeader.meta>
            </ChapterHeader>

            <Callout type="php">
              <Callout.icon>🐘</Callout.icon>
              <Callout.content>
                Flexbox itu seperti <IC>array_map()</IC> di PHP — kamu punya array item dan kontrol bagaimana mereka di-render dalam satu baris atau kolom.
                Flexbox untuk komponen, Grid untuk halaman besar.
              </Callout.content>
            </Callout>

            <ConceptCard>
              <ConceptCard.title>🧲 2 Axis Flexbox</ConceptCard.title>
              <strong>Main axis</strong> — arah utama item berjajar. Dikontrol <IC>flex-direction</IC>.<br /><br />
              <strong>Cross axis</strong> — tegak lurus main axis.<br /><br />
              <IC>justify-content</IC> → distribusi di main axis &nbsp;|&nbsp; <IC>align-items</IC> → alignment di cross axis
            </ConceptCard>

            <FlexPlayground />

            <Code file="flex-examples.tsx">{`
// Navbar: logo kiri, links kanan
const Navbar = tw.nav({
  base: "flex items-center justify-between px-6 h-14 border-b",
  sub: {
    brand: "font-bold text-lg",
    links: "flex items-center gap-4",
  },
})

// Sidebar + konten: sidebar fixed, konten mengisi sisa
const Layout = tw.div({
  base: "flex gap-4",
  sub: {
    sidebar: "w-60 shrink-0",
    content: "flex-1 min-w-0", // flex-1 = ambil sisa space
  },
})
            `}</Code>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                <IC>flex-1</IC> membuat item mengisi semua space yang tersisa.
                Sangat berguna untuk layout "sidebar kiri, konten kanan mengisi sisa".
              </Callout.content>
            </Callout>

            <FootRow>
              <DoneButton done={done.has("flexbox") ? "true" : "false"} onClick={() => markDone("flexbox")}>
                {done.has("flexbox") ? "✓ Selesai" : "Tandai Selesai →"}
              </DoneButton>
            </FootRow>
          </Chapter>

          <Divider />

          {/* ══════════════════ 05 GRID ═══════════════════════════════════ */}
          <Chapter id="grid" onClick={() => setActiveChapter("grid")}>
            <ChapterHeader>
              <ChapterHeader.num>05</ChapterHeader.num>
              <ChapterHeader.meta>
                <ChapterHeader.title>CSS Grid</ChapterHeader.title>
                <ChapterHeader.sub>Layout 2 dimensi — rows dan columns sekaligus</ChapterHeader.sub>
              </ChapterHeader.meta>
            </ChapterHeader>

            <Callout type="php">
              <Callout.icon>🐘</Callout.icon>
              <Callout.content>
                Grid itu seperti tabel database — kamu mendefinisikan kolom dan baris, lalu item otomatis masuk ke sel.
                Flexbox untuk satu baris, Grid untuk keseluruhan layout halaman.
              </Callout.content>
            </Callout>

            <ConceptCard>
              <ConceptCard.title>🗺️ Konsep Utama Grid</ConceptCard.title>
              <IC>grid-template-columns</IC> — mendefinisikan berapa kolom dan lebarnya<br /><br />
              <IC>grid-template-rows</IC> — mendefinisikan berapa baris dan tingginya<br /><br />
              <IC>gap</IC> — jarak antar sel<br /><br />
              Unit <IC>fr</IC> (fraction) — membagi space yang tersisa secara proporsional.
            </ConceptCard>

            <GridPlayground />

            <Code file="grid-examples.tsx">{`
// Halaman docs 3-column
const DocsLayout = tw.div({
  base: "grid grid-cols-[14rem_1fr_12rem] gap-8",
})

// Card grid — auto responsive tanpa media query
const CardGrid = tw.div({
  base: "grid [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] gap-6",
})

// Dashboard dengan area spanning
const Dashboard = tw.div({
  base: "grid grid-cols-12 gap-4",
  sub: {
    featured: "col-span-8",
    sidebar:  "col-span-4",
    full:     "col-span-12",
  },
})
            `}</Code>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                <IC>repeat(auto-fill, minmax(200px, 1fr))</IC> — kolom otomatis menyesuaikan jumlahnya berdasarkan lebar container.
                Responsive tanpa satu pun media query!
              </Callout.content>
            </Callout>

            <FootRow>
              <DoneButton done={done.has("grid") ? "true" : "false"} onClick={() => markDone("grid")}>
                {done.has("grid") ? "✓ Selesai" : "Tandai Selesai →"}
              </DoneButton>
            </FootRow>
          </Chapter>

          <Divider />

          {/* ══════════════════ 06 RESPONSIVE ════════════════════════════ */}
          <Chapter id="responsive" onClick={() => setActiveChapter("responsive")}>
            <ChapterHeader>
              <ChapterHeader.num>06</ChapterHeader.num>
              <ChapterHeader.meta>
                <ChapterHeader.title>Responsive Design</ChapterHeader.title>
                <ChapterHeader.sub>Media queries & container queries</ChapterHeader.sub>
              </ChapterHeader.meta>
            </ChapterHeader>

            <Callout type="php">
              <Callout.icon>🐘</Callout.icon>
              <Callout.content>
                Seperti PHP yang bisa <IC>if (php_sapi_name() === "cli")</IC> untuk detect environment —
                CSS punya <IC>@media</IC> untuk detect ukuran layar dan <IC>@container</IC> untuk ukuran parent element.
              </Callout.content>
            </Callout>

            <ConceptCard>
              <ConceptCard.title>📱 Media Query vs Container Query</ConceptCard.title>
              <strong>Media Query</strong> — kondisional berdasarkan ukuran <em>viewport</em>. Tailwind: <IC>sm:</IC> <IC>md:</IC> <IC>lg:</IC> <IC>xl:</IC><br /><br />
              <strong>Container Query</strong> — kondisional berdasarkan ukuran <em>parent element</em>. Lebih powerful untuk komponen reusable.
              Library ini support via property <IC>container</IC> di config.
            </ConceptCard>

            <Code file="responsive.tsx">{`
// Media query — berdasarkan viewport
const CardGrid = tw.div({
  base: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
})

// Container query — berdasarkan ukuran parent
const Card = tw.div({
  base: "p-4 flex flex-col",
  container: {
    sm: "flex-row",
    lg: "gap-6",
  },
  containerName: "card",
})

// Wrapper wajib punya @container
const CardWrapper = tw.div\`@container\`
            `}</Code>

            <PreviewBox>
              <PreviewBox.label>Breakpoints Tailwind (mobile-first)</PreviewBox.label>
              <div className="flex flex-col gap-2">
                {[
                  { bp: "sm:",  px: "640px",  desc: "Tablet kecil ke atas" },
                  { bp: "md:",  px: "768px",  desc: "Tablet ke atas" },
                  { bp: "lg:",  px: "1024px", desc: "Laptop ke atas" },
                  { bp: "xl:",  px: "1280px", desc: "Desktop ke atas" },
                  { bp: "2xl:", px: "1536px", desc: "Wide screen" },
                ].map(({ bp, px, desc }) => (
                  <BpRow key={bp}>
                    <IC>{bp}</IC>
                    <span className="font-mono text-[color-mix(in_srgb,var(--foreground)_50%,transparent)]">≥ {px}</span>
                    <span className="text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">— {desc}</span>
                  </BpRow>
                ))}
              </div>
            </PreviewBox>

            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                Tailwind adalah <strong>mobile-first</strong> — class tanpa prefix berlaku di semua ukuran,
                prefix seperti <IC>md:</IC> berlaku dari breakpoint itu ke atas.
              </Callout.content>
            </Callout>

            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan Final — Gabungkan Semuanya</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                Buat responsive card grid dengan <IC>tailwind-styled-v4</IC>:<br /><br />
                1. <IC>tw.div</IC> grid: 1 kolom mobile, 2 tablet, 3 desktop<br />
                2. <IC>tw.article</IC> card dengan sub: title, body, footer<br />
                3. Card pakai Box Model (padding, border, border-radius)<br />
                4. Footer pakai Flexbox <IC>justify-between</IC><br />
                5. Tambahkan <IC>container</IC> query agar layout berbeda di ukuran parent kecil
              </ExerciseCard.body>
            </ExerciseCard>

            <FootRow>
              <DoneButton done={done.has("responsive") ? "true" : "false"} onClick={() => markDone("responsive")}>
                {done.has("responsive") ? "✓ Selesai" : "Tandai Selesai →"}
              </DoneButton>
            </FootRow>

            {done.size === CHAPTERS.length && (
              <CompletionBanner>
                <CompletionBanner.emoji>🎉</CompletionBanner.emoji>
                <CompletionBanner.title>Semua chapter selesai!</CompletionBanner.title>
                <CompletionBanner.desc>
                  Box Model → Normal Flow → Positioning → Flexbox → Grid → Responsive.
                  Langkah berikutnya: <strong>CSS Architecture</strong> (BEM / CUBE CSS).
                </CompletionBanner.desc>
              </CompletionBanner>
            )}
          </Chapter>

        </Content>
      </Body>
    </Page>
  )
}
