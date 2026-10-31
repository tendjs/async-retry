// Behaviour kept from async-retry that the differential test cannot see.
import original from 'async-retry'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ours from '../src'

const implementations = [
  ['@tendjs/async-retry', ours],
  ['async-retry', original],
] as const

afterEach(() => {
  vi.restoreAllMocks()
})

describe.each(implementations)('%s', (_, retry) => {
  it.each([true, false])('unref: %s', async (unref) => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    await retry((_bail, attempt) => {
      if (attempt < 2)
        throw new Error('fail')
    }, { minTimeout: 1, randomize: false, unref })

    const timer = setTimeoutSpy.mock.results[0]!.value as NodeJS.Timeout
    expect(timer.hasRef()).toBe(!unref)
  })
})

describe('@tendjs/async-retry', () => {
  it('does not change the options object', async () => {
    const options = Object.freeze({ retries: 0 })

    await expect(ours(() => 1, options)).resolves.toBe(1)
    expect(options).toEqual({ retries: 0 })
  })
})
