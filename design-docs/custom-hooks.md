STATUS: COMPLETED

# Custom Hooks Design

## Instructions for the Implementing Agent

1. **Branch** — create a fresh branch from the latest `main` before making any changes:
   ```bash
   git checkout main && git pull && git checkout -b feat/custom-hooks
   ```

2. **Verify each step** — after implementing each logical unit (policy params mechanism,
   schema on `BuiltinPolicyDefinition`, per-policy wiring, custom hooks registry,
   loader integration, CLI flag), verify it compiles and existing tests still pass before
   moving to the next step. Do not batch all changes and verify at the end.

3. **Keep the checklist current** — after completing each checklist item at the bottom of
   this document, immediately mark it `[x]`. Do not defer checklist updates to the end.
   The checklist is the source of truth for progress — if it is not marked, it is not done.

4. **Unit tests** — every new piece of logic must have unit tests:
   - Param merging (project → local → global precedence, scalar override, array union for `enabledPolicies`)
   - Each parameterized builtin policy (default behavior unchanged, custom param applied correctly)
   - `customHooks` registry (`.add()`, `getCustomHooks()`, `globalThis` isolation)
   - Hook handler loading `customHooksPath` from config and registering custom hooks
   - `--list-hooks` output with params and custom hooks section

5. **Documentation** — update `README.md` with:
   - `policyParams` config reference for each parameterized policy
   - `--custom-hooks <path>` CLI flag
   - `customHooks.add()` authoring guide with a complete example

6. **Changelog** — add an entry to `CHANGELOG.md` under a new `## [1.0.8-beta.0]` heading
   describing both features (policy params + custom JS hooks).

7. **Version** — bump `package.json` version to `1.0.8-beta.0`. Also update the version in
   any platform-specific `packages/*/package.json` files if they carry their own version field.

---

## Problem / Motivation

Failproof AI's builtin policies cover the common security baseline, but they're all-or-nothing
today:

- `block-sudo` blocks *all* sudo — you can't say "allow `sudo systemctl status`"
- `sanitize-api-keys` covers OpenAI/GitHub/AWS — you can't add your company's key format
- `block-read-outside-cwd` has no path allowlist
- `block-push-master` assumes `main`/`master` — you can't configure other protected branches

And there's no way to add entirely new logic: "deny writes unless a Jira ticket is in the
prompt", "call our internal approval API before destructive Bash", "notify Slack on every
session end."

Two distinct needs, both unsolved today:

1. **Configure existing policies** — tune behavior without writing code
2. **Fully custom hooks** — arbitrary logic tied to any hook event

---

## Goals & Non-Goals

### Goals
- Params for builtin policies with sensible defaults — users who configure nothing get
  identical behavior to today
- Custom hook logic in a `hooks.js` file using the same authoring experience as `eval.js`
- Same `allow` / `deny` / `instruct` semantics throughout
- Minimal ceremony: one config file, one optional code file
- Project-local additions on top of global config

### Non-Goals
- GUI editor (CLI-first)
- Hook sharing / marketplace
- Sandboxing custom JS (user-trusted code, full user privileges)
- Hot reloading (hooks load fresh per event — acceptable given the ephemeral process model)
- Per-custom-hook configuration via `policyParams` (deferred — see open items)

---

## Architecture

```
Claude Code event fires
  → failproofai --hook <EventType>
    → load ~/.failproofai/hooks-config.json (merged with .failproofai/hooks-config.json)
    → register builtin policies with their resolved params
    → register custom JS hooks (auto-discovered hooks.js files)
    → evaluate all in priority order
    → first deny short-circuits; instruct accumulates
    → write response to stdout
```

Two layers, evaluated in order:

```
[1] Builtin policies (with params)  →  fast, well-tested, security-critical
[2] Custom JS hook modules          →  full power, async, arbitrary logic
```

---

## Part 1: Policy Params

### Mechanism

`PolicyContext` gains an optional `params` field:

