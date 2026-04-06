STATUS: COMPLETED

# E2E Hook Testing System for CI

## Problem / Motivation

Failproof AI's hook tests are unit tests that mock heavily — `hooks-config`, `builtin-policies`, `policy-evaluator`, `custom-hooks-loader`, etc. are all faked out. This means:

- Policy logic is tested in isolation, but the **full integration path** (stdin → config load → policy eval → stdout) is never exercised
- Config scope merging, custom hook loading, param injection, and decision formatting are all tested separately but never together
- Build regressions (e.g., binary compilation breaking hook dispatch) go undetected until a user reports them

We need a suite of **end-to-end tests** that invoke `failproofai --hook <event>` as a real subprocess — exactly as Claude Code does — and assert on the actual stdout output and exit codes. No mocking. No Claude needed. Just stdin/stdout.

## Goals & Non-Goals

**Goals:**
- Invoke the real compiled npm package binary (same one users get via `npx failproofai`)
- Assert on exact stdout JSON shape and exit codes
- Cover: builtin policies, policy params, config scope precedence, custom hooks
- Run in parallel in CI without flakiness
- Telemetry disabled unconditionally in all test invocations

**Non-Goals:**
- Testing Claude Code itself or any LLM behavior
- Testing the web dashboard or API mode
- Replacing unit tests — this is additive coverage of the integration path

## How the Interface Works

`failproofai --hook <EventType>` reads a JSON payload from stdin, loads config, evaluates policies, writes a decision to stdout, and exits. This is the exact protocol Claude Code uses.

**Invocation:**
```bash
echo '<payload-json>' \
  | FAILPROOFAI_TELEMETRY_DISABLED=1 \
    .test-npx/node_modules/@failproofai/<platform>/bin/failproofai --hook PreToolUse
```

No Node.js bridge. The native binary intercepts `--hook` before any mode routing (`binary-entry.ts:41-46`), so `--mode=cli` is not needed. `FAILPROOFAI_DIST_PATH` must be set when custom hooks are involved (the binary uses it for the ESM shim that resolves `import { allow, deny } from "failproofai"`).

**Payload shape** (sourced from `src/hooks/handler.ts` parsing logic):
```json
{
  "session_id": "test-session-001",
  "transcript_path": "/tmp/transcript.jsonl",
  "cwd": "/tmp/fixture-dir",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": { "command": "sudo apt install nodejs" }
}
```

**Decision output shapes:**
| Decision | Exit code | stdout |
|---|---|---|
| `PreToolUse` deny | 0 | `{"hookSpecificOutput":{"permissionDecision":"deny","reason":"..."}}` |
| Instruct (any event) | 0 | `{"hookSpecificOutput":{"additionalContext":"Instruction from failproofai: ..."}}` |
| Allow | 0 | *(empty)* |
| Non-PreToolUse deny | 2 | *(empty or reason)* |

**Config isolation:** Set `cwd` in the payload to a temp dir containing `.failproofai/hooks-config.json`. Set `HOME` env to a fresh empty temp dir so the CI runner's real `~/.failproofai` never leaks in. This mirrors exactly how `src/hooks/hooks-config.ts:33-73` resolves config.

## Options Considered

### Option A: Invoke raw TypeScript via `bun src/binary-entry.ts --hook`
**Pros:** No build step, fast, straightforward.
**Cons:** Doesn't test the compiled binary; won't catch binary-specific regressions (bundling, bun compile quirks). Telemetry code path in the binary might differ. Users never run raw TypeScript.

### Option B: Use `failproofai-local` (from `bun build --compile`)
**Pros:** Tests the compiled binary. Faster than full npm pack.
**Cons:** Still not the full npm distribution path; skips the wrapper (`bin/failproofai.mjs`) and the pack/install steps.

### Option C: Use the full npm package (via `bun run test:npx`) ✓ **Selected**
**Pros:** Exactly the user experience. Exercises the full build pipeline. Validates binary compile + npm pack + install + wrapper dispatch. `test:npx` already exists, exits cleanly (no interactive shell), and has retry logic.
**Cons:** Slower CI step (~15 min for full build). Mitigated by caching and running in parallel with other jobs.

## Architecture

### Setup Phase

`bun run test:npx` runs `scripts/test-npx.sh`:
1. Builds Next.js standalone
2. Compiles native binary (`bun build --compile`)
3. `npm pack` both platform and wrapper packages into tarballs
4. `npm install` both into `.test-npx/` temp environment
5. Exits (prints instructions, no interactive shell)

