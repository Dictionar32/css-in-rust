import { tw } from "tailwind-styled-v4"

// ─── Level strip link ──────────────────────────────────────────────────────────
export const LevelStripLink = tw.a({
    base: "group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)] hover:border-[var(--accent)] transition-all text-center",
    sub: {
        "span:icon": "text-2xl",
        "span:label": "text-[11px] font-semibold group-hover:text-[var(--accent)] transition-colors",
        "span:count": "text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]",
    },
})

// ─── Section heading link ──────────────────────────────────────────────────────
export const SectionHeadingLink = tw.a({
    base: "flex items-center gap-2 text-lg font-bold mb-3 hover:text-[var(--accent)] transition-colors group",
    sub: {
        "span:arrow": "opacity-0 group-hover:opacity-100 text-[var(--accent)] transition-opacity",
    },
})

// ─── Card item link ────────────────────────────────────────────────────────────
export const CardItemLink = tw.a({
    base: "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)] hover:border-[var(--accent)] hover:shadow-sm transition-all",
    sub: {
        "span:icon": "text-base shrink-0 w-6 text-center",
        "span:title": "text-sm font-medium group-hover:text-[var(--accent)] transition-colors",
    },
})
