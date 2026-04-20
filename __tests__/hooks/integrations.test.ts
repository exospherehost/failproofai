// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import {
  getIntegration,
  INTEGRATIONS,
  listIntegrationIds,
  appendCopilotSyncToBashrc,
  removeCopilotSyncFromRcFiles,
  synchronizeCopilotProjectHooks,
} from "../../src/hooks/integrations";
import { 
  CURSOR_HOOK_EVENT_TYPES, 
  GEMINI_HOOK_EVENT_TYPES, 
  COPILOT_HOOK_EVENT_TYPES,
  CODEX_HOOK_EVENT_TYPES,
  OPENCODE_HOOK_EVENT_TYPES,
} from "../../src/hooks/types";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
  rmSync: vi.fn(),
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
      expect(ids).toContain("codex");
      expect(ids).toContain("opencode");
      expect(ids).toContain("pi");
      expect(ids.length).toBe(7);
    });
  });

  describe("claude-code", () => {
    const claude = getIntegration("claude-code");

    it("has correct properties", () => {
      expect(claude.id).toBe("claude-code");
      expect(claude.displayName).toBe("Claude Code");
      expect(claude.scopes).toEqual(["user", "project", "local"]);
    });

    it("detects claude-specific events", () => {
      expect(claude.detect({ hook_event_name: "beforeSubmitPrompt" })).toBe(true);
      expect(claude.detect({})).toBe(false); // No longer fallback
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
      expect(gemini.scopes).toEqual(["user", "project"]);
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

    it("resolves user settings path via COPILOT_HOME or ~/.copilot", () => {
      const oldHome = process.env.COPILOT_HOME;
      delete process.env.COPILOT_HOME;
      expect(copilot.getSettingsPath("user")).toBe(resolve(homedir(), ".copilot", "config.json"));

      process.env.COPILOT_HOME = "/tmp/copilot-home";
      expect(copilot.getSettingsPath("user")).toBe(resolve("/tmp/copilot-home", "config.json"));

      if (oldHome) process.env.COPILOT_HOME = oldHome;
      else delete process.env.COPILOT_HOME;
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
  
  describe("opencode", () => {
    const opencode = getIntegration("opencode");

    it("has correct properties", () => {
      expect(opencode.id).toBe("opencode");
      expect(opencode.displayName).toBe("OpenCode");
      expect(opencode.scopes).toEqual(["user", "project"]);
      expect(opencode.eventTypes).toHaveLength(OPENCODE_HOOK_EVENT_TYPES.length);
    });

    it("detects opencode payloads", () => {
      expect(opencode.detect({ integration: "opencode" })).toBe(true);
      expect(opencode.detect({ slug: "gentle-wizard" })).toBe(true);
      expect(opencode.detect({ session_id: "ses_123" })).toBe(true);
      expect(opencode.detect({ something: "else" })).toBe(false);
    });

    it("maps events to canonical names", () => {
      expect(opencode.getCanonicalEventName({ data: { type: "session.created" } }, "")).toBe("SessionStart");
      expect(opencode.getCanonicalEventName({ hook_event_name: "tool.execute.before" }, "")).toBe("PreToolUse");
    });

    it("resolves user settings path including filename", () => {
      expect(opencode.getSettingsPath("user")).toBe(resolve(homedir(), ".config", "opencode", "plugins", "failproofai.ts"));
    });

    it("returns correct count when removing hooks", () => {
      const settingsPath = "/mock/path/failproofai.ts";
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue("failproofai logic here");

      const count = opencode.removeHooksFromFile(settingsPath);
      expect(count).toBe(OPENCODE_HOOK_EVENT_TYPES.length);
    });
  });

  describe("appendCopilotSyncToBashrc", () => {
    it("writes env-prefixed command on first install", () => {
      vi.mocked(existsSync).mockImplementation((p) => String(p).endsWith(".bashrc"));
      vi.mocked(readFileSync).mockReturnValue("# existing content\n");

      appendCopilotSyncToBashrc();

      const written = vi.mocked(writeFileSync).mock.calls[0][1] as string;
      expect(written).toContain("env failproofai copilot-sync 2>/dev/null");
      expect(written).not.toContain("\nfailproofai copilot-sync"); // no bare command
    });

    it("upgrades old bare command to env-prefixed on reinstall", () => {
      const oldContent = "# existing\n# failproofai copilot-sync\nfailproofai copilot-sync 2>/dev/null\n";
      vi.mocked(existsSync).mockImplementation((p) => String(p).endsWith(".bashrc"));
      vi.mocked(readFileSync).mockReturnValue(oldContent);

      appendCopilotSyncToBashrc();

      const written = vi.mocked(writeFileSync).mock.calls[0][1] as string;
      expect(written).toContain("env failproofai copilot-sync 2>/dev/null");
      // bare command line (at start of line) must be gone
      expect(written).not.toMatch(/\nfailproofai copilot-sync 2>\/dev\/null/);
    });

    it("skips write when env-prefixed command already present", () => {
      // NEW_CMD contains OLD_CMD as substring — regex must not match env-prefixed line
      const newContent = "# failproofai copilot-sync\nenv failproofai copilot-sync 2>/dev/null\n";
      vi.mocked(existsSync).mockImplementation((p) => String(p).endsWith(".bashrc"));
      vi.mocked(readFileSync).mockReturnValue(newContent);

      appendCopilotSyncToBashrc();

      expect(vi.mocked(writeFileSync)).not.toHaveBeenCalled();
    });
  });

  describe("removeCopilotSyncFromRcFiles", () => {
    it("removes marker and command line from bashrc", () => {
      const content = "# other stuff\n# failproofai copilot-sync\nenv failproofai copilot-sync 2>/dev/null\n# more stuff\n";
      vi.mocked(existsSync).mockImplementation((p) => String(p).endsWith(".bashrc"));
      vi.mocked(readFileSync).mockReturnValue(content);

      removeCopilotSyncFromRcFiles();

      const written = vi.mocked(writeFileSync).mock.calls[0][1] as string;
      expect(written).not.toContain("failproofai copilot-sync");
      expect(written).toContain("# other stuff");
      expect(written).toContain("# more stuff");
    });

    it("does nothing when marker is absent", () => {
      vi.mocked(existsSync).mockImplementation((p) => String(p).endsWith(".bashrc"));
      vi.mocked(readFileSync).mockReturnValue("# unrelated content\n");

      removeCopilotSyncFromRcFiles();

      expect(vi.mocked(writeFileSync)).not.toHaveBeenCalled();
    });
  });

  describe("synchronizeCopilotProjectHooks", () => {
    it("merges project hooks into global config", () => {
      const globalPath = resolve(homedir(), ".copilot", "config.json");
      const projectPath = resolve(process.cwd(), ".github", "hooks", "failproofai.json");

      vi.mocked(existsSync).mockImplementation((p) => {
        const path = String(p);
        return path === globalPath || path === projectPath;
      });

      vi.mocked(readFileSync).mockImplementation((p) => {
        const path = String(p);
        if (path === globalPath) return JSON.stringify({ hooks: { preToolUse: [] } });
        if (path === projectPath) return JSON.stringify({ hooks: { preToolUse: [{ bash: "npx failproofai" }] } });
        return "";
      });

      synchronizeCopilotProjectHooks();

      const lastWrite = vi.mocked(writeFileSync).mock.calls.find(c => String(c[0]) === globalPath);
      expect(lastWrite).toBeDefined();
      const data = JSON.parse(lastWrite![1] as string);
      expect(data.hooks.preToolUse).toHaveLength(1);
      expect(data.hooks.preToolUse[0].bash).toBe("npx failproofai");
    });

    it("clears old project hooks before adding new ones", () => {
      const globalPath = resolve(homedir(), ".copilot", "config.json");
      const projectPath = resolve(process.cwd(), ".github", "hooks", "failproofai.json");

      vi.mocked(existsSync).mockImplementation((p) => String(p) === globalPath || String(p) === projectPath);
      vi.mocked(readFileSync).mockImplementation((p) => {
        const path = String(p);
        if (path === globalPath) {
          return JSON.stringify({
            hooks: {
              preToolUse: [{ bash: "npx -y failproofai --hook PreToolUse --integration copilot" }]
            }
          });
        }
        if (path === projectPath) {
          return JSON.stringify({
            hooks: {
              preToolUse: [{ bash: "npx -y failproofai --hook PreToolUse --integration copilot --NEW" }]
            }
          });
        }
        return "";
      });

      synchronizeCopilotProjectHooks();

      const lastWrite = vi.mocked(writeFileSync).mock.calls.find(c => String(c[0]) === globalPath);
      const data = JSON.parse(lastWrite![1] as string);
      expect(data.hooks.preToolUse).toHaveLength(1);
      expect(data.hooks.preToolUse[0].bash).toContain("--NEW");
    });
  });
});
