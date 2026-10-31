// Runs the built package on Node versions the test toolchain no longer
// supports (vitest and tsdown need Node 22+, the package supports 18+).
// CI builds on a current Node, then runs `node test/smoke.mjs` on 18 and 20.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import process from 'node:process'

const require = createRequire(import.meta.url)

const fast = { minTimeout: 1, factor: 1, randomize: false }

// A rejection here is unhandled, so node exits with code 1.
main().then(() => {
  process.stdout.write(`smoke test passed on Node ${process.version}\n`)
})

async function main() {
  const esm = await import(new URL('../dist/index.mjs', import.meta.url).href)
  const cjs = require('../dist/index.cjs')
  const entries = {
    'import default': esm.default,
    'import { retry }': esm.retry,
    'require()': cjs,
    'require().retry': cjs.retry,
    'require().default': cjs.default,
  }

  for (const [name, retry] of Object.entries(entries)) {
    assert.equal(typeof retry, 'function', name)

    const retried = []
    const value = await retry(async (_bail, attempt) => {
      if (attempt < 3)
        throw new Error(`fail ${attempt}`)
      return attempt
    }, {
      ...fast,
      onRetry: async (error, attempt) => {
        retried.push([error.message, attempt])
      },
    })
    assert.equal(value, 3, name)
    assert.deepEqual(retried, [
      ['fail 1', 1],
      ['fail 2', 2],
    ], name)

    await assert.rejects(retry(() => {
      throw new Error('always')
    }, { ...fast, retries: 2 }), { message: 'always' }, name)

    let calls = 0
    await assert.rejects(retry((bail) => {
      calls++
      bail(new Error('stop'))
      throw new Error('ignored')
    }, fast), { message: 'stop' }, name)
    assert.equal(calls, 1, name)

    await assert.rejects(retry(() => {
      throw new Error('fatal')
    }, {
      ...fast,
      shouldRetry: async () => false,
    }), { message: 'fatal' }, name)
  }
}
