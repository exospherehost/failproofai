# Testing

failproofai has two test suites: **unit tests** (fast, mocked) and **end-to-end tests** (real subprocess invocations).

---

## Running tests

```bash
# Run all unit tests once
bun run test:run

# Run unit tests in watch mode
bun run test

# Run E2E tests (requires setup — see below)
bun run test:e2e

# Type-check without building
bunx tsc --noEmit

# Lint
bun run lint
```

---

## Unit tests

Unit tests live in `__tests__/` and use [Vitest](https://vitest.dev) with `happy-dom`.

```
__tests__/
  hooks/
    builtin-policies.test.ts      # Policy logic for each builtin
    hooks-config.test.ts          # Config loading and scope merging
    policy-evaluator.test.ts      # Param injection and evaluation order
    custom-hooks-registry.test.ts # globalThis registry add/get/clear
    custom-hooks-loader.test.ts   # ESM loader, transitive imports, error handling
    manager.test.ts               # install/remove/list operations
  components/
    sessions-list.test.tsx        # Session list component
    project-list.test.tsx         # Project list component
    ...
  lib/
    logger.test.ts
    paths.test.ts
    date-filters.test.ts
    telemetry.test.ts
    ...
  actions/
    get-hooks-config.test.ts
    get-hook-activity.test.ts
    ...
  contexts/
    ThemeContext.test.tsx
    AutoRefreshContext.test.tsx
```

### Writing a policy unit test

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { getBuiltinPolicies } from "../../src/hooks/builtin-policies";
import { allow, deny } from "../../src/hooks/policy-types";

describe("block-sudo", () => {
  const policy = getBuiltinPolicies().find((p) => p.name === "block-sudo")!;

  it("denies sudo commands", () => {
    const ctx = {
      eventType: "PreToolUse" as const,
      payload: {},
      toolName: "Bash",
      toolInput: { command: "sudo apt install nodejs" },
      params: { allowPatterns: [] },
    };
    expect(policy.fn(ctx)).toEqual(deny("sudo command blocked by failproofai"));
  });

  it("allows non-sudo commands", () => {
    const ctx = {
      eventType: "PreToolUse" as const,
      payload: {},
      toolName: "Bash",
      toolInput: { command: "ls -la" },
      params: { allowPatterns: [] },
    };
    expect(policy.fn(ctx)).toEqual(allow());
  });

  it("allows patterns in allowPatterns", () => {
    const ctx = {
      eventType: "PreToolUse" as const,
      payload: {},
      toolName: "Bash",
      toolInput: { command: "sudo systemctl status nginx" },
      params: { allowPatterns: ["sudo systemctl status"] },
    };
    expect(policy.fn(ctx)).toEqual(allow());
  });
});
```

---

## End-to-end tests

E2E tests invoke the real `failproofai` binary as a subprocess, pipe a JSON payload to stdin, and assert on the stdout output and exit code. This tests the complete integration path that Claude Code uses.

### Setup

E2E tests require the npm package to be built and installed locally first:

```bash
bun run test:npx
```

This script:
1. Builds the Next.js standalone
2. Compiles the native binary (`bun build --compile`)
3. Packs and installs both platform and wrapper packages into `.test-npx/`

Once setup, run the tests:

```bash
bun run test:e2e
```

The built package persists in `.test-npx/` between runs, so you only need to run `test:npx` again after making changes to the hook handler or binary entry point.

### E2E test structure

```
__tests__/e2e/
  helpers/
    hook-runner.ts      # Spawn the binary, pipe payload JSON, capture exit code + stdout + stderr
    fixture-env.ts      # Per-test isolated temp directories with config files
    payloads.ts         # Claude-accurate payload factories for each event type
  hooks/
    builtin-policies.e2e.test.ts   # Each builtin policy with real subprocess
    custom-hooks.e2e.test.ts       # Custom hook loading and evaluation
    config-scopes.e2e.test.ts      # Config merging across project/local/global
    policy-params.e2e.test.ts      # Parameter injection for each parameterized policy
```

### Using the E2E helpers

**`FixtureEnv`** — isolated per-test environment:

```typescript
import { createFixtureEnv } from "../helpers/fixture-env";

const env = createFixtureEnv();
// env.cwd    — temp dir; pass as payload.cwd to pick up .failproofai/hooks-config.json
// env.home   — isolated home dir; no real ~/.failproofai leaks in

env.writeConfig({
  enabledPolicies: ["block-sudo"],
  policyParams: {
    "block-sudo": { allowPatterns: ["sudo systemctl status"] },
  },
});
```

`createFixtureEnv()` registers `afterEach` cleanup automatically.

**`runHook`** — invoke the binary:

```typescript
import { runHook } from "../helpers/hook-runner";
import { Payloads } from "../helpers/payloads";

const result = await runHook(
  "PreToolUse",
  Payloads.preToolUse.bash("sudo apt install nodejs", env.cwd),
  { homeDir: env.home }
);

expect(result.exitCode).toBe(0);
expect(result.parsed?.hookSpecificOutput?.permissionDecision).toBe("deny");
```

**`Payloads`** — ready-made payload factories:

```typescript
Payloads.preToolUse.bash(command, cwd)
Payloads.preToolUse.write(filePath, content, cwd)
Payloads.preToolUse.read(filePath, cwd)
Payloads.postToolUse.bash(command, output, cwd)
Payloads.postToolUse.read(filePath, content, cwd)
Payloads.notification(message, cwd)
Payloads.stop(cwd)
```

### Writing an E2E test

```typescript
import { describe, it, expect } from "vitest";
import { createFixtureEnv } from "../helpers/fixture-env";
import { runHook } from "../helpers/hook-runner";
import { Payloads } from "../helpers/payloads";

describe("block-rm-rf (E2E)", () => {
  it("denies rm -rf", async () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["block-rm-rf"] });

    const result = await runHook(
      "PreToolUse",
      Payloads.preToolUse.bash("rm -rf /", env.cwd),
      { homeDir: env.home }
    );

    expect(result.exitCode).toBe(0);
    expect(result.parsed?.hookSpecificOutput?.permissionDecision).toBe("deny");
  });

  it("allows non-recursive rm", async () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["block-rm-rf"] });

    const result = await runHook(
      "PreToolUse",
      Payloads.preToolUse.bash("rm /tmp/file.txt", env.cwd),
      { homeDir: env.home }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("");  // allow → empty stdout
  });
});
```

### E2E response shapes

| Decision | Exit code | stdout |
|----------|-----------|--------|
| `PreToolUse` deny | `0` | `{"hookSpecificOutput":{"permissionDecision":"deny","permissionDecisionReason":"..."}}` |
| `PostToolUse` deny | `0` | `{"hookSpecificOutput":{"additionalContext":"Blocked ... because: ..."}}` |
| Instruct (non-Stop) | `0` | `{"hookSpecificOutput":{"additionalContext":"Instruction from failproofai: ..."}}` |
| Stop instruct | `2` | empty stdout; reason in stderr |
| Allow | `0` | empty string |

### Vitest config

E2E tests use `vitest.config.e2e.mts` with:

- `environment: "node"` — no browser globals needed
- `pool: "forks"` — true process isolation (tests spawn subprocesses)
- `testTimeout: 20_000` — 20s per test (binary startup + hook eval)

The `forks` pool is important: thread-based workers share `globalThis`, which can interfere with subprocess-spawning tests. Process-based forks avoid this.

---

## CI

The full CI run (`bun run lint && bunx tsc --noEmit && bun run test:run && bun run build`) is required to pass before merging. The E2E suite runs as a separate CI job in parallel.

See [Contributing](../CONTRIBUTING.md) for the complete pre-merge checklist.