The installed binary is then available at:
```
.test-npx/node_modules/@failproofai/<platform>/bin/failproofai  ← native binary (used directly by tests)
.test-npx/node_modules/failproofai/dist/                     ← set as FAILPROOFAI_DIST_PATH for custom hooks
```

### Test Infrastructure

```
__tests__/e2e/
  helpers/
    hook-runner.ts      # spawn failproofai.mjs --hook, pipe stdin, capture exit+stdout+stderr
    fixture-env.ts      # mkdtemp per test, write configs/hooks, register afterEach cleanup
    payloads.ts         # Claude-accurate payload factories per event type and tool
  hooks/
    builtin-policies.e2e.test.ts
    custom-hooks.e2e.test.ts
    config-scopes.e2e.test.ts
    policy-params.e2e.test.ts

vitest.config.e2e.mts   # node env, forks pool, 20s timeout, e2e glob
```

**`hook-runner.ts`** — the core helper:
```typescript
interface HookRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  parsed?: Record<string, unknown>;
}

async function runHook(
  event: string,
  payload: Record<string, unknown>,
  opts?: { homeDir?: string }
): Promise<HookRunResult>
// Always sets FAILPROOFAI_TELEMETRY_DISABLED=1
// Sets HOME to opts.homeDir when provided
// Binary path: <repo-root>/.test-npx/node_modules/failproofai/bin/failproofai.mjs
// Falls back to <repo-root>/failproofai-local if .test-npx doesn't exist
```

**`fixture-env.ts`** — per-test isolation:
```typescript
interface FixtureEnv {
  cwd: string;   // pass as payload.cwd → picks up .failproofai/hooks-config.json
  home: string;  // pass as runHook homeDir → isolated from real ~/.failproofai
  writeConfig(config: object, scope?: "project" | "local"): void;
  writeHooks(filename: string, content: string): string; // returns absolute path
}

function createFixtureEnv(): FixtureEnv
// Registers afterEach() cleanup automatically
// home starts empty (no .failproofai inside)
```

**`payloads.ts`** — Claude-accurate payloads:
```typescript
const Payloads = {
  preToolUse: {
    bash:  (command: string, cwd: string) => { session_id, hook_event_name, tool_name: "Bash", tool_input: { command }, cwd },
    write: (filePath: string, content: string, cwd: string) => { ..., tool_name: "Write", tool_input: { file_path, content } },
    read:  (filePath: string, cwd: string) => { ..., tool_name: "Read", tool_input: { file_path } },
  },
  postToolUse: {
    bash: (command: string, output: string, cwd: string) => { ..., tool_result: output },
    read: (filePath: string, content: string, cwd: string) => { ..., tool_result: content },
  },
  notification: (message: string, cwd: string) => { ..., hook_event_name: "Notification", message },
  stop: (cwd: string) => { ..., hook_event_name: "Stop" },
}
```

### Vitest Config

```typescript
// vitest.config.e2e.mts
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/e2e/**/*.e2e.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 10_000,
    pool: "forks",
    poolOptions: { forks: { singleFork: false } },
  },
});
```

`forks` pool (true process isolation) is important because:
1. Tests spawn subprocesses — thread-based workers share globalThis which can interfere
2. Parallel subprocess invocations are safer across fork boundaries

### New package.json scripts

```json
"test:e2e":       "vitest run --config vitest.config.e2e.mts",
"test:e2e:watch": "vitest --config vitest.config.e2e.mts"
```

### New CI job

```yaml
test-e2e:
  runs-on: ubuntu-latest
  env:
    FAILPROOFAI_TELEMETRY_DISABLED: "1"   # covers both build and hook invocations
  steps:
    - uses: actions/checkout@v6
    - uses: oven-sh/setup-bun@v2
      with: { bun-version: latest }
    - uses: actions/cache@v4
      with:
        path: ~/.bun/install/cache
        key: bun-${{ runner.os }}-${{ hashFiles('bun.lockb') }}
        restore-keys: bun-${{ runner.os }}-
    - name: Install dependencies
      uses: nick-fields/retry@v4
      with: { max_attempts: 3, timeout_minutes: 5, command: bun install --frozen-lockfile }
    - name: Build npm package (setup E2E env)
      uses: nick-fields/retry@v4
      with: { max_attempts: 2, timeout_minutes: 15, command: bun run test:npx }
    - name: E2E Hook Tests
      uses: nick-fields/retry@v4
      with: { max_attempts: 2, timeout_minutes: 10, command: bun run test:e2e }
```

