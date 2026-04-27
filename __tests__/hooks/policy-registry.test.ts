// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  registerPolicy,
  getPoliciesForEvent,
  clearPolicies,
  normalizePolicyName,
  DEFAULT_POLICY_NAMESPACE,
} from "../../src/hooks/policy-registry";

describe("hooks/policy-registry", () => {
  beforeEach(() => {
    clearPolicies();
  });

  it("registers and retrieves a policy (canonicalizes flat name to default namespace)", () => {
    registerPolicy("test", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] });
    const policies = getPoliciesForEvent("PreToolUse");
    expect(policies).toHaveLength(1);
    expect(policies[0].name).toBe("exospherehost/test");
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
    expect(getPoliciesForEvent("PreToolUse")[0].name).toBe("exospherehost/pre");
    expect(getPoliciesForEvent("PostToolUse")).toHaveLength(1);
    expect(getPoliciesForEvent("PostToolUse")[0].name).toBe("exospherehost/post");
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
    expect(readPolicies[0].name).toBe("exospherehost/any-tool");
  });

  it("sorts by priority (higher first)", () => {
    registerPolicy("low", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] }, 0);
    registerPolicy("high", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] }, 10);
    registerPolicy("mid", "desc", () => ({ decision: "allow" }), { events: ["PreToolUse"] }, 5);

    const policies = getPoliciesForEvent("PreToolUse");
    expect(policies.map((p) => p.name)).toEqual([
      "exospherehost/high",
      "exospherehost/mid",
      "exospherehost/low",
    ]);
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

  describe("namespace canonicalization", () => {
    it("DEFAULT_POLICY_NAMESPACE is exospherehost", () => {
      expect(DEFAULT_POLICY_NAMESPACE).toBe("exospherehost");
    });

    it("normalizePolicyName prepends default namespace to flat names", () => {
      expect(normalizePolicyName("foo")).toBe("exospherehost/foo");
      expect(normalizePolicyName("sanitize-jwt")).toBe("exospherehost/sanitize-jwt");
    });

    it("normalizePolicyName leaves already-namespaced names untouched", () => {
      expect(normalizePolicyName("exospherehost/foo")).toBe("exospherehost/foo");
      expect(normalizePolicyName("myorg/bar")).toBe("myorg/bar");
      expect(normalizePolicyName("custom/hook")).toBe("custom/hook");
    });

    it("registering a flat name and a qualified name for the same policy upserts (not duplicates)", () => {
      registerPolicy("dup", "first", () => ({ decision: "allow" }), { events: ["PreToolUse"] });
      registerPolicy("exospherehost/dup", "second", () => ({ decision: "allow" }), { events: ["PreToolUse"] });
      const policies = getPoliciesForEvent("PreToolUse");
      expect(policies).toHaveLength(1);
      expect(policies[0].name).toBe("exospherehost/dup");
      expect(policies[0].description).toBe("second");
    });

    it("custom-namespace policies coexist with same short-name builtins", () => {
      registerPolicy("foo", "builtin", () => ({ decision: "allow" }), { events: ["PreToolUse"] });
      registerPolicy("myorg/foo", "custom", () => ({ decision: "allow" }), { events: ["PreToolUse"] });
      const policies = getPoliciesForEvent("PreToolUse");
      expect(policies.map((p) => p.name).sort()).toEqual(["exospherehost/foo", "myorg/foo"]);
    });
  });
});
