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
export const SupportBadge = tw.span({ base: "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", variants: { status: { supported: "bg-emerald-100 text-emerald-700", partial: "bg-amber-100 text-amber-700", none: "bg-red-100 text-red-700" } }, defaultVariants: { status: "supported" } })
export const BadgeRow = tw.div({ base: "flex gap-2 flex-wrap my-4" })
export const ContainerBox = tw.div({ base: "@container rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] p-3 min-h-[200px] flex items-center justify-center" })
export const ContainerLabel = tw.span({ base: "absolute top-2 left-2 text-[10px] font-mono text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]" })

// Container queries specific components
export const ControlsRow = tw.div({ base: "flex items-center gap-3" })
export const WidthValue = tw.span({ base: "text-xs font-mono text-[var(--accent)] w-16 text-right" })
export const CardIcon = tw.span({ base: "text-2xl" })
export const CardContent = tw.div({ base: "flex flex-col gap-1" })
export const CardMeta = tw.div({ base: "text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] mt-1" })
export const ComparisonTable = tw.div({ base: "overflow-x-auto my-5" })
export const CompTable = tw.table({ base: "w-full text-xs border-collapse" })
export const CompTableHead = tw.thead({})
export const CompTableHeadRow = tw.tr({ base: "border-b border-[color-mix(in_srgb,var(--foreground)_10%,transparent)]" })
export const CompTableHeadCell = tw.th({ base: "text-left py-2 px-3 font-semibold" })
export const CompTableBody = tw.tbody({ base: "text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]" })
export const CompTableRow = tw.tr({ base: "border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)]" })
export const CompTableCell = tw.td({ base: "py-2 px-3" })

// Container query playground components
export const PlaygroundWidthContainer = tw.div({
    base: "transition-all duration-200 m-auto",
})

export const CardContainer = tw.div({
    base: [
        "display-flex",
        "gap-3",
        "bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]",
        "rounded-lg p-3",
    ].join(" "),
    variants: {
        layout: {
            column: "flex-col",
            row: "flex-row",
        },
    },
    defaultVariants: { layout: "column" },
})

export const CardImage = tw.div({
    base: [
        "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]",
        "rounded-lg flex-shrink-0",
        "flex items-center justify-center",
    ].join(" "),
    variants: {
        layout: {
            column: "w-full h-[120px]",
            row: "w-20 h-20",
        },
    },
    defaultVariants: { layout: "column" },
})

export const CardTitleNormal = tw.div({
    base: "text-sm font-semibold",
})

export const CardTitleLarge = tw.div({
    base: "text-base font-semibold",
})

export const CompTableCellBold = tw.td({
    base: "py-2 px-3 font-medium",
})

export const RangeSlider = tw.input({
    base: "flex-1 accent-[var(--accent)]",
})

export const SmallText = tw.span({
    base: "text-xs leading-none",
})

export const SmallDescription = tw.p({
    base: "text-xs leading-relaxed text-[color-mix(in_srgb,var(--foreground)_80%,transparent)]",
})
