// @vitest-environment node
import { describe, it, expect } from "vitest";
import type { PolicyContext } from "../../src/hooks/policy-types";

// Import the builtin policies array to get the policy function
import { BUILTIN_POLICIES } from "../../src/hooks/builtin-policies";

const policy = BUILTIN_POLICIES.find((p) => p.name === "block-read-outside-cwd")!;

function makeCtx(overrides: Partial<PolicyContext>): PolicyContext {
  return {
    eventType: "PreToolUse",
    payload: {},
    toolName: "Read",
    toolInput: {},
    ...overrides,
  };
}

describe("block-read-outside-cwd policy", () => {
  it("exists in BUILTIN_POLICIES", () => {
    expect(policy).toBeDefined();
    expect(policy.defaultEnabled).toBe(false);
    expect(policy.match.toolNames).toEqual(["Read", "Glob", "Grep", "Bash"]);
  });

  it("allows Read with file_path inside cwd", async () => {
    const ctx = makeCtx({
      toolInput: { file_path: "/home/user/project/src/index.ts" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("denies Read with file_path outside cwd", async () => {
    const ctx = makeCtx({
      toolInput: { file_path: "/etc/passwd" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("/etc/passwd");
  });

  it("allows when no cwd in session (graceful fallback)", async () => {
    const ctx = makeCtx({
      toolInput: { file_path: "/etc/passwd" },
      session: {},
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("allows when no session at all", async () => {
    const ctx = makeCtx({
      toolInput: { file_path: "/etc/passwd" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("denies Glob with path outside cwd", async () => {
    const ctx = makeCtx({
      toolName: "Glob",
      toolInput: { path: "/other/directory" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("/other/directory");
  });

  it("denies Grep with path outside cwd", async () => {
    const ctx = makeCtx({
      toolName: "Grep",
      toolInput: { path: "/tmp/secrets", pattern: "password" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("/tmp/secrets");
  });

  it("allows when no file_path or path in tool input", async () => {
    const ctx = makeCtx({
      toolInput: { pattern: "something" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("allows file at cwd root", async () => {
    const ctx = makeCtx({
      toolInput: { file_path: "/home/user/project/file.ts" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("denies path that is a prefix but not a subdirectory", async () => {
    const ctx = makeCtx({
      toolInput: { file_path: "/home/user/project-other/file.ts" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
  });

  // -- Bash tool tests --

  it("denies Bash ls with path outside cwd", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "ls /outside/path" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("/outside/path");
  });

  it("denies Bash cat with file outside cwd", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "cat /etc/passwd" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("/etc/passwd");
  });

  it("allows Bash ls with path inside cwd", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "ls /home/user/project/src" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("allows Bash git status (not a read-like command)", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "git status" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("allows Bash echo with no path", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: 'echo "hello"' },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("denies Bash command with pipe where one segment has outside path", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "cat /etc/hosts | grep localhost" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("/etc/hosts");
  });

  it("denies Bash find with outside path", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "find /var/log -name '*.log'" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("/var/log");
  });

  it("denies Bash head with outside path", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "head -n 10 /etc/shadow" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("/etc/shadow");
  });

  it("allows Bash mkdir (not a read-like command)", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "mkdir -p /home/user/project/new-dir" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("allows Bash npm install (not a read-like command)", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "npm install express" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("denies Bash chained command with outside read", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "echo hi && cat /outside/secret.txt" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("/outside/secret.txt");
  });

  // -- ~/.claude/ whitelist tests --

  it("allows Read of ~/.claude/ plan file (whitelisted)", async () => {
    const os = await import("node:os");
    const home = os.homedir();
    const ctx = makeCtx({
      toolInput: { file_path: `${home}/.claude/plans/foo.md` },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("blocks Bash cat ~/.claude/settings.json", async () => {
    const os = await import("node:os");
    const home = os.homedir();
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: `cat ${home}/.claude/settings.json` },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("settings");
  });

  // -- .claude/settings*.json blocking tests --

  it("blocks Read of ~/.claude/settings.json", async () => {
    const os = await import("node:os");
    const home = os.homedir();
    const ctx = makeCtx({
      toolInput: { file_path: `${home}/.claude/settings.json` },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("settings");
  });

  it("blocks Read of ~/.claude/settings.local.json", async () => {
    const os = await import("node:os");
    const home = os.homedir();
    const ctx = makeCtx({
      toolInput: { file_path: `${home}/.claude/settings.local.json` },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("settings");
  });

  it("blocks Read of project .claude/settings.json (inside cwd)", async () => {
    const ctx = makeCtx({
      toolInput: { file_path: "/home/user/project/.claude/settings.json" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("settings");
  });

  it("blocks Read of project .claude/settings.local.json (inside cwd)", async () => {
    const ctx = makeCtx({
      toolInput: { file_path: "/home/user/project/.claude/settings.local.json" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("settings");
  });

  it("blocks Bash cat of project .claude/settings.json", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "cat /home/user/project/.claude/settings.json" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("settings");
  });

  // -- Regression: relative paths with embedded / should not false-positive --

  it("allows Bash ls of relative path with slashes inside cwd", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "ls ./node_modules/.bin/foo" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("denies Bash cat ~/... path outside cwd", async () => {
    const os = await import("node:os");
    const home = os.homedir();
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "cat ~/.failproofai/hooks-config.json" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain(`${home}/.failproofai/hooks-config.json`);
  });

  it("allows Read with relative file_path resolved against session cwd", async () => {
    const ctx = makeCtx({
      toolInput: { file_path: "src/index.ts" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  // -- Standalone ~ tests --

  it("denies Bash ls ~ (standalone tilde)", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "ls ~" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
  });

  it("denies Bash cat ~ && echo hi (standalone tilde before operator)", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "cat ~ && echo hi" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
  });

  it("denies Bash ls ~/ (tilde-slash, resolves to home)", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "ls ~/" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
  });

  // -- Standalone / (root) tests --

  it("denies Bash ls / (standalone root)", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "ls /" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
  });

  it("denies Bash cat / && echo hi (root before operator)", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "cat / && echo hi" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
  });

  it("allows Bash ls / when cwd is / (root is cwd)", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "ls /" },
      session: { cwd: "/" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  // -- /dev/null whitelist tests --

  it("allows Read of /dev/null (whitelisted)", async () => {
    const ctx = makeCtx({
      toolInput: { file_path: "/dev/null" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("allows Bash cat /dev/null (whitelisted)", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "cat /dev/null" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  // -- Quoted path false-positive regression tests --

  it("allows grep with double-quoted pattern containing /", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: 'cat file.ts | grep "/api/routes"' },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("allows grep with single-quoted pattern containing /", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "cat file.ts | grep '/api/routes'" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("allows find with double-quoted -path pattern containing /", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: 'find . -path "*/api/*" -name "*.ts"' },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("allow");
  });

  it("still denies unquoted absolute path after pipe", async () => {
    const ctx = makeCtx({
      toolName: "Bash",
      toolInput: { command: "cat file.ts | grep /api" },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
    expect(result.reason).toContain("/api");
  });

  it("denies Read of ~/.claude-other/file (not whitelisted)", async () => {
    const os = await import("node:os");
    const home = os.homedir();
    const ctx = makeCtx({
      toolInput: { file_path: `${home}/.claude-other/file` },
      session: { cwd: "/home/user/project" },
    });
    const result = await policy.fn(ctx);
    expect(result.decision).toBe("deny");
  });
});
