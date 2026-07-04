import { tw } from "tailwind-styled-v4";

/**
 * ARIA + Dynamic Theme Styles — FIXED
 *
 * Key learnings:
 * - @state: Maps state NAME → ARIA PROPERTY (string to string mapping)
 *   Example: { expanded: "aria-expanded" } means "expanded" prop → aria-expanded attribute
 * - variants: Maps prop names → CSS classes (for any type of prop: boolean, string, etc)
 *   Example: { disabled: { true: "opacity-50", false: "" } }
 * - Use variants for CSS control, @state for ARIA mapping
 */

// ─────────────────────────────────────────────────────────────────────────────
// Layout Components
// ─────────────────────────────────────────────────────────────────────────────

export const Page = tw.main({
    base: "min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)] transition-colors duration-300",
    "@semantic": "main",
});

export const Section = tw.section({
    base: "max-w-5xl mx-auto px-4 py-10 scroll-mt-20",
    "@semantic": "section",
});

export const Title = tw.h1({
    base: "text-3xl font-bold tracking-tight mb-4",
});

export const Subtitle = tw.h2({
    base: "text-xl font-semibold text-[var(--color-fg)] mb-3",
});

export const Text = tw.p({
    base: "text-sm leading-relaxed opacity-80 mb-4",
});

// ─────────────────────────────────────────────────────────────────────────────
// Card Component with Theme Support
// ─────────────────────────────────────────────────────────────────────────────

