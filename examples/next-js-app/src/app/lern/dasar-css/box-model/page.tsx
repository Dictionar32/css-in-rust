/**
 * Belajar CSS Layout — Gaya Laracasts
 * Menggunakan tailwind-styled-v4 — zero className, semua via tw API
 *
 * Drop ke: examples/next-js-app/src/app/belajar/page.tsx
 */

"use client";

import { useState } from "react";
import { tw, cv } from "tailwind-styled-v4";

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

const ProgressFill = tw.div({
  base: "h-full bg-[var(--accent)] transition-all duration-500 ease-out",
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
// Content area
// ─────────────────────────────────────────────────────────────────────────────

const Content = tw.main({
  base: "flex-1 min-w-0 space-y-16",
})

const Chapter = tw.section({
  base: "scroll-mt-20",
})

const ChapterHeader = tw.div({
  base: "flex items-start gap-4 mb-6",
})

const ChapterNum = tw.div({
  base: "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold bg-[var(--accent)] text-white",
})

const ChapterMeta = tw.div({ base: "flex-1 min-w-0" })

const ChapterTitle = tw.h2({
  base: "text-xl font-bold tracking-tight",
})

const ChapterSub = tw.p({
  base: "text-sm text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] mt-0.5",
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
})

const ConceptTitle = tw.p({
  base: "font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2",
})

const CodeWrap = tw.div({
  base: "rounded-xl overflow-hidden border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] my-4",
  sub: {
    header: "flex items-center justify-between px-4 py-2.5 bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]",
    filename: "text-[11px] font-mono text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]",
    "pre:body": "p-4 overflow-x-auto text-xs font-mono leading-6 bg-[var(--surface)] text-[var(--foreground)] m-0",
  },
})

// Callout — variants untuk tipe berbeda
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
    label: "text-[10px] font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--accent)_60%,transparent)] mb-4",
  },
})

