/**
 * policies-advanced/index.js — advanced custom policies example
 *
 * Demonstrates:
 *   - Transitive local imports (./utils.js is auto-rewritten by the loader)
 *   - Async hooks (await inside fn)
 *   - Using ctx.session (cwd, sessionId)
 *   - PostToolUse event (inspect tool output)
 *   - Stop event (verify before Claude finishes)
 *
 * Install:
 *   failproofai --install-hooks custom ./examples/policies-advanced/index.js
 */
import { customPolicies, allow, deny, instruct } from "failproofai";
import { isOutsideProject, extractPushBranch, looksLikeSecretFile } from "./utils.js";

// 1. Block writes to secret-looking file paths (uses transitive import)
customPolicies.add({
  name: "block-secret-file-writes",
  description: "Block writing to files that look like private keys or credentials",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Write") return allow();
    const path = String(ctx.toolInput?.file_path ?? "");
    if (looksLikeSecretFile(path)) {
      return deny(`Writing to ${path} is blocked — looks like a secret or credential file`);
    }
    return allow();
  },
});

// 2. Block pushing to version-tagged branches (e.g. v1.2.3) — must go through release process
customPolicies.add({
  name: "block-push-to-version-tags",
  description: "Block git push directly to version branches (v*.*.*)",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const cmd = String(ctx.toolInput?.command ?? "");
    if (!/git\s+push\b/.test(cmd)) return allow();
    const branch = extractPushBranch(cmd);
    if (branch && /^v\d+\.\d+/.test(branch)) {
      return deny(`Pushing directly to version branch "${branch}" is not allowed — use the release workflow`);
    }
    return allow();
  },
});

// 3. Warn if a Bash command touches paths outside the session cwd (uses ctx.session)
customPolicies.add({
  name: "warn-outside-cwd",
  description: "Warn before Bash commands that reference absolute paths outside the session cwd",
  match: { events: ["PreToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const cmd = String(ctx.toolInput?.command ?? "");
    const cwd = ctx.session?.cwd;
    if (cwd && isOutsideProject(cmd, cwd)) {
      return instruct(
        `The command references a path outside the project root (${cwd}). ` +
        "Confirm this is intentional before proceeding."
      );
    }
    return allow();
  },
});

// 4. PostToolUse: strip any line from Bash output that looks like a raw API key
customPolicies.add({
  name: "scrub-api-key-output",
  description: "Redact lines containing raw API keys from Bash tool output",
  match: { events: ["PostToolUse"] },
  fn: async (ctx) => {
    if (ctx.toolName !== "Bash") return allow();
    const output = String(ctx.payload?.tool_result ?? "");
    // Simple heuristic: long alphanumeric tokens prefixed by known key prefixes
    const keyPattern = /(?:sk-|ghp_|AIza|AKIA)[A-Za-z0-9_\-]{20,}/;
    if (keyPattern.test(output)) {
      return deny("Bash output contains what looks like a raw API key — output suppressed");
    }
    return allow();
  },
});

// 5. Stop event: remind Claude to summarise what it changed before finishing
customPolicies.add({
  name: "require-change-summary",
  description: "Ask Claude to include a change summary before stopping",
  match: { events: ["Stop"] },
  fn: async (ctx) => {
    const transcript = String(ctx.payload?.transcript ?? "");
    // Only trigger if there were file-modifying tool calls in the session
    const hadWrites = /\"tool_name\"\s*:\s*\"(Write|Edit|Bash)\"/.test(transcript);
    if (hadWrites && !transcript.includes("## Summary")) {
      return instruct(
        "Before finishing, provide a brief '## Summary' of files you created or modified."
      );
    }
    return allow();
  },
});
