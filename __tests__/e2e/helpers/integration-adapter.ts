import { expect } from "vitest";
import { type HookRunResult } from "./hook-runner";
import { CopilotPayloads, CursorPayloads, GeminiPayloads, Payloads } from "./payloads";

export type MatrixIntegration =
  | "claude-code"
  | "cursor"
  | "gemini"
  | "copilot"
  | "codex"
  | "opencode"
  | "pi";

export interface IntegrationAdapter {
  id: MatrixIntegration;
  preToolHookArg: string;
  makePreToolUsePayload: (command: string, cwd: string) => Record<string, unknown>;
  assertAllow: (result: HookRunResult) => void;
  assertDeny: (result: HookRunResult) => void;
}

function uniqueSessionId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function withSessionId(payload: Record<string, unknown>, prefix: string): Record<string, unknown> {
  const id = uniqueSessionId(prefix);
  const next = { ...payload };
  if ("sessionId" in next) next.sessionId = id;
  if ("session_id" in next) next.session_id = id;
  return next;
}

const jsonAllow = (result: HookRunResult, expected: Record<string, unknown>): void => {
  expect(result.exitCode).toBe(0);
  expect(result.parsed).toEqual(expected);
};

const jsonDeny = (result: HookRunResult, validator: (parsed: Record<string, unknown>) => void): void => {
  expect(result.exitCode).toBe(0);
  expect(result.parsed).toBeTruthy();
  validator(result.parsed as Record<string, unknown>);
};

const exitCodeAllow = (result: HookRunResult): void => {
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toBe("");
};

const exitCodeDeny = (result: HookRunResult): void => {
  expect(result.exitCode).toBe(2);
  expect(result.stdout).toBe("");
  expect(result.stderr).toMatch(/\b(block-sudo|custom)\b/i);
};

export const INTEGRATION_ADAPTERS: readonly IntegrationAdapter[] = [
  {
    id: "claude-code",
    preToolHookArg: "PreToolUse",
    makePreToolUsePayload: (command, cwd) => withSessionId(Payloads.preToolUse.bash(command, cwd), "claude"),
    assertAllow: exitCodeAllow,
    assertDeny: exitCodeDeny,
  },
  {
    id: "cursor",
    preToolHookArg: "PreToolUse",
    makePreToolUsePayload: (command, cwd) => withSessionId(CursorPayloads.preToolUse.bash(command, cwd), "cursor"),
    assertAllow: (result) => jsonAllow(result, { continue: true, permission: "allow" }),
    assertDeny: (result) => jsonDeny(result, (parsed) => {
      expect(parsed.continue).toBe(false);
      expect(parsed.permission).toBe("deny");
    }),
  },
  {
    id: "gemini",
    preToolHookArg: "BeforeTool",
    makePreToolUsePayload: (command, cwd) => withSessionId(GeminiPayloads.beforeTool.bash(command, cwd), "gemini"),
    assertAllow: (result) => jsonAllow(result, { decision: "allow" }),
    assertDeny: (result) => jsonDeny(result, (parsed) => {
      expect(parsed.decision).toBe("deny");
      expect(typeof parsed.reason).toBe("string");
    }),
  },
  {
    id: "copilot",
    preToolHookArg: "preToolUse",
    makePreToolUsePayload: (command, cwd) => withSessionId(CopilotPayloads.preToolUse.bash(command, cwd), "copilot"),
    assertAllow: (result) => jsonAllow(result, { permissionDecision: "allow" }),
    assertDeny: (result) => jsonDeny(result, (parsed) => {
      expect(parsed.permissionDecision).toBe("deny");
      expect(typeof parsed.permissionDecisionReason).toBe("string");
    }),
  },
  {
    id: "codex",
    preToolHookArg: "pre_tool_use",
    makePreToolUsePayload: (command, cwd) => ({
      session_id: uniqueSessionId("codex"),
      cwd,
      hook_event_name: "pre_tool_use",
      tool_name: "bash",
      tool_input: command,
      integration: "codex",
    }),
    assertAllow: exitCodeAllow,
    assertDeny: exitCodeDeny,
  },
  {
    id: "opencode",
    preToolHookArg: "tool.execute.before",
    makePreToolUsePayload: (command, cwd) => ({
      session_id: uniqueSessionId("opencode"),
      cwd,
      hook_event_name: "tool.execute.before",
      tool_name: "bash",
      tool_input: command,
      integration: "opencode",
    }),
    assertAllow: exitCodeAllow,
    assertDeny: exitCodeDeny,
  },
  {
    id: "pi",
    preToolHookArg: "tool_call",
    makePreToolUsePayload: (command, cwd) => ({
      session_id: uniqueSessionId("pi"),
      cwd,
      hook_event_name: "tool_call",
      tool_name: "bash",
      tool_input: { command },
      integration: "pi",
    }),
    assertAllow: exitCodeAllow,
    assertDeny: exitCodeDeny,
  },
];
