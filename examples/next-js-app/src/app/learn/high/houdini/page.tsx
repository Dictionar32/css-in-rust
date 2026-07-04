/**
 * CSS High — CSS Houdini
 */
"use client"
import { useState } from "react"
import {
  Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
  PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
  CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
  PlaygroundWrap, Chip, ChipRow,
  ApiCard, ApiCardBadge, ApiGrid, SupportBadge, SupportRow, PaintPreview,
  CodePre, OutputBox,
} from "./styles"

const TOC = [
  { id: "intro", label: "Apa itu CSS Houdini" },
  { id: "typed-om", label: "CSS Typed OM" },
  { id: "paint-worklet", label: "Paint Worklet" },
  { id: "properties-values", label: "Properties & Values API" },
  { id: "layout-worklet", label: "Layout Worklet" },
  { id: "font-palette", label: "@font-palette-values" },
  { id: "support", label: "Browser Support" },
  { id: "tw-usage", label: "Pakai di tw" },
  { id: "exercise", label: "Latihan" },
]

function Code({ file, children }: { file: string; children: string }) {
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

function HoudiniApiOverview() {
  return (
    <ApiGrid>
      <ApiCard status="stable">
        <ApiCardBadge status="stable">Stable</ApiCardBadge>
        <ApiCard.name>Properties & Values API</ApiCard.name>
        <ApiCard.desc>CSS.registerProperty() + @property. Typed custom properties dengan animasi support.</ApiCard.desc>
      </ApiCard>
      <ApiCard status="stable">
        <ApiCardBadge status="stable">Stable</ApiCardBadge>
        <ApiCard.name>CSS Typed OM</ApiCard.name>
        <ApiCard.desc>Type-safe CSSOM via attributeStyleMap. Lebih cepat dari string manipulation.</ApiCard.desc>
      </ApiCard>
      <ApiCard status="experimental">
        <ApiCardBadge status="limited">Limited</ApiCardBadge>
        <ApiCard.name>Paint Worklet</ApiCard.name>
        <ApiCard.desc>Custom CSS background/border via registerPaint(). Chrome/Edge only saat ini.</ApiCard.desc>
      </ApiCard>
      <ApiCard status="experimental">
        <ApiCardBadge status="experimental">Experimental</ApiCardBadge>
        <ApiCard.name>Layout Worklet</ApiCard.name>
        <ApiCard.desc>Custom layout algorithm. Masih very experimental, belum production ready.</ApiCard.desc>
      </ApiCard>
      <ApiCard status="experimental">
        <ApiCardBadge status="limited">Limited</ApiCardBadge>
        <ApiCard.name>Animation Worklet</ApiCard.name>
        <ApiCard.desc>Custom animation di compositor thread. Performa tinggi untuk scroll-driven.</ApiCard.desc>
      </ApiCard>
      <ApiCard status="stable">
        <ApiCardBadge status="stable">Stable</ApiCardBadge>
        <ApiCard.name>@font-palette-values</ApiCard.name>
        <ApiCard.desc>Kustomisasi color palette untuk color fonts. Dukungan browser sudah luas.</ApiCard.desc>
      </ApiCard>
    </ApiGrid>
  )
}

type PropertyExample = "color" | "length" | "percentage" | "number"

function TypedOMPlayground() {
  const [propType, setPropType] = useState<PropertyExample>("color")
  const examples: Record<PropertyExample, { code: string; output: string }> = {
    color: {
      code: `el.attributeStyleMap.set('color', new CSSKeywordValue('red'))
el.attributeStyleMap.get('color') // → CSSKeywordValue { value: 'red' }

// Atau dengan CSSColor
el.attributeStyleMap.set('background-color',
  CSS.hsl(210, 100, 50))`,
      output: "CSSKeywordValue { value: 'red' }",
    },
    length: {
      code: `el.attributeStyleMap.set('width', CSS.px(200))
el.attributeStyleMap.set('margin', CSS.rem(1.5))

const width = el.attributeStyleMap.get('width')
// → CSSUnitValue { value: 200, unit: 'px' }

// Arithmetic
const doubled = width.mul(2) // → CSSUnitValue { value: 400, unit: 'px' }`,
      output: "CSSUnitValue { value: 200, unit: 'px' }",
    },
    percentage: {
      code: `el.attributeStyleMap.set('width', CSS.percent(50))
// → CSSUnitValue { value: 50, unit: 'percent' }

// Computed style
const computed = el.computedStyleMap().get('width')
// → CSSUnitValue { value: 400, unit: 'px' } (resolved)`,
      output: "CSSUnitValue { value: 50, unit: 'percent' }",
    },
    number: {
      code: `el.attributeStyleMap.set('opacity', CSS.number(0.5))
el.attributeStyleMap.set('z-index', new CSSKeywordValue('10'))

// Baca dan modifikasi
const opacity = el.attributeStyleMap.get('opacity')
el.attributeStyleMap.set('opacity', opacity.value + 0.1)`,
      output: "CSSUnitValue { value: 0.5, unit: 'number' }",
    },
  }
  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🔬 CSS Typed OM — type-safe style manipulation</PlaygroundWrap.label>
        <ChipRow>
          {(["color", "length", "percentage", "number"] as PropertyExample[]).map(t => (
            <Chip key={t} active={propType === t} onClick={() => setPropType(t)}>{t}</Chip>
          ))}
        </ChipRow>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas>
        <CodePre>{examples[propType].code}</CodePre>
        <OutputBox>
          → {examples[propType].output}
        </OutputBox>
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>{`el.attributeStyleMap.get('${propType === "length" ? "width" : propType}')`}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

export default function HoudiniPage() {
  const [activeSection, setActiveSection] = useState("intro")
  return (
    <Page>
      <TopBar><TopBarInner>
        <Breadcrumb>
          <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.link href="/learn/high">High</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.curr>CSS Houdini</Breadcrumb.curr>
        </Breadcrumb>
      </TopBarInner></TopBar>
      <Body>
        <Content>
          <PageTitle>CSS Houdini</PageTitle>
          <PageDesc>Akses langsung ke CSS rendering engine — Paint, Layout, Animation Worklet, CSS Typed OM, dan Properties & Values API untuk kontrol rendering yang belum pernah ada sebelumnya.</PageDesc>

          <Section id="intro" onClick={() => setActiveSection("intro")}>
            <H2>Apa itu CSS Houdini<H2.anchor href="#intro">#</H2.anchor></H2>
            <P>CSS Houdini adalah sekumpulan API browser low-level yang mengekspos CSS rendering engine ke JavaScript. Developer bisa menulis CSS extensions yang berjalan natively di browser — bukan polyfill, tapi actual hooks ke rendering pipeline.</P>
            <HoudiniApiOverview />
            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content><Callout.title>Production Readiness</Callout.title>Hanya Properties & Values API dan CSS Typed OM yang cukup stabil untuk production. Paint Worklet hanya Chrome/Edge. Layout & Animation Worklet masih sangat experimental.</Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="typed-om" onClick={() => setActiveSection("typed-om")}>
            <H2>CSS Typed OM<H2.anchor href="#typed-om">#</H2.anchor></H2>
            <P>CSS Typed Object Model menggantikan string-based CSSOM dengan type-safe objects. Lebih cepat karena menghindari parsing string berulang-ulang.</P>
            <TypedOMPlayground />
            <Code file="typed-om.ts">{`
// ── CSS Typed OM vs CSSOM biasa ──────────────────────────────────
// Lama (CSSOM) — semua string
el.style.opacity = '0.5'                    // string
el.style.width   = '200px'                  // string
getComputedStyle(el).width                  // string "200px"

// Baru (Typed OM) — type-safe objects
el.attributeStyleMap.set('opacity', CSS.number(0.5))  // CSSUnitValue
el.attributeStyleMap.set('width',   CSS.px(200))      // CSSUnitValue

// CSSStyleValue subtypes
CSS.px(10)          // → CSSUnitValue { value: 10, unit: 'px' }
CSS.rem(1.5)        // → CSSUnitValue { value: 1.5, unit: 'rem' }
CSS.percent(50)     // → CSSUnitValue { value: 50, unit: 'percent' }
CSS.number(0.5)     // → CSSUnitValue { value: 0.5, unit: 'number' }
CSS.vw(100)         // → CSSUnitValue { value: 100, unit: 'vw' }

// Operasi aritmatika
const w = CSS.px(200)
w.add(CSS.px(50))   // → CSSUnitValue { value: 250, unit: 'px' }
w.mul(2)            // → CSSUnitValue { value: 400, unit: 'px' }

// Computed style map (resolved values)
const map = el.computedStyleMap()
map.get('width')        // → CSSUnitValue dalam px (resolved)
map.getAll('padding')   // → Array<CSSUnitValue>
map.has('display')      // → boolean

// CSSKeywordValue
new CSSKeywordValue('flex')  // → CSSKeywordValue { value: 'flex' }

// Convert units (jika ada context)
const rem = CSS.rem(2)
rem.to('px')   // needs layout context — throws if no context
            `}</Code>
          </Section>
          <Divider />

          <Section id="paint-worklet" onClick={() => setActiveSection("paint-worklet")}>
            <H2>Paint Worklet<H2.anchor href="#paint-worklet">#</H2.anchor></H2>
            <P>Paint Worklet memungkinkan kita mendefinisikan custom CSS <IC>background-image</IC> atau <IC>border-image</IC> menggunakan Canvas 2D API — berjalan di rendering thread terpisah.</P>
            <Code file="checkerboard.js">{`
// checkerboard-worklet.js — file terpisah, dijalankan di worklet
registerPaint('checkerboard', class {
  // CSS custom properties yang digunakan painter ini
  static get inputProperties() {
    return ['--checker-size', '--checker-color'];
  }

  paint(ctx, geom, properties) {
    const size  = parseInt(properties.get('--checker-size')) || 20
    const color = properties.get('--checker-color').toString().trim() || '#6366f1'

    for (let y = 0; y < geom.height / size; y++) {
      for (let x = 0; x < geom.width / size; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = color
          ctx.fillRect(x * size, y * size, size, size)
        }
      }
    }
  }
})
            `}</Code>
            <Code file="use-paint.css">{`
/* Daftarkan worklet di JS */
/* CSS.paintWorklet.addModule('checkerboard-worklet.js') */

/* Gunakan di CSS */
.pattern {
  background-image: paint(checkerboard);
  --checker-size: 30;
  --checker-color: #6366f1;
}

/* Paint worklet lainnya */
.element {
  background-image: paint(my-gradient);  /* custom gradient */
  border-image: paint(my-border) 1;      /* custom border */
}

/* Houdini polyfill untuk browser lain */
/* import 'css-paint-polyfill' */
            `}</Code>
            <Code file="paint-worklet.ts">{`
// Register di app entry point / layout
async function registerPainters() {
  if ('paintWorklet' in CSS) {
    await CSS.paintWorklet.addModule('/checkerboard-worklet.js')
    console.log('Paint worklet registered')
  } else {
    // Fallback atau polyfill
    await import('css-paint-polyfill')
    await CSS.paintWorklet.addModule('/checkerboard-worklet.js')
  }
}
registerPainters()
            `}</Code>
            <PaintPreview>
              <PaintPreview.text>Paint Worklet preview — butuh Chrome/Edge</PaintPreview.text>
            </PaintPreview>
          </Section>
          <Divider />

          <Section id="properties-values" onClick={() => setActiveSection("properties-values")}>
            <H2>CSS Properties & Values API<H2.anchor href="#properties-values">#</H2.anchor></H2>
            <P>Registrasi custom property dengan tipe, initial value, dan inheritance control — membuat CSS variables bisa dianimasikan dan lebih predictable.</P>
            <Code file="register-property.ts">{`
// Cara 1: CSS.registerProperty() di JavaScript
CSS.registerProperty({
  name: '--highlight-color',
  syntax: '<color>',
  inherits: false,
  initialValue: 'transparent',
})

// Cara 2: @property di CSS (lebih disukai)
@property --highlight-color {
  syntax: '<color>';
  inherits: false;
  initial-value: transparent;
}

// Setelah didaftarkan, bisa dianimasikan!
.link {
  --highlight-color: transparent;
  background: linear-gradient(var(--highlight-color), var(--highlight-color));
  transition: --highlight-color 0.3s;
}
.link:hover {
  --highlight-color: rgba(99, 102, 241, 0.2);
}

// Syntax types yang tersedia
// '<length>'         → CSS.px(), CSS.rem(), dll
// '<number>'         → angka tanpa unit
// '<percentage>'     → nilai %
// '<length-percentage>' → length atau percentage
// '<color>'          → semua CSS color values
// '<image>'          → url(), gradient, dll
// '<angle>'          → deg, rad, turn
// '<time>'           → s, ms
// '<resolution>'     → dpi, dppx
// '<transform-list>' → transform functions
// '<custom-ident>'   → identifiers
// '*'               → any (tidak bisa animate)
// 'none | <length>' → keywords dan types
            `}</Code>
          </Section>
          <Divider />

          <Section id="layout-worklet" onClick={() => setActiveSection("layout-worklet")}>
            <H2>Layout Worklet (Eksperimental)<H2.anchor href="#layout-worklet">#</H2.anchor></H2>
            <P>Layout Worklet memungkinkan pembuatan custom layout algorithm — seperti masonry, packing, atau diagonal grid — langsung di CSS. Saat ini masih sangat experimental.</P>
            <Code file="layout-worklet.js">{`
// masonry-worklet.js (sangat simplified — API masih berubah)
registerLayout('masonry', class {
  async layout(children, edges, constraints, styleMap) {
    const columnWidth = constraints.fixedInlineSize / 3
    const columns = [0, 0, 0] // track heights

    const childFragments = await Promise.all(children.map(async child => {
      const colIdx = columns.indexOf(Math.min(...columns))
      const childConstraints = {
        fixedInlineSize: columnWidth,
        availableBlockSize: Infinity,
      }
      const fragment = await child.layoutNextFragment(childConstraints)
      const blockOffset = columns[colIdx]
      columns[colIdx] += fragment.blockSize + 10 // gap

      return { fragment, inlineOffset: colIdx * columnWidth, blockOffset }
    }))

    return {
      autoBlockSize: Math.max(...columns),
      childFragments: childFragments.map(({ fragment, inlineOffset, blockOffset }) => ({
        ...fragment, inlineOffset, blockOffset
      })),
    }
  }
})

// Penggunaan di CSS
// .grid { display: layout(masonry); }
            `}</Code>
            <Callout type="danger">
              <Callout.icon>🚫</Callout.icon>
              <Callout.content><Callout.title>Jangan di production</Callout.title>Layout Worklet API masih berubah-ubah dan dukungan browser sangat terbatas. Untuk masonry, gunakan CSS <IC>grid</IC> dengan <IC>masonry</IC> value (sudah di Firefox) atau JS library seperti Masonry.js.</Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="font-palette" onClick={() => setActiveSection("font-palette")}>
            <H2>@font-palette-values<H2.anchor href="#font-palette">#</H2.anchor></H2>
            <P>Color fonts (seperti emoji atau decorative fonts) memiliki built-in color palettes. <IC>@font-palette-values</IC> memungkinkan kustomisasi warna-warna tersebut.</P>
            <Code file="font-palette.css">{`
/* @font-palette-values — kustomisasi color font palette */
@font-palette-values --my-palette {
  font-family: 'Rocher Color';  /* harus cocok dengan font */
  base-palette: 1;              /* index palette bawaan sebagai basis */
  override-colors:
    0 #ff6b6b,  /* ganti warna index 0 */
    1 #4ecdc4,  /* ganti warna index 1 */
    2 #45b7d1;  /* ganti warna index 2 */
}

/* Terapkan ke elemen */
.colorful-heading {
  font-family: 'Rocher Color';
  font-palette: --my-palette;
}

/* Palette default bawaan font */
.default-palette {
  font-palette: normal;  /* palette 0 (default) */
}

/* Palette dark/light */
@media (prefers-color-scheme: dark) {
  @font-palette-values --my-palette {
    font-family: 'Rocher Color';
    base-palette: 2;  /* palette berbeda untuk dark mode */
    override-colors: 0 #a78bfa, 1 #34d399;
  }
}
            `}</Code>
          </Section>
          <Divider />

          <Section id="support" onClick={() => setActiveSection("support")}>
            <H2>Browser Support & Production Readiness<H2.anchor href="#support">#</H2.anchor></H2>
            <SupportRow>
              <SupportBadge support="yes">✅ Properties & Values API — semua browser modern</SupportBadge>
              <SupportBadge support="yes">✅ CSS Typed OM — Chrome, Edge, Safari</SupportBadge>
              <SupportBadge support="partial">⚠️ Paint Worklet — Chrome, Edge only</SupportBadge>
              <SupportBadge support="no">❌ Layout Worklet — tidak ada production browser</SupportBadge>
              <SupportBadge support="partial">⚠️ Animation Worklet — Chrome behind flag</SupportBadge>
              <SupportBadge support="yes">✅ @font-palette-values — semua browser modern</SupportBadge>
            </SupportRow>
            <Code file="feature-detect.ts">{`
// Feature detection untuk Houdini APIs
const houdini = {
  paintWorklet:     'paintWorklet'     in CSS,
  layoutWorklet:    'layoutWorklet'    in CSS,
  animationWorklet: 'animationWorklet' in CSS,
  typedOM:          'attributeStyleMap' in document.body,
  registerProperty: 'registerProperty' in CSS,
}

// CSS.supports() untuk @property
const hasAtProperty = CSS.supports('(--x: 0)')

// Graceful degradation pattern
if (houdini.paintWorklet) {
  CSS.paintWorklet.addModule('/worklets/fancy-border.js')
} else {
  // fallback: pakai SVG atau gradient biasa
  document.body.classList.add('no-paint-worklet')
}
            `}</Code>
          </Section>
          <Divider />

          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>Houdini di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
            <Code file="houdini-tw.tsx">{`
import { tw } from "tailwind-styled-v4"

// @property tipe custom property — bisa dianimasikan
// (definisikan di globals.css)
// @property --glow-color { syntax: '<color>'; inherits: false; initial-value: transparent; }

const GlowCard = tw.div({
  base: [
    "rounded-xl border p-4 transition-all duration-500",
    "shadow-[0_0_20px_var(--glow-color)]",
    // hover via Tailwind arbitrary
    "hover:[--glow-color:#6366f140]",
  ].join(" "),
})

// CSS Typed OM via useEffect
// useEffect(() => {
//   el.attributeStyleMap.set('--offset', CSS.px(scrollY))
// }, [scrollY])

// Paint worklet class di tw — apply via className
const CheckerBg = tw.div({
  base: "w-full h-40 rounded-xl [background-image:paint(checkerboard)] [--checker-size:25] [--checker-color:#6366f1]",
})
            `}</Code>
          </Section>
          <Divider />

          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — @property animated gradient</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Daftarkan <IC>--gradient-angle</IC> sebagai <IC>{'<angle>'}</IC> dengan <IC>@property</IC>. Buat animasi rotating gradient menggunakan <IC>@keyframes</IC> yang hanya mengubah <IC>--gradient-angle</IC>. Verifikasi animasi tidak bisa dilakukan tanpa <IC>@property</IC>.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — CSS Typed OM</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat slider yang mengontrol <IC>--progress</IC> custom property via <IC>attributeStyleMap.set()</IC>. Bandingkan performa (Chrome DevTools Performance) dengan cara lama <IC>element.style.setProperty()</IC> saat update 60fps.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Paint Worklet polka dot</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat Paint Worklet yang menggambar polka dot pattern. Ekspos <IC>--dot-size</IC> dan <IC>--dot-color</IC> via <IC>inputProperties</IC>. Tambahkan CSS polyfill untuk browser non-Chrome. Verifikasi feature detection berjalan.</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          <PageNav>
            <NavBtn href="/learn/high/css-performance" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>CSS Performance</NavBtn.label></NavBtn>
            <NavBtn href="/learn/high/css-architecture-patterns" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>CSS Architecture Patterns</NavBtn.label></NavBtn>
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
