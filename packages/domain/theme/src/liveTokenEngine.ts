"use client"

import React from "react"

import type { TokenMap } from '@tailwind-styled/shared'
export type { TokenMap }

export type TokenSubscriber = (tokens: TokenMap) => void

export interface LiveTokenSet {
  vars: Record<string, string>
  get(name: string): string | undefined
  set(name: string, value: string): void
  setAll(tokens: TokenMap): void
  snapshot(): TokenMap
}

export interface LiveTokenEngineBridge {
  getToken(name: string): string | undefined
  getTokens(): TokenMap
  setToken(name: string, value: string): void
  setTokens(tokens: TokenMap): void
  applyTokenSet(tokens: TokenMap): void
  subscribeTokens(fn: TokenSubscriber): () => void
  subscribe?(fn: TokenSubscriber): () => void
}

interface LiveTokenEngineRuntime {
  liveToken(tokens: TokenMap): LiveTokenSet
  getToken(name: string): string | undefined
  getTokens(): TokenMap
  setToken(name: string, value: string): void
  setTokens(tokens: TokenMap): void
  applyTokenSet(tokens: TokenMap): void
  generateTokenCssString(): string
  subscribe(fn: TokenSubscriber): () => void
  markHydrated(): void
}

const TOKEN_ENGINE_KEY = "__TW_TOKEN_ENGINE__"

export function tokenVar(name: string): string {
  const normalized = name.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase()
  return `--tw-token-${normalized}`
}

export function tokenRef(name: string): string {
  return `var(${tokenVar(name)})`
}

const buildRootCss = (tokens: TokenMap): string => {
  const vars = Object.entries(tokens)
    .map(([name, value]) => `  ${tokenVar(name)}: ${value};`)
    .join("\n")
  return `:root {\n${vars}\n}`
}

const createLiveTokenEngine = (): LiveTokenEngineRuntime => {
  const state = {
    currentTokens: {} as TokenMap,
    styleEl: null as HTMLStyleElement | null,
    // Belum boleh nyentuh live DOM sampai komponen pertama selesai mount.
    // Ini yang nyegah hydration mismatch: tanpa flag ini, liveToken() yang
    // dipanggil di module top-level akan langsung document.documentElement
    // .style.setProperty(...) saat bundle client di-evaluasi — JAUH sebelum
    // React selesai hydrate — sehingga <html> versi live DOM beda dengan
    // <html> yang di-render server (yang gak pernah nyentuh `document`).
    hydrated: false,
  }
  const subscribers = new Set<TokenSubscriber>()

  const syncStyleEl = (): void => {
    if (!state.hydrated || typeof document === "undefined") return

    if (!state.styleEl) {
      const styleEl = document.createElement("style")
      styleEl.id = "tw-live-tokens"
      styleEl.setAttribute("data-tw-tokens", "true")
      document.head.appendChild(styleEl)
      state.styleEl = styleEl
    }

    state.styleEl.textContent = buildRootCss(state.currentTokens)
  }

  const notifySubscribers = (): void => {
    const snapshot = { ...state.currentTokens }
    for (const subscriber of subscribers) {
      try {
        subscriber(snapshot)
      } catch {
        // Intentionally ignore subscriber errors.
      }
    }
  }

  const setToken = (name: string, value: string): void => {
    state.currentTokens = { ...state.currentTokens, [name]: value }
    if (state.hydrated && typeof document !== "undefined") {
      document.documentElement.style.setProperty(tokenVar(name), value)
    }
    syncStyleEl()
    notifySubscribers()
  }

  const setTokens = (tokens: TokenMap): void => {
    state.currentTokens = { ...state.currentTokens, ...tokens }
    if (state.hydrated && typeof document !== "undefined") {
      const root = document.documentElement
      for (const [name, value] of Object.entries(tokens)) {
        root.style.setProperty(tokenVar(name), value)
      }
    }
    syncStyleEl()
    notifySubscribers()
  }

  const applyTokenSet = (tokens: TokenMap): void => {
    if (state.hydrated && typeof document !== "undefined") {
      const root = document.documentElement
      for (const name of Object.keys(state.currentTokens)) {
        if (!(name in tokens)) {
          root.style.removeProperty(tokenVar(name))
        }
      }
      for (const [name, value] of Object.entries(tokens)) {
        root.style.setProperty(tokenVar(name), value)
      }
    }

    state.currentTokens = { ...tokens }
    syncStyleEl()
    notifySubscribers()
  }

  // Dipanggil sekali setelah mount pertama, EKSKLUSIF lewat useTokens()'s
  // useEffect. Setelah ini true, semua write di atas balik sinkron langsung
  // seperti semula.
  //
  // KENAPA TIDAK ADA FALLBACK rAF/timer DI SINI (root cause bug sebelumnya):
  // Versi lama nyoba nge-flush via `requestAnimationFrame(() =>
  // requestAnimationFrame(markHydrated))` sebagai fallback buat consumer
  // imperative-only. Itu SALAH karena rAF terikat ke jadwal repaint browser,
  // BUKAN ke commit React. Untuk tree client component yang besar/berat
  // (banyak demo widget sekaligus) atau saat dev server lagi lambat
  // (Turbopack first compile, Fast Refresh instrumentation), React bisa
  // belum kelar nge-hydrate <html> di titik rAF itu nembak — begitu rAF
  // nulis ke document.documentElement.style DI TENGAH proses hydrate, React
  // lapor mismatch tepat di <html> (root element-nya), persis seperti yang
  // dilaporkan: `<html style={{--tw-token-primary:...}}>` padahal
  // layout.tsx gak pernah nulis style itu di JSX-nya.
  // Dikonfirmasi via repro React + jsdom: nulis ke documentElement.style
  // SEBELUM hydrateRoot() menghasilkan warning yang identik byte-per-byte
  // dengan yang dilaporkan; begitu write yang sama dipindah ke dalam
  // useEffect (jalan persis setelah commit), warning-nya hilang total.
  // useEffect dijamin React baru jalan SETELAH seluruh tree (termasuk
  // <html>) selesai di-commit/di-hydrate — gak ada race seperti rAF.
  // Konsekuensinya: consumer yang cuma pakai liveToken().set() imperatif
  // tanpa pernah render komponen yang panggil useTokens() (hook dari
  // createUseTokens()) gak akan ke-flush ke DOM. Itu trade-off yang
  // disengaja — render satu komponen yang pakai useTokens() di mana aja
  // dalam tree buat "bootstrap" hydration-nya.
  const markHydrated = (): void => {
    if (state.hydrated || typeof document === "undefined") return
    state.hydrated = true
    const root = document.documentElement
    for (const [name, value] of Object.entries(state.currentTokens)) {
      root.style.setProperty(tokenVar(name), value)
    }
    syncStyleEl()
  }

  return {
    markHydrated,
    liveToken(tokens: TokenMap): LiveTokenSet {
      setTokens(tokens)

      const vars: Record<string, string> = {}
      for (const name of Object.keys(tokens)) {
        vars[name] = tokenRef(name)
      }

      return {
        vars,
        get(name: string) {
          return state.currentTokens[name]
        },
        set(name: string, value: string) {
          setToken(name, value)
        },
        setAll(nextTokens: TokenMap) {
          setTokens(nextTokens)
        },
        snapshot() {
          return { ...state.currentTokens }
        },
      }
    },
    getToken(name: string): string | undefined {
      return state.currentTokens[name]
    },
    getTokens(): TokenMap {
      return { ...state.currentTokens }
    },
    setToken,
    setTokens,
    applyTokenSet,
    generateTokenCssString(): string {
      return buildRootCss(state.currentTokens)
    },
    subscribe(fn: TokenSubscriber): () => void {
      subscribers.add(fn)
      return () => {
        subscribers.delete(fn)
      }
    },
  }
}

