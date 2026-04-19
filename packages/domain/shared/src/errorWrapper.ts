/**
 * Error Wrapper Utility - Railway-Oriented Programming
 * Berdasarkan pola master_002: Error Handling Pattern
 *
 * @example
 * const result = await errorWrapper(async () => {
 *   return await riskyOperation()
 * }, { source: "compile", code: "OP_FAILED" })
 */

import { TwError } from "./errors"

export interface ErrorWrapperOptions {
  source: "rust" | "validation" | "compile" | "io" | "config" | "unknown"
  code: string
  message?: string
}

export interface WrappedResult<T> {
  ok: true
  value: T
}

export interface WrappedError {
  ok: false
  error: TwError
}

export type Result<T> = WrappedResult<T> | WrappedError

/**
 * Wrap async function with error handling
 */
export async function errorWrapper<T>(
  fn: () => Promise<T>,
  options: ErrorWrapperOptions
): Promise<Result<T>> {
  try {
    const value = await fn()
    return { ok: true, value }
  } catch (err) {
    return {
      ok: false,
      error: TwError.wrap(options.source, options.code, err instanceof Error ? err.message : String(err)),
    }
  }
}

/**
 * Wrap sync function with error handling
 */
export function errorWrapperSync<T>(
  fn: () => T,
  options: ErrorWrapperOptions
): Result<T> {
  try {
    const value = fn()
    return { ok: true, value }
  } catch (err) {
    return {
      ok: false,
      error: TwError.wrap(options.source, options.code, err instanceof Error ? err.message : String(err)),
    }
  }
}

/**
 * Map over result value
 */
export function mapResult<T, U>(result: Result<T>, fn: (value: T) => U): Result<U> {
  if (result.ok) {
    return { ok: true, value: fn(result.value) }
  }
  return result
}

/**
 * FlatMap over result value
 */
export function flatMapResult<T, U>(result: Result<T>, fn: (value: T) => Result<U>): Result<U> {
  if (result.ok) {
    return fn(result.value)
  }
  return result
}

/**
 * Match result to value
 */
export function matchResult<T, R>(
  result: Result<T>,
  patterns: { ok: (value: T) => R; err: (error: TwError) => R }
): R {
  return result.ok ? patterns.ok(result.value) : patterns.err(result.error)
}