export const Card = tw.article({
    base: "bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow",
    "@semantic": "article",
    sub: {
        header: "border-b border-[var(--color-border)] pb-4 mb-4",
        footer: "border-t border-[var(--color-border)] pt-4 mt-4",
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Button Component with Proper Variants (not @state)
// ─────────────────────────────────────────────────────────────────────────────

export const Button = tw.button({
    base: "px-4 py-2 rounded-lg font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-focus)]",
    "@semantic": "button",
    "@aria": {
        role: "button",
    },
    variants: {
        variant: {
            primary:
                "bg-[var(--color-primary)] text-white hover:opacity-90 active:scale-95",
            secondary:
                "bg-[var(--color-secondary)] text-[var(--color-fg)] hover:opacity-80",
            outline:
                "border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white",
        },
        disabled: {
            true: "opacity-50 cursor-not-allowed pointer-events-none",
            false: "",
        },
    },
    defaultVariants: { variant: "primary", disabled: false },
});

// ─────────────────────────────────────────────────────────────────────────────
// Grid for Layout
// ─────────────────────────────────────────────────────────────────────────────

export const Grid = tw.div({
    base: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6",
    "@semantic": "div",
});

// ─────────────────────────────────────────────────────────────────────────────
// Badge Component with Theme Variants
// ─────────────────────────────────────────────────────────────────────────────

export const Badge = tw.span({
    base: "inline-block px-3 py-1 rounded-full text-xs font-semibold",
    variants: {
        variant: {
            primary: "bg-[var(--color-primary)] text-white",
            secondary: "bg-[var(--color-secondary)] text-[var(--color-fg)]",
            success: "bg-green-500 text-white",
            danger: "bg-red-500 text-white",
        },
    },
    defaultVariants: { variant: "primary" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Status Indicator with ARIA
// ─────────────────────────────────────────────────────────────────────────────

export const Status = tw.div({
    base: "flex items-center gap-2 px-3 py-2 rounded-md",
    "@semantic": "div",
    "@aria": {
        role: "status",
    },
    variants: {
        status: {
            success: "bg-green-100 text-green-800",
            warning: "bg-yellow-100 text-yellow-800",
            error: "bg-red-100 text-red-800",
            info: "bg-blue-100 text-blue-800",
        },
    },
    defaultVariants: { status: "info" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Alert Component with Live Region ARIA
// ─────────────────────────────────────────────────────────────────────────────

export const Alert = tw.div({
    base: "border-l-4 border-[var(--color-primary)] bg-[var(--color-alert-bg)] p-4 rounded-r",
    "@semantic": "aside",
    "@aria": {
        role: "alert",
        "aria-live": "polite",
        "aria-atomic": "true",
    },
    sub: {
        title: "font-bold mb-2",
        description: "text-sm opacity-90",
    },
});

export const AlertTitle = tw.strong({
    base: "block font-bold",
});

export const AlertDescription = tw.p({
    base: "text-sm mt-2",
});

// ─────────────────────────────────────────────────────────────────────────────
// Tab Components with ARIA
// ─────────────────────────────────────────────────────────────────────────────

export const TabList = tw.div({
    base: "flex gap-1 border-b border-[var(--color-border)] mb-6",
    "@semantic": "div",
    "@aria": {
        role: "tablist",
    },
});

// TabButton uses variant for styling, no @state
export const TabButton = tw.button({
    base: "px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-[var(--color-primary)] transition-colors",
    "@semantic": "button",
    "@aria": {
        role: "tab",
    },
    variants: {
        active: {
            true: "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]",
            false: "text-[var(--color-fg-muted)]",
        },
    },
    defaultVariants: { active: false },
});

export const TabPanel = tw.div({
    base: "p-4 rounded-lg bg-[var(--color-panel-bg)]",
    "@semantic": "div",
    "@aria": {
        role: "tabpanel",
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Toggle Group (for theme switcher)
// ─────────────────────────────────────────────────────────────────────────────

export const ToggleGroup = tw.div({
    base: "flex gap-2",
    "@semantic": "fieldset",
    "@aria": {
        role: "radiogroup",
    },
});

// ToggleButton uses variant for styling
export const ToggleButton = tw.button({
    base: "px-3 py-2 rounded-lg font-medium transition-all border-2",
    "@semantic": "button",
    "@aria": {
        role: "radio",
    },
    variants: {
        active: {
            true: "border-[var(--color-primary)] bg-[var(--color-primary)] text-white",
            false:
                "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)]",
        },
    },
    defaultVariants: { active: false },
});

// ─────────────────────────────────────────────────────────────────────────────
// Code Block for Display
// ─────────────────────────────────────────────────────────────────────────────

export const CodeBlock = tw.pre({
    base: "bg-[var(--color-code-bg)] text-[var(--color-code-fg)] p-4 rounded-lg overflow-auto text-xs leading-relaxed font-mono",
    "@semantic": "pre",
    "@aria": {
        role: "region",
        "aria-label": "Code example",
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Live Preview
// ─────────────────────────────────────────────────────────────────────────────

export const LivePreview = tw.div({
    base: "border-2 border-dashed border-[var(--color-border)] rounded-lg p-6 bg-[var(--color-preview-bg)]",
    "@semantic": "div",
    "@aria": {
        role: "region",
        "aria-label": "Live preview area",
    },
});

/**
 * CSS Custom Properties (sa globals.css):
 *
 * :root {
 *   --color-bg: #ffffff;
 *   --color-fg: #000000;
 *   --color-primary: #3b82f6;
 *   --color-secondary: #8b5cf6;
 *   --color-border: #e5e7eb;
 *   --color-focus: #2563eb;
 *   --color-card-bg: #f9fafb;
 *   --color-alert-bg: #dbeafe;
 *   --color-panel-bg: #f3f4f6;
 *   --color-code-bg: #1f2937;
 *   --color-code-fg: #e5e7eb;
 *   --color-preview-bg: #f0f9ff;
 *   --color-fg-muted: #6b7280;
 * }
 *
 * [data-theme="dark"] {
 *   --color-bg: #1f2937;
 *   --color-fg: #f9fafb;
 *   --color-primary: #60a5fa;
 *   --color-secondary: #a78bfa;
 *   --color-border: #374151;
 *   --color-focus: #3b82f6;
 *   --color-card-bg: #111827;
 *   --color-alert-bg: #0c4a6e;
 *   --color-panel-bg: #0f172a;
 *   --color-code-bg: #0f172a;
 *   --color-code-fg: #d1d5db;
 *   --color-preview-bg: #051c2c;
 *   --color-fg-muted: #9ca3af;
 * }
 */
