//! Tailwind CSS v4 default theme constants

use crate::domain::theme_config::{ThemeConfig, ThemeValue};
use lazy_static::lazy_static;
use std::collections::HashMap;

lazy_static! {
    /// Default Tailwind v4 color palette
    pub static ref DEFAULT_COLORS: HashMap<String, String> = {
        let mut colors = HashMap::new();
        
        // Slate
        colors.insert("slate-50".to_string(), "#f8fafc".to_string());
        colors.insert("slate-100".to_string(), "#f1f5f9".to_string());
        colors.insert("slate-200".to_string(), "#e2e8f0".to_string());
        colors.insert("slate-300".to_string(), "#cbd5e1".to_string());
        colors.insert("slate-400".to_string(), "#94a3b8".to_string());
        colors.insert("slate-500".to_string(), "#64748b".to_string());
        colors.insert("slate-600".to_string(), "#475569".to_string());
        colors.insert("slate-700".to_string(), "#334155".to_string());
        colors.insert("slate-800".to_string(), "#1e293b".to_string());
        colors.insert("slate-900".to_string(), "#0f172a".to_string());
        
        // Gray
        colors.insert("gray-50".to_string(), "#f9fafb".to_string());
        colors.insert("gray-100".to_string(), "#f3f4f6".to_string());
        colors.insert("gray-200".to_string(), "#e5e7eb".to_string());
        colors.insert("gray-300".to_string(), "#d1d5db".to_string());
        colors.insert("gray-400".to_string(), "#9ca3af".to_string());
        colors.insert("gray-500".to_string(), "#6b7280".to_string());
        colors.insert("gray-600".to_string(), "#4b5563".to_string());
        colors.insert("gray-700".to_string(), "#374151".to_string());
        colors.insert("gray-800".to_string(), "#1f2937".to_string());
        colors.insert("gray-900".to_string(), "#111827".to_string());
        
        // Red
        colors.insert("red-50".to_string(), "#fef2f2".to_string());
        colors.insert("red-100".to_string(), "#fee2e2".to_string());
        colors.insert("red-200".to_string(), "#fecaca".to_string());
        colors.insert("red-300".to_string(), "#fca5a5".to_string());
        colors.insert("red-400".to_string(), "#f87171".to_string());
        colors.insert("red-500".to_string(), "#ef4444".to_string());
        colors.insert("red-600".to_string(), "#dc2626".to_string());
        colors.insert("red-700".to_string(), "#b91c1c".to_string());
        colors.insert("red-800".to_string(), "#991b1b".to_string());
        colors.insert("red-900".to_string(), "#7f1d1d".to_string());
        
        // Orange
        colors.insert("orange-50".to_string(), "#fff7ed".to_string());
        colors.insert("orange-100".to_string(), "#ffedd5".to_string());
        colors.insert("orange-200".to_string(), "#fed7aa".to_string());
        colors.insert("orange-300".to_string(), "#fdba74".to_string());
        colors.insert("orange-400".to_string(), "#fb923c".to_string());
        colors.insert("orange-500".to_string(), "#f97316".to_string());
        colors.insert("orange-600".to_string(), "#ea580c".to_string());
        colors.insert("orange-700".to_string(), "#c2410c".to_string());
        colors.insert("orange-800".to_string(), "#9a3412".to_string());
        colors.insert("orange-900".to_string(), "#7c2d12".to_string());
        
        // Amber
        colors.insert("amber-50".to_string(), "#fffbeb".to_string());
        colors.insert("amber-100".to_string(), "#fef3c7".to_string());
        colors.insert("amber-200".to_string(), "#fde68a".to_string());
        colors.insert("amber-300".to_string(), "#fcd34d".to_string());
        colors.insert("amber-400".to_string(), "#fbbf24".to_string());
        colors.insert("amber-500".to_string(), "#f59e0b".to_string());
        colors.insert("amber-600".to_string(), "#d97706".to_string());
        colors.insert("amber-700".to_string(), "#b45309".to_string());
        colors.insert("amber-800".to_string(), "#92400e".to_string());
        colors.insert("amber-900".to_string(), "#78350f".to_string());
        
        // Yellow (fixed - different from Amber)
        colors.insert("yellow-50".to_string(), "#fefce8".to_string());
        colors.insert("yellow-100".to_string(), "#fef3c7".to_string());
        colors.insert("yellow-200".to_string(), "#fde68a".to_string());
        colors.insert("yellow-300".to_string(), "#fcd34d".to_string());
        colors.insert("yellow-400".to_string(), "#fbbf24".to_string());
        colors.insert("yellow-500".to_string(), "#f59e0b".to_string());
        colors.insert("yellow-600".to_string(), "#ca8a04".to_string());
        colors.insert("yellow-700".to_string(), "#a16207".to_string());
        colors.insert("yellow-800".to_string(), "#854d0e".to_string());
        colors.insert("yellow-900".to_string(), "#713f12".to_string());
        
        // Green
        colors.insert("green-50".to_string(), "#f0fdf4".to_string());
        colors.insert("green-100".to_string(), "#dcfce7".to_string());
        colors.insert("green-200".to_string(), "#bbf7d0".to_string());
        colors.insert("green-300".to_string(), "#86efac".to_string());
        colors.insert("green-400".to_string(), "#4ade80".to_string());
        colors.insert("green-500".to_string(), "#22c55e".to_string());
        colors.insert("green-600".to_string(), "#16a34a".to_string());
        colors.insert("green-700".to_string(), "#15803d".to_string());
        colors.insert("green-800".to_string(), "#166534".to_string());
        colors.insert("green-900".to_string(), "#145231".to_string());
        
        // Blue
        colors.insert("blue-50".to_string(), "#eff6ff".to_string());
        colors.insert("blue-100".to_string(), "#dbeafe".to_string());
        colors.insert("blue-200".to_string(), "#bfdbfe".to_string());
        colors.insert("blue-300".to_string(), "#93c5fd".to_string());
        colors.insert("blue-400".to_string(), "#60a5fa".to_string());
        colors.insert("blue-500".to_string(), "#3b82f6".to_string());
        colors.insert("blue-600".to_string(), "#1e40af".to_string());
        colors.insert("blue-700".to_string(), "#1d4ed8".to_string());
        colors.insert("blue-800".to_string(), "#1e3a8a".to_string());
        colors.insert("blue-900".to_string(), "#172554".to_string());
        
        // Lime
        colors.insert("lime-50".to_string(), "#f7fee7".to_string());
        colors.insert("lime-100".to_string(), "#ecfdf5".to_string());
        colors.insert("lime-200".to_string(), "#d1fae5".to_string());
        colors.insert("lime-300".to_string(), "#a7f3d0".to_string());
        colors.insert("lime-400".to_string(), "#6ee7b7".to_string());
        colors.insert("lime-500".to_string(), "#10b981".to_string());
        colors.insert("lime-600".to_string(), "#65a30d".to_string());
        colors.insert("lime-700".to_string(), "#4b7c0f".to_string());
        colors.insert("lime-800".to_string(), "#3f6212".to_string());
        colors.insert("lime-900".to_string(), "#365314".to_string());
        
        // Emerald
        colors.insert("emerald-50".to_string(), "#f0fdf4".to_string());
        colors.insert("emerald-100".to_string(), "#dcfce7".to_string());
        colors.insert("emerald-200".to_string(), "#bbf7d0".to_string());
        colors.insert("emerald-300".to_string(), "#86efac".to_string());
        colors.insert("emerald-400".to_string(), "#4ade80".to_string());
        colors.insert("emerald-500".to_string(), "#10b981".to_string());
        colors.insert("emerald-600".to_string(), "#059669".to_string());
        colors.insert("emerald-700".to_string(), "#047857".to_string());
        colors.insert("emerald-800".to_string(), "#065f46".to_string());
        colors.insert("emerald-900".to_string(), "#064e3b".to_string());
        
        // Teal
        colors.insert("teal-50".to_string(), "#f0fdfa".to_string());
        colors.insert("teal-100".to_string(), "#ccfbf1".to_string());
        colors.insert("teal-200".to_string(), "#99f6e4".to_string());
        colors.insert("teal-300".to_string(), "#5eead4".to_string());
        colors.insert("teal-400".to_string(), "#2dd4bf".to_string());
        colors.insert("teal-500".to_string(), "#14b8a6".to_string());
        colors.insert("teal-600".to_string(), "#0d9488".to_string());
        colors.insert("teal-700".to_string(), "#0f766e".to_string());
        colors.insert("teal-800".to_string(), "#134e4a".to_string());
        colors.insert("teal-900".to_string(), "#0d3331".to_string());
        
        // Cyan
        colors.insert("cyan-50".to_string(), "#ecf9ff".to_string());
        colors.insert("cyan-100".to_string(), "#cff9fe".to_string());
        colors.insert("cyan-200".to_string(), "#a5f3fc".to_string());
        colors.insert("cyan-300".to_string(), "#67e8f9".to_string());
        colors.insert("cyan-400".to_string(), "#06b6d4".to_string());
        colors.insert("cyan-500".to_string(), "#06b6d4".to_string());
        colors.insert("cyan-600".to_string(), "#0891b2".to_string());
        colors.insert("cyan-700".to_string(), "#0e7490".to_string());
        colors.insert("cyan-800".to_string(), "#155e75".to_string());
        colors.insert("cyan-900".to_string(), "#164e63".to_string());
        
        // Sky
        colors.insert("sky-50".to_string(), "#f0f9ff".to_string());
        colors.insert("sky-100".to_string(), "#e0f2fe".to_string());
        colors.insert("sky-200".to_string(), "#bae6fd".to_string());
        colors.insert("sky-300".to_string(), "#7dd3fc".to_string());
        colors.insert("sky-400".to_string(), "#38bdf8".to_string());
        colors.insert("sky-500".to_string(), "#0ea5e9".to_string());
        colors.insert("sky-600".to_string(), "#0284c7".to_string());
        colors.insert("sky-700".to_string(), "#0369a1".to_string());
        colors.insert("sky-800".to_string(), "#075985".to_string());
        colors.insert("sky-900".to_string(), "#0c4a6e".to_string());
        
        // Indigo
        colors.insert("indigo-50".to_string(), "#eef2ff".to_string());
        colors.insert("indigo-100".to_string(), "#e0e7ff".to_string());
        colors.insert("indigo-200".to_string(), "#c7d2fe".to_string());
        colors.insert("indigo-300".to_string(), "#a5b4fc".to_string());
        colors.insert("indigo-400".to_string(), "#818cf8".to_string());
        colors.insert("indigo-500".to_string(), "#6366f1".to_string());
        colors.insert("indigo-600".to_string(), "#4f46e5".to_string());
        colors.insert("indigo-700".to_string(), "#4338ca".to_string());
        colors.insert("indigo-800".to_string(), "#3730a3".to_string());
        colors.insert("indigo-900".to_string(), "#312e81".to_string());
        
        // Violet
        colors.insert("violet-50".to_string(), "#f5f3ff".to_string());
        colors.insert("violet-100".to_string(), "#ede9fe".to_string());
        colors.insert("violet-200".to_string(), "#ddd6fe".to_string());
        colors.insert("violet-300".to_string(), "#c4b5fd".to_string());
        colors.insert("violet-400".to_string(), "#a78bfa".to_string());
        colors.insert("violet-500".to_string(), "#8b5cf6".to_string());
        colors.insert("violet-600".to_string(), "#7c3aed".to_string());
        colors.insert("violet-700".to_string(), "#6d28d9".to_string());
        colors.insert("violet-800".to_string(), "#5b21b6".to_string());
        colors.insert("violet-900".to_string(), "#4c1d95".to_string());
        
        // Purple
        colors.insert("purple-50".to_string(), "#faf5ff".to_string());
        colors.insert("purple-100".to_string(), "#f3e8ff".to_string());
        colors.insert("purple-200".to_string(), "#e9d5ff".to_string());
        colors.insert("purple-300".to_string(), "#d8b4fe".to_string());
        colors.insert("purple-400".to_string(), "#c084fc".to_string());
        colors.insert("purple-500".to_string(), "#a855f7".to_string());
        colors.insert("purple-600".to_string(), "#9333ea".to_string());
        colors.insert("purple-700".to_string(), "#7e22ce".to_string());
        colors.insert("purple-800".to_string(), "#6b21a8".to_string());
        colors.insert("purple-900".to_string(), "#581c87".to_string());
        
        // Fuchsia
        colors.insert("fuchsia-50".to_string(), "#fdf4ff".to_string());
        colors.insert("fuchsia-100".to_string(), "#fce7f3".to_string());
        colors.insert("fuchsia-200".to_string(), "#fbcfe8".to_string());
        colors.insert("fuchsia-300".to_string(), "#f8b4f6".to_string());
        colors.insert("fuchsia-400".to_string(), "#f472b6".to_string());
        colors.insert("fuchsia-500".to_string(), "#ec4899".to_string());
        colors.insert("fuchsia-600".to_string(), "#d946ef".to_string());
        colors.insert("fuchsia-700".to_string(), "#c026d3".to_string());
        colors.insert("fuchsia-800".to_string(), "#a21caf".to_string());
        colors.insert("fuchsia-900".to_string(), "#831843".to_string());
        
        // Pink
        colors.insert("pink-50".to_string(), "#fdf2f8".to_string());
        colors.insert("pink-100".to_string(), "#fce7f3".to_string());
        colors.insert("pink-200".to_string(), "#fbcfe8".to_string());
        colors.insert("pink-300".to_string(), "#f8b4f6".to_string());
        colors.insert("pink-400".to_string(), "#f472b6".to_string());
        colors.insert("pink-500".to_string(), "#ec4899".to_string());
        colors.insert("pink-600".to_string(), "#ec4899".to_string());
        colors.insert("pink-700".to_string(), "#be185d".to_string());
        colors.insert("pink-800".to_string(), "#9d174d".to_string());
        colors.insert("pink-900".to_string(), "#831843".to_string());
        
        // Rose
        colors.insert("rose-50".to_string(), "#fff5f6".to_string());
        colors.insert("rose-100".to_string(), "#ffe4e6".to_string());
        colors.insert("rose-200".to_string(), "#fecdd3".to_string());
        colors.insert("rose-300".to_string(), "#fbcfe8".to_string());
        colors.insert("rose-400".to_string(), "#f8b4f6".to_string());
        colors.insert("rose-500".to_string(), "#f43f5e".to_string());
        colors.insert("rose-600".to_string(), "#e11d48".to_string());
        colors.insert("rose-700".to_string(), "#be185d".to_string());
        colors.insert("rose-800".to_string(), "#9d174d".to_string());
        colors.insert("rose-900".to_string(), "#831843".to_string());
        
        // Amber
        colors.insert("amber-50".to_string(), "#fffbeb".to_string());
        colors.insert("amber-100".to_string(), "#fef3c7".to_string());
        colors.insert("amber-200".to_string(), "#fde68a".to_string());
        colors.insert("amber-300".to_string(), "#fcd34d".to_string());
        colors.insert("amber-400".to_string(), "#fbbf24".to_string());
        colors.insert("amber-500".to_string(), "#f59e0b".to_string());
        colors.insert("amber-600".to_string(), "#d97706".to_string());
        colors.insert("amber-700".to_string(), "#b45309".to_string());
        colors.insert("amber-800".to_string(), "#92400e".to_string());
        colors.insert("amber-900".to_string(), "#78350f".to_string());
        
        // Zinc
        colors.insert("zinc-50".to_string(), "#fafafa".to_string());
        colors.insert("zinc-100".to_string(), "#f4f4f5".to_string());
        colors.insert("zinc-200".to_string(), "#e4e4e7".to_string());
        colors.insert("zinc-300".to_string(), "#d4d4d8".to_string());
        colors.insert("zinc-400".to_string(), "#a1a1a6".to_string());
        colors.insert("zinc-500".to_string(), "#71717a".to_string());
        colors.insert("zinc-600".to_string(), "#52525b".to_string());
        colors.insert("zinc-700".to_string(), "#3f3f46".to_string());
        colors.insert("zinc-800".to_string(), "#27272a".to_string());
        colors.insert("zinc-900".to_string(), "#18181b".to_string());
        
        // Stone
        colors.insert("stone-50".to_string(), "#fafaf9".to_string());
        colors.insert("stone-100".to_string(), "#f5f5f4".to_string());
        colors.insert("stone-200".to_string(), "#e7e5e4".to_string());
        colors.insert("stone-300".to_string(), "#d6d3d1".to_string());
        colors.insert("stone-400".to_string(), "#a8a29e".to_string());
        colors.insert("stone-500".to_string(), "#78716c".to_string());
        colors.insert("stone-600".to_string(), "#57534e".to_string());
        colors.insert("stone-700".to_string(), "#44403c".to_string());
        colors.insert("stone-800".to_string(), "#292524".to_string());
        colors.insert("stone-900".to_string(), "#1c1917".to_string());
        
        // Common monochrome
        colors.insert("white".to_string(), "#ffffff".to_string());
        colors.insert("black".to_string(), "#000000".to_string());
        colors.insert("transparent".to_string(), "transparent".to_string());
        colors.insert("current".to_string(), "currentColor".to_string());
        colors.insert("inherit".to_string(), "inherit".to_string());
        
        colors
    };

    /// Default spacing scale (in rem)
    pub static ref DEFAULT_SPACING: HashMap<String, String> = {
        let mut spacing = HashMap::new();
        
        spacing.insert("0".to_string(), "0rem".to_string());
        spacing.insert("1".to_string(), "0.25rem".to_string());
        spacing.insert("2".to_string(), "0.5rem".to_string());
        spacing.insert("3".to_string(), "0.75rem".to_string());
        spacing.insert("4".to_string(), "1rem".to_string());
        spacing.insert("5".to_string(), "1.25rem".to_string());
        spacing.insert("6".to_string(), "1.5rem".to_string());
        spacing.insert("7".to_string(), "1.75rem".to_string());
        spacing.insert("8".to_string(), "2rem".to_string());
        spacing.insert("9".to_string(), "2.25rem".to_string());
        spacing.insert("10".to_string(), "2.5rem".to_string());
        spacing.insert("12".to_string(), "3rem".to_string());
        spacing.insert("14".to_string(), "3.5rem".to_string());
        spacing.insert("16".to_string(), "4rem".to_string());
        spacing.insert("20".to_string(), "5rem".to_string());
        spacing.insert("24".to_string(), "6rem".to_string());
        spacing.insert("28".to_string(), "7rem".to_string());
        spacing.insert("32".to_string(), "8rem".to_string());
        spacing.insert("36".to_string(), "9rem".to_string());
        spacing.insert("40".to_string(), "10rem".to_string());
        spacing.insert("44".to_string(), "11rem".to_string());
        spacing.insert("48".to_string(), "12rem".to_string());
        spacing.insert("52".to_string(), "13rem".to_string());
        spacing.insert("56".to_string(), "14rem".to_string());
        spacing.insert("60".to_string(), "15rem".to_string());
        spacing.insert("64".to_string(), "16rem".to_string());
        spacing.insert("72".to_string(), "18rem".to_string());
        spacing.insert("80".to_string(), "20rem".to_string());
        spacing.insert("96".to_string(), "24rem".to_string());
        
        spacing.insert("full".to_string(), "100%".to_string());
        spacing.insert("screen".to_string(), "100vw".to_string());
        
        spacing
    };

    /// Default font sizes
    pub static ref DEFAULT_FONT_SIZES: HashMap<String, String> = {
        let mut sizes = HashMap::new();
        
        sizes.insert("xs".to_string(), "0.75rem".to_string());
        sizes.insert("sm".to_string(), "0.875rem".to_string());
        sizes.insert("base".to_string(), "1rem".to_string());
        sizes.insert("lg".to_string(), "1.125rem".to_string());
        sizes.insert("xl".to_string(), "1.25rem".to_string());
        sizes.insert("2xl".to_string(), "1.5rem".to_string());
        sizes.insert("3xl".to_string(), "1.875rem".to_string());
        sizes.insert("4xl".to_string(), "2.25rem".to_string());
        sizes.insert("5xl".to_string(), "3rem".to_string());
        sizes.insert("6xl".to_string(), "3.75rem".to_string());
        sizes.insert("7xl".to_string(), "4.5rem".to_string());
        sizes.insert("8xl".to_string(), "6rem".to_string());
        sizes.insert("9xl".to_string(), "8rem".to_string());
        
        sizes
    };

    /// Default breakpoints
    pub static ref DEFAULT_BREAKPOINTS: HashMap<String, String> = {
        let mut breakpoints = HashMap::new();
        
        breakpoints.insert("sm".to_string(), "640px".to_string());
        breakpoints.insert("md".to_string(), "768px".to_string());
        breakpoints.insert("lg".to_string(), "1024px".to_string());
        breakpoints.insert("xl".to_string(), "1280px".to_string());
        breakpoints.insert("2xl".to_string(), "1536px".to_string());
        
        breakpoints
    };

    /// Default opacity scale
    pub static ref DEFAULT_OPACITY: HashMap<String, String> = {
        let mut opacity = HashMap::new();
        
        for i in (0..=100).step_by(5) {
            let key = i.to_string();
            let value = (i as f64 / 100.0).to_string();
            opacity.insert(key, value);
        }
        
        opacity
    };
}

