/**
 * CSS Layout — CSS Grid (Complete)
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
const TocLabel = tw.p({ base: "text-[10px] font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--foreground)_35%,transparent)] mb-3" })
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
const PageDesc = tw.p({ base: "text-base text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] mb-10 leading-relaxed" })
const Divider = tw.hr({ base: "border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] my-10" })
const Section = tw.section({ base: "scroll-mt-20 mb-10" })
const H2 = tw.h2({
    base: "text-xl font-bold mb-4 scroll-mt-20 flex items-center gap-2 group",
    sub: { "a:anchor": "opacity-0 group-hover:opacity-100 text-[var(--accent)] text-base no-underline" },
})
const H3 = tw.h3({ base: "text-base font-semibold mb-3 mt-6 scroll-mt-20" })
const P = tw.p({ base: "text-sm leading-7 text-[color-mix(in_srgb,var(--foreground)_80%,transparent)] mb-4" })
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
const PageNav = tw.div({ base: "flex items-center justify-between mt-16 pt-6 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" })
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
        canvas: "p-4 bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] min-h-40",
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

// ─── Grid cell primitive ──────────────────────────────────────────────────────

const GCell = tw.div({
    base: "rounded-lg flex items-center justify-center text-[11px] font-bold text-white transition-all duration-300 p-2",
    variants: {
        color: {
            1: "bg-rose-400", 2: "bg-blue-400",
            3: "bg-emerald-400", 4: "bg-amber-400",
            5: "bg-violet-400", 6: "bg-pink-400",
            7: "bg-cyan-400", 8: "bg-orange-400",
            accent: "bg-[var(--accent)]",
        },
    },
    defaultVariants: { color: 1 },
})

// ─── TOC ──────────────────────────────────────────────────────────────────────

const TOC = [
    { id: "intro", label: "Apa itu CSS Grid" },
    { id: "concepts", label: "Konsep Dasar" },
    { id: "template-cols", label: "grid-template-columns" },
    { id: "template-rows", label: "grid-template-rows" },
    { id: "fr-unit", label: "fr unit" },
    { id: "repeat", label: "repeat() & auto-fill/fit" },
    { id: "minmax", label: "minmax()" },
    { id: "gap", label: "gap" },
    { id: "placement", label: "Line-based Placement" },
    { id: "span", label: "span" },
    { id: "overlap", label: "Overlapping Grid Items" },
    { id: "template-areas", label: "grid-template-areas" },
    { id: "named-lines", label: "Named Grid Lines" },
    { id: "implicit", label: "Implicit Grid & auto-flow" },
    { id: "auto-flow-dense", label: "grid-auto-flow: dense" },
    { id: "alignment", label: "Alignment di Grid" },
    { id: "subgrid", label: "subgrid" },
    { id: "fit-content", label: "fit-content()" },
    { id: "logical-values", label: "Logical Values & Writing Modes" },
    { id: "grid-shorthand", label: "grid shorthand" },
    { id: "vs-flexbox", label: "Grid vs Flexbox" },
    { id: "patterns", label: "Pattern Umum" },
    { id: "tw-usage", label: "Pakai di tw" },
    { id: "exercise", label: "Latihan" },
]

// ─── Code component ───────────────────────────────────────────────────────────

function Code({ file, children }: { file?: string; children: string }) {
    const [copied, setCopied] = useState(false)
    return (
        <CodeWrap>
            <CodeWrap.header>
                <CodeWrap.filename>{file ?? "css"}</CodeWrap.filename>
                <CopyBtn copied={copied} onClick={() => {
                    navigator.clipboard.writeText(children.trim())
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                }}>
                    {copied ? "✓ Copied" : "Copy"}
                </CopyBtn>
            </CodeWrap.header>
            <CodeWrap.body>{children.trim()}</CodeWrap.body>
        </CodeWrap>
    )
}

// ─── Playground: grid-template-columns ───────────────────────────────────────

type ColsMode = "3-equal" | "1-2-1" | "sidebar" | "auto" | "minmax" | "dense-fill"

function ColsPlayground() {
    const [mode, setMode] = useState<ColsMode>("3-equal")
    const gridClass: Record<ColsMode, string> = {
        "3-equal": "grid-cols-3",
        "1-2-1": "grid-cols-[1fr_2fr_1fr]",
        "sidebar": "grid-cols-[200px_1fr]",
        "auto": "grid-cols-[auto_1fr_auto]",
        "minmax": "grid-cols-[minmax(100px,200px)_1fr_1fr]",
        "dense-fill": "grid-cols-[repeat(auto-fill,minmax(80px,1fr))]",
    }
    const desc: Record<ColsMode, string> = {
        "3-equal": "grid-template-columns: repeat(3, 1fr) — 3 kolom sama lebar.",
        "1-2-1": "1fr 2fr 1fr — kolom tengah dua kali lebih lebar dari yang lain.",
        "sidebar": "200px 1fr — sidebar tetap 200px, konten ambil sisa space.",
        "auto": "auto 1fr auto — kolom pertama dan terakhir menyesuaikan konten, tengah flex.",
        "minmax": "minmax(100px,200px) 1fr 1fr — kolom pertama antara 100–200px.",
        "dense-fill": "repeat(auto-fill, minmax(80px,1fr)) — auto-fill kolom selebar minimal 80px.",
    }
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 grid-template-columns — pola kolom</PlaygroundWrap.label>
                <ChipRow>
                    {(["3-equal", "1-2-1", "sidebar", "auto", "minmax", "dense-fill"] as ColsMode[]).map(v => (
                        <Chip key={v} active={mode === v} onClick={() => setMode(v)}>{v}</Chip>
                    ))}
                </ChipRow>
                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{desc[mode]}</p>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div className={`grid gap-2 ${gridClass[mode]}`}>     
                     <GCell color="accent">1</GCell>
                    <GCell color="accent">2</GCell>
                    <GCell color="accent">3</GCell>
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {mode === "3-equal" && "grid-template-columns: repeat(3, 1fr);"}
                {mode === "1-2-1" && "grid-template-columns: 1fr 2fr 1fr;"}
                {mode === "sidebar" && "grid-template-columns: 200px 1fr;"}
                {mode === "auto" && "grid-template-columns: auto 1fr auto;"}
                {mode === "minmax" && "grid-template-columns: minmax(100px, 200px) 1fr 1fr;"}
                {mode === "dense-fill" && "grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));"}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: fr unit ─────────────────────────────────────────────────────

function FrPlayground() {
    const [cols, setCols] = useState<string>("1fr 1fr 1fr")
    const presets = ["1fr 1fr 1fr", "1fr 2fr 1fr", "1fr 3fr", "2fr 1fr 1fr", "1fr 1fr 1fr 1fr"]
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 fr unit — fraction of available space</PlaygroundWrap.label>
                <ChipRow>
                    {presets.map(v => (
                        <Chip key={v} active={cols === v} onClick={() => setCols(v)}>{v}</Chip>
                    ))}
                </ChipRow>
                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
                    <IC>fr</IC> adalah fraction dari space yang tersisa setelah ukuran tetap dialokasikan.
                    Total fr dibagi sesuai ratio — mirip flex-grow.
                </p>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div className="grid gap-2" style={{ gridTemplateColumns: cols }}>
                    <GCell color={1}>1</GCell>
                    <GCell color={2}>2</GCell>
                    <GCell color={3}>3</GCell>
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{`grid-template-columns: ${cols};`}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: repeat + auto-fill/fit ──────────────────────────────────────

type RepeatMode = "repeat-3" | "auto-fill" | "auto-fit" | "auto-fill-min" | "auto-fit-min"

function RepeatPlayground() {
    const [mode, setMode] = useState<RepeatMode>("auto-fill")
    const gridStyle: Record<RepeatMode, string> = {
        "repeat-3": "repeat(3, 1fr)",
        "auto-fill": "repeat(auto-fill, 80px)",
        "auto-fit": "repeat(auto-fit, 80px)",
        "auto-fill-min": "repeat(auto-fill, minmax(80px, 1fr))",
        "auto-fit-min": "repeat(auto-fit, minmax(80px, 1fr))",
    }
    const desc: Record<RepeatMode, string> = {
        "repeat-3": "repeat(3, 1fr) — selalu 3 kolom tepat, tidak responsif.",
        "auto-fill": "auto-fill: isi kolom sebanyak mungkin, kolom kosong tetap ADA (space reserved).",
        "auto-fit": "auto-fit: isi kolom sebanyak mungkin, kolom kosong di-COLLAPSE (space tidak ada).",
        "auto-fill-min": "auto-fill + minmax: kolom sebanyak mungkin, tapi masing-masing minimal 80px dan maksimal 1fr. Responsif tanpa media query!",
        "auto-fit-min": "auto-fit + minmax: sama, tapi kolom kosong di-collapse sehingga items stretch penuh.",
    }
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 repeat() — auto-fill vs auto-fit</PlaygroundWrap.label>
                <ChipRow>
                    {(["repeat-3", "auto-fill", "auto-fit", "auto-fill-min", "auto-fit-min"] as RepeatMode[]).map(v => (
                        <Chip key={v} active={mode === v} onClick={() => setMode(v)}>{v}</Chip>
                    ))}
                </ChipRow>
                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{desc[mode]}</p>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div className="grid gap-2" style={{ gridTemplateColumns: gridStyle[mode] }}>
                    {[1, 2, 3].map(n => (
                        <GCell key={n} color={1}>{n}</GCell>
                    ))}
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{`grid-template-columns: ${gridStyle[mode]};`}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: line-based placement ────────────────────────────────────────

type PlacementMode = "normal" | "col-span" | "row-span" | "both-span" | "specific-line"

function PlacementPlayground() {
    const [mode, setMode] = useState<PlacementMode>("normal")
    const desc: Record<PlacementMode, string> = {
        normal: "Auto placement — browser menempatkan secara otomatis.",
        "col-span": "Item 1 span 2 kolom — mengambil 2 sel horizontal.",
        "row-span": "Item 1 span 2 baris — mengambil 2 sel vertikal.",
        "both-span": "Item 1 span 2×2 — mengambil blok 2 kolom × 2 baris.",
        "specific-line": "Item 1 ditempatkan di kolom 2 sampai 4, baris 1.",
    }
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 Line-based placement — grid-column & grid-row</PlaygroundWrap.label>
                <ChipRow>
                    {(["normal", "col-span", "row-span", "both-span", "specific-line"] as PlacementMode[]).map(v => (
                        <Chip key={v} active={mode === v} onClick={() => setMode(v)}>{v}</Chip>
                    ))}
                </ChipRow>
                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{desc[mode]}</p>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div className="grid grid-cols-3 gap-2">
                    <GCell color={1} style={{
                        gridColumn: mode === "col-span" ? "span 2" : mode === "both-span" ? "span 2" : mode === "specific-line" ? "2 / 4" : undefined,
                        gridRow: mode === "row-span" ? "span 2" : mode === "both-span" ? "span 2" : undefined,
                    }}>
                        {mode === "normal" ? "1" : mode === "col-span" ? "1 (col-span 2)" : mode === "row-span" ? "1 (row-span 2)" : mode === "both-span" ? "1 (2×2)" : "1 (col 2→4)"}
                    </GCell>
                    {["2", "3", "4", "5", "6", "7"].map(n => (
                        <GCell key={n} color={1}>{n}</GCell>
                    ))}
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {mode === "normal" && "/* auto placement — tidak ada CSS tambahan */"}
                {mode === "col-span" && ".item-1 { grid-column: span 2; }"}
                {mode === "row-span" && ".item-1 { grid-row: span 2; }"}
                {mode === "both-span" && ".item-1 { grid-column: span 2; grid-row: span 2; }"}
                {mode === "specific-line" && ".item-1 { grid-column: 2 / 4; grid-row: 1; }"}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: grid-template-areas ─────────────────────────────────────────

