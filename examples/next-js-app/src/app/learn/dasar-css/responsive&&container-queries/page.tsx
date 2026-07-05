/**
 * CSS Layout — Responsive Design & Container Queries (Complete)
 * tailwind-styled-v4
 */
"use client"

import { useState } from "react"
import { tw } from "tailwind-styled-v4"

// ─── Shell ────────────────────────────────────────────────────────────────────

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

// ─── Content primitives ────────────────────────────────────────────────────────

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
        canvas: "p-4 bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]",
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

// ─── Simulated viewport demo card ────────────────────────────────────────────

const SimCard = tw.div({
    base: "bg-white border-2 border-gray-200 rounded-xl overflow-hidden transition-all duration-300",
})

// ─── TOC ──────────────────────────────────────────────────────────────────────

const TOC = [
    { id: "intro", label: "Apa itu Responsive Design" },
    { id: "viewport-meta", label: "Viewport Meta Tag" },
    { id: "media-queries", label: "@media — Sintaks Dasar" },
    { id: "breakpoints", label: "Breakpoints & Mobile-First" },
    { id: "mq-features", label: "Media Features Lengkap" },
    { id: "mq-range", label: "Range Syntax (modern)" },
    { id: "mq-logical", label: "Logical Operators" },
    { id: "user-preference", label: "User Preference Queries" },
    { id: "fluid-layout", label: "Fluid Layout (tanpa breakpoint)" },
    { id: "responsive-images", label: "Responsive Images" },
    { id: "container-intro", label: "Container Queries — Intro" },
    { id: "container-type", label: "container-type & container-name" },
    { id: "container-syntax", label: "@container — Sintaks" },
    { id: "cq-units", label: "Container Query Units (cqw, cqi…)" },
    { id: "style-queries", label: "Style Queries" },
    { id: "cq-vs-mq", label: "Container vs Media Queries" },
    { id: "viewport-units", label: "Viewport Units (svh, dvh, lvh)" },
    { id: "safe-area", label: "env() & Safe Area Inset" },
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

// ─── Playground: simulated viewport resize ────────────────────────────────────

type ViewportSize = "mobile" | "tablet" | "desktop"

function ViewportPlayground() {
    const [vp, setVp] = useState<ViewportSize>("desktop")

    const widthClass: Record<ViewportSize, string> = {
        mobile: "w-[320px]",
        tablet: "w-[640px]",
        desktop: "w-full",
    }
    const cols: Record<ViewportSize, string> = {
        mobile: "grid-cols-1",
        tablet: "grid-cols-2",
        desktop: "grid-cols-3",
    }
    const navClass: Record<ViewportSize, string> = {
        mobile: "flex-col items-start gap-2",
        tablet: "flex-row gap-4",
        desktop: "flex-row gap-6",
    }

    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 Simulasi breakpoint — lihat layout berubah</PlaygroundWrap.label>
                <ChipRow>
                    <Chip active={vp === "mobile"} onClick={() => setVp("mobile")}>📱 mobile (320px)</Chip>
                    <Chip active={vp === "tablet"} onClick={() => setVp("tablet")}>📟 tablet (640px)</Chip>
                    <Chip active={vp === "desktop"} onClick={() => setVp("desktop")}>🖥 desktop (full)</Chip>
                </ChipRow>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div className="overflow-x-auto">
                    <SimCard className={`${widthClass[vp]} mx-auto transition-all duration-500`}>
                        {/* Nav */}
                        <div className={`flex bg-blue-600 text-white px-4 py-2 text-[11px] font-mono gap-2 ${navClass[vp]}`}>
                            <span className="font-bold">Logo</span>
                            {vp !== "mobile" && <><span>Home</span><span>About</span><span>Contact</span></>}
                            {vp === "mobile" && <span className="text-blue-300">☰ menu</span>}
                        </div>
                        {/* Grid */}
                        <div className={`grid gap-2 p-3 ${cols[vp]}`}>
                            {["Card 1", "Card 2", "Card 3"].map(c => (
                                <div key={c} className="bg-gray-100 rounded p-3 text-[10px] font-mono text-gray-600 text-center h-12 flex items-center justify-center">
                                    {c}
                                </div>
                            ))}
                        </div>
                        <p className="text-[9px] text-gray-400 font-mono text-center pb-2">
                            Lebar: {vp === "mobile" ? "320px (sm)" : vp === "tablet" ? "640px (md)" : "full (lg+)"}
                        </p>
                    </SimCard>
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {vp === "mobile" && "@media (max-width: 639px) { .grid { grid-template-columns: 1fr; } }"}
                {vp === "tablet" && "@media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }"}
                {vp === "desktop" && "@media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }"}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: user preference demo ────────────────────────────────────────

type PrefMode = "default" | "dark" | "reduced-motion" | "high-contrast"

function UserPrefPlayground() {
    const [pref, setPref] = useState<PrefMode>("default")

    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 User Preference Queries — simulasi preferensi sistem</PlaygroundWrap.label>
                <ChipRow>
                    {(["default", "dark", "reduced-motion", "high-contrast"] as PrefMode[]).map(v => (
                        <Chip key={v} active={pref === v} onClick={() => setPref(v)}>{v}</Chip>
                    ))}
                </ChipRow>
                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
                    Browser membaca preferensi ini dari sistem operasi — kamu tidak perlu toggle manual.
                </p>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div className={`rounded-xl p-4 space-y-3 transition-all duration-300 ${pref === "dark" ? "bg-gray-900 text-white" :
                    pref === "high-contrast" ? "bg-black text-yellow-300 border-4 border-yellow-300" :
                        "bg-white text-gray-800"
                    }`}>
                    <p className="text-sm font-semibold">Judul Halaman</p>
                    <p className="text-xs opacity-80">Konten teks dengan berbagai preferensi user.</p>
                    <button className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${pref === "dark"
                        ? "bg-blue-500 text-white"
                        : pref === "high-contrast"
                            ? "bg-yellow-300 text-black border-2 border-black"
                            : "bg-blue-600 text-white"
                        } ${pref === "reduced-motion" ? "" : "hover:scale-105 transition-transform"}`}>
                        Tombol CTA
                    </button>
                    <div className={`h-2 rounded-full bg-blue-500 ${pref === "reduced-motion" ? "" : "animate-pulse"}`} />
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {pref === "default" && "/* tidak ada media query khusus */"}
                {pref === "dark" && "@media (prefers-color-scheme: dark) { /* dark theme */ }"}
                {pref === "reduced-motion" && "@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }"}
                {pref === "high-contrast" && "@media (prefers-contrast: more) { /* high contrast mode */ }"}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Playground: container query demo ────────────────────────────────────────

type ContainerWidth = "sm" | "md" | "lg"

function ContainerQueryPlayground() {
    const [width, setWidth] = useState<ContainerWidth>("md")

    const containerW: Record<ContainerWidth, string> = {
        sm: "w-[240px]",
        md: "w-[400px]",
        lg: "w-full",
    }

    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 Container Query — layout berubah berdasarkan ukuran container, bukan viewport</PlaygroundWrap.label>
                <ChipRow>
                    <Chip active={width === "sm"} onClick={() => setWidth("sm")}>container 240px</Chip>
                    <Chip active={width === "md"} onClick={() => setWidth("md")}>container 400px</Chip>
                    <Chip active={width === "lg"} onClick={() => setWidth("lg")}>container full</Chip>
                </ChipRow>
                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
                    Komponen yang sama berperilaku berbeda tergantung ukuran container-nya — bukan viewport.
                    Ini yang media query tidak bisa lakukan.
                </p>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div className={`${containerW[width]} mx-auto transition-all duration-500`}
                    style={{ containerType: "inline-size" }}>
                    {/* Card yang responsif terhadap container */}
                    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${width === "lg" ? "flex gap-0" : ""
                        }`}>
                        <div className={`bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold ${width === "lg" ? "w-32 shrink-0 text-xl" : "h-24 w-full text-2xl"
                            }`}>
                            IMG
                        </div>
                        <div className="p-3">
                            <p className={`font-bold ${width === "sm" ? "text-xs" : "text-sm"}`}>Judul Card</p>
                            {width !== "sm" && <p className="text-xs text-gray-500 mt-1">Deskripsi card yang lebih detail muncul kalau container cukup lebar.</p>}
                            <div className={`flex mt-2 gap-2 ${width === "sm" ? "flex-col" : "flex-row"}`}>
                                <button className="px-3 py-1 bg-blue-600 text-white rounded text-[10px] font-medium">Beli</button>
                                {width !== "sm" && <button className="px-3 py-1 border border-gray-200 rounded text-[10px]">Simpan</button>}
                            </div>
                        </div>
                    </div>
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {`.card-wrapper { container-type: inline-size; }\n@container (min-width: 400px) { .card { flex-direction: row; } }`}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResponsivePage() {
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
                        <Breadcrumb.curr>Responsive & Container Queries</Breadcrumb.curr>
                    </Breadcrumb>
                </TopBarInner>
            </TopBar>

            <Body>
                <Content>
                    <PageTitle>Responsive Design & Container Queries</PageTitle>
                    <PageDesc>
                        Dari media queries klasik hingga container queries modern — semua teknik untuk membuat
                        layout yang menyesuaikan diri dengan ukuran layar, preferensi user, dan ukuran container.
                    </PageDesc>

                    {/* ══ 01 INTRO ══════════════════════════════════════════════════ */}
                    <Section id="intro" onClick={() => setActiveSection("intro")}>
                        <H2>Apa itu Responsive Design<H2.anchor href="#intro">#</H2.anchor></H2>
                        <P>
                            Responsive Web Design (RWD) adalah pendekatan desain di mana layout dan konten
                            secara otomatis menyesuaikan dengan ukuran dan kemampuan perangkat yang digunakan.
                            Tiga pilar utama: fluid grids, flexible images, dan media queries.
                        </P>
                        <Callout type="php">
                            <Callout.icon>🐘</Callout.icon>
                            <Callout.content>
                                <Callout.title>Analogi PHP</Callout.title>
                                Responsive design seperti PHP conditional rendering —
                                <IC>if ($screen === 'mobile') renderMobileLayout()</IC>.
                                Bedanya, di CSS ini ditangani murni lewat deklarasi, bukan logika imperatif.
                            </Callout.content>
                        </Callout>
                        <ViewportPlayground />
                    </Section>

                    <Divider />

                    {/* ══ 02 VIEWPORT META ══════════════════════════════════════════ */}
                    <Section id="viewport-meta" onClick={() => setActiveSection("viewport-meta")}>
                        <H2>Viewport Meta Tag<H2.anchor href="#viewport-meta">#</H2.anchor></H2>
                        <P>
                            Sebelum media queries berfungsi di mobile, browser perlu tahu bahwa halaman
                            ini <em>dirancang</em> untuk responsive. Tanpa tag ini, mobile browser
                            akan "zoom out" dan merender halaman seolah layar lebar.
                        </P>
                        <Code file="index.html">{`
<!-- WAJIB ada di <head> untuk semua halaman responsive -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- Penjelasan tiap atribut -->
<!-- width=device-width: lebar viewport = lebar fisik device, bukan default 980px -->
<!-- initial-scale=1.0: zoom level awal = 1 (tidak di-zoom) -->

<!-- Opsi tambahan (jarang dipakai, hati-hati UX) -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<!-- maximum-scale=1.0 MENONAKTIFKAN pinch-zoom — BURUK untuk aksesibilitas! -->
<!-- Jangan pernah tambahkan user-scalable=no atau maximum-scale untuk halaman konten -->
            `}</Code>
                        <Callout type="danger">
                            <Callout.icon>🚫</Callout.icon>
                            <Callout.content>
                                <Callout.title>Jangan nonaktifkan pinch-zoom!</Callout.title>
                                <IC>user-scalable=no</IC> dan <IC>maximum-scale=1</IC> menonaktifkan
                                kemampuan user untuk zoom — ini melanggar WCAG 1.4.4 (Resize Text) dan
                                sangat membahayakan pengguna dengan gangguan penglihatan. Hanya pakai
                                di aplikasi yang benar-benar butuh (seperti game mobile atau peta).
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 03 MEDIA QUERIES ══════════════════════════════════════════ */}
                    <Section id="media-queries" onClick={() => setActiveSection("media-queries")}>
                        <H2>@media — Sintaks Dasar<H2.anchor href="#media-queries">#</H2.anchor></H2>
                        <P>
                            <IC>@media</IC> at-rule menerapkan CSS hanya ketika kondisi tertentu terpenuhi.
                            Terdiri dari media type (opsional) dan satu atau lebih media features.
                        </P>
                        <Code file="media-queries.css">{`
/* Sintaks dasar */
@media media-type and (media-feature) {
  /* CSS yang diterapkan kalau kondisi terpenuhi */
}

/* Media type */
@media screen { }   /* layar monitor, laptop, HP */
@media print  { }   /* saat halaman dicetak */
@media all    { }   /* default — semua media (bisa dihilangkan) */
@media speech { }   /* screen reader / speech synthesizer */

/* Media feature — ukuran viewport */
@media (min-width: 768px)  { }   /* viewport minimal 768px */
@media (max-width: 767px)  { }   /* viewport maksimal 767px */
@media (width: 1024px)     { }   /* tepat 1024px (jarang dipakai) */

/* Kombinasi type + feature */
@media screen and (min-width: 768px) { }

/* Di dalam link tag */
/* <link rel="stylesheet" media="print" href="print.css"> */

/* Tailwind menggunakan min-width (mobile-first) */
/* sm: = @media (min-width: 640px) */
/* md: = @media (min-width: 768px) */
/* lg: = @media (min-width: 1024px) */
/* xl: = @media (min-width: 1280px) */
/* 2xl: = @media (min-width: 1536px) */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 04 BREAKPOINTS ════════════════════════════════════════════ */}
                    <Section id="breakpoints" onClick={() => setActiveSection("breakpoints")}>
                        <H2>Breakpoints & Mobile-First<H2.anchor href="#breakpoints">#</H2.anchor></H2>
                        <P>
                            <strong>Mobile-first</strong> berarti menulis CSS untuk mobile sebagai default,
                            kemudian menambahkan <IC>min-width</IC> queries untuk layar yang lebih besar.
                            Ini kebalikan dari desktop-first yang menggunakan <IC>max-width</IC>.
                        </P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
                            <div className="grid grid-cols-2 px-4 py-2 bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">Mobile-first ✅ (min-width)</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">Desktop-first ⚠️ (max-width)</span>
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                                <pre className="p-4 text-[11px] font-mono text-[color-mix(in_srgb,var(--foreground)_75%,transparent)] leading-6 overflow-x-auto">{`/* Default: mobile */
.grid { grid-cols: 1 }

/* Tablet ke atas */
@media (min-width: 640px) {
  .grid { grid-cols: 2 }
}

/* Desktop ke atas */
@media (min-width: 1024px) {
  .grid { grid-cols: 3 }
}`}</pre>
                                <pre className="p-4 text-[11px] font-mono text-[color-mix(in_srgb,var(--foreground)_75%,transparent)] leading-6 overflow-x-auto">{`/* Default: desktop */
.grid { grid-cols: 3 }

/* Tablet ke bawah */
@media (max-width: 1023px) {
  .grid { grid-cols: 2 }
}

/* Mobile ke bawah */
@media (max-width: 639px) {
  .grid { grid-cols: 1 }
}`}</pre>
                            </div>
                        </div>
                        <Code file="tailwind-breakpoints.tsx">{`
// Tailwind — mobile-first by default
const Grid = tw.div({
  base: "grid gap-4 grid-cols-1",  // mobile default
  // Breakpoints ditambahkan sebagai prefix
  // sm: = 640px+, md: = 768px+, lg: = 1024px+, xl: = 1280px+, 2xl: = 1536px+
})

// Cara pakai: tulis class dengan breakpoint prefix
<div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />

// Di tw variants — gunakan base untuk mobile, tambahkan breakpoints
const Card = tw.div({
  base: "flex flex-col p-4",         // mobile: vertikal
  // Tidak ada cara native untuk responsive variants di tw API
  // Pakai className atau cn() untuk responsive classes
})
            `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                Mobile-first bukan sekedar urutan penulisan — ini tentang
                                prioritas. CSS yang lebih spesifik (lebih banyak kondisi)
                                menimpa yang lebih umum. Dengan mobile-first, mobile mendapat
                                CSS yang paling ringan dan cepat diparse.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 05 MQ FEATURES ════════════════════════════════════════════ */}
                    <Section id="mq-features" onClick={() => setActiveSection("mq-features")}>
                        <H2>Media Features Lengkap<H2.anchor href="#mq-features">#</H2.anchor></H2>
                        <P>Media queries tidak terbatas pada ukuran layar — ada puluhan media features yang bisa diquery.</P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
                            {[
                                { cat: "Ukuran Viewport", features: ["width / min-width / max-width", "height / min-height / max-height", "aspect-ratio / min-aspect-ratio / max-aspect-ratio"] },
                                { cat: "Display", features: ["resolution (dpi, dpcm, dppx)", "orientation: portrait | landscape", "display-mode: browser | standalone | fullscreen"] },
                                { cat: "Input", features: ["hover: none | hover", "pointer: none | coarse | fine", "any-hover / any-pointer"] },
                                { cat: "User Preference", features: ["prefers-color-scheme: light | dark", "prefers-reduced-motion: no-preference | reduce", "prefers-contrast: no-preference | more | less", "prefers-reduced-transparency", "forced-colors: none | active"] },
                                { cat: "Environment", features: ["update: none | slow | fast", "overflow-block / overflow-inline", "color / monochrome / color-gamut"] },
                            ].map(({ cat, features }) => (
                                <div key={cat} className="p-3 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] mb-2">{cat}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {features.map(f => <IC key={f} className="text-[10px]">{f}</IC>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Code file="media-features.css">{`
/* Pointer — touch vs mouse */
@media (pointer: coarse) {
  /* Touch device — perbesar tap target */
  .btn { min-height: 44px; min-width: 44px; }
}
@media (hover: none) {
  /* Tidak ada hover — sembunyikan hover-only UI */
  .tooltip { display: none; }
}

/* High DPI / Retina display */
@media (min-resolution: 2dppx) {
  .logo { background-image: url(logo@2x.png); }
}
/* atau */
@media (-webkit-min-device-pixel-ratio: 2) { } /* legacy Safari */

/* Warna — gamut */
@media (color-gamut: p3) {
  /* Device support P3 color space — pakai warna lebih vivid */
  .btn { background: oklch(60% 0.25 260); }
}
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 06 MQ RANGE SYNTAX ════════════════════════════════════════ */}
                    <Section id="mq-range" onClick={() => setActiveSection("mq-range")}>
                        <H2>Range Syntax — Media Queries Modern<H2.anchor href="#mq-range">#</H2.anchor></H2>
                        <P>
                            CSS Media Queries Level 4 memperkenalkan sintaks range yang lebih ringkas dan mudah dibaca,
                            menggunakan operator perbandingan (<IC>{"<"}</IC>, <IC>{">"}</IC>, <IC>{"<="}</IC>, <IC>{">="}</IC>)
                            daripada <IC>min-</IC> dan <IC>max-</IC> prefix.
                        </P>
                        <Code file="range-syntax.css">{`
/* Cara lama (Level 3) */
@media (min-width: 640px) and (max-width: 1023px) { }

/* Cara baru (Level 4 range syntax) */
@media (640px <= width < 1024px) { }
/* Lebih jelas: "lebar antara 640px dan 1024px" */

/* Berbagai bentuk range */
@media (width >= 640px)  { }   /* = min-width: 640px */
@media (width <= 1023px) { }   /* = max-width: 1023px */
@media (width > 640px)   { }   /* > bukan >= */
@media (width < 1024px)  { }   /* < bukan <= */

/* Range dua sisi */
@media (640px <= width <= 1023px)  { }  /* inklusif keduanya */
@media (640px < width < 1024px)    { }  /* eksklusif keduanya */

/* Juga berlaku untuk height, aspect-ratio, dll */
@media (height >= 600px) { }
@media (480px <= height <= 900px) { }

/* Browser support: semua modern browser (Chrome 104+, Firefox 63+, Safari 16.4+) */
            `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                Range syntax lebih mudah dibaca terutama untuk kondisi "antara dua ukuran".
                                <IC>(640px {"<="} width {"<"} 1024px)</IC> jauh lebih jelas dari
                                <IC>(min-width: 640px) and (max-width: 1023px)</IC>.
                                Tailwind belum menggunakan syntax ini secara default tapi bisa dipakai di arbitrary CSS.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 07 MQ LOGICAL ═════════════════════════════════════════════ */}
                    <Section id="mq-logical" onClick={() => setActiveSection("mq-logical")}>
                        <H2>Logical Operators — and, or, not<H2.anchor href="#mq-logical">#</H2.anchor></H2>
                        <P>
                            Media queries mendukung operator logika untuk menggabungkan kondisi:
                            <IC>and</IC> (semua harus terpenuhi), <IC>or</IC> / koma (salah satu cukup),
                            <IC>not</IC> (negasi), dan <IC>only</IC> (legacy, untuk sembunyikan dari browser lama).
                        </P>
                        <Code file="mq-logical.css">{`
/* AND — semua kondisi harus terpenuhi */
@media screen and (min-width: 768px) and (orientation: landscape) { }
@media (min-width: 768px) and (max-width: 1023px) { } /* hanya tablet */

/* OR — koma = OR, salah satu cukup */
@media (max-width: 639px), (orientation: portrait) { }
/* = kalau mobile ATAU portrait */

/* Level 4: kata kunci 'or' eksplisit */
@media (max-width: 639px) or (orientation: portrait) { }

/* NOT — negasi seluruh query */
@media not screen { }                  /* bukan screen (misal print) */
@media not (min-width: 768px) { }     /* bukan 768px ke atas = di bawah 768px */
@media not (hover: hover) { }         /* tidak ada hover = touch device */

/* Kombinasi dengan not */
@media not screen and (color) { }     /* not berlaku ke seluruh "screen and (color)" */
@media not (min-width: 768px) and (orientation: landscape) { }

/* ONLY — legacy, tidak perlu di browser modern */
@media only screen and (min-width: 768px) { } /* hanya untuk browser yang support @media */

/* Tailwind custom breakpoints — bisa pakai max: prefix untuk desktop-first */
/* max-sm: = @media (max-width: 639px) */
/* max-md: = @media (max-width: 767px) */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 08 USER PREFERENCE ════════════════════════════════════════ */}
                    <Section id="user-preference" onClick={() => setActiveSection("user-preference")}>
                        <H2>User Preference Queries<H2.anchor href="#user-preference">#</H2.anchor></H2>
                        <P>
                            Selain ukuran layar, media queries bisa membaca preferensi sistem user —
                            dark mode, reduced motion, high contrast, dan lainnya. Ini fondasi dari
                            accessibility-aware CSS.
                        </P>
                        <UserPrefPlayground />
                        <Code file="user-preferences.css">{`
/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #fafafa;
    --surface: #1a1a1a;
  }
}

/* Reduced motion — PENTING untuk aksesibilitas */
@media (prefers-reduced-motion: reduce) {
  /* Matikan SEMUA animasi */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Atau lebih targeted */
@media (prefers-reduced-motion: no-preference) {
  /* Hanya jalankan animasi kalau user tidak keberatan */
  .animated { animation: slide-in 0.3s ease; }
}

/* High contrast */
@media (prefers-contrast: more) {
  .btn { border: 2px solid currentColor; }
  .text-subtle { color: inherit; } /* batalkan warna yang terlalu soft */
}

/* Forced colors (Windows High Contrast Mode) */
@media (forced-colors: active) {
  /* Windows override warna — pastikan border/outline tetap terlihat */
  .btn { border: 2px solid ButtonText; }
}

/* Tailwind: dark: prefix | motion-reduce: prefix | motion-safe: prefix | contrast-more: */
            `}</Code>
                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>prefers-reduced-motion adalah aksesibilitas kritis</Callout.title>
                                Untuk pengguna dengan vestibular disorders atau epilepsi, animasi bisa
                                menyebabkan pusing atau serangan. <IC>prefers-reduced-motion</IC> adalah
                                salah satu media query terpenting untuk diterapkan — bukan nice-to-have,
                                tapi keharusan untuk produk yang inklusif.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 09 FLUID LAYOUT ═══════════════════════════════════════════ */}
                    <Section id="fluid-layout" onClick={() => setActiveSection("fluid-layout")}>
                        <H2>Fluid Layout — responsif tanpa breakpoint<H2.anchor href="#fluid-layout">#</H2.anchor></H2>
                        <P>
                            Tidak semua responsivitas butuh media query. Kombinasi <IC>clamp()</IC>,
                            <IC>min()</IC>/<IC>max()</IC>, <IC>fr</IC> units, dan <IC>auto-fill/auto-fit</IC>
                            bisa menghasilkan layout yang fluid secara matematis.
                        </P>
                        <Code file="fluid-layout.css">{`
/* Fluid typography — tidak perlu @media sama sekali */
h1 { font-size: clamp(1.5rem, 4vw + 0.5rem, 3rem); }
p  { font-size: clamp(1rem, 1vw + 0.75rem, 1.125rem); }

/* Fluid spacing */
.section { padding: clamp(2rem, 5vw, 6rem); }

/* Fluid grid — auto kolom tanpa breakpoint */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: clamp(1rem, 3vw, 2rem);
}

/* Fluid max-width container */
.container {
  width: min(100% - 2rem, 1200px); /* max 1200px, min full-2rem (padding) */
  margin-inline: auto;
}

/* Perbandingan: */
/* Breakpoint approach: 3 @media rules, nilai step */
/* Fluid approach: 1 line, nilai continuous */
            `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                Fluid layout dan media queries bukan alternatif — mereka saling melengkapi.
                                Pakai fluid untuk typography, spacing, dan simple layout. Gunakan media queries
                                untuk perubahan layout struktural (hamburger menu, sidebar collapse, dll).
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 10 RESPONSIVE IMAGES ══════════════════════════════════════ */}
                    <Section id="responsive-images" onClick={() => setActiveSection("responsive-images")}>
                        <H2>Responsive Images<H2.anchor href="#responsive-images">#</H2.anchor></H2>
                        <P>
                            Gambar perlu penanganan khusus di responsive layout — tidak hanya ukuran,
                            tapi juga resolution (Retina) dan art direction (konten berbeda per ukuran layar).
                        </P>
                        <Code file="responsive-images.html">{`
<!-- CSS approach — paling sederhana -->
<img src="hero.jpg" alt="Hero" style="max-width: 100%; height: auto;">
/* atau via CSS */
img { max-width: 100%; height: auto; display: block; }

<!-- srcset — browser pilih resolusi terbaik -->
<img
  src="hero-800.jpg"
  srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1600.jpg 1600w"
  sizes="(min-width: 768px) 50vw, 100vw"
  alt="Hero image"
>
/* sizes: "kalau viewport >= 768px, gambar 50vw; lainnya 100vw"
   browser hitung kebutuhan px, pilih srcset yang tepat */

<!-- picture — art direction, konten berbeda per breakpoint -->
<picture>
  <source media="(min-width: 1024px)" srcset="hero-wide.jpg">
  <source media="(min-width: 640px)"  srcset="hero-medium.jpg">
  <img src="hero-mobile.jpg" alt="Hero">  <!-- fallback -->
</picture>

<!-- Modern: aspect-ratio untuk cegah layout shift -->
<img
  src="photo.jpg"
  width="800" height="600"
  style="aspect-ratio: 4/3; width: 100%; height: auto;"
  alt="Photo"
  loading="lazy"
>
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 11 CONTAINER INTRO ════════════════════════════════════════ */}
                    <Section id="container-intro" onClick={() => setActiveSection("container-intro")}>
                        <H2>Container Queries — Intro<H2.anchor href="#container-intro">#</H2.anchor></H2>
                        <P>
                            Media queries merespons ukuran <em>viewport</em>. Container queries merespons
                            ukuran <em>container elemen itu sendiri</em>. Ini memungkinkan komponen yang
                            benar-benar reusable — tidak peduli di mana diletakkan, mereka menyesuaikan
                            diri dengan ruang yang tersedia.
                        </P>
                        <ContainerQueryPlayground />
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
                            <div className="grid grid-cols-2 divide-x divide-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                                <div className="p-4">
                                    <p className="text-xs font-bold text-rose-600 mb-2">❌ Media Query — masalah</p>
                                    <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] leading-relaxed">
                                        Card sama di sidebar (lebar 200px) dan di main (lebar 800px) mendapat CSS yang sama
                                        karena viewport-nya sama. Card di sidebar jadi terlalu "besar" untuk ruangnya.
                                    </p>
                                </div>
                                <div className="p-4">
                                    <p className="text-xs font-bold text-emerald-600 mb-2">✅ Container Query — solusi</p>
                                    <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] leading-relaxed">
                                        Card di sidebar query container-nya (200px) → layout kompak.
                                        Card di main query container-nya (800px) → layout expanded.
                                        Viewport berapapun, card selalu optimal untuk ruangnya.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Divider />

                    {/* ══ 12 CONTAINER TYPE ═════════════════════════════════════════ */}
                    <Section id="container-type" onClick={() => setActiveSection("container-type")}>
                        <H2>container-type & container-name<H2.anchor href="#container-type">#</H2.anchor></H2>
                        <P>
                            Sebelum bisa di-query, elemen perlu di-deklarasikan sebagai container dengan
                            <IC>container-type</IC>. <IC>container-name</IC> opsional tapi penting saat
                            ada multiple nested containers.
                        </P>
                        <Code file="container-type.css">{`
/* container-type values */
.wrapper {
  container-type: inline-size;
  /* Paling umum — query berdasarkan inline size (width di horizontal writing) */
  /* Ini yang biasanya diinginkan: "query lebar container" */
}

.wrapper {
  container-type: size;
  /* Query berdasarkan BOTH width DAN height */
  /* Butuh height eksplisit — jarang dipakai */
}

.wrapper {
  container-type: normal;
  /* Default — tidak bisa di-query ukurannya, tapi tetap bisa style query */
}

/* container-name — beri nama untuk query yang lebih spesifik */
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

.sidebar {
  container-type: inline-size;
  container-name: sidebar;
}

/* Shorthand: container */
.wrapper { container: card / inline-size; }
/* = container-name: card; container-type: inline-size; */

/* Tailwind: [@container]:... atau [container-type:inline-size] */
            `}</Code>
                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>container-type: size butuh height eksplisit</Callout.title>
                                <IC>container-type: size</IC> mengaktifkan size containment — elemen tidak bisa
                                lagi mendapat ukuran dari kontennya. Tanpa height eksplisit, elemen collapse ke 0.
                                Hampir selalu gunakan <IC>inline-size</IC> kecuali benar-benar butuh query height.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 13 CONTAINER SYNTAX ═══════════════════════════════════════ */}
                    <Section id="container-syntax" onClick={() => setActiveSection("container-syntax")}>
                        <H2>@container — Sintaks<H2.anchor href="#container-syntax">#</H2.anchor></H2>
                        <P>
                            Sintaks <IC>@container</IC> mirip <IC>@media</IC> tapi merespons ukuran container,
                            bukan viewport. Bisa dipakai tanpa nama (query container terdekat) atau dengan nama spesifik.
                        </P>
                        <Code file="container-syntax.css">{`
/* Tanpa nama — query container terdekat yang punya container-type */
@container (min-width: 400px) {
  .card { flex-direction: row; }
}

/* Dengan nama — query container spesifik */
@container card (min-width: 400px) {
  .card { flex-direction: row; }
}

/* Range syntax juga berlaku */
@container (400px <= width < 800px) {
  .card { /* tablet layout */ }
}

/* Logical operators */
@container (min-width: 400px) and (min-height: 200px) {
  .card { /* hanya kalau container cukup lebar DAN tinggi */ }
}

/* Nesting — @container dalam @container */
@container sidebar (min-width: 200px) {
  .nav-item { padding: 0.5rem; }

  @container (min-width: 300px) {
    .nav-item { padding: 0.75rem 1rem; }
  }
}

/* Bisa dikombinasikan dengan @media */
@media (min-width: 768px) {
  .sidebar { container-type: inline-size; }
}
@container (min-width: 200px) {
  .nav-item { flex-direction: row; }
}
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 14 CQ UNITS ═══════════════════════════════════════════════ */}
                    <Section id="cq-units" onClick={() => setActiveSection("cq-units")}>
                        <H2>Container Query Units — cqw, cqi, cqb…<H2.anchor href="#cq-units">#</H2.anchor></H2>
                        <P>
                            Mirip <IC>vw</IC>/<IC>vh</IC> untuk viewport, container queries punya unit
                            sendiri yang relatif terhadap container terdekat. Berguna untuk font size
                            atau spacing yang fluid mengikuti container.
                        </P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
                            {[
                                { unit: "cqw", desc: "1% dari lebar (width) container" },
                                { unit: "cqh", desc: "1% dari tinggi (height) container — butuh container-type: size" },
                                { unit: "cqi", desc: "1% dari inline size container (= cqw di horizontal writing)" },
                                { unit: "cqb", desc: "1% dari block size container (= cqh di horizontal writing)" },
                                { unit: "cqmin", desc: "1% dari nilai terkecil antara cqi dan cqb" },
                                { unit: "cqmax", desc: "1% dari nilai terbesar antara cqi dan cqb" },
                            ].map(({ unit, desc }) => (
                                <div key={unit} className="flex gap-4 p-3 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0 items-center">
                                    <IC className="shrink-0 w-16 text-center">{unit}</IC>
                                    <p className="text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">{desc}</p>
                                </div>
                            ))}
                        </div>
                        <Code file="cq-units.css">{`
.card-wrapper { container-type: inline-size; }

/* Font size fluid mengikuti container */
.card-title {
  font-size: clamp(1rem, 5cqi, 2rem);
  /* "5% dari lebar container, min 1rem, max 2rem" */
}

/* Padding mengikuti container */
.card {
  padding: clamp(1rem, 3cqi, 2rem);
}

/* Fallback: kalau tidak ada container, unit ini default ke small viewport units */
/* cqw → svw, cqh → svh, cqi → svi, cqb → svb */

/* Tailwind: pakai arbitrary — text-[5cqi] p-[3cqi] */
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 15 STYLE QUERIES ══════════════════════════════════════════ */}
                    <Section id="style-queries" onClick={() => setActiveSection("style-queries")}>
                        <H2>Style Queries<H2.anchor href="#style-queries">#</H2.anchor></H2>
                        <P>
                            Selain ukuran, <IC>@container</IC> juga bisa query <em>CSS custom properties</em>
                            dari container. Ini memungkinkan "theme passing" dari parent ke children
                            tanpa JavaScript atau prop drilling.
                        </P>
                        <Code file="style-queries.css">{`
/* Style query — query nilai CSS custom property di container */
.card-wrapper {
  container-type: normal; /* tidak perlu size containment untuk style query */
  --theme: light;
}

.card-wrapper.dark {
  --theme: dark;
}

/* @container style() — query custom property */
@container style(--theme: dark) {
  .card {
    background: #1a1a2e;
    color: #e0e0ff;
  }
  .card-btn {
    background: #4a9eff;
  }
}

/* Kombinasi size + style */
@container card and (min-width: 400px) and style(--theme: dark) {
  .card {
    flex-direction: row;
    background: #1a1a2e;
  }
}

/* Kasus penggunaan: */
/* - Komponen yang perlu tahu "apakah dia di dalam dark card" */
/* - Layout yang berubah berdasarkan "mode" parent */
/* - Theme-aware components tanpa prop drilling */

/* Browser support: Chrome 111+, Safari 17.2+, Firefox masih dalam implementasi */
            `}</Code>
                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>Style queries masih partial support</Callout.title>
                                Style queries untuk custom properties sudah support di Chrome 111+ dan Safari 17.2+,
                                tapi Firefox belum mengimplementasikan penuh. Untuk production, siapkan fallback
                                atau pakai feature detection dengan <IC>@supports (container-type: normal)</IC>.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 16 CQ VS MQ ═══════════════════════════════════════════════ */}
                    <Section id="cq-vs-mq" onClick={() => setActiveSection("cq-vs-mq")}>
                        <H2>Container vs Media Queries<H2.anchor href="#cq-vs-mq">#</H2.anchor></H2>
                        <P>Kapan pakai masing-masing — bukan pilihan satu atau lainnya, tapi keduanya untuk tujuan berbeda.</P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
                            <div className="grid grid-cols-3 px-4 py-2 bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                                {["Kasus", "Media Query", "Container Query"].map(h => (
                                    <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">{h}</span>
                                ))}
                            </div>
                            {[
                                { kasus: "Layout halaman secara keseluruhan", mq: "✅ Ideal", cq: "⚠️ Overkill" },
                                { kasus: "Komponen reusable (card, widget)", mq: "❌ Tidak tahu di mana dipakai", cq: "✅ Ideal" },
                                { kasus: "Dark mode / color scheme", mq: "✅ prefers-color-scheme", cq: "✅ style queries" },
                                { kasus: "Navigation mobile → hamburger", mq: "✅ Ideal", cq: "⚠️ Tidak natural" },
                                { kasus: "Sidebar narrow → icon only", mq: "❌ Viewport bisa lebar tapi sidebar sempit", cq: "✅ Ideal" },
                                { kasus: "Print layout", mq: "✅ @media print", cq: "❌ Tidak ada print CQ" },
                                { kasus: "Reduced motion / pointer type", mq: "✅ User preferences", cq: "❌ Tidak tersedia" },
                                { kasus: "Typography fluid per container", mq: "⚠️ Butuh JS atau clamp", cq: "✅ cqi units" },
                            ].map(row => (
                                <div key={row.kasus} className="grid grid-cols-3 px-4 py-2.5 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0 text-xs gap-2 items-center">
                                    <span className="text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">{row.kasus}</span>
                                    <span>{row.mq}</span>
                                    <span>{row.cq}</span>
                                </div>
                            ))}
                        </div>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                <strong>Aturan praktis:</strong> Gunakan media queries untuk keputusan layout
                                di level halaman. Gunakan container queries untuk komponen yang perlu
                                "sadar konteks" — di mana pun mereka diletakkan, mereka tampil optimal.
                                Keduanya bisa dipakai bersamaan.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ VIEWPORT UNITS ══════════════════════════════════════════ */}
                    <Section id="viewport-units" onClick={() => setActiveSection("viewport-units")}>
                        <H2>Viewport Units — svh, dvh, lvh dan variannya<H2.anchor href="#viewport-units">#</H2.anchor></H2>
                        <P>
                            Unit <IC>vh</IC> dan <IC>vw</IC> klasik sudah lama ada, tapi di mobile ada masalah:
                            browser bar (address bar) bisa muncul/hilang saat scroll, mengubah tinggi viewport yang tersedia.
                            CSS Level 4 memperkenalkan tiga "variants" untuk mengatasi ini.
                        </P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
                            <div className="grid grid-cols-4 px-4 py-2 bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                                {["Prefix", "Nama", "Deskripsi", "Kapan pakai"].map(h => (
                                    <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">{h}</span>
                                ))}
                            </div>
                            {[
                                { prefix: "v*", name: "Viewport", desc: "Equivalent lvh — sama dengan large viewport. Legacy.", when: "Desktop, backward compat" },
                                { prefix: "sv*", name: "Small Viewport", desc: "Ukuran terkecil viewport — saat semua browser UI terlihat (address bar, etc)", when: "Content yang tidak boleh terpotong" },
                                { prefix: "lv*", name: "Large Viewport", desc: "Ukuran terbesar viewport — saat semua browser UI tersembunyi", when: "Full-bleed sections" },
                                { prefix: "dv*", name: "Dynamic Viewport", desc: "Berubah dinamis mengikuti browser UI saat scroll — bisa menyebabkan reflow", when: "Hero section yang ikut browser bar" },
                            ].map(row => (
                                <div key={row.prefix} className="grid grid-cols-4 px-4 py-2.5 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0 text-xs gap-2 items-start">
                                    <IC>{row.prefix}</IC>
                                    <span className="font-semibold">{row.name}</span>
                                    <span className="text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">{row.desc}</span>
                                    <span className="text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{row.when}</span>
                                </div>
                            ))}
                        </div>
                        <Code file="viewport-units.css">{`
/* Unit klasik */
.hero { height: 100vh; } /* = 100lvh di mobile — saat browser bar hidden */

/* Masalah di mobile: 100vh bisa terlalu tinggi saat browser bar muncul */

/* Solusi modern */
.hero { height: 100svh; } /* ukuran KECIL — safe, tidak terpotong */
.hero { height: 100dvh; } /* ikuti browser bar dinamis (bisa reflow!) */
.hero { height: 100lvh; } /* ukuran BESAR — saat browser bar hidden */

/* Unit lengkap: w, h, i (inline), b (block), min, max */
.box { width: 50svw; }    /* 50% small viewport width */
.box { height: 100dvh; }  /* 100% dynamic viewport height */
.box { width: 100vmin; }  /* 100% dari dimensi terkecil (w atau h) */
.box { height: 100vmax; } /* 100% dari dimensi terbesar */

/* Rekomendasi praktis */
.full-screen { min-height: 100svh; } /* min — konten bisa lebih panjang */
.modal-overlay { height: 100dvh; }   /* modal ikuti browser bar */
.section { padding-block: 10svh; }   /* spasi vertikal fluid */

/* Tailwind: h-screen = 100vh, min-h-screen = 100vh
   Untuk svh/dvh/lvh pakai arbitrary: h-[100svh] min-h-[100dvh] */
                        `}</Code>
                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>dvh menyebabkan reflow</Callout.title>
                                <IC>dvh</IC> berubah setiap kali browser bar muncul/hilang —
                                ini menyebabkan layout reflow yang bisa menurunkan performa dan
                                terlihat "bergetar". Untuk sebagian besar kasus, <IC>svh</IC>
                                lebih aman: konten selalu pas meski browser bar terlihat.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ SAFE AREA ════════════════════════════════════════════════ */}
                    <Section id="safe-area" onClick={() => setActiveSection("safe-area")}>
                        <H2>env() & Safe Area Inset — notch dan home indicator<H2.anchor href="#safe-area">#</H2.anchor></H2>
                        <P>
                            iPhone dengan notch (Dynamic Island) dan Android dengan gesture navigation bar
                            punya area yang tidak boleh diisi konten interaktif. CSS <IC>env()</IC>
                            memberikan akses ke nilai-nilai ini secara dinamis.
                        </P>
                        <Code file="safe-area.css">{`
/* env() — environment variables dari browser/device */
/* Nilai safe area dihitung dari device notch dan home indicator */

/* Safe area insets */
env(safe-area-inset-top)     /* tinggi notch/status bar */
env(safe-area-inset-right)   /* inset kanan (landscape notch) */
env(safe-area-inset-bottom)  /* tinggi home indicator / gesture bar */
env(safe-area-inset-left)    /* inset kiri (landscape notch) */

/* Cara pakai — dengan fallback */
.header {
  padding-top: env(safe-area-inset-top, 0px); /* fallback = 0 */
}

.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom, 16px);
  /* Pada iPhone: otomatis tambahkan ruang untuk home indicator */
  /* Pada device lain: gunakan fallback 16px */
}

/* PENTING: viewport-fit=cover diperlukan agar safe area berlaku */
/* Di HTML: */
/* <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"> */
/* Tanpa viewport-fit=cover, browser secara otomatis menghindari area notch */

/* Pakai dengan calc untuk minimum padding */
.floating-btn {
  bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
}

/* Dengan sticky/fixed positioning */
.sticky-footer {
  position: sticky;
  bottom: 0;
  padding-bottom: max(env(safe-area-inset-bottom), 16px);
  /* max() — ambil nilai terbesar: safe area atau minimal 16px */
}

/* Tailwind: tidak ada built-in, pakai arbitrary */
/* pb-[env(safe-area-inset-bottom)] */
/* atau via @supports */
                        `}</Code>
                        <Callout type="note">
                            <Callout.icon>ℹ️</Callout.icon>
                            <Callout.content>
                                <Callout.title>Kapan perlu safe area?</Callout.title>
                                Wajib diperhatikan untuk: sticky/fixed bottom nav, floating action button,
                                toast/snackbar di bawah, dan full-screen experience (game, app-like PWA).
                                Untuk halaman konten biasa dengan scroll, browser sudah handle otomatis
                                kecuali kamu menggunakan <IC>viewport-fit=cover</IC>.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    {/* ══ 17 TW USAGE ═══════════════════════════════════════════════ */}
                    <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
                        <H2>Responsive di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
                        <Code file="responsive-tw.tsx">{`
import { tw } from "tailwind-styled-v4"

// Breakpoint classes langsung di base/variants
const Grid = tw.div({
  base: "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
})

// Komponen responsive dengan variants eksplisit
const Card = tw.article({
  base: "flex flex-col rounded-xl border overflow-hidden",
  variants: {
    // Orientation bisa di-set dari luar, responsif via className
    orientation: {
      vertical:   "flex-col",
      horizontal: "flex-row",
    },
  },
  defaultVariants: { orientation: "vertical" },
})

// Container query component
const AdaptiveCard = tw.div({
  base: \`
    [container-type:inline-size]
    flex flex-col gap-3 p-4 rounded-xl border bg-[var(--surface)]
    [@container(min-width:400px)]:flex-row
    [@container(min-width:600px)]:gap-6
  \`,
})

// User preference — dark mode, reduced motion
const AnimatedButton = tw.button({
  base: \`
    px-4 py-2 rounded-lg bg-blue-600 text-white
    transition-transform duration-200
    hover:scale-105
    motion-reduce:hover:scale-100
    motion-reduce:transition-none
    dark:bg-blue-500
  \`,
})

// Conditional responsive pattern: pakai cn() untuk complex responsive
// import { cn } from "@/lib/utils"
// <Card className={cn("flex-col", isWide && "sm:flex-row")} />
            `}</Code>
                    </Section>

                    <Divider />

                    {/* ══ 18 EXERCISE ═══════════════════════════════════════════════ */}
                    <Section id="exercise" onClick={() => setActiveSection("exercise")}>
                        <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Mobile-first navigation</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat komponen <IC>Navbar</IC> yang di mobile menampilkan hamburger menu dan menyembunyikan nav links. Di <IC>md:</IC> keatas, tampilkan nav links horizontal.</p>
                                <p>Gunakan <IC>useState</IC> untuk toggle menu mobile, dan <IC>hidden md:flex</IC> / <IC>flex md:hidden</IC> untuk show/hide elements.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Fluid typography system</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat type scale yang fluid menggunakan <IC>clamp()</IC>: h1 (1.875rem → 3rem), h2 (1.5rem → 2.25rem), body (1rem → 1.125rem).</p>
                                <p>Tidak boleh ada satu pun <IC>@media</IC> rule — semua menggunakan <IC>clamp()</IC> dengan <IC>vw</IC> sebagai preferred value.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Container query card</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat komponen <IC>ProductCard</IC> yang:</p>
                                <p>- Di container sempit (&lt;300px): hanya tampilkan gambar + judul</p>
                                <p>- Di container medium (300-500px): tambahkan deskripsi dan harga</p>
                                <p>- Di container lebar (500px+): layout horizontal (gambar kiri, konten kanan)</p>
                                <p>Letakkan card yang sama di sidebar (200px) dan main content (full) — lihat perbedaannya.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 4 — Dark mode dengan prefers-color-scheme</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Implementasikan dark mode menggunakan CSS custom properties. Define variabel <IC>--bg</IC>, <IC>--text</IC>, <IC>--surface</IC> untuk light mode, kemudian override di <IC>@media (prefers-color-scheme: dark)</IC>.</p>
                                <p>Tambahkan juga toggle manual yang menambahkan class <IC>.dark</IC> ke <IC>html</IC> untuk override system preference.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 5 — Reduced motion safe animations</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat komponen dengan loading skeleton animation dan page transition. Pastikan semua animasi dihormati oleh <IC>prefers-reduced-motion: reduce</IC>.</p>
                                <p>Gunakan pattern <IC>@media (prefers-reduced-motion: no-preference)</IC> (opt-in) alih-alih <IC>reduce</IC> (opt-out) untuk keamanan lebih baik.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 6 — Touch-optimized UI</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Gunakan <IC>@media (pointer: coarse)</IC> untuk membuat tombol dan link lebih besar di touch device (min 44×44px sesuai WCAG).</p>
                                <p>Gunakan <IC>@media (hover: none)</IC> untuk menyembunyikan tooltip yang hanya muncul saat hover — ganti dengan elemen yang selalu visible di touch.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/dasar-css/css-grid" dir="prev">
                            <NavBtn.hint>← Previous</NavBtn.hint>
                            <NavBtn.label>CSS Grid</NavBtn.label>
                        </NavBtn>
                        <NavBtn href="/learn/dasar-css" dir="next">
                            <NavBtn.hint>Next →</NavBtn.hint>
                            <NavBtn.label>Selesai — Dasar CSS</NavBtn.label>
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
