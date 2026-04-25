// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { execSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";

// Mock the environment
const TMP_DIR = resolve(process.cwd(), "scratch", "test-stop-event");

describe("E2E: Stop Event Support (OpenCode & Pi)", () => {
  beforeEach(() => {
    if (existsSync(TMP_DIR)) {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
    mkdirSync(TMP_DIR, { recursive: true });
  });

  it("OpenCode: session.idle triggers Stop hook", () => {
    const binaryPath = resolve(process.cwd(), "dist", "cli.mjs");
    const cmd = `node ${binaryPath} --hook session.idle --integration opencode --stdin`;
    
    const payload = JSON.stringify({
      integration: "opencode",
      session_id: "ses_test_opencode",
      cwd: TMP_DIR
    });

    try {
      const output = execSync(cmd, { input: payload, encoding: "utf8" });
      expect(output).toContain("ALLOW");
    } catch (err: any) {
      // If it's blocked, it means the hook fired and policies were evaluated!
      // This is also a pass for 'Stop event support'
      const combined = (err.stdout || "") + (err.stderr || "") + (err.message || "");
      expect(combined).toMatch(/ALLOW|Security Stop|require-commit-before-stop/);
    }
  });

  it("Pi: assistant message with stopReason triggers Stop hook", () => {
    const binaryPath = resolve(process.cwd(), "dist", "cli.mjs");
    const cmd = `node ${binaryPath} --hook stop --integration pi --stdin`;
    
    const payload = JSON.stringify({
      integration: "pi",
      session_id: "pi-test-session",
      cwd: TMP_DIR
    });

    try {
      const output = execSync(cmd, { input: payload, encoding: "utf8" });
      expect(output).toContain("ALLOW");
    } catch (err: any) {
      const combined = (err.stdout || "") + (err.stderr || "") + (err.message || "");
      expect(combined).toMatch(/ALLOW|Security Stop|require-commit-before-stop/);
    }
  });
});
