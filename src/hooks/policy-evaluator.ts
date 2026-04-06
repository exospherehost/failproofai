/**
 * Evaluates enabled policies against a hook event payload.
 * Returns exit code, stdout, and stderr for the hook handler.
 */
import type { HookEventType, SessionMetadata } from "./types";
import type { PolicyContext, HooksConfig } from "./policy-types";
import { BUILTIN_POLICIES } from "./builtin-policies";
import { getPoliciesForEvent } from "./policy-registry";
import { hookLogInfo, hookLogWarn } from "./hook-logger";

export interface EvaluationResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  policyName: string | null;
  reason: string | null;
  decision: "allow" | "deny" | "instruct";
}

// Build a map from policy name to its params schema (for injecting defaults)
const POLICY_PARAMS_MAP = new Map(
  BUILTIN_POLICIES.filter((p) => p.params).map((p) => [p.name, p.params!]),
);

export async function evaluatePolicies(
  eventType: HookEventType,
  payload: Record<string, unknown>,
  session?: SessionMetadata,
  config?: HooksConfig,
): Promise<EvaluationResult> {
  const toolName = payload.tool_name as string | undefined;
  const toolInput = payload.tool_input as Record<string, unknown> | undefined;

  const policies = getPoliciesForEvent(eventType, toolName);

  hookLogInfo(`evaluating ${policies.length} policies for ${eventType}`);

  if (policies.length === 0) {
    return { exitCode: 0, stdout: "", stderr: "", policyName: null, reason: null, decision: "allow" };
  }

  const baseCtx: PolicyContext = {
    eventType,
    payload,
    toolName,
    toolInput,
    session,
  };

  // Track the first instruct result (accumulated, does not short-circuit)
  let instructPolicyName: string | null = null;
  let instructReason: string | null = null;

  for (const policy of policies) {
    // Inject params: merge policyParams[policy.name] over schema defaults
    const schema = POLICY_PARAMS_MAP.get(policy.name);
    let ctx: PolicyContext;
    if (schema) {
      const userParams = config?.policyParams?.[policy.name] ?? {};
      const resolvedParams: Record<string, unknown> = {};
      for (const [key, spec] of Object.entries(schema)) {
        resolvedParams[key] = key in userParams ? userParams[key] : spec.default;
      }
      ctx = { ...baseCtx, params: resolvedParams };
    } else {
      // Custom hooks and policies without schema get empty params
      ctx = { ...baseCtx, params: {} };
    }

    let result: Awaited<ReturnType<typeof policy.fn>>;
    try {
      result = await policy.fn(ctx);
    } catch (err) {
      hookLogWarn(`policy "${policy.name}" threw: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    if (result.decision === "deny") {
      const reason = result.reason ?? `Blocked by policy: ${policy.name}`;
      hookLogInfo(`deny by "${policy.name}": ${reason}`);

      const displayTool = ctx.toolName ?? "unknown tool";

      if (eventType === "PreToolUse") {
        const response = {
          hookSpecificOutput: {
            hookEventName: eventType,
            permissionDecision: "deny",
            permissionDecisionReason: `Blocked ${displayTool} by failproofai because: ${reason}, as per the policy configured by the user`,
          },
        };
        return {
          exitCode: 0,
          stdout: JSON.stringify(response),
          stderr: "",
          policyName: policy.name,
          reason,
          decision: "deny",
        };
      }

      if (eventType === "PostToolUse") {
        const response = {
          hookSpecificOutput: {
            hookEventName: eventType,
            additionalContext: `Blocked ${displayTool} by failproofai because: ${reason}, as per the policy configured by the user`,
          },
        };
        return {
          exitCode: 0,
          stdout: JSON.stringify(response),
          stderr: "",
          policyName: policy.name,
          reason,
          decision: "deny",
        };
      }

      // Other event types: exit 2
      return {
        exitCode: 2,
        stdout: "",
        stderr: "",
        policyName: policy.name,
        reason,
        decision: "deny",
      };
    }

    // Accumulate first instruct (does not short-circuit — later policies can still deny)
    if (result.decision === "instruct" && !instructPolicyName) {
      instructPolicyName = policy.name;
      instructReason = result.reason ?? `Instruction from policy: ${policy.name}`;
      hookLogInfo(`instruct by "${policy.name}": ${instructReason}`);
    }
  }

  // No deny — check if we accumulated an instruct
  if (instructPolicyName && instructReason) {
    if (eventType === "Stop") {
      // Stop hook: exitCode 2 blocks Claude from stopping.
      // Reason goes to stderr so Claude Code receives it as context.
      return {
        exitCode: 2,
        stdout: "",
        stderr: instructReason,
        policyName: instructPolicyName,
        reason: instructReason,
        decision: "instruct",
      };
    }

    const response = {
      hookSpecificOutput: {
        hookEventName: eventType,
        additionalContext: `Instruction from failproofai: ${instructReason}`,
      },
    };
    return {
      exitCode: 0,
      stdout: JSON.stringify(response),
      stderr: "",
      policyName: instructPolicyName,
      reason: instructReason,
      decision: "instruct",
    };
  }

  // All policies allowed
  return { exitCode: 0, stdout: "", stderr: "", policyName: null, reason: null, decision: "allow" };
}
