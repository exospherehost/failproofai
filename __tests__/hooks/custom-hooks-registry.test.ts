// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { customPolicies, getCustomHooks, clearCustomHooks } from "../../src/hooks/custom-hooks-registry";
import type { CustomHook } from "../../src/hooks/policy-types";

function makeHook(name: string): CustomHook {
  return { name, fn: async () => ({ decision: "allow" }) };
}

describe("hooks/custom-hooks-registry", () => {
  beforeEach(() => {
    clearCustomHooks();
  });

  it("customPolicies registry is defined and has an add function", () => {
    expect(customPolicies).toBeDefined();
    expect(typeof customPolicies.add).toBe("function");
  });

  it("customPolicies.add registers a hook", () => {
    customPolicies.add(makeHook("my-hook"));
    expect(getCustomHooks()).toHaveLength(1);
    expect(getCustomHooks()[0].name).toBe("my-hook");
  });

  it("getCustomHooks returns all hooks in insertion order", () => {
    customPolicies.add(makeHook("first"));
    customPolicies.add(makeHook("second"));
    customPolicies.add(makeHook("third"));
    const hooks = getCustomHooks();
    expect(hooks.map((h) => h.name)).toEqual(["first", "second", "third"]);
  });

  it("multiple add calls accumulate", () => {
    customPolicies.add(makeHook("a"));
    customPolicies.add(makeHook("b"));
    expect(getCustomHooks()).toHaveLength(2);
  });

  it("clearCustomHooks empties the registry", () => {
    customPolicies.add(makeHook("x"));
    customPolicies.add(makeHook("y"));
    clearCustomHooks();
    expect(getCustomHooks()).toHaveLength(0);
  });

  it("getCustomHooks returns empty array when registry is empty", () => {
    expect(getCustomHooks()).toEqual([]);
  });

  it("registry persists via globalThis across calls", () => {
    customPolicies.add(makeHook("persistent"));
    // The registry key on globalThis is shared; re-reading via getCustomHooks sees it
    expect((globalThis as Record<string, unknown>)["__failproofai_custom_hooks__"]).toHaveLength(1);
  });

  it("hook with description and match is stored as-is", () => {
    const hook: CustomHook = {
      name: "typed-hook",
      description: "blocks things",
      match: { events: ["PreToolUse"] },
      fn: async () => ({ decision: "deny", reason: "blocked" }),
    };
    customPolicies.add(hook);
    const stored = getCustomHooks()[0];
    expect(stored.description).toBe("blocks things");
    expect(stored.match?.events).toEqual(["PreToolUse"]);
  });
});
