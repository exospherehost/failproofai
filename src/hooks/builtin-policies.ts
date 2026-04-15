/**
 * Built-in security policies for Claude Code hooks.
 */
import { resolve, join } from "node:path";
import { readFile, writeFile, stat, open } from "node:fs/promises";
import { execSync, execFileSync } from "node:child_process";
import { homedir } from "node:os";
import type { BuiltinPolicyDefinition, PolicyContext, PolicyResult, PolicyParamsSchema } from "./policy-types";
import { allow, deny, instruct } from "./policy-helpers";
import { registerPolicy } from "./policy-registry";
import { hookLogWarn } from "./hook-logger";

function isClaudeInternalPath(resolved: string): boolean {
  const claudeDir = join(homedir(), ".claude");
  return resolved === claudeDir || resolved.startsWith(claudeDir + "/");
}

function isClaudeSettingsFile(resolved: string): boolean {
  return /[\\/]\.claude[\\/]settings(?:\.[^/\\]+)?\.json$/.test(resolved);
}

function isBashTool(toolName: string | undefined): boolean {
  if (!toolName) return true; // Assume shell if tool name is missing
  const lower = toolName.toLowerCase();
  return (
    lower === "bash" ||
    lower === "shell" ||
    lower === "terminal" ||
    lower === "console" ||
    lower.includes("command") ||
    lower === "run_terminal_command" ||
    lower === "sh"
  );
}

function getCommand(ctx: PolicyContext): string {
  if (typeof ctx.toolInput === "string") return ctx.toolInput;
  return (
    (ctx.toolInput?.command as string) ??
    (ctx.toolInput?.cmd as string) ??
    (ctx.toolInput?.input as string) ??
    (ctx.toolInput?.content as string) ?? // WriteFile/ReadFile content
    ""
  );
}

function getFilePath(ctx: PolicyContext): string {
  return (
    (ctx.toolInput?.file_path as string) ??
    (ctx.toolInput?.filePath as string) ??
    (ctx.toolInput?.path as string) ??
    (ctx.toolInput?.relative_path as string) ??
    (ctx.toolInput?.filename as string) ??
    ""
  );
}

/**
 * Parse a command string into argv tokens for safe pattern matching.
 * Splits on whitespace and strips simple single/double quotes.
 * Does not handle all shell syntax — sufficient for prefix-match allowlists.
 */
