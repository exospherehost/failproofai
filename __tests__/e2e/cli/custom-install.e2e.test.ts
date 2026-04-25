import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const BINARY_PATH = resolve(__dirname, "../../../bin/failproofai.mjs");
const DIST_PATH = resolve(__dirname, "../../../dist");

describe("E2E CLI: policies --install --custom positive flow", () => {
  let projectDir: string;
  let homeDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "fp-e2e-cli-custom-project-"));
    homeDir = mkdtempSync(join(tmpdir(), "fp-e2e-cli-custom-home-"));
    mkdirSync(resolve(projectDir, ".claude"), { recursive: true });
    writeFileSync(resolve(projectDir, ".claude", "settings.json"), JSON.stringify({ hooks: {} }, null, 2), "utf8");
  });

  afterEach(() => {
    if (existsSync(projectDir)) rmSync(projectDir, { recursive: true, force: true });
    if (existsSync(homeDir)) rmSync(homeDir, { recursive: true, force: true });
  });

  const cliEnv = (): NodeJS.ProcessEnv => ({
    ...process.env,
    HOME: homeDir,
    FAILPROOFAI_DIST_PATH: DIST_PATH,
    FAILPROOFAI_TELEMETRY_DISABLED: "1",
    FAILPROOFAI_SKIP_KILL: "true",
  });

  const runPolicies = (...args: string[]) =>
    spawnSync("bun", [BINARY_PATH, "policies", ...args], {
      cwd: projectDir,
      env: cliEnv(),
      encoding: "utf8",
      timeout: 20_000,
    });

  const writeCustomHook = (filename: string, hookName: string): string => {
    const hooksDir = resolve(projectDir, ".hooks");
    mkdirSync(hooksDir, { recursive: true });
    const filePath = resolve(hooksDir, filename);
    writeFileSync(filePath, `
      import { customPolicies, allow } from "failproofai";
      customPolicies.add({
        name: "${hookName}",
        description: "cli custom install test",
        match: { events: ["PreToolUse"] },
        fn: async () => allow(),
      });
    `, "utf8");
    return filePath;
  };

  const readProjectConfig = (): Record<string, unknown> => {
    const path = resolve(projectDir, ".failproofai", "policies-config.json");
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  };

  it("accepts existing custom file and persists absolute customPoliciesPath", () => {
    const hookPath = writeCustomHook("custom-a.mjs", "custom-a");

    const result = runPolicies(
      "--install",
      "--custom",
      hookPath,
      "--scope",
      "project",
      "--cli",
      "claude-code",
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    const cfg = readProjectConfig();
    expect(cfg.customPoliciesPath).toBe(resolve(hookPath));
  });

  it("resolves relative --custom path to absolute path in persisted config", () => {
    writeCustomHook("relative-hook.mjs", "relative-hook");

    const result = runPolicies(
      "--install",
      "--custom",
      "./.hooks/relative-hook.mjs",
      "--scope",
      "project",
      "--cli",
      "claude-code",
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    const cfg = readProjectConfig();
    expect(cfg.customPoliciesPath).toBe(resolve(projectDir, ".hooks", "relative-hook.mjs"));
  });

  it("replaces prior customPoliciesPath and clears it via uninstall --custom", () => {
    const firstHook = writeCustomHook("first.mjs", "first-hook");
    const secondHook = writeCustomHook("second.mjs", "second-hook");

    const installFirst = runPolicies(
      "--install",
      "--custom",
      firstHook,
      "--scope",
      "project",
      "--cli",
      "claude-code",
    );
    expect(installFirst.status).toBe(0);

    const installSecond = runPolicies(
      "--install",
      "--custom",
      secondHook,
      "--scope",
      "project",
      "--cli",
      "claude-code",
    );
    expect(installSecond.status).toBe(0);
    expect(readProjectConfig().customPoliciesPath).toBe(resolve(secondHook));

    const clearCustom = runPolicies(
      "--uninstall",
      "--custom",
      "--scope",
      "project",
      "--cli",
      "claude-code",
    );

    expect(clearCustom.status).toBe(0);
    const cfgAfterClear = readProjectConfig();
    expect(cfgAfterClear.customPoliciesPath).toBeUndefined();
  });
});