```ts
interface PolicyContext {
  eventType: HookEventType;
  payload: Record<string, unknown>;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  session?: SessionMetadata;
  params?: Record<string, unknown>;
}
```

Each parameterizable builtin declares a schema with required default values on its
`BuiltinPolicyDefinition`. At load time, Failproof AI merges `policyParams[policy.name]` from
config over those defaults and injects the result into `ctx.params`. Policy functions read
`ctx.params` directly — no null-guarding needed since defaults are always applied first.

```ts
function blockSudo(ctx: PolicyContext): PolicyResult {
  const cmd = getCommand(ctx);
  if (!/\bsudo\b/.test(cmd)) return allow();

  const allowPatterns = ctx.params!.allowPatterns as string[];
  if (allowPatterns.some((p) => matchesAllowedCommand(cmd, p))) return allow();

  return deny("sudo command blocked by failproofai");
}
```

> **Implementation note — `allowPatterns` matching:** patterns must be matched against the
> parsed command (executable + arguments as tokens), not the raw command string. Raw-string
> glob matching allows bypass via appended shell operators (e.g. `sudo systemctl status x; rm -rf /`
> matches `sudo systemctl status *`). See adversarial review finding #3.

### Schema definition

```ts
interface BuiltinPolicyDefinition {
  name: string;
  description: string;
  fn: PolicyFunction;
  match: PolicyMatcher;
  defaultEnabled: boolean;
  category: string;
  beta?: boolean;
  params?: PolicyParamsSchema;
}

interface PolicyParamsSchema {
  [paramName: string]: {
    type: "string" | "number" | "boolean" | "string[]" | "pattern[]";
    description: string;
    default: unknown;  // every param must ship with a default
  };
}
```

### Builtin policies with params

| Policy | Param | Type | Default |
|---|---|---|---|
| `block-sudo` | `allowPatterns` | `string[]` | `[]` |
| `block-rm-rf` | `allowPaths` | `string[]` | `[]` |
| `block-read-outside-cwd` | `allowPaths` | `string[]` | `[]` |
| `block-push-master` | `protectedBranches` | `string[]` | `["main", "master"]` |
| `block-work-on-main` | `protectedBranches` | `string[]` | `["main", "master"]` |
| `sanitize-api-keys` | `additionalPatterns` | `pattern[]` | `[]` |
| `block-secrets-write` | `additionalPatterns` | `string[]` | `[]` |
| `warn-large-file-write` | `thresholdKb` | `number` | `1024` |

### Config shape

`policyParams` is a new top-level key in `hooks-config.json`, keyed by builtin policy name:

```json
{
  "enabledPolicies": ["block-sudo", "block-push-master", "sanitize-api-keys"],
  "policyParams": {
    "block-sudo": {
      "allowPatterns": ["sudo systemctl status", "sudo journalctl"]
    },
    "block-push-master": {
      "protectedBranches": ["main", "release", "prod"]
    },
    "sanitize-api-keys": {
      "additionalPatterns": [
        { "regex": "myco_[A-Za-z0-9]{32}", "label": "MyCo internal API key" }
      ]
    }
  }
}
```

### Config scopes and merge strategy

Three config files, evaluated in priority order:

```
[1] .failproofai/hooks-config.json        ← project  (committed to repo)
[2] .failproofai/hooks-config.local.json  ← local    (gitignored, personal overrides)
[3] ~/.failproofai/hooks-config.json      ← global   (user-level fallback)
```

**`enabledPolicies`** — union across all three. A policy enabled at any level is active.

**`policyParams`** — per-policy, first level that defines it wins entirely. No merging of
values. If `block-sudo` has params in the project config, those are used as-is; the local
and global params for `block-sudo` are ignored.

```
project:  block-sudo → { allowPatterns: ["sudo apt-get update"] }
global:   block-sudo → { allowPatterns: ["sudo systemctl status"] }

resolved: { allowPatterns: ["sudo apt-get update"] }   ← project wins, global ignored
```