function parseArgvTokens(cmd: string): string[] {
  return cmd.trim().split(/\s+/).map((t) => t.replace(/^['"]|['"]$/g, ""));
}

// Shell operators that always act as command separators when whitespace-delimited.
const SHELL_OPERATORS = new Set(["&&", "||", "|", ";"]);

// Shell metacharacters that are unsafe when embedded inside a token. Any command
// whose argv contains one of these in a token is rejected before allowlist matching.
// This closes the bypass where operators are glued to a word (e.g. "nginx;evil" or
// "nginx&&evil") and would otherwise be invisible to the standalone-operator check.
// Note: | is intentionally excluded here because "foo|bar" is a valid grep/sed
// argument value; the standalone-operator check above already handles bare "|" tokens.
const SHELL_METACHAR_RE = /[;&<>`$()\\]/;

// -- Pre-compiled regex constants (hoisted to avoid per-call allocation) --

// sanitizeJwt
const JWT_RE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

// sanitizeApiKeys
const API_KEY_PATTERNS: Array<[RegExp, string]> = [
  [/sk-ant-[A-Za-z0-9\-_]{20,}/, "Anthropic API key"],
  [/sk-proj-[A-Za-z0-9\-_]{20,}/, "OpenAI project API key"],
  [/sk-[A-Za-z0-9]{20,}/, "OpenAI API key"],
  [/ghp_[A-Za-z0-9]{36}/, "GitHub personal access token"],
  [/github_pat_[A-Za-z0-9_]{82}/, "GitHub fine-grained token"],
  [/AKIA[A-Z0-9]{16}/, "AWS access key ID"],
  [/sk_live_[A-Za-z0-9]{24,}/, "Stripe live secret key"],
  [/sk_test_[A-Za-z0-9]{24,}/, "Stripe test secret key"],
  [/AIza[0-9A-Za-z\-_]{35}/, "Google API key"],
];

// sanitizeConnectionStrings
const CONNECTION_STRING_RE = /(?:postgresql|postgres|mysql|mongodb(?:\+srv)?|redis|amqps?|smtps?):\/\/[^@\s]+@/;

// sanitizePrivateKeyContent
const PRIVATE_KEY_RE = /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/;

// sanitizeBearerTokens
const BEARER_TOKEN_RE = /Authorization:\s*Bearer\s+[A-Za-z0-9\-._~+/]{20,}/i;

// warnDestructiveSql / warnSchemaAlteration
const SQL_TOOL_RE = /\b(?:psql|mysql|sqlite3|pgcli|clickhouse-client)\b/;
const DESTRUCTIVE_SQL_RE = /\b(?:DROP\s+(?:TABLE|DATABASE|SCHEMA)|TRUNCATE\b)/i;
const DELETE_NO_WHERE_RE = /\bDELETE\s+FROM\b/i;
const SQL_WHERE_RE = /\bWHERE\b/i;
const SCHEMA_ALTER_RE = /\bALTER\s+TABLE\b[\s\S]*\b(?:DROP\s+COLUMN|ADD\s+COLUMN|RENAME\s+(?:COLUMN|TO)|MODIFY\s+COLUMN)\b/i;

// warnPackagePublish
const PUBLISH_CMD_RE = /(?:npm\s+publish|bun\s+publish|pnpm\s+publish|yarn\s+npm\s+publish|twine\s+upload|poetry\s+publish|cargo\s+publish|gem\s+push)\b/;

// protectEnvVars
const ENV_PRINTENV_RE = /(?:^|\s|;|&&|\|\|)(?:env|printenv)(?:\s|$|;|&&|\|)/;
const ECHO_ENV_RE = /echo\s+.*\$\{?[A-Za-z_]/;
const EXPORT_RE = /(?:^|\s|;|&&|\|\|)export\s+\w+/;
const PS_ENV_VAR_RE = /\$env:[A-Za-z_]/i;
const PS_CHILDITEM_ENV_RE = /(?:Get-ChildItem|dir|gci|ls)\s+Env:/i;
const DOTNET_GETENV_RE = /\[Environment\]::GetEnvironment/i;
const CMD_ECHO_ENV_RE = /echo\s+%[A-Za-z_]/i;

// blockEnvFiles
const ENV_FILE_PATH_RE = /(?:^|[\\/])\.env(?:\.|$)/;
const ENV_CMD_RE = /\.env(?:\b|\s|$|\.)/;

// blockSudo
const SUDO_RE = /(?:^|;|&&|\|\|)\s*sudo\s/;
const PS_ELEVATION_RE = /Start-Process\s+.*-Verb\s+RunAs/i;
const RUNAS_RE = /(?:^|;|&&|\|\|)\s*runas\s/i;

// blockCurlPipeSh
const CURL_PIPE_SH_RE = /(?:curl|wget)\s.*\|\s*(?:sh|bash|zsh|dash|ksh|csh|tcsh|fish|ash)\b/;
const PS_WEB_PIPE_RE = /(?:Invoke-WebRequest|iwr|Invoke-RestMethod|irm)\s+.*\|\s*(?:Invoke-Expression|iex)/i;

// blockForcePush
const FORCE_PUSH_RE = /(?:--force|-f\b)/;

// blockSecretsWrite
const SECRET_FILE_RE = /\.(?:pem|key)$/;
const SECRET_FILE_ID_RSA_RE = /id_rsa/;
const SECRET_FILE_CREDENTIALS_RE = /credentials/;

// blockWorkOnMain
const GIT_COMMIT_MERGE_RE = /git\s+(?:commit|merge|rebase|cherry-pick)\b/;

// blockFailproofaiCommands
const FAILPROOFAI_CLI_RE = /(?:^|;|&&|\|\||\|)\s*failproofai(?:\s|$)/;
const FAILPROOFAI_UNINSTALL_RE = /(?:npm\s+(?:uninstall|remove|un|r)\s.*failproofai|bun\s+remove\s.*failproofai|yarn\s+global\s+remove\s+failproofai|pnpm\s+(?:remove|uninstall|un)\s.*failproofai)/;

// warnGitAmend
const GIT_AMEND_RE = /\bgit\s+commit\b.*--amend\b/;

// warnGitStashDrop
const GIT_STASH_DROP_RE = /\bgit\s+stash\s+(?:drop|clear)\b/;

// warnAllFilesStaged
const GIT_ADD_ALL_RE = /\bgit\s+add\s+(?:-A\b|--all\b|\.(?:\s|$|;|&&|\|\|))/;

// warnGlobalPackageInstall
const NPM_GLOBAL_RE = /\bnpm\s+(?:install|i)\b(?=.*(?:\s-g\b|--global\b))/;
const YARN_GLOBAL_RE = /\byarn\s+global\s+add\b/;
const PNPM_GLOBAL_RE = /\bpnpm\s+(?:add|install|i)\b(?=.*(?:\s-g\b|--global\b))/;
const BUN_GLOBAL_RE = /\bbun\s+(?:install|add)\b(?=.*(?:\s-g\b|--global\b))/;
const CARGO_INSTALL_RE = /\bcargo\s+install\b/;
const PIP_SYSTEM_RE = /\bpip(?:3)?\s+install\b(?=.*(?:--user\b|--break-system-packages\b))/;

// preferPackageManager — maps manager name → detection patterns
const PKG_MANAGER_DETECTORS: Record<string, RegExp[]> = {
  pip: [/\bpip\b/, /\bpip3\b/, /\bpython3?\s+-m\s+pip\b/],
  npm: [/\bnpm\b/, /\bnpx\b/],
  yarn: [/\byarn\b/],
  pnpm: [/\bpnpm\b/, /\bpnpx\b/],
  bun: [/\bbun\b/, /\bbunx\b/],
  uv: [/\buv\b/],
  poetry: [/\bpoetry\b/],
  pipenv: [/\bpipenv\b/],
  conda: [/\bconda\b/],
  cargo: [/\bcargo\b/],
};

// warnBackgroundProcess
const NOHUP_RE = /\bnohup\s+\S/;
const SCREEN_DETACH_RE = /\bscreen\s+-[A-Za-z]*d[A-Za-z]*\b/;
const TMUX_DETACH_RE = /\btmux\s+(?:new-session|new)\b[^|&;]*-d\b/;
const DISOWN_RE = /\bdisown\b/;
const BACKGROUND_AMPERSAND_RE = /(?<![&|])\s?&\s*(?:$|#|;)/;

// Caches the current branch per cwd to avoid repeated execSync calls.
// Trade-off: if the user switches branches externally mid-session, the cache serves
// the stale value until the process restarts. This is acceptable since branch switches
// during an active Claude session are rare.
const gitBranchCache = new Map<string, string>();

function getCurrentBranch(cwd: string): string | null {
  try {
    let branch = gitBranchCache.get(cwd);
    if (branch === undefined) {
      branch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd,
        encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
        timeout: 3000,
      }).trim();
      gitBranchCache.set(cwd, branch);
    }
    return branch || null;
  } catch {
    return null;
  }
}

function getHeadSha(cwd: string): string | null {
  try {
    const sha = execSync("git rev-parse HEAD", {
      cwd,
      encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
      timeout: 3000,
    }).trim();
    return sha || null;
  } catch {
    return null;
  }
}

interface CiCheck {
  name: string;
  status: string;
  conclusion: string;
}

/** Fetch third-party check runs (non-GitHub-Actions) for a commit via the Checks API. */
function getThirdPartyCheckRuns(cwd: string, sha: string): CiCheck[] {
  try {
    const json = execFileSync(
      "gh",
      [
        "api",
        `repos/{owner}/{repo}/commits/${sha}/check-runs`,
        "--jq",
        '.check_runs | map(select(.app.slug != "github-actions")) | map({name: .name, status: .status, conclusion: (.conclusion // "")})',
      ],
      {
        cwd,
        encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
        timeout: 15000,
      },
    ).trim();

    if (!json || json === "[]") return [];
    return JSON.parse(json) as CiCheck[];
  } catch {
    return [];
  }
}

/** Fetch commit statuses (legacy Status API) and normalize to CiCheck format. */
function getCommitStatuses(cwd: string, sha: string): CiCheck[] {
  try {
    const json = execFileSync(
      "gh",
      [
        "api",
        `repos/{owner}/{repo}/commits/${sha}/statuses`,
        "--jq",
        'map({name: .context, state: .state}) | unique_by(.name)',
      ],
      {
        cwd,
        encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
        timeout: 15000,
      },
    ).trim();

    if (!json || json === "[]") return [];
    const statuses = JSON.parse(json) as Array<{ name: string; state: string }>;
    return statuses.map((s) => ({
      name: s.name,
      status: s.state === "pending" ? "in_progress" : "completed",
      conclusion: s.state === "pending" ? "" : s.state === "success" ? "success" : "failure",
    }));
  } catch {
    return [];
  }
}

/**
 * Check if a command matches an allow pattern using token-by-token comparison.
 * The "*" token is a wildcard. Extra command tokens beyond the pattern are allowed,
 * UNLESS any token is a standalone shell operator (&&, ||, |, ;) OR contains an
 * embedded shell metacharacter — both cases are rejected to prevent bypass via
 * appended sub-commands or glued operators (e.g. "nginx;" or "nginx;evil").
 */
function matchesAllowedPattern(cmd: string, pattern: string): boolean {
  const cmdTokens = parseArgvTokens(cmd);
  const patTokens = parseArgvTokens(pattern);
  if (cmdTokens.length < patTokens.length) return false;
  // Reject commands containing standalone shell-operator tokens
  if (cmdTokens.some((tok) => SHELL_OPERATORS.has(tok))) return false;
  // Reject any token containing embedded shell metacharacters
  if (cmdTokens.some((tok) => SHELL_METACHAR_RE.test(tok))) return false;
  return patTokens.every((tok, i) => tok === "*" || tok === cmdTokens[i]);
}

// -- Policy implementations --

function sanitizeJwt(ctx: PolicyContext): PolicyResult {
  // PostToolUse: scrub JWT patterns from tool output
  const output = JSON.stringify(ctx.payload);
  if (JWT_RE.test(output)) {
    return {
      decision: "deny",
      reason: "JWT token detected in tool output",
      message: "[REDACTED: JWT token removed by failproofai]",
    };
  }
  return allow();
}

function sanitizeApiKeys(ctx: PolicyContext): PolicyResult {
  // PostToolUse: scrub common API key patterns from tool output
  const output = JSON.stringify(ctx.payload);
  for (const [pattern, label] of API_KEY_PATTERNS) {
    if (pattern.test(output)) {
      return {
        decision: "deny",
        reason: `${label} detected in tool output`,
        message: `[REDACTED: ${label} removed by failproofai]`,
      };
    }
  }

  // Check additional user-configured patterns
  const additional = ((ctx.params?.additionalPatterns ?? []) as Array<{ regex: string; label: string }>);
  for (const { regex, label } of additional) {
    try {
      if (new RegExp(regex).test(output)) {
        return {
          decision: "deny",
          reason: `${label} detected in tool output`,
          message: `[REDACTED: ${label} removed by failproofai]`,
        };
      }
    } catch {
      hookLogWarn(`additionalPatterns: invalid regex "${regex}", skipping`);
    }
  }

  return allow();
}

function sanitizeConnectionStrings(ctx: PolicyContext): PolicyResult {
  // PostToolUse: scrub database connection strings with embedded credentials
  const output = JSON.stringify(ctx.payload);
  if (CONNECTION_STRING_RE.test(output)) {
    return {
      decision: "deny",
      reason: "Database connection string with credentials detected in tool output",
      message: "[REDACTED: connection string removed by failproofai]",
    };
  }
  return allow();
}

function sanitizePrivateKeyContent(ctx: PolicyContext): PolicyResult {
  // PostToolUse: scrub PEM private key blocks from tool output
  const output = JSON.stringify(ctx.payload);
  if (PRIVATE_KEY_RE.test(output)) {
    return {
      decision: "deny",
      reason: "Private key content detected in tool output",
      message: "[REDACTED: private key content removed by failproofai]",
    };
  }
  return allow();
}

function sanitizeBearerTokens(ctx: PolicyContext): PolicyResult {
  // PostToolUse: scrub Authorization: Bearer tokens from tool output
  const output = JSON.stringify(ctx.payload);
  if (BEARER_TOKEN_RE.test(output)) {
    return {
      decision: "deny",
      reason: "Bearer token detected in tool output",
      message: "[REDACTED: Bearer token removed by failproofai]",
    };
  }
  return allow();
}

function warnDestructiveSql(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const cmd = getCommand(ctx);
  if (!SQL_TOOL_RE.test(cmd)) return allow();

  // DROP or TRUNCATE always warns
  if (DESTRUCTIVE_SQL_RE.test(cmd)) {
    return instruct(
      "STOP: This command contains destructive SQL (DROP/TRUNCATE/DELETE). Confirm with the user before executing.",
    );
  }

  // DELETE FROM without WHERE warns
  if (DELETE_NO_WHERE_RE.test(cmd) && !SQL_WHERE_RE.test(cmd)) {
    return instruct(
      "STOP: This command contains destructive SQL (DROP/TRUNCATE/DELETE). Confirm with the user before executing.",
    );
  }

  return allow();
}

function warnLargeFileWrite(ctx: PolicyContext): PolicyResult {
  if (ctx.toolName !== "Write") return allow();
  const content = ctx.toolInput?.content as string | undefined;
  if (typeof content !== "string") return allow();
  const thresholdKb = ((ctx.params?.thresholdKb ?? 1024) as number);
  const thresholdBytes = thresholdKb * 1024;
  if (content.length > thresholdBytes) {
    return instruct(
      `STOP: You are writing a file larger than ${thresholdKb}KB (${Math.round(content.length / 1024)}KB). This is unusually large. Confirm this is intentional before proceeding.`,
    );
  }
  return allow();
}

function warnPackagePublish(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const cmd = getCommand(ctx);
  if (PUBLISH_CMD_RE.test(cmd)) {
    return instruct(
      "STOP: This command publishes a package to a public registry. Confirm with the user that this is intentional.",
    );
  }
  return allow();
}

function protectEnvVars(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const cmd = getCommand(ctx);
  // Block: env, printenv, echo $VAR, export VAR=
  if (ENV_PRINTENV_RE.test(cmd)) {
    return deny("Command reads environment variables");
  }
  if (ECHO_ENV_RE.test(cmd)) {
    return deny("Command echoes environment variable");
  }
  if (EXPORT_RE.test(cmd)) {
    return deny("Command exports environment variable");
  }
  // PowerShell: $env:VAR
  if (PS_ENV_VAR_RE.test(cmd)) {
    return deny("Command reads environment variable via PowerShell");
  }
  // PowerShell: Get-ChildItem Env: / dir env: / gci env: / ls env:
  if (PS_CHILDITEM_ENV_RE.test(cmd)) {
    return deny("Command reads environment variables via PowerShell");
  }
  // PowerShell: [Environment]::GetEnvironmentVariable
  if (DOTNET_GETENV_RE.test(cmd)) {
    return deny("Command reads environment variable via .NET");
  }
  // cmd: echo %VAR%
  if (CMD_ECHO_ENV_RE.test(cmd)) {
    return deny("Command echoes environment variable via cmd");
  }
  return allow();
}

function blockEnvFiles(ctx: PolicyContext): PolicyResult {
  const cmd = getCommand(ctx);
  const filePath = getFilePath(ctx);

  // Check file_path for Read/Write tools (match both / and \ path separators)
  if (filePath && ENV_FILE_PATH_RE.test(filePath)) {
    return deny("Access to .env file blocked");
  }
  // Check Bash commands referencing .env files
  if (isBashTool(ctx.toolName) && ENV_CMD_RE.test(cmd)) {
    return deny("Command references .env file");
  }
  return allow();
}

function blockSudo(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const cmd = getCommand(ctx).trimStart();
  if (SUDO_RE.test(cmd) || cmd.startsWith("sudo ")) {
    // Check allowPatterns — match against parsed tokens, not raw string
    const allowPatterns = ((ctx.params?.allowPatterns ?? []) as string[]);
    if (allowPatterns.some((p) => matchesAllowedPattern(cmd, p))) return allow();
    return deny("sudo commands are blocked");
  }
  // PowerShell: Start-Process -Verb RunAs (elevation)
  if (PS_ELEVATION_RE.test(cmd)) {
    return deny("Elevated process launch is blocked");
  }
  // Windows: runas command
  if (RUNAS_RE.test(cmd)) {
    return deny("runas elevation is blocked");
  }
  return allow();
}

function blockCurlPipeSh(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const cmd = getCommand(ctx);
  if (CURL_PIPE_SH_RE.test(cmd)) {
    return deny("Piping downloads to shell is blocked");
  }
  // PowerShell: iwr | iex, irm | iex, Invoke-WebRequest | Invoke-Expression
  if (PS_WEB_PIPE_RE.test(cmd)) {
    return deny("Piping downloads to Invoke-Expression is blocked");
  }
  return allow();
}

function extractGitPushArgs(cmd: string): string[] {
  return cmd
    .split(/&&|\|\||[|;\n]/)
    .map((s) => s.trim())
    .filter((s) => /^git\s+push\s/.test(s))
    .map((s) => s.replace(/^git\s+push\s+/, ""));
}

function blockPushMaster(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const protectedBranches = ((ctx.params?.protectedBranches ?? ["main", "master"]) as string[]);
  if (protectedBranches.length === 0) return allow();
  const args = extractGitPushArgs(getCommand(ctx));
  const branchPattern = new RegExp(`\\b(?:${protectedBranches.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`);
  if (args.some((a) => branchPattern.test(a))) {
    return deny(`Pushing to ${protectedBranches.join("/")} is blocked`);
  }
  return allow();
}

/**
 * Check whether all *recursive* rm path targets in a command are under an allowlisted path.
 * Splits on shell operators first so that `/tmp` appearing in an unrelated
 * sub-command (e.g. `echo /tmp && rm -rf /`) does not trigger a false allow.
 * Uses path-boundary comparison so `/tmp` does not cover `/tmp2`.
 * Non-recursive rm segments (no -r/-R flag) are skipped — they pose no catastrophic risk.
 * Quoted paths with spaces are handled via a segment-level regex fallback.
 */
function rmTargetIsAllowed(cmd: string, allowPaths: string[]): boolean {
  if (allowPaths.length === 0) return false;
  const segments = cmd
    .split(/&&|\|\||[|;\n]/)
    .map((s) => s.trim())
    .filter((s) => /\brm\b/.test(s));
  if (segments.length === 0) return false;
  for (const seg of segments) {
    const tokens = parseArgvTokens(seg);
    const rmIdx = tokens.findIndex((t) => t === "rm");
    if (rmIdx < 0) continue;
    // Only validate recursive rm segments — non-recursive rm has no catastrophic-deletion risk
    const flagTokens = tokens.slice(rmIdx + 1).filter((t) => /^-[^-]/.test(t));
    const longFlagsInSeg = tokens.slice(rmIdx + 1).filter((t) => /^--/.test(t));
    if (!/r/i.test(flagTokens.join("")) && !longFlagsInSeg.some(f => /^--recursive$/i.test(f))) continue;
    const pathArgs = tokens.slice(rmIdx + 1).filter((t) => !t.startsWith("-"));
    for (const target of pathArgs) {
      const normalized = target.replace(/\/\*$/, "").replace(/\/+$/, "") || "/";
      const covered = allowPaths.some((p) => {
        const np = p.replace(/\/+$/, "") || "/";
        return normalized === np || normalized.startsWith(np + "/");
      });
      if (!covered) {
        // Fallback: check the raw segment for quoted paths that contain spaces
        // (parseArgvTokens splits on whitespace, so "/tmp/my dir" becomes two tokens)
        const segCovered = allowPaths.some((p) => {
          const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return new RegExp(`${escaped}(?:[/"'\\s/*]|$)`).test(seg);
        });
        if (!segCovered) return false;
      }
    }
  }
  return true;
}

function blockRmRf(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const cmd = getCommand(ctx);
  const hasDestructivePath = parseArgvTokens(cmd).some((token) => {
    const normalized = token.replace(/\/\*$/, "").replace(/\/+$/, "") || (token.startsWith("/") ? "/" : "");
    return normalized === "/" || normalized === "~" || /^\/[A-Za-z_][\w.-]*$/.test(normalized);
  });

  // Combined flags in one token: rm -rf /, rm -fr /
  if (hasDestructivePath && (
    /rm\s+-[^\s]*r[^\s]*f[^\s]*/.test(cmd) ||
    /rm\s+-[^\s]*f[^\s]*r[^\s]*/.test(cmd)
  )) {
    const allowPaths = ((ctx.params?.allowPaths ?? []) as string[]);
    if (rmTargetIsAllowed(cmd, allowPaths)) return allow();
    return deny("Catastrophic deletion blocked");
  }

  // Separated flags: rm -r -f /, rm -f -r /, rm -r -v -f /, etc.
  if (hasDestructivePath && /\brm\b/.test(cmd)) {
    const tokens = parseArgvTokens(cmd);
    const shortFlags = tokens.filter((t) => /^-[^-]/.test(t)).join("");
    const longFlags = tokens.filter((t) => /^--/.test(t));
    const hasRecursive = /r/i.test(shortFlags) || longFlags.some(f => /^--recursive$/i.test(f));
    const hasForce = /f/.test(shortFlags) || longFlags.some(f => /^--force$/i.test(f));
    if (hasRecursive && hasForce) {
      const allowPaths = ((ctx.params?.allowPaths ?? []) as string[]);
      if (rmTargetIsAllowed(cmd, allowPaths)) return allow();
      return deny("Catastrophic deletion blocked");
    }
  }
  // PowerShell: Remove-Item -Recurse -Force on root/drive
  if (/Remove-Item\s+.*-Recurse.*-Force.*(?:[A-Z]:\\(?:\s|$)|\\\*)/i.test(cmd)) {
    return deny("Catastrophic deletion blocked");
  }
  // cmd: rd /s /q or rmdir /s /q on drive root
  if (/(?:rd|rmdir)\s+\/s\s+\/q\s+[A-Z]:\\/i.test(cmd)) {
    return deny("Catastrophic deletion blocked");
  }
  return allow();
}

function blockForcePush(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const args = extractGitPushArgs(getCommand(ctx));
  if (args.some((a) => FORCE_PUSH_RE.test(a))) {
    return deny("Force-pushing is blocked");
  }
  return allow();
}

function blockSecretsWrite(ctx: PolicyContext): PolicyResult {
  if (ctx.toolName !== "Write") return allow();
  const filePath = getFilePath(ctx);
  if (SECRET_FILE_RE.test(filePath) || SECRET_FILE_ID_RSA_RE.test(filePath) || SECRET_FILE_CREDENTIALS_RE.test(filePath)) {
    return deny("Writing secret key files is blocked");
  }
  const additionalPatterns = ((ctx.params?.additionalPatterns ?? []) as string[]);
  for (const pattern of additionalPatterns) {
    if (filePath.includes(pattern)) {
      return deny(`Writing blocked file pattern: ${pattern}`);
    }
  }
  return allow();
}

/** Read-like commands that access file system contents. */
const READ_LIKE_CMDS =
  /(?:^|;|&&|\|\||\|)\s*(?:ls|find|cat|head|tail|less|more|wc|file|stat|tree|du)\s/;

/**
 * Extract absolute paths from a Bash command string.
 * Scans quoted strings only in the first pipeline segment (before the first
 * bare pipe) and only when the quoted content has no glob or regex metacharacters.
 * This catches `cat "/etc/passwd"` while avoiding false positives from grep
 * patterns and find glob patterns that appear in later pipeline stages.
 * Unquoted absolute paths are extracted from the whole command as before.
 */
function extractAbsolutePaths(command: string): string[] {
  const paths: string[] = [];
  const pathRe = /(?<![a-zA-Z0-9_.\-~\\])(?:~\/[^\s;|&"'()\[\]{}]*|~(?=\s|$|[;|&"'()\[\]{}])|\/[^\s;|&"'()\[\]{}]*)/g;

  function addPaths(s: string): void {
    pathRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pathRe.exec(s)) !== null) {
      let p = m[0];
      if (p === "~") p = homedir();
      else if (p.startsWith("~/")) p = join(homedir(), p.slice(2));
      paths.push(p);
    }
  }

  // Find the index of the first bare pipe (not inside quotes) to limit quoted extraction.
  let firstBarePipe = command.length;
  let inDouble = false, inSingle = false;
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === "|" && !inDouble && !inSingle) { firstBarePipe = i; break; }
  }

  // Extract paths from quoted strings in the FIRST pipeline segment only,
  // and only when the content has no glob/regex metacharacters.
  const firstSegment = command.slice(0, firstBarePipe);
  const quotedRe = /"([^"]*)"|'([^']*)'/g;
  let qm: RegExpExecArray | null;
  while ((qm = quotedRe.exec(firstSegment)) !== null) {
    const content = qm[1] ?? qm[2] ?? "";
    // Skip patterns that contain glob or common regex metacharacters
    if (/[*?\[\]^$+()\\]/.test(content)) continue;
    addPaths(content);
  }

  // Extract from unquoted portions of the whole command (existing behaviour).
  const stripped = command
    .replace(/"[^"]*"/g, (m) => " ".repeat(m.length))
    .replace(/'[^']*'/g, (m) => " ".repeat(m.length));
  addPaths(stripped);

  return paths;
}

