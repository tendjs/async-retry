# Contributing

Thanks for helping out.

1. `pnpm install`
2. Write a failing test that shows the bug or the new behaviour. If it comes from an upstream issue, name the test `upstream #<number>: <title>`.
3. Make it pass.
4. `pnpm run ci` must pass: lint, typecheck, knip, build checks and tests at 100% coverage.
5. Open a PR with a Conventional Commits title (`fix: …`, `feat: …`).

The public API is snapshot-tested. If your change alters it on purpose, update the snapshot with `pnpm vitest run -u` and explain why in the PR.
