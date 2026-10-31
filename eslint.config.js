// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    pnpm: true,
    antislop: true,
    // Consumer code that imports dist/ the way users do, including require().
    ignores: ['test/fixtures'],
  },
)
