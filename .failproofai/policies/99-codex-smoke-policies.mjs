/**
 * 99-codex-smoke-policies.mjs - temporary smoke tests for Codex custom policy loading.
 *
 * Trigger with:
 *   echo FP_CODEX_SMOKE_DENY
 *   echo FP_CODEX_SMOKE_INSTRUCT
 */
import { customPolicies, allow, deny, instruct } from "failproofai";

customPolicies.add({
  name: "codex-smoke-custom-policy",
  description: "Smoke test that Codex is loading project custom policies",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();

    const command = String(ctx.toolInput?.command ?? "");

    if (command.includes("FP_CODEX_SMOKE_DENY")) {
      return deny("Codex custom policy smoke test blocked this command");
    }

    if (command.includes("FP_CODEX_SMOKE_INSTRUCT")) {
      return instruct("Codex custom policy smoke test instruction reached the agent");
    }

    return allow();
  },
});
