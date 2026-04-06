/**
 * E2E tests for builtin policy edge cases not covered in builtin-policies.e2e.test.ts.
 *
 * Kept in a separate file because builtin-policies.e2e.test.ts contains
 * sanitize-connection-strings fixtures that trigger the PostToolUse hook.
 */
import { describe, it } from "vitest";
import { runHook, assertAllow, assertInstruct } from "../helpers/hook-runner";
import { createFixtureEnv } from "../helpers/fixture-env";
import { Payloads } from "../helpers/payloads";

// ── warn-package-publish — additional package managers ───────────────────────

describe("warn-package-publish extended", () => {
  it("instructs on bun publish", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["warn-package-publish"] });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("bun publish", env.cwd), { homeDir: env.home });
    assertInstruct(result);
  });

  it("allows bare yarn publish (policy only matches yarn npm publish)", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["warn-package-publish"] });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("yarn publish", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("allows bun install (not a publish)", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["warn-package-publish"] });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("bun install", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });
});

// ── block-failproofai-commands — npx/bunx invocations ───────────────────────────

describe("block-failproofai-commands extended", () => {
  it("allows npx failproofai (regex requires failproofai at cmd start, not after npx)", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["block-failproofai-commands"] });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("npx failproofai --list-hooks", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("allows bunx failproofai (regex requires failproofai at cmd start, not after bunx)", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["block-failproofai-commands"] });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("bunx failproofai --hook PreToolUse", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });
});

// ── warn-git-stash-drop — git stash clear ────────────────────────────────────

describe("warn-git-stash-drop extended", () => {
  it("instructs on git stash clear (drops all stashes)", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["warn-git-stash-drop"] });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("git stash clear", env.cwd), { homeDir: env.home });
    assertInstruct(result);
  });
});