function blockReadOutsideCwd(ctx: PolicyContext): PolicyResult {
  // Prefer $CLAUDE_PROJECT_DIR (stable project root) over ctx.session.cwd,
  // which tracks the live shell CWD and drifts when Claude `cd`s into a subdir.
  const cwd = process.env.CLAUDE_PROJECT_DIR || ctx.session?.cwd;
  if (!cwd) return allow(); // Can't enforce without cwd

  const allowPaths = ((ctx.params?.allowPaths ?? []) as string[]);

  // For Bash tool: check read-like commands for absolute paths outside cwd
  if (isBashTool(ctx.toolName)) {
    const cmd = getCommand(ctx);
    if (!READ_LIKE_CMDS.test(cmd)) return allow();

    const paths = extractAbsolutePaths(cmd);
    const cwdWithSep = cwd.endsWith("/") ? cwd : cwd + "/";
    for (const p of paths) {
      const resolved = resolve(cwd, p);
      if (isClaudeSettingsFile(resolved)) {
        return deny(`Reading Claude settings file blocked: ${resolved}`);
      }
      if (isClaudeInternalPath(resolved)) continue; // Whitelist ~/.claude/
      if (resolved === "/dev/null") continue; // Harmless special file
      if (resolved !== cwd && !resolved.startsWith(cwdWithSep)) {
        if (allowPaths.some((ap) => resolved === ap || resolved.startsWith(ap.endsWith("/") ? ap : ap + "/"))) continue;
        return deny(`Bash read outside project directory blocked: ${resolved}`);
      }
    }
    return allow();
  }

  // For Read/Glob/Grep: existing file_path / path check
  const filePath = getFilePath(ctx);
  const searchPath = (ctx.toolInput?.path as string) ?? "";

  const target = filePath || searchPath;
  if (!target) return allow();

  const resolved = resolve(cwd, target);

  // Block settings files in any .claude directory before whitelisting
  if (isClaudeSettingsFile(resolved)) {
    return deny(`Reading Claude settings file blocked: ${resolved}`);
  }

  // Whitelist ~/.claude/ — Claude Code's own config, plans, memory, and settings
  if (isClaudeInternalPath(resolved)) return allow();

  // Whitelist /dev/null — harmless special file commonly used in shell commands
  if (resolved === "/dev/null") return allow();

  const cwdWithSep = cwd.endsWith("/") ? cwd : cwd + "/";
  if (resolved !== cwd && !resolved.startsWith(cwdWithSep)) {
    if (allowPaths.some((ap) => resolved === ap || resolved.startsWith(ap.endsWith("/") ? ap : ap + "/"))) return allow();
    return deny(`Access outside project directory blocked: ${resolved}`);
  }
  return allow();
}

