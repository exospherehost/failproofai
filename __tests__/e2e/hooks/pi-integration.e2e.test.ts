import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir, tmpdir } from "node:os";

const BINARY_PATH = resolve(__dirname, "../../../bin/failproofai.mjs");
const DEDUP_DIR = resolve(homedir(), ".failproofai", "cache", "dedup");

describe("E2E: Pi Coding Agent Integration", () => {
  let projectDir: string;
  let isoHome: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "fp-e2e-pi-"));
    isoHome = mkdtempSync(join(tmpdir(), "fp-e2e-pi-home-"));
    if (existsSync(DEDUP_DIR)) rmSync(DEDUP_DIR, { recursive: true, force: true });
  });

  afterEach(() => {
    if (existsSync(projectDir)) rmSync(projectDir, { recursive: true, force: true });
    if (existsSync(isoHome)) rmSync(isoHome, { recursive: true, force: true });
  });

  const baseEnv = () => ({ ...process.env, FAILPROOFAI_DIST_PATH: process.cwd(), FAILPROOFAI_SKIP_KILL: "true" });

  it("denies sudo via tool_call event (exit 2 + stderr message)", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli pi --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const payload = {
      session_id: "pi-test-001",
      cwd: projectDir,
      hook_event_name: "tool_call",
      tool_name: "bash",
      tool_input: { command: "sudo rm -rf /" },
      integration: "pi",
    };

    const { status, stdout, stderr } = spawnSync(
      "bun",
      [BINARY_PATH, "--hook", "tool_call", "--cli", "pi"],
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
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli pi --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const payload = {
      session_id: "pi-test-002",
      cwd: projectDir,
      hook_event_name: "tool_call",
      tool_name: "bash",
      tool_input: { command: "echo hello" },
      integration: "pi",
    };

    const { status, stdout, stderr } = spawnSync(
      "bun",
      [BINARY_PATH, "--hook", "tool_call", "--cli", "pi"],
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

  it("writes TypeScript extension to .pi/extensions/failproofai.ts for project scope", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli pi --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const pluginPath = resolve(projectDir, ".pi", "extensions", "failproofai.ts");
    expect(existsSync(pluginPath)).toBe(true);
    const content = readFileSync(pluginPath, "utf8");
    expect(content).toContain("FailproofAI");
    expect(content).toContain("--hook");
    expect(content).toContain("--cli pi");
  });

  it("deny message uses default [FailproofAI Security Stop] format", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-rm-rf --cli pi --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const payload = {
      session_id: "pi-test-003",
      cwd: projectDir,
      hook_event_name: "tool_call",
      tool_name: "bash",
      tool_input: { command: "rm -rf /tmp" },
      integration: "pi",
    };

    const { stderr } = spawnSync(
      "bun",
      [BINARY_PATH, "--hook", "tool_call", "--cli", "pi"],
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

  it("PostToolUse tool_result event routes to PostToolUse canonical event (allow with block-sudo)", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli pi --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    // block-sudo only fires on PreToolUse; PostToolUse should allow
    const payload = {
      session_id: "pi-test-004",
      cwd: projectDir,
      hook_event_name: "tool_result",
      tool_name: "bash",
      tool_output: "command output",
      integration: "pi",
    };

    const { status } = spawnSync(
      "bun",
      [BINARY_PATH, "--hook", "tool_result", "--cli", "pi"],
      {
        input: JSON.stringify(payload),
        cwd: projectDir,
        env: { ...baseEnv(), HOME: isoHome },
        encoding: "utf8",
      },
    );

    expect(status).toBe(0);
  });
});
