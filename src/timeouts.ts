// The delay calculation from node-retry (`retry.timeouts()`), so existing
// users get the same delays.

export interface TimeoutOptions {
  retries?: number
  factor?: number
  minTimeout?: number
  maxTimeout?: number
  randomize?: boolean
  forever?: boolean
}

export type ResolvedTimeoutOptions = TimeoutOptions & {
  retries: number
  factor: number
  minTimeout: number
  maxTimeout: number
  randomize: boolean
}

const defaults = {
  retries: 10,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: Infinity,
  randomize: false,
}

/** Fills in the node-retry defaults. An explicit `undefined` wins over a default, like in node-retry. */
export function resolveTimeoutOptions(options: TimeoutOptions = {}): ResolvedTimeoutOptions {
  const opts = {
    ...defaults,
    ...options,
  } as ResolvedTimeoutOptions
  if (opts.minTimeout > opts.maxTimeout)
    throw new Error('minTimeout is greater than maxTimeout')
  return opts
}

/** Delay before retry number `attempt` (0-based). */
export function createTimeout(attempt: number, opts: ResolvedTimeoutOptions): number {
  const random = opts.randomize
    ? Math.random() + 1
    : 1
  const timeout = Math.round(random * Math.max(opts.minTimeout, 1) * opts.factor ** attempt)
  return Math.min(timeout, opts.maxTimeout)
}

/** All delays up front, sorted ascending. Same result as `retry.timeouts()`. */
export function createTimeouts(options: TimeoutOptions = {}): number[] {
  const opts = resolveTimeoutOptions(options)
  const timeouts: number[] = []
  let i = 0
  for (; i < opts.retries; i++)
    timeouts.push(createTimeout(i, opts))
  if (opts.forever && !timeouts.length)
    timeouts.push(createTimeout(i, opts))
  return timeouts.sort((a, b) => a - b)
}