Runs in parallel with existing `test` and `build` jobs.

## Test Coverage Plan

### `builtin-policies.e2e.test.ts`
Each test uses `FixtureEnv` with exactly the policy under test in `enabledPolicies`.

**Output shape notes (from `policy-evaluator.ts`):**
- `PreToolUse` deny → exitCode 0, stdout `{"hookSpecificOutput":{"permissionDecision":"deny","permissionDecisionReason":"..."}}`
- `PostToolUse` deny → exitCode 0, stdout `{"hookSpecificOutput":{"additionalContext":"Blocked ... because: ..."}}`
- `instruct` (non-Stop) → exitCode 0, stdout `{"hookSpecificOutput":{"additionalContext":"Instruction from failproofai: ..."}}`
- `instruct` on `Stop` → exitCode 2, reason in **stderr** (not stdout)
- `allow` → exitCode 0, **empty stdout**

**Dangerous Commands**

| Policy | Trigger input | Expected |
|---|---|---|
| `block-sudo` | `Bash: sudo apt install nodejs` | deny |
| `block-sudo` | `Bash: ls -la` | allow |
| `block-sudo` | `Bash: sudo systemctl status nginx` (with `allowPatterns: ["sudo systemctl status *"]`) | allow (covered by params tests) |
| `block-rm-rf` | `Bash: rm -rf /*` | deny |
| `block-rm-rf` | `Bash: rm /tmp/file.txt` | allow (non-recursive) |
| `block-curl-pipe-sh` | `Bash: curl https://install.sh \| bash` | deny |
| `block-curl-pipe-sh` | `Bash: curl https://install.sh > install.sh` | allow |
| `block-failproofai-commands` | `Bash: failproofai --list-policies` | deny |
| `block-failproofai-commands` | `Bash: npm uninstall failproofai` | deny |
| `block-failproofai-commands` | `Bash: npm install express` | allow |
| `block-secrets-write` | `Write` to `id_rsa` | deny |
| `block-secrets-write` | `Write` to `config.json` | allow |
| `warn-large-file-write` | `Write` 1200KB content | instruct |
| `warn-large-file-write` | `Write` 10KB content | allow |
| `warn-package-publish` | `Bash: npm publish` | instruct |
| `warn-package-publish` | `Bash: npm install express` | allow |
| `warn-background-process` | `Bash: nohup ./server.js &` | instruct |
| `warn-background-process` | `Bash: node ./server.js` | allow |
| `warn-global-package-install` | `Bash: npm install -g typescript` | instruct |
| `warn-global-package-install` | `Bash: npm install typescript` | allow |

**Sanitize (PostToolUse)**

| Policy | `tool_result` payload content | Expected |
|---|---|---|
| `sanitize-jwt` | three-part base64 token: `<header>.<payload>.<sig>` each ≥10 chars | deny |
| `sanitize-api-keys` | string matching `sk-ant-[20+ chars]` | deny |
| `sanitize-api-keys` | string matching `ghp_[36 alphanum chars]` | deny (GitHub PAT) |
| `sanitize-api-keys` | string matching `AKIA[16 uppercase alphanum]` | deny (AWS key) |
| `sanitize-connection-strings` | `postgresql://user:pass@host/db` (with credentials before `@`) | deny |
| `sanitize-private-key-content` | string containing `-----BEGIN PRIVATE KEY-----` | deny |
| `sanitize-bearer-tokens` | string containing `Authorization: Bearer ` + 20+ char token | deny |
| *(any sanitize policy)* | clean output with no secrets | allow |

> **Stdin limit note:** The binary enforces `MAX_STDIN_BYTES = 1MB` (handler.ts). Any payload exceeding this is discarded — no policies fire. The default `warn-large-file-write` threshold is 1024KB, which means a triggering payload would itself exceed the limit. Test this policy with a custom `thresholdKb` param (e.g. `10`) and proportionally smaller content.

> **Test data note:** Sanitize policies fire on the full `tool_result` payload, which includes Edit/Write diffs and Bash stdout. Never put real-format secrets (actual JWT strings, real key prefixes) in test fixtures or design docs — they will trigger policies during development. Use descriptions like `<header>.<payload>.<sig>` or partial patterns instead.

**Environment**

| Policy | Trigger input | Expected |
|---|---|---|
| `protect-env-vars` | `Bash: printenv` | deny |
| `protect-env-vars` | `Bash: echo $HOME` | deny |
| `protect-env-vars` | `Bash: ls -la` | allow |
| `block-env-files` | `Bash: cat .env` | deny |
| `block-env-files` | `Read` with `file_path: ".env"` | deny |
| `block-env-files` | `Bash: cat .envrc` | allow (`.envrc` ≠ `.env`) |

