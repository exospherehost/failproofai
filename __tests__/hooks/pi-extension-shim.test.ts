/**
 * Tests for the pi-extension shim — focused on session-id resolution.
 *
 * Pi (verified empirically against pi-coding-agent v0.71.1) does NOT
 * populate `event.sessionId` on any event. The shim recovers the
 * sessionId by scanning the on-disk transcript at
 * `~/.pi/agent/sessions/<encodedCwd>/<isoTimestamp>_<uuid>.jsonl` and
 * caches the result.
 */
// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface CapturedCall {
  payload: Record<string, unknown>;
  args: string[];
}

interface PiExtensionApi {
  on(event: string, handler: (event: unknown) => unknown): void;
}

const captured: CapturedCall[] = [];

vi.mock("node:child_process", () => ({
  spawnSync: (_cmd: string, args: string[], opts: { input?: string }) => {
    captured.push({ args: args ?? [], payload: JSON.parse(opts?.input ?? "{}") });
    return { pid: 0, output: [], status: 0, signal: null, stderr: "", stdout: "" };
  },
}));

function piEncodeCwd(cwd: string): string {
  return `--${cwd.replace(/^\/+/, "").replace(/\//g, "-")}--`;
}

describe("pi-extension shim — sessionId resolution via on-disk discovery", () => {
  let handlers: Record<string, (event: unknown) => unknown> = {};
  let bridge: (pi: PiExtensionApi) => void;
  let piRoot: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    captured.length = 0;
    handlers = {};
    piRoot = mkdtempSync(join(tmpdir(), "pi-shim-test-"));
    originalEnv = process.env.PI_SESSIONS_DIR;
    process.env.PI_SESSIONS_DIR = piRoot;
    vi.resetModules();
    const mod = await import("../../pi-extension/index");
    bridge = mod.default;
    bridge({ on: (name, fn) => { handlers[name] = fn; } });
  });

  function writeSessionFile(cwd: string, sessionId: string, ts = "2026-05-04T20-00-00-000Z", mtime?: Date): void {
    const dir = join(piRoot, piEncodeCwd(cwd));
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${ts}_${sessionId}.jsonl`);
    writeFileSync(file, "{}\n");
    if (mtime) utimesSync(file, mtime, mtime);
  }

  it("uses event-level sessionId when present", () => {
    writeSessionFile("/proj", "11111111-1111-1111-1111-111111111111");
    handlers.tool_call({ type: "tool_call", toolName: "bash", input: { command: "ls" }, cwd: "/proj", sessionId: "explicit" });
    expect(captured.at(-1)?.payload.session_id).toBe("explicit");
  });

  it("discovers sessionId from the on-disk transcript when event omits it", () => {
    const sid = "22222222-2222-2222-2222-222222222222";
    writeSessionFile("/proj", sid);
    handlers.tool_call({ type: "tool_call", toolName: "bash", input: { command: "ls" }, cwd: "/proj" });
    expect(captured.at(-1)?.payload.session_id).toBe(sid);
  });

  it("picks the newest file when multiple sessions exist for a cwd", () => {
    writeSessionFile("/proj", "33333333-3333-3333-3333-333333333333", "2026-05-01T00-00-00-000Z", new Date("2026-05-01T00:00:00Z"));
    writeSessionFile("/proj", "44444444-4444-4444-4444-444444444444", "2026-05-04T20-00-00-000Z", new Date("2026-05-04T20:00:00Z"));
    handlers.tool_call({ type: "tool_call", toolName: "bash", input: {}, cwd: "/proj" });
    expect(captured.at(-1)?.payload.session_id).toBe("44444444-4444-4444-4444-444444444444");
  });

  it("returns undefined when no transcript exists yet", () => {
    handlers.tool_call({ type: "tool_call", toolName: "bash", input: {}, cwd: "/no-such-cwd" });
    expect(captured.at(-1)?.payload.session_id).toBeUndefined();
  });

  it("session_start, input, tool_result, agent_end, session_shutdown all resolve", () => {
    const sid = "55555555-5555-5555-5555-555555555555";
    writeSessionFile("/proj", sid);
    handlers.session_start({ type: "session_start", cwd: "/proj" });
    expect(captured.at(-1)?.payload.session_id).toBe(sid);
    handlers.input({ type: "input", text: "hi", cwd: "/proj" });
    expect(captured.at(-1)?.payload.session_id).toBe(sid);
    handlers.tool_result({ type: "tool_result", toolName: "bash", input: {}, content: [], isError: false, cwd: "/proj" });
    expect(captured.at(-1)?.payload.session_id).toBe(sid);
    handlers.agent_end({ type: "agent_end", cwd: "/proj" });
    expect(captured.at(-1)?.payload.session_id).toBe(sid);
    handlers.session_shutdown({ type: "session_shutdown", reason: "quit", cwd: "/proj" });
    expect(captured.at(-1)?.payload.session_id).toBe(sid);
  });

  // Cleanup
  afterEach(() => {
    if (originalEnv === undefined) delete process.env.PI_SESSIONS_DIR;
    else process.env.PI_SESSIONS_DIR = originalEnv;
    rmSync(piRoot, { recursive: true, force: true });
  });
});

import { afterEach } from "vitest";