function blockWorkOnMain(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const cmd = getCommand(ctx);
  if (!GIT_COMMIT_MERGE_RE.test(cmd)) return allow();

  const cwd = ctx.session?.cwd;
  if (!cwd) return allow();

  const branch = getCurrentBranch(cwd);
  if (!branch) return allow();

  const protectedBranches = ((ctx.params?.protectedBranches ?? ["main", "master"]) as string[]);
  if (protectedBranches.includes(branch)) {
    return deny(
      `Git ${cmd.match(/git\s+(\S+)/)?.[1] ?? "operation"} on ${branch} is blocked. Create a feature branch first.`,
    );
  }
  return allow();
}

function blockFailproofaiCommands(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const cmd = getCommand(ctx);

  // Block direct failproofai CLI invocations
  if (FAILPROOFAI_CLI_RE.test(cmd)) {
    return deny("Running failproofai CLI commands is blocked");
  }

  // Block package-manager uninstallation of failproofai
  if (FAILPROOFAI_UNINSTALL_RE.test(cmd)) {
    return deny("Uninstalling failproofai is blocked");
  }

  return allow();
}

// Maximum size of the per-session tool-call sidecar before we stop updating it.
// If exceeded, repeated-call detection degrades gracefully (allows through) rather
// than growing the file unboundedly.
const TOOL_CALL_TRACKER_MAX_BYTES = 65_536; // 64 KB

