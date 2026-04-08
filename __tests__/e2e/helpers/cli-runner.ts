/**
 * Runs the failproofai binary as a subprocess for CLI argument e2e tests.
 *
 * Unlike hook-runner.ts (which feeds JSON via stdin), this runner invokes
 * the binary with arbitrary CLI args and captures stdout/stderr/exitCode.
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { expect } from "vitest";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function getBinaryPath(): string {
  return resolve(REPO_ROOT, "bin/failproofai.mjs");
}

export interface CliRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * Invoke `failproofai <...args>` and return stdout, stderr, exitCode.
 *
 * @param args - CLI arguments to pass to the binary
 */
export function runCli(...args: string[]): CliRunResult {
  const binaryPath = getBinaryPath();

  if (!existsSync(binaryPath)) {
    throw new Error(`Binary not found: ${binaryPath}`);
  }

  const result = spawnSync("bun", [binaryPath, ...args], {
    env: {
      ...process.env,
      FAILPROOFAI_TELEMETRY_DISABLED: "1",
    },
    encoding: "utf8",
    timeout: 15_000,
  });

  return {
    exitCode: result.status ?? 1,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
  };
}

// ── Assertion helpers ─────────────────────────────────────────────────────────

export function assertCleanError(result: CliRunResult, expectedMessage: string): void {
  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain(expectedMessage);
  // Must NOT be a raw stack trace
  expect(result.stderr).not.toMatch(/at \w+ \(.*:\d+:\d+\)/);
  expect(result.stderr).not.toContain("node:internal");
}

export function assertSuccess(result: CliRunResult): void {
  expect(result.exitCode).toBe(0);
}
