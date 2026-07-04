import { tw } from "tailwind-styled-v4"

export const Page = tw.div({ base: "min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans", attrs: { "data-learn-page": "" } })
export const TopBar = tw.nav({ base: "sticky top-0 z-50 h-12 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] backdrop-blur-md", attrs: { "data-learn-topbar": "" } })
export const TopBarInner = tw.div({ base: "max-w-5xl mx-auto px-4 h-full flex items-center gap-2 text-sm" })
export const Breadcrumb = tw.div({ base: "flex items-center gap-1.5 text-xs text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]", sub: { "a:link": "hover:text-[var(--foreground)] transition-colors", "span:sep": "opacity-40", "span:curr": "text-[var(--foreground)] font-medium" } })
export const Body = tw.div({ base: "max-w-5xl mx-auto px-4 py-10 flex gap-10" })
export const Content = tw.main({ base: "flex-1 min-w-0" })
export const Toc = tw.aside({ base: "hidden xl:block w-52 shrink-0 sticky top-16 h-fit space-y-1" })
export const TocLabel = tw.p({ base: "text-[10px] font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--foreground)_35%,transparent)] mb-3" })
export const TocItem = tw.a({ base: "block text-xs py-1 leading-snug transition-colors", variants: { active: { true: "text-[var(--accent)] font-semibold", false: "text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] hover:text-[var(--foreground)]" } }, defaultVariants: { active: false } })
export const PageTitle = tw.h1({ base: "text-3xl font-bold tracking-tight mb-2" })
export const PageDesc = tw.p({ base: "text-base text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] mb-10 leading-relaxed" })
export const Divider = tw.hr({ base: "border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] my-10" })
export const Section = tw.section({ base: "scroll-mt-20 mb-10" })
export const H2 = tw.h2({ base: "text-xl font-bold mb-4 scroll-mt-20 flex items-center gap-2 group", sub: { "a:anchor": "opacity-0 group-hover:opacity-100 text-[var(--accent)] text-base no-underline" } })
export const H3 = tw.h3({ base: "text-base font-semibold mb-3 mt-6 scroll-mt-20" })
export const P = tw.p({ base: "text-sm leading-7 text-[color-mix(in_srgb,var(--foreground)_80%,transparent)] mb-4" })
export const IC = tw.code({ base: "px-1.5 py-0.5 rounded text-[11px] font-mono bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)]" })
export const Callout = tw.div({ base: "rounded-xl border px-4 py-3 my-5 text-sm leading-relaxed flex gap-3", variants: { type: { note: "bg-blue-50 border-blue-200 text-blue-900", tip: "bg-emerald-50 border-emerald-200 text-emerald-900", warning: "bg-amber-50 border-amber-200 text-amber-900", danger: "bg-red-50 border-red-200 text-red-900" } }, defaultVariants: { type: "note" }, sub: { "span:icon": "text-base shrink-0 mt-0.5", "div:content": "flex-1", "strong:title": "block font-semibold mb-0.5" } })
export const CodeWrap = tw.div({ base: "rounded-xl overflow-hidden border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] my-5", sub: { header: "flex items-center justify-between px-4 py-2.5 bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]", filename: "text-[11px] font-mono text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]", "pre:body": "p-4 overflow-x-auto text-xs font-mono leading-6 bg-[var(--surface)] text-[var(--foreground)] m-0" } })
export const CopyBtn = tw.button({ base: "text-[10px] font-medium px-2.5 py-1 rounded-md border transition-all border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] hover:text-[var(--foreground)]", states: { copied: "bg-emerald-500 text-white border-emerald-500" } })
export const ExerciseCard = tw.div({ base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)] overflow-hidden my-5", sub: { header: "flex items-center gap-2 px-4 py-3 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]", title: "text-xs font-semibold", "div:body": "p-4 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)] leading-relaxed space-y-1" } })
export const PageNav = tw.div({ base: "flex items-center justify-between mt-16 pt-6 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" })
export const NavBtn = tw.a({ base: "flex flex-col gap-0.5 px-4 py-3 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)] hover:border-[var(--accent)] transition-all text-sm", variants: { dir: { prev: "items-start", next: "items-end" } }, defaultVariants: { dir: "next" }, sub: { "span:hint": "text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] uppercase tracking-wider", "span:label": "font-semibold" } })
export const PlaygroundWrap = tw.div({ base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5", sub: { controls: "p-4 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] space-y-3", "span:label": "text-[10px] font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--foreground)_35%,transparent)]", canvas: "p-4 bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]", codeline: "px-4 py-3 border-t border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] bg-[var(--surface)] font-mono text-[11px] text-[var(--accent)]" } })
export const Chip = tw.button({ base: "px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border transition-all", variants: { active: { true: "bg-[var(--accent)] text-white border-[var(--accent)]", false: "border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] text-[color-mix(in_srgb,var(--foreground)_55%,transparent)] hover:border-[var(--accent)] hover:text-[var(--accent)]" } }, defaultVariants: { active: false } })
export const ChipRow = tw.div({ base: "flex flex-wrap gap-1.5" })