```
project:  (no block-sudo params)
local:    (no block-sudo params)
global:   block-sudo → { allowPatterns: ["sudo systemctl status"] }

resolved: { allowPatterns: ["sudo systemctl status"] }  ← falls through to global
```

This means to change a policy's params for a project, you own the full value — you can't
partially extend the global list. That's intentional: explicit is better than surprising
concatenation.

### `--list-hooks` display

Configured params are shown as a summary line beneath each policy:

```
  ✓       block-sudo            Block sudo commands
            allowPatterns: ["sudo systemctl status", "sudo journalctl"]
  ✓       block-push-master     Block pushing to main/master
            protectedBranches: ["main", "release", "prod"]
```

Unknown keys in `policyParams` (e.g. typos) are flagged here — not at hook-fire time.

---

## Part 2: Custom JS Hooks

### API design

Modeled after the `--evals` pattern. Users import `customHooks` and the decision helpers
from `failproofai`, call `.add()` to register hooks as side effects, then export `customHooks`.
The registry is backed by `globalThis` — same mechanism as the evals dashboard/alert registries.

The three decision helpers — `allow()`, `deny(message)`, `instruct(message)` — are the same
helpers used internally by every builtin policy. Custom hook authors use these instead of
returning raw objects. The `deny()` message is prefixed with `"Blocked by failproofai:"` in the
evaluator output, consistent with builtin policy deny messages.

```js
// my-hooks.js
import { customHooks, allow, deny, instruct } from 'failproofai';
import { checkApproval } from './approval-client.js';  // local module — works fine

customHooks.add({
  name: "require-ticket-on-commit",
  description: "Block git commits until CURRENT_TICKET env var is set",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const cmd = ctx.toolInput?.command ?? "";
    if (!cmd.includes("git commit")) return allow();

    if (!process.env.CURRENT_TICKET) {
      return instruct("Set CURRENT_TICKET env var before committing.");
    }
    return allow();
  },
});

customHooks.add({
  name: "approval-gate",
  description: "Call internal approval API before destructive Bash",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const cmd = ctx.toolInput?.command ?? "";
    if (!/rm|drop|truncate/i.test(cmd)) return allow();

    const approved = await checkApproval(cmd, ctx.session?.sessionId);
    return approved
      ? allow()
      : deny("Destructive command requires approval — visit approvals.internal");
  },
});

export { customHooks };
```

### Providing the hooks file

The path to the hooks file is given explicitly via `--custom-hooks <path>` when installing
hooks. It is stored in `hooks-config.json` and read by the hook handler at event-fire time.

```bash
failproofai --install-hooks --custom-hooks ./my-hooks.js
```

`hooks-config.json` stores the resolved absolute path:

```json
{
  "enabledPolicies": ["block-sudo"],
  "customHooksPath": "/home/alice/myproject/my-hooks.js"
}
```

To update or remove:

```bash
failproofai --install-hooks --custom-hooks ./new-hooks.js   # replace path
failproofai --install-hooks --remove-custom-hooks            # clear
```

### Loading

Same loader as `--evals eval.js` (`lib/evals/loader.ts`), applied to `customHooksPath`:

1. **ESM/CJS compat** — writes temp `.mjs` files so Node always treats the file as ESM
2. **`import { ... } from 'failproofai'`** — rewrites to the actual dist path via an ESM shim,
   so `customHooks` resolves to the same `globalThis`-backed registry instance
3. **Transitive imports** — recursively rewrites all local relative imports reachable from
   the entry file, so `import { checkApproval } from './approval-client.js'` works exactly
   as the user expects

After import, the hook handler reads the registered hooks from the `globalThis` registry.

### Registry and `customHooks` object

New singleton in `src/hooks/custom-hooks-registry.ts`, mirroring the evals registry pattern:

