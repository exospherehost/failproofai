// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
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
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("[FailproofAI Security Stop]");
    expect(result.stderr).toContain("Blocked");
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
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("[FailproofAI Security Stop]");
    expect(result.stderr).toContain("JWT found");
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
    expect(result.stderr).toContain("[FailproofAI Security Stop]");
    expect(result.stderr).toContain("Nope");
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
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
  });

  it("instruct produces additionalContext in stdout with exit code 0", async () => {
    registerPolicy("advisor", "desc", () => ({
      decision: "instruct",
      reason: "You should try something else",
    }), { events: ["PreToolUse"] });

    const result = await evaluatePolicies("PreToolUse", { tool_name: "Read" });
    expect(result.exitCode).toBe(0);
    expect(result.decision).toBe("instruct");
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("You should try something else");
    expect(result.policyName).toBe("advisor");
    expect(result.policyNames).toEqual(["advisor"]);
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
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
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
    expect(result.stderr).toContain("[FailproofAI Security Stop]");
    expect(result.stderr).toContain("Unsatisfied intents remain");
    expect(result.policyName).toBe("verify");
  });

  it("accumulates multiple instruct messages", async () => {
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
    expect(result.policyNames).toEqual(["first", "second"]);
    expect(result.reason).toBe("first warning\nsecond warning");
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("first warning");
    expect(result.stderr).toContain("second warning");
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
      expect(result.policyName).toBe("info");
      expect(result.policyNames).toEqual(["info"]);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("[FailproofAI] info: All checks passed");
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
      expect(result.policyName).toBe("info1");
      expect(result.policyNames).toEqual(["info1", "info2"]);
      expect(result.stdout).toBe("");
      expect(result.reason).toBe("Commit check passed\nPush check passed");
      expect(result.stderr).toContain("[FailproofAI] info1: Commit check passed");
      expect(result.stderr).toContain("[FailproofAI] info2: Push check passed");
    });

    it("returns empty stdout when allow has no reason (backward-compatible)", async () => {
      registerPolicy("ok", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] });

      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("");
      expect(result.stderr).toBe("");
      expect(result.reason).toBeNull();
      expect(result.policyName).toBeNull();
      expect(result.policyNames).toBeUndefined();
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
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, undefined, config);
      expect(result).toBeDefined();
      expect(result.decision).toBe("allow");
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

  describe("Stop event deny format", () => {
    it("Stop deny uses exit code 2 with reason in stderr", async () => {
      registerPolicy("stop-blocker", "desc", () => ({
        decision: "deny",
        reason: "changes not committed",
      }), { events: ["Stop"] });

      const result = await evaluatePolicies("Stop", {});
      expect(result.exitCode).toBe(2);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("[FailproofAI Security Stop]");
      expect(result.stderr).toContain("Changes not committed");
      expect(result.decision).toBe("deny");
      expect(result.reason).toBe("changes not committed");
    });

    it("Stop deny short-circuits subsequent policies", async () => {
      const secondPolicyCalled = { value: false };
      registerPolicy("blocker", "desc", () => ({
        decision: "deny",
        reason: "blocked first",
      }), { events: ["Stop"] });
      registerPolicy("second", "desc", () => {
        secondPolicyCalled.value = true;
        return { decision: "allow" };
      }, { events: ["Stop"] });

      await evaluatePolicies("Stop", {});
      expect(secondPolicyCalled.value).toBe(false);
    });
  });

  describe("workflow policy chain integration", () => {
    it("first deny short-circuits — later workflow policies do not run", async () => {
      const policyCalls: string[] = [];

      registerPolicy("require-commit", "desc", () => {
        policyCalls.push("commit");
        return { decision: "deny", reason: "uncommitted changes" };
      }, { events: ["Stop"] });
      registerPolicy("require-push", "desc", () => {
        policyCalls.push("push");
        return { decision: "deny", reason: "unpushed commits" };
      }, { events: ["Stop"] });
      registerPolicy("require-pr", "desc", () => {
        policyCalls.push("pr");
        return { decision: "deny", reason: "no PR" };
      }, { events: ["Stop"] });

      const result = await evaluatePolicies("Stop", {});
      expect(result.decision).toBe("deny");
      expect(result.policyName).toBe("require-commit");
      expect(policyCalls).toEqual(["commit"]);
    });

    it("all workflow policies allow with messages — messages accumulate", async () => {
      registerPolicy("wf-commit", "desc", () => ({
        decision: "allow",
        reason: "All changes committed",
      }), { events: ["Stop"] });
      registerPolicy("wf-push", "desc", () => ({
        decision: "allow",
        reason: "All commits pushed",
      }), { events: ["Stop"] });
      registerPolicy("wf-pr", "desc", () => ({
        decision: "allow",
        reason: "PR #42 exists",
      }), { events: ["Stop"] });
      registerPolicy("wf-ci", "desc", () => ({
        decision: "allow",
        reason: "All CI checks passed",
      }), { events: ["Stop"] });

      const result = await evaluatePolicies("Stop", {});
      expect(result.exitCode).toBe(0);
      expect(result.decision).toBe("allow");
      expect(result.policyNames).toEqual(["wf-commit", "wf-push", "wf-pr", "wf-ci"]);
      expect(result.stdout).toBe("");
      expect(result.reason).toContain("All changes committed");
      expect(result.reason).toContain("All commits pushed");
      expect(result.reason).toContain("PR #42 exists");
      expect(result.reason).toContain("All CI checks passed");
    });

    it("allow messages from early policies are discarded when a later policy denies", async () => {
      registerPolicy("wf-commit", "desc", () => ({
        decision: "allow",
        reason: "All changes committed",
      }), { events: ["Stop"] });
      registerPolicy("wf-push", "desc", () => ({
        decision: "deny",
        reason: "unpushed commits",
      }), { events: ["Stop"] });

      const result = await evaluatePolicies("Stop", {});
      expect(result.decision).toBe("deny");
      expect(result.policyName).toBe("wf-push");
      expect(result.reason).toBe("unpushed commits");
    });

    it("instruct on Stop takes precedence over allow messages", async () => {
      registerPolicy("wf-commit", "desc", () => ({
        decision: "allow",
        reason: "All committed",
      }), { events: ["Stop"] });
      registerPolicy("wf-instruct", "desc", () => ({
        decision: "instruct",
        reason: "Please verify tests",
      }), { events: ["Stop"] });

      const result = await evaluatePolicies("Stop", {});
      expect(result.decision).toBe("instruct");
      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("[FailproofAI Security Stop]");
      expect(result.stderr).toContain("Please verify tests");
    });

    it("mixed allow (no message) and allow (with message) — only messages returned", async () => {
      registerPolicy("silent", "desc", () => ({
        decision: "allow",
      }), { events: ["Stop"] });
      registerPolicy("informative", "desc", () => ({
        decision: "allow",
        reason: "CI is green",
      }), { events: ["Stop"] });

      const result = await evaluatePolicies("Stop", {});
      expect(result.exitCode).toBe(0);
      expect(result.decision).toBe("allow");
      expect(result.policyName).toBe("informative");
      expect(result.policyNames).toEqual(["informative"]);
      expect(result.stdout).toBe("");
      expect(result.reason).toBe("CI is green");
    });

    it("policy that throws is skipped — subsequent policies still run", async () => {
      registerPolicy("thrower", "desc", () => {
        throw new Error("unexpected crash");
      }, { events: ["Stop"] });
      registerPolicy("checker", "desc", () => ({
        decision: "deny",
        reason: "uncommitted",
      }), { events: ["Stop"] });

      const result = await evaluatePolicies("Stop", {});
      expect(result.decision).toBe("deny");
      expect(result.policyName).toBe("checker");
    });
  });

  describe("hint appending", () => {
    it("appends hint to deny reason for PreToolUse", async () => {
      registerPolicy("block-force-push", "desc", () => ({
        decision: "deny",
        reason: "Force-pushing is blocked",
      }), { events: ["PreToolUse"] });

      const config = {
        enabledPolicies: ["block-force-push"],
        policyParams: { "block-force-push": { hint: "Try creating a fresh branch instead." } },
      };
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash", tool_input: { command: "git push --force" } }, undefined, config);
      expect(result.decision).toBe("deny");
      expect(result.reason).toBe("Force-pushing is blocked. Try creating a fresh branch instead.");
      expect(result.exitCode).toBe(2);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Try creating a fresh branch instead.");
    });

    it("appends hint to deny reason for PostToolUse", async () => {
      registerPolicy("scrubber", "desc", () => ({
        decision: "deny",
        reason: "Secret detected",
      }), { events: ["PostToolUse"] });

      const config = {
        enabledPolicies: ["scrubber"],
        policyParams: { scrubber: { hint: "Remove the secret before retrying." } },
      };
      const result = await evaluatePolicies("PostToolUse", { tool_name: "Bash" }, undefined, config);
      expect(result.decision).toBe("deny");
      expect(result.reason).toBe("Secret detected. Remove the secret before retrying.");
      expect(result.exitCode).toBe(2);
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Remove the secret before retrying.");
    });

    it("appends hint to deny reason for other event types (exit 2)", async () => {
      registerPolicy("blocker", "desc", () => ({
        decision: "deny",
        reason: "nope",
      }), { events: ["SessionStart"] });

      const config = {
        enabledPolicies: ["blocker"],
        policyParams: { blocker: { hint: "Ask admin for access." } },
      };
      const result = await evaluatePolicies("SessionStart", {}, undefined, config);
      expect(result.exitCode).toBe(2);
      expect(result.reason).toBe("nope. Ask admin for access.");
      expect(result.stderr).toContain("[FailproofAI Security Stop]");
      expect(result.stderr).toContain("Nope. Ask admin for access.");
    });

    it("appends hint to instruct reason", async () => {
      registerPolicy("advisor", "desc", () => ({
        decision: "instruct",
        reason: "Large file detected",
      }), { events: ["PreToolUse"] });

      const config = {
        enabledPolicies: ["advisor"],
        policyParams: { advisor: { hint: "Consider splitting into smaller files." } },
      };
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Write" }, undefined, config);
      expect(result.decision).toBe("instruct");
      expect(result.reason).toBe("Large file detected. Consider splitting into smaller files.");
      expect(result.stdout).toBe("");
      expect(result.stderr).toContain("Consider splitting into smaller files.");
    });

    it("appends hint to instruct reason on Stop event", async () => {
      registerPolicy("verify", "desc", () => ({
        decision: "instruct",
        reason: "Unsatisfied intents",
      }), { events: ["Stop"] });

      const config = {
        enabledPolicies: ["verify"],
        policyParams: { verify: { hint: "Run the test suite first." } },
      };
      const result = await evaluatePolicies("Stop", {}, undefined, config);
      expect(result.exitCode).toBe(2);
      expect(result.decision).toBe("instruct");
      expect(result.reason).toBe("Unsatisfied intents. Run the test suite first.");
      expect(result.stderr).toContain("[FailproofAI Security Stop]");
      expect(result.stderr).toContain("Unsatisfied intents. Run the test suite first.");
    });

    it("does not alter reason when no hint is configured", async () => {
      registerPolicy("blocker", "desc", () => ({
        decision: "deny",
        reason: "blocked",
      }), { events: ["PreToolUse"] });

      const config = { enabledPolicies: ["blocker"] };
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, undefined, config);
      expect(result.reason).toBe("blocked");
    });

    it("does not alter reason when policyParams has no hint key", async () => {
      registerPolicy("blocker", "desc", () => ({
        decision: "deny",
        reason: "blocked",
      }), { events: ["PreToolUse"] });

      const config = {
        enabledPolicies: ["blocker"],
        policyParams: { blocker: { someOtherParam: "value" } },
      };
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, undefined, config);
      expect(result.reason).toBe("blocked");
    });

    it("ignores hint when it is not a string (number)", async () => {
      registerPolicy("blocker", "desc", () => ({
        decision: "deny",
        reason: "blocked",
      }), { events: ["PreToolUse"] });

      const config = {
        enabledPolicies: ["blocker"],
        policyParams: { blocker: { hint: 123 } },
      };
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, undefined, config);
      expect(result.reason).toBe("blocked");
    });

    it("ignores hint when it is an empty string", async () => {
      registerPolicy("blocker", "desc", () => ({
        decision: "deny",
        reason: "blocked",
      }), { events: ["PreToolUse"] });

      const config = {
        enabledPolicies: ["blocker"],
        policyParams: { blocker: { hint: "" } },
      };
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, undefined, config);
      expect(result.reason).toBe("blocked");
    });

    it("works with custom/ prefixed policy names", async () => {
      registerPolicy("custom/my-hook", "custom", () => ({
        decision: "deny",
        reason: "custom block",
      }), { events: ["PreToolUse"] }, -1);

      const config = {
        enabledPolicies: [],
        policyParams: { "custom/my-hook": { hint: "Ask the user for approval." } },
      };
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, undefined, config);
      expect(result.reason).toBe("custom block. Ask the user for approval.");
    });

    it("works with .failproofai-project/ prefixed policy names", async () => {
      registerPolicy(".failproofai-project/my-policy", "convention", () => ({
        decision: "deny",
        reason: "convention block",
      }), { events: ["PreToolUse"] }, -1);

      const config = {
        enabledPolicies: [],
        policyParams: { ".failproofai-project/my-policy": { hint: "Check project CLAUDE.md." } },
      };
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, undefined, config);
      expect(result.reason).toBe("convention block. Check project CLAUDE.md.");
    });

    it("hint on instruct does not affect subsequent deny", async () => {
      registerPolicy("advisor", "desc", () => ({
        decision: "instruct",
        reason: "heads up",
      }), { events: ["PreToolUse"] });
      registerPolicy("blocker", "desc", () => ({
        decision: "deny",
        reason: "hard block",
      }), { events: ["PreToolUse"] });

      const config = {
        enabledPolicies: ["advisor", "blocker"],
        policyParams: {
          advisor: { hint: "instruct hint" },
          blocker: { hint: "deny hint" },
        },
      };
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, undefined, config);
      // Deny still takes precedence
      expect(result.decision).toBe("deny");
      expect(result.reason).toBe("hard block. deny hint");
    });
  });

  describe("integration-specific specialized paths", () => {
    beforeEach(() => {
      clearPolicies();
      registerPolicy("blocker", "desc", () => ({ decision: "deny", reason: "forbidden" }), { events: ["PreToolUse"] });
    });

    it("uses original Claude style for claude-code integration", async () => {
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, { integration: "claude-code" });
      expect(result.exitCode).toBe(2);
      expect(result.stderr).toBe("[FailproofAI] blocker: Forbidden");
    });

    it("uses high-authority style and flags hard stop for gemini integration", async () => {
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, { integration: "gemini", hookEventName: "BeforeTool" });

      // Gemini expects Exit 0 for clean JSON denial parsing
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain("MANDATORY ACTION REQUIRED from FailproofAI");
      expect(result.hardStop).toBe(false); // Turn-level stop is non-destructive

      // Verify Real Deny JSON for Gemini (BeforeTool: turn continues, no continue: false)
      const parsed = JSON.parse(result.stdout);
      expect(parsed.decision).toBe("deny");
      expect(parsed.continue).toBeUndefined(); // continue: false removed — agent explains block to user
      expect(parsed.systemMessage).toContain("MANDATORY ACTION REQUIRED from FailproofAI");
      expect(parsed.reason).toContain("[FailproofAI policy: blocker]"); // concise agent-facing reason
      expect(parsed.reason).not.toContain("MANDATORY ACTION REQUIRED"); // reason ≠ systemMessage
    });

    it("Gemini AfterAgent (Stop) includes continue: false; BeforeTool does not", async () => {
      const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");
      const { registerPolicy, clearPolicies } = await import("../../src/hooks/policy-registry");

      clearPolicies();
      registerPolicy("gate", "desc", () => ({ decision: "deny", reason: "not ready" }), {
        events: ["Stop", "PreToolUse"],
      });

      // AfterAgent → Stop: continue: false IS expected (spec: triggers retry with reason as new prompt)
      const stopResult = await evaluatePolicies("Stop", {}, { integration: "gemini", hookEventName: "AfterAgent" });
      expect(stopResult.exitCode).toBe(0);
      const stopJson = JSON.parse(stopResult.stdout);
      expect(stopJson.continue).toBe(false);
      expect(stopJson.decision).toBe("deny");

      // BeforeTool → PreToolUse: continue: false must NOT be present (turn continues, agent explains)
      const toolResult = await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, { integration: "gemini", hookEventName: "BeforeTool" });
      expect(toolResult.exitCode).toBe(0);
      const toolJson = JSON.parse(toolResult.stdout);
      expect(toolJson.continue).toBeUndefined();
      expect(toolJson.decision).toBe("deny");
    });

    it("Gemini BeforeToolSelection falls back to exit code 2 (spec: no decision field)", async () => {
      const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");
      const { registerPolicy, clearPolicies } = await import("../../src/hooks/policy-registry");

      clearPolicies();
      registerPolicy("gate", "desc", () => ({ decision: "deny", reason: "blocked" }), {
        events: ["PreToolUse"],
      });

      const result = await evaluatePolicies(
        "PreToolUse",
        { tool_name: "Bash" },
        { integration: "gemini", hookEventName: "BeforeToolSelection" },
      );
      expect(result.exitCode).toBe(2); // stdout empty → exit code 2
      expect(result.stdout).toBe("");  // no JSON: spec says decision field is unsupported
      expect(result.stderr).toContain("MANDATORY ACTION REQUIRED from FailproofAI");
    });

    it("Gemini deny reason (agent-facing) is concise and distinct from systemMessage (terminal-facing)", async () => {
      const result = await evaluatePolicies(
        "PreToolUse",
        { tool_name: "Bash" },
        { integration: "gemini", hookEventName: "BeforeTool" },
      );
      const parsed = JSON.parse(result.stdout);

      expect(parsed.systemMessage).toContain("MANDATORY ACTION REQUIRED from FailproofAI");
      expect(parsed.systemMessage).toContain("You MUST complete the above action NOW");

      expect(parsed.reason).toContain("[FailproofAI policy: blocker]");
      expect(parsed.reason).not.toContain("You MUST complete the above action NOW");
      expect(parsed.reason).not.toBe(parsed.systemMessage);
    });

    it("uses IDE specialized style and flags hard stop for cursor integration", async () => {
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, { integration: "cursor" });
      
      // Cursor expects Exit 0 for clean JSON denial parsing
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain("ACTION BLOCKED BY FAILPROOFAI");
      expect(result.hardStop).toBe(false); // Turn-level stop is non-destructive

      // Verify Real Deny JSON for Cursor
      const parsed = JSON.parse(result.stdout);
      expect(parsed.continue).toBe(false);
      expect(parsed.permission).toBe("deny");
    });

    it("flags hard stop for gemini/cursor on terminal events (Stop)", async () => {
      const { evaluatePolicies } = await import("../../src/hooks/policy-evaluator");
      const { registerPolicy, clearPolicies } = await import("../../src/hooks/policy-registry");
      
      clearPolicies();
      registerPolicy("block-sudo", "deny sudo", async () => ({ decision: "deny", reason: "no sudo" }), { events: ["Stop", "PostToolUse"] });

      // Gemini Stop hook -> Terminal (Kill)
      const geminiStop = await evaluatePolicies("Stop", {}, { integration: "gemini" });
      expect(geminiStop.hardStop).toBe(true);

      // Gemini PostToolUse hook -> Turn-level (Stay)
      const geminiPost = await evaluatePolicies("PostToolUse", {}, { integration: "gemini" });
      expect(geminiPost.hardStop).toBe(false);
      
      // Cursor Stop hook -> Terminal (Kill)
      const cursorStop = await evaluatePolicies("Stop", {}, { integration: "cursor" });
      expect(cursorStop.hardStop).toBe(true);

      // Cursor PostToolUse hook -> Safety-level (Kill)
      const cursorPost = await evaluatePolicies("PostToolUse", {}, { integration: "cursor" });
      expect(cursorPost.hardStop).toBe(true);
    });

    it("uses IDE specialized style for copilot integration", async () => {
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, { integration: "copilot" });
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout).permissionDecision).toBe("deny");
      expect(result.stderr).toContain("ACTION BLOCKED BY FAILPROOFAI");
      expect(result.stderr).toContain("Forbidden");
    });

    it("uses default specialized style for unknown integration", async () => {
      const result = await evaluatePolicies("PreToolUse", { tool_name: "Bash" }, { integration: "pi" as any });
      expect(result.exitCode).toBe(2);
      expect(result.stderr).toBe("[FailproofAI Security Stop] Policy: blocker - Forbidden");
    });
  });
});
