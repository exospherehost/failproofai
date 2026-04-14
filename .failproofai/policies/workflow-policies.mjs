/**
 * workflow-policies.mjs — Convention-based workflow policies for this repo
 *
 * Automatically loaded from .failproofai/policies/ — no config changes needed.
 */
import { customPolicies, allow, instruct } from "failproofai";

// Remind to update CHANGELOG before committing
customPolicies.add({
  name: "changelog-check",
  description: "Remind Claude to update CHANGELOG.md before committing",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const cmd = String(ctx.toolInput?.command ?? "");
    if (/git\s+commit/.test(cmd)) {
      return instruct(
        "Check whether CHANGELOG.md needs an update for this commit. " +
        "Every PR must include an entry under the `## Unreleased` section. " +
        "Use the appropriate subsection: Features, Fixes, Docs, or Dependencies."
      );
    }
    return allow();
  },
});
