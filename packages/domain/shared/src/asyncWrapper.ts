/**
 * Example Usage - asyncWrapper (master_005)
 *
 * Sebelum:
 * ```
 * const log = createLogger("scanner")
 * async function scan() {
 *   log.debug("start scan")
 *   try {
 *     const result = await scanWorkspace(root)
 *     log.debug("scan complete")
 *     return result
 *   } catch (e) {
 *     log.error("scan failed:", e)
 *     throw e
 *   }
 * }
 * ```
 *
 * Sesudah:
 * ```
 * import { asyncWithLogging } from "@tailwind-styled/shared"
 *
 * const result = await asyncWithLogging("scanner", async () => {
 *   return await scanWorkspace(root)
 * }, { onStart: true, onComplete: true, onError: true })
 *
 * if (!result.ok) throw result.error
 * return result.value
 * ```
 */

import { createLogger } from "./logger"
import type { LogLevel } from "./logger"

export interface AsyncWrapperOptions {
  onStart?: boolean
  onComplete?: boolean
  onError?: boolean
  label?: string
  level?: LogLevel
}

interface AsyncResult<T> {
  ok: true
  value: T
  durationMs: number
}

interface AsyncError<E> {
  ok: false
  error: E
  durationMs: number
}

type AsyncResultWithError<T, E = Error> = AsyncResult<T> | AsyncError<E>

/**
 * Wrap async function with automatic logging
 */
export async function asyncWithLogging<T, E = Error>(
  namespace: string,
  fn: () => Promise<T>,
  options: AsyncWrapperOptions = {}
): Promise<AsyncResultWithError<T, E>> {
  const { onStart, onComplete = true, onError = true, label, level } = options
  const logger = createLogger(namespace, level)
  const startTime = Date.now()

  if (onStart) {
    logger.debug(`[${label ?? "async"}] start`)
  }

  try {
    const value = await fn()
    const durationMs = Date.now() - startTime

    if (onComplete) {
      logger.debug(`[${label ?? "async"}] complete in ${durationMs}ms`)
    }

    return { ok: true, value, durationMs }
  } catch (err) {
    const durationMs = Date.now() - startTime
    const error = err as E

    if (onError) {
      logger.error(`[${label ?? "async"}] failed in ${durationMs}ms:`, String(error))
    }

    return { ok: false, error, durationMs }
  }
}

/**
 * Wrap promise with timeout
 */
export async function asyncWithTimeout<T>(
  namespace: string,
  promise: Promise<T>,
  timeoutMs: number,
  options: AsyncWrapperOptions = {}
): Promise<AsyncResultWithError<T, Error>> {
  return Promise.race([
    asyncWithLogging(namespace, () => promise, options),
    new Promise<AsyncError<Error>>((resolve) =>
      setTimeout(() => {
        resolve({
          ok: false,
          error: new Error(`Timeout after ${timeoutMs}ms`),
          durationMs: timeoutMs,
        })
      }, timeoutMs)
    ),
  ]) as Promise<AsyncResultWithError<T, Error>>
}

/**
 * Wrap async function with retry
 */
export async function asyncWithRetry<T, E = Error>(
  namespace: string,
  fn: () => Promise<T>,
  options: {
    retries?: number
    delayMs?: number
    onStart?: boolean
    onComplete?: boolean
    onError?: boolean
    label?: string
  } = {}
): Promise<AsyncResultWithError<T, E>> {
  const { retries = 0, delayMs = 1000, onStart, onComplete = true, onError = true, label } = options
  const logger = createLogger(namespace)
  const attemptLabel = label ? `${label}:attempt` : "attempt"

  for (let attempt = 0; attempt <= retries; attempt++) {
    const result = await asyncWithLogging(namespace, fn, {
      onStart: attempt === 0 ? onStart : onError,
      onComplete: false,
      onError: true,
      label: `${attemptLabel}:${attempt}`,
    })

    if (result.ok) {
      if (attempt > 0 && onComplete) {
        logger.info(`[${label ?? "retry"}] succeeded on attempt ${attempt}`)
      }
      return result
    }

    if (attempt < retries) {
      logger.warn(`[${attemptLabel}:${attempt}] failed, retrying in ${delayMs}ms...`)
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  return {
    ok: false,
    error: (await asyncWithLogging(namespace, fn, { onStart: false, onError: true, label: attemptLabel })).error as E,
    durationMs: 0,
  }
}

/**
 * Create domain-scoped wrapper
 */
export function createAsyncWrapper(namespace: string) {
  return {
    wrap<T, E = Error>(
      fn: () => Promise<T>,
      options?: AsyncWrapperOptions
    ): () => Promise<AsyncResultWithError<T, E>> {
      return () => asyncWithLogging(namespace, fn, options)
    },

    withTimeout<T>(
      promise: Promise<T>,
      timeoutMs: number,
      options?: AsyncWrapperOptions
    ): Promise<AsyncResultWithError<T, Error>> {
      return asyncWithTimeout(namespace, promise, timeoutMs, options)
    },

    withRetry<T, E = Error>(
      fn: () => Promise<T>,
      options?: {
        retries?: number
        delayMs?: number
        onStart?: boolean
        onComplete?: boolean
        onError?: boolean
        label?: string
      }
    ): Promise<AsyncResultWithError<T, E>> {
      return asyncWithRetry(namespace, fn, options)
    },
  }
}