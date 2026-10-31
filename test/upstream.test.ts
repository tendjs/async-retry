// Port of the upstream test suite (vercel/async-retry test/index.js).
// Each test runs against this package and against the original, which proves
// the port is faithful. Network calls are replaced by local stand-ins, and
// assertions no longer live only inside `catch`, where a resolved promise
// would have skipped them.
import original from 'async-retry'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ours from '../src'
import { settle, sleep } from './helpers'

const implementations = [
  ['@tendjs/async-retry', ours],
  ['async-retry', original],
] as const

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe.each(implementations)('%s', (_, retry) => {
  it('return value', async () => {
    const result = await settle(retry(async (_bail, num) => {
      if (num < 2)
        throw new Error('woot')
      await sleep(50)
      return `woot ${num}`
    }))

    expect(result).toEqual({ status: 'fulfilled', value: 'woot 2' })
  })

  it('return value no await', async () => {
    const result = await settle(retry(async (_bail, num) => num))

    expect(result).toEqual({ status: 'fulfilled', value: 1 })
  })

  it('chained promise', async () => {
    // Upstream fetched https://www.wikipedia.org here.
    const fetchOk = async (): Promise<{ status: number }> => {
      await sleep(20)
      return { status: 200 }
    }

    const result = await settle(retry(async (_bail, num) => {
      if (num < 2)
        throw new Error('retry')
      return fetchOk()
    }))

    expect(result).toEqual({
      status: 'fulfilled',
      value: { status: 200 },
    })
  })

  it('bail', async () => {
    const result = await settle(retry(async (bail, num) => {
      if (num === 2)
        bail(new Error('Wont retry'))
      throw new Error(`Test ${num}`)
    }, { retries: 3 }))

    expect(result.status).toBe('rejected')
    expect(result.status === 'rejected' && result.reason.message).toBe('Wont retry')
  })

  it('bail + return', async () => {
    const result = await settle(Promise.resolve(retry(async (bail) => {
      await sleep(200)
      await sleep(200)
      bail(new Error('woot'))
    })))

    expect(result.status).toBe('rejected')
    expect(result.status === 'rejected' && result.reason.message).toBe('woot')
  })

  it('bail error', async () => {
    let retries = 0

    const result = await settle(retry(async () => {
      retries += 1
      await sleep(100)
      const err = new Error('Wont retry') as Error & { bail?: boolean }
      err.bail = true
      throw err
    }, { retries: 3 }))

    expect(result.status).toBe('rejected')
    expect(result.status === 'rejected' && result.reason.message).toBe('Wont retry')
    expect(retries).toBe(1)
  })

  it('with non-async functions', async () => {
    const result = await settle(retry((_bail, num) => {
      throw new Error(`Test ${num}`)
    }, { retries: 2 }))

    expect(result.status).toBe('rejected')
    expect(result.status === 'rejected' && result.reason.message).toBe('Test 3')
  })

  it('return non-async', async () => {
    const result = await settle(retry(() => 5))

    expect(result).toEqual({ status: 'fulfilled', value: 5 })
  })

  it('with number of retries', async () => {
    // Upstream fetched https://www.fakewikipedia.org, which fails to resolve.
    const fetchFails = async (): Promise<never> => {
      await sleep(20)
      throw new Error('getaddrinfo ENOTFOUND www.fakewikipedia.org')
    }
    let retries = 0

    const result = await settle(retry(() => fetchFails(), {
      retries: 2,
      onRetry: (err: unknown, i: number) => {
        expect(err).toBeInstanceOf(Error)
        retries = i
      },
    }))

    expect(result.status).toBe('rejected')
    expect(retries).toBe(2)
  })
})
