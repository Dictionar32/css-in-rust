# Theme Persistence - Visual Flow & Diagrams

## Flow Diagram: Dari Setup sampai Production

```
┌─────────────────────────────────────────────────────────────────┐
│                          SETUP PHASE                            │
└─────────────────────────────────────────────────────────────────┘

1. Layout
   ├─ <html>
   │  ├─ <head>
   │  │  └─ <ThemeInitScript
   │  │     storageKey="app-theme"
   │  │     defaultTheme="system"
   │  │     classNameDark="dark"
   │  │  />
   │  └─ <body>
   │     └─ {children}
   │

2. Component dengan useTheme
   ├─ <ThemeToggle>
   │  ├─ const { theme, toggleTheme } = useTheme()
   │  └─ <Button onClick={toggleTheme}>
   │
   └─ <Card>
      ├─ tw.div`dark:bg-slate-900`
      └─ Automatic respond to theme changes


┌─────────────────────────────────────────────────────────────────┐
│                       FIRST PAGELOAD                            │
└─────────────────────────────────────────────────────────────────┘

T=0ms: Browser GET page
│
├─ Server render HTML
│  └─ <html>
│     ├─ <head>
│     │  └─ <script>
│     │     // Inline script dari ThemeInitScript
│     │     // Tapi di server, tidak execute
│     │  </script>
│     └─ <body class="">
│        // Render dengan default light theme
│
├─ Server kirim HTML ke browser
│
T=50ms: Browser parse HTML
│
├─ Inline script EXECUTE sebelum React
│  │
│  ├─ localStorage.getItem("app-theme")
│  │  │
│  │  └─ Hasil: null (first visit)
│  │     → gunakan defaultTheme = "system"
│  │
│  ├─ window.matchMedia('(prefers-color-scheme: dark)')
│  │  │
│  │  ├─ User OS = Dark Mode
│  │  │  └─ Hasil: true → effectiveTheme = "dark"
│  │  │
│  │  └─ User OS = Light Mode
│  │     └─ Hasil: false → effectiveTheme = "light"
│  │
│  └─ document.documentElement.classList.add('dark')
│     // Sekarang <html class="dark">
│
T=100ms: Browser paint
│  │
│  └─ User TIDAK melihat flash/FOUC ✅
│     Langsung tampil dark theme (correct)
│
T=150ms: React hydrate
│  │
│  ├─ useTheme hook initialize
│  │  │
│  │  ├─ theme = getStoredTheme() || "system"
│  │  │  └─ Hasil: "system"
│  │  │
│  │  └─ systemPreference = getSystemPreferenceSSR()
│  │     └─ Hasil: "dark" (dari localStorage check + matchMedia)
│  │
│  ├─ React render komponen
│  │  └─ <html class="dark">
│  │     // SAMA dengan inline script ✅
│  │
│  └─ Hydration SUCCESS
│     No mismatch, no warnings ✅
│
T=200ms: useEffect run
│  │
│  └─ mounted.current = true
│     └─ Sekarang bisa baca system preference
│        Smooth transition ready


┌─────────────────────────────────────────────────────────────────┐
│                   USER INTERACTION: TOGGLE                      │
└─────────────────────────────────────────────────────────────────┘

User click "Toggle Theme" button

├─ toggleTheme() call
│  └─ setTheme('dark' → 'light')
│
├─ State update
│  └─ theme = 'light'
│
├─ useEffect trigger (theme dependency)
│  │
│  ├─ saveTheme("app-theme", "light")
│  │  └─ localStorage.setItem("app-theme", "light")
│  │
│  ├─ effectiveTheme = getEffectiveTheme('light', 'dark')
│  │  └─ Hasil: 'light' (explicit value, ignore system)
│  │
│  └─ applyThemeToElement('light', html, 'dark')
│     └─ document.documentElement.classList.remove('dark')
│
├─ Browser render update
│  │
│  └─ Tailwind dark: styles REMOVE
│     Smooth transition (transition-colors) ✅
│
└─ User see theme changed
   Saved to localStorage ✅


┌─────────────────────────────────────────────────────────────────┐
│                   PAGE RELOAD: PERSIST                          │
└─────────────────────────────────────────────────────────────────┘

User reload page (Ctrl+R / Cmd+R)

├─ Browser GET page again
│
├─ Server render HTML (default light)
│
├─ Inline script EXECUTE
│  │
│  ├─ localStorage.getItem("app-theme")
│  │  └─ Hasil: "light" (from previous toggle) ✅
│  │
│  ├─ theme = "light"
│  │  └─ Explicit value, tidak check system
│  │
│  └─ document.documentElement.classList.remove('dark')
│     // <html> (tanpa class dark)
│
├─ Browser paint
│  └─ Light theme tampil ✅
│     FOUC tidak terjadi (inline script sudah apply)
│
├─ React hydrate
│  └─ useTheme initialize dengan "light"
│     Hydration SUCCESS ✅
│
└─ User lihat light theme
   Same as saat reload, sebelum ✅


┌─────────────────────────────────────────────────────────────────┐
│              SYSTEM PREFERENCE CHANGE: AUTO SYNC                │
└─────────────────────────────────────────────────────────────────┘

User theme = "system", kemudian ubah OS preference

├─ OS Settings → Display → Dark Mode (toggle)
│
├─ Browser emit mediaQueryList.change event
│  │
│  └─ subscribeToSystemPreferenceChanges callback fire
│     └─ setSystemPreference('dark')
│
├─ useEffect trigger (systemPreference dependency)
│  │
│  ├─ effectiveTheme = getEffectiveTheme('system', 'dark')
│  │  └─ Hasil: 'dark' (resolved)
│  │
│  └─ applyThemeToElement('dark', html, 'dark')
│     └─ document.documentElement.classList.add('dark')
│
├─ Browser render update
│  └─ Smooth transition ✅
│
└─ User see theme updated automatically
   Sync with OS preference ✅


┌─────────────────────────────────────────────────────────────────┐
│                    STATE MACHINE: THEME                         │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   Initial    │
                    │  SSR/Server  │
                    └──────┬───────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Inline Script    │
                  │ Read Storage +   │
                  │ Detect System    │
                  └────────┬─────────┘
                           │
                           ▼
             ┌─────────────────────────────┐
             │   React Hydration           │
             │   useTheme initialize       │
             │   mounted.current = false   │
             └────────────┬────────────────┘
                          │
                          ▼
             ┌─────────────────────────────┐
             │   After Hydration           │
             │   mounted.current = true    │
             │   useEffect run             │
             │   Read actual system pref   │
             └────────────┬────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
     ┌────────┐      ┌────────┐     ┌────────┐
     │ light  │      │ dark   │     │system  │
     └────────┘      └────────┘     └────────┘
     │                │                │
     │ setTheme()     │ setTheme()     │ if OS pref
     │ toggleTheme()  │ toggleTheme()  │ changes:
     │                │                │ update
     └────────────────┴────────────────┘
              │
              └──► localStorage.setItem()
              │
              └──► classList.add/remove()


┌─────────────────────────────────────────────────────────────────┐
│                  HYDRATION SAFETY: KEY INSIGHT                  │
└─────────────────────────────────────────────────────────────────┘

PROBLEM (sebelum fix):
┌─────────────────────────────────────┐
│ Server render:                      │
│ theme = defaultTheme = 'system'    │
│ systemPref = undefined (no window) │
│ → render light theme (safe default)│
└─────────────────────────────────────┘
              ↓
         Browser paint: light ✅
              ↓
┌─────────────────────────────────────┐
│ React hydration:                    │
│ useTheme init:                      │
│   theme = getSystemPreference()    │
│   → calls window.matchMedia()      │
│   → OS = dark → 'dark'             │
│ → render dark theme ✅ ← MISMATCH! │
└─────────────────────────────────────┘

RESULT: Hydration error ❌


SOLUTION (after fix):
┌─────────────────────────────────────┐
│ Server render:                      │
│ theme = defaultTheme = 'system'    │
│ → render light theme (safe default)│
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Inline script run:                  │
│ (before React hydrate)              │
│ Baca localStorage + matchMedia      │
│ Apply class ke <html>               │
│ → dark theme di DOM ✅              │
└─────────────────────────────────────┘
              ↓
         Browser paint: dark ✅
              ↓
┌─────────────────────────────────────┐
│ React hydration:                    │
│ useTheme init:                      │
│   theme = getStoredTheme() = 'dark'│
│   systemPref = getSystemPreferenceSSR()
│         (prefer stored if available)│
│   → render dark theme ✅ = Server  │
│ → NO mismatch ✅                    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ useEffect run (after hydration):   │
│ Detect actual system preference    │
│ Smooth sync if needed              │
└─────────────────────────────────────┘

RESULT: Perfect match ✅ No warnings ✅


┌─────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE: TIMELINE                        │
└─────────────────────────────────────────────────────────────────┘

T=0ms
  └─ User navigate

T=50ms
  ├─ Server send HTML
  └─ <script inline> tag in <head>

T=75ms
  ├─ Browser parse <head>
  ├─ <script> execute synchronously
  │  ├─ localStorage read (sync) ~1-2ms
  │  ├─ matchMedia read (sync) ~0.1ms
  │  ├─ classList.add/remove (sync) ~0.1ms
  │  └─ Total: ~3-5ms
  └─ Before React start!

T=100ms
  ├─ Browser paint with correct theme
  └─ No FOUC ✅

T=150ms
  ├─ React hydrate
  └─ No hydration mismatch ✅

T=200ms
  ├─ useEffect run
  └─ Subscribe to system preference changes


┌─────────────────────────────────────────────────────────────────┐
│                    BUNDLE SIZE IMPACT                           │
└─────────────────────────────────────────────────────────────────┘

Files added to @tailwind-styled/theme:
├─ persistence.ts         ~2.5 KB
├─ useTheme.ts           ~1.8 KB
├─ ThemeInitScript.tsx   ~0.8 KB
└─ types.persistence.ts  ~0.5 KB
   ─────────────────────
   Total: ~5.6 KB (unminified)
   Minified: ~2.1 KB
   Gzipped: ~0.9 KB

Inline script size:
├─ Generated per app
├─ ~300-400 bytes (minified)
└─ Runs before React
   (doesn't add to JS bundle)

Total impact: < 1 KB gzipped ✅


┌─────────────────────────────────────────────────────────────────┐
│                        USAGE PATTERN                            │
└─────────────────────────────────────────────────────────────────┘

Scenario: User dengan stored preference "dark"

1. Page load
   ├─ Inline script baca "dark" dari localStorage
   └─ Apply class sebelum React

2. User klik toggle
   ├─ toggleTheme() → "light"
   └─ Save localStorage

3. User reload (Ctrl+R)
   ├─ Inline script baca "light"
   └─ Apply class sebelum React
   └─ Same visual ✅

4. User ubah OS preference
   ├─ subscribeToSystemPreferenceChanges callback
   ├─ Hanya trigger jika theme = "system"
   └─ Jika theme = "light" atau "dark" → ignored

5. User clear localStorage (manual / app reset)
   ├─ Next load: default ke "system"
   ├─ Detect OS preference
   └─ Show correct theme

Result: Seamless experience, no data loss ✅
