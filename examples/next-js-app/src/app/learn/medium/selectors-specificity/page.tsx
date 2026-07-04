/**
 * CSS Medium — Selectors & Specificity
 */
"use client"
import { useState } from "react"
import {
    Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
    PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
    CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
    PlaygroundWrap, Chip, ChipRow,
    SpecificityScore, SelectorDemo, DemoTarget,
} from "./styles"

const TOC = [
    { id: "selector-types", label: "Jenis-jenis Selector" },
    { id: "attribute", label: "Attribute Selectors" },
    { id: "pseudo-class", label: "Pseudo-class" },
    { id: "pseudo-element", label: "Pseudo-element" },
    { id: "combinator", label: "Combinators" },
    { id: "functional", label: ":is() :where() :has() :not()" },
    { id: "specificity", label: "Specificity" },
    { id: "cascade", label: "Cascade & Inheritance" },
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

type PseudoState = "default" | "hover" | "focus" | "active" | "checked"

function PseudoClassPlayground() {
    const [state, setState] = useState<PseudoState>("hover")
    const desc: Record<PseudoState, string> = {
        default: "Tidak ada pseudo-class — elemen dalam state normal.",
        hover: ":hover — kursor di atas elemen. Di touch device, triggered saat tap.",
        focus: ":focus — elemen mendapat keyboard focus (tab, click, programmatic). Penting untuk aksesibilitas.",
        active: ":active — elemen sedang ditekan (mouse down / touch start). Sangat singkat.",
        checked: ":checked — checkbox/radio yang dicentang, atau option yang dipilih di select.",
    }
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 Pseudo-class state simulator</PlaygroundWrap.label>
                <ChipRow>
                    {(["default", "hover", "focus", "active", "checked"] as PseudoState[]).map(v => (
                        <Chip key={v} active={state === v} onClick={() => setState(v)}>{v}</Chip>
                    ))}
                </ChipRow>
                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{desc[state]}</p>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <DemoTarget state={state}>
                    {state === "default" ? "Elemen normal" : `Simulasi :${state}`}
                </DemoTarget>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {state === "default" ? ".element { /* no pseudo */ }" : `.element:${state} { /* styles */ }`}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

type SpecLevel = "inline" | "id" | "class" | "element"

function SpecificityPlayground() {
    const [selected, setSelected] = useState<number>(2)
    const examples = [
        { selector: "*", score: "0,0,0", label: "Universal — nol specificity", level: "element" as SpecLevel },
        { selector: "p", score: "0,0,1", label: "Type selector — 0,0,1", level: "element" as SpecLevel },
        { selector: ".card", score: "0,1,0", label: "Class selector — 0,1,0", level: "class" as SpecLevel },
        { selector: "#header", score: "1,0,0", label: "ID selector — 1,0,0", level: "id" as SpecLevel },
        { selector: "style=''", score: "1,0,0,0", label: "Inline style — 1,0,0,0", level: "inline" as SpecLevel },
        { selector: "p.card", score: "0,1,1", label: "Type + Class — 0,1,1", level: "class" as SpecLevel },
        { selector: "div > p.card:hover", score: "0,2,2", label: "Complex — 0,2,2", level: "class" as SpecLevel },
        { selector: ":is(h1, h2)", score: "0,0,1", label: ":is() — ambil specificity tertinggi arg-nya", level: "element" as SpecLevel },
        { selector: ":where(h1, h2)", score: "0,0,0", label: ":where() — selalu 0 specificity", level: "element" as SpecLevel },
    ]
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎛 Specificity calculator</PlaygroundWrap.label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {examples.map((ex, i) => (
                        <Chip key={ex.selector} active={selected === i} onClick={() => setSelected(i)}>
                            {ex.selector}
                        </Chip>
                    ))}
                </div>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas className="flex items-center justify-center gap-4 flex-wrap">
                <code className="text-lg font-bold font-mono">{examples[selected].selector}</code>
                <SpecificityScore level={examples[selected].level}>
                    {examples[selected].score}
                </SpecificityScore>
                <p className="text-sm text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">{examples[selected].label}</p>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{`/* Specificity: ${examples[selected].score} — format: inline,id,class/attr/pseudo-class,element/pseudo-element */`}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

export default function SelectorsPage() {
    const [activeSection, setActiveSection] = useState("selector-types")
    return (
        <Page>
            <TopBar><TopBarInner>
                <Breadcrumb>
                    <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.link href="/learn/medium">Medium</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.curr>Selectors & Specificity</Breadcrumb.curr>
                </Breadcrumb>
            </TopBarInner></TopBar>
            <Body>
                <Content>
                    <PageTitle>Selectors & Specificity</PageTitle>
                    <PageDesc>Semua jenis CSS selector, cara kerja specificity, cascade, dan inheritance — fondasi untuk menulis CSS yang predictable dan maintainable.</PageDesc>

                    <Section id="selector-types" onClick={() => setActiveSection("selector-types")}>
                        <H2>Jenis-jenis Selector<H2.anchor href="#selector-types">#</H2.anchor></H2>
                        <P>CSS punya berbagai jenis selector yang mengontrol <em>elemen mana</em> yang mendapat style.</P>
                        <div className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5">
                            {[
                                { type: "Universal", ex: "*", desc: "Pilih semua elemen. Specificity: 0,0,0" },
                                { type: "Type", ex: "p, h1, div", desc: "Pilih berdasarkan tag HTML. Specificity: 0,0,1 per element" },
                                { type: "Class", ex: ".card, .btn", desc: "Pilih berdasarkan class attribute. Specificity: 0,1,0" },
                                { type: "ID", ex: "#header, #nav", desc: "Pilih berdasarkan id attribute. Specificity: 1,0,0 — hindari untuk styling" },
                                { type: "Attribute", ex: "[type='text']", desc: "Pilih berdasarkan attribute. Specificity: 0,1,0" },
                                { type: "Pseudo-class", ex: ":hover, :focus", desc: "Pilih berdasarkan state. Specificity: 0,1,0" },
                                { type: "Pseudo-element", ex: "::before, ::after", desc: "Pilih bagian virtual elemen. Specificity: 0,0,1" },
                            ].map(({ type, ex, desc }) => (
                                <div key={type} className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0 items-center text-sm">
                                    <span className="font-semibold text-xs">{type}</span>
                                    <IC>{ex}</IC>
                                    <span className="text-xs text-[color-mix(in_srgb,var(--foreground)_60%,transparent)]">{desc}</span>
                                </div>
                            ))}
                        </div>
                    </Section>
                    <Divider />

                    <Section id="attribute" onClick={() => setActiveSection("attribute")}>
                        <H2>Attribute Selectors<H2.anchor href="#attribute">#</H2.anchor></H2>
                        <P>Selector yang sangat powerful — pilih elemen berdasarkan keberadaan atau nilai attribute HTML.</P>
                        <Code file="attribute-selectors.css">{`
/* Keberadaan attribute */
[disabled]              /* punya attribute disabled (apapun nilainya) */
[type]                  /* punya attribute type */

/* Nilai exact */
[type="text"]           /* type persis "text" */
[lang="en"]

/* Nilai partial */
[class~="card"]         /* class mengandung kata "card" (space-separated) */
[href|="https"]         /* href dimulai dengan "https" lalu "-" atau persis "https" */
[href^="https"]         /* href dimulai dengan "https" */
[href$=".pdf"]          /* href diakhiri dengan ".pdf" */
[class*="btn"]          /* class mengandung "btn" di mana saja */

/* Case insensitive */
[type="EMAIL" i]        /* = type="email", case tidak diperhitungkan */

/* Kombinasi */
input[type="text"][required]   /* input type text yang juga required */
a[href^="https"][target="_blank"] /* link external */
            `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>Attribute selector berguna untuk styling form inputs tanpa menambahkan class — <IC>input[type="checkbox"]</IC>, <IC>input[required]</IC>, <IC>a[href^="mailto"]</IC>. Lebih semantik dan mengurangi clutter di HTML.</Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="pseudo-class" onClick={() => setActiveSection("pseudo-class")}>
                        <H2>Pseudo-class<H2.anchor href="#pseudo-class">#</H2.anchor></H2>
                        <P>Pseudo-class merespons <em>state</em> elemen — kondisi yang tidak selalu ada di DOM tapi bisa berubah saat interaksi atau struktur dokumen.</P>
                        <PseudoClassPlayground />
                        <Code file="pseudo-classes.css">{`
/* ── User action ── */
:hover          /* kursor di atas */
:focus          /* keyboard focus — PENTING untuk aksesibilitas */
:focus-visible  /* focus HANYA saat keyboard (tidak saat click) — lebih baik dari :focus untuk ring */
:focus-within   /* elemen atau descendant-nya punya focus */
:active         /* sedang ditekan */

/* ── Form state ── */
:checked        /* checkbox/radio dicentang */
:disabled       /* form element disabled */
:enabled        /* form element enabled */
:required       /* input yang punya required attribute */
:optional       /* input tanpa required */
:valid          /* nilai form valid */
:invalid        /* nilai form invalid */
:placeholder-shown  /* placeholder sedang ditampilkan (input kosong) */
:read-only      /* input dengan readonly attribute */
:in-range / :out-of-range  /* nilai dalam/luar min-max range */

/* ── Tree structural ── */
:first-child    /* anak pertama parent */
:last-child     /* anak terakhir parent */
:nth-child(n)   /* anak ke-n (1-indexed). Formula: 2n+1 = ganjil, 2n = genap */
:nth-last-child(n) /* dari belakang */
:only-child     /* satu-satunya anak */
:first-of-type  /* elemen pertama dari tipe ini dalam parent */
:last-of-type
:nth-of-type(n)
:only-of-type
:empty          /* tidak punya children (termasuk text nodes) */

/* ── Other ── */
:root           /* root element (<html>) — untuk CSS variables */
:target         /* elemen yang ID-nya match dengan URL hash */
:lang(en)       /* elemen dengan lang attribute tertentu */
:not(.active)   /* negasi — tidak memiliki class active */
:is(h1, h2, h3) /* shorthand untuk multiple selectors */
:where(h1, h2)  /* seperti :is() tapi specificity = 0 */
:has(img)       /* parent selector — punya descendant img */

/* ── Form state modern (perlu user interaction) ── */
:user-valid     /* valid DAN user sudah berinteraksi (bukan saat load) */
:user-invalid   /* invalid DAN user sudah berinteraksi */
:autofill       /* input yang diisi oleh browser autofill */
:indeterminate  /* checkbox indeterminate (via JS), radio tanpa selection */

/* ── UI state ── */
:any-link       /* semua link (:link + :visited) */
:local-link     /* link ke halaman yang sama */
:popover-open   /* popover yang sedang terbuka */
:modal          /* elemen dalam modal state (dialog[open], ::backdrop) */
:fullscreen     /* elemen dalam fullscreen mode */
:picture-in-picture /* video dalam PiP mode */
:defined        /* custom element yang sudah di-define() */
:blank          /* input atau textarea yang kosong */
:scope          /* root dari context saat ini (di @scope = scope root) */

/* ── Media element state ── */
:playing        /* video/audio yang sedang play */
:paused         /* video/audio yang sedang pause */
:buffering      /* sedang buffering */
:muted          /* di-mute */
:seeking        /* sedang seek (fast-forward/rewind) */
:stalled        /* data tidak tersedia, akan stall */
:volume-locked  /* volume dikunci oleh device */

/* ── :nth-child of selector (modern syntax) ── */
/* :nth-child(An+B of S) — nth-child yang match selector S */
li:nth-child(2 of .highlighted) { }  /* li ke-2 yang juga .highlighted */
tr:nth-child(odd of .selected)  { }  /* baris ganjil dari yang selected */
/* Berbeda dari li.highlighted:nth-child(2) — itu nth dari semua siblings */
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="pseudo-element" onClick={() => setActiveSection("pseudo-element")}>
                        <H2>Pseudo-element<H2.anchor href="#pseudo-element">#</H2.anchor></H2>
                        <P>Pseudo-element membuat "elemen virtual" yang tidak ada di DOM tapi bisa di-style. Menggunakan sintaks <IC>::double-colon</IC> (CSS3), tapi <IC>:single-colon</IC> masih bekerja untuk backward compat.</P>
                        <Code file="pseudo-elements.css">{`
/* ── Content generation ── */
::before        /* virtual element sebelum konten — butuh content: '' */
::after         /* virtual element setelah konten */

.badge::after {
  content: " ✓";    /* teks literal */
  content: attr(data-count); /* nilai dari attribute */
  content: "";       /* kosong — untuk shape/dekorasi */
}

/* ── Text selection ── */
::selection     /* teks yang sedang di-highlight user */
::selection { background: #6366f1; color: white; }

/* ── Placeholder ── */
::placeholder   /* placeholder text di input */
input::placeholder { color: #9ca3af; font-style: italic; }

/* ── Marker ── */
::marker        /* bullet point / angka di list item */
li::marker { color: #6366f1; font-weight: bold; }

/* ── Scrollbar ── */
::-webkit-scrollbar        { width: 8px; }
::-webkit-scrollbar-track  { background: #f1f1f1; }
::-webkit-scrollbar-thumb  { background: #888; border-radius: 4px; }

/* ── First letter/line ── */
::first-letter  /* huruf pertama block element */
::first-line    /* baris pertama block element */

/* ── Modern ── */
::backdrop      /* backdrop di belakang dialog/fullscreen element */
::file-selector-button  /* tombol "Choose File" di input[type=file] */

/* ── Web Components ── */
::part(name)    /* element dalam shadow DOM yang di-export via part attribute */
::slotted(*)    /* element yang di-slot ke dalam shadow DOM */

/* ── Text highlights ── */
::selection     /* teks yang di-highlight user */
::target-text   /* teks yang di-highlight via URL fragment (#text) */
::highlight(custom-name)  /* custom highlight via CSS Highlight API */
::spelling-error  /* teks yang ditandai salah eja oleh browser */
::grammar-error   /* teks yang ditandai salah tata bahasa */

/* ── View transitions ── */
::view-transition        /* overlay untuk view transition */
::view-transition-image-pair(name)
::view-transition-old(name)    /* screenshot sebelum transisi */
::view-transition-new(name)    /* screenshot sesudah transisi */

/* ── Media / Dialog ── */
::cue           /* subtitle cue di dalam <track> / WebVTT */
::cue-region    /* region subtitle */

/* ── Details / Summary ── */
::details-content  /* konten di dalam <details> saat open */
            `}</Code>
                        <Callout type="php">
                            <Callout.icon>🐘</Callout.icon>
                            <Callout.content>
                                <Callout.title>Analogi PHP</Callout.title>
                                <IC>::before</IC> dan <IC>::after</IC> seperti <IC>ob_start()</IC> yang menambahkan konten
                                sebelum/sesudah output fungsi — tidak ada di source, tapi muncul di hasil render.
                                <IC>content: attr(data-x)</IC> seperti membaca <IC>{'$element->getAttribute(\'data-x\')'}</IC>.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="combinator" onClick={() => setActiveSection("combinator")}>
                        <H2>Combinators<H2.anchor href="#combinator">#</H2.anchor></H2>
                        <P>Combinator menghubungkan dua selector dan mendefinisikan <em>hubungan struktural</em> antara keduanya.</P>
                        <Code file="combinators.css">{`
/* Descendant ( ) — semua keturunan */
.card p { }         /* semua <p> di dalam .card, di level apapun */

/* Child (>) — anak langsung saja */
.nav > li { }       /* hanya <li> langsung anak .nav */

/* Adjacent sibling (+) — saudara langsung berikutnya */
h2 + p { }          /* <p> yang langsung setelah <h2> */
input:checked + label { }  /* label setelah checked input */

/* General sibling (~) — semua saudara berikutnya */
h2 ~ p { }          /* semua <p> setelah <h2> yang sesaudara */

/* Column combinator (||) — untuk grid/table — masih eksperimental */
col.selected || td { }

/* CSS Nesting (modern) */
.card {
  padding: 1rem;
  & h2 { font-size: 1.25rem; }  /* = .card h2 */
  & > p { color: gray; }         /* = .card > p */
  &:hover { box-shadow: ...; }   /* = .card:hover */
  @media (min-width: 768px) { padding: 2rem; }
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="functional" onClick={() => setActiveSection("functional")}>
                        <H2>:is() :where() :has() :not()<H2.anchor href="#functional">#</H2.anchor></H2>
                        <P>Empat functional pseudo-class modern yang drastis menyederhanakan penulisan selector kompleks.</P>
                        <Code file="functional-pseudos.css">{`
/* :is() — shorthand multiple selectors, ambil specificity tertinggi */
:is(h1, h2, h3, h4) { margin-block: 1rem; }
/* = h1, h2, h3, h4 { margin-block: 1rem } */
/* specificity = specificity selector paling spesifik di dalamnya */

:is(.article, .blog-post) h2 { }
/* = .article h2, .blog-post h2 { } */

/* :where() — sama dengan :is() tapi ALWAYS specificity 0 */
:where(h1, h2, h3) { font-weight: bold; }
/* Berguna untuk reset/base styles yang mudah di-override */

/* :not() — negasi, bisa multiple argumen (Level 4) */
p:not(.note) { }           /* p yang tidak punya class note */
:not(p, span, a) { }       /* bukan p, span, atau a */
li:not(:last-child) { margin-bottom: 0.5rem; } /* semua li kecuali terakhir */

/* :has() — parent/relational selector — BARU, sangat powerful */
/* "pilih elemen yang PUNYA ..." */
.card:has(img) { }             /* card yang punya gambar */
form:has(:invalid) { }         /* form yang punya input invalid */
.section:has(> h2) { }         /* section yang anak langsungnya h2 */
li:has(+ li) { }               /* li yang diikuti li lain (bukan last) */

/* Kombinasi */
:is(article, section):has(h2) > p:not(.intro) { }
/* "paragraph bukan .intro dalam article/section yang punya h2" */
            `}</Code>
                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>:has() — browser support</Callout.title>
                                <IC>:has()</IC> sudah Baseline dan didukung semua browser modern (Chrome 105+, Firefox 121+, Safari 15.4+).
                                Ini adalah salah satu fitur CSS paling transformatif dalam dekade terakhir — "parent selector" yang sudah lama diminta developer.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="specificity" onClick={() => setActiveSection("specificity")}>
                        <H2>Specificity<H2.anchor href="#specificity">#</H2.anchor></H2>
                        <P>Specificity adalah "berat" sebuah selector — browser pakai ini untuk memutuskan rule mana yang menang saat ada konflik. Format: <IC>(inline, id, class/attr/pseudo-class, element/pseudo-element)</IC>.</P>
                        <SpecificityPlayground />
                        <Code file="specificity.css">{`
/* Urutan specificity (dari tinggi ke rendah): */
/* 1. !important (darurat, hindari) */
/* 2. Inline style: style="..." → 1,0,0,0 */
/* 3. ID selector: #id           → 0,1,0,0 */
/* 4. Class/attr/pseudo-class    → 0,0,1,0 */
/* 5. Element/pseudo-element     → 0,0,0,1 */
/* 6. Universal/combinators      → 0,0,0,0 */

/* Perbandingan */
#nav .item:hover    /* 0,1,1,0 */
.nav .item.active   /* 0,2,0   — menang atas yang di atas? TIDAK — id beats class */
/* ID (1,0,0) > 100 class (0,100,0) — tidak bisa di-override dengan class */

/* :is(), :not(), :has() ambil specificity TERTINGGI dari argumennya */
:is(#id, .class) { } /* specificity = 1,0,0 (dari #id) */

/* :where() selalu specificity 0 */
:where(#id, .class) { } /* specificity = 0,0,0 */

/* Cara menghindari specificity wars: */
/* 1. Pakai :where() untuk base styles */
/* 2. Hindari ID selector untuk styling */
/* 3. Pakai @layer untuk kontrol specificity tanpa meningkatkan selector */
/* 4. BEM atau utility-first untuk flat specificity */
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="cascade" onClick={() => setActiveSection("cascade")}>
                        <H2>Cascade & Inheritance<H2.anchor href="#cascade">#</H2.anchor></H2>
                        <P>Cascade adalah algoritma browser untuk menentukan nilai akhir setiap property. Bukan hanya tentang specificity — ada beberapa faktor yang mempengaruhi.</P>
                        <Code file="cascade.css">{`
/* Urutan algoritma cascade (dari paling kuat ke paling lemah): */
/* 1. !important dari user agent (browser) */
/* 2. !important dari user (pengunjung, aksesibilitas settings) */
/* 3. !important dari author (CSS yang kita tulis) */
/* 4. @layer author (tanpa !important) */
/* 5. Inline styles */
/* 6. CSS rules — dibandingkan via specificity */
/* 7. Urutan source (rule terakhir menang jika specificity sama) */
/* 8. CSS inheritance */
/* 9. Browser default (user agent stylesheet) */

/* Inheritance — properti yang diwariskan ke children secara default: */
/* color, font-*, line-height, text-*, list-style, visibility, cursor */

/* Properti yang TIDAK diwariskan: */
/* margin, padding, border, background, width, height, display, position */

/* Override inheritance */
.child {
  color: inherit;     /* paksa inherit dari parent */
  color: initial;     /* reset ke browser default */
  color: unset;       /* inherit jika property inheritable, else initial */
  color: revert;      /* kembalikan ke browser default (lebih spesifik dari initial) */
  color: revert-layer; /* kembalikan ke @layer sebelumnya */
}

/* all shorthand — reset semua properties sekaligus */
.reset { all: unset; }   /* berguna untuk reset komponen */
.reset { all: revert; }  /* kembalikan ke browser default */
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
                        <H2>Selectors di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
                        <Code file="selectors-tw.tsx">{`
import { tw } from "tailwind-styled-v4"

// Pseudo-class via Tailwind modifiers
const Button = tw.button({
  base: \`
    px-4 py-2 rounded-lg bg-blue-600 text-white
    hover:bg-blue-700          /* :hover */
    focus-visible:ring-2       /* :focus-visible — lebih baik dari focus: untuk accessibility */
    focus-visible:ring-blue-400
    active:scale-95            /* :active */
    disabled:opacity-50        /* :disabled */
    disabled:cursor-not-allowed
  \`,
})

// :has() via arbitrary variant
const Card = tw.div({
  base: \`
    rounded-xl border p-4
    [&:has(img)]:pt-0          /* card yang punya img: hilangkan padding top */
    [&:has(input:invalid)]:border-red-400  /* card dengan invalid input */
  \`,
})

// :not() via arbitrary
const ListItem = tw.li({
  base: "py-2 [&:not(:last-child)]:border-b",
})

// ::before / ::after via arbitrary
const Divider = tw.div({
  base: \`
    flex items-center gap-4
    before:flex-1 before:h-px before:bg-gray-200
    after:flex-1 after:h-px after:bg-gray-200
  \`,
})

// nth-child via arbitrary
const TableRow = tw.tr({
  base: "odd:bg-gray-50 even:bg-white hover:bg-blue-50 transition-colors",
})

// Sibling combinator via group
const FormGroup = tw.div({
  base: "group",
  sub: {
    label: "block text-sm font-medium mb-1 group-focus-within:text-blue-600",
    input: "w-full border rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none",
  },
})
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="exercise" onClick={() => setActiveSection("exercise")}>
                        <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Form styling tanpa class</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Style sebuah form hanya menggunakan attribute selectors dan pseudo-classes — tanpa menambahkan class apapun ke HTML.</p>
                                <p>Target: <IC>input[required]</IC> punya border merah, <IC>input:valid</IC> border hijau, <IC>input:placeholder-shown</IC> punya background berbeda.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — :has() untuk card adaptif</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat komponen <IC>Card</IC> yang layout-nya berubah otomatis: kalau ada <IC>img</IC> di dalamnya → layout horizontal. Kalau tidak ada → layout vertikal biasa.</p>
                                <p>Implementasikan dengan <IC>:has(img)</IC> tanpa prop tambahan.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Specificity debug</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Diberikan CSS berikut — tentukan warna teks akhir element: <IC>{'<p id="main" class="text intro">'}</IC></p>
                                <p><IC>#main {'{ color: red }'}</IC> vs <IC>.text.intro {'{ color: blue }'}</IC> vs <IC>p.intro {'{ color: green }'}</IC></p>
                                <p>Hitung specificity masing-masing dan jelaskan mengapa yang menang.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/medium" dir="prev"><NavBtn.hint>← Back</NavBtn.hint><NavBtn.label>Medium Overview</NavBtn.label></NavBtn>
                        <NavBtn href="/learn/medium/custom-properties" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>Custom Properties</NavBtn.label></NavBtn>
                    </PageNav>
                </Content>
                <Toc>
                    <TocLabel>On this page</TocLabel>
                    {TOC.map(item => (
                        <TocItem key={item.id} href={`#${item.id}`} active={activeSection === item.id} onClick={() => setActiveSection(item.id)}>{item.label}</TocItem>
                    ))}
                </Toc>
            </Body>
        </Page>
    )
}
