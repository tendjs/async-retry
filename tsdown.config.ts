import { defineConfig } from 'tsdown'
import { StaleGuardRecorder } from 'tsdown-stale-guard'

export default defineConfig({
  entry: [
    'src/index.ts',
  ],
  // Drop-in replacements must keep working for require() users.
  format: ['esm', 'cjs'],
  dts: true,
  exports: true,
  publint: true,
  attw: true,
  plugins: [
    StaleGuardRecorder(),
  ],
})
