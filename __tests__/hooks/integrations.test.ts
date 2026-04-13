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
import { CURSOR_HOOK_EVENT_TYPES } from "../../src/hooks/types";

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
      expect(ids.length).toBe(2);
    });
  });

  describe("claude-code", () => {
    const claude = getIntegration("claude-code");

    it("has correct properties", () => {
      expect(claude.id).toBe("claude-code");
      expect(claude.displayName).toBe("Claude Code");
      expect(claude.scopes).toEqual(["user", "project", "local"]);
    });

    it("resolves user settings path", () => {
      const path = claude.getSettingsPath("user");
      expect(path).toBe(resolve(homedir(), ".claude", "settings.json"));
    });

    it("resolves project settings path", () => {
      const path = claude.getSettingsPath("project", "/tmp/repo");
      expect(path).toBe(resolve("/tmp/repo", ".claude", "settings.json"));
    });

    it("builds hook entry with marker and ms timeout", () => {
      const entry = claude.buildHookEntry("/bin/failproofai", "PreToolUse") as any;
      expect(entry.command).toBe('"/bin/failproofai" --hook PreToolUse');
      expect(entry.timeout).toBe(60000);
      expect(entry.__failproofai_hook__).toBe(true);
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

    it("resolves user settings path", () => {
      const path = cursor.getSettingsPath("user");
      expect(path).toBe(resolve(homedir(), ".cursor", "hooks.json"));
    });

    it("resolves project settings path", () => {
      const path = cursor.getSettingsPath("project", "/tmp/repo");
      expect(path).toBe(resolve("/tmp/repo", ".cursor", "hooks.json"));
    });

    it("builds hook entry with seconds timeout and no marker", () => {
      const entry = cursor.buildHookEntry("/bin/failproofai", "beforeShellExecution") as any;
      expect(entry.command).toBe('sh -lc \'"/bin/failproofai" --hook PreToolUse\'');
      expect(entry.timeout).toBe(60);
      expect(entry.__failproofai_hook__).toBeUndefined();
    });

    it("detects failproofai hook by command string", () => {
      expect(cursor.isFailproofaiHook({ command: "failproofai --hook PreToolUse" })).toBe(true);
      expect(cursor.isFailproofaiHook({ command: "other --hook" })).toBe(false);
    });

    it("writeHookEntries maintains version: 1 and flat arrays", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      const settings: any = { version: 1, hooks: {} };
      
      cursor.writeHookEntries(settings, "/bin/failproofai");
      
      expect(settings.version).toBe(1);
      expect(settings.hooks["preToolUse"]).toBeDefined();
      expect(Array.isArray(settings.hooks["preToolUse"])).toBe(true);
      expect(settings.hooks["preToolUse"][0].command).toContain("--hook PreToolUse");
    });

    it("removeHooksFromFile preserves non-failproofai hooks", () => {
      const settings = {
        version: 1,
        hooks: {
          preToolUse: [
            { command: "other-hook" },
            { command: "failproofai --hook PreToolUse" }
          ]
        }
      };
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(settings));
      
      const removed = cursor.removeHooksFromFile("/tmp/hooks.json");
      
      expect(removed).toBe(1);
      const [path, content] = vi.mocked(writeFileSync).mock.calls[0];
      const written = JSON.parse(content as string);
      expect(written.hooks.preToolUse).toHaveLength(1);
      expect(written.hooks.preToolUse[0].command).toBe("other-hook");
    });
  });
});
