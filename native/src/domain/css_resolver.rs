pub(crate) fn variant_to_at_rule(variant: &str) -> &'static str {
    match variant {
        // Pseudo-classes (appended after selector)
        "hover" => ":hover",
        "focus" => ":focus",
        "focus-within" => ":focus-within",
        "focus-visible" => ":focus-visible",
        "active" => ":active",
        "visited" => ":visited",
        "disabled" => ":disabled",
        "checked" => ":checked",
        "required" => ":required",
        "first" => ":first-child",
        "last" => ":last-child",
        "odd" => ":nth-child(odd)",
        "even" => ":nth-child(even)",
        "placeholder" => "::placeholder",
        "before" => "::before",
        "after" => "::after",
        "first-line" => "::first-line",
        "first-letter" => "::first-letter",
        // Responsive breakpoints (@media)
        "sm" => "@media (min-width: 640px)",
        "md" => "@media (min-width: 768px)",
        "lg" => "@media (min-width: 1024px)",
        "xl" => "@media (min-width: 1280px)",
        "2xl" => "@media (min-width: 1536px)",
        // Color scheme
        "dark" => "@media (prefers-color-scheme: dark)",
        "light" => "@media (prefers-color-scheme: light)",
        // Motion
        "motion-safe" => "@media (prefers-reduced-motion: no-preference)",
        "motion-reduce" => "@media (prefers-reduced-motion: reduce)",
        // Print
        "print" => "@media print",
        _ => "",
    }
}