// ─── Mentor-specific primitives ────────────────────────────────────────────────

export const RoadmapStep = tw.div({
    base: "relative flex gap-4 pb-8 last:pb-0",
    sub: {
        "div:line": "absolute left-5 top-10 bottom-0 w-px bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] last:hidden",
        "div:dot": "shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-base font-bold z-10 bg-[var(--surface)]",
        "div:body": "flex-1 pt-1.5 pb-4",
    },
})

export const RoadmapDot = tw.div({
    base: "shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold z-10 bg-[var(--surface)]",
    variants: {
        status: {
            done: "border-emerald-400 text-emerald-600 bg-emerald-50",
            current: "border-[var(--accent)] text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]",
            upcoming: "border-[color-mix(in_srgb,var(--foreground)_15%,transparent)] text-[color-mix(in_srgb,var(--foreground)_35%,transparent)]",
        },
    },
    defaultVariants: { status: "upcoming" },
})

export const LevelBadge = tw.span({
    base: "inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border",
    variants: {
        level: {
            dasar: "bg-emerald-50 border-emerald-200 text-emerald-700",
            medium: "bg-blue-50 border-blue-200 text-blue-700",
            high: "bg-violet-50 border-violet-200 text-violet-700",
            advanced: "bg-amber-50 border-amber-200 text-amber-700",
            mentor: "bg-pink-50 border-pink-200 text-pink-700",
        },
    },
    defaultVariants: { level: "dasar" },
})

export const ProjectCard = tw.div({
    base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)] p-4 my-3",
    sub: {
        header: "flex items-start justify-between gap-2 mb-2",
        title: "text-sm font-semibold leading-snug",
        "div:tags": "flex flex-wrap gap-1.5 mt-2",
        "div:desc": "text-xs text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] leading-relaxed",
        "div:skills": "mt-3 pt-3 border-t border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] text-[10px] text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]",
    },
})

export const DifficultyBadge = tw.span({
    base: "shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full",
    variants: {
        level: {
            beginner: "bg-emerald-100 text-emerald-700",
            intermediate: "bg-blue-100 text-blue-700",
            advanced: "bg-violet-100 text-violet-700",
        },
    },
    defaultVariants: { level: "beginner" },
})

export const SkillTag = tw.span({ base: "inline-flex items-center text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)]" })

export const CheckList = tw.ul({
    base: "space-y-2 my-4",
    sub: {
        "li:item": "flex items-start gap-2.5 text-sm text-[color-mix(in_srgb,var(--foreground)_80%,transparent)]",
        "span:icon": "text-base shrink-0 mt-0.5",
        "span:text": "leading-6",
    },
})

export const TipCard = tw.div({
    base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)] p-4 my-3",
    variants: {
        accent: {
            violet: "border-l-4 border-l-violet-400",
            blue: "border-l-4 border-l-blue-400",
            emerald: "border-l-4 border-l-emerald-400",
            amber: "border-l-4 border-l-amber-400",
        },
    },
    defaultVariants: { accent: "violet" },
    sub: {
        "p:title": "text-xs font-bold mb-1",
        "p:body": "text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)] leading-relaxed",
    },
})

export const DebugStep = tw.div({
    base: "flex gap-3 items-start my-3",
    sub: {
        "div:num": "shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center mt-0.5",
        "div:content": "flex-1",
        "p:title": "text-sm font-semibold mb-1",
        "p:desc": "text-xs text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] leading-relaxed",
    },
})

export const ResourceLink = tw.a({
    base: "flex items-center gap-3 p-3 rounded-lg border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)] hover:border-[var(--accent)] transition-all group my-2",
    sub: {
        "div:icon": "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]",
        "div:body": "flex-1 min-w-0",
        "p:title": "text-sm font-semibold group-hover:text-[var(--accent)] transition-colors",
        "p:desc": "text-xs text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] truncate",
        "span:arrow": "text-[color-mix(in_srgb,var(--foreground)_25%,transparent)] group-hover:text-[var(--accent)] transition-colors text-sm",
    },
})

// ─── Resources page components ────────────────────────────────────────────────

export const GameGrid = tw.div({
    base: "grid grid-cols-1 sm:grid-cols-2 gap-3",
})

export const GameCard = tw.a({
    base: "flex gap-3 p-3 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)] hover:border-[var(--accent)] transition-all group",
})

export const GameIconBox = tw.span({
    base: "shrink-0 w-10 h-10 rounded-lg bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] flex items-center justify-center text-xl",
})

export const GameContent = tw.div({
    base: "flex-1 min-w-0",
})

export const GameTitle = tw.p({
    base: "text-sm font-semibold group-hover:text-[var(--accent)] transition-colors",
})

export const GameDesc = tw.p({
    base: "text-xs text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] mt-0.5 leading-snug",
})

export const GameTagContainer = tw.div({
    base: "flex flex-wrap gap-1 mt-1.5",
})
