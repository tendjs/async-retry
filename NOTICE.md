# Notices

This package is a maintained replacement for `async-retry`. It is a new implementation,
but it ports the upstream test suite and reproduces the delay algorithm of `retry`
so existing users see the same behaviour.

## async-retry

Tests in `test/upstream.test.ts` are ported from https://github.com/vercel/async-retry.

Copyright (c) 2021 Vercel, Inc. Licensed under the MIT License.

## retry (node-retry)

The delay calculation in `src/timeouts.ts` follows https://github.com/tim-kos/node-retry.

Copyright (c) 2011 Tim Koschützki, Felix Geisendörfer. Licensed under the MIT License.
