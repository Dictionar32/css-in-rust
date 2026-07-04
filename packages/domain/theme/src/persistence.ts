/**
 * Theme persistence utilities
 * Handles localStorage sync and system preference detection
 */

import type { ThemeValue, ThemePersistenceConfig } from './types.persistence'

/**
 * Detect system preference for color scheme
 * @returns 'light' or 'dark' based on prefers-color-scheme media query
 */
export function getSystemPreference(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light'

    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark'
    }
    return 'light'
}

/**
 * Get system preference for SSR - returns stored value if available
 * Falls back to 'light' on server (safe baseline)
 * Client will initialize actual system preference after hydration
 */
export function getSystemPreferenceSSR(storageKey: string): 'light' | 'dark' {
    // On server: no window, return safe default
    if (typeof window === 'undefined') {
        return 'light'
    }

    // On client: check if we have stored preference first (synchronous access)
    // This prevents hydration mismatch by using stored value if available
    const stored = getStoredTheme(storageKey)
    if (stored && stored !== 'system') {
        return stored
    }

    // If theme is 'system' or not stored, read system preference
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark'
    }
    return 'light'
}

/**
 * Get effective theme value (resolves 'system' to actual theme)
 */
export function getEffectiveTheme(
    theme: ThemeValue,
    systemPreference: 'light' | 'dark'
): 'light' | 'dark' {
    if (theme === 'system') return systemPreference
    return theme
}

/**
 * Get theme from localStorage
 */
export function getStoredTheme(storageKey: string): ThemeValue | null {
    if (typeof localStorage === 'undefined') return null

    const stored = localStorage.getItem(storageKey)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored
    }
    return null
}

/**
 * Save theme to localStorage
 */
export function saveTheme(storageKey: string, theme: ThemeValue): void {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(storageKey, theme)
}

/**
 * Apply theme to HTML element
 */
export function applyThemeToElement(
    theme: 'light' | 'dark',
    element: HTMLElement,
    classNameDark: string
): void {
    if (theme === 'dark') {
        element.classList.add(classNameDark)
    } else {
        element.classList.remove(classNameDark)
    }
}

/**
 * Initialize theme on page load (SSR-safe)
 * This should be called inline in a script tag before hydration
 */
export function getInitializationScript(config: ThemePersistenceConfig): string {
    const { storageKey, defaultTheme, classNameDark } = config

    return `
(function() {
  try {
    const stored = localStorage.getItem('${storageKey}');
    const theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : '${defaultTheme}';
    
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('${classNameDark}');
    } else {
      document.documentElement.classList.remove('${classNameDark}');
    }
    
    document.documentElement.dataset.themeState = theme;
  } catch (e) {
    console.error('[tailwind-styled] Theme initialization failed:', e);
  }
})();
  `.trim()
}

/**
 * Listen to system preference changes
 */
export function subscribeToSystemPreferenceChanges(
    callback: (preference: 'light' | 'dark') => void
): () => void {
    if (typeof window === 'undefined') return () => { }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
        callback(e.matches ? 'dark' : 'light')
    }

    // Modern API
    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }

    // Legacy API
    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
}