/// Core mapping: Tailwind class → CSS declaration(s).
/// Covers the most common utility classes used in practice.
/// Resolve Tailwind color scale classes → CSS color property.
/// Covers all standard Tailwind colors with shades 50–950.
fn resolve_color_class(class: &str) -> Option<String> {
    // Map color names to their hex palette (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950)
    let (prop, rest) = if class.starts_with("bg-") {
        ("background-color", &class[3..])
    } else if class.starts_with("text-") {
        ("color", &class[5..])
    } else if class.starts_with("border-") {
        ("border-color", &class[7..])
    } else if class.starts_with("ring-") {
        ("--tw-ring-color", &class[5..])
    } else if class.starts_with("fill-") {
        ("fill", &class[5..])
    } else if class.starts_with("stroke-") {
        ("stroke", &class[7..])
    } else if class.starts_with("accent-") {
        ("accent-color", &class[7..])
    } else if class.starts_with("caret-") {
        ("caret-color", &class[6..])
    } else if class.starts_with("outline-") {
        ("outline-color", &class[8..])
    } else if class.starts_with("shadow-")
        && !["sm", "md", "lg", "xl", "2xl", "none", "inner"].contains(&class[7..].trim())
    {
        ("--tw-shadow-color", &class[7..])
    } else {
        return None;
    };

    // Named colors without shade
    let hex = match rest {
        "white" => return Some(format!("{}: rgb(255 255 255)", prop)),
        "black" => return Some(format!("{}: rgb(0 0 0)", prop)),
        "transparent" => return Some(format!("{}: transparent", prop)),
        "current" => return Some(format!("{}: currentColor", prop)),
        "inherit" => return Some(format!("{}: inherit", prop)),
        _ => {
            /* fall through to shade parsing */
            ""
        }
    };
    let _ = hex;

    // Parse color-shade: e.g. "blue-600", "red-50", "zinc-950"
    let dash_pos = rest.rfind('-')?;
    let color_name = &rest[..dash_pos];
    let shade_str = &rest[dash_pos + 1..];
    let shade: usize = shade_str.parse().ok()?;

    // Tailwind v4 color palette (11 shades: 50,100,200,300,400,500,600,700,800,900,950)
    let palette: &[&str] = match color_name {
        "slate" => &[
            "f8fafc", "f1f5f9", "e2e8f0", "cbd5e1", "94a3b8", "64748b", "475569", "334155",
            "1e293b", "0f172a", "020617",
        ],
        "gray" => &[
            "f9fafb", "f3f4f6", "e5e7eb", "d1d5db", "9ca3af", "6b7280", "4b5563", "374151",
            "1f2937", "111827", "030712",
        ],
        "zinc" => &[
            "fafafa", "f4f4f5", "e4e4e7", "d4d4d8", "a1a1aa", "71717a", "52525b", "3f3f46",
            "27272a", "18181b", "09090b",
        ],
        "neutral" => &[
            "fafafa", "f5f5f5", "e5e5e5", "d4d4d4", "a3a3a3", "737373", "525252", "404040",
            "262626", "171717", "0a0a0a",
        ],
        "stone" => &[
            "fafaf9", "f5f5f4", "e7e5e4", "d6d3d1", "a8a29e", "78716c", "57534e", "44403c",
            "292524", "1c1917", "0c0a09",
        ],
        "red" => &[
            "fef2f2", "fee2e2", "fecaca", "fca5a5", "f87171", "ef4444", "dc2626", "b91c1c",
            "991b1b", "7f1d1d", "450a0a",
        ],
        "orange" => &[
            "fff7ed", "ffedd5", "fed7aa", "fdba74", "fb923c", "f97316", "ea580c", "c2410c",
            "9a3412", "7c2d12", "431407",
        ],
        "amber" => &[
            "fffbeb", "fef3c7", "fde68a", "fcd34d", "fbbf24", "f59e0b", "d97706", "b45309",
            "92400e", "78350f", "451a03",
        ],
        "yellow" => &[
            "fefce8", "fef9c3", "fef08a", "fde047", "facc15", "eab308", "ca8a04", "a16207",
            "854d0e", "713f12", "422006",
        ],
        "lime" => &[
            "f7fee7", "ecfccb", "d9f99d", "bef264", "a3e635", "84cc16", "65a30d", "4d7c0f",
            "3f6212", "365314", "1a2e05",
        ],
        "green" => &[
            "f0fdf4", "dcfce7", "bbf7d0", "86efac", "4ade80", "22c55e", "16a34a", "15803d",
            "166534", "14532d", "052e16",
        ],
        "emerald" => &[
            "ecfdf5", "d1fae5", "a7f3d0", "6ee7b7", "34d399", "10b981", "059669", "047857",
            "065f46", "064e3b", "022c22",
        ],
        "teal" => &[
            "f0fdfa", "ccfbf1", "99f6e4", "5eead4", "2dd4bf", "14b8a6", "0d9488", "0f766e",
            "115e59", "134e4a", "042f2e",
        ],
        "cyan" => &[
            "ecfeff", "cffafe", "a5f3fc", "67e8f9", "22d3ee", "06b6d4", "0891b2", "0e7490",
            "155e75", "164e63", "083344",
        ],
        "sky" => &[
            "f0f9ff", "e0f2fe", "bae6fd", "7dd3fc", "38bdf8", "0ea5e9", "0284c7", "0369a1",
            "075985", "0c4a6e", "082f49",
        ],
        "blue" => &[
            "eff6ff", "dbeafe", "bfdbfe", "93c5fd", "60a5fa", "3b82f6", "2563eb", "1d4ed8",
            "1e40af", "1e3a8a", "172554",
        ],
        "indigo" => &[
            "eef2ff", "e0e7ff", "c7d2fe", "a5b4fc", "818cf8", "6366f1", "4f46e5", "4338ca",
            "3730a3", "312e81", "1e1b4b",
        ],
        "violet" => &[
            "f5f3ff", "ede9fe", "ddd6fe", "c4b5fd", "a78bfa", "8b5cf6", "7c3aed", "6d28d9",
            "5b21b6", "4c1d95", "2e1065",
        ],
        "purple" => &[
            "faf5ff", "f3e8ff", "e9d5ff", "d8b4fe", "c084fc", "a855f7", "9333ea", "7e22ce",
            "6b21a8", "581c87", "3b0764",
        ],
        "fuchsia" => &[
            "fdf4ff", "fae8ff", "f5d0fe", "f0abfc", "e879f9", "d946ef", "c026d3", "a21caf",
            "86198f", "701a75", "4a044e",
        ],
        "pink" => &[
            "fdf2f8", "fce7f3", "fbcfe8", "f9a8d4", "f472b6", "ec4899", "db2777", "be185d",
            "9d174d", "831843", "500724",
        ],
        "rose" => &[
            "fff1f2", "ffe4e6", "fecdd3", "fda4af", "fb7185", "f43f5e", "e11d48", "be123c",
            "9f1239", "881337", "4c0519",
        ],
        _ => return None,
    };

    let shade_idx = match shade {
        50 => 0,
        100 => 1,
        200 => 2,
        300 => 3,
        400 => 4,
        500 => 5,
        600 => 6,
        700 => 7,
        800 => 8,
        900 => 9,
        950 => 10,
        _ => return None,
    };

    let hex = palette.get(shade_idx)?;
    let r = u8::from_str_radix(&hex[0..2], 16).ok()?;
    let g = u8::from_str_radix(&hex[2..4], 16).ok()?;
    let b = u8::from_str_radix(&hex[4..6], 16).ok()?;

    Some(format!("{}: rgb({} {} {})", prop, r, g, b))
}

