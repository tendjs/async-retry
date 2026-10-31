import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { one, two } from '../src'

// Example of the two test styles every package uses: an example-based test per
// behaviour (or per upstream issue) and a property test for invariants.
describe('placeholder', () => {
  it('exports constants', () => {
    expect(one).toBe(1)
    expect(two).toBe(2)
  })

  it('property: one + n is always n + one', () => {
    fc.assert(fc.property(fc.integer(), n => one + n === n + one))
  })
})