type AreaMode = "page-layout" | "dashboard" | "magazine"

function TemplateAreasPlayground() {
    const [mode, setMode] = useState<AreaMode>("page-layout")

    const configs: Record<AreaMode, { areas: string; cols: string; rows: string; items: { area: string; label: string; color: string }[] }> = {
        "page-layout": {
            areas: '"header header" "sidebar main" "footer footer"',
            cols: "200px 1fr", rows: "auto 1fr auto",
            items: [
                { area: "header", label: "header", color: "bg-blue-400" },
                { area: "sidebar", label: "sidebar", color: "bg-emerald-400" },
                { area: "main", label: "main", color: "bg-amber-400" },
                { area: "footer", label: "footer", color: "bg-rose-400" },
            ],
        },
        "dashboard": {
            areas: '"nav nav nav" "stats stats aside" "chart chart aside" "table table table"',
            cols: "1fr 1fr 200px", rows: "auto auto auto auto",
            items: [
                { area: "nav", label: "nav", color: "bg-blue-400" },
                { area: "stats", label: "stats", color: "bg-emerald-400" },
                { area: "aside", label: "aside", color: "bg-violet-400" },
                { area: "chart", label: "chart", color: "bg-amber-400" },
                { area: "table", label: "table", color: "bg-rose-400" },
            ],
        },
        "magazine": {
            areas: '"title title img" "lead lead img" "col1 col2 col3"',
            cols: "1fr 1fr 1fr", rows: "auto auto auto",
            items: [
                { area: "title", label: "title", color: "bg-blue-400" },
                { area: "lead", label: "lead", color: "bg-indigo-400" },
                { area: "img", label: "img", color: "bg-emerald-400" },
                { area: "col1", label: "col 1", color: "bg-amber-400" },
                { area: "col2", label: "col 2", color: "bg-orange-400" },
                { area: "col3", label: "col 3", color: "bg-rose-400" },
            ],
        },
    }

    const cfg = configs[mode]
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 grid-template-areas — layout deklaratif dengan nama area</PlaygroundWrap.label>
                <ChipRow>
                    {(["page-layout", "dashboard", "magazine"] as AreaMode[]).map(v => (
                        <Chip key={v} active={mode === v} onClick={() => setMode(v)}>{v}</Chip>
                    ))}
                </ChipRow>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div className="grid gap-2 min-h-[180px]" style={{ gridTemplateAreas: cfg.areas, gridTemplateColumns: cfg.cols, gridTemplateRows: cfg.rows }}>
                    {cfg.items.map(item => (
                        <div key={item.area} style={{ gridArea: item.area }}
                            className={`${item.color} rounded-lg flex items-center justify-center text-white text-[11px] font-bold p-2`}>
                            {item.label}
                        </div>
                    ))}
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {`grid-template-areas: ${cfg.areas};\ngrid-template-columns: ${cfg.cols};`}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: auto-flow dense ─────────────────────────────────────────────

type DenseMode = "normal" | "dense"

function DensePlayground() {
    const [dense, setDense] = useState<DenseMode>("normal")
    // Item 2 dan 4 span 2 kolom sehingga ada gap kalau tidak dense
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 grid-auto-flow: dense — isi lubang di grid</PlaygroundWrap.label>
                <ChipRow>
                    <Chip active={dense === "normal"} onClick={() => setDense("normal")}>normal (default)</Chip>
                    <Chip active={dense === "dense"} onClick={() => setDense("dense")}>dense</Chip>
                </ChipRow>
                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
                    {dense === "normal"
                        ? "Items ditempatkan secara berurutan — ada 'lubang' kalau item besar tidak muat di posisi berikutnya."
                        : "dense: browser mengisi lubang dengan item yang lebih kecil — urutan visual berubah dari DOM order."}
                </p>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div className="grid grid-cols-3 gap-2" style={{ gridAutoFlow: dense === "dense" ? "row dense" : "row" }}>
                    {[
                        { n: "1", span: false },
                        { n: "2 (span2)", span: true },
                        { n: "3", span: false },
                        { n: "4 (span2)", span: true },
                        { n: "5", span: false },
                        { n: "6", span: false },
                    ].map(({ n, span }, i) => (
                        <GCell  color={1}
                            style={{ gridColumn: span ? "span 2" : undefined }}>
                            {n}
                        </GCell>
                    ))}
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{`grid-auto-flow: ${dense === "dense" ? "row dense" : "row"}; /* dense mengisi 'lubang' dari items lebih kecil */`}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: alignment ────────────────────────────────────────────────────

type AlignGridMode = "justify-items" | "align-items" | "place-items" | "justify-self" | "align-self"
type AlignValue = "start" | "end" | "center" | "stretch"

function AlignmentPlayground() {
    const [prop, setProp] = useState<AlignGridMode>("justify-items")
    const [value, setValue] = useState<AlignValue>("start")

    const desc: Record<AlignGridMode, string> = {
        "justify-items": "justify-items — posisi SEMUA items di inline axis (horizontal di LTR) dalam cell-nya.",
        "align-items": "align-items — posisi SEMUA items di block axis (vertikal) dalam cell-nya.",
        "place-items": "place-items — shorthand align-items + justify-items sekaligus.",
        "justify-self": "justify-self — override justify-items untuk SATU item saja (item 1/merah).",
        "align-self": "align-self — override align-items untuk SATU item saja (item 1/merah).",
    }

    const containerStyle: Record<AlignGridMode, React.CSSProperties> = {
        "justify-items": { justifyItems: value },
        "align-items": { alignItems: value },
        "place-items": { placeItems: value },
        "justify-self": {},
        "align-self": {},
    }
    const item1Style: Record<AlignGridMode, React.CSSProperties> = {
        "justify-items": {},
        "align-items": {},
        "place-items": {},
        "justify-self": { justifySelf: value },
        "align-self": { alignSelf: value },
    }

    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 Alignment di Grid — justify/align/place</PlaygroundWrap.label>
                <div className="space-y-2">
                    <ChipRow>
                        {(["justify-items", "align-items", "place-items", "justify-self", "align-self"] as AlignGridMode[]).map(v => (
                            <Chip key={v} active={prop === v} onClick={() => setProp(v)}>{v}</Chip>
                        ))}
                    </ChipRow>
                    <ChipRow>
                        {(["start", "end", "center", "stretch"] as AlignValue[]).map(v => (
                            <Chip key={v} active={value === v} onClick={() => setValue(v)}>{v}</Chip>
                        ))}
                    </ChipRow>
                </div>
                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{desc[prop]}</p>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div className="grid grid-cols-3 gap-2 h-40" style={containerStyle[prop]}>
                    {["1", "2", "3", "4", "5", "6"].map((n, i) => (
                        <div key={n} className="bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] rounded border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] flex items-center justify-center">
                            <GCell color={1}
                                style={i === 0 ? item1Style[prop] : {}}>
                                {n}{i === 0 && (prop === "justify-self" || prop === "align-self") ? "←self" : ""}
                            </GCell>
                        </div>
                    ))}
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {(prop === "justify-self" || prop === "align-self")
                    ? `.item-1 { ${prop}: ${value}; }`
                    : `.container { ${prop}: ${value}; }`}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CssGridPage() {
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
                        <Breadcrumb.curr>CSS Grid</Breadcrumb.curr>
                    </Breadcrumb>
                </TopBarInner>
            </TopBar>

            <Body>
                <Content>
                    <PageTitle>CSS Grid</PageTitle>
                    <PageDesc>CSS Grid Layout — model layout dua dimensi yang mengatur items dalam baris dan kolom secara bersamaan. Lebih powerful dari Flexbox untuk layout yang butuh kontrol di dua arah sekaligus.</PageDesc>

                    {/* ══ 01 INTRO ══════════════════════════════════════════════════ */}
                    <Section id="intro" onClick={() => setActiveSection("intro")}>
                        <H2>Apa itu CSS Grid<H2.anchor href="#intro">#</H2.anchor></H2>
                        <P>CSS Grid adalah sistem layout dua dimensi — kamu mendefinisikan baris dan kolom, lalu menempatkan items di posisi tertentu atau membiarkan browser melakukannya secara otomatis.</P>
                        <Callout type="php">
                            <Callout.icon>🐘</Callout.icon>
                            <Callout.content>
                                <Callout.title>Analogi PHP</Callout.title>
                                Grid seperti tabel database — kamu definisikan schema kolom (<IC>grid-template-columns</IC>), baris terbentuk otomatis saat data masuk (<IC>grid-auto-rows</IC>), dan kamu bisa query item ke posisi spesifik (<IC>grid-column</IC>, <IC>grid-row</IC>).
                            </Callout.content>
                        </Callout>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
                            {[
                                { term: "Grid container", def: "Elemen dengan display: grid atau inline-grid. Mendefinisikan track (baris/kolom)." },
                                { term: "Grid item", def: "Child langsung grid container. Bisa ditempatkan di posisi tertentu atau otomatis." },
                                { term: "Grid track", def: "Satu baris atau satu kolom di grid — area antara dua grid lines." },
                                { term: "Grid line", def: "Garis pemisah antar track. Diberi nomor mulai dari 1 (atau -1 dari kanan)." },
                                { term: "Grid cell", def: "Satu irisan antara satu track kolom dan satu track baris — unit terkecil grid." },
                                { term: "Grid area", def: "Satu atau lebih cells yang membentuk persegi panjang." },
                                { term: "Explicit grid", def: "Track yang didefinisikan dengan grid-template-columns/rows." },
                                { term: "Implicit grid", def: "Track yang dibuat browser otomatis ketika items melebihi explicit grid." },
                            ].map(({ term, def }) => (
                                <div key={term} className="flex gap-4 p-3 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0">
                                    <IC className="shrink-0 self-start">{term}</IC>
                                    <p className="text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)] leading-relaxed">{def}</p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Divider />

                    {/* ══ 02 CONCEPTS ═══════════════════════════════════════════════ */}
                    <Section id="concepts" onClick={() => setActiveSection("concepts")}>
                        <H2>Konsep Dasar — Grid Lines<H2.anchor href="#concepts">#</H2.anchor></H2>
                        <P>Grid lines adalah fondasi sistem penempatan. Untuk grid 3 kolom, ada 4 vertical lines (1 sampai 4) dan jumlah baris tergantung items. Lines bisa dinomori dari kiri (1,2,3...) atau dari kanan (-1,-2,-3...).</P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] p-4 my-5 bg-[var(--surface)]">
                            <p className="text-[10px] font-mono text-gray-400 mb-3">Grid 3×2 — grid lines ditampilkan</p>
                            <div className="relative">
                                <div className="grid grid-cols-3 gap-0 border border-gray-300">
                                    {Array.from({ length: 6 }, (_, i) => (
                                        <div key={i} className="border border-gray-200 h-12 flex items-center justify-center text-[10px] text-gray-400 font-mono">
                                            cell {i + 1}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-1 px-0">
                                    {["1", "2", "3", "4"].map(n => (
                                        <span key={n} className="text-[10px] text-blue-500 font-mono font-bold">{n}</span>
                                    ))}
                                </div>
                                <p className="text-[10px] text-blue-500 text-center mt-1 font-mono">← column lines →</p>
                            </div>
                        </div>
                        <Code file="grid-lines.css">{`
/* Grid lines bernomor dari 1 */
.item {
  grid-column: 1 / 3;   /* dari line 1 sampai line 3 = span 2 kolom */
  grid-row: 1 / 2;      /* baris pertama */
}

/* Dari kanan pakai angka negatif */
.item {
  grid-column: 1 / -1;  /* dari kiri sampai kanan penuh */
  grid-row: 1 / -1;     /* dari atas sampai bawah penuh */
}

/* Shorthand: grid-column: start / end */
.item { grid-column: 2 / 4; }   /* kolom line 2 sampai 4 */
.item { grid-column: 1 / span 2; } /* dari 1, span 2 tracks */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 03 TEMPLATE COLS ══════════════════════════════════════════ */}
                    <Section id="template-cols" onClick={() => setActiveSection("template-cols")}>
                        <H2>grid-template-columns<H2.anchor href="#template-cols">#</H2.anchor></H2>
                        <P>Mendefinisikan jumlah dan ukuran kolom pada explicit grid. Menerima panjang (<IC>px</IC>, <IC>%</IC>), <IC>fr</IC> units, <IC>auto</IC>, <IC>minmax()</IC>, dan fungsi <IC>repeat()</IC>.</P>
                        <ColsPlayground />
                        <Code file="grid-template-columns.css">{`
.grid {
  /* Fixed sizes */
  grid-template-columns: 200px 400px 200px;

  /* Mixed */
  grid-template-columns: 200px 1fr;         /* sidebar + content */
  grid-template-columns: auto 1fr auto;      /* shrink-wrap kiri-kanan */

  /* fr units */
  grid-template-columns: 1fr 2fr 1fr;       /* ratio 1:2:1 */
  grid-template-columns: repeat(3, 1fr);    /* 3 kolom sama */
  grid-template-columns: repeat(4, minmax(0, 1fr)); /* 4 kolom, tidak overflow */

  /* Responsive tanpa media query */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

  /* Tailwind: grid-cols-1..12 | grid-cols-[...] */
}
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 04 TEMPLATE ROWS ══════════════════════════════════════════ */}
                    <Section id="template-rows" onClick={() => setActiveSection("template-rows")}>
                        <H2>grid-template-rows<H2.anchor href="#template-rows">#</H2.anchor></H2>
                        <P>Sama seperti <IC>grid-template-columns</IC> tapi untuk baris. Sering dikombinasikan dengan <IC>grid-auto-rows</IC> untuk baris implicit yang tidak terdefinisi eksplisit.</P>
                        <Code file="grid-template-rows.css">{`
.grid {
  grid-template-rows: 60px 1fr 60px;    /* header, konten, footer */
  grid-template-rows: auto 1fr auto;    /* ukuran dari konten, tengah flex */

  /* grid-auto-rows — ukuran baris yang dibuat secara implicit */
  grid-auto-rows: 200px;                /* semua baris implicit = 200px */
  grid-auto-rows: minmax(100px, auto);  /* minimal 100px, bisa lebih besar */

  /* Kombinasi */
  grid-template-rows: 60px 60px;        /* 2 baris explicit */
  grid-auto-rows: minmax(100px, auto);  /* baris ke-3 dst = implicit */
}

/* Tailwind: grid-rows-1..6 | grid-rows-[...] | auto-rows-auto | auto-rows-min | auto-rows-fr */
            `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                Untuk card grid yang butuh semua baris sama tinggi,
                                gunakan <IC>grid-auto-rows: 1fr</IC> — tapi ini butuh
                                container punya height eksplisit. Untuk card dengan tinggi natural,
                                <IC>grid-auto-rows: auto</IC> lebih umum dipakai.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 05 FR UNIT ════════════════════════════════════════════════ */}
                    <Section id="fr-unit" onClick={() => setActiveSection("fr-unit")}>
                        <H2>fr unit — fraction<H2.anchor href="#fr-unit">#</H2.anchor></H2>
                        <P><IC>fr</IC> adalah unit khusus grid yang merepresentasikan fraction dari available space — setelah semua ukuran tetap (px, %, auto) dialokasikan. Mirip <IC>flex-grow</IC> tapi untuk tracks.</P>
                        <FrPlayground />
                        <Code file="fr-unit.css">{`
/* fr dibagi dari space yang TERSISA setelah px/% diprioritaskan */
.grid { grid-template-columns: 200px 1fr 1fr; }
/* 200px dulu, sisanya dibagi rata menjadi 2 */

/* fr vs % */
.grid { grid-template-columns: 33.33% 33.33% 33.33%; } /* tidak ada gap */
.grid { grid-template-columns: 1fr 1fr 1fr; }           /* otomatis gap-aware */

/* 0fr vs auto */
/* auto: ukuran konten minimum, bisa grow */
/* 0fr: tidak ada ukuran minimum dari konten */
.grid { grid-template-columns: auto 1fr; }     /* kolom 1 ikut konten */
.grid { grid-template-columns: minmax(0,1fr) 1fr; } /* kolom 1 bisa 0 */

/* Tailwind: fr tersedia via arbitrary: grid-cols-[1fr_2fr_1fr] */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 06 REPEAT ═════════════════════════════════════════════════ */}
                    <Section id="repeat" onClick={() => setActiveSection("repeat")}>
                        <H2>repeat() & auto-fill / auto-fit<H2.anchor href="#repeat">#</H2.anchor></H2>
                        <P><IC>repeat()</IC> mempersingkat definisi track berulang. Dikombinasikan dengan <IC>auto-fill</IC> atau <IC>auto-fit</IC> dan <IC>minmax()</IC>, menghasilkan grid responsif tanpa media query.</P>
                        <RepeatPlayground />
                        <Code file="repeat.css">{`
/* repeat(count, size) */
.grid { grid-template-columns: repeat(3, 1fr); }   /* = 1fr 1fr 1fr */
.grid { grid-template-columns: repeat(4, 100px); } /* = 100px 100px 100px 100px */

/* auto-fill vs auto-fit */
/* auto-fill: isi kolom sebanyak mungkin, kolom KOSONG tetap ada */
.grid { grid-template-columns: repeat(auto-fill, 100px); }

/* auto-fit: isi kolom sebanyak mungkin, kolom kosong di-COLLAPSE */
.grid { grid-template-columns: repeat(auto-fit, 100px); }

/* Kombinasi dengan minmax — RESPONSIVE TANPA MEDIA QUERY */
.grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
/* Penjelasan: "buat kolom sebanyak mungkin, masing-masing minimal 200px,
   maksimal 1fr. Kalau container menyempit, jumlah kolom berkurang otomatis." */

/* Perbedaan auto-fill vs auto-fit dengan minmax: */
/* auto-fill: items tidak stretch kalau tidak cukup untuk mengisi baris */
/* auto-fit: items stretch mengisi seluruh lebar kalau jumlahnya sedikit */
            `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                <IC>repeat(auto-fill, minmax(200px, 1fr))</IC> adalah
                                salah satu "magic line" CSS yang paling berguna — grid
                                responsif yang otomatis menyesuaikan jumlah kolom tanpa
                                satu pun media query. Ini standar industri untuk card grids.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 07 MINMAX ═════════════════════════════════════════════════ */}
                    <Section id="minmax" onClick={() => setActiveSection("minmax")}>
                        <H2>minmax()<H2.anchor href="#minmax">#</H2.anchor></H2>
                        <P><IC>minmax(min, max)</IC> mendefinisikan track size yang fleksibel — tidak lebih kecil dari <IC>min</IC> dan tidak lebih besar dari <IC>max</IC>. Inti dari grid responsif.</P>
                        <Code file="minmax.css">{`
/* minmax(min, max) */
.grid {
  grid-template-columns: minmax(100px, 1fr) 1fr 1fr;
  /* Kolom pertama: minimal 100px, maksimal 1fr. Tidak pernah collapse di bawah 100px */
}

/* Nilai yang valid */
.grid {
  grid-auto-rows: minmax(100px, auto);  /* min 100px, bisa tumbuh mengikuti konten */
  grid-auto-rows: minmax(min-content, max-content); /* min = konten minimum, max = konten penuh */
  grid-auto-rows: minmax(0, 1fr);       /* bisa 0, maksimal 1fr */
}

/* Penggunaan paling umum — responsif grid */
.card-grid {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  /* "Buat kolom selebar minimal 280px, bisa lebih lebar hingga 1fr.
      Tambah/kurangi kolom otomatis sesuai ruang yang tersedia." */
}

/* min-content dan max-content sebagai nilai minmax */
.grid {
  grid-template-columns: minmax(min-content, 200px) 1fr;
  /* Kolom pertama: sesempit kontennya tapi tidak lebih dari 200px */
}
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 08 GAP ════════════════════════════════════════════════════ */}
                    <Section id="gap" onClick={() => setActiveSection("gap")}>
                        <H2>gap<H2.anchor href="#gap">#</H2.anchor></H2>
                        <P>Sama seperti di Flexbox — <IC>gap</IC> menambahkan jarak antar grid cells tanpa perlu margin. Tidak ada gap di tepi container. Bisa asymmetric dengan <IC>row-gap</IC> dan <IC>column-gap</IC>.</P>
                        <Code file="grid-gap.css">{`
.grid {
  gap: 16px;              /* gap seragam semua sisi */
  gap: 8px 24px;          /* row-gap column-gap */
  row-gap: 8px;           /* vertikal */
  column-gap: 24px;       /* horizontal */
}

/* Tailwind: gap-4 | gap-x-6 | gap-y-2 */
/* Sama persis dengan flexbox — tidak ada perbedaan */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 09 PLACEMENT ══════════════════════════════════════════════ */}
                    <Section id="placement" onClick={() => setActiveSection("placement")}>
                        <H2>Line-based Placement<H2.anchor href="#placement">#</H2.anchor></H2>
                        <P>Tempatkan item di posisi spesifik menggunakan nomor grid line. <IC>grid-column: start / end</IC> dan <IC>grid-row: start / end</IC> mendefinisikan posisi dan ukuran item secara eksplisit.</P>
                        <PlacementPlayground />
                        <Code file="placement.css">{`
/* grid-column: start / end */
.item { grid-column: 1 / 3; }     /* dari line 1 sampai 3 = 2 kolom */
.item { grid-column: 1 / -1; }    /* full width */
.item { grid-column: 2 / 4; }     /* kolom 2 dan 3 */

/* grid-row: start / end */
.item { grid-row: 1 / 3; }        /* baris 1 dan 2 */
.item { grid-row: 2 / -1; }       /* dari baris 2 sampai akhir */

/* Shorthand: grid-area: row-start / col-start / row-end / col-end */
.item { grid-area: 1 / 2 / 3 / 4; }

/* Tailwind: col-start-{n} col-end-{n} col-span-{n} row-start-{n} row-end-{n} row-span-{n} */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 10 SPAN ═══════════════════════════════════════════════════ */}
                    <Section id="span" onClick={() => setActiveSection("span")}>
                        <H2>span — melintasi multiple tracks<H2.anchor href="#span">#</H2.anchor></H2>
                        <P><IC>span</IC> lebih intuitif dari line numbers — "item ini span 2 kolom" daripada harus hitung line numbers. Bisa dikombinasikan dengan line numbers.</P>
                        <Code file="span.css">{`
/* span N — ambil N tracks dari posisi saat ini */
.item { grid-column: span 2; }     /* 2 kolom, posisi ditentukan auto-placement */
.item { grid-row: span 3; }        /* 3 baris */

/* Kombinasi span dengan line number */
.item { grid-column: 1 / span 2; } /* mulai dari line 1, span 2 = line 1→3 */
.item { grid-column: span 2 / -1; }/* span 2 dengan end di line terakhir */

/* Pola umum: full-width item */
.featured { grid-column: 1 / -1; } /* ambil seluruh lebar */
/* atau */
.featured { grid-column: span 3; } /* kalau tahu ada 3 kolom */

/* Tailwind: col-span-1..12 | col-span-full | row-span-1..6 | row-span-full */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ OVERLAPPING GRID ITEMS ══════════════════════════════════ */}
                    <Section id="overlap" onClick={() => setActiveSection("overlap")}>
                        <H2>Overlapping Grid Items<H2.anchor href="#overlap">#</H2.anchor></H2>
                        <P>
                            Berbeda dari Flexbox, grid items bisa ditempatkan di cell yang sama —
                            mereka akan overlap. Urutan visual default mengikuti urutan DOM
                            (item terakhir di atas), tapi bisa diatur dengan <IC>z-index</IC>.
                            Ini memungkinkan efek seperti image caption overlay tanpa <IC>position: absolute</IC>.
                        </P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] p-4 my-5 bg-[var(--surface)]">
                            <p className="text-[10px] font-mono text-gray-400 mb-3">Dua item di cell yang sama — item kedua (biru) di atas item pertama (merah)</p>
                            <div className="grid grid-cols-3 grid-rows-2 gap-2 h-32">
                                <div className="col-start-1 col-end-3 row-start-1 row-end-3 bg-rose-300 rounded-lg flex items-center justify-center text-white text-xs font-bold opacity-80">
                                    Item A (col 1-2, row 1-2)
                                </div>
                                <div className="col-start-2 col-end-4 row-start-1 row-end-2 bg-blue-400 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ zIndex: 1 }}>
                                    Item B (col 2-3, row 1) — overlap
                                </div>
                                <GCell color={1} className="col-start-3 row-start-2">C</GCell>
                            </div>
                        </div>
                        <Code file="overlap.css">{`
/* Items bisa ditempatkan di cell yang sama — mereka overlap */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 100px);
}

/* Kedua item ini menempati area yang sama */
.background-item {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
  /* item ini di bawah (DOM order pertama) */
}

.foreground-item {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
  /* item ini di atas (DOM order kedua) */
  z-index: 1; /* eksplisit kalau butuh pastikan urutan */
}

/* Use case: image caption tanpa absolute positioning */
.image-card {
  display: grid;
  grid-template: 1fr / 1fr; /* single cell */
}

.image-card img,
.image-card figcaption {
  grid-area: 1 / 1; /* keduanya di cell yang sama */
}

.image-card figcaption {
  align-self: end;             /* caption di bawah */
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
  padding: 1rem;
}

/* Use case: stacked layers / layers design */
.hero {
  display: grid;
  grid-template: 1fr / 1fr;
}
.hero > * { grid-area: 1 / 1; } /* semua children overlap */
.hero-bg  { z-index: 0; }
.hero-content { z-index: 1; }
.hero-overlay { z-index: 2; }
                        `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                Pola <IC>grid-area: 1 / 1</IC> pada semua children adalah
                                cara elegan untuk membuat "stacked layers" — semua berada
                                di posisi yang sama, diatur dengan <IC>align-self</IC>,
                                <IC>justify-self</IC>, dan <IC>z-index</IC>. Lebih clean
                                dari pendekatan <IC>position: absolute</IC> karena container
                                tetap mengikuti ukuran konten.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 11 TEMPLATE AREAS ════════════════════════════════════════ */}
                    <Section id="template-areas" onClick={() => setActiveSection("template-areas")}>
                        <H2>grid-template-areas — layout deklaratif<H2.anchor href="#template-areas">#</H2.anchor></H2>
                        <P>Mendefinisikan layout dengan "ASCII art" — setiap string mewakili satu baris, setiap kata mewakili satu kolom. Cara paling readable untuk layout halaman kompleks.</P>
                        <TemplateAreasPlayground />
                        <Code file="template-areas.css">{`
.layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
  min-height: 100vh;
}

/* Setiap item tinggal declare grid-area-nya */
.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }

/* Sel kosong — pakai titik */
.layout {
  grid-template-areas:
    "header header header"
    "sidebar main   .    "  /* titik = sel kosong */
    "footer footer footer";
}

/* Shorthand grid-template */
.layout {
  grid-template:
    "header header" auto
    "sidebar main"  1fr
    "footer footer" auto
    / 200px 1fr;    /* kolom setelah slash */
}

/* Tailwind: tidak ada built-in untuk template-areas
   Pakai arbitrary: [grid-template-areas:'header_header'_'main_sidebar'] */
            `}</Code>
                        <Callout type="php">
                            <Callout.icon>🐘</Callout.icon>
                            <Callout.content>
                                <Callout.title>Analogi PHP</Callout.title>
                                <IC>grid-template-areas</IC> seperti heredoc di PHP — definisi layout
                                dalam format visual yang langsung terbaca, tanpa perlu string concatenation
                                atau array index. <IC>grid-area</IC> di item seperti label yang meng-map
                                ke posisi di heredoc tersebut.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 12 NAMED LINES ════════════════════════════════════════════ */}
                    <Section id="named-lines" onClick={() => setActiveSection("named-lines")}>
                        <H2>Named Grid Lines<H2.anchor href="#named-lines">#</H2.anchor></H2>
                        <P>Grid lines bisa diberi nama dengan sintaks <IC>[nama-line]</IC> dalam definisi track. Item kemudian bisa direferensikan dengan nama daripada angka — lebih maintainable untuk grid kompleks.</P>
                        <Code file="named-lines.css">{`
/* Definisikan nama di template */
.grid {
  grid-template-columns:
    [full-start] 1fr
    [content-start] 200px [aside-start] 1fr [aside-end content-end]
    1fr [full-end];
}

/* Gunakan nama di placement */
.item {
  grid-column: content-start / content-end; /* lebih readable dari 2 / 4 */
}

.full-width {
  grid-column: full-start / full-end;  /* full lebar grid */
}

/* Named lines otomatis dari template-areas! */
.layout {
  grid-template-areas: "header header" "main sidebar" "footer footer";
  /* Auto-generate lines:
     header-start, header-end, main-start, main-end,
     sidebar-start, sidebar-end, footer-start, footer-end */
}

.footer {
  grid-column: footer-start / footer-end; /* dari nama area */
}

/* Multiple names untuk satu line */
.grid {
  grid-template-columns: [left-start wrapper-start] 1fr [left-end right-start] 1fr [right-end wrapper-end];
}
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 13 IMPLICIT GRID ══════════════════════════════════════════ */}
                    <Section id="implicit" onClick={() => setActiveSection("implicit")}>
                        <H2>Implicit Grid & grid-auto-flow<H2.anchor href="#implicit">#</H2.anchor></H2>
                        <P>Ketika items melebihi explicit grid (yang didefinisikan via <IC>grid-template-*</IC>), browser membuat baris/kolom baru secara otomatis — disebut implicit tracks. Ukurannya dikontrol <IC>grid-auto-rows</IC>/<IC>grid-auto-columns</IC>.</P>
                        <Code file="implicit-grid.css">{`
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* explicit: 3 kolom */
  /* Tidak mendefinisikan rows — rows dibuat implicit */

  /* Kontrol ukuran baris implicit */
  grid-auto-rows: 150px;               /* tetap 150px */
  grid-auto-rows: minmax(100px, auto); /* minimal 100px, ikut konten */
}

/* grid-auto-flow — bagaimana items mengisi grid */
.grid {
  grid-auto-flow: row;     /* default — isi baris dulu, baru pindah baris */
  grid-auto-flow: column;  /* isi kolom dulu, baru pindah kolom */
  grid-auto-flow: row dense;    /* isi lubang dengan item kecil */
  grid-auto-flow: column dense;
}

/* grid-auto-columns — ukuran kolom implicit (saat auto-flow: column) */
.grid {
  grid-auto-flow: column;
  grid-auto-columns: 200px; /* setiap kolom implicit = 200px */
}
            `}</Code>
                        <Callout type="note">
                            <Callout.icon>ℹ️</Callout.icon>
                            <Callout.content>
                                Implicit tracks tidak bisa diberi nama atau definisi kompleks — mereka
                                selalu menggunakan nilai dari <IC>grid-auto-rows</IC>/<IC>grid-auto-columns</IC>.
                                Kalau butuh kontrol penuh, definisikan semua tracks secara explicit.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 14 DENSE ══════════════════════════════════════════════════ */}
                    <Section id="auto-flow-dense" onClick={() => setActiveSection("auto-flow-dense")}>
                        <H2>grid-auto-flow: dense<H2.anchor href="#auto-flow-dense">#</H2.anchor></H2>
                        <P>Saat items punya ukuran berbeda (beberapa span 2 kolom, sebagian tidak), auto-placement bisa meninggalkan "lubang". <IC>dense</IC> menyuruh browser mengisi lubang dengan items yang lebih kecil — urutan visual tidak lagi mengikuti DOM.</P>
                        <DensePlayground />
                        <Code file="dense.css">{`
/* Masalah: items besar meninggalkan lubang */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-flow: row; /* default — lubang terjadi */
}

/* Solusi: dense mengisi lubang */
.grid {
  grid-auto-flow: row dense;
}

/* Kapan pakai dense:
   - Masonry-like gallery dengan gambar berbeda ukuran
   - Card grid dengan featured item (span lebih besar)
   - Blog layout dengan artikel panjang/pendek */

/* PERINGATAN: dense mengubah urutan visual dari DOM
   — bisa buruk untuk aksesibilitas navigasi keyboard */
            `}</Code>
                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>Aksesibilitas</Callout.title>
                                <IC>grid-auto-flow: dense</IC> mengubah urutan visual dari urutan DOM.
                                Pengguna keyboard yang tab antar items akan menemukan urutan yang tidak
                                sesuai dengan apa yang terlihat. Gunakan hanya untuk konten dekoratif
                                atau gallery di mana urutan logis tidak penting.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 15 ALIGNMENT ══════════════════════════════════════════════ */}
                    <Section id="alignment" onClick={() => setActiveSection("alignment")}>
                        <H2>Alignment di Grid<H2.anchor href="#alignment">#</H2.anchor></H2>
                        <P>Grid mendukung alignment di dua level: tracks di dalam container (<IC>justify-content</IC>, <IC>align-content</IC>) dan items di dalam cell-nya (<IC>justify-items</IC>, <IC>align-items</IC>). Berbeda dari Flexbox, Grid punya <IC>justify-self</IC> per-item.</P>
                        <AlignmentPlayground />
                        <Code file="grid-alignment.css">{`
/* Level 1: tracks di dalam container */
.grid {
  /* Distribusi kolom (inline axis) */
  justify-content: start | end | center | space-between | space-around | space-evenly;

  /* Distribusi baris (block axis) */
  align-content: start | end | center | space-between | space-around | space-evenly;

  /* Shorthand */
  place-content: center;            /* = align-content: center; justify-content: center */
  place-content: space-between end; /* = align-content: space-between; justify-content: end */
}

/* Level 2: items di dalam cell */
.grid {
  justify-items: start | end | center | stretch; /* default: stretch */
  align-items: start | end | center | stretch;   /* default: stretch */
  place-items: center; /* = align-items: center; justify-items: center */
}

/* Per-item override (BERBEDA DARI FLEXBOX — justify-self ADA di Grid!) */
.item {
  justify-self: start | end | center | stretch;
  align-self: start | end | center | stretch;
  place-self: center; /* = align-self: center; justify-self: center */
}

/* Tailwind Grid: justify-items-start/end/center/stretch
   align-items-start/end/center/stretch
   justify-self-start/end/center/stretch
   self-start/end/center/stretch (alias align-self) */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 16 SUBGRID ════════════════════════════════════════════════ */}
                    <Section id="subgrid" onClick={() => setActiveSection("subgrid")}>
                        <H2>subgrid<H2.anchor href="#subgrid">#</H2.anchor></H2>
                        <P><IC>subgrid</IC> memungkinkan nested grid mewarisi tracks dari parent grid — bukan membuat grid baru yang independen. Ini menyelesaikan masalah alignment antar card yang punya content berbeda panjang.</P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
                            <div className="p-3 bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] mb-2">Tanpa subgrid — tiap card punya row sendiri</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { title: "Card Pendek", desc: "Deskripsi singkat.", price: "Rp 100k" },
                                        { title: "Card dengan Judul yang Sangat Panjang", desc: "Deskripsi yang sedikit lebih panjang dari card lainnya untuk demo.", price: "Rp 200k" },
                                        { title: "Card", desc: "Desc.", price: "Rp 50k" },
                                    ].map((card, i) => (
                                        <div key={i} className="flex flex-col gap-1 border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] rounded-lg p-3 bg-white">
                                            <p className="text-xs font-bold">{card.title}</p>
                                            <p className="text-[11px] text-gray-500 flex-1">{card.desc}</p>
                                            <p className="text-xs font-mono text-[var(--accent)] mt-auto">{card.price}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] mb-2">Dengan subgrid — harga & judul sejajar</p>
                                <div className="grid grid-cols-3 gap-3" style={{ gridTemplateRows: "auto" }}>
                                    {[
                                        { title: "Card Pendek", desc: "Deskripsi singkat.", price: "Rp 100k" },
                                        { title: "Card dengan Judul yang Sangat Panjang", desc: "Deskripsi yang sedikit lebih panjang dari card lainnya untuk demo.", price: "Rp 200k" },
                                        { title: "Card", desc: "Desc.", price: "Rp 50k" },
                                    ].map((card, i) => (
                                        <div key={i} className="grid gap-1 border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] rounded-lg p-3 bg-white"
                                            style={{ gridTemplateRows: "subgrid", gridRow: "span 3" }}>
                                            <p className="text-xs font-bold self-start">{card.title}</p>
                                            <p className="text-[11px] text-gray-500">{card.desc}</p>
                                            <p className="text-xs font-mono text-[var(--accent)]">{card.price}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <Code file="subgrid.css">{`
/* Masalah: 3 cards di grid, judul dan harga tidak sejajar */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* Solusi: subgrid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;  /* browser akan adjust */
  gap: 16px;
}

.card {
  display: grid;
  grid-row: span 3;           /* span 3 rows di parent grid */
  grid-template-rows: subgrid; /* gunakan rows dari parent */
  gap: 8px;
  /* Sekarang: semua .card-title, .card-body, .card-price di baris yang sama */
}

/* Browser support: semua modern browser (Chrome 117+, Firefox 71+, Safari 16+) */
/* Tailwind: [grid-template-rows:subgrid] */
            `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                <IC>subgrid</IC> menyelesaikan masalah "card tidak sejajar" yang
                                sebelumnya butuh JavaScript atau fixed height. Ini adalah salah satu
                                fitur CSS Grid paling berguna untuk design systems dan komponen
                                yang digunakan berulang.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ FIT-CONTENT ════════════════════════════════════════════ */}
                    <Section id="fit-content" onClick={() => setActiveSection("fit-content")}>
                        <H2>fit-content()<H2.anchor href="#fit-content">#</H2.anchor></H2>
                        <P>
                            <IC>fit-content(max)</IC> membuat track yang berukuran sesuai kontennya (<IC>max-content</IC>)
                            tapi tidak pernah melebihi nilai <IC>max</IC> yang ditentukan.
                            Secara formal sama dengan <IC>min(max, max(min-content, argument))</IC>.
                            Berguna untuk kolom yang perlu "ikut konten tapi ada batas maksimum".
                        </P>
                        <Code file="fit-content.css">{`
/* fit-content(max) = min(max, max(min-content, max-content)) */

.grid {
  /* Kolom ikut lebar konten, maksimal 300px */
  grid-template-columns: fit-content(300px) 1fr;
}

/* Perbandingan dengan alternatif lain */
.grid {
  grid-template-columns: auto 1fr;           /* auto: ikut konten, bisa sangat lebar */
  grid-template-columns: minmax(0, 300px) 1fr; /* minmax: tapi bisa juga 0 */
  grid-template-columns: fit-content(300px) 1fr; /* fit-content: ikut konten, max 300px */
}

/* Kasus pakai: tabel dengan kolom label dan kolom nilai */
.data-table {
  display: grid;
  grid-template-columns: fit-content(200px) 1fr; /* label max 200px, nilai ambil sisa */
}

/* fit-content di grid-template-rows */
.grid {
  grid-template-rows: fit-content(100px) 1fr; /* baris pertama max 100px, ikut konten */
}

/* Tailwind: [grid-template-columns:fit-content(300px)_1fr] */
                        `}</Code>
                        <Callout type="note">
                            <Callout.icon>ℹ️</Callout.icon>
                            <Callout.content>
                                <Callout.title>fit-content vs minmax vs auto</Callout.title>
                                <IC>auto</IC>: ikut konten, bisa stretch kalau ada sisa ruang dan <IC>justify-items: stretch</IC>.
                                <IC>minmax(min-content, max)</IC>: mirip, tapi minimum = min-content.
                                <IC>fit-content(max)</IC>: paling "natural" — ikut konten persis, tapi punya hard cap.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ LOGICAL VALUES ══════════════════════════════════════════ */}
                    <Section id="logical-values" onClick={() => setActiveSection("logical-values")}>
                        <H2>Logical Values & Writing Modes<H2.anchor href="#logical-values">#</H2.anchor></H2>
                        <P>
                            CSS Grid mendukung penuh logical values — nilai yang mengikuti
                            <IC>writing-mode</IC> dan <IC>direction</IC>, bukan terpaku pada
                            arah fisik (top/left/right/bottom). Penting untuk komponen yang
                            perlu bekerja di RTL atau vertical writing modes.
                        </P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
                            <div className="grid grid-cols-3 px-4 py-2 bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                                {["Physical (lama)", "Logical (baru)", "Berlaku untuk"].map(h => (
                                    <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">{h}</span>
                                ))}
                            </div>
                            {[
                                { physical: "justify-*", logical: "justify-* (sama)", note: "inline axis — arah teks" },
                                { physical: "align-*", logical: "align-* (sama)", note: "block axis — tegak lurus teks" },
                                { physical: "grid-column-start/end", logical: "grid-column-start/end", note: "inline axis — ikut direction" },
                                { physical: "grid-row-start/end", logical: "grid-row-start/end", note: "block axis — ikut writing-mode" },
                                { physical: "top (dalam grid-area)", logical: "block-start", note: "awal block axis" },
                                { physical: "left", logical: "inline-start", note: "awal inline axis" },
                            ].map(row => (
                                <div key={row.physical} className="grid grid-cols-3 px-4 py-2.5 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0 text-xs gap-2 items-center">
                                    <IC>{row.physical}</IC>
                                    <IC>{row.logical}</IC>
                                    <span className="text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] text-[11px]">{row.note}</span>
                                </div>
                            ))}
                        </div>
                        <Code file="grid-logical.css">{`
/* Di LTR (writing-mode: horizontal-tb, direction: ltr — default) */
.item { grid-column: 1 / 3; } /* = dari kiri */

/* Di RTL (direction: rtl) */
/* grid-column: 1 masih berarti line 1 dari KIRI — tidak berubah! */
/* Grid lines selalu bernomor dari physical left */

/* Alignment menggunakan logical values — LEBIH BAIK */
.grid {
  justify-items: start;  /* = inline-start — mengikuti direction */
  align-items: start;    /* = block-start  — mengikuti writing-mode */
}

/* Nilai alignment yang logical */
.item {
  justify-self: start; /* inline-start */
  justify-self: end;   /* inline-end */
  align-self: start;   /* block-start */
  align-self: end;     /* block-end */
  /* Di RTL: start = kanan, end = kiri */
}

/* Untuk benar-benar RTL-aware grid layout, kombinasikan dengan logical properties */
.rtl-grid {
  display: grid;
  grid-template-columns: 1fr 3fr;
  /* Plus di HTML: <div dir="rtl"> atau html { direction: rtl; } */
}

/* justify-content juga mendukung logical values */
.grid {
  justify-content: start;          /* inline-start */
  justify-content: end;            /* inline-end */
  /* flex-start/flex-end sudah deprecated untuk grid — pakai start/end */
}
                        `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                Untuk alignment di grid, MDN merekomendasikan menggunakan
                                <IC>start</IC>/<IC>end</IC> daripada <IC>flex-start</IC>/<IC>flex-end</IC>
                                — nilai terakhir adalah "flex legacy" yang kurang tepat untuk grid
                                dan tidak mengikuti writing mode semantics.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ GRID SHORTHAND ══════════════════════════════════════════ */}
                    <Section id="grid-shorthand" onClick={() => setActiveSection("grid-shorthand")}>
                        <H2>grid — super shorthand<H2.anchor href="#grid-shorthand">#</H2.anchor></H2>
                        <P>
                            <IC>grid</IC> adalah shorthand paling lengkap yang mengeset
                            <IC>grid-template-rows</IC>, <IC>grid-template-columns</IC>,
                            <IC>grid-template-areas</IC>, <IC>grid-auto-rows</IC>,
                            <IC>grid-auto-columns</IC>, dan <IC>grid-auto-flow</IC> sekaligus.
                            Jarang dipakai karena kompleks, tapi penting untuk diketahui.
                        </P>
                        <Code file="grid-shorthand.css">{`
/* grid shorthand: explicit rows / explicit columns */
.grid { grid: 100px 1fr / 200px 1fr; }
/* = grid-template-rows: 100px 1fr;
     grid-template-columns: 200px 1fr; */

/* grid shorthand dengan template areas */
.grid {
  grid:
    "header header" 60px
    "sidebar main" 1fr
    "footer footer" 60px
    / 200px 1fr;
}
/* = grid-template-areas + grid-template-rows + grid-template-columns sekaligus */

/* grid shorthand dengan auto-flow */
.grid { grid: auto-flow dense 100px / repeat(3, 1fr); }
/* = grid-auto-flow: row dense;
     grid-auto-rows: 100px;
     grid-template-columns: repeat(3, 1fr); */

/* Catatan penting: grid shorthand juga MERESET properti yang tidak disebutkan
   ke nilai initialnya. Jadi kalau pakai grid shorthand,
   TIDAK PERLU set grid-auto-rows, grid-auto-columns, dll secara terpisah. */

/* grid-template adalah "setengah" shorthand — hanya explicit grid */
.grid {
  grid-template: 60px 1fr 60px / 200px 1fr;
  /* TIDAK mereset grid-auto-* — lebih aman dipakai */
}

/* Rekomendasi: pakai grid-template-columns/rows terpisah untuk
   keterbacaan, atau grid-template untuk explicit + area layout */
                        `}</Code>
                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>grid shorthand mereset banyak properti</Callout.title>
                                <IC>grid</IC> shorthand me-reset <em>semua</em> sub-properties ke nilai
                                initial, termasuk yang tidak kamu tulis. Ini bisa menyebabkan override
                                tidak terduga kalau dikombinasikan dengan properti individual.
                                Pakai <IC>grid-template</IC> (shorthand yang lebih aman) atau
                                tulis properti individual untuk keterbacaan maksimum.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 17 VS FLEXBOX ═════════════════════════════════════════════ */}
                    <Section id="vs-flexbox" onClick={() => setActiveSection("vs-flexbox")}>
                        <H2>Grid vs Flexbox<H2.anchor href="#vs-flexbox">#</H2.anchor></H2>
                        <P>Keduanya adalah layout tools yang saling melengkapi, bukan saling menggantikan. Aturan sederhana: <strong>Flexbox untuk 1 dimensi, Grid untuk 2 dimensi</strong> — tapi ada nuansa lebih dalam.</P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
                            <div className="grid grid-cols-3 px-4 py-2 bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                                {["Kasus", "Grid ✅", "Flexbox ✅"].map(h => (
                                    <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">{h}</span>
                                ))}
                            </div>
                            {[
                                { kasus: "Layout halaman (header/sidebar/main/footer)", grid: "✅ Lebih natural", flex: "⚠️ Bisa, tapi lebih verbose" },
                                { kasus: "Card grid dengan baris sama tinggi", grid: "✅ Native subgrid", flex: "⚠️ Butuh JS atau fixed height" },
                                { kasus: "Navbar dengan items inline", grid: "⚠️ Bisa, overkill", flex: "✅ Lebih natural" },
                                { kasus: "Centering satu element", grid: "✅ place-items: center", flex: "✅ justify-center + items-center" },
                                { kasus: "Distribusi items dalam satu baris", grid: "⚠️ Butuh definisi kolom", flex: "✅ Lebih mudah dengan justify-content" },
                                { kasus: "Items dengan ukuran berbeda, grid sejajar", grid: "✅ Grid lines", flex: "❌ Items bebas" },
                                { kasus: "Responsive tanpa media query", grid: "✅ auto-fill + minmax", flex: "✅ flex-wrap + flex-basis" },
                                { kasus: "Order visual berbeda dari DOM", grid: "✅ order + placement", flex: "✅ order" },
                            ].map(row => (
                                <div key={row.kasus} className="grid grid-cols-3 px-4 py-2.5 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0 text-xs gap-2 items-center">
                                    <span className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">{row.kasus}</span>
                                    <span>{row.grid}</span>
                                    <span>{row.flex}</span>
                                </div>
                            ))}
                        </div>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                Pattern yang paling umum: <strong>Grid untuk layout keseluruhan halaman</strong>,
                                <strong> Flexbox untuk komponen di dalam grid cells</strong>. Keduanya bisa
                                di-nest — flex container di dalam grid cell, atau grid di dalam flex item.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 18 PATTERNS ═══════════════════════════════════════════════ */}
                    <Section id="patterns" onClick={() => setActiveSection("patterns")}>
                        <H2>Pattern Umum<H2.anchor href="#patterns">#</H2.anchor></H2>
                        <H3>1. Responsive Card Grid</H3>
                        <Code file="card-grid.css">{`
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
/* Tailwind: grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 */
            `}</Code>
                        <H3>2. Holy Grail Layout</H3>
                        <Code file="holy-grail.css">{`
.app {
  display: grid;
  grid-template:
    "header" auto
    "main  " 1fr
    "footer" auto
    / 1fr;
  min-height: 100vh;
}

/* Dengan sidebar */
.app {
  grid-template:
    "header  header " auto
    "sidebar main   " 1fr
    "footer  footer " auto
    / 240px 1fr;
}
            `}</Code>
                        <H3>3. Magazine Layout</H3>
                        <Code file="magazine.css">{`
.magazine {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}
.headline { grid-column: span 8; }
.sidebar  { grid-column: span 4; }
.feature  { grid-column: 1 / -1; } /* full width */
.col-3    { grid-column: span 4; } /* 3 kolom dari 12 */
            `}</Code>
                        <H3>4. Masonry-like (dengan dense)</H3>
                        <Code file="masonry.css">{`
.masonry {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: 10px; /* baris kecil-kecil sebagai unit */
  grid-auto-flow: row dense;
}
.item-tall  { grid-row: span 20; } /* 200px */
.item-short { grid-row: span 10; } /* 100px */
/* True masonry (CSS masonry) belum baseline — butuh JS atau grid-template-rows: masonry (eksperimental) */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 19 TW USAGE ═══════════════════════════════════════════════ */}
                    <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
                        <H2>CSS Grid di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
                        <Code file="grid-components.tsx">{`
import { tw } from "tailwind-styled-v4"

// Responsive card grid
const CardGrid = tw.div({
  base: "grid gap-6",
  variants: {
    cols: {
      auto:  "grid-cols-[repeat(auto-fill,minmax(280px,1fr))]",
      "1":   "grid-cols-1",
      "2":   "grid-cols-1 sm:grid-cols-2",
      "3":   "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      "4":   "grid-cols-2 lg:grid-cols-4",
    },
  },
  defaultVariants: { cols: "auto" },
})

// App layout dengan grid-template-areas
const AppLayout = tw.div({
  base: \`
    grid min-h-screen
    [grid-template-areas:'header'_'main'_'footer']
    [grid-template-rows:auto_1fr_auto]
    md:[grid-template-areas:'header_header'_'sidebar_main'_'footer_footer']
    md:[grid-template-columns:240px_1fr]
  \`,
})

// Featured item — full lebar
const FeaturedItem = tw.div({
  base: "col-span-full",
  sub: {
    image: "aspect-video w-full object-cover rounded-xl",
    body:  "mt-4",
  },
})

// Grid item dengan variants spanning
const GridItem = tw.article({
  base: "rounded-xl border bg-[var(--surface)] overflow-hidden",
  variants: {
    size: {
      normal:   "",
      wide:     "col-span-2",
      tall:     "row-span-2",
      featured: "col-span-2 row-span-2",
      full:     "col-span-full",
    },
  },
  defaultVariants: { size: "normal" },
})
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 20 EXERCISE ═══════════════════════════════════════════════ */}
                    <Section id="exercise" onClick={() => setActiveSection("exercise")}>
                        <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Responsive card grid tanpa media query</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat <IC>CardGrid</IC> yang otomatis menyesuaikan jumlah kolom: 4 kolom di layar lebar, 3 di medium, 2 di tablet, 1 di mobile.</p>
                                <p>Implementasikan dengan <IC>repeat(auto-fill, minmax(200px, 1fr))</IC> — tidak boleh ada media query sama sekali.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Holy Grail layout lengkap</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat <IC>AppLayout</IC> dengan <IC>grid-template-areas</IC>: header full lebar, sidebar kiri (240px), main content (flex-1), footer full lebar.</p>
                                <p>Di mobile (<IC>md:</IC> breakpoint), sidebar tersembunyi dan layout menjadi single column. Gunakan Tailwind arbitrary values untuk areas.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Card dengan subgrid alignment</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat 3 <IC>ProductCard</IC> berbeda panjang kontennya. Tanpa subgrid, harga di setiap card tidak sejajar.</p>
                                <p>Implementasikan subgrid agar judul, deskripsi, dan harga sejajar horizontal di ketiga card.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 4 — Magazine layout 12 kolom</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat layout majalah dengan grid 12 kolom: artikel featured (8 kolom), sidebar (4 kolom), kemudian 3 artikel kecil (4 kolom masing-masing).</p>
                                <p>Tambahkan <IC>grid-auto-flow: dense</IC> dan lihat perbedaannya.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 5 — Dashboard grid dinamis</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat layout dashboard dengan widget yang bisa punya ukuran berbeda: stats (span 1), chart (span 2), table (span full).</p>
                                <p>Buat variants <IC>size: sm | md | lg | full</IC> pada <IC>Widget</IC> component yang menentukan spanning-nya.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 6 — Galeri foto dengan dense</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat galeri foto grid 4 kolom di mana setiap 5 foto ada satu foto "featured" yang span 2×2.</p>
                                <p>Gunakan <IC>grid-auto-flow: dense</IC> agar tidak ada lubang kosong. Diskusikan implikasi aksesibilitasnya.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/dasar-css/flexbox" dir="prev">
                            <NavBtn.hint>← Previous</NavBtn.hint>
                            <NavBtn.label>Flexbox</NavBtn.label>
                        </NavBtn>
                        <NavBtn href="/learn/dasar-css/responsive&&container-queries" dir="next">
                            <NavBtn.hint>Next →</NavBtn.hint>
                            <NavBtn.label>Responsive & Container Queries</NavBtn.label>
                        </NavBtn>
                    </PageNav>
                </Content>

                <Toc>
                    <TocLabel>On this page</TocLabel>
                    {TOC.map(item => (
                        <TocItem key={item.id} href={`#${item.id}`}
                            active={activeSection === item.id}
                            onClick={() => setActiveSection(item.id)}>
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
