/**
 * Per-CLI hook integration registry.
 *
 * An `Integration` describes how failproofai hooks are installed, detected, and
 * read for a specific agent CLI (Claude Code, OpenAI Codex). The runtime hot
 * path (`handler.ts`, `policy-evaluator.ts`, `BUILTIN_POLICIES`, `policy-helpers`)
 * is agent-agnostic — only install/uninstall plumbing varies.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import {
  HOOK_EVENT_TYPES,
  HOOK_SCOPES,
  CODEX_HOOK_EVENT_TYPES,
  CODEX_HOOK_SCOPES,
  CODEX_EVENT_MAP,
  COPILOT_HOOK_EVENT_TYPES,
  COPILOT_HOOK_SCOPES,
  CURSOR_HOOK_EVENT_TYPES,
  CURSOR_HOOK_SCOPES,
  PI_HOOK_EVENT_TYPES,
  PI_HOOK_SCOPES,
  FAILPROOFAI_HOOK_MARKER,
  INTEGRATION_TYPES,
  type IntegrationType,
  type HookScope,
  type ClaudeSettings,
  type ClaudeHookMatcher,
  type ClaudeHookEntry,
  type CodexHookEventType,
} from "./types";

// ── Generic helpers ─────────────────────────────────────────────────────────

function readJsonFile(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

function writeJsonFile(path: string, data: Record<string, unknown>): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function isMarkedHook(hook: Record<string, unknown>): boolean {
  if (hook[FAILPROOFAI_HOOK_MARKER] === true) return true;
  // Fallback for legacy installs predating the marker
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

// ── Integration interface ───────────────────────────────────────────────────

export interface Integration {
  id: IntegrationType;
  displayName: string;
  /** Settings scopes this integration supports (e.g. claude: user/project/local; codex: user/project). */
  scopes: readonly HookScope[];
  /** Hook events this integration fires (Claude: PascalCase, Codex: snake_case stored as Pascal in settings). */
  eventTypes: readonly string[];

  /** Resolve the per-scope settings/hooks file path. */
  getSettingsPath(scope: HookScope, cwd?: string): string;

  /** Read the raw settings/hooks file (returns {} when missing). */
  readSettings(settingsPath: string): Record<string, unknown>;

  /** Write the settings/hooks file. */
  writeSettings(settingsPath: string, settings: Record<string, unknown>): void;

  /** Build a single hook entry for a given event. */
  buildHookEntry(binaryPath: string, eventType: string, scope?: HookScope): Record<string, unknown>;

  /** Whether a hook entry is owned by failproofai. */
  isFailproofaiHook(hook: Record<string, unknown>): boolean;

  /** Mutate `settings` in place, registering failproofai across all event types. Idempotent. */
  writeHookEntries(settings: Record<string, unknown>, binaryPath: string, scope?: HookScope): void;

  /** Remove all failproofai hook entries from a settings file. Returns the number removed. */
  removeHooksFromFile(settingsPath: string): number;

  /** Whether failproofai hooks are present in a given scope. */
  hooksInstalledInSettings(scope: HookScope, cwd?: string): boolean;

  /** Whether the agent CLI binary is installed (probes PATH). */
  detectInstalled(): boolean;
}

// ── Claude Code integration ─────────────────────────────────────────────────

