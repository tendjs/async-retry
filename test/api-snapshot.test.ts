import { readFile } from 'node:fs/promises'
import { extractDts, extractRuntime } from 'tsnapi'
import { beforeAll, describe, expect, it } from 'vitest'
import { guardBuild } from './helpers'

const snapshots = '__snapshots__/tsnapi/@tendjs/async-retry'

function read(file: string): Promise<string> {
  return readFile(new URL(`../dist/${file}`, import.meta.url), 'utf8')
}

// snapshotApiPerEntry() keys entries by export path, so the `require` branch
// of "." replaces the `import` one, and it cannot read `export =`. Snapshot
// each build separately instead.
describe('api snapshot', () => {
  beforeAll(guardBuild)

  it('esm runtime', async () => {
    await expect(await extractRuntime('index.mjs', await read('index.mjs')))
      .toMatchFileSnapshot(`${snapshots}/index.snapshot.js`)
  })

  it('esm types', async () => {
    await expect(await extractDts('index.d.mts', await read('index.d.mts')))
      .toMatchFileSnapshot(`${snapshots}/index.snapshot.d.ts`)
  })

  it('commonjs types', async () => {
    await expect(await read('index.d.cts'))
      .toMatchFileSnapshot(`${snapshots}/index.snapshot.d.cts`)
  })
})
