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
  PI_HOOK_EVENT_TYPES,
  PI_EVENT_MAP,
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
  const raw = readFileSync(path, "utf8");
  // Strip JSONC line comments (e.g. GitHub Copilot's config.json starts with "// ..." lines)
  const stripped = raw.split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n");
  return JSON.parse(stripped) as Record<string, unknown>;
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

/**
 * Shared utility to flatten a "data" property into the top-level payload.
 * Many AI agent integrations (Copilot, OpenCode, Gemini) wrap their real
 * metadata in a "data" field.
 */
function flattenPayloadData(payload: Record<string, unknown>): void {
  if (payload.data && typeof payload.data === "object") {
    const data = payload.data as Record<string, any>;
    for (const key in data) {
      if (!(key in payload)) {
        payload[key] = data[key];
      }
    }
  }
}

function parseJsonLikeValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function hasCommandLikeField(value: unknown): boolean {
  const parsed = parseJsonLikeValue(value);
  if (!parsed || typeof parsed !== "object") return false;
  const stack: unknown[] = [parsed];
  const seen = new Set<unknown>();

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node);
    const rec = node as Record<string, unknown>;
    const commandValue = parseJsonLikeValue(rec.command ?? rec.cmd);
    if (typeof commandValue === "string" && commandValue.trim().length > 0) {
      return true;
    }
    for (const child of Object.values(rec)) {
      const parsedChild = parseJsonLikeValue(child);
      if (parsedChild && typeof parsedChild === "object") {
        stack.push(parsedChild);
      }
    }
  }
  return false;
}

/**
 * Recursively searches an object for the first occurrence of any provided keys.
 * Used for "Deep Data Mining" in complex nested payloads (like Gemini).
 */
