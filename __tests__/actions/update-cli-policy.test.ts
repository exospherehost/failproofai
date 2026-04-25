// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggleCliPolicyAction, updateCliPolicyParamsAction } from "@/app/actions/update-cli-policy";
import { readHooksConfig, writeHooksConfig } from "@/src/hooks/hooks-config";

vi.mock("@/src/hooks/hooks-config", () => ({
  readHooksConfig: vi.fn(),
  writeHooksConfig: vi.fn(),
}));

describe("update-cli-policy actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toggleCliPolicyAction", () => {
    it("should enable a policy for a CLI", async () => {
      vi.mocked(readHooksConfig).mockReturnValue({ enabledPolicies: [] });
      
      await toggleCliPolicyAction("claude-code", "test-policy", "enable");
      
      expect(writeHooksConfig).toHaveBeenCalledWith(expect.objectContaining({
        cli: {
          "claude-code": expect.objectContaining({
            enabledPolicies: ["test-policy"],
            disabledPolicies: [],
          })
        }
      }));
    });

    it("should disable a policy for a CLI", async () => {
      vi.mocked(readHooksConfig).mockReturnValue({ enabledPolicies: [] });
      
      await toggleCliPolicyAction("claude-code", "test-policy", "disable");
      
      expect(writeHooksConfig).toHaveBeenCalledWith(expect.objectContaining({
        cli: {
          "claude-code": expect.objectContaining({
            disabledPolicies: ["test-policy"],
            enabledPolicies: [],
          })
        }
      }));
    });

    it("should inherit a policy (remove from both lists)", async () => {
      vi.mocked(readHooksConfig).mockReturnValue({
        cli: {
          "claude-code": {
            enabledPolicies: ["test-policy"],
            disabledPolicies: [],
          }
        }
      } as any);
      
      await toggleCliPolicyAction("claude-code", "test-policy", "inherit");
      
      // The implementation cleans up the CLI entry if it becomes empty
      expect(writeHooksConfig).toHaveBeenCalledWith(expect.objectContaining({
        cli: {}
      }));
    });
  });

  describe("updateCliPolicyParamsAction", () => {
    it("should update params for a CLI policy", async () => {
      vi.mocked(readHooksConfig).mockReturnValue({ enabledPolicies: [] });
      
      await updateCliPolicyParamsAction("claude-code", "test-policy", { foo: "bar" });
      
      expect(writeHooksConfig).toHaveBeenCalledWith(expect.objectContaining({
        cli: {
          "claude-code": expect.objectContaining({
            policyParams: {
              "test-policy": { foo: "bar" }
            }
          })
        }
      }));
    });
  });
});
