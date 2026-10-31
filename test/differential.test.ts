// Random scenarios run through this package and through the original under
// fake timers. Both must call the function at the same times, call onRetry
// with the same arguments and settle the same way.
//
// Left out on purpose, because they are the bugs this package fixes: throwing
// after bail(), onRetry throwing, falsy errors and retries: Infinity.
import original from 'async-retry'
import fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ours from '../src'
import { settle, sleep } from './helpers'

type Retry = typeof original

type Step
  = | { kind: 'return' | 'resolve' }
    | { kind: 'throw' | 'reject' | 'throwBail', message: string }
    | { kind: 'bail', message: string | undefined }

interface Scenario {
  steps: Step[]
  /** Async steps wait this long before they settle. */
  wait: number
  options: Record<string, unknown>
  randoms: number[]
}

const message = fc.constantFrom('a', 'b', 'c')

const step: fc.Arbitrary<Step> = fc.oneof(
  {
    weight: 1,
    arbitrary: fc.record({
      kind: fc.constantFrom('return' as const, 'resolve' as const),
    }),
  },
  {
    weight: 6,
    arbitrary: fc.record({
      kind: fc.constantFrom('throw' as const, 'reject' as const),
      message,
    }),
  },
  {
    weight: 1,
    arbitrary: fc.record({
      kind: fc.constant('throwBail' as const),
      message,
    }),
  },
  {
    weight: 1,
    arbitrary: fc.record({
      kind: fc.constant('bail' as const),
      message: fc.option(message, { nil: undefined }),
    }),
  },
)

const scenario: fc.Arbitrary<Scenario> = fc.record({
  steps: fc.array(step, { maxLength: 12 }),
  wait: fc.integer({ min: 0, max: 3000 }),
  options: fc.record({
    retries: fc.integer({ min: 0, max: 8 }),
    factor: fc.oneof(fc.constant(2), fc.double({ min: 0.5, max: 3, noNaN: true })),
    minTimeout: fc.oneof(fc.constant(100), fc.integer({ min: 0, max: 3000 })),
    maxTimeout: fc.oneof(fc.constant(Infinity), fc.integer({ min: 0, max: 6000 })),
    randomize: fc.boolean(),
    forever: fc.boolean(),
    // With factor 2 and minTimeout 100, attempts start at 0, 100, 300, 700, ...
    // The constants hit the `>=` boundary of maxRetryTime, and 0 means no limit.
    maxRetryTime: fc.oneof(fc.constantFrom(0, 100, 300, 700, 1500), fc.integer({ min: 0, max: 20_000 })),
  }, { requiredKeys: [] }),
  randoms: fc.array(fc.double({
    min: 0,
    max: 1,
    maxExcluded: true,
    noNaN: true,
  }), { minLength: 1, maxLength: 5 }),
})

function describeError(error: any): unknown {
  return error instanceof Error
    ? { message: error.message, id: (error as any).id }
    : error
}

async function trace(retry: Retry, { steps, wait, options, randoms }: Scenario): Promise<unknown> {
  let i = 0
  vi.spyOn(Math, 'random').mockImplementation(() => randoms[i++ % randoms.length]!)
  const start = Date.now()
  const calls: unknown[] = []

  // `return`, `throw` and `throwBail` happen synchronously, the other steps
  // after `wait` ms. The original handles the two on different code paths.
  const fn = (bail: (error?: unknown) => void, attempt: number): unknown => {
    calls.push(['attempt', attempt, Date.now() - start])
    // After the scripted steps, succeed so `forever` ends.
    const current = steps[attempt - 1] ?? { kind: 'return' }
    const error = 'message' in current && current.message !== undefined
      ? Object.assign(new Error(current.message), { id: attempt })
      : undefined

    switch (current.kind) {
      case 'return':
        return attempt
      case 'throw':
        throw error
      case 'throwBail':
        throw Object.assign(error!, { bail: true })
    }
    return sleep(wait).then(() => {
      if (current.kind === 'resolve')
        return attempt
      if (current.kind === 'bail')
        return bail(error)
      throw error
    })
  }

  const outcome = await settle(retry(fn, {
    ...options,
    onRetry: (error: unknown, attempt: number) => {
      calls.push([
        'onRetry',
        describeError(error),
        attempt,
        Date.now() - start,
      ])
    },
  }))
  vi.restoreAllMocks()

  return {
    calls,
    outcome: outcome.status === 'fulfilled'
      ? outcome
      : {
          status: 'rejected',
          reason: describeError(outcome.reason),
        },
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('differential against async-retry', () => {
  it('behaves the same for random scenarios', async () => {
    await fc.assert(fc.asyncProperty(scenario, async (s) => {
      expect(await trace(ours, s)).toEqual(await trace(original, s))
    }), { numRuns: 1000 })
  })

  it('keeps the attempt count at retries + 1', async () => {
    await fc.assert(fc.asyncProperty(fc.integer({ min: 0, max: 15 }), async (retries) => {
      const fn = vi.fn(() => {
        throw new Error('fail')
      })
      await settle(ours(fn, { retries }))
      expect(fn).toHaveBeenCalledTimes(retries + 1)
    }))
  })
})
