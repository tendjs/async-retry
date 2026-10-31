import { defineConfig } from 'tsdown'
import { StaleGuardRecorder } from 'tsdown-stale-guard'

const shared = {
  dts: true,
  publint: true,
  attw: true,
}

/**
 * The two builds run in parallel, so each records its own stale-guard hash
 * file (test/helpers.ts checks both). Outputs are not hashed because each
 * recorder would read dist/ while the other build is still writing to it.
 */
function staleGuard(name: string): ReturnType<typeof StaleGuardRecorder> {
  return StaleGuardRecorder({
    hashFile: `node_modules/.cache/tsdown-stale-guard/${name}.yaml`,
    hashOutputs: false,
  })
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
    plugins: [
      staleGuard('esm'),
    ],
  },
  {
    ...shared,
    entry: { index: 'src/index.cjs.ts' },
    format: 'cjs',
    clean: false,
    plugins: [
      staleGuard('cjs'),
    ],
  },
])
