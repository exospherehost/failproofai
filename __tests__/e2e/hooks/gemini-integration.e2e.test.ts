import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync, spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { GeminiPayloads } from "../helpers/payloads";

const BINARY_PATH = resolve(__dirname, "../../../bin/failproofai.mjs");

describe("E2E: Gemini Integration", () => {
  let PROJECT_DIR: string;
  let GEMINI_SETTINGS_PATH: string;
  let isoHome: string;

  beforeEach(() => {
    PROJECT_DIR = mkdtempSync(join(tmpdir(), "fp-e2e-gemini-"));
    isoHome = mkdtempSync(join(tmpdir(), "fp-e2e-gemini-home-"));
    GEMINI_SETTINGS_PATH = resolve(PROJECT_DIR, ".gemini", "settings.json");
    mkdirSync(resolve(PROJECT_DIR, ".gemini"), { recursive: true });
    writeFileSync(GEMINI_SETTINGS_PATH, JSON.stringify({ hooks: {} }));
  });

  afterEach(() => {
    if (existsSync(PROJECT_DIR)) rmSync(PROJECT_DIR, { recursive: true, force: true });
    if (existsSync(isoHome)) rmSync(isoHome, { recursive: true, force: true });
  });

  const baseEnv = () => ({ ...process.env, FAILPROOFAI_DIST_PATH: process.cwd(), HOME: isoHome });

  it("denies sudo via Gemini BeforeTool hook with deny decision", () => {
    // 1. Install block-sudo
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli gemini --scope project`, {
      cwd: PROJECT_DIR,
      env: baseEnv(),
    });

    // 2. Trigger the hook
    const payload = GeminiPayloads.beforeTool.bash("sudo rm -rf /", PROJECT_DIR);

    // We pass --cli gemini to ensure it doesn't fallback to claude-code
    const { status, stdout, stderr } = spawnSync("bun", [BINARY_PATH, "--hook", "BeforeTool", "--cli", "gemini"], {
      input: JSON.stringify(payload),
      cwd: PROJECT_DIR,
      env: { ...baseEnv(), FAILPROOFAI_LOG_LEVEL: "info", FAILPROOFAI_SKIP_KILL: "true" },
      encoding: "utf8",
    });
    console.log("Gemini STDOUT:", stdout);
    console.log("Gemini STDERR:", stderr);

    // Gemini expects Exit 0 for a protocol-compliant JSON denial.
    // If we exit with 2, it may "fail open" and proceed with the action.
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout.trim());
    expect(parsed.decision).toBe("deny");
    expect(parsed.systemMessage).toContain("Action prohibited by FailproofAI");
    expect(parsed.reason).toBe(parsed.systemMessage);
    expect(parsed.reason).toContain("policy: block-sudo");
    expect(stderr).toContain("MANDATORY ACTION REQUIRED");
    expect(stderr).toContain("sudo");
  });

  it("allows benign commands with empty output", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli gemini --scope project`, {
      cwd: PROJECT_DIR,
      env: baseEnv(),
    });

    const payload = GeminiPayloads.beforeTool.bash("ls", PROJECT_DIR);
    const output = execSync(`bun ${BINARY_PATH} --hook BeforeTool --cli gemini`, {
      input: JSON.stringify(payload),
      cwd: PROJECT_DIR,
      env: { ...baseEnv(), FAILPROOFAI_SKIP_KILL: "true" },
    }).toString();

    expect(JSON.parse(output.trim())).toEqual({ decision: "allow" });
  });

  it("denies sudo from stringified Gemini toolArgs payloads", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli gemini --scope project`, {
      cwd: PROJECT_DIR,
      env: baseEnv(),
    });

    const payload = {
      session_id: "test-session-gemini-json-001",
      cwd: PROJECT_DIR,
      hook_event_name: "BeforeTool",
      toolName: "Shell",
      toolArgs: "{\"command\":\"sudo apt-get update\",\"cwd\":\"" + PROJECT_DIR.replace(/\\/g, "\\\\") + "\"}",
    };

    const { status, stdout, stderr } = spawnSync("bun", [BINARY_PATH, "--hook", "BeforeTool", "--cli", "gemini"], {
      input: JSON.stringify(payload),
      cwd: PROJECT_DIR,
      env: { ...baseEnv(), FAILPROOFAI_SKIP_KILL: "true" },
      encoding: "utf8",
    });

    expect(status).toBe(0);
    const parsed = JSON.parse(stdout.trim());
    expect(parsed.decision).toBe("deny");
    expect(parsed.systemMessage).toContain("Action prohibited by FailproofAI");
    expect(parsed.reason).toBe(parsed.systemMessage);
    expect(parsed.reason).toContain("policy: block-sudo");
    expect(stderr).toContain("MANDATORY ACTION REQUIRED");
    expect(stderr).toContain("sudo");
  });

  it("blocks env on Gemini Shell tool name via BeforeTool", () => {
    execSync(`bun ${BINARY_PATH} policies --install protect-env-vars --cli gemini --scope project`, {
      cwd: PROJECT_DIR,
      env: baseEnv(),
    });

    const payload = {
      session_id: "test-session-e2e-001",
      cwd: PROJECT_DIR,
      hook_event_name: "BeforeTool",
      tool_name: "Shell",
      tool_input: "env",
    };

    const { status, stdout, stderr } = spawnSync("bun", [BINARY_PATH, "--hook", "BeforeTool", "--cli", "gemini"], {
      input: JSON.stringify(payload),
      cwd: PROJECT_DIR,
      env: { ...baseEnv(), FAILPROOFAI_SKIP_KILL: "true" },
      encoding: "utf8",
    });

    expect(status).toBe(0);
    const parsed = JSON.parse(stdout.trim());
    expect(parsed.decision).toBe("deny");
    expect(parsed.systemMessage).toContain("Action prohibited by FailproofAI");
    expect(parsed.reason).toBe(parsed.systemMessage);
    expect(parsed.reason).toContain("policy: protect-env-vars");
    expect(stderr).toContain("MANDATORY ACTION REQUIRED");
    expect(stderr).toContain("environment variables");
  });
});