export const claudeCode: Integration = {
  id: "claude",
  displayName: "Claude Code",
  scopes: HOOK_SCOPES,
  eventTypes: HOOK_EVENT_TYPES,

  getSettingsPath(scope, cwd) {
    const base = cwd ? resolve(cwd) : process.cwd();
    switch (scope) {
      case "user":
        return resolve(homedir(), ".claude", "settings.json");
      case "project":
        return resolve(base, ".claude", "settings.json");
      case "local":
        return resolve(base, ".claude", "settings.local.json");
    }
  },

  readSettings(settingsPath) {
    return readJsonFile(settingsPath);
  },

  writeSettings(settingsPath, settings) {
    writeJsonFile(settingsPath, settings);
  },

  buildHookEntry(binaryPath, eventType, scope) {
    // No --cli flag on the Claude command line: the handler defaults to
    // claude when --cli is omitted, preserving back-compat with hooks
    // installed before multi-CLI support was added.
    const command =
      scope === "project"
        ? `npx -y failproofai --hook ${eventType}`
        : `"${binaryPath}" --hook ${eventType}`;
    return {
      type: "command",
      command,
      timeout: 60_000,
      [FAILPROOFAI_HOOK_MARKER]: true,
    };
  },

  isFailproofaiHook: isMarkedHook,

  writeHookEntries(settings, binaryPath, scope) {
    const s = settings as ClaudeSettings;
    if (!s.hooks) s.hooks = {};

    for (const eventType of HOOK_EVENT_TYPES) {
      const hookEntry = this.buildHookEntry(binaryPath, eventType, scope) as unknown as ClaudeHookEntry;
      if (!s.hooks[eventType]) s.hooks[eventType] = [];
      const matchers: ClaudeHookMatcher[] = s.hooks[eventType];

      let found = false;
      for (const matcher of matchers) {
        if (!matcher.hooks) continue;
        const idx = matcher.hooks.findIndex((h) => isMarkedHook(h as Record<string, unknown>));
        if (idx >= 0) {
          matcher.hooks[idx] = hookEntry;
          found = true;
          break;
        }
      }
      if (!found) matchers.push({ hooks: [hookEntry] });
    }
  },

  removeHooksFromFile(settingsPath) {
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
        matcher.hooks = matcher.hooks.filter((h) => !isMarkedHook(h as Record<string, unknown>));
        removed += before - matcher.hooks.length;
        if (matcher.hooks.length === 0) matchers.splice(i, 1);
      }
      if (matchers.length === 0) delete settings.hooks[eventType];
    }
    if (Object.keys(settings.hooks).length === 0) delete settings.hooks;

    this.writeSettings(settingsPath, settings as Record<string, unknown>);
    return removed;
  },

  hooksInstalledInSettings(scope, cwd) {
    const settingsPath = this.getSettingsPath(scope, cwd);
    if (!existsSync(settingsPath)) return false;
    try {
      const settings = this.readSettings(settingsPath) as ClaudeSettings;
      if (!settings.hooks) return false;
      for (const matchers of Object.values(settings.hooks)) {
        if (!Array.isArray(matchers)) continue;
        for (const matcher of matchers) {
          if (!matcher.hooks) continue;
          if (matcher.hooks.some((h) => isMarkedHook(h as Record<string, unknown>))) return true;
        }
      }
    } catch {
      // Corrupt settings — treat as not installed
    }
    return false;
  },

  detectInstalled() {
    return binaryExists("claude") || binaryExists("claude-code");
  },
};

// ── OpenAI Codex integration ────────────────────────────────────────────────
//
// Codex's hook protocol is Claude-compatible by design (see the parity matrix
// in plans/great-in-failproofai-i-vectorized-treasure.md). The only material
// differences are:
//   • Settings paths: ~/.codex/hooks.json (user) and <cwd>/.codex/hooks.json (project)
//   • Stdin event names arrive snake_case (pre_tool_use); we canonicalize to PascalCase before policy lookup
//   • No "local" scope
//   • Settings file carries a top-level "version": 1 marker

interface CodexSettingsFile {
  version?: number;
  hooks?: Record<string, ClaudeHookMatcher[]>;
  [key: string]: unknown;
}

