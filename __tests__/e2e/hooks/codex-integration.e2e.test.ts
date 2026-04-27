import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync, spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir, tmpdir } from "node:os";

const BINARY_PATH = resolve(__dirname, "../../../bin/failproofai.mjs");
const DEDUP_DIR = resolve(homedir(), ".failproofai", "cache", "dedup");
const REAL_ACTIVITY_STORE = resolve(homedir(), ".failproofai", "cache", "hook-activity");

describe("E2E: OpenAI Codex Integration", () => {
  let projectDir: string;
  let isoHome: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "fp-e2e-codex-"));
    isoHome = mkdtempSync(join(tmpdir(), "fp-e2e-codex-home-"));
    if (existsSync(DEDUP_DIR)) rmSync(DEDUP_DIR, { recursive: true, force: true });
    mkdirSync(resolve(projectDir, ".codex"), { recursive: true });
    writeFileSync(resolve(projectDir, ".codex", "hooks.json"), JSON.stringify({ version: 1, hooks: {} }));
  });

  afterEach(() => {
    if (existsSync(projectDir)) rmSync(projectDir, { recursive: true, force: true });
    if (existsSync(isoHome)) rmSync(isoHome, { recursive: true, force: true });
  });

  const baseEnv = () => ({ ...process.env, FAILPROOFAI_DIST_PATH: process.cwd(), FAILPROOFAI_SKIP_KILL: "true", FAILPROOFAI_ACTIVITY_STORE_DIR: REAL_ACTIVITY_STORE });

  it("denies sudo via pre_tool_use (snake_case) event with exit 2", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli codex --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    // Codex sends snake_case hook_event_name and plain string tool_input
    const payload = {
      session_id: "test-session-codex-001",
      cwd: projectDir,
      hook_event_name: "pre_tool_use",
      tool_name: "bash",
      tool_input: "sudo rm -rf /",
      integration: "codex",
    };

    const { status, stdout, stderr } = spawnSync("bun", [BINARY_PATH, "--hook", "pre_tool_use", "--cli", "codex"], {
      input: JSON.stringify(payload),
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
      encoding: "utf8",
    });

    expect(status).toBe(2);
    expect(stdout).toBe("");
    expect(stderr).toContain("block-sudo");
    expect(stderr).toContain("sudo");
  });

  it("allows benign commands with exit 0 and empty output", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli codex --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const payload = {
      session_id: "test-session-codex-002",
      cwd: projectDir,
      hook_event_name: "pre_tool_use",
      tool_name: "bash",
      tool_input: "ls -la",
      integration: "codex",
    };

    const { status, stdout, stderr } = spawnSync("bun", [BINARY_PATH, "--hook", "pre_tool_use", "--cli", "codex"], {
      input: JSON.stringify(payload),
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
      encoding: "utf8",
    });

    expect(status).toBe(0);
    expect(stdout.trim()).toBe("");
    expect(stderr.trim()).toBe("");
  });

  it("writes hooks to .codex/hooks.json for project scope", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli codex --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const codexHooksPath = resolve(projectDir, ".codex", "hooks.json");
    const hooks = JSON.parse(readFileSync(codexHooksPath, "utf8"));
    expect(hooks.version).toBe(1);
    expect(hooks.hooks).toBeDefined();
    // Codex stores hooks under PascalCase keys (CODEX_EVENT_MAP: pre_tool_use → PreToolUse)
    expect(hooks.hooks.PreToolUse).toBeDefined();
    expect(hooks.hooks.PreToolUse.length).toBeGreaterThan(0);
    // Codex uses ClaudeHookMatcher format: [{hooks: [{command: "..."}]}]
    expect(hooks.hooks.PreToolUse.some((h: any) => h.hooks?.[0]?.command?.includes("--hook PreToolUse --cli codex"))).toBe(true);
  });

  it("deny message uses default [FailproofAI Security Stop] format (not claude/gemini/cursor format)", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli codex --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const payload = {
      session_id: "test-session-codex-003",
      cwd: projectDir,
      hook_event_name: "pre_tool_use",
      tool_name: "bash",
      tool_input: "sudo whoami",
      integration: "codex",
    };

    const { stderr } = spawnSync("bun", [BINARY_PATH, "--hook", "pre_tool_use", "--cli", "codex"], {
      input: JSON.stringify(payload),
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
      encoding: "utf8",
    });

    // Codex uses the default deny format (not the claude-code, gemini, or cursor styles)
    expect(stderr).toContain("[FailproofAI Security Stop]");
    expect(stderr).not.toContain("ACTION BLOCKED BY FAILPROOFAI");
    expect(stderr).not.toContain("MANDATORY ACTION REQUIRED");
    expect(stderr).not.toContain("[FailproofAI] block-sudo:");
  });
});
