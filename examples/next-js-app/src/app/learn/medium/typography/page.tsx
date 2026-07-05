/**
 * CSS Medium — Typography
 */
"use client"
import { useState } from "react"
import {
    Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
    PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
    CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
    PlaygroundWrap, Chip, ChipRow, TypoDemo, TypoSample, FluidHeading,
} from "./styles"

const TOC = [
    { id: "font-family", label: "font-family & Font Stacks" },
    { id: "font-face", label: "@font-face & Web Fonts" },
    { id: "variable-fonts", label: "Variable Fonts" },
    { id: "font-props", label: "weight, style, size" },
    { id: "line-height", label: "line-height" },
    { id: "spacing", label: "letter-spacing & word-spacing" },
    { id: "text-align", label: "text-align, indent, transform" },
    { id: "text-decoration", label: "text-decoration" },
    { id: "text-overflow", label: "text-overflow & white-space" },
    { id: "text-wrap", label: "text-wrap, hyphens & word-break" },
    { id: "font-shorthand", label: "font shorthand & font-size-adjust" },
    { id: "opentype", label: "OpenType Features" },
    { id: "fluid-typo", label: "Fluid Typography & clamp()" },
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

type FontWeight = "thin" | "light" | "normal" | "medium" | "semibold" | "bold" | "extrabold" | "black"
type TextAlign = "left" | "center" | "right" | "justify"

function TypoPlayground() {
    const [weight, setWeight] = useState<FontWeight>("normal")
    const [align, setAlign] = useState<TextAlign>("left")
    const weights: FontWeight[] = ["thin", "light", "normal", "medium", "semibold", "bold", "extrabold", "black"]
    const aligns: TextAlign[] = ["left", "center", "right", "justify"]
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🔤 Typography Playground</PlaygroundWrap.label>
                <div className="space-y-2">
                    <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">font-weight</p>
                    <ChipRow>
                        {weights.map(w => <Chip key={w} active={weight === w} onClick={() => setWeight(w)}>{w}</Chip>)}
                    </ChipRow>
                </div>
                <div className="space-y-2">
                    <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">text-align</p>
                    <ChipRow>
                        {aligns.map(a => <Chip key={a} active={align === a} onClick={() => setAlign(a)}>{a}</Chip>)}
                    </ChipRow>
                </div>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <TypoSample weight={weight} align={align} size="xl">
                    The quick brown fox jumps over the lazy dog.
                </TypoSample>
                <TypoSample weight={weight} align={align} size="sm" className="mt-3 text-[color-mix(in_srgb,var(--foreground)_60%,transparent)]">
                    Paragraf ini menunjukkan bagaimana font-weight dan text-align bekerja pada teks biasa. Typography yang baik meningkatkan readability dan user experience secara signifikan.
                </TypoSample>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {`font-weight: ${weight}; text-align: ${align};`}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

export default function TypographyPage() {
    const [activeSection, setActiveSection] = useState("font-family")
    return (
        <Page>
            <TopBar><TopBarInner>
                <Breadcrumb>
                    <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.link href="/learn/medium">Medium</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.curr>Typography</Breadcrumb.curr>
                </Breadcrumb>
            </TopBarInner></TopBar>
            <Body>
                <Content>
                    <PageTitle>CSS Typography</PageTitle>
                    <PageDesc>Dari font stacks sampai variable fonts, fluid typography dengan clamp(), dan OpenType features — panduan lengkap menguasai tipografi di CSS.</PageDesc>

                    <Section id="font-family" onClick={() => setActiveSection("font-family")}>
                        <H2>font-family & Font Stacks<H2.anchor href="#font-family">#</H2.anchor></H2>
                        <P>Font stack adalah daftar fallback font yang dipisahkan koma. Browser memakai font pertama yang tersedia — jika tidak ada, lanjut ke berikutnya, sampai generic family di akhir.</P>
                        <Code file="font-stacks.css">{`
/* Font stack klasik */
body {
  font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
}

/* System font stack — pakai font OS, zero network request */
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell,
    "Open Sans", "Helvetica Neue", sans-serif;
}

/* Monospace stack */
code {
  font-family: "Fira Code", "Cascadia Code", "JetBrains Mono",
    ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}

/* Serif stack */
article {
  font-family: "Georgia", "Times New Roman", Times, serif;
}

/* CSS font-family keywords */
.ui-font   { font-family: system-ui; }      /* OS default UI font */
.mono-font { font-family: ui-monospace; }    /* OS default monospace */
.serif-font{ font-family: ui-serif; }        /* OS default serif */
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="font-face" onClick={() => setActiveSection("font-face")}>
                        <H2>@font-face & Web Fonts<H2.anchor href="#font-face">#</H2.anchor></H2>
                        <P><IC>@font-face</IC> mendaftarkan font custom — dari file lokal, CDN, atau Google Fonts. Format modern: <IC>woff2</IC> untuk semua browser modern, <IC>woff</IC> sebagai fallback.</P>
                        <Code file="font-face.css">{`
/* Self-hosted font */
@font-face {
  font-family: "MyFont";
  src: url("/fonts/myfont.woff2") format("woff2"),
       url("/fonts/myfont.woff")  format("woff");
  font-weight: 400;
  font-style: normal;
  font-display: swap;   /* fallback font tampil dulu, swap saat loaded */
}

/* font-display values */
/* auto    — browser default */
/* block   — invisible text sampai font loaded (max ~3s) */
/* swap    — fallback dulu, swap ke custom font */
/* fallback— block singkat (~100ms), lalu fallback, tidak swap setelah 3s */
/* optional— block singkat, pakai jika cached, skip jika lambat */

/* Multiple weights dari satu @font-face */
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter-Regular.woff2") format("woff2");
  font-weight: 400;
}
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter-Bold.woff2") format("woff2");
  font-weight: 700;
}

/* Google Fonts di Next.js (next/font) */
/* import { Inter } from "next/font/google" */
/* const inter = Inter({ subsets: ["latin"], display: "swap" }) */
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="variable-fonts" onClick={() => setActiveSection("variable-fonts")}>
                        <H2>Variable Fonts & font-variation-settings<H2.anchor href="#variable-fonts">#</H2.anchor></H2>
                        <P>Variable font adalah satu file font yang mengandung seluruh range weight, width, slant dalam satu file — mengurangi HTTP requests dan memungkinkan nilai interpolasi yang tidak terbatas.</P>
                        <Code file="variable-fonts.css">{`
/* Variable font — satu file, infinite weights */
@font-face {
  font-family: "InterVariable";
  src: url("/fonts/InterVariable.woff2") format("woff2-variations");
  font-weight: 100 900;   /* range yang didukung */
  font-style: oblique 0deg 10deg;
}

/* Pakai nilai apapun dalam range */
.heading { font-weight: 730; }   /* nilai non-standar! */
.caption  { font-weight: 350; }

/* font-variation-settings — kontrol axes langsung */
/* wght = weight, wdth = width, ital = italic, slnt = slant */
.custom {
  font-variation-settings: "wght" 550, "wdth" 75;
}

/* Animasi variable font */
@keyframes weight-pulse {
  from { font-variation-settings: "wght" 100; }
  to   { font-variation-settings: "wght" 900; }
}

.animated-text {
  animation: weight-pulse 2s ease-in-out infinite alternate;
}

/* Axes umum */
/* wght — font-weight: 100–900 */
/* wdth — font-width: 50–200 (%) */
/* ital — italic: 0 atau 1 */
/* slnt — slant: -90deg–90deg */
/* opsz — optical size: mengatur detail pada ukuran berbeda */
        `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                <Callout.title>Variable Font vs Multiple Files</Callout.title>
                                Font Inter Variable (~300KB) lebih kecil dari mengunduh Regular + Medium + Bold + SemiBold terpisah (~400KB total). Gunakan <IC>font-display: optional</IC> untuk performa terbaik.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="font-props" onClick={() => setActiveSection("font-props")}>
                        <H2>font-weight, font-style, font-size<H2.anchor href="#font-props">#</H2.anchor></H2>
                        <Code file="font-props.css">{`
/* font-weight: keyword atau angka 100–900 */
.thin      { font-weight: 100; }   /* thin */
.light     { font-weight: 300; }   /* light */
.regular   { font-weight: 400; }   /* normal */
.medium    { font-weight: 500; }   /* medium */
.semibold  { font-weight: 600; }   /* semibold */
.bold      { font-weight: 700; }   /* bold */
.extrabold { font-weight: 800; }   /* extra bold */
.black     { font-weight: 900; }   /* black */

/* font-style */
.italic  { font-style: italic; }    /* synthetic italic jika tidak ada file */
.oblique { font-style: oblique 10deg; }  /* miring tanpa italic face */

/* font-size: absolute, relative, viewport, calc */
h1 { font-size: 2rem; }           /* relative ke root (16px default) */
h2 { font-size: 1.5em; }          /* relative ke parent */
.caption { font-size: 0.75rem; }  /* 12px */
.vw { font-size: 4vw; }           /* viewport width */
.fluid { font-size: clamp(1rem, 2.5vw, 2rem); }  /* fluid! */
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="line-height" onClick={() => setActiveSection("line-height")}>
                        <H2>line-height: unit vs unitless<H2.anchor href="#line-height">#</H2.anchor></H2>
                        <P>Perbedaan krusial: <IC>line-height: 1.5</IC> (unitless) dan <IC>line-height: 1.5em</IC> berbeda saat diwariskan ke children.</P>
                        <Code file="line-height.css">{`
/* ✅ Unitless — dianjurkan */
/* Dihitung ulang per elemen × font-size masing-masing */
body { font-size: 16px; line-height: 1.5; }
h1   { font-size: 2rem; }
/* h1 line-height = 2rem × 1.5 = 3rem — proporsional */

/* ⚠️ Dengan unit — bisa bermasalah */
body { font-size: 16px; line-height: 1.5em; }  /* = 24px */
h1   { font-size: 2rem; }
/* h1 mewarisi 24px — terlalu rapat untuk font 32px! */

/* Rekomendasi per konteks */
body    { line-height: 1.6; }    /* body text */
h1, h2  { line-height: 1.2; }   /* headings */
code    { line-height: 1.5; }
button  { line-height: 1; }      /* prevent extra space */

/* line-height: normal — browser default (~1.2) */
/* line-height: 0 — collapse baris (jarang dipakai) */
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="spacing" onClick={() => setActiveSection("spacing")}>
                        <H2>letter-spacing & word-spacing<H2.anchor href="#spacing">#</H2.anchor></H2>
                        <Code file="spacing.css">{`
/* letter-spacing — jarak antar karakter */
.tight   { letter-spacing: -0.05em; }   /* headings besar */
.normal  { letter-spacing: 0; }
.wide    { letter-spacing: 0.05em; }
.widest  { letter-spacing: 0.2em; }     /* uppercase labels */

/* word-spacing — jarak antar kata */
.word-tight  { word-spacing: -0.1em; }
.word-normal { word-spacing: 0; }
.word-wide   { word-spacing: 0.25em; }

/* Kombinasi efektif */
.label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* Tracking negatif untuk display headings */
.display-heading {
  font-size: clamp(2rem, 5vw, 5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.1;
}
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="text-align" onClick={() => setActiveSection("text-align")}>
                        <H2>text-align, text-indent, text-transform<H2.anchor href="#text-align">#</H2.anchor></H2>
                        <TypoPlayground />
                        <Code file="text-props.css">{`
/* text-align */
.left    { text-align: left; }
.center  { text-align: center; }
.right   { text-align: right; }
.justify { text-align: justify; }

/* text-align: start/end (logical — RTL-aware) */
.start   { text-align: start; }   /* left di LTR, right di RTL */
.end     { text-align: end; }

/* text-indent — inden baris pertama */
p { text-indent: 2em; }           /* inden seperti novel */
p { text-indent: -1em; }          /* hanging indent */
p { text-indent: 1rem hanging; }  /* hanging indent (modern) */

/* text-transform */
.uppercase  { text-transform: uppercase; }   /* HELLO */
.lowercase  { text-transform: lowercase; }   /* hello */
.capitalize { text-transform: capitalize; }  /* Hello World */
.none       { text-transform: none; }
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="text-decoration" onClick={() => setActiveSection("text-decoration")}>
                        <H2>text-decoration<H2.anchor href="#text-decoration">#</H2.anchor></H2>
                        <TypoDemo>
                            {[
                                { label: "underline", style: "underline" },
                                { label: "overline", style: "overline" },
                                { label: "line-through", style: "line-through" },
                                { label: "underline wavy", style: "underline wavy" },
                                { label: "underline dotted", style: "underline dotted" },
                                { label: "underline dashed", style: "underline dashed" },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-4 py-1.5 text-sm">
                                    <span className="w-40 font-mono text-xs text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">{item.label}</span>
                                    <span style={{ textDecoration: item.style }}>Sample Text</span>
                                </div>
                            ))}
                        </TypoDemo>
                        <Code file="text-decoration.css">{`
/* Shorthand: line style color thickness */
a { text-decoration: underline; }
a { text-decoration: underline wavy red; }
a { text-decoration: underline dotted currentColor 2px; }

/* Longhand */
.custom-link {
  text-decoration-line: underline;
  text-decoration-style: wavy;              /* solid, double, dotted, dashed, wavy */
  text-decoration-color: oklch(60% 0.2 250);
  text-decoration-thickness: 2px;           /* atau from-font */
  text-underline-offset: 4px;              /* jarak garis dari baseline */
}

/* Kombinasi multiple lines */
.strike-under {
  text-decoration: underline line-through;
}

/* Remove default underline on link */
a { text-decoration: none; }
a:hover { text-decoration: underline; }
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="text-overflow" onClick={() => setActiveSection("text-overflow")}>
                        <H2>text-overflow & white-space<H2.anchor href="#text-overflow">#</H2.anchor></H2>
                        <TypoDemo>
                            {[
                                { label: "ellipsis (1 line)", cls: "overflow-hidden text-ellipsis whitespace-nowrap w-48" },
                                { label: "clip (1 line)", cls: "overflow-hidden text-clip whitespace-nowrap w-48" },
                                { label: "pre-wrap", cls: "whitespace-pre-wrap w-48" },
                                { label: "break-word", cls: "break-words w-32" },
                            ].map(item => (
                                <div key={item.label} className="flex items-start gap-4 py-1.5 text-sm">
                                    <span className="w-36 font-mono text-xs text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] shrink-0">{item.label}</span>
                                    <span className={`border border-dashed border-indigo-300 px-1 text-xs ${item.cls}`}>Lorem ipsum dolor sit amet consectetur adipiscing elit</span>
                                </div>
                            ))}
                        </TypoDemo>
                        <Code file="text-overflow.css">{`
/* Single line truncate dengan ellipsis — tiga properti wajib */
.truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* Multi-line clamp (CSS) */
.clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* white-space values */
.normal   { white-space: normal; }      /* default — wrap */
.nowrap   { white-space: nowrap; }      /* no wrap */
.pre      { white-space: pre; }         /* respek whitespace & newline */
.pre-wrap { white-space: pre-wrap; }    /* pre + wrapping */
.pre-line { white-space: pre-line; }    /* collapse spaces, respek newline */
.break    { white-space: break-spaces; }

/* overflow-wrap */
.break-word { overflow-wrap: break-word; }    /* break panjang */
.anywhere   { overflow-wrap: anywhere; }      /* break lebih agresif */
        `}</Code>
                    </Section>
                    <Divider />

                    {/* ── text-wrap, hyphens & word-break ─────────────────── */}
                    <Section id="text-wrap" onClick={() => setActiveSection("text-wrap")}>
                        <H2>text-wrap, hyphens & word-break<H2.anchor href="#text-wrap">#</H2.anchor></H2>
                        <P>Mengontrol bagaimana teks membungkus dan memecah kata — penting untuk tipografi yang rapi di berbagai ukuran layar.</P>
                        <div className="space-y-3 my-4">
                            {[
                                { label: "text-wrap: balance", cls: "text-balance max-w-[280px]", desc: "Bagi baris secara visual rata — ideal untuk heading" },
                                { label: "text-wrap: pretty", cls: "text-pretty max-w-[280px]", desc: "Hindari orphan (kata sendiri di baris terakhir)" },
                                { label: "text-wrap: nowrap", cls: "whitespace-nowrap", desc: "Tidak pernah wrap — overflow kalau terlalu panjang" },
                            ].map(item => (
                                <div key={item.label} className="flex flex-col gap-1.5 p-3 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)]">
                                    <span className="text-[10px] font-mono text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">{item.label}</span>
                                    <p className={`text-sm ${item.cls}`}>The quick brown fox jumps over the lazy dog near the riverbank.</p>
                                    <span className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">{item.desc}</span>
                                </div>
                            ))}
                        </div>
                        <Code file="text-wrap.css">{`
/* text-wrap — kontrol algoritma line wrapping */
h1, h2, h3 { text-wrap: balance; }    /* bagi baris secara visual rata */
p           { text-wrap: pretty; }    /* hindari orphan di baris terakhir */
.nowrap     { text-wrap: nowrap; }    /* = white-space: nowrap */
.stable     { text-wrap: stable; }   /* wrap stabil saat editing (perf) */

/* hyphens — otomatis hyphenasi kata panjang */
/* butuh lang attribute di HTML: <html lang="id"> */
p {
  hyphens: auto;           /* browser otomatis potong dengan tanda hubung */
  hyphens: manual;         /* hanya pada \\u00AD (soft hyphen) */
  hyphens: none;           /* default — tidak pernah hyphen */
  hyphenate-limit-chars: 6 3 3; /* min word-len, min sebelum, min setelah hyphen */
}

/* word-break — bagaimana kata dipecah di batas baris */
.normal  { word-break: normal; }       /* default */
.break   { word-break: break-all; }   /* pecah di karakter apapun */
.keep    { word-break: keep-all; }    /* jangan pecah kata CJK */

/* overflow-wrap — fallback saat kata tidak muat */
.fallback { overflow-wrap: break-word; }   /* pecah kalau tidak ada peluang wrap */
.agresif  { overflow-wrap: anywhere; }    /* pecah lebih agresif, pengaruhi min-content */

/* Kombinasi umum untuk body text */
p {
  overflow-wrap: break-word;
  hyphens: auto;
  text-wrap: pretty;
}
                        `}</Code>
                        <TypoDemo>
                            <p className="text-sm max-w-[220px] overflow-wrap-anywhere hyphens-auto text-wrap-pretty leading-relaxed text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]">
                                Antidisestablishmentarianism adalah kata yang sangat panjang untuk test overflow-wrap dan hyphens.
                            </p>
                        </TypoDemo>
                    </Section>
                    <Divider />

                    {/* ── font shorthand & font-size-adjust ────────────────── */}
                    <Section id="font-shorthand" onClick={() => setActiveSection("font-shorthand")}>
                        <H2>font shorthand & font-size-adjust<H2.anchor href="#font-shorthand">#</H2.anchor></H2>
                        <P>
                            <IC>font</IC> adalah super-shorthand yang menyetting font-style, font-variant, font-weight, font-stretch, font-size, line-height, dan font-family sekaligus.
                            <IC>font-size-adjust</IC> menjaga keterbacaan saat font fallback memiliki x-height berbeda.
                        </P>
                        <Code file="font-shorthand.css">{`
/* font shorthand — urutan wajib diikuti */
/* font: font-style font-variant font-weight font-stretch font-size/line-height font-family */
/* Hanya font-size dan font-family yang wajib */

p { font: 16px/1.5 "Inter", sans-serif; }
h1 { font: bold 2rem/1.2 "Inter", sans-serif; }
.fancy { font: italic small-caps 700 1.125rem/1.6 "Georgia", serif; }
.condensed { font: 500 condensed 1rem/1.4 "Roboto Condensed", sans-serif; }

/* ⚠️ font shorthand me-RESET semua font properties ke initial
   yang tidak disebutkan — hati-hati saat override */

/* font-size-adjust — jaga x-height saat font fallback */
/* Berguna saat body font tidak load dan fallback punya ukuran berbeda */
body {
  font-family: "MyCustomFont", Georgia, serif;
  font-size-adjust: 0.5;    /* ex-height ratio target */
  /* atau specify metric */
  font-size-adjust: ex-height 0.5;    /* berdasarkan x-height */
  font-size-adjust: cap-height 0.7;   /* berdasarkan capital height */
  font-size-adjust: ch-width 0.5;     /* berdasarkan lebar '0' */
}

/* font-synthesis — kontrol sintesis italic/bold/small-caps */
.strict {
  font-synthesis: none;         /* jangan synthesize apapun */
  font-synthesis: weight;       /* synthesize bold saja */
  font-synthesis: style;        /* synthesize italic saja */
  font-synthesis: small-caps;   /* synthesize small-caps */
}

/* tab-size — ukuran tab di pre/code */
pre { tab-size: 4; }    /* default: 8 — ubah ke 2 atau 4 untuk code */
                        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="opentype" onClick={() => setActiveSection("opentype")}>
                        <H2>OpenType Features<H2.anchor href="#opentype">#</H2.anchor></H2>
                        <P>OpenType features memungkinkan akses ke fitur tipografi tingkat lanjut yang tersimpan dalam font — ligatures, kerning, oldstyle figures, small caps, dan banyak lagi.</P>
                        <Code file="opentype.css">{`
/* font-feature-settings — kontrol low-level */
/* "liga" = ligatures (fi, fl, ff) */
/* "kern" = kerning */
/* "onum" = oldstyle numerals */
/* "smcp" = small caps */
/* "frac" = fractions */
/* "zero" = slashed zero */
/* "tnum" = tabular numbers */
/* "lnum" = lining numbers */

.ligatures     { font-feature-settings: "liga" 1, "calt" 1; }
.no-ligatures  { font-feature-settings: "liga" 0; }
.small-caps    { font-feature-settings: "smcp" 1; }
.oldstyle-nums { font-feature-settings: "onum" 1; }
.tabular-nums  { font-feature-settings: "tnum" 1; }   /* angka lebar sama */
.fractions     { font-feature-settings: "frac" 1; }
.slashed-zero  { font-feature-settings: "zero" 1; }

/* font-variant-* — high-level API (lebih dianjurkan) */
.small-caps-v2   { font-variant-caps: small-caps; }
.all-small-caps  { font-variant-caps: all-small-caps; }
.oldstyle-v2     { font-variant-numeric: oldstyle-nums; }
.tabular-v2      { font-variant-numeric: tabular-nums; }
.fraction-v2     { font-variant-numeric: diagonal-fractions; }
.liga-v2         { font-variant-ligatures: common-ligatures; }
.no-liga-v2      { font-variant-ligatures: no-common-ligatures; }

/* font-variant shorthand */
.fancy {
  font-variant: small-caps;
}
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="fluid-typo" onClick={() => setActiveSection("fluid-typo")}>
                        <H2>Fluid Typography dengan clamp()<H2.anchor href="#fluid-typo">#</H2.anchor></H2>
                        <P><IC>clamp(min, preferred, max)</IC> menghasilkan font-size yang smooth scaling antara viewport sizes — tanpa breakpoints.</P>
                        <TypoDemo>
                            <FluidHeading>Fluid Heading — resize browser untuk melihat perubahan!</FluidHeading>
                            <p className="mt-3 text-[clamp(0.875rem,1.5vw+0.5rem,1.125rem)] text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] leading-relaxed">
                                Teks ini juga fluid — ukurannya berubah smooth mengikuti lebar viewport tanpa media query.
                            </p>
                        </TypoDemo>
                        <Code file="fluid-typography.css">{`
/* clamp(minimum, preferred, maximum) */
/* preferred biasanya dalam vw + rem untuk responsivitas */

h1 { font-size: clamp(2rem,   5vw + 1rem,  5rem); }
h2 { font-size: clamp(1.5rem, 3vw + 0.5rem, 3rem); }
h3 { font-size: clamp(1.25rem,2vw + 0.5rem, 2rem); }
p  { font-size: clamp(1rem,   1vw + 0.75rem, 1.25rem); }

/* Fluid line-height bersama font-size */
h1 {
  font-size: clamp(2rem, 5vw + 1rem, 5rem);
  line-height: clamp(1.1, 1.2, 1.3);   /* juga bisa clamp */
}

/* Fluid spacing */
.section {
  padding: clamp(2rem, 5vw, 6rem) clamp(1rem, 3vw, 3rem);
}

/* CSS custom property + clamp */
:root {
  --font-size-sm:   clamp(0.875rem, 0.8rem + 0.5vw, 1rem);
  --font-size-base: clamp(1rem,     0.9rem + 0.75vw, 1.25rem);
  --font-size-lg:   clamp(1.25rem,  1rem + 1.5vw, 2rem);
  --font-size-xl:   clamp(1.5rem,   1rem + 2.5vw, 3rem);
  --font-size-2xl:  clamp(2rem,     1.5rem + 3vw, 5rem);
}
        `}</Code>
                        <Callout type="note">
                            <Callout.icon>ℹ️</Callout.icon>
                            <Callout.content>
                                Formula <IC>preferred = x * 1vw + y * 1rem</IC>: nilai <IC>x</IC> mengontrol kecepatan scale (semakin besar = semakin responsif), nilai <IC>y</IC> mengontrol baseline. Tools seperti <IC>fluid.style</IC> atau <IC>utopia.fyi</IC> bisa generate nilai otomatis.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
                        <H2>Typography di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
                        <Code file="typography-tw.tsx">{`
import { tw } from "tailwind-styled-v4"

/* Heading dengan fluid size via arbitrary value */
const Heading = tw.h2({
  base: "font-bold tracking-tight text-[clamp(1.5rem,3vw+0.5rem,3rem)] leading-tight",
})

/* Body text component dengan variasi */
const Body = tw.p({
  base: "leading-7 text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]",
  variants: {
    size: {
      sm:   "text-sm",
      base: "text-base",
      lg:   "text-lg",
    },
    balance: {
      true:  "text-balance",    /* bagi baris secara visual rata */
      false: "",
    },
  },
  defaultVariants: { size: "base", balance: false },
})

/* Label komponen dengan OpenType features */
const Label = tw.span({
  base: "text-xs font-semibold tracking-widest uppercase [font-variant-numeric:tabular-nums]",
})

/* Truncated text */
const Truncate = tw.p({
  base: "overflow-hidden text-ellipsis whitespace-nowrap",
})

/* Multi-line clamp */
const Clamp = tw.p({
  base: "overflow-hidden [-webkit-line-clamp:3] [display:-webkit-box] [-webkit-box-orient:vertical]",
})
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="exercise" onClick={() => setActiveSection("exercise")}>
                        <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Fluid type scale</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat sistem type scale fluid menggunakan CSS custom properties + <IC>clamp()</IC>. Definisikan <IC>--font-size-xs</IC> sampai <IC>--font-size-4xl</IC> dengan nilai fluid yang smooth dari mobile ke desktop.</p>
                                <p>Test di berbagai lebar viewport untuk memastikan tidak ada teks yang terlalu kecil atau terlalu besar.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Variable font animation</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Gunakan variable font (misal Inter Variable) dan animasikan <IC>font-variation-settings</IC> dari <IC>"wght" 100</IC> ke <IC>"wght" 900</IC> menggunakan <IC>@keyframes</IC>.</p>
                                <p>Tambahkan <IC>@media (prefers-reduced-motion: reduce)</IC> untuk disable animasi bagi user yang membutuhkan.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Article typography</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat stylesheet untuk article/blog post yang mencakup: fluid headings dengan tracking negatif, body text dengan <IC>line-height: 1.7</IC>, <IC>text-indent</IC> pada paragraf (kecuali yang pertama), dan <IC>font-variant-numeric: oldstyle-nums</IC> untuk angka di dalam teks.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/medium/custom-properties" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>Custom Properties</NavBtn.label></NavBtn>
                        <NavBtn href="/learn/medium/colors-gradients" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>Colors & Gradients</NavBtn.label></NavBtn>
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