async function warnRepeatedToolCalls(ctx: PolicyContext): Promise<PolicyResult> {
  const THRESHOLD = 3;
  const transcriptPath = ctx.session?.transcriptPath;
  if (!transcriptPath || !ctx.toolName || !ctx.toolInput) return allow();

  // Sidecar file tracks { fingerprint: count } — O(1) per call vs O(transcript) per call.
  const trackerPath = `${transcriptPath}.tool-calls.json`;
  const fingerprint = JSON.stringify({ tool: ctx.toolName, input: ctx.toolInput });

  let counts: Record<string, number> = {};
  try {
    const raw = await readFile(trackerPath, "utf8");
    counts = JSON.parse(raw) as Record<string, number>;
  } catch { /* first call or unreadable — start fresh */ }

  const prevCount = counts[fingerprint] ?? 0;
  if (prevCount >= THRESHOLD) {
    return instruct(
      `STOP: You have already called ${ctx.toolName} ${prevCount} times with identical parameters. This is wasteful and unproductive. Do NOT repeat this call — use a different approach or ask the user for clarification.`,
    );
  }

  counts[fingerprint] = prevCount + 1;
  try {
    const serialized = JSON.stringify(counts);
    if (serialized.length <= TOOL_CALL_TRACKER_MAX_BYTES) {
      await writeFile(trackerPath, serialized, "utf8");
    }
  } catch { /* non-fatal */ }

  return allow();
}

function warnGitAmend(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const cmd = getCommand(ctx);
  if (GIT_AMEND_RE.test(cmd)) {
    return instruct(
      "STOP: This command amends the last commit, which rewrites git history. If this commit has already been pushed to a shared branch, this will cause divergence for other contributors. Confirm with the user before executing.",
    );
  }
  return allow();
}

function warnGitStashDrop(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const cmd = getCommand(ctx);
  if (GIT_STASH_DROP_RE.test(cmd)) {
    return instruct(
      "STOP: This command permanently deletes stashed changes (git stash drop/clear). Stash entries cannot be recovered after deletion. Confirm with the user before executing.",
    );
  }
  return allow();
}

function warnAllFilesStaged(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const cmd = getCommand(ctx);
  if (GIT_ADD_ALL_RE.test(cmd)) {
    return instruct(
      "STOP: This command stages all files in the working tree (git add -A / --all / .). This may inadvertently include build artifacts, generated files, or sensitive files not covered by .gitignore. Confirm with the user before executing.",
    );
  }
  return allow();
}

function warnSchemaAlteration(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const cmd = getCommand(ctx);
  if (!SQL_TOOL_RE.test(cmd)) return allow();
  if (SCHEMA_ALTER_RE.test(cmd)) {
    return instruct(
      "STOP: This command contains a schema-altering SQL statement (ALTER TABLE with column or rename operation). Schema changes on production databases are irreversible or disruptive. Confirm with the user before executing.",
    );
  }
  return allow();
}

function warnGlobalPackageInstall(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const cmd = getCommand(ctx);
  const isGlobal =
    NPM_GLOBAL_RE.test(cmd) ||
    YARN_GLOBAL_RE.test(cmd) ||
    PNPM_GLOBAL_RE.test(cmd) ||
    BUN_GLOBAL_RE.test(cmd) ||
    CARGO_INSTALL_RE.test(cmd) ||
    // Bare 'pip install' respects the active venv when one is present;
    // only flag explicit system-level flags (--user, --break-system-packages).
    PIP_SYSTEM_RE.test(cmd);
  if (isGlobal) {
    return instruct(
      "STOP: This command installs a package globally, which modifies the system-wide environment outside the project. This can conflict with other projects or system tools. Confirm with the user before executing.",
    );
  }
  return allow();
}

// Split a compound shell command into independent segments.
const SEGMENT_SPLIT_RE = /\s*(?:&&|\|\||\||;)\s*/;

