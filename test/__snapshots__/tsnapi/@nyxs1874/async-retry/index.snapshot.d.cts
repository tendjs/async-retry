/**
 * Calls `fn` until it returns or resolves, waiting longer after each failure.
 * Rejects with the most common error once retries run out.
 */
declare function retry<TRet>(fn: retry.RetryFunction<TRet>, options?: retry.Options): Promise<TRet>;
type Retry = typeof retry;
declare namespace retry {
  export interface Options {
    /** How many times to retry after the first attempt. Default `10`. `Infinity` retries until success. */
    retries?: number | undefined;
    /** Growth factor between delays. Default `2`. */
    factor?: number | undefined;
    /** Delay before the first retry, in ms. Default `1000`. */
    minTimeout?: number | undefined;
    /** Upper bound for a delay, in ms. Default `Infinity`. */
    maxTimeout?: number | undefined;
    /** Multiply each delay by a random factor between 1 and 2. Default `true`. */
    randomize?: boolean | undefined;
    /** Keep retrying with the longest delay once retries run out. Default `false`. */
    forever?: boolean | undefined;
    /** Let the process exit while a retry is waiting. Default `false`. */
    unref?: boolean | undefined;
    /** Stop retrying after this many ms since the first attempt. Default `Infinity`. */
    maxRetryTime?: number | undefined;
    /**
     * Runs after an attempt fails and before the next one starts. If it
     * returns a promise, the next attempt waits for it. If it throws or
     * rejects, retrying stops with that error.
     */
    onRetry?: ((error: any, attempt: number) => unknown) | undefined;
    /**
     * Runs after an attempt fails. Return `false` (or a promise of `false`)
     * to stop and reject with that error. Not called for errors with `bail` set.
     */
    shouldRetry?: ((error: any, attempt: number) => boolean | PromiseLike<boolean>) | undefined;
  }
  /** `bail(error)` stops retrying and rejects with `error`, or with `Error('Aborted')` when called without one. */
  export type RetryFunction<TRet, TErr = any> = (bail: (error?: TErr) => void, attempt: number) => TRet | PromiseLike<TRet>;
  export const retry: Retry;
  const _default: Retry;
  export { _default as default };
}
export = retry;