```ts
// src/hooks/custom-hooks-registry.ts
const REGISTRY_KEY = "__failproofai_custom_hooks__";

export const customHooks = {
  add(hook: CustomHook): void {
    const g = globalThis as Record<string, unknown>;
    if (!Array.isArray(g[REGISTRY_KEY])) g[REGISTRY_KEY] = [];
    (g[REGISTRY_KEY] as CustomHook[]).push(hook);
  },
};

export function getCustomHooks(): CustomHook[] {
  const g = globalThis as Record<string, unknown>;
  return Array.isArray(g[REGISTRY_KEY]) ? (g[REGISTRY_KEY] as CustomHook[]) : [];
}
```

`customHooks` is exported from the `failproofai` package alongside `createApp`.

### `CustomHook` type and decision helpers

```ts
export interface CustomHook {
  name: string;
  description?: string;
  match?: {
    events?: HookEventType[];
  };
  fn: (ctx: PolicyContext) => PolicyResult | Promise<PolicyResult>;
}

// Decision helpers — use these instead of returning raw objects
export function allow(): PolicyResult;
export function deny(message: string): PolicyResult;
export function instruct(message: string): PolicyResult;
```

The helpers are the same functions used internally by every builtin policy, now exported as
part of the public API. The `deny(message)` output is prefixed with `"Blocked by failproofai:"`
by the evaluator — consistent with how builtin deny messages are surfaced to Claude.

Tool filtering is the hook's responsibility — inspect `ctx.toolName` and `ctx.toolInput`
inside `fn`. The framework only filters by event type.

### Failure modes

| Failure | Behavior |
|---|---|
| `customHooksPath` not set | Skip — no custom hooks, builtins run normally |
| File not found at path | Log to `~/.failproofai/hook.log`, skip, builtins run normally |
| Import / syntax error | Log to `~/.failproofai/hook.log`, skip entire file, builtins run normally |
| `fn` throws at runtime | Log error, treat as `allow` for that hook only |
| `fn` exceeds 10s | Timeout, treat as `allow`, log warning |

Fail-open throughout. See exospherehost/failproofai#154 for future fail-closed support.

### `--list-hooks` display

```
Failproof AI Hook Policies (user)

  Status  Name                          Description
  ──────  ─────────────────────────────────────────────────────────────
  ✓       block-sudo                    Block sudo commands
            allowPatterns: ["sudo systemctl status"]
  ✓       block-push-master             Block pushing to main/master

  ── Custom Hooks (/home/alice/myproject/my-hooks.js) ───────────────
  ✓       require-ticket-on-commit      Block git commits without ticket
  ✓       approval-gate                 Approval gate for destructive commands
```

---

## Unified Config Shape

```ts
interface HooksConfig {
  enabledPolicies: string[];
  llm?: LlmConfig;
  policyParams?: {
    [builtinPolicyName: string]: Record<string, unknown>;
  };
  customHooksPath?: string;  // absolute path, set via --custom-hooks <path>
}
```

---

## Decisions

| Topic | Decision |
|---|---|
| Every param has a default | Yes — unconfigured users get identical behavior to today |
| Config scopes | Three levels: project → local → global (priority order) |
| Config merging | `enabledPolicies`: union across all levels. `policyParams`: per-policy, first level that defines it wins entirely — no value merging. |
| Declarative JSON rules | Dropped — params cover no-code tuning; `hooks.js` covers custom logic |
| JS loading mechanism | Reuse `lib/evals/loader.ts` verbatim — same as `eval.js`, handles ESM compat + transitive imports |
| Custom hooks API | `import { customHooks } from 'failproofai'` → `customHooks.add()` → `export { customHooks }` |
| Custom hooks path | Explicit via `--custom-hooks <path>`, stored as `customHooksPath` in `hooks-config.json` |
| Unknown `policyParams` keys | Warn in `--list-hooks`, silent at fire time |
| Custom hook failures | Fail-open — tracked in #154 for future fail-closed support |
| Per-custom-hook params (`ctx.params`) | Deferred |

