import fc from 'fast-check'
import nodeRetry from 'retry'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTimeouts } from '../src/timeouts'

const options = fc.record({
  retries: fc.integer({ min: -1, max: 20 }),
  factor: fc.double({ min: 0, max: 4, noNaN: true }),
  minTimeout: fc.oneof(fc.integer({ min: -10, max: 10_000 }), fc.double({ min: 0, max: 10_000, noNaN: true })),
  maxTimeout: fc.oneof(fc.constant(Infinity), fc.integer({ min: 0, max: 100_000 })),
  randomize: fc.boolean(),
  forever: fc.boolean(),
}, { requiredKeys: [] })

const randoms = fc.array(fc.double({
  min: 0,
  max: 1,
  maxExcluded: true,
  noNaN: true,
}), { minLength: 1 })

// Runs `fn` with Math.random returning `sequence` in a loop.
function withRandom<T>(sequence: number[], fn: () => T): { value: T } | { error: string } {
  let i = 0
  vi.spyOn(Math, 'random').mockImplementation(() => sequence[i++ % sequence.length]!)
  try {
    return {
      value: fn(),
    }
  }
  catch (error) {
    return { error: (error as Error).message }
  }
  finally {
    vi.restoreAllMocks()
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createTimeouts', () => {
  it('matches retry.timeouts() from node-retry', () => {
    fc.assert(fc.property(options, randoms, (opts, sequence) => {
      const ours = withRandom(sequence, () => createTimeouts(opts))
      const theirs = withRandom(sequence, () => nodeRetry.timeouts(opts))
      expect(ours).toEqual(theirs)
    }))
  })

  it('uses the node-retry defaults', () => {
    expect(createTimeouts()).toEqual(nodeRetry.timeouts())
    expect(createTimeouts()).toEqual([
      1000,
      2000,
      4000,
      8000,
      16000,
      32000,
      64000,
      128000,
      256000,
      512000,
    ])
  })

  it('never goes above maxTimeout and gives one delay per retry', () => {
    fc.assert(fc.property(options, randoms, (opts, sequence) => {
      fc.pre((opts.minTimeout ?? 1000) <= (opts.maxTimeout ?? Infinity))
      const result = withRandom(sequence, () => createTimeouts(opts))
      if (!('value' in result))
        throw new Error(result.error)
      const retries = Math.max(0, Math.ceil(opts.retries ?? 10))
      expect(result.value).toHaveLength(retries || (opts.forever ? 1 : 0))
      for (const timeout of result.value)
        expect(timeout).toBeLessThanOrEqual(opts.maxTimeout ?? Infinity)
    }))
  })

  it('throws when minTimeout is greater than maxTimeout', () => {
    expect(() => createTimeouts({ minTimeout: 2, maxTimeout: 1 })).toThrow('minTimeout is greater than maxTimeout')
  })
})
