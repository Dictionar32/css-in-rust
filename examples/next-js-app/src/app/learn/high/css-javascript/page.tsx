/**
 * CSS High — CSS & JavaScript
 */
"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import {
    Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
    PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
    CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
    PlaygroundWrap, Chip, ChipRow,
    AnimBox, EventLog, Slider, OutputBox, ObserverBox,
} from "./styles"

const TOC = [
    { id: "cssom", label: "CSSOM" },
    { id: "computed-style", label: "getComputedStyle vs element.style" },
    { id: "custom-props-js", label: "Custom Properties via JS" },
    { id: "web-animations", label: "Web Animations API" },
    { id: "transition-events", label: "Transition Events" },
    { id: "animation-events", label: "Animation Events" },
    { id: "resize-observer", label: "ResizeObserver + CSS" },
    { id: "intersection-observer", label: "IntersectionObserver + CSS" },
    { id: "match-media", label: "matchMedia()" },
    { id: "constructable-stylesheet", label: "Constructable Stylesheet" },
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

function WebAnimationsPlayground() {
    const boxRef = useRef<HTMLDivElement>(null)
    const [logs, setLogs] = useState<string[]>(["Playground siap — klik Animate"])
    const [isRunning, setIsRunning] = useState(false)

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev].slice(0, 8))
    }, [])

    const runAnimation = () => {
        if (!boxRef.current || isRunning) return
        setIsRunning(true)
        addLog("animasi dimulai")

        const anim = boxRef.current.animate([
            { transform: "translateX(0) rotate(0deg)", opacity: 1 },
            { transform: "translateX(120px) rotate(180deg)", opacity: 0.5, offset: 0.5 },
            { transform: "translateX(0) rotate(360deg)", opacity: 1 },
        ], {
            duration: 1200,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "none",
        })

        anim.onfinish = () => { addLog("selesai"); setIsRunning(false) }
        anim.oncancel = () => { addLog("dibatalkan"); setIsRunning(false) }
    }

    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎬 Web Animations API — element.animate()</PlaygroundWrap.label>
                <button onClick={runAnimation} disabled={isRunning}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-white disabled:opacity-50 transition-opacity">
                    {isRunning ? "Animating..." : "▶ Animate"}
                </button>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div className="flex gap-6 items-start">
                    <AnimBox ref={boxRef} color="indigo">JS</AnimBox>
                    <EventLog>
                        <EventLog.header>Animation log</EventLog.header>
                        <EventLog.list>
                            {logs.map((l, i) => <EventLog.item key={i}>{l}</EventLog.item>)}
                        </EventLog.list>
                    </EventLog>
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>el.animate(keyframes, options) → Animation instance</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