export const codex: Integration = {
  id: "codex",
  displayName: "OpenAI Codex",
  scopes: CODEX_HOOK_SCOPES,
  eventTypes: CODEX_HOOK_EVENT_TYPES,

  getSettingsPath(scope, cwd) {
    const base = cwd ? resolve(cwd) : process.cwd();
    switch (scope) {
      case "user":
        return resolve(homedir(), ".codex", "hooks.json");
      case "project":
        return resolve(base, ".codex", "hooks.json");
      case "local":
        // Codex has no "local" scope; fall back to project so callers don't crash.
        // The CLI rejects --cli codex --scope local before reaching here.
        return resolve(base, ".codex", "hooks.json");
    }
  },

  readSettings(settingsPath) {
    const raw = readJsonFile(settingsPath);
    if (raw.version === undefined) raw.version = 1;
    return raw;
  },

  writeSettings(settingsPath, settings) {
    writeJsonFile(settingsPath, settings);
  },

  buildHookEntry(binaryPath, eventType, scope) {
    // `eventType` here is the snake_case Codex event name; Codex stores under
    // PascalCase keys but invokes the command with the snake_case form, which
    // we canonicalize on the way into policy-evaluator.
    const command =
      scope === "project"
        ? `npx -y failproofai --hook ${eventType} --cli codex`
        : `"${binaryPath}" --hook ${eventType} --cli codex`;
    return {
      type: "command",
      command,
      timeout: 60_000,
      [FAILPROOFAI_HOOK_MARKER]: true,
    };
  },

  isFailproofaiHook: isMarkedHook,

  writeHookEntries(settings, binaryPath, scope) {
    const s = settings as CodexSettingsFile;
    if (s.version === undefined) s.version = 1;
    if (!s.hooks) s.hooks = {};

    for (const eventType of CODEX_HOOK_EVENT_TYPES) {
      const pascalKey = CODEX_EVENT_MAP[eventType as CodexHookEventType];
      const hookEntry = this.buildHookEntry(binaryPath, eventType, scope) as unknown as ClaudeHookEntry;
      if (!s.hooks[pascalKey]) s.hooks[pascalKey] = [];
      const matchers: ClaudeHookMatcher[] = s.hooks[pascalKey];

      let found = false;
      for (const matcher of matchers) {
        if (!matcher.hooks) continue;
        const idx = matcher.hooks.findIndex((h) => isMarkedHook(h as Record<string, unknown>));
        if (idx >= 0) {
          matcher.hooks[idx] = hookEntry;
          found = true;
          break;
        }
      }
      if (!found) matchers.push({ hooks: [hookEntry] });
    }
  },

  removeHooksFromFile(settingsPath) {
    const settings = this.readSettings(settingsPath) as CodexSettingsFile;
    if (!settings.hooks) return 0;

    let removed = 0;
    for (const eventType of Object.keys(settings.hooks)) {
      const matchers = settings.hooks[eventType];
      if (!Array.isArray(matchers)) continue;
      for (let i = matchers.length - 1; i >= 0; i--) {
        const matcher = matchers[i];
        if (!matcher.hooks) continue;
        const before = matcher.hooks.length;
        matcher.hooks = matcher.hooks.filter((h) => !isMarkedHook(h as Record<string, unknown>));
        removed += before - matcher.hooks.length;
        if (matcher.hooks.length === 0) matchers.splice(i, 1);
      }
      if (matchers.length === 0) delete settings.hooks[eventType];
    }
    if (Object.keys(settings.hooks).length === 0) delete settings.hooks;

    this.writeSettings(settingsPath, settings as Record<string, unknown>);
    return removed;
  },

  hooksInstalledInSettings(scope, cwd) {
    const settingsPath = this.getSettingsPath(scope, cwd);
    if (!existsSync(settingsPath)) return false;
    try {
      const settings = this.readSettings(settingsPath) as CodexSettingsFile;
      if (!settings.hooks) return false;
      for (const matchers of Object.values(settings.hooks)) {
        if (!Array.isArray(matchers)) continue;
        for (const matcher of matchers) {
          if (!matcher.hooks) continue;
          if (matcher.hooks.some((h) => isMarkedHook(h as Record<string, unknown>))) return true;
        }
      }
    } catch {
      // Corrupt settings — treat as not installed
    }
    return false;
  },

  detectInstalled() {
    return binaryExists("codex");
  },
};

