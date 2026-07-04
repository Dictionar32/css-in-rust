# Theme Persistence - Contoh Penggunaan

Tiga contoh praktis penggunaan Theme Persistence dengan `@tailwind-styled/theme`.

---

## Contoh 1: Setup Dasar di Layout

**File: `app/layout.tsx`**

```tsx
import { ThemeInitScript } from '@tailwind-styled/theme'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My App',
  description: 'Theme Persistence Demo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <head>
        {/* ✅ HARUS di <head> untuk prevent FOUC */}
        <ThemeInitScript
          storageKey="my-app-theme"
          defaultTheme="system"
          classNameDark="dark"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Apa yang terjadi:**
1. Server render dengan theme default (light)
2. Inline script jalankan sebelum React hydrate
3. Baca localStorage, aplikasikan CSS class
4. React hydrate - tidak ada mismatch
5. useTheme hook di client sync dengan system preference

---

## Contoh 2: Theme Toggle Button

**File: `components/ThemeToggle.tsx`**

```tsx
'use client'

import tw from 'tailwind-styled-v4'
import { useTheme } from '@tailwind-styled/theme'

const Button = tw.button`
  px-4 py-2 rounded-lg
  bg-white dark:bg-slate-900
  text-slate-900 dark:text-white
  border border-slate-200 dark:border-slate-700
  hover:bg-slate-50 dark:hover:bg-slate-800
  transition-colors
  font-medium
`

const Icon = tw.span`
  ml-2 text-lg
`

export function ThemeToggle() {
  const { theme, systemPreference, toggleTheme } = useTheme()

  return (
    <Button onClick={toggleTheme}>
      {theme === 'light' && <Icon>🌙</Icon>}
      {theme === 'dark' && <Icon>☀️</Icon>}
      {theme === 'system' && (
        <Icon>{systemPreference === 'dark' ? '☀️' : '🌙'}</Icon>
      )}
      
      <span>
        {theme === 'system' 
          ? `System (${systemPreference})`
          : theme
        }
      </span>
    </Button>
  )
}
```

**Cara kerja:**
- Klik button → `toggleTheme()` ubah dari light ke dark (atau sebaliknya)
- Auto-save ke localStorage dengan key `"my-app-theme"`
- CSS class automatic `add/remove` dari `<html>`
- Jika theme = 'system', tampilkan system preference
- Persist across page reload ✅

---

## Contoh 3: Dropdown untuk Select Theme

**File: `components/ThemeSelector.tsx`**

```tsx
'use client'

import tw from 'tailwind-styled-v4'
import { useTheme } from '@tailwind-styled/theme'
import type { ThemeValue } from '@tailwind-styled/theme'

const Container = tw.div`flex items-center gap-2`

const Select = tw.select`
  px-3 py-2 rounded-lg
  bg-white dark:bg-slate-900
  text-slate-900 dark:text-white
  border border-slate-200 dark:border-slate-700
  cursor-pointer
  transition-colors
`

const Label = tw.label`
  font-medium text-slate-700 dark:text-slate-300
`

export function ThemeSelector() {
  const { theme, systemPreference, setTheme } = useTheme()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as ThemeValue)
  }

  return (
    <Container>
      <Label htmlFor="theme-select">Theme:</Label>
      <Select 
        id="theme-select"
        value={theme} 
        onChange={handleChange}
      >
        <option value="light">Light ☀️</option>
        <option value="dark">Dark 🌙</option>
        <option value="system">
          System (currently {systemPreference})
        </option>
      </Select>
    </Container>
  )
}
```

**Fitur:**
- Dropdown select untuk 3 pilihan tema
- Current selection = `theme` state
- Perubahan = `setTheme()` → localStorage update → CSS update
- Dynamic label menunjukkan current system preference
- Semua changes di-persist ✅

---

## Contoh 4: Styled Component dengan Dark Mode

**File: `components/Card.tsx`**

```tsx
'use client'

import tw from 'tailwind-styled-v4'

const CardWrapper = tw.div`
  p-6 rounded-lg
  bg-white dark:bg-slate-900
  border border-slate-200 dark:border-slate-700
  shadow-sm dark:shadow-lg
  transition-colors duration-200
`

const CardTitle = tw.h2`
  text-xl font-bold
  text-slate-900 dark:text-white
  mb-2
`

const CardDescription = tw.p`
  text-slate-600 dark:text-slate-400
  leading-relaxed
`

export function Card({ title, children }: { 
  title: string
  children: React.ReactNode 
}) {
  return (
    <CardWrapper>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{children}</CardDescription>
    </CardWrapper>
  )
}
```

**Cara kerja:**
- Gunakan Tailwind dark: prefix seperti biasa (`dark:bg-slate-900`)
- Saat user toggle theme → class `dark` add/remove dari `<html>`
- Tailwind automatically apply dark mode styles ✅
- Smooth transition karena `transition-colors`

---

## Contoh 5: Layout Lengkap

**File: `app/page.tsx`**

```tsx
'use client'

import tw from 'tailwind-styled-v4'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ThemeSelector } from '@/components/ThemeSelector'
import { Card } from '@/components/Card'

const Main = tw.main`
  min-h-screen
  bg-white dark:bg-slate-950
  p-8
  transition-colors
`

const Header = tw.header`
  max-w-2xl mx-auto
  mb-12
  flex items-center justify-between
  gap-4
`

const Title = tw.h1`
  text-3xl font-bold
  text-slate-900 dark:text-white
`

const Controls = tw.div`
  flex gap-3
`

