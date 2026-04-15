// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { 
  getIntegration, 
  INTEGRATIONS, 
  listIntegrationIds 
} from "../../src/hooks/integrations";
import { 
  CURSOR_HOOK_EVENT_TYPES, 
  GEMINI_HOOK_EVENT_TYPES, 
  COPILOT_HOOK_EVENT_TYPES,
  CODEX_HOOK_EVENT_TYPES,
} from "../../src/hooks/types";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

describe("hooks/integrations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("listIntegrationIds", () => {
    it("returns supported integration IDs", () => {
      const ids = listIntegrationIds();
      expect(ids).toContain("claude-code");
      expect(ids).toContain("cursor");
      expect(ids).toContain("gemini");
      expect(ids).toContain("copilot");
      expect(ids).toContain("codex");
      expect(ids.length).toBe(5);
    });
  });

  describe("claude-code", () => {
    const claude = getIntegration("claude-code");

    it("has correct properties", () => {
      expect(claude.id).toBe("claude-code");
      expect(claude.displayName).toBe("Claude Code");
      expect(claude.scopes).toEqual(["user", "project", "local"]);
    });

    it("detects as fallback", () => {
      expect(claude.detect({})).toBe(true);
    });

    it("getCanonicalEventName mirrors input", () => {
      expect(claude.getCanonicalEventName({}, "PreToolUse")).toBe("PreToolUse");
    });
  });

  describe("cursor", () => {
    const cursor = getIntegration("cursor");

    it("has correct properties", () => {
      expect(cursor.id).toBe("cursor");
      expect(cursor.displayName).toBe("Cursor");
      expect(cursor.scopes).toEqual(["user", "project"]);
      expect(cursor.eventTypes).toHaveLength(CURSOR_HOOK_EVENT_TYPES.length);
    });

    it("detects cursor payloads", () => {
      expect(cursor.detect({ workspace_roots: ["/a"] })).toBe(true);
      expect(cursor.detect({ hook_event_name: "preToolUse" })).toBe(true);
      expect(cursor.detect({ hook_event_name: "beforeShellExecution" })).toBe(true);
      expect(cursor.detect({ something: "else" })).toBe(false);
    });

    it("normalizes workspace_roots to cwd", () => {
      const payload: any = { workspace_roots: ["/root/a"] };
      cursor.normalizePayload(payload);
      expect(payload.cwd).toBe("/root/a");
    });

    it("builds hook entry with mapped event name", () => {
      const entry = cursor.buildHookEntry("/bin/fp", "beforeShellExecution") as any;
      expect(entry.command).toContain("--hook PreToolUse");
    });
  });

  describe("gemini", () => {
    const gemini = getIntegration("gemini");

    it("has correct properties", () => {
      expect(gemini.id).toBe("gemini");
      expect(gemini.displayName).toBe("Gemini CLI");
      expect(gemini.scopes).toEqual(["user", "project", "local"]); // Gemini uses same scopes as Claude
      expect(gemini.eventTypes).toHaveLength(GEMINI_HOOK_EVENT_TYPES.length);
    });

    it("detects gemini payloads exclusively", () => {
      expect(gemini.detect({ hook_event_name: "BeforeTool" })).toBe(true);
      expect(gemini.detect({ hook_event_name: "SessionStart" })).toBe(false); // Collision guard
    });

    it("maps events to canonical names", () => {
      expect(gemini.getCanonicalEventName({ hook_event_name: "BeforeTool" }, "BeforeTool")).toBe("PreToolUse");
      expect(gemini.getCanonicalEventName({ hook_event_name: "AfterAgent" }, "AfterAgent")).toBe("Stop");
    });

    it("resolves settings path correctly", () => {
      expect(gemini.getSettingsPath("user")).toBe(resolve(homedir(), ".gemini", "settings.json"));
    });
  });

  describe("copilot", () => {
    const copilot = getIntegration("copilot");

    it("has correct properties", () => {
      expect(copilot.id).toBe("copilot");
      expect(copilot.displayName).toBe("GitHub Copilot");
      expect(copilot.scopes).toEqual(["user", "project"]);
      expect(copilot.eventTypes).toHaveLength(COPILOT_HOOK_EVENT_TYPES.length);
    });

    it("detects copilot payloads via camelCase fields", () => {
      expect(copilot.detect({ sessionId: "123" })).toBe(true);
      expect(copilot.detect({ toolName: "ls" })).toBe(true);
      expect(copilot.detect({ hook_event_name: "preToolUse" })).toBe(true);
    });

    it("normalizes camelCase to snake_case", () => {
      const payload: any = { sessionId: "s1", toolName: "t1", toolInput: { a: 1 } };
      copilot.normalizePayload(payload);
      expect(payload.session_id).toBe("s1");
      expect(payload.tool_name).toBe("t1");
      expect(payload.tool_input).toEqual({ a: 1 });
    });

    it("maps events to canonical names", () => {
      expect(copilot.getCanonicalEventName({ hook_event_name: "preToolUse" }, "preToolUse")).toBe("PreToolUse");
      expect(copilot.getCanonicalEventName({ hook_event_name: "userPromptSubmitted" }, "userPromptSubmitted")).toBe("UserPromptSubmit");
      expect(copilot.getCanonicalEventName({}, "UserPromptSubmitted")).toBe("UserPromptSubmit");
      expect(copilot.getCanonicalEventName({}, "SessionEnd")).toBe("SessionEnd");
    });

    it("resolves user settings path with APPDATA fallback for windows", () => {
      // Mock process.platform
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });
      expect(copilot.getSettingsPath("user")).toBe(resolve(homedir(), ".config", "github-copilot", "hooks", "hooks.json"));
      
      Object.defineProperty(process, 'platform', { value: 'win32' });
      // APPDATA is typically defined in test env or mocked
      expect(copilot.getSettingsPath("user")).toContain("github-copilot");
      
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe("codex", () => {
    const codex = getIntegration("codex");

    it("has correct properties", () => {
      expect(codex.id).toBe("codex");
      expect(codex.displayName).toBe("OpenAI Codex");
      expect(codex.scopes).toEqual(["user", "project"]);
      expect(codex.eventTypes).toHaveLength(CODEX_HOOK_EVENT_TYPES.length);
    });

    it("detects codex payloads", () => {
      expect(codex.detect({ hook_event_name: "pre_tool_use" })).toBe(true);
      expect(codex.detect({ integration: "codex" })).toBe(true);
      expect(codex.detect({ hook_event_name: "preToolUse" })).toBe(false);
    });

    it("maps codex event names to canonical names", () => {
      expect(codex.getCanonicalEventName({ hook_event_name: "pre_tool_use" }, "pre_tool_use")).toBe("PreToolUse");
      expect(codex.getCanonicalEventName({ hook_event_name: "user_prompt_submit" }, "user_prompt_submit")).toBe("UserPromptSubmit");
    });

    it("resolves user settings path", () => {
      expect(codex.getSettingsPath("user")).toBe(resolve(homedir(), ".codex", "hooks.json"));
    });
  });
});
