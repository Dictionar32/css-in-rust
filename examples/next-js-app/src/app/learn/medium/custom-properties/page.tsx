/**
 * CSS Medium — Custom Properties (CSS Variables)
 */
"use client"
import { useState } from "react"
import {
    Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
    PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
    CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
    PlaygroundWrap, Chip, ChipRow, ThemeCard, ThemeBtn,
} from "./styles"

const TOC = [
    { id: "intro", label: "Apa itu Custom Properties" },
    { id: "syntax", label: "Syntax & var()" },
    { id: "scope", label: "Scope & Inheritance" },
    { id: "fallback", label: "Fallback Values" },
    { id: "js", label: "Manipulasi via JavaScript" },
    { id: "at-property", label: "@property — Typed Variables" },
    { id: "theming", label: "Theming Pattern" },
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

type ThemeMode = "default" | "ocean" | "forest" | "sunset"

function ThemePlayground() {
    const [theme, setTheme] = useState<ThemeMode>("default")
    const themes: ThemeMode[] = ["default", "ocean", "forest", "sunset"]

    const cssVars: Record<ThemeMode, Record<string, string>> = {
        default: { "--card-bg": "#ffffff", "--card-text": "#1f2937", "--card-accent": "#6366f1" },
        ocean: { "--card-bg": "#0c1a2e", "--card-text": "#bfdbfe", "--card-accent": "#38bdf8" },
        forest: { "--card-bg": "#052e16", "--card-text": "#bbf7d0", "--card-accent": "#34d399" },
        sunset: { "--card-bg": "#1c0a00", "--card-text": "#fed7aa", "--card-accent": "#fb923c" },
    }

    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 CSS Custom Properties theming — satu set variabel, banyak tampilan</PlaygroundWrap.label>
                <ChipRow>
                    {themes.map(t => <Chip key={t} active={theme === t} onClick={() => setTheme(t)}>{t}</Chip>)}
                </ChipRow>
                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">
                    Semua komponen menggunakan variabel yang sama — hanya nilai variabel di root yang berubah.
                </p>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <ThemeCard theme={theme}>
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="font-bold text-sm">Card Title</p>
                            <p className="text-xs opacity-70 mt-0.5">Subtitle konten</p>
                        </div>
                        <ThemeBtn theme={theme}>Action</ThemeBtn>
                    </div>
                    <p className="text-xs opacity-80 leading-relaxed">
                        Semua warna diambil dari CSS custom properties. Ganti tema cukup ubah nilai variabel di root — tidak perlu override per-komponen.
                    </p>
                    <div className="mt-3 pt-3 border-t border-current border-opacity-20 flex gap-2">
                        {["Tag A", "Tag B", "Tag C"].map(t => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-current border-opacity-30 opacity-80">{t}</span>
                        ))}
                    </div>
                </ThemeCard>
                <div className="mt-3 text-[10px] font-mono text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] space-y-0.5">
                    {Object.entries(cssVars[theme]).map(([k, v]) => (
                        <div key={k}><span className="text-[var(--accent)]">{k}</span>: {v}</div>
                    ))}
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {`[data-theme="${theme}"] { ${Object.entries(cssVars[theme]).map(([k, v]) => `${k}: ${v}`).join('; ')} }`}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

export default function CustomPropertiesPage() {
    const [activeSection, setActiveSection] = useState("intro")
    return (
        <Page>
            <TopBar><TopBarInner>
                <Breadcrumb>
                    <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.link href="/learn/medium">Medium</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.curr>Custom Properties</Breadcrumb.curr>
                </Breadcrumb>
            </TopBarInner></TopBar>
            <Body>
                <Content>
                    <PageTitle>CSS Custom Properties</PageTitle>
                    <PageDesc>CSS Variables yang sesungguhnya — bukan sekedar shorthand tapi properti dinamis yang bisa di-scope, di-inherit, dan dimanipulasi via JavaScript.</PageDesc>

                    <Section id="intro" onClick={() => setActiveSection("intro")}>
                        <H2>Apa itu Custom Properties<H2.anchor href="#intro">#</H2.anchor></H2>
                        <P>CSS Custom Properties (sering disebut CSS Variables) adalah properti yang namanya didefinisikan oleh developer, dimulai dengan <IC>--</IC>. Berbeda dari preprocessor variables (Sass/Less), custom properties adalah bagian dari CSS cascade — mereka hidup di DOM, bisa di-scope, di-inherit, dan berubah secara dinamis.</P>
                        <Callout type="php">
                            <Callout.icon>🐘</Callout.icon>
                            <Callout.content>
                                <Callout.title>Analogi PHP</Callout.title>
                                Sass variables (<IC>$color: red</IC>) seperti PHP constants — compile-time, tidak bisa berubah setelah compiled.
                                CSS custom properties seperti PHP variables di object — runtime, bisa berubah, diwariskan ke child objects, bisa di-override per-instance.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="syntax" onClick={() => setActiveSection("syntax")}>
                        <H2>Syntax & var()<H2.anchor href="#syntax">#</H2.anchor></H2>
                        <Code file="custom-props.css">{`
/* Definisi — nama harus dimulai dengan -- */
:root {
  --color-primary: #6366f1;
  --spacing-md: 1rem;
  --border-radius: 8px;
  --font-heading: "Inter", sans-serif;
}

/* Penggunaan dengan var() */
.button {
  background: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
}

/* var() tidak bisa dipakai di nama property, hanya di value */
/* ❌ var(--prop-name): red; */
/* ✅ color: var(--color-value); */

/* Ekspresi matematika dengan calc() */
.spacing {
  margin: calc(var(--spacing-md) * 2);
  padding: calc(var(--spacing-md) / 2);
  width: calc(100% - var(--sidebar-width));
}

/* Custom property bisa berisi value kompleks */
:root {
  --shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  --gradient: linear-gradient(135deg, #667eea, #764ba2);
  --transition: 200ms ease-in-out;
}

.card {
  box-shadow: var(--shadow);
  background: var(--gradient);
  transition: transform var(--transition);
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="scope" onClick={() => setActiveSection("scope")}>
                        <H2>Scope & Inheritance<H2.anchor href="#scope">#</H2.anchor></H2>
                        <P>Custom properties mengikuti cascade dan inheritance CSS biasa — nilai yang didefinisikan di suatu elemen hanya berlaku untuk elemen itu dan descendant-nya.</P>
                        <Code file="scope.css">{`
/* Global scope — tersedia di mana saja */
:root { --color: blue; }

/* Scope ke komponen tertentu */
.card { --color: green; }
/* Semua elemen di dalam .card akan lihat --color: green */
/* Elemen di luar .card tetap lihat --color: blue dari :root */

/* Override di level lebih dalam */
.card .special { --color: red; }
/* Hanya .special dan descendant-nya yang lihat merah */

/* Contoh nyata — komponen button dengan variants */
.btn { --btn-bg: #6366f1; --btn-text: white; }
.btn.danger  { --btn-bg: #ef4444; }
.btn.success { --btn-bg: #22c55e; }
.btn.outline { --btn-bg: transparent; --btn-text: #6366f1; }

/* Semua ini menggunakan style yang sama */
.btn {
  background: var(--btn-bg);
  color: var(--btn-text);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="fallback" onClick={() => setActiveSection("fallback")}>
                        <H2>Fallback Values<H2.anchor href="#fallback">#</H2.anchor></H2>
                        <Code file="fallback.css">{`
/* var(--name, fallback) — pakai fallback kalau variabel tidak terdefinisi */
.element {
  color: var(--color-brand, #6366f1);        /* fallback ke nilai literal */
  font-size: var(--font-size, var(--base-size, 1rem)); /* fallback berantai */
}

/* Fallback bisa berupa nilai kompleks */
.card {
  box-shadow: var(--shadow, 0 1px 3px rgba(0,0,0,0.1));
}

/* PENTING: fallback digunakan kalau variabel TIDAK TERDEFINISI,
   bukan kalau variabel bernilai invalid */
:root { --spacing: abc; }    /* nilai invalid */
.el { margin: var(--spacing, 1rem); } /* tetap pakai "abc", bukan fallback! */
/* → margin: abc → invalid → margin initial (0) */

/* Pattern: guard dengan @supports untuk fitur baru */
@supports (--css: variables) {
  /* browser support custom properties */
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="js" onClick={() => setActiveSection("js")}>
                        <H2>Manipulasi via JavaScript<H2.anchor href="#js">#</H2.anchor></H2>
                        <Code file="custom-props.ts">{`
// Baca nilai custom property
const root = document.documentElement
const color = getComputedStyle(root).getPropertyValue('--color-primary').trim()
// → " #6366f1"  (perhatikan kemungkinan whitespace)

// Set nilai custom property
root.style.setProperty('--color-primary', '#ef4444')

// Remove custom property (kembali ke nilai dari stylesheet)
root.style.removeProperty('--color-primary')

// Set di elemen tertentu (bukan global)
const card = document.querySelector('.card')
card.style.setProperty('--card-bg', '#1a1a2e')

// React pattern — dynamic theming
function ThemeProvider({ theme, children }) {
  return (
    <div style={{
      '--color-primary': theme.primary,
      '--color-bg': theme.background,
      '--radius': theme.borderRadius,
    }}>
      {children}
    </div>
  )
}

// Tailwind/tw — inject custom properties via style prop
<div style={{ '--accent': brandColor } as React.CSSProperties}>
  <Button className="bg-[var(--accent)]">Click</Button>
</div>
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="at-property" onClick={() => setActiveSection("at-property")}>
                        <H2>@property — Typed Custom Properties<H2.anchor href="#at-property">#</H2.anchor></H2>
                        <P><IC>@property</IC> memungkinkan mendaftarkan custom property dengan tipe, nilai initial, dan kontrol inheritance — membuat CSS variables bisa di-animate dan lebih predictable.</P>
                        <Code file="at-property.css">{`
/* @property — daftarkan custom property dengan type */
@property --progress {
  syntax: '<percentage>';   /* tipe nilai yang valid */
  inherits: false;          /* tidak diwariskan ke children */
  initial-value: 0%;        /* nilai default */
}

/* Sekarang --progress bisa di-animate! */
.progress-bar {
  background: linear-gradient(
    to right,
    #6366f1 var(--progress),
    #e5e7eb var(--progress)
  );
  transition: --progress 0.3s ease;
}

.progress-bar:hover { --progress: 75%; }

/* Tipe yang tersedia */
@property --color { syntax: '<color>'; inherits: true; initial-value: black; }
@property --size  { syntax: '<length>'; inherits: false; initial-value: 0px; }
@property --angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@property --num   { syntax: '<number>'; inherits: false; initial-value: 0; }

/* Animasi gradient dengan @property */
@property --gradient-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

@keyframes rotate-gradient {
  to { --gradient-angle: 360deg; }
}

.animated-gradient {
  background: linear-gradient(var(--gradient-angle), #667eea, #764ba2);
  animation: rotate-gradient 3s linear infinite;
}
            `}</Code>
                        <Callout type="note">
                            <Callout.icon>ℹ️</Callout.icon>
                            <Callout.content>Tanpa <IC>@property</IC>, CSS tidak bisa meng-interpolate nilai custom property saat animasi karena tidak tahu tipenya. Dengan <IC>@property</IC>, browser tahu itu <IC>{'<color>'}</IC> atau <IC>{'<length>'}</IC> dan bisa animate dengan benar.</Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="theming" onClick={() => setActiveSection("theming")}>
                        <H2>Theming Pattern<H2.anchor href="#theming">#</H2.anchor></H2>
                        <ThemePlayground />
                        <Code file="theming.css">{`
/* ── Design token layer ── */
:root {
  /* Primitives — nilai absolut */
  --blue-500: #6366f1;
  --green-500: #22c55e;
  --neutral-900: #111827;
  --neutral-100: #f9fafb;

  /* Semantic tokens — nama berdasarkan fungsi */
  --color-bg:        var(--neutral-100);
  --color-text:      var(--neutral-900);
  --color-primary:   var(--blue-500);
  --color-surface:   #ffffff;
  --radius-card:     12px;
}

/* Dark theme — hanya ubah semantic tokens */
[data-theme="dark"] {
  --color-bg:      #0a0a0a;
  --color-text:    #fafafa;
  --color-surface: #1a1a1a;
  /* --color-primary tidak berubah — masih biru */
}

/* ── Component layer — hanya pakai semantic tokens ── */
.card {
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: var(--radius-card);
}

/* Theme switch via JS */
document.documentElement.setAttribute('data-theme', 'dark')
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
                        <H2>Custom Properties di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
                        <Code file="custom-props-tw.tsx">{`
import { tw } from "tailwind-styled-v4"

// Komponen yang menerima custom property dari luar
const Card = tw.div({
  base: "rounded-xl p-4 border bg-[var(--card-bg,white)] text-[var(--card-text,#111)]",
})

// Inject via style prop di usage
<Card style={{ '--card-bg': '#1a1a2e', '--card-text': '#e0e0ff' } as React.CSSProperties}>
  Content
</Card>

// Token-based system
const tokens = {
  primary: "#6366f1",
  surface: "#ffffff",
  text:    "#111827",
}

// Set global tokens di layout
export default function Layout({ children }) {
  return (
    <html style={{
      '--color-primary': tokens.primary,
      '--color-surface': tokens.surface,
      '--color-text':    tokens.text,
    } as React.CSSProperties}>
      <body>{children}</body>
    </html>
  )
}

// Komponen menggunakan token
const Button = tw.button({
  base: "px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white",
})
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="exercise" onClick={() => setActiveSection("exercise")}>
                        <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Design token system</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat sistem design token dengan dua layer: primitives (<IC>--blue-500</IC>, <IC>--gray-100</IC>, dll) dan semantic tokens (<IC>--color-primary</IC>, <IC>--color-bg</IC>, dll).</p>
                                <p>Buat dark mode dengan hanya mengubah semantic tokens di <IC>[data-theme="dark"]</IC>.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — @property animation</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat progress bar animasi menggunakan <IC>@property</IC> untuk mendaftarkan <IC>--progress</IC> sebagai <IC>{'<percentage>'}</IC>.</p>
                                <p>Animasikan dari 0% ke 100% menggunakan <IC>transition</IC> saat hover dan <IC>@keyframes</IC> untuk loop otomatis.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/medium/selectors-specificity" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>Selectors & Specificity</NavBtn.label></NavBtn>
                        <NavBtn href="/learn/medium/typography" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>Typography</NavBtn.label></NavBtn>
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
