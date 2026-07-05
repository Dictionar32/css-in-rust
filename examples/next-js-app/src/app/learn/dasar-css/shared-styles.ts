import { tw } from "tailwind-styled-v4"

// ============================================
// TEXT & TYPOGRAPHY COMPONENTS
// ============================================

export const InfoText = tw.p({
    base: "text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]",
})

export const MonoText = tw.p({
    base: "text-[10px] text-gray-400 font-mono",
})

export const MonoTextCenter = tw.p({
    base: "text-[10px] font-mono text-center text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]",
})

export const CodeLabel = tw.span({
    base: "text-[11px] font-mono text-[color-mix(in_srgb,var(--foreground)_50%,transparent)]",
})

export const SmallLabel = tw.p({
    base: "text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] font-semibold uppercase tracking-wider",
})

export const DescriptionText = tw.p({
    base: "text-sm text-[color-mix(in_srgb,var(--foreground)_75%,transparent)] leading-relaxed",
})

// ============================================
// LAYOUT & CONTAINER COMPONENTS
// ============================================

export const GridLayout = tw.div({
    base: "grid gap-4",
    variants: {
        columns: {
            1: "grid-cols-1",
            2: "sm:grid-cols-2",
            3: "sm:grid-cols-3",
        },
    },
    defaultVariants: { columns: 3 },
})

export const FlexContainer = tw.div({
    base: "flex gap-3 items-center",
})

export const FlexColumn = tw.div({
    base: "flex flex-col gap-1.5",
})

export const CardContainer = tw.div({
    base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)] overflow-hidden my-5",
})

export const CardContent = tw.div({
    base: "p-4 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0",
})

export const CardRow = tw.div({
    base: "p-3 flex items-center gap-2",
})

export const RelativeContainer = tw.div({
    base: "relative",
})

export const GridDisplay = tw.div({
    base: "grid grid-cols-3 gap-0 border border-gray-300",
})

// ============================================
// INTERACTIVE & HIGHLIGHT COMPONENTS
// ============================================

export const StickyHeader = tw.div({
    base: "sticky top-0 z-10 bg-[var(--accent)] text-white text-xs font-bold px-4 py-2 flex items-center gap-2",
})

export const PositionedBox = tw.div({
    base: "absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-3 py-2 rounded-lg z-50 shadow-lg",
})

export const AlertBox = tw.p({
    base: "text-xs rounded-lg px-3 py-2 border",
    variants: {
        type: {
            success: "bg-emerald-50 text-emerald-700 border-emerald-100",
            warning: "bg-amber-50 text-amber-700 border-amber-100",
            info: "bg-blue-50 text-blue-900 border-blue-200",
        },
    },
    defaultVariants: { type: "info" },
})

export const HighlightBox = tw.div({
    base: "p-2 rounded bg-emerald-500 text-white text-[10px] font-bold z-[9999] relative",
})

export const ViewportDemo = tw.div({
    base: "p-3 text-[10px] text-gray-400",
})

export const DemoSection = tw.div({
    base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)] overflow-hidden my-5",
})

// ============================================
// STATUS & CONDITIONAL COMPONENTS
// ============================================

export const StatusText = tw.span({
    base: "font-semibold",
    variants: {
        status: {
            error: "text-red-600",
            success: "text-emerald-600",
            neutral: "text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]",
        },
    },
    defaultVariants: { status: "neutral" },
})

export const InfoSpan = tw.span({
    base: "text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]",
})

export const NormalSpan = tw.span({
    base: "font-normal opacity-70",
})

// ============================================
// DEMO & PLAYGROUND HELPERS
// ============================================

export const DemoLabel = tw.span({
    base: "text-xs font-mono text-gray-400 mb-3 block",
})

export const GridCell = tw.div({
    base: "border border-gray-300 p-2 text-center text-xs text-gray-600",
})

export const ContentBox = tw.div({
    base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] p-4 my-5 bg-[var(--surface)]",
})

export const TableContainer = tw.div({
    base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5",
})

export const TableRow = tw.div({
    base: "p-3 flex items-center gap-2 border-b border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] last:border-0",
})

// ============================================
// MOTION & ANIMATION HELPERS
// ============================================

export const ProgressDisplay = tw.span({
    base: "text-[11px] font-mono text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] w-10",
})

export const MotionLabel = tw.p({
    base: "text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]",
})

// ============================================
// Z-INDEX & STACKING COMPONENTS
// ============================================

export const StackingParent = tw.div({
    base: "absolute top-6 left-16 bg-blue-100 border-2 border-blue-400 rounded-lg p-2",
})

export const StackingLabel = tw.p({
    base: "text-[9px] font-mono text-blue-800 mb-1",
})

export const StackingChild = tw.div({
    base: "bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded z-[9999] relative",
})

export const StackingNote = tw.p({
    base: "text-[10px] font-mono text-center text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]",
})

// ============================================
// FORM & INPUT HELPERS
// ============================================

export const RangeSlider = tw.input({
    base: "flex-1 accent-[var(--accent)]",
})

export const ProgressLabel = tw.span({
    base: "text-[11px] font-mono text-[color-mix(in_srgb,var(--foreground)_50%,transparent)]",
})

// ============================================
// POSITIONING-SPECIFIC COMPONENTS
// ============================================

export const PosCanvas = tw.div({
    base: `
        rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)]
        bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)]
        p-4 overflow-hidden relative h-44
    `,
    sub: {
        inner: "flex gap-3 items-start h-full relative",
    },
})

export const PosSibling = tw.div({
    base: "w-16 h-14 rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-mono shrink-0",
})

