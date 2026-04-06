/**
 * E2E tests for policy parameter injection.
 *
 * Tests that policyParams in config are correctly injected into policy functions
 * via policy-evaluator.ts, overriding schema defaults.
 */
import { describe, it } from "vitest";
import { runHook, assertAllow, assertPreToolUseDeny, assertPostToolUseDeny, assertInstruct } from "../helpers/hook-runner";
import { createFixtureEnv } from "../helpers/fixture-env";
import { Payloads } from "../helpers/payloads";

// ── block-sudo — allowPatterns ───────────────────────────────────────────────

describe("block-sudo allowPatterns", () => {
  it("allows sudo command matching an allowPattern", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["block-sudo"],
      policyParams: { "block-sudo": { allowPatterns: ["sudo systemctl status *"] } },
    });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("sudo systemctl status nginx", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("blocks sudo command not matching the allowPattern", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["block-sudo"],
      policyParams: { "block-sudo": { allowPatterns: ["sudo systemctl status *"] } },
    });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("sudo rm /etc/hosts", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("blocks all sudo when allowPatterns is empty (default)", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["block-sudo"],
      policyParams: { "block-sudo": { allowPatterns: [] } },
    });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("sudo systemctl status nginx", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });
});

// ── block-push-master — protectedBranches ───────────────────────────────────

describe("block-push-master protectedBranches", () => {
  it("denies push to a custom protected branch", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["block-push-master"],
      policyParams: { "block-push-master": { protectedBranches: ["release"] } },
    });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("git push origin release", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("allows push to main when only release is protected", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["block-push-master"],
      policyParams: { "block-push-master": { protectedBranches: ["release"] } },
    });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("git push origin main", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("allows push to any branch when protectedBranches is empty", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["block-push-master"],
      policyParams: { "block-push-master": { protectedBranches: [] } },
    });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("git push origin main", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });
});

// ── block-rm-rf — allowPaths ─────────────────────────────────────────────────

describe("block-rm-rf allowPaths", () => {
  it("allows recursive delete inside an allowlisted path", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["block-rm-rf"],
      policyParams: { "block-rm-rf": { allowPaths: ["/tmp/safe"] } },
    });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("rm -rf /tmp/safe/*", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("blocks recursive delete outside the allowlisted path", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["block-rm-rf"],
      policyParams: { "block-rm-rf": { allowPaths: ["/tmp/safe"] } },
    });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("rm -rf /home/*", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("blocks recursive delete with empty allowPaths (default)", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["block-rm-rf"],
      policyParams: { "block-rm-rf": { allowPaths: [] } },
    });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("rm -rf /tmp/*", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });
});

// ── warn-large-file-write — thresholdKb ─────────────────────────────────────

describe("warn-large-file-write thresholdKb", () => {
  it("instructs when content exceeds custom threshold", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["warn-large-file-write"],
      policyParams: { "warn-large-file-write": { thresholdKb: 100 } },
    });
    const content = "x".repeat(150 * 1024); // 150KB > 100KB threshold
    const result = runHook("PreToolUse", Payloads.preToolUse.write(`${env.cwd}/out.txt`, content, env.cwd), { homeDir: env.home });
    assertInstruct(result);
  });

  it("allows content under custom threshold", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["warn-large-file-write"],
      policyParams: { "warn-large-file-write": { thresholdKb: 100 } },
    });
    const content = "x".repeat(50 * 1024); // 50KB < 100KB threshold
    const result = runHook("PreToolUse", Payloads.preToolUse.write(`${env.cwd}/out.txt`, content, env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("allows 500KB content under default 1024KB threshold", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["warn-large-file-write"] });
    const content = "x".repeat(500 * 1024); // 500KB < 1024KB default
    const result = runHook("PreToolUse", Payloads.preToolUse.write(`${env.cwd}/out.txt`, content, env.cwd), { homeDir: env.home });
    assertAllow(result);
  });
});

// ── sanitize-api-keys — additionalPatterns ───────────────────────────────────

