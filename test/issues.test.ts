import type { Options, RetryFunction } from '../src'
// One describe per upstream issue this package fixes, plus bugs found while
// reading the upstream code.
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import retry from '../src'
import { settle, sleep } from './helpers'

// No random jitter, so delays are exact: 100, 200, 400, ...
const exact = { minTimeout: 100, randomize: false } satisfies Options

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('upstream #69: bail should prevent any further calls to the retrier function', () => {
  it('stops when the function throws after calling bail', async () => {
    const fn = vi.fn((bail: (error?: unknown) => void, attempt: number) => {
      if (attempt === 2)
        bail(new Error('stop'))
      throw new Error(`fail ${attempt}`)
    })
    const onRetry = vi.fn()

    const result = await settle(retry(fn, { ...exact, retries: 5, onRetry }))

    expect(result).toMatchObject({
      status: 'rejected',
      reason: { message: 'stop' },
    })
    expect(fn).toHaveBeenCalledTimes(2)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('stops when the async function rejects after calling bail', async () => {
    const fn = vi.fn(async (bail: (error?: unknown) => void) => {
      bail(new Error('stop'))
      throw new Error('fail')
    })
    const onRetry = vi.fn()

    const result = await settle(retry(fn, { ...exact, onRetry }))

    expect(result).toMatchObject({
      status: 'rejected',
      reason: { message: 'stop' },
    })
    expect(fn).toHaveBeenCalledTimes(1)
    expect(onRetry).not.toHaveBeenCalled()
  })

  it('clears a retry that is already scheduled', async () => {
    let bailLater: ((error?: unknown) => void) | undefined
    const fn = vi.fn((bail: (error?: unknown) => void) => {
      bailLater = bail
      throw new Error('fail')
    })

    const promise = retry(fn, exact)
    expect(vi.getTimerCount()).toBe(1)
    bailLater!()
    expect(vi.getTimerCount()).toBe(0)

    const result = await settle(promise)
    expect(result).toMatchObject({
      status: 'rejected',
      reason: { message: 'Aborted' },
    })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('ignores bail after the promise resolved', async () => {
    let bailLater: ((error?: unknown) => void) | undefined
    const result = await settle(retry((bail) => {
      bailLater = bail
      return 'done'
    }))

    bailLater!(new Error('too late'))
    expect(result).toEqual({ status: 'fulfilled', value: 'done' })
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('upstream #79: throw Error inside onRetry', () => {
  it('rejects with the error onRetry throws and stops', async () => {
    const thrown = new Error('from onRetry')
    const fn = vi.fn(() => {
      throw new Error('fail')
    })

    const result = await settle(retry(fn, {
      ...exact,
      onRetry: () => {
        throw thrown
      },
    }))

    expect(result).toEqual({ status: 'rejected', reason: thrown })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('rejects with the error an async onRetry rejects with and stops', async () => {
    const thrown = new Error('from onRetry')
    const fn = vi.fn(async () => {
      throw new Error('fail')
    })

    const result = await settle(retry(fn, {
      ...exact,
      onRetry: async () => {
        await sleep(10)
        throw thrown
      },
    }))

    expect(result).toEqual({ status: 'rejected', reason: thrown })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not start the next attempt when onRetry rejects after the delay', async () => {
    const thrown = new Error('from onRetry')
    const fn = vi.fn(() => {
      throw new Error('fail')
    })

    const result = await settle(retry(fn, {
      ...exact,
      onRetry: async () => {
        await sleep(500)
        throw thrown
      },
    }))

    expect(result).toEqual({ status: 'rejected', reason: thrown })
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('upstream #43: Can onRetry handle async functions?', () => {
  it('waits for an async onRetry before the next attempt', async () => {
    const start = Date.now()
    const times: number[] = []

    const result = await settle(retry((_bail, attempt) => {
      times.push(Date.now() - start)
      if (attempt < 3)
        throw new Error('fail')
      return attempt
    }, {
      ...exact,
      onRetry: () => sleep(1000),
    }))

    expect(result).toEqual({ status: 'fulfilled', value: 3 })
    expect(times).toEqual([0, 1000, 2000])
  })

  it('still waits for the delay when onRetry is faster', async () => {
    const start = Date.now()
    const times: number[] = []

    await settle(retry((_bail, attempt) => {
      times.push(Date.now() - start)
      if (attempt < 3)
        throw new Error('fail')
    }, {
      ...exact,
      onRetry: () => sleep(10),
    }))

    expect(times).toEqual([0, 100, 300])
  })
})

describe('upstream #51: Add option to decide if retry should be attempted?', () => {
  it('rejects with the error when shouldRetry returns false', async () => {
    const error = new Error('fatal')
    const fn = vi.fn(() => {
      throw error
    })
    const shouldRetry = vi.fn(() => false)

    const result = await settle(retry(fn, { ...exact, shouldRetry }))

    expect(result).toEqual({ status: 'rejected', reason: error })
    expect(fn).toHaveBeenCalledTimes(1)
    expect(shouldRetry).toHaveBeenCalledWith(error, 1)
  })

  it('keeps retrying while shouldRetry returns true', async () => {
    const result = await settle(retry((_bail, attempt) => {
      if (attempt < 3) {
        throw new Error(attempt === 1
          ? 'transient'
          : 'fatal')
      }
      return attempt
    }, {
      ...exact,
      shouldRetry: (error: Error) => error.message === 'transient',
    }))

    expect(result).toMatchObject({
      status: 'rejected',
      reason: { message: 'fatal' },
    })
  })

  it('accepts an async shouldRetry', async () => {
    const fn = vi.fn((_bail: unknown, attempt: number) => {
      if (attempt < 3)
        throw new Error('fail')
      return attempt
    })
    const shouldRetry = vi.fn(async (_error: unknown, attempt: number) => {
      await sleep(50)
      return attempt < 2
    })

    const result = await settle(retry(fn, { ...exact, shouldRetry }))

    expect(result).toMatchObject({
      status: 'rejected',
      reason: { message: 'fail' },
    })
    expect(fn).toHaveBeenCalledTimes(2)
    expect(shouldRetry).toHaveBeenCalledTimes(2)
  })

  it('rejects with the error shouldRetry throws', async () => {
    const thrown = new Error('from shouldRetry')

    const result = await settle(retry(() => {
      throw new Error('fail')
    }, {
      ...exact,
      shouldRetry: () => {
        throw thrown
      },
    }))

    expect(result).toEqual({ status: 'rejected', reason: thrown })
  })

  it('is skipped for errors with bail set and on success', async () => {
    const shouldRetry = vi.fn(() => true)
    const error = Object.assign(new Error('bail'), { bail: true })

    const failed = await settle(retry(() => {
      throw error
    }, { ...exact, shouldRetry }))
    const passed = await settle(retry(() => 1, { ...exact, shouldRetry }))

    expect(failed).toEqual({ status: 'rejected', reason: error })
    expect(passed).toEqual({ status: 'fulfilled', value: 1 })
    expect(shouldRetry).not.toHaveBeenCalled()
  })

  it('does not schedule a retry when bail is called while shouldRetry is pending', async () => {
    let bailLater: ((error?: unknown) => void) | undefined
    const fn = vi.fn((bail: (error?: unknown) => void) => {
      bailLater = bail
      throw new Error('fail')
    })

    const promise = retry(fn, {
      ...exact,
      shouldRetry: async () => {
        bailLater!(new Error('stop'))
        return true
      },
    })

    const result = await settle(promise)
    expect(result).toMatchObject({
      status: 'rejected',
      reason: { message: 'stop' },
    })
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('upstream #36: Types for Typescript', () => {
  it('ships types for the function and its options', () => {
    expectTypeOf(retry(() => 1)).toEqualTypeOf<Promise<number>>()
    expectTypeOf(retry(async () => 'a')).toEqualTypeOf<Promise<string>>()
    expectTypeOf<RetryFunction<number>>().returns.toEqualTypeOf<number | PromiseLike<number>>()
    expectTypeOf<retry.Options>().toEqualTypeOf<Options>()
  })

  it('accepts callbacks written against @types/async-retry', () => {
    const onRetry = (_e: Error, _attempt: number): void => {}
    const fn = async (bail: (e: Error) => void, _attempt: number): Promise<void> => bail(new Error('x'))
    expectTypeOf(onRetry).toExtend<NonNullable<Options['onRetry']>>()
    expectTypeOf(fn).toExtend<RetryFunction<void>>()
  })
})

describe('upstream #97: Option has no retries', () => {
  it('includes every option in the type', () => {
    expectTypeOf<Options>().toHaveProperty('retries')
    expectTypeOf<Options>().toHaveProperty('factor')
    expectTypeOf<Options>().toHaveProperty('minTimeout')
    expectTypeOf<Options>().toHaveProperty('maxTimeout')
    expectTypeOf<Options>().toHaveProperty('randomize')
    expectTypeOf<Options>().toHaveProperty('forever')
    expectTypeOf<Options>().toHaveProperty('unref')
    expectTypeOf<Options>().toHaveProperty('maxRetryTime')
    expectTypeOf<Options>().toHaveProperty('onRetry')
    expectTypeOf<Options>().toHaveProperty('shouldRetry')
  })
})

describe('upstream #92: The documentation for onRetry is wrong', () => {
  it('runs onRetry before the next attempt', async () => {
    const events: string[] = []

    await settle(retry((_bail, attempt) => {
      events.push(`attempt ${attempt}`)
      if (attempt < 3)
        throw new Error('fail')
    }, {
      ...exact,
      onRetry: (_error: unknown, attempt: number) => {
        events.push(`onRetry ${attempt}`)
      },
    }))

    expect(events).toEqual([
      'attempt 1',
      'onRetry 1',
      'attempt 2',
      'onRetry 2',
      'attempt 3',
    ])
  })
})

describe('falsy errors', () => {
  it.each([null, undefined, 0, '', false])('retries after throw %s', async (value) => {
    const result = await settle(retry((_bail, attempt) => {
      if (attempt < 3)
        throw value
      return attempt
    }, exact))

    expect(result).toEqual({ status: 'fulfilled', value: 3 })
  })

  it('retries after an async rejection with undefined', async () => {
    const result = await settle(retry(async (_bail, attempt) => {
      if (attempt < 2)
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(undefined)
      return attempt
    }, exact))

    expect(result).toEqual({ status: 'fulfilled', value: 2 })
  })

  it('rejects with the thrown value when retries run out', async () => {
    const fn = vi.fn(() => {
      // eslint-disable-next-line no-throw-literal
      throw null
    })

    const result = await settle(retry(fn, { ...exact, retries: 2 }))

    expect(result).toEqual({ status: 'rejected', reason: null })
    expect(fn).toHaveBeenCalledTimes(3)
  })
})

describe('retries: Infinity', () => {
  it('retries until the function succeeds', async () => {
    const result = await settle(retry((_bail, attempt) => {
      if (attempt < 100)
        throw new Error('fail')
      return attempt
    }, { ...exact, retries: Infinity, maxTimeout: 1000 }))

    expect(result).toEqual({ status: 'fulfilled', value: 100 })
  })

  it('grows the delay up to maxTimeout', async () => {
    const start = Date.now()
    const times: number[] = []

    await settle(retry((_bail, attempt) => {
      times.push(Date.now() - start)
      if (attempt < 6)
        throw new Error('fail')
    }, { ...exact, retries: Infinity, maxTimeout: 500 }))

    // delays: 100, 200, 400, 500, 500
    expect(times).toEqual([0, 100, 300, 700, 1200, 1700])
  })

  it('rejects with the last error after maxRetryTime', async () => {
    const result = await settle(retry((_bail, attempt) => {
      throw new Error(`fail ${attempt}`)
    }, { ...exact, retries: Infinity, maxRetryTime: 1000 }))

    // 0, 100, 300, 700, 1500: the attempt at 1500 is past maxRetryTime
    expect(result).toMatchObject({
      status: 'rejected',
      reason: { message: 'fail 5' },
    })
  })
})

describe('delays above 2^31-1 ms', () => {
  it('waits instead of firing after 1 ms', async () => {
    const fn = vi.fn(() => {
      throw new Error('fail')
    })

    const promise = retry(fn, { retries: 1, minTimeout: 2 ** 32, randomize: false })
    promise.catch(() => {})
    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(2 ** 31)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
