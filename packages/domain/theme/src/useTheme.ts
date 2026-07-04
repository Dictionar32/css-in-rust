/**
 * useTheme hook - Manage theme persistence with system preference sync
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { ThemeValue, UseThemeReturn, ThemePersistenceConfig } from './types.persistence'
import {
    getSystemPreference,
    getEffectiveTheme,
    getStoredTheme,
    saveTheme,
    applyThemeToElement,
    subscribeToSystemPreferenceChanges,
    getSystemPreferenceSSR,
} from './persistence'

// Global config (set by ThemeInitScript)
let globalConfig: ThemePersistenceConfig | null = null

export function setThemePersistenceConfig(config: ThemePersistenceConfig): void {
    globalConfig = config
}

/**
 * Hook to manage theme with localStorage persistence and system preference support
 *
 * @param config Optional config override (uses global config if not provided)
 * @returns Object with theme state and controls
 *
 * @example
 * const { theme, toggleTheme } = useTheme()
 *
 * return (
 *   <button onClick={toggleTheme}>
 *     Theme: {theme}
 *   </button>
 * )
 */
export function useTheme(config?: ThemePersistenceConfig): UseThemeReturn {
    const cfg = config || globalConfig || {
        storageKey: 'theme-preference',
        defaultTheme: 'system',
        classNameDark: 'dark',
    }

    // Use SSR-safe initialization to prevent hydration mismatch
    // On server: defaults to 'light'
    // On client after hydration: switches to actual system preference
    const [theme, setThemeState] = useState<ThemeValue>(() => {
        const stored = getStoredTheme(cfg.storageKey)
        return stored || cfg.defaultTheme
    })

    const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(() =>
        getSystemPreferenceSSR(cfg.storageKey)
    )

    // Track if component has mounted on client (after hydration)
    const mounted = useRef(false)

    // After hydration: sync to actual system preference if theme is 'system'
    useEffect(() => {
        mounted.current = true

        // Read actual system preference after hydration
        const actual = getSystemPreference()
        setSystemPreference(actual)
    }, [])

    // Sync to localStorage and DOM whenever theme or system preference changes
    useEffect(() => {
        if (!mounted.current) return

        saveTheme(cfg.storageKey, theme)

        const effective = getEffectiveTheme(theme, systemPreference)
        applyThemeToElement(effective, document.documentElement, cfg.classNameDark)
    }, [theme, systemPreference, cfg])

    // Listen to system preference changes
    useEffect(() => {
        if (!mounted.current) return

        const unsubscribe = subscribeToSystemPreferenceChanges((pref) => {
            setSystemPreference(pref)
        })
        return unsubscribe
    }, [])

    const setTheme = useCallback((newTheme: ThemeValue) => {
        setThemeState(newTheme)
    }, [])

    const toggleTheme = useCallback(() => {
        setThemeState((curr) => (curr === 'light' ? 'dark' : 'light'))
    }, [])

    return {
        theme,
        systemPreference,
        setTheme,
        toggleTheme,
        isInitialized: mounted.current,
    }
}
