# Using this template

Delete this file once the steps are done.

## 1. Create the repo

- **New project:** "Use this template" on GitHub, then clone.
- **Fork of an existing package:** clone the original, push it to a new repo (not GitHub's Fork button), then copy in from this template: `package.json` scripts and devDependencies, `pnpm-workspace.yaml`, `tsdown.config.ts`, `vitest.config.ts`, `tsconfig.json`, `eslint.config.js`, `knip.json`, `.github/`, `CONTRIBUTING.md`, `SECURITY.md`. Move the source into `src/` and convert it to TypeScript.

## 2. Replace placeholders

```sh
grep -rl --exclude-dir=node_modules --exclude-dir=.git -e pkg-placeholder -e original-placeholder -e _description_ .
```

- `pkg-placeholder` → the package name (e.g. `async-retry`)
- `original-placeholder` → the package being replaced
- `_description_`, `_usage_`, `_original author_`, `OWNER` → real values
- `test/__snapshots__/` → delete; the first test run regenerates the API snapshot
- `test/index.test.ts`, `src/index.ts` → replace with real code

For a fork, keep the original copyright line in `LICENSE.md` above yours.

## 3. Check everything passes

```sh
pnpm install
pnpm run ci   # lint, typecheck, knip, build (publint + attw), tests with 100% coverage
```

## 4. First publish (once per package)

npm trusted publishing can only be configured for a package that already exists, so the first version goes out from your machine:

```sh
npm login
pnpm run build
npm publish --access public --provenance=false
```

Then on `https://www.npmjs.com/package/@nyxs1874/<name>/access`, add a trusted publisher: GitHub Actions, repo `nyxs1874/<name>`, workflow `release.yml`, environment `npm`. Also create the `npm` environment in the GitHub repo settings.

## 5. Every release after that

```sh
pnpm run release   # bumpp: bump version, commit, tag, push
```

The tag triggers `release.yml`, which runs CI, publishes to npm with provenance and creates the GitHub release.

## What's in here

| Tool | Job |
|---|---|
| tsdown | Build ESM + CJS + `.d.ts`, generate `exports`, run publint and attw |
| vitest + coverage-v8 | Tests, with a 100% coverage gate |
| fast-check | Property-based tests |
| tsnapi | Snapshots the public API so a drop-in replacement can't change it by accident |
| tsdown-stale-guard | Fails tests if `dist` is older than `src` |
| eslint (@antfu/eslint-config) | Lint and formatting |
| knip | Unused files, exports and dependencies |
| simple-git-hooks + nano-staged | Pre-commit: full CI, then lint-fix staged files |
| bumpp | Version bump + tag |
| Dependabot | Monthly bumps for the SHA-pinned GitHub Actions |
