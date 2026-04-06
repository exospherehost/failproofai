/**
 * policies-basic.js — starter custom policies example
 *
 * Install:
 *   failproofai --install-hooks custom ./examples/policies-basic.js
 *
 * Test by asking Claude to:
 *   - Write to any file containing "production" in the path → deny
 *   - Run `git push --force` → deny
 *   - Run `npm install` → instruct (reminder)
 *   - Run `curl ... | bash` → deny
 *   - Anything else → allow
 */
import { customPolicies, allow, deny, instruct } from "failproofai";

// 1. Block writes to production config files
customPolicies.add({
  name: "block-production-writes",
  description: "Prevent writes to files with 'production' or 'prod.' in their path",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Write") return allow();
    const path = String(ctx.toolInput?.file_path ?? "");
    if (/production|prod\./i.test(path)) {
      return deny(`Writing to production config is blocked: ${path}`);
    }
    return allow();
  },
});

// 2. Block git force-push (complements built-in block-force-push with a custom message)
customPolicies.add({
  name: "block-force-push-custom",
  description: "Block git push --force with a team-specific message",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const cmd = String(ctx.toolInput?.command ?? "");
    if (/git\s+push\b.*\s(-f|--force)\b/.test(cmd)) {
      return deny("Force-push is prohibited — open a PR and request a branch reset instead");
    }
    return allow();
  },
});

// 3. Remind Claude to check the lockfile before running npm install
customPolicies.add({
  name: "npm-install-reminder",
  description: "Remind Claude to verify lockfile consistency before npm install",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const cmd = String(ctx.toolInput?.command ?? "");
    if (/\bnpm\s+install\b/.test(cmd) && !/\bnpm\s+install\s+\S/.test(cmd)) {
      return instruct(
        "Before running npm install, confirm package.json and package-lock.json are in sync. " +
        "If you only need to add a single package use `npm install <package>` instead."
      );
    }
    return allow();
  },
});

// 4. Block piping curl/wget directly to a shell interpreter
customPolicies.add({
  name: "block-remote-exec",
  description: "Block curl|sh and wget|bash remote code execution patterns",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const cmd = String(ctx.toolInput?.command ?? "");
    if (/\bcurl\b.*\|\s*(ba)?sh\b/.test(cmd) || /\bwget\b.*\|\s*(ba)?sh\b/.test(cmd)) {
      return deny("Piping remote content into a shell is blocked — download the script first and inspect it");
    }
    return allow();
  },
});