/// Resolve Tailwind spacing classes with decimal v4 values.
/// Covers w-{n}, h-{n}, p-{n}, m-{n}, gap-{n} etc. for non-integer steps.
fn resolve_spacing_class(class: &str) -> Option<String> {
    // Only handle cases not already in the static match table
    // Tailwind spacing scale: 1 unit = 0.25rem
    let (prop, rest) = if class.starts_with("w-") {
        ("width", &class[2..])
    } else if class.starts_with("h-") {
        ("height", &class[2..])
    } else if class.starts_with("min-h-") {
        ("min-height", &class[6..])
    } else if class.starts_with("max-h-") {
        ("max-height", &class[6..])
    } else if class.starts_with("min-w-") {
        ("min-width", &class[6..])
    } else if class.starts_with("max-w-") {
        ("max-width", &class[6..])
    } else if class.starts_with("p-") {
        ("padding", &class[2..])
    } else if class.starts_with("m-") {
        ("margin", &class[2..])
    } else if class.starts_with("gap-") {
        ("gap", &class[4..])
    } else if class.starts_with("top-") {
        ("top", &class[4..])
    } else if class.starts_with("bottom-") {
        ("bottom", &class[7..])
    } else if class.starts_with("left-") {
        ("left", &class[5..])
    } else if class.starts_with("right-") {
        ("right", &class[6..])
    } else if class.starts_with("inset-") {
        ("inset", &class[6..])
    } else if class.starts_with("translate-x-") {
        return resolve_transform("translateX", &class[12..]);
    } else if class.starts_with("translate-y-") {
        return resolve_transform("translateY", &class[12..]);
    } else if class.starts_with("scale-") {
        return resolve_transform("scale", &class[6..]);
    } else if class.starts_with("rotate-") {
        return resolve_rotate(&class[7..]);
    } else {
        return None;
    };

    // Parse numeric value (integer or decimal like 0.5, 1.5, 2.5)
    let n: f64 = rest.replace('.', ".").parse().ok()?;
    // Tailwind: 1 unit = 0.25rem (except for fractional like 1/2, 1/3)
    if rest.contains('/') {
        // Fractional: 1/2, 1/3, 2/3 etc.
        let parts: Vec<&str> = rest.split('/').collect();
        if parts.len() == 2 {
            let num: f64 = parts[0].parse().ok()?;
            let den: f64 = parts[1].parse().ok()?;
            if den == 0.0 {
                return None;
            }
            let pct = (num / den * 100.0) as u32;
            return Some(format!("{}: {}%", prop, pct));
        }
        return None;
    }
    let rem = n * 0.25;
    Some(format!("{}: {}rem", prop, rem))
}

fn resolve_transform(func: &str, val: &str) -> Option<String> {
    let n: f64 = val.parse().ok()?;
    let rem = n * 0.25;
    Some(format!("transform: {}({}rem)", func, rem))
}

fn resolve_rotate(val: &str) -> Option<String> {
    let n: f64 = val.parse().ok()?;
    Some(format!("transform: rotate({}deg)", n))
}

