/**
 * CSS Medium — Colors & Gradients
 */
"use client"
import { useState } from "react"
import {
    Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
    PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
    CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
    PlaygroundWrap, Chip, ChipRow, ColorSwatch, GradientBox, ColorRow, ColorLabel,
} from "./styles"

const TOC = [
    { id: "formats", label: "Color Formats" },
    { id: "color-mix", label: "color-mix()" },
    { id: "relative-color", label: "Relative Color Syntax" },
    { id: "color-gamut", label: "color-gamut & P3" },
    { id: "linear-gradient", label: "linear-gradient" },
    { id: "radial-gradient", label: "radial-gradient" },
    { id: "conic-gradient", label: "conic-gradient" },
    { id: "repeating", label: "repeating-gradient" },
    { id: "interpolation", label: "Gradient Interpolation" },
    { id: "color-scheme", label: "color-scheme & accent-color" },
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

type GradientType = "linear" | "radial" | "conic" | "repeating"

function GradientPlayground() {
    const [type, setType] = useState<GradientType>("linear")
    const types: GradientType[] = ["linear", "radial", "conic", "repeating"]
    const descriptions: Record<GradientType, string> = {
        linear: "background: linear-gradient(135deg, #6366f1, #ec4899)",
        radial: "background: radial-gradient(circle at center, #6366f1, #ec4899)",
        conic: "background: conic-gradient(from 0deg, #6366f1, #ec4899, #6366f1)",
        repeating: "background: repeating-linear-gradient(45deg, #6366f1 0px, #6366f1 10px, #c7d2fe 10px, #c7d2fe 20px)",
    }
    return (
        <PlaygroundWrap>
            <PlaygroundWrap.controls>
                <PlaygroundWrap.label>🎨 Gradient Playground</PlaygroundWrap.label>
                <ChipRow>
                    {types.map(t => <Chip key={t} active={type === t} onClick={() => setType(t)}>{t}</Chip>)}
                </ChipRow>
            </PlaygroundWrap.controls>
            <PlaygroundWrap.canvas>
                <GradientBox gradient={type} />
            </PlaygroundWrap.canvas>
            <PlaygroundWrap.codeline>{descriptions[type]}</PlaygroundWrap.codeline>
        </PlaygroundWrap>
    )
}

export default function ColorsGradientsPage() {
    const [activeSection, setActiveSection] = useState("formats")
    return (
        <Page>
            <TopBar><TopBarInner>
                <Breadcrumb>
                    <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.link href="/learn/medium">Medium</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.curr>Colors & Gradients</Breadcrumb.curr>
                </Breadcrumb>
            </TopBarInner></TopBar>
            <Body>
                <Content>
                    <PageTitle>CSS Colors & Gradients</PageTitle>
                    <PageDesc>Dari hex klasik sampai oklch modern, color-mix(), relative color syntax, sampai gradient interpolation di color space berbeda.</PageDesc>

                    <Section id="formats" onClick={() => setActiveSection("formats")}>
                        <H2>Color Formats<H2.anchor href="#formats">#</H2.anchor></H2>
                        <P>CSS mendukung banyak format warna — dari hex lawas sampai format perceptual modern seperti <IC>oklch</IC> dan <IC>lab</IC> yang lebih intuitif untuk manipulasi warna.</P>
                        <div className="space-y-1 my-4">
                            {[
                                { label: "#6366f1", color: "#6366f1" },
                                { label: "rgb(99 102 241)", color: "rgb(99 102 241)" },
                                { label: "hsl(239 84% 67%)", color: "hsl(239deg 84% 67%)" },
                                { label: "oklch(60% 0.2 264)", color: "oklch(60% 0.2 264)" },
                                { label: "lch(50 60 264)", color: "lch(50 60 264)" },
                                { label: "color(display-p3 0.4 0.4 0.95)", color: "color(display-p3 0.4 0.4 0.95)" },
                            ].map(item => (
                                <ColorRow key={item.label}>
                                    <ColorSwatch style={{ background: item.color }} />
                                    <ColorLabel>{item.label}</ColorLabel>
                                </ColorRow>
                            ))}
                        </div>
                        <Code file="color-formats.css">{`
/* Hex — singkat tapi tidak intuitif */
.hex       { color: #6366f1; }
.hex-alpha { color: #6366f180; }   /* 80 = 50% opacity */
.hex-short { color: #639; }        /* = #663399 */

/* rgb/rgba — modern tidak butuh koma */
.rgb  { color: rgb(99 102 241); }
.rgba { color: rgb(99 102 241 / 0.5); }  /* modern syntax */

/* hsl/hsla — lebih intuitif untuk warna */
.hsl  { color: hsl(239 84% 67%); }
.hsla { color: hsl(239 84% 67% / 0.5); }

/* oklch — perceptually uniform, terbaik untuk design systems */
/* L = lightness 0–1, C = chroma 0–0.4, H = hue 0–360 */
.oklch { color: oklch(0.6 0.2 264); }

/* lch — seperti oklch tapi older */
.lch { color: lch(50 60 264); }

/* lab — lightness, a (green-red), b (blue-yellow) */
.lab { color: lab(50 10 -60); }

/* color() — akses color spaces lain */
.p3     { color: color(display-p3 0.4 0.4 0.95); }
.srgb   { color: color(srgb 0.39 0.4 0.95); }
.a98    { color: color(a98-rgb 0.35 0.35 0.9); }
        `}</Code>
                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                <Callout.title>Gunakan oklch untuk design systems</Callout.title>
                                <IC>oklch</IC> perceptually uniform — mengubah <IC>L</IC> sebesar 10% selalu terasa konsisten, tidak seperti hsl yang terasa berbeda di hue berbeda. Ideal untuk generate color palettes secara programatik.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="color-mix" onClick={() => setActiveSection("color-mix")}>
                        <H2>color-mix()<H2.anchor href="#color-mix">#</H2.anchor></H2>
                        <P><IC>color-mix()</IC> mencampur dua warna dalam color space tertentu — bisa untuk lighten, darken, atau mix warna tanpa preprocessor.</P>
                        <Code file="color-mix.css">{`
/* color-mix(in color-space, color1 percentage, color2) */
.mix-50 { color: color-mix(in oklch, #6366f1 50%, white); }
.mix-30 { color: color-mix(in oklch, #6366f1 30%, white); }
.mix-80 { color: color-mix(in oklch, #6366f1 80%, white); }

/* Lighten — mix dengan white */
.lighter { background: color-mix(in oklch, var(--primary) 70%, white); }

/* Darken — mix dengan black */
.darker  { background: color-mix(in oklch, var(--primary) 70%, black); }

/* Transparentize — mix dengan transparent */
.translucent { background: color-mix(in srgb, #6366f1 60%, transparent); }
/* Equivalent ke: rgba(99, 102, 241, 0.6) */

/* Mix dua warna brand */
.brand-mix { color: color-mix(in hsl, #6366f1, #ec4899); }

/* Di dalam custom properties */
:root {
  --primary: oklch(60% 0.2 264);
  --primary-light: color-mix(in oklch, var(--primary) 60%, white);
  --primary-dark:  color-mix(in oklch, var(--primary) 60%, black);
}

/* color-mix di oklch vs srgb menghasilkan hasil berbeda! */
/* oklch: lebih vivid, tidak melalui "dead zone" */
/* srgb:  standar, kadang warna menjadi kusam di tengah */
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="relative-color" onClick={() => setActiveSection("relative-color")}>
                        <H2>Relative Color Syntax<H2.anchor href="#relative-color">#</H2.anchor></H2>
                        <P>Relative color syntax memungkinkan modifikasi warna yang ada — ubah hanya satu channel (misal lightness) sambil mempertahankan channel lain.</P>
                        <Code file="relative-color.css">{`
/* Syntax: color-space(from source-color channels) */

:root { --accent: oklch(60% 0.2 264); }

/* Ubah lightness saja — buat varian yang konsisten */
.lighter { color: oklch(from var(--accent) 80% c h); }   /* lebih terang */
.darker  { color: oklch(from var(--accent) 40% c h); }   /* lebih gelap */
.muted   { color: oklch(from var(--accent) l 0.05 h); }  /* kurangi chroma */

/* Ubah hue saja — complementary color */
.complement { color: oklch(from var(--accent) l c calc(h + 180)); }
.triadic-1  { color: oklch(from var(--accent) l c calc(h + 120)); }
.triadic-2  { color: oklch(from var(--accent) l c calc(h + 240)); }

/* Ubah alpha */
.semi { color: oklch(from var(--accent) l c h / 0.5); }

/* Pakai di hsl */
:root { --base: hsl(239deg 84% 67%); }
.hsl-lighter { color: hsl(from var(--base) h s 85%); }
.hsl-less-sat { color: hsl(from var(--base) h 40% l); }

/* Membuat palettes secara otomatis */
.palette-100 { --c: oklch(from var(--brand) 95% calc(c * 0.3) h); }
.palette-500 { --c: oklch(from var(--brand) 60% c h); }
.palette-900 { --c: oklch(from var(--brand) 20% calc(c * 0.8) h); }
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="color-gamut" onClick={() => setActiveSection("color-gamut")}>
                        <H2>color-gamut & P3 Colors<H2.anchor href="#color-gamut">#</H2.anchor></H2>
                        <Code file="color-gamut.css">{`
/* @media color-gamut — detect display capability */
@media (color-gamut: srgb)   { /* semua modern display */ }
@media (color-gamut: p3)     { /* iPhone/Mac Retina, banyak modern display */ }
@media (color-gamut: rec2020){ /* high-end display, HDR TV */ }

/* Progressive enhancement — fallback ke srgb, upgrade ke P3 */
.button {
  background: #3b82f6;   /* sRGB fallback */
}

@media (color-gamut: p3) {
  .button {
    /* Warna lebih vivid di P3 display */
    background: color(display-p3 0 0.5 1);
  }
}

/* Cara modern — browser auto-pick yang terbaik */
.vivid {
  background: oklch(60% 0.25 264);
  /* oklch 0.25 chroma bisa out-of-gamut untuk sRGB */
  /* browser otomatis clamp ke sRGB jika display tidak support P3 */
}

/* color() function dengan berbagai spaces */
.srgb { color: color(srgb 0.39 0.4 0.95); }
.p3   { color: color(display-p3 0.35 0.37 0.93); }  /* vivid! */
.rec2020 { color: color(rec2020 0.33 0.35 0.91); }   /* paling vivid */
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="linear-gradient" onClick={() => setActiveSection("linear-gradient")}>
                        <H2>linear-gradient<H2.anchor href="#linear-gradient">#</H2.anchor></H2>
                        <GradientPlayground />
                        <Code file="linear-gradient.css">{`
/* Arah: to right, to bottom (default), angle */
.lr  { background: linear-gradient(to right, #6366f1, #ec4899); }
.tb  { background: linear-gradient(to bottom, #6366f1, #ec4899); }
.deg { background: linear-gradient(135deg, #6366f1, #ec4899); }

/* Multiple color stops */
.multi {
  background: linear-gradient(
    to right,
    #6366f1 0%,
    #818cf8 25%,
    #c084fc 50%,
    #f472b6 75%,
    #ec4899 100%
  );
}

/* Hard stop — tanpa transisi */
.hard {
  background: linear-gradient(
    to right,
    #6366f1 50%,
    #ec4899 50%    /* hard stop — langsung berganti */
  );
}

/* Transparent stop untuk fade effect */
.fade-out {
  background: linear-gradient(
    to right,
    #6366f1,
    transparent
  );
}

/* Layering multiple gradients */
.layered {
  background:
    linear-gradient(45deg, rgba(99,102,241,0.5), transparent),
    linear-gradient(135deg, rgba(236,72,153,0.5), transparent),
    #ffffff;
}
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="radial-gradient" onClick={() => setActiveSection("radial-gradient")}>
                        <H2>radial-gradient<H2.anchor href="#radial-gradient">#</H2.anchor></H2>
                        <Code file="radial-gradient.css">{`
/* Default: ellipse at center */
.radial { background: radial-gradient(#6366f1, #ec4899); }

/* Shape: circle atau ellipse */
.circle  { background: radial-gradient(circle, #6366f1, #ec4899); }
.ellipse { background: radial-gradient(ellipse, #6366f1, #ec4899); }

/* Size keywords */
.closest-side { background: radial-gradient(circle closest-side, #6366f1, #ec4899); }
.farthest     { background: radial-gradient(circle farthest-corner, #6366f1, #ec4899); }

/* Position: at x y */
.top-left   { background: radial-gradient(circle at top left, #6366f1, #ec4899); }
.custom-pos { background: radial-gradient(circle at 30% 70%, #6366f1, #ec4899); }

/* Spotlight effect */
.spotlight {
  background: radial-gradient(
    circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(99,102,241,0.3) 0%,
    transparent 60%
  );
}

/* Vignette */
.vignette {
  background: radial-gradient(
    ellipse at center,
    transparent 50%,
    rgba(0,0,0,0.5) 100%
  );
}
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="conic-gradient" onClick={() => setActiveSection("conic-gradient")}>
                        <H2>conic-gradient<H2.anchor href="#conic-gradient">#</H2.anchor></H2>
                        <Code file="conic-gradient.css">{`
/* Conic gradient — memutar dari titik pusat */
.conic { background: conic-gradient(#6366f1, #ec4899, #6366f1); }

/* From angle (mulai dari sudut tertentu) */
.from-top { background: conic-gradient(from 0deg, red, green, blue, red); }
.from-right { background: conic-gradient(from 90deg, red, green, blue, red); }

/* Pie chart — dengan hard stops */
.pie {
  background: conic-gradient(
    #6366f1 0deg 120deg,    /* 33% */
    #ec4899 120deg 240deg,  /* 33% */
    #f59e0b 240deg 360deg   /* 33% */
  );
  border-radius: 50%;
}

/* Progress ring */
.progress {
  background: conic-gradient(
    #6366f1 0deg calc(var(--progress, 0.7) * 360deg),
    #e5e7eb calc(var(--progress, 0.7) * 360deg) 360deg
  );
  border-radius: 50%;
}

/* Starburst / color wheel */
.color-wheel {
  background: conic-gradient(
    hsl(0 100% 60%), hsl(60 100% 60%), hsl(120 100% 60%),
    hsl(180 100% 60%), hsl(240 100% 60%), hsl(300 100% 60%),
    hsl(360 100% 60%)
  );
  border-radius: 50%;
}

/* Checkerboard dengan conic */
.checkerboard {
  background: conic-gradient(#000 90deg, #fff 90deg 180deg, #000 180deg 270deg, #fff 270deg);
  background-size: 20px 20px;
}
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="repeating" onClick={() => setActiveSection("repeating")}>
                        <H2>repeating-gradient<H2.anchor href="#repeating">#</H2.anchor></H2>
                        <Code file="repeating-gradient.css">{`
/* repeating-linear-gradient — pola berulang */
.stripes {
  background: repeating-linear-gradient(
    45deg,
    #6366f1 0px, #6366f1 10px,
    #c7d2fe 10px, #c7d2fe 20px
  );
}

/* Stripes horizontal */
.h-stripes {
  background: repeating-linear-gradient(
    to bottom,
    #f8fafc 0px, #f8fafc 20px,
    #e2e8f0 20px, #e2e8f0 40px
  );
}

/* Diagonal hazard tape */
.hazard {
  background: repeating-linear-gradient(
    -45deg,
    transparent 0, transparent 10px,
    #fbbf24 10px, #fbbf24 20px
  );
}

/* repeating-radial-gradient */
.rings {
  background: repeating-radial-gradient(
    circle at center,
    #6366f1 0px, #6366f1 5px,
    transparent 5px, transparent 20px
  );
}

/* repeating-conic-gradient */
.fan {
  background: repeating-conic-gradient(
    #6366f1 0deg 10deg,
    #c7d2fe 10deg 20deg
  );
}
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="interpolation" onClick={() => setActiveSection("interpolation")}>
                        <H2>Gradient Interpolation & Color Space<H2.anchor href="#interpolation">#</H2.anchor></H2>
                        <P>Gradient interpolation di color space berbeda menghasilkan transisi warna yang berbeda. <IC>oklch</IC> biasanya menghasilkan transisi paling vivid dan natural.</P>
                        <Code file="gradient-interpolation.css">{`
/* Syntax: gradient(in color-space, ...) */
.srgb-grad {
  background: linear-gradient(in srgb, #6366f1, #ec4899);
  /* default — bisa melalui "dead zone" abu-abu di tengah */
}

.hsl-grad {
  background: linear-gradient(in hsl, #6366f1, #ec4899);
  /* lebih berwarna, tapi hue bisa "muter" */
}

.oklch-grad {
  background: linear-gradient(in oklch, #6366f1, #ec4899);
  /* perceptually uniform — transisi paling natural */
}

/* Hue interpolation methods */
.shorter {
  background: linear-gradient(in hsl shorter hue, hsl(10 100% 50%), hsl(350 100% 50%));
  /* jalan pintas — lewat hue 10→0→350 (dekat) */
}

.longer {
  background: linear-gradient(in hsl longer hue, hsl(10 100% 50%), hsl(350 100% 50%));
  /* jalan panjang — lewat semua hue */
}

/* Contoh di radial */
.vivid-radial {
  background: radial-gradient(in oklch, #6366f1, transparent);
  /* lebih vivid daripada default sRGB */
}
        `}</Code>
                        <Callout type="note">
                            <Callout.icon>ℹ️</Callout.icon>
                            <Callout.content>
                                Gradient dari biru ke merah di <IC>srgb</IC> akan melewati abu-abu kusam di tengah. Di <IC>oklch</IC> dengan <IC>longer hue</IC>, ia melewati semua spektrum warna — merah, orange, kuning, hijau, biru.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    {/* ── color-scheme & accent-color ─────────────────── */}
                    <Section id="color-scheme" onClick={() => setActiveSection("color-scheme")}>
                        <H2>color-scheme & accent-color<H2.anchor href="#color-scheme">#</H2.anchor></H2>
                        <P>
                            <IC>color-scheme</IC> memberi tahu browser color scheme yang didukung halaman,
                            sehingga browser bisa menyesuaikan UI default (scrollbar, input, select).
                            <IC>accent-color</IC> mengubah warna aksen elemen form native (checkbox, radio, range, progress).
                        </P>
                        <Code file="color-scheme.css">{`
/* color-scheme — deklarasikan apa yang didukung halaman */
:root {
  color-scheme: light dark;  /* support keduanya — browser pilih sesuai system */
  color-scheme: light;        /* hanya light mode */
  color-scheme: dark;         /* hanya dark mode */
  color-scheme: only light;   /* paksa light, abaikan system preference */
}

/* Per-elemen — berguna untuk dark card di halaman light */
.dark-section {
  color-scheme: dark;
  /* Scrollbar, input, select di dalam .dark-section ikut dark scheme */
}

/* accent-color — warna aksen form elements native */
:root {
  accent-color: #6366f1;   /* semua form controls */
}

/* Per-elemen */
input[type="checkbox"] { accent-color: #6366f1; }
input[type="radio"]    { accent-color: #ec4899; }
input[type="range"]    { accent-color: #22c55e; }
progress               { accent-color: #f59e0b; }

/* auto = warna aksen dari OS/browser */
:root { accent-color: auto; }

/* System colors — pakai warna dari OS */
.system-aware {
  background: Canvas;            /* background utama */
  color: CanvasText;             /* teks utama */
  border-color: ButtonBorder;    /* border tombol */
}
/* Canvas, CanvasText, LinkText, VisitedText, ActiveText,
   ButtonFace, ButtonText, ButtonBorder,
   Field, FieldText, Highlight, HighlightText,
   GrayText, Mark, MarkText, AccentColor, AccentColorText */

/* forced-colors — Windows High Contrast Mode */
@media (forced-colors: active) {
  /* Override warna yang di-hardcode ke system colors */
  .custom-button {
    background: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonBorder;
  }
}

/* currentColor — nilai dari 'color' property */
.icon {
  color: #6366f1;
  fill: currentColor;        /* SVG fill = #6366f1 */
  border-color: currentColor;
}

/* transparent */
.ghost { background: transparent; }
/* = rgb(0 0 0 / 0) — fully transparent */
                        `}</Code>
                        <Callout type="note">
                            <Callout.icon>ℹ️</Callout.icon>
                            <Callout.content>
                                <Callout.title>color-scheme vs prefers-color-scheme</Callout.title>
                                <IC>prefers-color-scheme</IC> adalah media query yang membaca preferensi user.
                                <IC>color-scheme</IC> adalah properti yang memberi tahu browser apa yang halaman support.
                                Keduanya saling melengkapi: baca preferensi via media query, deklarasikan support via color-scheme.
                            </Callout.content>
                        </Callout>
                    </Section>

                    <Divider />

                    <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
                        <H2>Colors & Gradients di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
                        <Code file="colors-tw.tsx">{`
import { tw } from "tailwind-styled-v4"

/* Gradient backgrounds via Tailwind utilities */
const HeroBg = tw.div({
  base: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
})

/* oklch via arbitrary values */
const OklchCard = tw.div({
  base: "bg-[oklch(60%_0.2_264)] text-white rounded-xl p-4",
})

/* color-mix via arbitrary value */
const MixedBg = tw.div({
  base: "bg-[color-mix(in_oklch,#6366f1_70%,white)] rounded-xl p-4",
})

/* Gradient dengan color stops custom */
const GradientHeader = tw.div({
  base: "bg-[linear-gradient(135deg,#6366f1,#ec4899)] text-white p-6 rounded-xl",
})

/* CSS custom property untuk gradient dinamis */
const DynamicGradient = tw.div({
  base: "rounded-xl p-4 text-white",
  style: {
    background: "linear-gradient(var(--grad-angle, 135deg), var(--grad-from, #6366f1), var(--grad-to, #ec4899))",
  } as React.CSSProperties,
})
        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="exercise" onClick={() => setActiveSection("exercise")}>
                        <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — oklch color palette</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat design token menggunakan <IC>oklch</IC> untuk warna brand. Generate 10 shades (100–900) dengan relative color syntax: <IC>oklch(from var(--brand) calc(l + 0.3 * (1 - t)) c h)</IC>.</p>
                                <p>Bandingkan palette yang dihasilkan oleh oklch vs hsl — perhatikan perceptual uniformity-nya.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Animated conic gradient</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat progress indicator menggunakan <IC>conic-gradient</IC> dan <IC>@property</IC> untuk mendaftarkan <IC>--progress</IC> sebagai <IC>{'<percentage>'}</IC>. Animasikan dari 0% ke 100% saat hover.</p>
                                <p>Tambahkan mask untuk membuat ring (donut) effect menggunakan <IC>mask: radial-gradient</IC>.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — color-mix theming</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat sistem warna menggunakan <IC>color-mix()</IC> yang otomatis menghasilkan: tint (+ white), shade (+ black), dan tone (+ gray) dari satu warna base.</p>
                                <p>Definisikan sebagai custom properties dan gunakan untuk membuat button dengan <IC>:hover</IC> dan <IC>:active</IC> state yang konsisten secara visual.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/medium/typography" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>Typography</NavBtn.label></NavBtn>
                        <NavBtn href="/learn/medium/transitions-animations" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>Transitions & Animations</NavBtn.label></NavBtn>
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
