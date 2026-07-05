/**
 * tailwind-styled-v4 — Documentation Page
 *
 * Layout: 3-column docs (sidebar kiri + content tengah + TOC kanan)
 * Terinspirasi dari: Fumadocs, Nextra, shadcn/ui docs
 *
 * Drop ke: examples/next-js-app/src/app/docs/page.tsx
 * Atau buat route baru: src/app/readme/page.tsx
 *
 * Sudah pakai semua CSS variables dari globals.css (dark mode-aware).
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { tw, cn } from "tailwind-styled-v4";

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar nav tree — sama persis struktur Fumadocs/Nextra
// ─────────────────────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: "Getting Started",
    items: [
      { id: "overview", label: "Overview" },
      { id: "install", label: "Installation" },
      { id: "setup-nextjs", label: "Setup: Next.js" },
      { id: "setup-vite", label: "Setup: Vite" },
      { id: "setup-rspack", label: "Setup: Rspack" },
    ],
  },
  {
    label: "Core API",
    items: [
      { id: "template-literal", label: "Template Literal" },
      { id: "object-config", label: "Object Config" },
      { id: "sub-components", label: "Sub-Components" },
      { id: "cv", label: "cv()" },
      { id: "states", label: "states" },
      { id: "state-data-attr", label: "state (data-attr)" },
      { id: "extend", label: ".extend()" },
      { id: "container-queries", label: "container queries" },
      { id: "server-components", label: "server." },
    ],
  },
  {
    label: "Design System",
    items: [
      { id: "create-styled-system", label: "createStyledSystem()" },
      { id: "live-token", label: "liveToken()" },
      { id: "utilities", label: "cn / cx / twMerge" },
    ],
  },
  {
    label: "Reference",
    items: [
      { id: "typescript", label: "TypeScript" },
      { id: "cli", label: "CLI" },
      { id: "devtools", label: "DevTools" },
      { id: "env-vars", label: "Environment Vars" },
      { id: "benchmark", label: "Benchmark" },
      { id: "architecture", label: "Architecture" },
    ],
  },
];

// TOC — diambil dari heading2 di content
const TOC_ITEMS = [
  { id: "overview", label: "Overview", depth: 2 },
  { id: "install", label: "Installation", depth: 2 },
  { id: "setup-nextjs", label: "Setup: Next.js", depth: 2 },
  { id: "setup-vite", label: "Setup: Vite", depth: 2 },
  { id: "template-literal", label: "Template Literal", depth: 2 },
  { id: "object-config", label: "Object Config", depth: 2 },
  { id: "sub-components", label: "Sub-Components", depth: 2 },
  { id: "cv", label: "cv()", depth: 2 },
  { id: "states", label: "states", depth: 2 },
  { id: "state-data-attr", label: "state (data-attr)", depth: 2 },
  { id: "extend", label: ".extend()", depth: 2 },
  { id: "container-queries", label: "Container Queries", depth: 2 },
  { id: "server-components", label: "server.", depth: 2 },
  { id: "create-styled-system", label: "createStyledSystem()", depth: 2 },
  { id: "live-token", label: "liveToken()", depth: 2 },
  { id: "utilities", label: "cn / cx / twMerge", depth: 2 },
  { id: "typescript", label: "TypeScript", depth: 2 },
  { id: "benchmark", label: "Benchmark", depth: 2 },
  { id: "architecture", label: "Architecture", depth: 2 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Layout shell
// ─────────────────────────────────────────────────────────────────────────────

const PageShell = tw.div({
  base: "min-h-screen bg-[var(--background)] text-[var(--foreground)]",
});

// Top nav — sama pola Fumadocs: logo + search + links
const TopNav = tw.header({
  base: `
    sticky top-0 z-50 h-14
    border-b border-[var(--border)]
    bg-[color-mix(in_srgb,var(--surface)_85%,transparent)]
    backdrop-blur-md
  `,
});

const TopNavInner = tw.div({
  base: "max-w-[90rem] mx-auto px-4 h-full flex items-center justify-between gap-4",
});

const Logo = tw.a({
  base: "flex items-center gap-2 font-bold text-sm tracking-tight hover:opacity-80 transition-opacity",
});

const LogoBadge = tw.span({
  base: "rounded px-1.5 py-0.5 text-[10px] font-bold bg-[var(--accent)] text-white",
});

const NavRight = tw.div({
  base: "flex items-center gap-3 text-sm text-[color-mix(in_srgb,var(--foreground)_60%,transparent)]",
});

const NavLink = tw.a({
  base: "hover:text-[var(--foreground)] transition-colors",
  states: {
    hideOnMobile: "hidden sm:block",
  },
});

const GhubLink = tw.a({
  base: `
    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
    border border-[var(--border)]
    bg-[var(--surface)] hover:bg-[var(--surface-muted)]
    transition-colors
  `,
});

const NavLeftGroup = tw.div({ base: "flex items-center gap-4" });
const HamburgerButton = tw.button({
  base: "lg:hidden p-1.5 rounded-lg hover:bg-[var(--surface-muted)] transition-colors",
});
const HamburgerIcon = tw.span({ base: "inline-block w-4 h-4" });
const GhubIcon = tw.span({ base: "inline-block w-3.5 h-3.5" });

// 3-column body
const BodyGrid = tw.div({
  base: "max-w-[90rem] mx-auto flex",
});

// ── Left sidebar ──
const Sidebar = tw.aside({
  base: `
    hidden lg:block
    w-60 shrink-0
    sticky top-14 h-[calc(100vh-3.5rem)]
    overflow-y-auto
    border-r border-[var(--border)]
    py-6 pr-2
  `,
});

const SidebarSection = tw.div({
  base: "mb-6",
});

const SidebarSectionLabel = tw.p({
  base: "px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]",
});

const SidebarButton = tw.button({
  base: "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all",
  variants: {
    state: {
      active: "bg-[var(--accent)] text-white font-medium",
      inactive:"text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
    },
  },
  defaultVariants: { state: "inactive" },
});

// Mobile nav drawer
const MobileNavOverlay = tw.div({ base: "lg:hidden fixed inset-0 z-40 bg-black/50" });
const MobileNavPanel = tw.div({
  base: "absolute left-0 top-14 bottom-0 w-72 bg-[var(--background)] border-r border-[var(--border)] p-4 overflow-y-auto",
});
const MobileSection = tw.div({ base: "mb-5" });
const MobileSectionLabel = tw.p({
  base: "text-[11px] font-semibold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] mb-1 px-2",
});

// ── Center content ──
const ContentArea = tw.main({
  base: "flex-1 min-w-0 px-6 lg:px-10 py-10",
});

const ContentInner = tw.div({
  base: "max-w-3xl mx-auto",
});

// ── Right TOC ──
const TocAside = tw.aside({
  base: `
    hidden xl:block
    w-52 shrink-0
    sticky top-14 h-[calc(100vh-3.5rem)]
    overflow-y-auto
    py-6 pl-4
  `,
});

const TocLabel = tw.p({
  base: "mb-3 text-[11px] font-semibold uppercase tracking-wider text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]",
});

const TocLink = tw.a({
  base: "block text-xs py-1 transition-colors leading-snug",
  variants: {
    state: {
      active: "text-[var(--accent)] font-medium",
      inactive: "text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] hover:text-[var(--foreground)]",
    },
  },
  states: {
    indented: "pl-3",
  },
  defaultVariants: { state: "inactive" },
});

const TocList = tw.div({ base: "space-y-0.5 border-l border-[var(--border)] pl-3" });
const TocFooter = tw.div({ base: "mt-6 pt-4 border-t border-[var(--border)]" });
const EditGithubLink = tw.a({
  base: "text-xs text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1",
});

// ─────────────────────────────────────────────────────────────────────────────
// Content primitives — pola Fumadocs/Nextra typography
// ─────────────────────────────────────────────────────────────────────────────

const PageTitle = tw.h1({
  base: "text-3xl font-bold tracking-tight mb-2",
});

const PageDesc = tw.p({
  base: "text-base text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] mb-8 leading-relaxed",
});

const Breadcrumb = tw.div({
  base: "flex items-center gap-1.5 text-xs text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] mb-6",
});

const BreadcrumbSep = tw.span({ base: "opacity-40" });
const BreadcrumbLink = tw.a({ base: "hover:text-[var(--foreground)] transition-colors" });

// Section heading dengan anchor
const H2 = tw.h2({
  base: "text-xl font-bold mt-12 mb-4 scroll-mt-20 flex items-center gap-2 group",
});

const AnchorLink = tw.a({
  base: "opacity-0 group-hover:opacity-100 text-[var(--accent)] text-lg",
});

const H3 = tw.h3({
  base: "text-base font-semibold mt-6 mb-3 scroll-mt-20",
});

const P = tw.p({
  base: "text-sm leading-7 text-[color-mix(in_srgb,var(--foreground)_80%,transparent)] mb-4",
});

const InlineCode = tw.code({
  base: "rounded px-1.5 py-0.5 text-xs font-mono bg-[var(--surface-muted)] text-[var(--accent)] border border-[var(--border)]",
});

const Divider = tw.hr({
  base: "my-10 border-[var(--border)]",
});

// Code block — persis Fumadocs: header dengan filename + copy button
const CodeWrapper = tw.div({
  base: "my-5 rounded-xl border border-[var(--border)] overflow-hidden text-sm",
});

const CodeHeader = tw.div({
  base: "flex items-center justify-between px-4 py-2 bg-[color-mix(in_srgb,var(--surface-muted)_60%,transparent)] border-b border-[var(--border)]",
});

const CodeFileName = tw.span({
  base: "text-xs font-mono text-[color-mix(in_srgb,var(--foreground)_50%,transparent)]",
});

const CodePre = tw.pre({
  base: "p-4 overflow-x-auto bg-[var(--surface)] text-[var(--foreground)] font-mono text-xs leading-6",
});

// Callout — pola Nextra/Fumadocs
const CalloutBase = tw.div({
  base: "flex gap-3 rounded-xl border px-4 py-3.5 my-5 text-sm leading-relaxed",
  variants: {
    type: {
      info: "bg-blue-50 border-blue-200 text-blue-900",
      warning: "bg-amber-50 border-amber-200 text-amber-900",
      tip: "bg-emerald-50 border-emerald-200 text-emerald-900",
      danger: "bg-red-50 border-red-200 text-red-900",
    },
  },
  defaultVariants: { type: "info" },
});

const CalloutIcon = tw.span({ base: "text-base leading-none mt-0.5 shrink-0" });

// Steps — pola Nextra
const StepsWrapper = tw.div({
  base: "my-5 border-l-2 border-[var(--accent)] pl-6 space-y-6",
});

const StepItem = tw.div({ base: "relative" });

const StepNumber = tw.div({
  base: `
    absolute -left-[2.125rem] top-0
    w-6 h-6 rounded-full
    flex items-center justify-center
    text-[11px] font-bold
    bg-[var(--accent)] text-white
  `,
});

const StepTitle = tw.h4({
  base: "font-semibold mb-2 text-sm",
});

const StepDesc = tw.div({
  base: "text-sm text-[color-mix(in_srgb,var(--foreground)_75%,transparent)]",
});

// Cards — pola Nextra
const CardsGrid = tw.div({
  base: "grid sm:grid-cols-2 gap-3 my-5",
});

const CardItem = tw.a({
  base: `
    block rounded-xl border border-[var(--border)]
    bg-[var(--surface)] p-4
    hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]
    transition-all group
  `,
});

const CardItemTitle = tw.p({
  base: "font-semibold text-sm mb-1 group-hover:text-[var(--accent)] transition-colors",
});

const CardItemDesc = tw.p({
  base: "text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] leading-relaxed",
});

// Table — pola Fumadocs
const TableWrapper = tw.div({
  base: "my-5 overflow-x-auto rounded-xl border border-[var(--border)]",
});

const Table = tw.table({
  base: "w-full text-sm border-collapse",
});

const Th = tw.th({
  base: "text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[var(--surface-muted)] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] border-b border-[var(--border)]",
});

const Td = tw.td({
  base: "px-4 py-3 border-b border-[var(--border)] text-[color-mix(in_srgb,var(--foreground)_80%,transparent)] align-top",
  variants: {
    tone: {
      default: "",
      label: "font-medium",
      success: "text-emerald-700 font-medium",
      successBold: "text-emerald-700 font-semibold",
      indigoBold: "text-indigo-700 font-bold",
      mutedCenter: "text-center text-gray-400",
    },
  },
  defaultVariants: { tone: "default" },
});

const TdMono = tw.td({
  base: "px-4 py-3 border-b border-[var(--border)] font-mono text-xs text-[var(--accent)] align-top",
});

// Prev/Next footer — Fumadocs pattern
const PageFooter = tw.div({
  base: "flex items-center justify-between mt-16 pt-6 border-t border-[var(--border)]",
});

const FooterNav = tw.a({
  base: `
    flex flex-col gap-0.5 px-4 py-3 rounded-xl border border-[var(--border)]
    bg-[var(--surface)] hover:border-[var(--accent)]
    hover:bg-[var(--surface-muted)] transition-all text-sm
  `,
  variants: {
    dir: { prev: "items-start", next: "items-end" },
  },
  defaultVariants: { dir: "prev" },
});

const FooterNavHint = tw.span({
  base: "text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] uppercase tracking-wider",
});

const FooterNavLabel = tw.span({
  base: "font-semibold text-[var(--foreground)]",
});

// ─────────────────────────────────────────────────────────────────────────────
// Copy button hook + component
// ─────────────────────────────────────────────────────────────────────────────

const CopyBtn = tw.button({
  base: "text-[10px] font-medium px-2 py-1 rounded-md transition-all border border-[var(--border)]",
  variants: {
    state: {
      copied: "bg-emerald-500 text-white border-emerald-500",
      idle: "bg-[var(--surface)] text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] hover:bg-[var(--surface-muted)]",
    },
  },
  defaultVariants: { state: "idle" },
});

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <CopyBtn
      state={copied ? "copied" : "idle"}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </CopyBtn>
  );
}

// Code block with filename + copy button
function Code({ filename, children }: { filename?: string; children: string }) {
  return (
    <CodeWrapper>
      <CodeHeader>
        <CodeFileName>{filename ?? "tsx"}</CodeFileName>
        <CopyButton text={children.trim()} />
      </CodeHeader>
      <CodePre>{children.trim()}</CodePre>
    </CodeWrapper>
  );
}

// Callout component
function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "tip" | "danger";
  children: React.ReactNode;
}) {
  const icons = { info: "ℹ️", warning: "⚠️", tip: "💡", danger: "🚨" };
  return (
    <CalloutBase type={type}>
      <CalloutIcon>{icons[type]}</CalloutIcon>
      <div>{children}</div>
    </CalloutBase>
  );
}

// Steps component
function Steps({ items }: { items: { title: string; content: React.ReactNode }[] }) {
  return (
    <StepsWrapper>
      {items.map((item, i) => (
        <StepItem key={i}>
          <StepNumber>{i + 1}</StepNumber>
          <StepTitle>{item.title}</StepTitle>
          <StepDesc>{item.content}</StepDesc>
        </StepItem>
      ))}
    </StepsWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar nav item — active state + hover
// ─────────────────────────────────────────────────────────────────────────────

function SidebarItem({
  item,
  activeId,
  onClick,
}: {
  item: { id: string; label: string };
  activeId: string;
  onClick: (id: string) => void;
}) {
  const isActive = activeId === item.id;
  return (
    <SidebarButton onClick={() => onClick(item.id)} state={isActive ? "active" : "inactive"}>
      {item.label}
    </SidebarButton>
  );
}

// TOC item — scroll-spy active
function TocItem({
  item,
  activeId,
}: {
  item: { id: string; label: string; depth: number };
  activeId: string;
}) {
  const isActive = activeId === item.id;
  return (
    <TocLink
      href={`#${item.id}`}
      state={isActive ? "active" : "inactive"}
      indented={item.depth === 3}
    >
      {item.label}
    </TocLink>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scroll-spy hook — Fumadocs/Nextra pattern
// ─────────────────────────────────────────────────────────────────────────────

function useScrollSpy(ids: string[]) {
  const [activeId, setActiveId] = useState(ids[0] ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-14% 0% -75% 0%" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const allIds = TOC_ITEMS.map((t) => t.id);
  const tocActiveId = useScrollSpy(allIds);
  const [sidebarActiveId, setSidebarActiveId] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function scrollTo(id: string) {
    setSidebarActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileNavOpen(false);
  }

  return (
    <PageShell>
      {/* ── Top Nav ── */}
      <TopNav>
        <TopNavInner>
          <NavLeftGroup>
            {/* Mobile hamburger */}
            <HamburgerButton
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Toggle nav"
            >
              <HamburgerIcon>
                <svg width="100%" height="100%" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={mobileNavOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </HamburgerIcon>
            </HamburgerButton>
            <Logo href="/">
              tailwind-styled-v4
              <LogoBadge>v5</LogoBadge>
            </Logo>
          </NavLeftGroup>
          <NavRight>
            <NavLink href="/" hideOnMobile>← Demo</NavLink>
            <GhubLink href="https://github.com/Dictionar32/tailwind-styled-v4" target="_blank">
              <GhubIcon>
                <svg width="100%" height="100%" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </GhubIcon>
              GitHub
            </GhubLink>
          </NavRight>
        </TopNavInner>
      </TopNav>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <MobileNavOverlay onClick={() => setMobileNavOpen(false)}>
          <MobileNavPanel onClick={(e) => e.stopPropagation()}>
            {NAV_SECTIONS.map((section) => (
              <MobileSection key={section.label}>
                <MobileSectionLabel>{section.label}</MobileSectionLabel>
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    activeId={sidebarActiveId}
                    onClick={scrollTo}
                  />
                ))}
              </MobileSection>
            ))}
          </MobileNavPanel>
        </MobileNavOverlay>
      )}

      {/* ── 3-column body ── */}
      <BodyGrid>

        {/* LEFT SIDEBAR */}
        <Sidebar>
          {NAV_SECTIONS.map((section) => (
            <SidebarSection key={section.label}>
              <SidebarSectionLabel>{section.label}</SidebarSectionLabel>
              {section.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  activeId={sidebarActiveId}
                  onClick={scrollTo}
                />
              ))}
            </SidebarSection>
          ))}
        </Sidebar>

        {/* CENTER CONTENT */}
        <ContentArea>
          <ContentInner>

            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
              <BreadcrumbSep>/</BreadcrumbSep>
              <span>Documentation</span>
            </Breadcrumb>

            <PageTitle>tailwind-styled-v4</PageTitle>
            <PageDesc>
              Rust-powered CSS-in-JS untuk React. Build-time compiler, zero runtime
              overhead, type-safe variants, RSC-ready.
            </PageDesc>

            {/* ── Overview ── */}
            <H2 id="overview">
              Overview
              <AnchorLink href="#overview">#</AnchorLink>
            </H2>
            <P>
              <InlineCode>tailwind-styled-v4</InlineCode> menggabungkan DX{" "}
              <InlineCode>styled-components</InlineCode> dengan performa Tailwind CSS v4
              — dikompilasi oleh engine Rust via NAPI-RS. Tulis komponen sekali dengan
              variants type-safe, Rust extract dan optimasi seluruh CSS di build time.
            </P>

            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Fitur</Th>
                    <Th>tailwind-styled-v4</Th>
                    <Th>styled-components</Th>
                    <Th>Panda CSS</Th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Build-time CSS", "✅", "❌ runtime", "✅"],
                    ["Runtime JS", "~0", "~15KB", "~0"],
                    ["Variants API", "✅ type-safe", "terbatas", "✅"],
                    ["SSR / RSC", "✅ zero cfg", "⚠️ setup", "✅"],
                    ["Engine", "🦀 Rust", "JS", "JS"],
                    ["TypeScript", "✅ full", "partial", "✅"],
                  ].map(([f, a, b, c]) => (
                    <tr key={f}>
                      <Td tone="label">{f}</Td>
                      <Td tone="success">{a}</Td>
                      <Td>{b}</Td>
                      <Td>{c}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>

            <Divider />

            {/* ── Installation ── */}
            <H2 id="install">
              Installation
              <AnchorLink href="#install">#</AnchorLink>
            </H2>

            <Steps items={[
              {
                title: "Install package",
                content: (
                  <Code filename="terminal">
                    {`npm install tailwind-styled-v4`}
                  </Code>
                ),
              },
              {
                title: "Run setup wizard",
                content: (
                  <>
                    <Code filename="terminal">{`npx tw setup`}</Code>
                    <P>Mendeteksi bundler, inject plugin ke config, buat <InlineCode>tailwind-styled.config.json</InlineCode> otomatis.</P>
                  </>
                ),
              },
              {
                title: "Mulai development",
                content: (
                  <Code filename="terminal">{`npm run dev`}</Code>
                ),
              },
            ]} />

            <Callout type="tip">
              Jika Rust tidak terinstall, set <InlineCode>TWS_NO_RUST=1</InlineCode> untuk
              menggunakan JS fallback. Semua fitur tetap berfungsi, performa lebih lambat.
            </Callout>

            <Divider />

            {/* ── Setup Next.js ── */}
            <H2 id="setup-nextjs">
              Setup: Next.js
              <AnchorLink href="#setup-nextjs">#</AnchorLink>
            </H2>

            <Code filename="next.config.ts">
              {`import { withTailwindStyled } from "tailwind-styled-v4/next"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {}

export default withTailwindStyled({
  routeCss: true, // emit css-manifest.json untuk TwCssInjector
})(nextConfig)`}
            </Code>

            <Code filename="src/app/layout.tsx">
              {`import { TwCssInjector } from "tailwind-styled-v4/runtime-css"

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Inject route-specific CSS langsung ke <head> — no FOUC */}
        <TwCssInjector />
      </head>
      <body>{children}</body>
    </html>
  )
}`}
            </Code>

            <Code filename="globals.css">
              {`@import "tailwindcss";

:root {
  --background: #f5f7fb;
  --foreground: #111827;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}`}
            </Code>

            <Callout type="info">
              <strong>TwCssInjector</strong> adalah Server Component async. Import dari{" "}
              <InlineCode>tailwind-styled-v4/runtime-css</InlineCode> (bukan{" "}
              <InlineCode>tailwind-styled-v4</InlineCode>) agar aman di RSC.
            </Callout>

            <Divider />

            {/* ── Setup Vite ── */}
            <H2 id="setup-vite">
              Setup: Vite
              <AnchorLink href="#setup-vite">#</AnchorLink>
            </H2>

            <Code filename="vite.config.ts">
              {`import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { tailwindStyled } from "tailwind-styled-v4/vite"

export default defineConfig({
  plugins: [react(), tailwindStyled()],
})`}
            </Code>

            <Divider />

            {/* ── Template Literal ── */}
            <H2 id="template-literal">
              Template Literal
              <AnchorLink href="#template-literal">#</AnchorLink>
            </H2>
            <P>API paling sederhana — satu tag, satu string kelas.</P>

            <Code filename="Button.tsx">
              {`import { tw } from "tailwind-styled-v4"

const Button = tw.button\`
  inline-flex items-center rounded-lg px-4 py-2
  bg-blue-600 text-white font-medium
  hover:bg-blue-700 transition
\`

<Button onClick={handleClick}>Klik saya</Button>`}
            </Code>

            <Divider />

            {/* ── Object Config ── */}
            <H2 id="object-config">
              Object Config
              <AnchorLink href="#object-config">#</AnchorLink>
            </H2>
            <P>
              API utama — mendukung <InlineCode>base</InlineCode>,{" "}
              <InlineCode>variants</InlineCode>, <InlineCode>defaultVariants</InlineCode>,{" "}
              <InlineCode>compoundVariants</InlineCode>. Semua di-resolve Rust di build time.
            </P>

            <Code filename="Button.tsx">
              {`const Button = tw.button({
  base: "inline-flex items-center rounded-lg font-medium transition-all",
  variants: {
    intent: {
      primary:   "bg-indigo-600 text-white hover:bg-indigo-700",
      secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
      danger:    "bg-red-600 text-white hover:bg-red-700",
      ghost:     "text-gray-600 hover:bg-gray-100",
    },
    size: {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-base",
    },
  },
  defaultVariants: { intent: "primary", size: "md" },
  compoundVariants: [
    { intent: "primary", size: "lg", class: "shadow-md shadow-indigo-200" },
  ],
})

<Button intent="primary" size="lg">Submit</Button>
<Button intent="danger">Hapus</Button>
<Button intent="invalid" />  // ❌ TypeScript error`}
            </Code>

            <Divider />

            {/* ── Sub-Components ── */}
            <H2 id="sub-components">
              Sub-Components
              <AnchorLink href="#sub-components">#</AnchorLink>
            </H2>
            <P>
              Definisi slot anak langsung di config. Format{" "}
              <InlineCode>"tag:name"</InlineCode> untuk kontrol tag HTML.
            </P>

            <Code filename="Card.tsx">
              {`const Card = tw.article({
  base: "rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden",
  sub: {
    "header:header": "px-6 pt-5 pb-0 flex items-start justify-between",
    "h2:title":      "text-base font-semibold text-gray-900",
    "section:body":  "px-6 py-4 text-sm text-gray-500 leading-relaxed",
    "footer:footer": "px-6 pb-5 pt-0 flex items-center gap-2",
    "img:image":     "w-full aspect-video object-cover",
    badge:           "rounded-full px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700",
  },
})

<Card>
  <Card.header>
    <Card.title>Judul</Card.title>
    <Card.badge>New</Card.badge>
  </Card.header>
  <Card.body>Konten card.</Card.body>
</Card>`}
            </Code>

            <Callout type="info">
              Tag prefix (<InlineCode>h2:</InlineCode>) di-strip otomatis dari TypeScript
              inference. <InlineCode>Card.title</InlineCode> bukan{" "}
              <InlineCode>{`Card["h2:title"]`}</InlineCode>.
            </Callout>

            <Divider />

            {/* ── cv() ── */}
            <H2 id="cv">
              cv()
              <AnchorLink href="#cv">#</AnchorLink>
            </H2>
            <P>Untuk styling non-komponen — mengembalikan <InlineCode>string</InlineCode> className, bukan komponen React.</P>

            <Code filename="badge.ts">
              {`import { cv } from "tailwind-styled-v4"

const badge = cv({
  base: "inline-flex items-center gap-1.5 rounded-full font-medium",
  variants: {
    color: {
      gray:  "bg-gray-100 text-gray-700",
      blue:  "bg-blue-100 text-blue-700",
      green: "bg-green-100 text-green-700",
      red:   "bg-red-100 text-red-700",
    },
    size: {
      sm: "px-2 py-0.5 text-[10px]",
      md: "px-2.5 py-0.5 text-xs",
      lg: "px-3 py-1 text-sm",
    },
  },
  defaultVariants: { color: "gray", size: "md" },
})

<span className={badge({ color: "blue", size: "lg" })}>Active</span>
<span className={badge({ color: "red", className: "opacity-75" })}>Error</span>`}
            </Code>

            <Divider />

            {/* ── states ── */}
            <H2 id="states">
              states
              <AnchorLink href="#states">#</AnchorLink>
            </H2>
            <P>
              Boolean props yang di-resolve via Rust bitmask lookup table. Tidak ada
              string comparison di render path. Maksimal 16 states per komponen.
            </P>

            <Code filename="Button.tsx">
              {`const Button = tw.button({
  base: "inline-flex items-center px-4 py-2 rounded-lg font-medium",
  variants: { intent: { primary: "bg-indigo-600 text-white" } },
  defaultVariants: { intent: "primary" },
  states: {
    loading:   "opacity-60 cursor-wait pointer-events-none",
    fullWidth: "w-full",
    disabled:  "opacity-50 cursor-not-allowed",
  },
})

<Button loading>Memproses...</Button>
<Button fullWidth>Submit</Button>
<Button loading fullWidth>Loading full width</Button>`}
            </Code>

            <Divider />

            {/* ── state data-attr ── */}
            <H2 id="state-data-attr">
              state (data-attr)
              <AnchorLink href="#state-data-attr">#</AnchorLink>
            </H2>
            <P>Toggle style via data attribute — tanpa React re-render, cocok untuk animasi.</P>

            <Code filename="Dropdown.tsx">
              {`const Dropdown = tw.div({
  base: "overflow-hidden transition-all duration-200",
  state: {
    open: {
      true:  "max-h-96 opacity-100",
      false: "max-h-0 opacity-0",
    },
  },
})

// Set data attribute langsung — tidak butuh setState
dropdownRef.current?.setAttribute("data-open", "true")

// Atau via React state
<Dropdown data-open={isOpen.toString()}>{children}</Dropdown>`}
            </Code>

            <Divider />

            {/* ── extend ── */}
            <H2 id="extend">
              .extend()
              <AnchorLink href="#extend">#</AnchorLink>
            </H2>

            <Code filename="Button.tsx">
              {`// Template literal extend
const PrimaryButton = Button.extend\`
  bg-indigo-600 text-white hover:bg-indigo-700
\`

// Object config extend — tambah variant sekaligus
const BigDangerButton = Button.extend({
  classes:  "text-lg px-8 shadow-lg",
  variants: { loading: { true: "animate-pulse" } },
  defaultVariants: { intent: "danger" },
})`}
            </Code>

            <Divider />

            {/* ── Container Queries ── */}
            <H2 id="container-queries">
              Container Queries
              <AnchorLink href="#container-queries">#</AnchorLink>
            </H2>
            <P>Responsive berdasarkan lebar container parent, bukan viewport.</P>

            <Code filename="Card.tsx">
              {`const Card = tw.div({
  base: "p-4 flex flex-col",
  container: {
    sm: "flex-col",    // @container (min-width: 320px)
    md: "flex-row",    // @container (min-width: 640px)
    lg: "grid-cols-3", // @container (min-width: 1024px)
  },
  containerName: "card",
})

const CardWrapper = tw.div\`@container\`

<CardWrapper>
  <Card>{/* responsive berdasarkan lebar CardWrapper */}</Card>
</CardWrapper>`}
            </Code>

            <Callout type="info">
              Breakpoint default: <InlineCode>xs=240px</InlineCode>,{" "}
              <InlineCode>sm=320px</InlineCode>, <InlineCode>md=640px</InlineCode>,{" "}
              <InlineCode>lg=1024px</InlineCode>, <InlineCode>xl=1280px</InlineCode>.
            </Callout>

            <Divider />

            {/* ── server. ── */}
            <H2 id="server-components">
              server.
              <AnchorLink href="#server-components">#</AnchorLink>
            </H2>
            <P>Komponen yang di-enforce hanya boleh render di server. Dev warning otomatis jika render di browser.</P>

            <Code filename="PageHeader.tsx">
              {`import { server } from "tailwind-styled-v4"

const PageHeader = server.header({
  base: "w-full border-b px-6 py-4 bg-white",
  sub: {
    "h1:title":   "text-2xl font-bold",
    "p:subtitle": "text-sm text-gray-500",
  },
})`}
            </Code>

            <Divider />

            {/* ── createStyledSystem ── */}
            <H2 id="create-styled-system">
              createStyledSystem()
              <AnchorLink href="#create-styled-system">#</AnchorLink>
            </H2>
            <P>Design system factory dengan token terpusat. Token di-inject sebagai CSS custom properties <InlineCode>{`--sys-{group}-{name}`}</InlineCode>.</P>

            <Code filename="ui.ts">
              {`import { createStyledSystem } from "tailwind-styled-v4"

const ui = createStyledSystem({
  tokens: {
    colors: { primary: "#6366f1", danger: "#ef4444" },
    radius: { base: "0.5rem", full: "9999px" },
  },
  components: {
    button: {
      tag: "button",
      base: "inline-flex items-center font-medium transition-colors",
      variants: {
        intent: {
          primary: "bg-[var(--sys-colors-primary)] text-white",
          danger:  "bg-[var(--sys-colors-danger)] text-white",
        },
        size: { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-base" },
      },
      defaultVariants: { intent: "primary", size: "md" },
    },
  },
})

const Button = ui.button()
const primaryVar = ui.token("colors.primary") // "var(--sys-colors-primary)"
ui.setTokens({ colors: { primary: "#8b5cf6" } }) // update runtime`}
            </Code>

            <Divider />

            {/* ── liveToken ── */}
            <H2 id="live-token">
              liveToken()
              <AnchorLink href="#live-token">#</AnchorLink>
            </H2>
            <P>Reactive design token yang bisa diupdate runtime dan di-subscribe lewat React hook.</P>

            <Code filename="tokens.ts">
              {`import { liveToken, tokenVar, createUseTokens } from "tailwind-styled-v4"

const tokens = liveToken({
  primary: "#6366f1",
  surface: "#ffffff",
  text:    "#111827",
})

const Card = tw.div({
  base: \`
    bg-[\${tokenVar(tokens.surface)}]
    text-[\${tokenVar(tokens.text)}]
    border-[\${tokenVar(tokens.primary)}]
  \`,
})

const useTokens = createUseTokens(tokens)

function ThemePanel() {
  const { primary } = useTokens()
  return <div style={{ color: primary }}>Current: {primary}</div>
}

// Update — semua subscriber re-render
tokens.primary.set("#8b5cf6")`}
            </Code>

            <Divider />

            {/* ── utilities ── */}
            <H2 id="utilities">
              cn / cx / twMerge
              <AnchorLink href="#utilities">#</AnchorLink>
            </H2>

            <Code filename="utils.ts">
              {`import { cn, cx, twMerge } from "tailwind-styled-v4"

// cn — merge dengan Tailwind conflict resolution
cn("px-4 py-2", isActive && "bg-blue-500", className)

// cx — conditional class join (tanpa dedup)
cx("base", { active: isActive, disabled: !enabled })

// twMerge — eksplisit conflict resolution
twMerge("px-4 px-8")              // → "px-8"
twMerge("bg-red-500 bg-blue-500") // → "bg-blue-500"
twMerge("text-sm font-bold", "text-lg") // → "font-bold text-lg"`}
            </Code>

            <Divider />

            {/* ── TypeScript ── */}
            <H2 id="typescript">
              TypeScript
              <AnchorLink href="#typescript">#</AnchorLink>
            </H2>
            <P>Semua API fully typed — tidak ada <InlineCode>any</InlineCode> di public API.</P>

            <Code filename="types.tsx">
              {`// Variant type inference otomatis dari config
const Button = tw.button({
  variants: {
    intent: { primary: "...", ghost: "...", danger: "..." },
    size:   { sm: "...", md: "...", lg: "..." },
  },
  defaultVariants: { intent: "primary", size: "md" },
})

type ButtonProps = React.ComponentProps<typeof Button>
// → { intent?: "primary" | "ghost" | "danger", size?: "sm" | "md" | "lg", ... }

// Sub-component inference — tag prefix otomatis di-strip
const Card = tw.article({
  sub: {
    "header:header": "...", // → Card.header (renders <header>)
    "h2:title":      "...", // → Card.title  (renders <h2>)
    badge:           "...", // → Card.badge  (renders <span>)
  },
})

Card.header  // ✅
Card.title   // ✅
Card.xyz     // ❌ TypeScript error`}
            </Code>

            <Divider />

            {/* ── CLI ── */}
            <H2 id="cli">
              CLI
              <AnchorLink href="#cli">#</AnchorLink>
            </H2>

            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Command</Th>
                    <Th>Fungsi</Th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["npx tw setup", "Setup otomatis: detect bundler, patch config, pre-warm cache"],
                    ["npx tw preflight", "Verifikasi setup — config, native binary, dependencies"],
                    ["npx tw audit", "Analisis workspace — unused classes, missing variants"],
                    ["npx tw benchmark", "Benchmark performa scanner + compiler"],
                    ["npx tw doctor", "Diagnosa masalah + rekomendasi perbaikan"],
                    ["npx tw trace", "Trace resolusi class untuk debug"],
                    ["npx tw why", "Jelaskan dari mana class tertentu berasal"],
                  ].map(([cmd, desc]) => (
                    <tr key={cmd}>
                      <TdMono>{cmd}</TdMono>
                      <Td>{desc}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>

            <Divider />

            {/* ── DevTools ── */}
            <H2 id="devtools">
              DevTools
              <AnchorLink href="#devtools">#</AnchorLink>
            </H2>

            <Code filename="layout.tsx">
              {`import dynamic from "next/dynamic"

const DevTools = dynamic(
  () => import("tailwind-styled-v4/devtools").then(m => ({ default: m.TwDevTools })),
  { ssr: false }
)

// Render di root layout — floating panel di pojok kanan bawah
<>
  {children}
  <DevTools />
</>`}
            </Code>

            <Callout type="warning">
              DevTools harus di-import dengan <InlineCode>{"ssr: false"}</InlineCode> di
              Next.js — komponen ini client-only dan tidak kompatibel dengan SSR.
            </Callout>

            <Divider />

            {/* ── Env Vars ── */}
            <H2 id="env-vars">
              Environment Variables
              <AnchorLink href="#env-vars">#</AnchorLink>
            </H2>

            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Variable</Th>
                    <Th>Default</Th>
                    <Th>Deskripsi</Th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["TWS_LOG_LEVEL", "info", "debug | info | warn | error | silent"],
                    ["TWS_DEBUG_SCANNER", "0", "1 = aktifkan scanner debug logs"],
                    ["TWS_NO_NATIVE", "—", "1 = disable native module (fallback JS)"],
                    ["TWS_NO_RUST", "—", "1 = disable Rust, gunakan JS fallback"],
                    ["TWS_DISABLE_NATIVE", "—", "Alias TWS_NO_NATIVE"],
                  ].map(([v, d, desc]) => (
                    <tr key={v}>
                      <TdMono>{v}</TdMono>
                      <Td tone="mutedCenter">{d}</Td>
                      <Td>{desc}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>

            <Divider />

            {/* ── Benchmark ── */}
            <H2 id="benchmark">
              Benchmark
              <AnchorLink href="#benchmark">#</AnchorLink>
            </H2>
            <P>Diukur di Node.js 22, Rust 1.75, M1 MacBook Pro.</P>

            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Operasi</Th>
                    <Th>tailwind-styled-v4</Th>
                    <Th>Tailwind JS</Th>
                    <Th>Speedup</Th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Scan 1000 file", "0.8 ms", "~340 ms", "~425×"],
                    ["Compile 500 class", "0.02 ms", "~1.2 ms", "~60×"],
                    ["Parse class str", "0.010 ms", "~0.8 ms", "~80×"],
                    ["Cache read/write", "0.009 ms", "~0.5 ms", "~55×"],
                    ["Watch rebuild", "< 5 ms", "~85 ms", "~17×"],
                  ].map(([op, tw, js, sp]) => (
                    <tr key={op}>
                      <Td tone="label">{op}</Td>
                      <Td tone="successBold">{tw}</Td>
                      <Td>{js}</Td>
                      <Td tone="indigoBold">{sp}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>

            <Divider />

            {/* ── Architecture ── */}
            <H2 id="architecture">
              Architecture
              <AnchorLink href="#architecture">#</AnchorLink>
            </H2>

            <CardsGrid>
              {[
                { title: "🦀 native/", href: "#architecture", desc: "Rust engine via NAPI-RS. Domain, application, infrastructure layers. 11 NAPI bridge modules." },
                { title: "📦 packages/domain/", href: "#architecture", desc: "core, compiler, scanner, theme, shared, runtime-css. Clean domain separation." },
                { title: "🔌 packages/presentation/", href: "#architecture", desc: "Next.js, Vite, Rspack plugins. Thin wrapper atas domain packages." },
                { title: "🖥️ packages/infrastructure/", href: "#architecture", desc: "CLI, DevTools, Dashboard, VSCode extension, Storybook addon." },
              ].map((c) => (
                <CardItem key={c.title} href={c.href}>
                  <CardItemTitle>{c.title}</CardItemTitle>
                  <CardItemDesc>{c.desc}</CardItemDesc>
                </CardItem>
              ))}
            </CardsGrid>

            <Code filename="monorepo structure">
              {`tailwind-styled-v4/
├── native/                  # 🦀 Rust engine (NAPI-RS)
│   ├── src/domain/          # variants, CSS gen, theme
│   ├── src/application/     # parser, scanner, resolver
│   └── src/infrastructure/  # 11 NAPI bridge modules
│
├── packages/
│   ├── domain/
│   │   ├── core/            # tw, cv, cn, cx — core API
│   │   ├── compiler/        # Tailwind v4 + LightningCSS
│   │   ├── scanner/         # file scanner (~425× faster)
│   │   ├── theme/           # token resolution
│   │   └── runtime-css/     # batched browser CSS inject
│   │
│   ├── presentation/
│   │   ├── next/            # withTailwindStyled plugin
│   │   ├── vite/            # Vite plugin
│   │   └── rspack/          # Rspack plugin
│   │
│   └── infrastructure/
│       └── cli/             # tw setup, audit, benchmark
│
└── examples/
    ├── next-js-app/         # ← kamu di sini
    ├── vite-react/
    └── rspack/`}
            </Code>

            {/* ── Prev / Next footer — Fumadocs pattern ── */}
            <PageFooter>
              <FooterNav href="/" dir="prev">
                <FooterNavHint>← Previous</FooterNavHint>
                <FooterNavLabel>Demo Showcase</FooterNavLabel>
              </FooterNav>
              <FooterNav href="https://github.com/Dictionar32/tailwind-styled-v4" dir="next">
                <FooterNavHint>Next →</FooterNavHint>
                <FooterNavLabel>GitHub Source</FooterNavLabel>
              </FooterNav>
            </PageFooter>

          </ContentInner>
        </ContentArea>

        {/* RIGHT TOC — sticky scroll-spy */}
        <TocAside>
          <TocLabel>On this page</TocLabel>
          <TocList>
            {TOC_ITEMS.map((item) => (
              <TocItem key={item.id} item={item} activeId={tocActiveId} />
            ))}
          </TocList>
          <TocFooter>
            <EditGithubLink
              href="https://github.com/Dictionar32/tailwind-styled-v4"
              target="_blank"
            >
              Edit on GitHub ↗
            </EditGithubLink>
          </TocFooter>
        </TocAside>

      </BodyGrid>
    </PageShell>
  );
}