// ── GitHub Copilot CLI integration ──────────────────────────────────────────
//
// Copilot CLI accepts two hook payload formats: a camelCase native form and a
// "VS Code compatible" PascalCase form. We install with PascalCase keys, which
// gets us:
//   • PascalCase `hook_event_name` on stdin (matches Claude — no canonicalization)
//   • snake_case fields like `tool_name`/`tool_input` (matches Claude payload parser)
//   • `hookSpecificOutput.permissionDecision` honored on stdout (matches Claude
//     output shape — policy-evaluator works unchanged)
//
// Hook entries differ from Claude/Codex: each entry uses OS-keyed `bash` and
// `powershell` command fields and a `timeoutSec` (seconds) instead of Claude's
// single `command` field with `timeout` (milliseconds). Top-level wrapper is
// `{ "version": 1, "hooks": {...} }`, mirroring Codex.

interface CopilotHookEntry {
  type: "command";
  bash: string;
  powershell: string;
  timeoutSec: number;
  [FAILPROOFAI_HOOK_MARKER]: true;
}

interface CopilotSettingsFile {
  version?: number;
  hooks?: Record<string, ClaudeHookMatcher[]>;
  [key: string]: unknown;
}

function isMarkedCopilotHook(hook: Record<string, unknown>): boolean {
  if (hook[FAILPROOFAI_HOOK_MARKER] === true) return true;
  // Fallback for legacy installs predating the marker — Copilot entries store
  // commands under `bash`/`powershell` rather than `command`, so check both.
  const bash = typeof hook.bash === "string" ? hook.bash : "";
  const ps = typeof hook.powershell === "string" ? hook.powershell : "";
  for (const cmd of [bash, ps]) {
    if (cmd.includes("failproofai") && cmd.includes("--hook")) return true;
  }
  return false;
}

