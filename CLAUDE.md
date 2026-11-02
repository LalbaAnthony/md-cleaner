# CLAUDE.md

## Overview

`@lalba-anthony/md-cleaner`: a Node.js CLI and library that rewrites a Markdown file in place to remove AI fingerprints (emojis, typographic Unicode, em-dashes, stray horizontal rules, blank-line runs). Published to npm; the CLI binary is `md-cleaner`.

## Tech stack

- TypeScript 6, compiled with `tsc` (no bundler). ESM only (`"type": "module"`, `module`/`moduleResolution: nodenext`), target ES2023.
- Node.js `>=22` (`engines`); CI uses Node 22.
- npm (`package-lock.json`). No runtime dependencies.
- Vitest 4 (tests), ESLint 10 flat config with `typescript-eslint` (lint), semantic-release 25 (publishing).

## Structure

```
src/
  cli.ts          bin entry (dist/cli.js): argv, stdout/stderr, exit code
  index.ts        package entry (dist/index.js): re-exports + parseCliArguments()
  file.ts         cleanFile(): read, clean, write in place
  clean.ts        cleanMarkdown(): the pure string -> string transformation
  errors.ts       MdCleanerError and subclasses, each carrying an exitCode
  version.ts      packageVersion, read from ../package.json at runtime
  types/          shared interfaces (clean.ts, cli.ts), re-exported by src/index.ts
tests/            *.test.ts, Vitest
docs/             usage.md, architecture.md, git.md, release.md
.github/workflows ci.flow.yml, release.flow.yml, tests.inc.yml (reusable)
dist/             build output, gitignored
```

## Commands

```sh
npm ci                 # install
npm run build          # tsc -> dist/
npm run dev            # tsc --watch
npm run lint           # eslint .
npm run lint:fix       # eslint . --fix
npm run typecheck      # tsc --noEmit (src/ only)
npm test               # vitest run
npm run test:watch     # vitest
```

Run the built CLI locally (rewrites the file in place):

```sh
npm run build && node dist/cli.js path/to/file.md
```

CI order (`.github/workflows/tests.inc.yml`), which a change must pass: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. No formatter is configured.

## Architecture

One-way dependency chain from the shell boundary to the pure function: `cli.ts` -> `index.ts` -> `file.ts` -> `clean.ts`. `clean.ts` imports nothing and does no I/O.

- `cleanMarkdown` normalizes BOM and CRLF/CR to LF, then walks lines with a fence flag. Fenced blocks (```` ``` ```` / `~~~`) pass through byte for byte, except that trailing whitespace is trimmed from the opening fence line. Other lines get, in order: typography replacements, em-dash replacement, emoji strip, then `trimEnd`. A `---` preceded by a blank line is dropped, and runs of blank lines are collapsed. The output always ends with exactly one `\n`.
- `cleanFile` always rewrites the file as UTF-8 without BOM, even when the content is unchanged. A non-`.md`/`.markdown` extension is reported via `unexpectedExtension` and is not an error.
- Errors: `cli.ts` never maps failures to numbers. It reads `exitCode` off `MdCleanerError`: `UsageError` = 2, `FileNotFoundError`/`FileAccessError` = 1, unknown errors = 1. To add a failure mode, add a subclass in `src/errors.ts`.
- Public API (`src/index.ts`): `cleanMarkdown`, `cleanFile`, `markdownExtensions`, `parseCliArguments`, `packageVersion`, the four error classes.

Design rationale: `docs/architecture.md`. CLI behaviour and the replacement table: `docs/usage.md`.

## Conventions

Enforced by `tsconfig.json` and `eslint.config.js`:

- Relative imports use the `.js` extension (`./clean.js`), as required by `nodenext`.
- Type-only imports go in separate `import type` statements (`consistent-type-imports`, `separate-type-imports`). `verbatimModuleSyntax` is on.
- Exported functions in `src/` declare explicit return types (`explicit-module-boundary-types`).
- `erasableSyntaxOnly` is on: no `enum`, `namespace`, or constructor parameter properties.
- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`/`Parameters`. ESLint applies `strictTypeChecked` + `stylisticTypeChecked` to `src/`.

Project-specific rules:

- In `src/clean.ts`, write every non-ASCII character as a `\uXXXX` escape. Never use literal emoji, joiners or variation selectors.
- Regexes in `src/clean.ts` must not use the `u` flag. The emoji pattern matches UTF-16 surrogate halves, which is a syntax error in unicode mode.
- Commits follow Conventional Commits, which semantic-release uses to compute the version. Branch prefixes: `feat/`, `fix/`, `ref/`, `docs/`, `test/` (`docs/git.md`).

## Testing

- Vitest, `environment: 'node'`, files matching `tests/**/*.test.ts`. `restoreMocks` and `unstubGlobals` are on.
- Tests import from `../src/*.js` directly (no build needed). `tests/file.test.ts` uses a real temp directory (`mkdtemp`) per test.
- Single file / single test:

```sh
npx vitest run tests/clean.test.ts
npx vitest run -t "is idempotent"
```

## Environment

- No `.env` / `.env.example`. The only runtime variable is `DEBUG=1`, which makes the CLI print the stack trace of a failure to stderr.
- Release CI secrets (GitHub repository settings): `NPM_TOKEN`. `GITHUB_TOKEN` is provided by Actions. See `docs/release.md`.

## Gotchas

- Any push to `main` triggers `release.flow.yml`, which publishes to npm when commits since the last tag include a releasing type (`feat`, `fix`, `perf`, or a breaking change; default commit-analyzer preset). Day-to-day work goes on `develop`; CI (`ci.flow.yml`) runs on pushes to `develop` and on PRs to `develop`/`main`.
- semantic-release commits `CHANGELOG.md` and `package.json` back to `main` (`chore(release): x.y.z [skip ci]`). Do not hand-edit `version` or `CHANGELOG.md`. `docs/release.md` says `package.json` keeps `0.0.0-development` on disk, but that is wrong: the committed version is the released one. `0.0.0-development` is only the fallback in `src/version.ts`.
- `src/version.ts` loads `../package.json` relative to its own location, which resolves correctly from both `src/` (tests) and `dist/` (runtime). Moving the file to another directory depth breaks it.
- There is no `src/types/index.ts` barrel. Each file under `src/types/` is re-exported individually from `src/index.ts` (`export type * from './types/<name>.js'`). A new type file is not public until you add that line.
- `tsconfig.json` includes only `src/`, so `npm run typecheck` does not type-check `tests/`. ESLint also disables type-aware rules for `tests/`.
- In `src/clean.ts`, typography replacements must run before the em-dash and emoji passes. The em-dash heading/table/bold test runs on the already-replaced line.
- The CLI has no dry-run and no backup. Running it (or `cleanFile`) on a repo file modifies that file.
