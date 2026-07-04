/**
 * CSS High — Accessibility CSS
 */
"use client"
import { useState } from "react"
import {
  Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
  PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
  CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
  PlaygroundWrap, Chip, ChipRow,
  FocusDemo, ContrastSwatch, ContrastGrid, WcagBadge,
  FocusPlaygroundControlsHint, FocusPlaygroundContainer, FocusPlaygroundColumn,
  FocusPlaygroundStatusBadge, ContrastSwatchBg, ContrastSwatchText,
  PositioningPlaygroundInfo, PositioningAnalogySwatch, PositioningPlaygroundDebug,
} from "./styles"

const TOC = [
  { id: "focus-visible", label: ":focus-visible vs :focus" },
  { id: "focus-ring", label: "Focus Ring Best Practices" },
  { id: "polymorphism", label: "Polymorphic Components" },
  { id: "contrast", label: "Color Contrast WCAG" },
  { id: "forced-colors", label: "Forced Colors / HCM" },
  { id: "reduced-motion", label: "prefers-reduced-motion" },
  { id: "prefers-contrast", label: "prefers-contrast" },
  { id: "sr-only", label: "Screen Reader Utilities" },
  { id: "aria-pseudo", label: ":aria-* Pseudo-classes" },
  { id: "display-none", label: "display:none & A11y Tree" },
  { id: "wcag22", label: "WCAG 2.2 Terbaru" },
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

function FocusPlayground() {
  // Wave 4 (Bugfix-10): Event type inference — no manual annotation needed!
  // Event handler types automatically inferred dari tw component
  const handleFocusDemoClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    console.log('Focus demo button clicked')
  }

  const handleFocusKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.code === 'Space') {
      console.log('Focus demo button activated via keyboard')
      e.preventDefault()
    }
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>⌨️ Focus Ring — coba Tab keyboard untuk melihat perbedaan</PlaygroundWrap.label>
        <FocusPlaygroundControlsHint>Klik tombol pertama dengan mouse (tidak ada ring), lalu Tab ke yang berikutnya (ring muncul dengan :focus-visible)</FocusPlaygroundControlsHint>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas>
        <FocusPlaygroundContainer>
          <FocusPlaygroundColumn>
            <FocusPlaygroundStatusBadge status="bad">❌ outline: none (bad)</FocusPlaygroundStatusBadge>
            {/* Wave 4: Type-safe event handler dengan inference */}
            <FocusDemo style="bad" onClick={handleFocusDemoClick} onKeyDown={handleFocusKeyDown}>Klik atau Tab sini</FocusDemo>
          </FocusPlaygroundColumn>
          <FocusPlaygroundColumn>
            <FocusPlaygroundStatusBadge status="good">✅ focus-visible ring</FocusPlaygroundStatusBadge>
            <FocusDemo style="good" onClick={handleFocusDemoClick} onKeyDown={handleFocusKeyDown}>Klik atau Tab sini</FocusDemo>
          </FocusPlaygroundColumn>
          <FocusPlaygroundColumn>
            <FocusPlaygroundStatusBadge status="custom">✅ custom outline</FocusPlaygroundStatusBadge>
            <FocusDemo style="custom" onClick={handleFocusDemoClick} onKeyDown={handleFocusKeyDown}>Klik atau Tab sini</FocusDemo>
          </FocusPlaygroundColumn>
        </FocusPlaygroundContainer>
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>:focus-visible hanya muncul saat navigasi keyboard, bukan mouse click</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

