import { createTimeout, createTimeouts, resolveTimeoutOptions } from './timeouts'

// setTimeout keeps delays in a signed 32-bit int. Node fires anything larger
// after 1 ms, so cap it.
const MAX_DELAY = 2 ** 31 - 1

/**
 * Calls `fn` until it returns or resolves, waiting longer after each failure.
 * Rejects with the most common error once retries run out.
 */
export function retry<TRet>(fn: retry.RetryFunction<TRet>, options: retry.Options = {}): Promise<TRet> {
  return new Promise<TRet>((resolve, reject) => {
    const opts = { randomize: true, ...options }
    const timing = resolveTimeoutOptions(opts)
    // node-retry loops forever building the delay list for Infinity, so
    // compute those delays one at a time instead.
    const infinite = timing.retries === Infinity
    const timeouts = infinite
      ? []
      : createTimeouts(timing)
    const forever = Boolean(opts.forever) || infinite
    const maxRetryTime = opts.maxRetryTime || Infinity
    const errors: unknown[] = []
    const start = Date.now()
    let timer: ReturnType<typeof setTimeout> | undefined
    let done = false

    function stop(error: unknown): void {
      done = true
      clearTimeout(timer)
      reject(error)
    }

    function bail(error?: unknown): void {
      stop(error || new Error('Aborted'))
    }

    function attempt(n: number): void {
      if (done)
        return
      let value: TRet | PromiseLike<TRet>
      try {
        value = fn(bail, n)
      }
      catch (error) {
        onError(error, n)
        return
      }
      Promise.resolve(value)
        .then(resolve)
        .catch((error: unknown) => onError(error, n))
    }

    function onError(error: unknown, n: number): void {
      if (done)
        return
      if ((error as { bail?: unknown } | null)?.bail) {
        bail(error)
        return
      }
      if (!opts.shouldRetry) {
        schedule(error, n)
        return
      }
      const { shouldRetry } = opts
      new Promise<boolean>(resolve => resolve(shouldRetry(error, n)))
        .then((retryIt) => {
          if (retryIt)
            schedule(error, n)
          else
            stop(error)
        }, stop)
    }

    function schedule(error: unknown, n: number): void {
      if (done)
        return
      errors.push(error)
      if (Date.now() - start >= maxRetryTime) {
        errors.unshift(new Error('RetryOperation timeout occurred'))
        stop(mainError(errors))
        return
      }

      let delay = timeouts[n - 1]
      if (delay === undefined) {
        if (!forever) {
          stop(mainError(errors))
          return
        }
        // Retrying forever: keep only the last error.
        errors.splice(0, errors.length - 1)
        delay = infinite
          ? createTimeout(n - 1, timing)
          : timeouts.at(-1)!
      }

      let hook: Promise<void> | undefined
      timer = setTimeout(() => {
        if (hook)
          void hook.then(() => attempt(n + 1))
        else
          attempt(n + 1)
      }, Math.min(delay, MAX_DELAY))
      if (opts.unref)
        timer.unref()

      if (!opts.onRetry)
        return
      try {
        const result = opts.onRetry(error, n)
        if (isThenable(result))
          hook = Promise.resolve(result).then(() => {}, stop)
      }
      catch (error) {
        stop(error)
      }
    }

    attempt(1)
  })
}
Object.assign(retry, { retry, default: retry })

/** The error whose message came up most often. Ties go to the later error. */
function mainError(errors: unknown[]): unknown {
  const counts = new Map<unknown, number>()
  let main: unknown
  let mainCount = 0
  for (const error of errors) {
    const message = (error as { message?: unknown } | null)?.message
    const count = (counts.get(message) ?? 0) + 1
    counts.set(message, count)
    if (count >= mainCount) {
      main = error
      mainCount = count
    }
  }
  return main
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as PromiseLike<unknown> | null)?.then === 'function'
}

type Retry = typeof retry

// eslint-disable-next-line ts/no-namespace
export declare namespace retry {
  export interface Options {
    /** How many times to retry after the first attempt. Default `10`. `Infinity` retries until success. */
    retries?: number | undefined
    /** Growth factor between delays. Default `2`. */
    factor?: number | undefined
    /** Delay before the first retry, in ms. Default `1000`. */
    minTimeout?: number | undefined
    /** Upper bound for a delay, in ms. Default `Infinity`. */
    maxTimeout?: number | undefined
    /** Multiply each delay by a random factor between 1 and 2. Default `true`. */
    randomize?: boolean | undefined
    /** Keep retrying with the longest delay once retries run out. Default `false`. */
    forever?: boolean | undefined
    /** Let the process exit while a retry is waiting. Default `false`. */
    unref?: boolean | undefined
    /** Stop retrying after this many ms since the first attempt. Default `Infinity`. */
    maxRetryTime?: number | undefined
    /**
     * Runs after an attempt fails and before the next one starts. If it
     * returns a promise, the next attempt waits for it. If it throws or
     * rejects, retrying stops with that error.
     */
    onRetry?: ((error: any, attempt: number) => unknown) | undefined
    /**
     * Runs after an attempt fails. Return `false` (or a promise of `false`)
     * to stop and reject with that error. Not called for errors with `bail` set.
     */
    shouldRetry?: ((error: any, attempt: number) => boolean | PromiseLike<boolean>) | undefined
  }
  /** `bail(error)` stops retrying and rejects with `error`, or with `Error('Aborted')` when called without one. */
  export type RetryFunction<TRet, TErr = any> = (bail: (error?: TErr) => void, attempt: number) => TRet | PromiseLike<TRet>
  export const retry: Retry
  const _default: Retry
  export { _default as default }
}
