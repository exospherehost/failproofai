// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "node:fs";

vi.mock("node:fs");

const { resolvePermissionMode, findAncestorCmdline } = await import(
  "../../src/hooks/resolve-permission-mode"
);

describe("resolvePermissionMode", () => {
  beforeEach(() => vi.resetAllMocks());

  // ── Claude Code ────────────────────────────────────────────────────────────

  describe("claude-code", () => {
    it("returns permission_mode from payload", () => {
      expect(resolvePermissionMode("claude-code", { permission_mode: "plan" }, "s1")).toBe("plan");
    });

    it("returns default when not in payload", () => {
      expect(resolvePermissionMode("claude-code", {}, "s1")).toBe("default");
    });

    it("passes through any string value", () => {
      expect(resolvePermissionMode("claude-code", { permission_mode: "default" }, "s1")).toBe("default");
    });
  });

  // ── Codex ──────────────────────────────────────────────────────────────────

  describe("codex", () => {
    function mockCodexTranscript(sessionId: string, transcriptContent: string) {
      vi.mocked(fs.readdirSync)
        .mockReturnValueOnce([{ name: "2026", isDirectory: () => true, isFile: () => false }] as any)
        .mockReturnValueOnce([{ name: "04",   isDirectory: () => true, isFile: () => false }] as any)
        .mockReturnValueOnce([{ name: "25",   isDirectory: () => true, isFile: () => false }] as any)
        .mockReturnValueOnce([{ name: `rollout-abc-${sessionId}.jsonl`, isFile: () => true, isDirectory: () => false }] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(transcriptContent as any);
    }

    it("maps approval_policy never → full-auto", () => {
      mockCodexTranscript("sess-never", JSON.stringify({ type: "turn_context", payload: { approval_policy: "never" } }));
      expect(resolvePermissionMode("codex", {}, "sess-never")).toBe("full-auto");
    });

    it("maps approval_policy on-request → default", () => {
      mockCodexTranscript("sess-onreq", JSON.stringify({ type: "turn_context", payload: { approval_policy: "on-request" } }));
      expect(resolvePermissionMode("codex", {}, "sess-onreq")).toBe("default");
    });

    it("passes through unknown approval_policy values", () => {
      mockCodexTranscript("sess-other", JSON.stringify({ type: "turn_context", payload: { approval_policy: "custom-mode" } }));
      expect(resolvePermissionMode("codex", {}, "sess-other")).toBe("custom-mode");
    });

    it("returns default when transcript not found", () => {
      vi.mocked(fs.readdirSync).mockReturnValue([] as any);
      expect(resolvePermissionMode("codex", {}, "sess-missing")).toBe("default");
    });

    it("returns default when sessionId is missing", () => {
      expect(resolvePermissionMode("codex", {}, undefined)).toBe("default");
    });

    it("returns default when no turn_context line exists", () => {
      mockCodexTranscript("sess-no-ctx", JSON.stringify({ type: "session_meta", payload: {} }));
      expect(resolvePermissionMode("codex", {}, "sess-no-ctx")).toBe("default");
    });

    it("skips malformed JSON lines and returns default", () => {
      mockCodexTranscript("sess-bad", "not-json\nalso-not-json");
      expect(resolvePermissionMode("codex", {}, "sess-bad")).toBe("default");
    });

    it("returns default when readdirSync throws", () => {
      vi.mocked(fs.readdirSync).mockImplementation(() => { throw new Error("ENOENT"); });
      expect(resolvePermissionMode("codex", {}, "sess-err")).toBe("default");
    });
  });

  // ── findAncestorCmdline ────────────────────────────────────────────────────

  describe("findAncestorCmdline", () => {
    it("returns argv when binary found in direct parent", () => {
      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce("Name: node\nPPid: 42\n" as any)    // /proc/pid/status
        .mockReturnValueOnce("/usr/bin/cursor\0--yolo\0" as any); // /proc/42/cmdline
      const result = findAncestorCmdline("cursor");
      expect(result).toEqual(["/usr/bin/cursor", "--yolo"]);
    });

    it("walks up multiple hops to find binary", () => {
      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce("PPid: 50\n" as any)             // pid/status → ppid=50
        .mockReturnValueOnce("/bin/bash\0" as any)            // 50/cmdline — not cursor
        .mockReturnValueOnce("PPid: 99\n" as any)             // 50/status → ppid=99
        .mockReturnValueOnce("/usr/bin/cursor\0--mode\0plan\0" as any); // 99/cmdline — cursor
      expect(findAncestorCmdline("cursor")).toEqual(["/usr/bin/cursor", "--mode", "plan"]);
    });

    it("returns null when binary not found within 10 hops", () => {
      vi.mocked(fs.readFileSync).mockReturnValue("Name: bash\nPPid: 1\n" as any);
      expect(findAncestorCmdline("cursor")).toBeNull();
    });

    it("returns null when PPid is 1 (init)", () => {
      vi.mocked(fs.readFileSync).mockReturnValueOnce("PPid: 1\n" as any);
      expect(findAncestorCmdline("cursor")).toBeNull();
    });

    it("returns null on read error", () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => { throw new Error("EACCES"); });
      expect(findAncestorCmdline("cursor")).toBeNull();
    });

    it("finds binary when run via Node.js interpreter (argv[1] contains name)", () => {
      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce("PPid: 42\n" as any)
        .mockReturnValueOnce("/usr/bin/node\0/usr/local/bin/gemini.js\0--yolo\0" as any);
      expect(findAncestorCmdline("gemini")).toEqual(["/usr/bin/node", "/usr/local/bin/gemini.js", "--yolo"]);
    });
  });

  // ── Cursor ─────────────────────────────────────────────────────────────────

  describe("cursor (linux only)", () => {
    if (process.platform !== "linux") return;

    function mockCursorProcess(argv: string[]) {
      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce(`PPid: 99\n` as any)
        .mockReturnValueOnce(argv.join("\0") + "\0" as any);
    }

    it("--yolo → yolo", () => {
      mockCursorProcess(["/usr/bin/cursor", "--yolo"]);
      expect(resolvePermissionMode("cursor", {}, "s1")).toBe("yolo");
    });

    it("--force → yolo", () => {
      mockCursorProcess(["/usr/bin/cursor", "--force"]);
      expect(resolvePermissionMode("cursor", {}, "s1")).toBe("yolo");
    });

    it("--mode plan → plan", () => {
      mockCursorProcess(["/usr/bin/cursor", "--mode", "plan"]);
      expect(resolvePermissionMode("cursor", {}, "s1")).toBe("plan");
    });

    it("--mode ask → ask", () => {
      mockCursorProcess(["/usr/bin/cursor", "--mode", "ask"]);
      expect(resolvePermissionMode("cursor", {}, "s1")).toBe("ask");
    });

    it("no mode flags → default", () => {
      mockCursorProcess(["/usr/bin/cursor", "--model", "gpt-4o"]);
      expect(resolvePermissionMode("cursor", {}, "s1")).toBe("default");
    });
  });

  // ── Copilot ────────────────────────────────────────────────────────────────

  describe("copilot (linux only)", () => {
    if (process.platform !== "linux") return;

    function mockCopilotProcess(argv: string[]) {
      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce(`PPid: 99\n` as any)
        .mockReturnValueOnce(argv.join("\0") + "\0" as any);
    }

    it("--yolo → yolo", () => {
      mockCopilotProcess(["/usr/bin/copilot", "--yolo"]);
      expect(resolvePermissionMode("copilot", {}, "s1")).toBe("yolo");
    });

    it("--allow-all → yolo", () => {
      mockCopilotProcess(["/usr/bin/copilot", "--allow-all"]);
      expect(resolvePermissionMode("copilot", {}, "s1")).toBe("yolo");
    });

    it("--allow-all-tools → allow-all-tools", () => {
      mockCopilotProcess(["/usr/bin/copilot", "--allow-all-tools"]);
      expect(resolvePermissionMode("copilot", {}, "s1")).toBe("allow-all-tools");
    });

    it("--autopilot → autopilot", () => {
      mockCopilotProcess(["/usr/bin/copilot", "--autopilot"]);
      expect(resolvePermissionMode("copilot", {}, "s1")).toBe("autopilot");
    });

    it("--plan → plan", () => {
      mockCopilotProcess(["/usr/bin/copilot", "--plan"]);
      expect(resolvePermissionMode("copilot", {}, "s1")).toBe("plan");
    });

    it("--mode autopilot → autopilot", () => {
      mockCopilotProcess(["/usr/bin/copilot", "--mode", "autopilot"]);
      expect(resolvePermissionMode("copilot", {}, "s1")).toBe("autopilot");
    });

    it("--mode plan → plan", () => {
      mockCopilotProcess(["/usr/bin/copilot", "--mode", "plan"]);
      expect(resolvePermissionMode("copilot", {}, "s1")).toBe("plan");
    });

    it("--mode interactive → interactive", () => {
      mockCopilotProcess(["/usr/bin/copilot", "--mode", "interactive"]);
      expect(resolvePermissionMode("copilot", {}, "s1")).toBe("interactive");
    });

    it("no mode flags → default", () => {
      mockCopilotProcess(["/usr/bin/copilot", "--model", "gpt-4o"]);
      expect(resolvePermissionMode("copilot", {}, "s1")).toBe("default");
    });
  });

  // ── Gemini ─────────────────────────────────────────────────────────────────

  describe("gemini (linux only)", () => {
    if (process.platform !== "linux") return;

    function mockGeminiProcess(argv: string[]) {
      vi.mocked(fs.readFileSync)
        .mockReturnValueOnce(`PPid: 99\n` as any)
        .mockReturnValueOnce(argv.join("\0") + "\0" as any);
    }

    it("--yolo → yolo", () => {
      mockGeminiProcess(["/usr/bin/gemini", "--yolo"]);
      expect(resolvePermissionMode("gemini", {}, "s1")).toBe("yolo");
    });

    it("no mode flags → default", () => {
      mockGeminiProcess(["/usr/bin/gemini", "--model", "gemini-2.0"]);
      expect(resolvePermissionMode("gemini", {}, "s1")).toBe("default");
    });
  });

  // ── OpenCode / Pi ──────────────────────────────────────────────────────────

  describe("opencode", () => {
    it("always returns default", () => {
      expect(resolvePermissionMode("opencode", {}, "ses_abc123")).toBe("default");
    });
  });

  describe("pi", () => {
    it("always returns default", () => {
      expect(resolvePermissionMode("pi", {}, "pi-session-xyz")).toBe("default");
    });
  });
});
