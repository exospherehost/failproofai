/**
 * Platform integration registry.
 *
 * Each integration describes how failproofai hooks are installed, detected,
 * and formatted for a specific AI agent CLI (Claude Code, Cursor, etc.).
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { homedir } from "node:os";
import {
  HOOK_EVENT_TYPES,
  HOOK_SCOPES,
  CURSOR_HOOK_EVENT_TYPES,
  CURSOR_HOOK_SCOPES,
  CURSOR_EVENT_MAP,
  FAILPROOFAI_HOOK_MARKER,
  type IntegrationType,
  type CursorHookEventType,
  type ClaudeSettings,
  type ClaudeHookMatcher,
  type CursorHooksFile,
  type CursorHookEntry,
} from "./types";

// ── Integration interface ───────────────────────────────────────────────────

export interface Integration {
  id: IntegrationType;
  displayName: string;
  scopes: readonly string[];
  eventTypes: readonly string[];
  hookMarker: string;

  /** Resolve the settings/hooks file path for a given scope. */
  getSettingsPath(scope: string, cwd?: string): string;

  /** Read the settings/hooks file, returning a default if it doesn't exist. */
  readSettings(settingsPath: string): Record<string, unknown>;

  /** Write the settings/hooks file. */
  writeSettings(settingsPath: string, settings: Record<string, unknown>): void;

  /** Build a single hook entry for this integration. */
  buildHookEntry(binaryPath: string, eventType: string): Record<string, unknown>;

  /** Check whether a hook entry belongs to failproofai. */
  isFailproofaiHook(hook: Record<string, unknown>): boolean;

  /**
   * Write hook entries into the settings object for all supported event types.
   * Mutates `settings` in place.
   */
  writeHookEntries(settings: Record<string, unknown>, binaryPath: string): void;

  /**
   * Remove failproofai hook entries from a settings file.
   * Returns the number of entries removed.
   */
  removeHooksFromFile(settingsPath: string): number;

  /** Check whether failproofai hooks exist in a given scope. */
  hooksInstalledInSettings(scope: string, cwd?: string): boolean;

  /** Detect whether the platform CLI binary is installed. */
  detectInstalled(): boolean;

  /** Optional post-install step. */
  postInstall?(): void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function readJsonFile(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function writeJsonFile(path: string, data: Record<string, unknown>): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function isMarkedHook(hook: Record<string, unknown>): boolean {
  if (hook[FAILPROOFAI_HOOK_MARKER] === true) return true;
  const cmd = typeof hook.command === "string" ? hook.command : "";
  return cmd.includes("failproofai") && cmd.includes("--hook");
}

function binaryExists(name: string): boolean {
  try {
    const cmd = process.platform === "win32" ? `where ${name}` : `which ${name}`;
    execSync(cmd, { encoding: "utf8", stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

// ── Claude Code integration ─────────────────────────────────────────────────

const claudeCode: Integration = {
  id: "claude-code",
  displayName: "Claude Code",
  scopes: HOOK_SCOPES,
  eventTypes: HOOK_EVENT_TYPES,
  hookMarker: FAILPROOFAI_HOOK_MARKER,

  getSettingsPath(scope: string, cwd?: string): string {
    const base = cwd ? resolve(cwd) : process.cwd();
    switch (scope) {
      case "user":
        return resolve(homedir(), ".claude", "settings.json");
      case "project":
        return resolve(base, ".claude", "settings.json");
      case "local":
        return resolve(base, ".claude", "settings.local.json");
      default:
        return resolve(homedir(), ".claude", "settings.json");
    }
  },

  readSettings(settingsPath: string): Record<string, unknown> {
    return readJsonFile(settingsPath);
  },

  writeSettings(settingsPath: string, settings: Record<string, unknown>): void {
    writeJsonFile(settingsPath, settings);
  },

  buildHookEntry(binaryPath: string, eventType: string): Record<string, unknown> {
    return {
      type: "command",
      command: `"${binaryPath}" --hook ${eventType}`,
      timeout: 60_000,
      [FAILPROOFAI_HOOK_MARKER]: true,
    };
  },

  isFailproofaiHook: isMarkedHook,

  writeHookEntries(settings: Record<string, unknown>, binaryPath: string): void {
    const s = settings as ClaudeSettings;
    if (!s.hooks) s.hooks = {};

    for (const eventType of HOOK_EVENT_TYPES) {
      const hookEntry = this.buildHookEntry(binaryPath, eventType);

      if (!s.hooks[eventType]) s.hooks[eventType] = [];
      const matchers: ClaudeHookMatcher[] = s.hooks[eventType];

      let found = false;
      for (const matcher of matchers) {
        if (!matcher.hooks) continue;
        const idx = matcher.hooks.findIndex((h) =>
          this.isFailproofaiHook(h as Record<string, unknown>),
        );
        if (idx >= 0) {
          matcher.hooks[idx] = hookEntry as any;
          found = true;
          break;
        }
      }

      if (!found) {
        matchers.push({ hooks: [hookEntry as any] });
      }
    }
  },

  removeHooksFromFile(settingsPath: string): number {
    const settings = this.readSettings(settingsPath) as ClaudeSettings;
    if (!settings.hooks) return 0;

    let removed = 0;
    for (const eventType of Object.keys(settings.hooks)) {
      const matchers = settings.hooks[eventType];
      if (!Array.isArray(matchers)) continue;

      for (let i = matchers.length - 1; i >= 0; i--) {
        const matcher = matchers[i];
        if (!matcher.hooks) continue;

        const before = matcher.hooks.length;
        matcher.hooks = matcher.hooks.filter(
          (h) => !this.isFailproofaiHook(h as Record<string, unknown>),
        );
        removed += before - matcher.hooks.length;

        if (matcher.hooks.length === 0) matchers.splice(i, 1);
      }

      if (matchers.length === 0) delete settings.hooks[eventType];
    }

    if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
    this.writeSettings(settingsPath, settings as Record<string, unknown>);
    return removed;
  },

  hooksInstalledInSettings(scope: string, cwd?: string): boolean {
    const settingsPath = this.getSettingsPath(scope, cwd);
    if (!existsSync(settingsPath)) return false;
    try {
      const settings = this.readSettings(settingsPath) as ClaudeSettings;
      if (!settings.hooks) return false;
      for (const matchers of Object.values(settings.hooks)) {
        if (!Array.isArray(matchers)) continue;
        for (const matcher of matchers) {
          if (!matcher.hooks) continue;
          if (matcher.hooks.some((h) => this.isFailproofaiHook(h as Record<string, unknown>))) {
            return true;
          }
        }
      }
    } catch {
      // Corrupted settings — treat as not installed
    }
    return false;
  },

  detectInstalled(): boolean {
    return binaryExists("claude");
  },
};

// ── Cursor integration ──────────────────────────────────────────────────────

const cursor: Integration = {
  id: "cursor",
  displayName: "Cursor",
  scopes: CURSOR_HOOK_SCOPES,
  eventTypes: CURSOR_HOOK_EVENT_TYPES as unknown as readonly string[],
  hookMarker: FAILPROOFAI_HOOK_MARKER,

  getSettingsPath(scope: string, cwd?: string): string {
    const base = cwd ? resolve(cwd) : process.cwd();
    switch (scope) {
      case "user":
        return resolve(homedir(), ".cursor", "hooks.json");
      case "project":
        return resolve(base, ".cursor", "hooks.json");
      default:
        return resolve(homedir(), ".cursor", "hooks.json");
    }
  },

  readSettings(settingsPath: string): Record<string, unknown> {
    if (!existsSync(settingsPath)) return { version: 1 };
    const raw = JSON.parse(readFileSync(settingsPath, "utf8")) as Record<string, unknown>;
    if (!raw.version) raw.version = 1;
    return raw;
  },

  writeSettings(settingsPath: string, settings: Record<string, unknown>): void {
    if (!settings.version) settings.version = 1;
    writeJsonFile(settingsPath, settings);
  },

  buildHookEntry(binaryPath: string, eventType: string): Record<string, unknown> {
    // eventType is the camelCase Cursor event name — map to PascalCase for --hook flag
    const pascalEvent = CURSOR_EVENT_MAP[eventType as CursorHookEventType] ?? eventType;
    // Use sh -lc to ensure node/bun is in PATH (especially for nvm/asdf users)
    return {
      command: `sh -lc '"${binaryPath}" --hook ${pascalEvent}'`,
      timeout: 60,
    };
  },

  isFailproofaiHook(hook: Record<string, unknown>): boolean {
    // Cursor format doesn't support the marker field — rely on command string detection
    const cmd = typeof hook.command === "string" ? hook.command : "";
    return cmd.includes("failproofai") && cmd.includes("--hook");
  },

  writeHookEntries(settings: Record<string, unknown>, binaryPath: string): void {
    const s = settings as CursorHooksFile;
    if (!s.hooks) s.hooks = {};

    for (const eventType of CURSOR_HOOK_EVENT_TYPES) {
      const hookEntry = this.buildHookEntry(binaryPath, eventType) as unknown as CursorHookEntry;

      if (!s.hooks[eventType]) s.hooks[eventType] = [];
      const entries: CursorHookEntry[] = s.hooks[eventType];

      // Find and replace existing failproofai hook, or append
      const idx = entries.findIndex((h) =>
        this.isFailproofaiHook(h as unknown as Record<string, unknown>),
      );
      if (idx >= 0) {
        entries[idx] = hookEntry;
      } else {
        entries.push(hookEntry);
      }
    }
  },

  removeHooksFromFile(settingsPath: string): number {
    const settings = this.readSettings(settingsPath) as CursorHooksFile;
    if (!settings.hooks) return 0;

    let removed = 0;
    for (const eventType of Object.keys(settings.hooks)) {
      const entries = settings.hooks[eventType];
      if (!Array.isArray(entries)) continue;

      const before = entries.length;
      settings.hooks[eventType] = entries.filter(
        (h) => !this.isFailproofaiHook(h as unknown as Record<string, unknown>),
      );
      removed += before - settings.hooks[eventType].length;

      if (settings.hooks[eventType].length === 0) delete settings.hooks[eventType];
    }

    if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
    this.writeSettings(settingsPath, settings as unknown as Record<string, unknown>);
    return removed;
  },

  hooksInstalledInSettings(scope: string, cwd?: string): boolean {
    const settingsPath = this.getSettingsPath(scope, cwd);
    if (!existsSync(settingsPath)) return false;
    try {
      const settings = this.readSettings(settingsPath) as CursorHooksFile;
      if (!settings.hooks) return false;
      for (const entries of Object.values(settings.hooks)) {
        if (!Array.isArray(entries)) continue;
        if (entries.some((h) => this.isFailproofaiHook(h as unknown as Record<string, unknown>))) {
          return true;
        }
      }
    } catch {
      // Corrupted config — treat as not installed
    }
    return false;
  },

  detectInstalled(): boolean {
    return binaryExists("cursor");
  },
};

// ── Registry ────────────────────────────────────────────────────────────────

export const INTEGRATIONS: Record<IntegrationType, Integration> = {
  "claude-code": claudeCode,
  "cursor": cursor,
};

export function getIntegration(id: IntegrationType): Integration {
  const integration = INTEGRATIONS[id];
  if (!integration) {
    throw new Error(`Unknown integration: ${id}`);
  }
  return integration;
}

export function listIntegrations(): Integration[] {
  return Object.values(INTEGRATIONS);
}

export function listIntegrationIds(): IntegrationType[] {
  return Object.keys(INTEGRATIONS) as IntegrationType[];
}

export function detectInstalledIntegrations(): Integration[] {
  return Object.values(INTEGRATIONS).filter((i) => i.detectInstalled());
}