function preferPackageManager(ctx: PolicyContext): PolicyResult {
  if (ctx.toolName !== "Bash") return allow();
  const cmd = getCommand(ctx);
  if (!cmd) return allow();

  const allowed = (ctx.params?.allowed ?? []) as string[];
  if (allowed.length === 0) return allow();

  const allowedSet = new Set(allowed.map((a) => a.toLowerCase()));
  const blocked = (ctx.params?.blocked ?? []) as string[];
  const allowedList = allowed.join(", ");

  // Evaluate each shell segment independently so that
  // "uv --version && pip install flask" correctly denies the pip segment.
  const segments = cmd.split(SEGMENT_SPLIT_RE);

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    // Check if this segment uses an allowed manager — if so, skip it.
    let segmentAllowed = false;
    for (const manager of allowedSet) {
      const patterns = PKG_MANAGER_DETECTORS[manager];
      if (!patterns) continue;
      for (const pattern of patterns) {
        if (pattern.test(trimmed)) { segmentAllowed = true; break; }
      }
      if (segmentAllowed) break;
    }
    if (segmentAllowed) continue;

    // Check if this segment uses a non-allowed builtin manager.
    for (const [manager, patterns] of Object.entries(PKG_MANAGER_DETECTORS)) {
      if (allowedSet.has(manager)) continue;
      for (const pattern of patterns) {
        if (pattern.test(trimmed)) {
          return deny(
            `"${manager}" is not an allowed package manager. ` +
              `Allowed package managers for this project: ${allowedList}. ` +
              `Rewrite this command using an allowed package manager.`,
          );
        }
      }
    }

    // Check user-specified blocked managers.
    for (const name of blocked) {
      const lower = name.toLowerCase();
      if (allowedSet.has(lower)) continue;
      const re = new RegExp(`\\b${lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (re.test(trimmed)) {
        return deny(
          `"${lower}" is not an allowed package manager. ` +
            `Allowed package managers for this project: ${allowedList}. ` +
            `Rewrite this command using an allowed package manager.`,
        );
      }
    }
  }

  return allow();
}

function warnBackgroundProcess(ctx: PolicyContext): PolicyResult {
  if (!isBashTool(ctx.toolName)) return allow();
  const cmd = getCommand(ctx);
  const isBackground =
    NOHUP_RE.test(cmd) ||
    SCREEN_DETACH_RE.test(cmd) ||
    TMUX_DETACH_RE.test(cmd) ||
    DISOWN_RE.test(cmd) ||
    BACKGROUND_AMPERSAND_RE.test(cmd);
  if (isBackground) {
    return instruct(
      "STOP: This command starts a background or detached process (nohup, screen -d, tmux -d, or trailing &). Background processes persist after Claude's session and may be difficult to track or stop. Confirm with the user before executing.",
    );
  }
  return allow();
}

// -- Workflow (Stop event) policies --

function requireCommitBeforeStop(ctx: PolicyContext): PolicyResult {
  const cwd = ctx.session?.cwd;
  if (!cwd) return allow("No working directory available, skipping commit check.");

  try {
    const status = execSync("git status --porcelain", {
      cwd,
      encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
      timeout: 5000,
    }).trim();

    if (status.length > 0) {
      return deny(
        "You have uncommitted changes in the working directory. Commit all changes now.",
      );
    }
    return allow("All changes are committed.");
  } catch {
    return allow("Not a git repository, skipping commit check.");
  }
}

function requirePushBeforeStop(ctx: PolicyContext): PolicyResult {
  const cwd = ctx.session?.cwd;
  if (!cwd) return allow("No working directory available, skipping push check.");

  try {
    const remotes = execSync("git remote", {
      cwd,
      encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
      timeout: 3000,
    }).trim();

    if (!remotes) return allow("No git remote configured, skipping push check.");

    const remote = (ctx.params?.remote as string) ?? "origin";

    const branch = getCurrentBranch(cwd);
    if (!branch || branch === "HEAD") return allow("Detached HEAD, skipping push check.");

    const baseBranch = (ctx.params?.baseBranch as string) ?? "main";

    // If on the base branch itself, no push of a feature branch is needed
    if (branch === baseBranch) {
      return allow(`On base branch "${baseBranch}", skipping push check.`);
    }

    // Check if branch has diverged from base in any meaningful way
    try {
      const ahead = execFileSync(
        "git",
        ["log", `${remote}/${baseBranch}..HEAD`, "--oneline"],
        { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 5000 },
      ).trim();

      if (!ahead) {
        // No commits ahead — branch is fully merged (regular merge / fast-forward)
        return allow(`No commits ahead of ${remote}/${baseBranch}, skipping push check.`);
      }

      // Commits exist but might be from a squash-merged PR.
      // Check actual file diff — if trees are identical, work is already in base.
      const diff = execFileSync(
        "git",
        ["diff", "--stat", `${remote}/${baseBranch}`, "HEAD"],
        { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 5000 },
      ).trim();

      if (!diff) {
        return allow(`No file changes compared to ${remote}/${baseBranch}, skipping push check.`);
      }
    } catch {
      // remote/{baseBranch} ref missing — fall through to existing push checks
    }

    // Check if remote tracking branch exists
    let hasTracking = false;
    try {
      execFileSync("git", ["rev-parse", "--verify", `${remote}/${branch}`], {
        cwd,
        encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
        timeout: 3000,
      });
      hasTracking = true;
    } catch {
      // Remote tracking branch does not exist
    }

    if (!hasTracking) {
      return deny(
        `Branch "${branch}" has not been pushed to remote "${remote}". ` +
        `Run now: git push -u ${remote} ${branch}`,
      );
    }

    // Check for unpushed commits
    const unpushed = execFileSync("git", ["log", `${remote}/${branch}..HEAD`, "--oneline"], {
      cwd,
      encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
      timeout: 5000,
    }).trim();

    if (unpushed.length > 0) {
      const commitCount = unpushed.split("\n").length;
      return deny(
        `You have ${commitCount} unpushed commit${commitCount > 1 ? "s" : ""} on branch "${branch}". ` +
        `Run now: git push`,
      );
    }

    return allow(`All commits pushed to "${remote}".`);
  } catch {
    return allow("Could not check push status, skipping.");
  }
}

function requirePrBeforeStop(ctx: PolicyContext): PolicyResult {
  const cwd = ctx.session?.cwd;
  if (!cwd) return allow("No working directory available, skipping PR check.");

  try {
    // Check if gh CLI is available
    try {
      execSync("gh --version", { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 3000 });
    } catch {
      return allow("GitHub CLI (gh) not installed, skipping PR check.");
    }

    const branch = getCurrentBranch(cwd);
    if (!branch || branch === "HEAD") return allow("Detached HEAD, skipping PR check.");

    const baseBranch = (ctx.params?.baseBranch as string) ?? "main";

    // If on the base branch itself, no PR is needed
    if (branch === baseBranch) {
      return allow(`On base branch "${baseBranch}", skipping PR check.`);
    }

    // Check if branch has diverged from base in any meaningful way
    try {
      const ahead = execFileSync(
        "git",
        ["log", `origin/${baseBranch}..HEAD`, "--oneline"],
        { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 5000 },
      ).trim();

      if (!ahead) {
        // No commits ahead — branch is fully merged (regular merge / fast-forward)
        return allow(`No commits ahead of origin/${baseBranch}, skipping PR check.`);
      }

      // Commits exist but might be from a squash-merged PR.
      // Check actual file diff — if trees are identical, work is already in main.
      const diff = execFileSync(
        "git",
        ["diff", "--stat", `origin/${baseBranch}`, "HEAD"],
        { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 5000 },
      ).trim();

      if (!diff) {
        return allow(`No file changes compared to origin/${baseBranch}, skipping PR check.`);
      }
    } catch {
      // origin/{baseBranch} ref missing or git error — fall through to gh pr view
    }

    // Check if a PR exists for this branch
    let prJson: string;
    try {
      prJson = execSync("gh pr view --json number,url,state", {
        cwd,
        encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
        timeout: 15000,
      }).trim();
    } catch {
      // gh pr view exits non-zero when no PR exists
      return deny(
        `No pull request found for branch "${branch}". ` +
        `Run now: gh pr create`,
      );
    }

    const pr = JSON.parse(prJson) as { number: number; url: string; state: string };

    if (pr.state === "OPEN") {
      return allow(`PR #${pr.number} exists: ${pr.url}`);
    }

    // PR is merged/closed. The earlier origin/{baseBranch} checks may have
    // used a stale ref. Fetch and re-verify before denying.
    if (pr.state === "MERGED") {
      try {
        execFileSync("git", ["fetch", "origin", `+refs/heads/${baseBranch}:refs/remotes/origin/${baseBranch}`], {
          cwd,
          encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
          timeout: 10000,
        });
        const freshAhead = execFileSync(
          "git",
          ["log", `origin/${baseBranch}..HEAD`, "--oneline"],
          { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 5000 },
        ).trim();
        if (!freshAhead) {
          return allow(`PR #${pr.number} was merged; branch is up to date with ${baseBranch}.`);
        }
        const freshDiff = execFileSync(
          "git",
          ["diff", "--stat", `origin/${baseBranch}`, "HEAD"],
          { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 5000 },
        ).trim();
        if (!freshDiff) {
          return allow(`PR #${pr.number} was merged; no file changes vs ${baseBranch}.`);
        }
      } catch {
        // Fetch or git command failed — fall through to deny
      }
    }

    return deny(
      `Pull request for branch "${branch}" is ${pr.state.toLowerCase()}. Run now: gh pr create`,
    );
  } catch {
    return allow("Could not check PR status, skipping.");
  }
}

