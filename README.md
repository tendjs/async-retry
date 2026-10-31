# @nyxs1874/pkg-placeholder

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![CI][ci-src]][ci-href]
[![License][license-src]][license-href]

Maintained, drop-in replacement for [`original-placeholder`](https://www.npmjs.com/package/original-placeholder).

_description_

- Same API as `original-placeholder`; its original test suite passes unchanged
- Fixes long-standing upstream issues (see below)
- TypeScript types included
- ESM and CommonJS
- Zero dependencies
- 100% test coverage

## Install

```sh
npm i @nyxs1874/pkg-placeholder
```

## Migrating from `original-placeholder`

```diff
- import x from 'original-placeholder'
+ import x from '@nyxs1874/pkg-placeholder'
```

To switch without touching code (including transitive usage), alias it:

```jsonc
// package.json
{
  "overrides": { "original-placeholder": "npm:@nyxs1874/pkg-placeholder@^1" }, // npm
  "pnpm": { "overrides": { "original-placeholder": "npm:@nyxs1874/pkg-placeholder@^1" } }, // pnpm
  "resolutions": { "original-placeholder": "npm:@nyxs1874/pkg-placeholder@^1" } // yarn
}
```

## Usage

_usage_

## Fixed upstream issues

| Upstream issue | Fix | Test |
|---|---|---|
| _link_ | _what changed_ | _test name_ |

## Differences from `original-placeholder`

None intended. Any behaviour difference is a bug; please [open an issue](https://github.com/nyxs1874/pkg-placeholder/issues).

## Credits

Based on [`original-placeholder`](https://github.com/OWNER/original-placeholder) by _original author_. Project setup based on [antfu/starter-ts](https://github.com/antfu/starter-ts).

## License

[MIT](./LICENSE.md) License © [Adnan Labiadh](https://github.com/nyxs1874)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@nyxs1874/pkg-placeholder?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmx.dev/package/@nyxs1874/pkg-placeholder
[npm-downloads-src]: https://img.shields.io/npm/dm/@nyxs1874/pkg-placeholder?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmx.dev/package/@nyxs1874/pkg-placeholder
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@nyxs1874/pkg-placeholder?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=@nyxs1874/pkg-placeholder
[ci-src]: https://img.shields.io/github/actions/workflow/status/nyxs1874/pkg-placeholder/ci.yml?style=flat&colorA=080f12&label=CI
[ci-href]: https://github.com/nyxs1874/pkg-placeholder/actions/workflows/ci.yml
[license-src]: https://img.shields.io/github/license/nyxs1874/pkg-placeholder.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/nyxs1874/pkg-placeholder/blob/main/LICENSE.md
