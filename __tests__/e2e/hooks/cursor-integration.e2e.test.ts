import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync, spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { CursorPayloads } from "../helpers/payloads";

const BINARY_PATH = resolve(__dirname, "../../../bin/failproofai.mjs");
const PROJECT_DIR = resolve(__dirname, "../../fixtures/cursor-project");
const CURSOR_HOOKS_PATH = resolve(PROJECT_DIR, ".cursor", "hooks.json");
const CONFIG_PATH = resolve(PROJECT_DIR, ".failproofai", "policies-config.json");
// Firing-lock files can persist across test cases. Clear them.
const DEDUP_DIR = resolve(require("node:os").homedir(), ".failproofai", "cache", "dedup");

describe("E2E: Cursor Integration", () => {
  beforeEach(() => {
    if (existsSync(PROJECT_DIR)) rmSync(PROJECT_DIR, { recursive: true, force: true });
    if (existsSync(DEDUP_DIR)) rmSync(DEDUP_DIR, { recursive: true, force: true });
    mkdirSync(PROJECT_DIR, { recursive: true });
    // Initialize empty cursor hooks
    mkdirSync(resolve(PROJECT_DIR, ".cursor"), { recursive: true });
    writeFileSync(CURSOR_HOOKS_PATH, JSON.stringify({ version: 1, hooks: {} }));
  });

  afterEach(() => {
    if (existsSync(PROJECT_DIR)) rmSync(PROJECT_DIR, { recursive: true, force: true });
  });

  it("denies sudo command via Cursor preToolUse hook", () => {
    // 1. Install block-sudo for Cursor project scope
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli cursor --scope project`, {
      cwd: PROJECT_DIR,
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd() }
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
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd(), FAILPROOFAI_SKIP_KILL: "true" },
      encoding: "utf8"
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
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd() }
    });

    // 2. Trigger hook with ONLY workspace_roots (no cwd)
    const payload = CursorPayloads.preToolUse.bash("sudo ls", PROJECT_DIR);
    delete payload.cwd; // Force normalization from workspace_roots[0]

    const output = spawnSync("bun", [BINARY_PATH, "--hook", "PreToolUse"], {
      input: JSON.stringify(payload),
      cwd: PROJECT_DIR,
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd(), FAILPROOFAI_SKIP_KILL: "true" },
      encoding: "utf8"
    });
    expect(output.status).toBe(0);
    const parsedDeny = JSON.parse(output.stdout.trim());
    expect(parsedDeny.continue).toBe(false);
    expect(output.stderr).toContain("ACTION BLOCKED BY FAILPROOFAI");
  });

  it("allows benign commands", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli cursor --scope project`, {
      cwd: PROJECT_DIR,
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd() }
    });

    const payload = CursorPayloads.preToolUse.bash("ls -la", PROJECT_DIR);
    
    const { status, stdout } = spawnSync("bun", [BINARY_PATH, "--hook", "PreToolUse"], {
      input: JSON.stringify(payload),
      cwd: PROJECT_DIR,
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd(), FAILPROOFAI_SKIP_KILL: "true" },
      encoding: "utf8"
    });

    expect(status).toBe(0);
    expect(JSON.parse(stdout.trim())).toEqual({ continue: true, permission: "allow" });
  });

  it("blocks sudo via beforeShellExecution event (tool_name normalization)", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli cursor --scope project`, {
      cwd: PROJECT_DIR,
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd() }
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
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd(), FAILPROOFAI_SKIP_KILL: "true" },
      encoding: "utf8"
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
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd() }
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
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd(), FAILPROOFAI_SKIP_KILL: "true" },
      encoding: "utf8"
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
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd() }
    });
    expect(JSON.parse(readFileSync(CURSOR_HOOKS_PATH, "utf8")).hooks.beforeShellExecution).toBeDefined();

    // Uninstall
    execSync(`bun ${BINARY_PATH} policies --uninstall --cli cursor --scope project`, {
      cwd: PROJECT_DIR,
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd() }
    });

    const hooks = JSON.parse(readFileSync(CURSOR_HOOKS_PATH, "utf8"));
    expect(hooks.hooks).toBeUndefined();
  });
});
