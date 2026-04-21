// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleHookEvent, writeVirtualLogEntry, _resetDedupeCache } from "../../src/hooks/handler";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

vi.mock("../../src/hooks/hooks-config", () => ({
  readMergedHooksConfig: vi.fn(() => ({ enabledPolicies: ["block-sudo"] })),
}));

vi.mock("../../src/hooks/builtin-policies", () => ({
  registerBuiltinPolicies: vi.fn(),
}));

vi.mock("../../src/hooks/policy-evaluator", () => ({
  evaluatePolicies: vi.fn(() => ({
    exitCode: 0,
    stdout: "",
    stderr: "",
    policyName: null,
    reason: null,
    decision: "allow",
  })),
}));

vi.mock("../../src/hooks/policy-registry", () => ({
  clearPolicies: vi.fn(),
  registerPolicy: vi.fn(),
}));

vi.mock("../../src/hooks/custom-hooks-loader", () => ({
  loadAllCustomHooks: vi.fn(() => Promise.resolve({ hooks: [], conventionSources: [] })),
}));

vi.mock("../../src/hooks/hook-activity-store", () => ({
  persistHookActivity: vi.fn(),
}));

vi.mock("../../src/hooks/hook-telemetry", () => ({
  trackHookEvent: vi.fn(() => Promise.resolve()),
}));

vi.mock("../../lib/telemetry-id", () => ({
  getInstanceId: vi.fn(() => "test-instance-id"),
}));

vi.mock("../../src/hooks/hook-logger", () => ({
  hookLogInfo: vi.fn(),
  hookLogWarn: vi.fn(),
  hookLogError: vi.fn(),
}));

