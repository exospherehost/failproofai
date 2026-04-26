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

  const runHook = (eventName: string, payload: Record<string, unknown>) => {
    return spawnSync("bun", [BINARY_PATH, "--hook", eventName, "--cli", "gemini"], {
      input: JSON.stringify(payload),
      cwd: PROJECT_DIR,
      env: { ...baseEnv(), FAILPROOFAI_LOG_LEVEL: "info", FAILPROOFAI_SKIP_KILL: "true" },
      encoding: "utf8",
    });
  };

  it("denies sudo via Gemini BeforeTool hook with deny decision", () => {
    // 1. Install block-sudo
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli gemini --scope project`, {
      cwd: PROJECT_DIR,
      env: baseEnv(),
    });

    // 2. Trigger the hook
    const payload = GeminiPayloads.beforeTool.bash("sudo rm -rf /", PROJECT_DIR);

    const { status, stdout, stderr } = runHook("BeforeTool", payload);
    console.log("Gemini STDOUT:", stdout);
    console.log("Gemini STDERR:", stderr);

    // Gemini expects Exit 0 for a protocol-compliant JSON denial.
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
    const { stdout } = runHook("BeforeTool", payload);

    expect(JSON.parse(stdout.trim())).toEqual({ decision: "allow" });
  });

  it("denies sudo from stringified Gemini toolArgs payloads", () => {
    execSync(`bun ${BINARY_PATH} policies --install block-sudo --cli gemini --scope project`, {
      cwd: PROJECT_DIR,
      env: baseEnv(),
    });

    const payload = GeminiPayloads.beforeTool.bashViaToolArgs("sudo apt-get update", PROJECT_DIR);

    const { status, stdout, stderr } = runHook("BeforeTool", payload);

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

    const payload = GeminiPayloads.beforeTool.bash("env", PROJECT_DIR);

    const { status, stdout, stderr } = runHook("BeforeTool", payload);

    expect(status).toBe(0);
    const parsed = JSON.parse(stdout.trim());
    expect(parsed.decision).toBe("deny");
    expect(parsed.systemMessage).toContain("Action prohibited by FailproofAI");
    expect(parsed.reason).toBe(parsed.systemMessage);
    expect(parsed.reason).toContain("policy: protect-env-vars");
    expect(stderr).toContain("MANDATORY ACTION REQUIRED");
    expect(stderr).toContain("environment variables");
  });

  it("denies production writes on Gemini WriteFile tool via canonicalization", () => {
    // 1. Create a custom policy file
    const policyPath = resolve(PROJECT_DIR, "prod-policy.js");
    writeFileSync(policyPath, `
      import { customPolicies, allow, deny, isBashTool } from "failproofai";
      customPolicies.add({
        name: "block-production-writes",
        match: { events: ["PreToolUse"] },
        fn: async (ctx) => {
          if (ctx.toolName === "Write") {
             if (ctx.toolInput?.file_path?.includes("production")) {
                return deny("Production write blocked");
             }
          }
          return allow();
        }
      });
    `);

    // 2. Install with custom path
    execSync(`bun ${BINARY_PATH} policies --install --custom ${policyPath} --cli gemini --scope project`, {
      cwd: PROJECT_DIR,
      env: baseEnv(),
    });

    // 3. Trigger with WriteFile (should be canonicalized to Write)
    const payload = GeminiPayloads.beforeTool.writeFile("/etc/production.conf", PROJECT_DIR);
    const { status, stdout } = runHook("BeforeTool", payload);

    expect(status).toBe(0);
    const parsed = JSON.parse(stdout.trim());
    expect(parsed.decision).toBe("deny");
    expect(parsed.reason).toContain("Production write blocked");
  });
});
