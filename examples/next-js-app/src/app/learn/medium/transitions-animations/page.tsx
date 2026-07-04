/**
 * CSS Medium — Transitions & Animations
 */
"use client"
import { useState } from "react"
import {
    Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
    PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
    CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
    PlaygroundWrap, Chip, ChipRow, AnimBox, TimingRow, TimingLabel,
} from "./styles"

const TOC = [
    { id: "transition", label: "transition shorthand" },
    { id: "timing-fn", label: "timing-function" },
    { id: "keyframes", label: "@keyframes" },
    { id: "animation", label: "animation shorthand" },
    { id: "play-state", label: "play-state & composition" },
    { id: "reduced-motion", label: "prefers-reduced-motion" },
    { id: "scroll-driven", label: "Scroll-Driven Animations" },
    { id: "view-transition", label: "View Transitions API" },
    { id: "starting-style", label: "@starting-style & transition-behavior" },
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

type EasingType = "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"

function TransitionPlayground() {
    const [easing, setEasing] = useState<EasingType>("ease")
    const [playing, setPlaying] = useState(false)
    const easings: EasingType[] = ["linear", "ease", "ease-in", "ease-out", "ease-in-out"]

    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>⚡ Transition Playground</PlaygroundWrap.label>
                <ChipRow>
                    {easings.map(e => <Chip key={e} active={easing === e} onClick={() => setEasing(e)}>{e}</Chip>)}
                </ChipRow>
                <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_50%,transparent)]">Klik kotak untuk trigger transition</p>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <div className="flex items-center gap-4">
                    <AnimBox
                        color="indigo"
                        onClick={() => setPlaying(p => !p)}
                        style={{
                            transition: `transform 600ms ${easing}, border-radius 600ms ${easing}`,
                            transform: playing ? "translateX(80px) rotate(180deg)" : "translateX(0) rotate(0deg)",
                            borderRadius: playing ? "50%" : "12px",
                        }}
                    >
                        {playing ? "↩" : "→"}
                    </AnimBox>
                </div>
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>
                {`transition: transform 600ms ${easing}, border-radius 600ms ${easing};`}
            </PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