export const copilot: Integration = {
  id: "copilot",
  displayName: "GitHub Copilot",
  scopes: COPILOT_HOOK_SCOPES,
  eventTypes: COPILOT_HOOK_EVENT_TYPES,

  getSettingsPath(scope, cwd) {
    const base = cwd ? resolve(cwd) : process.cwd();
    switch (scope) {
      case "user":
        return resolve(homedir(), ".copilot", "hooks", "failproofai.json");
      case "project":
        return resolve(base, ".github", "hooks", "failproofai.json");
      case "local":
        // Copilot has no "local" scope; CLI rejects --cli copilot --scope local
        // before reaching here, but fall back to project so callers don't crash.
        return resolve(base, ".github", "hooks", "failproofai.json");
    }
  },

  readSettings(settingsPath) {
    const raw = readJsonFile(settingsPath);
    if (raw.version === undefined) raw.version = 1;
    return raw;
  },

  writeSettings(settingsPath, settings) {
    writeJsonFile(settingsPath, settings);
  },

  buildHookEntry(binaryPath, eventType, scope) {
    const cmd =
      scope === "project"
        ? `npx -y failproofai --hook ${eventType} --cli copilot`
        : `"${binaryPath}" --hook ${eventType} --cli copilot`;
    return {
      type: "command",
      bash: cmd,
      powershell: cmd,
      timeoutSec: 60,
      [FAILPROOFAI_HOOK_MARKER]: true,
    };
  },

  isFailproofaiHook: isMarkedCopilotHook,

  writeHookEntries(settings, binaryPath, scope) {
    const s = settings as CopilotSettingsFile;
    if (s.version === undefined) s.version = 1;
    if (!s.hooks) s.hooks = {};

    for (const eventType of COPILOT_HOOK_EVENT_TYPES) {
      const hookEntry = this.buildHookEntry(binaryPath, eventType, scope) as unknown as CopilotHookEntry;
      if (!s.hooks[eventType]) s.hooks[eventType] = [];
      const matchers: ClaudeHookMatcher[] = s.hooks[eventType];

      let found = false;
      for (const matcher of matchers) {
        if (!matcher.hooks) continue;
        const idx = matcher.hooks.findIndex((h) => isMarkedCopilotHook(h as Record<string, unknown>));
        if (idx >= 0) {
          matcher.hooks[idx] = hookEntry as unknown as ClaudeHookEntry;
          found = true;
          break;
        }
      }
      if (!found) matchers.push({ hooks: [hookEntry as unknown as ClaudeHookEntry] });
    }
  },

  removeHooksFromFile(settingsPath) {
    const settings = this.readSettings(settingsPath) as CopilotSettingsFile;
    if (!settings.hooks) return 0;

    let removed = 0;
    for (const eventType of Object.keys(settings.hooks)) {
      const matchers = settings.hooks[eventType];
      if (!Array.isArray(matchers)) continue;
      for (let i = matchers.length - 1; i >= 0; i--) {
        const matcher = matchers[i];
        if (!matcher.hooks) continue;
        const before = matcher.hooks.length;
        matcher.hooks = matcher.hooks.filter((h) => !isMarkedCopilotHook(h as Record<string, unknown>));
        removed += before - matcher.hooks.length;
        if (matcher.hooks.length === 0) matchers.splice(i, 1);
      }
      if (matchers.length === 0) delete settings.hooks[eventType];
    }
    if (Object.keys(settings.hooks).length === 0) delete settings.hooks;

    this.writeSettings(settingsPath, settings as Record<string, unknown>);
    return removed;
  },

  hooksInstalledInSettings(scope, cwd) {
    const settingsPath = this.getSettingsPath(scope, cwd);
    if (!existsSync(settingsPath)) return false;
    try {
      const settings = this.readSettings(settingsPath) as CopilotSettingsFile;
      if (!settings.hooks) return false;
      for (const matchers of Object.values(settings.hooks)) {
        if (!Array.isArray(matchers)) continue;
        for (const matcher of matchers) {
          if (!matcher.hooks) continue;
          if (matcher.hooks.some((h) => isMarkedCopilotHook(h as Record<string, unknown>))) return true;
        }
      }
    } catch {
      // Corrupt settings — treat as not installed
    }
    return false;
  },

  detectInstalled() {
    return binaryExists("copilot");
  },
};

// ── Cursor Agent CLI integration ───────────────────────────────────────────
//
// Cursor's hooks.json schema is a FLAT array of hook entries per event —
// `{ hooks: { preToolUse: [{ command, type, timeout, ... }] } }` — without
// the Claude-style `{ hooks: [...] }` matcher wrapper. The settings file
// carries `version: 1` like Codex/Copilot. Differences from Claude:
//   • Settings paths: ~/.cursor/hooks.json (user) and <cwd>/.cursor/hooks.json (project)
//   • Event keys are camelCase (`preToolUse`, `beforeSubmitPrompt`, …); we
//     canonicalize to PascalCase in handler.ts before policy lookup
//   • Stdout decision shape differs (`{permission, user_message, agent_message,
//     additional_context}`); the Cursor branch in policy-evaluator.ts emits it
//   • No "local" scope
//   • Detected via the `cursor-agent` binary (preferred) or `agent` (legacy alias)
//
// Ref: https://cursor.com/docs/hooks (Schema section).

interface CursorSettingsFile {
  version?: number;
  /** Flat array of hook entries per event — NOT wrapped in `{ hooks: [...] }`. */
  hooks?: Record<string, Array<ClaudeHookEntry | Record<string, unknown>>>;
  [key: string]: unknown;
}

