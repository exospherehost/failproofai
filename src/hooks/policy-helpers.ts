/**
 * Shared decision helper functions for builtin and custom policies.
 */
import type { PolicyResult } from "./policy-types";

export function allow(): PolicyResult {
  return { decision: "allow" };
}

export function deny(reason: string): PolicyResult {
  return { decision: "deny", reason };
}

export function instruct(reason: string): PolicyResult {
  return { decision: "instruct", reason };
}