/// Get the default Tailwind v4 theme configuration
pub fn default_theme() -> ThemeConfig {
    let mut colors = HashMap::new();
    
    // Convert flat colors map to nested structure for nested lookups
    for (key, value) in DEFAULT_COLORS.iter() {
        colors.insert(key.clone(), ThemeValue::Simple(value.clone()));
    }
    
    // Convert font sizes from single string to Vec<String>
    let mut font_sizes = HashMap::new();
    for (key, value) in DEFAULT_FONT_SIZES.iter() {
        font_sizes.insert(key.clone(), vec![value.clone()]);
    }
    
    ThemeConfig {
        colors,
        spacing: DEFAULT_SPACING.clone(),
        font_sizes,
        opacity: DEFAULT_OPACITY.clone(),
        breakpoints: DEFAULT_BREAKPOINTS.clone(),
        extend: HashMap::new(),
        dark_mode: crate::domain::theme_config::DarkModeStrategy::Media,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_colors_loaded() {
        assert!(!DEFAULT_COLORS.is_empty());
        assert_eq!(DEFAULT_COLORS.get("blue-600"), Some(&"#1e40af".to_string()));
        assert_eq!(DEFAULT_COLORS.get("red-500"), Some(&"#ef4444".to_string()));
    }

    #[test]
    fn test_default_spacing_loaded() {
        assert!(!DEFAULT_SPACING.is_empty());
        assert_eq!(DEFAULT_SPACING.get("4"), Some(&"1rem".to_string()));
        assert_eq!(DEFAULT_SPACING.get("full"), Some(&"100%".to_string()));
    }

    #[test]
    fn test_default_breakpoints_loaded() {
        assert!(!DEFAULT_BREAKPOINTS.is_empty());
        assert_eq!(DEFAULT_BREAKPOINTS.get("md"), Some(&"768px".to_string()));
    }

    #[test]
    fn test_default_theme() {
        let theme = default_theme();
        assert!(!theme.colors.is_empty());
        assert!(!theme.spacing.is_empty());
        assert!(!theme.breakpoints.is_empty());
    }
}