const Content = tw.div`
  max-w-2xl mx-auto
  space-y-6
`

export default function Home() {
  return (
    <Main>
      <Header>
        <Title>Theme Persistence Demo</Title>
        <Controls>
          <ThemeSelector />
          <ThemeToggle />
        </Controls>
      </Header>

      <Content>
        <Card title="Feature 1">
          Try toggle theme. Preference simpan ke localStorage.
          Reload page - theme persist ✅
        </Card>

        <Card title="Feature 2">
          Ubah OS system preference (Settings → Display → Dark Mode).
          Jika theme = "system", app automatically sync. ✅
        </Card>

        <Card title="Feature 3">
          Buka devtools Console. Tidak ada hydration warnings.
          SSR-safe implementation tanpa suppressHydrationWarning. ✅
        </Card>

        <Card title="Feature 4">
          Semua transitions smooth dengan `transition-colors duration-200`.
          FOUC tidak terjadi - inline script run sebelum paint. ✅
        </Card>
      </Content>
    </Main>
  )
}
```

---

## Contoh 6: globals.css - Dark Mode Styling

**File: `app/globals.css`**

```css
/* Light theme (default) */
:root {
  --bg-primary: #ffffff;
  --text-primary: #09090b;
  --border: #e5e7eb;
}

/* Dark theme */
html.dark {
  --bg-primary: #09090b;
  --text-primary: #fafafa;
  --border: #27272a;
}

/* Smooth transitions */
html {
  transition: background-color 0.3s, color 0.3s;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

---

## Ringkasan: Apa yang Terjadi Step-by-Step

### 1️⃣ **Server Render**
```
Server generate HTML
  → ThemeInitScript component
  → inline script generated (tapi tidak execute di server)
  → HTML kirim ke browser with theme="light" (default)
```

### 2️⃣ **Browser Menerima HTML**
```
Inline script execute SEBELUM React start
  → Baca localStorage.getItem("my-app-theme")
  → Jika ada: gunakan stored theme (misal "dark")
  → Jika tidak: gunakan defaultTheme (misal "system")
  → Resolve "system" → baca prefers-color-scheme
  → Apply CSS class ke <html class="dark">
  → Browser paint dengan theme yang benar ✅
```

### 3️⃣ **React Hydration**
```
React start render component
  → useTheme hook initialize
  → Initial state = stored theme (same as script applied)
  → Server HTML === React render HTML ✅
  → Hydration succeed (no mismatch)
```

### 4️⃣ **After Hydration**
```
useEffect run
  → mounted.current = true
  → Detect actual system preference dari prefers-color-scheme
  → Jika theme="system", smooth sync ke actual preference
  → Subscribe ke system preference changes
  → User can toggle theme via button/dropdown
```

### 5️⃣ **User Toggle Theme**
```
Klik button toggleTheme()
  → setTheme('dark')
  → localStorage.setItem("my-app-theme", "dark")
  → document.documentElement.classList.add('dark')
  → Tailwind dark: styles apply
  → Save persist ✅
  → Reload page → theme still there ✅
```

---

## API Cheat Sheet

```tsx
// Hook - Import dari @tailwind-styled/theme
import { useTheme, ThemeInitScript } from '@tailwind-styled/theme'

// Initialize di layout
<ThemeInitScript 
  storageKey="app-theme"          // localStorage key
  defaultTheme="system"           // 'light' | 'dark' | 'system'
  classNameDark="dark"            // CSS class untuk dark mode
/>

// Gunakan di component
const {
  theme,              // 'light' | 'dark' | 'system' - current theme
  systemPreference,   // 'light' | 'dark' - OS preference
  setTheme,           // (theme: ThemeValue) => void
  toggleTheme,        // () => void - toggle light ↔ dark
  isInitialized,      // boolean - true setelah hydration
} = useTheme()

// Utility functions (bisa import jika perlu)
import {
  getSystemPreference,                    // () => 'light' | 'dark'
  getEffectiveTheme,                      // (theme, sysPref) => 'light' | 'dark'
  getStoredTheme,                         // (key) => ThemeValue | null
  saveTheme,                              // (key, theme) => void
  subscribeToSystemPreferenceChanges,     // (callback) => () => void
} from '@tailwind-styled/theme'
```

---

## Best Practices

✅ **Place ThemeInitScript di `<head>`** - prevent FOUC  
✅ **Set `defaultTheme="system"`** - respect user OS preference  
✅ **Use Tailwind `dark:` prefix** - automatic theme switching  
✅ **Add `transition-colors`** - smooth visual changes  
✅ **Tidak perlu `suppressHydrationWarning`** - SSR-safe by design  
✅ **Test: toggle theme → reload → verify persist** - check localStorage  

❌ **Jangan** place di `<body>` - akan cause FOUC  
❌ **Jangan** manual `document.documentElement.classList.toggle('dark')` - use `setTheme()`  
❌ **Jangan** read system preference saat render - gunakan useEffect  

---

## Testing Checklist

1. **FOUC Test**
   - Browser reload page
   - Tidak ada kilat warna sebelum tema load ✅

2. **Persistence Test**
   - Set theme ke "dark"
   - Reload page
   - Theme masih "dark" ✅

3. **System Preference Test**
   - Set theme ke "system"
   - Ubah OS preference (Settings → Display → Dark Mode)
   - App automatically sync ✅

4. **Hydration Test**
   - Open DevTools Console
   - Tidak ada hydration warnings ✅
   - Tidak perlu `suppressHydrationWarning` ✅

5. **TypeScript Test**
   - `npm run check:types`
   - Tidak ada type errors ✅