export default function AccessibilityCssPage() {
  const [activeSection, setActiveSection] = useState("focus-visible")
  return (
    <Page>
      <TopBar><TopBarInner>
        <Breadcrumb>
          <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.link href="/learn/high">High</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.curr>Accessibility CSS</Breadcrumb.curr>
        </Breadcrumb>
      </TopBarInner></TopBar>
      <Body>
        <Content>
          <PageTitle>Accessibility CSS</PageTitle>
          <PageDesc>:focus-visible, color contrast WCAG, forced colors, prefers-reduced-motion, screen reader utilities, :aria-* pseudo-classes, dan WCAG 2.2 terbaru.</PageDesc>

          <Section id="focus-visible" onClick={() => setActiveSection("focus-visible")}>
            <H2>:focus-visible vs :focus<H2.anchor href="#focus-visible">#</H2.anchor></H2>
            <P><IC>:focus</IC> muncul untuk semua input (mouse + keyboard). <IC>:focus-visible</IC> hanya muncul saat browser mendeteksi navigasi keyboard — memberikan UX yang lebih bersih tanpa mengorbankan aksesibilitas.</P>
            <FocusPlayground />
            <Code file="focus.css">{`
/* ❌ JANGAN ini — menghilangkan indikator fokus tanpa pengganti */
button:focus { outline: none; }  /* keyboard user tidak tahu fokusnya di mana */
*:focus { outline: none; }       /* sangat berbahaya */

/* ✅ Pakai :focus-visible */
button:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}
/* Mouse click: tidak ada outline (clean UI) */
/* Keyboard Tab: outline muncul (aksesibel) */

/* ✅ Best practice: hapus :focus, tambah :focus-visible */
:focus { outline: none; }                         /* reset default */
:focus-visible {                                  /* tambah custom */
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 2px;
}

/* ✅ Atau pakai :focus-within untuk parent */
.form-group:focus-within {
  background: rgba(99,102,241,0.05);
  border-color: var(--color-primary);
}
            `}</Code>
          </Section>
          <Divider />

          <Section id="focus-ring" onClick={() => setActiveSection("focus-ring")}>
            <H2>Focus Ring Best Practices<H2.anchor href="#focus-ring">#</H2.anchor></H2>
            <Code file="focus-ring.css">{`
/* ✅ Outline — bukan border (tidak menggeser layout) */
:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;  /* jarak dari elemen */
}

/* ✅ Kontras tinggi — WCAG 2.2: 3:1 minimum */
/* Warna outline harus kontras dengan background sekitarnya */

/* ✅ Jangan rely hanya pada warna — tambah shape change */
.btn:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
  box-shadow: 0 0 0 4px rgba(99,102,241,0.2);  /* double ring */
}

/* ✅ Inset focus untuk elemen dalam card */
.card-link:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: -2px;  /* inset */
  border-radius: inherit;
}

/* ✅ Skip link — akses cepat ke main content */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #6366f1;
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 9999;
}
.skip-link:focus { top: 0; }

/* ❌ Ini TIDAK OK meski ada pengganti via warna */
button:focus { outline: none; background: blue; }
/* Pengganti hanya warna = tidak cukup untuk color-blind users */
            `}</Code>
          </Section>
          <Divider />

          <Section id="polymorphism" onClick={() => setActiveSection("polymorphism")}>
            <H2>Polymorphic Components & Type Safety<H2.anchor href="#polymorphism">#</H2.anchor></H2>
            <P><IC>as</IC> prop memungkinkan komponen render dengan tag berbeda. Namun TypeScript tidak bisa narrow prop types berdasarkan <IC>as</IC> value — gunakan pattern khusus untuk tetap type-safe.</P>

            <H3>Pattern 1: Separate Components per Tag (Recommended)</H3>
            <P>Paling type-safe dan eksplisit — buat component terpisah untuk setiap tag HTML.</P>
            <Code file="polymorphism-pattern1.tsx">{`
// ✅ RECOMMENDED: Separate components per tag
export const LinkButton = tw.a\`
  px-4 py-2 rounded-lg font-medium border transition-all
  [&:hover]:border-accent
\`  // Type-safe: has href prop

export const ActionButton = tw.button\`
  px-4 py-2 rounded-lg font-medium border transition-all
  [&:hover]:border-accent
\`  // Type-safe: has onClick prop

// Usage
<LinkButton href="/docs">Link Button</LinkButton>
<ActionButton onClick={() => console.log('clicked')}>
  Action Button
</ActionButton>
            `}</Code>

            <H3>Pattern 2: Conditional Rendering with Type Guards</H3>
            <P>Render komponen berbeda berdasarkan prop union type — runtime check dengan type safety.</P>
            <Code file="polymorphism-pattern2.tsx">{`
// Type-safe union of component types
type ButtonLinkProps = 
  | { as: 'button'; onClick: () => void }
  | { as: 'a'; href: string }

export const ConditionalButton = (props: ButtonLinkProps) => {
  if (props.as === 'button') {
    return (
      <ActionButton onClick={props.onClick}>
        Click me
      </ActionButton>
    )
  }
  return (
    <LinkButton href={props.href}>
      Go to docs
    </LinkButton>
  )
}

// Usage — fully type-safe!
<ConditionalButton as="button" onClick={handleClick} />
<ConditionalButton as="a" href="/docs" />
            `}</Code>

            <P><strong>Catatan:</strong> Full polymorphism adalah limitasi TypeScript. Lihat <IC>docs/POLYMORPHISM_GUIDE.md</IC> untuk detail lengkap.</P>
          </Section>

          <Divider />

          <Section id="contrast" onClick={() => setActiveSection("contrast")}>
            <H2>Color Contrast — WCAG 2.1<H2.anchor href="#contrast">#</H2.anchor></H2>
            <P>Contrast ratio dihitung berdasarkan relative luminance. WCAG menetapkan minimum agar teks dapat dibaca oleh pengguna dengan gangguan penglihatan.</P>
            <ContrastGrid>
              <ContrastSwatch>
                <ContrastSwatchBg bg="white"><ContrastSwatchText textColor="gray-400">Teks abu terang di putih</ContrastSwatchText><WcagBadge level="fail">FAIL 2.9:1</WcagBadge></ContrastSwatchBg>
              </ContrastSwatch>
              <ContrastSwatch>
                <ContrastSwatchBg bg="white"><ContrastSwatchText textColor="gray-700">Teks abu gelap di putih</ContrastSwatchText><WcagBadge level="AA">AA 10.7:1</WcagBadge></ContrastSwatchBg>
              </ContrastSwatch>
              <ContrastSwatch>
                <ContrastSwatchBg bg="indigo-600"><ContrastSwatchText textColor="white">Teks putih di indigo</ContrastSwatchText><WcagBadge level="AA">AA 5.9:1</WcagBadge></ContrastSwatchBg>
              </ContrastSwatch>
              <ContrastSwatch>
                <ContrastSwatchBg bg="yellow-400"><ContrastSwatchText textColor="yellow-900">Teks gelap di kuning</ContrastSwatchText><WcagBadge level="AAA">AAA 9.2:1</WcagBadge></ContrastSwatchBg>
              </ContrastSwatch>
            </ContrastGrid>
            <Code file="contrast.css">{`
/* WCAG 2.1 Contrast Requirements */
/* Normal text (< 18pt / 14pt bold): */
/*   AA  → 4.5:1 minimum */
/*   AAA → 7:1   enhanced */

/* Large text (≥ 18pt / 14pt bold): */
/*   AA  → 3:1 minimum */
/*   AAA → 4.5:1 enhanced */

/* UI components & graphical objects: */
/*   AA → 3:1 minimum */

/* CSS color-contrast() — baru di CSS Color Level 5 */
/* Otomatis pilih warna dengan kontras cukup */
.button {
  background: #6366f1;
  color: color-contrast(#6366f1 vs black, white);
  /* → white (karena lebih kontras terhadap #6366f1) */
}

/* Pakai color-mix untuk hover yang tetap kontras */
.button:hover {
  background: color-mix(in srgb, #6366f1 85%, black);
  /* → gelap 15% — masih kontras dengan teks putih */
}

/* Jangan gunakan placeholder terlalu terang */
/* ❌ */ input::placeholder { color: #ccc; } /* < 4.5:1 */
/* ✅ */ input::placeholder { color: #6b7280; } /* ≈ 4.6:1 */
            `}</Code>
          </Section>
          <Divider />

          <Section id="forced-colors" onClick={() => setActiveSection("forced-colors")}>
            <H2>Forced Colors / High Contrast Mode<H2.anchor href="#forced-colors">#</H2.anchor></H2>
            <Code file="forced-colors.css">{`
/* Windows High Contrast Mode / Forced Colors */
@media (forced-colors: active) {
  /* System colors — digunakan oleh OS */
  /* ButtonText, ButtonFace, Canvas, CanvasText, */
  /* Highlight, HighlightText, LinkText, etc. */

  .btn {
    border: 1px solid ButtonText;
    background: ButtonFace;
    color: ButtonText;
    /* Jangan hardcode warna di sini */
  }

  /* Elemen yang bergantung pada background color */
  .badge {
    forced-color-adjust: none;  /* opt-out dari forced colors */
    /* Gunakan ini dengan hati-hati — pakai hanya jika perlu */
  }

  /* Border visible di HCM (karena warna sering di-override) */
  .card {
    border: 1px solid CanvasText;
  }

  /* SVG icon — pastikan pakai currentColor */
  .icon { fill: currentColor; stroke: currentColor; }
}

/* Transparansi hilang di HCM */
/* ❌ box-shadow: 0 0 0 2px rgba(0,0,0,0.2) — tidak terlihat */
/* ✅ border: 2px solid ButtonText — terlihat di HCM */

/* forced-color-adjust */
.element {
  forced-color-adjust: auto;  /* default — ikuti sistem */
  forced-color-adjust: none;  /* pertahankan warna CSS kita */
  forced-color-adjust: preserve-parent-color; /* ikuti parent */
}
            `}</Code>
          </Section>
          <Divider />

          <Section id="reduced-motion" onClick={() => setActiveSection("reduced-motion")}>
            <H2>prefers-reduced-motion<H2.anchor href="#reduced-motion">#</H2.anchor></H2>
            <Code file="reduced-motion.css">{`
/* prefers-reduced-motion — pengguna sensitif terhadap gerakan */
/* Mengapa: vestibular disorders, epilepsy, ADHD, motion sickness */

/* ✅ Implementasi yang BENAR — reduce, bukan remove */
@media (prefers-reduced-motion: reduce) {
  /* Kurangi atau hilangkan animasi berbahaya */
  .spinning-logo {
    animation: none;  /* hentikan rotation */
  }

  .parallax-section {
    transform: none !important;  /* hilangkan parallax */
  }

  /* Bisa ganti dengan animasi lebih aman */
  .card-hover {
    transition: opacity 0.1s ease;  /* opacity OK, scale tidak */
  }
}

/* ✅ Pattern: safe-motion dan no-motion */
.animated-element {
  /* Default: animasi penuh */
  animation: slide-in 0.5s ease forwards;
  transition: transform 0.3s, opacity 0.3s;
}

@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: fade-in 0.1s ease forwards; /* hanya opacity */
    transition: opacity 0.1s;              /* bukan transform */
  }
}

/* ✅ prefers-reduced-motion: no-preference — animasi aman */
@media (prefers-reduced-motion: no-preference) {
  .hero { animation: complex-entrance 0.8s ease; }
}

/* ❌ Jangan hanya reset semua animasi — terlalu agresif */
/* @media (prefers-reduced-motion: reduce) { */
/*   * { animation: none !important; transition: none !important; } */
/* } */
            `}</Code>
          </Section>
          <Divider />

          <Section id="prefers-contrast" onClick={() => setActiveSection("prefers-contrast")}>
            <H2>prefers-contrast<H2.anchor href="#prefers-contrast">#</H2.anchor></H2>
            <Code file="prefers-contrast.css">{`
/* prefers-contrast media query */
@media (prefers-contrast: more) {
  /* Pengguna ingin lebih banyak kontras */
  :root {
    --color-text:    #000000;
    --color-bg:      #ffffff;
    --border-width:  2px;
  }
  .card {
    border: 2px solid currentColor;
    box-shadow: none;
  }
}

@media (prefers-contrast: less) {
  /* Pengguna sensitif terhadap kontras tinggi */
  :root {
    --color-text: #374151;  /* bukan hitam murni */
    --color-bg:   #f9fafb;  /* bukan putih murni */
  }
}

@media (prefers-contrast: forced) {
  /* Sinonim dengan forced-colors: active */
}

/* Nilai: no-preference | more | less | forced */
/* Browser support: Chrome 96+, Safari 14.1+, Firefox 101+ */
            `}</Code>
          </Section>
          <Divider />

          <Section id="sr-only" onClick={() => setActiveSection("sr-only")}>
            <H2>Screen Reader Utilities<H2.anchor href="#sr-only">#</H2.anchor></H2>
            <Code file="sr-only.css">{`
/* .sr-only / visually-hidden — tersembunyi visual tapi bisa dibaca SR */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* .sr-only.focusable — muncul saat difokus (untuk skip links) */
.sr-only.focusable:focus,
.sr-only.focusable:active {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

/* Jangan pakai display:none atau visibility:hidden */
/* → dihapus dari accessibility tree → screen reader tidak bisa baca */

/* Kapan pakai sr-only: */
/* ✅ Label pada icon button: <button><Icon/><span class="sr-only">Close menu</span></button> */
/* ✅ Form context yang jelas visual tapi tidak ada label */
/* ✅ Skip navigation links */
/* ✅ Table caption tambahan */

/* Kapan TIDAK pakai sr-only: */
/* ❌ Konten yang memang harus tersembunyi (pakai display:none) */
/* ❌ Konten yang tidak relevan untuk screen reader */
            `}</Code>
          </Section>
          <Divider />

          <Section id="aria-pseudo" onClick={() => setActiveSection("aria-pseudo")}>
            <H2>:aria-* Pseudo-classes<H2.anchor href="#aria-pseudo">#</H2.anchor></H2>
            <Code file="aria-pseudo.css">{`
/* Styling berdasarkan ARIA state */
/* Lebih ekspresif dari data-* attributes */

/* :aria-expanded */
.accordion-trigger[aria-expanded="true"] .chevron { transform: rotate(180deg); }
.accordion-content:not([aria-expanded="true"]) { display: none; }

/* :aria-selected */
.tab[aria-selected="true"] {
  border-bottom: 2px solid var(--color-primary);
  color: var(--color-primary);
  font-weight: 600;
}

/* :aria-checked */
[role="checkbox"][aria-checked="true"] {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
[role="checkbox"][aria-checked="mixed"] {
  background: repeating-linear-gradient(45deg, ...);  /* indeterminate */
}

/* :aria-disabled */
[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* :aria-current */
[aria-current="page"] { font-weight: bold; border-left: 3px solid currentColor; }
[aria-current="step"]  { background: var(--color-primary); color: white; }

/* :aria-invalid */
[aria-invalid="true"] {
  border-color: var(--color-error);
  background: rgba(239,68,68,0.05);
}

/* :aria-busy */
[aria-busy="true"] { opacity: 0.7; cursor: wait; }

/* CSS :is() dengan aria */
:is([aria-disabled="true"], [disabled]) { pointer-events: none; opacity: 0.5; }
            `}</Code>
          </Section>
          <Divider />

          <Section id="display-none" onClick={() => setActiveSection("display-none")}>
            <H2>display:none & Accessibility Tree<H2.anchor href="#display-none">#</H2.anchor></H2>
            <Code file="display-a11y.css">{`
/* Perbandingan — dampak ke accessibility tree */

/* display: none — DIHAPUS dari a11y tree */
.modal { display: none; }
/* → Screen reader tidak bisa baca, tidak bisa difokus */
/* ✅ Gunakan untuk konten yang memang tidak tersedia */

/* visibility: hidden — DIHAPUS dari a11y tree */
.tooltip { visibility: hidden; }
/* → Sama seperti display:none untuk SR */

/* opacity: 0 — TETAP di a11y tree */
.toast { opacity: 0; }
/* → Screen reader MASIH BISA baca! */
/* ✅ Gunakan saat konten harus tetap accessible */
/* ❌ Hati-hati: elemen tidak terlihat tapi keyboard accessible */

/* aria-hidden="true" — hapus dari a11y tree tanpa CSS */
/* <div aria-hidden="true"> decorative element </div> */
/* CSS tidak berubah tapi SR tidak baca */

/* Contoh: icon + text */
/* ❌ */ <button><Icon /> Simpan</button>  /* SR baca nama icon */
/* ✅ */ <button><Icon aria-hidden="true" /> Simpan</button>

/* Modal pattern yang benar */
.modal-backdrop { display: none; }  /* hidden */
.modal-backdrop.is-open {
  display: flex;  /* visible */
  /* Plus: tambahkan aria-modal, focus trap di JS */
}

/* inert attribute (baru) — disable interaction + a11y untuk subtree */
/* <div inert> → tidak bisa fokus, tidak bisa klik, SR skip */
/* CSS bisa style [inert] */
[inert] { opacity: 0.5; pointer-events: none; }
            `}</Code>
          </Section>
          <Divider />

          <Section id="wcag22" onClick={() => setActiveSection("wcag22")}>
            <H2>WCAG 2.2 — Yang Baru<H2.anchor href="#wcag22">#</H2.anchor></H2>
            <Code file="wcag22.css">{`
/* WCAG 2.2 (Oktober 2023) — kriteria baru */

/* 2.4.11 Focus Not Obscured (AA) */
/* Elemen yang difokus harus fully visible */
/* → Sticky header tidak boleh menutupi focused element */
.sticky-nav { position: sticky; top: 0; z-index: 10; }
/* → Berikan scroll-margin-top yang cukup */
:focus-visible { scroll-margin-top: 80px; } /* tinggi nav */

/* 2.4.12 Focus Not Obscured (Enhanced) (AAA) */
/* Elemen yang difokus tidak boleh tersembunyi SAMA SEKALI */

/* 2.5.3 Label in Name (A) — sudah dari 2.1 */
/* Accessible name harus mengandung visible label */

/* 2.5.7 Dragging Movements (AA) */
/* Semua drag functionality harus punya alternatif pointer */

/* 2.5.8 Target Size (AA) — BARU */
/* Target interaktif minimum 24x24 CSS pixel */
/* Atau ada spacing 24px di sekitarnya */
.icon-btn {
  min-width: 24px;
  min-height: 24px;
  /* Atau gunakan padding untuk hit area */
  padding: 8px;  /* agar hit area cukup besar */
}

/* Best practice: 44x44px untuk touch target */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 3.2.6 Consistent Help (A) — BARU */
/* Help mechanism harus konsisten posisinya */

/* :focus-visible mandatory di WCAG 2.2 */
/* Browser sudah support, pastikan tidak di-override */
            `}</Code>
          </Section>
          <Divider />

          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>Accessibility di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
            <Code file="a11y-tw.tsx">{`
import { tw } from "tailwind-styled-v4"

// ✅ sr-only built-in Tailwind
const SrOnly = tw.span({ base: "sr-only" })  // Tailwind punya .sr-only

// ✅ focus-visible via Tailwind utilities
const Button = tw.button({
  base: [
    "px-4 py-2 rounded-lg font-medium transition-colors",
    "outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:ring-[var(--accent)]",
  ].join(" "),
  variants: {
    variant: {
      primary:  "bg-[var(--accent)] text-white",
      ghost:    "bg-transparent hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]",
    },
  },
  defaultVariants: { variant: "primary" },
})

// ✅ forced-colors safe — pakai border bukan box-shadow
const FocusRing = tw.div({
  base: [
    "rounded-lg",
    "[@media(forced-colors:active)]:border",
    "[@media(forced-colors:active)]:border-[ButtonText]",
  ].join(" "),
})

// ✅ prefers-reduced-motion via Tailwind
const Animated = tw.div({
  base: "transition-all duration-300 motion-reduce:transition-none motion-reduce:transform-none",
})

// ✅ ARIA state styling
const AccordionTrigger = tw.button({
  base: [
    "flex w-full items-center justify-between px-4 py-3 text-sm font-medium",
    "[&[aria-expanded=true]]:text-[var(--accent)]",
    "[&[aria-expanded=true]>svg]:rotate-180",
  ].join(" "),
})

// ✅ Touch target size — WCAG 2.2
const IconBtn = tw.button({
  base: "inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg",
})
            `}</Code>
          </Section>
          <Divider />

          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Focus ring audit</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Audit website yang ada: Tab melalui semua interactive elements. Identifikasi mana yang menggunakan <IC>outline: none</IC> tanpa pengganti. Perbaiki dengan <IC>:focus-visible</IC> yang memenuhi WCAG 2.2 (kontras 3:1, ukuran visible).</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — prefers-reduced-motion safe animation</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat card dengan entrance animation menggunakan <IC>translate + opacity</IC>. Tambahkan <IC>@media (prefers-reduced-motion: reduce)</IC> yang hanya gunakan opacity transition. Verifikasi di macOS System Preferences → Accessibility → Reduce Motion.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — High Contrast Mode compatibility</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat custom checkbox menggunakan <IC>role="checkbox"</IC> dan <IC>:aria-checked</IC>. Pastikan terlihat di Windows HCM menggunakan <IC>@media (forced-colors: active)</IC> dengan system colors. Test dengan Edge di Windows (atau Chrome flag forced-colors).</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          <PageNav>
            <NavBtn href="/learn/high/css-architecture-patterns" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>CSS Architecture Patterns</NavBtn.label></NavBtn>
            <NavBtn href="/learn/high/css-javascript" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>CSS & JavaScript</NavBtn.label></NavBtn>
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
