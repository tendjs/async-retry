import { fileURLToPath } from 'node:url'
import { guardStaleBuild } from 'tsdown-stale-guard'
import { vi } from 'vitest'

export type Settled<T>
  = | { status: 'fulfilled', value: T }
    | { status: 'rejected', reason: any }

/**
 * Runs fake timers until nothing is scheduled any more, then returns how the
 * promise settled. Tests use fake timers so the default 1s+ delays run instantly.
 */
export async function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  const result = promise.then(
    value => ({ status: 'fulfilled', value }) as const,
    (reason: unknown) => ({ status: 'rejected', reason }) as const,
  )
  await vi.runAllTimersAsync()
  return result
}

/** Fails when dist/ is older than the sources. tsdown.config.ts writes one hash file per build. */
export async function guardBuild(): Promise<void> {
  const root = fileURLToPath(new URL('..', import.meta.url))
  for (const name of ['esm', 'cjs'])
    await guardStaleBuild({ root, hashFile: `node_modules/.cache/tsdown-stale-guard/${name}.yaml` })
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
