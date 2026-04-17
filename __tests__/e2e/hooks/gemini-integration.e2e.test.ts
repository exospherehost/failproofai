import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync, spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { GeminiPayloads } from "../helpers/payloads";

const BINARY_PATH = resolve(__dirname, "../../../bin/failproofai.mjs");
const PROJECT_DIR = resolve(__dirname, "../../fixtures/gemini-project");
const GEMINI_SETTINGS_PATH = resolve(PROJECT_DIR, ".gemini", "settings.json");
// Cursor and Copilot e2e tests share the same SESSION_ID + sudo fingerprint as
// Gemini, so their firing-lock file (5s bucket) can still be on disk when
// Gemini runs and block this test with "instant-catch twin". Clear it.
const DEDUP_DIR = resolve(homedir(), ".failproofai", "cache", "dedup");

describe("E2E: Gemini Integration", () => {
  beforeEach(() => {
    if (existsSync(PROJECT_DIR)) rmSync(PROJECT_DIR, { recursive: true, force: true });
    if (existsSync(DEDUP_DIR)) rmSync(DEDUP_DIR, { recursive: true, force: true });
    mkdirSync(PROJECT_DIR, { recursive: true });
    mkdirSync(resolve(PROJECT_DIR, ".gemini"), { recursive: true });
    writeFileSync(GEMINI_SETTINGS_PATH, JSON.stringify({ hooks: {} }));
  });

  afterEach(() => {
    if (existsSync(PROJECT_DIR)) rmSync(PROJECT_DIR, { recursive: true, force: true });
  });

  it("denies sudo via Gemini BeforeTool hook with deny decision", () => {
    // 1. Install block-sudo
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --integration gemini --scope project`, {
      cwd: PROJECT_DIR,
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd() }
    });

    // 2. Trigger the hook
    const payload = GeminiPayloads.beforeTool.bash("sudo rm -rf /", PROJECT_DIR);
    
    // We pass --integration gemini to ensure it doesn't fallback to claude-code
    const { stdout, stderr } = spawnSync("bun", [BINARY_PATH, "--hook", "BeforeTool", "--integration", "gemini"], {
      input: JSON.stringify(payload),
      cwd: PROJECT_DIR,
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd(), FAILPROOFAI_LOG_LEVEL: "info" },
      encoding: "utf8"
    });
    console.log("Gemini STDOUT:", stdout);
    console.log("Gemini STDERR:", stderr);
    
    expect(stdout).toContain('"decision":"deny"');
    expect(stdout).toContain("sudo");
  });

  it("allows benign commands with empty output", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --integration gemini --scope project`, {
      cwd: PROJECT_DIR,
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd() }
    });

    const payload = GeminiPayloads.beforeTool.bash("ls", PROJECT_DIR);
    const output = execSync(`bun ${BINARY_PATH} --hook BeforeTool --integration gemini`, {
      input: JSON.stringify(payload),
      cwd: PROJECT_DIR,
      env: { ...process.env, FAILPROOFAI_DIST_PATH: process.cwd() }
    }).toString();

    expect(output.trim()).toBe("");
  });
});
