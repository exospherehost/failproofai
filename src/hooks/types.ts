/**
 * Constants and interfaces for agent CLI hooks integrations (Claude Code, OpenAI Codex, …).
 */

export const HOOK_SCOPES = ["user", "project", "local"] as const;
export type HookScope = (typeof HOOK_SCOPES)[number];

export const INTEGRATION_TYPES = ["claude", "codex"] as const;
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
  /** Which agent CLI fired this hook (claude | codex). Set by handler.ts from --cli. */
  cli?: IntegrationType;
}

export interface ClaudeSettings {
  hooks?: Record<string, ClaudeHookMatcher[]>;
  [key: string]: unknown;
}