const ExerciseCard = tw.div({
  base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)] overflow-hidden my-5",
  sub: {
    header: "flex items-center gap-2 px-4 py-3 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]",
    title:  "text-xs font-semibold text-[var(--foreground)]",
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

// ─────────────────────────────────────────────────────────────────────────────
// Playground primitives
// ─────────────────────────────────────────────────────────────────────────────

const PlaygroundWrap = tw.div({
  base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5",
  sub: {
    controls: "p-4 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] space-y-4",
    label:    "text-[10px] font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--foreground)_35%,transparent)]",
    canvas:   "p-6 bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] min-h-40",
    codeline: "rounded-lg bg-[var(--surface)] border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] px-3 py-2 font-mono text-xs text-[var(--accent)]",
  },
})

const ChipGroup = tw.div({
  base: "flex flex-wrap gap-1",
  sub: {
    "p:label": "text-[10px] font-semibold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] mb-1.5",
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

// Demo items — colored squares for playgrounds
const DemoItem = tw.div({
  base: "flex items-center justify-center rounded-lg font-bold text-white text-sm w-14 h-14 select-none",
  variants: {
    color: {
      blue:   "bg-blue-500",
      violet: "bg-violet-500",
      pink:   "bg-pink-500",
      amber:  "bg-amber-500",
      teal:   "bg-teal-500",
    },
  },
  defaultVariants: { color: "blue" },
})

// Copy button — states untuk copied feedback
const CopyBtn = tw.button({
  base: "text-[10px] font-medium px-2.5 py-1 rounded-md border transition-all",
  states: {
    copied: "bg-emerald-500 text-white border-emerald-500",
  },
  // default (not copied)
  base: "border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] hover:text-[var(--foreground)]",
})

// Positioning tab button
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
  base: "rounded-xl bg-[var(--surface)] border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] p-4 space-y-2",
  sub: {
    title:     "text-sm font-semibold text-[var(--foreground)]",
    desc:      "text-sm text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]",
    "p:analogy": "text-xs text-violet-600 bg-violet-50 rounded-lg px-3 py-2 border border-violet-100 flex gap-2",
  },
})

// Positioned demo element — variants untuk tiap position type
const PosDemo = tw.div({
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

// Box model slider label
const SliderRow = tw.div({
  base: "space-y-1",
  sub: {
    header: "flex justify-between text-xs",
  },
})

// Breakpoint row in preview
const BpRow = tw.div({
  base: "flex items-center gap-3 text-xs",
})

// Completion banner
const CompletionBanner = tw.div({
  base: "mt-8 rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-2",
  sub: {
    emoji:  "text-2xl",
    title:  "font-bold text-emerald-800",
    "p:desc": "text-sm text-emerald-700",
  },
})

// Progress label
const ProgressLabel = tw.span({
  base: "text-xs text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]",
})

// ─────────────────────────────────────────────────────────────────────────────
// Chapter data
// ─────────────────────────────────────────────────────────────────────────────

const CHAPTERS = [
  { id: "box-model",   num: "01", title: "Box Model",    sub: "Fondasi semua layout" },
  { id: "normal-flow", num: "02", title: "Normal Flow",   sub: "Block vs Inline" },
  { id: "positioning", num: "03", title: "Positioning",   sub: "Static → sticky" },
  { id: "flexbox",     num: "04", title: "Flexbox",       sub: "Layout 1 dimensi" },
  { id: "grid",        num: "05", title: "CSS Grid",      sub: "Layout 2 dimensi" },
  { id: "responsive",  num: "06", title: "Responsive",    sub: "Media & container queries" },
]

// ─────────────────────────────────────────────────────────────────────────────
// Code block component — pakai sub dari CodeWrap
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
// Box Model interactive demo
// ─────────────────────────────────────────────────────────────────────────────

function BoxModelDemo() {
  const [margin, setMargin]   = useState(24)
  const [padding, setPadding] = useState(16)
  const [border, setBorder]   = useState(4)

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Geser slider — lihat box model berubah</PlaygroundWrap.label>
        {[
          { label: "margin",  val: margin,  set: setMargin,  color: "text-blue-600" },
          { label: "padding", val: padding, set: setPadding, color: "text-green-600" },
          { label: "border",  val: border,  set: setBorder,  color: "text-orange-600" },
        ].map(({ label, val, set, color }) => (
          <SliderRow key={label}>
            <SliderRow.header>
              <span className={color + " font-semibold"}>{label}</span>
              <span style={{ color: "color-mix(in_srgb,var(--foreground) 50%,transparent)" }}
                className="font-mono text-xs">{val}px</span>
            </SliderRow.header>
            <input type="range" min={0} max={48} value={val}
              onChange={e => set(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)" }} />
          </SliderRow>
        ))}
      </PlaygroundWrap.controls>

      <PlaygroundWrap.canvas style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 220 }}>
        {/* Margin layer */}
        <div style={{
          padding: margin,
          background: "#eff6ff",
          border: "2px dashed #93c5fd",
          borderRadius: 16,
          position: "relative",
        }}>
          <span style={{ position: "absolute", top: 4, left: 8, fontSize: 9, fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: 1 }}>margin</span>
          {/* Border layer */}
          <div style={{
            borderWidth: border,
            borderStyle: "solid",
            borderColor: "#f97316",
            borderRadius: 10,
            background: "#fff7ed",
          }}>
            {/* Padding layer */}
            <div style={{
              padding,
              background: "#f0fdf4",
              borderRadius: 8,
              position: "relative",
            }}>
              <span style={{ position: "absolute", top: 2, left: 6, fontSize: 8, fontWeight: 700, color: "#4ade80", textTransform: "uppercase" }}>padding</span>
              {/* Content */}
              <div style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                padding: "12px 16px",
                fontFamily: "monospace",
                fontSize: 11,
                color: "#6b7280",
                whiteSpace: "nowrap",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}>
                Content<br />
                <span style={{ fontSize: 10, color: "#9ca3af" }}>
                  p:{padding}px · b:{border}px · m:{margin}px
                </span>
              </div>
            </div>
          </div>
        </div>
      </PlaygroundWrap.canvas>

      <div style={{ borderTop: "1px solid color-mix(in_srgb,var(--foreground) 6%,transparent)", background: "var(--surface)" }}>
        <PlaygroundWrap.codeline style={{ margin: "12px 16px", display: "block" }}>
          {`.box { margin: ${margin}px; padding: ${padding}px; border: ${border}px solid orange; }`}
        </PlaygroundWrap.codeline>
      </div>
    </PlaygroundWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Positioning demo
// ─────────────────────────────────────────────────────────────────────────────

type PosType = "static" | "relative" | "absolute" | "fixed" | "sticky"

const POS_LIST: PosType[] = ["static", "relative", "absolute", "fixed", "sticky"]

const POS_INFO: Record<PosType, { desc: string; analogy: string }> = {
  static:   { desc: "Default. Mengikuti Normal Flow. top/left/right/bottom tidak berpengaruh.", analogy: "Seperti variabel PHP biasa — ikut urutan eksekusi, tidak ada efek samping." },
  relative: { desc: "Masih di Normal Flow, tapi bisa digeser dari posisi normalnya. Jadi anchor untuk absolute child.", analogy: "Seperti function PHP — masih bisa akses scope luar, tapi punya ruang sendiri." },
  absolute: { desc: "Keluar dari Normal Flow. Posisi relatif ke ancestor terdekat yang bukan static.", analogy: "Seperti static property dalam class PHP — tidak terikat instance, tapi punya konteks class." },
  fixed:    { desc: "Relatif ke browser window. Tidak ikut scroll. Selalu di posisi yang sama.", analogy: "Seperti global variable PHP — selalu ada di mana-mana tanpa peduli konteks." },
  sticky:   { desc: "Gabungan relative + fixed. Ikut scroll sampai batas top tertentu, lalu 'nempel'.", analogy: "Seperti singleton PHP — ada di tempatnya sampai kondisi tertentu terpenuhi." },
}

function PositioningDemo() {
  const [active, setActive] = useState<PosType>("static")
  const info = POS_INFO[active]

  return (
    <div style={{ marginTop: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {POS_LIST.map(p => (
          <PosTab key={p} active={active === p ? "true" : "false"} onClick={() => setActive(p)}>
            position: {p}
          </PosTab>
        ))}
      </div>

      <PosInfo>
        <PosInfo.title>position: {active}</PosInfo.title>
        <PosInfo.desc>{info.desc}</PosInfo.desc>
        <PosInfo.analogy>
          <span>🐘</span> {info.analogy}
        </PosInfo.analogy>
      </PosInfo>

      {/* Visual */}
      <div style={{
        borderRadius: 12,
        border: "1px solid color-mix(in_srgb,var(--foreground) 10%,transparent)",
        background: "color-mix(in_srgb,var(--foreground) 2%,transparent)",
        padding: 16,
        overflow: "hidden",
        height: 180,
        marginTop: 12,
        position: "relative",
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", height: "100%", position: "relative" }}>
          <div style={{ width: 64, height: 56, borderRadius: 8, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#9ca3af", fontFamily: "monospace", flexShrink: 0 }}>div 1</div>
          <PosDemo pos={active}>{active}</PosDemo>
          <div style={{ width: 64, height: 56, borderRadius: 8, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#9ca3af", fontFamily: "monospace", flexShrink: 0 }}>div 3</div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Flexbox playground
// ─────────────────────────────────────────────────────────────────────────────

const FLEX_DIRS    = ["row", "row-reverse", "col", "col-reverse"] as const
const JUSTIFY_OPTS = ["start", "center", "end", "between", "around", "evenly"] as const
const ALIGN_OPTS   = ["start", "center", "end", "stretch"] as const

const COLORS: Array<"blue" | "violet" | "pink" | "amber" | "teal"> =