export const cursor: Integration = {
  id: "cursor",
  displayName: "Cursor Agent",
  scopes: CURSOR_HOOK_SCOPES,
  eventTypes: CURSOR_HOOK_EVENT_TYPES,

  getSettingsPath(scope, cwd) {
    const base = cwd ? resolve(cwd) : process.cwd();
    switch (scope) {
      case "user":
        return resolve(homedir(), ".cursor", "hooks.json");
      case "project":
        return resolve(base, ".cursor", "hooks.json");
      case "local":
        // Cursor has no "local" scope; CLI rejects --cli cursor --scope local
        // before reaching here, but fall back to project so callers don't crash.
        return resolve(base, ".cursor", "hooks.json");
    }
  },

  readSettings(settingsPath) {
    const raw = readJsonFile(settingsPath);
    if (raw.version === undefined) raw.version = 1;
    return raw;
  },

  writeSettings(settingsPath, settings) {
    writeJsonFile(settingsPath, settings);
  },

  buildHookEntry(binaryPath, eventType, scope) {
    const command =
      scope === "project"
        ? `npx -y failproofai --hook ${eventType} --cli cursor`
        : `"${binaryPath}" --hook ${eventType} --cli cursor`;
    // `timeout` is documented as ms in Cursor's schema (matches Claude).
    return {
      type: "command",
      command,
      timeout: 60_000,
      [FAILPROOFAI_HOOK_MARKER]: true,
    };
  },

  isFailproofaiHook: isMarkedHook,

  writeHookEntries(settings, binaryPath, scope) {
    const s = settings as CursorSettingsFile;
    if (s.version === undefined) s.version = 1;
    if (!s.hooks) s.hooks = {};

    for (const eventType of CURSOR_HOOK_EVENT_TYPES) {
      const hookEntry = this.buildHookEntry(binaryPath, eventType, scope) as unknown as ClaudeHookEntry;
      const existing = s.hooks[eventType];
      const entries: Array<ClaudeHookEntry | Record<string, unknown>> = existing ?? [];
      if (!existing) s.hooks[eventType] = entries;

      // Idempotent: replace an existing failproofai-marked entry; otherwise append.
      const idx = entries.findIndex((h) => isMarkedHook(h as Record<string, unknown>));
      if (idx >= 0) {
        entries[idx] = hookEntry;
      } else {
        entries.push(hookEntry);
      }
    }
  },

  removeHooksFromFile(settingsPath) {
    const settings = this.readSettings(settingsPath) as CursorSettingsFile;
    if (!settings.hooks) return 0;

    let removed = 0;
    for (const eventType of Object.keys(settings.hooks)) {
      const entries = settings.hooks[eventType];
      if (!Array.isArray(entries)) continue;
      const before = entries.length;
      const filtered = entries.filter((h) => !isMarkedHook(h as Record<string, unknown>));
      removed += before - filtered.length;
      if (filtered.length === 0) {
        delete settings.hooks[eventType];
      } else {
        settings.hooks[eventType] = filtered;
      }
    }
    if (Object.keys(settings.hooks).length === 0) delete settings.hooks;

    this.writeSettings(settingsPath, settings as Record<string, unknown>);
    return removed;
  },

  hooksInstalledInSettings(scope, cwd) {
    const settingsPath = this.getSettingsPath(scope, cwd);
    if (!existsSync(settingsPath)) return false;
    try {
      const settings = this.readSettings(settingsPath) as CursorSettingsFile;
      if (!settings.hooks) return false;
      for (const entries of Object.values(settings.hooks)) {
        if (!Array.isArray(entries)) continue;
        if (entries.some((h) => isMarkedHook(h as Record<string, unknown>))) return true;
      }
    } catch {
      // Corrupt settings — treat as not installed
    }
    return false;
  },

  detectInstalled() {
    return binaryExists("cursor-agent") || binaryExists("agent");
  },
};

