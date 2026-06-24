"use client";

import { useState } from "react";
import { tw } from "tailwind-styled-v4";

// -- Component imports ---------------------------------------------------------
import {
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  OutlineButton,
  GhostButton,
} from "@/components/Button";
import {
  InfoAlert,
  SuccessAlert,
  WarningAlert,
  ErrorAlert,
} from "@/components/Alert";
import { Badge } from "@/components/Badge";
import { Card, HoverableCard } from "@/components/Card";
import { Input, Textarea } from "@/components/Input";
import { Avatar, AvatarGroup } from "@/components/Avatar";
import { ThemeAndCartControls } from "@/components/theme-and-cart-controls";

// -- New feature demos ---------------------------------------------------------
import { StateButton } from "@/components/StateButton";
import { AccordionItem } from "@/components/DataStateDemo";
import {
  ContainerWrapper,
  ContainerCard,
  ContainerImage,
  ContainerText,
  ContainerTitle,
  ContainerDesc,
} from "@/components/ContainerDemo";
import { SysButton, SysBadge, SysCard } from "@/components/DesignSystem";
import { LiveTokenDemo } from "@/components/LiveTokenDemo";
import {
  StyledLink,
  ElevatedCard,
  WarningCard,
  GradientButton,
} from "@/components/ExtendDemo";
import { ThemeAwareCard, AccentBox } from "@/components/ThemeUtils";
import { twMerge } from "tailwind-styled-v4";

// ═════════════════════════════════════════════════════════════════════════════
// Layout primitives — tw object config API, semantic HTML tags
// ═════════════════════════════════════════════════════════════════════════════

// <div> wrapping root — tidak ada tag semantik yang cocok untuk "page shell"
const PageRoot = tw.div({
  base: "min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors",
})

// <nav> — landmark navigasi, screen reader + SEO
const NavBar = tw.nav({
  base: `
    sticky top-0 z-50
    border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]
    bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] backdrop-blur-md
  `,
})

const NavInner = tw.div({
  base: "max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4",
})

// <strong> untuk nama produk — lebih semantik dari span untuk logo text
const NavLogo = tw.strong({
  base: "font-bold tracking-tight text-lg",
})

const NavVersion = tw.span({
  base: "rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[var(--accent)] text-white",
})

// <main> — landmark konten utama halaman
const Main = tw.main({
  base: "max-w-6xl mx-auto px-4 py-12 space-y-20",
})

// -- Section --------------------------------------------------------------------
// <section> — tiap blok punya heading (SectionTitle = h2), valid secara outline
const Section = tw.section({ base: "space-y-6" })

const SectionHeader = tw.div({ base: "space-y-1" })

// h2 — landmark heading dalam outline dokumen
const SectionTitle = tw.h2({ base: "text-2xl font-bold tracking-tight" })

const SectionDesc = tw.p({
  base: "text-sm text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]",
})

const Divider = tw.hr({
  base: "border-[color-mix(in_srgb,var(--foreground)_10%,transparent)]",
})

// <code> — inline code chip
const CodeChip = tw.code({
  base: "px-1.5 py-0.5 rounded text-xs font-mono bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]",
})

// -- Hero -----------------------------------------------------------------------
// <section> dengan aria-label untuk screen reader landmark
const Hero = tw.section({ base: "py-10 flex flex-col gap-5" })

// <p> — eyebrow text, bukan heading structural
const HeroEyebrow = tw.p({ base: "flex items-center gap-2" })

// h1 — satu per halaman, paling penting untuk SEO
const HeroHeading = tw.h1({
  base: "text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight",
})

const HeroSub = tw.p({
  base: "text-lg text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] max-w-2xl",
})

// <div> OK untuk action row — tidak ada semantik khusus
const HeroActions = tw.div({ base: "flex flex-wrap items-center gap-3" })

// <ul> untuk feature list — lebih semantik, screen reader baca sebagai list
const FeaturePillList = tw.ul({ base: "flex flex-wrap gap-2 pt-2 list-none p-0 m-0" })

// <li> untuk tiap feature item
const FeaturePill = tw.li({
  base: `
    inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
    bg-[var(--surface-muted)]
    border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]
  `,
})

// -- Grid helpers ---------------------------------------------------------------
const Grid2 = tw.div({ base: "grid sm:grid-cols-2 gap-4" })

