/**
 * Constants and interfaces for agent CLI hooks integrations (Claude Code, OpenAI Codex, GitHub Copilot, …).
 */

export const HOOK_SCOPES = ["user", "project", "local"] as const;
export type HookScope = (typeof HOOK_SCOPES)[number];

export const INTEGRATION_TYPES = ["claude", "codex", "copilot", "cursor", "pi"] as const;
export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

export const CODEX_HOOK_SCOPES = ["user", "project"] as const;
export type CodexHookScope = (typeof CODEX_HOOK_SCOPES)[number];

export const CODEX_HOOK_EVENT_TYPES = [
  "session_start",
  "pre_tool_use",
  "permission_request",
  "post_tool_use",
  "user_prompt_submit",
  "stop",
] as const;
export type CodexHookEventType = (typeof CODEX_HOOK_EVENT_TYPES)[number];

export const CODEX_EVENT_MAP: Record<CodexHookEventType, HookEventType> = {
  session_start: "SessionStart",
  pre_tool_use: "PreToolUse",
  permission_request: "PermissionRequest",
  post_tool_use: "PostToolUse",
  user_prompt_submit: "UserPromptSubmit",
  stop: "Stop",
};

// ── GitHub Copilot CLI ─────────────────────────────────────────────────────
//
// Copilot CLI accepts two payload formats. We install with PascalCase event
// keys ("VS Code compatible" mode), which makes Copilot deliver PascalCase
// `hook_event_name` plus snake_case fields — same shape Claude already uses.
// As a result no Codex-style canonicalization map is required.
//
// Settings paths:
//   user    → ~/.copilot/hooks/failproofai.json
//   project → <cwd>/.github/hooks/failproofai.json   (also where the cloud agent reads)
// Settings file carries `version: 1` like Codex's hooks.json.

export const COPILOT_HOOK_SCOPES = ["user", "project"] as const;
export type CopilotHookScope = (typeof COPILOT_HOOK_SCOPES)[number];

export const COPILOT_HOOK_EVENT_TYPES = [
  "SessionStart",
  "SessionEnd",
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "Stop",
] as const;
export type CopilotHookEventType = (typeof COPILOT_HOOK_EVENT_TYPES)[number];

// ── Cursor Agent CLI ───────────────────────────────────────────────────────
//
// Cursor delivers events under camelCase keys (`preToolUse`, `postToolUse`,
// `beforeSubmitPrompt`, …) per https://cursor.com/docs/hooks. The handler
// maps each one to the PascalCase canonical form via CURSOR_EVENT_MAP before
// looking up policies. We install the same 6-event parity set as Copilot so
// every existing builtin policy fires; Cursor-specific events
// (`beforeShellExecution`, `afterFileEdit`, `subagentStart`, …) can be added
// later without touching the handler.
//
// Settings paths:
//   user    → ~/.cursor/hooks.json
//   project → <cwd>/.cursor/hooks.json
// Settings file carries `version: 1` like Codex/Copilot.

export const CURSOR_HOOK_SCOPES = ["user", "project"] as const;
export type CursorHookScope = (typeof CURSOR_HOOK_SCOPES)[number];

export const CURSOR_HOOK_EVENT_TYPES = [
  "sessionStart",
  "sessionEnd",
  "beforeSubmitPrompt",
  "preToolUse",
  "postToolUse",
  "stop",
] as const;
export type CursorHookEventType = (typeof CURSOR_HOOK_EVENT_TYPES)[number];

export const CURSOR_EVENT_MAP: Record<CursorHookEventType, HookEventType> = {
  sessionStart: "SessionStart",
  sessionEnd: "SessionEnd",
  beforeSubmitPrompt: "UserPromptSubmit",
  preToolUse: "PreToolUse",
  postToolUse: "PostToolUse",
  stop: "Stop",
};

// ── Pi (pi-coding-agent) ───────────────────────────────────────────────────
//
// Pi loads TypeScript extensions from packages registered in `.pi/settings.json`
// (project, `<cwd>/.pi/settings.json`) or `~/.pi/agent/settings.json` (user-
// scope — confirmed empirically; the bare `~/.pi/settings.json` does NOT
// exist on a fresh install). Extensions are default-exported functions that
// receive an ExtensionAPI and call `pi.on("<event>", handler)`. A handler can
// `return { block: true, reason }` from `tool_call` / `user_bash` to veto the
// tool call.
//
// Settings file schema is a FLAT string array — `{"packages": ["..."]}` —
// where each entry is a path resolved relative to `.pi/` (so `../pi-extension`
// for `<cwd>/pi-extension`). NOT an array of objects, so the
// FAILPROOFAI_HOOK_MARKER convention used by Claude/Codex/Copilot/Cursor is
// not applicable; failproofai's entry is identified by a path-substring match
// (`source.includes("pi-extension") && source.includes("failproofai")`).
//
// Pi events arrive in camelCase (like Cursor): `event.toolName`,
// `event.toolCallId`, `event.input`, `event.text`, `event.cwd`. The handler
// canonicalizes Pi's underscore_lower_snake_case event names
// (session_start / input / tool_call / user_bash) to PascalCase via
// PI_EVENT_MAP before policy lookup.

export const PI_HOOK_SCOPES = ["user", "project"] as const;
export type PiHookScope = (typeof PI_HOOK_SCOPES)[number];

export const PI_HOOK_EVENT_TYPES = [
  "session_start",
  "input",
  "tool_call",
  "user_bash",
] as const;
export type PiHookEventType = (typeof PI_HOOK_EVENT_TYPES)[number];

export const PI_EVENT_MAP: Record<PiHookEventType, HookEventType> = {
  session_start: "SessionStart",
  input: "UserPromptSubmit",
  tool_call: "PreToolUse",
  user_bash: "PreToolUse",
};

export const HOOK_EVENT_TYPES = [
  "SessionStart",
  "SessionEnd",
  "UserPromptSubmit",
  "PreToolUse",
  "PermissionRequest",
  "PermissionDenied",
  "PostToolUse",
  "PostToolUseFailure",
  "Notification",
  "SubagentStart",
  "SubagentStop",
  "TaskCreated",
  "TaskCompleted",
  "Stop",
  "StopFailure",
  "TeammateIdle",
  "InstructionsLoaded",
  "ConfigChange",
  "CwdChanged",
  "FileChanged",
  "WorktreeCreate",
  "WorktreeRemove",
  "PreCompact",
  "PostCompact",
  "Elicitation",
  "ElicitationResult",
  "UserPromptExpansion",
  "PostToolBatch",
] as const;

export type HookEventType = (typeof HOOK_EVENT_TYPES)[number];

export const FAILPROOFAI_HOOK_MARKER = "__failproofai_hook__" as const;

export interface ClaudeHookEntry {
  type: "command";
  command: string;
  timeout: number;
  [FAILPROOFAI_HOOK_MARKER]: true;
}

export interface ClaudeHookMatcher {
  hooks: Array<ClaudeHookEntry | Record<string, unknown>>;
}

export interface SessionMetadata {
  sessionId?: string;
  transcriptPath?: string;
  cwd?: string;
  permissionMode?: string;
  hookEventName?: string;
  /** Which agent CLI fired this hook (claude | codex | copilot | cursor | pi). Set by handler.ts from --cli. */
  cli?: IntegrationType;
}

export interface ClaudeSettings {
  hooks?: Record<string, ClaudeHookMatcher[]>;
  [key: string]: unknown;
}
