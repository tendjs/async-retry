# @nyxs1874/async-retry

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![CI][ci-src]][ci-href]
[![License][license-src]][license-href]

Maintained, drop-in replacement for [`async-retry`](https://www.npmjs.com/package/async-retry).

Calls an async (or sync) function until it succeeds, waiting longer after each failure. Same API and same delays as `async-retry`, without the `retry` dependency.

- Same API as `async-retry`. Its test suite is ported and runs against both packages
- Fixes long-standing upstream issues (see below)
- TypeScript types included
- ESM and CommonJS
- Zero dependencies
- 100% test coverage

## Install

```sh
npm i @nyxs1874/async-retry
```

## Migrating from `async-retry`

```diff
- import retry from 'async-retry'
+ import retry from '@nyxs1874/async-retry'
```

If you used `@types/async-retry`, remove it. Types ship with the package, and `retry.Options` and `retry.RetryFunction` still work.

To switch without touching code (including transitive usage), alias it:

```jsonc
// package.json
{
  "overrides": { "async-retry": "npm:@nyxs1874/async-retry@^1" }, // npm
  "pnpm": { "overrides": { "async-retry": "npm:@nyxs1874/async-retry@^1" } }, // pnpm
  "resolutions": { "async-retry": "npm:@nyxs1874/async-retry@^1" } // yarn
}
```

## Usage

```js
import retry from '@nyxs1874/async-retry'

const data = await retry(
  async (bail) => {
    // if anything throws, we retry
    const res = await fetch('https://example.com')

    if (res.status === 403) {
      // don't retry on 403
      bail(new Error('Unauthorized'))
      return
    }

    return res.text()
  },
  { retries: 5 },
)
```

`require('@nyxs1874/async-retry')` returns the function, like `async-retry` did. `import { retry } from '@nyxs1874/async-retry'` works as well.

### API

```ts
function retry<T>(
  fn: (bail: (error?: unknown) => void, attempt: number) => T | Promise<T>,
  options?: Options,
): Promise<T>
```

`fn` can be async or not. It gets two arguments:

1. `bail(error?)`: stops retrying and rejects with `error`, or with `Error('Aborted')` if you pass nothing. After that, neither `fn` nor `onRetry` is called again.
2. `attempt`: the attempt number. The first call is `1`.

Throwing an error that has `bail: true` set also stops retrying.

When retries run out, the promise rejects with the error whose message came up most often (ties go to the later one).

### Options

| Option | Default | |
|---|---|---|
| `retries` | `10` | How many times to retry after the first attempt. `Infinity` retries until success. |
| `factor` | `2` | Exponential factor between delays. |
| `minTimeout` | `1000` | Milliseconds before the first retry. |
| `maxTimeout` | `Infinity` | Maximum milliseconds between two retries. |
| `randomize` | `true` | Multiply each delay by a random factor between 1 and 2. |
| `forever` | `false` | Keep retrying with the longest delay once `retries` run out. |
| `maxRetryTime` | `Infinity` | Stop retrying this many milliseconds after the first attempt. |
| `unref` | `false` | Don't keep the process alive while waiting for a retry. |
| `onRetry(error, attempt)` | | Runs after an attempt fails and before the next one starts. If it returns a promise, the next attempt waits for it. If it throws or rejects, retrying stops with that error. |
| `shouldRetry(error, attempt)` | | Runs after an attempt fails. Return `false` (or a promise of `false`) to stop and reject with that error. |

Delays are computed like [`retry`](https://github.com/tim-kos/node-retry) does it: `minTimeout * factor ** n`, times the random factor, capped at `maxTimeout`.

## Fixed upstream issues

| Upstream issue | Fix | Test |
|---|---|---|
| [#69](https://github.com/vercel/async-retry/issues/69) | `bail()` stops retrying for good. Upstream kept retrying if the function threw after calling `bail()`, and a retry that was already scheduled still ran. | `upstream #69: bail should prevent any further calls to the retrier function` |
| [#79](https://github.com/vercel/async-retry/issues/79) | An error thrown in `onRetry` (or a rejected promise) rejects the retry promise. Upstream lost the error and kept retrying. | `upstream #79: throw Error inside onRetry` |
| [#43](https://github.com/vercel/async-retry/issues/43) | An async `onRetry` is awaited before the next attempt. | `upstream #43: Can onRetry handle async functions?` |
| [#51](https://github.com/vercel/async-retry/issues/51) | New `shouldRetry` option. | `upstream #51: Add option to decide if retry should be attempted?` |
| [#36](https://github.com/vercel/async-retry/issues/36), [#97](https://github.com/vercel/async-retry/issues/97) | Types ship with the package and include every option. | `upstream #36: Types for Typescript`, `upstream #97: Option has no retries` |
| [#103](https://github.com/vercel/async-retry/issues/103) | `import { retry }` works from ESM and CommonJS. | `upstream #103: (0 , async_retry_1.retry) is not a function` |
| [#92](https://github.com/vercel/async-retry/issues/92) | The docs say `onRetry` runs before the next attempt, which is what it does. | `upstream #92: The documentation for onRetry is wrong` |

Bugs I found while reading the code, without an upstream issue:

- `throw null` or `throw undefined` crashed with a `TypeError` and, from an async function, left the promise pending forever. Other falsy values (`0`, `''`, `false`) stopped retrying. All of them are now retried like any other error.
- `retries: Infinity` hung the process: `retry` tried to build an infinite list of delays. Now it retries until success, with delays growing up to `maxTimeout`.
- Delays above 2^31-1 ms (about 24.8 days) fired after 1 ms, because that is what `setTimeout` does with them. They are capped instead.

## Differences from `async-retry`

Apart from the fixes above:

- The options object you pass is not modified. `async-retry` set `options.randomize = true` on it.

Any other behaviour difference is a bug. Please [open an issue](https://github.com/nyxs1874/async-retry/issues).

## Credits

Based on [`async-retry`](https://github.com/vercel/async-retry) by Guillermo Rauch and Leo Lamprecht (Vercel). The delay calculation follows [`retry`](https://github.com/tim-kos/node-retry) by Tim Koschützki. See [NOTICE.md](./NOTICE.md). Project setup based on [antfu/starter-ts](https://github.com/antfu/starter-ts).

## License

[MIT](./LICENSE.md) License © [Adnan Labiadh](https://github.com/nyxs1874)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@nyxs1874/async-retry?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmx.dev/package/@nyxs1874/async-retry
[npm-downloads-src]: https://img.shields.io/npm/dm/@nyxs1874/async-retry?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmx.dev/package/@nyxs1874/async-retry
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@nyxs1874/async-retry?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=@nyxs1874/async-retry
[ci-src]: https://img.shields.io/github/actions/workflow/status/nyxs1874/async-retry/ci.yml?style=flat&colorA=080f12&label=CI
[ci-href]: https://github.com/nyxs1874/async-retry/actions/workflows/ci.yml
[license-src]: https://img.shields.io/github/license/nyxs1874/async-retry.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/nyxs1874/async-retry/blob/main/LICENSE.md
