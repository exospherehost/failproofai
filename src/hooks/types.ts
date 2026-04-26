/**
 * Constants and interfaces for hook integrations.
 */

export const HOOK_SCOPES = ["user", "project", "local"] as const;
export type HookScope = (typeof HOOK_SCOPES)[number];

export const INTEGRATION_TYPES = ["claude-code", "cursor", "gemini", "copilot", "codex", "opencode", "pi"] as const;
export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

export const CURSOR_HOOK_SCOPES = ["user", "project"] as const;

export const HOOK_EVENT_TYPES = [
  "SessionStart",
  "SessionEnd",
  "UserPromptSubmit",
  "AssistantResponse",
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

// ── Gemini CLI ────────────────────────────────────────────────────────────────

export const GEMINI_HOOK_EVENT_TYPES = [
  "BeforeTool",
  "AfterTool",
  "BeforeAgent",
  "AfterAgent",
  "BeforeModel",
  "AfterModel",
  "BeforeToolSelection",
  "SessionStart",
  "SessionEnd",
  "Notification",
  "PreCompress",
] as const;

export type GeminiHookEventType = (typeof GEMINI_HOOK_EVENT_TYPES)[number];

export const GEMINI_EVENT_MAP: Record<GeminiHookEventType, string> = {
  BeforeTool: "PreToolUse",
  AfterTool: "PostToolUse",
  BeforeAgent: "SessionStart",
  AfterAgent: "Stop",
  BeforeModel: "UserPromptSubmit",
  AfterModel: "PostToolUse",
  BeforeToolSelection: "PreToolUse",
  SessionStart: "SessionStart",
  SessionEnd: "SessionEnd",
  Notification: "Notification",
  PreCompress: "PreCompact",
};

// ── GitHub Copilot ────────────────────────────────────────────────────────────

export const COPILOT_HOOK_EVENT_TYPES = [
  "sessionStart",
  "sessionEnd",
  "userPromptSubmitted",
  "preToolUse",
  "postToolUse",
  "agentStop",
  "subagentStop",
  "errorOccurred",
] as const;

export type CopilotHookEventType = (typeof COPILOT_HOOK_EVENT_TYPES)[number];

export const COPILOT_EVENT_MAP: Record<CopilotHookEventType, string> = {
  sessionStart: "SessionStart",
  sessionEnd: "SessionEnd",
  userPromptSubmitted: "UserPromptSubmit",
  preToolUse: "PreToolUse",
  postToolUse: "PostToolUse",
  agentStop: "Stop",
  subagentStop: "SubagentStop",
  errorOccurred: "Stop",
};

// ── OpenAI Codex CLI ──────────────────────────────────────────────────────────

export const CODEX_HOOK_EVENT_TYPES = [
  "pre_tool_use",
  "post_tool_use",
  "session_start",
  "stop",
  "user_prompt_submit",
] as const;

export type CodexHookEventType = (typeof CODEX_HOOK_EVENT_TYPES)[number];

export const CODEX_EVENT_MAP: Record<CodexHookEventType, string> = {
  pre_tool_use: "PreToolUse",
  post_tool_use: "PostToolUse",
  session_start: "SessionStart",
  stop: "Stop",
  user_prompt_submit: "UserPromptSubmit",
};


// ── opencode Integration ──────────────────────────────────────────────────────

export const OPENCODE_HOOK_EVENT_TYPES = [
  "session.created",
  "session.idle",
  "tool.execute.before",
  "tool.execute.after",
  "chat.message",
  "stop",
] as const;

export type OpencodeHookEventType = (typeof OPENCODE_HOOK_EVENT_TYPES)[number];

export const OPENCODE_EVENT_MAP: Record<string, string> = {
  "session.created": "SessionStart",
  "session.idle": "Stop",
  "tool.execute.before": "PreToolUse",
  "tool.execute.after": "PostToolUse",
  "chat.message": "UserPromptSubmit",
};

// ── pi Integration ────────────────────────────────────────────────────────────

export const PI_HOOK_EVENT_TYPES = [
  "session_start",
  "tool_call",
  "tool_result",
  "input",
  "stop",
] as const;

export type PiHookEventType = (typeof PI_HOOK_EVENT_TYPES)[number];

export const PI_EVENT_MAP: Record<string, string> = {
  "session_start": "SessionStart",
  "tool_call": "PreToolUse",
  "tool_result": "PostToolUse",
  "input": "UserPromptSubmit",
  "stop": "Stop",
};
