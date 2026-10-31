// Checks the built package the way users load it. Paths live in variables so
// tsc does not try to resolve dist/ during typecheck.
import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { beforeAll, describe, expect, it } from 'vitest'
import cjsEntry from '../src/index.cjs'
import { guardBuild } from './helpers'

const root = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(import.meta.url)
const esmPath = new URL('../dist/index.mjs', import.meta.url).href
const cjsPath = fileURLToPath(new URL('../dist/index.cjs', import.meta.url))

beforeAll(guardBuild)

describe('upstream #103: (0 , async_retry_1.retry) is not a function', () => {
  it('require() returns the function, with .retry and .default', () => {
    const retry = require(cjsPath)

    expect(typeof retry).toBe('function')
    expect(retry.retry).toBe(retry)
    expect(retry.default).toBe(retry)
  })

  it('the ESM build has a default and a named export', async () => {
    const mod = await import(esmPath)

    expect(typeof mod.default).toBe('function')
    expect(mod.retry).toBe(mod.default)
    expect(Object.keys(mod).sort()).toEqual(['default', 'retry'])
  })

  it('the CommonJS entry has a single default export', () => {
    expect(cjsEntry.retry).toBe(cjsEntry)
    expect(cjsEntry.default).toBe(cjsEntry)
  })

  it('the built types work from ESM and CommonJS', async () => {
    const tsc = require.resolve('typescript/bin/tsc')
    const fixtures = ['test/fixtures/types.mts', 'test/fixtures/types.cts']
    const args = [
      '--ignoreConfig',
      '--noEmit',
      '--strict',
      '--module',
      'nodenext',
      '--moduleResolution',
      'nodenext',
      ...fixtures,
    ]

    await expect(promisify(execFile)(process.execPath, [tsc, ...args], { cwd: root })).resolves.toBeDefined()
  }, 60_000)
})