**Git**

| Policy | Trigger input | Expected |
|---|---|---|
| `block-push-master` | `Bash: git push origin main` | deny |
| `block-push-master` | `Bash: git push origin feat/x` | allow |
| `block-force-push` | `Bash: git push -f origin feat/x` | deny |
| `block-force-push` | `Bash: git push origin feat/x` | allow |
| `warn-git-amend` | `Bash: git commit --amend -m "fix"` | instruct |
| `warn-git-amend` | `Bash: git commit -m "fix"` | allow |
| `warn-git-stash-drop` | `Bash: git stash drop` | instruct |
| `warn-git-stash-drop` | `Bash: git stash list` | allow |
| `warn-all-files-staged` | `Bash: git add -A` | instruct |
| `warn-all-files-staged` | `Bash: git add src/foo.ts` | allow |

**Database**

| Policy | Trigger input | Expected |
|---|---|---|
| `warn-destructive-sql` | `Bash: psql -c "DROP TABLE users"` | instruct |
| `warn-destructive-sql` | `Bash: psql -c "DELETE FROM users"` (no WHERE) | instruct |
| `warn-destructive-sql` | `Bash: psql -c "SELECT * FROM users"` | allow |
| `warn-schema-alteration` | `Bash: psql -c "ALTER TABLE users DROP COLUMN email"` | instruct |
| `warn-schema-alteration` | `Bash: psql -c "ALTER TABLE users ADD COLUMN age INT"` | instruct |
| `warn-schema-alteration` | `Bash: psql -c "SELECT * FROM users"` | allow |

**Baseline**

| Scenario | Expected |
|---|---|
| No `enabledPolicies` | Any Bash input → allow, empty stdout |
| Policy registered but non-matching event type | `block-sudo` enabled, send `PostToolUse` Bash → allow |

### `config-scopes.e2e.test.ts`
Tests merge behavior of `src/hooks/hooks-config.ts:33-73`.

- Project config enables `block-sudo` → blocked
- No config anywhere → no policies fire → allow
- Global `policyParams.warn-large-file-write.thresholdKb: 500`, local overrides to `200` → 200KB triggers (local beats global; project beats local)
- Project enables `block-sudo`, local enables `block-rm-rf` → union: both fire on respective inputs

### `policy-params.e2e.test.ts`
Tests param injection from config into `policy-evaluator.ts`. Each test sets `policyParams` in the project-scope config alongside the policy in `enabledPolicies`.