pub(crate) fn tw_class_to_css(class: &str) -> Option<String> {
    // Handle arbitrary values: bg-[#ff0000], p-[1.5rem], etc.
    if class.contains('[') && class.contains(']') {
        return tw_arbitrary_to_css(class);
    }

    // Strip ALL variant prefixes (handles hover:, sm:, dark:hover:, etc.)
    let mut base = class;
    while base.contains(':') {
        base = base.splitn(2, ':').nth(1).unwrap_or(base);
    }

    // ── Pattern-based color resolver ──────────────────────────────────────────
    if let Some(css) = resolve_color_class(base) {
        return Some(css);
    }

    // ── Pattern-based spacing resolver ────────────────────────────────────────
    if let Some(css) = resolve_spacing_class(base) {
        return Some(css);
    }

    let css = match base {
        // ── Display ──────────────────────────────────────────────────────────
        "block"        => "display: block",
        "inline-block" => "display: inline-block",
        "inline"       => "display: inline",
        "flex"         => "display: flex",
        "inline-flex"  => "display: inline-flex",
        "grid"         => "display: grid",
        "inline-grid"  => "display: inline-grid",
        "hidden"       => "display: none",
        "contents"     => "display: contents",
        "table"        => "display: table",
        "table-cell"   => "display: table-cell",

        // ── Position ─────────────────────────────────────────────────────────
        "static"   => "position: static",
        "fixed"    => "position: fixed",
        "absolute" => "position: absolute",
        "relative" => "position: relative",
        "sticky"   => "position: sticky",

        // ── Flex ─────────────────────────────────────────────────────────────
        "flex-row"         => "flex-direction: row",
        "flex-col"         => "flex-direction: column",
        "flex-row-reverse" => "flex-direction: row-reverse",
        "flex-col-reverse" => "flex-direction: column-reverse",
        "flex-wrap"        => "flex-wrap: wrap",
        "flex-nowrap"      => "flex-wrap: nowrap",
        "flex-1"           => "flex: 1 1 0%",
        "flex-auto"        => "flex: 1 1 auto",
        "flex-none"        => "flex: none",
        "flex-grow"        => "flex-grow: 1",
        "flex-shrink"      => "flex-shrink: 1",
        "flex-shrink-0"    => "flex-shrink: 0",
        "flex-grow-0"      => "flex-grow: 0",

        // ── Alignment ─────────────────────────────────────────────────────────
        "items-start"    => "align-items: flex-start",
        "items-end"      => "align-items: flex-end",
        "items-center"   => "align-items: center",
        "items-baseline" => "align-items: baseline",
        "items-stretch"  => "align-items: stretch",
        "justify-start"  => "justify-content: flex-start",
        "justify-end"    => "justify-content: flex-end",
        "justify-center" => "justify-content: center",
        "justify-between"=> "justify-content: space-between",
        "justify-around" => "justify-content: space-around",
        "justify-evenly" => "justify-content: space-evenly",
        "self-auto"      => "align-self: auto",
        "self-start"     => "align-self: flex-start",
        "self-end"       => "align-self: flex-end",
        "self-center"    => "align-self: center",
        "self-stretch"   => "align-self: stretch",

        // ── Overflow ──────────────────────────────────────────────────────────
        "overflow-auto"    => "overflow: auto",
        "overflow-hidden"  => "overflow: hidden",
        "overflow-visible" => "overflow: visible",
        "overflow-scroll"  => "overflow: scroll",
        "overflow-x-auto"  => "overflow-x: auto",
        "overflow-y-auto"  => "overflow-y: auto",
        "overflow-x-hidden"=> "overflow-x: hidden",
        "overflow-y-hidden"=> "overflow-y: hidden",
        "truncate"         => "overflow: hidden; text-overflow: ellipsis; white-space: nowrap",

        // ── Width/Height ─────────────────────────────────────────────────────
        "w-full"    => "width: 100%",
        "w-screen"  => "width: 100vw",
        "w-auto"    => "width: auto",
        "w-0"       => "width: 0px",
        "w-px"      => "width: 1px",
        "w-1"       => "width: 0.25rem",
        "w-2"       => "width: 0.5rem",
        "w-3"       => "width: 0.75rem",
        "w-4"       => "width: 1rem",
        "w-5"       => "width: 1.25rem",
        "w-6"       => "width: 1.5rem",
        "w-8"       => "width: 2rem",
        "w-10"      => "width: 2.5rem",
        "w-12"      => "width: 3rem",
        "w-16"      => "width: 4rem",
        "w-20"      => "width: 5rem",
        "w-24"      => "width: 6rem",
        "w-32"      => "width: 8rem",
        "w-40"      => "width: 10rem",
        "w-48"      => "width: 12rem",
        "w-56"      => "width: 14rem",
        "w-64"      => "width: 16rem",
        "h-full"    => "height: 100%",
        "h-screen"  => "height: 100vh",
        "h-auto"    => "height: auto",
        "h-0"       => "height: 0px",
        "h-px"      => "height: 1px",
        "h-1"       => "height: 0.25rem",
        "h-2"       => "height: 0.5rem",
        "h-3"       => "height: 0.75rem",
        "h-4"       => "height: 1rem",
        "h-5"       => "height: 1.25rem",
        "h-6"       => "height: 1.5rem",
        "h-8"       => "height: 2rem",
        "h-10"      => "height: 2.5rem",
        "h-12"      => "height: 3rem",
        "h-16"      => "height: 4rem",
        "min-w-0"   => "min-width: 0px",
        "min-w-full"=> "min-width: 100%",
        "max-w-sm"  => "max-width: 24rem",
        "max-w-md"  => "max-width: 28rem",
        "max-w-lg"  => "max-width: 32rem",
        "max-w-xl"  => "max-width: 36rem",
        "max-w-2xl" => "max-width: 42rem",
        "max-w-full"=> "max-width: 100%",
        "max-w-none"=> "max-width: none",

        // ── Padding ───────────────────────────────────────────────────────────
        "p-0"  => "padding: 0px",
        "p-px" => "padding: 1px",
        "p-1"  => "padding: 0.25rem",
        "p-2"  => "padding: 0.5rem",
        "p-3"  => "padding: 0.75rem",
        "p-4"  => "padding: 1rem",
        "p-5"  => "padding: 1.25rem",
        "p-6"  => "padding: 1.5rem",
        "p-8"  => "padding: 2rem",
        "p-10" => "padding: 2.5rem",
        "p-12" => "padding: 3rem",
        "p-16" => "padding: 4rem",
        "px-0" => "padding-left: 0px; padding-right: 0px",
        "px-1" => "padding-left: 0.25rem; padding-right: 0.25rem",
        "px-2" => "padding-left: 0.5rem; padding-right: 0.5rem",
        "px-3" => "padding-left: 0.75rem; padding-right: 0.75rem",
        "px-4" => "padding-left: 1rem; padding-right: 1rem",
        "px-5" => "padding-left: 1.25rem; padding-right: 1.25rem",
        "px-6" => "padding-left: 1.5rem; padding-right: 1.5rem",
        "px-8" => "padding-left: 2rem; padding-right: 2rem",
        "py-0" => "padding-top: 0px; padding-bottom: 0px",
        "py-1" => "padding-top: 0.25rem; padding-bottom: 0.25rem",
        "py-2" => "padding-top: 0.5rem; padding-bottom: 0.5rem",
        "py-3" => "padding-top: 0.75rem; padding-bottom: 0.75rem",
        "py-4" => "padding-top: 1rem; padding-bottom: 1rem",
        "py-5" => "padding-top: 1.25rem; padding-bottom: 1.25rem",
        "py-6" => "padding-top: 1.5rem; padding-bottom: 1.5rem",
        "py-8" => "padding-top: 2rem; padding-bottom: 2rem",
        "pt-0" => "padding-top: 0px",
        "pt-1" => "padding-top: 0.25rem",
        "pt-2" => "padding-top: 0.5rem",
        "pt-4" => "padding-top: 1rem",
        "pt-6" => "padding-top: 1.5rem",
        "pt-8" => "padding-top: 2rem",
        "pb-0" => "padding-bottom: 0px",
        "pb-1" => "padding-bottom: 0.25rem",
        "pb-2" => "padding-bottom: 0.5rem",
        "pb-4" => "padding-bottom: 1rem",
        "pb-6" => "padding-bottom: 1.5rem",
        "pb-8" => "padding-bottom: 2rem",
        "pl-0" => "padding-left: 0px",
        "pl-1" => "padding-left: 0.25rem",
        "pl-2" => "padding-left: 0.5rem",
        "pl-4" => "padding-left: 1rem",
        "pr-0" => "padding-right: 0px",
        "pr-1" => "padding-right: 0.25rem",
        "pr-2" => "padding-right: 0.5rem",
        "pr-4" => "padding-right: 1rem",

        // ── Margin ────────────────────────────────────────────────────────────
        "m-0"    => "margin: 0px",
        "m-auto" => "margin: auto",
        "m-1"    => "margin: 0.25rem",
        "m-2"    => "margin: 0.5rem",
        "m-4"    => "margin: 1rem",
        "m-6"    => "margin: 1.5rem",
        "m-8"    => "margin: 2rem",
        "mx-auto"=> "margin-left: auto; margin-right: auto",
        "mx-0"   => "margin-left: 0px; margin-right: 0px",
        "mx-1"   => "margin-left: 0.25rem; margin-right: 0.25rem",
        "mx-2"   => "margin-left: 0.5rem; margin-right: 0.5rem",
        "mx-4"   => "margin-left: 1rem; margin-right: 1rem",
        "my-0"   => "margin-top: 0px; margin-bottom: 0px",
        "my-1"   => "margin-top: 0.25rem; margin-bottom: 0.25rem",
        "my-2"   => "margin-top: 0.5rem; margin-bottom: 0.5rem",
        "my-4"   => "margin-top: 1rem; margin-bottom: 1rem",
        "my-6"   => "margin-top: 1.5rem; margin-bottom: 1.5rem",
        "my-8"   => "margin-top: 2rem; margin-bottom: 2rem",
        "mt-0"   => "margin-top: 0px",
        "mt-1"   => "margin-top: 0.25rem",
        "mt-2"   => "margin-top: 0.5rem",
        "mt-4"   => "margin-top: 1rem",
        "mt-6"   => "margin-top: 1.5rem",
        "mt-8"   => "margin-top: 2rem",
        "mb-0"   => "margin-bottom: 0px",
        "mb-1"   => "margin-bottom: 0.25rem",
        "mb-2"   => "margin-bottom: 0.5rem",
        "mb-4"   => "margin-bottom: 1rem",
        "mb-6"   => "margin-bottom: 1.5rem",
        "mb-8"   => "margin-bottom: 2rem",
        "ml-0"   => "margin-left: 0px",
        "ml-1"   => "margin-left: 0.25rem",
        "ml-2"   => "margin-left: 0.5rem",
        "ml-4"   => "margin-left: 1rem",
        "ml-auto"=> "margin-left: auto",
        "mr-0"   => "margin-right: 0px",
        "mr-1"   => "margin-right: 0.25rem",
        "mr-2"   => "margin-right: 0.5rem",
        "mr-4"   => "margin-right: 1rem",
        "mr-auto"=> "margin-right: auto",

        // ── Gap ───────────────────────────────────────────────────────────────
        "gap-0"  => "gap: 0px",
        "gap-1"  => "gap: 0.25rem",
        "gap-2"  => "gap: 0.5rem",
        "gap-3"  => "gap: 0.75rem",
        "gap-4"  => "gap: 1rem",
        "gap-6"  => "gap: 1.5rem",
        "gap-8"  => "gap: 2rem",
        "gap-x-1"=> "column-gap: 0.25rem",
        "gap-x-2"=> "column-gap: 0.5rem",
        "gap-x-4"=> "column-gap: 1rem",
        "gap-y-1"=> "row-gap: 0.25rem",
        "gap-y-2"=> "row-gap: 0.5rem",
        "gap-y-4"=> "row-gap: 1rem",

        // ── Typography ────────────────────────────────────────────────────────
        "text-xs"    => "font-size: 0.75rem; line-height: 1rem",
        "text-sm"    => "font-size: 0.875rem; line-height: 1.25rem",
        "text-base"  => "font-size: 1rem; line-height: 1.5rem",
        "text-lg"    => "font-size: 1.125rem; line-height: 1.75rem",
        "text-xl"    => "font-size: 1.25rem; line-height: 1.75rem",
        "text-2xl"   => "font-size: 1.5rem; line-height: 2rem",
        "text-3xl"   => "font-size: 1.875rem; line-height: 2.25rem",
        "text-4xl"   => "font-size: 2.25rem; line-height: 2.5rem",
        "font-thin"      => "font-weight: 100",
        "font-light"     => "font-weight: 300",
        "font-normal"    => "font-weight: 400",
        "font-medium"    => "font-weight: 500",
        "font-semibold"  => "font-weight: 600",
        "font-bold"      => "font-weight: 700",
        "font-extrabold" => "font-weight: 800",
        "font-black"     => "font-weight: 900",
        "italic"         => "font-style: italic",
        "not-italic"     => "font-style: normal",
        "underline"      => "text-decoration-line: underline",
        "no-underline"   => "text-decoration-line: none",
        "line-through"   => "text-decoration-line: line-through",
        "uppercase"      => "text-transform: uppercase",
        "lowercase"      => "text-transform: lowercase",
        "capitalize"     => "text-transform: capitalize",
        "normal-case"    => "text-transform: none",
        "text-left"      => "text-align: left",
        "text-center"    => "text-align: center",
        "text-right"     => "text-align: right",
        "text-justify"   => "text-align: justify",
        "leading-none"   => "line-height: 1",
        "leading-tight"  => "line-height: 1.25",
        "leading-snug"   => "line-height: 1.375",
        "leading-normal" => "line-height: 1.5",
        "leading-relaxed"=> "line-height: 1.625",
        "leading-loose"  => "line-height: 2",
        "tracking-tight" => "letter-spacing: -0.05em",
        "tracking-normal"=> "letter-spacing: 0em",
        "tracking-wide"  => "letter-spacing: 0.05em",
        "tracking-wider" => "letter-spacing: 0.1em",
        "whitespace-normal"  => "white-space: normal",
        "whitespace-nowrap"  => "white-space: nowrap",
        "whitespace-pre"     => "white-space: pre",
        "whitespace-pre-wrap"=> "white-space: pre-wrap",
        "break-words"    => "overflow-wrap: break-word",
        "break-all"      => "word-break: break-all",

        // ── Border ────────────────────────────────────────────────────────────
        "rounded-none" => "border-radius: 0px",
        "rounded-sm"   => "border-radius: 0.125rem",
        "rounded"      => "border-radius: 0.25rem",
        "rounded-md"   => "border-radius: 0.375rem",
        "rounded-lg"   => "border-radius: 0.5rem",
        "rounded-xl"   => "border-radius: 0.75rem",
        "rounded-2xl"  => "border-radius: 1rem",
        "rounded-3xl"  => "border-radius: 1.5rem",
        "rounded-full" => "border-radius: 9999px",
        "rounded-t-lg" => "border-top-left-radius: 0.5rem; border-top-right-radius: 0.5rem",
        "rounded-b-lg" => "border-bottom-left-radius: 0.5rem; border-bottom-right-radius: 0.5rem",
        "border-0"     => "border-width: 0px",
        "border"       => "border-width: 1px",
        "border-2"     => "border-width: 2px",
        "border-4"     => "border-width: 4px",
        "border-t"     => "border-top-width: 1px",
        "border-b"     => "border-bottom-width: 1px",
        "border-l"     => "border-left-width: 1px",
        "border-r"     => "border-right-width: 1px",
        "border-solid"   => "border-style: solid",
        "border-dashed"  => "border-style: dashed",
        "border-dotted"  => "border-style: dotted",
        "border-none"    => "border-style: none",

        // ── Shadow ────────────────────────────────────────────────────────────
        "shadow-none" => "box-shadow: none",
        "shadow-sm"   => "box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "shadow"      => "box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "shadow-md"   => "box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "shadow-lg"   => "box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "shadow-xl"   => "box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "shadow-2xl"  => "box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25)",

        // ── Cursor / Pointer ──────────────────────────────────────────────────
        "cursor-auto"    => "cursor: auto",
        "cursor-default" => "cursor: default",
        "cursor-pointer" => "cursor: pointer",
        "cursor-wait"    => "cursor: wait",
        "cursor-not-allowed" => "cursor: not-allowed",
        "select-none"    => "user-select: none",
        "select-text"    => "user-select: text",
        "select-all"     => "user-select: all",
        "pointer-events-none" => "pointer-events: none",
        "pointer-events-auto" => "pointer-events: auto",

        // ── Opacity / Visibility ──────────────────────────────────────────────
        "opacity-0"   => "opacity: 0",
        "opacity-25"  => "opacity: 0.25",
        "opacity-50"  => "opacity: 0.5",
        "opacity-75"  => "opacity: 0.75",
        "opacity-100" => "opacity: 1",
        "visible"     => "visibility: visible",
        "invisible"   => "visibility: hidden",

        // ── Z-index ───────────────────────────────────────────────────────────
        "z-0"    => "z-index: 0",
        "z-10"   => "z-index: 10",
        "z-20"   => "z-index: 20",
        "z-30"   => "z-index: 30",
        "z-40"   => "z-index: 40",
        "z-50"   => "z-index: 50",
        "z-auto" => "z-index: auto",

        // ── Transition ────────────────────────────────────────────────────────
        "transition"        => "transition-property: color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter; transition-timing-function: cubic-bezier(0.4,0,0.2,1); transition-duration: 150ms",
        "transition-none"   => "transition-property: none",
        "transition-colors" => "transition-property: color,background-color,border-color; transition-timing-function: cubic-bezier(0.4,0,0.2,1); transition-duration: 150ms",
        "transition-opacity"=> "transition-property: opacity; transition-timing-function: cubic-bezier(0.4,0,0.2,1); transition-duration: 150ms",
        "duration-75"  => "transition-duration: 75ms",
        "duration-100" => "transition-duration: 100ms",
        "duration-150" => "transition-duration: 150ms",
        "duration-200" => "transition-duration: 200ms",
        "duration-300" => "transition-duration: 300ms",
        "duration-500" => "transition-duration: 500ms",
        "ease-linear"  => "transition-timing-function: linear",
        "ease-in"      => "transition-timing-function: cubic-bezier(0.4,0,1,1)",
        "ease-out"     => "transition-timing-function: cubic-bezier(0,0,0.2,1)",
        "ease-in-out"  => "transition-timing-function: cubic-bezier(0.4,0,0.2,1)",

        // ── Inset / Position values ───────────────────────────────────────────
        "inset-0"    => "inset: 0px",
        "inset-auto" => "inset: auto",
        "inset-x-0"  => "left: 0px; right: 0px",
        "inset-y-0"  => "top: 0px; bottom: 0px",
        "top-0"      => "top: 0px",
        "top-auto"   => "top: auto",
        "bottom-0"   => "bottom: 0px",
        "bottom-auto"=> "bottom: auto",
        "left-0"     => "left: 0px",
        "left-auto"  => "left: auto",
        "right-0"    => "right: 0px",
        "right-auto" => "right: auto",

        _ => return None,
    };

    Some(css.to_string())
}