function deepExtract(obj: any, keys: string[]): any {
  if (!obj || typeof obj !== "object") return null;
  
  // 1. Direct match
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return parseJsonLikeValue(obj[key]);
  }

  // 2. Recursive search in arrays or objects
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = deepExtract(item, keys);
      if (found !== null) return found;
    }
  } else {
    for (const k in obj) {
      const found = deepExtract(obj[k], keys);
      if (found !== null) return found;
    }
  }
  
  return null;
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
      ? `npx -y failproofai --hook ${eventType} --cli claude-code`
      : `"${binaryPath}" --hook ${eventType} --cli claude-code`;
    return {
      type: "command",
      command,
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

  detect: (payload) => {
    const h = (payload.hook_event_name as string) || (payload.hookEventName as string) || "";
    
    // Explicit Identity Guard: If this is clearly a Gemini or Copilot event,
    // do NOT let Claude hijack it even if detect returns true otherwise.
    if (GEMINI_HOOK_EVENT_TYPES.includes(h as any)) return false;
    if (COPILOT_HOOK_EVENT_TYPES.includes(h as any)) return false;

    // Only detect as Claude if the event name is a known Claude hook event
    return [
      "beforeSubmitPrompt", "afterAgentResponse", "afterAgentThought",
      "preToolUse", "postToolUse", "postToolUseFailure",
      "sessionStart", "sessionEnd", "stop"
    ].includes(h);
  },
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
      command: `"${process.execPath}" "${binaryPath}" --hook ${pascalEvent} --cli cursor --stdin`,
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
    flattenPayloadData(payload);

    if (!payload.cwd && Array.isArray(payload.workspace_roots) && payload.workspace_roots.length > 0) {
      payload.cwd = payload.workspace_roots[0] as string;
    }
    // Map tool input fields — prioritize structured data, then fall back to message text
    if (!payload.tool_input) {
      if (payload.file_path || payload.path) {
        payload.tool_input = { file_path: (payload.file_path ?? payload.path) as string };
      } else {
        payload.tool_input = payload.toolInput ?? payload.command ?? payload.input ?? payload.tool_args ?? payload.toolArgs ?? 
                             payload.message ?? payload.prompt ?? payload.text ?? payload.content ??
                             (payload.data as any)?.params ?? (payload.data as any)?.arguments ?? (payload.data as any)?.message ?? (payload.data as any)?.text;
      }
    }
    // Map tool name
    if (!payload.tool_name) {
      const hookEvent = payload.hook_event_name as string | undefined;
      if (hookEvent === "beforeShellExecution" || hookEvent === "afterShellExecution") {
        payload.tool_name = "run_terminal_command";
      } else if (hookEvent === "beforeMCPExecution" || hookEvent === "afterMCPExecution") {
        payload.tool_name = "mcp_tool";
      } else if (hookEvent === "beforeReadFile" || hookEvent === "beforeTabFileRead") {
        payload.tool_name = "Read";
      } else if (hookEvent === "afterFileEdit" || hookEvent === "afterTabFileEdit") {
        payload.tool_name = "Write";
      } else if (hookEvent === "afterChatResponse" || hookEvent === "afterAgentResponse") {
        payload.tool_name = "assistant_response";
      } else {
        payload.tool_name = payload.toolName || payload.tool_event_name || (payload.data as any)?.call || (payload.data as any)?.method;
      }
    }
    
    // Map tool output (ensure assistant responses are captured)
    if (!payload.tool_output) {
      payload.tool_output = payload.toolOutput ?? payload.output ?? payload.tool_result ?? payload.toolResult ?? 
                           payload.message ?? payload.text ?? payload.content ??
                           (payload.data as any)?.message ?? (payload.data as any)?.text ?? (payload.data as any)?.content;
    }

    // Lift specific CWD if found in tool input (Hyper-Specific Attribution)
    const input = payload.tool_input as any;
    if (input?.cwd || input?.working_directory || input?.directory) {
      payload.cwd = input.cwd || input.working_directory || input.directory;
    }
  },

  getCanonicalEventName(payload, cliArg) {
    // Safety net: derive canonical name from payload's hook_event_name if available.
    // buildHookEntry already maps cursor events in --hook, but this handles edge cases.
    const hookEventName = payload.hook_event_name as string | undefined;
    if (hookEventName) {
      const mapped = CURSOR_EVENT_MAP[hookEventName as CursorHookEventType];
      if (mapped) return mapped;
    }
    return cliArg;
  },
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

  buildHookEntry(binaryPath: string, eventType: string, scope?: string): Record<string, unknown> {
    const bash = `"${process.execPath}" "${binaryPath}" --hook ${eventType} --cli gemini --stdin`;
    return {
      type: "command",
      command: bash,
      timeout: 10000,
      [FAILPROOFAI_HOOK_MARKER]: true,
    };
  },

  isFailproofaiHook: isMarkedHook,

  writeHookEntries(settings: Record<string, unknown>, binaryPath: string, scope?: string): void {
    const s = settings as ClaudeSettings; // Gemini uses same settings format as Claude
    if (!s.hooks) s.hooks = {};

    for (const eventType of GEMINI_HOOK_EVENT_TYPES) {
      const hookEntry = this.buildHookEntry(binaryPath, eventType, scope);
      if (!s.hooks[eventType]) s.hooks[eventType] = [];
      const matchers: ClaudeHookMatcher[] = s.hooks[eventType];
      // Self-heal stale/broken Gemini hook entries by removing all marked
      // FailproofAI hooks for this event and writing exactly one canonical entry.
      for (let i = matchers.length - 1; i >= 0; i--) {
        const matcher = matchers[i];
        if (!matcher.hooks) continue;
        matcher.hooks = matcher.hooks.filter((h) => !this.isFailproofaiHook(h as Record<string, unknown>));
        if (matcher.hooks.length === 0) {
          matchers.splice(i, 1);
        }
      }
      matchers.push({ hooks: [hookEntry as any] });
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
    flattenPayloadData(payload);

    // Extract session_id from Gemini-specific fields so policies that use session tracking
    // (e.g. warn-repeated-tool-calls) operate on the correct per-session tracker file.
    if (!payload.session_id) {
      payload.session_id =
        (payload.sessionId as string | undefined) ||
        ((payload.data as any)?.sessionId as string | undefined) ||
        ((payload.data as any)?.session_id as string | undefined) ||
        process.env.GEMINI_SESSION_ID;
    }

    // Deep mining for Gemini: Text and Tool Data can be anywhere
    const deepText = parseJsonLikeValue(deepExtract(payload, ["text", "content", "parts", "message", "prompt"]));
    const deepArgs = parseJsonLikeValue(deepExtract(payload, ["arguments", "params", "args"]));
    const deepName = deepExtract(payload, ["call", "method", "name", "toolName"]);
    const parsedToolInput = parseJsonLikeValue(payload.tool_input ?? payload.toolInput);
    const parsedToolArgs = parseJsonLikeValue(payload.tool_args ?? payload.toolArgs);

    // Map tool name
    if (!payload.tool_name) payload.tool_name = payload.toolName || deepName;
    
    // Map tool input with command-aware precedence.
    // Some Gemini payloads include both toolInput (metadata) and toolArgs (actual command).
    const candidates = [parsedToolInput, parsedToolArgs, deepArgs, deepText];
    const commandCandidate = candidates.find((c) => hasCommandLikeField(c));
    if (commandCandidate !== undefined) {
      payload.tool_input = commandCandidate;
    } else if (!payload.tool_input) {
      payload.tool_input = parsedToolInput || parsedToolArgs || deepArgs || deepText;
    } else {
      payload.tool_input = parsedToolInput;
    }
    
    // Map tool output
    if (!payload.tool_output) {
      payload.tool_output = parseJsonLikeValue(payload.toolOutput || deepExtract(payload, ["response", "result", "output"]));
    }

    // Lift CWD (Hyper-Specific Attribution)
    const input = payload.tool_input as any;
    if (input?.cwd || input?.working_directory || input?.directory) {
      payload.cwd = input.cwd || input.working_directory || input.directory;
    }
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
    // Search for project settings FIRST — if there's no project file to
    // merge in, we must not touch existing user-scope hooks (wiping them
    // would leave the user with no active hooks at all).
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
    if (!projectSettingsPath) return; // nothing to sync — leave user-scope hooks intact

    const globalSettings = readJsonFile(globalSettingsPath);
    if (!globalSettings.hooks) globalSettings.hooks = {};
    const gHooks = globalSettings.hooks as Record<string, any[]>;

    // Only strip project-scope entries (npx invocations) so user-scope
    // entries (local-binary invocations) survive re-syncs.
    for (const event of Object.keys(gHooks)) {
      gHooks[event] = gHooks[event].filter((h: any) =>
        !(typeof h.bash === "string" && h.bash.includes("npx -y failproofai") && h.bash.includes("--cli copilot"))
      );
    }

    {
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
    // Pass Copilot's native camelCase event name (e.g. sessionStart, preToolUse)
    // verbatim. The handler canonicalizes via getCanonicalEventName, and the
    // camelCase form is the unique signal that distinguishes Copilot from
    // Claude (PascalCase) even on older handlers that don't recognize the
    // --cli flag.
    const bash = scope === "project"
      ? `npx -y failproofai --hook ${eventType} --cli copilot`
      : `"${process.execPath}" "${binaryPath}" --hook ${eventType} --cli copilot`;
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

      // DEDUPLICATE: Remove all failproofai hooks for this event type,
      // then add exactly ONE. This prevents "npx + local" duplicates.
      hooks[eventType] = hooks[eventType].filter((h) => !this.isFailproofaiHook(h));
      hooks[eventType].push(entry);
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
    if (payload.integration === "copilot") return true;

    // detect() is only reached via Secondary Detection — i.e. when no --cli flag was present.
    // In that case COPILOT_SESSION_ID/COPILOT_CMD_ID in the process environment is authoritative:
    // the hook was fired from inside a Copilot terminal session, so treat it as Copilot.
    // Env-var bleed across integrations is prevented at the session-extraction layer (handler.ts),
    // which already scopes each env var to its matching integrationType.
    if (process.env.COPILOT_SESSION_ID || process.env.COPILOT_CMD_ID) return true;

    // Check top level and nested data
    const data = (payload.data as Record<string, any>) || {};
    const hookName = (payload.hook_event_name as string) || (payload.hookEventName as string) ||
                     (data.hook_event_name as string) || (data.hookEventName as string) || "";

    const hasCopilotShape =
      "sessionId" in payload || "sessionId" in data ||
      "toolName" in payload || "toolName" in data ||
      "hookEventName" in payload || "hookEventName" in data;
    const hasCopilotEventName =
      COPILOT_HOOK_EVENT_TYPES.includes(hookName as any) && !/^[A-Z]/.test(hookName);

    return (
      hasCopilotShape ||
      // Strictly avoid PascalCase events from Claude if they don't match Copilot expected types
      hasCopilotEventName
    );
  },

  normalizePayload(payload) {
    flattenPayloadData(payload);

    const parsedToolInput = parseJsonLikeValue(
      payload.toolInput ?? (payload.data as any)?.toolInput,
    );
    const parsedToolArgs = parseJsonLikeValue(
      payload.toolArgs ?? (payload.data as any)?.toolArgs,
    );

    // Copilot uses camelCase; normalize to internal snake_case
    if (!payload.session_id) payload.session_id = payload.sessionId;
    if (!payload.tool_name) payload.tool_name = payload.toolName || (payload.data as any)?.toolName || (payload.data as any)?.call || (payload.data as any)?.method;
    if (!payload.tool_input) {
      payload.tool_input = parsedToolInput || parsedToolArgs || (payload.data as any)?.params || (payload.data as any)?.arguments ||
                           payload.message || payload.prompt || payload.text || (payload.data as any)?.message;
    }
    if (!payload.tool_output) {
      payload.tool_output = payload.toolOutput || payload.toolResult || (payload.data as any)?.toolOutput || (payload.data as any)?.result ||
                           payload.message || payload.text || (payload.data as any)?.message;
    }
    if (payload.hookEventName && !payload.hook_event_name) payload.hook_event_name = payload.hookEventName;
    if (payload.session_id && !payload.sessionId) payload.sessionId = payload.session_id;

    // Lift CWD (Hyper-Specific Attribution)
    const input = payload.tool_input as any;
    if (input?.cwd || input?.working_directory || input?.directory) {
      payload.cwd = input.cwd || input.working_directory || input.directory;
    }
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

  buildHookEntry(binaryPath: string, eventType: string, scope?: string): Record<string, unknown> {
    const pascalEvent = CODEX_EVENT_MAP[eventType as CodexHookEventType] ?? eventType;
    const command = scope === "project"
      ? `npx -y failproofai --hook ${pascalEvent} --cli codex`
      : `"${process.execPath}" "${binaryPath}" --hook ${pascalEvent} --cli codex`;
    return {
      type: "command",
      command,
      timeout: 60,
      [FAILPROOFAI_HOOK_MARKER]: true,
    };
  },

  isFailproofaiHook: isMarkedHook,

  writeHookEntries(settings: Record<string, unknown>, binaryPath: string, scope?: string): void {
    if (!settings.version) settings.version = 1;
    if (!settings.hooks) settings.hooks = {};
    const hooks = settings.hooks as Record<string, any[]>;

    for (const eventType of CODEX_HOOK_EVENT_TYPES) {
      const hookEntry = this.buildHookEntry(binaryPath, eventType, scope);
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

  normalizePayload(payload) {
    flattenPayloadData(payload);
    if (!payload.tool_name) payload.tool_name = payload.toolName || payload.method || (payload.data as any)?.call;
    if (!payload.tool_input) payload.tool_input = payload.toolInput || payload.params || payload.arguments || (payload.data as any)?.parameters || payload.message || payload.prompt || (payload.data as any)?.message;
    if (!payload.tool_output) payload.tool_output = payload.toolOutput || payload.result || payload.output || payload.message || (payload.data as any)?.message;
    
    // Lift CWD (Hyper-Specific Attribution)
    const input = payload.tool_input as any;
    if (input?.cwd || input?.working_directory || input?.directory) {
      payload.cwd = input.cwd || input.working_directory || input.directory;
    }
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

  writeHookEntries(_settings: Record<string, unknown>, binaryPath: string, scope?: string): void {
    const path = (this as any)._lastPath || this.getSettingsPath("user");
    const cliInvocation = (scope === "project" && !process.env.FAILPROOFAI_DIST_PATH)
      ? 'npx -y failproofai'
      : `"${process.execPath}" "${binaryPath}"`;
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

    const cmd = '${cliInvocation} --hook ' + event + ' --cli opencode --stdin';

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
      callcli("PreToolUse", { tool_name: input.tool, tool_input: output.args, session_id: currentSessionId });
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

// ── pi integration ───────────────────────────────────────────────────────────

const pi: Integration = {
  id: "pi",
  displayName: "Pi Coding Agent",
  scopes: ["user", "project"],
  eventTypes: PI_HOOK_EVENT_TYPES,
  hookMarker: "// failproofai-hook",

  getSettingsPath(scope: string, cwd?: string): string {
    const base = cwd ? resolve(cwd) : process.cwd();
    let p: string;
    switch (scope) {
      case "user":
        p = resolve(homedir(), ".pi", "agent", "extensions", "failproofai.ts");
        break;
      case "project":
        p = resolve(base, ".pi", "extensions", "failproofai.ts");
        break;
      default:
        p = resolve(homedir(), ".pi", "agent", "extensions", "failproofai.ts");
        break;
    }
    (this as any)._lastPath = p; // Track path for writeHookEntries
    return p;
  },

  readSettings(): Record<string, unknown> {
    return { version: 1 };
  },

  writeSettings(): void {
    // Persistent write is handled in writeHookEntries for pi
  },

  buildHookEntry(): Record<string, unknown> {
    return {};
  },

  isFailproofaiHook(): boolean {
    return false;
  },

  writeHookEntries(_settings: Record<string, unknown>, binaryPath: string, scope?: string): void {
    const path = (this as any)._lastPath || this.getSettingsPath("user");
    const cliInvocation = (scope === "project" && !process.env.FAILPROOFAI_DIST_PATH)
      ? 'npx -y failproofai'
      : `"${process.execPath}" "${binaryPath}"`;
    const template = `/**
 * FailproofAI Integration for Pi Coding Agent
 * Generated by failproofai
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  const reportedSessions = new Set<string>();

  const callcli = (event: string, args: any, ctx?: any) => {
    // Session ID priority:
    // 1. ctx.sessionId or ctx.session.id (SDK scoped)
    // 2. pi.session.id (Global scoped)
    // 3. Fallback to Project Name
    const projectName = process.cwd().split("/").pop() || "failproofai";

    const getSessionIdFromFile = (): string | undefined => {
      try {
        const cwd = process.cwd();
        let encodedPath = cwd.startsWith('/') ? cwd.slice(1) : cwd;
        encodedPath = encodedPath.split('/').join('-');
        const workspaceName = '--' + encodedPath + '--';
        const sessionsDir = join(homedir(), '.pi', 'agent', 'sessions', workspaceName);
        if (!existsSync(sessionsDir)) return undefined;
        const files = readdirSync(sessionsDir)
          .filter((f: string) => f.endsWith('.jsonl'))
          .map((f: string) => ({ name: f, mtime: statSync(join(sessionsDir, f)).mtimeMs }))
          .sort((a: any, b: any) => b.mtime - a.mtime);
        if (files.length === 0) return undefined;
        const filename = files[0].name;
        const underscore = filename.lastIndexOf('_');
        const dot = filename.lastIndexOf('.');
        if (underscore > 0 && dot > underscore) {
          return filename.slice(underscore + 1, dot);
        }
        return undefined;
      } catch {
        return undefined;
      }
    };

    // DEBUG: Log available session values
    const debugInfo = {
      ctx_sessionId: ctx?.sessionId,
      ctx_session_id: ctx?.session?.id,
      pi_session_id: pi.session?.id,
      pi_sessionId: pi.sessionId,
      projectName,
    };
    try { (pi as any).log?.(\`[FailproofAI Debug] Session ID sources: \${JSON.stringify(debugInfo)}\`); } catch {}

    const sessionId =
      ctx?.sessionId ||
      ctx?.session?.id ||
      pi.session?.id ||
      pi.sessionId ||
      process.env.PI_SESSION_ID ||
      getSessionIdFromFile() ||
      \`pi-\${projectName}-\${Date.now()}\`;

    const payloadWithCwd = {
      ...args,
      integration: "pi",
      cwd: process.cwd(),
      session_id: sessionId,
    };

    const cmd = '${cliInvocation} --hook ' + event + ' --cli pi --stdin';

    const res = spawnSync(cmd, {
      input: JSON.stringify(payloadWithCwd),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    if (res.status !== 0) {
      const reason = res.stderr || res.stdout || "Action blocked by FailproofAI policy";
      // Use TUI status bar for premium feedback if possible
      if (ctx?.ui?.setStatus) {
        try { ctx.ui.setStatus("FailproofAI: Blocked - " + reason); } catch {}
      } else {
        try { (pi as any).log?.("FailproofAI: Blocked - " + reason); } catch {}
      }
      return { block: true, reason };
    }

    return { block: false };
  };

  pi.on("session_start", (event, ctx) => {
    try { callcli("SessionStart", {}, ctx); } catch {}
  });

  pi.on("tool_call", (event, ctx) => {
    try {
      const toolName = event.toolName || event.name;
      const toolInput = event.input || event.args || event.arguments;
      const res = callcli("PreToolUse", { 
        tool_name: toolName, 
        tool_input: toolInput 
      }, ctx);
      if (res?.block) return { block: true, reason: res.reason };
    } catch {}
  });

  pi.on("tool_result", (event, ctx) => {
    try {
      const toolName = event.toolName || event.name;
      const toolInput = event.input || event.args || event.arguments;
      const toolOutput = event.result?.content || event.output || event.result;
      callcli("PostToolUse", { 
        tool_name: toolName, 
        tool_input: toolInput,
        tool_output: toolOutput
      }, ctx);
    } catch {}
  });

  pi.on("input", (event, ctx) => {
    try {
      const text = event.text || event.input || event.content || (typeof event === "string" ? event : "");
      if (text) {
        // Isolation guard: ensure we don't handle messages that might be recursive
        if (text === "/failproofai-status") return;
        callcli("UserPromptSubmit", { tool_input: text }, ctx);
      }
    } catch {}
  });
}
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
          return PI_HOOK_EVENT_TYPES.length;
        }
      } catch {}
    }
    return 0;
  },

  hooksInstalledInSettings(scope: string, cwd?: string): boolean {
    return existsSync(this.getSettingsPath(scope, cwd));
  },

  detectInstalled(): boolean {
    return binaryExists("pi");
  },

  detect(payload) {
    // Pi always sets integration field explicitly (line 1438 in the template)
    return payload.integration === "pi";
  },

  normalizePayload(payload) {
    flattenPayloadData(payload);
    // Pi already sends snake_case properties; ensure camelCase aliases exist
    if (payload.session_id && !payload.sessionId) payload.sessionId = payload.session_id;
  },

  getCanonicalEventName(payload, cliArg) {
    const h = payload.hook_event_name as string;
    return PI_EVENT_MAP[h] ?? cliArg;
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
  pi,
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