---

## Implementation Checklist

Mark each item `[x]` as you complete it. Do not move to the next section until all items in
the current section are checked and the project compiles cleanly.

---

### 1. Branch setup
- [x] `git checkout main && git pull`
- [x] `git checkout -b feat/custom-hooks`
- [x] Confirm `npm run build` (or equivalent) passes on clean main before any changes

---

### 2. Type definitions — `src/hooks/policy-types.ts`
- [x] Add `params?: Record<string, unknown>` to `PolicyContext`
- [x] Add `PolicyParamsSchema` interface with `type`, `description`, `default` per param key
- [x] Add `params?: PolicyParamsSchema` field to `BuiltinPolicyDefinition`
- [x] Add `policyParams?: Record<string, Record<string, unknown>>` to `HooksConfig`
- [x] Add `customHooksPath?: string` to `HooksConfig`
- [x] Verify project still compiles after type changes

---

### 3. Config loading — `src/hooks/hooks-config.ts`
- [x] Implement three-scope config discovery: project (`.failproofai/hooks-config.json`) → local (`.failproofai/hooks-config.local.json`) → global (`~/.failproofai/hooks-config.json`)
- [x] `enabledPolicies`: union across all three scopes (dedup)
- [x] `policyParams`: per-policy key, first scope that defines it wins entirely — no merging of values
- [x] `customHooksPath`: first scope that defines it wins
- [x] Expose a `readMergedHooksConfig(cwd?: string): HooksConfig` function that returns the fully merged result
- [x] Existing `readHooksConfig()` remains unchanged for callers that only need the global file
- [x] Verify project still compiles

---

### 4. Parameterize builtin policies — `src/hooks/builtin-policies.ts`

For each policy below: add `params` schema to its `BuiltinPolicyDefinition` entry and update the function body to read from `ctx.params` (never null-guard — defaults are always pre-applied by the evaluator).

- [x] `block-sudo` — param: `allowPatterns: string[]`, default `[]`. Match against parsed argv tokens, not raw string (see Open Items — allowPatterns safety)
- [x] `block-rm-rf` — param: `allowPaths: string[]`, default `[]`
- [x] `block-read-outside-cwd` — param: `allowPaths: string[]`, default `[]`
- [x] `block-push-master` — param: `protectedBranches: string[]`, default `["main", "master"]`. Replace hardcoded branch names with param value
- [x] `block-work-on-main` — param: `protectedBranches: string[]`, default `["main", "master"]`
- [x] `sanitize-api-keys` — param: `additionalPatterns: { regex: string; label: string }[]`, default `[]`
- [x] `block-secrets-write` — param: `additionalPatterns: string[]`, default `[]`
- [x] `warn-large-file-write` — param: `thresholdKb: number`, default `1024`
- [x] Verify that all policies with no user-provided params behave identically to before

---

### 5. Params injection — `src/hooks/policy-evaluator.ts`
- [x] Before calling each policy's `fn`, resolve `ctx.params` by merging `policyParams[policy.name]` over the policy's declared schema defaults
- [x] Use `readMergedHooksConfig()` (from step 3) instead of `readHooksConfig()` when loading config inside the evaluator
- [x] Verify project still compiles

---

### 6. Custom hooks registry — `src/hooks/custom-hooks-registry.ts` (new file)
- [x] Create `globalThis`-backed registry under key `__failproofai_custom_hooks__`
- [x] Implement `customHooks.add(hook: CustomHook): void`
- [x] Implement `getCustomHooks(): CustomHook[]`
- [x] Implement `clearCustomHooks(): void` (needed for test isolation)
- [x] Export `customHooks` object and `getCustomHooks`, `clearCustomHooks` functions
- [x] Verify project still compiles

---