function CustomPropSlider() {
    const [hue, setHue] = useState(250)
    const [saturation, setSaturation] = useState(80)
    const [lightness, setLightness] = useState(60)

    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`

    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎨 CSS Custom Properties via JavaScript — element.style.setProperty()</PlaygroundWrap.label>
                <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-3">
                        <span className="w-20 font-medium">Hue ({hue}°)</span>
                        <Slider type="range" min={0} max={360} value={hue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHue(+e.target.value)} />
                    </label>
                    <label className="flex items-center gap-3">
                        <span className="w-20 font-medium">Saturation ({saturation}%)</span>
                        <Slider type="range" min={0} max={100} value={saturation} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSaturation(+e.target.value)} />
                    </label>
                    <label className="flex items-center gap-3">
                        <span className="w-20 font-medium">Lightness ({lightness}%)</span>
                        <Slider type="range" min={20} max={90} value={lightness} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLightness(+e.target.value)} />
                    </label>
                </div>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl transition-colors duration-150" style={{ background: color }} />
                    <OutputBox>
                        <div><OutputBox.key>--hue</OutputBox.key>: <OutputBox.val>{hue}</OutputBox.val></div>
                        <div><OutputBox.key>--saturation</OutputBox.key>: <OutputBox.val>{saturation}%</OutputBox.val></div>
                        <div><OutputBox.key>--lightness</OutputBox.key>: <OutputBox.val>{lightness}%</OutputBox.val></div>
                        <div className="mt-2 pt-2 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"><OutputBox.key>resolved</OutputBox.key>: <OutputBox.val>{color}</OutputBox.val></div>
                    </OutputBox>
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{`el.style.setProperty('--hue', '${hue}')`}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

export default function CssJavascriptPage() {
    const [activeSection, setActiveSection] = useState("cssom")
    return (
        <Page>
            <TopBar><TopBarInner>
                <Breadcrumb>
                    <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.link href="/learn/high">High</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.curr>CSS & JavaScript</Breadcrumb.curr>
                </Breadcrumb>
            </TopBarInner></TopBar>
            <Body>
                <Content>
                    <PageTitle>CSS & JavaScript</PageTitle>
                    <PageDesc>CSSOM, getComputedStyle, Web Animations API, transition/animation events, ResizeObserver, IntersectionObserver, matchMedia, dan Constructable Stylesheets.</PageDesc>

                    <Section id="cssom" onClick={() => setActiveSection("cssom")}>
                        <H2>CSSOM — CSS Object Model<H2.anchor href="#cssom">#</H2.anchor></H2>
                        <Code file="cssom.ts">{`
// document.styleSheets — akses semua stylesheet
const sheets = document.styleSheets  // StyleSheetList
const sheet  = sheets[0]              // CSSStyleSheet

// Iterasi rules
for (const rule of sheet.cssRules) {
  console.log(rule.type)     // CSSRule.STYLE_RULE, MEDIA_RULE, dll
  console.log(rule.cssText)  // teks lengkap rule
}

// CSSStyleRule
const styleRule = sheet.cssRules[0] as CSSStyleRule
styleRule.selectorText           // ".card"
styleRule.style.color            // "" atau nilai warna
styleRule.style.setProperty('color', 'red')

// CSSMediaRule
const mediaRule = sheet.cssRules[1] as CSSMediaRule
mediaRule.media.mediaText        // "(max-width: 768px)"

// Tambah/hapus rule
sheet.insertRule('.new { color: red; }', sheet.cssRules.length)
sheet.deleteRule(0)

// CSSRule types
// 1 = STYLE_RULE     → .selector { ... }
// 4 = MEDIA_RULE     → @media
// 5 = FONT_FACE_RULE → @font-face
// 7 = KEYFRAMES_RULE → @keyframes
// 12 = SUPPORTS_RULE → @supports
// 15 = LAYER_RULE    → @layer
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="computed-style" onClick={() => setActiveSection("computed-style")}>
                        <H2>getComputedStyle vs element.style<H2.anchor href="#computed-style">#</H2.anchor></H2>
                        <Code file="computed-style.ts">{`
const el = document.querySelector('.card')

// element.style — inline styles SAJA
el.style.color          // "" jika dari stylesheet (bukan inline)
el.style.setProperty('color', 'red')   // set inline style
el.style.removeProperty('color')       // remove inline style

// getComputedStyle — nilai TERKOMPUTASI (dari semua sources)
const computed = getComputedStyle(el)
computed.color                  // "rgb(99, 102, 241)" — resolved
computed.getPropertyValue('color')         // sama
computed.getPropertyValue('--custom-prop') // baca custom property
// PENTING: getComputedStyle() mengembalikan live object

// Perbedaan kunci:
// element.style: hanya inline, baca/tulis
// getComputedStyle: semua sumber, read-only, resolved values

// getBoundingClientRect — posisi dan ukuran
const rect = el.getBoundingClientRect()
rect.top; rect.left; rect.width; rect.height
// → relative to viewport, tidak termasuk transform sebelumnya

// offsetWidth/offsetHeight — termasuk padding, tidak termasuk margin
el.offsetWidth   // 320
el.clientWidth   // 320 - scrollbar
el.scrollWidth   // full scrollable width

// Hati-hati: forced reflow!
// Baca layout → modifikasi → baca layout lagi = forced reflow
el.style.width = '200px'
const w = el.offsetWidth  // FORCED REFLOW — mahal!
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="custom-props-js" onClick={() => setActiveSection("custom-props-js")}>
                        <H2>Custom Properties via JavaScript<H2.anchor href="#custom-props-js">#</H2.anchor></H2>
                        <CustomPropSlider />
                        <Code file="custom-props-js.ts">{`
// Set custom property
el.style.setProperty('--my-color', '#6366f1')
el.style.setProperty('--size', '24px')

// Baca custom property (dari computed style)
getComputedStyle(el).getPropertyValue('--my-color').trim()

// Remove custom property (kembali ke nilai dari stylesheet)
el.style.removeProperty('--my-color')

// Global (root) custom properties
const root = document.documentElement
root.style.setProperty('--color-primary', '#6366f1')

// React pattern — style prop
function ThemedComponent({ color }: { color: string }) {
  return (
    <div style={{ '--accent': color } as React.CSSProperties}>
      <button className="bg-[var(--accent)] text-white px-4 py-2 rounded">
        Themed Button
      </button>
    </div>
  )
}

// Animasi via custom property + @property
// @property --progress { syntax: '<percentage>'; inherits: false; initial-value: 0%; }
// el.style.setProperty('--progress', '75%')  → trigger CSS transition
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="web-animations" onClick={() => setActiveSection("web-animations")}>
                        <H2>Web Animations API<H2.anchor href="#web-animations">#</H2.anchor></H2>
                        <WebAnimationsPlayground />
                        <Code file="web-animations.ts">{`
const el = document.querySelector('.card')

// element.animate() — dasar
const animation = el.animate(
  // Keyframes
  [
    { transform: 'translateY(0)', opacity: 1 },
    { transform: 'translateY(-20px)', opacity: 0.5 },
    { transform: 'translateY(0)', opacity: 1 },
  ],
  // Options
  {
    duration: 600,            // ms
    easing: 'ease-in-out',
    delay: 0,
    fill: 'none',            // 'none' | 'forwards' | 'backwards' | 'both'
    iterations: 1,            // Infinity untuk loop
    direction: 'normal',      // 'alternate', 'reverse', etc.
  }
)

// Animation instance methods
animation.pause()
animation.play()
animation.cancel()
animation.reverse()
animation.finish()

// Animation state
animation.playState   // "idle" | "running" | "paused" | "finished"
animation.currentTime // ms dari awal

// Promises
await animation.finished  // resolve saat selesai
await animation.ready     // resolve saat siap play

// KeyframeEffect — lebih control
const effect = new KeyframeEffect(el,
  [{ opacity: 0 }, { opacity: 1 }],
  { duration: 300 }
)
const anim = new Animation(effect, document.timeline)
anim.play()

// getAnimations() — daftar semua animasi aktif di elemen
el.getAnimations()   // Animation[]
document.getAnimations()  // semua di dokumen
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="transition-events" onClick={() => setActiveSection("transition-events")}>
                        <H2>Transition Events<H2.anchor href="#transition-events">#</H2.anchor></H2>
                        <Code file="transition-events.ts">{`
const el = document.querySelector('.card')

// Transition events — lifecycle CSS transitions
el.addEventListener('transitionstart', (e: TransitionEvent) => {
  console.log('started:', e.propertyName)  // "opacity", "transform", dll
  console.log('elapsed:', e.elapsedTime)
  console.log('pseudoElement:', e.pseudoElement)  // "::before" atau ""
})

el.addEventListener('transitionrun', (e: TransitionEvent) => {
  // Fired saat transition created (sebelum delay)
})

el.addEventListener('transitionend', (e: TransitionEvent) => {
  console.log('ended:', e.propertyName)
  // Berguna untuk: cleanup setelah transisi selesai
})

el.addEventListener('transitioncancel', (e: TransitionEvent) => {
  // Fired jika transition di-interrupt (misal class dihapus saat transisi)
})

// Contoh penggunaan: hapus elemen setelah fade out
function fadeOut(el: HTMLElement) {
  el.style.opacity = '0'
  el.addEventListener('transitionend', () => el.remove(), { once: true })
}

// Async/await pattern
function transitionEnd(el: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    el.addEventListener('transitionend', () => resolve(), { once: true })
  })
}

async function hideAndRemove(el: HTMLElement) {
  el.classList.add('hidden')   // trigger transition
  await transitionEnd(el)       // tunggu selesai
  el.remove()
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="animation-events" onClick={() => setActiveSection("animation-events")}>
                        <H2>Animation Events<H2.anchor href="#animation-events">#</H2.anchor></H2>
                        <Code file="animation-events.ts">{`
const el = document.querySelector('.spinner')

el.addEventListener('animationstart', (e: AnimationEvent) => {
  console.log('animation name:', e.animationName)  // nama dari @keyframes
  console.log('elapsed time:', e.elapsedTime)
})

el.addEventListener('animationend', (e: AnimationEvent) => {
  // Fired saat iteration terakhir selesai
  el.classList.remove('animate-spin')
})

el.addEventListener('animationiteration', (e: AnimationEvent) => {
  // Fired setiap iteration loop — berguna untuk counting
})

el.addEventListener('animationcancel', (e: AnimationEvent) => {
  // Fired jika animasi di-cancel sebelum selesai
})

// React pattern dengan useEffect
function useAnimationEnd(ref, animationName: string, callback: () => void) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = (e: AnimationEvent) => {
      if (e.animationName === animationName) callback()
    }
    el.addEventListener('animationend', handler)
    return () => el.removeEventListener('animationend', handler)
  }, [ref, animationName, callback])
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="resize-observer" onClick={() => setActiveSection("resize-observer")}>
                        <H2>ResizeObserver + CSS<H2.anchor href="#resize-observer">#</H2.anchor></H2>
                        <Code file="resize-observer.ts">{`
// ResizeObserver — ikuti perubahan ukuran elemen
const observer = new ResizeObserver(entries => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect
    const el = entry.target as HTMLElement

    // Update CSS custom property berdasarkan ukuran
    el.style.setProperty('--element-width', \`\${width}px\`)
    el.style.setProperty('--element-height', \`\${height}px\`)

    // Layout-aware: ubah class berdasarkan ukuran elemen
    // (Container Queries dalam JS sebelum CSS support luas)
    el.classList.toggle('is-narrow', width < 400)
    el.classList.toggle('is-wide',   width >= 800)
  }
})

observer.observe(document.querySelector('.card'))
observer.unobserve(el)  // berhenti observasi
observer.disconnect()   // bersihkan semua

// Akses border-box dan device-pixel metrics
const resizeObserver = new ResizeObserver(entries => {
  for (const entry of entries) {
    // entry.borderBoxSize   → termasuk border + padding
    // entry.contentBoxSize  → konten saja
    // entry.devicePixelContentBoxSize → pixel asli (fractional)
    const [{ inlineSize, blockSize }] = entry.borderBoxSize
    console.log({ inlineSize, blockSize })
  }
})

// React hook
function useElementSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
  return size
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="intersection-observer" onClick={() => setActiveSection("intersection-observer")}>
                        <H2>IntersectionObserver + CSS<H2.anchor href="#intersection-observer">#</H2.anchor></H2>
                        <Code file="intersection-observer.ts">{`
// IntersectionObserver — deteksi visibilitas elemen dalam viewport
const observer = new IntersectionObserver(
  entries => {
    for (const entry of entries) {
      // Toggle class saat elemen masuk/keluar viewport
      entry.target.classList.toggle('is-visible', entry.isIntersecting)
      entry.target.classList.toggle('was-visible', true)  // sekali muncul, tetap
    }
  },
  {
    root: null,        // null = viewport
    rootMargin: '0px', // expand/shrink intersection root
    threshold: 0.2,    // 20% terlihat = trigger
    // threshold: [0, 0.25, 0.5, 0.75, 1] → trigger di setiap nilai
  }
)

// Observe semua section
document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el))

// Lazy loading CSS
const lazyObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target as HTMLImageElement
      el.src = el.dataset.src!          // load image
      el.classList.remove('lazy')
      lazyObserver.unobserve(el)
    }
  })
}, { rootMargin: '200px' })             // preload 200px sebelum terlihat

