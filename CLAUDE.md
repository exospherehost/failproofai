# CLAUDE.md — Agent guidance for this repo

## Environment

- **Runtime:** bun (≥1.3.0) and Node.js (≥20.9.0) are both present.
- **Docker CLI** is available. Use it to spin up clean containers that mimic real user
  installs and validate every non-trivial change end-to-end before pushing.
- **Package manager:** bun (`bun install`, `bun run <script>`). Do not use npm/yarn to
  install deps locally.

## Dev hooks (this repo only)

This repo's `.claude/settings.json` uses `bun ./bin/failproofai.mjs --hook <EventType>`
instead of the standard `npx -y failproofai` command. This is because `npx -y failproofai`
creates a self-referencing conflict when run inside the failproofai project itself.

For all other repos, the recommended approach is `npx -y failproofai`, installed via:
```bash
failproofai policies --install --scope project
```

Do **not** run `failproofai policies --install --scope project` from this repo — it will
overwrite the local binary path back to `npx -y failproofai`.

## Workflow rules

### One PR per branch
Each local branch maps to exactly one PR. Before opening a PR, check with
`gh pr list --head <branch>`. If one exists, push new commits to the same branch — never
open a second PR for the same branch.

### Branch must contain all commits from main
Before pushing, verify your branch is up to date with `main`:

```bash
git fetch origin
git log --oneline origin/main ^HEAD   # should print nothing
```

If it prints commits, rebase before pushing:

```bash
git rebase origin/main
```

Resolve any conflicts, then continue. Never push a branch that is missing commits from
`main` — the PR diff will be polluted and CI may test against a stale base.

### CI must be green after every commit you push
After every `git push`, run `gh run watch` or poll `gh run list --limit 3` until all checks
finish. If any job fails, **stop and fix it before continuing**. Never leave a red CI.

The CI runs four jobs — all must pass:
| Job | Command |
|-----|---------|
| quality | lint + tsc + version-consistency check |
| test | `bun run test:run` (unit, 4 env configs) |
| build | `bun run build` (Next.js + dist/index.js) |
| test-e2e | `bun run test:e2e` |

### Always add unit tests for new behaviour
When you add or change logic, add a corresponding test in `__tests__/`. Never modify
existing tests just to make them pass — if a test breaks, fix the code, not the test.
Exception: updating a test that explicitly tests the value you're changing (e.g. a version
string or an error message you intentionally changed).

## Testing protocol

### After every implementation change

1. **Unit tests first** — fast, in-process:
   ```bash
   bun run test:run
   ```

2. **Local smoke test** — use the dev dist directly:
   ```bash
   bun build --target=node --format=cjs --outfile=dist/index.js src/index.ts
   FAILPROOFAI_DIST_PATH=$(pwd)/dist failproofai p -i -c <policy-file>
   ```

3. **Docker clean-install test** — mimics a real `npm install -g` from scratch.
   Use the `oven/bun:latest` image (bun pre-installed) with `--network=host`:

   ```bash
   # Pack without running the full build
   npm pack --ignore-scripts

   docker run --rm --network=host \
     -v $(pwd)/failproofai-*.tgz:/pkg.tgz \
     oven/bun:latest bash -c "
       apt-get update -qq && apt-get install -y -qq nodejs npm 2>&1 | tail -2
       npm install -g /pkg.tgz --ignore-scripts 2>&1 | tail -3
       cat > /tmp/test-policy.mjs << 'EOF'
   import { customPolicies, allow } from 'failproofai';
   customPolicies.add({
     name: 'smoke-test',
     description: 'Smoke test',
     match: { events: ['PreToolUse'] },
     fn: async (ctx) => allow(),
   });
   EOF
       failproofai --version
       failproofai p -i -c /tmp/test-policy.mjs
     "

   rm failproofai-*.tgz
   ```

   Expected output includes `Validated 1 custom hook(s): smoke-test` and exit 0.

4. **E2E tests** (before pushing):
   ```bash
   bun run test:e2e
   ```

### Regression areas to always check

After any change to `src/hooks/`, verify these scenarios don't regress:

| Scenario | How to check |
|----------|-------------|
| Custom policy with `from 'failproofai'` ESM import | Docker clean-install test above |
| Custom policy with `require('failproofai')` CJS | Write a `.js` test file with `require` and run `p -i -c` |
| Transitive local imports in custom policy | Use `examples/policies-advanced/index.js` |
| Builtin policies still fire (no custom file) | `failproofai p -i` without `-c` |
| `findDistIndex()` fallback when `FAILPROOFAI_DIST_PATH` unset | Unset the var and test |
| `loadCustomHooks` fail-open (bad file path) | Pass a nonexistent file without `--strict` |

## Project structure cheatsheet

```
bin/failproofai.mjs          Entry point (bun shebang); sets FAILPROOFAI_DIST_PATH
src/hooks/
  custom-hooks-loader.ts     Orchestrates temp-file creation + dynamic import
  loader-utils.ts            findDistIndex(), createEsmShim(), rewriteFileTree()
  custom-hooks-registry.ts   globalThis registry shared between loader and handler
  policy-helpers.ts          allow() / deny() / instruct()
  handler.ts                 Called by Claude Code --hook events
  manager.ts                 policies --install / --uninstall / list
src/index.ts                 Public API entry point → compiled to dist/index.js
dist/index.js                CJS bundle (built by `bun run build`; shipped in npm pkg)
__tests__/                   Unit + e2e tests (vitest)
examples/                    Sample custom policy files
```

## Changelog

Every PR **must** include an update to `CHANGELOG.md`. Add your entry under the
`## Unreleased` section at the top. Use the appropriate subsection:

- **Features** for new functionality
- **Fixes** for bug fixes
- **Docs** for documentation-only changes
- **Dependencies** for dependency bumps

Each entry should be a single line: a short description followed by the PR number
(e.g. `- Add foo support (#123)`). When a release is cut, the `Unreleased` section gets
renamed to the version and date, and a fresh `## Unreleased` heading is added.

## Version bumps

When bumping the version, update **only** `package.json` (root). The CI version-consistency
check compares `packages/*/package.json` against root — that directory does not currently
exist, so no other files need updating.
