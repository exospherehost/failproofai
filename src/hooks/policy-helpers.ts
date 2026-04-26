/**
 * Shared decision helper functions for builtin and custom policies.
 */
import type { PolicyResult } from "./policy-types";

export function allow(reason?: string): PolicyResult {
  return reason ? { decision: "allow", reason } : { decision: "allow" };
}

export function deny(reason: string): PolicyResult {
  return { decision: "deny", reason };
}

export function instruct(reason: string): PolicyResult {
  return { decision: "instruct", reason };
}

export function isBashTool(toolName: string | undefined): boolean {
  if (!toolName) return true; // Assume shell if tool name is missing
  const lower = toolName.toLowerCase();
  return (
    lower === "bash" ||
    lower === "shell" ||
    lower === "terminal" ||
    lower === "console" ||
    lower.includes("command") ||
    lower === "run_terminal_command" ||
    lower === "sh"
  );
}
