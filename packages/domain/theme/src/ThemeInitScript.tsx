/**
 * ThemeInitScript component
 * Renders inline script to prevent FOUC (Flash of Unstyled Content)
 * Must be placed in <head> before hydration
 */

'use client'

import { setThemePersistenceConfig } from './useTheme'
import { getInitializationScript } from './persistence'
import type { ThemeInitScriptProps, ThemePersistenceConfig } from './types.persistence'

const DEFAULT_CONFIG: ThemePersistenceConfig = {
    storageKey: 'theme-preference',
    defaultTheme: 'system',
    classNameDark: 'dark',
}

/**
 * Component that renders initialization script and sets global config
 *
 * Place this in your <head> before other scripts:
 *
 * @example
 * // app/layout.tsx
 * import { ThemeInitScript } from '@tailwind-styled/theme'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <head>
 *         <ThemeInitScript
 *           storageKey="app-theme"
 *           defaultTheme="system"
 *           classNameDark="dark"
 *         />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   )
 * }
 */
export function ThemeInitScript(props: ThemeInitScriptProps) {
    const config: ThemePersistenceConfig = {
        storageKey: props.storageKey || DEFAULT_CONFIG.storageKey,
        defaultTheme: props.defaultTheme || DEFAULT_CONFIG.defaultTheme,
        classNameDark: props.classNameDark || DEFAULT_CONFIG.classNameDark,
    }

    // Set global config for useTheme hook
    setThemePersistenceConfig(config)

    const script = getInitializationScript(config)

    return (
        <>
            <script
                dangerouslySetInnerHTML={{ __html: script }}
            />
        </>
    )
}