describe("hooks/handler", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  const originalStdin = process.stdin;

  function mockStdin(payload?: string): void {
    Object.defineProperty(process, "stdin", {
      value: {
        setEncoding: vi.fn(),
        destroy: vi.fn(),
        on: vi.fn((event: string, cb: (data?: string) => void) => {
          if (event === "data" && payload) cb(payload);
          if (event === "end") cb();
        }),
        readableEnded: !payload,
      },
      writable: true,
      configurable: true,
    });
  }

  function restoreStdin(): void {
    Object.defineProperty(process, "stdin", {
      value: originalStdin,
      writable: true,
      configurable: true,
    });
  }

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.clearAllMocks();
    _resetDedupeCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreStdin();
  });

  it("returns exit code from policy evaluation", async () => {
    mockStdin();
    const result = await handleHookEvent("PreToolUse");
    expect(result.exitCode).toBe(0);
    expect(result.hardStop).toBe(false);
  });

  it("returns an object with exitCode and hardStop", async () => {
    mockStdin();
    const result = await handleHookEvent("SessionStart");
    expect(typeof result.exitCode).toBe("number");
    expect(typeof result.hardStop).toBe("boolean");
  });

  it("does not write raw stderr (logging is via hook-logger)", async () => {
    mockStdin(JSON.stringify({ tool_name: "Read", tool_input: { file_path: "/foo" } }));
    await handleHookEvent("PreToolUse");
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it("calls readMergedHooksConfig and registerBuiltinPolicies", async () => {
    mockStdin();
    const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
    const { registerBuiltinPolicies } = await import("../../src/hooks/builtin-policies");

    await handleHookEvent("PreToolUse");

    expect(readMergedHooksConfig).toHaveBeenCalled();
    expect(registerBuiltinPolicies).toHaveBeenCalledWith(["block-sudo"]);
  });

  it("passes session cwd to loadAllCustomHooks for relative customPoliciesPath resolution", async () => {
    const sessionPayload = JSON.stringify({
      cwd: "/home/user/project",
    });
    mockStdin(sessionPayload);
    const { loadAllCustomHooks } = await import("../../src/hooks/custom-hooks-loader");

    await handleHookEvent("PreToolUse");

    expect(loadAllCustomHooks).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ sessionCwd: "/home/user/project" }),
    );
  });

  it("persists hook activity for every evaluation", async () => {
    mockStdin();
    const { persistHookActivity } = await import("../../src/hooks/hook-activity-store");

    const result = await handleHookEvent("PreToolUse");

    expect(persistHookActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "PreToolUse",
        decision: "allow",
        policyName: null,
      }),
    );
  });

  it("persists deny decision when evaluator returns deny", async () => {
    const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");
    vi.mocked(evaluatePolicies).mockResolvedValueOnce({
      exitCode: 0,
      stdout: '{"hookSpecificOutput":{"permissionDecision":"deny"}}',
      stderr: "",
      policyName: "block-sudo",
      reason: "sudo blocked",
      decision: "deny",
    });
    mockStdin(JSON.stringify({ tool_name: "Bash" }));
    const { persistHookActivity } = await import("../../src/hooks/hook-activity-store");

    const result = await handleHookEvent("PreToolUse");

    expect(persistHookActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: "deny",
        policyName: "block-sudo",
        reason: "sudo blocked",
      }),
    );
  });

  describe("PostHog telemetry", () => {
    it("fires telemetry with full payload for deny decisions", async () => {
      const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");
      vi.mocked(evaluatePolicies).mockResolvedValueOnce({
        exitCode: 0,
        stdout: '{"hookSpecificOutput":{"permissionDecision":"deny"}}',
        stderr: "",
        policyName: "block-sudo",
        reason: "sudo blocked",
        decision: "deny",
      });
      mockStdin(JSON.stringify({ tool_name: "Bash" }));
      const { trackHookEvent } = await import("../../src/hooks/hook-telemetry");

      await handleHookEvent("PreToolUse");

      expect(trackHookEvent).toHaveBeenCalledWith(
        "test-instance-id",
        "hook_policy_triggered",
        {
          event_type: "PreToolUse",
          tool_name: "Bash",
          policy_name: "block-sudo",
          decision: "deny",
          is_custom_hook: false,
          is_convention_policy: false,
          convention_scope: null,
          has_custom_params: false,
          param_keys_overridden: [],
        },
      );
    });

    it("fires telemetry with full payload for instruct decisions", async () => {
      const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");
      vi.mocked(evaluatePolicies).mockResolvedValueOnce({
        exitCode: 0,
        stdout: '{"hookSpecificOutput":{"additionalContext":"Instruction from failproofai: repeated calls"}}',
        stderr: "",
        policyName: "warn-repeated-tool-calls",
        reason: "repeated calls",
        decision: "instruct",
      });
      mockStdin(JSON.stringify({ tool_name: "Read" }));
      const { trackHookEvent } = await import("../../src/hooks/hook-telemetry");

      await handleHookEvent("PreToolUse");

      expect(trackHookEvent).toHaveBeenCalledWith(
        "test-instance-id",
        "hook_policy_triggered",
        {
          event_type: "PreToolUse",
          tool_name: "Read",
          policy_name: "warn-repeated-tool-calls",
          decision: "instruct",
          is_custom_hook: false,
          is_convention_policy: false,
          convention_scope: null,
          has_custom_params: false,
          param_keys_overridden: [],
        },
      );
    });

    it("sets is_custom_hook true when triggered policy is a custom hook", async () => {
      const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");
      vi.mocked(evaluatePolicies).mockResolvedValueOnce({
        exitCode: 0,
        stdout: '{"hookSpecificOutput":{"permissionDecision":"deny"}}',
        stderr: "",
        policyName: "custom/my-hook",
        reason: "custom blocked",
        decision: "deny",
      });
      mockStdin(JSON.stringify({ tool_name: "Bash" }));
      const { trackHookEvent } = await import("../../src/hooks/hook-telemetry");

      await handleHookEvent("PreToolUse");

      expect(trackHookEvent).toHaveBeenCalledWith(
        "test-instance-id",
        "hook_policy_triggered",
        expect.objectContaining({
          policy_name: "custom/my-hook",
          is_custom_hook: true,
          has_custom_params: false,
          param_keys_overridden: [],
        }),
      );
    });

    it("sets has_custom_params and param_keys_overridden when policyParams are configured", async () => {
      const { readMergedHooksConfig } = await import("../../src/hooks/hooks-config");
      vi.mocked(readMergedHooksConfig).mockReturnValueOnce({
        enabledPolicies: ["block-sudo"],
        policyParams: { "block-sudo": { allowPatterns: ["sudo systemctl status"] } },
      });
      const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");
      vi.mocked(evaluatePolicies).mockResolvedValueOnce({
        exitCode: 0,
        stdout: '{"hookSpecificOutput":{"permissionDecision":"deny"}}',
        stderr: "",
        policyName: "block-sudo",
        reason: "sudo blocked",
        decision: "deny",
      });
      mockStdin(JSON.stringify({ tool_name: "Bash" }));
      const { trackHookEvent } = await import("../../src/hooks/hook-telemetry");

      await handleHookEvent("PreToolUse");

      expect(trackHookEvent).toHaveBeenCalledWith(
        "test-instance-id",
        "hook_policy_triggered",
        expect.objectContaining({
          policy_name: "block-sudo",
          is_custom_hook: false,
          has_custom_params: true,
          param_keys_overridden: ["allowPatterns"],
        }),
      );
    });

    it("does not fire telemetry for allow decisions", async () => {
      mockStdin();
      const { trackHookEvent } = await import("../../src/hooks/hook-telemetry");

      await handleHookEvent("PreToolUse");

      expect(trackHookEvent).not.toHaveBeenCalled();
    });

    it("passes null tool_name when payload has no tool_name", async () => {
      const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");
      vi.mocked(evaluatePolicies).mockResolvedValueOnce({
        exitCode: 0,
        stdout: '{"hookSpecificOutput":{"permissionDecision":"deny"}}',
        stderr: "",
        policyName: "block-sudo",
        reason: "sudo blocked",
        decision: "deny",
      });
      mockStdin(JSON.stringify({}));
      const { trackHookEvent } = await import("../../src/hooks/hook-telemetry");

      await handleHookEvent("PreToolUse");

      expect(trackHookEvent).toHaveBeenCalledWith(
        "test-instance-id",
        "hook_policy_triggered",
        expect.objectContaining({
          tool_name: null,
        }),
      );
    });

    it("telemetry failure does not throw or affect exit code", async () => {
      const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");
      vi.mocked(evaluatePolicies).mockResolvedValueOnce({
        exitCode: 0,
        stdout: '{"hookSpecificOutput":{"permissionDecision":"deny"}}',
        stderr: "",
        policyName: "block-sudo",
        reason: "sudo blocked",
        decision: "deny",
      });
      mockStdin(JSON.stringify({ tool_name: "Bash" }));
      const { trackHookEvent } = await import("../../src/hooks/hook-telemetry");
      vi.mocked(trackHookEvent).mockRejectedValueOnce(new Error("PostHog unavailable"));

      const result = await handleHookEvent("PreToolUse");

      expect(result.exitCode).toBe(0);
    });

    it("fires custom_hooks_loaded with count, names, and event types when custom hooks are present", async () => {
      const { loadAllCustomHooks } = await import("../../src/hooks/custom-hooks-loader");
      vi.mocked(loadAllCustomHooks).mockResolvedValueOnce({
        hooks: [
          { name: "hook-a", fn: async () => ({ decision: "allow" as const }), match: { events: ["PreToolUse" as never] } },
          { name: "hook-b", fn: async () => ({ decision: "allow" as const }), match: { events: ["Stop" as never] } },
        ],
        conventionSources: [],
      });
      mockStdin();
      const { trackHookEvent } = await import("../../src/hooks/hook-telemetry");

      await handleHookEvent("PreToolUse");

      expect(trackHookEvent).toHaveBeenCalledWith(
        "test-instance-id",
        "custom_hooks_loaded",
        {
          custom_hooks_count: 2,
          custom_hook_names: ["hook-a", "hook-b"],
          event_types_covered: expect.arrayContaining(["PreToolUse", "Stop"]),
        },
      );
    });

    it("does not fire custom_hooks_loaded when no custom hooks are loaded", async () => {
      mockStdin();
      const { trackHookEvent } = await import("../../src/hooks/hook-telemetry");

      await handleHookEvent("PreToolUse");

      const calls = vi.mocked(trackHookEvent).mock.calls;
      expect(calls.every(([, event]) => event !== "custom_hooks_loaded")).toBe(true);
    });

    it("fires custom_hook_error with error_type exception when hook throws", async () => {
      const { loadAllCustomHooks } = await import("../../src/hooks/custom-hooks-loader");
      vi.mocked(loadAllCustomHooks).mockResolvedValueOnce({
        hooks: [
          { name: "bad-hook", fn: async () => { throw new Error("oops"); } },
        ],
        conventionSources: [],
      });
      const { registerPolicy } = await import("../../src/hooks/policy-registry");
      const { trackHookEvent } = await import("../../src/hooks/hook-telemetry");

      let wrappedFn: ((ctx: never) => Promise<unknown>) | null = null;
      vi.mocked(registerPolicy).mockImplementationOnce((_n, _d, fn) => {
        wrappedFn = fn as (ctx: never) => Promise<unknown>;
      });

      mockStdin();
      await handleHookEvent("PreToolUse");

      expect(wrappedFn).not.toBeNull();
      await wrappedFn!({} as never);

      expect(trackHookEvent).toHaveBeenCalledWith(
        "test-instance-id",
        "custom_hook_error",
        { hook_name: "bad-hook", error_type: "exception", event_type: "PreToolUse", is_convention_policy: false, convention_scope: null },
      );
    });

    it("fires custom_hook_error with error_type timeout when hook times out", async () => {
      const { loadAllCustomHooks } = await import("../../src/hooks/custom-hooks-loader");
      vi.mocked(loadAllCustomHooks).mockResolvedValueOnce({
        hooks: [
          { name: "slow-hook", fn: async () => { throw new Error("timeout"); } },
        ],
        conventionSources: [],
      });
      const { registerPolicy } = await import("../../src/hooks/policy-registry");
      const { trackHookEvent } = await import("../../src/hooks/hook-telemetry");

      let wrappedFn: ((ctx: never) => Promise<unknown>) | null = null;
      vi.mocked(registerPolicy).mockImplementationOnce((_n, _d, fn) => {
        wrappedFn = fn as (ctx: never) => Promise<unknown>;
      });

      mockStdin();
      await handleHookEvent("PreToolUse");

      expect(wrappedFn).not.toBeNull();
      await wrappedFn!({} as never);

      expect(trackHookEvent).toHaveBeenCalledWith(
        "test-instance-id",
        "custom_hook_error",
        { hook_name: "slow-hook", error_type: "timeout", event_type: "PreToolUse", is_convention_policy: false, convention_scope: null },
      );
    });

    it("fires exactly one telemetry event per hook invocation", async () => {
      const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");
      vi.mocked(evaluatePolicies).mockResolvedValueOnce({
        exitCode: 0,
        stdout: '{"hookSpecificOutput":{"permissionDecision":"deny"}}',
        stderr: "",
        policyName: "block-sudo",
        reason: "sudo blocked",
        decision: "deny",
      });
      mockStdin(JSON.stringify({ tool_name: "Bash" }));
      const { trackHookEvent } = await import("../../src/hooks/hook-telemetry");

      await handleHookEvent("PreToolUse");

      expect(trackHookEvent).toHaveBeenCalledTimes(1);
    });
  });

  it("passes session metadata to persistHookActivity", async () => {
    const sessionPayload = JSON.stringify({
      tool_name: "Read",
      tool_input: { file_path: "/foo/bar.ts" },
      session_id: "sess-abc-123",
      transcript_path: "/tmp/transcript.jsonl",
      cwd: "/home/user/project",
      permission_mode: "default",
      hook_event_name: "PreToolUse",
    });
    mockStdin(sessionPayload);
    const { persistHookActivity } = await import("../../src/hooks/hook-activity-store");

    const result = await handleHookEvent("PreToolUse");

    expect(persistHookActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "sess-abc-123",
        transcriptPath: "/tmp/transcript.jsonl",
        cwd: "/home/user/project",
        permissionMode: "default",
        hookEventName: "PreToolUse",
      }),
    );
  });

  it("passes undefined session fields when payload is empty", async () => {
    mockStdin();
    const { persistHookActivity } = await import("../../src/hooks/hook-activity-store");

    const result = await handleHookEvent("PreToolUse");

    expect(persistHookActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: expect.stringContaining("session-claude-code"),
        transcriptPath: undefined,
        cwd: undefined,
        permissionMode: undefined,
        hookEventName: undefined,
      }),
    );
  });

  it("passes session metadata to evaluatePolicies", async () => {
    const sessionPayload = JSON.stringify({
      session_id: "sess-xyz",
      cwd: "/home/user/project",
      permission_mode: "plan",
    });
    mockStdin(sessionPayload);
    const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");

    await handleHookEvent("PreToolUse");

    expect(evaluatePolicies).toHaveBeenCalledWith(
      "PreToolUse",
      expect.any(Object),
      expect.objectContaining({
        sessionId: "sess-xyz",
        cwd: "/home/user/project",
        permissionMode: "plan",
      }),
      expect.any(Object),
    );
  });

  describe("copilot integration handling", () => {
    it("silently aborts corrupted legacy Claude-labeled Copilot-only events", async () => {
      mockStdin(JSON.stringify({ sessionId: "cop-legacy-1" }));
      const { persistHookActivity } = await import("../../src/hooks/hook-activity-store");
      const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");

      const result = await handleHookEvent("sessionStart", "claude-code");

      expect(result).toEqual({ exitCode: 0, hardStop: false });
      expect(persistHookActivity).not.toHaveBeenCalled();
      expect(evaluatePolicies).not.toHaveBeenCalled();
      expect(stdoutSpy).not.toHaveBeenCalled();
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it("detects Copilot from native camelCase events and persists canonical dashboard fields", async () => {
      mockStdin(JSON.stringify({
        sessionId: "cop-start-123",
        cwd: "/repo/copilot-app",
        hookEventName: "sessionStart",
      }));
      const { persistHookActivity } = await import("../../src/hooks/hook-activity-store");
      const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");

      await handleHookEvent("sessionStart");

      expect(evaluatePolicies).toHaveBeenCalledWith(
        "SessionStart",
        expect.any(Object),
        expect.objectContaining({
          sessionId: "cop-start-123",
          cwd: "/repo/copilot-app",
          integration: "copilot",
        }),
        expect.any(Object),
      );

      expect(persistHookActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "SessionStart",
          sessionId: "cop-start-123",
          integration: "copilot",
          hookEventName: "sessionStart",
          transcriptPath: path.join(os.homedir(), ".copilot", "session-state", "cop-start-123", "events.jsonl"),
        }),
      );
    });

    it("normalizes nested Copilot toolArgs payloads before policy evaluation", async () => {
      mockStdin(JSON.stringify({
        data: {
          sessionId: "cop-toolargs-1",
          hookEventName: "preToolUse",
          toolName: "bash",
          toolArgs: "{\"command\":\"sudo ls\",\"cwd\":\"/repo/copilot-app/subdir\"}",
        },
      }));
      const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");
      const { persistHookActivity } = await import("../../src/hooks/hook-activity-store");

      await handleHookEvent("preToolUse");

      expect(evaluatePolicies).toHaveBeenCalledWith(
        "PreToolUse",
        expect.objectContaining({
          session_id: "cop-toolargs-1",
          tool_name: "bash",
          tool_input: { command: "sudo ls", cwd: "/repo/copilot-app/subdir" },
        }),
        expect.objectContaining({
          sessionId: "cop-toolargs-1",
          cwd: "/repo/copilot-app/subdir",
          integration: "copilot",
        }),
        expect.any(Object),
      );

      expect(persistHookActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "PreToolUse",
          sessionId: "cop-toolargs-1",
          integration: "copilot",
          transcriptPath: path.join(os.homedir(), ".copilot", "session-state", "cop-toolargs-1", "events.jsonl"),
        }),
      );
    });

    it("recovers a Copilot session id from env vars when payload is empty", async () => {
      const oldSession = process.env.COPILOT_SESSION_ID;
      process.env.COPILOT_SESSION_ID = "cop-env-session";
      mockStdin();
      const { persistHookActivity } = await import("../../src/hooks/hook-activity-store");

      try {
        await handleHookEvent("sessionStart");
      } finally {
        if (oldSession === undefined) delete process.env.COPILOT_SESSION_ID;
        else process.env.COPILOT_SESSION_ID = oldSession;
      }

      expect(persistHookActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "SessionStart",
          sessionId: "cop-env-session",
          integration: "copilot",
          transcriptPath: path.join(os.homedir(), ".copilot", "session-state", "cop-env-session", "events.jsonl"),
        }),
      );
    });

    it("synthesizes a stable Copilot fallback session id when the payload omits one", async () => {
      mockStdin(JSON.stringify({
        cwd: "/home/user/work/copilot-app",
        hookEventName: "sessionStart",
      }));
      const { persistHookActivity } = await import("../../src/hooks/hook-activity-store");

      await handleHookEvent("sessionStart");

      expect(persistHookActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: "session-copilot-copilot-app",
          integration: "copilot",
          transcriptPath: path.join(os.homedir(), ".copilot", "session-state", "session-copilot-copilot-app", "events.jsonl"),
        }),
      );
    });

    it("lets an explicit integration flag beat a Copilot-shaped payload", async () => {
      mockStdin(JSON.stringify({
        sessionId: "cop-looks-like-copilot",
        hookEventName: "preToolUse",
        toolName: "bash",
        toolInput: { command: "ls" },
      }));
      const { persistHookActivity } = await import("../../src/hooks/hook-activity-store");

      await handleHookEvent("PreToolUse", "cursor");

      expect(persistHookActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "PreToolUse",
          integration: "cursor",
        }),
      );
    });
  });

  it("writes stdout from evaluator result", async () => {
    const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");
    vi.mocked(evaluatePolicies).mockResolvedValueOnce({
      exitCode: 0,
      stdout: '{"hookSpecificOutput":{"permissionDecision":"deny"}}',
      stderr: "",
      policyName: "block-sudo",
      reason: "blocked",
      decision: "deny",
    });
    mockStdin(JSON.stringify({ tool_name: "Bash" }));

    await handleHookEvent("PreToolUse");

    expect(stdoutSpy).toHaveBeenCalledWith(
      expect.stringContaining("permissionDecision"),
    );
  });

  it("persists instruct decision as 'instruct' in activity store", async () => {
    const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");
    vi.mocked(evaluatePolicies).mockResolvedValueOnce({
      exitCode: 0,
      stdout: '{"hookSpecificOutput":{"additionalContext":"Instruction from failproofai: repeated calls"}}',
      stderr: "",
      policyName: "warn-repeated-tool-calls",
      reason: "repeated calls",
      decision: "instruct",
    });
    mockStdin(JSON.stringify({ tool_name: "Read" }));
    const { persistHookActivity } = await import("../../src/hooks/hook-activity-store");

    const result = await handleHookEvent("PreToolUse");

    expect(persistHookActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: "instruct",
        policyName: "warn-repeated-tool-calls",
        reason: "repeated calls",
      }),
    );
  });

  describe("hook logging", () => {
    it("logs event type and policy count at info level", async () => {
      mockStdin(JSON.stringify({ tool_name: "Bash" }));
      const { hookLogInfo } = await import("../../src/hooks/hook-logger");

      await handleHookEvent("PreToolUse");

      expect(hookLogInfo).toHaveBeenCalledWith(expect.stringContaining("event=PreToolUse"));
      expect(hookLogInfo).toHaveBeenCalledWith(expect.stringContaining("policies="));
    });

    it("logs evaluation result at info level", async () => {
      mockStdin();
      const { hookLogInfo } = await import("../../src/hooks/hook-logger");

      await handleHookEvent("PreToolUse");

      expect(hookLogInfo).toHaveBeenCalledWith(expect.stringContaining("result=allow"));
      expect(hookLogInfo).toHaveBeenCalledWith(expect.stringContaining("duration="));
    });

    it("logs warning when JSON parse fails", async () => {
      mockStdin("not valid json {{{");
      const { hookLogWarn } = await import("../../src/hooks/hook-logger");

      await handleHookEvent("PreToolUse");

      expect(hookLogWarn).toHaveBeenCalledWith(expect.stringContaining("payload parse failed"));
    });

    it("logs warning and returns exit 0 when stdin exceeds 1 MB", async () => {
      const oversized = "A".repeat(1_100_000); // 1.1 MB
      mockStdin(oversized);
      const { hookLogWarn } = await import("../../src/hooks/hook-logger");

      const result = await handleHookEvent("PreToolUse");

      expect(hookLogWarn).toHaveBeenCalledWith(expect.stringContaining("exceeds 1 MB"));
      expect(result.exitCode).toBe(0);
    });

    it("logs warning when activity persistence fails", async () => {
      mockStdin();
      const { persistHookActivity } = await import("../../src/hooks/hook-activity-store");
      vi.mocked(persistHookActivity).mockImplementation(() => { throw new Error("disk full"); });
      const { hookLogWarn } = await import("../../src/hooks/hook-logger");

      await handleHookEvent("PreToolUse");

      expect(hookLogWarn).toHaveBeenCalledWith(expect.stringContaining("activity persistence failed"));
    });
  });

  describe("Mechanism-Level Deduplication", () => {
    it("prevents duplicate log entries at the STORAGE level (Choke Point)", async () => {
      const { persistHookActivity, _resetForTest } = await vi.importActual("../../src/hooks/hook-activity-store") as any;
      
      const testDir = path.join(os.homedir(), ".failproofai-test-dedup-storage");
      _resetForTest(testDir);
      
      // Simulation: First record call
      const entry1 = { 
        timestamp: Date.now(), 
        eventType: "Stop", 
        sessionId: "sess-dedup", 
        decision: "allow",
        policyName: "test-policy",
        durationMs: 100 
      } as any;
      persistHookActivity(entry1);

      // Simulation: Second record call with slightly different duration/timestamp
      // but same sessionId and eventType.
      // Window is > 50ms to hit "Twin" detection.
      const entry2 = { 
        timestamp: Date.now() + 200, 
        eventType: "Stop", 
        sessionId: "sess-dedup", 
        decision: "allow", 
        policyName: "test-policy",
        durationMs: 95 
      } as any;
      persistHookActivity(entry2);

      // Verify that after the second call, the store logic should have dropped it
      const fs = await import("node:fs");
      const logPath = path.join(testDir, "current.jsonl");
      const content = fs.readFileSync(logPath, "utf-8").trim();
      const lines = content.split("\n").filter(l => l.trim().length > 0);
      
      expect(lines.length).toBe(1); // ONLY ONE LINE recorded despite two persist calls
      
      // Cleanup
      fs.rmSync(testDir, { recursive: true, force: true });
    });
  });

  describe("writeVirtualLogEntry", () => {
    let tempDir: string;
    let logPath: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "failproofai-vlog-"));
      logPath = path.join(tempDir, "session.jsonl");
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("writes a UserEntry for UserPromptSubmit events", () => {
      writeVirtualLogEntry(logPath, "UserPromptSubmit", {
        tool_input: { user_prompt: "What does this code do?" },
      });

      const lines = fs.readFileSync(logPath, "utf-8").trim().split("\n");
      const entry = JSON.parse(lines[0]);

      expect(entry.type).toBe("user");
      expect(entry.message.role).toBe("user");
      expect(entry.message.content).toBe("What does this code do?");
      expect(entry.uuid).toBeTruthy();
      expect(entry.timestamp).toBeTruthy();
    });

    it("writes an AssistantEntry with tool_use for PreToolUse events", () => {
      writeVirtualLogEntry(logPath, "PreToolUse", {
        tool_name: "Bash",
        tool_input: { command: "echo hello" },
      });

      const lines = fs.readFileSync(logPath, "utf-8").trim().split("\n");
      const entry = JSON.parse(lines[0]);

      expect(entry.type).toBe("assistant");
      const block = entry.message.content[0];
      expect(block.type).toBe("tool_use");
      expect(block.name).toBe("Bash");
      expect(block.input).toEqual({ command: "echo hello" });
      expect(block.id).toMatch(/^toolu_virt_/);
    });

    it("links PostToolUse tool_result to the PreToolUse tool_use id", () => {
      writeVirtualLogEntry(logPath, "PreToolUse", {
        tool_name: "Bash",
        tool_input: { command: "echo hello" },
      });
      writeVirtualLogEntry(logPath, "PostToolUse", {
        tool_name: "Bash",
        tool_input: { command: "echo hello" },
        tool_response: "hello\n",
      });

      const lines = fs.readFileSync(logPath, "utf-8").trim().split("\n").filter(Boolean);
      expect(lines).toHaveLength(2);

      const preEntry = JSON.parse(lines[0]);
      const postEntry = JSON.parse(lines[1]);

      const toolUseId = preEntry.message.content[0].id;
      expect(toolUseId).toMatch(/^toolu_virt_/);

      expect(postEntry.type).toBe("user");
      expect(postEntry.message.content[0].type).toBe("tool_result");
      expect(postEntry.message.content[0].tool_use_id).toBe(toolUseId);
      expect(postEntry.message.content[0].content).toBe("hello\n");
    });

    it("threads parentUuid from UserPromptSubmit through PreToolUse", () => {
      writeVirtualLogEntry(logPath, "UserPromptSubmit", {
        tool_input: { user_prompt: "Do something" },
      });
      writeVirtualLogEntry(logPath, "PreToolUse", {
        tool_name: "Read",
        tool_input: { file_path: "/foo.ts" },
      });

      const lines = fs.readFileSync(logPath, "utf-8").trim().split("\n").filter(Boolean);
      const userEntry = JSON.parse(lines[0]);
      const assistantEntry = JSON.parse(lines[1]);

      expect(assistantEntry.parentUuid).toBe(userEntry.uuid);
    });

    it("skips Stop and other non-conversation events", () => {
      writeVirtualLogEntry(logPath, "Stop", {});
      writeVirtualLogEntry(logPath, "SessionStart", {});

      expect(fs.existsSync(logPath)).toBe(false);
    });

    it("skips PostToolUse with no matching PreToolUse", () => {
      writeVirtualLogEntry(logPath, "PostToolUse", {
        tool_name: "Bash",
        tool_input: { command: "echo orphan" },
        tool_response: "orphan\n",
      });

      expect(fs.existsSync(logPath)).toBe(false);
    });

    it("skips UserPromptSubmit with empty prompt", () => {
      writeVirtualLogEntry(logPath, "UserPromptSubmit", { tool_input: {} });
      expect(fs.existsSync(logPath)).toBe(false);
    });
  });

});
