/**
 * Claude-accurate payload factories for E2E hook tests.
 *
 * Shapes match what Claude Code actually sends to hook processes
 * (sourced from src/hooks/handler.ts parsing logic).
 */

const SESSION_ID = "test-session-e2e-001";

/**
 * A transcript path that always exists and is readable.
 * Using /dev/null so transcript-reading policies (warn-repeated-tool-calls) skip gracefully.
 */
const TRANSCRIPT_PATH = "/dev/null";

export const Payloads = {
  preToolUse: {
    bash(command: string, cwd: string): Record<string, unknown> {
      return {
        session_id: SESSION_ID,
        transcript_path: TRANSCRIPT_PATH,
        cwd,
        permission_mode: "default",
        hook_event_name: "PreToolUse",
        tool_name: "Bash",
        tool_input: { command },
      };
    },

    write(filePath: string, content: string, cwd: string): Record<string, unknown> {
      return {
        session_id: SESSION_ID,
        transcript_path: TRANSCRIPT_PATH,
        cwd,
        permission_mode: "default",
        hook_event_name: "PreToolUse",
        tool_name: "Write",
        tool_input: { file_path: filePath, content },
      };
    },

    read(filePath: string, cwd: string): Record<string, unknown> {
      return {
        session_id: SESSION_ID,
        transcript_path: TRANSCRIPT_PATH,
        cwd,
        permission_mode: "default",
        hook_event_name: "PreToolUse",
        tool_name: "Read",
        tool_input: { file_path: filePath },
      };
    },
  },

  postToolUse: {
    bash(command: string, output: string, cwd: string): Record<string, unknown> {
      return {
        session_id: SESSION_ID,
        transcript_path: TRANSCRIPT_PATH,
        cwd,
        permission_mode: "default",
        hook_event_name: "PostToolUse",
        tool_name: "Bash",
        tool_input: { command },
        tool_result: output,
      };
    },

    read(filePath: string, content: string, cwd: string): Record<string, unknown> {
      return {
        session_id: SESSION_ID,
        transcript_path: TRANSCRIPT_PATH,
        cwd,
        permission_mode: "default",
        hook_event_name: "PostToolUse",
        tool_name: "Read",
        tool_input: { file_path: filePath },
        tool_result: content,
      };
    },
  },

  stop(cwd: string, transcriptPath?: string): Record<string, unknown> {
    return {
      session_id: SESSION_ID,
      transcript_path: transcriptPath ?? TRANSCRIPT_PATH,
      cwd,
      permission_mode: "default",
      hook_event_name: "Stop",
    };
  },

  notification(message: string, cwd: string): Record<string, unknown> {
    return {
      session_id: SESSION_ID,
      transcript_path: TRANSCRIPT_PATH,
      cwd,
      permission_mode: "default",
      hook_event_name: "Notification",
      message,
    };
  },
};

export const CursorPayloads = {
  preToolUse: {
    bash(command: string, cwd: string): Record<string, unknown> {
      return {
        session_id: SESSION_ID,
        workspace_roots: [cwd],
        integration: "cursor",
        hook_event_name: "preToolUse", // Note: cursor uses camelCase in payload too
        tool_name: "run_terminal_command",
        tool_input: { command },
      };
    },

    write(filePath: string, content: string, cwd: string): Record<string, unknown> {
      return {
        session_id: SESSION_ID,
        workspace_roots: [cwd],
        integration: "cursor",
        hook_event_name: "afterFileEdit",
        tool_name: "edit_file",
        tool_input: { file_path: filePath, content },
      };
    },
  },

  postToolUse: {
    bash(command: string, output: string, cwd: string): Record<string, unknown> {
      return {
        session_id: SESSION_ID,
        workspace_roots: [cwd],
        integration: "cursor",
        hook_event_name: "postToolUse",
        tool_name: "run_terminal_command",
        tool_input: { command },
        tool_result: output,
      };
    },
  },

  stop(cwd: string): Record<string, unknown> {
    return {
      session_id: SESSION_ID,
      workspace_roots: [cwd],
      integration: "cursor",
      hook_event_name: "stop",
    };
  },
};

export const GeminiPayloads = {
  beforeTool: {
    bash(command: string, cwd: string): Record<string, unknown> {
      return {
        session_id: SESSION_ID,
        cwd,
        hook_event_name: "BeforeTool",
        tool_name: "bash",
        tool_input: { command },
      };
    },
  },
  afterAgent(cwd: string): Record<string, unknown> {
    return {
      session_id: SESSION_ID,
      cwd,
      hook_event_name: "AfterAgent",
    };
  },
};

export const CopilotPayloads = {
  sessionStart(cwd: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      sessionId: SESSION_ID,
      cwd,
      hookEventName: "sessionStart",
      ...overrides,
    };
  },

  sessionEnd(cwd: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      sessionId: SESSION_ID,
      cwd,
      hookEventName: "sessionEnd",
      ...overrides,
    };
  },

  userPromptSubmitted(prompt: string, cwd: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      sessionId: SESSION_ID,
      cwd,
      hookEventName: "userPromptSubmitted",
      prompt,
      ...overrides,
    };
  },

  preToolUse: {
    bash(command: string, cwd: string): Record<string, unknown> {
      return {
        sessionId: SESSION_ID,
        cwd,
        hookEventName: "preToolUse",
        toolName: "bash",
        toolInput: { command },
      };
    },

    bashViaToolArgs(
      command: string,
      cwd: string,
      overrides: Record<string, unknown> = {},
    ): Record<string, unknown> {
      return {
        sessionId: SESSION_ID,
        cwd,
        hookEventName: "preToolUse",
        toolName: "bash",
        toolArgs: JSON.stringify({ command }),
        ...overrides,
      };
    },

    malformedToolArgs(
      raw: string,
      cwd: string,
      overrides: Record<string, unknown> = {},
    ): Record<string, unknown> {
      return {
        sessionId: SESSION_ID,
        cwd,
        hookEventName: "preToolUse",
        toolName: "bash",
        toolArgs: raw,
        ...overrides,
      };
    },
  },

  postToolUse: {
    bash(
      command: string,
      cwd: string,
      overrides: Record<string, unknown> = {},
    ): Record<string, unknown> {
      return {
        sessionId: SESSION_ID,
        cwd,
        hookEventName: "postToolUse",
        toolName: "bash",
        toolInput: { command },
        toolResult: "ok",
        ...overrides,
      };
    },
  },

  agentStop(cwd: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      sessionId: SESSION_ID,
      cwd,
      hookEventName: "agentStop",
      ...overrides,
    };
  },

  subagentStop(cwd: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      sessionId: SESSION_ID,
      cwd,
      hookEventName: "subagentStop",
      ...overrides,
    };
  },

  errorOccurred(message: string, cwd: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      sessionId: SESSION_ID,
      cwd,
      hookEventName: "errorOccurred",
      message,
      ...overrides,
    };
  },
};
