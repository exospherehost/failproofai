# Changelog

## Unreleased

### Features
- Add cloud platform client: `login`, `logout`, `whoami`, `relay start|stop|status`, and `sync` subcommands. Hook events are appended to a local queue and streamed to the failproofai cloud server via a background relay daemon that lazy-starts from the hook handler and survives reboots (#132)

### Fixes
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

## 0.0.2 — 2026-04-14

- **Expanded Integrations**: Added support for **Gemini CLI** and **GitHub Copilot** hooks.
- **Modular Hook Handler**: Refactored the hook evaluation engine to support multiple agents with integration-specific payload normalization and output formats.
- **Bug Fixes**: Resolved detection collisions and improved telemetry accuracy across platforms.
