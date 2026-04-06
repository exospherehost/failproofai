// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  registerPolicy,
  getPoliciesForEvent,
  clearPolicies,
} from "../../src/hooks/policy-registry";

describe("hooks/policy-registry", () => {
  beforeEach(() => {
    clearPolicies();
  });

  it("registers and retrieves a policy", () => {
    registerPolicy("test", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] });
    const policies = getPoliciesForEvent("PreToolUse");
    expect(policies).toHaveLength(1);
    expect(policies[0].name).toBe("test");
  });

  it("upserts by name", () => {
    registerPolicy("test", "desc1", () => ({ decision: "allow" }), { events: ["PreToolUse"] });
    registerPolicy("test", "desc2", () => ({ decision: "deny" }), { events: ["PreToolUse"] });
    const policies = getPoliciesForEvent("PreToolUse");
    expect(policies).toHaveLength(1);
    expect(policies[0].description).toBe("desc2");
  });

  it("filters by event type", () => {
    registerPolicy("pre", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] });
    registerPolicy("post", "desc", () => ({ decision: "allow" }), { events: ["PostToolUse"] });

    expect(getPoliciesForEvent("PreToolUse")).toHaveLength(1);
    expect(getPoliciesForEvent("PreToolUse")[0].name).toBe("pre");
    expect(getPoliciesForEvent("PostToolUse")).toHaveLength(1);
    expect(getPoliciesForEvent("PostToolUse")[0].name).toBe("post");
  });

  it("filters by tool name", () => {
    registerPolicy("bash-only", "desc", () => ({ decision: "allow" }), {
      events: ["PreToolUse"],
      toolNames: ["Bash"],
    });
    registerPolicy("any-tool", "desc", () => ({ decision: "allow" }), {
      events: ["PreToolUse"],
    });

    const bashPolicies = getPoliciesForEvent("PreToolUse", "Bash");
    expect(bashPolicies).toHaveLength(2);

    const readPolicies = getPoliciesForEvent("PreToolUse", "Read");
    expect(readPolicies).toHaveLength(1);
    expect(readPolicies[0].name).toBe("any-tool");
  });

  it("sorts by priority (higher first)", () => {
    registerPolicy("low", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] }, 0);
    registerPolicy("high", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] }, 10);
    registerPolicy("mid", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] }, 5);

    const policies = getPoliciesForEvent("PreToolUse");
    expect(policies.map((p) => p.name)).toEqual(["high", "mid", "low"]);
  });

  it("clearPolicies removes all entries", () => {
    registerPolicy("a", "desc", () => ({ decision: "allow" }), {});
    registerPolicy("b", "desc", () => ({ decision: "allow" }), {});
    clearPolicies();
    expect(getPoliciesForEvent("PreToolUse")).toHaveLength(0);
  });

  it("returns empty array for unmatched event", () => {
    registerPolicy("pre-only", "desc", () => ({ decision: "allow" }), {
      events: ["PreToolUse"],
    });
    expect(getPoliciesForEvent("SessionStart")).toHaveLength(0);
  });

  it("policy with no events/toolNames matches everything", () => {
    registerPolicy("catch-all", "desc", () => ({ decision: "allow" }), {});
    expect(getPoliciesForEvent("PreToolUse", "Bash")).toHaveLength(1);
    expect(getPoliciesForEvent("PostToolUse", "Read")).toHaveLength(1);
    expect(getPoliciesForEvent("SessionStart")).toHaveLength(1);
  });
});
