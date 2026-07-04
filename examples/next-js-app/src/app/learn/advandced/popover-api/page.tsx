/**
 * CSS Advanced — Popover API
 */
"use client"
import { useState } from "react"
import {
  Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
  PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
  CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
  PlaygroundWrap, Chip, ChipRow, SupportBadge,
  DemoBtn, PopoverContainer, Backdrop, BackdropDim, PopoverContent, PopoverTitle, PopoverDescription, EventLog, EventLogItem,
  HintText, CodeInline, CloseBtnFull, BadgeRow,
} from "./styles"

const TOC = [
  { id: "intro", label: "Apa itu Popover API" },
  { id: "popover-attribute", label: "popover attribute & popovertarget" },
  { id: "popover-types", label: "popover=auto vs popover=manual" },
  { id: "popover-css", label: "Styling Popover" },
  { id: "starting-style", label: "@starting-style — Entry Animation" },
  { id: "popover-events", label: "Popover Events" },
  { id: "popover-anchor", label: "Popover + Anchor Positioning" },
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

type PopoverType = "auto" | "manual" | "backdrop"

function PopoverPlayground() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<PopoverType>("auto")
  const [eventLog, setEventLog] = useState<string[]>([])

  const log = (msg: string) => setEventLog(prev => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev.slice(0, 4)])

  const handleOpen = () => { setOpen(true); log("beforetoggle: closed → open") }
  const handleClose = () => { setOpen(false); log("beforetoggle: open → closed") }
  const handleToggle = () => { open ? handleClose() : handleOpen() }

  const types: PopoverType[] = ["auto", "manual", "backdrop"]

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>💬 Popover API Playground</PlaygroundWrap.label>
        <ChipRow>
          {types.map(t => (
            <Chip key={t} active={type === t} onClick={() => setType(t)}>
              popover={t === "backdrop" ? "auto + backdrop" : `"${t}"`}
            </Chip>
          ))}
        </ChipRow>
        <HintText>
          {type === "auto" ? "Klik di luar popover untuk menutup (light-dismiss)" :
            type === "manual" ? "Hanya tombol Close yang bisa menutup" :
              "auto dengan backdrop blur"}
        </HintText>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas>
        <PopoverContainer>
          {type === "auto" && open && (
            <Backdrop
              onClick={handleClose}
            />
          )}
          {type === "backdrop" && open && (
            <BackdropDim
              onClick={handleClose}
            />
          )}
          <DemoBtn onClick={handleOpen}>Open Popover</DemoBtn>
          <DemoBtn onClick={handleToggle}>Toggle</DemoBtn>
          {open && (
            <PopoverContent>
              <PopoverTitle>Ini adalah Popover!</PopoverTitle>
              <PopoverDescription>
                Mode: <CodeInline>{type}</CodeInline>
              </PopoverDescription>
              <CloseBtnFull onClick={handleClose}>
                Close
              </CloseBtnFull>
            </PopoverContent>
          )}
        </PopoverContainer>
        {eventLog.length > 0 && (
          <EventLog>
            {eventLog.map((e, i) => (
              <EventLogItem key={i}>{e}</EventLogItem>
            ))}
          </EventLog>
        )}
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>
        {open ? `[popover]:popover-open { opacity: 1; transform: scale(1); }` : `[popover] { opacity: 0; transform: scale(0.95); }`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

export default function PopoverApiPage() {
  const [activeSection, setActiveSection] = useState("intro")
  return (
    <Page>
      <TopBar><TopBarInner>
        <Breadcrumb>
          <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.link href="/learn/advandced">Advanced</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.curr>Popover API</Breadcrumb.curr>
        </Breadcrumb>
      </TopBarInner></TopBar>
      <Body>
        <Content>
          <PageTitle>Popover API</PageTitle>
          <PageDesc>Native browser API untuk popover, tooltip, dropdown, dan modal — dengan light-dismiss, keyboard navigation, dan animasi masuk/keluar gratis dari browser. Baseline 2024.</PageDesc>

          <Section id="intro" onClick={() => setActiveSection("intro")}>
            <H2>Apa itu Popover API<H2.anchor href="#intro">#</H2.anchor></H2>
            <P>Popover API adalah browser API yang memungkinkan pembuatan overlay UI (popover, tooltip, dropdown, menu) tanpa JavaScript yang kompleks. Browser menangani: stacking context, light-dismiss, keyboard trap, dan fokus manajemen.</P>
            <BadgeRow>
              <SupportBadge status="supported">✅ Chrome 114+</SupportBadge>
              <SupportBadge status="supported">✅ Edge 114+</SupportBadge>
              <SupportBadge status="supported">✅ Safari 17+</SupportBadge>
              <SupportBadge status="supported">✅ Firefox 125+</SupportBadge>
            </BadgeRow>
            <Callout type="tip">
              <Callout.icon>💬</Callout.icon>
              <Callout.content>
                <Callout.title>Baseline 2024 — Newly Available</Callout.title>
                Popover API sudah Baseline 2024. Keuntungan utama vs <IC>dialog</IC>: tidak perlu JavaScript untuk membuka/menutup — cukup HTML attribute <IC>popovertarget</IC>.
              </Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="popover-attribute" onClick={() => setActiveSection("popover-attribute")}>
            <H2>popover attribute & popovertarget<H2.anchor href="#popover-attribute">#</H2.anchor></H2>
            <P>Tambahkan atribut <IC>popover</IC> ke elemen yang menjadi popover. Hubungkan trigger button menggunakan <IC>popovertarget</IC> yang berisi id popover.</P>
            <Code file="popover-basic.html">{`
<!-- popovertarget menghubungkan button ke popover via id -->
<button popovertarget="my-popover">Open Popover</button>

<div id="my-popover" popover>
  <p>Konten popover. Klik di luar untuk tutup.</p>
  <button popovertarget="my-popover" popovertargetaction="hide">Close</button>
</div>

<!-- popover=manual — tidak auto-dismiss -->
<div id="manual-pop" popover="manual">
  Tidak tutup saat klik di luar
</div>

<!-- Toggle action -->
<button popovertarget="pop" popovertargetaction="show">Show</button>
<button popovertarget="pop" popovertargetaction="hide">Hide</button>
<button popovertarget="pop" popovertargetaction="toggle">Toggle</button>
        `}</Code>
            <H3>Keuntungan vs Dialog</H3>
            <P>Berbeda dengan <IC>{"<dialog>"}</IC>, popover: tidak block scroll halaman, tidak perlu <IC>showModal()</IC> JavaScript untuk membuka, bisa banyak yang terbuka bersamaan (dengan <IC>popover=manual</IC>), dan punya <IC>::backdrop</IC> bawaan.</P>
          </Section>
          <Divider />

          <Section id="popover-types" onClick={() => setActiveSection("popover-types")}>
            <H2>popover=auto vs popover=manual<H2.anchor href="#popover-types">#</H2.anchor></H2>
            <P>Ada dua mode popover yang menentukan perilaku dismiss dan jumlah yang bisa terbuka bersamaan.</P>
            <Code file="popover-types.html">{`
<!-- popover="auto" (default, sama dengan hanya "popover") -->
<!-- - Light-dismiss: tutup saat klik di luar atau tekan Escape -->
<!-- - Exclusive: hanya satu popover=auto bisa terbuka sekaligus -->
<!-- - Cocok untuk: menu, dropdown, tooltip -->
<div id="menu" popover>...</div>
<div id="menu" popover="auto">...</div>  <!-- sama -->

<!-- popover="manual" -->
<!-- - Tidak light-dismiss — harus tutup via JavaScript atau button -->
<!-- - Multiple bisa terbuka bersamaan -->
<!-- - Cocok untuk: toast notification, persistent panel -->
<div id="toast" popover="manual">Berhasil disimpan!</div>

<!-- popover="hint" (baru, di beberapa browser) -->
<!-- - Seperti auto tapi tidak menutup popover auto lain -->
<!-- - Cocok untuk tooltip -->
<div id="tooltip" popover="hint">Keterangan lebih lanjut</div>

<!-- Keyboard behavior: -->
<!-- auto: Escape menutup popover -->
<!-- manual: Escape TIDAK menutup (kecuali dihandle sendiri) -->
        `}</Code>
            <PopoverPlayground />
          </Section>
          <Divider />

          <Section id="popover-css" onClick={() => setActiveSection("popover-css")}>
            <H2>Styling Popover<H2.anchor href="#popover-css">#</H2.anchor></H2>
            <P>Popover secara default di-render di top layer dengan posisi centered. Override styles menggunakan selector <IC>[popover]</IC> dan <IC>[popover]:popover-open</IC>.</P>
            <Code file="popover-styles.css">{`
/* popover-styles.css */
[popover] {
  /* Default styles — override sesuai kebutuhan */
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);

  /* Transisi keluar — default state */
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
  transition: opacity 200ms ease, transform 200ms ease,
    display 200ms allow-discrete,
    overlay 200ms allow-discrete;
}

[popover]:popover-open {
  opacity: 1;
  transform: scale(1) translateY(0);
}

@starting-style {
  [popover]:popover-open {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
}

/* ::backdrop — latar belakang popover=auto */
[popover]::backdrop {
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(4px);
  transition: display 200ms allow-discrete, overlay 200ms allow-discrete,
    opacity 200ms;
}
@starting-style {
  [popover]:popover-open::backdrop { opacity: 0; }
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="starting-style" onClick={() => setActiveSection("starting-style")}>
            <H2>@starting-style — Entry Animation<H2.anchor href="#starting-style">#</H2.anchor></H2>
            <P><IC>@starting-style</IC> mendefinisikan nilai awal untuk transisi saat elemen pertama kali muncul — sebelum browser men-compute style awal. Tanpa ini, animasi masuk tidak bisa dilakukan dengan CSS transition.</P>
            <Code file="starting-style.css">{`
/* @starting-style — nilai saat elemen pertama kali di-display */
/* Tanpa ini: browser tidak tahu "dari mana" transisi dimulai */

/* Pattern standar untuk entry/exit animation: */
.modal {
  /* Style saat TERTUTUP (exit state) */
  opacity: 0;
  scale: 0.9;
  transition:
    opacity 200ms ease,
    scale 200ms ease,
    display 200ms allow-discrete,   /* allow-discrete: transisi display */
    overlay 200ms allow-discrete;   /* overlay: transisi top layer */
}

.modal:popover-open {
  /* Style saat TERBUKA */
  opacity: 1;
  scale: 1;
}

/* Nilai AWAL saat modal pertama muncul (entry animation) */
@starting-style {
  .modal:popover-open {
    opacity: 0;  /* mulai dari 0 → transisi ke 1 */
    scale: 0.9;
  }
}

/* Hasilnya:
   MASUK: dari @starting-style (0, 0.9) → :popover-open (1, 1)
   KELUAR: dari :popover-open (1, 1) → default (0, 0.9)
*/

/* Juga berguna untuk elemen yang baru ditambahkan ke DOM */
.new-item {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms, transform 300ms;
}

@starting-style {
  .new-item {
    opacity: 0;
    transform: translateY(-8px);
  }
}
        `}</Code>
            <Callout type="note">
              <Callout.icon>🎬</Callout.icon>
              <Callout.content>
                <Callout.title>allow-discrete untuk display transition</Callout.title>
                Nilai <IC>allow-discrete</IC> pada transition memungkinkan properti diskret seperti <IC>display</IC> dan <IC>visibility</IC> untuk di-transisi. Tanpa ini, elemen akan langsung hilang/muncul tanpa animasi.
              </Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="popover-events" onClick={() => setActiveSection("popover-events")}>
            <H2>Popover Events<H2.anchor href="#popover-events">#</H2.anchor></H2>
            <P>Popover memancarkan dua event: <IC>beforetoggle</IC> (sebelum state berubah, bisa di-cancel) dan <IC>toggle</IC> (setelah state berubah).</P>
            <Code file="popover-js.js">{`
// Programmatic control
const pop = document.getElementById('my-popover')
pop.showPopover()    // buka
pop.hidePopover()    // tutup
pop.togglePopover()  // toggle
pop.togglePopover(true)  // paksa buka

// Events
pop.addEventListener('beforetoggle', (e) => {
  console.log(e.oldState, '→', e.newState) // "closed" → "open"
})
pop.addEventListener('toggle', (e) => {
  console.log('toggled:', e.newState)
})
        `}</Code>
            <Code file="popover-react.tsx">{`
// React — simulasi Popover API dengan useState
// (di browser nyata, gunakan ref + popover attribute)
import { useRef, useEffect } from "react"

function PopoverDemo() {
  const popRef = useRef<HTMLDivElement>(null)

  const handleBeforeToggle = (e: Event) => {
    const toggle = e as ToggleEvent
    console.log(toggle.oldState, "→", toggle.newState)
    // Bisa preventDefault() untuk mencegah toggle
  }

  useEffect(() => {
    const el = popRef.current
    if (!el) return
    el.addEventListener("beforetoggle", handleBeforeToggle)
    return () => el.removeEventListener("beforetoggle", handleBeforeToggle)
  }, [])

  return (
    <>
      <button popovertarget="demo-pop">Open</button>
      {/* @ts-expect-error — popover masih experimental di TypeScript */}
      <div ref={popRef} id="demo-pop" popover="auto">
        Konten popover
      </div>
    </>
  )
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="popover-anchor" onClick={() => setActiveSection("popover-anchor")}>
            <H2>Popover + Anchor Positioning<H2.anchor href="#popover-anchor">#</H2.anchor></H2>
            <P>Kombinasi Popover API dan CSS Anchor Positioning adalah combo ideal: Popover menangani DOM, accessibility, dan dismiss. Anchor positioning menangani posisi visual.</P>
            <Code file="popover-anchor.css">{`
/* Kombinasi Popover API + CSS Anchor Positioning */
.trigger-btn {
  anchor-name: --dropdown-anchor;
}

/* Popover yang ikut posisi anchor */
.dropdown[popover] {
  position: fixed;
  position-anchor: --dropdown-anchor;
  inset-area: bottom span-all;
  width: anchor-size(width);
  margin-top: 4px;

  /* Styling */
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0.25rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);

  /* Animasi entry/exit */
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
  transition:
    opacity 150ms ease,
    transform 150ms ease,
    display 150ms allow-discrete,
    overlay 150ms allow-discrete;
}

.dropdown[popover]:popover-open {
  opacity: 1;
  transform: scale(1) translateY(0);
}

@starting-style {
  .dropdown[popover]:popover-open {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
}

/* Auto-flip dengan @position-try */
@position-try --flip-up {
  inset-area: top span-all;
  margin-top: 0;
  margin-bottom: 4px;
}

.dropdown[popover] {
  position-try-fallbacks: --flip-up;
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>Popover API di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
            <Code file="tw-popover.tsx">{`
import { tw } from "tailwind-styled-v4"

/* Popover trigger button */
const TriggerBtn = tw.button({
  base: [
    "px-3 py-1.5 rounded-lg text-sm font-medium",
    "bg-[var(--accent)] text-white hover:opacity-90",
    "[anchor-name:--popover-btn]",  /* daftarkan sebagai anchor */
  ].join(" "),
})

/* Popover element */
const PopoverPanel = tw.div({
  base: [
    /* Posisi menggunakan anchor */
    "fixed [position-anchor:--popover-btn]",
    "[inset-area:bottom_span-all]",
    "[width:anchor-size(width)]",
    "[margin-top:4px]",
    /* Styling */
    "bg-[var(--surface)] border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)]",
    "rounded-xl shadow-xl p-2 z-50",
    /* Entry/exit animation */
    "opacity-0 scale-95 -translate-y-1",
    "transition-[opacity,transform,display,overlay]",
    "[transition-duration:150ms]",
    "[[popover-open]&]:opacity-100 [[popover-open]&]:scale-100 [[popover-open]&]:translate-y-0",
    /* @starting-style via arbitrary CSS */
    "[@starting-style_&:popover-open]:opacity-0",
  ].join(" "),
})

/* MenuItem */
const MenuItem = tw.button({
  base: "w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] transition-colors",
})

/* Penggunaan — HTML popover attribute */
export function DropdownMenu() {
  return (
    <>
      {/* @ts-expect-error — popovertarget belum di TypeScript DOM types */}
      <TriggerBtn popovertarget="my-menu">Menu ▾</TriggerBtn>
      {/* @ts-expect-error */}
      <PopoverPanel id="my-menu" popover="auto">
        <MenuItem>Profil</MenuItem>
        <MenuItem>Pengaturan</MenuItem>
        <MenuItem>Keluar</MenuItem>
      </PopoverPanel>
    </>
  )
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Tooltip dengan Popover API</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat tooltip menggunakan <IC>popover="hint"</IC> (atau <IC>popover</IC>) + CSS Anchor Positioning. Tooltip muncul di atas target, auto-flip ke bawah jika tidak cukup ruang. Tambahkan animasi masuk menggunakan <IC>@starting-style</IC>.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Custom dropdown select</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat custom dropdown menggunakan <IC>popover="auto"</IC> + anchor positioning. Lebar dropdown harus sama dengan button trigger. Klik opsi harus menutup popover. Tambahkan animasi slide-down menggunakan <IC>@starting-style</IC> + <IC>allow-discrete</IC>.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Toast notification stack</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat sistem toast notification menggunakan <IC>popover="manual"</IC>. Multiple toast bisa muncul sekaligus, tersusun secara vertikal di pojok layar. Setiap toast auto-dismiss setelah 3 detik. Gunakan JavaScript API <IC>showPopover()</IC> dan <IC>hidePopover()</IC>.</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          <PageNav>
            <NavBtn href="/learn/advandced/container-style-queries" dir="prev"><NavBtn.hint>← Sebelumnya</NavBtn.hint><NavBtn.label>Container & Style Queries</NavBtn.label></NavBtn>
            <NavBtn href="/learn/advandced/view-transitions-advanced" dir="next"><NavBtn.hint>Selanjutnya →</NavBtn.hint><NavBtn.label>View Transitions Advanced</NavBtn.label></NavBtn>
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
