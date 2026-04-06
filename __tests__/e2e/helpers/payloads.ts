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