function requireCiGreenBeforeStop(ctx: PolicyContext): PolicyResult {
  const cwd = ctx.session?.cwd;
  if (!cwd) return allow("No working directory available, skipping CI check.");

  try {
    // Check if gh CLI is available
    try {
      execSync("gh --version", { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 3000 });
    } catch {
      return allow("GitHub CLI (gh) not installed, skipping CI check.");
    }

    const branch = getCurrentBranch(cwd);
    if (!branch || branch === "HEAD") return allow("Detached HEAD, skipping CI check.");

    // 1. GitHub Actions workflow runs
    let workflowRuns: CiCheck[] = [];
    try {
      const runsJson = execFileSync(
        "gh",
        ["run", "list", "--branch", branch, "--limit", "5", "--json", "status,conclusion,name"],
        { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 15000 },
      ).trim();

      if (runsJson && runsJson !== "[]") {
        workflowRuns = JSON.parse(runsJson) as CiCheck[];
      }
    } catch {
      // fail-open for workflow runs; continue to check third-party checks
    }

    // 2. Third-party check runs (CodeRabbit, SonarCloud, Codecov, etc.)
    let thirdPartyChecks: CiCheck[] = [];
    let commitStatuses: CiCheck[] = [];
    const sha = getHeadSha(cwd);
    if (sha) {
      thirdPartyChecks = getThirdPartyCheckRuns(cwd, sha);
      commitStatuses = getCommitStatuses(cwd, sha);
    }

    // 3. Merge all checks
    const allChecks = [...workflowRuns, ...thirdPartyChecks, ...commitStatuses];

    if (allChecks.length === 0) return allow(`No CI runs found for branch "${branch}".`);

    const failing = allChecks.filter(
      (r) =>
        r.status === "completed" &&
        r.conclusion !== "success" &&
        r.conclusion !== "skipped" &&
        r.conclusion !== "cancelled",
    );
    if (failing.length > 0) {
      const names = failing.map((r) => `"${r.name}"`).join(", ");
      return deny(
        `CI checks are failing on branch "${branch}": ${names}. Fix the failing checks now.`,
      );
    }

    const pending = allChecks.filter(
      (r) => r.status === "in_progress" || r.status === "queued" || r.status === "waiting",
    );
    if (pending.length > 0) {
      const names = pending.map((r) => `"${r.name}"`).join(", ");
      return deny(
        `CI checks are still running on branch "${branch}": ${names}. Wait for all checks to complete, then verify they pass.`,
      );
    }

    return allow(`All CI checks passed on branch "${branch}".`);
  } catch {
    return allow("Could not check CI status, skipping.");
  }
}

// -- Registry --

