import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { getIntegration } from "../../../src/hooks/integrations";
import type { IntegrationType } from "../../../src/hooks/types";

const BINARY_PATH = resolve(__dirname, "../../../bin/failproofai.mjs");
const DIST_PATH = resolve(__dirname, "../../../dist");
const ALL_CLIS: IntegrationType[] = [
  "claude-code",
  "cursor",
  "gemini",
  "copilot",
  "codex",
  "opencode",
  "pi",
];

function createCustomHookFile(projectDir: string, filename: string, hookName: string): string {
  const hooksDir = resolve(projectDir, ".hooks");
  mkdirSync(hooksDir, { recursive: true });
  const filePath = resolve(hooksDir, filename);
  writeFileSync(filePath, `
    import { customPolicies, allow } from "failproofai";
    customPolicies.add({
      name: "${hookName}",
      description: "custom install matrix",
      match: { events: ["PreToolUse"] },
      fn: async () => allow(),
    });
  `, "utf8");
  return filePath;
}

function readProjectConfig(projectDir: string): Record<string, unknown> {
  const path = resolve(projectDir, ".failproofai", "policies-config.json");
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

describe("E2E CLI: --custom install/clear across all CLIs", () => {
  let projectDir: string;
  let homeDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "fp-e2e-cli-custom-matrix-project-"));
    homeDir = mkdtempSync(join(tmpdir(), "fp-e2e-cli-custom-matrix-home-"));
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
      timeout: 25_000,
    });

  for (const cli of ALL_CLIS) {
    it(`installs and clears custom path for ${cli}`, () => {
      const hookPath = createCustomHookFile(projectDir, `${cli}-hook.mjs`, `${cli}-custom-hook`);

      const install = runPolicies(
        "--install",
        "--custom",
        hookPath,
        "--scope",
        "project",
        "--cli",
        cli,
      );

      expect(install.status).toBe(0);
      expect(install.stderr).toBe("");
      const cfgAfterInstall = readProjectConfig(projectDir);
      expect(cfgAfterInstall.customPoliciesPath).toBe(resolve(hookPath));

      const integration = getIntegration(cli);
      expect(integration.hooksInstalledInSettings("project", projectDir)).toBe(true);

      const uninstall = runPolicies(
        "--uninstall",
        "--custom",
        "--scope",
        "project",
        "--cli",
        cli,
      );

      expect(uninstall.status).toBe(0);
      const cfgAfterUninstall = readProjectConfig(projectDir);
      expect(cfgAfterUninstall.customPoliciesPath).toBeUndefined();
      expect(integration.hooksInstalledInSettings("project", projectDir)).toBe(false);
    });
  }

  it("installs and clears custom path for all CLIs in one command", () => {
    const hookPath = createCustomHookFile(projectDir, "all-clis-hook.mjs", "all-clis-custom-hook");

    const install = runPolicies(
      "--install",
      "--custom",
      hookPath,
      "--scope",
      "project",
      "--cli",
      ...ALL_CLIS,
    );

    expect(install.status).toBe(0);
    expect(install.stderr).toBe("");
    const cfgAfterInstall = readProjectConfig(projectDir);
    expect(cfgAfterInstall.customPoliciesPath).toBe(resolve(hookPath));

    for (const cli of ALL_CLIS) {
      const integration = getIntegration(cli);
      expect(integration.hooksInstalledInSettings("project", projectDir)).toBe(true);
    }

    const uninstall = runPolicies(
      "--uninstall",
      "--custom",
      "--scope",
      "project",
      "--cli",
      ...ALL_CLIS,
    );

    expect(uninstall.status).toBe(0);
    const cfgAfterUninstall = readProjectConfig(projectDir);
    expect(cfgAfterUninstall.customPoliciesPath).toBeUndefined();

    for (const cli of ALL_CLIS) {
      const integration = getIntegration(cli);
      expect(integration.hooksInstalledInSettings("project", projectDir)).toBe(false);
    }
  });
});
