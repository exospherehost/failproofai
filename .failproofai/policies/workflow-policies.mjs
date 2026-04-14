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

// Remind to update docs, README, and examples before committing
customPolicies.add({
  name: "docs-check",
  description: "Remind Claude to update documentation, README, and examples if relevant",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const cmd = String(ctx.toolInput?.command ?? "");
    if (/git\s+commit/.test(cmd)) {
      return instruct(
        "Check whether documentation needs updating for this change. " +
        "Consider: docs/*.mdx files, README.md, and examples/ directory. " +
        "If you added or changed a feature, make sure the relevant docs reflect it."
      );
    }
    return allow();
  },
});

// Remind to update PR description if a PR is open
customPolicies.add({
  name: "pr-description-check",
  description: "Remind Claude to update the PR description after pushing",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const cmd = String(ctx.toolInput?.command ?? "");
    if (/git\s+push/.test(cmd)) {
      return instruct(
        "After pushing, check if there is an open PR for this branch. " +
        "If so, update the PR description to reflect the latest changes."
      );
    }
    return allow();
  },
});