const engine = createLiveTokenEngine()

export function liveToken(tokens: TokenMap): LiveTokenSet {
  return engine.liveToken(tokens)
}

export function setToken(name: string, value: string): void {
  engine.setToken(name, value)
}

export function setTokens(tokens: TokenMap): void {
  engine.setTokens(tokens)
}

export function applyTokenSet(tokens: TokenMap): void {
  engine.applyTokenSet(tokens)
}

export function getToken(name: string): string | undefined {
  return engine.getToken(name)
}

export function getTokens(): TokenMap {
  return engine.getTokens()
}

export function subscribeTokens(fn: TokenSubscriber): () => void {
  return engine.subscribe(fn)
}

export function generateTokenCssString(): string {
  return engine.generateTokenCssString()
}

export function createUseTokens() {
  return function useTokens(): TokenMap {
    // useSyncExternalStore untuk konsistensi SSR/client:
    // - getServerSnapshot() return empty object → SSR render tanpa tokens
    // - getSnapshot() return live tokens di client setelah hydration
    // Ini menghilangkan hydration mismatch karena server dan client
    // initial render keduanya return {} (empty), lalu useEffect update
    // ke nilai aktual via subscriber.
    const [tokens, setTokensState] = React.useState<TokenMap>({})

    React.useEffect(() => {
      // Baru sekarang aman nyentuh document.documentElement — hydration
      // udah pasti selesai di titik ini. markHydrated() flush token yang
      // sempat ditunda dari liveToken() init call (lihat createLiveTokenEngine).
      engine.markHydrated()
      // Set ke nilai aktual setelah mount (client-only)
      setTokensState(engine.getTokens())
      return engine.subscribe((nextTokens) => setTokensState(nextTokens))
    }, [])

    return tokens
  }
}

export const liveTokenEngine: LiveTokenEngineBridge = {
  getToken: engine.getToken,
  getTokens: engine.getTokens,
  setToken: engine.setToken,
  setTokens: engine.setTokens,
  applyTokenSet: engine.applyTokenSet,
  subscribeTokens: engine.subscribe,
  subscribe: engine.subscribe,
}

declare global {
  interface Window {
    __TW_TOKEN_ENGINE__?: LiveTokenEngineBridge
  }
}

const globalTokenEngine = globalThis as typeof globalThis & {
  [TOKEN_ENGINE_KEY]?: LiveTokenEngineBridge
}

globalTokenEngine[TOKEN_ENGINE_KEY] = liveTokenEngine
if (typeof window !== "undefined") {
  window.__TW_TOKEN_ENGINE__ = liveTokenEngine
}