// ── Pi (pi-coding-agent) integration ───────────────────────────────────────
//
// Pi loads TypeScript extension packages registered in `.pi/settings.json`.
// Schema (verified empirically against pi-coding-agent v0.71.1):
//
//   {"packages": ["./relative/path", "/abs/path", "npm:@scope/name"]}
//
// Entries are PLAIN STRINGS — there's no per-entry object where the
// FAILPROOFAI_HOOK_MARKER could live. We identify failproofai's entry by a
// path-substring match (`includes("pi-extension") && includes("failproofai")`).
//
// Path semantics: a relative entry like `../pi-extension` is resolved relative
// to the directory containing settings.json (i.e. `<cwd>/.pi/`). For dogfood
// where the extension lives at `<cwd>/pi-extension/`, the correct entry is
// `"../pi-extension"`. For user-scope global installs where failproofai lives
// in the npm global root, we write the absolute path.
//
// Settings file paths (verified — `~/.pi/settings.json` does NOT exist on a
// fresh install; user-scope is under `~/.pi/agent/`):
//   user    → ~/.pi/agent/settings.json
//   project → <cwd>/.pi/settings.json
//
// Pi events arrive as `tool_call` / `user_bash` / `input` / `session_start`
// (underscore_lower_snake_case); handler.ts canonicalizes via PI_EVENT_MAP.
// Tool-call payloads use camelCase: `event.toolName`, `event.input`,
// `event.toolCallId`. `tool_call` handlers can `return { block: true, reason }`
// to veto the tool call — this is how PreToolUse deny is enforced.
//
// Detected via the `pi` binary on PATH.

interface PiSettingsFile {
  packages?: string[];
  [key: string]: unknown;
}

/** Returns the absolute path to the failproofai-shipped Pi extension package. */
function getPiExtensionPath(): string {
  // Resolve relative to the installed failproofai package root, falling back
  // to FAILPROOFAI_PACKAGE_ROOT (set by bin/failproofai.mjs) for dev mode.
  const fromEnv = process.env.FAILPROOFAI_PACKAGE_ROOT;
  if (fromEnv) return resolve(fromEnv, "pi-extension");
  // Fallback: walk up from this file (src/hooks/integrations.ts) two levels.
  return resolve(fileURLToPath(import.meta.url), "..", "..", "..", "pi-extension");
}

/** True iff a Pi packages-array entry was written by failproofai. */
function isFailproofaiPiEntry(source: unknown): boolean {
  if (typeof source !== "string") return false;
  // Path-substring match: matches the canonical `<failproofai>/pi-extension/`
  // path AND a future npm-scoped `@failproofai/pi-extension` package.
  return source.includes("pi-extension") && source.includes("failproofai");
}

