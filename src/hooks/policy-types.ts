/**
 * Types for the hook policy system.
 */
import type { HookEventType, SessionMetadata, IntegrationType } from "./types";

export type PolicyDecision = "allow" | "deny" | "instruct";

export interface PolicyContext {
  eventType: HookEventType;
  payload: Record<string, unknown>;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  session?: SessionMetadata;
  params?: Record<string, unknown>;
}

export interface PolicyResult {
  decision: PolicyDecision;
  reason?: string;
  message?: string;
}

export type PolicyFunction = (ctx: PolicyContext) => PolicyResult | Promise<PolicyResult>;

export interface PolicyMatcher {
  events?: HookEventType[];
  toolNames?: string[];
}

export interface RegisteredPolicy {
  name: string;
  description: string;
  fn: PolicyFunction;
  match: PolicyMatcher;
  priority: number;
}

export interface PolicyParamsSchema {
  [paramName: string]: {
    type: "string" | "number" | "boolean" | "string[]" | "pattern[]";
    description: string;
    default: unknown;
  };
}

export interface BuiltinPolicyDefinition {
  name: string;
  description: string;
  fn: PolicyFunction;
  match: PolicyMatcher;
  defaultEnabled: boolean;
  category: string;
  beta?: boolean;
  params?: PolicyParamsSchema;
}

export interface CustomHook {
  name: string;
  description?: string;
  match?: {
    events?: HookEventType[];
  };
  fn: (ctx: PolicyContext) => PolicyResult | Promise<PolicyResult>;
}

export interface LlmConfig {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}

export interface CliPoliciesOverride {
  enabledPolicies?: string[];
  disabledPolicies?: string[];
  policyParams?: Record<string, Record<string, unknown>>;
  customPoliciesPath?: string;
}

export interface HooksConfig {
  enabledPolicies: string[];
  llm?: LlmConfig;
  policyParams?: Record<string, Record<string, unknown>>;
  customPoliciesPath?: string;
  cli?: Partial<Record<IntegrationType, CliPoliciesOverride>>;
}