### 7. Package exports
- [x] Export `customHooks` from the main `failproofai` package entry point
- [x] Export `allow`, `deny`, `instruct` helper functions from the main entry point (move them out of `builtin-policies.ts` or re-export them — they must be the same functions, not copies)
- [x] Export `CustomHook` type from the main entry point
- [x] Export `PolicyContext`, `PolicyResult`, `HookEventType` if not already exported (users need these for type annotations in their hooks file)
- [x] Verify `import { customHooks, allow, deny, instruct } from 'failproofai'` resolves correctly in a test import
- [x] Verify the ESM shim in the loader (`createEsmShim`) exports `allow`, `deny`, `instruct` alongside `customHooks` and `createApp`

---

### 8. Custom hooks loader — `src/hooks/custom-hooks-loader.ts` (new file)
- [x] Read `customHooksPath` from merged config; if absent, return early (no custom hooks)
- [x] Resolve the path to absolute
- [x] Check file exists; if not, log a warning to `~/.failproofai/hook.log` and return
- [x] Adapt `lib/evals/loader.ts` for the hook handler context: set a `__FAILPROOFAI_LOADING_HOOKS__` flag on `globalThis` before import (parallel to `__FAILPROOFAI_LOADING_EVALS__`), clear it after
- [x] Rewrite `from 'failproofai'` imports to the actual dist path so `customHooks` resolves to the same `globalThis` registry instance
- [x] Handle transitive relative imports (same recursive rewrite as the evals loader)
- [x] Clean up all temp `.mjs` files in a `finally` block
- [x] On import/syntax error: catch, log full error to `~/.failproofai/hook.log`, continue without crashing
- [x] After successful load, call `getCustomHooks()` and return the registered hooks
- [x] Verify project still compiles

---

### 9. Hook handler wiring — `src/hooks/handler.ts`
- [x] After registering builtin policies, call the custom hooks loader
- [x] Register each loaded custom hook into the policy registry with a `custom/` name prefix (prevents name collision with builtins)
- [x] Custom hooks run in layer 2 (after builtins) — verify priority ordering
- [x] Verify project still compiles

---

### 10. CLI — `src/hooks/manager.ts` and `src/cli-mode.ts`
- [x] Add `--custom-hooks <path>` flag to `installHooks()` — resolve to absolute path and write to `customHooksPath` in global `hooks-config.json`
- [x] Add `--remove-custom-hooks` flag — clears `customHooksPath` from config
- [x] Print the resolved hooks file path in the post-install summary
- [x] Add both flags to the CLI help text in `src/cli-mode.ts`
- [x] Verify project still compiles

---

