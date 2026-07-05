/**
 * CSS High — CSS Architecture Patterns
 */
"use client"
import { useState } from "react"
import {
  Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
  PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
  CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
  PlaygroundWrap, Chip, ChipRow, CodePre,
  MethodCard, MethodGrid, TokenRow, TokenItem, TokenItemBadge,
  CompareTable, CompareRow, CompareTh, CompareTd,
} from "./styles"

const TOC = [
  { id: "bem", label: "BEM" },
  { id: "cube", label: "CUBE CSS" },
  { id: "utility-first", label: "Utility-First CSS" },
  { id: "design-tokens", label: "Design Tokens" },
  { id: "css-modules", label: "CSS Modules" },
  { id: "component-scoped", label: "Component-Scoped CSS" },
  { id: "naming", label: "Naming Strategies" },
  { id: "monorepo", label: "Scalable CSS di Monorepo" },
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

type ArchTab = "bem" | "cube" | "utility" | "tokens"
function ArchComparison() {
  const [tab, setTab] = useState<ArchTab>("bem")
  const examples: Record<ArchTab, string> = {
    bem: `.card { }                    /* Block */
.card__title { }             /* Element */
.card__title--large { }      /* Modifier */
.card--featured { }          /* Block modifier */
.card__btn--disabled { }     /* Element modifier */

/* Kelemahan BEM */
.card__header__avatar__image { } /* terlalu dalam */
.card--large--dark--featured { } /* modifier explosion */`,
    cube: `/* CUBE: Composition Utility Block Exception */

/* C — Composition: layout primitives */
.stack > * + * { margin-top: var(--space, 1rem); }
.cluster { display: flex; flex-wrap: wrap; gap: var(--space, 1rem); }

/* U — Utility: single-purpose classes */
.text-center { text-align: center; }
.mt-auto { margin-top: auto; }

/* B — Block: component-level styles */
.card { background: var(--color-surface); border-radius: var(--radius); }

/* E — Exception: contextual overrides */
.card[data-variant="featured"] { background: var(--color-primary); }`,
    utility: `<!-- Utility-first (Tailwind approach) -->
<div class="flex flex-col gap-4 p-6 rounded-xl bg-white shadow-md
            border border-gray-200 hover:shadow-lg transition-shadow">
  <h2 class="text-xl font-bold text-gray-900">Card Title</h2>
  <p class="text-sm text-gray-600 leading-relaxed">Content</p>
  <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg
                 hover:bg-indigo-700 transition-colors font-medium">
    Action
  </button>
</div>`,
    tokens: `/* Design Token layers */
:root {
  /* Primitive tokens — raw values */
  --blue-500: #6366f1;
  --gray-100: #f9fafb;
  --space-4: 1rem;

  /* Semantic tokens — functional names */
  --color-primary:   var(--blue-500);
  --color-surface:   var(--gray-100);
  --space-component: var(--space-4);

  /* Component tokens — scoped */
  --card-bg:      var(--color-surface);
  --card-padding: var(--space-component);
  --card-radius:  0.75rem;
}`,
  }
  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>📐 CSS Architecture — perbandingan pendekatan</PlaygroundWrap.label>
        <ChipRow>
          {(["bem", "cube", "utility", "tokens"] as ArchTab[]).map(t => (
            <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Chip>
          ))}
        </ChipRow>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas>
        <CodePre>{examples[tab]}</CodePre>
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>{`Metodologi: ${tab.toUpperCase()}`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

export default function CssArchitecturePatternsPage() {
  const [activeSection, setActiveSection] = useState("bem")
  return (
    <Page>
      <TopBar><TopBarInner>
        <Breadcrumb>
          <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.link href="/learn/high">High</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.curr>CSS Architecture Patterns</Breadcrumb.curr>
        </Breadcrumb>
      </TopBarInner></TopBar>
      <Body>
        <Content>
          <PageTitle>CSS Architecture Patterns</PageTitle>
          <PageDesc>BEM, CUBE CSS, utility-first, design tokens, CSS Modules, component-scoped styles, naming strategies, dan scalable CSS di monorepo.</PageDesc>

          <Section id="bem" onClick={() => setActiveSection("bem")}>
            <H2>BEM — Block Element Modifier<H2.anchor href="#bem">#</H2.anchor></H2>
            <P>BEM adalah naming convention yang memisahkan HTML structure menjadi Block (komponen mandiri), Element (bagian dari block), dan Modifier (variasi/state).</P>
            <ArchComparison />
            <Code file="bem.css">{`
/* Block — komponen mandiri */
.card { }
.nav { }
.form { }

/* Element — bagian dari block, gunakan __ */
.card__title { }
.card__body { }
.card__footer { }
.nav__item { }
.nav__link { }
.form__label { }
.form__input { }

/* Modifier — variasi atau state, gunakan -- */
.card--featured { background: var(--color-primary); }
.card--compact  { padding: 0.5rem; }
.nav__item--active { font-weight: bold; }
.form__input--error { border-color: red; }
.button--disabled { opacity: 0.5; pointer-events: none; }

/* ❌ Kelemahan BEM */
.card__content__header__avatar { }        /* nesting terlalu dalam */
.card--dark--large--rounded { }          /* banyak modifier */
.card__button { }  /* atau .button di dalam .card? */

/* ✅ Solusi: flatten, gunakan modifier state */
.card { }
.card__header { }    /* flattened, tidak .card__body__header */
.card[data-state="loading"] { }  /* state via data attribute */
            `}</Code>
          </Section>
          <Divider />

          <Section id="cube" onClick={() => setActiveSection("cube")}>
            <H2>CUBE CSS<H2.anchor href="#cube">#</H2.anchor></H2>
            <P>CUBE CSS (Composition Utility Block Exception) adalah metodologi yang memanfaatkan cascade dan inheritance CSS — bukan melawannya.</P>
            <Code file="cube.css">{`
/* ── C: Composition — layout primitives ──────────────── */
/* Flexible layout system yang bisa dikonfigurasi */
.stack {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.stack > * + * {
  margin-block-start: var(--space, var(--space-s-m));
}

.cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space, var(--space-s));
  justify-content: var(--justify, flex-start);
  align-items: var(--align, center);
}

.grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill, minmax(min(var(--min-size, 16rem), 100%), 1fr)
  );
  gap: var(--space, var(--space-s-m));
}

/* ── U: Utility — single-purpose ──────────────────────── */
.visually-hidden {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

/* ── B: Block — component styles ──────────────────────── */
.card {
  padding: var(--card-padding, var(--space-s-m));
  background: var(--card-bg, var(--color-surface));
  border-radius: var(--card-radius, var(--radius-m));
  color: var(--card-color, var(--color-text));
}

/* ── E: Exception — contextual override ───────────────── */
.card[data-variant="inverted"] {
  --card-bg: var(--color-dark);
  --card-color: var(--color-light);
}
            `}</Code>
          </Section>
          <Divider />

          <Section id="utility-first" onClick={() => setActiveSection("utility-first")}>
            <H2>Utility-First CSS<H2.anchor href="#utility-first">#</H2.anchor></H2>
            <Code file="utility-first.css">{`
/* Utility-first: compose tampilan dari class kecil-kecil */
/* Pros: */
/* - Zero dead CSS — hanya yang dipakai yang masuk bundle */
/* - Tidak perlu nama class — eliminasi "naming fatigue" */
/* - Konsisten — semua pakai design system yang sama */
/* - Responsive mudah — sm:, md:, lg: prefix */

/* Cons: */
/* - HTML bisa panjang/verbose */
/* - Sulit baca intent dari class saja */
/* - Butuh @apply atau komponen abstraction untuk reuse */

/* @apply — extract utility ke component class */
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
}
.btn-primary {
  @apply bg-indigo-600 text-white hover:bg-indigo-700;
}

/* Kapan utility-first bagus: */
/* ✅ Rapid prototyping */
/* ✅ Satu-kali styles (landing pages, marketing) */
/* ✅ Tim yang sudah familiar dengan framework (Tailwind) */

/* Kapan butuh abstraksi: */
/* ✅ Komponen yang dipakai >3 kali */
/* ✅ Design system component library */
/* ✅ Animasi dan state kompleks */
            `}</Code>
          </Section>
          <Divider />

          <Section id="design-tokens" onClick={() => setActiveSection("design-tokens")}>
            <H2>Design Tokens<H2.anchor href="#design-tokens">#</H2.anchor></H2>
            <P>Design tokens adalah nilai desain yang disimpan sebagai variabel — memungkinkan konsistensi antar platform dan mempermudah theming.</P>
            <TokenRow>
              <TokenItem layer="primitive"><TokenItemBadge layer="primitive">Primitive</TokenItemBadge><TokenItem.name>--blue-500</TokenItem.name><TokenItem.value>#6366f1</TokenItem.value></TokenItem>
              <TokenItem layer="primitive"><TokenItemBadge layer="primitive">Primitive</TokenItemBadge><TokenItem.name>--space-4</TokenItem.name><TokenItem.value>1rem</TokenItem.value></TokenItem>
              <TokenItem layer="semantic"><TokenItemBadge layer="semantic">Semantic</TokenItemBadge><TokenItem.name>--color-primary</TokenItem.name><TokenItem.value>var(--blue-500)</TokenItem.value></TokenItem>
              <TokenItem layer="semantic"><TokenItemBadge layer="semantic">Semantic</TokenItemBadge><TokenItem.name>--space-md</TokenItem.name><TokenItem.value>var(--space-4)</TokenItem.value></TokenItem>
              <TokenItem layer="component"><TokenItemBadge layer="component">Component</TokenItemBadge><TokenItem.name>--btn-bg</TokenItem.name><TokenItem.value>var(--color-primary)</TokenItem.value></TokenItem>
              <TokenItem layer="component"><TokenItemBadge layer="component">Component</TokenItemBadge><TokenItem.name>--card-padding</TokenItem.name><TokenItem.value>var(--space-md)</TokenItem.value></TokenItem>
            </TokenRow>
            <Code file="design-tokens.css">{`
/* Hirarki 3 layer: Primitive → Semantic → Component */

/* Layer 1: Primitive tokens — raw values, no meaning */
:root {
  --blue-50: #eef2ff; --blue-100: #e0e7ff; --blue-500: #6366f1;
  --gray-50: #f9fafb; --gray-900: #111827;
  --space-1: 0.25rem; --space-2: 0.5rem; --space-4: 1rem; --space-8: 2rem;
  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 16px;
  --font-sm: 0.875rem; --font-md: 1rem; --font-lg: 1.25rem;
}

/* Layer 2: Semantic tokens — meaningful names */
:root {
  --color-primary:   var(--blue-500);
  --color-bg:        var(--gray-50);
  --color-text:      var(--gray-900);
  --color-surface:   white;
  --space-component: var(--space-4);
  --radius-component: var(--radius-md);
}

/* Layer 3: Component tokens — scoped to component */
.card {
  --card-bg:      var(--color-surface);
  --card-padding: var(--space-component);
  --card-radius:  var(--radius-component);

  background:    var(--card-bg);
  padding:       var(--card-padding);
  border-radius: var(--card-radius);
}

/* Override per-variant hanya ubah component token */
.card--compact  { --card-padding: var(--space-2); }
.card--inverted { --card-bg: var(--color-primary); }
            `}</Code>
          </Section>
          <Divider />

          <Section id="css-modules" onClick={() => setActiveSection("css-modules")}>
            <H2>CSS Modules<H2.anchor href="#css-modules">#</H2.anchor></H2>
            <Code file="card.module.css">{`
/* card.module.css — semua class di-scope lokal secara otomatis */
.card { padding: 1rem; border-radius: 0.5rem; }
.title { font-size: 1.25rem; font-weight: bold; }
.body  { color: #555; font-size: 0.875rem; }

/* composes — inherit styles dari class lain */
.cardFeatured {
  composes: card;  /* inherit semua dari .card */
  background: indigo;
  color: white;
}

/* composes dari file lain */
.btn {
  composes: baseBtn from './buttons.module.css';
  background: indigo;
}

/* :global — escape local scope */
:global(.third-party-widget) { margin: 0; }
:global(body) { font-family: sans-serif; }
/* Atau dalam selector: */
.card :global(.markdown) h2 { font-size: 1.5rem; }
            `}</Code>
            <Code file="card.tsx">{`
// Penggunaan CSS Modules di React
import styles from './card.module.css'

function Card({ featured }) {
  return (
    <div className={featured ? styles.cardFeatured : styles.card}>
      <h2 className={styles.title}>Title</h2>
      <p className={styles.body}>Content</p>
    </div>
  )
}

// Multiple classes dengan clsx/cx
import cx from 'clsx'
<div className={cx(styles.card, featured && styles.cardFeatured, styles.rounded)} />

// CSS Modules + TypeScript — generate type declarations
// npx typed-css-modules '**/*.module.css'
// → card.module.css.d.ts dengan tipe untuk setiap class
            `}</Code>
          </Section>
          <Divider />

          <Section id="component-scoped" onClick={() => setActiveSection("component-scoped")}>
            <H2>Component-Scoped CSS<H2.anchor href="#component-scoped">#</H2.anchor></H2>
            <Code file="scoped.css">{`
/* @scope — native CSS scoping (modern browsers) */
@scope (.card) {
  /* Style hanya berlaku di dalam .card */
  h2 { font-size: 1.25rem; font-weight: bold; }
  p  { color: #666; }
  .badge { /* scope lokal, tidak konflik dengan .badge di luar */ }
}

/* @scope dengan lower boundary */
@scope (.card) to (.card__footer) {
  /* Hanya berlaku antara .card dan .card__footer */
  /* Tidak masuk ke dalam .card__footer dan di bawahnya */
  p { font-size: 0.875rem; }
}

/* Shadow DOM — strongest isolation (Web Components) */
customElements.define('my-card', class extends HTMLElement {
  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = \`
      <style>
        /* Style ini benar-benar terisolasi — tidak bocor keluar */
        :host { display: block; }
        h2 { color: indigo; }
      </style>
      <div><h2><slot name="title"></slot></h2></div>
    \`
  }
})
            `}</Code>
          </Section>
          <Divider />

          <Section id="naming" onClick={() => setActiveSection("naming")}>
            <H2>Naming Strategies<H2.anchor href="#naming">#</H2.anchor></H2>
            <CompareTable>
              <thead>
                <CompareRow>
                  <CompareTh>Convention</CompareTh>
                  <CompareTh>Contoh</CompareTh>
                  <CompareTh>Dipakai oleh</CompareTh>
                </CompareRow>
              </thead>
              <tbody>
                <CompareRow><CompareTd>kebab-case</CompareTd><CompareTd>.nav-item, .card-title</CompareTd><CompareTd>BEM, CUBE, vanilla CSS</CompareTd></CompareRow>
                <CompareRow><CompareTd>camelCase</CompareTd><CompareTd>.navItem, .cardTitle</CompareTd><CompareTd>CSS Modules, JS-in-CSS</CompareTd></CompareRow>
                <CompareRow><CompareTd>SUIT CSS</CompareTd><CompareTd>.ComponentName-descendant--modifier</CompareTd><CompareTd>Component libraries</CompareTd></CompareRow>
                <CompareRow><CompareTd>Utility prefix</CompareTd><CompareTd>.u-text-center, .l-grid</CompareTd><CompareTd>ITCSS, SMACSS</CompareTd></CompareRow>
                <CompareRow><CompareTd>Data attributes</CompareTd><CompareTd>[data-state="open"]</CompareTd><CompareTd>Modern, Radix UI, Headless</CompareTd></CompareRow>
              </tbody>
            </CompareTable>
          </Section>
          <Divider />

          <Section id="monorepo" onClick={() => setActiveSection("monorepo")}>
            <H2>Scalable CSS di Monorepo<H2.anchor href="#monorepo">#</H2.anchor></H2>
            <Code file="monorepo-css.md">{`
# CSS di Monorepo — strategi

## Struktur package
packages/
├── design-tokens/         # Token primitives + semantic
│   └── tokens.css         # :root { --* }
├── ui/                    # Component library
│   ├── button/
│   │   ├── styles.module.css
│   │   └── Button.tsx
│   └── card/
├── app-dashboard/         # App-specific styles
└── app-marketing/         # Different design language

## Sharing tokens
# design-tokens/package.json exports
{ "exports": { "./css": "./dist/tokens.css" } }

# Konsumsi di app
@import "@company/design-tokens/css";

## CSS bundling strategy
# Setiap package bundle CSS-nya sendiri
# App compose dengan @import atau CSS Modules
# Hindari global stylesheet antar packages

## Versioning
# Bump design-tokens → update semua consumer
# Gunakan CSS variable override untuk app-specific tweaks
# Jangan override primitive tokens — hanya semantic
            `}</Code>
          </Section>
          <Divider />

          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>Design Tokens + tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
            <Code file="tokens-tw.tsx">{`
import { tw } from "tailwind-styled-v4"

// Design token integration — tw component pakai semantic tokens
const Card = tw.div({
  base: [
    "bg-[var(--color-surface)] text-[var(--color-text)]",
    "rounded-[var(--radius-component)] p-[var(--space-component)]",
    "border border-[color-mix(in_srgb,var(--color-text)_10%,transparent)]",
  ].join(" "),
  variants: {
    variant: {
      default: "",
      featured: "bg-[var(--color-primary)] text-white",
      compact: "[--card-p:var(--space-2)] p-[var(--card-p)]",
    },
  },
  defaultVariants: { variant: "default" },
})

// tw + tokens — BEM-style variants lewat tw
const NavItem = tw.a({
  base: "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
  variants: {
    active: {
      true:  "bg-[var(--color-primary)] text-white font-semibold",
      false: "text-[var(--color-text-muted)] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]",
    },
  },
  defaultVariants: { active: false },
})
            `}</Code>
          </Section>
          <Divider />

          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — BEM ke CUBE refactor</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Ambil komponen card dengan naming BEM. Refactor menggunakan CUBE CSS — pisahkan composition (layout), utility (atomic), block (component), dan exception (variant data attribute). Bandingkan readability dan flexibility.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — 3-layer design token system</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat sistem token 3 layer untuk sebuah button component: primitives (<IC>--blue-500</IC>), semantic (<IC>--color-primary</IC>), dan component (<IC>--btn-bg</IC>). Implementasikan dark mode hanya dengan mengubah semantic layer.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — @scope isolation</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat dua komponen dengan class yang sama (<IC>.title</IC>, <IC>.badge</IC>) tapi tampilan berbeda. Gunakan <IC>@scope</IC> untuk isolasi agar tidak konflik. Verifikasi dengan lower boundary scope.</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          <PageNav>
            <NavBtn href="/learn/high/houdini" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>CSS Houdini</NavBtn.label></NavBtn>
            <NavBtn href="/learn/high/accessibility-css" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>Accessibility CSS</NavBtn.label></NavBtn>
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