const Grid3 = tw.div({ base: "grid sm:grid-cols-2 lg:grid-cols-3 gap-4" })

const FlexWrap = tw.div({ base: "flex flex-wrap items-center gap-3" })

// -- Stat card ------------------------------------------------------------------
// <figure> — self-contained content (angka + label), semantik tepat
const StatCard = tw.figure({
  base: `
    p-5 rounded-xl bg-[var(--surface)]
    border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)]
    flex flex-col gap-1
  `,
})

// <strong> — emphasize angka utama
const StatValue = tw.strong({ base: "text-3xl font-black" })

// <figcaption> — caption untuk figure, pasangan semantik dari figure
const StatLabel = tw.figcaption({
  base: "text-sm text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]",
})

// -- Counter --------------------------------------------------------------------
const CounterBox = tw.div({
  base: `
    flex items-center gap-4 p-5 rounded-xl
    bg-[var(--surface)]
    border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)]
  `,
})

const CounterValue = tw.output({
  base: "text-5xl font-black tabular-nums w-20 text-center",
})

// -- Form -----------------------------------------------------------------------
// <form> — semantik yang tepat untuk input group, bukan div
const FormBox = tw.form({
  base: `
    p-6 rounded-xl bg-[var(--surface)]
    border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)]
    space-y-4
  `,
})

const FormRow = tw.div({ base: "grid sm:grid-cols-2 gap-4" })

// -- Code block -----------------------------------------------------------------
// <pre> + embedded <code> — standar HTML untuk code block
const CodeBlock = tw.pre({
  base: "rounded-xl bg-[#0f1117] text-[#c9d1d9] text-xs font-mono p-5 overflow-x-auto leading-relaxed",
})

// -- Footer ---------------------------------------------------------------------
// <footer> — landmark, secara implisit role="contentinfo"
const Footer = tw.footer({
  base: "border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] py-8 mt-10",
})

const FooterInner = tw.div({
  base: `
    max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4
    text-sm text-[color-mix(in_srgb,var(--foreground)_50%,transparent)]
  `,
})

// ═════════════════════════════════════════════════════════════════════════════
// Data
// ═════════════════════════════════════════════════════════════════════════════

const team = [
  { name: "Anna Wijaya" },
  { name: "Budi Santoso" },
  { name: "Citra Dewi" },
  { name: "Doni Prakoso" },
  { name: "Eka Putri" },
  { name: "Fajar Nugroho" },
  { name: "Gita Lestari" },
];

const codeSnippet = `import { tw, cv } from "tailwind-styled-v4"

// Object config — semua di-resolve Rust build time
const Button = tw.button({
  base: "px-4 py-2 rounded-lg font-medium transition-all",
  variants: {
    intent: {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700",
      danger:  "bg-red-600 text-white hover:bg-red-700",
    },
    size: { sm: "text-xs px-3", lg: "text-base px-6" },
  },
  defaultVariants: { intent: "primary", size: "sm" },
  compoundVariants: [
    { intent: "primary", size: "lg", class: "shadow-md shadow-indigo-200" },
  ],
  sub: {
    icon:  "inline-block w-5 h-5",
    badge: "absolute -top-2 -right-2 rounded-full bg-red-500 text-white",
  },
})

// cv() — class variant function
const badge = cv({
  base: "rounded-full font-medium",
  variants: {
    color: { blue: "bg-blue-100 text-blue-700", green: "bg-green-100 text-green-700" },
    size:  { sm: "px-2 text-xs", lg: "px-3 text-sm" },
  },
  defaultVariants: { color: "blue", size: "sm" },
})

// JSX usage
<Button intent="danger" size="lg">
  <Button.icon>🗑️</Button.icon>
  <Button.badge>3</Button.badge>
  Delete
</Button>`;

// ═════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═════════════════════════════════════════════════════════════════════════════

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <CounterBox>
      <PrimaryButton onClick={() => setCount((c) => c - 1)}>−</PrimaryButton>
      <CounterValue>{count}</CounterValue>
      <PrimaryButton onClick={() => setCount((c) => c + 1)}>+</PrimaryButton>
      <DangerButton
        className="ml-auto"
        disabled={count === 0}
        onClick={() => setCount(0)}
      >
        Reset
      </DangerButton>
    </CounterBox>
  );
}