**`block-sudo` — `allowPatterns: string[]`**
- `allowPatterns: ["sudo systemctl status *"]` → `sudo systemctl status nginx` → allow
- `allowPatterns: ["sudo systemctl status *"]` → `sudo rm /etc/hosts` → deny (pattern doesn't match)
- `allowPatterns: []` (default) → `sudo systemctl status nginx` → deny

**`block-push-master` — `protectedBranches: string[]`**
- `protectedBranches: ["release"]` → `git push origin release` → deny; `git push origin main` → allow (main no longer protected)
- `protectedBranches: []` → `git push origin main` → allow (empty = nothing protected)

**`block-rm-rf` — `allowPaths: string[]`**
- `allowPaths: ["/tmp/safe"]` → `rm -rf /tmp/safe/subdir` → allow
- `allowPaths: ["/tmp/safe"]` → `rm -rf /home` → deny
- `allowPaths: []` (default) → `rm -rf /tmp/*` → deny

**`warn-large-file-write` — `thresholdKb: number`**
- `thresholdKb: 100` → 150KB content → instruct
- `thresholdKb: 100` → 50KB content → allow
- default (`thresholdKb: 1024`) → 500KB content → allow (under default threshold)

**`sanitize-api-keys` — `additionalPatterns: {regex, label}[]`**
- `additionalPatterns: [{ regex: "MY_TOKEN_[A-Z0-9]{16}", label: "Internal token" }]` → PostToolUse output with matching token → deny
- same config → PostToolUse output with no matching token → allow

**`block-secrets-write` — `additionalPatterns: string[]`**
- `additionalPatterns: [".token"]` → Write to `auth.token` → deny
- `additionalPatterns: [".token"]` → Write to `auth.json` → allow

**`block-read-outside-cwd` — `allowPaths: string[]`**
- `allowPaths: ["/shared/data"]` → `Read /shared/data/schema.json` → allow
- `allowPaths: ["/shared/data"]` → `Read /etc/passwd` → deny

### `custom-hooks.e2e.test.ts`
Each test writes a temp `.mjs` file and sets `customHooksPath` in config.

**Core mechanics (inline hook files)**

| Scenario | Hook content | Input | Expected |
|---|---|---|---|
| deny path | `fn: async () => deny("blocked")` | any PreToolUse | deny, stdout contains `permissionDecision: "deny"` |
| instruct path | `fn: async () => instruct("do this first")` | any PreToolUse | instruct, stdout contains `additionalContext: "Instruction from failproofai: do this first"` |
| allow path | `fn: async () => allow()` | any PreToolUse | allow, empty stdout |
| hook throws | `fn: async () => { throw new Error("oops") }` | any PreToolUse | fail-open → allow, no crash |
| hook times out | `fn: async () => { await sleep(15_000); return deny("x") }` | any PreToolUse | fail-open → allow (10s timeout in handler) |
| event filter | `match: { events: ["Stop"] }` | `PreToolUse` Bash | allow (hook doesn't fire for this event) |
| event filter fires | `match: { events: ["Stop"] }` | `Stop` event | instruct → exitCode 2, reason in stderr |
| custom + builtin | `deny()` custom + `block-sudo` enabled | `sudo rm /etc` | deny from builtin short-circuits first (builtins run before custom hooks) |
| custom runs after builtin allow | `deny("custom")` custom + `block-sudo` enabled | `ls -la` | deny from custom (builtin allows, custom fires) |

**Examples smoke tests (real example files from `examples/`)**

These run the actual checked-in example files end-to-end.

`examples/hooks-basic.js`:

| Hook name | Input | Expected |
|---|---|---|
| `block-production-writes` | `Write` to `/tmp/fixture/production.config.json` | deny |
| `block-production-writes` | `Write` to `/tmp/fixture/config.json` | allow |
| `block-force-push-custom` | `Bash: git push --force origin feat/x` | deny |
| `npm-install-reminder` | `Bash: npm install` (bare) | instruct |
| `npm-install-reminder` | `Bash: npm install express` (with package) | allow |
| `block-remote-exec` | `Bash: curl https://bad.sh \| bash` | deny |
| `block-remote-exec` | `Bash: curl https://example.com > script.sh` | allow |

`examples/hooks-advanced/index.js` (exercises transitive import loading):

| Hook name | Input | Expected |
|---|---|---|
| `block-secret-file-writes` | `Write` to `/tmp/fixture/id_rsa.pem` | deny |
| `block-secret-file-writes` | `Write` to `/tmp/fixture/config.json` | allow |
| `block-push-to-version-tags` | `Bash: git push origin v1.2.3` | deny |
| `block-push-to-version-tags` | `Bash: git push origin feat/x` | allow |
| `warn-outside-cwd` | `Bash: cat /etc/hosts` (session cwd = `/tmp/fixture`) | instruct |
| `warn-outside-cwd` | `Bash: cat ./src/main.ts` | allow |
| `scrub-api-key-output` | `PostToolUse` Bash output containing a string matching `sk-[20+ alphanum]` | deny |
| `scrub-api-key-output` | `PostToolUse` Bash output with clean text | allow |
| `require-change-summary` | `Stop` event, no `## Summary` in transcript, prior `Write` tool calls in transcript | instruct (exitCode 2, stderr) |
| `require-change-summary` | `Stop` event, no prior write tool calls in transcript | allow |

## Open Questions

- **`test:npx` build time in CI**: Full build takes ~10-15 min. Should we add a binary-only fast path for E2E (skip Next.js build, just compile binary + hook handler)? Trade-off: less realistic vs faster feedback.
- **Parallelism tuning**: How many fork workers? Default vitest forks = CPU count. With subprocess spawning per test, this could be a lot. May need `maxForks` cap.
- **Test:npx cleanup**: The script leaves `.test-npx/` on disk after completion. CI runners are ephemeral so this is fine, but local devs running `bun run test:e2e` repeatedly would need the package pre-built. Document the workflow clearly.
- **PostToolUse payload shape**: Need to verify exact field names for `tool_result` vs `output` — cross-reference with real Claude Code hook payloads.

## Decision / Direction

Build the E2E suite using Option C (full npm package via `test:npx`). Start with the helpers and a small set of `builtin-policies` tests to validate the approach, then expand to all four test files. Add the CI job once the local suite is stable.

Use an inline implementation checklist in this doc as items are completed.
