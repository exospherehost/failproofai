// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { evaluatePolicies } from "../../src/hooks/policy-evaluator";
import { registerPolicy, clearPolicies } from "../../src/hooks/policy-registry";

describe("hooks/policy-evaluator", () => {
  beforeEach(() => {
    clearPolicies();
  });

  it("returns allow (exit 0, no stdout) when no policies match", async () => {
    const result = await evaluatePolicies("PreToolUse", { tool_name: "Read" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.policyName).toBeNull();
    expect(result.reason).toBeNull();
  });

  it("returns allow when all policies allow", async () => {
    registerPolicy("allow1", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] });
    registerPolicy("allow2", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] });
    const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.policyName).toBeNull();
    expect(result.reason).toBeNull();
  });

  it("deny short-circuits — first deny wins for PreToolUse", async () => {
    registerPolicy("blocker", "desc", () => ({ decision: "deny", reason: "blocked" }), {
      events: ["PreToolUse"],
    });
    registerPolicy("allow", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] });

    const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash", tool_input: { command: "ls" } });
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    const parsed = JSON.parse(result.stdout);
    expect(parsed.hookSpecificOutput.permissionDecision).toBe("deny");
    expect(parsed.hookSpecificOutput.permissionDecisionReason).toBe(
      "Blocked Bash by failproofai because: blocked, as per the policy configured by the user",
    );
    expect(parsed.hookSpecificOutput.hookEventName).toBe("PreToolUse");
    expect(result.policyName).toBe("blocker");
    expect(result.reason).toBe("blocked");
  });

  it("formats PostToolUse deny with additionalContext", async () => {
    registerPolicy("jwt-scrub", "desc", () => ({
      decision: "deny",
      reason: "JWT found",
      message: "[REDACTED]",
    }), { events: ["PostToolUse"] });

    const result = await evaluatePolicies("PostToolUse", { tool_name: "Read" });
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    const parsed = JSON.parse(result.stdout);
    expect(parsed.hookSpecificOutput.hookEventName).toBe("PostToolUse");
    expect(parsed.hookSpecificOutput.additionalContext).toBe(
      "Blocked Read by failproofai because: JWT found, as per the policy configured by the user",
    );
    expect(result.policyName).toBe("jwt-scrub");
    expect(result.reason).toBe("JWT found");
  });

  it("other event types use exit 2 for deny", async () => {
    registerPolicy("blocker", "desc", () => ({ decision: "deny", reason: "nope" }), {
      events: ["SessionStart"],
    });

    const result = await evaluatePolicies("SessionStart", {});
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
    expect(result.reason).toBe("nope");
  });

  it("passes toolName and toolInput from payload to policy context", async () => {
    let capturedCtx: unknown = null;
    registerPolicy("spy", "desc", (ctx) => {
      capturedCtx = ctx;
      return { decision: "allow" };
    }, { events: ["PreToolUse"] });

    await evaluatePolicies("PreToolUse", {
      tool_name: "Bash",
      tool_input: { command: "ls" },
    });

    const ctx = capturedCtx as { toolName: string; toolInput: { command: string } };
    expect(ctx.toolName).toBe("Bash");
    expect(ctx.toolInput.command).toBe("ls");
  });

  it("supports async policy functions", async () => {
    registerPolicy("async-deny", "desc", async () => {
      return { decision: "deny", reason: "async block" };
    }, { events: ["PreToolUse"] });

    const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" });
    const parsed = JSON.parse(result.stdout);
    expect(parsed.hookSpecificOutput.permissionDecision).toBe("deny");
  });

  it("instruct produces additionalContext in stdout with exit code 0", async () => {
    registerPolicy("advisor", "desc", () => ({
      decision: "instruct",
      reason: "You should try something else",
    }), { events: ["PreToolUse"] });

    const result = await evaluatePolicies("PreToolUse", { tool_name: "Read" });
    expect(result.exitCode).toBe(0);
    expect(result.decision).toBe("instruct");
    const parsed = JSON.parse(result.stdout);
    expect(parsed.hookSpecificOutput.additionalContext).toContain("You should try something else");
    expect(result.policyName).toBe("advisor");
    expect(result.reason).toBe("You should try something else");
  });

  it("deny takes precedence over instruct", async () => {
    registerPolicy("advisor", "desc", () => ({
      decision: "instruct",
      reason: "just a warning",
    }), { events: ["PreToolUse"] });
    registerPolicy("blocker", "desc", () => ({
      decision: "deny",
      reason: "hard block",
    }), { events: ["PreToolUse"] });

    const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" });
    expect(result.decision).toBe("deny");
    expect(result.policyName).toBe("blocker");
    const parsed = JSON.parse(result.stdout);
    expect(parsed.hookSpecificOutput.permissionDecision).toBe("deny");
  });

  it("EvaluationResult.decision is 'allow' when all allow", async () => {
    registerPolicy("ok", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] });
    const result = await evaluatePolicies("PreToolUse", { tool_name: "Read" });
    expect(result.decision).toBe("allow");
    expect(result.stdout).toBe("");
  });

  it("skips a policy that throws and continues to allow", async () => {
    registerPolicy("thrower", "desc", () => { throw new Error("unexpected failure"); }, { events: ["PreToolUse"] });
    registerPolicy("ok", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] });

    const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" });
    expect(result.exitCode).toBe(0);
    expect(result.decision).toBe("allow");
  });

  it("skips an async policy that rejects and continues to allow", async () => {
    registerPolicy("async-thrower", "desc", async () => { throw new Error("async failure"); }, { events: ["PreToolUse"] });

    const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" });
    expect(result.exitCode).toBe(0);
    expect(result.decision).toBe("allow");
  });

  it("Stop + instruct returns exitCode 2 with reason in stderr", async () => {
    registerPolicy("verify", "desc", () => ({
      decision: "instruct",
      reason: "Unsatisfied intents remain",
    }), { events: ["Stop"] });

    const result = await evaluatePolicies("Stop", {});
    expect(result.exitCode).toBe(2);
    expect(result.decision).toBe("instruct");
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("Unsatisfied intents remain");
    expect(result.policyName).toBe("verify");
  });

  it("first instruct wins when multiple policies instruct", async () => {
    registerPolicy("first", "desc", () => ({
      decision: "instruct",
      reason: "first warning",
    }), { events: ["PreToolUse"] });
    registerPolicy("second", "desc", () => ({
      decision: "instruct",
      reason: "second warning",
    }), { events: ["PreToolUse"] });

    const result = await evaluatePolicies("PreToolUse", { tool_name: "Read" });
    expect(result.decision).toBe("instruct");
    expect(result.policyName).toBe("first");
    expect(result.reason).toBe("first warning");
  });

  describe("allow with message", () => {
    it("returns additionalContext when allow has a reason", async () => {
      registerPolicy("info", "desc", () => ({
        decision: "allow",
        reason: "All checks passed",
      }), { events: ["PreToolUse"] });

      const result = await evaluatePolicies("PreToolUse", { tool_name: "Read" });
      expect(result.exitCode).toBe(0);
      expect(result.decision).toBe("allow");
      expect(result.reason).toBe("All checks passed");
      const parsed = JSON.parse(result.stdout);
      expect(parsed.hookSpecificOutput.additionalContext).toBe("All checks passed");
    });

    it("combines multiple allow messages with newline", async () => {
      registerPolicy("info1", "desc", () => ({
        decision: "allow",
        reason: "Commit check passed",
      }), { events: ["Stop"] });
      registerPolicy("info2", "desc", () => ({
        decision: "allow",
        reason: "Push check passed",
      }), { events: ["Stop"] });

      const result = await evaluatePolicies("Stop", {});
      expect(result.exitCode).toBe(0);
      expect(result.decision).toBe("allow");
      const parsed = JSON.parse(result.stdout);
      expect(parsed.hookSpecificOutput.additionalContext).toBe("Commit check passed\nPush check passed");
    });

    it("returns empty stdout when allow has no reason (backward-compatible)", async () => {
      registerPolicy("ok", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] });

      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("");
      expect(result.reason).toBeNull();
    });

    it("deny still takes precedence over allow with message", async () => {
      registerPolicy("info", "desc", () => ({
        decision: "allow",
        reason: "looks good",
      }), { events: ["PreToolUse"] });
      registerPolicy("blocker", "desc", () => ({
        decision: "deny",
        reason: "blocked",
      }), { events: ["PreToolUse"] });

      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" });
      expect(result.decision).toBe("deny");
      expect(result.policyName).toBe("blocker");
    });

    it("instruct takes precedence over allow with message", async () => {
      registerPolicy("info", "desc", () => ({
        decision: "allow",
        reason: "looks good",
      }), { events: ["PreToolUse"] });
      registerPolicy("advisor", "desc", () => ({
        decision: "instruct",
        reason: "be careful",
      }), { events: ["PreToolUse"] });

      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" });
      expect(result.decision).toBe("instruct");
      expect(result.policyName).toBe("advisor");
    });
  });

  describe("params injection", () => {
    it("injects schema defaults into ctx.params when no policyParams in config", async () => {
      let capturedParams: unknown = null;
      // Use BUILTIN_POLICIES to get a real policy with a params schema
      const { BUILTIN_POLICIES } = await import("../../src/hooks/builtin-policies");
      const orig = BUILTIN_POLICIES.find((p) => p.name === "block-sudo")!;

      // Wrap the original fn to capture params
      registerPolicy("block-sudo", orig.description, async (ctx) => {
        capturedParams = ctx.params;
        return { decision: "allow" };
      }, orig.match);

      await evaluatePolicies("PreToolUse", { tool_name: "Bash", tool_input: { command: "ls" } }, undefined, { enabledPolicies: ["block-sudo"] });

      expect(capturedParams).toBeDefined();
      expect((capturedParams as Record<string, unknown>).allowPatterns).toEqual([]);
    });

    it("overrides schema defaults with policyParams from config", async () => {
      let capturedParams: unknown = null;
      const { BUILTIN_POLICIES } = await import("../../src/hooks/builtin-policies");
      const orig = BUILTIN_POLICIES.find((p) => p.name === "block-sudo")!;

      registerPolicy("block-sudo", orig.description, async (ctx) => {
        capturedParams = ctx.params;
        return { decision: "allow" };
      }, orig.match);

      const config = {
        enabledPolicies: ["block-sudo"],
        policyParams: { "block-sudo": { allowPatterns: ["sudo systemctl status"] } },
      };
      await evaluatePolicies("PreToolUse", { tool_name: "Bash", tool_input: { command: "ls" } }, undefined, config);

      expect((capturedParams as Record<string, unknown>).allowPatterns).toEqual(["sudo systemctl status"]);
    });

    it("unknown policyParams key does not crash evaluator", async () => {
      registerPolicy("allow-all", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] });

      const config = {
        enabledPolicies: ["allow-all"],
        policyParams: { "nonexistent-policy": { someParam: 42 } },
      };
      await expect(
        evaluatePolicies("PreToolUse", { tool_name: "Bash" }, undefined, config),
      ).resolves.not.toThrow();
    });

    it("custom hooks registered with custom/ prefix receive empty params", async () => {
      let capturedParams: unknown = undefined;
      registerPolicy("custom/my-hook", "custom", async (ctx) => {
        capturedParams = ctx.params;
        return { decision: "allow" };
      }, { events: ["PreToolUse"] }, -1);

      await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, undefined, { enabledPolicies: [] });

      // Custom hooks get empty params object
      expect(capturedParams).toEqual({});
    });
  });
});
