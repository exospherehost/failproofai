/**
 * Platform integration registry.
 *
 * Each integration describes how failproofai hooks are installed, detected,
 * and formatted for a specific AI agent CLI (Claude Code, Cursor, etc.).
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readlinkSync, symlinkSync, unlinkSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { homedir } from "node:os";
import {
  HOOK_EVENT_TYPES,
  HOOK_SCOPES,
  CURSOR_HOOK_EVENT_TYPES,
  CURSOR_HOOK_SCOPES,
  CURSOR_EVENT_MAP,
  GEMINI_HOOK_EVENT_TYPES,
  GEMINI_EVENT_MAP,
  COPILOT_HOOK_EVENT_TYPES,
  COPILOT_EVENT_MAP,
  CODEX_HOOK_EVENT_TYPES,
  CODEX_EVENT_MAP,
  FAILPROOFAI_HOOK_MARKER,
  type IntegrationType,
  type CursorHookEventType,
  type GeminiHookEventType,
  type CopilotHookEventType,
  type CodexHookEventType,
  type ClaudeSettings,
  type ClaudeHookMatcher,
  type CursorHooksFile,
  type CursorHookEntry,
  OPENCODE_HOOK_EVENT_TYPES,
  OPENCODE_EVENT_MAP,
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
  buildHookEntry(binaryPath: string, eventType: string, scope?: string): Record<string, unknown>;

  /** Check whether a hook entry belongs to failproofai. */
  isFailproofaiHook(hook: Record<string, unknown>): boolean;

  /**
   * Write hook entries into the settings object for all supported event types.
   * Mutates `settings` in place.
   */
  writeHookEntries(settings: Record<string, unknown>, binaryPath: string, scope?: string): void;

  /**
   * Remove failproofai hook entries from a settings file.
   * Returns the number of entries removed.
   */
  removeHooksFromFile(settingsPath: string): number;

  /** Check whether failproofai hooks exist in a given scope. */
  hooksInstalledInSettings(scope: string, cwd?: string): boolean;

  /** Detect whether the platform CLI binary is installed. */
  detectInstalled(): boolean;

  /** Detect if this payload belongs to this integration */
  detect(payload: Record<string, unknown>): boolean;

  /** Normalize payload fields (e.g. camelCase -> snake_case) */
  normalizePayload(payload: Record<string, unknown>): void;

  /** Map raw hook names to canonical PascalCase (PreToolUse, etc.) */
  getCanonicalEventName(payload: Record<string, unknown>, cliArg: string): string;

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

  buildHookEntry(binaryPath: string, eventType: string, scope?: string): Record<string, unknown> {
    const command = scope === "project"
      ? `npx -y failproofai --hook ${eventType}`
      : `"${binaryPath}" --hook ${eventType}`;
    return {
      type: "command",
      command: `"${process.execPath}" "${binaryPath}" --hook ${eventType} --integration claude-code --stdin`,
      timeout: 60_000,
      [FAILPROOFAI_HOOK_MARKER]: true,
    };
  },

  isFailproofaiHook: isMarkedHook,

  writeHookEntries(settings: Record<string, unknown>, binaryPath: string, scope?: string): void {
    const s = settings as ClaudeSettings;
    if (!s.hooks) s.hooks = {};

    for (const eventType of HOOK_EVENT_TYPES) {
      const hookEntry = this.buildHookEntry(binaryPath, eventType, scope);

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

  detect: () => true, // Fallback
  normalizePayload: () => {}, // Claude uses snake_case natively
  getCanonicalEventName: (_, cliArg) => cliArg,
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
    return {
      command: `"${process.execPath}" "${binaryPath}" --hook ${pascalEvent} --integration cursor`,
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

  detect(payload) {
    const hookName = (payload.hook_event_name as string) || (payload.hookEventName as string) || "";
    // Cursor uses workspace_roots or specific camelCase hook names
    return !!(
      Array.isArray(payload.workspace_roots) ||
      (payload.integration === "cursor") ||
      (hookName === "preToolUse") ||
      (hookName === "postToolUse") ||
      (hookName.startsWith("before") && hookName !== "BeforeTool") || // avoid Gemini collision
      (hookName.startsWith("after") && hookName !== "AfterTool" && hookName !== "AfterAgent") // avoid Gemini collision
    );
  },

  normalizePayload(payload) {
    if (!payload.cwd && Array.isArray(payload.workspace_roots) && payload.workspace_roots.length > 0) {
      payload.cwd = payload.workspace_roots[0] as string;
    }
  },

  getCanonicalEventName: (_, cliArg) => cliArg,
};

// ── Registry ────────────────────────────────────────────────────────────────

// ── Gemini CLI integration ──────────────────────────────────────────────────

const gemini: Integration = {
  id: "gemini",
  displayName: "Gemini CLI",
  scopes: ["user", "project"] as const,
  eventTypes: GEMINI_HOOK_EVENT_TYPES,
  hookMarker: FAILPROOFAI_HOOK_MARKER,

  getSettingsPath(scope: string, cwd?: string): string {
    const base = cwd ? resolve(cwd) : process.cwd();
    switch (scope) {
      case "user":
        return resolve(homedir(), ".gemini", "settings.json");
      case "project":
        return resolve(base, ".gemini", "settings.json");
      default:
        return resolve(homedir(), ".gemini", "settings.json");
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
      command: `"${process.execPath}" "${binaryPath}" --hook ${eventType} --integration gemini --stdin`,
      timeout: 10000,
      [FAILPROOFAI_HOOK_MARKER]: true,
    };
  },

  isFailproofaiHook: isMarkedHook,

  writeHookEntries(settings: Record<string, unknown>, binaryPath: string): void {
    const s = settings as ClaudeSettings; // Gemini uses same settings format as Claude
    if (!s.hooks) s.hooks = {};

    for (const eventType of GEMINI_HOOK_EVENT_TYPES) {
      const hookEntry = this.buildHookEntry(binaryPath, eventType);
      if (!s.hooks[eventType]) s.hooks[eventType] = [];
      const matchers: ClaudeHookMatcher[] = s.hooks[eventType];

      let found = false;
      for (const matcher of matchers) {
        if (!matcher.hooks) continue;
        const idx = matcher.hooks.findIndex((h) => this.isFailproofaiHook(h as Record<string, unknown>));
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
    for (const eventType of GEMINI_HOOK_EVENT_TYPES) {
      const matchers = settings.hooks[eventType];
      if (!Array.isArray(matchers)) continue;

      for (let i = matchers.length - 1; i >= 0; i--) {
        const matcher: ClaudeHookMatcher = matchers[i];
        if (!matcher.hooks) continue;
        const before = matcher.hooks.length;
        matcher.hooks = matcher.hooks.filter((h) => !this.isFailproofaiHook(h as Record<string, unknown>));
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
          if (matcher.hooks && matcher.hooks.some((h) => this.isFailproofaiHook(h as Record<string, unknown>))) {
            return true;
          }
        }
      }
    } catch {
      return false;
    }
    return false;
  },

  detectInstalled(): boolean {
    return binaryExists("gemini");
  },

  detect(payload) {
    const h = (payload.hook_event_name as string) || "";
    // Gemini uses very specific PascalCase event names that are unique
    return [
      "BeforeTool",
      "AfterTool",
      "BeforeAgent",
      "AfterAgent",
      "BeforeModel",
      "AfterModel",
      "BeforeToolSelection",
    ].includes(h);
  },

  normalizePayload: (payload) => {
    // Gemini uses hook_event_name, tool_name, tool_args
    if (!payload.tool_name && payload.toolName) payload.tool_name = payload.toolName;
    if (!payload.tool_input && payload.tool_args) payload.tool_input = payload.tool_args;
    if (!payload.tool_input && payload.toolArgs) payload.tool_input = payload.toolArgs;
    if (!payload.tool_output && payload.toolOutput) payload.tool_output = payload.toolOutput;
  },

  getCanonicalEventName(payload, cliArg) {
    const h = payload.hook_event_name as GeminiHookEventType;
    const mapped = GEMINI_EVENT_MAP[h];
    if (mapped) return mapped;
    const fromCli = GEMINI_EVENT_MAP[cliArg as GeminiHookEventType];
    return fromCli ?? cliArg;
  },
};

// ── GitHub Copilot integration ──────────────────────────────────────────────

/**
 * Returns the Copilot CLI home directory.
 *
 * Copilot CLI reads user-level settings from:
 *   ${COPILOT_HOME:-~/.copilot}/config.json
 */
function getCopilotHomeDir(): string {
  const envHome = process.env.COPILOT_HOME;
  if (envHome && envHome.trim().length > 0) return resolve(envHome);
  return resolve(homedir(), ".copilot");
}

/**
 * Appends a `env failproofai copilot-sync 2>/dev/null` line to ~/.bashrc
 * (and ~/.zshrc if it exists) so that whenever the user opens a new terminal
 * after a snap update, the revision symlink is automatically recreated before
 * they ever type `copilot`.
 *
 * Uses `env` instead of bare `failproofai` so the command bypasses bash's hash
 * table and does a fresh PATH lookup every shell startup — preventing stale
 * cached paths (e.g. after `nvm use` switches node versions or after
 * reinstalling to a different location).
 *
 * Safe to call multiple times — the marker comment prevents duplicate entries.
 * Upgrades existing entries that still use the old bare `failproofai` format.
 */
export function appendCopilotSyncToBashrc(): void {
  const MARKER  = "# failproofai copilot-sync";
  const OLD_CMD = "failproofai copilot-sync 2>/dev/null";
  const NEW_CMD = "env failproofai copilot-sync 2>/dev/null";
  const LINE    = `${MARKER}\n${NEW_CMD}\n`;
  const rcFiles = [
    resolve(homedir(), ".bashrc"),
    resolve(homedir(), ".zshrc"),
  ];
  for (const rc of rcFiles) {
    if (!existsSync(rc)) continue;
    try {
      let content = readFileSync(rc, "utf8");
      if (content.includes(MARKER)) {
        // Already present — upgrade bare command to env-prefixed if needed.
        // Match only lines where failproofai is NOT already preceded by "env "
        const upgraded = content.replace(
          /(^|\n)failproofai copilot-sync 2>\/dev\/null/g,
          "$1env failproofai copilot-sync 2>/dev/null",
        );
        if (upgraded !== content) {
          writeFileSync(rc, upgraded, "utf8");
        }
        continue;
      }
      writeFileSync(rc, content.endsWith("\n") ? content + LINE : content + "\n" + LINE, "utf8");
    } catch {
      // Best-effort — don't fail the install
    }
  }
}

/**
 * Removes the failproofai copilot-sync line from ~/.bashrc and ~/.zshrc.
 * Called by the preuninstall script so no stale entries remain after removal.
 */
export function removeCopilotSyncFromRcFiles(): void {
  const MARKER = "# failproofai copilot-sync";
  const rcFiles = [
    resolve(homedir(), ".bashrc"),
    resolve(homedir(), ".zshrc"),
  ];
  for (const rc of rcFiles) {
    if (!existsSync(rc)) continue;
    try {
      const content = readFileSync(rc, "utf8");
      if (!content.includes(MARKER)) continue;
      // Remove the marker comment line and the command line that follows it
      const updated = content.replace(/# failproofai copilot-sync\n[^\n]+\n?/g, "");
      writeFileSync(rc, updated, "utf8");
    } catch {
      // Best-effort — don't block uninstall
    }
  }
}

/**
 * After writing hooks into common/, create a symlink from the current snap
 * revision's hooks directory → common/hooks/ so Copilot can find it.
 *
 * Also synchronizes any project-level hooks found in .github/hooks/failproofai.json
 * into the global ~/.copilot/config.json so they are active for the current session.
 */
export function ensureCopilotRevisionSymlink(): void {
  // 1. Handle Snap revision symlink
  const snapBase = resolve(homedir(), "snap", "copilot-cli");
  const currentLink = resolve(snapBase, "current");
  if (existsSync(currentLink)) {
    let rev: string;
    try {
      rev = readlinkSync(currentLink);
      const commonHooks = resolve(snapBase, "common", ".config", "github-copilot", "hooks");
      const revHooks    = resolve(snapBase, rev,      ".config", "github-copilot", "hooks");

      if (existsSync(commonHooks) && !existsSync(revHooks)) {
        mkdirSync(resolve(snapBase, rev, ".config", "github-copilot"), { recursive: true });
        symlinkSync(commonHooks, revHooks);
      }
    } catch {
      // Silenced
    }
  }

  // 2. Synchronize project-level hooks
  synchronizeCopilotProjectHooks();
}

/**
 * Searches for .github/hooks/failproofai.json in current/parent dirs
 * and merges its hooks into the user's global ~/.copilot/config.json.
 */
export function synchronizeCopilotProjectHooks(): void {
  const globalSettingsPath = resolve(getCopilotHomeDir(), "config.json");
  if (!existsSync(globalSettingsPath)) return;

  try {
    const globalSettings = readJsonFile(globalSettingsPath);
    if (!globalSettings.hooks) globalSettings.hooks = {};
    const gHooks = globalSettings.hooks as Record<string, any[]>;

    // Remove existing project hooks (marked with --scope project or found via path check)
    for (const event of Object.keys(gHooks)) {
      gHooks[event] = gHooks[event].filter((h: any) =>
        !h.bash?.includes("--scope project") &&
        !h.bash?.includes("npx -y failproofai")
      );
    }

    // Search for project settings
    let currentDir = process.cwd();
    let projectSettingsPath: string | null = null;
    const maxDepth = 10;
    for (let i = 0; i < maxDepth; i++) {
      const candidate = resolve(currentDir, ".github", "hooks", "failproofai.json");
      if (existsSync(candidate)) {
        projectSettingsPath = candidate;
        break;
      }
      const parent = resolve(currentDir, "..");
      if (parent === currentDir) break;
      currentDir = parent;
    }

    if (projectSettingsPath) {
      const pSettings = readJsonFile(projectSettingsPath);
      if (pSettings.hooks) {
        const pHooks = pSettings.hooks as Record<string, any[]>;
        for (const [event, entries] of Object.entries(pHooks)) {
          if (!gHooks[event]) gHooks[event] = [];
          for (const entry of entries) {
            // Avoid duplicate commands
            if (!gHooks[event].some((h: any) => h.bash === entry.bash)) {
              gHooks[event].push(entry);
            }
          }
        }
      }
    }

    writeJsonFile(globalSettingsPath, globalSettings);
  } catch {
    // Silenced — never break shell startup
  }
}


const copilot: Integration = {
  id: "copilot",
  displayName: "GitHub Copilot",
  scopes: CURSOR_HOOK_SCOPES, // Copilot uses user/project scopes
  eventTypes: COPILOT_HOOK_EVENT_TYPES,
  hookMarker: FAILPROOFAI_HOOK_MARKER,

  getSettingsPath(scope: string, cwd?: string): string {
    const base = cwd ? resolve(cwd) : process.cwd();
    switch (scope) {
      case "user":
        return resolve(getCopilotHomeDir(), "config.json");
      case "project":
        return resolve(base, ".github", "hooks", "failproofai.json");
      default:
        return resolve(base, ".github", "hooks", "failproofai.json");
    }
  },

  readSettings(settingsPath: string): Record<string, unknown> {
    const raw = readJsonFile(settingsPath);
    if (!raw.version) raw.version = 1;
    return raw;
  },

  writeSettings(settingsPath: string, settings: Record<string, unknown>): void {
    writeJsonFile(settingsPath, settings);
  },

  buildHookEntry(binaryPath: string, eventType: string, scope?: string): Record<string, unknown> {
    const pascalEvent = COPILOT_EVENT_MAP[eventType as CopilotHookEventType] ?? eventType;
    // Project scope uses npx so the hooks file contains no machine-specific paths
    // and can be safely committed to git.
    const bash = scope === "project"
      ? `npx -y failproofai --hook ${pascalEvent} --integration copilot`
      : `"${process.execPath}" "${binaryPath}" --hook ${pascalEvent} --integration copilot`;
    return {
      type: "command",
      bash,
      timeoutSec: 60,
    };
  },

  isFailproofaiHook(hook: Record<string, unknown>): boolean {
    const cmd =
      typeof hook.bash === "string"
        ? hook.bash
        : typeof hook.command === "string"
          ? hook.command
          : "";
    return cmd.includes("failproofai") && cmd.includes("--hook");
  },

  writeHookEntries(settings: Record<string, unknown>, binaryPath: string, scope?: string): void {
    if (!settings.version) settings.version = 1;
    if (!settings.hooks) settings.hooks = {};
    const hooks = settings.hooks as Record<string, any[]>;

    for (const eventType of COPILOT_HOOK_EVENT_TYPES) {
      const entry = this.buildHookEntry(binaryPath, eventType, scope);
      if (!hooks[eventType]) hooks[eventType] = [];
      const idx = hooks[eventType].findIndex((h) => this.isFailproofaiHook(h));
      if (idx >= 0) {
        hooks[eventType][idx] = entry;
      } else {
        hooks[eventType].push(entry);
      }
    }
  },

  removeHooksFromFile(settingsPath: string): number {
    const settings = this.readSettings(settingsPath);
    if (!settings.hooks) return 0;
    const hooks = settings.hooks as Record<string, any[]>;

    let removed = 0;
    for (const eventType of Object.keys(hooks)) {
      const entries = hooks[eventType];
      if (!Array.isArray(entries)) continue;
      const before = entries.length;
      hooks[eventType] = entries.filter((h) => !this.isFailproofaiHook(h));
      removed += before - hooks[eventType].length;
      if (hooks[eventType].length === 0) delete hooks[eventType];
    }
    if (Object.keys(hooks).length === 0) delete settings.hooks;
    this.writeSettings(settingsPath, settings);
    return removed;
  },

  hooksInstalledInSettings(scope: string, cwd?: string): boolean {
    const settingsPath = this.getSettingsPath(scope, cwd);
    if (!existsSync(settingsPath)) return false;
    try {
      const settings = this.readSettings(settingsPath);
      if (!settings.hooks) return false;
      for (const entries of Object.values(settings.hooks as Record<string, any[]>)) {
        if (entries.some((h) => this.isFailproofaiHook(h))) return true;
      }
    } catch {
      return false;
    }
    return false;
  },

  detectInstalled(): boolean {
    return binaryExists("gh"); // Copilot usually runs via gh extension
  },

  detect(payload) {
    // Copilot payloads typically use camelCase and are unique
    // We must be careful not to match Claude Code which uses PascalCase (PreToolUse) or SnakeCase (session_id).
    const hookName = (payload.hook_event_name as string) || (payload.hookEventName as string) || "";
    return (
      "sessionId" in payload ||
      "toolName" in payload ||
      "hookEventName" in payload ||
      // Strictly avoid PascalCase events from Claude
      (COPILOT_HOOK_EVENT_TYPES.includes(hookName as any) && !/^[A-Z]/.test(hookName))
    );
  },

  normalizePayload(payload) {
    // Copilot uses camelCase; normalize to internal snake_case
    if (payload.sessionId && !payload.session_id) payload.session_id = payload.sessionId;
    if (payload.toolName && !payload.tool_name) payload.tool_name = payload.toolName;
    if (payload.toolInput && !payload.tool_input) payload.tool_input = payload.toolInput;
    if (payload.toolArgs && !payload.tool_input) {
      const raw = payload.toolArgs;
      if (typeof raw === "string") {
        try { payload.tool_input = JSON.parse(raw); } catch { payload.tool_input = raw; }
      } else {
        payload.tool_input = raw;
      }
    }
    if (payload.hookEventName && !payload.hook_event_name) payload.hook_event_name = payload.hookEventName;
  },

  getCanonicalEventName(payload, cliArg) {
    const raw = (payload.hook_event_name || payload.hookEventName) as string | undefined;
    const candidates = [
      raw,
      raw ? raw.charAt(0).toLowerCase() + raw.slice(1) : undefined,
      cliArg,
      cliArg ? cliArg.charAt(0).toLowerCase() + cliArg.slice(1) : undefined,
    ].filter((s): s is string => !!s);

    for (const c of candidates) {
      const mapped = COPILOT_EVENT_MAP[c as CopilotHookEventType];
      if (mapped) return mapped;
    }

    return cliArg;
  },

  postInstall(): void {
    // On snap installs: create the revision symlink (rev/.config/.../hooks/ → common/hooks/)
    // so Copilot's isolated revision HOME can find the hooks written into common/.
    // Also appends the copilot-sync one-liner to ~/.bashrc so future snap updates
    // auto-create the symlink whenever a new terminal is opened.
    ensureCopilotRevisionSymlink();
    appendCopilotSyncToBashrc();
  },
};

// ── OpenAI Codex integration ────────────────────────────────────────────────

const codex: Integration = {
  id: "codex",
  displayName: "OpenAI Codex",
  scopes: CURSOR_HOOK_SCOPES, // Codex supports user/project hooks config
  eventTypes: CODEX_HOOK_EVENT_TYPES,
  hookMarker: FAILPROOFAI_HOOK_MARKER,

  getSettingsPath(scope: string, cwd?: string): string {
    const base = cwd ? resolve(cwd) : process.cwd();
    switch (scope) {
      case "user":
        return resolve(homedir(), ".codex", "hooks.json");
      case "project":
        return resolve(base, ".codex", "hooks.json");
      default:
        return resolve(base, ".codex", "hooks.json");
    }
  },

  readSettings(settingsPath: string): Record<string, unknown> {
    const raw = readJsonFile(settingsPath);
    if (!raw.version) raw.version = 1;
    return raw;
  },

  writeSettings(settingsPath: string, settings: Record<string, unknown>): void {
    writeJsonFile(settingsPath, settings);
  },

  buildHookEntry(binaryPath: string, eventType: string): Record<string, unknown> {
    const pascalEvent = CODEX_EVENT_MAP[eventType as CodexHookEventType] ?? eventType;
    return {
      type: "command",
      command: `"${process.execPath}" "${binaryPath}" --hook ${pascalEvent} --integration codex`,
      timeout: 60,
      [FAILPROOFAI_HOOK_MARKER]: true,
    };
  },

  isFailproofaiHook: isMarkedHook,

  writeHookEntries(settings: Record<string, unknown>, binaryPath: string): void {
    if (!settings.version) settings.version = 1;
    if (!settings.hooks) settings.hooks = {};
    const hooks = settings.hooks as Record<string, any[]>;

    for (const eventType of CODEX_HOOK_EVENT_TYPES) {
      const hookEntry = this.buildHookEntry(binaryPath, eventType);
      // Codex uses PascalCase event keys in hooks.json
      const pascalKey = CODEX_EVENT_MAP[eventType as CodexHookEventType] ?? eventType;
      if (!hooks[pascalKey]) hooks[pascalKey] = [];
      const matchers: ClaudeHookMatcher[] = hooks[pascalKey];

      let found = false;
      for (const matcher of matchers) {
        if (!matcher.hooks) continue;
        const idx = matcher.hooks.findIndex((h) => this.isFailproofaiHook(h as Record<string, unknown>));
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
    const settings = this.readSettings(settingsPath);
    if (!settings.hooks) return 0;
    const hooks = settings.hooks as Record<string, any[]>;

    let removed = 0;
    for (const key of Object.keys(hooks)) {
      const matchers = hooks[key];
      if (!Array.isArray(matchers)) continue;
      for (let i = matchers.length - 1; i >= 0; i--) {
        const matcher: ClaudeHookMatcher = matchers[i];
        if (!matcher.hooks) continue;
        const before = matcher.hooks.length;
        matcher.hooks = matcher.hooks.filter((h) => !this.isFailproofaiHook(h as Record<string, unknown>));
        removed += before - matcher.hooks.length;
        if (matcher.hooks.length === 0) matchers.splice(i, 1);
      }
      if (matchers.length === 0) delete (settings.hooks as any)[key];
    }
    if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
    this.writeSettings(settingsPath, settings);
    return removed;
  },

  hooksInstalledInSettings(scope: string, cwd?: string): boolean {
    const settingsPath = this.getSettingsPath(scope, cwd);
    if (!existsSync(settingsPath)) return false;
    try {
      const settings = this.readSettings(settingsPath);
      if (!settings.hooks) return false;
      for (const matchers of Object.values(settings.hooks as Record<string, any[]>)) {
        if (!Array.isArray(matchers)) continue;
        for (const matcher of matchers) {
          if (matcher.hooks && matcher.hooks.some((h: Record<string, unknown>) => this.isFailproofaiHook(h))) return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  },

  detectInstalled(): boolean {
    return binaryExists("codex");
  },

  detect(payload) {
    const hook = (payload.hook_event_name as string) || "";
    return (
      CODEX_HOOK_EVENT_TYPES.includes(hook as CodexHookEventType) ||
      payload.integration === "codex"
    );
  },

  normalizePayload: () => {
    // Codex hook payloads already use snake_case fields.
  },

  getCanonicalEventName(payload, cliArg) {
    const h = payload.hook_event_name as CodexHookEventType;
    const mapped = CODEX_EVENT_MAP[h];
    if (mapped) return mapped;
    const fromCli = CODEX_EVENT_MAP[cliArg as CodexHookEventType];
    return fromCli ?? cliArg;
  },
};

// ── opencode integration ────────────────────────────────────────────────────

const opencode: Integration = {
  id: "opencode",
  displayName: "OpenCode",
  scopes: ["user", "project"],
  eventTypes: OPENCODE_HOOK_EVENT_TYPES,
  hookMarker: "// failproofai-hook",

  getSettingsPath(scope: string, cwd?: string): string {
    const base = cwd ? resolve(cwd) : process.cwd();
    let p: string;
    switch (scope) {
      case "user":
        p = resolve(homedir(), ".config", "opencode", "plugins", "failproofai.ts");
        break;
      case "project":
        p = resolve(base, ".opencode", "plugins", "failproofai.ts");
        break;
      default:
        p = resolve(homedir(), ".config", "opencode", "plugins", "failproofai.ts");
        break;
    }
    (this as any)._lastPath = p; // Track path for writeHookEntries
    return p;
  },

  readSettings(): Record<string, unknown> {
    return { version: 1 };
  },

  writeSettings(): void {
    // Persistent write is handled in writeHookEntries for opencode
  },

  buildHookEntry(): Record<string, unknown> {
    return {};
  },

  isFailproofaiHook(): boolean {
    return false;
  },

  writeHookEntries(_settings: Record<string, unknown>, binaryPath: string): void {
    const path = (this as any)._lastPath || this.getSettingsPath("user");
    const template = `/**
 * FailproofAI Integration for OpenCode
 * Generated by failproofai
 */
import { spawnSync } from "node:child_process";

export const FailproofAIPlugin = (ctx: any) => {
  let currentSessionId: string | undefined;
  const reportedSessions = new Set<string>();

  const callcli = (event: string, args: any) => {
    const payloadWithCwd = {
      ...args,
      integration: "opencode",
      cwd: ctx.directory,
      session_id: args.session_id || currentSessionId,
    };

    const cmd = '"${binaryPath}" --hook ' + event + ' --integration opencode --stdin';

    const res = spawnSync(cmd, {
      input: JSON.stringify(payloadWithCwd),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    if (res.status !== 0) {
      throw new Error(res.stderr || res.stdout || "Action blocked by FailproofAI policy");
    }

    if (res.stdout) process.stdout.write(res.stdout);
    if (res.stderr) process.stderr.write(res.stderr);
  };

  const syncSession = (id: string) => {
    if (!id || reportedSessions.has(id)) return;
    reportedSessions.add(id);
    currentSessionId = id;
    try { callcli("SessionStart", { session_id: id }); } catch {}
  };

  return {
    "chat.message": async (input: any, output: any) => {
      try {
        if (input?.sessionID) syncSession(input.sessionID);
        const parts: any[] = output?.parts ?? [];
        const text = parts.find((p: any) => p.type === "text")?.text;
        if (text) callcli("UserPromptSubmit", { tool_input: text });
      } catch {}
    },
    "tool.execute.before": async (input: any, output: any) => {
      callcli("PreToolUse", { tool_name: input.tool, tool_input: output.args });
    },
    "tool.execute.after": async (input: any, output: any) => {
      try {
        callcli("PostToolUse", { tool_name: input.tool, tool_input: output.args, tool_output: output.result });
      } catch {}
    },
    "session.created": async (input: any) => {
      syncSession(input.sessionID);
    },
    "session.idle": async (input: any) => {
      try { callcli("SessionEnd", { session_id: input.sessionID }); } catch {}
    },
  };
};

export default FailproofAIPlugin;
`;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, template, "utf8");
  },

  removeHooksFromFile(settingsPath: string): number {
    if (existsSync(settingsPath)) {
      try {
        const content = readFileSync(settingsPath, "utf8");
        if (content.includes("failproofai")) {
          unlinkSync(settingsPath);
          // If the directory is empty after removal, clean it up too
          const dir = dirname(settingsPath);
          try {
            if (dir.includes(".opencode/plugins")) {
              rmSync(dir, { recursive: true, force: true });
            }
          } catch {}
          return OPENCODE_HOOK_EVENT_TYPES.length;
        }
      } catch {}
    }
    return 0;
  },

  hooksInstalledInSettings(scope: string, cwd?: string): boolean {
    return existsSync(this.getSettingsPath(scope, cwd));
  },

  detectInstalled(): boolean {
    return binaryExists("opencode");
  },

  detect(payload) {
    return !!(payload.integration === "opencode" || payload.slug || (typeof payload.session_id === "string" && payload.session_id.startsWith("ses_")));
  },

  normalizePayload(payload) {
    if (payload.data && typeof payload.data === "object") {
      const data = payload.data as any;
      if (data.properties) {
        if (data.properties.sessionID && !payload.session_id) payload.session_id = data.properties.sessionID;
      }
    }
    // Map custom opencode plugin properties
    if (payload.tool_name) payload.toolName = payload.tool_name;
    if (payload.tool_input) payload.toolInput = payload.tool_input;
    if (payload.tool_output) payload.toolOutput = payload.tool_output;
    if (payload.session_id && !payload.sessionId) payload.sessionId = payload.session_id;
  },

  getCanonicalEventName(payload, cliArg) {
    const raw = (payload.hook_event_name as string) || ((payload.data as any)?.type as string) || cliArg;
    return OPENCODE_EVENT_MAP[raw] ?? raw;
  },
};

// ── Registry ────────────────────────────────────────────────────────────────

export const INTEGRATIONS: Record<IntegrationType, Integration> = {
  "claude-code": claudeCode,
  cursor,
  gemini,
  copilot,
  codex,
  opencode,
};

export function getIntegration(id: IntegrationType): Integration {
  const integ = INTEGRATIONS[id];
  if (!integ) {
    throw new Error(`Unsupported integration: ${id}`);
  }
  return integ;
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
