import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync, spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { CursorPayloads } from "../helpers/payloads";

const BINARY_PATH = resolve(__dirname, "../../../bin/failproofai.mjs");

describe("E2E: Cursor Integration", () => {
  let PROJECT_DIR: string;
  let CURSOR_HOOKS_PATH: string;
  let CONFIG_PATH: string;
  let isoHome: string;

  beforeEach(() => {
    PROJECT_DIR = mkdtempSync(join(tmpdir(), "fp-e2e-cursor-"));
    isoHome = mkdtempSync(join(tmpdir(), "fp-e2e-cursor-home-"));
    CURSOR_HOOKS_PATH = resolve(PROJECT_DIR, ".cursor", "hooks.json");
    CONFIG_PATH = resolve(PROJECT_DIR, ".failproofai", "policies-config.json");
    mkdirSync(resolve(PROJECT_DIR, ".cursor"), { recursive: true });
    writeFileSync(CURSOR_HOOKS_PATH, JSON.stringify({ version: 1, hooks: {} }));
  });

  afterEach(() => {
    if (existsSync(PROJECT_DIR)) rmSync(PROJECT_DIR, { recursive: true, force: true });
    if (existsSync(isoHome)) rmSync(isoHome, { recursive: true, force: true });
  });

  const baseEnv = () => ({ ...process.env, FAILPROOFAI_DIST_PATH: process.cwd(), HOME: isoHome });

  it("denies sudo command via Cursor preToolUse hook", () => {
    // 1. Install block-sudo for Cursor project scope
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli cursor --scope project`, {
      cwd: PROJECT_DIR,
      env: baseEnv(),
    });

    // 2. Verify hooks.json was written correctly
    const hooks = JSON.parse(readFileSync(CURSOR_HOOKS_PATH, "utf8"));
    expect(hooks.version).toBe(1);
    expect(hooks.hooks.beforeShellExecution[0].command).toContain("--hook PreToolUse");

    // 3. Trigger the hook with a sudo payload
    const payload = CursorPayloads.preToolUse.bash("sudo rm -rf /", PROJECT_DIR);

    const { status, stdout, stderr } = spawnSync("bun", [BINARY_PATH, "--hook", "PreToolUse"], {
      input: JSON.stringify(payload),
      cwd: PROJECT_DIR,
      env: { ...baseEnv(), FAILPROOFAI_SKIP_KILL: "true" },
      encoding: "utf8",
    });

    // Cursor expects Exit 0 for a protocol-compliant JSON denial.
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout.trim());
    expect(parsed.continue).toBe(false);
    expect(parsed.permission).toBe("deny");
    expect(stderr).toContain("ACTION BLOCKED BY FAILPROOFAI");
    expect(stderr).toContain("sudo");
  });

  it("normalizes workspace_roots to cwd", () => {
    // 1. Install block-sudo
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli cursor --scope project`, {
      cwd: PROJECT_DIR,
      env: baseEnv(),
    });

    // 2. Trigger hook with ONLY workspace_roots (no cwd)
    const payload = CursorPayloads.preToolUse.bash("sudo ls", PROJECT_DIR);
    delete payload.cwd; // Force normalization from workspace_roots[0]

    const output = spawnSync("bun", [BINARY_PATH, "--hook", "PreToolUse"], {
      input: JSON.stringify(payload),
      cwd: PROJECT_DIR,
      env: { ...baseEnv(), FAILPROOFAI_SKIP_KILL: "true" },
      encoding: "utf8",
    });
    expect(output.status).toBe(0);
    const parsedDeny = JSON.parse(output.stdout.trim());
    expect(parsedDeny.continue).toBe(false);
    expect(output.stderr).toContain("ACTION BLOCKED BY FAILPROOFAI");
  });

  it("allows benign commands", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli cursor --scope project`, {
      cwd: PROJECT_DIR,
      env: baseEnv(),
    });

    const payload = CursorPayloads.preToolUse.bash("ls -la", PROJECT_DIR);

    const { status, stdout } = spawnSync("bun", [BINARY_PATH, "--hook", "PreToolUse"], {
      input: JSON.stringify(payload),
      cwd: PROJECT_DIR,
      env: { ...baseEnv(), FAILPROOFAI_SKIP_KILL: "true" },
      encoding: "utf8",
    });

    expect(status).toBe(0);
    expect(JSON.parse(stdout.trim())).toEqual({ continue: true, permission: "allow" });
  });

  it("blocks sudo via beforeShellExecution event (tool_name normalization)", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli cursor --scope project`, {
      cwd: PROJECT_DIR,
      env: baseEnv(),
    });

    // beforeShellExecution events don't include tool_name — normalizePayload must map to run_terminal_command
    const payload = {
      session_id: "test-session",
      workspace_roots: [PROJECT_DIR],
      integration: "cursor",
      hook_event_name: "beforeShellExecution",
      command: "sudo rm -rf /tmp/test",
    };

    const { status, stdout, stderr } = spawnSync("bun", [BINARY_PATH, "--hook", "PreToolUse"], {
      input: JSON.stringify(payload),
      cwd: PROJECT_DIR,
      env: { ...baseEnv(), FAILPROOFAI_SKIP_KILL: "true" },
      encoding: "utf8",
    });

    expect(status).toBe(0);
    const parsed = JSON.parse(stdout.trim());
    expect(parsed.continue).toBe(false);
    expect(parsed.permission).toBe("deny");
    expect(stderr).toContain("ACTION BLOCKED BY FAILPROOFAI");
    expect(stderr).toContain("sudo");
  });

  it("blocks env file read via beforeReadFile event (file_path normalization)", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-env-files --cli cursor --scope project`, {
      cwd: PROJECT_DIR,
      env: baseEnv(),
    });

    // beforeReadFile events send file_path at the top level — normalizePayload must wrap it
    const payload = {
      session_id: "test-session",
      workspace_roots: [PROJECT_DIR],
      integration: "cursor",
      hook_event_name: "beforeReadFile",
      file_path: `${PROJECT_DIR}/.env`,
    };

    const { status, stdout, stderr } = spawnSync("bun", [BINARY_PATH, "--hook", "PreToolUse"], {
      input: JSON.stringify(payload),
      cwd: PROJECT_DIR,
      env: { ...baseEnv(), FAILPROOFAI_SKIP_KILL: "true" },
      encoding: "utf8",
    });

    expect(status).toBe(0);
    const parsed = JSON.parse(stdout.trim());
    expect(parsed.continue).toBe(false);
    expect(parsed.permission).toBe("deny");
    expect(stderr).toContain("ACTION BLOCKED BY FAILPROOFAI");
  });

  it("uninstalls cursor hooks correctly", () => {
    // Install
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli cursor --scope project`, {
      cwd: PROJECT_DIR,
      env: baseEnv(),
    });
    expect(JSON.parse(readFileSync(CURSOR_HOOKS_PATH, "utf8")).hooks.beforeShellExecution).toBeDefined();

    // Uninstall
    execSync(`bun ${BINARY_PATH} policies --uninstall --cli cursor --scope project`, {
      cwd: PROJECT_DIR,
      env: baseEnv(),
    });

    const hooks = JSON.parse(readFileSync(CURSOR_HOOKS_PATH, "utf8"));
    expect(hooks.hooks).toBeUndefined();
  });
});
