/**
 * CSS Advanced — CSS Functions & The Future
 */
"use client"
import { useState } from "react"
import {
    Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
    PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
    CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
    PlaygroundWrap, Chip, ChipRow, SupportBadge,
    FutureTag, FutureGrid, FutureCard,
} from "./styles"

const TOC = [
    { id: "interpolate-size", label: "interpolate-size & height: auto" },
    { id: "light-dark", label: "light-dark() function" },
    { id: "field-sizing", label: "field-sizing: content" },
    { id: "math-functions", label: "Math Functions Baru" },
    { id: "at-function", label: "@function (coming soon)" },
    { id: "if-condition", label: "if() conditional (coming)" },
    { id: "css-mixins", label: "CSS Mixins & Inline conditionals" },
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

function LightDarkPlayground() {
    const [darkMode, setDarkMode] = useState(false)
    const [textContent, setTextContent] = useState("Halo, light-dark()!")

    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🌗 light-dark() Playground</PlaygroundWrap.label>
                <ChipRow>
                    <Chip active={!darkMode ? "true" : "false"} onClick={() => setDarkMode(false)}>☀️ Light</Chip>
                    <Chip active={darkMode ? "true" : "false"} onClick={() => setDarkMode(true)}>🌙 Dark</Chip>
                </ChipRow>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div
                    style={{
                        colorScheme: darkMode ? "dark" : "light",
                        background: darkMode ? "#1a1a2e" : "#ffffff",
                        color: darkMode ? "#f9fafb" : "#111827",
                        borderColor: darkMode ? "#374151" : "#e5e7eb",
                        borderWidth: 1,
                        borderStyle: "solid",
                        borderRadius: "0.75rem",
                        padding: "1.5rem",
                        transition: "background 200ms, color 200ms, border-color 200ms",
                    }}
                >
                    <p className="font-semibold mb-2">{textContent}</p>
                    <p style={{ color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "0.875rem" }}>
                        Simulasi light-dark() — background, color, dan border berubah otomatis.
                    </p>
                    <div style={{
                        marginTop: "1rem",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        background: darkMode ? "#374151" : "#f3f4f6",
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                        color: darkMode ? "#a5b4fc" : "#4f46e5",
                    }}>
                        background: light-dark(#ffffff, #1a1a2e);<br />
                        color: light-dark(#111827, #f9fafb);
                    </div>
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {darkMode
                    ? "color-scheme: dark; → light-dark() pilih nilai kedua"
                    : "color-scheme: light; → light-dark() pilih nilai pertama"}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

function AccordionPlayground() {
    const [open, setOpen] = useState(false)

    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>📏 interpolate-size Playground — height: auto animation</PlaygroundWrap.label>
                <ChipRow>
                    <Chip active={!open ? "true" : "false"} onClick={() => setOpen(false)}>Tutup</Chip>
                    <Chip active={open ? "true" : "false"} onClick={() => setOpen(true)}>Buka</Chip>
                </ChipRow>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden">
                    <button
                        onClick={() => setOpen(o => !o)}
                        className="w-full text-left px-4 py-3 font-medium text-sm flex items-center justify-between bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] transition-colors"
                    >
                        <span>Accordion Item</span>
                        <span style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 300ms" }}>▼</span>
                    </button>
                    <div style={{
                        maxHeight: open ? "200px" : "0",
                        overflow: "hidden",
                        transition: "max-height 300ms ease",
                    }}>
                        <div className="px-4 py-3 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]">
                            <p>Dengan <strong>interpolate-size: allow-keywords</strong>, animasi <code>height: 0 → height: auto</code> sekarang mungkin dilakukan secara native CSS — tanpa JavaScript mengukur tinggi konten!</p>
                            <p className="mt-2">Ini menggantikan hack lama menggunakan <code>max-height</code> yang boros atau JavaScript getBoundingClientRect().</p>
                        </div>
                    </div>
                </div>
                <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] mt-2">
                    (Demo ini menggunakan max-height fallback — browser nyata dengan interpolate-size menggunakan height: auto langsung)
                </p>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {open
                    ? ":root { interpolate-size: allow-keywords; } .body { height: auto; }"
                    : ".body { height: 0; overflow: hidden; }"}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

export default function CssFunctionsFuturePage() {
    const [activeSection, setActiveSection] = useState("interpolate-size")
    return (
        <Page>
            <TopBar><TopBarInner>
                <Breadcrumb>
                    <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.link href="/learn/advandced">Advanced</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.curr>CSS Functions & The Future</Breadcrumb.curr>
                </Breadcrumb>
            </TopBarInner></TopBar>
            <Body>
                <Content>
                    <PageTitle>CSS Functions & The Future</PageTitle>
                    <PageDesc>Fitur CSS terbaru dan yang akan datang — dari animasi height: auto, light-dark() untuk tema, field-sizing untuk auto-resize input, hingga @function dan if() yang masih dalam proposal.</PageDesc>

                    <Section id="interpolate-size" onClick={() => setActiveSection("interpolate-size")}>
                        <H2>interpolate-size & height: auto animation<H2.anchor href="#interpolate-size">#</H2.anchor></H2>
                        <P>Selama bertahun-tahun, animasi dari <IC>height: 0</IC> ke <IC>height: auto</IC> tidak bisa dilakukan dengan CSS transition. <IC>interpolate-size: allow-keywords</IC> akhirnya menyelesaikan masalah ini.</P>
                        <div className="flex gap-2 flex-wrap my-4">
                            <SupportBadge status="supported">✅ Chrome 129+</SupportBadge>
                            <SupportBadge status="partial">🔶 Safari (preview)</SupportBadge>
                            <SupportBadge status="none">❌ Firefox (belum)</SupportBadge>
                            <FutureTag status="newly">Newly Available</FutureTag>
                        </div>
                        <AccordionPlayground />
                        <Code file="interpolate-size.css">{`
/* interpolate-size.css */
/* Animasikan height: auto — sebelumnya tidak mungkin! */
:root {
  interpolate-size: allow-keywords;  /* aktifkan di root */
}

.accordion-body {
  height: 0;
  overflow: hidden;
  transition: height 300ms ease;
}
.accordion-body.open {
  height: auto;  /* sekarang bisa di-animate! */
}

/* Alternatif: interpolate-size per-elemen */
.expandable {
  interpolate-size: allow-keywords;
  transition: width 300ms;
}
.expandable:hover { width: max-content; }
        `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                <Callout.title>Progressive enhancement</Callout.title>
                                Set <IC>interpolate-size: allow-keywords</IC> di <IC>:root</IC> dan gunakan <IC>@supports</IC> untuk fallback. Browser yang tidak support akan langsung jump ke <IC>height: auto</IC> tanpa animasi — masih fungsional.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="light-dark" onClick={() => setActiveSection("light-dark")}>
                        <H2>light-dark() function<H2.anchor href="#light-dark">#</H2.anchor></H2>
                        <P>Fungsi <IC>light-dark()</IC> secara otomatis memilih nilai berdasarkan <IC>color-scheme</IC> yang aktif — tanpa memerlukan media query atau class terpisah.</P>
                        <div className="flex gap-2 flex-wrap my-4">
                            <SupportBadge status="supported">✅ Chrome 123+</SupportBadge>
                            <SupportBadge status="supported">✅ Safari 17.5+</SupportBadge>
                            <SupportBadge status="supported">✅ Firefox 120+</SupportBadge>
                            <FutureTag status="baseline">Baseline</FutureTag>
                        </div>
                        <LightDarkPlayground />
                        <Code file="light-dark.css">{`
/* light-dark.css */
/* light-dark(light-value, dark-value) */
/* Otomatis pilih berdasarkan color-scheme */
:root {
  color-scheme: light dark;
}

.element {
  background: light-dark(#ffffff, #1a1a2e);
  color: light-dark(#111827, #f9fafb);
  border-color: light-dark(#e5e7eb, #374151);
}

/* Lebih pendek dari media query! */
/* Sebelumnya: */
.element { background: white; }
@media (prefers-color-scheme: dark) { .element { background: #1a1a2e; } }

/* Sekarang: */
.element { background: light-dark(white, #1a1a2e); }
        `}</Code>
                        <H3>Dengan CSS Custom Properties</H3>
                        <Code file="light-dark-tokens.css">{`
/* Definisikan design tokens dengan light-dark() */
:root {
  color-scheme: light dark;

  --bg-base: light-dark(#ffffff, #0f0f1a);
  --bg-surface: light-dark(#f9fafb, #1a1a2e);
  --text-primary: light-dark(#111827, #f9fafb);
  --text-muted: light-dark(#6b7280, #9ca3af);
  --border: light-dark(#e5e7eb, #374151);
  --accent: light-dark(oklch(55% 0.2 260), oklch(70% 0.2 260));
}

/* Paksa ke dark mode via class (untuk toggle) */
[data-theme="dark"] { color-scheme: dark; }
[data-theme="light"] { color-scheme: light; }

/* light-dark() JUGA bekerja di media query otomatis */
/* Tidak perlu @media (prefers-color-scheme: dark) lagi! */

/* Catatan: light-dark() hanya bekerja dalam konteks color-scheme */
/* Tidak bisa dipakai untuk non-color values */
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="field-sizing" onClick={() => setActiveSection("field-sizing")}>
                        <H2>field-sizing: content<H2.anchor href="#field-sizing">#</H2.anchor></H2>
                        <P>Properti <IC>field-sizing: content</IC> membuat input dan textarea otomatis mengubah ukuran mengikuti kontennya — tanpa JavaScript sama sekali.</P>
                        <div className="flex gap-2 flex-wrap my-4">
                            <SupportBadge status="supported">✅ Chrome 123+</SupportBadge>
                            <SupportBadge status="none">❌ Safari (belum)</SupportBadge>
                            <SupportBadge status="none">❌ Firefox (belum)</SupportBadge>
                            <FutureTag status="experimental">Experimental</FutureTag>
                        </div>
                        <Code file="field-sizing.css">{`
/* field-sizing.css */
/* Input/textarea yang ukurannya mengikuti konten */
textarea {
  field-sizing: content;  /* auto-resize saat user mengetik */
  min-height: 3em;
  max-height: 20em;       /* batasi tinggi maksimum */
}

input[type="text"] {
  field-sizing: content;
  min-width: 10ch;
  max-width: 40ch;
}
        `}</Code>
                        <div className="my-5 p-4 bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] rounded-xl border border-[color-mix(in_srgb,var(--accent)_20%,transparent)]">
                            <p className="text-xs font-semibold mb-3 text-[var(--accent)]">Demo — textarea dengan field-sizing: content (Chrome 123+)</p>
                            <textarea
                                placeholder="Ketik di sini — textarea akan mengembang otomatis..."
                                className="w-full rounded-lg border border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] bg-[var(--surface)] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                style={{ fieldSizing: "content" as never, minHeight: "3em", maxHeight: "12em" }}
                                rows={2}
                            />
                        </div>
                        <Callout type="note">
                            <Callout.icon>🧪</Callout.icon>
                            <Callout.content>
                                <Callout.title>Hanya Chrome saat ini</Callout.title>
                                Demo di atas hanya bekerja di Chrome 123+. Di browser lain, textarea akan berperilaku normal. Gunakan sebagai progressive enhancement.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="math-functions" onClick={() => setActiveSection("math-functions")}>
                        <H2>Math Functions Baru<H2.anchor href="#math-functions">#</H2.anchor></H2>
                        <P>CSS mendapatkan beberapa fungsi matematika baru yang meningkatkan kemampuan kalkulasi deklaratif tanpa JavaScript.</P>
                        <FutureGrid>
                            <FutureCard>
                                <div className="flex items-center gap-2 mb-2">
                                    <IC>round()</IC>
                                    <FutureTag status="baseline">Baseline</FutureTag>
                                </div>
                                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">Bulatkan ke kelipatan tertentu. Strategi: nearest, up, down, to-zero.</p>
                            </FutureCard>
                            <FutureCard>
                                <div className="flex items-center gap-2 mb-2">
                                    <IC>mod()</IC> / <IC>rem()</IC>
                                    <FutureTag status="baseline">Baseline</FutureTag>
                                </div>
                                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">Operasi modulo. mod() ikut tanda pembagi, rem() ikut tanda dividend.</p>
                            </FutureCard>
                            <FutureCard>
                                <div className="flex items-center gap-2 mb-2">
                                    <IC>abs()</IC> / <IC>sign()</IC>
                                    <FutureTag status="newly">Newly Available</FutureTag>
                                </div>
                                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">Nilai absolut dan tanda (-1, 0, 1). Berguna untuk animasi berbasis arah.</p>
                            </FutureCard>
                            <FutureCard>
                                <div className="flex items-center gap-2 mb-2">
                                    <IC>pow()</IC> / <IC>sqrt()</IC>
                                    <FutureTag status="baseline">Baseline</FutureTag>
                                </div>
                                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">Pangkat dan akar. Berguna untuk spacing scales dan curve calculations.</p>
                            </FutureCard>
                            <FutureCard>
                                <div className="flex items-center gap-2 mb-2">
                                    <IC>sin()</IC> / <IC>cos()</IC> / <IC>tan()</IC>
                                    <FutureTag status="baseline">Baseline</FutureTag>
                                </div>
                                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">Fungsi trigonometri. Berguna untuk circular layouts dan wave animations.</p>
                            </FutureCard>
                            <FutureCard>
                                <div className="flex items-center gap-2 mb-2">
                                    <IC>log()</IC> / <IC>exp()</IC>
                                    <FutureTag status="baseline">Baseline</FutureTag>
                                </div>
                                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">Logaritma dan eksponensial. Berguna untuk easing curves dan scale systems.</p>
                            </FutureCard>
                        </FutureGrid>
                        <Code file="math-functions.css">{`
/* math-functions.css */
/* round() — bulatkan ke kelipatan tertentu */
.el { font-size: round(1.337rem, 0.25rem); }  /* → 1.25rem */
.el { width: round(up, 67%, 10%); }           /* → 70% */

/* mod() dan rem() — modulo */
.el { rotate: calc(mod(var(--index), 4) * 90deg); }

/* abs() — nilai absolut */
.el { width: abs(var(--offset)); }

/* sign() — tanda nilai (-1, 0, 1) */
.el { transform: translateX(calc(sign(var(--x)) * 10px)); }

/* pow(), sqrt(), log(), exp(), sin(), cos(), tan() */
.el { transform: rotate(calc(sin(var(--angle) * 1rad) * 45deg)); }
        `}</Code>
                        <H3>Circular Layout dengan sin/cos</H3>
                        <Code file="circular.css">{`
/* Tempatkan 8 item dalam lingkaran menggunakan trigonometri */
.circle-item {
  --index: 0;  /* set per item: 0, 1, 2, ... 7 */
  --count: 8;
  --angle: calc(var(--index) / var(--count) * 360deg);
  --radius: 120px;

  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(
    calc(cos(var(--angle)) * var(--radius) - 50%),
    calc(sin(var(--angle)) * var(--radius) - 50%)
  );
}

/* Modulo untuk animasi loop */
@property --progress {
  syntax: "<number>";
  initial-value: 0;
  inherits: false;
}

.loading-dot {
  --delay: calc(mod(var(--index), 3) * 0.2s);
  animation: pulse 0.6s var(--delay) infinite;
}
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="at-function" onClick={() => setActiveSection("at-function")}>
                        <H2>@function (coming soon)<H2.anchor href="#at-function">#</H2.anchor></H2>
                        <Callout type="warning">
                            <Callout.icon>🚧</Callout.icon>
                            <Callout.content>
                                <Callout.title>Proposal — Belum Tersedia di Browser</Callout.title>
                                <strong>@function masih dalam tahap proposal di CSSWG. Belum tersedia di browser manapun.</strong> Contoh di bawah menunjukkan API yang diusulkan — bukan kode yang bisa dijalankan sekarang.
                            </Callout.content>
                        </Callout>
                        <FutureTag status="coming">Coming Soon</FutureTag>
                        <Code file="at-function-proposal.css">{`
/* @function — CSS custom functions (PROPOSAL, belum tersedia) */
@function --spacing(--multiplier) {
  result: calc(var(--multiplier) * 4px);
}

.el {
  padding: --spacing(4);  /* → 16px */
  margin: --spacing(8);   /* → 32px */
}

@function --clamp-size(--min, --max) {
  result: clamp(var(--min), 4vw + 1rem, var(--max));
}

.heading {
  font-size: --clamp-size(1.5rem, 4rem);
}
        `}</Code>
                        <P>Proposal ini akan memungkinkan CSS memiliki reusable functions — mirip Sass mixins tapi native di browser. Ini adalah salah satu fitur yang paling banyak diminta komunitas CSS.</P>
                    </Section>
                    <Divider />

                    <Section id="if-condition" onClick={() => setActiveSection("if-condition")}>
                        <H2>if() conditional (coming)<H2.anchor href="#if-condition">#</H2.anchor></H2>
                        <Callout type="warning">
                            <Callout.icon>🚧</Callout.icon>
                            <Callout.content>
                                <Callout.title>Proposal — Belum Tersedia di Browser</Callout.title>
                                <IC>if()</IC> masih dalam tahap draft di CSSWG. Belum ada implementasi browser yang stable.
                            </Callout.content>
                        </Callout>
                        <FutureTag status="coming">Coming Soon</FutureTag>
                        <Code file="if-proposal.css">{`
/* if() — conditional dalam nilai CSS (PROPOSAL) */

/* Sintaks yang diusulkan: */
/* if(condition: value; else: other-value) */

.btn {
  background: if(
    style(--variant: primary): blue;
    style(--variant: danger): red;
    else: gray
  );
}

/* Kondisi berdasarkan container query */
.card {
  padding: if(
    container(inline-size > 400px): 2rem;
    else: 1rem
  );
}

/* Kondisi berdasarkan media query */
.text {
  font-size: if(
    media(min-width: 768px): 1.25rem;
    else: 1rem
  );
}

/* Mengapa ini powerful: */
/* Sekarang kita perlu: */
.btn-primary { background: blue; }
.btn-danger  { background: red; }

/* Dengan if(): satu rule, conditional value */
.btn {
  background: if(
    style(--variant: primary): blue;
    style(--variant: danger): red;
  );
}
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="css-mixins" onClick={() => setActiveSection("css-mixins")}>
                        <H2>CSS Mixins & Inline Conditionals<H2.anchor href="#css-mixins">#</H2.anchor></H2>
                        <P>CSS Working Group sedang mengerjakan spec "CSS Mixins and Functions" yang mencakup <IC>@function</IC> dan inline conditionals. Ini akan membawa CSS lebih dekat ke kemampuan preprocessor seperti Sass.</P>
                        <Code file="inline-if-today.css">{`
/* Cara SEKARANG — inline conditionals yang sudah tersedia */

/* Style queries sebagai kondisi */
.btn {
  container-type: normal;
}

/* Parent set --variant */
@container style(--variant: primary) {
  .btn-inner { background: blue; color: white; }
}
@container style(--variant: danger) {
  .btn-inner { background: red; color: white; }
}

/* CSS @layer untuk override cascade */
@layer base, components, utilities;

@layer base {
  .btn { background: gray; }
}
@layer components {
  .btn-primary { background: blue; }
}
@layer utilities {
  .bg-red { background: red; }  /* selalu menang dari components */
}

/* @property untuk type-safe custom properties */
@property --progress {
  syntax: "<percentage>";  /* hanya terima nilai persentase */
  initial-value: 0%;
  inherits: true;
}

.progress-bar {
  width: var(--progress);  /* TypeScript-like: hanya <percentage> */
  transition: width 300ms;  /* bisa di-animate karena ada type info */
}
        `}</Code>
                        <FutureGrid>
                            <FutureCard>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-semibold">CSS Nesting</span>
                                    <FutureTag status="baseline">Baseline</FutureTag>
                                </div>
                                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">Nesting native sudah available. Gunakan <IC>&</IC> untuk nested selectors.</p>
                            </FutureCard>
                            <FutureCard>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-semibold">@scope</span>
                                    <FutureTag status="newly">Newly Available</FutureTag>
                                </div>
                                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">Batasi scope selector ke subtree DOM tertentu. Solusi untuk CSS leakage.</p>
                            </FutureCard>
                            <FutureCard>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-semibold">@function</span>
                                    <FutureTag status="coming">Coming</FutureTag>
                                </div>
                                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">CSS custom functions dengan parameter. Masih proposal CSSWG.</p>
                            </FutureCard>
                            <FutureCard>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-semibold">if()</span>
                                    <FutureTag status="coming">Coming</FutureTag>
                                </div>
                                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">Inline conditionals. Masih draft di CSSWG.</p>
                            </FutureCard>
                        </FutureGrid>
                    </Section>
                    <Divider />

                    <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
                        <H2>CSS Functions Terbaru di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
                        <Code file="tw-future.tsx">{`
import { tw } from "tailwind-styled-v4"

/* light-dark() di arbitrary values */
const ThemedCard = tw.div({
  base: [
    "rounded-xl p-4 border",
    "bg-[light-dark(#ffffff,#1a1a2e)]",
    "text-[light-dark(#111827,#f9fafb)]",
    "border-[light-dark(#e5e7eb,#374151)]",
  ].join(" "),
})

/* interpolate-size untuk accordion */
const AccordionBody = tw.div({
  base: [
    "overflow-hidden",
    "[interpolate-size:allow-keywords]",  /* per-element */
    "transition-[height] duration-300",
  ].join(" "),
})

/* field-sizing di Tailwind v4 */
const AutoTextarea = tw.textarea({
  base: [
    "w-full rounded-lg border p-3 text-sm resize-none",
    "[field-sizing:content]",
    "min-h-[3em] max-h-[20em]",
  ].join(" "),
})

/* Math functions di arbitrary values */
const CircleItem = tw.div({
  base: [
    "absolute",
    /* Circular positioning via CSS custom properties + trigonometry */
    "[left:calc(50%_+_cos(var(--angle))_*_120px)]",
    "[top:calc(50%_+_sin(var(--angle))_*_120px)]",
    "-translate-x-1/2 -translate-y-1/2",
  ].join(" "),
})

/* @property untuk type-safe custom props */
const ProgressBar = tw.div({
  base: [
    "h-2 rounded-full bg-[var(--accent)] transition-[width] duration-500",
    "[@property_--progress_{syntax:'<percentage>';initial-value:0%;inherits:true}]",
    "w-[var(--progress)]",
  ].join(" "),
})
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="exercise" onClick={() => setActiveSection("exercise")}>
                        <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Accordion dengan height: auto animation</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat accordion FAQ menggunakan <IC>interpolate-size: allow-keywords</IC>. Setiap item bisa dibuka/ditutup dengan animasi smooth. Gunakan <IC>@supports</IC> untuk fallback di browser lama menggunakan <IC>max-height</IC> trick.</p>
                                <p>Tambahkan animasi icon rotate (▼ → ▲) menggunakan CSS transition.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Dark mode dengan light-dark()</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat design system mini dengan custom properties menggunakan <IC>light-dark()</IC>. Definisikan <IC>--bg</IC>, <IC>--text</IC>, <IC>--surface</IC>, <IC>--border</IC>, dan <IC>--accent</IC> semuanya dengan <IC>light-dark()</IC>. Toggle dark mode dengan mengubah <IC>color-scheme</IC> pada <IC>:root</IC>.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Circular menu dengan CSS trigonometri</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat radial menu dengan 6 item tersusun melingkar menggunakan <IC>sin()</IC> dan <IC>cos()</IC>. Set <IC>--index</IC> custom property per item via CSS <IC>:nth-child()</IC> atau inline style. Animasikan saat hover — item mengembang keluar dari pusat.</p>
                                <p>Hint: <IC>left: calc(50% + cos(var(--angle)) * var(--radius))</IC></p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/advandced/view-transitions-advanced" dir="prev"><NavBtn.hint>← Sebelumnya</NavBtn.hint><NavBtn.label>View Transitions Advanced</NavBtn.label></NavBtn>
                        <NavBtn href="/learn/advandced" dir="next"><NavBtn.hint>↩ Kembali</NavBtn.hint><NavBtn.label>Advanced Overview</NavBtn.label></NavBtn>
                    </PageNav>
                </Content>
                <Toc>
                    <TocLabel>On this page</TocLabel>
                    {TOC.map(item => <TocItem key={item.id} href={`#${item.id}`} active={activeSection === item.id ? "true" : "false"} onClick={() => setActiveSection(item.id)}>{item.label}</TocItem>)}
                </Toc>
            </Body>
        </Page>
    )
}
