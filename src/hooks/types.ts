/**
 * Constants and interfaces for hook integrations.
 */

export const HOOK_SCOPES = ["user", "project", "local"] as const;
export type HookScope = (typeof HOOK_SCOPES)[number];

export const INTEGRATION_TYPES = ["claude-code", "cursor"] as const;
export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

export const CURSOR_HOOK_SCOPES = ["user", "project"] as const;

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
] as const;

export type HookEventType = (typeof HOOK_EVENT_TYPES)[number];

export const CURSOR_HOOK_EVENT_TYPES = [
  "preToolUse",
  "postToolUse",
  "postToolUseFailure",
  "sessionStart",
  "sessionEnd",
  "subagentStart",
  "subagentStop",
  "stop",
  "preCompact",
  "beforeShellExecution",
  "afterShellExecution",
  "beforeMCPExecution",
  "afterMCPExecution",
  "beforeReadFile",
  "afterFileEdit",
  "beforeSubmitPrompt",
  "afterAgentResponse",
  "afterAgentThought",
  "beforeTabFileRead",
  "afterTabFileEdit",
] as const;

export type CursorHookEventType = (typeof CURSOR_HOOK_EVENT_TYPES)[number];

/**
 * Maps Cursor camelCase event names to internal PascalCase event names
 * used by the --hook CLI flag and policy matcher.
 */
export const CURSOR_EVENT_MAP: Record<CursorHookEventType, string> = {
  preToolUse: "PreToolUse",
  postToolUse: "PostToolUse",
  postToolUseFailure: "PostToolUseFailure",
  sessionStart: "SessionStart",
  sessionEnd: "SessionEnd",
  subagentStart: "SubagentStart",
  subagentStop: "SubagentStop",
  stop: "Stop",
  preCompact: "PreCompact",
  beforeShellExecution: "PreToolUse",
  afterShellExecution: "PostToolUse",
  beforeMCPExecution: "PreToolUse",
  afterMCPExecution: "PostToolUse",
  beforeReadFile: "PreToolUse",
  afterFileEdit: "PostToolUse",
  beforeSubmitPrompt: "UserPromptSubmit",
  afterAgentResponse: "PostToolUse",
  afterAgentThought: "PostToolUse",
  beforeTabFileRead: "PreToolUse",
  afterTabFileEdit: "PostToolUse",
};

export const FAILPROOFAI_HOOK_MARKER = "__failproofai_hook__" as const;

export interface ClaudeHookEntry {
  type: "command";
  command: string;
  timeout: number;
  [FAILPROOFAI_HOOK_MARKER]: true;
}

export interface ClaudeHookMatcher {
  matcher?: string;
  hooks: Array<ClaudeHookEntry | Record<string, unknown>>;
}

export interface SessionMetadata {
  sessionId?: string;
  transcriptPath?: string;
  cwd?: string;
  permissionMode?: string;
  hookEventName?: string;
  integration?: IntegrationType;
}

export interface ClaudeSettings {
  hooks?: Record<string, ClaudeHookMatcher[]>;
  [key: string]: unknown;
}

export interface CursorHookEntry {
  command: string;
  timeout?: number;
  matcher?: string;
  failClosed?: boolean;
}

export interface CursorHooksFile {
  version?: number;
  hooks?: Record<string, CursorHookEntry[]>;
  [key: string]: unknown;
}
