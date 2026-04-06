/**
 * Runs the failproofai binary as a subprocess for E2E hook tests.
 *
 * Invokes .test-npx/node_modules/@failproofai/<platform>/bin/failproofai --hook <event>
 * exactly as Claude Code does — no Node.js bridge, no mocks.
 *
 * Run `bun run test:npx` once before running these tests.
 */
import { expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { platform, arch } from "node:os";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function getBinaryPath(): string {
  const os = platform();   // linux | darwin | win32
  const cpu = arch();      // x64 | arm64
  const ext = os === "win32" ? ".exe" : "";
  const pkgName = `${os}-${cpu}`;
  return resolve(REPO_ROOT, `.test-npx/node_modules/@failproofai/${pkgName}/bin/failproofai${ext}`);
}

function getDistPath(): string {
  return resolve(REPO_ROOT, ".test-npx/node_modules/failproofai/dist");
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
    throw new Error(
      `E2E binary not found: ${binaryPath}\n` +
      `Run \`bun run test:npx\` first to build and install the npm package.`,
    );
  }

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    FAILPROOFAI_TELEMETRY_DISABLED: "1",
    FAILPROOFAI_DIST_PATH: getDistPath(),
    ...(opts?.homeDir ? { HOME: opts.homeDir } : {}),
  };

  const result = spawnSync(binaryPath, ["--hook", event], {
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
  expect(result.exitCode).toBe(0);
  const output = result.parsed?.hookSpecificOutput as Record<string, unknown> | undefined;
  expect(output?.permissionDecision).toBe("deny");
}

export function assertPostToolUseDeny(result: HookRunResult): void {
  expect(result.exitCode).toBe(0);
  const output = result.parsed?.hookSpecificOutput as Record<string, unknown> | undefined;
  expect(output?.additionalContext).toMatch(/Blocked/i);
}

export function assertInstruct(result: HookRunResult): void {
  expect(result.exitCode).toBe(0);
  const output = result.parsed?.hookSpecificOutput as Record<string, unknown> | undefined;
  expect(output?.additionalContext).toMatch(/^Instruction from failproofai:/);
}

export function assertStopInstruct(result: HookRunResult): void {
  expect(result.exitCode).toBe(2);
  expect(result.stderr).toBeTruthy();
}
