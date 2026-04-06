import { describe, it, expect } from "vitest";
import { baseSessionId } from "@/lib/utils/session-id";

describe("baseSessionId", () => {
  it("returns a plain UUID as-is", () => {
    expect(baseSessionId("abc-123-def")).toBe("abc-123-def");
  });

  it("strips /agent-<id> suffix", () => {
    expect(baseSessionId("abc-123-def/agent-abc")).toBe("abc-123-def");
  });

  it("strips /agent- with no trailing id", () => {
    expect(baseSessionId("abc-123-def/agent-")).toBe("abc-123-def");
  });

  it("strips any suffix after the first slash", () => {
    expect(baseSessionId("abc-123/subpath")).toBe("abc-123");
  });
});
