import { defineConfig } from 'tsdown'
import { StaleGuardRecorder } from 'tsdown-stale-guard'

const shared = {
  dts: true,
  publint: true,
  attw: true,
  plugins: [
    StaleGuardRecorder(),
  ],
}

/**
 * Drop-in replacements must keep working for require() users. The CJS entry
 * has a single default export, so it builds to `module.exports = retry` and
 * `require('@tendjs/async-retry')` returns the function, like async-retry.
 */
export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    format: 'esm',
  },
  {
    ...shared,
    entry: { index: 'src/index.cjs.ts' },
    format: 'cjs',
    clean: false,
  },
])