/// Handle arbitrary value classes like bg-[#ff0000], p-[1.5rem], w-[200px]
fn tw_arbitrary_to_css(class: &str) -> Option<String> {
    // Extract: prefix-[value] or prefix:-[value] (with variant)
    let base = if class.contains(':') {
        class.splitn(2, ':').nth(1).unwrap_or(class)
    } else {
        class
    };

    let bracket_start = base.find('[')?;
    let bracket_end = base.rfind(']')?;
    let prefix = &base[..bracket_start];
    let value = &base[bracket_start + 1..bracket_end];

    let css = match prefix {
        "bg-"           => format!("background-color: {}", value),
        "text-"         => format!("color: {}", value),
        "border-"       => format!("border-color: {}", value),
        "p-"            => format!("padding: {}", value),
        "px-"           => format!("padding-left: {}; padding-right: {}", value, value),
        "py-"           => format!("padding-top: {}; padding-bottom: {}", value, value),
        "m-"            => format!("margin: {}", value),
        "mx-"           => format!("margin-left: {}; margin-right: {}", value, value),
        "my-"           => format!("margin-top: {}; margin-bottom: {}", value, value),
        "w-"            => format!("width: {}", value),
        "h-"            => format!("height: {}", value),
        "max-w-"        => format!("max-width: {}", value),
        "min-w-"        => format!("min-width: {}", value),
        "max-h-"        => format!("max-height: {}", value),
        "min-h-"        => format!("min-height: {}", value),
        "top-"          => format!("top: {}", value),
        "bottom-"       => format!("bottom: {}", value),
        "left-"         => format!("left: {}", value),
        "right-"        => format!("right: {}", value),
        "gap-"          => format!("gap: {}", value),
        "rounded-"      => format!("border-radius: {}", value),
        "z-"            => format!("z-index: {}", value),
        "opacity-"      => format!("opacity: {}", value),
        "font-"         => format!("font-weight: {}", value),
        "leading-"      => format!("line-height: {}", value),
        "tracking-"     => format!("letter-spacing: {}", value),
        "duration-"     => format!("transition-duration: {}ms", value),
        "delay-"        => format!("transition-delay: {}ms", value),
        "translate-x-"  => format!("transform: translateX({})", value),
        "translate-y-"  => format!("transform: translateY({})", value),
        "scale-"        => format!("transform: scale({})", value),
        "rotate-"       => format!("transform: rotate({})", value),
        "skew-x-"       => format!("transform: skewX({})", value),
        "skew-y-"       => format!("transform: skewY({})", value),
        "blur-"         => format!("filter: blur({})", value),
        "brightness-"   => format!("filter: brightness({})", value),
        "contrast-"     => format!("filter: contrast({})", value),
        "grid-cols-"    => format!("grid-template-columns: repeat({}, minmax(0, 1fr))", value),
        "col-span-"     => format!("grid-column: span {} / span {}", value, value),
        "row-span-"     => format!("grid-row: span {} / span {}", value, value),
        "line-clamp-"   => format!("-webkit-line-clamp: {}; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden", value),
        _               => return None,
    };

    Some(css)
}

// ─────────────────────────────────────────────────────────────────────────────