export const PosElement = tw.div({
    base: "w-20 h-14 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 transition-all duration-300 bg-[var(--accent)]",
    variants: {
        pos: {
            static: "",
            relative: "relative top-4 left-4",
            absolute: "absolute top-2 right-2",
            fixed: "fixed top-16 right-4 z-50 shadow-xl",
            sticky: "sticky top-2",
        },
    },
    defaultVariants: { pos: "static" },
})

export const CbParent = tw.div({
    base: "rounded-xl bg-white border-2 p-6 relative h-40 transition-all duration-200",
    variants: {
        pos: {
            static: "border-gray-300",
            relative: "border-emerald-400",
        },
    },
    defaultVariants: { pos: "static" },
})

export const CbChild = tw.div({
    base: "absolute w-24 h-12 rounded-lg flex items-center justify-center text-[10px] font-mono text-white bg-rose-500 shadow-md",
    variants: {
        corner: {
            tr: "top-2 right-2",
            br: "bottom-2 right-2",
        },
    },
    defaultVariants: { corner: "tr" },
})

export const StickyScrollArea = tw.div({
    base: "h-56 overflow-y-auto rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-white relative",
})

export const StickyContentBlock = tw.div({
    base: "px-4 py-3 text-xs text-gray-600 border-b border-gray-100",
})

export const StackCanvas = tw.div({
    base: "relative h-48 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-white overflow-hidden",
})

export const StackBox = tw.div({
    base: "absolute w-28 h-28 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg",
    variants: {
        layer: {
            a: "bg-rose-400  top-4  left-4",
            b: "bg-blue-400  top-12 left-16",
            c: "bg-amber-400 top-20 left-28",
        },
        z: {
            0: "z-0",
            10: "z-10",
            20: "z-20",
            30: "z-30",
        },
    },
    defaultVariants: { layer: "a", z: 0 },
})

export const OpacityParent = tw.div({
    base: "relative h-40 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-white p-4 transition-all duration-200",
    variants: {
        opacity: {
            full: "opacity-100",
            reduced: "opacity-90",
        },
    },
    defaultVariants: { opacity: "full" },
})

export const OpacityChild = tw.div({
    base: "absolute w-20 h-12 rounded-lg flex items-center justify-center text-[10px] font-bold text-white",
    variants: {
        layer: {
            low: "bg-blue-400 z-10 top-6 left-6",
            high: "bg-rose-500 z-50 top-12 left-16",
        },
    },
    defaultVariants: { layer: "low" },
})

export const InsetParent = tw.div({
    base: "relative h-40 rounded-xl border-2 border-dashed border-gray-300 bg-white",
})

export const InsetChild = tw.div({
    base: "absolute bg-[var(--accent)] text-white text-[10px] font-mono flex items-center justify-center rounded-lg transition-all duration-200",
    variants: {
        mode: {
            full: "inset-0",
            partial: "inset-4",
            mixed: "top-2 right-2 bottom-8 left-8",
        },
    },
    defaultVariants: { mode: "full" },
})

export const FakeViewport = tw.div({
    base: "relative h-48 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-gray-100 overflow-hidden",
})

export const FakeOverlay = tw.div({
    base: "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200",
    variants: {
        show: {
            true: "opacity-100 pointer-events-auto",
            false: "opacity-0 pointer-events-none",
        },
    },
    defaultVariants: { show: false },
})

export const FakeModal = tw.div({
    base: "bg-white rounded-xl p-4 w-40 text-center shadow-2xl",
    sub: {
        "p:title": "text-xs font-bold mb-1",
        "p:desc": "text-[10px] text-gray-500",
    },
})

export const SnapContainer = tw.div({
    base: "flex gap-3 overflow-x-auto h-32 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] p-3 snap-x snap-mandatory",
})

export const SnapItem = tw.div({
    base: "shrink-0 w-32 h-full rounded-lg flex items-center justify-center text-white font-bold snap-center",
    variants: {
        color: {
            0: "bg-rose-400",
            1: "bg-blue-400",
            2: "bg-emerald-400",
            3: "bg-amber-400",
            4: "bg-violet-400",
        },
    },
    defaultVariants: { color: 0 },
})

export const AnchorDemoBox = tw.div({
    base: "relative h-40 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-white flex items-center justify-center",
})

export const AnchorButton = tw.button({
    base: "px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold",
})

export const AnchorTooltip = tw.div({
    base: "absolute bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg transition-all duration-200",
    variants: {
        show: {
            true: "opacity-100 -translate-y-2",
            false: "opacity-0 translate-y-0 pointer-events-none",
        },
    },
    defaultVariants: { show: false },
})

export const StickyTrapScroll = tw.div({
    base: "h-64 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-white relative",
    variants: {
        overflow: {
            visible: "overflow-visible",
            hidden: "overflow-hidden",
            auto: "overflow-auto",
            scroll: "overflow-scroll",
        },
    },
    defaultVariants: { overflow: "visible" },
})

export const StickyTrapInner = tw.div({
    base: "overflow-y-auto h-full",
})

export const OffsetDot = tw.div({
    base: "w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-[10px] font-bold",
})

export const ErrorText = tw.p({
    base: "text-xs",
    variants: {
        error: {
            true: "text-red-600 font-semibold",
            false: "text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]",
        },
    },
    defaultVariants: { error: false },
})

export const StickyStatusText = tw.span({
    base: "font-semibold",
    variants: {
        broken: {
            true: "text-red-600",
            false: "text-emerald-600",
        },
    },
    defaultVariants: { broken: false },
})
