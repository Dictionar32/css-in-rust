/**
 * CSS Layout — Flexbox (Complete)
 * tailwind-styled-v4
 */
"use client"

import { useState } from "react"
import { tw } from "tailwind-styled-v4"

// ─── Shell ───────────────────────────────────────────────────────────────────

const Page = tw.div({ base: "min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans", attrs: { "data-learn-page": "" } })

const TopBar = tw.nav({
    base: `sticky top-0 z-50 h-12 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]
    bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] backdrop-blur-md`,
    attrs: { "data-learn-topbar": "" },
})

const TopBarInner = tw.div({ base: "max-w-5xl mx-auto px-4 h-full flex items-center gap-2 text-sm" })

const Breadcrumb = tw.div({
    base: "flex items-center gap-1.5 text-xs text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]",
    sub: {
        "a:link": "hover:text-[var(--foreground)] transition-colors",
        "span:sep": "opacity-40",
        "span:curr": "text-[var(--foreground)] font-medium",
    },
})

const Body = tw.div({ base: "max-w-5xl mx-auto px-4 py-10 flex gap-10" })
const Content = tw.main({ base: "flex-1 min-w-0" })

const Toc = tw.aside({ base: "hidden xl:block w-52 shrink-0 sticky top-16 h-fit space-y-1" })
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

// ─── Content primitives ───────────────────────────────────────────────────────

const PageTitle = tw.h1({ base: "text-3xl font-bold tracking-tight mb-2" })
const PageDesc = tw.p({
    base: "text-base text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] mb-10 leading-relaxed",
})
const Divider = tw.hr({ base: "border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] my-10" })
const Section = tw.section({ base: "scroll-mt-20 mb-10" })
const H2 = tw.h2({
    base: "text-xl font-bold mb-4 scroll-mt-20 flex items-center gap-2 group",
    sub: { "a:anchor": "opacity-0 group-hover:opacity-100 text-[var(--accent)] text-base no-underline" },
})
const H3 = tw.h3({ base: "text-base font-semibold mb-3 mt-6 scroll-mt-20" })
const P = tw.p({
    base: "text-sm leading-7 text-[color-mix(in_srgb,var(--foreground)_80%,transparent)] mb-4",
})
const IC = tw.code({
    base: "px-1.5 py-0.5 rounded text-[11px] font-mono bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)]",
})

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

const ExerciseCard = tw.div({
    base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)] overflow-hidden my-5",
    sub: {
        header: "flex items-center gap-2 px-4 py-3 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]",
        title: "text-xs font-semibold",
        body: "p-4 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)] leading-relaxed space-y-1",
    },
})

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

// ─── Playground primitives ────────────────────────────────────────────────────