function AlertsDemo() {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const alerts = [
    {
      id: "info",
      Component: InfoAlert,
      icon: "ℹ️",
      title: "Info",
      msg: "New version 5.0.12 is available — zero breaking changes.",
    },
    {
      id: "success",
      Component: SuccessAlert,
      icon: "✅",
      title: "Build successful",
      msg: "Rust engine compiled in 1.2s — 14 modules ready.",
    },
    {
      id: "warning",
      Component: WarningAlert,
      icon: "⚠️",
      title: "Deprecation notice",
      msg: "class_parser.rs is deprecated. Migrate to class_parser_v2.",
    },
    {
      id: "error",
      Component: ErrorAlert,
      icon: "❌",
      title: "Build failed",
      msg: "Missing peer dependency: react ≥18 is required.",
    },
  ];

  return (
    <div className="space-y-3">
      {alerts
        .filter((a) => !dismissed.includes(a.id))
        .map(({ id, Component, icon, title, msg }) => (
          <Component key={id}>
            <Component.icon>{icon}</Component.icon>
            <Component.content>
              <Component.title>{title}</Component.title>
              <Component.message>{msg}</Component.message>
            </Component.content>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
            <span
              role="button"
              tabIndex={0}
              aria-label="Dismiss"
              className="flex-shrink-0 ml-auto -mr-1 -mt-1 rounded-lg p-1 opacity-50 cursor-pointer hover:opacity-100 transition-opacity"
              onClick={() => setDismissed((d) => [...d, id])}
              onKeyDown={(e) => e.key === "Enter" && setDismissed((d) => [...d, id])}
            >
              ✕
            </span>
          </Component>
        ))}
      {dismissed.length > 0 && (
        <button
          type="button"
          className="text-xs text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] hover:underline"
          onClick={() => setDismissed([])}
        >
          Restore {dismissed.length} dismissed alert
          {dismissed.length > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Page
// ═════════════════════════════════════════════════════════════════════════════

export default function Page() {
  return (
    <PageRoot>
      {/* -- Navbar -- */}
      <NavBar>
        <NavInner>
          <div className="flex items-center gap-3">
            <NavLogo>tailwind-styled-v4</NavLogo>
            <NavVersion>v5.0.12</NavVersion>
          </div>
          <ThemeAndCartControls />
        </NavInner>
      </NavBar>

      <Main>
        {/* -- Hero -- */}
        <Hero>
          <HeroEyebrow>
            <Badge color="blue" size="md" dot>
              Powered by Rust
            </Badge>
            <Badge color="green" size="md">
              Next.js 16 + React 19
            </Badge>
          </HeroEyebrow>

          <HeroHeading>
            CSS-in-JS at{" "}
            <span className="text-[var(--accent)]">Rust speed</span>
          </HeroHeading>

          <HeroSub>
            Type-safe component variants, zero runtime CSS injection, dan 425×
            faster parsing. DX-nya styled-components — tanpa overhead-nya.
          </HeroSub>

          <HeroActions>
            <PrimaryButton>
              <PrimaryButton.icon>🚀</PrimaryButton.icon>
              <PrimaryButton.text>Get Started</PrimaryButton.text>
            </PrimaryButton>
            <OutlineButton>View on GitHub</OutlineButton>
            <GhostButton>Documentation</GhostButton>
          </HeroActions>

          <FeaturePillList>
            {[
              "⚡ ~425× faster parsing",
              "🦀 Rust NAPI engine",
              "🎨 Tailwind CSS v4",
              "🔒 Type-safe variants",
              "📦 17+ packages",
              "🔄 No SSR mismatch",
            ].map((f) => (
              <FeaturePill key={f}>{f}</FeaturePill>
            ))}
          </FeaturePillList>
        </Hero>

        <Divider />

        {/* -- Stats -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>By the numbers</SectionTitle>
            <SectionDesc>Real metrics dari production build</SectionDesc>
          </SectionHeader>
          <Grid3>
            {[
              { value: "~425×", label: "Faster than JS parser" },
              { value: "545+",  label: "Tests passing" },
              { value: "~4.5KB", label: "Browser runtime" },
              { value: "17+",   label: "npm packages" },
              { value: "11",    label: "NAPI bridge modules" },
              { value: "0",     label: "Runtime CSS injections" },
            ].map(({ value, label }) => (
              <StatCard key={label}>
                <StatValue>{value}</StatValue>
                <StatLabel>{label}</StatLabel>
              </StatCard>
            ))}
          </Grid3>
        </Section>

        <Divider />

        {/* -- Buttons -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>Buttons</SectionTitle>
            <SectionDesc>
              <CodeChip>tw.button({"{ base, variants, sub }"}) </CodeChip>
              — variants + compoundVariants + sub-components, semua build time
            </SectionDesc>
          </SectionHeader>

          <FlexWrap>
            <PrimaryButton>
              <PrimaryButton.icon>🔵</PrimaryButton.icon>
              <PrimaryButton.text>Primary</PrimaryButton.text>
              <PrimaryButton.badge>3</PrimaryButton.badge>
            </PrimaryButton>
            <SecondaryButton>Secondary</SecondaryButton>
            <DangerButton>
              <DangerButton.icon>🗑️</DangerButton.icon>
              <DangerButton.text>Delete</DangerButton.text>
            </DangerButton>
            <OutlineButton>Outline</OutlineButton>
            <GhostButton>Ghost</GhostButton>
            <PrimaryButton disabled>Disabled</PrimaryButton>
          </FlexWrap>

          <Counter />
        </Section>

        <Divider />

        {/* -- Badges -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>Badges</SectionTitle>
            <SectionDesc>
              <CodeChip>cv({"{ base, variants, defaultVariants }"})</CodeChip>
              — Rust resolves variant combinations at build time
            </SectionDesc>
          </SectionHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">
                Colors
              </p>
              <FlexWrap>
                {(["gray", "blue", "green", "yellow", "red", "purple"] as const).map(
                  (c) => (
                    <Badge key={c} color={c} dot>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </Badge>
                  )
                )}
              </FlexWrap>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">
                Sizes
              </p>
              <FlexWrap>
                <Badge color="blue" size="sm">Small</Badge>
                <Badge color="blue" size="md">Medium</Badge>
                <Badge color="blue" size="lg">Large</Badge>
              </FlexWrap>
            </div>
          </div>
        </Section>

        <Divider />

        {/* -- Alerts -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>Alerts</SectionTitle>
            <SectionDesc>
              <CodeChip>tw.div({"{ base, sub }"})</CodeChip>
              — named sub-component slots, klik ✕ untuk dismiss
            </SectionDesc>
          </SectionHeader>
          <AlertsDemo />
        </Section>

        <Divider />

        {/* -- Cards -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>Cards</SectionTitle>
            <SectionDesc>
              <CodeChip>
                tw.article({"{ base, variants, sub }"})
              </CodeChip>
              — header / body / footer / image via{" "}
              <CodeChip>"tag:name"</CodeChip> sub key
            </SectionDesc>
          </SectionHeader>

          <Grid2>
            <Card>
              <Card.header>
                <Card.title>Default Card</Card.title>
                <Card.badge>Static</Card.badge>
              </Card.header>
              <Card.body>
                CSS di-generate Rust build time. Zero runtime overhead —
                tidak ada style injection di client.
              </Card.body>
              <Card.footer>
                <Badge color="gray" size="sm">tw.article</Badge>
                <Badge color="blue" size="sm">sub-components</Badge>
              </Card.footer>
            </Card>

            <HoverableCard>
              <HoverableCard.header>
                <HoverableCard.title>Hoverable Card</HoverableCard.title>
                <HoverableCard.badge>Hover me</HoverableCard.badge>
              </HoverableCard.header>
              <HoverableCard.body>
                Pakai <CodeChip>.extend()</CodeChip> untuk tambah{" "}
                <code className="text-xs">hover:-translate-y-1</code> di
                atas base card — tanpa duplikasi class.
              </HoverableCard.body>
              <HoverableCard.footer>
                <Badge color="purple" size="sm">.extend()</Badge>
              </HoverableCard.footer>
            </HoverableCard>

            <HoverableCard>
              <img
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80"
                alt="Technology"
                className="w-full aspect-video object-cover"
              />
              <HoverableCard.header>
                <HoverableCard.title>Image Card</HoverableCard.title>
              </HoverableCard.header>
              <HoverableCard.body>
                Aspect-ratio preserved image slot via{" "}
                <CodeChip>"img:image"</CodeChip> sub key.
              </HoverableCard.body>
            </HoverableCard>

            <Card>
              <Card.header>
                <Card.title>Team</Card.title>
                <Card.badge>{team.length} members</Card.badge>
              </Card.header>
              <Card.body>
                <AvatarGroup users={team} max={5} size="md" />
              </Card.body>
              <Card.footer>
                <PrimaryButton className="text-xs px-3 py-1.5">
                  View all
                </PrimaryButton>
              </Card.footer>
            </Card>
          </Grid2>
        </Section>

        <Divider />

        {/* -- Avatars -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>Avatars</SectionTitle>
            <SectionDesc>
              <CodeChip>server.div({"{ base, variants }"})</CodeChip>
              — RSC-only component, size via variants, warna dari name hash
            </SectionDesc>
          </SectionHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">
                Sizes
              </p>
              <div className="flex flex-wrap items-end gap-4">
                {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
                  <div key={size} className="flex flex-col items-center gap-1.5">
                    <Avatar name="Kiro Dev" size={size} />
                    <span className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">
                      {size}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">
                Individual colors (deterministic dari name hash)
              </p>
              <div className="flex flex-wrap gap-3">
                {team.map((u) => (
                  <div key={u.name} className="flex items-center gap-2">
                    <Avatar name={u.name} size="sm" />
                    <span className="text-sm">{u.name.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">
                Group dengan overflow counter
              </p>
              <AvatarGroup users={team} max={5} size="md" />
            </div>
          </div>
        </Section>

        <Divider />

        {/* -- Form -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>Form Inputs</SectionTitle>
            <SectionDesc>
              <CodeChip>tw.input({"{ base, variants }"})</CodeChip>
              — state variant untuk error styling, build time
            </SectionDesc>
          </SectionHeader>

          <FormBox>
            <FormRow>
              <Input
                label="Full Name"
                placeholder="John Doe"
                hint="Sesuai KTP"
              />
              <Input
                label="Email"
                type="email"
                placeholder="hello@example.com"
              />
            </FormRow>
            <FormRow>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error="Password minimal 8 karakter"
              />
              <Input
                label="Search"
                placeholder="Cari packages..."
                prefix="🔍"
                suffix={
                  <span className="text-xs text-gray-400 font-mono">⌘K</span>
                }
              />
            </FormRow>
            <Textarea
              label="Deskripsi"
              placeholder="Ceritakan tentang project kamu..."
              hint="Markdown supported"
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-1">
              <SecondaryButton type="button">Cancel</SecondaryButton>
              <PrimaryButton type="submit">Save changes</PrimaryButton>
            </div>
          </FormBox>
        </Section>

        <Divider />

        {/* -- Code -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>Object config API</SectionTitle>
            <SectionDesc>
              Template literal, object config, dan cv() — semua di-compile
              Rust engine saat build
            </SectionDesc>
          </SectionHeader>
          <CodeBlock>{codeSnippet}</CodeBlock>
        </Section>

        <Divider />

        {/* -- States API -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>States — Boolean Props</SectionTitle>
            <SectionDesc>
              <CodeChip>states: {"{ loading, disabled, fullWidth, ... }"}</CodeChip>
              — di-resolve Rust bitmask lookup O(1), maksimal 16 kombinasi
            </SectionDesc>
          </SectionHeader>
          <FlexWrap>
            <StateButton>Normal</StateButton>
            <StateButton loading>
              <span className="animate-spin inline-block">⟳</span> Loading...
            </StateButton>
            <StateButton disabled>Disabled</StateButton>
            <StateButton danger>Danger state</StateButton>
            <StateButton success>Success state</StateButton>
          </FlexWrap>
          <StateButton fullWidth>Full Width Button</StateButton>
        </Section>

        <Divider />

        {/* -- State API (data-attribute) -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>State Engine — Zero JS Re-render</SectionTitle>
            <SectionDesc>
              <CodeChip>state: {"{ open: { true: '...', false: '...' } }"}</CodeChip>
              — CSS via data-attribute, toggle tanpa useState
            </SectionDesc>
          </SectionHeader>
          <div className="space-y-3">
            <AccordionItem title="Apa itu tailwind-styled-v4?">
              Library CSS-in-JS untuk React yang dikompilasi oleh engine Rust.
              Zero runtime overhead — CSS di-generate saat build time.
            </AccordionItem>
            <AccordionItem title="Bagaimana State Engine bekerja?">
              State engine generate CSS rules berbasis data-attribute di build time.
              Toggle style hanya butuh <code className="text-xs font-mono">setAttribute("data-open", "true")</code> —
              tidak butuh React state atau re-render.
            </AccordionItem>
            <AccordionItem title="Kenapa lebih cepat dari styled-components?">
              Rust parser ~425× lebih cepat dari JS. CSS sudah di-bundle sebelum
              browser buka halaman — tidak ada runtime injection atau hydration mismatch.
            </AccordionItem>
          </div>
        </Section>

        <Divider />

        {/* -- Container Queries -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>Container Queries</SectionTitle>
            <SectionDesc>
              <CodeChip>container: {"{ sm: '...', md: '...', lg: '...' }"}</CodeChip>
              — layout berubah berdasarkan lebar container, bukan viewport
            </SectionDesc>
          </SectionHeader>
          <SectionDesc className="text-xs italic">
            Resize browser untuk lihat efeknya pada card di bawah
          </SectionDesc>
          <Grid2>
            <ContainerWrapper>
              <ContainerCard>
                <ContainerImage className="flex items-center justify-center text-2xl">
                  🦀
                </ContainerImage>
                <ContainerText>
                  <ContainerTitle>Rust Engine</ContainerTitle>
                  <ContainerDesc>
                    Layout card ini berubah otomatis berdasarkan lebar container-nya,
                    bukan lebar viewport. Coba resize jendela browser.
                  </ContainerDesc>
                </ContainerText>
              </ContainerCard>
            </ContainerWrapper>
            <ContainerWrapper>
              <ContainerCard>
                <ContainerImage className="flex items-center justify-center text-2xl">
                  ⚡
                </ContainerImage>
                <ContainerText>
                  <ContainerTitle>Zero Runtime</ContainerTitle>
                  <ContainerDesc>
                    @container rules di-generate Rust di build time.
                    Breakpoint default: sm=320px, md=640px, lg=1024px.
                  </ContainerDesc>
                </ContainerText>
              </ContainerCard>
            </ContainerWrapper>
          </Grid2>
        </Section>

        <Divider />

        {/* -- Design System -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>createStyledSystem()</SectionTitle>
            <SectionDesc>
              Design system factory dengan token terpusat.
              Token di-inject sebagai CSS custom properties{" "}
              <CodeChip>--sys-{"{"}"group"-"name"{"}"}</CodeChip>
            </SectionDesc>
          </SectionHeader>
          <div className="space-y-4">
            <SysCard>
              <p className="text-sm font-semibold mb-3">System buttons dari token terpusat:</p>
              <FlexWrap>
                <SysButton intent="primary">Primary</SysButton>
                <SysButton intent="danger">Danger</SysButton>
                <SysButton intent="success">Success</SysButton>
                <SysButton intent="outline">Outline</SysButton>
                <SysButton intent="primary" size="sm">Small</SysButton>
                <SysButton intent="primary" size="lg">Large</SysButton>
              </FlexWrap>
            </SysCard>
            <SysCard>
              <p className="text-sm font-semibold mb-3">System badges dari token:</p>
              <FlexWrap>
                <SysBadge intent="primary">Primary</SysBadge>
                <SysBadge intent="danger">Danger</SysBadge>
                <SysBadge intent="success">Success</SysBadge>
                <SysBadge intent="muted">Muted</SysBadge>
              </FlexWrap>
            </SysCard>
          </div>
        </Section>

        <Divider />

        {/* -- Live Tokens -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>liveToken() — Reactive Tokens</SectionTitle>
            <SectionDesc>
              Token yang bisa diupdate runtime dan subscribe ke perubahannya.
              Klik warna untuk update token primary secara live.
            </SectionDesc>
          </SectionHeader>
          <LiveTokenDemo />
        </Section>

        <Divider />

        {/* -- Extend + tw(Component) -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>.extend() dan tw(Component)</SectionTitle>
            <SectionDesc>
              Inheritance via <CodeChip>.extend()</CodeChip>, wrap komponen
              existing via <CodeChip>tw(Component)</CodeChip>, strict TypeScript
              via <CodeChip>.withSub&lt;&gt;()</CodeChip>
            </SectionDesc>
          </SectionHeader>
          <div className="space-y-4">
            <Grid3>
              <ElevatedCard>
                <p className="text-sm font-semibold text-gray-900">ElevatedCard</p>
                <p className="text-xs text-gray-500 mt-1">BaseCard.extend() dengan shadow-lg</p>
              </ElevatedCard>
              <WarningCard>
                <p className="text-sm font-semibold text-yellow-800">WarningCard</p>
                <p className="text-xs text-yellow-600 mt-1">BaseCard.extend() dengan border kuning</p>
              </WarningCard>
              <div className="p-5 rounded-xl border border-gray-200 bg-white">
                <p className="text-sm font-semibold text-gray-900">StyledLink</p>
                <p className="text-xs text-gray-500 mt-1 mb-2">tw.a() — wrap existing element</p>
                <StyledLink href="#">Lihat dokumentasi →</StyledLink>
              </div>
            </Grid3>
            <FlexWrap>
              <GradientButton>Gradient Button (.extend)</GradientButton>
            </FlexWrap>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">
                twMerge — conflict-aware class merge
              </p>
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] space-y-2 text-sm font-mono">
                <p>
                  <span className="text-gray-400">twMerge(</span>
                  <span className="text-green-600">"px-4 py-2"</span>
                  <span className="text-gray-400">, </span>
                  <span className="text-blue-600">"px-8"</span>
                  <span className="text-gray-400">)</span>
                  {" → "}
                  <span className={twMerge("px-4 py-2", "px-8") === "py-2 px-8" ? "text-emerald-600" : "text-emerald-600"}>
                    "{twMerge("px-4 py-2", "px-8")}"
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">twMerge(</span>
                  <span className="text-green-600">"bg-red-500"</span>
                  <span className="text-gray-400">, </span>
                  <span className="text-blue-600">"bg-blue-500"</span>
                  <span className="text-gray-400">)</span>
                  {" → "}
                  <span className="text-emerald-600">"{twMerge("bg-red-500", "bg-blue-500")}"</span>
                </p>
                <p>
                  <span className="text-gray-400">twMerge(</span>
                  <span className="text-green-600">"text-sm font-bold"</span>
                  <span className="text-gray-400">, </span>
                  <span className="text-blue-600">"text-lg"</span>
                  <span className="text-gray-400">)</span>
                  {" → "}
                  <span className="text-emerald-600">"{twMerge("text-sm font-bold", "text-lg")}"</span>
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Divider />

        {/* -- Theme Utils -- */}
        <Section>
          <SectionHeader>
            <SectionTitle>t.bg(), cssVar(), v4Tokens</SectionTitle>
            <SectionDesc>
              Helper untuk reference CSS variables sebagai Tailwind arbitrary values.
              <CodeChip>t.bg("color-background")</CodeChip> →{" "}
              <CodeChip>bg-[var(--color-background)]</CodeChip>
            </SectionDesc>
          </SectionHeader>
          <Grid2>
            <ThemeAwareCard>
              <p className="font-semibold mb-1">ThemeAwareCard</p>
              <p className="text-sm opacity-70">
                Pakai CSS variables dari globals.css via{" "}
                <code className="text-xs font-mono">var(--surface)</code> dan{" "}
                <code className="text-xs font-mono">var(--foreground)</code>
              </p>
            </ThemeAwareCard>
            <AccentBox>
              <p className="font-semibold mb-1">AccentBox</p>
              <p className="text-sm opacity-70">
                Border dan background dari{" "}
                <code className="text-xs font-mono">var(--accent)</code> — otomatis
                ikut theme switch
              </p>
            </AccentBox>
          </Grid2>
        </Section>
      </Main>

      {/* -- Footer -- */}
      <Footer>
        <FooterInner>
          <span>tailwind-styled-v4 v5.0.12 — MIT License</span>
          <span>Built with Next.js 16 + React 19 + Rust 🦀</span>
        </FooterInner>
      </Footer>
    </PageRoot>
  );
}