export const pi: Integration = {
  id: "pi",
  displayName: "Pi",
  scopes: PI_HOOK_SCOPES,
  eventTypes: PI_HOOK_EVENT_TYPES,

  getSettingsPath(scope, cwd) {
    const base = cwd ? resolve(cwd) : process.cwd();
    switch (scope) {
      case "user":
        return resolve(homedir(), ".pi", "agent", "settings.json");
      case "project":
        return resolve(base, ".pi", "settings.json");
      case "local":
        // Pi has no "local" scope; CLI rejects --cli pi --scope local before
        // reaching here, but fall back to project so callers don't crash.
        return resolve(base, ".pi", "settings.json");
    }
  },

  readSettings(settingsPath) {
    return readJsonFile(settingsPath);
  },

  writeSettings(settingsPath, settings) {
    writeJsonFile(settingsPath, settings);
  },

  buildHookEntry(_binaryPath, _eventType, scope) {
    // Pi registers extensions at the package level — one entry covers all
    // events. The package's index.ts wires the four pi.on(...) handlers.
    // The "entry" returned here is a sentinel object so the Integration
    // interface's typing is satisfied; writeHookEntries resolves the actual
    // string entry below.
    return {
      [FAILPROOFAI_HOOK_MARKER]: true,
      _piPackagePath: getPiExtensionPath(),
      _piScope: scope,
    };
  },

  isFailproofaiHook(hook) {
    if (hook[FAILPROOFAI_HOOK_MARKER] === true) return true;
    // Pi entries are strings — also accept a {source} shape used by tests
    if (typeof hook.source === "string") return isFailproofaiPiEntry(hook.source);
    return false;
  },

  writeHookEntries(settings, _binaryPath, scope) {
    const s = settings as PiSettingsFile;
    if (!Array.isArray(s.packages)) s.packages = [];

    const extPath = getPiExtensionPath();
    // Project-scope writes a relative path (resolved by Pi at load time
    // against `<cwd>/.pi/`) so a committed `.pi/settings.json` is portable
    // across contributors. User-scope writes an absolute path because each
    // user's failproofai install has its own absolute location.
    const entry = scope === "project"
      ? makePiProjectRelativeEntry(extPath)
      : extPath;

    // Idempotent: replace any existing failproofai entry, otherwise append.
    const idx = s.packages.findIndex((p) => isFailproofaiPiEntry(p));
    if (idx >= 0) {
      s.packages[idx] = entry;
    } else {
      s.packages.push(entry);
    }
  },

  removeHooksFromFile(settingsPath) {
    if (!existsSync(settingsPath)) return 0;
    const settings = this.readSettings(settingsPath) as PiSettingsFile;
    if (!Array.isArray(settings.packages)) return 0;

    const before = settings.packages.length;
    settings.packages = settings.packages.filter((p) => !isFailproofaiPiEntry(p));
    const removed = before - settings.packages.length;

    if (settings.packages.length === 0) delete settings.packages;
    this.writeSettings(settingsPath, settings as Record<string, unknown>);
    return removed;
  },

  hooksInstalledInSettings(scope, cwd) {
    const settingsPath = this.getSettingsPath(scope, cwd);
    if (!existsSync(settingsPath)) return false;
    try {
      const settings = this.readSettings(settingsPath) as PiSettingsFile;
      if (!Array.isArray(settings.packages)) return false;
      return settings.packages.some((p) => isFailproofaiPiEntry(p));
    } catch {
      // Corrupt settings — treat as not installed
      return false;
    }
  },

  detectInstalled() {
    return binaryExists("pi");
  },
};

/**
 * Compute a relative path from `<settings.json's parent>` to the extension
 * directory, so the entry is portable across contributors who clone the repo
 * to different absolute paths.
 *
 * For project scope, settings.json lives at `<cwd>/.pi/settings.json`, and
 * the extension at `<cwd>/pi-extension/`. The relative path Pi expects
 * (resolved against `<cwd>/.pi/`) is `../pi-extension`.
 *
 * If the extension path is not under the project root (e.g. failproofai is
 * installed globally and being written to a project), falls back to the
 * absolute path so resolution still works on this machine.
 */
function makePiProjectRelativeEntry(extPath: string): string {
  const cwd = process.cwd();
  const cwdResolved = resolve(cwd);
  const extResolved = resolve(extPath);
  if (extResolved.startsWith(cwdResolved + "/") || extResolved === cwdResolved) {
    // Walk back up from <cwd>/.pi/ to <cwd>/, then forward to the extension.
    const fromSettingsDir = "../" + extResolved.slice(cwdResolved.length + 1);
    return fromSettingsDir;
  }
  // Extension lives outside the project — keep it absolute. Not portable, but
  // works for the local user.
  return extResolved;
}

// ── Registry ────────────────────────────────────────────────────────────────

const INTEGRATIONS: Record<IntegrationType, Integration> = {
  claude: claudeCode,
  codex,
  copilot,
  cursor,
  pi,
};

export function getIntegration(id: IntegrationType): Integration {
  const integration = INTEGRATIONS[id];
  if (!integration) {
    throw new Error(`Unknown integration: ${id}. Valid: ${INTEGRATION_TYPES.join(", ")}`);
  }
  return integration;
}

export function listIntegrations(): Integration[] {
  return INTEGRATION_TYPES.map((id) => INTEGRATIONS[id]);
}

/** Detect which agent CLIs are installed on PATH. */
export function detectInstalledClis(): IntegrationType[] {
  return INTEGRATION_TYPES.filter((id) => INTEGRATIONS[id].detectInstalled());
}
