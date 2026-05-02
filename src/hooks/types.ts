/**
 * Constants and interfaces for agent CLI hooks integrations (Claude Code, OpenAI Codex, GitHub Copilot, Cursor Agent, OpenCode, …).
 */

export const HOOK_SCOPES = ["user", "project", "local"] as const;
export type HookScope = (typeof HOOK_SCOPES)[number];

export const INTEGRATION_TYPES = ["claude", "codex", "copilot", "cursor", "opencode"] as const;
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

// ── OpenCode (sst/opencode) ─────────────────────────────────────────────────
//
// OpenCode's plugin model is fundamentally different from the other four CLIs:
// there is NO external-command hook. Plugins are in-process JS/TS modules
// loaded from the `plugin: []` array in `opencode.json` (auto-discovery from
// `.opencode/plugins/` does NOT work — verified live on opencode v1.14.31).
// Plugins block tool calls by throwing an Error from `tool.execute.before`
// or by mutating `output.status = "deny"` from `permission.ask`.
//
// The failproofai integration ships a small generated plugin shim that
// spawns the failproofai binary as a subprocess and translates the binary's
// existing Claude-shape JSON response back into plugin semantics. As a
// result the binary itself sees Claude-shape PascalCase events — no
// canonicalization branch is needed in handler.ts. The OPENCODE_EVENT_MAP
// below documents the shim's plugin-side → binary-side translation; it is
// re-implemented inline in the shim template (so the shim file stays
// self-contained), but is exported here as the single source of truth and
// for tests.
//
// The integration uses six events for parity with Cursor / Copilot:
//   • tool.execute.before (first-class hook) → PreToolUse
//   • tool.execute.after  (first-class hook) → PostToolUse
//   • session.created     (bus event)        → SessionStart
//   • session.deleted     (bus event)        → SessionEnd
//   • session.idle        (bus event)        → Stop
//   • message.updated     (bus event, role:user-only) → UserPromptSubmit
// Plus optional `permission.ask` (first-class hook) → PermissionRequest for
// a cleaner deny UX when permission prompts trigger.
//
// Settings paths:
//   user    → ~/.config/opencode/opencode.json (plus plugins/failproofai.mjs)
//   project → <cwd>/.opencode/opencode.json     (plus plugins/failproofai.mjs)
// OpenCode has no `local` scope.

export const OPENCODE_HOOK_SCOPES = ["user", "project"] as const;
export type OpenCodeHookScope = (typeof OPENCODE_HOOK_SCOPES)[number];

export const OPENCODE_HOOK_EVENT_TYPES = [
  "tool.execute.before",
  "tool.execute.after",
  "session.created",
  "session.deleted",
  "session.idle",
  "message.updated",
  "permission.ask",
] as const;
export type OpenCodeHookEventType = (typeof OPENCODE_HOOK_EVENT_TYPES)[number];

export const OPENCODE_EVENT_MAP: Record<OpenCodeHookEventType, HookEventType> = {
  "tool.execute.before": "PreToolUse",
  "tool.execute.after": "PostToolUse",
  "session.created": "SessionStart",
  "session.deleted": "SessionEnd",
  "session.idle": "Stop",
  "message.updated": "UserPromptSubmit",
  "permission.ask": "PermissionRequest",
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
  /** Which agent CLI fired this hook (claude | codex | copilot | cursor | opencode). Set by handler.ts from --cli. */
  cli?: IntegrationType;
}

export interface ClaudeSettings {
  hooks?: Record<string, ClaudeHookMatcher[]>;
  [key: string]: unknown;
}
