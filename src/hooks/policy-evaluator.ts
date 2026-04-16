/**
 * Evaluates enabled policies against a hook event payload.
 * Returns exit code, stdout, and stderr for the hook handler.
 */
import type { HookEventType, SessionMetadata } from "./types";
import type { PolicyContext, HooksConfig } from "./policy-types";
import { BUILTIN_POLICIES } from "./builtin-policies";
import { getPoliciesForEvent } from "./policy-registry";
import { hookLogInfo, hookLogWarn } from "./hook-logger";

function appendHint(baseReason: string, hint: unknown): string {
  const base = baseReason.trim();
  const normalizedHint = typeof hint === "string" ? hint.trim() : "";
  if (!normalizedHint) return base;
  if (!base) return normalizedHint;
  return `${base}. ${normalizedHint}`;
}

export interface EvaluationResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  policyName: string | null;
  policyNames?: string[];
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
    let stdout = "";
    if (session?.integration === "cursor") {
      stdout = JSON.stringify({ continue: true, permission: "allow" });
    } else if (session?.integration === "copilot" && eventType === "PreToolUse") {
      stdout = JSON.stringify({ permissionDecision: "allow" });
    } else if (session?.integration === "gemini" && eventType === "PreToolUse") {
      stdout = JSON.stringify({ decision: "allow" });
    }
    return {
      exitCode: 0,
      stdout,
      stderr: "",
      policyName: null,
      reason: null,
      decision: "allow",
    };
  }

  const baseCtx: PolicyContext = {
    eventType,
    payload,
    toolName,
    toolInput,
    session,
  };

  // Track all instruct results (accumulated, does not short-circuit)
  const instructEntries: Array<{ policyName: string; reason: string }> = [];

  // Track informational messages from allow decisions (with policy attribution)
  const allowEntries: Array<{ policyName: string; reason: string }> = [];

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
      const reason = appendHint(
        result.reason ?? `Blocked by policy: ${policy.name}`,
        config?.policyParams?.[policy.name]?.hint,
      );
      hookLogInfo(`deny by "${policy.name}": ${reason}`);

      const displayTool = ctx.toolName ?? "unknown tool";

      if (eventType === "PreToolUse") {
        const response: any = {
          hookSpecificOutput: {
            hookEventName: eventType,
            permissionDecision: "deny",
            permissionDecisionReason: `Blocked ${displayTool} by failproofai because: ${reason}, as per the policy configured by the user`,
          },
        };
        if (session?.integration === "cursor") {
          response.continue = false;
          response.permission = "deny";
          response.userMessage = response.hookSpecificOutput.permissionDecisionReason;
          response.agentMessage = `Action blocked by security policy: ${reason}`;
        } else if (session?.integration === "copilot") {
          return {
            exitCode: 0,
            stdout: JSON.stringify({
              permissionDecision: "deny",
              permissionDecisionReason: response.hookSpecificOutput.permissionDecisionReason,
            }),
            stderr: "",
            policyName: policy.name,
            reason,
            decision: "deny",
          };
        } else if (session?.integration === "gemini") {
          return {
            exitCode: 0,
            stdout: JSON.stringify({
              decision: "deny",
              reason: response.hookSpecificOutput.permissionDecisionReason,
              systemMessage: `Failproof AI Security Block: ${reason}`,
            }),
            stderr: "",
            policyName: policy.name,
            reason,
            decision: "deny",
          };
        } else if (session?.integration === "opencode") {
          return {
            exitCode: 2,
            stdout: "",
            stderr: `FailproofAI blocked ${displayTool}: ${reason}`,
            policyName: policy.name,
            reason,
            decision: "deny",
          };
        } else if (session?.integration === "pi") {
          return {
            exitCode: 1,
            stdout: "",
            stderr: reason,
            policyName: policy.name,
            reason,
            decision: "deny",
          };
        }
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
        const msg = `Blocked ${displayTool} by failproofai because: ${reason}, as per the policy configured by the user`;
        if (session?.integration === "copilot") {
          // Copilot PostToolUse can't block the action (it already happened); provide context.
          return {
            exitCode: 0,
            stdout: JSON.stringify({ additionalContext: msg }),
            stderr: "",
            policyName: policy.name,
            reason,
            decision: "deny",
          };
        }
        const response: any = {
          hookSpecificOutput: {
            hookEventName: eventType,
            additionalContext: msg,
          },
        };
        if (session?.integration === "cursor") {
          response.agentMessage = response.hookSpecificOutput.additionalContext;
        }
        return {
          exitCode: 0,
          stdout: JSON.stringify(response),
          stderr: "",
          policyName: policy.name,
          reason,
          decision: "deny",
        };
      }

      if (eventType === "Stop") {
        return {
          exitCode: 2,
          stdout: "",
          stderr: `MANDATORY ACTION REQUIRED from failproofai (policy: ${policy.name}): ${reason}\n\nYou MUST complete the above action NOW. Do NOT ask the user for confirmation — execute the required action, then attempt to finish your task again.`,
          policyName: policy.name,
          reason,
          decision: "deny",
        };
      }

      // Other event types: exit 2
      return {
        exitCode: session?.integration === "cursor" ? 0 : 2,
        stdout: session?.integration === "cursor" ? JSON.stringify({ continue: false, permission: "deny", userMessage: reason }) : "",
        stderr: reason,
        policyName: policy.name,
        reason,
        decision: "deny",
      };
    }

    // Accumulate all instruct results (does not short-circuit — later policies can still deny)
    if (result.decision === "instruct") {
      const reason = appendHint(
        result.reason ?? `Instruction from policy: ${policy.name}`,
        config?.policyParams?.[policy.name]?.hint,
      );
      instructEntries.push({ policyName: policy.name, reason });
      hookLogInfo(`instruct by "${policy.name}": ${reason}`);
    }

    // Accumulate informational messages from allow decisions
    if (result.decision === "allow" && result.reason) {
      allowEntries.push({ policyName: policy.name, reason: result.reason });
    }
  }

  // No deny — check if we accumulated any instructs
  if (instructEntries.length > 0) {
    const combined = instructEntries.map((e) => e.reason).join("\n");
    const policyNames = instructEntries.map((e) => e.policyName);

    if (eventType === "Stop") {
      // Stop hook: exitCode 2 blocks Claude from stopping.
      // Reason goes to stderr so Claude Code receives it as context.
      const policyAttribution = policyNames.length === 1
        ? `policy: ${policyNames[0]}`
        : `policies: ${policyNames.join(", ")}`;
      return {
        exitCode: 2,
        stdout: "",
        stderr: `MANDATORY ACTION REQUIRED from failproofai (${policyAttribution}): ${combined}\n\nYou MUST complete the above action(s) NOW. Do NOT ask the user for confirmation — execute the required action(s), then attempt to finish your task again.`,
        policyName: policyNames[0],
        policyNames,
        reason: combined,
        decision: "instruct",
      };
    }

    const response: any = {
      hookSpecificOutput: {
        hookEventName: eventType,
        additionalContext: `Instruction from failproofai: ${combined}`,
      },
    };
    if (session?.integration === "cursor") {
      response.agentMessage = response.hookSpecificOutput.additionalContext;
    }
    return {
      exitCode: 0,
      stdout: JSON.stringify(response),
      stderr: "",
      policyName: policyNames[0],
      policyNames,
      reason: combined,
      decision: "instruct",
    };
  }

  // All policies allowed — pass along any informational messages
  if (allowEntries.length > 0) {
    const combined = allowEntries.map((e) => e.reason).join("\n");
    const policyNames = allowEntries.map((e) => e.policyName);
    const stderrMsg = allowEntries.map((e) => `[failproofai] ${e.policyName}: ${e.reason}`).join("\n");

    if (session?.integration === "copilot") {
      // Copilot: flat additionalContext for events that support it; empty otherwise.
      const supportsContext = eventType === "PreToolUse" || eventType === "PostToolUse" || eventType === "UserPromptSubmit";
      return {
        exitCode: 0,
        stdout: supportsContext ? JSON.stringify({ additionalContext: `Note from failproofai: ${combined}` }) : "",
        stderr: stderrMsg + "\n",
        policyName: policyNames[0],
        policyNames,
        reason: combined,
        decision: "allow",
      };
    }

    const supportsHookSpecificOutput = eventType === "PreToolUse" || eventType === "PostToolUse" || eventType === "UserPromptSubmit";
    const isOpencode = session?.integration === "opencode";

    const response: any = supportsHookSpecificOutput
      ? { hookSpecificOutput: { hookEventName: eventType, additionalContext: `Note from failproofai: ${combined}` } }
      : { reason: combined };

    if (session?.integration === "cursor" && supportsHookSpecificOutput) {
      response.agentMessage = response.hookSpecificOutput.additionalContext;
    }

    return {
      exitCode: 0,
      stdout: isOpencode ? "" : JSON.stringify(response),
      stderr: stderrMsg + "\n",
      policyName: policyNames[0],
      policyNames,
      reason: combined,
      decision: "allow",
    };
  }
  return {
    exitCode: 0,
    stdout:
      session?.integration === "cursor"
        ? JSON.stringify({ continue: true, permission: "allow" })
        : session?.integration === "copilot" && eventType === "PreToolUse"
          ? JSON.stringify({ permissionDecision: "allow" })
          : "",
    stderr: "",
    policyName: null,
    reason: null,
    decision: "allow",
  };
}