export default function TransitionsAnimationsPage() {
    const [activeSection, setActiveSection] = useState("transition")
    return (
        <Page>
            <TopBar><TopBarInner>
                <Breadcrumb>
                    <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.link href="/learn/medium">Medium</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.curr>Transitions & Animations</Breadcrumb.curr>
                </Breadcrumb>
            </TopBarInner></TopBar>
            <Body>
                <Content>
                    <PageTitle>CSS Transitions & Animations</PageTitle>
                    <PageDesc>Dari transition sederhana sampai scroll-driven animations dan View Transitions API — panduan lengkap motion di CSS modern.</PageDesc>

                    <Section id="transition" onClick={() => setActiveSection("transition")}>
                        <H2>transition shorthand<H2.anchor href="#transition">#</H2.anchor></H2>
                        <P><IC>transition</IC> mendefinisikan bagaimana perubahan property CSS ditampilkan — dari state A ke state B secara smooth.</P>
                        <Code file="transition.css">{`
/* Sintax: property duration timing-function delay */
.btn {
  transition: background-color 200ms ease;
}

/* Multiple properties */
.card {
  transition:
    transform     300ms ease-out,
    box-shadow    300ms ease-out,
    border-color  200ms ease;
}

/* transition: all — animasikan semua yang berubah */
/* ⚠️ Hati-hati: bisa animasikan height, display, dll — cukup mahal */
.risky { transition: all 300ms ease; }

/* transition-property: none untuk disable */
.no-trans { transition: none; }

/* Transition individual properties */
.explicit {
  transition-property: transform, opacity;
  transition-duration: 300ms, 200ms;
  transition-timing-function: ease-out, ease;
  transition-delay: 0ms, 50ms;
}

/* Delay untuk stagger effect */
.item:nth-child(1) { transition-delay: 0ms; }
.item:nth-child(2) { transition-delay: 50ms; }
.item:nth-child(3) { transition-delay: 100ms; }

/* PENTING: hanya animatable properties yang bisa di-transition */
/* Tidak bisa: display, visibility (langsung switch) */
/* Bisa: opacity, transform, color, background, width, height, dll */
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="timing-fn" onClick={() => setActiveSection("timing-fn")}>
                        <H2>transition-timing-function<H2.anchor href="#timing-fn">#</H2.anchor></H2>
                        <TransitionPlayground />
                        <div className="my-4 space-y-2">
                            {[
                                { label: "linear", desc: "kecepatan konstan" },
                                { label: "ease", desc: "lambat-cepat-lambat (default)" },
                                { label: "ease-in", desc: "mulai lambat, makin cepat" },
                                { label: "ease-out", desc: "mulai cepat, makin lambat" },
                                { label: "ease-in-out", desc: "lambat-cepat-lambat simetris" },
                                { label: "cubic-bezier(0.34, 1.56, 0.64, 1)", desc: "spring/bounce" },
                                { label: "steps(4, end)", desc: "animasi bertahap/frame" },
                            ].map(item => (
                                <TimingRow key={item.label}>
                                    <TimingLabel>{item.label.length > 16 ? item.label.slice(0, 15) + "…" : item.label}</TimingLabel>
                                    <span className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{item.desc}</span>
                                </TimingRow>
                            ))}
                        </div>
                        <Code file="timing-function.css">{`
/* Built-in keywords */
.linear      { transition-timing-function: linear; }
.ease        { transition-timing-function: ease; }
.ease-in     { transition-timing-function: ease-in; }
.ease-out    { transition-timing-function: ease-out; }
.ease-in-out { transition-timing-function: ease-in-out; }

/* cubic-bezier(p1x, p1y, p2x, p2y) — custom curve */
/* Nilai y bisa > 1 untuk overshoot (spring/bounce) */
.spring  { transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1); }
.smooth  { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
.decel   { transition-timing-function: cubic-bezier(0, 0, 0.2, 1); }
.accel   { transition-timing-function: cubic-bezier(0.4, 0, 1, 1); }

/* steps() — animasi bertahap seperti sprite sheet */
.steps-4     { transition-timing-function: steps(4, end); }
.steps-start { transition-timing-function: step-start; }  /* = steps(1, start) */
.steps-end   { transition-timing-function: step-end; }    /* = steps(1, end) */

/* linear() — custom easing dengan waypoints (modern) */
.custom-linear {
  transition-timing-function: linear(
    0, 0.5 25%, 1 50%, 0.8 75%, 1
  );
}
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="keyframes" onClick={() => setActiveSection("keyframes")}>
                        <H2>@keyframes<H2.anchor href="#keyframes">#</H2.anchor></H2>
                        <Code file="keyframes.css">{`
/* @keyframes namaAnimasi { from { } to { } } */
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Persentase — kontrol lebih presisi */
@keyframes slide-up {
  0%   { transform: translateY(20px); opacity: 0; }
  60%  { transform: translateY(-5px); opacity: 1; }
  100% { transform: translateY(0); }
}

/* Bounce */
@keyframes bounce {
  0%, 100% { transform: translateY(0); animation-timing-function: ease-in; }
  50%       { transform: translateY(-20px); animation-timing-function: ease-out; }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.7; transform: scale(0.97); }
}

/* Spin */
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Shimmer (loading skeleton) */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="animation" onClick={() => setActiveSection("animation")}>
                        <H2>animation shorthand<H2.anchor href="#animation">#</H2.anchor></H2>
                        <Code file="animation.css">{`
/* Sintax: name duration timing fill-mode iteration direction delay */
.el { animation: fade-in 300ms ease forwards; }

/* Longhand equivalents */
.el {
  animation-name: fade-in;
  animation-duration: 300ms;
  animation-timing-function: ease;
  animation-fill-mode: forwards;    /* none, forwards, backwards, both */
  animation-iteration-count: 1;     /* 1, infinite, atau angka */
  animation-direction: normal;      /* normal, reverse, alternate, alternate-reverse */
  animation-delay: 0ms;
}

/* fill-mode penting! */
/* none     — kembali ke state awal setelah selesai */
/* forwards — tetap di state terakhir */
/* backwards— terapkan keyframe pertama saat delay */
/* both     — gabungan forwards + backwards */

/* Multiple animations */
.multi {
  animation:
    slide-up 400ms ease-out forwards,
    pulse 2s ease-in-out 400ms infinite;
}

/* Infinite loop dengan alternate */
.breathing {
  animation: pulse 2s ease-in-out infinite alternate;
}

/* Stagger dengan animation-delay */
.list-item {
  animation: slide-up 300ms ease-out forwards;
  opacity: 0; /* initial — akan di-override oleh keyframe */
}
.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 75ms; }
.list-item:nth-child(3) { animation-delay: 150ms; }
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="play-state" onClick={() => setActiveSection("play-state")}>
                        <H2>animation-play-state & animation-composition<H2.anchor href="#play-state">#</H2.anchor></H2>
                        <Code file="play-state.css">{`
/* animation-play-state: paused / running */
.spinner { animation: spin 1s linear infinite; }
.spinner:hover { animation-play-state: paused; }

/* Kontrol via JavaScript */
el.style.animationPlayState = 'paused';
el.style.animationPlayState = 'running';

/* animation-composition — bagaimana keyframe berinteraksi dengan nilai existing */
.el {
  transform: translateX(100px);   /* base value */
  animation: slide 1s forwards;
}

/* replace  — ganti nilai existing (default) */
/* add      — tambahkan ke nilai existing */
/* accumulate — akumulasi nilai */

@keyframes slide { to { transform: translateX(50px); } }
/* replace: akhirnya 50px */
/* add:     akhirnya 150px (100 + 50) */

.additive {
  animation-composition: add;
  animation: slide 1s forwards;
}
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="reduced-motion" onClick={() => setActiveSection("reduced-motion")}>
                        <H2>prefers-reduced-motion<H2.anchor href="#reduced-motion">#</H2.anchor></H2>
                        <P>Selalu sediakan fallback untuk user yang memilih reduced motion — baik karena kondisi medis (vestibular disorder) maupun preferensi. Ini bukan opsional, ini aksesibilitas.</P>
                        <Code file="reduced-motion.css">{`
/* Pattern 1 — disable animasi saat reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Pattern 2 — conditional add (lebih recommended) */
/* Default: tidak ada animasi */
.card { transition: none; }

/* Animasi hanya ditambahkan jika user tidak prefer reduced motion */
@media (prefers-reduced-motion: no-preference) {
  .card {
    transition: transform 300ms ease, box-shadow 300ms ease;
  }
}

/* Pattern 3 — alternatif animasi yang lebih tenang */
.hero {
  animation: fade-in 500ms ease;  /* fade — aman */
}

@media (prefers-reduced-motion: reduce) {
  .hero {
    /* Hapus movement, tetap pakai fade */
    animation: fade-in 200ms ease;
  }
}

/* JavaScript check */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReduced) { el.classList.add('animated'); }
        `}</Code>
                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>Aksesibilitas animasi</Callout.title>
                                Animasi yang berlebihan bisa memicu pusing, mual, atau serangan pada penderita vestibular disorder dan epilepsi. <IC>prefers-reduced-motion</IC> harus selalu diimplementasikan pada animasi yang bergerak, bukan hanya sekedar fade.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="scroll-driven" onClick={() => setActiveSection("scroll-driven")}>
                        <H2>Scroll-Driven Animations<H2.anchor href="#scroll-driven">#</H2.anchor></H2>
                        <P>Scroll-driven animations menghubungkan progress animasi dengan posisi scroll — tanpa JavaScript, murni CSS. Didukung Chrome 115+ dan Firefox 110+.</P>
                        <Code file="scroll-driven.css">{`
/* animation-timeline: scroll() — linked ke scroll container */
@keyframes reveal {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}

.section {
  animation: reveal linear both;
  animation-timeline: view();          /* trigger saat elemen masuk viewport */
  animation-range: entry 0% entry 40%; /* mulai saat masuk 0%, selesai di 40% */
}

/* scroll() — global scroll progress */
.progress-bar {
  position: fixed;
  top: 0;
  width: 0%;  /* initial */
  height: 3px;
  background: #6366f1;
  animation: grow-bar linear;
  animation-timeline: scroll(root);   /* track scroll root */
}

@keyframes grow-bar {
  from { width: 0%; }
  to   { width: 100%; }
}

/* animation-range values */
/* entry  — saat elemen masuk viewport */
/* exit   — saat elemen keluar viewport */
/* cover  — dari mulai masuk sampai selesai keluar */
/* contain— saat fully visible */

.fade-in-out {
  animation: fade linear both;
  animation-timeline: view();
  animation-range: entry 0%, exit 100%;
}

/* Scroll-linked parallax */
@keyframes parallax {
  from { transform: translateY(0); }
  to   { transform: translateY(-50%); }
}
.bg-layer {
  animation: parallax linear;
  animation-timeline: scroll(root);
}
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="view-transition" onClick={() => setActiveSection("view-transition")}>
                        <H2>View Transitions API<H2.anchor href="#view-transition">#</H2.anchor></H2>
                        <P>View Transitions API membuat transisi smooth antar halaman atau perubahan DOM yang besar — built-in browser, tanpa library external.</P>
                        <Code file="view-transition.css">{`
/* CSS untuk View Transitions */

/* Default transition — fade */
::view-transition-old(root) {
  animation: fade-out 300ms ease forwards;
}
::view-transition-new(root) {
  animation: fade-in 300ms ease forwards;
}

/* Custom per-elemen dengan view-transition-name */
.hero-image {
  view-transition-name: hero;    /* nama unik di halaman */
}

/* Override animasi untuk elemen spesifik */
::view-transition-old(hero) {
  animation: slide-out 400ms ease forwards;
}
::view-transition-new(hero) {
  animation: slide-in 400ms ease forwards;
}

/* @view-transition — di file CSS (Next.js/MPA) */
@view-transition {
  navigation: auto;    /* enable untuk semua navigasi */
}

/* JavaScript API — SPA */
if (document.startViewTransition) {
  document.startViewTransition(() => {
    updateDOM();   /* update DOM di dalam callback */
  });
} else {
  updateDOM();    /* fallback tanpa transisi */
}

/* Next.js App Router — experimental */
/* unstable_ViewTransition dari "react" (React 19+) */
        `}</Code>
                        <Callout type="note">
                            <Callout.icon>ℹ️</Callout.icon>
                            <Callout.content>
                                View Transitions API bekerja dengan mengambil snapshot DOM sebelum dan sesudah perubahan, lalu menganimasikan transisi antar keduanya. <IC>view-transition-name</IC> yang unik memungkinkan elemen "terbang" dari posisi lama ke posisi baru (shared element transitions).
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    {/* ── @starting-style & transition-behavior ─────────── */}
                    <Section id="starting-style" onClick={() => setActiveSection("starting-style")}>
                        <H2>@starting-style & transition-behavior: allow-discrete<H2.anchor href="#starting-style">#</H2.anchor></H2>
                        <P>
                            <IC>@starting-style</IC> mendefinisikan state awal untuk animasi entry pada elemen yang baru tampil
                            (dari <IC>display: none</IC>, popover, dialog). Tanpa ini, browser tidak tahu dari mana harus
                            memulai transisi karena elemen sebelumnya tidak exist.
                            <IC>transition-behavior: allow-discrete</IC> memungkinkan transisi pada properti "discrete"
                            seperti <IC>display</IC> dan <IC>content-visibility</IC>.
                        </P>
                        <Code file="starting-style.css">{`
/* Masalah: elemen dari display:none tidak bisa di-animate */
/* Browser tidak tahu "dari mana" memulai transisi */

/* ❌ Tidak bekerja — elemen langsung muncul tanpa animasi */
.menu {
  display: none;
  opacity: 0;
  transition: opacity 300ms ease;
}
.menu.open {
  display: block;
  opacity: 1;
}

/* ✅ Bekerja dengan @starting-style */
.menu {
  display: none;
  opacity: 1;
  transition: opacity 300ms ease, display 300ms allow-discrete;
}
.menu.open { display: block; }

@starting-style {
  .menu.open {
    opacity: 0;    /* state awal saat pertama kali muncul */
  }
}

/* Contoh popover / dialog animation */
[popover] {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
  transition:
    opacity 200ms ease,
    transform 200ms ease,
    display 200ms allow-discrete,
    overlay 200ms allow-discrete;
}

[popover]:popover-open {
  opacity: 1;
  transform: scale(1) translateY(0);
}

@starting-style {
  [popover]:popover-open {
    opacity: 0;                          /* dari ini... */
    transform: scale(0.95) translateY(-8px);
  }
}
/* entry: mulai dari @starting-style → ke :popover-open state */
/* exit:  dari :popover-open state → ke nilai default (opacity:0) */

/* transition-behavior: allow-discrete */
/* display dan content-visibility adalah "discrete" properties */
/* (nilainya langsung berganti, tidak interpolate) */
/* allow-discrete mengizinkan mereka ikut dalam transition */
.el {
  transition:
    opacity 300ms ease,
    display 300ms allow-discrete;    /* display bisa di-transition! */
}

/* content-visibility juga perlu allow-discrete */
.lazy {
  content-visibility: hidden;
  transition: content-visibility 300ms allow-discrete;
}
.lazy.shown {
  content-visibility: visible;
}
                        `}</Code>
                        <Callout type="note">
                            <Callout.icon>ℹ️</Callout.icon>
                            <Callout.content>
                                <Callout.title>Browser support</Callout.title>
                                <IC>@starting-style</IC> didukung Chrome 117+, Firefox 129+, Safari 17.5+.
                                Untuk browser lama, gunakan JavaScript classList toggle sebagai fallback.
                                Ini adalah cara modern menggantikan library animasi JavaScript untuk
                                show/hide sederhana.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
                        <H2>Transitions & Animations di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
                        <Code file="animations-tw.tsx">{`
import { tw } from "tailwind-styled-v4"

/* Component dengan built-in transitions */
const Button = tw.button({
  base: "px-4 py-2 rounded-lg bg-indigo-500 text-white transition-all duration-200 ease-out hover:scale-105 hover:shadow-lg active:scale-95",
})

/* Loading spinner via Tailwind animate utilities */
const Spinner = tw.div({
  base: "w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin",
})

/* Pulse skeleton */
const Skeleton = tw.div({
  base: "rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] animate-pulse",
})

/* Custom animation via arbitrary value */
const FadeIn = tw.div({
  base: "[animation:fade-in_300ms_ease_forwards] opacity-0",
})

/* Reduced motion aware */
const Animated = tw.div({
  base: "transition-transform duration-300 motion-reduce:transition-none motion-reduce:transform-none",
})

/* View transition name */
const HeroImg = tw.img({
  base: "[view-transition-name:hero] rounded-xl",
})
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="exercise" onClick={() => setActiveSection("exercise")}>
                        <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Stagger entrance animation</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat list item yang masuk dengan stagger effect menggunakan <IC>animation-delay</IC> yang berbeda per item (<IC>nth-child</IC>). Gunakan <IC>@keyframes slide-up</IC> dengan <IC>opacity</IC> dan <IC>transform</IC>.</p>
                                <p>Wrap semua di <IC>@media (prefers-reduced-motion: no-preference)</IC>.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Scroll progress bar</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat reading progress bar di atas halaman yang mengisi dari 0% ke 100% seiring scroll menggunakan <IC>animation-timeline: scroll(root)</IC>.</p>
                                <p>Gunakan <IC>@keyframes</IC> yang menganimasikan <IC>scaleX</IC> dari 0 ke 1 dengan <IC>transform-origin: left</IC>.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — View transition antara dua state</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat komponen yang toggle antara dua state (expanded/collapsed) menggunakan <IC>document.startViewTransition()</IC>. Tambahkan <IC>view-transition-name</IC> ke elemen yang berubah.</p>
                                <p>Override <IC>::view-transition-old</IC> dan <IC>::view-transition-new</IC> dengan animasi custom yang sesuai dengan arah toggle.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/medium/colors-gradients" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>Colors & Gradients</NavBtn.label></NavBtn>
                        <NavBtn href="/learn/medium/transforms" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>Transforms</NavBtn.label></NavBtn>
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
