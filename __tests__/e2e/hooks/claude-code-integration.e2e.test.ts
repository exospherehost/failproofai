import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync, spawnSync } from "node:child_process";
import { writeFileSync, existsSync, mkdtempSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { Payloads } from "../helpers/payloads";

const BINARY_PATH = resolve(__dirname, "../../../bin/failproofai.mjs");
const DEDUP_DIR = resolve(homedir(), ".failproofai", "cache", "dedup");

describe("E2E: Claude Code Integration", () => {
  let projectDir: string;
  let isoHome: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "fp-e2e-claude-"));
    isoHome = mkdtempSync(join(tmpdir(), "fp-e2e-claude-home-"));
    if (existsSync(DEDUP_DIR)) rmSync(DEDUP_DIR, { recursive: true, force: true });
    mkdirSync(resolve(projectDir, ".claude"), { recursive: true });
    writeFileSync(resolve(projectDir, ".claude", "settings.json"), JSON.stringify({ hooks: {} }));
  });

  afterEach(() => {
    if (existsSync(projectDir)) rmSync(projectDir, { recursive: true, force: true });
    if (existsSync(isoHome)) rmSync(isoHome, { recursive: true, force: true });
  });

  const baseEnv = () => ({ ...process.env, FAILPROOFAI_DIST_PATH: process.cwd(), FAILPROOFAI_SKIP_KILL: "true" });

  it("denies sudo via PreToolUse hook (exit 2 + stderr message)", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli claude-code --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const payload = Payloads.preToolUse.bash("sudo rm -rf /", projectDir);

    const { status, stdout, stderr } = spawnSync("bun", [BINARY_PATH, "--hook", "PreToolUse", "--cli", "claude-code"], {
      input: JSON.stringify(payload),
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
      encoding: "utf8",
    });

    expect(status).toBe(2);
    expect(stdout).toBe("");
    expect(stderr).toContain("[FailproofAI]");
    expect(stderr).toContain("block-sudo");
    expect(stderr).toContain("sudo");
  });

  it("allows benign commands with exit 0 and empty output", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli claude-code --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const payload = Payloads.preToolUse.bash("ls -la", projectDir);

    const { status, stdout, stderr } = spawnSync("bun", [BINARY_PATH, "--hook", "PreToolUse", "--cli", "claude-code"], {
      input: JSON.stringify(payload),
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
      encoding: "utf8",
    });

    expect(status).toBe(0);
    expect(stdout.trim()).toBe("");
    expect(stderr.trim()).toBe("");
  });

  it("denies PostToolUse with sanitize-jwt policy when output contains a JWT", () => {
    execSync(`bun ${BINARY_PATH} policies --install sanitize-jwt --cli claude-code --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const jwtOutput =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const payload = Payloads.postToolUse.bash("cat /tmp/token", jwtOutput, projectDir);

    const { status, stderr } = spawnSync("bun", [BINARY_PATH, "--hook", "PostToolUse", "--cli", "claude-code"], {
      input: JSON.stringify(payload),
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
      encoding: "utf8",
    });

    expect(status).toBe(2);
    expect(stderr).toContain("sanitize-jwt");
  });

  it("writes hooks to .claude/settings.json for project scope", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli claude-code --scope project`, {
      cwd: projectDir,
      env: { ...baseEnv(), HOME: isoHome },
    });

    const settingsPath = resolve(projectDir, ".claude", "settings.json");
    const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    expect(settings.hooks).toBeDefined();
    const preToolUseHooks = settings.hooks.PreToolUse ?? [];
    expect(preToolUseHooks.length).toBeGreaterThan(0);
    expect(preToolUseHooks.some((h: any) => h.hooks?.some((e: any) => e.command?.includes("--hook PreToolUse")))).toBe(true);
  });
});