export const BUILTIN_POLICIES: BuiltinPolicyDefinition[] = [
  {
    name: "sanitize-jwt",
    description: "Stop Claude from reading JWTs in tool responses",
    fn: sanitizeJwt,
    match: { events: ["PostToolUse"] },
    defaultEnabled: true,
    category: "Sanitize",
  },
  {
    name: "sanitize-api-keys",
    description: "Stop Claude from reading API keys (OpenAI, Anthropic, GitHub, AWS, Stripe, Google) in tool responses",
    fn: sanitizeApiKeys,
    match: { events: ["PostToolUse"] },
    defaultEnabled: true,
    category: "Sanitize",
    params: {
      additionalPatterns: {
        type: "pattern[]",
        description: "Additional API key patterns to scrub, each with { regex, label }",
        default: [],
      },
    } satisfies PolicyParamsSchema,
  },
  {
    name: "sanitize-connection-strings",
    description: "Stop Claude from reading database connection strings with embedded credentials in tool responses",
    fn: sanitizeConnectionStrings,
    match: { events: ["PostToolUse"] },
    defaultEnabled: true,
    category: "Sanitize",
  },
  {
    name: "sanitize-private-key-content",
    description: "Stop Claude from reading PEM private key content in tool responses",
    fn: sanitizePrivateKeyContent,
    match: { events: ["PostToolUse"] },
    defaultEnabled: true,
    category: "Sanitize",
  },
  {
    name: "sanitize-bearer-tokens",
    description: "Stop Claude from reading Authorization Bearer tokens in tool responses",
    fn: sanitizeBearerTokens,
    match: { events: ["PostToolUse"] },
    defaultEnabled: true,
    category: "Sanitize",
  },
  {
    name: "protect-env-vars",
    description: "Prevent commands that read environment variables",
    fn: protectEnvVars,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: true,
    category: "Environment",
  },
  {
    name: "block-env-files",
    description: "Block reading/writing .env files",
    fn: blockEnvFiles,
    match: { events: ["PreToolUse"] },
    defaultEnabled: true,
    category: "Environment",
  },
  {
    name: "block-read-outside-cwd",
    description: "Block file reads outside the session working directory",
    fn: blockReadOutsideCwd,
    match: { events: ["PreToolUse"], toolNames: ["Read", "Glob", "Grep", "Bash", "run_terminal_command", "Terminal", "Shell", "bash", "ReadFile"] },
    defaultEnabled: false,
    category: "Environment",
    params: {
      allowPaths: {
        type: "string[]",
        description: "Absolute paths outside cwd that are allowed to be read",
        default: [],
      },
    } satisfies PolicyParamsSchema,
  },
  {
    name: "block-sudo",
    description: "Block sudo commands",
    fn: blockSudo,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal", "Shell", "bash", "bash_login_shell"] },
    defaultEnabled: true,
    category: "Dangerous Commands",
    params: {
      allowPatterns: {
        type: "string[]",
        description: "Sudo command patterns to allow, matched token-by-token (e.g. 'sudo systemctl status')",
        default: [],
      },
    } satisfies PolicyParamsSchema,
  },
  {
    name: "block-curl-pipe-sh",
    description: "Block piping downloads to shell",
    fn: blockCurlPipeSh,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: true,
    category: "Dangerous Commands",
  },
  {
    name: "block-rm-rf",
    description: "Prevent catastrophic deletions",
    fn: blockRmRf,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: false,
    category: "Dangerous Commands",
    params: {
      allowPaths: {
        type: "string[]",
        description: "Paths that are allowed to be recursively deleted",
        default: [],
      },
    } satisfies PolicyParamsSchema,
  },
  {
    name: "block-failproofai-commands",
    description: "Block failproofai CLI commands and uninstallation",
    fn: blockFailproofaiCommands,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: true,
    category: "Dangerous Commands",
  },
  {
    name: "block-secrets-write",
    description: "Block writing secret key files",
    fn: blockSecretsWrite,
    match: { events: ["PreToolUse"], toolNames: ["Write"] },
    defaultEnabled: false,
    category: "Dangerous Commands",
    params: {
      additionalPatterns: {
        type: "string[]",
        description: "Additional filename patterns (substrings) to block",
        default: [],
      },
    } satisfies PolicyParamsSchema,
  },
  {
    name: "block-push-master",
    description: "Block pushing to main/master",
    fn: blockPushMaster,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: true,
    category: "Git",
    params: {
      protectedBranches: {
        type: "string[]",
        description: "Branch names to protect from direct pushes",
        default: ["main", "master"],
      },
    } satisfies PolicyParamsSchema,
  },
  {
    name: "block-force-push",
    description: "Prevent force-pushing to any branch",
    fn: blockForcePush,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: false,
    category: "Git",
  },
  {
    name: "block-work-on-main",
    description: "Block git commits and merges on main/master branch",
    fn: blockWorkOnMain,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: false,
    category: "Git",
    params: {
      protectedBranches: {
        type: "string[]",
        description: "Branch names where commits/merges are blocked",
        default: ["main", "master"],
      },
    } satisfies PolicyParamsSchema,
  },
  {
    name: "warn-git-amend",
    description: "Warns before amending git commits, which rewrites history",
    fn: warnGitAmend,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: false,
    category: "Git",
  },
  {
    name: "warn-git-stash-drop",
    description: "Warns before permanently deleting stashed changes",
    fn: warnGitStashDrop,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: false,
    category: "Git",
  },
  {
    name: "warn-all-files-staged",
    description: "Warns before staging all working tree files with git add -A / . / --all",
    fn: warnAllFilesStaged,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: false,
    category: "Git",
  },
  {
    name: "warn-destructive-sql",
    description: "Warn before executing destructive SQL (DROP/TRUNCATE/DELETE without WHERE) via database clients",
    fn: warnDestructiveSql,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: false,
    category: "Database",
  },
  {
    name: "warn-schema-alteration",
    description: "Warns before SQL schema changes (ALTER TABLE with column or rename operations)",
    fn: warnSchemaAlteration,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: false,
    category: "Database",
  },
  {
    name: "warn-package-publish",
    description: "Warn before publishing packages to public registries (npm, PyPI, crates.io, RubyGems, etc.)",
    fn: warnPackagePublish,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: false,
    category: "Packages & System",
  },
  {
    name: "warn-global-package-install",
    description: "Warns before installing packages globally (npm -g, cargo install, etc.)",
    fn: warnGlobalPackageInstall,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: false,
    category: "Packages & System",
  },
  {
    name: "prefer-package-manager",
    description: "Blocks non-preferred package managers and tells Claude to use an allowed one (e.g., uv instead of pip)",
    fn: preferPackageManager,
    match: { events: ["PreToolUse"], toolNames: ["Bash"] },
    defaultEnabled: false,
    category: "Packages & System",
    params: {
      allowed: {
        type: "string[]",
        description: "Allowed package manager names (e.g. ['uv', 'bun']). Any detected manager not in this list is blocked.",
        default: [],
      },
      blocked: {
        type: "string[]",
        description: "Additional manager names to block beyond the built-in list (e.g. ['pdm', 'pipx']).",
        default: [],
      },
    } satisfies PolicyParamsSchema,
  },
  {
    name: "warn-large-file-write",
    description: "Warn before writing files larger than 1MB (configurable via thresholdKb param)",
    fn: warnLargeFileWrite,
    match: { events: ["PreToolUse"], toolNames: ["Write"] },
    defaultEnabled: false,
    category: "Packages & System",
    params: {
      thresholdKb: {
        type: "number",
        description: "File size threshold in KB above which a warning is issued",
        default: 1024,
      },
    } satisfies PolicyParamsSchema,
  },
  {
    name: "warn-background-process",
    description: "Warns before starting detached or background processes",
    fn: warnBackgroundProcess,
    match: { events: ["PreToolUse"], toolNames: ["Bash", "run_terminal_command", "Terminal"] },
    defaultEnabled: false,
    category: "Packages & System",
  },
  {
    name: "warn-repeated-tool-calls",
    description: "Warn when the same tool is called 3+ times with identical parameters",
    fn: warnRepeatedToolCalls,
    match: { events: ["PreToolUse"] },
    defaultEnabled: false,
    category: "AI Behavior",
  },
  {
    name: "require-commit-before-stop",
    description: "Require all changes to be committed before Claude stops",
    fn: requireCommitBeforeStop,
    match: { events: ["Stop"] },
    defaultEnabled: false,
    category: "Workflow",
  },
  {
    name: "require-push-before-stop",
    description: "Require all commits to be pushed to remote before Claude stops",
    fn: requirePushBeforeStop,
    match: { events: ["Stop"] },
    defaultEnabled: false,
    category: "Workflow",
    params: {
      remote: {
        type: "string",
        description: "Remote name to push to (default: origin)",
        default: "origin",
      },
      baseBranch: {
        type: "string",
        description: "Base branch to compare against (default: main)",
        default: "main",
      },
    } satisfies PolicyParamsSchema,
  },
  {
    name: "require-pr-before-stop",
    description: "Require a pull request to exist for the current branch before Claude stops",
    fn: requirePrBeforeStop,
    match: { events: ["Stop"] },
    defaultEnabled: false,
    category: "Workflow",
    params: {
      baseBranch: {
        type: "string",
        description: "Base branch to compare against (default: main)",
        default: "main",
      },
    } satisfies PolicyParamsSchema,
  },
  {
    name: "require-ci-green-before-stop",
    description: "Require CI checks to pass on the current branch before Claude stops",
    fn: requireCiGreenBeforeStop,
    match: { events: ["Stop"] },
    defaultEnabled: false,
    category: "Workflow",
  },
];

export function registerBuiltinPolicies(enabledNames: string[]): void {
  const enabledSet = new Set(enabledNames);
  for (const policy of BUILTIN_POLICIES) {
    if (enabledSet.has(policy.name)) {
      registerPolicy(policy.name, policy.description, policy.fn, policy.match);
    }
  }

  // Diagnostic policy to verify prompt capture for multi-agent support
  registerPolicy(
    "debug-prompt",
    "Diagnostic policy to verify prompt capture",
    async (ctx) => ({
      decision: "allow",
      reason: `Prompt captured from ${ctx.session?.integration ?? "unknown"}`,
    }),
    { events: ["UserPromptSubmit"] },
    100,
  );
}

/** Clears the git branch cache. Exposed for test isolation only. */
export function clearGitBranchCache(): void {
  gitBranchCache.clear();
}
