/**
 * security-policies.mjs — Convention-based security policies
 *
 * Drop this file into .failproofai/policies/ at the project or user level
 * and it will be automatically loaded — no --custom flag needed.
 *
 * Project level:  .failproofai/policies/security-policies.mjs
 * User level:     ~/.failproofai/policies/security-policies.mjs
 */
import { customPolicies, allow, deny } from "failproofai";

// Block writes to .env files
customPolicies.add({
  name: "block-env-writes",
  description: "Prevent Claude from writing to .env files",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (!["Write", "Edit"].includes(ctx.toolName ?? "")) return allow();
    const path = String(ctx.toolInput?.file_path ?? "");
    if (/\.env($|\.)/.test(path)) {
      return deny(`Writing to .env files is blocked: ${path}`);
    }
    return allow();
  },
});

// Block commands that delete git history
customPolicies.add({
  name: "block-git-history-rewrite",
  description: "Prevent destructive git history operations",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const cmd = String(ctx.toolInput?.command ?? "");
    if (/git\s+(rebase\s+-i|filter-branch|reflog\s+expire)/.test(cmd)) {
      return deny("Rewriting git history is not allowed — use a revert commit instead");
    }
    return allow();
  },
});
