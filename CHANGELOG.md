# Changelog

## Unreleased

### Fixes
- Fix `mintlify validate` failing on `docs/ar/built-in-policies.mdx` by re-wrapping `origin/<baseBranch>` in backticks. The Arabic translation dropped the surrounding inline-code markers in one paragraph, so MDX parsed `<baseBranch>` as an unclosed JSX tag and the docs CI job errored out.

### Docs
- Bump built-in policy count from 32 to 39 in `README.md` and the 14 translated `docs/i18n/README.*.md` files to reflect the seven Infra Commands policies added in #202. The reference doc (`docs/built-in-policies.mdx` and its localized counterparts) was already correct (#207).

## 0.0.8 — 2026-04-27

### Fixes
- Fix `require-pr-before-stop` falsely denying after a squash-merge or rebase-merge: GitHub creates a new commit on the base branch with rewritten parentage, so the original branch commit is never an ancestor of `main` and the post-merge `git log` / `git diff` reconciliation never converges. The policy now short-circuits to `allow` when `gh pr view --json state` returns `MERGED`, mirroring the fix shape from #196 for `require-no-conflicts-before-stop`. Also surfaces whenever `main` is auto-modified after merge — e.g. release workflows that auto-bump versions (#204).

## 0.0.7 — 2026-04-27

