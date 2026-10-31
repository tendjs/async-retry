import type { Options, RetryFunction } from '../../dist/index.mjs'
// Type-checked by test/exports.test.ts against the built ESM types.
import retry, { retry as named } from '../../dist/index.mjs'

const options: Options = {
  retries: 2,
  onRetry: (_e: Error, _attempt: number) => {},
}
const sameOptions: retry.Options = options
const fn: RetryFunction<number> = (_bail, attempt) => attempt

export const results: Promise<number>[] = [
  retry(fn, sameOptions),
  named(fn),
  retry.retry(fn),
  retry.default(fn),
]

// @ts-expect-error the result type follows the function
export const wrong: Promise<string> = retry.retry(fn)
