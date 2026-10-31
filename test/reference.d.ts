// The original packages, used as reference implementations in tests.
// Neither ships types, so declare just what the tests touch.

declare module 'async-retry' {
  const retry: (
    fn: (bail: (error?: unknown) => void, attempt: number) => unknown,
    options?: Record<string, unknown>,
  ) => Promise<any>
  export default retry
}

declare module 'retry' {
  const retry: {
    timeouts: (options?: Record<string, unknown>) => number[]
  }
  export default retry
}