### Features
- Add `Infra Commands` category with seven opt-in policies: `block-kubectl`, `block-terraform`, `block-aws-cli`, `block-gcloud`, `block-az-cli`, `block-helm`, and `block-gh-pipeline`. Each denies invocations of its CLI by default and supports an `allowPatterns` param so users can carve out read-only subcommands (e.g. `kubectl get *`, `terraform plan`, `aws s3 ls *`). `block-gh-pipeline` only matches mutating subcommands (`workflow run`, `pr merge`, `release create`, etc.) so read-only `gh` calls used by other policies continue to work (#202).

### Fixes
- Skip `require-no-conflicts-before-stop` entirely when no OPEN PR exists for the current branch (or when `gh` CLI is unavailable to check). The policy no longer runs Layer 1's local `git merge-tree` probe in those cases — without a confirmable merge target there is nothing to enforce (#198).
- Resolve project policy config (`.failproofai/`) by walking up from the live CWD to find the nearest project root, instead of looking only at the exact session cwd. Stop-gating policies (`require-pr-before-stop`, `block-read-outside-cwd`, etc.) no longer silently disable when Claude `cd`s into a subdirectory. Also covers `customPoliciesPath` and project convention discovery in `custom-hooks-loader.ts` (#200).

## 0.0.6 — 2026-04-27

### Features
- Add cloud platform client: `login`, `logout`, `whoami`, `relay start|stop|status`, and `sync` subcommands. Hook events are appended to a local queue and streamed to the failproofai cloud server via a background relay daemon that lazy-starts from the hook handler and survives reboots (#132)
- Add `require-no-conflicts-before-stop` builtin workflow policy that denies Stop until the current branch merges cleanly with the base branch. Runs a local `git merge-tree` probe (names the conflicted files) and an optional `gh pr view --json mergeable` probe that catches conflicts a stale local `origin/<base>` would miss (#176)
- Add policy namespace support. Built-in policies now live under the `exospherehost/` namespace; flat names in user configs (e.g. `"sanitize-jwt"`) auto-resolve to the default namespace, so existing configs keep working unchanged. Custom and third-party policies can declare their own namespace (e.g. `myorg/foo`) without colliding with builtins (#196)

### Docs
- Add demo GIF to README (#178)
- Document the policy namespace concept and update built-in policy count from 30 to 32 (#196)

### Fixes
- Fix `require-no-conflicts-before-stop` falsely denying when the PR is already merged or closed: GitHub returns `mergeable=UNKNOWN` for non-OPEN PRs, which the policy was treating as "still computing → wait and retry". The policy now requests `state` and short-circuits to allow when the PR is not OPEN (#196)
- Stop stderr leakage from workflow policies (`require-push-before-stop`, `require-pr-before-stop`, `require-ci-green-before-stop`, etc.): git probes that are expected to sometimes fail no longer leak "fatal: Needed a single revision" or similar messages to the user's terminal (#132)
- `block-read-outside-cwd` now uses `CLAUDE_PROJECT_DIR` (the stable project root) instead of the live hook `cwd`, which drifts when Claude `cd`s into a subdirectory. Reads at the project root are no longer wrongly denied after a `cd`. Falls back to `ctx.session.cwd` when that variable is unset (#134)
- Shrink the npm package by excluding sharp from the Next.js standalone build (unused — image optimization is disabled) and stripping docs, tests, and sourcemaps from the bundled `node_modules`. Tarball drops from ~20 MB to under a few MB (#136)

## 0.0.6-beta.2 — 2026-04-21

### Features
- Add `prefer-package-manager` builtin policy to enforce allowed package managers (e.g., uv instead of pip) (#126)

### Fixes
- Treat cancelled CI runs as non-failing in `require-ci-green-before-stop` policy (#129)

### Docs
- Emphasize convention-based policies as org-wide quality standards in getting-started, custom-policies, examples, and README (#126)

## 0.0.6-beta.1 — 2026-04-20

### Features
- Add `prefer-package-manager` builtin policy to enforce allowed package managers (e.g., uv instead of pip) (#126)

### Docs
- Emphasize convention-based policies as org-wide quality standards in getting-started, custom-policies, examples, and README (#126)

## 0.0.6-beta.0 — 2026-04-20

### Fixes
- Fix `require-pr-before-stop` falsely denying when PR is already merged and `origin/main` is stale (#112)

## 0.0.5 — 2026-04-17

### Fixes
- Strengthen Stop-event deny/instruct instructions with mandatory framing so agents execute required actions instead of asking for confirmation (#109)
- Include legacy commit statuses (CodeRabbit, etc.) in CI green check — previously only Check Runs API was queried (#109)

### Docs
- Remove beta version annotations from convention-based policies and allow(message) documentation (#110)

## 0.0.4 — 2026-04-16

### Features
- Graduate 4 workflow policies from beta to stable: `require-commit-before-stop`, `require-push-before-stop`, `require-pr-before-stop`, `require-ci-green-before-stop` (#105)

## 0.0.3 — 2026-04-15

### Features
- Use portable `npx -y failproofai` command for project-scope hooks, making `.claude/settings.json` committable to git (#96)
- Parallelize translation workflow across 14 languages with concurrent file translation for faster CI (#98)
- Add manual workflow dispatch for translations with `force` (ignore cache) and `languages` filter inputs (#98)
- Tier-based model selection for translations: Sonnet for Tier 1, Haiku for Tier 2/3; add prompt caching on system prompt (#98)

### Fixes
- Fix hooks not working in failproofai's own repo by using local binary instead of npx (#98)
- Fix translation workflow placing files at repo root instead of `docs/` by setting download artifact path (#100)

## 0.0.2-beta.8 — 2026-04-14

### Features
- Add `changelog-check`, `docs-check`, and `pr-description-check` convention policies
- Track `.claude/settings.json` in git
- Add multilingual documentation with 14 languages and automated translation tooling (#93)
- Add GitHub Actions workflow to auto-translate docs when English sources change (#95)
- Add Mintlify docs validation to CI (#95)

### Fixes
- Accumulate all `instruct` messages instead of only delivering the first one
- Rename convention policy prefix from `convention/` to `.failproofai-{scope}/` (e.g. `.failproofai-project/`, `.failproofai-user/`) and add `convention_scope` to telemetry

### Docs
- Document cross-cutting `hint` param in built-in policies reference and add `block-force-push` hint example
- Add `block-force-push` hint to project config suggesting fresh branch as alternative

## 0.0.2-beta.7 — 2026-04-14

### Features
- Check third-party bot statuses (CodeRabbit, SonarCloud, etc.) in `require-ci-green-before-stop` policy (#90)
- Convention-based policy auto-discovery: drop `*policies.{js,mjs,ts}` files into `.failproofai/policies/` at project or user level for automatic loading — no config changes needed (#91)
- Configurable `hint` field in `policyParams` — append custom guidance to deny/instruct messages without modifying policies (#91)
- Auto-bump version after release (#73)

### Fixes
- Write `policies-config.json` to scope-appropriate path (#57)
- Fix custom hooks loader cwd, ESM shim exports, and merged LLM config (#76)

### Docs
- Replace Discord links with Slack community invite (#87)

### Dependencies
- Bump `@types/node` 25.5.2 → 25.6.0 (#86)
- Bump `react-dom` 19.2.4 → 19.2.5 (#85)
- Bump `next` 16.2.2 → 16.2.3 (#84)
- Bump `posthog-node` 5.28.11 → 5.29.2 (#83)
- Bump `lucide-react` 1.7.0 → 1.8.0 (#82)
- Bump `eslint-config-next` 16.2.2 → 16.2.3 (#81)
- Bump `vitest` 4.1.2 → 4.1.4 (#80)
- Bump `react` 19.2.4 → 19.2.5 (#79)
- Bump `actions/checkout` 4 → 6 (#78)

## 0.0.2-beta.6 — 2026-04-09

### Fixes
- `require-push-before-stop` skips when no changes vs base branch (#71)

## 0.0.2-beta.5 — 2026-04-09

### Features
- Display package version in navbar (#66)

### Fixes
- `require-pr-before-stop` skips when no changes vs base branch (#67)
- Show plain Allow badge instead of blue Allow(note) (#68)

## 0.0.2-beta.4 — 2026-04-09

### Features
- Surface allow-with-message in terminal and dashboard (#65)

### Fixes
- Policy bypass gaps in `block-rm-rf`, `block-curl-pipe-sh`, `protect-env-vars` + Stop hook stderr bug (#64)

## 0.0.2-beta.3 — 2026-04-09

### Features
- 4 beta workflow policies + allow-with-message support (#63)

### Fixes
- Disable PostHog telemetry in all CI jobs and test configs (#62)
- README badge fixes — stable npm version, remove broken Discord (#53)

### Docs
- Rewrite README to focus on hooks management (#54)
- Rewrite docs for Mintlify, fix CLI parity, add agent skill page (#55)
- Rename custom-hooks to custom-policies, update Dockerfile for hot reload (#61)

## 0.0.2-beta.2 — 2026-04-08

### Features
- Add Mintlify documentation configuration (#43)

### Fixes
- Bundle CLI for Node.js compatibility, support `npm install -g` (#46)
- Correct CLI commands in README (#45)
- Clean CLI error handling, reject unknown args (#48)

## 0.0.1 — 2026-04-06

Initial open-source release of **Failproof AI** — formerly Claudeye.

Features included in this release:
- **Hooks & Policies**: 35+ built-in security policies for Claude Code hooks (PreToolUse, PostToolUse, etc.), custom policy support, activity logging
- **Projects**: Browse and search Claude Code projects and sessions
- **Session Viewer**: Inspect session logs, tool calls, and per-session hook activity
