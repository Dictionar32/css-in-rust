/**
 * CSS Medium — CSS Architecture
 */
"use client"
import { useState } from "react"
import {
  Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
  PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
  CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
  PlaygroundWrap, Chip, ChipRow, LayerBadge, ColDemo, IntrinsicBox,
} from "./styles"

const TOC = [
  { id: "layers", label: "@layer cascade layers" },
  { id: "scope", label: "@scope" },
  { id: "nesting", label: "CSS Nesting native" },
  { id: "supports", label: "@supports feature queries" },
  { id: "print", label: "Print Styles" },
  { id: "multi-column", label: "Multi-column layout" },
  { id: "scroll-snap", label: "Scroll snap lanjutan" },
  { id: "intrinsic", label: "Intrinsic sizing" },
  { id: "logical", label: "CSS Logical Properties" },
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

type ColCount = "2" | "3" | "4"

function MultiColPlayground() {
  const [cols, setCols] = useState<ColCount>("3")
  const text = "CSS multi-column layout membagi konten menjadi beberapa kolom secara otomatis — seperti surat kabar atau majalah. Browser menghitung pembagian baris secara otomatis tanpa JavaScript. Ini berguna untuk long-form content, daftar item, dan navigation menu. Anda bisa kontrol jumlah kolom, lebar minimum, gap, garis pemisah, dan elemen yang boleh span ke semua kolom."

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>📰 Multi-column Playground</PlaygroundWrap.label>
        <ChipRow>
          {(["2", "3", "4"] as ColCount[]).map(c => (
            <Chip key={c} active={cols === c} onClick={() => setCols(c)}>{c} kolom</Chip>
          ))}
        </ChipRow>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas>
        <ColDemo cols={cols}>
          <p className="text-sm leading-7 text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]">{text}</p>
        </ColDemo>
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>
        {`column-count: ${cols}; column-gap: 1.5rem; column-rule: 1px solid currentColor;`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

export default function CssArchitecturePage() {
  const [activeSection, setActiveSection] = useState("layers")
  return (
    <Page>
      <TopBar><TopBarInner>
        <Breadcrumb>
          <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.link href="/learn/medium">Medium</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.curr>CSS Architecture</Breadcrumb.curr>
        </Breadcrumb>
      </TopBarInner></TopBar>
      <Body>
        <Content>
          <PageTitle>CSS Architecture</PageTitle>
          <PageDesc>@layer, @scope, CSS nesting native, multi-column, scroll snap lanjutan, intrinsic sizing, dan logical properties — fondasi arsitektur CSS modern.</PageDesc>

          <Section id="layers" onClick={() => setActiveSection("layers")}>
            <H2>@layer — Cascade Layers<H2.anchor href="#layers">#</H2.anchor></H2>
            <P><IC>@layer</IC> memungkinkan grouping style ke dalam lapisan dengan prioritas eksplisit — menggantikan specificity hacks dan <IC>!important</IC> untuk mengatur urutan cascade.</P>
            <div className="flex gap-2 my-4 flex-wrap">
              {(["base", "components", "utilities", "theme"] as const).map(l => (
                <LayerBadge key={l} layer={l}>{l}</LayerBadge>
              ))}
              <span className="text-xs text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] self-center">← prioritas rendah ke tinggi →</span>
            </div>
            <Code file="layers.css">{`
/* Deklarasikan urutan layer — order menentukan prioritas */
/* Layer yang disebutkan lebih akhir = prioritas lebih tinggi */
@layer base, components, utilities;

@layer base {
  /* Reset, normalize, default element styles */
  *, *::before, *::after { box-sizing: border-box; }
  h1, h2, h3 { margin: 0; }
  a { color: inherit; }
}

@layer components {
  /* Component-level styles */
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    background: #6366f1;
    color: white;
  }
}

@layer utilities {
  /* Utility overrides — pasti menang atas components */
  .text-center { text-align: center; }
  .mt-4 { margin-top: 1rem; }
}

/* Style di luar layer — selalu menang atas semua layer */
.override { color: red !important; }  /* bahkan lebih tinggi dari unlayered */

/* revert-layer — kembali ke layer di bawahnya */
@layer components {
  .special { color: revert-layer; }  /* pakai warna dari @layer base */
}

/* Anonymous layer — tidak bisa direferens, tidak bisa diisi lagi */
@layer { .anon { color: blue; } }

/* Import dengan layer */
@import url("reset.css") layer(base);
        `}</Code>
            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                <Callout.title>Tailwind v4 menggunakan @layer</Callout.title>
                Tailwind CSS v4 menggunakan <IC>@layer base</IC>, <IC>@layer components</IC>, dan <IC>@layer utilities</IC> secara internal. Kamu bisa extend layer ini langsung dengan <IC>@layer components {'{ .btn { } }'}</IC>.
              </Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="scope" onClick={() => setActiveSection("scope")}>
            <H2>@scope — Scoped Styles<H2.anchor href="#scope">#</H2.anchor></H2>
            <P><IC>@scope</IC> membatasi gaya hanya berlaku untuk subtree DOM tertentu — alternatif yang lebih powerful dari naming conventions (BEM, dsb).</P>
            <Code file="scope.css">{`
/* @scope (root) { — scoped ke dalam root selector */
@scope (.card) {
  /* Gaya ini hanya berlaku di dalam .card */
  h2 { font-size: 1.25rem; }       /* h2 di dalam .card saja */
  p  { color: var(--text-muted); } /* tidak affect p di luar .card */
  .title { font-weight: bold; }
}

/* @scope (.root) to (.boundary) — donut scope */
/* Gaya berlaku dari .card tapi BERHENTI di .card-body */
@scope (.card) to (.card-body) {
  p { font-style: italic; }
  /* p di dalam .card-body TIDAK terpengaruh */
}

/* :scope — mengacu ke root selector scope saat ini */
@scope (.card) {
  :scope { border: 1px solid #e5e7eb; }  /* .card itu sendiri */
  :scope > h2 { margin-top: 0; }          /* h2 langsung child */
}

/* Cascade di @scope */
/* @scope lebih presisi dari simple selector */
/* :scope h2 dalam @scope(.card) > .card h2 global */

/* Contoh nyata — component isolation */
@scope (.dark-mode-card) {
  :scope { background: #1a1a2e; color: #e0e0ff; }
  a { color: #818cf8; }
  p { opacity: 0.85; }
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="nesting" onClick={() => setActiveSection("nesting")}>
            <H2>CSS Nesting Native<H2.anchor href="#nesting">#</H2.anchor></H2>
            <P>CSS kini mendukung nesting secara native — tidak perlu Sass lagi untuk menulis style bersarang.</P>
            <Code file="nesting.css">{`
/* CSS Nesting native — tidak perlu preprocessor */
.card {
  padding: 1rem;
  border-radius: 0.75rem;

  /* Nested selector */
  h2 {
    font-size: 1.25rem;
    font-weight: bold;
  }

  p { color: oklch(50% 0 0); }

  /* & — explicit parent reference */
  &:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }

  &.featured {
    border: 2px solid #6366f1;
  }

  /* Deeply nested */
  .card-body {
    padding: 0.5rem;

    p { line-height: 1.7; }
  }
}

/* Media queries nested */
.hero {
  font-size: 2rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }

  @media (prefers-color-scheme: dark) {
    color: white;
  }
}

/* @layer nested */
@layer components {
  .button {
    padding: 0.5rem 1rem;

    &:hover { background: oklch(from currentColor l c h / 0.9); }
    &:focus-visible { outline: 2px solid currentColor; }

    &.primary { background: #6366f1; color: white; }
    &.secondary { background: transparent; border: 1px solid #6366f1; }
  }
}

/* ✅ Didukung Chrome 112+, Firefox 117+, Safari 17.2+ */
/* ⚠️ Untuk browser lama masih perlu preprocessor atau @supports */
        `}</Code>
          </Section>
          <Divider />

          {/* ── @supports ─────────────────────────────────────────── */}
          <Section id="supports" onClick={() => setActiveSection("supports")}>
            <H2>@supports — Feature Queries<H2.anchor href="#supports">#</H2.anchor></H2>
            <P>
              <IC>@supports</IC> memungkinkan penerapan CSS secara kondisional berdasarkan
              apakah browser mendukung property/value tertentu. Fondasi progressive enhancement
              yang proper — tanpa feature detection JavaScript.
            </P>
            <Code file="supports.css">{`
/* Sintaks dasar */
@supports (display: grid) {
  .layout { display: grid; }
}

/* Negasi — kalau TIDAK support */
@supports not (display: grid) {
  .layout { display: flex; }   /* fallback untuk browser lama */
}

/* OR — salah satu cukup */
@supports (display: flex) or (display: -webkit-flex) {
  .flex-container { display: flex; }
}

/* AND — semua harus supported */
@supports (container-type: inline-size) and (selector(:has(img))) {
  /* keduanya harus ada */
}

/* selector() — cek dukungan selector tertentu */
@supports selector(:has(img)) {
  .card:has(img) { padding-top: 0; }
}

/* Contoh real: CSS Anchor Positioning */
@supports (anchor-name: --a) {
  .tooltip {
    position: absolute;
    position-anchor: --my-anchor;
  }
}

/* Contoh: backdrop-filter dengan fallback */
.glass {
  background: rgba(255,255,255,0.9);  /* fallback */
}
@supports (backdrop-filter: blur(1px)) {
  .glass {
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(16px);
  }
}

/* @supports dalam JavaScript */
/* CSS.supports('display', 'grid') → true/false */
/* CSS.supports('(display: grid)') → true/false */
            `}</Code>
            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                Pola yang dianjurkan MDN: tulis CSS dasar yang bekerja di semua browser dulu,
                lalu gunakan <IC>@supports</IC> untuk enhance dengan fitur modern.
                Hindari pola <IC>@supports not</IC> untuk feature detection kritis — lebih
                mudah paham jika CSS dasar selalu ada tanpa kondisi negatif.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          {/* ── Print Styles ───────────────────────────────────────── */}
          <Section id="print" onClick={() => setActiveSection("print")}>
            <H2>Print Styles<H2.anchor href="#print">#</H2.anchor></H2>
            <P>
              <IC>@media print</IC> memungkinkan styling khusus untuk hasil cetak —
              sembunyikan navigasi, optimasi font, kontrol page break, dan banyak lagi.
            </P>
            <Code file="print.css">{`
/* Cara 1: @media print di CSS */
@media print {
  /* Sembunyikan elemen yang tidak perlu dicetak */
  nav, .sidebar, .btn, .cookie-banner, footer { display: none; }

  /* Reset warna untuk cetak hitam-putih */
  body { color: black; background: white; }
  a    { color: black; text-decoration: underline; }

  /* Tampilkan URL setelah link */
  a[href]::after { content: " (" attr(href) ")"; font-size: 0.75em; }

  /* Hindari page break di tengah elemen penting */
  h2, h3, h4  { break-after: avoid; }
  p           { orphans: 3; widows: 3; }  /* min 3 baris sebelum/sesudah break */
  figure, img { break-inside: avoid; }

  /* Paksa page break */
  .page-break-before { break-before: page; }
  .page-break-after  { break-after: page; }

  /* Font cetak lebih kecil */
  body { font-size: 10pt; line-height: 1.4; }
  h1   { font-size: 18pt; }
  h2   { font-size: 14pt; }

  /* Margin halaman */
  @page {
    margin: 2cm;
    size: A4;
  }

  /* Halaman pertama berbeda */
  @page :first { margin-top: 3cm; }
  @page :left  { margin-left: 3cm; margin-right: 2cm; }
  @page :right { margin-left: 2cm; margin-right: 3cm; }
}

/* Cara 2: file terpisah via link */
/* <link rel="stylesheet" media="print" href="print.css"> */

/* Cara 3: @import kondisional */
/* @import url("print.css") print; */
            `}</Code>
          </Section>

          <Divider />

          <Section id="multi-column" onClick={() => setActiveSection("multi-column")}>
            <H2>Multi-column Layout<H2.anchor href="#multi-column">#</H2.anchor></H2>
            <MultiColPlayground />
            <Code file="multi-column.css">{`
/* column-count — jumlah kolom tetap */
.news { column-count: 3; }

/* column-width — lebar minimum per kolom, count auto */
.auto-cols { column-width: 200px; }
/* Browser akan buat sebanyak mungkin kolom dengan lebar min 200px */

/* columns shorthand: count / width */
.cols { columns: 3 200px; }  /* max 3 kolom, min 200px per kolom */

/* column-gap — jarak antar kolom */
.with-gap { column-gap: 2rem; }

/* column-rule — garis pemisah (seperti border) */
.with-rule { column-rule: 1px solid oklch(80% 0 0); }
/* Longhand: column-rule-width, column-rule-style, column-rule-color */

/* column-span — elemen yang span semua kolom */
.heading { column-span: all; }   /* h2 span ke semua kolom */
/* Hanya none dan all yang valid */

/* column-fill — bagaimana konten dibagi */
.balanced  { column-fill: balance; }   /* default — tinggi sama */
.auto-fill { column-fill: auto; }      /* isi kolom pertama dulu */

/* break-inside — prevent break di tengah elemen */
.no-break {
  break-inside: avoid;     /* jangan potong elemen ini di tengah kolom */
}

/* Contoh card grid dengan multi-column */
.card-masonry {
  column-count: 3;
  column-gap: 1rem;
}
.card-masonry .card {
  break-inside: avoid;   /* kartu tidak terpotong */
  margin-bottom: 1rem;
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="scroll-snap" onClick={() => setActiveSection("scroll-snap")}>
            <H2>Scroll Snap Lanjutan<H2.anchor href="#scroll-snap">#</H2.anchor></H2>
            <Code file="scroll-snap.css">{`
/* scroll-snap-type di container */
.slider {
  overflow-x: auto;
  scroll-snap-type: x mandatory;   /* mandatory: pasti snap */
  /* scroll-snap-type: y proximity; — proximity: snap jika dekat */
}

/* scroll-snap-align di children */
.slide {
  scroll-snap-align: start;    /* start, center, end */
  flex-shrink: 0;
  width: 100%;
}

/* scroll-snap-stop — stop di setiap item (prevent skip) */
.no-skip {
  scroll-snap-stop: always;    /* normal (default) atau always */
}

/* scroll-margin — offset snap dari edge */
.with-header {
  scroll-margin-top: 80px;    /* snap 80px dari top (buat header fixed) */
}
/* Atau: scroll-margin: top right bottom left */
/* Mirip margin tapi hanya untuk snap calculation */

/* scroll-padding — offset dari container edge */
.container {
  scroll-padding: 1rem;         /* uniform */
  scroll-padding-top: 80px;    /* khusus atas */
}

/* overscroll-behavior — kontrol bounce/chain scroll */
.modal {
  overflow-y: auto;
  overscroll-behavior-y: contain;  /* prevent page dari ikut scroll */
}

/* overscroll-behavior-x: none — disable horizontal overscroll */
html { overscroll-behavior-x: none; }  /* disable pull-to-refresh horizontal */

/* scroll-behavior — smooth scroll */
html { scroll-behavior: smooth; }
/* Atau via JS: element.scrollIntoView({ behavior: 'smooth' }) */
        `}</Code>
          </Section>
          <Divider />

          <Section id="intrinsic" onClick={() => setActiveSection("intrinsic")}>
            <H2>Intrinsic Sizing<H2.anchor href="#intrinsic">#</H2.anchor></H2>
            <P>Ukuran intrinsik membuat elemen merespons kontennya — bukan container — untuk flexible layouts tanpa magic numbers.</P>
            <div className="flex flex-wrap gap-3 my-4">
              {(["min-content", "max-content", "fit-content"] as const).map(s => (
                <div key={s} className="flex flex-col gap-1">
                  <IntrinsicBox sizing={s}>Konten di sini bisa cukup panjang</IntrinsicBox>
                  <span className="text-[10px] font-mono text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">{s}</span>
                </div>
              ))}
            </div>
            <Code file="intrinsic.css">{`
/* min-content — sesempit mungkin tanpa word break */
.min { width: min-content; }
/* "The quick brown fox" → lebar kata terpanjang ("quick") */

/* max-content — selebar konten tanpa wrap */
.max { width: max-content; }
/* "The quick brown fox" → satu baris penuh */

/* fit-content — seperti max-content tapi dibatasi container */
.fit { width: fit-content; }
/* Mirip shrink-wrap, tidak melebihi container */

/* fit-content(value) — batas custom */
.fit-custom { width: fit-content(300px); }

/* Di flexbox & grid */
.flex-container {
  display: flex;
}
.flex-item {
  flex-basis: max-content;  /* natural width */
  flex-grow: 0;             /* tidak mengembang */
}

/* Column sizing di grid */
.grid {
  grid-template-columns:
    max-content    /* sidebar — ukuran konten */
    1fr;           /* main — sisa ruang */
}

/* intrinsic size functions di min/max/clamp */
.dynamic {
  width: clamp(min-content, 50%, max-content);
}

/* contain-intrinsic-size — hint untuk hidden/lazy content */
.lazy-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 300px;  /* estimasi tinggi sebelum render */
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="logical" onClick={() => setActiveSection("logical")}>
            <H2>CSS Logical Properties<H2.anchor href="#logical">#</H2.anchor></H2>
            <P>Logical properties menggantikan direction-specific properties (top, left, right, bottom) dengan abstraksi yang sadar writing mode dan directionality — penting untuk internasionalisasi.</P>
            <Code file="logical-props.css">{`
/* Pemetaan: physical → logical */
/* margin-top    → margin-block-start */
/* margin-bottom → margin-block-end */
/* margin-left   → margin-inline-start */
/* margin-right  → margin-inline-end */
/* padding-top   → padding-block-start */
/* width         → inline-size */
/* height        → block-size */
/* top           → inset-block-start */
/* left          → inset-inline-start */

/* Contoh: card yang bekerja di LTR dan RTL */
.card {
  margin-block: 1rem;           /* atas + bawah */
  padding-inline: 1.5rem;       /* kiri + kanan (swap di RTL) */
  border-inline-start: 4px solid #6366f1;  /* kiri di LTR, kanan di RTL */
}

/* Shorthand */
.box {
  margin-block: 1rem 2rem;      /* start end */
  margin-inline: auto;          /* center horizontal */
  padding-block: 0.5rem;        /* sama untuk start dan end */
  inset-block: 0;               /* top: 0, bottom: 0 */
  inset-inline: 0;              /* left: 0, right: 0 */
  inset: 0;                     /* semua sisi */
}

/* Sizing */
.container {
  inline-size: 100%;           /* width (di horizontal writing mode) */
  block-size: auto;            /* height */
  max-inline-size: 60ch;       /* max-width */
  min-block-size: 100dvh;      /* min-height */
}

/* Text alignment */
.text {
  text-align: start;    /* left di LTR, right di RTL */
  text-align: end;      /* right di LTR, left di RTL */
}

/* border-radius logical */
.card {
  border-start-start-radius: 1rem;   /* top-left di LTR */
  border-start-end-radius: 1rem;     /* top-right di LTR */
}

/* Float logical */
.float { float: inline-start; }    /* left di LTR */

/* Resize logical */
.textarea { resize: block; }        /* vertical di horizontal writing mode */
        `}</Code>
            <Callout type="note">
              <Callout.icon>ℹ️</Callout.icon>
              <Callout.content>
                <Callout.title>Kapan pakai logical properties?</Callout.title>
                Jika app tidak pernah RTL, physical properties masih valid. Untuk internasionalisasi (Arab, Ibrani, dsb) atau vertical writing mode (Jepang, Cina), logical properties adalah satu-satunya cara yang benar.
              </Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>CSS Architecture di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
            <Code file="architecture-tw.tsx">{`
import { tw } from "tailwind-styled-v4"
// Tailwind v4 CSS (globals.css)

/* @layer — extend Tailwind layers */
/* @layer base {
  h1, h2, h3 { text-wrap: balance; }
  p { text-wrap: pretty; }
}

@layer components {
  .card { @apply rounded-xl border p-4 bg-[var(--surface)]; }
}

@layer utilities {
  .scrollbar-hide { scrollbar-width: none; }
} */

/* tw components menggunakan Tailwind utilities yang ada di layer */
const Card = tw.div({
  base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] p-4 bg-[var(--surface)]",
})

/* Multi-column via arbitrary values */
const NewsGrid = tw.div({
  base: "[column-count:3] [column-gap:1.5rem] [column-rule:1px_solid_currentColor]",
})

/* Scroll snap container */
const Carousel = tw.div({
  base: "flex overflow-x-auto [scroll-snap-type:x_mandatory] gap-4 pb-2",
})

const Slide = tw.div({
  base: "shrink-0 w-80 [scroll-snap-align:start] rounded-xl overflow-hidden",
})

/* Logical properties via Tailwind (built-in) */
const Article = tw.article({
  base: "mx-auto max-w-prose px-4 ps-8 border-s-4 border-indigo-500",
  /* ps = padding-inline-start, ms = margin-inline-start */
  /* border-s = border-inline-start */
})

/* Intrinsic sizing */
const InlineTag = tw.span({
  base: "w-fit px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium",
})
        `}</Code>
          </Section>
          <Divider />

          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — @layer design system</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat stylesheet dengan 4 layers: <IC>reset</IC>, <IC>tokens</IC>, <IC>components</IC>, <IC>utilities</IC>. Isi reset dengan normalize dasar, tokens dengan CSS custom properties, components dengan style komponen, dan utilities dengan override helpers.</p>
                <p>Verifikasi bahwa utility class bisa override component style tanpa <IC>!important</IC>.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Masonry layout dengan multi-column</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat masonry card layout menggunakan <IC>column-count</IC> dan <IC>break-inside: avoid</IC>. Tambahkan <IC>@media</IC> breakpoints: 1 kolom mobile, 2 kolom tablet, 3 kolom desktop.</p>
                <p>Pastikan <IC>column-rule</IC> terlihat dan <IC>column-gap</IC> konsisten.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Scroll snap carousel</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat image carousel dengan <IC>scroll-snap-type: x mandatory</IC>, <IC>scroll-snap-align: center</IC>, dan <IC>scroll-snap-stop: always</IC>. Tambahkan <IC>scroll-padding-inline</IC> untuk visible peek ke slide berikutnya.</p>
                <p>Tambahkan <IC>overscroll-behavior-x: contain</IC> agar horizontal scroll tidak "bocor" ke halaman.</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          <PageNav>
            <NavBtn href="/learn/medium/visual-effects" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>Visual Effects</NavBtn.label></NavBtn>
            <NavBtn href="/learn" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>Back to Learn</NavBtn.label></NavBtn>
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
