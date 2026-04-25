import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir, tmpdir } from "node:os";

const BINARY_PATH = resolve(__dirname, "../../../bin/failproofai.mjs");
const DEDUP_DIR = resolve(homedir(), ".failproofai", "cache", "dedup");

describe("E2E: OpenCode Integration", () => {
  let projectDir: string;
  let isoHome: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "fp-e2e-opencode-"));
    isoHome = mkdtempSync(join(tmpdir(), "fp-e2e-opencode-home-"));
    if (existsSync(DEDUP_DIR)) rmSync(DEDUP_DIR, { recursive: true, force: true });
  });

  afterEach(() => {
    if (existsSync(projectDir)) rmSync(projectDir, { recursive: true, force: true });
    if (existsSync(isoHome)) rmSync(isoHome, { recursive: true, force: true });
  });

  const baseEnv = () => ({ ...process.env, FAILPROOFAI_DIST_PATH: process.cwd(), FAILPROOFAI_SKIP_KILL: "true" });

  it("denies sudo via tool.execute.before event (exit 2 + stderr message)", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli opencode --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const payload = {
      session_id: "ses_test001",
      cwd: projectDir,
      hook_event_name: "tool.execute.before",
      tool_name: "bash",
      tool_input: "sudo rm -rf /",
      integration: "opencode",
    };

    const { status, stdout, stderr } = spawnSync(
      "bun",
      [BINARY_PATH, "--hook", "tool.execute.before", "--cli", "opencode"],
      {
        input: JSON.stringify(payload),
        cwd: projectDir,
        env: { ...baseEnv(), HOME: isoHome },
        encoding: "utf8",
      },
    );

    expect(status).toBe(2);
    expect(stdout).toBe("");
    expect(stderr).toContain("block-sudo");
    expect(stderr).toContain("sudo");
  });

  it("allows benign commands with exit 0 and empty output", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli opencode --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const payload = {
      session_id: "ses_test002",
      cwd: projectDir,
      hook_event_name: "tool.execute.before",
      tool_name: "bash",
      tool_input: "ls -la",
      integration: "opencode",
    };

    const { status, stdout, stderr } = spawnSync(
      "bun",
      [BINARY_PATH, "--hook", "tool.execute.before", "--cli", "opencode"],
      {
        input: JSON.stringify(payload),
        cwd: projectDir,
        env: { ...baseEnv(), HOME: isoHome },
        encoding: "utf8",
      },
    );

    expect(status).toBe(0);
    expect(stdout.trim()).toBe("");
    expect(stderr.trim()).toBe("");
  });

  it("writes TypeScript plugin to .opencode/plugins/failproofai.ts for project scope", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli opencode --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const pluginPath = resolve(projectDir, ".opencode", "plugins", "failproofai.ts");
    expect(existsSync(pluginPath)).toBe(true);
    const content = readFileSync(pluginPath, "utf8");
    expect(content).toContain("FailproofAIPlugin");
    expect(content).toContain("--hook");
    expect(content).toContain("--cli opencode");
  });

  it("does NOT emit warning at install time when require-commit-before-stop is installed (Stop event is supported)", () => {
    const result = spawnSync(
      "bun",
      [BINARY_PATH, "policies", "--install", "require-commit-before-stop", "--cli", "opencode", "--scope", "project"],
      {
        cwd: projectDir,
        env: { ...baseEnv(), HOME: isoHome },
        encoding: "utf8",
      },
    );

    const combinedOutput = result.stdout + result.stderr;
    expect(combinedOutput).not.toContain("does not support a Stop event");
    expect(combinedOutput).toContain("require-commit-before-stop");
  });

  it("deny message uses default [FailproofAI Security Stop] format", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-rm-rf --cli opencode --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const payload = {
      session_id: "ses_test003",
      cwd: projectDir,
      hook_event_name: "tool.execute.before",
      tool_name: "bash",
      tool_input: "rm -rf /tmp",
      integration: "opencode",
    };

    const { stderr } = spawnSync(
      "bun",
      [BINARY_PATH, "--hook", "tool.execute.before", "--cli", "opencode"],
      {
        input: JSON.stringify(payload),
        cwd: projectDir,
        env: { ...baseEnv(), HOME: isoHome },
        encoding: "utf8",
      },
    );

    expect(stderr).toContain("[FailproofAI Security Stop]");
    expect(stderr).not.toContain("ACTION BLOCKED BY FAILPROOFAI");
    expect(stderr).not.toContain("MANDATORY ACTION REQUIRED");
  });
});
