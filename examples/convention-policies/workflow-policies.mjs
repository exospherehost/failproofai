/**
 * workflow-policies.mjs — Convention-based workflow policies
 *
 * Drop this file into .failproofai/policies/ at the project or user level
 * and it will be automatically loaded — no --custom flag needed.
 *
 * Project level:  .failproofai/policies/workflow-policies.mjs
 * User level:     ~/.failproofai/policies/workflow-policies.mjs
 */
import { customPolicies, allow, instruct } from "failproofai";

// Remind to run tests before committing
customPolicies.add({
  name: "test-before-commit",
  description: "Remind Claude to run tests before git commit",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const cmd = String(ctx.toolInput?.command ?? "");
    if (/git\s+commit/.test(cmd)) {
      return instruct(
        "Before committing, make sure all tests pass. " +
        "Run the test suite first if you haven't already."
      );
    }
    return allow();
  },
});

// Log all file writes for audit trail
customPolicies.add({
  name: "audit-file-writes",
  description: "Log all file write operations",
  match: { events: ["PostToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = ctx.toolInput?.file_path ?? "unknown";
    console.error(`[audit] File written: ${path}`);
    return allow();
  },
});