describe("sanitize-api-keys additionalPatterns", () => {
  it("denies PostToolUse output matching a custom additional pattern", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["sanitize-api-keys"],
      policyParams: {
        "sanitize-api-keys": {
          additionalPatterns: [{ regex: "MY_TOKEN_[A-Z0-9]{16}", label: "Internal token" }],
        },
      },
    });
    const output = "result: MY_TOKEN_ABCDEFGHIJ123456";
    const result = runHook("PostToolUse", Payloads.postToolUse.bash("cat token.txt", output, env.cwd), { homeDir: env.home });
    assertPostToolUseDeny(result);
  });

  it("allows PostToolUse output not matching the custom pattern", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["sanitize-api-keys"],
      policyParams: {
        "sanitize-api-keys": {
          additionalPatterns: [{ regex: "MY_TOKEN_[A-Z0-9]{16}", label: "Internal token" }],
        },
      },
    });
    const result = runHook("PostToolUse", Payloads.postToolUse.bash("ls", "file1.txt", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });
});

// ── block-secrets-write — additionalPatterns ─────────────────────────────────

describe("block-secrets-write additionalPatterns", () => {
  it("blocks write to file matching custom pattern", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["block-secrets-write"],
      policyParams: { "block-secrets-write": { additionalPatterns: [".token"] } },
    });
    const result = runHook("PreToolUse", Payloads.preToolUse.write(`${env.cwd}/auth.token`, "secret", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("allows write to file not matching custom pattern", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["block-secrets-write"],
      policyParams: { "block-secrets-write": { additionalPatterns: [".token"] } },
    });
    const result = runHook("PreToolUse", Payloads.preToolUse.write(`${env.cwd}/auth.json`, "{}", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });
});

// ── block-read-outside-cwd — allowPaths ─────────────────────────────────────

describe("block-read-outside-cwd allowPaths", () => {
  it("blocks read of file outside cwd when no allowPaths configured", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["block-read-outside-cwd"] });
    const result = runHook("PreToolUse", Payloads.preToolUse.read("/etc/hosts", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("allows read of file outside cwd when path is in allowPaths", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["block-read-outside-cwd"],
      policyParams: { "block-read-outside-cwd": { allowPaths: ["/etc/hosts"] } },
    });
    const result = runHook("PreToolUse", Payloads.preToolUse.read("/etc/hosts", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });

  it("blocks read of file not covered by allowPaths", () => {
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["block-read-outside-cwd"],
      policyParams: { "block-read-outside-cwd": { allowPaths: ["/etc/hosts"] } },
    });
    const result = runHook("PreToolUse", Payloads.preToolUse.read("/etc/passwd", env.cwd), { homeDir: env.home });
    assertPreToolUseDeny(result);
  });

  it("allows read of file inside cwd regardless of allowPaths", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["block-read-outside-cwd"] });
    const result = runHook("PreToolUse", Payloads.preToolUse.read(`${env.cwd}/README.md`, env.cwd), { homeDir: env.home });
    assertAllow(result);
  });
});

// ── block-work-on-main — protectedBranches ───────────────────────────────────

describe("block-work-on-main protectedBranches", () => {
  it("fail-open when cwd is not a git repo (cannot determine branch)", () => {
    // Policy calls execSync to detect the current branch. Outside a git repo it
    // fails and the policy fails-open (allows).
    const env = createFixtureEnv();
    env.writeConfig({
      enabledPolicies: ["block-work-on-main"],
      policyParams: { "block-work-on-main": { protectedBranches: ["main", "master", "release"] } },
    });
    const result = runHook("PreToolUse", Payloads.preToolUse.bash('git commit -m "test"', env.cwd), { homeDir: env.home });
    // Not in a git repo → execSync throws → policy fails open
    assertAllow(result);
  });

  it("ignores non-commit commands (git checkout is not blocked by this policy)", () => {
    const env = createFixtureEnv();
    env.writeConfig({ enabledPolicies: ["block-work-on-main"] });
    // Policy only matches: git commit|merge|rebase|cherry-pick
    const result = runHook("PreToolUse", Payloads.preToolUse.bash("git checkout main", env.cwd), { homeDir: env.home });
    assertAllow(result);
  });
});
