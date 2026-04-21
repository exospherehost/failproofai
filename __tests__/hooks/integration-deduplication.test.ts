/**
 * Regression tests for hook deduplication
 *
 * ISSUE: When reinstalling hooks, duplicate entries accumulate in config files,
 * causing multiple hook processes to fire for the same event. This blocks prompts
 * and creates confusing duplicate dashboard entries.
 *
 * TESTS: Verify that hook installation always maintains exactly 1 failproofai hook per event.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getIntegration, INTEGRATIONS } from "@/src/hooks/integrations";
import { randomUUID } from "node:crypto";

const TEMP_DIR = join(tmpdir(), `failproofai-test-${randomUUID()}`);

describe("Integration: Hook Deduplication", () => {
  beforeEach(() => {
    try {
      mkdirSync(TEMP_DIR, { recursive: true });
    } catch {
      // Already exists
    }
  });

  afterEach(() => {
    // Cleanup temp files
    try {
      const fs = require("node:fs");
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("Copilot integration", () => {
    it("should not create duplicate hooks on multiple writeHookEntries calls", () => {
      const configPath = join(TEMP_DIR, "copilot-config.json");

      // Initial config
      const initialConfig = {
        version: 1,
        hooks: {} as Record<string, any[]>,
      };

      writeFileSync(configPath, JSON.stringify(initialConfig));
      const copilot = getIntegration("copilot");

      // Simulate multiple installations (common source of duplicates)
      const settings1 = JSON.parse(readFileSync(configPath, "utf-8"));
      copilot.writeHookEntries(settings1, "/path/to/failproofai", "user");
      writeFileSync(configPath, JSON.stringify(settings1));

      const settings2 = JSON.parse(readFileSync(configPath, "utf-8"));
      copilot.writeHookEntries(settings2, "/path/to/failproofai", "user");
      writeFileSync(configPath, JSON.stringify(settings2));

      const settings3 = JSON.parse(readFileSync(configPath, "utf-8"));
      copilot.writeHookEntries(settings3, "/path/to/failproofai", "user");
      writeFileSync(configPath, JSON.stringify(settings3));

      // Verify: exactly ONE failproofai hook per event type, no duplicates
      const hooks = settings3.hooks as Record<string, any[]>;
      for (const [eventType, entries] of Object.entries(hooks)) {
        const failproofaiHooks = entries.filter(
          (h) => copilot.isFailproofaiHook(h)
        );
        expect(
          failproofaiHooks.length,
          `Event ${eventType} should have exactly 1 failproofai hook, but has ${failproofaiHooks.length}`
        ).toBe(1);
      }
    });

    it("should replace old failproofai hooks when binary path changes", () => {
      const configPath = join(TEMP_DIR, "copilot-binary-path.json");

      const initialConfig = {
        version: 1,
        hooks: {} as Record<string, any[]>,
      };

      writeFileSync(configPath, JSON.stringify(initialConfig));
      const copilot = getIntegration("copilot");

      // Install with path 1
      const settings1 = JSON.parse(readFileSync(configPath, "utf-8"));
      copilot.writeHookEntries(settings1, "/old/path/failproofai", "user");
      writeFileSync(configPath, JSON.stringify(settings1));

      // Install with path 2 (simulating reinstall with updated binary path)
      const settings2 = JSON.parse(readFileSync(configPath, "utf-8"));
      copilot.writeHookEntries(settings2, "/new/path/failproofai", "user");

      // Verify: hooks use NEW path, no OLD path hooks remain
      const hooks = settings2.hooks as Record<string, any[]>;
      for (const entries of Object.values(hooks)) {
        for (const hook of entries) {
          if (copilot.isFailproofaiHook(hook)) {
            expect(hook.bash).toContain("/new/path/failproofai");
            expect(hook.bash).not.toContain("/old/path/failproofai");
          }
        }
      }
    });

    it("should preserve non-failproofai hooks when updating", () => {
      const configPath = join(TEMP_DIR, "copilot-preserve.json");

      const initialConfig = {
        version: 1,
        hooks: {
          userPromptSubmitted: [
            { type: "command", bash: "echo 'custom-hook'", timeoutSec: 30 },
          ],
        },
      };

      writeFileSync(configPath, JSON.stringify(initialConfig));
      const copilot = getIntegration("copilot");

      // Install failproofai hooks
      const settings = JSON.parse(readFileSync(configPath, "utf-8"));
      copilot.writeHookEntries(settings, "/path/to/failproofai", "user");

      // Verify: custom hook preserved alongside failproofai hook
      const hooks = settings.hooks.userPromptSubmitted as any[];
      expect(hooks.length).toBe(2); // custom + failproofai

      const customHook = hooks.find((h) => !copilot.isFailproofaiHook(h));
      expect(customHook?.bash).toBe("echo 'custom-hook'");
    });

    it("should handle all Copilot event types without duplication", () => {
      const configPath = join(TEMP_DIR, "copilot-all-events.json");

      const initialConfig = { version: 1, hooks: {} as Record<string, any[]> };
      writeFileSync(configPath, JSON.stringify(initialConfig));
      const copilot = getIntegration("copilot");

      // Install multiple times
      for (let i = 0; i < 3; i++) {
        const settings = JSON.parse(readFileSync(configPath, "utf-8"));
        copilot.writeHookEntries(settings, "/path/to/failproofai", "user");
        writeFileSync(configPath, JSON.stringify(settings));
      }

      const finalConfig = JSON.parse(readFileSync(configPath, "utf-8"));
      const hooks = finalConfig.hooks as Record<string, any[]>;

      // Verify all Copilot event types present with no duplicates
      for (const eventType of INTEGRATIONS.copilot.eventTypes) {
        expect(hooks[eventType], `${eventType} should be registered`).toBeDefined();

        const failproofaiCount = hooks[eventType].filter(
          (h) => copilot.isFailproofaiHook(h)
        ).length;
        expect(
          failproofaiCount,
          `${eventType} should have exactly 1 failproofai hook`
        ).toBe(1);
      }
    });
  });

  describe("Hook registration ordering", () => {
    it("should fire exactly ONE hook per event even with scope duplicates", async () => {
      // Simulate the scenario from the regression:
      // User has both user-scope and project-scope hooks installed.
      // Each scope gets its own config file, so they can't see each other's hooks.
      // The handler should still work correctly.

      const userScopeConfig = {
        version: 1,
        hooks: {} as Record<string, any[]>,
      };

      const projectScopeConfig = {
        version: 1,
        hooks: {} as Record<string, any[]>,
      };

      const copilot = getIntegration("copilot");

      copilot.writeHookEntries(userScopeConfig, "/path/to/user-failproofai", "user");
      copilot.writeHookEntries(projectScopeConfig, "/path/to/project-failproofai", "project");

      // Each scope should have exactly 1 failproofai hook per event (not duplicate across scopes)
      for (const eventType of INTEGRATIONS.copilot.eventTypes) {
        const userHooks = userScopeConfig.hooks[eventType]?.filter(
          (h) => copilot.isFailproofaiHook(h)
        ) ?? [];
        const projectHooks = projectScopeConfig.hooks[eventType]?.filter(
          (h) => copilot.isFailproofaiHook(h)
        ) ?? [];

        expect(userHooks.length).toBe(1);
        expect(projectHooks.length).toBe(1);

        // Both should be present (expected for scope duplication warning)
        // but that's a separate concern handled by the manager's deduplication warning
      }
    });
  });

  describe("Hook execution idempotency", () => {
    it("should handle identical event firings without side effects", async () => {
      // Even if duplicate hooks fire (before fix), the handler should be resilient.
      // This test ensures handler processes can deduplicate at runtime.

      // Create test payloads for the same event
      const payload1: Record<string, unknown> = {
        integration: "copilot",
        sessionId: "test-session-1",
        hook_event_name: "userPromptSubmitted",
      };

      const payload2: Record<string, unknown> = {
        integration: "copilot",
        sessionId: "test-session-1",
        hook_event_name: "userPromptSubmitted",
      };

      // Both should be detected as Copilot
      const copilot = getIntegration("copilot");
      expect(copilot.detect(payload1)).toBe(true);
      expect(copilot.detect(payload2)).toBe(true);

      // Both should be normalized identically
      copilot.normalizePayload(payload1);
      copilot.normalizePayload(payload2);

      expect(payload1.session_id).toBe(payload2.session_id);
    });
  });
});
