// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";

describe("hooks/install-prompt", () => {
  const originalIsTTY = process.stdin.isTTY;

  afterEach(() => {
    Object.defineProperty(process.stdin, "isTTY", {
      value: originalIsTTY,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("returns default-enabled policies when stdin is not a TTY", async () => {
    Object.defineProperty(process.stdin, "isTTY", {
      value: false,
      writable: true,
      configurable: true,
    });

    const { promptPolicySelection } = await import("../../src/hooks/install-prompt");
    const selected = await promptPolicySelection();

    expect(selected).toContain("sanitize-jwt");
    expect(selected).toContain("protect-env-vars");
    expect(selected).toContain("block-env-files");
    expect(selected).toContain("block-sudo");
    expect(selected).toContain("block-curl-pipe-sh");
    expect(selected).toContain("block-push-master");
    expect(selected).toContain("block-failproofai-commands");
    expect(selected).not.toContain("block-rm-rf");
    expect(selected).not.toContain("block-force-push");
    expect(selected).not.toContain("block-secrets-write");
    expect(selected).toHaveLength(11);
  });

  it("returns preSelected when stdin is not a TTY and preSelected is provided", async () => {
    Object.defineProperty(process.stdin, "isTTY", {
      value: false,
      writable: true,
      configurable: true,
    });

    const { promptPolicySelection } = await import("../../src/hooks/install-prompt");
    const selected = await promptPolicySelection(["block-sudo", "block-rm-rf"]);

    expect(selected).toEqual(["block-sudo", "block-rm-rf"]);
  });
});
