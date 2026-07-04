/**
 * CSS High — Advanced Layout Patterns
 */
"use client"
import { useState } from "react"
import {
    Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
    PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
    CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
    PlaygroundWrap, Chip, ChipRow,
    LayoutPreview, Box, HolyGrail, PatternGrid, PatternCard, PatternTitle, PatternDesc,
} from "./styles"

const TOC = [
    { id: "sticky-footer", label: "Sticky Footer" },
    { id: "full-bleed", label: "Full-Bleed Layout" },
    { id: "holy-grail", label: "Holy Grail (Grid)" },
    { id: "sidebar", label: "Sidebar Patterns" },
    { id: "card-patterns", label: "Card Patterns" },
    { id: "centering", label: "Center Anything" },
    { id: "intrinsic", label: "Intrinsic Layout" },
    { id: "ram", label: "RAM Pattern" },
    { id: "spacing-system", label: "Spacing System" },
    { id: "stack-primitive", label: "Stack Layout Primitive" },
    { id: "tw-usage", label: "Pakai di tw" },
    { id: "exercise", label: "Latihan" },
]

function Code({ file, children }: { file?: string; children: string }) {
    const [copied, setCopied] = useState(false)
    return (
        <CodeWrap>
            <CodeWrap.header>
                <CodeWrap.filename>{file ?? "css"}</CodeWrap.filename>
                <CopyBtn copied={copied} onClick={() => { navigator.clipboard.writeText(children.trim()); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
                    {copied ? "✓ Copied" : "Copy"}
                </CopyBtn>
            </CodeWrap.header>
            <CodeWrap.body>{children.trim()}</CodeWrap.body>
        </CodeWrap>
    )
}

function HolyGrailPreview() {
    return (
        <LayoutPreview>
            <LayoutPreview.label>Holy Grail — grid-template-areas</LayoutPreview.label>
            <LayoutPreview.demo>
                <HolyGrail>
                    <Box color="indigo" style={{ gridArea: "header" }}>Header</Box>
                    <Box color="violet" style={{ gridArea: "nav" }}>Nav</Box>
                    <Box color="blue" style={{ gridArea: "main" }}>Main Content</Box>
                    <Box color="emerald" style={{ gridArea: "aside" }}>Aside</Box>
                    <Box color="gray" style={{ gridArea: "footer" }}>Footer</Box>
                </HolyGrail>
            </LayoutPreview.demo>
        </LayoutPreview>
    )
}

type CenterMethod = "flex" | "grid" | "absolute" | "margin" | "place"
function CenteringPlayground() {
    const [method, setMethod] = useState<CenterMethod>("flex")
    const code: Record<CenterMethod, string> = {
        flex: `.parent { display: flex; align-items: center; justify-content: center; }`,
        grid: `.parent { display: grid; place-items: center; }`,
        absolute: `.parent { position: relative; }\n.child  { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }`,
        margin: `.child  { width: fit-content; margin: auto; }\n/* Untuk vertikal: butuh parent dengan height */`,
        place: `.parent { display: grid; }\n.child  { place-self: center; }`,
    }
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎯 Center Anything — semua cara modern</PlaygroundWrap.label>
                <ChipRow>
                    {(["flex", "grid", "absolute", "margin", "place"] as CenterMethod[]).map(m => (
                        <Chip key={m} active={method === m} onClick={() => setMethod(m)}>{m}</Chip>
                    ))}
                </ChipRow>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <pre className="text-xs font-mono leading-6 text-[var(--foreground)] whitespace-pre-wrap">{code[method]}</pre>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{`Method: ${method}`}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

export default function AdvancedLayoutPatternsPage() {
    const [activeSection, setActiveSection] = useState("sticky-footer")
    return (
        <Page>
            <TopBar><TopBarInner>
                <Breadcrumb>
                    <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.link href="/learn/high">High</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.curr>Advanced Layout Patterns</Breadcrumb.curr>
                </Breadcrumb>
            </TopBarInner></TopBar>
            <Body>
                <Content>
                    <PageTitle>Advanced Layout Patterns</PageTitle>
                    <PageDesc>Sticky footer, full-bleed, Holy Grail, sidebar patterns, card patterns, centering, intrinsic layout, RAM pattern, spacing system, dan stack layout primitives.</PageDesc>

                    <Section id="sticky-footer" onClick={() => setActiveSection("sticky-footer")}>
                        <H2>Sticky Footer Pattern<H2.anchor href="#sticky-footer">#</H2.anchor></H2>
                        <P>Footer yang selalu menempel di bawah viewport meski konten pendek — dua cara utama: Flexbox dan Grid.</P>
                        <Code file="sticky-footer.css">{`
/* ── Cara 1: Flexbox (paling umum) ── */
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;      /* atau 100dvh untuk mobile */
}
.main-content {
  flex: 1;                /* grow untuk mengisi sisa space */
}
.footer { /* tidak perlu style khusus */ }

/* ── Cara 2: Grid ── */
.page {
  display: grid;
  grid-template-rows: auto 1fr auto;  /* header | main | footer */
  min-height: 100vh;
}

/* ── Cara 3: margin-top auto di footer ── */
.page    { display: flex; flex-direction: column; min-height: 100vh; }
.footer  { margin-top: auto; }  /* dorong footer ke bawah */

/* Mobile: gunakan dvh untuk menghindari address bar issue */
.page { min-height: 100dvh; }
/* 100dvh = viewport height minus browser chrome (lebih akurat di mobile) */
            `}</Code>
                        <LayoutPreview>
                            <LayoutPreview.label>Sticky Footer Demo</LayoutPreview.label>
                            <LayoutPreview.demo>
                                <div className="flex flex-col min-h-[180px] rounded-lg overflow-hidden border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)]">
                                    <Box color="indigo" className="rounded-none py-2">Header</Box>
                                    <Box color="blue" className="flex-1 rounded-none py-4">Main (flex:1)</Box>
                                    <Box color="gray" className="rounded-none py-2">Footer selalu di bawah</Box>
                                </div>
                            </LayoutPreview.demo>
                        </LayoutPreview>
                    </Section>
                    <Divider />

                    <Section id="full-bleed" onClick={() => setActiveSection("full-bleed")}>
                        <H2>Full-Bleed Layout<H2.anchor href="#full-bleed">#</H2.anchor></H2>
                        <P>Konten container dengan max-width, tapi elemen tertentu (hero, banner) bisa "bleeding" keluar hingga edge layar.</P>
                        <Code file="full-bleed.css">{`
/* Full-bleed menggunakan grid */
.content-grid {
  --padding:    1rem;
  --content-max: 70ch;

  display: grid;
  grid-template-columns:
    [full-start]   minmax(var(--padding), 1fr)
    [content-start] min(var(--content-max), 100% - var(--padding) * 2)
    [content-end]  minmax(var(--padding), 1fr)
    [full-end];
}

/* Semua children masuk content column secara default */
.content-grid > * {
  grid-column: content;
}

/* Full-bleed: span dari full-start ke full-end */
.full-bleed {
  grid-column: full;
  width: 100%;
}

/* Penggunaan */
/* <main class="content-grid">
     <p>Normal content di dalam container</p>
     <div class="full-bleed hero">Hero melebar penuh</div>
     <p>Kembali ke container width</p>
   </main> */

/* Alternatif: negative margin (simpler) */
.full-bleed-simple {
  margin-inline: calc(-1 * var(--padding));
  padding-inline: var(--padding);
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="holy-grail" onClick={() => setActiveSection("holy-grail")}>
                        <H2>Holy Grail Layout (CSS Grid)<H2.anchor href="#holy-grail">#</H2.anchor></H2>
                        <P>Layout klasik: header, footer, sidebar kiri, konten utama, sidebar kanan. Grid membuat ini sangat mudah.</P>
                        <HolyGrailPreview />
                        <Code file="holy-grail.css">{`
.page {
  display: grid;
  min-height: 100vh;
  grid-template-areas:
    "header  header  header"
    "nav     main    aside"
    "footer  footer  footer";
  grid-template-columns: 220px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  gap: 0;
}

.header { grid-area: header; }
.nav    { grid-area: nav; }
.main   { grid-area: main; }
.aside  { grid-area: aside; }
.footer { grid-area: footer; }

/* Responsive: stack di mobile */
@media (max-width: 768px) {
  .page {
    grid-template-areas:
      "header"
      "nav"
      "main"
      "aside"
      "footer";
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto auto;
  }
}

/* Tanpa sidebar kanan */
@media (min-width: 769px) and (max-width: 1024px) {
  .page {
    grid-template-areas:
      "header header"
      "nav    main"
      "footer footer";
    grid-template-columns: 200px 1fr;
  }
  .aside { display: none; }
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="sidebar" onClick={() => setActiveSection("sidebar")}>
                        <H2>Sidebar Layout Patterns<H2.anchor href="#sidebar">#</H2.anchor></H2>
                        <Code file="sidebar-patterns.css">{`
/* ── 1. Fixed Sidebar ── */
.layout { display: flex; min-height: 100vh; }
.sidebar {
  width: 260px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  flex-shrink: 0;
}
.main { flex: 1; overflow-x: hidden; }

/* ── 2. Overlay Sidebar (mobile) ── */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  transform: translateX(-100%);
  transition: transform 300ms ease;
}
.sidebar-overlay.is-open {
  transform: translateX(0);
}
.sidebar-overlay::after {  /* backdrop */
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: -1;
  opacity: 0;
  transition: opacity 300ms;
}
.sidebar-overlay.is-open::after { opacity: 1; }

/* ── 3. Resizable Sidebar (CSS part) ── */
.sidebar-resizable {
  resize: horizontal;
  overflow: auto;
  min-width: 160px;
  max-width: 480px;
  width: 260px;
  /* JS handles actual resize via ResizeObserver */
}

/* ── 4. Collapsible Sidebar ── */
.sidebar-collapsible {
  width: var(--sidebar-w, 260px);
  transition: width 200ms ease;
  overflow: hidden;
  white-space: nowrap;
}
.sidebar-collapsible.collapsed {
  --sidebar-w: 56px;
}
/* Labels tersembunyi saat collapsed */
.sidebar-collapsible.collapsed .label { opacity: 0; }
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="card-patterns" onClick={() => setActiveSection("card-patterns")}>
                        <H2>Card Patterns<H2.anchor href="#card-patterns">#</H2.anchor></H2>
                        <PatternGrid>
                            <PatternCard>
                                <PatternTitle>Equal Height Cards</PatternTitle>
                                <PatternDesc>Flexbox pada grid item — semua card dalam satu row sama tinggi secara otomatis.</PatternDesc>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {["Short", "Medium content here", "Much longer content that wraps"].map((t, i) => (
                                        <div key={i} className="rounded border p-2 bg-indigo-50 text-[10px] text-indigo-800 flex flex-col">{t}<span className="mt-auto pt-2 text-[9px] opacity-60">footer</span></div>
                                    ))}
                                </div>
                            </PatternCard>
                            <PatternCard>
                                <PatternTitle>Featured Card</PatternTitle>
                                <PatternDesc>Card pertama span 2 kolom menggunakan grid-column: span 2.</PatternDesc>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    <div className="col-span-2 rounded border-2 border-indigo-300 p-2 bg-indigo-50 text-[10px] text-indigo-800">Featured</div>
                                    <div className="rounded border p-2 bg-gray-50 text-[10px] text-gray-600">Normal</div>
                                    <div className="rounded border p-2 bg-gray-50 text-[10px] text-gray-600">Normal</div>
                                    <div className="rounded border p-2 bg-gray-50 text-[10px] text-gray-600">Normal</div>
                                </div>
                            </PatternCard>
                        </PatternGrid>
                        <Code file="card-patterns.css">{`
/* Equal height cards — flex di dalam grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  align-items: stretch;  /* stretch (default) untuk equal height */
}
.card {
  display: flex;
  flex-direction: column;
}
.card__content { flex: 1; }
.card__footer  { margin-top: auto; }  /* dorong footer ke bawah */

/* Featured card — first item span */
.card-grid .card:first-child { grid-column: span 2; }
/* Atau dengan :nth-child */
.card-grid .card:nth-child(4n+1) { grid-column: span 2; }  /* tiap 4 card */

/* Masonry-like (native CSS) */
.masonry {
  columns: 3 280px;  /* 3 kolom, min 280px */
  column-gap: 1.5rem;
}
.masonry .card {
  break-inside: avoid;   /* jangan potong card */
  margin-bottom: 1.5rem;
}

/* CSS Masonry (Firefox + Chrome behind flag) */
.masonry-native {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: masonry;  /* !! */
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="centering" onClick={() => setActiveSection("centering")}>
                        <H2>Center Anything<H2.anchor href="#centering">#</H2.anchor></H2>
                        <CenteringPlayground />
                        <Code file="centering.css">{`
/* Semua cara centering di CSS modern */

/* ── Horizontal + Vertical ── */
/* 1. Flexbox */
.parent { display: flex; align-items: center; justify-content: center; }

/* 2. Grid place-items */
.parent { display: grid; place-items: center; }

/* 3. Absolute + transform */
.child { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }

/* 4. Absolute + margin auto (modern) */
.child { position: absolute; inset: 0; margin: auto; width: fit-content; height: fit-content; }

/* ── Horizontal Only ── */
.block  { margin: 0 auto; width: fit-content; }
.inline { text-align: center; }
.flex   { display: flex; justify-content: center; }

/* ── Vertical Only ── */
.flex   { display: flex; align-items: center; }
.grid   { display: grid; align-content: center; }
.line   { line-height: var(--height); }  /* teks satu baris */

/* ── Text Centering ── */
.text { text-align: center; }
/* Atau untuk blok teks */
.text { margin-inline: auto; max-width: 65ch; }

/* ── Dalam modal/overlay ── */
.overlay {
  display: grid;
  place-items: center;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="intrinsic" onClick={() => setActiveSection("intrinsic")}>
                        <H2>Intrinsic Layout<H2.anchor href="#intrinsic">#</H2.anchor></H2>
                        <P>Intrinsic layout membiarkan konten menentukan ukurannya sendiri menggunakan <IC>min-content</IC>, <IC>max-content</IC>, dan <IC>fit-content</IC>.</P>
                        <Code file="intrinsic.css">{`
/* min-content, max-content, fit-content */
.element {
  width: min-content;    /* sekecil mungkin tanpa overflow */
  width: max-content;    /* selebar konten, tidak wrap */
  width: fit-content;    /* max-content tapi tidak lebih dari available */
  width: fit-content(300px);  /* fit-content dengan max */
}

/* Grid dengan intrinsic sizing */
.grid {
  display: grid;
  /* Kolom mengikuti konten tapi maksimal 1fr */
  grid-template-columns: min-content 1fr min-content;

  /* Auto sizing berdasarkan konten */
  grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr));
}

/* Intrinsic aspect ratio */
.image-container {
  aspect-ratio: 16 / 9;   /* selalu 16:9 */
  width: 100%;
}
.square { aspect-ratio: 1; }
.golden { aspect-ratio: 1.618 / 1; }

/* Prose width — konten teks yang mudah dibaca */
.prose {
  max-width: 65ch;     /* ~65 karakter per baris */
  margin-inline: auto;
}

/* Minimum size dengan content */
.sidebar {
  min-width: min-content;  /* tidak lebih kecil dari konten */
  width: clamp(160px, 20%, 320px);  /* responsif dengan batas */
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="ram" onClick={() => setActiveSection("ram")}>
                        <H2>RAM Pattern — Repeat Auto Minmax<H2.anchor href="#ram">#</H2.anchor></H2>
                        <P>RAM adalah singkatan dari Repeat, Auto-fill/fit, Minmax — pattern grid paling powerful untuk layout responsif tanpa media query.</P>
                        <Code file="ram.css">{`
/* RAM Pattern */
.grid-ram {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 1.5rem;
}
/* auto-fill: isi sebanyak mungkin kolom (bahkan kosong) */
/* auto-fit:  kolom kosong collapse, item stretch */
/* minmax(280px, 1fr): min 280px, tumbuh sampai 1fr */
/* min(280px, 100%): tidak overflow pada container sempit */

/* Perbedaan auto-fill vs auto-fit */
.auto-fill { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
/* → 3 item, container lebar → 3 kolom berisi + kolom kosong di kanan */

.auto-fit  { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
/* → 3 item, container lebar → 3 kolom, masing-masing tumbuh */

/* RAM dengan named template */
:root { --min-card: 250px; }
.card-grid {
  grid-template-columns: repeat(auto-fill, minmax(var(--min-card), 1fr));
}

/* RAM dengan max item per row */
.two-max {
  /* Maksimum 2 kolom */
  grid-template-columns: repeat(auto-fill, minmax(max(300px, 45%), 1fr));
}

/* Panel/tile layout */
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  grid-auto-rows: 80px;
  gap: 0.5rem;
}
            `}</Code>
                        <LayoutPreview>
                            <LayoutPreview.label>RAM Pattern — resize browser untuk melihat responsif</LayoutPreview.label>
                            <LayoutPreview.demo>
                                <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(80px, 100%), 1fr))" }}>
                                    {Array.from({ length: 7 }).map((_, i) => (
                                        <Box key={i} color={["indigo", "violet", "blue", "emerald", "amber", "rose", "gray"][i] as "indigo"} className="h-10 text-[9px]">
                                            {i + 1}
                                        </Box>
                                    ))}
                                </div>
                            </LayoutPreview.demo>
                        </LayoutPreview>
                    </Section>
                    <Divider />

                    <Section id="spacing-system" onClick={() => setActiveSection("spacing-system")}>
                        <H2>Spacing System<H2.anchor href="#spacing-system">#</H2.anchor></H2>
                        <Code file="spacing-system.css">{`
/* Design system spacing tokens */
:root {
  --space-1:  0.25rem;   /*  4px */
  --space-2:  0.5rem;    /*  8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
}

/* fluid spacing — responsive tanpa breakpoints */
:root {
  --space-fluid-sm:  clamp(0.5rem, 2vw, 1rem);
  --space-fluid-md:  clamp(1rem,   4vw, 2rem);
  --space-fluid-lg:  clamp(2rem,   6vw, 4rem);
  --space-fluid-xl:  clamp(3rem,   8vw, 6rem);
}

/* Gunakan gap everywhere — lebih predictable dari margin */
.grid   { display: grid;  gap: var(--space-4); }
.flex   { display: flex;  gap: var(--space-4); }

/* Logical properties — RTL ready */
.element {
  padding-inline:  var(--space-4);   /* left + right */
  padding-block:   var(--space-3);   /* top + bottom */
  margin-block-start: var(--space-6);
}

/* Consistent spacing rule: */
/* - Komponen ke komponen: gap atau margin-block */
/* - Konten internal: padding */
/* - Jangan mix margin + padding untuk spacing antar komponen */
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="stack-primitive" onClick={() => setActiveSection("stack-primitive")}>
                        <H2>Stack Layout Primitive<H2.anchor href="#stack-primitive">#</H2.anchor></H2>
                        <P>Layout primitives adalah komponen generic yang menangani satu tugas layout — bisa dikombinasikan untuk membangun layout apapun.</P>
                        <Code file="stack-primitives.css">{`
/* ── Stack (VStack) — children vertikal dengan gap ── */
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--space, var(--space-4));
}
/* <div class="stack" style="--space: 2rem"> ... </div> */

/* ── Cluster — children horizontal, wrap ── */
.cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space, var(--space-4));
  align-items: var(--align, center);
  justify-content: var(--justify, flex-start);
}

/* ── Sidebar — main + fixed-width sidebar ── */
.with-sidebar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space, var(--space-4));
}
.with-sidebar > :first-child {
  flex-basis: var(--sidebar-w, 250px);
  flex-grow: 1;
}
.with-sidebar > :last-child {
  flex-basis: 0;
  flex-grow: 999;         /* grow lebih agresif */
  min-width: 50%;         /* wrap jika kurang dari 50% */
}

/* ── Cover — vertikal center content ── */
.cover {
  display: flex;
  flex-direction: column;
  min-height: var(--min-h, 100vh);
  padding: var(--space, var(--space-6));
}
.cover > * { margin-block: auto; }   /* center semua children */
.cover > :first-child:not(.centered) { margin-block-start: 0; }
.cover > :last-child:not(.centered)  { margin-block-end: 0; }

/* ── Spacer — flexible space ── */
.spacer { flex: 1; }

/* ── Reel (horizontal scroll) ── */
.reel {
  display: flex;
  gap: var(--space, var(--space-4));
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  /* snap */
  scroll-snap-type: x mandatory;
}
.reel > * {
  flex-shrink: 0;
  scroll-snap-align: start;
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
                        <H2>Layout Patterns di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
                        <Code file="layout-tw.tsx">{`
import { tw } from "tailwind-styled-v4"

// ✅ Stack primitive
const Stack = tw.div({
  base: "flex flex-col",
  variants: {
    gap: {
      sm: "gap-2", md: "gap-4", lg: "gap-6", xl: "gap-8",
    },
  },
  defaultVariants: { gap: "md" },
})

// ✅ Cluster
const Cluster = tw.div({
  base: "flex flex-wrap items-center",
  variants: { gap: { sm: "gap-2", md: "gap-4", lg: "gap-6" } },
  defaultVariants: { gap: "md" },
})

// ✅ RAM grid
const AutoGrid = tw.div({
  base: "grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr))]",
})

// ✅ Sticky footer
const AppLayout = tw.div({ base: "flex flex-col min-h-screen" })
const MainContent = tw.main({ base: "flex-1" })

// ✅ Full-bleed section
const FullBleed = tw.div({
  base: "w-screen -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8",
})

// ✅ Holy Grail
const HolyGrailLayout = tw.div({
  base: [
    "grid min-h-screen",
    "[grid-template-areas:'header_header_header'_'nav_main_aside'_'footer_footer_footer']",
    "[grid-template-columns:220px_1fr_200px]",
    "[grid-template-rows:auto_1fr_auto]",
  ].join(" "),
})

// ✅ Centering
const Centered = tw.div({ base: "grid place-items-center" })
const HCentered = tw.div({ base: "flex justify-center" })
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="exercise" onClick={() => setActiveSection("exercise")}>
                        <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Full-bleed content grid</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat artikel layout dengan <IC>grid-template-columns</IC> yang memiliki zone: <IC>full-start</IC>, <IC>feature-start</IC>, <IC>content-start</IC>, dan pasangannya. Semua konten default ke <IC>content</IC> column, gambar bisa <IC>feature</IC>, dan hero bisa <IC>full</IC>.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Layout primitives library</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat library 5 layout primitives: <IC>Stack</IC>, <IC>Cluster</IC>, <IC>Sidebar</IC>, <IC>Cover</IC>, dan <IC>Reel</IC>. Semuanya menerima spacing via CSS custom property. Compose keduanya untuk membuat dashboard layout tanpa menulis CSS baru.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — RAM card grid dengan featured</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat news grid menggunakan RAM pattern. Artikel pertama <IC>grid-column: span 2</IC> sebagai featured. Pastikan grid tetap bekerja di semua ukuran layar tanpa media query menggunakan <IC>min(280px, 100%)</IC> di minmax.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/high/css-javascript" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>CSS & JavaScript</NavBtn.label></NavBtn>
                        <div />
                    </PageNav>
                </Content>
                <Toc>
                    <TocLabel>On this page</TocLabel>
                    {TOC.map(item => <TocItem key={item.id} href={`#${item.id}`} active={activeSection === item.id} onClick={() => setActiveSection(item.id)}>{item.label}</TocItem>)}
                </Toc>
            </Body>
        </Page>
    )
}
