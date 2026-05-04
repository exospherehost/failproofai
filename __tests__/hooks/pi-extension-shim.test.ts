/**
 * Tests for the pi-extension shim — focused on session-id continuity across
 * Pi events. Pi only emits `sessionId` reliably on the `session_start` event;
 * `tool_call`, `user_bash`, `input`, `tool_result`, and `agent_end` may omit
 * it. Without the cache, every activity record after session_start has
 * `sessionId: undefined` and the dashboard renders "—".
 */
// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";

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

describe("pi-extension shim — sessionId caching", () => {
  let handlers: Record<string, (event: unknown) => unknown> = {};
  let bridge: (pi: PiExtensionApi) => void;

  beforeEach(async () => {
    captured.length = 0;
    handlers = {};
    vi.resetModules();
    const mod = await import("../../pi-extension/index");
    bridge = mod.default;
    bridge({ on: (name, fn) => { handlers[name] = fn; } });
  });

  it("caches sessionId from session_start and forwards on subsequent tool_call", () => {
    handlers.session_start({ type: "session_start", sessionId: "abc-123", cwd: "/proj" });
    expect(captured.at(-1)?.payload.session_id).toBe("abc-123");

    handlers.tool_call({ type: "tool_call", toolName: "bash", input: { command: "ls" }, cwd: "/proj" });
    // tool_call event has no sessionId, but cached value should fill it.
    expect(captured.at(-1)?.payload.session_id).toBe("abc-123");
  });

  it("event-level sessionId overrides cache when present", () => {
    handlers.session_start({ type: "session_start", sessionId: "first", cwd: "/proj" });
    handlers.tool_call({ type: "tool_call", toolName: "bash", input: {}, cwd: "/proj", sessionId: "explicit" });
    expect(captured.at(-1)?.payload.session_id).toBe("explicit");
    // Subsequent event without sessionId falls back to the most recent cached value (now "explicit").
    handlers.user_bash({ type: "user_bash", command: "ls", cwd: "/proj" });
    expect(captured.at(-1)?.payload.session_id).toBe("explicit");
  });

  it("input, tool_result, agent_end, session_shutdown all use cached sessionId", () => {
    handlers.session_start({ type: "session_start", sessionId: "S1", cwd: "/proj" });
    handlers.input({ type: "input", text: "hi", cwd: "/proj" });
    expect(captured.at(-1)?.payload.session_id).toBe("S1");
    handlers.tool_result({ type: "tool_result", toolName: "bash", input: {}, content: [], isError: false, cwd: "/proj" });
    expect(captured.at(-1)?.payload.session_id).toBe("S1");
    handlers.agent_end({ type: "agent_end", cwd: "/proj" });
    expect(captured.at(-1)?.payload.session_id).toBe("S1");
    handlers.session_shutdown({ type: "session_shutdown", reason: "quit", cwd: "/proj" });
    expect(captured.at(-1)?.payload.session_id).toBe("S1");
  });

  it("returns undefined sessionId when never seen (cold start)", () => {
    handlers.tool_call({ type: "tool_call", toolName: "bash", input: { command: "ls" }, cwd: "/proj" });
    expect(captured.at(-1)?.payload.session_id).toBeUndefined();
  });
});
