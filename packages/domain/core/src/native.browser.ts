/**
 * Browser stub untuk native binding.
 * Di browser, native Rust binding tidak tersedia — semua fungsi return null/noop.
 * Build time processing sudah selesai di server, runtime hanya butuh class lookup.
 */

export const getNativeBinding = (): null => null
export const resetNativeBinding = (): void => {}
export const isBrowser = true