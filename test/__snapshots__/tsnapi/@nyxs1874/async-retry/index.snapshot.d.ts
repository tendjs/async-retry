// #region Types
export type Options = retry.Options;
export type RetryFunction<TRet, TErr = any> = retry.RetryFunction<TRet, TErr>;
// #endregion

// #region Namespaces
export declare namespace retry {
  export interface Options {
      retries?: number | undefined;
      factor?: number | undefined;
      minTimeout?: number | undefined;
      maxTimeout?: number | undefined;
      randomize?: boolean | undefined;
      forever?: boolean | undefined;
      unref?: boolean | undefined;
      maxRetryTime?: number | undefined;
      onRetry?: ((_: any, _: number) => unknown) | undefined;
      shouldRetry?: ((_: any, _: number) => boolean | PromiseLike<boolean>) | undefined;
    }
  export type RetryFunction<TRet, TErr = any> = (_: (_?: TErr) => void, _: number) => TRet | PromiseLike<TRet>;
  export const retry: Retry;
  const _default: Retry;
  export const default: Retry;
}
// #endregion

// #region Functions
export declare function retry<TRet>(_: retry.RetryFunction<TRet>, _?: retry.Options): Promise<TRet>;
// #endregion

// #region Default Export
declare namespace _default {
  export interface Options {
      retries?: number | undefined;
      factor?: number | undefined;
      minTimeout?: number | undefined;
      maxTimeout?: number | undefined;
      randomize?: boolean | undefined;
      forever?: boolean | undefined;
      unref?: boolean | undefined;
      maxRetryTime?: number | undefined;
      onRetry?: ((_: any, _: number) => unknown) | undefined;
      shouldRetry?: ((_: any, _: number) => boolean | PromiseLike<boolean>) | undefined;
    }
  export type RetryFunction<TRet, TErr = any> = (_: (_?: TErr) => void, _: number) => TRet | PromiseLike<TRet>;
  export const retry: Retry;
  const _default: Retry;
  export const default: Retry;
}
export default _default
// #endregion

// #region Referenced (internal)
type Retry = typeof retry;
// #endregion