// CSS untuk animate-on-scroll
// .animate-on-scroll { opacity: 0; transform: translateY(20px); transition: ... }
// .animate-on-scroll.is-visible { opacity: 1; transform: none; }

// React hook
function useInView(ref, options = {}) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      options
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
  return inView
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="match-media" onClick={() => setActiveSection("match-media")}>
                        <H2>matchMedia() — Programmatic Media Queries<H2.anchor href="#match-media">#</H2.anchor></H2>
                        <Code file="match-media.ts">{`
// matchMedia — evaluasi media query di JavaScript
const mq = window.matchMedia('(max-width: 768px)')
mq.matches  // → true/false saat ini

// Event listener saat media query berubah
mq.addEventListener('change', e => {
  if (e.matches) {
    console.log('mobile layout')
  } else {
    console.log('desktop layout')
  }
})

// Common queries
const queries = {
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
  prefersDark:          '(prefers-color-scheme: dark)',
  prefersHighContrast:  '(prefers-contrast: more)',
  isHover:              '(hover: hover) and (pointer: fine)',
  isMobile:             '(max-width: 639px)',
  isTablet:             '(min-width: 640px) and (max-width: 1023px)',
}

// React hook
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    setMatches(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

// Usage
const isMobile    = useMediaQuery('(max-width: 639px)')
const prefersMotion = !useMediaQuery('(prefers-reduced-motion: reduce)')
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="constructable-stylesheet" onClick={() => setActiveSection("constructable-stylesheet")}>
                        <H2>CSSStyleSheet Constructable<H2.anchor href="#constructable-stylesheet">#</H2.anchor></H2>
                        <Code file="constructable-stylesheet.ts">{`
// Constructable CSSStyleSheet — inject styles dari JS
const sheet = new CSSStyleSheet()

// Tambah rules
await sheet.replace(\`
  :host { display: block; }
  .card { padding: 1rem; background: var(--surface); }
\`)

// Atau synchronous (untuk kecil)
sheet.replaceSync('.btn { padding: 0.5rem 1rem; }')

// Terapkan ke dokumen
document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]

// Terapkan ke Shadow DOM
const shadow = el.attachShadow({ mode: 'open' })
shadow.adoptedStyleSheets = [sheet]  // share satu sheet ke banyak shadow root

// Berguna untuk:
// 1. Web Components — share CSS tanpa duplikasi
// 2. Dynamic theme injection — ganti sheet saat tema berubah
// 3. SSR hydration — inject critical CSS

// Update sheet (semua consumer langsung update)
sheet.replaceSync('.btn { background: red; }')  // semua shadow root update

// Pattern: shared design token sheet
const tokenSheet = new CSSStyleSheet()
tokenSheet.replaceSync(\`
  :root {
    --color-primary: #6366f1;
    --color-surface: #ffffff;
    --space-md: 1rem;
  }
\`)
// Bagikan ke semua Web Components di halaman
document.adoptedStyleSheets = [tokenSheet]
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
                        <H2>CSS-JS Integration di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
                        <Code file="css-js-tw.tsx">{`
import { tw } from "tailwind-styled-v4"
import { useState, useEffect, useRef, useCallback } from "react"

// ✅ Custom property dari JS ke tw component
const ProgressBar = tw.div({
  base: "h-2 rounded-full bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] overflow-hidden",
  sub: { "div:fill": "h-full bg-[var(--accent)] transition-[width] duration-500" },
})
function Progress({ value }: { value: number }) {
  return <ProgressBar><ProgressBar.fill style={{ width: \`\${value}%\` }} /></ProgressBar>
}

// ✅ IntersectionObserver dengan tw class toggle
const AnimatedSection = tw.section({
  base: "transition-all duration-700 opacity-0 translate-y-4",
  variants: { visible: { true: "opacity-100 translate-y-0" } },
  defaultVariants: { visible: false },
})

// ✅ matchMedia hook dengan tw component
function AdaptiveCard() {
  const prefersMotion = !useMediaQuery('(prefers-reduced-motion: reduce)')
  return (
    <div className={prefersMotion
      ? "hover:scale-105 transition-transform"
      : "hover:opacity-90 transition-opacity"
    }>
      Card content
    </div>
  )
}
            `}</Code>
                    </Section>
                    <Divider />

                    <Section id="exercise" onClick={() => setActiveSection("exercise")}>
                        <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Web Animations API sequence</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat sequence animasi 3 langkah menggunakan Web Animations API: card muncul (fade+slide), konten muncul satu per satu (stagger), tombol pulse (infinite). Gunakan <IC>animation.finished</IC> promise untuk sequence.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Scroll-triggered CSS classes</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat halaman dengan 5 section. Gunakan <IC>IntersectionObserver</IC> untuk menambahkan class <IC>is-visible</IC> saat section masuk viewport. Tambahkan CSS animation yang hanya berjalan sekali (<IC>animation-fill-mode: forwards</IC>).</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Dynamic theme via matchMedia</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat theme system yang: mengikuti <IC>prefers-color-scheme</IC> secara otomatis, bisa di-override manual, dan tersimpan di localStorage. Gunakan <IC>matchMedia()</IC> untuk sync otomatis dan Constructable Stylesheet untuk inject token.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/high/accessibility-css" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>Accessibility CSS</NavBtn.label></NavBtn>
                        <NavBtn href="/learn/high/advanced-layout-patterns" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>Advanced Layout Patterns</NavBtn.label></NavBtn>
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
