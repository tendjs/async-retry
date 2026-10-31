import type { Options, RetryFunction } from '../../dist/index.cjs'
// Type-checked by test/exports.test.ts against the built CommonJS types.
import retry = require('../../dist/index.cjs')

const options: Options = {
  retries: 2,
  onRetry: (_e: Error, _attempt: number) => {},
}
const sameOptions: retry.Options = options
const fn: RetryFunction<number> = (_bail, attempt) => attempt

const results: Promise<number>[] = [
  retry(fn, sameOptions),
  retry.retry(fn),
  retry.default(fn),
]

// @ts-expect-error the result type follows the function
const wrong: Promise<string> = retry.retry(fn)

export = { results, wrong }
