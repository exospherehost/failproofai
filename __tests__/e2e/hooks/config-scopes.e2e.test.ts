/**
 * E2E tests for config scope merging.
 *
 * Tests src/hooks/hooks-config.ts merge behavior across project / local / global scopes.
 * Priority order: project > local > global for policyParams/customPoliciesPath.
 * enabledPolicies: union across all three scopes.
 */
import { describe, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runHook, assertAllow, assertPreToolUseDeny, assertInstruct } from "../helpers/hook-runner";
import { createFixtureEnv } from "../helpers/fixture-env";
import { Payloads } from "../helpers/payloads";

describe("config-scopes", () => {
  it("project config enables block-sudo → sudo is blocked", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["block-sudo"] }, "project");
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("sudo apt update", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("no config anywhere → no policies fire → allow", () => {
    const env = createFixtureEnv();
    // Don't write any config — home is empty, cwd has no .failproofai/
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("sudo rm -rf /", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("enabledPolicies union: project enables block-sudo, local enables block-rm-rf → both fire", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["block-sudo"] }, "project");
    env.writeConfig({ enabledPolicies: ["block-rm-rf"] }, "local");

    const sudoResult = runHook("PreToolUse", Payloads.preToolUse.bash("sudo apt install", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(sudoResult);

    const rmResult = runHook("PreToolUse", Payloads.preToolUse.bash("rm -rf /*", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(rmResult);
  });

  it("policyParams: local thresholdKb beats global thresholdKb (local > global precedence)", () => {
    const env = createFixtureEnv();
    // Global sets a high threshold (500KB), local overrides to 200KB
    env.writeConfig(
      { enabledPolicies: ["warn-large-file-write"], policyParams: { "warn-large-file-write": { thresholdKb: 500 } } },
      "global",
    );
    env.writeConfig(
      { enabledPolicies: [], policyParams: { "warn-large-file-write": { thresholdKb: 200 } } },
      "local",
    );
    env.writeConfig({ enabledPolicies: ["warn-large-file-write"] }, "project");

    // 250KB — should trigger the local 200KB threshold, not the global 500KB one
    const content = "x".repeat(250 * 1024);
    const result = runHook("PreToolUse", Payloads.preToolUse.write(`${env.cwd}/out.txt`, content, env.cwd), { homeDir: env.home });
    assertInstruct(result);
  });

  it("policyParams: project thresholdKb beats local thresholdKb (project > local precedence)", () => {
    const env = createFixtureEnv();
    // Project sets 500KB, local sets 200KB — project wins, so 300KB should NOT trigger
    env.writeConfig(
      { enabledPolicies: ["warn-large-file-write"], policyParams: { "warn-large-file-write": { thresholdKb: 500 } } },
      "project",
    );
    env.writeConfig(
      { enabledPolicies: [], policyParams: { "warn-large-file-write": { thresholdKb: 200 } } },
      "local",
    );

    // 300KB — above local 200KB but below project 500KB → allow (project wins)
    const content = "x".repeat(300 * 1024);
    const result = runHook("PreToolUse", Payloads.preToolUse.write(`${env.cwd}/out.txt`, content, env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("global config alone enables a policy → policy fires", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["block-sudo"] }, "global");
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("sudo whoami", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("real ~/.failproofai does not leak in when homeDir is isolated", () => {
    const env = createFixtureEnv();
    // Write nothing — isolated home has no .failproofai at all
    // Even if the test runner's real ~/.failproofai has policies, they must not fire
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("sudo apt install", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("malformed JSON in project config → fail-open (allow)", () => {
    const env = createFixtureEnv();
    // Write invalid JSON to the config file directly (bypass env.writeConfig which uses JSON.stringify)
    const dir = join(env.cwd, ".failproofai");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "policies-config.json"), "not json", "utf8");
    // With malformed config, hook runner should not crash — fail-open
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("sudo rm -rf /", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("customPoliciesPath pointing to non-existent file → fail-open (allow)", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: [],
      customPoliciesPath: `${env.cwd}/.hooks/does-not-exist.mjs`,
    });
    // Non-existent hooks file — loadCustomHooks should handle gracefully, fail-open
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("ls", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });
});
