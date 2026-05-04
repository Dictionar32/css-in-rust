/**
 * Browser stub untuk @tailwind-styled/shared.
 *
 * @tailwind-styled/shared adalah Node-only package — import fs, crypto, module
 * di top-level. Tidak boleh masuk ke browser bundle sama sekali.
 *
 * Semua fungsi yang mungkin dipanggil di runtime browser diganti dengan
 * no-op atau safe fallback. Di browser, native Rust binding tidak tersedia
 * dan semua class resolution sudah di-pre-compute di server/build time.
 */

export type TokenMap = Record<string, string>
export type VariantValue = string | number | boolean | undefined
export type VariantProps = Record<string, VariantValue>
export type HtmlTagName = keyof HTMLElementTagNameMap

export const createLogger = (_namespace: string) => ({
  warn: (..._args: unknown[]) => {},
  error: (..._args: unknown[]) => {},
  info: (..._args: unknown[]) => {},
  debug: (..._args: unknown[]) => {},
})

export const createDebugLogger =
  (_namespace: string, _label?: string) =>
  (_msg: string) => {}

export const resolveNativeBinary = (): null => null
export const getNativeBinding = (): null => null
export const resetNativeBinding = (): void => {}

export class TwError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TwError"
  }
}

export const hashString = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

export const isBrowser = true