const PlaygroundWrap = tw.div({
    base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5",
    sub: {
        controls: "p-4 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] space-y-3",
        "p:label": "text-[10px] font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--foreground)_35%,transparent)]",
        canvas: "p-6 bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] min-h-40",
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

// ─── Shared small primitives (dipakai berulang di seluruh halaman) ────────────

const PlaygroundDesc = tw.p({
    base: "text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]",
})
const MiniLabel = tw.span({ base: "text-[9px] opacity-70" })
const NoteBlock = tw.div({ base: "space-y-3 my-5" })
const RoundedCard = tw.div({
    base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5",
    variants: { tone: { plain: "", surface: "bg-[var(--surface)]" } },
    defaultVariants: { tone: "plain" },
})
const TwoColGrid = tw.div({ base: "grid sm:grid-cols-2 gap-4 my-5" })
const BarLabel = tw.div({ base: "bg-blue-200 p-2 text-center" })
const DemoCard = tw.p({ base: "text-sm bg-white border border-gray-200 rounded-lg p-3" })
const MicroMuted = tw.p({
    base: "text-[10px] text-gray-400 font-mono",
    variants: { mb: { 1: "mb-1", 2: "mb-2" }, mt: { 0: "", 2: "mt-2" } },
    defaultVariants: { mb: 1, mt: 0 },
})
const MiniPreLine = tw.span({
    base: "text-[10px] text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] whitespace-pre",
})
const DemoRow = tw.div({
    base: "flex gap-2 border-2 rounded-lg p-3 bg-white",
    variants: {
        tone: {
            neutral: "border-dashed border-gray-300",
            danger: "border-rose-200",
            success: "border-emerald-200",
        },
    },
    defaultVariants: { tone: "neutral" },
})
const MicroIconBox = tw.div({
    base: "rounded flex items-center justify-center text-white text-xs shrink-0",
    variants: {
        tone: { danger: "bg-rose-400", success: "bg-emerald-400" },
        size: { md: "w-16 h-10" },
    },
    defaultVariants: { size: "md" },
})
const InlineBadge = tw.div({
    base: "flex-1 border rounded p-2 text-xs",
    variants: {
        tone: {
            danger: "bg-red-50 border-red-200",
            success: "bg-emerald-50 border-emerald-200",
        },
    },
})

// ─── Flex container demo items ────────────────────────────────────────────────

const FlexDemo = tw.div({
    base: "border-2 border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] rounded-lg transition-all duration-300 bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]",
})

const FlexItem = tw.div({
    base: "rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 transition-all duration-300",
    variants: {
        color: {
            1: "bg-rose-400",
            2: "bg-blue-400",
            3: "bg-emerald-400",
            4: "bg-amber-400",
            5: "bg-violet-400",
        },
        size: {
            sm: "w-10 h-10",
            md: "w-16 h-16",
            lg: "w-20 h-20",
            auto: "px-4 py-3",
            boxA: "w-16 h-10",
            boxB: "w-16 h-16",
            boxC: "w-16 h-6",
        },
    },
    states: {
        textLg: "text-[1.25rem]",
        mlAuto: "ml-auto",
        mxAuto: "mx-auto",
    },
    defaultVariants: { color: 1, size: "md" },
})

// flex-direction playground
const DirectionContainer = tw.div({
    base: "border-2 border-dashed border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] rounded-lg p-3 transition-all duration-300 bg-white",
    variants: {
        dir: {
            row: "flex flex-row gap-2",
            "row-reverse": "flex flex-row-reverse gap-2",
            column: "flex flex-col gap-2",
            "column-reverse": "flex flex-col-reverse gap-2",
        },
    },
    defaultVariants: { dir: "row" },
})

// flex-wrap playground
const WrapContainer = tw.div({
    base: "border-2 border-dashed border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] rounded-lg p-3 bg-white transition-all duration-300 w-60",
    variants: {
        wrap: {
            nowrap: "flex flex-nowrap gap-2",
            wrap: "flex flex-wrap gap-2",
            "wrap-reverse": "flex flex-wrap-reverse gap-2",
        },
    },
    defaultVariants: { wrap: "nowrap" },
})

// justify-content playground
const JustifyContainer = tw.div({
    base: "border-2 border-dashed border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] rounded-lg p-3 bg-white transition-all duration-300 flex gap-2",
    variants: {
        justify: {
            "flex-start": "justify-start",
            "flex-end": "justify-end",
            center: "justify-center",
            "space-between": "justify-between",
            "space-around": "justify-around",
            "space-evenly": "justify-evenly",
            stretch: "justify-stretch",
        },
    },
    defaultVariants: { justify: "flex-start" },
})

// align-items playground
const AlignItemsContainer = tw.div({
    base: "border-2 border-dashed border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] rounded-lg p-3 bg-white h-32 transition-all duration-300 flex gap-2",
    variants: {
        align: {
            "flex-start": "items-start",
            "flex-end": "items-end",
            center: "items-center",
            stretch: "items-stretch",
            baseline: "items-baseline",
        },
    },
    defaultVariants: { align: "flex-start" },
})

// align-self item
const AlignSelfItem = tw.div({
    base: "rounded-lg flex items-center justify-center text-[11px] font-bold text-white transition-all duration-300 w-16",
    variants: {
        self: {
            auto: "self-auto bg-rose-400 h-16",
            "flex-start": "self-start bg-blue-400 h-16",
            "flex-end": "self-end bg-blue-400 h-16",
            center: "self-center bg-blue-400 h-16",
            stretch: "self-stretch bg-blue-400",
            baseline: "self-baseline bg-blue-400 h-12",
        },
    },
    defaultVariants: { self: "auto" },
})

const SelfDemoRow = tw.div({
    base: "flex items-start gap-2 h-32 border-2 border-dashed border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] rounded-lg p-3 bg-white",
})

// align-content playground (multi-line)
const AlignContentContainer = tw.div({
    base: "border-2 border-dashed border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] rounded-lg p-3 bg-white h-52 flex flex-wrap transition-all duration-300 gap-2 w-60",
    variants: {
        content: {
            "flex-start": "content-start",
            "flex-end": "content-end",
            center: "content-center",
            "space-between": "content-between",
            "space-around": "content-around",
            "space-evenly": "content-evenly",
            stretch: "content-stretch",
        },
    },
    defaultVariants: { content: "flex-start" },
})

// flex-grow/shrink/basis playground item
const FlexRatioItem = tw.div({
    base: "rounded-lg flex flex-col items-center justify-center text-[10px] font-mono text-white py-3 px-2 transition-all duration-300 min-w-0",
    variants: {
        color: {
            1: "bg-rose-400",
            2: "bg-blue-400",
            3: "bg-emerald-400",
        },
        growValue: {
            0: "[flex-grow:0]",
            1: "[flex-grow:1]",
            2: "[flex-grow:2]",
            3: "[flex-grow:3]",
            4: "[flex-grow:4]",
            5: "[flex-grow:5]",
        },
        shrinkValue: {
            0: "[flex-shrink:0]",
            1: "[flex-shrink:1]",
            2: "[flex-shrink:2]",
            3: "[flex-shrink:3]",
            4: "[flex-shrink:4]",
            5: "[flex-shrink:5]",
        },
        basis: {
            auto: "basis-auto grow min-w-0",
            0: "basis-0 grow min-w-0",
            content: "basis-[content] grow min-w-0",
            "100px": "basis-[100px] grow min-w-0",
            "33%": "basis-1/3 grow min-w-0",
            "50%": "basis-1/2 grow min-w-0",
        },
    },
    defaultVariants: { color: 1 },
})

const SliderGrid = tw.div({ base: "grid grid-cols-3 gap-4" })
const SliderCol = tw.div({ base: "space-y-1" })
const SliderRow = tw.div({ base: "flex justify-between text-[10px]" })
const SliderLabel = tw.span({ base: "font-semibold text-[color-mix(in_srgb,var(--foreground)_50%,transparent)]" })
const SliderVal = tw.span({ base: "font-mono" })
const RangeInput = tw.input({ base: "w-full accent-[var(--accent)]" })
const RatioTrack = tw.div({
    base: "flex gap-0 w-full border-2 border-dashed border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] rounded-lg bg-white overflow-hidden",
})
const BasisTrack = tw.div({
    base: "flex flex-wrap gap-2 w-full border-2 border-dashed border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] rounded-lg p-2 bg-white",
})
const OrderTrack = tw.div({
    base: "flex gap-2 border-2 border-dashed border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] rounded-lg p-3 bg-white",
})
const GapTrack = tw.div({
    base: "flex flex-wrap border-2 border-dashed border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] rounded-lg p-3 bg-white w-[260px]",
    variants: {
        gap: {
            0: "gap-0",
            2: "gap-2",
            4: "gap-4",
            6: "gap-6",
            8: "gap-8",
            asymmetric: "gap-x-8 gap-y-2",
        },
    },
    defaultVariants: { gap: 4 },
})

// order playground item
const OrderItem = tw.div({
    base: "w-12 h-12 rounded-lg flex items-center justify-center text-[11px] font-bold text-white transition-all duration-300",
    variants: {
        color: {
            1: "bg-rose-400",
            2: "bg-blue-400",
            3: "bg-emerald-400",
            4: "bg-amber-400",
        },
        order: {
            0: "-order-1",
            1: "order-none",
            2: "order-2",
            3: "order-3",
            last: "order-last",
        },
    },
    defaultVariants: { color: 1, order: 0 },
})

// ─── TOC ─────────────────────────────────────────────────────────────────────

const TOC = [
    { id: "intro", label: "Apa itu Flexbox" },
    { id: "axes", label: "Main Axis & Cross Axis" },
    { id: "direction", label: "flex-direction" },
    { id: "wrap", label: "flex-wrap & flex-flow" },
    { id: "justify", label: "justify-content" },
    { id: "align-items", label: "align-items" },
    { id: "align-self", label: "align-self" },
    { id: "align-content", label: "align-content" },
    { id: "gap", label: "gap" },
    { id: "grow-shrink", label: "flex-grow & flex-shrink" },
    { id: "basis", label: "flex-basis & flex shorthand" },
    { id: "free-space", label: "Free Space Algorithm" },
    { id: "order", label: "order" },
    { id: "centering", label: "Pattern: Centering" },
    { id: "holy-grail", label: "Pattern: Holy Grail Layout" },
    { id: "auto-margin", label: "Auto Margin di Flex" },
    { id: "min-width-zero", label: "min-width: 0 trap" },
    { id: "absolute-flex", label: "Absolute child di Flex" },
    { id: "inline-flex", label: "display: inline-flex" },
    { id: "place-shortcuts", label: "place-content / place-items / place-self" },
    { id: "tw-usage", label: "Pakai di tw" },
    { id: "exercise", label: "Latihan" },
]

// ─── Code component ───────────────────────────────────────────────────────────

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

// ─── Playground: flex-direction ──────────────────────────────────────────────

type DirType = "row" | "row-reverse" | "column" | "column-reverse"

function DirectionPlayground() {
    const [dir, setDir] = useState<DirType>("row")
    const desc: Record<DirType, string> = {
        "row": "Default — main axis horizontal kiri→kanan. Items disusun kiri ke kanan.",
        "row-reverse": "Main axis horizontal kanan→kiri. Items disusun kanan ke kiri. DOM order tidak berubah.",
        "column": "Main axis vertikal atas→bawah. Items disusun seperti block elements.",
        "column-reverse": "Main axis vertikal bawah→atas. Item pertama di DOM muncul di bawah.",
    }
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 flex-direction — arah main axis</PlaygroundWrap.label>
                <ChipRow>
                    {(["row", "row-reverse", "column", "column-reverse"] as DirType[]).map(v => (
                        <Chip key={v} active={dir === v} onClick={() => setDir(v)}>{v}</Chip>
                    ))}
                </ChipRow>
                <PlaygroundDesc>{desc[dir]}</PlaygroundDesc>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <DirectionContainer dir={dir}>
                    {["1", "2", "3", "4"].map(n => (
                        <FlexItem key={n} color={1} size="md">{n}</FlexItem>
                    ))}
                </DirectionContainer>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{`flex-direction: ${dir};`}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: flex-wrap ───────────────────────────────────────────────────

type WrapType = "nowrap" | "wrap" | "wrap-reverse"

function WrapPlayground() {
    const [wrap, setWrap] = useState<WrapType>("nowrap")
    const desc: Record<WrapType, string> = {
        nowrap: "Default — semua item dipaksa satu baris, bisa melebihi container (atau shrink kalau flex-shrink aktif).",
        wrap: "Items wrap ke baris berikutnya kalau tidak muat. Baris baru terbentuk di bawah.",
        "wrap-reverse": "Sama seperti wrap tapi baris baru terbentuk di ATAS — baris pertama ada di bawah.",
    }
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 flex-wrap — boleh multi-baris atau tidak</PlaygroundWrap.label>
                <ChipRow>
                    {(["nowrap", "wrap", "wrap-reverse"] as WrapType[]).map(v => (
                        <Chip key={v} active={wrap === v} onClick={() => setWrap(v)}>{v}</Chip>
                    ))}
                </ChipRow>
                <PlaygroundDesc>{desc[wrap]}</PlaygroundDesc>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <WrapContainer wrap={wrap}>
                    {["1", "2", "3", "4", "5"].map(n => (
                        <FlexItem key={n} color={1} size="md">{n}</FlexItem>
                    ))}
                </WrapContainer>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{`flex-wrap: ${wrap}; /* Container lebar 240px, 5 items × 64px = 320px → perlu wrap */`}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: justify-content ─────────────────────────────────────────────

type JustifyType = "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly" | "stretch"

function JustifyPlayground() {
    const [justify, setJustify] = useState<JustifyType>("flex-start")
    const desc: Record<JustifyType, string> = {
        "flex-start": "Items menempel ke awal main axis (kiri untuk row).",
        "flex-end": "Items menempel ke akhir main axis (kanan untuk row).",
        center: "Items dikumpulkan ke tengah main axis.",
        "space-between": "Item pertama di awal, terakhir di akhir, sisanya dibagi rata di antara.",
        "space-around": "Setiap item punya space yang sama di kiri dan kanannya. Gap antar item = 2× gap di tepi.",
        "space-evenly": "Space antara setiap item dan tepi container semuanya sama persis.",
        stretch: "Items stretch untuk mengisi main axis. Efektif hanya jika items tidak punya ukuran tetap.",
    }
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 justify-content — distribusi ruang di main axis</PlaygroundWrap.label>
                <ChipRow>
                    {(["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly", "stretch"] as JustifyType[]).map(v => (
                        <Chip key={v} active={justify === v} onClick={() => setJustify(v)}>{v}</Chip>
                    ))}
                </ChipRow>
                <PlaygroundDesc>{desc[justify]}</PlaygroundDesc>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <JustifyContainer justify={justify}>
                    {[1, 2, 3].map(n => (
                        <FlexItem key={n} color={n as 1 | 2 | 3} size="md">{n}</FlexItem>
                    ))}
                </JustifyContainer>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{`justify-content: ${justify};`}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: align-items ─────────────────────────────────────────────────

type AlignItemsType = "flex-start" | "flex-end" | "center" | "stretch" | "baseline"

function AlignItemsPlayground() {
    const [align, setAlign] = useState<AlignItemsType>("stretch")
    const desc: Record<AlignItemsType, string> = {
        "flex-start": "Items menempel ke awal cross axis (atas untuk row).",
        "flex-end": "Items menempel ke akhir cross axis (bawah untuk row).",
        center: "Items dikumpulkan ke tengah cross axis.",
        stretch: "Default — items stretch mengisi tinggi cross axis (kalau tidak punya height tetap).",
        baseline: "Items di-align berdasarkan baseline teks pertamanya — berguna kalau items punya font-size berbeda.",
    }
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 align-items — posisi di cross axis (semua items)</PlaygroundWrap.label>
                <ChipRow>
                    {(["flex-start", "flex-end", "center", "stretch", "baseline"] as AlignItemsType[]).map(v => (
                        <Chip key={v} active={align === v} onClick={() => setAlign(v)}>{v}</Chip>
                    ))}
                </ChipRow>
                <PlaygroundDesc>{desc[align]}</PlaygroundDesc>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <AlignItemsContainer align={align}>
                    <FlexItem color={1} size={align === "stretch" ? "auto" : "boxA"}>1</FlexItem>
                    <FlexItem color={2} size={align === "stretch" ? "auto" : "boxB"} textLg={align === "baseline"}>2</FlexItem>
                    <FlexItem color={3} size={align === "stretch" ? "auto" : "boxC"}>3</FlexItem>
                </AlignItemsContainer>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{`align-items: ${align};`}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: align-self ──────────────────────────────────────────────────

type AlignSelfType = "auto" | "flex-start" | "flex-end" | "center" | "stretch" | "baseline"

function AlignSelfPlayground() {
    const [self, setSelf] = useState<AlignSelfType>("center")
    const desc: Record<AlignSelfType, string> = {
        auto: "Ikut nilai align-items container (default).",
        "flex-start": "Item ini menempel ke atas, override align-items container.",
        "flex-end": "Item ini menempel ke bawah.",
        center: "Item ini di-center secara vertikal.",
        stretch: "Item ini stretch memenuhi tinggi container.",
        baseline: "Item ini align ke baseline teksnya.",
    }
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 align-self — override align-items untuk satu item saja (Box merah)</PlaygroundWrap.label>
                <ChipRow>
                    {(["auto", "flex-start", "flex-end", "center", "stretch", "baseline"] as AlignSelfType[]).map(v => (
                        <Chip key={v} active={self === v} onClick={() => setSelf(v)}>{v}</Chip>
                    ))}
                </ChipRow>
                <PlaygroundDesc>{desc[self]}</PlaygroundDesc>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <SelfDemoRow>
                    <FlexItem color={2} size="md">A</FlexItem>
                    <AlignSelfItem self={self}>B ← self</AlignSelfItem>
                    <FlexItem color={3} size="md">C</FlexItem>
                </SelfDemoRow>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{`/* Container: align-items: flex-start */\n.item-b { align-self: ${self}; }`}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: align-content ───────────────────────────────────────────────

type AlignContentType = "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly" | "stretch"

function AlignContentPlayground() {
    const [content, setContent] = useState<AlignContentType>("flex-start")
    const desc: Record<AlignContentType, string> = {
        "flex-start": "Semua baris dikumpulkan ke awal cross axis.",
        "flex-end": "Semua baris dikumpulkan ke akhir cross axis.",
        center: "Semua baris dikumpulkan ke tengah.",
        "space-between": "Baris pertama di atas, terakhir di bawah, sisanya dibagi rata.",
        "space-around": "Setiap baris punya space sama di atas dan bawahnya.",
        "space-evenly": "Space antara setiap baris dan tepi semuanya sama.",
        stretch: "Setiap baris stretch mengisi sisa ruang secara merata.",
    }
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 align-content — distribusi baris di cross axis (hanya aktif saat flex-wrap: wrap)</PlaygroundWrap.label>
                <ChipRow>
                    {(["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly", "stretch"] as AlignContentType[]).map(v => (
                        <Chip key={v} active={content === v} onClick={() => setContent(v)}>{v}</Chip>
                    ))}
                </ChipRow>
                <PlaygroundDesc>{desc[content]}</PlaygroundDesc>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <AlignContentContainer content={content}>
                    {[1, 2, 3, 4, 5, 1, 2].map((n, i) => (
                        <FlexItem key={i} color={n as 1 | 2 | 3 | 4 | 5} size="md">{n}</FlexItem>
                    ))}
                </AlignContentContainer>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{`align-content: ${content}; /* hanya berlaku saat ada lebih dari 1 baris (flex-wrap: wrap) */`}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: flex-grow & flex-shrink ─────────────────────────────────────

function GrowShrinkPlayground() {
    const [growA, setGrowA] = useState(1)
    const [growB, setGrowB] = useState(2)
    const [growC, setGrowC] = useState(1)
    const [mode, setMode] = useState<"grow" | "shrink">("grow")

    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 flex-grow & flex-shrink — bagaimana free space dibagi</PlaygroundWrap.label>
                <ChipRow>
                    <Chip active={mode === "grow"} onClick={() => setMode("grow")}>flex-grow (positive free space)</Chip>
                    <Chip active={mode === "shrink"} onClick={() => setMode("shrink")}>flex-shrink (negative free space)</Chip>
                </ChipRow>
                <SliderGrid>
                    {[
                        { label: "Item A (merah)", val: growA, set: setGrowA },
                        { label: "Item B (biru)", val: growB, set: setGrowB },
                        { label: "Item C (hijau)", val: growC, set: setGrowC },
                    ].map(({ label, val, set }) => (
                        <SliderCol key={label}>
                            <SliderRow>
                                <SliderLabel>{label}</SliderLabel>
                                <SliderVal>{val}</SliderVal>
                            </SliderRow>
                            <RangeInput type="range" min={0} max={5} value={val} onChange={e => set(+e.target.value)} />
                        </SliderCol>
                    ))}
                </SliderGrid>
                <PlaygroundDesc>
                    {mode === "grow"
                        ? `Ratio A:B:C = ${growA}:${growB}:${growC} — free space dibagi dengan ratio ini. B mendapat porsi ${growA + growB + growC > 0 ? Math.round((growB / (growA + growB + growC)) * 100) : 0}% dari sisa ruang.`
                        : `Ratio shrink A:B:C = ${growA}:${growB}:${growC} — kalau tidak muat, item dengan nilai lebih tinggi menyusut lebih banyak.`}
                </PlaygroundDesc>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <RatioTrack>
                    <FlexRatioItem color={1} growValue={1} shrinkValue={1}>
                        <span>A</span>
                        <MiniLabel>{mode}-{growA}</MiniLabel>
                    </FlexRatioItem>
                    <FlexRatioItem color={2} growValue={1} shrinkValue={1}>
                        <span>B</span>
                        <MiniLabel>{mode}-{growB}</MiniLabel>
                    </FlexRatioItem>
                    <FlexRatioItem color={3} growValue={1} shrinkValue={1}>
                        <span>C</span>
                        <MiniLabel>{mode}-{growC}</MiniLabel>
                    </FlexRatioItem>
                </RatioTrack>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {`.a { flex-${mode}: ${growA}; } .b { flex-${mode}: ${growB}; } .c { flex-${mode}: ${growC}; }`}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: flex-basis ──────────────────────────────────────────────────

type BasisMode = "auto" | "0" | "content" | "100px" | "33%" | "50%"

function BasisPlayground() {
    const [basis, setBasis] = useState<BasisMode>("auto")
    const desc: Record<BasisMode, string> = {
        auto: "auto — pakai width/height item sebagai basis. Kalau tidak ada, pakai ukuran konten.",
        "0": "0 — abaikan ukuran konten, distribusikan SEMUA space berdasarkan flex-grow ratio murni.",
        content: "content — pakai ukuran konten intrinsik. Mirip auto tapi tanpa fallback ke width.",
        "100px": "100px — basis tetap 100px sebelum grow/shrink. Bisa overflow kalau flex-shrink: 0.",
        "33%": "33% — basis 33% dari container. Berguna untuk grid-like layout.",
        "50%": "50% — basis 50% dari container. Dengan flex-wrap: wrap, tepat 2 kolom.",
    }
    const basisValue: Record<BasisMode, string> = {
        auto: "auto", "0": "0", content: "content", "100px": "100px", "33%": "33%", "50%": "50%"
    }
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 flex-basis — ukuran awal sebelum grow/shrink bekerja</PlaygroundWrap.label>
                <ChipRow>
                    {(["auto", "0", "content", "100px", "33%", "50%"] as BasisMode[]).map(v => (
                        <Chip key={v} active={basis === v} onClick={() => setBasis(v)}>{v}</Chip>
                    ))}
                </ChipRow>
                <PlaygroundDesc>{desc[basis]}</PlaygroundDesc>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <BasisTrack>
                    {[1, 2, 3].map(n => (
                        <FlexRatioItem key={n} color={3} basis={0}>
                            <span>{n}</span>
                            <MiniLabel>basis: {basis}</MiniLabel>
                        </FlexRatioItem>
                    ))}
                </BasisTrack>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{`flex-basis: ${basisValue[basis]}; /* shorthand: flex: 1 1 ${basisValue[basis]} */`}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: order ───────────────────────────────────────────────────────

function OrderPlayground() {
    const [orderB, setOrderB] = useState<"-1" | "0" | "1" | "2" | "3" | "last">("0")
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 order — ubah urutan visual tanpa ubah DOM (ubah order item B/biru)</PlaygroundWrap.label>
                <ChipRow>
                    {(["-1", "0", "1", "2", "3", "last"] as const).map(v => (
                        <Chip key={v} active={orderB === v} onClick={() => setOrderB(v)}>order: {v}</Chip>
                    ))}
                </ChipRow>
                <PlaygroundDesc>
                    Default semua item = order 0. Item dengan order lebih kecil muncul lebih dahulu.
                    DOM tetap A→B→C→D, tapi visual bisa berbeda.
                </PlaygroundDesc>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <OrderTrack>
                    <OrderItem color={1} order={0}>A</OrderItem>
                    <OrderItem color={2} order={0}>B</OrderItem>
                    <OrderItem color={3} order={0}>C</OrderItem>
                    <OrderItem color={4} order={0}>D</OrderItem>
                </OrderTrack>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{`.item-b { order: ${orderB === "last" ? "9999 /* order-last */" : orderB}; } /* DOM: A B C D, visual: sesuai order */`}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: gap ─────────────────────────────────────────────────────────

type GapMode = "0" | "2" | "4" | "6" | "8" | "asymmetric"

function GapPlayground() {
    const [gap, setGap] = useState<GapMode>("4")
    const gapDesc: Record<GapMode, string> = {
        "0": "Tidak ada gap", "2": "gap: 8px", "4": "gap: 16px",
        "6": "gap: 24px", "8": "gap: 32px",
        asymmetric: "gap-x: 32px (horizontal), gap-y: 8px (vertical) — asimetris",
    }
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 gap — jarak antar flex items (pengganti margin)</PlaygroundWrap.label>
                <ChipRow>
                    {(["0", "2", "4", "6", "8", "asymmetric"] as GapMode[]).map(v => (
                        <Chip key={v} active={gap === v} onClick={() => setGap(v)}>{v}</Chip>
                    ))}
                </ChipRow>
                <PlaygroundDesc>{gapDesc[gap]}</PlaygroundDesc>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <GapTrack gap={0}>
                    {[1, 2, 3, 4, 5].map(n => (
                        <FlexItem key={n} color={1} size="md">{n}</FlexItem>
                    ))}
                </GapTrack>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {gap === "asymmetric"
                    ? "column-gap: 32px; row-gap: 8px; /* atau: gap: 8px 32px (row column) */"
                    : `gap: ${parseInt(gap || "0") * 4}px; /* Tailwind: gap-${gap} */`}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function FlexboxPage() {
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
                        <Breadcrumb.curr>Flexbox</Breadcrumb.curr>
                    </Breadcrumb>
                </TopBarInner>
            </TopBar>

            <Body>
                <Content>
                    <PageTitle>Flexbox</PageTitle>
                    <PageDesc>
                        CSS Flexible Box Layout — model layout satu dimensi untuk mendistribusikan
                        dan menyelaraskan items di dalam container, baik di main axis maupun cross axis.
                    </PageDesc>

                    {/* ══ 01 INTRO ══════════════════════════════════════════════════ */}
                    <Section id="intro" onClick={() => setActiveSection("intro")}>
                        <H2>Apa itu Flexbox<H2.anchor href="#intro">#</H2.anchor></H2>
                        <P>
                            Flexbox adalah <em>one-dimensional</em> layout model — dia mengatur items
                            dalam satu arah sekaligus (baris atau kolom). Berbeda dengan Grid yang
                            dua dimensi. Flexbox unggul untuk distribusi items dalam satu baris/kolom
                            dengan alignment yang presisi.
                        </P>
                        <Callout type="php">
                            <Callout.icon>🐘</Callout.icon>
                            <Callout.content>
                                <Callout.title>Analogi PHP</Callout.title>
                                Flexbox seperti <IC>array_map</IC> + <IC>usort</IC> yang bekerja secara
                                visual — kamu deklarasikan aturan distribusi dan alignment, browser yang
                                menghitung posisi tiap item. Kamu tidak perlu hitung koordinat manual.
                            </Callout.content>
                        </Callout>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
                            {[
                                { term: "Flex container", def: "Elemen yang punya display: flex atau inline-flex. Semua children langsung jadi flex items." },
                                { term: "Flex item", def: "Child langsung dari flex container. Merespons flex-grow, flex-shrink, flex-basis, order, align-self." },
                                { term: "Main axis", def: "Arah utama items disusun. Ditentukan oleh flex-direction (default: horizontal)." },
                                { term: "Cross axis", def: "Arah tegak lurus main axis. Untuk flex-direction: row, cross axis = vertikal." },
                                { term: "Main size", def: "Ukuran item di sepanjang main axis (width untuk row, height untuk column)." },
                                { term: "Cross size", def: "Ukuran item di sepanjang cross axis." },
                            ].map(({ term, def }) => (
                                <div key={term} className="flex gap-4 p-3 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0">
                                    <IC className="shrink-0 self-start">{term}</IC>
                                    <p className="text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)] leading-relaxed">{def}</p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Divider />

                    {/* ══ 02 AXES ═══════════════════════════════════════════════════ */}
                    <Section id="axes" onClick={() => setActiveSection("axes")}>
                        <H2>Main Axis & Cross Axis<H2.anchor href="#axes">#</H2.anchor></H2>
                        <P>
                            Memahami dua sumbu ini adalah kunci flexbox. Properti yang mengontrol
                            distribusi di main axis (<IC>justify-content</IC>, <IC>flex-grow</IC>)
                            berbeda dari yang mengontrol cross axis (<IC>align-items</IC>,
                            <IC>align-self</IC>). Sumbu berubah ketika <IC>flex-direction</IC> berubah.
                        </P>
                        <div className="grid sm:grid-cols-2 gap-4 my-5">
                            {[
                                { dir: "row", mainAxis: "→ Horizontal (kiri ke kanan)", crossAxis: "↓ Vertikal" },
                                { dir: "column", mainAxis: "↓ Vertikal (atas ke bawah)", crossAxis: "→ Horizontal" },
                            ].map(({ dir, mainAxis, crossAxis }) => (
                                <div key={dir} className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] p-4 bg-[var(--surface)]">
                                    <p className="text-xs font-bold mb-3"><IC>flex-direction: {dir}</IC></p>
                                    <div className="space-y-2 text-xs text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                                        <p><span className="text-blue-600 font-semibold">Main axis:</span> {mainAxis}</p>
                                        <p><span className="text-rose-600 font-semibold">Cross axis:</span> {crossAxis}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Code file="axes.css">{`
/* Properti MAIN AXIS (sejajar flex-direction) */
justify-content   /* distribusi items di main axis */
flex-grow         /* ambil positive free space */
flex-shrink       /* kurangi saat negative free space */
flex-basis        /* ukuran awal di main axis */

/* Properti CROSS AXIS (tegak lurus flex-direction) */
align-items       /* posisi semua items di cross axis */
align-self        /* posisi satu item di cross axis */
align-content     /* distribusi baris (saat flex-wrap: wrap) */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 03 DIRECTION ══════════════════════════════════════════════ */}
                    <Section id="direction" onClick={() => setActiveSection("direction")}>
                        <H2>flex-direction<H2.anchor href="#direction">#</H2.anchor></H2>
                        <P>
                            Menentukan arah main axis dan juga arah <em>urutan</em> items.
                            Nilai <IC>row-reverse</IC> dan <IC>column-reverse</IC> hanya mengubah
                            urutan visual, bukan urutan DOM — penting untuk aksesibilitas.
                        </P>
                        <DirectionPlayground />
                        <Code file="flex-direction.css">{`
.container {
  display: flex;
  flex-direction: row;            /* default */
  flex-direction: row-reverse;    /* kanan ke kiri */
  flex-direction: column;         /* atas ke bawah */
  flex-direction: column-reverse; /* bawah ke atas */
}
/* Tailwind: flex-row | flex-row-reverse | flex-col | flex-col-reverse */
            `}</Code>
                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>row-reverse & aksesibilitas</Callout.title>
                                <IC>row-reverse</IC> hanya mengubah urutan visual. Screen reader
                                dan navigasi keyboard tetap mengikuti urutan DOM. Jangan pakai
                                ini untuk membalik urutan yang memiliki makna logis.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 04 WRAP ═══════════════════════════════════════════════════ */}
                    <Section id="wrap" onClick={() => setActiveSection("wrap")}>
                        <H2>flex-wrap & flex-flow<H2.anchor href="#wrap">#</H2.anchor></H2>
                        <P>
                            Default flexbox paksa semua items dalam satu baris (shrink kalau perlu).
                            <IC>flex-wrap: wrap</IC> membolehkan items pindah ke baris berikutnya.
                            <IC>flex-flow</IC> adalah shorthand untuk <IC>flex-direction</IC> +
                            <IC>flex-wrap</IC> sekaligus.
                        </P>
                        <WrapPlayground />
                        <Code file="flex-wrap.css">{`
.container {
  flex-wrap: nowrap;        /* default — satu baris, shrink kalau perlu */
  flex-wrap: wrap;          /* multi-baris, baris baru di bawah */
  flex-wrap: wrap-reverse;  /* multi-baris, baris baru di atas */
}

/* flex-flow = flex-direction + flex-wrap */
.container { flex-flow: row wrap; }           /* sama dengan: flex-direction:row; flex-wrap:wrap */
.container { flex-flow: column nowrap; }      /* vertikal, satu kolom */
.container { flex-flow: row-reverse wrap; }   /* kanan ke kiri, multi-baris */

/* Tailwind: flex-wrap | flex-nowrap | flex-wrap-reverse */
/* flex-flow: [flex-flow:row_wrap] */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 05 JUSTIFY ════════════════════════════════════════════════ */}
                    <Section id="justify" onClick={() => setActiveSection("justify")}>
                        <H2>justify-content<H2.anchor href="#justify">#</H2.anchor></H2>
                        <P>Mendistribusikan free space di sepanjang <strong>main axis</strong>. Hanya berlaku kalau items tidak grow (<IC>flex-grow: 0</IC>) atau sudah mencapai ukuran maksimum.</P>
                        <JustifyPlayground />
                        <Code file="justify-content.css">{`
.container {
  justify-content: flex-start;    /* default */
  justify-content: flex-end;
  justify-content: center;
  justify-content: space-between; /* gap rata, tidak ada gap di tepi */
  justify-content: space-around;  /* gap di tepi = 0.5× gap antar item */
  justify-content: space-evenly;  /* semua gap sama */
  justify-content: stretch;       /* items stretch (kalau tidak ada ukuran tetap) */
}
/* Tailwind: justify-start | justify-end | justify-center |
   justify-between | justify-around | justify-evenly | justify-stretch */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 06 ALIGN-ITEMS ════════════════════════════════════════════ */}
                    <Section id="align-items" onClick={() => setActiveSection("align-items")}>
                        <H2>align-items<H2.anchor href="#align-items">#</H2.anchor></H2>
                        <P>Menentukan posisi semua items di <strong>cross axis</strong>. Default-nya <IC>stretch</IC> — inilah kenapa flex items otomatis sama tinggi meski kontennya berbeda.</P>
                        <AlignItemsPlayground />
                        <Code file="align-items.css">{`
.container {
  align-items: stretch;     /* default — items stretch mengisi cross axis */
  align-items: flex-start;  /* rata atas (untuk row) */
  align-items: flex-end;    /* rata bawah */
  align-items: center;      /* tengah vertical */
  align-items: baseline;    /* rata berdasarkan baseline teks */
}
/* Tailwind: items-stretch | items-start | items-end | items-center | items-baseline */
            `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                <IC>align-items: stretch</IC> adalah rahasia kenapa card di flex row
                                otomatis sama tinggi. Kalau mau card punya tinggi natural sendiri,
                                ganti ke <IC>align-items: flex-start</IC>.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 07 ALIGN-SELF ═════════════════════════════════════════════ */}
                    <Section id="align-self" onClick={() => setActiveSection("align-self")}>
                        <H2>align-self<H2.anchor href="#align-self">#</H2.anchor></H2>
                        <P>Override <IC>align-items</IC> container untuk <strong>satu item saja</strong>. Berguna untuk satu item yang butuh posisi berbeda dari yang lain.</P>
                        <AlignSelfPlayground />
                        <Code file="align-self.css">{`
/* Di flex item, bukan di container */
.item-special {
  align-self: auto;        /* default — ikut align-items container */
  align-self: flex-start;
  align-self: flex-end;
  align-self: center;
  align-self: stretch;
  align-self: baseline;
}
/* Tailwind: self-auto | self-start | self-end | self-center | self-stretch | self-baseline */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 08 ALIGN-CONTENT ══════════════════════════════════════════ */}
                    <Section id="align-content" onClick={() => setActiveSection("align-content")}>
                        <H2>align-content<H2.anchor href="#align-content">#</H2.anchor></H2>
                        <P>
                            Seperti <IC>justify-content</IC> tapi untuk <strong>baris</strong> di cross axis.
                            Hanya berlaku saat <IC>flex-wrap: wrap</IC> dan ada lebih dari satu baris.
                            Tidak berpengaruh kalau semua items dalam satu baris.
                        </P>
                        <AlignContentPlayground />
                        <Code file="align-content.css">{`
/* HANYA berlaku saat flex-wrap: wrap dan ada multiple lines */
.container {
  flex-wrap: wrap;
  align-content: flex-start;
  align-content: flex-end;
  align-content: center;
  align-content: space-between;
  align-content: space-around;
  align-content: space-evenly;
  align-content: stretch; /* default */
}
/* Tailwind: content-start | content-end | content-center |
   content-between | content-around | content-evenly | content-stretch */
            `}</Code>
                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>Perbedaan align-items vs align-content</Callout.title>
                                <IC>align-items</IC>: posisi items DALAM setiap baris.
                                <IC>align-content</IC>: distribusi BARIS-nya sendiri di dalam container.
                                Kalau hanya ada satu baris, <IC>align-content</IC> tidak berpengaruh.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 09 GAP ════════════════════════════════════════════════════ */}
                    <Section id="gap" onClick={() => setActiveSection("gap")}>
                        <H2>gap<H2.anchor href="#gap">#</H2.anchor></H2>
                        <P>
                            <IC>gap</IC> (dulu <IC>grid-gap</IC>) menambahkan jarak antar flex items
                            tanpa margin. Keuntungan vs margin: tidak ada margin di tepi container,
                            tidak perlu hack <IC>:last-child</IC>, dan bekerja dengan <IC>flex-wrap</IC>.
                        </P>
                        <GapPlayground />
                        <Code file="gap.css">{`
.container {
  gap: 16px;            /* gap seragam di semua sisi */
  gap: 8px 24px;        /* row-gap column-gap */
  row-gap: 8px;         /* vertikal saja (antar baris saat wrap) */
  column-gap: 24px;     /* horizontal saja (antar items dalam baris) */
}
/* Tailwind: gap-4 | gap-x-4 | gap-y-2 */
            `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                Selalu pakai <IC>gap</IC> daripada <IC>margin</IC> untuk spacing
                                antar flex items. Gap tidak menghasilkan extra space di tepi, tidak
                                perlu <IC>:first-child/:last-child</IC> override, dan lebih mudah di-maintain.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 10 GROW & SHRINK ══════════════════════════════════════════ */}
                    <Section id="grow-shrink" onClick={() => setActiveSection("grow-shrink")}>
                        <H2>flex-grow & flex-shrink<H2.anchor href="#grow-shrink">#</H2.anchor></H2>
                        <P>
                            <IC>flex-grow</IC> mendistribusikan <em>positive free space</em> (ruang sisa).
                            <IC>flex-shrink</IC> mendistribusikan <em>negative free space</em> (kelebihan ukuran).
                            Nilainya adalah rasio — bukan ukuran absolut.
                        </P>
                        <GrowShrinkPlayground />
                        <Code file="grow-shrink.css">{`
/* flex-grow — ambil sisa space sesuai ratio */
.item-a { flex-grow: 1; } /* ambil 1 bagian dari total */
.item-b { flex-grow: 2; } /* ambil 2 bagian — dapat 2× lebih banyak dari A */
.item-c { flex-grow: 0; } /* default — tidak ambil sisa space */

/* flex-shrink — susut kalau tidak muat */
.item-a { flex-shrink: 1; } /* default — susut proporsional */
.item-b { flex-shrink: 2; } /* susut 2× lebih cepat dari item lain */
.item-c { flex-shrink: 0; } /* tidak pernah susut — bisa overflow! */

/* Tailwind: grow | grow-0 | shrink | shrink-0 */
            `}</Code>
                        <Callout type="note">
                            <Callout.icon>ℹ️</Callout.icon>
                            <Callout.content>
                                <IC>flex-grow: 1</IC> pada semua items = bagikan sisa space rata.
                                <IC>flex-grow: 0</IC> (default) = item tidak mengambil sisa space.
                                Nilai 0 dan 1 adalah yang paling sering dipakai; nilai lebih besar
                                hanya berguna kalau kamu perlu ratio berbeda (misal 1:2:1).
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 11 BASIS & SHORTHAND ══════════════════════════════════════ */}
                    <Section id="basis" onClick={() => setActiveSection("basis")}>
                        <H2>flex-basis & shorthand flex<H2.anchor href="#basis">#</H2.anchor></H2>
                        <P>
                            <IC>flex-basis</IC> adalah ukuran item sebelum grow/shrink bekerja —
                            titik awal kalkulasi. Shorthand <IC>flex</IC> menggabungkan grow, shrink,
                            dan basis sekaligus dengan beberapa nilai preset yang penting diketahui.
                        </P>
                        <BasisPlayground />
                        <Code file="flex-shorthand.css">{`
/* flex: grow shrink basis */
.item { flex: 1 1 auto; }    /* grow:1 shrink:1 basis:auto */

/* Preset paling penting */
.item { flex: 1; }       /* = flex: 1 1 0% — grow+shrink, basis 0 (equal width) */
.item { flex: auto; }    /* = flex: 1 1 auto — grow+shrink, basis dari width */
.item { flex: none; }    /* = flex: 0 0 auto — tidak grow, tidak shrink (rigid) */
.item { flex: initial; } /* = flex: 0 1 auto — tidak grow, bisa shrink (default) */

/* flex: 1 vs flex: auto — perbedaan kritis */
/* flex: 1   → basis 0, share ALL space equally (ignore content size) */
/* flex: auto → basis dari ukuran konten, share REMAINING space */

/* Tailwind: flex-1 | flex-auto | flex-none | flex-initial */
            `}</Code>
                        <Callout type="php">
                            <Callout.icon>🐘</Callout.icon>
                            <Callout.content>
                                <Callout.title>Analogi PHP</Callout.title>
                                <IC>flex: 1</IC> seperti <IC>array_fill(0, $n, $total/$n)</IC> — bagi rata
                                tanpa peduli isi. <IC>flex: auto</IC> seperti membagi sisa setelah setiap
                                item "ambil porsinya sendiri" dulu berdasarkan konten.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 12 FREE SPACE ALGORITHM ═══════════════════════════════════ */}
                    <Section id="free-space" onClick={() => setActiveSection("free-space")}>
                        <H2>Free Space Algorithm<H2.anchor href="#free-space">#</H2.anchor></H2>
                        <P>
                            Bagaimana browser menghitung ukuran akhir tiap flex item — ini yang
                            bikin hasil kadang tidak sesuai ekspektasi kalau tidak paham algoritmanya.
                        </P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5 bg-[var(--surface)]">
                            {[
                                { step: "1", title: "Tentukan hypothetical main size tiap item", desc: "Browser hitung ukuran item berdasarkan flex-basis. Kalau basis: auto, pakai width/height item." },
                                { step: "2", title: "Hitung free space", desc: "free space = ukuran container − total hypothetical main size semua items − total gap" },
                                { step: "3", title: "Kalau free space POSITIF → distribusikan via flex-grow", desc: "Tambah ke basis tiap item sebanding dengan flex-grow ratio-nya." },
                                { step: "4", title: "Kalau free space NEGATIF → kurangi via flex-shrink", desc: "Kurangi dari basis, diperhitungkan × flex-basis item (bukan hanya ratio shrink saja)." },
                                { step: "5", title: "Batasi oleh min-content dan max-content", desc: "Item tidak bisa lebih kecil dari min-content (kecuali min-width: 0) atau lebih besar dari max-content." },
                            ].map(({ step, title, desc }) => (
                                <div key={step} className="flex gap-4 p-4 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0">
                                    <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center shrink-0">{step}</div>
                                    <div>
                                        <p className="text-sm font-semibold mb-1">{title}</p>
                                        <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Code file="free-space.css">{`
/* Contoh: container 500px, 3 items */
.container { display: flex; width: 500px; }
.item-a { flex: 1 1 100px; } /* basis 100px */
.item-b { flex: 2 1 100px; } /* basis 100px */
.item-c { flex: 1 1 100px; } /* basis 100px */

/* Total basis = 300px, free space = 500 - 300 = 200px */
/* flex-grow total = 1+2+1 = 4 */
/* A mendapat: 100 + (1/4 × 200) = 150px */
/* B mendapat: 100 + (2/4 × 200) = 200px */
/* C mendapat: 100 + (1/4 × 200) = 150px */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 13 ORDER ══════════════════════════════════════════════════ */}
                    <Section id="order" onClick={() => setActiveSection("order")}>
                        <H2>order<H2.anchor href="#order">#</H2.anchor></H2>
                        <P>
                            Mengubah urutan visual flex item tanpa mengubah DOM. Default semua
                            item adalah <IC>order: 0</IC>. Item dengan nilai lebih kecil muncul
                            lebih dulu, lebih besar muncul belakangan.
                        </P>
                        <OrderPlayground />
                        <Code file="order.css">{`
.item-a { order: 0; }    /* default */
.item-b { order: -1; }   /* muncul sebelum semua order:0 */
.item-c { order: 1; }    /* muncul setelah semua order:0 */
.item-d { order: 999; }  /* muncul paling terakhir */

/* Tailwind: order-first(-9999) | order-last(9999) | order-none(0) | order-1..12 */
            `}</Code>
                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>Sama seperti flex-direction reverse — hati-hati aksesibilitas</Callout.title>
                                <IC>order</IC> hanya mengubah urutan visual. Tab navigation dan screen
                                reader mengikuti urutan DOM, bukan visual. Jangan gunakan untuk membalik
                                urutan yang memiliki makna logis bagi pengguna keyboard/AT.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 14 PATTERN: CENTERING ═════════════════════════════════════ */}
                    <Section id="centering" onClick={() => setActiveSection("centering")}>
                        <H2>Pattern: Centering<H2.anchor href="#centering">#</H2.anchor></H2>
                        <P>Flexbox membuat centering yang dulu rumit jadi trivial.</P>
                        <div className="grid sm:grid-cols-2 gap-4 my-5">
                            {[
                                { label: "Perfect center", code: "flex items-center justify-center", bg: "bg-blue-50 border-blue-200" },
                                { label: "Vertical only", code: "flex items-center", bg: "bg-emerald-50 border-emerald-200" },
                                { label: "Horizontal only", code: "flex justify-center", bg: "bg-amber-50 border-amber-200" },
                                { label: "Single item", code: "flex; m: auto (on item)", bg: "bg-violet-50 border-violet-200" },
                            ].map(({ label, code, bg }) => (
                                <div key={label} className={`rounded-xl border p-3 h-24 flex items-center justify-center relative ${bg}`}>
                                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 shadow-sm" />
                                    <p className="absolute bottom-2 left-3 text-[10px] font-mono text-gray-500">{code}</p>
                                </div>
                            ))}
                        </div>
                        <Code file="centering.tsx">{`
import { tw } from "tailwind-styled-v4"

// Perfect center — horizontal + vertical
const Center = tw.div({ base: "flex items-center justify-center" })

// Full-screen loader
const Loader = tw.div({ base: "fixed inset-0 flex items-center justify-center bg-white/80 z-50" })

// Card dengan centered icon
const IconCard = tw.div({
  base: "flex flex-col items-center justify-center gap-3 p-8 rounded-xl bg-white border",
  sub: {
    icon:  "w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600",
    title: "text-sm font-semibold",
    desc:  "text-xs text-gray-500 text-center",
  },
})

// Single item center dengan margin: auto
const Container = tw.div({ base: "flex h-64" })
const CenteredItem = tw.div({ base: "m-auto w-32 h-32 bg-blue-500 rounded-xl" })
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 15 PATTERN: HOLY GRAIL ════════════════════════════════════ */}
                    <Section id="holy-grail" onClick={() => setActiveSection("holy-grail")}>
                        <H2>Pattern: Holy Grail Layout<H2.anchor href="#holy-grail">#</H2.anchor></H2>
                        <P>
                            Layout klasik: header + footer penuh lebar, konten tengah terdiri dari
                            sidebar kiri, main content, sidebar kanan — dengan main content yang
                            mengambil sisa ruang.
                        </P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5 text-[10px] font-mono">
                            <div className="bg-blue-200 p-2 text-center">Header (flex-shrink: 0)</div>
                            <div className="flex min-h-[100px]">
                                <div className="w-20 bg-emerald-200 p-2 flex items-center justify-center shrink-0">Sidebar L</div>
                                <div className="flex-1 bg-white p-2 flex items-center justify-center min-w-0">Main Content (flex: 1)</div>
                                <div className="w-20 bg-amber-200 p-2 flex items-center justify-center shrink-0">Sidebar R</div>
                            </div>
                            <div className="bg-blue-200 p-2 text-center">Footer (flex-shrink: 0)</div>
                        </div>
                        <Code file="holy-grail.tsx">{`
const AppLayout = tw.div({ base: "flex flex-col min-h-screen" })
const AppHeader = tw.header({ base: "shrink-0 h-16 border-b flex items-center px-6" })
const AppBody   = tw.div({ base: "flex flex-1 min-h-0" })
const SidebarL  = tw.aside({ base: "w-60 shrink-0 border-r overflow-y-auto" })
const MainContent = tw.main({ base: "flex-1 min-w-0 overflow-y-auto p-6" })
const SidebarR  = tw.aside({ base: "w-64 shrink-0 border-l overflow-y-auto hidden xl:block" })
const AppFooter = tw.footer({ base: "shrink-0 h-12 border-t flex items-center px-6" })

// Usage:
// <AppLayout>
//   <AppHeader>...</AppHeader>
//   <AppBody>
//     <SidebarL>...</SidebarL>
//     <MainContent>...</MainContent>
//     <SidebarR>...</SidebarR>
//   </AppBody>
//   <AppFooter>...</AppFooter>
// </AppLayout>
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 16 AUTO MARGIN ════════════════════════════════════════════ */}
                    <Section id="auto-margin" onClick={() => setActiveSection("auto-margin")}>
                        <H2>Auto Margin di Flex<H2.anchor href="#auto-margin">#</H2.anchor></H2>
                        <P>
                            Di flex context, <IC>margin: auto</IC> "memakan" semua free space yang
                            tersedia — jauh lebih powerful dari di block layout. Ini memungkinkan
                            push items ke sisi tertentu tanpa <IC>justify-content</IC>.
                        </P>
                        <div className="space-y-3 my-5">
                            {[
                                { label: "ml-auto → push ke kanan", className: "flex gap-2 border-2 border-dashed border-gray-300 rounded-lg p-3 bg-white" },
                            ].map(({ label, className }) => (
                                <div key={label}>
                                    <p className="text-[10px] text-gray-400 font-mono mb-1">{label}</p>
                                    <div className={className}>
                                        <FlexItem color={1} size="md">A</FlexItem>
                                        <FlexItem color={2} size="md">B</FlexItem>
                                        <FlexItem color={3} size="md" style={{ marginLeft: "auto" }}>C ← ml-auto</FlexItem>
                                        <FlexItem color={4} size="md">D</FlexItem>
                                    </div>
                                </div>
                            ))}
                            <div>
                                <p className="text-[10px] text-gray-400 font-mono mb-1">mx-auto pada satu item → center</p>
                                <div className="flex gap-2 border-2 border-dashed border-gray-300 rounded-lg p-3 bg-white">
                                    <FlexItem color={1} size="md">A</FlexItem>
                                    <FlexItem color={2} size="md" style={{ marginLeft: "auto", marginRight: "auto" }}>B ← mx-auto</FlexItem>
                                    <FlexItem color={3} size="md">C</FlexItem>
                                </div>
                            </div>
                        </div>
                        <Code file="auto-margin.tsx">{`
// Navbar: logo kiri, nav tengah, tombol kanan
const Navbar = tw.nav({ base: "flex items-center gap-4 px-6 h-16 border-b" })
// Logo di kiri natural
// Nav links: ml-auto untuk push ke kanan
// Atau logo → nav → ml-auto → tombol login

// Push satu item ke paling kanan
const Item = tw.div({
  variants: {
    pushRight: { true: "ml-auto" },
  },
})

// Vertikal: mt-auto push item ke bawah dalam flex-col
const Card = tw.div({ base: "flex flex-col h-full p-4" })
const CardBody   = tw.div({ base: "flex-1" })     // ambil sisa ruang
const CardFooter = tw.div({ base: "mt-auto pt-4" }) // atau mt-auto untuk push ke bawah
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 17 MIN-WIDTH ZERO TRAP ════════════════════════════════════ */}
                    <Section id="min-width-zero" onClick={() => setActiveSection("min-width-zero")}>
                        <H2>min-width: 0 trap<H2.anchor href="#min-width-zero">#</H2.anchor></H2>
                        <P>
                            Bug paling umum di flexbox: teks tidak mau <IC>truncate</IC> meski sudah
                            ditambahkan. Penyebabnya: flex items punya <IC>min-width: auto</IC>
                            secara default — yang artinya item tidak pernah lebih kecil dari ukuran
                            kontennya. Solusinya: tambahkan <IC>min-w-0</IC> pada item.
                        </P>
                        <div className="space-y-3 my-5">
                            <div>
                                <p className="text-[10px] text-rose-600 font-mono mb-1">❌ Tanpa min-w-0 — teks overflow keluar flex container</p>
                                <div className="flex gap-2 border-2 border-rose-200 rounded-lg p-3 bg-white overflow-hidden">
                                    <div className="w-16 h-10 bg-rose-400 rounded flex items-center justify-center text-white text-xs shrink-0">icon</div>
                                    <div className="flex-1 bg-red-50 border border-red-200 rounded p-2 text-xs">
                                        <p>Teks panjang yang harusnya truncate tapi tidak karena min-width: auto ini membuat flex item tidak mau menyusut lebih kecil dari ukuran kontennya</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-emerald-600 font-mono mb-1">✅ Dengan min-w-0 — truncate bekerja</p>
                                <div className="flex gap-2 border-2 border-emerald-200 rounded-lg p-3 bg-white">
                                    <div className="w-16 h-10 bg-emerald-400 rounded flex items-center justify-center text-white text-xs shrink-0">icon</div>
                                    <div className="flex-1 min-w-0 bg-emerald-50 border border-emerald-200 rounded p-2 text-xs">
                                        <p className="truncate">Teks panjang yang harusnya truncate tapi tidak karena min-width: auto ini membuat flex item tidak mau menyusut lebih kecil dari ukuran kontennya</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Code file="min-width-zero.tsx">{`
// ❌ Bug — truncate tidak bekerja
const Item = tw.div({ base: "flex-1" })             // min-width: auto (default!)
const Text = tw.p({ base: "truncate" })              // tidak ada efek

// ✅ Fix — tambah min-w-0
const Item = tw.div({ base: "flex-1 min-w-0" })     // override min-width: auto → 0
const Text = tw.p({ base: "truncate" })              // sekarang bekerja!

// Kapan perlu min-w-0:
// - Teks truncate dalam flex item
// - Tabel/pre dalam flex item
// - Nested flex yang perlu overflow hidden
// - Apapun yang perlu shrink lebih kecil dari kontennya
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 18 ABSOLUTE CHILD ═════════════════════════════════════════ */}
                    <Section id="absolute-flex" onClick={() => setActiveSection("absolute-flex")}>
                        <H2>Absolute child di dalam Flex container<H2.anchor href="#absolute-flex">#</H2.anchor></H2>
                        <P>
                            Kalau kamu set <IC>position: absolute</IC> pada flex item, item tersebut
                            <strong> keluar dari flex formatting context</strong> — tidak ikut
                            distribute space, tidak ikut flex-grow/shrink, tidak mempengaruhi
                            ukuran container. Tapi flex container tetap jadi containing block-nya
                            kalau punya <IC>position</IC> selain static.
                        </P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] p-4 my-5 bg-[var(--surface)]">
                            <div className="flex gap-2 relative h-20 border-2 border-dashed border-gray-300 rounded-lg bg-white p-2">
                                <FlexItem color={1} size="md">A</FlexItem>
                                <FlexItem color={2} size="md">B</FlexItem>
                                <div className="absolute top-2 right-2 w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center text-white text-[10px] font-bold shadow-lg">abs</div>
                                <FlexItem color={3} size="md">C</FlexItem>
                            </div>
                            <p className="text-[10px] text-gray-400 font-mono mt-2">Item "abs" (merah kanan) tidak mempengaruhi A, B, C — dia absolute</p>
                        </div>
                        <Code file="absolute-in-flex.tsx">{`
// Flex container dengan absolute child
const CardContainer = tw.div({
  base: "flex gap-3 relative", // relative = containing block untuk absolute child
})

// Item ini KELUAR dari flex flow
const Badge = tw.div({
  base: "absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center",
})

// Item ini tetap dalam flex flow
const RegularItem = tw.div({ base: "flex-1" })

// Catatan: absolute child tidak "memberi tahu" flex container ukurannya
// Container tidak tahu ada absolute child → bisa overlap kalau tidak diperhatikan
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ INLINE-FLEX ═══════════════════════════════════════════════ */}
                    <Section id="inline-flex" onClick={() => setActiveSection("inline-flex")}>
                        <H2>display: inline-flex<H2.anchor href="#inline-flex">#</H2.anchor></H2>
                        <P>
                            <IC>display: flex</IC> membuat container yang berperilaku <strong>block</strong>
                            di luar (ambil full lebar, mulai baris baru). <IC>display: inline-flex</IC>
                            membuat container yang berperilaku <strong>inline</strong> di luar —
                            bisa mengalir bersama teks — tapi tetap punya flex formatting context
                            untuk children-nya.
                        </P>
                        <div className="space-y-3 my-5">
                            <div>
                                <p className="text-[10px] text-gray-400 font-mono mb-2">display: flex — full lebar, baris sendiri</p>
                                <p className="text-sm bg-white border border-gray-200 rounded-lg p-3">
                                    Teks sebelum{" "}
                                    <span className="flex gap-1 bg-blue-100 border border-blue-300 rounded px-2 py-1">
                                        <span className="w-6 h-6 rounded bg-blue-400 text-white text-[10px] flex items-center justify-center font-bold">A</span>
                                        <span className="w-6 h-6 rounded bg-blue-400 text-white text-[10px] flex items-center justify-center font-bold">B</span>
                                    </span>
                                    {" "}teks sesudah (perhatikan flex container ambil baris penuh)
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-mono mb-2">display: inline-flex — mengalir bersama teks</p>
                                <p className="text-sm bg-white border border-gray-200 rounded-lg p-3">
                                    Teks sebelum{" "}
                                    <span className="inline-flex gap-1 bg-emerald-100 border border-emerald-300 rounded px-2 py-1">
                                        <span className="w-6 h-6 rounded bg-emerald-400 text-white text-[10px] flex items-center justify-center font-bold">A</span>
                                        <span className="w-6 h-6 rounded bg-emerald-400 text-white text-[10px] flex items-center justify-center font-bold">B</span>
                                    </span>
                                    {" "}teks sesudah — container mengalir inline seperti kata biasa.
                                </p>
                            </div>
                        </div>
                        <Code file="inline-flex.css">{`
/* flex — outer: block, inner: flex */
.container { display: flex; }
/* Mengambil full lebar parent, mulai baris baru (seperti div biasa)
   tapi children diatur oleh flexbox */

/* inline-flex — outer: inline, inner: flex */
.container { display: inline-flex; }
/* Mengalir bersama teks (seperti span), lebarnya mengikuti konten
   tapi children tetap diatur oleh flexbox */

/* Kapan pakai inline-flex: */
/* - Badge dengan icon: <Badge><Icon/> Label</Badge> */
/* - Button dengan icon: <Button><Icon/> Text</Button> */
/* - Chip/tag components yang mengalir dalam teks */
/* - Tooltip trigger inline */

/* Tailwind: flex | inline-flex */
                        `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                <IC>inline-flex</IC> adalah pilihan tepat untuk komponen
                                button, badge, chip, dan tag. Mereka butuh flexbox untuk
                                menyelaraskan icon + teks secara internal, tapi perlu
                                mengalir inline di dalam paragraf atau kalimat.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ PLACE SHORTCUTS ════════════════════════════════════════════ */}
                    <Section id="place-shortcuts" onClick={() => setActiveSection("place-shortcuts")}>
                        <H2>place-content, place-items, place-self<H2.anchor href="#place-shortcuts">#</H2.anchor></H2>
                        <P>
                            Tiga shorthand alignment yang menggabungkan properti cross-axis dan
                            main-axis sekaligus. Di flex context, <IC>justify-*</IC> tidak berlaku
                            per-item (tidak ada <IC>justify-self</IC> di flex), sehingga
                            <IC>place-self</IC> dan <IC>place-items</IC> hanya mempengaruhi
                            cross axis.
                        </P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
                            <div className="grid grid-cols-4 px-4 py-2 bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                                {["Shorthand", "Expands to", "Di flex", "Di grid"].map(h => (
                                    <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">{h}</span>
                                ))}
                            </div>
                            {[
                                { sh: "place-content: X", exp: "align-content: X;\njustify-content: X", flex: "✅ align-content berlaku\n(justify-content juga)", grid: "✅ Keduanya berlaku" },
                                { sh: "place-items: X", exp: "align-items: X;\njustify-items: X", flex: "⚠️ Hanya align-items.\njustify-items diabaikan di flex", grid: "✅ Keduanya berlaku" },
                                { sh: "place-self: X", exp: "align-self: X;\njustify-self: X", flex: "⚠️ Hanya align-self.\njustify-self tidak ada di flex", grid: "✅ Keduanya berlaku" },
                            ].map(row => (
                                <div key={row.sh} className="grid grid-cols-4 px-4 py-3 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0 gap-2 items-start">
                                    <IC className="self-start text-[10px]">{row.sh}</IC>
                                    <pre className="text-[10px] font-mono text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] whitespace-pre">{row.exp}</pre>
                                    <span className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] whitespace-pre">{row.flex}</span>
                                    <span className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] whitespace-pre">{row.grid}</span>
                                </div>
                            ))}
                        </div>
                        <Code file="place-shortcuts.css">{`
/* place-content — shorthand untuk align-content + justify-content */
.container {
  display: flex;
  flex-wrap: wrap;
  place-content: center;           /* = align-content: center; justify-content: center; */
  place-content: space-between end; /* = align-content: space-between; justify-content: end; */
}

/* place-items — shorthand untuk align-items + justify-items */
.container {
  display: flex;
  place-items: center;    /* = align-items: center; (justify-items DIABAIKAN di flex) */
  place-items: start end; /* = align-items: start; (end untuk justify diabaikan) */
}

/* place-self — shorthand untuk align-self + justify-self (di item) */
.item {
  place-self: center;     /* = align-self: center; (justify-self DIABAIKAN di flex) */
}

/* Di flex, untuk centering cepat: */
.flex-center {
  display: flex;
  place-items: center;      /* center cross axis */
  justify-content: center;  /* center main axis — tetap butuh ini karena place-items tidak cover */
}
/* Atau lebih eksplisit: */
.flex-center {
  display: flex;
  place-content: center;   /* cover justify-content: center */
  align-items: center;     /* cover cross axis */
}

/* Tailwind tidak punya built-in place-* untuk flex:
   [place-content:center] [place-items:center] [place-self:center] */
                        `}</Code>
                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>justify-self tidak ada di Flexbox</Callout.title>
                                Ini sering bikin bingung — di Grid, <IC>justify-self</IC> bekerja per-item.
                                Di Flex, items dikontrol secara <em>group</em> di main axis via
                                <IC>justify-content</IC> saja. Tidak ada cara untuk justify satu flex item
                                secara individual di main axis — gunakan <IC>margin: auto</IC> sebagai
                                workaround.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 19 TW USAGE ═══════════════════════════════════════════════ */}
                    <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
                        <H2>Flexbox di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
                        <Code file="flex-components.tsx">{`
import { tw } from "tailwind-styled-v4"

// Stack vertikal
const VStack = tw.div({
  base: "flex flex-col",
  variants: {
    gap: { sm: "gap-2", md: "gap-4", lg: "gap-6", xl: "gap-8" },
    align: { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" },
  },
  defaultVariants: { gap: "md", align: "stretch" },
})

// Stack horizontal
const HStack = tw.div({
  base: "flex flex-row",
  variants: {
    gap:   { sm: "gap-2", md: "gap-4", lg: "gap-6" },
    align: { start: "items-start", center: "items-center", end: "items-end" },
    wrap:  { true: "flex-wrap", false: "" },
  },
  defaultVariants: { gap: "md", align: "center", wrap: false },
})

// Spacer — push items auseinander
const Spacer = tw.div({ base: "flex-1" })

// Navbar pattern
const Navbar = tw.nav({
  base: "flex items-center gap-4 h-16 px-6 border-b",
  sub: {
    brand: "font-bold text-lg mr-auto", // push semua ke kanan
    links: "flex items-center gap-2",
    actions: "flex items-center gap-2 ml-auto", // push ke kanan
  },
})

// Card grid dengan equal height cards
const CardGrid = tw.div({
  base: "flex flex-wrap gap-4",
  sub: {
    item: "flex flex-col flex-1 min-w-64 border rounded-xl p-4", // equal height via stretch default
    body: "flex-1",       // push footer ke bawah
    footer: "mt-auto pt-4 border-t",
  },
})
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 20 EXERCISE ═══════════════════════════════════════════════ */}
                    <Section id="exercise" onClick={() => setActiveSection("exercise")}>
                        <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Navbar responsif</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat komponen <IC>Navbar</IC> dengan <IC>tw.nav</IC> yang punya logo di kiri, nav links di tengah (pakai <IC>mx-auto</IC>), dan tombol CTA di kanan.</p>
                                <p>Di mobile (<IC>md:</IC>), sembunyikan nav links dan tampilkan hamburger menu icon.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Card grid equal height</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat <IC>ProductCard</IC> yang berisi gambar, judul, deskripsi, harga, dan tombol "Beli". Konten deskripsi bisa berbeda panjang.</p>
                                <p>Pastikan semua card sama tinggi di dalam flex row, dan tombol "Beli" selalu ada di bagian bawah card (gunakan <IC>flex-col</IC> + <IC>mt-auto</IC> pada tombol).</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Holy Grail layout lengkap</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Implementasikan layout dengan header sticky, sidebar kiri (200px fixed), main content yang flex-1, dan footer di bawah.</p>
                                <p>Pastikan main content bisa scroll secara independen, sidebar tidak scroll dengan konten, dan layout tidak overflow di layar kecil.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 4 — Debug min-width: 0</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat list item dengan avatar (fixed size), nama pengguna (harus truncate), dan badge role di kanan.</p>
                                <p>Sengaja <em>tanpa</em> <IC>min-w-0</IC> dulu, lihat teks overflow. Kemudian fix dengan menambahkan <IC>min-w-0</IC> di tempat yang tepat.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 5 — Flex ratio calculator</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat layout 3 kolom dengan proporsi 1:2:1 menggunakan <IC>flex-grow</IC>. Kemudian ubah ke proporsi 2:3:1 dan 1:1:1.</p>
                                <p>Bandingkan hasil <IC>flex: 1</IC> vs <IC>flex: auto</IC> — buat salah satu kolom punya konten panjang dan lihat perbedaannya.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 6 — Chat bubble layout</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat komponen chat: pesan dari "saya" di kanan (<IC>flex-row-reverse</IC> + avatar), pesan dari "orang lain" di kiri (urutan normal).</p>
                                <p>Bubble chat harus punya <IC>max-w-[70%]</IC> dan teks di dalam tidak overflow. Gunakan <IC>variants</IC> untuk tipe: sent/received.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 7 — Reorder dengan order property</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat komponen artikel dengan struktur DOM: gambar → judul → deskripsi. Di desktop, tampilkan urutan normal. Di mobile (<IC>max-sm:</IC>), tampilkan judul dulu, kemudian gambar, kemudian deskripsi — menggunakan <IC>order</IC> tanpa mengubah HTML.</p>
                                <p>Diskusikan trade-off aksesibilitas dari pendekatan ini.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/dasar-css/normal-flow" dir="prev">
                            <NavBtn.hint>← Previous</NavBtn.hint>
                            <NavBtn.label>Normal Flow</NavBtn.label>
                        </NavBtn>
                        <NavBtn href="/learn/dasar-css/css-grid" dir="next">
                            <NavBtn.hint>Next →</NavBtn.hint>
                            <NavBtn.label>CSS Grid</NavBtn.label>
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
                        <a href="https://github.com/Dictionar32/tailwind-styled-v4" target="_blank"
                            className="text-xs text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1">
                            Edit on GitHub ↗
                        </a>
                    </div>
                </Toc>
            </Body>
        </Page>
    )
}