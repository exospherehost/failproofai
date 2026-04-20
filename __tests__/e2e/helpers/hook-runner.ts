/**
 * Runs the failproofai binary as a subprocess for E2E hook tests.
 *
 * Invokes bin/failproofai.mjs --hook <event> via bun, exactly as Claude Code does —
 * no Node.js bridge, no mocks.
 *
 * Run `bun build src/index.ts --outdir dist --target node --format cjs` once before
 * running these tests (required for custom hook files that import from 'failproofai').
 */
import { expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function getBinaryPath(): string {
  return resolve(REPO_ROOT, "bin/failproofai.mjs");
}

function getDistPath(): string {
  return resolve(REPO_ROOT, "dist");
}

export interface HookRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  /** Parsed stdout JSON, or null if stdout is empty / not valid JSON. */
  parsed: Record<string, unknown> | null;
}

/**
 * Invoke `failproofai --hook <event>` with the given payload on stdin.
 *
 * @param event  - Hook event type, e.g. "PreToolUse"
 * @param payload - JSON payload written to stdin
 * @param opts.homeDir - Override HOME so ~/.failproofai doesn't leak into tests
 */
export function runHook(
  event: string,
  payload: Record<string, unknown>,
  opts?: { homeDir?: string },
): HookRunResult {
  const binaryPath = getBinaryPath();

  if (!existsSync(binaryPath)) {
    throw new Error(`E2E binary not found: ${binaryPath}`);
  }

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    FAILPROOFAI_TELEMETRY_DISABLED: "1",
    FAILPROOFAI_DIST_PATH: getDistPath(),
    FAILPROOFAI_SKIP_KILL: "true",
    ...(opts?.homeDir ? { HOME: opts.homeDir } : {}),
  };

  const result = spawnSync("bun", [binaryPath, "--hook", event], {
    input: JSON.stringify(payload),
    env,
    encoding: "utf8",
    timeout: 15_000,
  });

  const exitCode = result.status ?? 1;
  const stdout = (result.stdout ?? "").trim();
  const stderr = (result.stderr ?? "").trim();

  let parsed: Record<string, unknown> | null = null;
  if (stdout) {
    try {
      parsed = JSON.parse(stdout) as Record<string, unknown>;
    } catch {
      // stdout is not JSON — leave parsed as null
    }
  }

  return { exitCode, stdout, stderr, parsed };
}

// ── Assertion helpers ──────────────────────────────────────────────────────

export function assertAllow(result: HookRunResult): void {
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toBe("");
}

export function assertPreToolUseDeny(result: HookRunResult): void {
  expect(result.exitCode).toBe(2);
  expect(result.stdout).toBe("");
  // Support any of our specialized blocking prefixes
  const hasPrefix = 
    result.stderr.includes("[FailproofAI") || 
    result.stderr.includes("MANDATORY ACTION REQUIRED") ||
    result.stderr.includes("ACTION BLOCKED BY FAILPROOFAI");
  expect(hasPrefix).toBe(true);
}

export function assertPostToolUseDeny(result: HookRunResult): void {
  expect(result.exitCode).toBe(2);
  expect(result.stdout).toBe("");
  // Support any of our specialized blocking prefixes
  const hasPrefix = 
    result.stderr.includes("[FailproofAI") || 
    result.stderr.includes("MANDATORY ACTION REQUIRED") ||
    result.stderr.includes("ACTION BLOCKED BY FAILPROOFAI");
  expect(hasPrefix).toBe(true);
}

export function assertInstruct(result: HookRunResult): void {
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toBe("");
  expect(result.stderr).toBeTruthy();
}

export function assertStopInstruct(result: HookRunResult): void {
  expect(result.exitCode).toBe(2);
  expect(result.stderr).toBeTruthy();
}