### 11. `--list-hooks` display — `src/hooks/manager.ts`
- [x] Beneath each enabled policy that has user-configured params, print a summary line showing the active param values
- [x] Detect unknown keys in `policyParams` (keys that don't match any known policy schema param); print a warning line for each
- [x] If `customHooksPath` is set: attempt to load the file and show a "Custom Hooks" section beneath builtins
- [x] Each custom hook shows: status (`✓` / `✗ ERR`), declared name, description
- [x] On load failure: show `✗ ERR  <name>  failed to load: <error message>`
- [x] If `customHooksPath` is set but file does not exist: show a clear warning
- [x] Verify project still compiles

---

### 12. Unit tests — policy params

File: `__tests__/hooks/hooks-config.test.ts`
- [x] Test: no config files present → returns empty defaults
- [x] Test: only global config → returns global values
- [x] Test: project + global, `policyParams` defined in project → project values used, global values for that policy ignored
- [x] Test: project + global, policy absent in project → falls through to global
- [x] Test: all three scopes present, each with different `policyParams` entries → correct precedence
- [x] Test: `enabledPolicies` union across all three scopes, deduplication works
- [x] Test: `customHooksPath` — first scope that defines it wins

File: `__tests__/hooks/builtin-policies.test.ts`
- [x] Test: each parameterized policy with no `ctx.params` set behaves identically to current behavior (regression guard)
- [x] Test: `block-sudo` with `allowPatterns: ["sudo systemctl status"]` — matching command is allowed
- [x] Test: `block-sudo` with `allowPatterns` — non-matching sudo is still denied
- [x] Test: `block-rm-rf` with `allowPaths` — allowed path passes, unlisted path denied
- [x] Test: `block-read-outside-cwd` with `allowPaths` — listed path allowed
- [x] Test: `block-push-master` with `protectedBranches: ["main", "release"]` — `release` is now blocked, non-listed branch is not
- [x] Test: `block-work-on-main` with custom `protectedBranches`
- [x] Test: `sanitize-api-keys` with `additionalPatterns` — custom pattern triggers deny
- [x] Test: `block-secrets-write` with `additionalPatterns`
- [x] Test: `warn-large-file-write` with custom `thresholdKb`

File: `__tests__/hooks/policy-evaluator.test.ts`
- [x] Test: params are correctly resolved from schema defaults when no `policyParams` in config
- [x] Test: params from config correctly override schema defaults before `fn` is called
- [x] Test: unknown `policyParams` key does not crash the evaluator

---

### 13. Unit tests — custom hooks registry

New file: `__tests__/hooks/custom-hooks-registry.test.ts`
- [x] Test: `customHooks.add()` registers a hook into the globalThis registry
- [x] Test: `getCustomHooks()` returns all registered hooks in insertion order
- [x] Test: multiple `.add()` calls accumulate correctly
- [x] Test: `clearCustomHooks()` empties the registry (verify test isolation)
- [x] Test: registry survives across module re-imports (globalThis persistence)

---

### 14. Unit tests — custom hooks loader

New file: `__tests__/hooks/custom-hooks-loader.test.ts`
- [x] Test: `customHooksPath` absent in config → returns empty array, no error
- [x] Test: `customHooksPath` set but file does not exist → logs warning, returns empty array
- [x] Test: valid hooks file with one `customHooks.add()` call → hook registered and returned
- [x] Test: hooks file with import/syntax error → logs to hook.log, returns empty array, does not throw
- [x] Test: hooks file with transitive local import → transitive module resolved and loaded correctly
- [x] Test: temp `.mjs` files are cleaned up after load (success and error paths)

---

### 15. Unit tests — CLI and manager

File: `__tests__/hooks/manager.test.ts`
- [x] Test: `--custom-hooks <path>` saves resolved absolute path to `customHooksPath` in config
- [x] Test: `--remove-custom-hooks` clears `customHooksPath` from config
- [x] Test: `--list-hooks` output includes param summary for configured policies
- [x] Test: `--list-hooks` warns on unknown `policyParams` keys
- [x] Test: `--list-hooks` shows "Custom Hooks" section when `customHooksPath` is set
- [x] Test: `--list-hooks` shows error row when hooks file fails to load

---

### 16. Documentation — `README.md`
- [x] Add `policyParams` section explaining the three-scope config and precedence rules
- [x] Add a table or subsection for each parameterized policy: param name, type, default, example
- [x] Add `--custom-hooks <path>` to the CLI reference section
- [x] Add `--remove-custom-hooks` to the CLI reference section
- [x] Add a "Custom Hooks" authoring guide with:
  - [x] Installation step (`failproofai --install-hooks --custom-hooks ./my-hooks.js`)
  - [x] Full working example file using `customHooks.add()` with `allow()`, `deny()`, `instruct()`
  - [x] Description of each decision helper: `allow()`, `deny(message)`, `instruct(message)` — what each does, when to use it, what the message becomes in Claude's context
  - [x] Note that `deny(message)` is prefixed with `"Blocked by failproofai:"` in the output
  - [x] Description of `ctx` fields available (`eventType`, `toolName`, `toolInput`, `session`, `payload`)
  - [x] Note on transitive imports being supported
  - [x] Note on fail-open behavior and the hook.log location
- [x] Export `CustomHook`, `PolicyContext`, `PolicyResult` types in the Types section of the README

---

### 17. Changelog — `CHANGELOG.md`
- [x] Add `## [1.0.8-beta.0]` heading at the top
- [x] Document Part 1: policy params — mention `policyParams` config key, list all parameterized policies and their param names
- [x] Document Part 2: custom JS hooks — mention `--custom-hooks <path>`, `customHooks.add()` API, loader capabilities (transitive imports, ESM compat)
- [x] Reference the design doc (`design-docs/custom-hooks.md`) for full design rationale

---

### 18. Version bump
- [x] `package.json` → `"version": "1.0.8-beta.0"`
- [x] `packages/darwin-arm64/package.json` → `"version": "1.0.8-beta.0"`
- [x] `packages/darwin-x64/package.json` → `"version": "1.0.8-beta.0"`
- [x] `packages/linux-arm64/package.json` → `"version": "1.0.8-beta.0"`
- [x] `packages/linux-x64/package.json` → `"version": "1.0.8-beta.0"`
- [x] `packages/win32-x64/package.json` → `"version": "1.0.8-beta.0"`
- [x] `packages/wrapper/package.json` → `"version": "1.0.8-beta.0"`
- [x] Verify all version strings are consistent (`grep -r "1.0.7" package.json packages/`)

---

### 19. Final verification
- [x] `npm run build` (or equivalent) passes with zero errors
- [x] Full test suite passes (`npm test` or equivalent) with zero failures
- [x] `failproofai --list-hooks` runs without error on a clean install
- [x] `failproofai --install-hooks --custom-hooks <path>` correctly saves the path and loads hooks on next event
- [x] A manually authored `my-hooks.js` using `customHooks.add()` with a transitive import loads and evaluates correctly end-to-end
- [x] No `console.log` debug statements left in production code paths
- [x] No new `any` types introduced without a comment explaining why

---

### 20. Pull request
- [x] Stage all changes: confirm `git status` shows only intentional files (no `.env`, no build artifacts, no temp files)
- [x] Commit with a descriptive message referencing both features, e.g. `feat: policy params + custom JS hooks (v1.0.8-beta.0)`
- [x] Push the branch: `git push -u origin feat/custom-hooks`
- [x] Open a PR against `main` using `gh pr create` with:
  - Title: `feat: policy params and custom JS hooks (v1.0.8-beta.0)`
  - Body covering:
    - [x] Summary of Part 1 (policy params — what changed, which policies, config shape)
    - [x] Summary of Part 2 (custom hooks — API, loader, `--custom-hooks` flag)
    - [x] Link to `design-docs/custom-hooks.md` for full design rationale
    - [x] Test plan: what was tested manually and what is covered by unit tests
    - [x] Note on backwards compatibility (no-params users are unaffected)
- [x] Confirm the PR URL is accessible and the description renders correctly

---

### 21. CI monitoring and fixes
- [x] Watch the CI run: `gh run watch` or `gh pr checks <pr-number> --watch`
- [x] Wait for all checks to complete — do not assume green until every job has finished
- [x] If any check fails:
  - [x] Fetch the failure logs: `gh run view <run-id> --log-failed`
  - [x] Read the full error output before attempting a fix — do not guess
  - [x] Fix the root cause (do not skip or suppress failing checks with `--no-verify` or similar)
  - [x] Push the fix as a new commit on the same branch
  - [x] Re-watch CI until all checks pass
- [x] Repeat the fix cycle until every CI check is green
- [x] Once all checks pass, mark this section complete and notify the user that the PR is ready for review

---

## Open Items

- **#154** — Fail-open vs fail-closed semantics for enforcement hooks
- **Per-custom-hook params** — letting `policyParams` configure custom hooks via `ctx.params`
  (deferred, design in a separate doc when ready)
- **`allowPatterns` matching safety** — implementation must parse commands into argv tokens,
  not match raw strings, to prevent shell operator injection bypass
