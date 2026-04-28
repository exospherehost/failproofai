/**
 * Unit tests for the per-CLI Integration adapter (src/hooks/integrations.ts).
 *
 * Covers Claude Code and OpenAI Codex:
 *   • per-scope settings path
 *   • hook entry shape + idempotent install
 *   • mark/detect/remove
 *   • Codex-specific snake → Pascal mapping in settings keys
 *   • registry (getIntegration / listIntegrations)
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import {
  claudeCode,
  codex,
  getIntegration,
  listIntegrations,
} from "../../src/hooks/integrations";
import {
  CODEX_HOOK_EVENT_TYPES,
  CODEX_EVENT_MAP,
  HOOK_EVENT_TYPES,
  FAILPROOFAI_HOOK_MARKER,
  type CodexHookEventType,
} from "../../src/hooks/types";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "fp-integrations-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("integrations registry", () => {
  it("listIntegrations returns claude-code and codex", () => {
    const ids = listIntegrations().map((i) => i.id);
    expect(ids).toEqual(["claude-code", "codex"]);
  });

  it("getIntegration('claude-code') returns claudeCode", () => {
    expect(getIntegration("claude-code")).toBe(claudeCode);
  });

  it("getIntegration('codex') returns codex", () => {
    expect(getIntegration("codex")).toBe(codex);
  });

  it("getIntegration throws for unknown id", () => {
    // @ts-expect-error — testing error path
    expect(() => getIntegration("unknown-cli")).toThrow();
  });
});

describe("Claude Code integration", () => {
  it("getSettingsPath maps each scope to the expected file", () => {
    expect(claudeCode.getSettingsPath("project", tempDir)).toBe(
      resolve(tempDir, ".claude", "settings.json"),
    );
    expect(claudeCode.getSettingsPath("local", tempDir)).toBe(
      resolve(tempDir, ".claude", "settings.local.json"),
    );
    expect(claudeCode.getSettingsPath("user")).toMatch(/\.claude\/settings\.json$/);
  });

  it("scopes include user|project|local", () => {
    expect(claudeCode.scopes).toEqual(["user", "project", "local"]);
  });

  it("buildHookEntry omits --cli for back-compat", () => {
    const entry = claudeCode.buildHookEntry("/usr/bin/failproofai", "PreToolUse", "user");
    expect(entry.command).toBe('"/usr/bin/failproofai" --hook PreToolUse');
    expect(entry.command).not.toContain("--cli");
    expect(entry.timeout).toBe(60_000);
    expect(entry[FAILPROOFAI_HOOK_MARKER]).toBe(true);
  });

  it("project scope uses npx -y failproofai (portable)", () => {
    const entry = claudeCode.buildHookEntry("/usr/bin/failproofai", "PreToolUse", "project");
    expect(entry.command).toBe("npx -y failproofai --hook PreToolUse");
  });

  it("writeHookEntries adds a matcher per HOOK_EVENT_TYPES event", () => {
    const settings: Record<string, unknown> = {};
    claudeCode.writeHookEntries(settings, "/usr/bin/failproofai", "user");
    const hooks = settings.hooks as Record<string, unknown[]>;
    for (const eventType of HOOK_EVENT_TYPES) {
      expect(hooks[eventType]).toBeDefined();
    }
  });

  it("re-running writeHookEntries is idempotent (replaces, doesn't duplicate)", () => {
    const settings: Record<string, unknown> = {};
    claudeCode.writeHookEntries(settings, "/usr/bin/failproofai", "user");
    claudeCode.writeHookEntries(settings, "/new/path/failproofai", "user");
    const hooks = settings.hooks as Record<string, Array<{ hooks: unknown[] }>>;
    expect(hooks.PreToolUse).toHaveLength(1);
    expect(hooks.PreToolUse[0].hooks).toHaveLength(1);
  });

  it("removeHooksFromFile clears all failproofai entries", () => {
    const settingsPath = resolve(tempDir, ".claude", "settings.json");
    const settings: Record<string, unknown> = {};
    claudeCode.writeHookEntries(settings, "/usr/bin/failproofai", "user");
    claudeCode.writeSettings(settingsPath, settings);

    const removed = claudeCode.removeHooksFromFile(settingsPath);
    expect(removed).toBe(HOOK_EVENT_TYPES.length);

    const after = JSON.parse(readFileSync(settingsPath, "utf-8")) as Record<string, unknown>;
    expect(after.hooks).toBeUndefined();
  });

  it("hooksInstalledInSettings detects an installed hook", () => {
    const settingsPath = claudeCode.getSettingsPath("project", tempDir);
    const settings: Record<string, unknown> = {};
    claudeCode.writeHookEntries(settings, "/usr/bin/failproofai", "project");
    claudeCode.writeSettings(settingsPath, settings);

    expect(claudeCode.hooksInstalledInSettings("project", tempDir)).toBe(true);
  });

  it("hooksInstalledInSettings returns false when file is missing", () => {
    expect(claudeCode.hooksInstalledInSettings("project", tempDir)).toBe(false);
  });
});

describe("OpenAI Codex integration", () => {
  it("getSettingsPath maps user → ~/.codex/hooks.json and project → <cwd>/.codex/hooks.json", () => {
    expect(codex.getSettingsPath("project", tempDir)).toBe(
      resolve(tempDir, ".codex", "hooks.json"),
    );
    expect(codex.getSettingsPath("user")).toMatch(/\.codex\/hooks\.json$/);
  });

  it("scopes are user|project (no local)", () => {
    expect(codex.scopes).toEqual(["user", "project"]);
  });

  it("eventTypes are exactly the 6 documented Codex events (snake_case)", () => {
    expect(codex.eventTypes).toEqual(CODEX_HOOK_EVENT_TYPES);
    // PR 185 omitted permission_request — make sure we have it.
    expect(codex.eventTypes).toContain("permission_request");
  });

  it("buildHookEntry includes --cli codex on the command line", () => {
    const entry = codex.buildHookEntry("/usr/bin/failproofai", "pre_tool_use", "user");
    expect(entry.command).toContain("--cli codex");
    expect(entry.command).toContain("--hook pre_tool_use");
    expect(entry[FAILPROOFAI_HOOK_MARKER]).toBe(true);
  });

  it("project scope uses npx -y failproofai", () => {
    const entry = codex.buildHookEntry("/usr/bin/failproofai", "pre_tool_use", "project");
    expect(entry.command).toBe("npx -y failproofai --hook pre_tool_use --cli codex");
  });

  it("writeHookEntries stores keys in PascalCase via CODEX_EVENT_MAP", () => {
    const settings: Record<string, unknown> = {};
    codex.writeHookEntries(settings, "/usr/bin/failproofai", "user");
    const hooks = settings.hooks as Record<string, unknown[]>;
    // Pascal keys (per Codex docs)
    for (const snake of CODEX_HOOK_EVENT_TYPES) {
      const pascal = CODEX_EVENT_MAP[snake as CodexHookEventType];
      expect(hooks[pascal]).toBeDefined();
      // Snake-case keys must NOT be present (Codex stores under Pascal)
      expect(hooks[snake]).toBeUndefined();
    }
    // Settings file carries version: 1
    expect(settings.version).toBe(1);
  });

  it("readSettings backfills version: 1 on existing files without it", () => {
    const settingsPath = resolve(tempDir, ".codex", "hooks.json");
    mkdirSync(resolve(tempDir, ".codex"), { recursive: true });
    writeFileSync(settingsPath, JSON.stringify({ hooks: {} }));
    const read = codex.readSettings(settingsPath);
    expect(read.version).toBe(1);
  });

  it("re-running writeHookEntries is idempotent", () => {
    const settings: Record<string, unknown> = {};
    codex.writeHookEntries(settings, "/usr/bin/failproofai", "user");
    codex.writeHookEntries(settings, "/different/path/failproofai", "user");
    const hooks = settings.hooks as Record<string, Array<{ hooks: unknown[] }>>;
    expect(hooks.PreToolUse).toHaveLength(1);
    expect(hooks.PreToolUse[0].hooks).toHaveLength(1);
  });

  it("removeHooksFromFile clears all failproofai entries (returns count)", () => {
    const settingsPath = codex.getSettingsPath("project", tempDir);
    const settings: Record<string, unknown> = {};
    codex.writeHookEntries(settings, "/usr/bin/failproofai", "project");
    codex.writeSettings(settingsPath, settings);
    expect(existsSync(settingsPath)).toBe(true);

    const removed = codex.removeHooksFromFile(settingsPath);
    expect(removed).toBe(CODEX_HOOK_EVENT_TYPES.length);

    const after = JSON.parse(readFileSync(settingsPath, "utf-8")) as Record<string, unknown>;
    expect(after.hooks).toBeUndefined();
  });

  it("hooksInstalledInSettings detects installed hooks under PascalCase keys", () => {
    const settingsPath = codex.getSettingsPath("project", tempDir);
    const settings: Record<string, unknown> = {};
    codex.writeHookEntries(settings, "/usr/bin/failproofai", "project");
    codex.writeSettings(settingsPath, settings);

    expect(codex.hooksInstalledInSettings("project", tempDir)).toBe(true);
  });
});

describe("CODEX_EVENT_MAP", () => {
  it("maps every Codex snake_case event to a PascalCase HookEventType", () => {
    expect(CODEX_EVENT_MAP.pre_tool_use).toBe("PreToolUse");
    expect(CODEX_EVENT_MAP.post_tool_use).toBe("PostToolUse");
    expect(CODEX_EVENT_MAP.permission_request).toBe("PermissionRequest");
    expect(CODEX_EVENT_MAP.session_start).toBe("SessionStart");
    expect(CODEX_EVENT_MAP.user_prompt_submit).toBe("UserPromptSubmit");
    expect(CODEX_EVENT_MAP.stop).toBe("Stop");
  });
});
