/**
 * Type definitions for theme persistence
 */

export type ThemeValue = 'light' | 'dark' | 'system'

export interface UseThemeReturn {
    /** Current active theme: 'light', 'dark', or 'system' */
    theme: ThemeValue
    /** System preference: 'light' or 'dark' (from prefers-color-scheme) */
    systemPreference: 'light' | 'dark'
    /** Set theme to specific value */
    setTheme: (theme: ThemeValue) => void
    /** Toggle between light and dark */
    toggleTheme: () => void
    /** Whether theme has been initialized (hydrated from storage) */
    isInitialized: boolean
}

export interface ThemeInitScriptProps {
    /** Storage key for persisting theme preference (default: 'theme-preference') */
    storageKey?: string
    /** Default theme if nothing in storage and no system preference (default: 'system') */
    defaultTheme?: ThemeValue
    /** CSS class applied to html element when dark theme is active (default: 'dark') */
    classNameDark?: string
}

export interface ThemePersistenceConfig {
    storageKey: string
    defaultTheme: ThemeValue
    classNameDark: string
}
